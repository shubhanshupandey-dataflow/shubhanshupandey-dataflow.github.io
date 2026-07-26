import { getCollection, getEntry, type CollectionEntry } from "astro:content";

/** Collections that are one-file-per-item and render in `order`. */
export async function getOrdered<C extends "features" | "steps" | "faqs" | "blog">(
  collection: C
): Promise<CollectionEntry<C>[]> {
  const entries = await getCollection(collection);
  return (entries as { data: { order: number } }[])
    .slice()
    .sort((a, b) => a.data.order - b.data.order) as unknown as CollectionEntry<C>[];
}

/** Copy for one page section. Fails the build early if the file is missing. */
export async function getSection(id: string) {
  const entry = await getEntry("sections", id);
  if (!entry) throw new Error(`Missing content file: src/content/sections/${id}.md`);
  return entry.data;
}

/** Global chrome: brand, navigation, footer. */
export async function getSite(id: "brand" | "navigation" | "footer") {
  const entry = await getEntry("site", id);
  if (!entry) throw new Error(`Missing content file: src/content/site/${id}.md`);
  return entry.data;
}

/** Posts in reading order (matches the old `blogPosts` array order). */
export async function getPosts() {
  return getOrdered("blog");
}

/** "2026-06-25" -> "25 June 2026", matching the old hand-written dates. */
export function formatDate(date: string): string {
  return new Date(date + "T00:00:00Z").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** "2026-06-25" -> "2026-06-25T10:00:00+00:00" for `datePublished`. */
export function isoDate(date: string): string {
  return `${date}T10:00:00+00:00`;
}

/** Replaces `{token}` placeholders in authored copy. */
export function fill(text: string, vars: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (match, key) =>
    key in vars ? String(vars[key]) : match
  );
}

/** Absolute URL for canonical tags and structured data. */
export function absolute(path: string, site = "https://ledgerai.backoffice.digital"): string {
  if (/^https?:\/\//.test(path)) return path;
  return site.replace(/\/$/, "") + (path.startsWith("/") ? path : "/" + path);
}

/** "Emma Davies, Senior Workflow Consultant" -> "Emma Davies" */
export function authorName(author: string): string {
  return author.split(",")[0].trim();
}
