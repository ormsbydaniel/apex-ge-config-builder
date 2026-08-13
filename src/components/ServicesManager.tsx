
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, Loader2, Globe, Server, Database, Download, Upload, Pencil, RefreshCw, AlertTriangle, X, Check, FolderOpen } from 'lucide-react';
import { Service, DataSourceFormat, SourceConfigType } from '@/types/config';
import { FORMAT_CONFIGS, S3_CONFIG, STAC_CONFIG, JSON_UPLOAD_CONFIG } from '@/constants/formats';
import { useServices } from '@/hooks/useServices';
import { useBulkServiceValidation, ServiceKind } from '@/hooks/useBulkServiceValidation';
import { parseS3Url } from '@/utils/s3Utils';
import { validateSingleService, ProbeKind } from '@/utils/serviceProbes';
import { parseGetCapabilitiesTitle } from '@/utils/getCapabilitiesTitle';

// Mirror of classify() in useBulkServiceValidation — keep in sync.
const classifyService = (svc: Service): ServiceKind | null => {
  if (!svc.url) return null;
  if (svc.format === 'stac' || svc.sourceType === 'stac') return 'stac';
  if (svc.format === 's3' || svc.sourceType === 's3') return 's3';
  if (svc.format === 'catalogue' || svc.sourceType === 'catalogue') return 'catalogue';
  if (parseS3Url(svc.url) !== null) return 's3';
  if (svc.format === 'wms' || svc.format === 'wmts' || svc.format === 'wfs') return 'ogc';
  return null;
};

import { fetchRecommendedServices, fetchRecommendedCatalogues } from '@/utils/recommendedBaseLayers';
import { toast } from '@/hooks/use-toast';
import { ServiceUploadConfirmDialog } from '@/components/ServiceUploadConfirmDialog';
import { detectServiceTypeFromFile, DetectionResult, DetectedServiceType } from '@/utils/serviceFileParser';
import RecommendedServicesModal from '@/components/RecommendedServicesModal';

interface ServicesManagerProps {
  services: Service[];
  onAddService: (service: Service) => void;
  onRemoveService: (index: number) => void;
  onUpdateService?: (id: string, patch: Partial<Service>) => void;
  isActive?: boolean;
}

