import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapContainer, Rectangle, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { bboxValuesToBounds, cornersToBboxValues } from '@/utils/stacBboxMap';

interface StacBboxMapProps {
  value: string[];
  onChange: (next: string[]) => void;
  open: boolean;
}

/** Drag-to-draw rectangle handler; disables panning while drawing. */
const DrawHandler: React.FC<{
  onDraft: (b: L.LatLngBounds | null) => void;
  onDone: (a: L.LatLng, b: L.LatLng) => void;
  enabled: boolean;
}> = ({ onDraft, onDone, enabled }) => {
  const map = useMap();
  useEffect(() => {
    if (!enabled) return;
    map.dragging.disable();
    const container = map.getContainer();
    container.style.cursor = 'crosshair';
    let start: L.LatLng | null = null;
    const down = (e: L.LeafletMouseEvent) => { start = e.latlng; onDraft(L.latLngBounds(start, start)); };
    const move = (e: L.LeafletMouseEvent) => { if (start) onDraft(L.latLngBounds(start, e.latlng)); };
    const up = (e: L.LeafletMouseEvent) => {
      if (start && !start.equals(e.latlng)) onDone(start, e.latlng);
      start = null;
      onDraft(null);
    };
    map.on('mousedown', down).on('mousemove', move).on('mouseup', up);
    return () => {
      map.off('mousedown', down).off('mousemove', move).off('mouseup', up);
      map.dragging.enable();
      container.style.cursor = '';
    };
  }, [map, enabled, onDraft, onDone]);
  return null;
};

/** Fits the map to the bbox when the dialog opens; sizes the map after the dialog animation. */
const ViewSync: React.FC<{ open: boolean; bounds: [number, number, number, number] | null; mapRef: React.MutableRefObject<L.Map | null> }> = ({ open, bounds, mapRef }) => {
  const map = useMap();
  mapRef.current = map;
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      map.invalidateSize();
      if (bounds) map.fitBounds([[bounds[1], bounds[0]], [bounds[3], bounds[2]]], { padding: [20, 20] });
      else map.setView([20, 0], 1);
    }, 150);
    return () => clearTimeout(t);
    // Only on open: later edits shouldn't jump the view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, map]);
  return null;
};

const StacBboxMap: React.FC<StacBboxMapProps> = ({ value, onChange, open }) => {
  const [draft, setDraft] = useState<L.LatLngBounds | null>(null);
  const [drawing, setDrawing] = useState(true);
  const mapRef = useRef<L.Map | null>(null);
  const bounds = bboxValuesToBounds(value);
  const onDone = React.useCallback((a: L.LatLng, b: L.LatLng) => onChange(cornersToBboxValues(a, b)), [onChange]);

  const useView = () => {
    const m = mapRef.current;
    if (!m) return;
    const b = m.getBounds();
    onChange(cornersToBboxValues(b.getSouthWest(), b.getNorthEast()));
  };

  return (
    <div className="space-y-2">
      <div className="h-[360px] overflow-hidden rounded-md border border-border">
        <MapContainer center={[20, 0]} zoom={1} worldCopyJump={false} className="h-full w-full">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
          <ViewSync open={open} bounds={bounds} mapRef={mapRef} />
          <DrawHandler enabled={drawing} onDraft={setDraft} onDone={onDone} />
          {bounds && !draft && <Rectangle bounds={[[bounds[1], bounds[0]], [bounds[3], bounds[2]]]} pathOptions={{ weight: 2 }} />}
          {draft && <Rectangle bounds={draft} pathOptions={{ weight: 1, dashArray: '4' }} />}
        </MapContainer>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant={drawing ? 'default' : 'outline'} onClick={() => setDrawing(true)}>Draw area</Button>
        <Button type="button" size="sm" variant={!drawing ? 'default' : 'outline'} onClick={() => setDrawing(false)}>Pan map</Button>
        <Button type="button" size="sm" variant="outline" onClick={useView}>Use current map view</Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => onChange(['', '', '', ''])}>Clear</Button>
        <span className="text-xs text-muted-foreground">{drawing ? 'Drag on the map to draw a rectangle.' : 'Drag to pan; scroll to zoom.'}</span>
      </div>
    </div>
  );
};

export default StacBboxMap;
