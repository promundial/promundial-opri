export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { engagement_code, tokens, duration_sec } = req.body || {};
  if (!engagement_code) return res.status(400).json({ error: "Missing engagement_code" });

  const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
  const AIRTABLE_BASE  = process.env.AIRTABLE_BASE  || "appssQnoW5tndOZT7";
  const AIRTABLE_TABLE = process.env.AIRTABLE_TABLE || "tblP1wjtxXlUSA7ZG";

  if (!AIRTABLE_TOKEN) return res.status(500).json({ error: "AIRTABLE_TOKEN not set" });

  try {
    // 1. Find the record for this engagement_code
    const searchUrl =
      `https://api.airtable.com/v0/${AIRTABLE_BASE}/${AIRTABLE_TABLE}` +
      `?filterByFormula=${encodeURIComponent(`{engagement_code}='${engagement_code}'`)}` +
      `&fields[]=engagement_code&fields[]=report_count`;

    const searchResp = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` }
    });
    const searchData = await searchResp.json();

    if (!searchData.records || searchData.records.length === 0) {
      return res.status(404).json({ error: "Engagement not found" });
    }

    const rec = searchData.records[0];
    const prevCount = rec.fields?.report_count || 0;

    // 2. PATCH the record
    const patchResp = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE}/${AIRTABLE_TABLE}/${rec.id}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${AIRTABLE_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fields: {
            report_count: prevCount + 1,
            last_report_tokens: tokens || 0,
            last_report_duration_sec: duration_sec || 0
          }
        })
      }
    );

    const patchData = await patchResp.json();
    return res.status(200).json({ ok: true, record: patchData.id });
  } catch (err) {
    console.error("track-report error:", err);
    return res.status(500).json({ error: String(err) });
  }
}
