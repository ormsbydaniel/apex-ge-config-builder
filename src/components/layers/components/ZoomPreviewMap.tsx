import React, { useEffect } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { zoomHint } from '@/utils/displaySettings';

interface ZoomPreviewMapProps {
  label: string;
  /** [lng, lat] */
  center: [number, number];
  zoom: number | undefined;
  fallbackZoom: number;
  open: boolean;
  onChange: (zoom: number | undefined) => void;
}

/** Keeps the map zoom in step with the value and reports user zooming back. */
const ZoomSync: React.FC<{ zoom: number; open: boolean; onZoom: (z: number) => void }> = ({ zoom, open, onZoom }) => {
  const map = useMap();
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => map.invalidateSize(), 150);
    return () => clearTimeout(t);
  }, [open, map]);
  useEffect(() => {
    if (map.getZoom() !== zoom) map.setZoom(zoom, { animate: false });
  }, [zoom, map]);
  useMapEvents({ zoomend: () => onZoom(map.getZoom()) });
  return null;
};

const ZoomPreviewMap: React.FC<ZoomPreviewMapProps> = ({ label, center, zoom, fallbackZoom, open, onChange }) => {
  const shown = zoom ?? fallbackZoom;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">
          {zoom === undefined ? 'No limit' : `Zoom ${zoom} · ${zoomHint(zoom)}`}
        </span>
      </div>
      <div className="h-44 rounded-md overflow-hidden border border-border">
        <MapContainer center={[center[1], center[0]]} zoom={shown} minZoom={0} maxZoom={20} zoomSnap={1} className="h-full w-full" attributionControl={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <ZoomSync zoom={shown} open={open} onZoom={(z) => { if (z !== shown || zoom === undefined) onChange(z); }} />
        </MapContainer>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">Zoom the map to set the limit</span>
        {zoom !== undefined && (
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => onChange(undefined)}>Remove limit</Button>
        )}
      </div>
    </div>
  );
};

export default ZoomPreviewMap;
