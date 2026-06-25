import React from 'react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { summariseRules, type PrimitiveKind, type RuleSummary } from '@/utils/vectorStyle/summariseStyleRule';
import { fromFlatStyleArray } from '@/utils/vectorStyle/fromFlatStyleArray';

interface VectorStyleSummaryProps {
  /** Raw OpenLayers flat-style array as persisted in the config. */
  rules: unknown[];
}

const MAX_SWATCHES = 4;
const SWATCH_PX = 14;

const DATA_DRIVEN_BG =
  'repeating-linear-gradient(45deg, hsl(var(--muted-foreground) / 0.65) 0 2px, hsl(var(--muted) / 0.9) 2px 4px)';

const SwatchGlyph: React.FC<{ kind: PrimitiveKind | undefined; colour: string | 'data-driven' | undefined }> = ({
  kind,
  colour,
}) => {
  const isDataDriven = colour === 'data-driven';
  const resolvedColour =
    !isDataDriven && typeof colour === 'string' ? colour : 'hsl(var(--muted-foreground))';
  const background = isDataDriven ? DATA_DRIVEN_BG : undefined;

  // Base swatch container
  const base: React.CSSProperties = {
    width: SWATCH_PX,
    height: SWATCH_PX,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  if (!kind) {
    return (
      <span
        className="rounded-sm border border-border bg-muted"
        style={base}
        aria-hidden
      />
    );
  }

  if (kind === 'fill') {
    return (
      <span
        className="rounded-sm border border-border"
        style={{
          ...base,
          background: background ?? resolvedColour,
        }}
        aria-hidden
      />
    );
  }

  if (kind === 'line') {
    return (
      <span
        className="rounded-sm border border-border bg-background"
        style={base}
        aria-hidden
      >
        <span
          style={{
            display: 'block',
            width: SWATCH_PX - 4,
            height: 3,
            borderRadius: 1,
            background: background ?? resolvedColour,
          }}
        />
      </span>
    );
  }

  if (kind === 'marker') {
    return (
      <span
        className="rounded-sm border border-border bg-background"
        style={base}
        aria-hidden
      >
        <span
          style={{
            display: 'block',
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: background ?? resolvedColour,
          }}
        />
      </span>
    );
  }

  // label — filled tile with a letter, so it stays visible regardless of text colour
  return (
    <span
      className="rounded-sm border border-border font-serif font-bold leading-none"
      style={{
        ...base,
        background: background ?? resolvedColour,
        color: isDataDriven ? 'hsl(var(--background))' : '#fff',
        fontSize: SWATCH_PX - 4,
        textShadow: '0 0 1px rgba(0,0,0,0.6)',
      }}
      aria-hidden
    >
      a
    </span>
  );
};

const RuleGlyphs: React.FC<{ summary: RuleSummary }> = ({ summary }) => {
  const kinds: Array<PrimitiveKind | undefined> = summary.primitiveKinds.length
    ? summary.primitiveKinds
    : [summary.dominantKind];

  return (
    <>
      {kinds.map((kind, index) => (
        <SwatchGlyph
          key={kind ?? `unknown-${index}`}
          kind={kind}
          colour={kind ? summary.primitiveColours[kind]?.colour : summary.colour}
        />
      ))}
    </>
  );
};

const tooltipBody = (s: RuleSummary) => (
  <div className="space-y-0.5 text-xs">
    <div className="font-medium">{s.name}{s.enabled ? '' : ' (disabled)'}</div>
    {s.primitiveKinds.length > 0 && (
      <div className="text-muted-foreground">{s.primitiveKinds.join(' + ')}</div>
    )}
    <div className="text-muted-foreground">
      {s.filterText === 'always' ? 'applies to all features' :
        s.filterText === 'else' ? 'else branch' :
        `where ${s.filterText}`}
    </div>
    {s.colour === 'data-driven' && s.drivingField && (
      <div className="text-muted-foreground">data-driven by {s.drivingField}</div>
    )}
  </div>
);

const VectorStyleSummary: React.FC<VectorStyleSummaryProps> = ({ rules }) => {
  if (!rules || rules.length === 0) {
    return <>(None)</>;
  }

  const parsed = fromFlatStyleArray(rules);
  const summaries = summariseRules(parsed.rules);
  const visible = summaries.slice(0, MAX_SWATCHES);
  const hidden = summaries.slice(MAX_SWATCHES);

  return (
    <TooltipProvider delayDuration={400}>
      <span className="inline-flex items-center gap-1 align-middle">
        {visible.map((s, i) => (
          <Tooltip key={i}>
            <TooltipTrigger asChild>
              <span
                className="inline-flex items-center gap-0.5"
                style={{ opacity: s.enabled ? 1 : 0.4 }}
              >
                <RuleGlyphs summary={s} />
              </span>
            </TooltipTrigger>
            <TooltipContent>{tooltipBody(s)}</TooltipContent>
          </Tooltip>
        ))}
        {hidden.length > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-[10px] text-muted-foreground px-1 rounded border border-border bg-muted">
                +{hidden.length} more
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-0.5 text-xs">
                {hidden.map((s, i) => (
                  <div key={i}>{s.name}</div>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </span>
    </TooltipProvider>
  );
};

export default VectorStyleSummary;
