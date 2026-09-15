import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/**
 * Every word on the site lives in markdown under `src/content/`.
 *
 * In the React app all of this copy was hardcoded inside .tsx components, so
 * changing a headline meant editing JSX and redeploying the bundle. Here:
 *
 *  - repeated items (features, steps, FAQs, blog posts) are one file each,
 *    ordered by `order`;
 *  - one-off copy for a page section lives in `sections/`;
 *  - global chrome (brand, nav, footer) lives in `site/`.
 */

const md = (dir: string) => glob({ pattern: "**/*.md", base: `./src/content/${dir}` });

/**
 * An ISO date ("YYYY-MM-DD"). Decap CMS writes dates unquoted (`date: 2026-09-14`),
 * which the frontmatter YAML parser reads as a Date, so accept both and normalise.
 */
const isoDate = () =>
  z
    .union([z.string(), z.date()])
    .transform((d) => (typeof d === "string" ? d : d.toISOString().slice(0, 10)));

/** True for what the CMS leaves behind when a group of optional fields is cleared. */
const isBlank = (v: unknown): boolean => {
  if (v === undefined || v === null || v === "") return true;
  if (Array.isArray(v)) return v.every(isBlank);
  if (typeof v === "object") return Object.values(v).every(isBlank);
  return false;
};

/** A button or link rendered as a call to action. */
const cta = z.object({
  label: z.string(),
  href: z.string().optional(),
  /** Analytics label sent with the gtag `cta_click` event. */
  event: z.string().optional(),
  style: z.enum(["primary", "secondary", "ghost"]).default("primary"),
  /** Opens the email-capture popup instead of navigating. */
  opensPopup: z.boolean().default(false),
  external: z.boolean().default(false),
});

/** Small eyebrow + heading + optional subheading, shared by most sections. */
const sectionHeader = {
  eyebrow: z.string().optional(),
  heading: z.string().optional(),
  /** Rendered in the brand colour inside the heading, replacing `{accent}`. */
  headingAccent: z.string().optional(),
  subheading: z.string().optional(),
  badge: z.string().optional(),
};

/** A web3forms-backed email or booking form. */
const form = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  placeholder: z.string().optional(),
  submitLabel: z.string(),
  loadingLabel: z.string().default("Sending..."),
  /** Value posted as `source` so submissions can be told apart. */
  source: z.string().optional(),
  note: z.string().optional(),
  successTitle: z.string().optional(),
  successMessage: z.string().optional(),
  errorMessage: z.string().default("Something went wrong. Please try again."),
  connectionErrorMessage: z.string().default("Error connecting to server."),
  fields: z
    .array(
      z.object({
        name: z.string(),
        placeholder: z.string(),
        type: z.enum(["text", "email", "tel"]).default("text"),
        required: z.boolean().default(false),
      })
    )
    .default([]),
});

/** The five rotating product features, with the mock data each panel shows. */
const features = defineCollection({
  loader: md("features"),
  schema: z.object({
    order: z.number(),
    title: z.string(),
    description: z.string(),
    /** Key into the generated icon set. */
    icon: z.string(),
    /** Which visual panel renders for this feature. */
    visual: z.enum(["email", "statements", "categorise", "balance", "alerts"]),

    /** visual: email */
    emails: z
      .array(z.object({ from: z.string(), subject: z.string(), time: z.string() }))
      .default([]),
    emailNote: z.string().optional(),

    /** visual: statements */
    banks: z
      .array(
        z.object({
          name: z.string(),
          client: z.string(),
          date: z.string(),
          transactions: z.number(),
          color: z.string(),
        })
      )
      .default([]),
    bankBadge: z.string().optional(),

    /** visual: categorise */
    transactions: z
      .array(
        z.object({
          name: z.string(),
          category: z.string(),
          amount: z.string(),
          color: z.string(),
        })
      )
      .default([]),

    /** visual: alerts */
    alerts: z
      .array(
        z.object({
          company: z.string(),
          bank: z.string(),
          label: z.string(),
          color: z.string(),
          icon: z.string(),
        })
      )
      .default([]),

    /**
     * visual: balance. Every feature shares one CMS form, so one using another panel
     * can be saved with an empty ledger group; treat that as no ledger.
     */
    ledger: z.preprocess(
      (v) => (isBlank(v) ? undefined : v),
      z
        .object({
          columns: z.array(z.string()),
          rows: z.array(
            z.object({
              account: z.string(),
              debit: z.string().default(""),
              credit: z.string().default(""),
            })
          ),
          footer: z.string(),
        })
        .optional()
    ),
  }),
});

/** The three "how it works" cards. */
const steps = defineCollection({
  loader: md("steps"),
  schema: z.object({
    order: z.number(),
    number: z.string(),
    title: z.string(),
    description: z.string(),
    icon: z.string(),
  }),
});

/** FAQ accordion entries. Body = the answer, which also feeds FAQPage JSON-LD. */
const faqs = defineCollection({
  loader: md("faqs"),
  schema: z.object({
    order: z.number(),
    question: z.string(),
    answer: z.string(),
  }),
});

