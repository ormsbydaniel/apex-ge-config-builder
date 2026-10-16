/** @deprecated Replaced by components/config/StartLocationControls in the app wizard. */
import React, { useEffect } from 'react';
import { MapContainer, Rectangle, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface Props {
  /** [lng, lat] */
  center: [number, number];
  zoom: number;
  onChange: (center: [number, number], zoom: number) => void;
  /** Data coverage [minLng, minLat, maxLng, maxLat], outlined when known. */
  dataBbox?: [number, number, number, number];
}

/** Moves the map when the centre/zoom changes from outside (e.g. a preset chip). */
const Sync: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    const c = map.getCenter();
    if (Math.abs(c.lng - center[0]) > 1e-4 || Math.abs(c.lat - center[1]) > 1e-4 || map.getZoom() !== zoom) {
      map.setView([center[1], center[0]], zoom, { animate: true });
    }
  }, [center, zoom, map]);
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 150);
    return () => clearTimeout(t);
  }, [map]);
  return null;
};

const Events: React.FC<{ onChange: Props['onChange'] }> = ({ onChange }) => {
  const map = useMapEvents({
    moveend: () => {
      const c = map.getCenter();
      onChange([Number(c.lng.toFixed(4)), Number(c.lat.toFixed(4))], map.getZoom());
    },
  });
  return null;
};

/** Small embedded map; the app starts where the crosshair sits. */
const LocationPickerMap: React.FC<Props> = ({ center, zoom, onChange, dataBbox }) => (
  <div className="relative h-56 w-full overflow-hidden rounded-lg border">
    <MapContainer center={[center[1], center[0]]} zoom={zoom} className="h-full w-full" worldCopyJump>
      <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap contributors" />
      <Sync center={center} zoom={zoom} />
      <Events onChange={onChange} />
      {dataBbox && (
        <Rectangle
          bounds={[[dataBbox[1], dataBbox[0]], [dataBbox[3], dataBbox[2]]]}
          pathOptions={{ color: 'hsl(var(--primary))', weight: 1.5, fillOpacity: 0.05, dashArray: '4 4' }}
        />
      )}
    </MapContainer>
    <div className="pointer-events-none absolute inset-0 z-[500] flex items-center justify-center">
      <div className="h-6 w-6 rounded-full border-2 border-primary bg-primary/20" />
    </div>
  </div>
);

export default LocationPickerMap;
