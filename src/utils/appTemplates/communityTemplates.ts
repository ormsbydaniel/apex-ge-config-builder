/**
 * Loads community app templates listed in the configs repository manifest and
 * adapts them into the same AppTemplate objects the wizard already uses.
 */
import { fetchExampleManifest } from '@/utils/exampleManifest';
import { applyPatches, evalExpr, EvalContext } from './patchEngine';
import { LIVE_CHECKS, OPTIONS_FROM, PROBES, RANGE_FROM, TRANSFORMS } from './helpers';
import { CommunityTemplate, CommunityTemplateSchema, TEMPLATE_FORMAT_VERSION, ValueExpr } from './templateSchema';
import { AppTemplate, AppTemplateParams, getDefaultValues, WizardField, WizardStep } from './templates';

export const COMMUNITY_PREFIX = 'community:';

export interface UnavailableTemplate {
  ref: string;
  reason: string;
}

export interface CommunityTemplatesResult {
  templates: AppTemplate[];
  unavailable: UnavailableTemplate[];
  /** True when the manifest itself could not be read. */
  failed: boolean;
}

/** Collect every helper name a template refers to. */
const helperNames = (node: unknown, out: string[] = []): string[] => {
  if (Array.isArray(node)) node.forEach((n) => helperNames(n, out));
  else if (node && typeof node === 'object') {
    const o = node as Record<string, unknown>;
    if (typeof o.use === 'string' && !('set' in o && 'remove' in o)) out.push(o.use);
    Object.values(o).forEach((v) => helperNames(v, out));
  }
  return out;
};

const checkHelpers = (t: CommunityTemplate) => {
  const problems: string[] = [];
  const exprs = [t.computed, t.patches, t.probe?.args, t.liveCheck?.args];
  for (const name of helperNames(exprs)) if (!TRANSFORMS[name]) problems.push(`unknown helper "${name}"`);
  if (t.probe && !PROBES[t.probe.use]) problems.push(`unknown probe "${t.probe.use}"`);
  if (t.liveCheck && !LIVE_CHECKS[t.liveCheck.use]) problems.push(`unknown live check "${t.liveCheck.use}"`);
  for (const f of [...t.steps.data.fields, ...t.steps.options.fields]) {
    if (f.optionsFrom && !OPTIONS_FROM[f.optionsFrom]) problems.push(`unknown optionsFrom "${f.optionsFrom}"`);
    if (f.rangeFrom && !RANGE_FROM[f.rangeFrom]) problems.push(`unknown rangeFrom "${f.rangeFrom}"`);
  }
  return problems;
};

const toStep = (s: CommunityTemplate['steps']['data']): WizardStep => ({
  title: s.title,
  description: s.description,
  fields: s.fields.map((f): WizardField => ({
    ...f,
    optionsFrom: f.optionsFrom ? OPTIONS_FROM[f.optionsFrom] : undefined,
    rangeFrom: f.rangeFrom ? RANGE_FROM[f.rangeFrom] : undefined,
  })),
});

const evalArgs = (args: Record<string, ValueExpr> | undefined, ctx: EvalContext) =>
  Object.fromEntries(Object.entries(args ?? {}).map(([k, v]) => [k, evalExpr(v, ctx)]));

/** Turn a validated template + base config into a wizard template. */
export const adaptCommunityTemplate = (t: CommunityTemplate, baseConfig: Record<string, unknown>): AppTemplate => {
  const ctxFor = (params: AppTemplateParams): EvalContext => ({ params, computed: t.computed, transforms: TRANSFORMS });
  const template: AppTemplate = {
    id: `${COMMUNITY_PREFIX}${t.id}`,
    name: t.name,
    tagline: t.tagline,
    description: t.description,
    bestFor: t.bestFor,
    defaults: t.defaults,
    dataStep: toStep(t.steps.data),
    optionsStep: toStep(t.steps.options),
    community: true,
    build: (p) => applyPatches(baseConfig, t.patches, ctxFor(p)),
  };
  if (t.probe) {
    const call = t.probe;
    template.probe = (values) => {
      try {
        const params = { title: t.defaults.title, center: t.defaults.center, zoom: t.defaults.zoom, values };
        return PROBES[call.use](evalArgs(call.args, ctxFor(params)));
      } catch { return null; }
    };
  }
  if (t.liveCheck) {
    const call = t.liveCheck;
    template.liveCheck = async (p) => {
      try { return await LIVE_CHECKS[call.use](evalArgs(call.args, ctxFor(p))); } catch { return null; }
    };
  }
  return template;
};

/** Validate raw template JSON and its base config; throws a readable reason. */
export const parseCommunityTemplate = (raw: unknown, baseConfig: unknown): AppTemplate => {
  const version = (raw as { formatVersion?: unknown })?.formatVersion;
  if (typeof version === 'number' && version > TEMPLATE_FORMAT_VERSION) {
    throw new Error(`needs a newer Config Builder (format ${version})`);
  }
  const parsed = CommunityTemplateSchema.safeParse(raw);
  if (!parsed.success) {
    const i = parsed.error.issues[0];
    throw new Error(`${i.path.join('.') || 'template'}: ${i.message}`);
  }
  const problems = checkHelpers(parsed.data);
  if (problems.length) throw new Error(problems.join('; '));
  if (!baseConfig || typeof baseConfig !== 'object' || !Array.isArray((baseConfig as { sources?: unknown }).sources)) {
    throw new Error('base config is not a Geospatial Explorer config');
  }
  const template = adaptCommunityTemplate(parsed.data, baseConfig as Record<string, unknown>);
  // Dry run with the default answers so missing paths fail now, not at launch.
  const d = parsed.data.defaults;
  template.build({ title: d.title, center: d.center, zoom: d.zoom, values: getDefaultValues(template) });
  return template;
};

const fetchJson = async (url: string) => {
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url.split('/').pop()}`);
  return res.json();
};

let cache: Promise<CommunityTemplatesResult> | null = null;

export const fetchCommunityTemplates = (): Promise<CommunityTemplatesResult> => {
  if (cache) return cache;
  cache = (async () => {
    let refs: { url: string }[];
    try {
      refs = (await fetchExampleManifest()).appTemplates;
    } catch {
      cache = null;
      return { templates: [], unavailable: [], failed: true };
    }
    const results = await Promise.all(refs.map(async (r) => {
      try {
        const raw = await fetchJson(r.url);
        const baseRef = (raw as { baseConfig?: unknown })?.baseConfig;
        if (typeof baseRef !== 'string') throw new Error('baseConfig: Required');
        const base = await fetchJson(new URL(baseRef, r.url).toString());
        return { template: parseCommunityTemplate(raw, base) };
      } catch (e) {
        return { error: { ref: r.url.split('/').slice(-2).join('/'), reason: (e as Error).message } };
      }
    }));
    return {
      templates: results.flatMap((x) => (x.template ? [x.template] : [])),
      unavailable: results.flatMap((x) => (x.error ? [x.error] : [])),
      failed: false,
    };
  })();
  return cache;
};
