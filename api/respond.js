// api/respond.js — guarda una respuesta en Airtable
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const BASE_ID = process.env.AIRTABLE_BASE_ID;
const TABLE_NAME = "Responses";

const MATURITY = [
  { min: 0,   max: 2.5,  label: "Crítico" },
  { min: 2.5, max: 3.2,  label: "Vulnerable" },
  { min: 3.2, max: 3.8,  label: "Estable" },
  { min: 3.8, max: 4.3,  label: "Alto Desempeño" },
  { min: 4.3, max: 5.01, label: "World Class" },
];
function getMaturity(s) {
  return (MATURITY.find(m => s >= m.min && s < m.max) || MATURITY[MATURITY.length - 1]).label;
}
function avg(arr) {
  const f = arr.filter(v => v != null);
  return f.length ? f.reduce((a, b) => a + b, 0) / f.length : null;
}

const CORE_DIMS = {
  alignment:  ["A1","A2","A3","A4","A5"],
  execution:  ["E1","E2","E3","E4","E5","E6","E7"],
  leadership: ["L1","L2","L3","L4","L5","L6"],
  resilience: ["R1","R2","R3","R4"],
  culture:    ["C1","C2","C3"],
};
const FULL_DIMS = {
  alignment:  [...CORE_DIMS.alignment,  "SA6","SA7","SA8","SA9","SA10","SA11","SA12"],
  execution:  [...CORE_DIMS.execution,  "EX8","EX9","EX10","EX11","EX12","EX13","EX14","EX15","EX16","EX17","EX18"],
  leadership: [...CORE_DIMS.leadership, "LE7","LE8","LE9","LE10","LE11","LE12","LE13","LE14","LE15"],
  resilience: [...CORE_DIMS.resilience, "RC5","RC6","RC7","RC8","RC9"],
  culture:    [...CORE_DIMS.culture,    "OC4","OC5","OC6"],
};
const WEIGHTS = { alignment: 0.20, execution: 0.30, leadership: 0.25, resilience: 0.15, culture: 0.10 };
const PAI_LEAD = ["Comité Ejecutivo", "Directores/Gerentes"];

function computeScores(answers, survey) {
  const dims = (survey === "full") ? FULL_DIMS : CORE_DIMS;
  const dimScores = {};
  for (const [dim, qids] of Object.entries(dims)) {
    const vals = qids.map(id => answers[id]).filter(v => v != null);
    dimScores[dim] = vals.length ? avg(vals) : null;
  }
  const opri = Object.entries(WEIGHTS).reduce((s, [dim, w]) => s + (dimScores[dim] ?? 0) * w, 0);
  return { opri, ...dimScores };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { id, survey, meta, answers, timestamp } = req.body;
    if (!id || !survey || !meta || !answers) return res.status(400).json({ error: "Missing fields" });

    const isOPRI = survey === "core" || survey === "full";
    const scores = isOPRI ? computeScores(answers, survey) : null;

    const fields = {
      response_id:         id,
      survey:              survey,
      timestamp:           timestamp || new Date().toISOString(),
      respondent_name:     meta.name || "",
      respondent_level:    meta.level || "",
      respondent_area:     meta.area || "",
      respondent_country:  meta.country || "",
      respondent_bu:       meta.bu || "",
      answers_json:        JSON.stringify(answers),
      pai_group:           PAI_LEAD.includes(meta.level) ? "Leadership" : "Organization",
    };

    if (scores) {
      fields.opri_score        = Math.round(scores.opri * 100) / 100;
      fields.alignment_score   = scores.alignment   != null ? Math.round(scores.alignment * 100) / 100 : null;
      fields.execution_score   = scores.execution   != null ? Math.round(scores.execution * 100) / 100 : null;
      fields.leadership_score  = scores.leadership  != null ? Math.round(scores.leadership * 100) / 100 : null;
      fields.resilience_score  = scores.resilience  != null ? Math.round(scores.resilience * 100) / 100 : null;
      fields.culture_score     = scores.culture     != null ? Math.round(scores.culture * 100) / 100 : null;
      fields.maturity_label    = getMaturity(scores.opri);
    }

    // Remove null fields
    Object.keys(fields).forEach(k => { if (fields[k] == null) delete fields[k]; });

    const r = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE_NAME)}`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${AIRTABLE_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ fields })
    });
    const data = await r.json();
    if (!r.ok) return res.status(500).json({ error: data.error || "Airtable error" });
    res.status(200).json({ success: true, recordId: data.id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
