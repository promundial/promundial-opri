// api/responses.js — lee todas las respuestas de Airtable
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const BASE_ID = process.env.AIRTABLE_BASE_ID;
const TABLE_NAME = "Responses";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    let all = [], offset = null;
    do {
      const url = new URL(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE_NAME)}`);
      url.searchParams.set("pageSize", "100");
      url.searchParams.set("sort[0][field]", "timestamp");
      url.searchParams.set("sort[0][direction]", "desc");
      if (offset) url.searchParams.set("offset", offset);

      const r = await fetch(url.toString(), {
        headers: { "Authorization": `Bearer ${AIRTABLE_TOKEN}` }
      });
      const data = await r.json();
      if (!r.ok) return res.status(500).json({ error: data.error || "Airtable error" });

      all = all.concat(data.records.map(rec => ({
        id:        rec.fields.response_id,
        survey:    rec.fields.survey,
        timestamp: rec.fields.timestamp,
        meta: {
          company: rec.fields.respondent_company,
          name:    rec.fields.respondent_name,
          level:   rec.fields.respondent_level,
          area:    rec.fields.respondent_area,
          country: rec.fields.respondent_country,
          bu:      rec.fields.respondent_bu,
        },
        answers:   rec.fields.answers_json ? JSON.parse(rec.fields.answers_json) : {},
        scores: {
          opri:       rec.fields.opri_score,
          alignment:  rec.fields.alignment_score,
          execution:  rec.fields.execution_score,
          leadership: rec.fields.leadership_score,
          resilience: rec.fields.resilience_score,
          culture:    rec.fields.culture_score,
          maturity:   rec.fields.maturity_label,
        },
        pai_group: rec.fields.pai_group,
      })));
      offset = data.offset || null;
    } while (offset);

    res.status(200).json({ responses: all, total: all.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
