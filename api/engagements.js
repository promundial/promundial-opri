// api/engagements.js — CRUD de engagements
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const BASE_ID = process.env.AIRTABLE_BASE_ID;
const TABLE = "Engagements";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "promundial2026";

function authCheck(req) {
  return req.headers["x-admin-password"] === ADMIN_PASSWORD;
}

async function airtable(method, path, body) {
  const r = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}${path || ""}`, {
    method, headers: { "Authorization": `Bearer ${AIRTABLE_TOKEN}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return r.json();
}

function genCode(company) {
  const base = company.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 6);
  const suffix = Math.random().toString(36).slice(2, 5);
  return base + suffix;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-admin-password");
  if (req.method === "OPTIONS") return res.status(200).end();

  // GET /api/engagements?code=xxx — public, get single engagement by code
  if (req.method === "GET" && req.query.code) {
    const code = req.query.code;
    const data = await airtable("GET", `?filterByFormula=engagement_code%3D%22${code}%22`);
    if (!data.records || data.records.length === 0) return res.status(404).json({ error: "Not found" });
    const r = data.records[0];
    return res.json({
      id: r.id,
      code: r.fields.engagement_code,
      company: r.fields.company,
      consultant: r.fields.consultant,
      status: r.fields.status,
      close_date: r.fields.close_date,
      response_count: r.fields.response_count || 0,
      survey_password: r.fields.survey_password || null,
    });
  }

  // GET /api/engagements — admin, list all
  if (req.method === "GET") {
    if (!authCheck(req)) return res.status(401).json({ error: "Unauthorized" });
    let all = [], offset = null;
    do {
      const url = offset ? `?offset=${offset}&sort[0][field]=created_at&sort[0][direction]=desc` : `?sort[0][field]=created_at&sort[0][direction]=desc`;
      const data = await airtable("GET", url);
      all = all.concat(data.records || []);
      offset = data.offset || null;
    } while (offset);
    return res.json({ engagements: all.map(r => ({
      id: r.id,
      code: r.fields.engagement_code,
      company: r.fields.company,
      consultant: r.fields.consultant,
      status: r.fields.status,
      created_at: r.fields.created_at,
      close_date: r.fields.close_date,
      response_count: r.fields.response_count || 0,
      survey_password: r.fields.survey_password || null,
    }))});
  }

  // POST /api/engagements — admin, create
  if (req.method === "POST") {
    if (!authCheck(req)) return res.status(401).json({ error: "Unauthorized" });
    const { company, consultant, close_date, survey_password } = req.body;
    if (!company || !consultant) return res.status(400).json({ error: "company and consultant required" });
    const code = genCode(company);
    const fields = {
      engagement_code: code,
      company,
      consultant,
      status: "active",
      created_at: new Date().toISOString(),
    };
    if (close_date) fields.close_date = close_date;
    if (survey_password) fields.survey_password = survey_password;
    const data = await airtable("POST", "", { fields });
    if (data.error) return res.status(500).json({ error: data.error });
    return res.json({ success: true, code, id: data.id });
  }

  // PATCH /api/engagements — admin, update status or close_date
  if (req.method === "PATCH") {
    if (!authCheck(req)) return res.status(401).json({ error: "Unauthorized" });
    const { id, status, close_date, survey_password } = req.body;
    if (!id) return res.status(400).json({ error: "id required" });
    const fields = {};
    if (status) fields.status = status;
    if (close_date !== undefined) fields.close_date = close_date;
    if (survey_password !== undefined) fields.survey_password = survey_password;
    const data = await airtable("PATCH", `/${id}`, { fields });
    if (data.error) return res.status(500).json({ error: data.error });
    return res.json({ success: true });
  }

  res.status(405).json({ error: "Method not allowed" });
}
