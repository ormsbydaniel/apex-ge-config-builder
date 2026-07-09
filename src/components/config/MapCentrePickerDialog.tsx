import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface MapCentrePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** [lng, lat] */
  center: [number, number];
  zoom: number;
  onApply: (center: [number, number], zoom: number) => void;
}

const MapEvents: React.FC<{
  onChange: (center: [number, number], zoom: number) => void;
}> = ({ onChange }) => {
  const map = useMapEvents({
    moveend: () => {
      const c = map.getCenter();
      onChange([c.lng, c.lat], map.getZoom());
    },
    zoomend: () => {
      const c = map.getCenter();
      onChange([c.lng, c.lat], map.getZoom());
    },
    click: (e) => {
      map.panTo(e.latlng);
    },
  });
  return null;
};

const InvalidateOnOpen: React.FC<{ open: boolean }> = ({ open }) => {
  const map = useMap();
  useEffect(() => {
    if (open) {
      // Ensure Leaflet recalculates size after dialog animation
      const t = setTimeout(() => map.invalidateSize(), 150);
      return () => clearTimeout(t);
    }
  }, [open, map]);
  return null;
};

const MapCentrePickerDialog: React.FC<MapCentrePickerDialogProps> = ({
  open,
  onOpenChange,
  center,
  zoom,
  onApply,
}) => {
  // Initialize local state inside effect that watches `open` to prevent stale overwrites
  const [localCenter, setLocalCenter] = useState<[number, number]>(center);
  const [localZoom, setLocalZoom] = useState<number>(zoom);
  const initialRef = useRef<{ center: [number, number]; zoom: number }>({ center, zoom });

  useEffect(() => {
    if (open) {
      const safeCenter: [number, number] = [
        Number.isFinite(center[0]) ? center[0] : 0,
        Number.isFinite(center[1]) ? center[1] : 0,
      ];
      const safeZoom = Number.isFinite(zoom) ? Math.min(Math.max(zoom, 0), 18) : 2;
      setLocalCenter(safeCenter);
      setLocalZoom(safeZoom);
      initialRef.current = { center: safeCenter, zoom: safeZoom };
    }
  }, [open, center, zoom]);

  const handleApply = () => {
    onApply(localCenter, localZoom);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Pick map centre and zoom</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <div className="relative h-[420px] w-full rounded-md overflow-hidden border">
            {open && (
              <MapContainer
                center={[initialRef.current.center[1], initialRef.current.center[0]]}
                zoom={initialRef.current.zoom}
                minZoom={0}
                maxZoom={18}
                scrollWheelZoom
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapEvents onChange={(c, z) => { setLocalCenter(c); setLocalZoom(z); }} />
                <InvalidateOnOpen open={open} />
              </MapContainer>
            )}
            {/* Fixed crosshair overlay at map centre */}
            <div className="pointer-events-none absolute inset-0 z-[500] flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
                <circle cx="14" cy="14" r="3" fill="none" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
                <line x1="14" y1="0" x2="14" y2="9" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
                <line x1="14" y1="19" x2="14" y2="28" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
                <line x1="0" y1="14" x2="9" y2="14" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
                <line x1="19" y1="14" x2="28" y2="14" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
              </svg>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
            <span>
              Centre:&nbsp;
              <span className="font-mono">{localCenter[1].toFixed(6)}, {localCenter[0].toFixed(6)}</span>
              <span className="text-xs ml-1">(lat, lng)</span>
            </span>
            <span>Zoom: <span className="font-mono">{localZoom}</span></span>
          </div>
          <p className="text-xs text-muted-foreground px-1">
            Pan or click to move the centre. Scroll or use the +/- controls to change zoom.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleApply}>Apply</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MapCentrePickerDialog;
