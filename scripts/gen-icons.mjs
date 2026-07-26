import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DIR = 'D:/work/dataflow.zone/Ledgerai/node_modules/lucide-react/dist/esm/icons';
const OUT = 'D:/work/dataflow.zone/Ledgerai-astro/src/components/icons-data.ts';

// PascalCase name used in the React source -> lucide kebab file name.
const ICONS = {
  Sparkles: 'sparkles',
  ArrowRight: 'arrow-right',
  ArrowLeft: 'arrow-left',
  Check: 'check',
  CheckCircle2: 'check-circle-2',
  Loader: 'loader',
  Loader2: 'loader-2',
  LogIn: 'log-in',
  Gift: 'gift',
  Upload: 'upload',
  Brain: 'brain',
  BarChart3: 'bar-chart-3',
  Bell: 'bell',
  Mail: 'mail',
  Landmark: 'landmark',
  ChevronDown: 'chevron-down',
  ChevronRight: 'chevron-right',
  X: 'x',
  Flame: 'flame',
  UploadCloud: 'upload-cloud',
  FileText: 'file-text',
  AlertCircle: 'alert-circle',
  Clock: 'clock',
  Lock: 'lock',
  Calendar: 'calendar',
  Home: 'home',
  Search: 'search',
  User: 'user',
};

const camelToKebab = (s) => s.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());

const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function extract(file, depth = 0) {
  if (depth > 5) throw new Error('alias chain too deep at ' + file);
  const src = readFileSync(join(DIR, file + '.js'), 'utf8');

  // Deprecated names are thin re-exports of the current icon — follow them.
  const alias = src.match(/export \{ default \} from '\.\/([\w-]+)\.js';/);
  if (alias) return extract(alias[1], depth + 1);

  const m = src.match(/const __iconNode = (\[[\s\S]*?\]);\n/);
  if (!m) throw new Error('no __iconNode in ' + file);
  // The literal is pure data (arrays, strings, numbers) — safe to evaluate.
  const nodes = new Function('return ' + m[1])();
  return nodes
    .map(([tag, attrs]) => {
      const a = Object.entries(attrs)
        .filter(([k]) => k !== 'key')
        .map(([k, v]) => `${camelToKebab(k)}="${esc(v)}"`)
        .join(' ');
      return `<${tag} ${a}/>`;
    })
    .join('');
}

const entries = Object.entries(ICONS).map(([name, file]) => {
  return `  ${name}: '${extract(file).replace(/'/g, "\\'")}',`;
});

const out = `// AUTO-GENERATED from lucide-react v1.7.0 (ISC licensed) — do not edit by hand.
// Regenerate with scripts/gen-icons.mjs if an icon is added or changed.
//
// Each value is the inner markup of a 24x24 lucide SVG. Rendering these inline
// keeps every icon in the static HTML with zero client-side JavaScript, which
// the old lucide-react components could not do.

export const ICONS = {
${entries.join('\n')}
} as const;

export type IconName = keyof typeof ICONS;
`;

writeFileSync(OUT, out);
console.log('Wrote ' + OUT + ' with ' + entries.length + ' icons');
