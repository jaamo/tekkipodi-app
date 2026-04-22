import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "./prisma";

async function summarize(title: string | null, textContent: string) {
  const anthropic = new Anthropic();
  const titleLine = title ? `Otsikko: ${title}\n\n` : "";
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: `Tee tiivistelmä tästä artikkelista podcast-tutkimusmuistiinpanoa varten suomeksi. Keskity keskeisiin väitteisiin, kiinnostaviin näkökulmiin ja keskustelun arvoisiin pointteihin. Pidä tiivistelmä lyhyenä (3-5 bulletpointia). Vastaa aina suomeksi riippumatta artikkelin kielestä. Käytä markdown-muotoilua. Aloita listat markdown-syntaksilla - -merkillä.\n\n${titleLine}${textContent.slice(0, 20000)}`,
      },
    ],
  });

  return message.content[0].type === "text" ? message.content[0].text : "";
}

export async function crawlAndSummarize(linkId: string, url: string) {
  try {
    await prisma.link.update({
      where: { id: linkId },
      data: { crawlStatus: "crawling" },
    });

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; TekkipodiBot/1.0)",
      },
    });
    const html = await response.text();
    const dom = new JSDOM(html, { url });
    const article = new Readability(dom.window.document).parse();

    if (!article || !article.textContent) {
      await prisma.link.update({
        where: { id: linkId },
        data: { crawlStatus: "failed", title: "Could not extract article" },
      });
      return;
    }

    const summary = await summarize(article.title ?? null, article.textContent);

    await prisma.link.update({
      where: { id: linkId },
      data: {
        title: article.title || null,
        summary,
        rawContent: article.textContent.slice(0, 20000),
        crawlStatus: "done",
      },
    });
  } catch (error) {
    console.error(`Crawl failed for ${url}:`, error);
    await prisma.link.update({
      where: { id: linkId },
      data: { crawlStatus: "failed" },
    });
  }
}

export async function summarizeManualContent(linkId: string, content: string) {
  try {
    await prisma.link.update({
      where: { id: linkId },
      data: { crawlStatus: "crawling" },
    });

    const link = await prisma.link.findUnique({ where: { id: linkId } });
    const summary = await summarize(link?.title ?? null, content);

    await prisma.link.update({
      where: { id: linkId },
      data: {
        summary,
        rawContent: content.slice(0, 20000),
        crawlStatus: "done",
      },
    });
  } catch (error) {
    console.error(`Manual summarize failed for link ${linkId}:`, error);
    await prisma.link.update({
      where: { id: linkId },
      data: { crawlStatus: "failed" },
    });
  }
}
