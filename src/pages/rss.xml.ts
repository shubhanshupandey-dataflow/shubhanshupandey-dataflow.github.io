import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { getPosts, getSite, isoDate } from "../lib/content";

/** A feed the old site had no way to produce — useful for syndication and AEO. */
export async function GET(context: APIContext) {
  const brand = await getSite("brand");
  const posts = await getPosts();

  return rss({
    title: `${brand.name} — Accounting & Bookkeeping Insights`,
    description: brand.defaultDescription!,
    site: context.site ?? brand.url!,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.excerpt,
      pubDate: new Date(isoDate(post.data.date)),
      link: `/blogs/${post.id}`,
      categories: [post.data.category],
      author: post.data.author,
    })),
    customData: "<language>en-gb</language>",
  });
}
