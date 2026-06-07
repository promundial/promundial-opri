// api/setup.js — crea las tablas en Airtable si no existen
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const BASE_ID = process.env.AIRTABLE_BASE_ID;

const TABLES = [
  {
    name: "Engagements",
    fields: [
      { name: "engagement_code",  type: "singleLineText" },
      { name: "company",          type: "singleLineText" },
      { name: "consultant",       type: "singleLineText" },
      { name: "status",           type: "singleLineText" },
      { name: "created_at",       type: "dateTime", options: { dateFormat: { name: "iso" }, timeFormat: { name: "24hour" }, timeZone: "America/Guayaquil" } },
      { name: "close_date",       type: "dateTime", options: { dateFormat: { name: "iso" }, timeFormat: { name: "24hour" }, timeZone: "America/Guayaquil" } },
      { name: "response_count",   type: "number", options: { precision: 0 } },
    ]
  },
  {
    name: "Responses",
    fields: [
      { name: "response_id",        type: "singleLineText" },
      { name: "engagement_code",    type: "singleLineText" },
      { name: "survey",             type: "singleLineText" },
      { name: "timestamp",          type: "dateTime", options: { dateFormat: { name: "iso" }, timeFormat: { name: "24hour" }, timeZone: "America/Guayaquil" } },
      { name: "respondent_company", type: "singleLineText" },
      { name: "respondent_name",    type: "singleLineText" },
      { name: "respondent_level",   type: "singleLineText" },
      { name: "respondent_area",    type: "singleLineText" },
      { name: "respondent_country", type: "singleLineText" },
      { name: "respondent_bu",      type: "singleLineText" },
      { name: "answers_json",       type: "multilineText" },
      { name: "opri_score",         type: "number", options: { precision: 2 } },
      { name: "alignment_score",    type: "number", options: { precision: 2 } },
      { name: "execution_score",    type: "number", options: { precision: 2 } },
      { name: "leadership_score",   type: "number", options: { precision: 2 } },
      { name: "resilience_score",   type: "number", options: { precision: 2 } },
      { name: "culture_score",      type: "number", options: { precision: 2 } },
      { name: "maturity_label",     type: "singleLineText" },
      { name: "pai_group",          type: "singleLineText" },
    ]
  }
];

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const secret = req.headers["x-setup-secret"];
  if (secret !== process.env.SETUP_SECRET) return res.status(401).json({ error: "Unauthorized" });

  const results = [];
  for (const table of TABLES) {
    try {
      const r = await fetch(`https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${AIRTABLE_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify(table)
      });
      const data = await r.json();
      if (r.ok) {
        results.push({ table: table.name, status: "created", id: data.id });
      } else if (data.error && data.error.type === "DUPLICATE_TABLE_NAME") {
        results.push({ table: table.name, status: "already_exists" });
      } else {
        results.push({ table: table.name, status: "error", error: data.error });
      }
    } catch (e) {
      results.push({ table: table.name, status: "exception", error: e.message });
    }
  }
  res.json({ results });
}
