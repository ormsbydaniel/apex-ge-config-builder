import { normalizeImportedConfig } from '../src/utils/importTransformations';
import { ConfigurationSchema } from '../src/schemas/configSchema';
const cfg = JSON.parse(await Bun.file('/tmp/cfg.json').text());
const n = normalizeImportedConfig(cfg);
const r = ConfigurationSchema.safeParse(n);
console.log('ok', r.success);
if (!r.success) console.log(JSON.stringify(r.error.issues, null, 2).slice(0,3000));
