import React, { useEffect, useState } from 'react';
import { Crosshair, Map, MapPin, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { geoLocations, groupedLocations } from '@/constants/geoLocations';
import MapCentrePickerDialog from './MapCentrePickerDialog';

/** Same zoom labels as Settings → Navigation. */
export const getZoomLabel = (zoom: number): string => {
  let label = '';
  if (zoom <= 1) label = ' (Global)';
  else if (zoom >= 3 && zoom <= 5) label = ' (Continent)';
  else if (zoom >= 10 && zoom <= 13) label = ' (City)';
  else if (zoom >= 14 && zoom <= 17) label = ' (Street)';
  else if (zoom === 18) label = ' (Buildings)';
  return `Zoom ${zoom}${label}`;
};

const matchPreset = (c: [number, number], z: number) =>
  geoLocations.find((l) => l.center[0] === c[0] && l.center[1] === c[1] && l.zoom === z)?.name ?? 'custom';

interface Props {
  /** [lng, lat] */
  center: [number, number];
  zoom: number;
  onChange: (center: [number, number], zoom: number) => void;
  /** Optional data coverage outline shown in the pick-on-map dialog. */
  dataBbox?: [number, number, number, number];
  /** Extra controls rendered beside the preset dropdown. */
  extra?: React.ReactNode;
}

/** Quick location dropdown, pick-on-map and zoom slider, mirroring Settings → Navigation. */
const StartLocationControls: React.FC<Props> = ({ center, zoom, onChange, dataBbox, extra }) => {
  const [selected, setSelected] = useState(() => matchPreset(center, zoom));
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    setSelected(matchPreset(center, zoom));
  }, [center, zoom]);

  const sortByName = <T extends { name: string }>(a: T[]) => [...a].sort((x, y) => x.name.localeCompare(y.name));

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-6">
        <div className="flex w-[180px] items-center gap-2 pt-2">
          <MapPin className="h-5 w-5 text-muted-foreground" />
          <Label className="whitespace-nowrap text-base font-medium">Quick Location</Label>
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={selected}
              onValueChange={(name) => {
                setSelected(name);
                const loc = geoLocations.find((l) => l.name === name);
                if (loc) onChange(loc.center, loc.zoom);
              }}
            >
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Select a location preset..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Custom (Manual Entry)</SelectItem>
                <SelectGroup>
                  <SelectLabel>Global & Continents</SelectLabel>
                  {groupedLocations.global.map((l) => <SelectItem key={l.name} value={l.name}>{l.name}</SelectItem>)}
                  {sortByName(groupedLocations.continents).map((l) => <SelectItem key={l.name} value={l.name}>{l.name}</SelectItem>)}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Major countries</SelectLabel>
                  {sortByName(groupedLocations.countries).map((l) => <SelectItem key={l.name} value={l.name}>{l.name}</SelectItem>)}
                </SelectGroup>
              </SelectContent>
            </Select>
            {extra}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Select a preset location, or pick a custom spot on the map</p>
        </div>
      </div>

      <div className="flex items-start gap-6">
        <div className="w-[180px] space-y-2">
          <div className="flex items-center gap-2">
            <Map className="h-5 w-5 text-muted-foreground" />
            <Label className="whitespace-nowrap text-base font-medium">Map centre at start</Label>
          </div>
          {selected === 'custom' && (
            <span className="inline-block w-[140px] rounded bg-muted px-2 py-1 text-sm text-muted-foreground">(Custom)</span>
          )}
        </div>
        <div className="flex flex-1 items-center gap-4 px-2 pt-1">
          <span className="font-mono text-sm">{center[1].toFixed(4)}, {center[0].toFixed(4)}</span>
          <Button type="button" variant="outline" size="sm" onClick={() => setPickerOpen(true)} className="gap-2">
            <Crosshair className="h-4 w-4" />
            Pick on map
          </Button>
        </div>
      </div>

      <div className="flex items-start gap-6">
        <div className="w-[180px] space-y-2">
          <div className="flex items-center gap-2">
            <ZoomIn className="h-5 w-5 text-muted-foreground" />
            <Label className="whitespace-nowrap text-base font-medium">Zoom at start</Label>
          </div>
          <span className="inline-block w-[140px] rounded bg-muted px-2 py-1 text-sm text-muted-foreground">{getZoomLabel(zoom)}</span>
        </div>
        <div className="flex-1 px-2 pt-2">
          <Slider value={[zoom]} onValueChange={(v) => onChange(center, v[0])} max={28} min={0} step={1} className="w-full" />
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>0</span><span>14</span><span>28</span>
          </div>
        </div>
      </div>

      <MapCentrePickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        center={center}
        zoom={zoom}
        dataBbox={dataBbox}
        onApply={(c, z) => onChange([Number(c[0].toFixed(4)), Number(c[1].toFixed(4))], z)}
      />
    </div>
  );
};

export default StartLocationControls;
