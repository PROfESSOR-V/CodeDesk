import path from 'path';
import { pathToFileURL } from 'url';
import { fileURLToPath } from 'url';

/**
 * Dynamically load the scraper function located in scraping2/<platform>.js
 * The scraper file **must** export a default async function that accepts
 * (profileUrl: string) and returns a stats object.
 */
export async function scrapeProfile(platformId, profileUrl) {
  try {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const absPath = path.join(__dirname, '../../scraping2', `${platformId}.js`);
    const scraperUrl = pathToFileURL(absPath).href;

    /**
     * We use dynamic import so that the scraper code (which may pull in heavy
     * dependencies such as puppeteer) is only evaluated on-demand.
     * If the file doesn’t exist or doesn’t have a default export, we fall back
     * to the legacy in-file implementation in platformStats.js
     */
    const mod = await import(scraperUrl);

    if (!mod?.default || typeof mod.default !== 'function') {
      throw new Error(`${platformId}.js does not export a default function`);
    }

    return await mod.default(profileUrl);
  } catch (err) {
    // Propagate so that caller can decide whether to fall back
    throw err;
  }
}