const ServicesManager = ({ services, onAddService, onRemoveService, onUpdateService, isActive = true }: ServicesManagerProps) => {
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceUrl, setNewServiceUrl] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<SourceConfigType | 'json-upload'>('wms');
  const [showAddForm, setShowAddForm] = useState(false);
  const [autoNameLoading, setAutoNameLoading] = useState(false);
  const [isLoadingRecommended, setIsLoadingRecommended] = useState(false);
  const [showRecommendedModal, setShowRecommendedModal] = useState(false);
  const [recommendedServicesList, setRecommendedServicesList] = useState<Service[]>([]);
  const [isAddingSelected, setIsAddingSelected] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [pendingRecheck, setPendingRecheck] = useState(false);
  const [runSummary, setRunSummary] = useState<Record<ServiceKind, { total: number } | null> | null>(null);
  const [dismissed, setDismissed] = useState(true);
  const [validateState, setValidateState] = useState<
    | { status: 'idle' }
    | { status: 'checking' }
    | { status: 'ok'; message: string }
    | { status: 'error'; message: string; diagnostic?: import('@/utils/serviceDiagnostics').ProbeDiagnostic }
  >({ status: 'idle' });

  const { addService, isLoadingCapabilities } = useServices(services, onAddService);
  const { statuses: validationStatuses, warnings: validationWarnings, errors: validationErrors, progress, inFlightTotal, recheck } = useBulkServiceValidation(services, isActive);

  // Tracks the URL+format signature of the most recent successful/failed probe
  // so a click on Save can skip re-probing if nothing has changed since.
  const lastValidatedSigRef = React.useRef<{ url: string; format: string } | null>(null);

  // Resolve the probe kind + optional OGC sub-format from the modal's selected format.
  const getProbeKind = (
    fmt: SourceConfigType | 'json-upload',
  ): { kind: ProbeKind; ogcFormat?: DataSourceFormat } | null => {
    if (fmt === 'json-upload') return null;
    if (fmt === 'stac') return { kind: 'stac' };
    if (fmt === 's3') return { kind: 's3' };
    return { kind: 'ogc', ogcFormat: fmt as DataSourceFormat };
  };

  // After adding recommended services, defer recheck() until services state has updated
  // so the hook's closure sees the newly added items.
  useEffect(() => {
    if (!pendingRecheck) return;
    recheck();
    setPendingRecheck(false);
  }, [pendingRecheck, services.length, recheck]);

  // Single-service deferred recheck. We can't call recheck(id) right after
  // onAddService / onUpdateService because the bulk hook's `services` closure
  // won't include the new/updated state until React re-renders. We wait for
  // the id to appear in `services` (and, for edits, until the URL matches the
  // patched value) before triggering the probe.
  const [pendingRecheckId, setPendingRecheckId] = useState<{ id: string; url: string } | null>(null);
  useEffect(() => {
    if (!pendingRecheckId) return;
    const svc = services.find(s => s.id === pendingRecheckId.id);
    if (!svc) return;
    if (svc.url !== pendingRecheckId.url) return;
    recheck(pendingRecheckId.id);
    setPendingRecheckId(null);
  }, [pendingRecheckId, services, recheck]);

  // Detect the start of a validation run: snapshot per-group totals so the
  // summary panel can persist after inFlight drops back to 0.
  const prevInFlightRef = React.useRef(0);
  useEffect(() => {
    if (prevInFlightRef.current === 0 && inFlightTotal > 0) {
      setRunSummary({
        stac: progress.stac.total > 0 ? { total: progress.stac.total } : null,
        ogc: progress.ogc.total > 0 ? { total: progress.ogc.total } : null,
        s3: progress.s3.total > 0 ? { total: progress.s3.total } : null,
        catalogue: progress.catalogue.total > 0 ? { total: progress.catalogue.total } : null,
      });
      setDismissed(false);
    } else if (inFlightTotal > 0) {
      // Keep totals in sync as the hook seeds groups mid-run.
      setRunSummary(prev => ({
        stac: progress.stac.total > 0 ? { total: progress.stac.total } : prev?.stac ?? null,
        ogc: progress.ogc.total > 0 ? { total: progress.ogc.total } : prev?.ogc ?? null,
        s3: progress.s3.total > 0 ? { total: progress.s3.total } : prev?.s3 ?? null,
        catalogue: progress.catalogue.total > 0 ? { total: progress.catalogue.total } : prev?.catalogue ?? null,
      }));
    }
    prevInFlightRef.current = inFlightTotal;
  }, [inFlightTotal, progress.stac.total, progress.ogc.total, progress.s3.total, progress.catalogue.total]);

  // Derive failed/warning counts at render time from validationStatuses, grouped by kind.
  const failedByKind: Record<ServiceKind, number> = { stac: 0, ogc: 0, s3: 0, catalogue: 0 };
  const warningByKind: Record<ServiceKind, number> = { stac: 0, ogc: 0, s3: 0, catalogue: 0 };

  for (const svc of services) {
    const kind = classifyService(svc);
    if (!kind) continue;
    if (validationStatuses[svc.id] === 'error') failedByKind[kind]++;
    else if (validationStatuses[svc.id] === 'warning') warningByKind[kind]++;
  }

  const summaryHasAny = !!runSummary &&
    ((runSummary.stac?.total ?? 0) + (runSummary.ogc?.total ?? 0) + (runSummary.s3?.total ?? 0) + (runSummary.catalogue?.total ?? 0) > 0);

  const showSummaryPanel = !dismissed && summaryHasAny;

  // Auto-populate service name after user pauses typing URL (STAC + WMS/WMTS/WFS)
  useEffect(() => {
    const url = newServiceUrl.trim();
    if (!url) return;
    if (
      selectedFormat !== 'stac' &&
      selectedFormat !== 'wms' &&
      selectedFormat !== 'wmts' &&
      selectedFormat !== 'wfs'
    ) {
      return;
    }
    const controller = new AbortController();
    const handle = setTimeout(async () => {
      try {
        setAutoNameLoading(true);
        if (selectedFormat === 'stac') {
          const res = await fetch(url, { signal: controller.signal });
          if (!res.ok) return;
          const json = await res.json();
          const title = json.title || json.id;
          if (title && !newServiceName.trim()) {
            setNewServiceName(title);
          }
        } else {
          const title = await parseGetCapabilitiesTitle(
            url,
            selectedFormat as 'wms' | 'wmts' | 'wfs',
            controller.signal
          );
          if (title && !newServiceName.trim()) {
            setNewServiceName(title);
          }
        }
      } catch (_) {
        // ignore typing cancellations/errors
      } finally {
        setAutoNameLoading(false);
      }
    }, 600);
    return () => {
      controller.abort();
      clearTimeout(handle);
    };
  }, [newServiceUrl, selectedFormat]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadedFile(file);
    
    try {
      // Determine file type from extension
      const fileExt = file.name.toLowerCase().split('.').pop();
      const fileType = fileExt === 'xml' ? 'xml' : 'json';
      
      // Read file content
      const text = await file.text();
      
      // Auto-detect service type based on file type and content
      const result = detectServiceTypeFromFile(text, file.name, fileType);
      setDetectionResult(result);
      
      // Show confirmation dialog
      setShowConfirmDialog(true);
    } catch (error) {
      toast({
        title: "Invalid File",
        description: error instanceof Error ? error.message : "Failed to parse file",
        variant: "destructive"
      });
      setUploadedFile(null);
    }
  };

  const handleConfirmUpload = (serviceName: string, serviceType: DetectedServiceType) => {
    if (!detectionResult?.capabilities || !uploadedFile) return;
    
    // Extract proper URL for S3 services
    let serviceUrl = `file://${uploadedFile.name}`;
    if (serviceType === 's3' && detectionResult.rawData) {
      // Extract bucket name from S3 XML/JSON data
      const bucketName = detectionResult.rawData.Name || 
                        detectionResult.rawData.name ||
                        detectionResult.rawData.ListBucketResult?.Name;
      
      if (bucketName) {
        // Construct proper S3 URL (default to us-east-1 region)
        serviceUrl = `https://${bucketName}.s3.amazonaws.com`;
      }
    }
    
    // Create service with detected capabilities
    const service: Service = {
      id: `${serviceType}-service-${Date.now()}`,
      name: serviceName,
      url: serviceUrl,
      format: serviceType === 'stac' ? 'stac' : serviceType === 's3' ? 's3' : undefined,
      sourceType: serviceType === 'stac' ? 'stac' : serviceType === 's3' ? 's3' : 'service',
      capabilities: detectionResult.capabilities
    };
    
    onAddService(service);
    
    // Reset form
    setShowConfirmDialog(false);
    setUploadedFile(null);
    setDetectionResult(null);
    setNewServiceName('');
    setNewServiceUrl('');
    setShowAddForm(false);
    
    toast({
      title: "Service Added from File",
      description: `${serviceName} added with ${detectionResult.capabilities.layers.length} items`,
    });
  };

  const handleCancelUpload = () => {
    setShowConfirmDialog(false);
    setUploadedFile(null);
    setDetectionResult(null);
  };

  const handleAddService = async () => {
    if (selectedFormat === 'json-upload') {
      // File upload is handled separately
      return;
    }

    if (!newServiceUrl.trim()) return;

    // Auto-validate before commit. Reuse the last result if URL+format are unchanged.
    const url = newServiceUrl.trim();
    const probe = getProbeKind(selectedFormat);
    if (probe) {
      const sig = lastValidatedSigRef.current;
      const isFresh =
        sig &&
        sig.url === url &&
        sig.format === selectedFormat &&
        (validateState.status === 'ok' || validateState.status === 'error');
      if (!isFresh) {
        setValidateState({ status: 'checking' });
        const result = await validateSingleService(url, probe.kind, probe.ogcFormat);
        setValidateState({
          status: result.ok ? 'ok' : 'error',
          message: result.message,
          ...(result.ok ? {} : { diagnostic: result.diagnostic }),
        });
        lastValidatedSigRef.current = { url, format: selectedFormat };
      }
    }

    // Edit mode: patch existing service (name + url only)
    if (editingServiceId && onUpdateService) {
      const idToRecheck = editingServiceId;
      onUpdateService(idToRecheck, {
        name: newServiceName,
        url: newServiceUrl,
      });
      setEditingServiceId(null);
      setNewServiceName('');
      setNewServiceUrl('');
      setUploadedFile(null);
      setShowAddForm(false);
      // Revalidate the patched service so an unreachable URL surfaces in
      // the failures section instead of staying in the main list with a
      // stale "manual configuration required" message. Defer until the
      // patched URL is reflected in `services`.
      setPendingRecheckId({ id: idToRecheck, url: newServiceUrl.trim() });
      return;
    }

    let added: Service | undefined;
    if (selectedFormat === 's3') {
      // For S3, create a service with a placeholder format since the actual format will be determined by file extension
      added = await addService(newServiceName, newServiceUrl, 'cog', 's3');
    } else if (selectedFormat === 'stac') {
      // For STAC, the service name will be auto-populated from catalogue title
      added = await addService(newServiceName, newServiceUrl, 'stac', 'stac');
    } else {
      added = await addService(newServiceName, newServiceUrl, selectedFormat as DataSourceFormat, 'service');
    }
    setNewServiceName('');
    setNewServiceUrl('');
    setUploadedFile(null);
    setShowAddForm(false);
    // Revalidate the just-added service so failures land in the bottom
    // failures section with the same card styling as bulk-recheck failures.
    // Defer until the new service appears in `services`.
    if (added?.id) {
      setPendingRecheckId({ id: added.id, url: added.url });
    }
  };

  const handleCancel = () => {
    setNewServiceName('');
    setNewServiceUrl('');
    setUploadedFile(null);
    setDetectionResult(null);
    setShowAddForm(false);
    setEditingServiceId(null);
    setValidateState({ status: 'idle' });
    lastValidatedSigRef.current = null;
  };

  // Reset validation result whenever the URL or service type changes.
  useEffect(() => {
    setValidateState({ status: 'idle' });
    lastValidatedSigRef.current = null;
  }, [newServiceUrl, selectedFormat]);

  const handleValidate = async () => {
    const url = newServiceUrl.trim();
    if (!url || selectedFormat === 'json-upload') return;

    const probe = getProbeKind(selectedFormat);
    if (!probe) return;

    setValidateState({ status: 'checking' });
    const result = await validateSingleService(url, probe.kind, probe.ogcFormat);
    setValidateState({
      status: result.ok ? 'ok' : 'error',
      message: result.message,
      ...(result.ok ? {} : { diagnostic: result.diagnostic }),
    });
    lastValidatedSigRef.current = { url, format: selectedFormat };
  };

  const handleEditService = (service: Service) => {
    // Derive the form's "selectedFormat" from the existing service for display only.
    // (Service Type is locked in edit mode, so this value isn't used for dispatch.)
    let formatForForm: SourceConfigType | 'json-upload';
    if (service.sourceType === 's3') {
      formatForForm = 's3';
    } else if (service.sourceType === 'stac') {
      formatForForm = 'stac';
    } else {
      formatForForm = (service.format as SourceConfigType) || 'wms';
    }

    setEditingServiceId(service.id);
    setSelectedFormat(formatForForm);
    setNewServiceName(service.name);
    setNewServiceUrl(service.url);
    setShowAddForm(true);
  };

  const handleAddRecommendedServices = async () => {
    setIsLoadingRecommended(true);
    try {
      const [recommendedServices, recommendedCatalogues] = await Promise.all([
        fetchRecommendedServices(),
        fetchRecommendedCatalogues(),
      ]);

      const catalogueServices: Service[] = recommendedCatalogues.map(entry => ({
        id: entry.id,
        name: entry.name,
        url: entry.url,
        format: 'catalogue',
        sourceType: 'catalogue',
        description: entry.description,
      }));

      const allServices = [...recommendedServices, ...catalogueServices];

      if (allServices.length === 0) {
        toast({
          title: "No services found",
          description: "The recommended config doesn't contain any services or catalogues.",
          variant: "default"
        });
        return;
      }

      // Filter out services that already exist (by URL)
      const existingUrls = new Set(services.map(s => s.url));
      const newServices = allServices.filter(s => !existingUrls.has(s.url));

      if (newServices.length === 0) {
        toast({
          title: "All services already added",
          description: "All recommended services and catalogues are already configured.",
          variant: "default"
        });
        return;
      }

      setRecommendedServicesList(newServices);
      setShowRecommendedModal(true);
    } catch (error) {
      toast({
        title: "Failed to load services",
        description: error instanceof Error ? error.message : "An error occurred while fetching recommended services.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingRecommended(false);
    }
  };


  const handleConfirmRecommendedServices = useCallback(async (selectedServices: Service[]) => {
    setIsAddingSelected(true);
    try {
      // Add services raw (without capabilities) — bulk validation will pick them up
      // and run the kind-aware (STAC / OGC / S3) checks with proper fallbacks.
      let addedCount = 0;
      selectedServices.forEach((service, idx) => {
        try {
          const sourceType =
            service.sourceType ||
            (service.format === 'stac'
              ? 'stac'
              : service.format === 's3'
                ? 's3'
                : service.format === 'catalogue'
                  ? 'catalogue'
                  : 'service');

          const newService: Service = {
            ...service,
            id: service.id || `${sourceType}-service-${Date.now()}-${idx}`,
            name: service.name?.trim() || service.url,
            url: service.url.trim(),
            sourceType,
            format: service.format,
            // Strip any pre-existing capabilities so the bulk validator re-checks
            capabilities: undefined,
          };

          onAddService(newService);
          addedCount++;
        } catch (error) {
          console.error(`Failed to add service ${service.name}:`, error);
        }
      });




      // Kick off unified validation across STAC / OGC / S3 groups.
      // Defer so onAddService state updates settle first.
      setPendingRecheck(true);
    } catch (error) {
      toast({
        title: "Failed to add services",
        description: error instanceof Error ? error.message : "An error occurred.",
        variant: "destructive"
      });
    } finally {
      setIsAddingSelected(false);
      setShowRecommendedModal(false);
    }
  }, [onAddService, recheck]);

  const getConfigForType = (type: SourceConfigType | 'json-upload') => {
    if (type === 's3') {
      return S3_CONFIG;
    }
    if (type === 'stac') {
      return STAC_CONFIG;
    }
    if (type === 'json-upload') {
      return JSON_UPLOAD_CONFIG;
    }
    return FORMAT_CONFIGS[type as DataSourceFormat];
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-primary">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Configured Services
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => recheck()}
                variant="outline"
                disabled={inFlightTotal > 0 || services.length === 0}
                className="border-primary/30"
                title="Re-validate all services (STAC, OGC, S3)"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${inFlightTotal > 0 ? 'animate-spin' : ''}`} />
                Re-check all
              </Button>
              <Button
                onClick={handleAddRecommendedServices}
                variant="outline"
                disabled={isLoadingRecommended}
                className="border-primary/30"
              >
                <Download className="h-4 w-4 mr-2" />
                {isLoadingRecommended ? 'Loading...' : 'Add Recommended Services'}
              </Button>
              <Button
                onClick={() => {
                  setSelectedFormat('wms');
                  setShowAddForm(true);
                }}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Service
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Configure WMS, WMTS, S3, and STAC services that can be used across multiple data sources. Services support automatic discovery via GetCapabilities, bucket listing, or catalogue metadata.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(showSummaryPanel || inFlightTotal > 0) && (
            <div className="relative mb-4 space-y-1.5 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 pr-10 text-sm text-primary">
              {(['stac', 'ogc', 's3'] as ServiceKind[]).map(kind => {
                const label =
                  kind === 'stac'
                    ? 'STAC catalogues'
                    : kind === 'ogc'
                    ? 'WMS / WMTS / WFS services'
                    : 'S3 stores';
                const groupProg = progress[kind];
                const summary = runSummary?.[kind] ?? null;

                if (groupProg.inFlight > 0) {
                  return (
                    <div key={kind} className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Checking {label} ({groupProg.completed} of {groupProg.total})…</span>
                    </div>
                  );
                }

                if (summary && summary.total > 0) {
                  const failed = failedByKind[kind];
                  const warned = warningByKind[kind];
                  const reachable = summary.total - failed;
                  const extras: string[] = [];
                  if (failed > 0) extras.push(`${failed} failed`);
                  if (warned > 0) extras.push(`${warned} warning${warned === 1 ? '' : 's'}`);
                  return (
                    <div key={kind} className="flex items-center gap-2">
                      {failed > 0 || warned > 0 ? (
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                      ) : (
                        <Check className="h-4 w-4 text-emerald-600" />
                      )}
                      <span>
                        {label}: {reachable} of {summary.total} reachable
                        {extras.length > 0 ? ` (${extras.join(', ')})` : ''}
                      </span>
                    </div>
                  );
                }

                return null;
              })}
              {inFlightTotal === 0 && (failedByKind.stac + failedByKind.ogc + failedByKind.s3) > 0 && (
                <p className="text-xs text-muted-foreground italic mt-1 w-full">
                  Invalid services and sources are listed at the bottom of this page.
                </p>
              )}
              {inFlightTotal === 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 text-primary hover:bg-primary/10"
                  onClick={() => setDismissed(true)}
                  aria-label="Dismiss validation results"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
          {/* Add/Edit form moved to modal dialog below */}

          {services.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Server className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No services configured yet</h3>
              <p className="mb-4">Add your first WMS, WMTS, S3, or STAC service to get started</p>
            </div>
          ) : (() => {
            const getPriority = (service: Service) => {
              if (service.sourceType === 'stac') return 1;
              if (service.format === 'wms' || service.format === 'wmts') return 2;
              if (service.sourceType === 's3') return 3;
              return 4;
            };
            const sorted = services.slice().sort((a, b) => {
              const priorityA = getPriority(a);
              const priorityB = getPriority(b);
              if (priorityA !== priorityB) return priorityA - priorityB;
              return a.name.localeCompare(b.name);
            });
            const validServices = sorted.filter(s => validationStatuses[s.id] !== 'error');
            const invalidServices = sorted.filter(s => validationStatuses[s.id] === 'error');

            const renderServiceCard = (service: Service) => {
              const isInvalid = validationStatuses[service.id] === 'error';
              const sourceBorderClass =
                service.sourceType === 's3' ? 'border-l-green-500' :
                service.sourceType === 'stac' ? 'border-l-purple-500' :
                'border-l-blue-500';
              return (
              <Card key={service.id} className={
                isInvalid
                  ? 'border-l-4 border-l-destructive border-destructive/30 bg-destructive/5'
                  : `border-l-4 ${sourceBorderClass}`
              }>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {service.sourceType === 's3' ? (
                          <Database className="h-4 w-4 text-green-600" />
                        ) : service.sourceType === 'stac' ? (
                          <Server className="h-4 w-4 text-purple-600" />
                        ) : (
                          <Globe className="h-4 w-4 text-blue-600" />
                        )}
                        <h5 className={`font-medium ${
                          service.sourceType === 's3' ? 'text-green-700' :
                          service.sourceType === 'stac' ? 'text-purple-700' :
                          'text-blue-700'
                        }`}>
                          {service.name}
                        </h5>
                        <Badge variant="outline" className={`${
                          service.sourceType === 's3' ? 'border-green-300 text-green-700' :
                          service.sourceType === 'stac' ? 'border-purple-300 text-purple-700' :
                          'border-blue-300 text-blue-700'
                        }`}>
                          {service.sourceType === 's3' ? 'S3 Bucket' :
                           service.sourceType === 'stac' ? 'STAC' :
                           service.format?.toUpperCase()}
                        </Badge>
                        {(service.format === 'wms' || service.format === 'wmts') && service.capabilities?.version && (
                          <Badge variant="outline" className="border-blue-300 text-blue-700">
                            v{service.capabilities.version}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 break-all mb-2">{service.url}</p>
                      {service.capabilities?.title && (
                        <p className="text-sm text-slate-600 mb-2">{service.capabilities.title}</p>
                      )}
                      {(() => {
                        const status = validationStatuses[service.id];
                        const layerCount = service.capabilities?.layers.length;
                        if (status === 'checking') {
                          return (
                            <Badge variant="outline" className="border-primary/40 text-primary">
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Checking…
                            </Badge>
                          );
                        }
                        if (status === 'ok' && service.sourceType === 's3' && !layerCount) {
                          return (
                            <Badge variant="outline" className="border-green-300 text-green-700">
                              Endpoint reachable
                            </Badge>
                          );
                        }
                        if (layerCount) {
                          return (
                            <Badge variant="outline" className="border-green-300 text-green-700">
                              {layerCount} {
                                service.sourceType === 's3' ? 'objects' :
                                service.sourceType === 'stac' ? 'collections' :
                                'layers'
                              } available
                            </Badge>
                          );
                        }
                        if (status === 'error') {
                          const diag = validationErrors[service.id];
                          const errLabel =
                            diag?.title ??
                            (service.sourceType === 's3' ? "Couldn't reach endpoint" :
                             service.sourceType === 'stac' ? "Couldn't fetch catalogue" :
                             "Couldn't fetch capabilities");
                          return (
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="outline" className="border-amber-300 text-amber-700 whitespace-normal text-left">
                                  <AlertTriangle className="h-3 w-3 mr-1 flex-shrink-0" />
                                  {errLabel}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-xs text-amber-700 hover:text-amber-900"
                                  onClick={() => recheck(service.id)}
                                >
                                  <RefreshCw className="h-3 w-3 mr-1" />
                                  Retry
                                </Button>
                              </div>
                              {diag?.detail && (
                                <span className="text-xs text-muted-foreground">{diag.detail}</span>
                              )}
                              {diag?.hint && (
                                <span className="text-xs text-muted-foreground">{diag.hint}</span>
                              )}
                            </div>
                          );
                        }
                        return (
                          <Badge variant="outline" className="border-orange-300 text-orange-700">
                            Manual configuration required
                          </Badge>
                        );
                      })()}
                      {validationWarnings[service.id]?.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {validationWarnings[service.id].map((msg, i) => (
                            <Badge
                              key={i}
                              variant="outline"
                              className="border-amber-300 text-amber-700 whitespace-normal text-left"
                              title={msg}
                            >
                              <AlertTriangle className="h-3 w-3 mr-1 flex-shrink-0" />
                              {msg}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {onUpdateService && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditService(service)}
                          className="text-muted-foreground hover:text-foreground"
                          title="Edit service"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const originalIndex = services.findIndex(s => s.id === service.id);
                          if (originalIndex !== -1) {
                            onRemoveService(originalIndex);
                          }
                        }}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        title="Remove service"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              );
            };

            return (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {validServices.map(renderServiceCard)}
                </div>
                {invalidServices.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Invalid services</h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      {invalidServices.length} service{invalidServices.length === 1 ? '' : 's'} failed validation. Check the URL or retry.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {invalidServices.map(renderServiceCard)}
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </CardContent>
      </Card>

      <ServiceUploadConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        detectionResult={detectionResult}
        onConfirm={handleConfirmUpload}
        onCancel={handleCancelUpload}
      />
      <RecommendedServicesModal
        isOpen={showRecommendedModal}
        onClose={() => setShowRecommendedModal(false)}
        services={recommendedServicesList}
        onConfirm={handleConfirmRecommendedServices}
        isLoading={isAddingSelected}
      />

      <Dialog
        open={showAddForm || editingServiceId !== null}
        onOpenChange={(o) => { if (!o) handleCancel(); }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingServiceId ? 'Edit Service' : 'Add Service'}
            </DialogTitle>
            <DialogDescription>
              {editingServiceId
                ? 'Update the name or URL for this service. Service type cannot be changed.'
                : 'Configure a new map service to add to your collection.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="serviceFormat">Service Type</Label>
              <Select
                value={selectedFormat}
                onValueChange={(value: SourceConfigType | 'json-upload') => setSelectedFormat(value)}
                disabled={!!editingServiceId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wms">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      {FORMAT_CONFIGS.wms.label}
                    </div>
                  </SelectItem>
                  <SelectItem value="wmts">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      {FORMAT_CONFIGS.wmts.label}
                    </div>
                  </SelectItem>
                  <SelectItem value="s3">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      {S3_CONFIG.label}
                    </div>
                  </SelectItem>
                  <SelectItem value="stac">
                    <div className="flex items-center gap-2">
                      <Server className="h-4 w-4" />
                      {STAC_CONFIG.label}
                    </div>
                  </SelectItem>
                  {!editingServiceId && (
                    <SelectItem value="json-upload">
                      <div className="flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        JSON or XML File Upload (beta)
                      </div>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {editingServiceId && (
                <p className="text-xs text-muted-foreground">
                  Service type cannot be changed. Delete and re-add to switch type.
                </p>
              )}
            </div>

            {selectedFormat === 'json-upload' ? (
              <div className="space-y-2">
                <Label htmlFor="serviceJsonFile">Upload Service JSON or XML</Label>
                <Input
                  id="serviceJsonFile"
                  type="file"
                  accept=".json,.xml,application/json,text/xml,application/xml"
                  onChange={handleFileUpload}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground">
                  Upload a JSON or XML file containing S3 bucket listing, STAC catalog, or service capabilities
                </p>
                {uploadedFile && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Selected: {uploadedFile.name} ({Math.round(uploadedFile.size / 1024)}KB)
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="serviceUrl">Service URL</Label>
                  <Input
                    id="serviceUrl"
                    value={newServiceUrl}
                    onChange={(e) => setNewServiceUrl(e.target.value)}
                    placeholder={getConfigForType(selectedFormat).urlPlaceholder}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serviceName">
                    Service Name {selectedFormat === 'stac' && <span className="text-xs text-muted-foreground">(auto-populated from catalogue)</span>}
                    {(selectedFormat === 'wms' || selectedFormat === 'wmts' || selectedFormat === 'wfs') && (
                      <span className="text-xs text-muted-foreground">(auto-populated from GetCapabilities)</span>
                    )}
                  </Label>
                  <Input
                    id="serviceName"
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                    placeholder={
                      selectedFormat === 's3' ? 'e.g., ESA APEX S3 Bucket' :
                      selectedFormat === 'stac' ? 'Will be auto-populated...' :
                      (selectedFormat === 'wms' || selectedFormat === 'wmts' || selectedFormat === 'wfs') ? 'Will be auto-populated...' :
                      'e.g., Terrascope WMS'
                    }
                    disabled={(selectedFormat === 'stac' || selectedFormat === 'wms' || selectedFormat === 'wmts' || selectedFormat === 'wfs') && autoNameLoading}
                  />
                </div>
              </div>
            )}
          </div>

          {selectedFormat !== 'json-upload' && validateState.status !== 'idle' && (
            <div className="flex items-start gap-2 text-sm">
              {validateState.status === 'checking' && (
                <>
                  <Loader2 className="h-4 w-4 mt-0.5 animate-spin text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">Validating…</span>
                </>
              )}
              {validateState.status === 'ok' && (
                <>
                  <Check className="h-4 w-4 mt-0.5 text-emerald-600 shrink-0" />
                  <span className="text-emerald-600">Reachable — {validateState.message}</span>
                </>
              )}
              {validateState.status === 'error' && (
                <>
                  <AlertTriangle className="h-4 w-4 mt-0.5 text-destructive shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-destructive font-medium">
                      {validateState.diagnostic?.title ?? validateState.message}
                    </div>
                    {validateState.diagnostic?.detail && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {validateState.diagnostic.detail}
                      </div>
                    )}
                    {validateState.diagnostic?.hint && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {validateState.diagnostic.hint}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            {selectedFormat !== 'json-upload' && (
              <Button
                variant="outline"
                onClick={handleValidate}
                disabled={!newServiceUrl.trim() || validateState.status === 'checking'}
              >
                {validateState.status === 'checking' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Validating…
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Validate
                  </>
                )}
              </Button>
            )}
            <Button
              onClick={handleAddService}
              disabled={
                (selectedFormat !== 'json-upload' && !newServiceUrl.trim()) ||
                (selectedFormat === 'json-upload' && !uploadedFile) ||
                isLoadingCapabilities ||
                validateState.status === 'checking'
              }
              className="bg-primary hover:bg-primary/90"
            >
              {isLoadingCapabilities || validateState.status === 'checking' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {editingServiceId ? 'Saving...' : 'Adding Service...'}
                </>
              ) : editingServiceId ? (
                <>
                  <Pencil className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServicesManager;
