/**
 * One-off migration: the three blog posts lived as TypeScript template literals
 * in `src/data/blogs/*.ts` with their metadata in a separate `index.ts`. This
 * pulls both apart into `src/content/blog/<slug>.md` files.
 *
 * Kept in the repo so the conversion is reproducible/auditable, not because it
 * needs to run again.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const SRC = 'D:/work/dataflow.zone/Ledgerai/src/data/blogs';
const OUT = 'D:/work/dataflow.zone/Ledgerai-astro/src/content/blog';

const POSTS = [
  {
    file: 'tips.ts',
    order: 1,
    slug: 'from-pdf-to-trial-balance-workflow-modern-accountants',
    title: 'From PDF to Trial Balance: A Faster Workflow for Modern Accountants',
    excerpt:
      'Discover how modern accountants automate client data extraction. Convert PDFs, emails, and receipts into a clean, reconciled Trial Balance in minutes.',
    coverImage: '/blogs/pdf-to-trial-balance.jpg',
    category: 'Financial Operations',
    date: '2026-06-25',
    readingTime: '8 min read',
    author: 'Emma Davies, Senior Workflow Consultant',
    seo: {
      title: 'From PDF to Trial Balance: Accounting Workflow Guide',
      description:
        'Discover how modern accountants automate client data extraction. Convert PDFs, emails & receipts to a clean Trial Balance in minutes.',
      ogTitle: 'From PDF to Trial Balance: A Faster Workflow for Accountants',
      ogDescription:
        'Convert raw client PDFs, emails, and receipts to a clean Trial Balance in minutes.',
      suggestedImagePrompt:
        'Modern sleek dual monitor setup in an accounting office, one screen showing a glowing digital PDF document and the other screen displaying a clean visual spreadsheet trial balance.',
    },
    related: [
      'guide-to-bookkeeping-automation-uk-accounting-firms-2026',
      'hidden-cost-manual-bank-statement-processing-uk-firms',
    ],
  },
  {
    file: 'compliance.ts',
    order: 2,
    slug: 'guide-to-bookkeeping-automation-uk-accounting-firms-2026',
    title: 'The Complete Guide to Bookkeeping Automation for UK Accounting Firms (2026)',
    excerpt:
      'Learn how UK accounting firms automate bookkeeping in 2026. Master MTD compliance, AI transaction matching, and scale client capacity without hiring.',
    coverImage: '/blogs/bookkeeping-automation-2026.jpg',
    category: 'Guides & Automation',
    date: '2026-06-18',
    readingTime: '9 min read',
    author: 'Robert Harrison, Chartered Accountant',
    seo: {
      title: 'UK Bookkeeping Automation Guide 2026 | Ledger AI',
      description:
        'Learn how UK accounting firms automate bookkeeping in 2026. Master MTD compliance, AI transaction matching, and client onboarding.',
      ogTitle: 'Guide to Bookkeeping Automation for UK Accounting Firms (2026)',
      ogDescription:
        'Discover how UK accounting firms scale capacity, improve margins, and automate compliance in 2026.',
      suggestedImagePrompt:
        'High-end corporate office workspace in London, large tablet displaying modern automated bookkeeping dashboard with charts, graphs, and UK tax data.',
    },
    related: [
      'from-pdf-to-trial-balance-workflow-modern-accountants',
      'hidden-cost-manual-bank-statement-processing-uk-firms',
    ],
  },
  {
    file: 'difference.ts',
    order: 3,
    slug: 'hidden-cost-manual-bank-statement-processing-uk-firms',
    title: 'The Hidden Cost of Manual Bank Statement Processing for UK Accounting Firms',
    excerpt:
      'Manual bank statement data entry is costing your UK firm. Learn about error rates, security risks, staff burnout, and how to transition to AI extraction.',
    coverImage: '/blogs/manual-statement-cost.jpg',
    category: 'Compliance & Costs',
    date: '2026-06-11',
    readingTime: '7 min read',
    author: 'Sarah Jenkins, Director of Operations',
    seo: {
      title: 'Hidden Cost of Manual Bank Statement Processing',
      description:
        'Manual bank statement data entry is costing your UK firm. Learn about error rates, security risks, staff burnout, and how to automate.',
      ogTitle: 'The Hidden Cost of Manual Bank Statement Processing',
      ogDescription:
        'Find out how manual statement keying drains margins and limits firm capacity, and how to fix it.',
      suggestedImagePrompt:
        'Conceptual visual illustration of business money leak, a stack of paper bank statements on a desk, a clock ticking, and small glowing blue numbers escaping.',
    },
    related: [
      'from-pdf-to-trial-balance-workflow-modern-accountants',
      'guide-to-bookkeeping-automation-uk-accounting-firms-2026',
    ],
  },
];

/** Extract the body of `export const X = \`...\`;`. */
function readBody(file) {
  const src = readFileSync(join(SRC, file), 'utf8');
  const start = src.indexOf('`');
  const end = src.lastIndexOf('`');
  if (start === -1 || end <= start) throw new Error('no template literal in ' + file);
  return src.slice(start + 1, end).trim();
}

/**
 * A `---` directly under a text line is a setext H2 in markdown, not a rule.
 * The source used `---` as a divider, so make sure each is preceded by a blank.
 */
function checkRules(body, file) {
  const lines = body.split('\n');
  lines.forEach((line, i) => {
    if (line.trim() === '---' && i > 0 && lines[i - 1].trim() !== '') {
      console.warn(`  ! ${file}:${i + 1} "---" follows a text line (would become a heading)`);
    }
  });
}

const y = (v) => JSON.stringify(v);

mkdirSync(OUT, { recursive: true });

for (const post of POSTS) {
  const body = readBody(post.file);
  checkRules(body, post.file);

  const fm = [
    '---',
    `order: ${post.order}`,
    `title: ${y(post.title)}`,
    `excerpt: ${y(post.excerpt)}`,
    `coverImage: ${y(post.coverImage)}`,
    `category: ${y(post.category)}`,
    `date: ${y(post.date)}`,
    `readingTime: ${y(post.readingTime)}`,
    `author: ${y(post.author)}`,
    'seo:',
    `  title: ${y(post.seo.title)}`,
    `  description: ${y(post.seo.description)}`,
    `  ogTitle: ${y(post.seo.ogTitle)}`,
    `  ogDescription: ${y(post.seo.ogDescription)}`,
    `  suggestedImagePrompt: ${y(post.seo.suggestedImagePrompt)}`,
    'related:',
    ...post.related.map((r) => `  - ${y(r)}`),
    '---',
    '',
  ].join('\n');

  const target = join(OUT, post.slug + '.md');
  writeFileSync(target, fm + body + '\n');
  console.log(`Wrote ${post.slug}.md (${body.length} chars)`);
}