/** Long-form articles. Body = the post. */
const blog = defineCollection({
  loader: md("blog"),
  schema: z.object({
    order: z.number(),
    title: z.string(),
    excerpt: z.string(),
    coverImage: z.string(),
    category: z.string(),
    /** ISO date — drives both the displayed date and `datePublished`. */
    date: isoDate(),
    readingTime: z.string(),
    author: z.string(),
    seo: z.object({
      title: z.string(),
      description: z.string(),
      ogTitle: z.string(),
      ogDescription: z.string(),
      /** Authoring note describing the intended cover art. */
      suggestedImagePrompt: z.string().optional(),
    }),
    related: z.array(z.string()).default([]),
  }),
});

const sections = defineCollection({
  loader: md("sections"),
  schema: z.object({
    ...sectionHeader,
    ctas: z.array(cta).default([]),
    form: form.optional(),

    /** Page-level SEO for the section that heads a page. */
    pageTitle: z.string().optional(),
    pageDescription: z.string().optional(),

    /** Short reassurance lines, e.g. "No credit card required". */
    trustPoints: z.array(z.string()).default([]),
    /** Generic bullet list (showcase ticks, try-free notes). */
    bullets: z
      .array(z.object({ text: z.string(), tone: z.enum(["brand", "warning"]).default("brand") }))
      .default([]),

    /** topbar: the announcement strip. */
    announcement: z
      .object({
        before: z.string(),
        highlight: z.string(),
        after: z.string(),
        linkLabel: z.string(),
      })
      .optional(),

    /** hero / showcase / popup: headline assembled from parts, so no HTML in copy. */
    headline: z
      .object({
        before: z.string().default(""),
        accent: z.string(),
        after: z.string().default(""),
      })
      .optional(),

    /** showcase: the illustration beside the copy. */
    image: z.object({ alt: z.string() }).optional(),

    /** try-free: uploader copy and limits. */
    uploader: z
      .object({
        dailyLimit: z.number(),
        maxFileSizeMb: z.number(),
        apiBaseUrl: z.string(),
        dropTitle: z.string(),
        dropHint: z.string(),
        submitLabel: z.string(),
        processingLabel: z.string(),
        remainingLabel: z.string(),
        emailPromptLabel: z.string(),
        sendingToLabel: z.string(),
        changeLabel: z.string(),
        invalidTypeError: z.string(),
        tooLargeError: z.string(),
        genericError: z.string(),
        successTitle: z.string(),
        modal: z.object({
          heading: z.string(),
          body: z.string(),
          placeholder: z.string(),
          submitLabel: z.string(),
          invalidEmail: z.string(),
          note: z.string(),
        }),
        limitReached: z.object({
          heading: z.string(),
          body: z.string(),
        }),
      })
      .optional(),
    /** try-free: fallback bank list before the API responds. */
    supportedBanks: z.array(z.string()).default([]),
    panelTitle: z.string().optional(),

    /** book-demo: the pull quote beside the form. */
    testimonial: z.object({ quote: z.string(), stars: z.number().default(5) }).optional(),

    /** email popup: scarcity meter. */
    scarcity: z
      .object({
        totalSpots: z.number(),
        baseSpotsLeft: z.number(),
        minSpotsLeft: z.number(),
        decayStart: isoDate(),
        decayEveryDays: z.number(),
        decayAmount: z.number(),
        /** `{left}` and `{total}` are substituted at runtime. */
        label: z.string(),
        claimedLabel: z.string(),
      })
      .optional(),

    /** blog index: search + empty state. */
    searchPlaceholder: z.string().optional(),
    allCategoriesLabel: z.string().optional(),
    emptyState: z.object({ message: z.string(), action: z.string() }).optional(),

    /** cookie consent: the policy links inside the body copy. */
    links: z.array(z.object({ label: z.string(), href: z.string() })).default([]),
  }),
});

const site = defineCollection({
  loader: md("site"),
  schema: z.object({
    /** brand */
    name: z.string().optional(),
    legalName: z.string().optional(),
    logo: z.string().optional(),
    logoAlt: z.string().optional(),
    favicon: z.string().optional(),
    ogImage: z.string().optional(),
    url: z.string().optional(),
    appUrl: z.string().optional(),
    defaultTitle: z.string().optional(),
    defaultDescription: z.string().optional(),
    /** Posted with every web3forms submission. */
    formAccessKey: z.string().optional(),
    gtmId: z.string().optional(),
    googleAdsId: z.string().optional(),
    /** send_to value for the booking conversion event. */
    bookingConversionLabel: z.string().optional(),
    applicationDescription: z.string().optional(),

    /** navigation + footer */
    links: z.array(z.object({ label: z.string(), href: z.string() })).default([]),
    login: z.object({ label: z.string(), href: z.string() }).optional(),
    cta: cta.optional(),
    copyright: z.string().optional(),
  }),
});

export const collections = { features, steps, faqs, blog, sections, site };
