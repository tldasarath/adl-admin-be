// services/searchConsoleService.js
import fs from "fs";
import path from "path";
import { google } from "googleapis";

/**
 * Parse environment value that may be either:
 *  - a JSON string (starts with '{')
 *  - a relative/absolute file path pointing to a JSON key file
 */
function parseJsonEnv(value) {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (trimmed.startsWith("{")) {
    try {
      return JSON.parse(trimmed);
    } catch (e) {
      throw new Error("GSC service account JSON is invalid: " + e.message);
    }
  }

  // treat as file path
  const tryPath = path.isAbsolute(trimmed) ? trimmed : path.join(process.cwd(), trimmed);
  if (!fs.existsSync(tryPath)) {
    throw new Error(`GSC service account file not found at: ${tryPath}`);
  }
  try {
    const fileContents = fs.readFileSync(tryPath, "utf8");
    return JSON.parse(fileContents);
  } catch (e) {
    throw new Error("Failed reading/parsing GSC service account file: " + e.message);
  }
}

/**
 * Query Search Console for the given site URL and date range.
 *
 * Env variables supported (priority order):
 *   1) GSC_SERVICE_ACCOUNT_JSON  (path or JSON string)
 *   2) GA_SERVICE_ACCOUNT        (legacy in your .env) <-- fallback
 *
 *   1) GSC_SITE_URL              (property URL)
 *   2) WEBSITE_BASE_URL          (legacy in your .env) <-- fallback
 *
 * Usage:
 *   fetchSearchConsoleMetrics({ startDate: '2025-11-01', endDate: '2025-12-10' })
 */
export async function fetchSearchConsoleMetrics({
  startDate,
  endDate,
  siteUrl = process.env.GSC_SITE_URL || process.env.WEBSITE_BASE_URL,
  serviceAccountJson = process.env.GA_SERVICE_ACCOUNT
} = {}) {
  if (!siteUrl) throw new Error("GSC_SITE_URL or WEBSITE_BASE_URL env not set (set to your Search Console property URL).");
  if (!serviceAccountJson) throw new Error("GSC_SERVICE_ACCOUNT_JSON or GA_SERVICE_ACCOUNT env not set (path or JSON for service account).");
  if (!startDate || !endDate) throw new Error("startDate and endDate (YYYY-MM-DD) are required.");

  // parse credentials
  const cred = parseJsonEnv(serviceAccountJson);
  if (!cred || !cred.client_email || !cred.private_key) {
    throw new Error("Service account JSON missing client_email or private_key fields.");
  }

  try {
    // create JWT client
    const jwtClient = new google.auth.JWT({
      email: cred.client_email,
      key: cred.private_key,
      scopes: ["https://www.googleapis.com/auth/webmasters.readonly"]
    });

    // authorize
    await jwtClient.authorize();

    const webmasters = google.webmasters({ version: "v3", auth: jwtClient });

    // build request
    const request = {
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ["date"],
        rowLimit: 10000
      }
    };

    const resp = await webmasters.searchanalytics.query(request);
    const rows = (resp && resp.data && resp.data.rows) || [];

    // Aggregate rows: sum clicks/impressions, weighted average position by impressions
    let clicks = 0;
    let impressions = 0;
    let posWeightedSum = 0;
    let posWeight = 0;

    for (const r of rows) {
      const rc = Number(r.clicks || 0);
      const ri = Number(r.impressions || 0);
      const rp = Number(r.position || 0);
      clicks += rc;
      impressions += ri;
      if (ri > 0) {
        posWeightedSum += rp * ri;
        posWeight += ri;
      }
    }

    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const averagePosition = posWeight > 0 ? posWeightedSum / posWeight : null;

    return {
      clicks: Number(clicks),
      impressions: Number(impressions),
      ctr: Number(Number(ctr).toFixed(4)), // percent
      averagePosition: averagePosition !== null ? Number(Number(averagePosition).toFixed(4)) : null,
      raw: resp && resp.data ? resp.data : null
    };
  } catch (err) {
    const msg = err && err.message ? err.message : String(err);
    console.error("fetchSearchConsoleMetrics error:", msg);
    throw new Error("Search Console query failed: " + msg);
  }
}

export default fetchSearchConsoleMetrics;
