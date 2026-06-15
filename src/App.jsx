import { useState, useEffect, useCallback } from "react";

// ── Brand ─────────────────────────────────────────────────────────────────────
const GREEN = "#1B4332";
const GREEN_MID = "#2D6A4F";
const GREEN_LT = "#40916C";
const GOLD = "#C9A84C";
const GOLD_PALE = "#F5EDD0";
const CREAM = "#F8F4EC";
const CREAM_DK = "#EDE6D6";
const CHARCOAL = "#1A1A1A";
const MUTED = "#6B7280";
const MUTED_LT = "#9CA3AF";
const WHITE = "#FFFFFF";
const RED = "#B91C1C";
const AMBER = "#D97706";
const TEAL = "#0F766E";
const BLUE = "#1D4ED8";
const VIOLET = "#7C3AED";
const INDIGO = "#4338CA";
const ORANGE = "#EA580C";

const MATURITY = [
  { min: 0,   max: 2.5,  es: "Crítico",        color: RED },
  { min: 2.5, max: 3.2,  es: "Vulnerable",      color: ORANGE },
  { min: 3.2, max: 3.8,  es: "Estable",         color: AMBER },
  { min: 3.8, max: 4.3,  es: "Alto Desempeño",  color: GREEN_LT },
  { min: 4.3, max: 5.01, es: "World Class",     color: GREEN },
];

const PAI_BANDS = [
  { min: 0,   max: 0.3,  label: "Alta alineación",      color: GREEN },
  { min: 0.3, max: 0.7,  label: "Moderado",             color: AMBER },
  { min: 0.7, max: 1.2,  label: "Riesgo",               color: ORANGE },
  { min: 1.2, max: 99,   label: "Desconexión crítica",  color: RED },
];

function getMaturity(s) {
  return MATURITY.find(m => s >= m.min && s < m.max) || MATURITY[MATURITY.length - 1];
}
function getPAIBand(g) {
  return PAI_BANDS.find(b => g >= b.min && g < b.max) || PAI_BANDS[PAI_BANDS.length - 1];
}
function avg(arr) {
  const f = arr.filter(v => v != null);
  return f.length ? f.reduce((a, b) => a + b, 0) / f.length : null;
}

// ── Question data ─────────────────────────────────────────────────────────────
const CORE_DIMS = [
  { id: "alignment", short: "Alignment", label: "Strategic Alignment", weight: 0.20, color: BLUE, questions: [
    { id: "A1", text: "Entiendo claramente cuáles son las prioridades más importantes de la organización." },
    { id: "A2", text: "Las prioridades organizacionales se comunican de manera consistente." },
    { id: "A3", text: "Mi trabajo contribuye claramente a los objetivos de la organización." },
    { id: "A4", text: "Las diferentes áreas trabajan alineadas hacia objetivos comunes." },
    { id: "A5", text: "La organización evita dispersarse en demasiadas iniciativas simultáneas." },
  ]},
  { id: "execution", short: "Execution", label: "Execution Excellence", weight: 0.30, color: GREEN, questions: [
    { id: "E1", text: "Existe claridad sobre quién es responsable de cada resultado importante." },
    { id: "E2", text: "Los compromisos asumidos suelen cumplirse." },
    { id: "E3", text: "Los problemas se resuelven oportunamente." },
    { id: "E4", text: "Las decisiones importantes se convierten en acciones concretas con rapidez." },
    { id: "E5", text: "Los indicadores de desempeño son utilizados para gestionar y tomar decisiones." },
    { id: "E6", text: "Los mismos problemas rara vez se repiten una y otra vez." },
    { id: "E7", text: "La organización mantiene el enfoque hasta completar las iniciativas importantes." },
  ]},
  { id: "leadership", short: "Leadership", label: "Leadership & Collective Effectiveness", weight: 0.25, color: VIOLET, questions: [
    { id: "L1", text: "Los líderes de la organización actúan como un equipo." },
    { id: "L2", text: "Existe confianza entre los líderes de la organización." },
    { id: "L3", text: "Las decisiones importantes consideran diferentes puntos de vista antes de ser tomadas." },
    { id: "L4", text: "Los desacuerdos se gestionan de manera constructiva." },
    { id: "L5", text: "Los líderes comunican mensajes consistentes." },
    { id: "L6", text: "Los líderes modelan los comportamientos que esperan de los demás." },
  ]},
  { id: "resilience", short: "Resilience", label: "Change & Resilience Capability", weight: 0.15, color: AMBER, questions: [
    { id: "R1", text: "La organización se adapta rápidamente cuando cambian las circunstancias." },
    { id: "R2", text: "Las personas están abiertas a cuestionar formas tradicionales de trabajar." },
    { id: "R3", text: "La organización aprende de sus errores y experiencias." },
    { id: "R4", text: "Los cambios importantes suelen sostenerse en el tiempo." },
  ]},
  { id: "culture", short: "Culture", label: "Organizational Health & Culture", weight: 0.10, color: TEAL, questions: [
    { id: "C1", text: "Existe colaboración efectiva entre áreas y equipos." },
    { id: "C2", text: "Las personas se sienten empoderadas para actuar y tomar decisiones dentro de su ámbito de responsabilidad." },
    { id: "C3", text: "Las personas se sienten responsables por el éxito colectivo de la organización." },
  ]},
];

const EXTRA_Q = {
  alignment: [
    { id: "SA6",  text: "Las decisiones importantes reflejan consistentemente las prioridades estratégicas." },
    { id: "SA7",  text: "Los recursos se reasignan cuando cambian las prioridades." },
    { id: "SA8",  text: "Las personas entienden cómo se relacionan los objetivos de las diferentes áreas." },
    { id: "SA9",  text: "Las iniciativas estratégicas cuentan con patrocinio visible del liderazgo." },
    { id: "SA10", text: "Las prioridades estratégicas permanecen estables el tiempo suficiente para ejecutarse." },
    { id: "SA11", text: "Los conflictos entre objetivos son identificados y resueltos oportunamente." },
    { id: "SA12", text: "La organización comunica claramente qué actividades deben dejar de hacerse." },
  ],
  execution: [
    { id: "EX8",  text: "Los problemas son escalados rápidamente cuando exceden el nivel de autoridad local." },
    { id: "EX9",  text: "Las reuniones de seguimiento generan decisiones y acciones concretas." },
    { id: "EX10", text: "Los equipos utilizan datos para identificar oportunidades de mejora." },
    { id: "EX11", text: "Los indicadores permiten anticipar problemas antes de que ocurran." },
    { id: "EX12", text: "Los procesos clave tienen estándares claramente definidos." },
    { id: "EX13", text: "Las desviaciones respecto a los estándares son visibles rápidamente." },
    { id: "EX14", text: "Las responsabilidades entre áreas están claramente definidas." },
    { id: "EX15", text: "Los proyectos estratégicos cuentan con seguimiento sistemático." },
    { id: "EX16", text: "La organización evita depender de esfuerzos heroicos para alcanzar resultados." },
    { id: "EX17", text: "Las mejoras implementadas suelen mantenerse en el tiempo." },
    { id: "EX18", text: "La organización ejecuta cambios con disciplina y consistencia." },
  ],
  leadership: [
    { id: "LE7",  text: "Los líderes abordan los problemas difíciles en lugar de evitarlos." },
    { id: "LE8",  text: "Las decisiones importantes se toman pensando en el beneficio de la organización." },
    { id: "LE9",  text: "Los líderes fomentan la colaboración entre áreas." },
    { id: "LE10", text: "Los líderes solicitan y consideran retroalimentación." },
    { id: "LE11", text: "Existe coherencia entre lo que los líderes dicen y hacen." },
    { id: "LE12", text: "Los líderes desarrollan activamente a las personas de sus equipos." },
    { id: "LE13", text: "Las fortalezas individuales son aprovechadas de manera efectiva." },
    { id: "LE14", text: "Las reuniones de liderazgo generan claridad y dirección." },
    { id: "LE15", text: "Los líderes actúan con una visión compartida del futuro de la organización." },
  ],
  resilience: [
    { id: "RC5", text: "La organización identifica tempranamente cambios relevantes en su entorno." },
    { id: "RC6", text: "Se realizan pruebas piloto antes de implementar cambios importantes." },
    { id: "RC7", text: "Los errores son utilizados como fuente de aprendizaje." },
    { id: "RC8", text: "Las personas se sienten seguras al proponer nuevas ideas." },
    { id: "RC9", text: "La organización responde eficazmente ante situaciones inesperadas." },
  ],
  culture: [
    { id: "OC4", text: "La información importante fluye de manera abierta y transparente." },
    { id: "OC5", text: "Las personas reciben reconocimiento por contribuciones significativas." },
    { id: "OC6", text: "Existe un equilibrio adecuado entre resultados y bienestar organizacional." },
  ],
};

const FULL_DIMS = CORE_DIMS.map(d => ({
  ...d,
  questions: [...d.questions, ...EXTRA_Q[d.id]],
}));

const DEEP_MODULES = [
  { id: "lei", code: "LEI", name: "Leadership", fullName: "Leadership Effectiveness Index", color: VIOLET, index: "LEI™",
    groups: [
      { label: "Vulnerabilidad & Confianza", qs: [
        { id: "LD1", text: "Los líderes admiten errores cuando ocurren." },
        { id: "LD2", text: "Existe apertura para expresar preocupaciones difíciles." },
        { id: "LD3", text: "Los líderes solicitan ayuda cuando la necesitan." },
      ]},
      { label: "Responsabilidad & Compromisos", qs: [
        { id: "LD4", text: "Los líderes se responsabilizan por los resultados de sus áreas." },
        { id: "LD5", text: "Los compromisos asumidos entre líderes se cumplen." },
        { id: "LD6", text: "Los incumplimientos son abordados de manera directa y constructiva." },
      ]},
      { label: "Calidad de Decisiones", qs: [
        { id: "LD7", text: "Las decisiones importantes se basan en evidencia y análisis." },
        { id: "LD8", text: "Se consideran perspectivas diversas antes de decidir." },
        { id: "LD9", text: "Las decisiones son revisadas posteriormente para aprender de los resultados." },
      ]},
      { label: "Gestión de Conflictos", qs: [
        { id: "LD10", text: "Los desacuerdos son discutidos abiertamente." },
        { id: "LD11", text: "Los conflictos importantes se resuelven oportunamente." },
        { id: "LD12", text: "Las diferencias de opinión mejoran la calidad de las decisiones." },
      ]},
      { label: "Desarrollo de Personas", qs: [
        { id: "LD13", text: "Los líderes desarrollan activamente a futuros líderes." },
        { id: "LD14", text: "Se proporciona retroalimentación útil y frecuente." },
        { id: "LD15", text: "El crecimiento de las personas es una prioridad visible." },
      ]},
      { label: "Comunicación & Coherencia", qs: [
        { id: "LD16", text: "Los líderes comunican expectativas con claridad." },
        { id: "LD17", text: "Existe coherencia en los mensajes de liderazgo." },
        { id: "LD18", text: "Los líderes explican el contexto detrás de las decisiones." },
      ]},
      { label: "Ejemplo & Valores", qs: [
        { id: "LD19", text: "Los líderes modelan los comportamientos esperados." },
        { id: "LD20", text: "Existe coherencia entre valores y acciones." },
        { id: "LD21", text: "Los líderes mantienen sus estándares incluso bajo presión." },
      ]},
      { label: "Liderazgo Colectivo", qs: [
        { id: "LD22", text: "Los líderes colaboran efectivamente entre áreas." },
        { id: "LD23", text: "Los líderes actúan pensando en el beneficio de la organización." },
        { id: "LD24", text: "Existe confianza mutua entre los líderes." },
        { id: "LD25", text: "El liderazgo genera alineación organizacional." },
      ]},
    ],
  },
  { id: "tcs", code: "TCS", name: "Leadership Team", fullName: "Team Cohesion Score", color: INDIGO, index: "TCS™",
    groups: [
      { label: "Alineación Estratégica", qs: [
        { id: "LT1", text: "El equipo directivo comparte una visión común." },
        { id: "LT2", text: "Existe acuerdo sobre las prioridades estratégicas." },
        { id: "LT3", text: "Las decisiones estratégicas son consistentes entre sí." },
      ]},
      { label: "Confianza & Seguridad", qs: [
        { id: "LT4", text: "Los miembros del equipo confían unos en otros." },
        { id: "LT5", text: "Es seguro expresar desacuerdos." },
        { id: "LT6", text: "Las conversaciones difíciles ocurren cuando deben ocurrir." },
      ]},
      { label: "Responsabilidad Mutua", qs: [
        { id: "LT7", text: "Los miembros se responsabilizan mutuamente." },
        { id: "LT8", text: "Los compromisos se monitorean entre pares." },
        { id: "LT9", text: "Los problemas se enfrentan directamente." },
      ]},
      { label: "Calidad de Decisiones", qs: [
        { id: "LT10", text: "El equipo toma decisiones oportunamente." },
        { id: "LT11", text: "Las decisiones son comprendidas por todos." },
        { id: "LT12", text: "El equipo respalda las decisiones una vez tomadas." },
      ]},
      { label: "Debate & Conflicto Productivo", qs: [
        { id: "LT13", text: "Existe debate vigoroso antes de decidir." },
        { id: "LT14", text: "El conflicto es productivo y respetuoso." },
        { id: "LT15", text: "Las diferencias fortalecen las decisiones." },
      ]},
      { label: "Complementariedad", qs: [
        { id: "LT16", text: "El equipo aprovecha diferentes fortalezas." },
        { id: "LT17", text: "Existen perspectivas complementarias." },
        { id: "LT18", text: "Las contribuciones individuales son valoradas." },
      ]},
      { label: "Orientación Colectiva", qs: [
        { id: "LT19", text: "Los miembros evitan optimizar solo sus áreas." },
        { id: "LT20", text: "El equipo prioriza los resultados organizacionales." },
        { id: "LT21", text: "Los mensajes del equipo son consistentes." },
      ]},
      { label: "Efectividad del Equipo", qs: [
        { id: "LT22", text: "El equipo directivo funciona como un solo equipo." },
        { id: "LT23", text: "El equipo genera confianza en la organización." },
        { id: "LT24", text: "El equipo responde eficazmente ante situaciones complejas." },
        { id: "LT25", text: "El desempeño colectivo supera la suma de los desempeños individuales." },
      ]},
    ],
  },
  { id: "eci", code: "ECI", name: "Execution", fullName: "Execution Capability Index", color: GREEN, index: "ECI™",
    groups: [
      { label: "Claridad de Roles", qs: [
        { id: "EXD1", text: "Existen mecanismos claros para tomar decisiones." },
        { id: "EXD2", text: "Las responsabilidades están claramente definidas." },
        { id: "EXD3", text: "Los problemas críticos tienen dueños identificados." },
      ]},
      { label: "Gestión de Indicadores", qs: [
        { id: "EXD4", text: "Los indicadores reflejan prioridades reales." },
        { id: "EXD5", text: "Los resultados son revisados regularmente." },
        { id: "EXD6", text: "Se toman acciones correctivas cuando es necesario." },
      ]},
      { label: "Rutinas de Seguimiento", qs: [
        { id: "EXD7", text: "Existen rutinas de seguimiento efectivas." },
        { id: "EXD8", text: "Los equipos monitorean su desempeño frecuentemente." },
        { id: "EXD9", text: "Los problemas son visibles rápidamente." },
      ]},
      { label: "Decisiones con Datos", qs: [
        { id: "EXD10", text: "Los indicadores son comprendidos por quienes los utilizan." },
        { id: "EXD11", text: "Las metas son claras y realistas." },
        { id: "EXD12", text: "Los indicadores apoyan la toma de decisiones." },
      ]},
      { label: "Resolución de Problemas", qs: [
        { id: "EXD13", text: "Los problemas son analizados en su causa raíz." },
        { id: "EXD14", text: "Se utilizan métodos estructurados para resolver problemas." },
        { id: "EXD15", text: "Los aprendizajes se comparten entre equipos." },
      ]},
      { label: "Escalamiento", qs: [
        { id: "EXD16", text: "Los problemas se escalan oportunamente." },
        { id: "EXD17", text: "Existe claridad sobre cuándo escalar un problema." },
        { id: "EXD18", text: "El escalamiento facilita la resolución." },
      ]},
      { label: "Ejecución de Proyectos", qs: [
        { id: "EXD19", text: "Los proyectos estratégicos avanzan según lo planificado." },
        { id: "EXD20", text: "Los riesgos son identificados tempranamente." },
        { id: "EXD21", text: "Los recursos son suficientes para ejecutar las prioridades." },
      ]},
      { label: "Disciplina Operativa", qs: [
        { id: "EXD22", text: "Las mejoras implementadas se sostienen en el tiempo." },
        { id: "EXD23", text: "Los resultados no dependen de esfuerzos extraordinarios." },
        { id: "EXD24", text: "La disciplina operativa es consistente." },
        { id: "EXD25", text: "La organización ejecuta con confiabilidad." },
      ]},
    ],
  },
  { id: "aci", code: "ACI", name: "Change", fullName: "Adaptive Capability Index", color: AMBER, index: "ACI™",
    groups: [
      { label: "Aprendizaje Organizacional", qs: [
        { id: "CH1", text: "Las personas aprenden rápidamente nuevas habilidades." },
        { id: "CH2", text: "El aprendizaje es valorado y reconocido." },
        { id: "CH3", text: "La organización incorpora aprendizajes en sus prácticas." },
      ]},
      { label: "Cuestionamiento de Supuestos", qs: [
        { id: "CH4", text: "Los supuestos existentes son cuestionados regularmente." },
        { id: "CH5", text: "Las personas pueden desafiar ideas establecidas." },
        { id: "CH6", text: "La organización modifica creencias cuando la evidencia lo justifica." },
      ]},
      { label: "Experimentación", qs: [
        { id: "CH7", text: "Se realizan pruebas antes de grandes implementaciones." },
        { id: "CH8", text: "La experimentación es apoyada por los líderes." },
        { id: "CH9", text: "Los pilotos generan aprendizajes útiles." },
      ]},
      { label: "Innovación", qs: [
        { id: "CH10", text: "Las nuevas ideas son bien recibidas." },
        { id: "CH11", text: "Existe espacio para innovar." },
        { id: "CH12", text: "La organización transforma ideas en acciones." },
      ]},
      { label: "Liderazgo del Cambio", qs: [
        { id: "CH13", text: "Los líderes apoyan activamente el cambio." },
        { id: "CH14", text: "El propósito de los cambios es comunicado claramente." },
        { id: "CH15", text: "Las personas entienden su rol en los procesos de cambio." },
      ]},
      { label: "Resiliencia Organizacional", qs: [
        { id: "CH16", text: "La organización responde bien ante crisis." },
        { id: "CH17", text: "Los contratiempos fortalecen nuestras capacidades." },
        { id: "CH18", text: "La organización se recupera rápidamente de las dificultades." },
        { id: "CH19", text: "La organización anticipa riesgos relevantes." },
        { id: "CH20", text: "La organización prospera en entornos cambiantes." },
      ]},
    ],
  },
  { id: "cei", code: "CEI", name: "Culture", fullName: "Culture Effectiveness Index", color: TEAL, index: "CEI™",
    groups: [
      { label: "Colaboración & Conocimiento", qs: [
        { id: "CU1", text: "Las áreas colaboran efectivamente." },
        { id: "CU2", text: "El conocimiento se comparte libremente." },
        { id: "CU3", text: "Existe apoyo mutuo entre equipos." },
      ]},
      { label: "Comunicación & Transparencia", qs: [
        { id: "CU4", text: "La información importante circula oportunamente." },
        { id: "CU5", text: "La comunicación es abierta y honesta." },
        { id: "CU6", text: "Las personas entienden lo que ocurre en la organización." },
      ]},
      { label: "Empoderamiento", qs: [
        { id: "CU7", text: "Las personas tienen autonomía para actuar." },
        { id: "CU8", text: "Las decisiones se toman cerca del problema." },
        { id: "CU9", text: "La iniciativa es valorada." },
      ]},
      { label: "Reconocimiento", qs: [
        { id: "CU10", text: "Las contribuciones son reconocidas." },
        { id: "CU11", text: "El desempeño sobresaliente recibe visibilidad." },
        { id: "CU12", text: "Las personas sienten que su trabajo es valorado." },
      ]},
      { label: "Seguridad Psicológica", qs: [
        { id: "CU13", text: "Es seguro expresar opiniones diferentes." },
        { id: "CU14", text: "Los errores pueden discutirse sin temor." },
        { id: "CU15", text: "Las personas pueden hacer preguntas difíciles." },
      ]},
      { label: "Orientación a Resultados", qs: [
        { id: "CU16", text: "Los resultados importan." },
        { id: "CU17", text: "Existe responsabilidad colectiva por el desempeño." },
        { id: "CU18", text: "Los estándares son exigentes y claros." },
        { id: "CU19", text: "La organización busca mejorar continuamente." },
        { id: "CU20", text: "Existe orgullo por el trabajo bien hecho." },
      ]},
    ],
  },
];

const LEVELS = ["Comité Ejecutivo", "Directores/Gerentes", "Supervisores", "Colaboradores", "Otros"];
const PAI_LEAD = ["Comité Ejecutivo", "Directores/Gerentes"];
const PAI_ORG  = ["Supervisores", "Colaboradores", "Otros"];
const API_BASE = "";
const ADMIN_PASS_KEY = "opri_admin_pw";

// ── API / Airtable ──────────────────────────────────────────────────────────
async function loadResponses(engCode) {
  try {
    const url = engCode ? "/api/responses?engagement_code=" + engCode : "/api/responses";
    const r = await fetch(url);
    if (!r.ok) return [];
    const data = await r.json();
    return data.responses || [];
  } catch (err) { return []; }
}
async function saveResponse(resp) {
  try {
    await fetch("/api/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(resp),
    });
  } catch (err) { console.error("Save error:", err); }
}
async function apiLoadEngagements(pw) {
  try {
    const r = await fetch("/api/engagements", { headers: { "x-admin-password": pw } });
    if (!r.ok) return null;
    const d = await r.json();
    return d.engagements || [];
  } catch (e) { return null; }
}
async function apiCreateEngagement(pw, payload) {
  try {
    const r = await fetch("/api/engagements", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-password": pw },
      body: JSON.stringify(payload),
    });
    return r.json();
  } catch (e) { return { error: e.message }; }
}
async function apiUpdateEngagement(pw, payload) {
  try {
    const r = await fetch("/api/engagements", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-password": pw },
      body: JSON.stringify(payload),
    });
    return r.json();
  } catch (e) { return { error: e.message }; }
}
async function apiGetEngagement(code) {
  try {
    const r = await fetch("/api/engagements?code=" + code);
    if (!r.ok) return null;
    return r.json();
  } catch (e) { return null; }
}


// ── Scoring ───────────────────────────────────────────────────────────────────
function computeOPRI(responses, dims) {
  if (!responses || responses.length === 0) return null;
  const dimScores = {};
  dims.forEach(function(d) {
    const qids = d.questions.map(function(q) { return q.id; });
    const vals = [];
    responses.forEach(function(r) {
      qids.forEach(function(qid) {
        if (r.answers[qid] != null) vals.push(r.answers[qid]);
      });
    });
    dimScores[d.id] = vals.length > 0 ? avg(vals) : null;
  });
  const opri = dims.reduce(function(sum, d) {
    return sum + (dimScores[d.id] != null ? dimScores[d.id] * d.weight : 0);
  }, 0);
  const lead = responses.filter(function(r) { return PAI_LEAD.indexOf(r.meta.level) >= 0; });
  const org  = responses.filter(function(r) { return PAI_ORG.indexOf(r.meta.level) >= 0; });
  const paiByDim = {};
  dims.forEach(function(d) {
    const qids = d.questions.map(function(q) { return q.id; });
    const lVals = []; lead.forEach(function(r) { qids.forEach(function(qid) { if (r.answers[qid] != null) lVals.push(r.answers[qid]); }); });
    const oVals = []; org.forEach(function(r) { qids.forEach(function(qid) { if (r.answers[qid] != null) oVals.push(r.answers[qid]); }); });
    const ls = lVals.length > 0 ? avg(lVals) : null;
    const os = oVals.length > 0 ? avg(oVals) : null;
    paiByDim[d.id] = { ls: ls, os: os, gap: ls != null && os != null ? Math.abs(ls - os) : null };
  });
  const gapVals = Object.values(paiByDim).map(function(p) { return p.gap; }).filter(function(g) { return g != null; });
  const paiGlobal = gapVals.length > 0 ? avg(gapVals) : null;
  const heatLevel = {};
  LEVELS.forEach(function(lv) {
    const rr = responses.filter(function(r) { return r.meta.level === lv; });
    if (rr.length === 0) { heatLevel[lv] = null; return; }
    const scores = {};
    dims.forEach(function(d) {
      const qids = d.questions.map(function(q) { return q.id; });
      const vals = []; rr.forEach(function(r) { qids.forEach(function(qid) { if (r.answers[qid] != null) vals.push(r.answers[qid]); }); });
      scores[d.id] = vals.length > 0 ? avg(vals) : null;
    });
    heatLevel[lv] = { count: rr.length, scores: scores };
  });
  const areas = [];
  responses.forEach(function(r) { if (r.meta.area && areas.indexOf(r.meta.area) < 0) areas.push(r.meta.area); });
  const heatArea = {};
  areas.forEach(function(area) {
    const rr = responses.filter(function(r) { return r.meta.area === area; });
    const scores = {};
    dims.forEach(function(d) {
      const qids = d.questions.map(function(q) { return q.id; });
      const vals = []; rr.forEach(function(r) { qids.forEach(function(qid) { if (r.answers[qid] != null) vals.push(r.answers[qid]); }); });
      scores[d.id] = vals.length > 0 ? avg(vals) : null;
    });
    heatArea[area] = { count: rr.length, scores: scores };
  });
  return { opri: opri, dimScores: dimScores, paiByDim: paiByDim, paiGlobal: paiGlobal, heatLevel: heatLevel, heatArea: heatArea, n: responses.length };
}

function computeDeep(responses, mod) {
  if (!responses || responses.length === 0) return null;
  const allQs = [];
  mod.groups.forEach(function(g) { g.qs.forEach(function(q) { allQs.push(q); }); });
  const globalVals = [];
  responses.forEach(function(r) { allQs.forEach(function(q) { if (r.answers[q.id] != null) globalVals.push(r.answers[q.id]); }); });
  const globalScore = globalVals.length > 0 ? avg(globalVals) : null;
  const groupScores = {};
  mod.groups.forEach(function(g) {
    const vals = [];
    responses.forEach(function(r) { g.qs.forEach(function(q) { if (r.answers[q.id] != null) vals.push(r.answers[q.id]); }); });
    groupScores[g.label] = vals.length > 0 ? avg(vals) : null;
  });
  return { globalScore: globalScore, groupScores: groupScores, n: responses.length };
}

// ── Cascade logic ─────────────────────────────────────────────────────────────
function checkL2(coreScores) {
  if (!coreScores) return { active: false, reasons: [] };
  const reasons = [];
  if (coreScores.opri < 3.8) reasons.push("OPRI Core " + coreScores.opri.toFixed(2) + " < 3.8");
  CORE_DIMS.forEach(function(d) {
    const s = coreScores.dimScores[d.id];
    if (s != null && s < 3.5) reasons.push(d.short + " " + s.toFixed(2) + " < 3.5");
  });
  if (coreScores.paiGlobal != null && coreScores.paiGlobal > 0.7) {
    reasons.push("PAI " + coreScores.paiGlobal.toFixed(2) + " > 0.7");
  }
  return { active: reasons.length > 0, reasons: reasons };
}

function checkL3(fullScores) {
  if (!fullScores) return { mods: [], fdd: false, reasons: [] };
  const mods = [];
  const reasons = [];
  const ds = fullScores.dimScores;
  if (ds.leadership != null && ds.leadership < 3.5) {
    if (mods.indexOf("lei") < 0) mods.push("lei");
    if (mods.indexOf("tcs") < 0) mods.push("tcs");
    reasons.push("Leadership " + ds.leadership.toFixed(2) + " < 3.5 → LEI™ + TCS™");
  }
  if (ds.execution != null && ds.execution < 3.5) {
    if (mods.indexOf("eci") < 0) mods.push("eci");
    reasons.push("Execution " + ds.execution.toFixed(2) + " < 3.5 → ECI™");
  }
  if (ds.resilience != null && ds.resilience < 3.5) {
    if (mods.indexOf("aci") < 0) mods.push("aci");
    reasons.push("Resilience " + ds.resilience.toFixed(2) + " < 3.5 → ACI™");
  }
  if (ds.culture != null && ds.culture < 3.5) {
    if (mods.indexOf("cei") < 0) mods.push("cei");
    reasons.push("Culture " + ds.culture.toFixed(2) + " < 3.5 → CEI™");
  }
  const nBelow = Object.values(ds).filter(function(s) { return s != null && s < 3.5; }).length;
  let fdd = false;
  if (fullScores.opri < 3.2) { fdd = true; reasons.push("Full Deep Dive: OPRI " + fullScores.opri.toFixed(2) + " < 3.2"); }
  if (fullScores.paiGlobal != null && fullScores.paiGlobal > 1.2) { fdd = true; reasons.push("Full Deep Dive: PAI " + fullScores.paiGlobal.toFixed(2) + " > 1.2"); }
  if (nBelow >= 2) { fdd = true; reasons.push("Full Deep Dive: " + nBelow + " dimensiones < 3.5"); }
  if (fdd) {
    DEEP_MODULES.forEach(function(m) { if (mods.indexOf(m.id) < 0) mods.push(m.id); });
  }
  return { mods: mods, fdd: fdd, reasons: reasons };
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
  label: { display: "block", fontSize: 11, color: MUTED, marginBottom: 5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" },
  input: { width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid " + CREAM_DK, background: WHITE, fontSize: 14, color: CHARCOAL, boxSizing: "border-box", outline: "none", fontFamily: "inherit" },
  th: { padding: "8px 10px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: MUTED, textAlign: "center" },
};

function btn(color, disabled) {
  return { padding: "10px 18px", borderRadius: 8, background: disabled ? CREAM_DK : color, color: disabled ? MUTED_LT : WHITE, border: "none", fontSize: 13, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit", transition: "all 0.15s" };
}

// ── Small UI components ───────────────────────────────────────────────────────
function ScoreBadge({ score, size }) {
  if (score == null) return <span style={{ color: MUTED_LT }}>—</span>;
  const m = getMaturity(score);
  const fs = size === "lg" ? 32 : size === "sm" ? 12 : 16;
  return (
    <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: fs, fontWeight: 600, color: m.color }}>
      {score.toFixed(2)}
    </span>
  );
}

function MaturityPill({ score }) {
  if (score == null) return null;
  const m = getMaturity(score);
  return (
    <span style={{ background: m.color, color: WHITE, fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 99, textTransform: "uppercase" }}>
      {m.es}
    </span>
  );
}

function HeatCell({ score }) {
  if (score == null) {
    return <td style={{ padding: "6px 8px", textAlign: "center", color: MUTED_LT, fontSize: 11 }}>—</td>;
  }
  const m = getMaturity(score);
  return (
    <td style={{ padding: "6px 8px", textAlign: "center", background: m.color + "22", color: m.color, fontWeight: 700, fontSize: 11 }}>
      {score.toFixed(2)}
    </td>
  );
}

function SectionHeader({ title, color }) {
  const c = color || GOLD;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
      <div style={{ width: 3, height: 14, background: c, borderRadius: 2 }} />
      <span style={{ fontSize: 10, color: CHARCOAL, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>{title}</span>
    </div>
  );
}

function SurveyHeader({ title, sub, accent, pct }) {
  const ac = accent || GOLD;
  return (
    <div style={{ background: "linear-gradient(135deg, " + GREEN + ", " + GREEN_MID + ")", padding: "18px 20px 14px", borderBottom: "3px solid " + ac }}>
      <div style={{ fontSize: 9, color: GOLD, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 3 }}>OPRI™ Enterprise</div>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 19, color: WHITE, fontWeight: 600 }}>{title}</div>
      <div style={{ fontSize: 11, color: GOLD_PALE, marginTop: 2 }}>{sub}</div>
      {pct != null && (
        <div style={{ marginTop: 8, height: 3, background: "rgba(255,255,255,0.15)", borderRadius: 99 }}>
          <div style={{ height: "100%", width: pct + "%", background: ac, borderRadius: 99, transition: "width 0.4s" }} />
        </div>
      )}
    </div>
  );
}

function LikertQuestion({ qid, text, value, color, onChange }) {
  return (
    <div style={{ marginBottom: 16, padding: "13px 14px", background: WHITE, borderRadius: 9, border: "1px solid " + CREAM_DK }}>
      <p style={{ fontSize: 13, color: CHARCOAL, marginBottom: 11, lineHeight: 1.5, margin: "0 0 11px 0" }}>
        <span style={{ color: color, fontWeight: 700, marginRight: 6 }}>{qid}</span>{text}
      </p>
      <div style={{ display: "flex", gap: 4 }}>
        {[1, 2, 3, 4, 5].map(function(v) {
          return (
            <button key={v} onClick={function() { onChange(v); }} style={{
              flex: 1, padding: "8px 2px", borderRadius: 6,
              border: value === v ? "2px solid " + color : "1px solid " + CREAM_DK,
              background: value === v ? color + "18" : CREAM,
              color: value === v ? color : MUTED,
              fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            }}>{v}</button>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
        <span style={{ fontSize: 9, color: MUTED_LT }}>1 = Totalmente en desacuerdo</span>
        <span style={{ fontSize: 9, color: MUTED_LT }}>5 = Totalmente de acuerdo</span>
      </div>
    </div>
  );
}

function MetaForm({ onStart, title, subtitle, presetCompany }) {
  const [meta, setMeta] = useState({ company: presetCompany || "", name: "", level: "", area: "", country: "", bu: "" });
  function set(key, val) { setMeta(function(p) { const n = Object.assign({}, p); n[key] = val; return n; }); }
  const canStart = meta.level && meta.company;
  return (
    <div>
      <SurveyHeader title={title} sub={subtitle} />
      <div style={{ padding: "20px 20px 28px", maxWidth: 500, margin: "0 auto" }}>
        <p style={{ fontSize: 13, color: MUTED, marginBottom: 18, lineHeight: 1.6 }}>Complete su información de perfil. Sus respuestas son confidenciales.</p>
        <div style={{ marginBottom: 13 }}>
          <label style={s.label}>Empresa *</label>
          <input value={meta.company} onChange={function(e) { set("company", e.target.value); }} placeholder="Ej. Banco Pichincha" style={s.input} readOnly={!!presetCompany} />
        </div>
        <div style={{ marginBottom: 13 }}>
          <label style={s.label}>Nombre (opcional)</label>
          <input value={meta.name} onChange={function(e) { set("name", e.target.value); }} placeholder="Ej. Juan Pérez" style={s.input} />
        </div>
        <div style={{ marginBottom: 13 }}>
          <label style={s.label}>Nivel organizacional *</label>
          <select value={meta.level} onChange={function(e) { set("level", e.target.value); }} style={Object.assign({}, s.input, { cursor: "pointer" })}>
            <option value="">Seleccionar…</option>
            {LEVELS.map(function(l) { return <option key={l} value={l}>{l}</option>; })}
          </select>
        </div>
        <div style={{ marginBottom: 13 }}>
          <label style={s.label}>Área / Departamento</label>
          <input value={meta.area} onChange={function(e) { set("area", e.target.value); }} placeholder="Ej. Operaciones" style={s.input} />
        </div>
        <div style={{ marginBottom: 13 }}>
          <label style={s.label}>País</label>
          <input value={meta.country} onChange={function(e) { set("country", e.target.value); }} placeholder="Ej. Ecuador" style={s.input} />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={s.label}>Unidad de Negocio</label>
          <input value={meta.bu} onChange={function(e) { set("bu", e.target.value); }} placeholder="Ej. División Retail" style={s.input} />
        </div>
        <button disabled={!canStart} onClick={function() { onStart(meta); }} style={btn(GREEN, !canStart)}>Comenzar →</button>
      </div>
    </div>
  );
}

function DoneScreen({ title, color, onBack, onNew }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 340, gap: 12, padding: 28, textAlign: "center" }}>
      <div style={{ fontSize: 38, color: color }}>✓</div>
      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: color, margin: 0 }}>Respuesta registrada</h2>
      <p style={{ color: MUTED, fontSize: 13, maxWidth: 260 }}>{title} completado.</p>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onBack} style={btn(MUTED, false)}>← Volver</button>
        <button onClick={onNew} style={btn(color, false)}>Nueva encuesta</button>
      </div>
    </div>
  );
}

// ── Meta persistence helpers ──────────────────────────────────────────────────
var META_KEY = "opri_respondent_meta";
var DONE_KEY = "opri_respondent_done";
function loadSavedMeta() {
  try { var v = localStorage.getItem(META_KEY); return v ? JSON.parse(v) : null; } catch (e) { return null; }
}
function saveMeta(meta) {
  try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch (e) {}
}
function clearSavedMeta() {
  try { localStorage.removeItem(META_KEY); localStorage.removeItem(DONE_KEY); } catch (e) {}
}
function loadCompletedSurveys() {
  try { var v = localStorage.getItem(DONE_KEY); return v ? JSON.parse(v) : []; } catch (e) { return []; }
}
function markSurveyDone(surveyId) {
  try {
    var done = loadCompletedSurveys();
    if (done.indexOf(surveyId) < 0) { done.push(surveyId); localStorage.setItem(DONE_KEY, JSON.stringify(done)); }
  } catch (e) {}
}

// ── OPRI Survey (Core & Full) ─────────────────────────────────────────────────
function OPRISurvey({ level, onDone, onBack, engagementCode, presetCompany, inheritedMeta, onMetaSaved }) {
  const isCore = level === "core";
  const dims = isCore ? CORE_DIMS : FULL_DIMS;
  const allQs = [];
  dims.forEach(function(d) { d.questions.forEach(function(q) { allQs.push(q); }); });

  // Use inheritedMeta (passed from parent) or localStorage fallback
  var storedMeta = loadSavedMeta();
  var initialMeta = isCore ? null : (inheritedMeta || storedMeta || null);

  const [meta, setMeta] = useState(initialMeta);
  const [dimIdx, setDimIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    const id = "R_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
    await saveResponse({ id: id, timestamp: new Date().toISOString(), survey: level, meta: meta, answers: answers, engagement_code: engagementCode || "" });
    markSurveyDone(level); // track locally so UI shows "Completado"
    setSaving(false);
    setDone(true);
    onDone();
  }

  function handleStart(m) {
    if (isCore) {
      saveMeta(m); // localStorage fallback
      if (onMetaSaved) onMetaSaved(m); // pass to parent state
    }
    setMeta(m);
  }

  if (done) {
    return <DoneScreen title={isCore ? "OPRI Core 25" : "OPRI Full 60"} color={GREEN} onBack={onBack} onNew={function() { clearSavedMeta(); setMeta(null); setDimIdx(0); setAnswers({}); setDone(false); }} />;
  }
  if (!meta) {
    return <MetaForm title={isCore ? "OPRI Core 25" : "OPRI Full 60"} subtitle={isCore ? "25 preguntas · ~8 min" : "60 preguntas · ~18 min"} onStart={handleStart} presetCompany={presetCompany} />;
  }

  const dim = dims[dimIdx];
  const dimDone = dim.questions.every(function(q) { return answers[q.id] != null; });
  const answered = allQs.filter(function(q) { return answers[q.id] != null; }).length;
  const pct = (answered / allQs.length) * 100;

  return (
    <div>
      <SurveyHeader title={dim.short + " · " + (dimIdx + 1) + "/" + dims.length} sub={dim.label} accent={dim.color} pct={pct} />
      <div style={{ padding: "16px 18px 26px", maxWidth: 560, margin: "0 auto" }}>
        <p style={{ fontSize: 10, color: MUTED_LT, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>{answered}/{allQs.length}</p>
        {dim.questions.map(function(q) {
          return <LikertQuestion key={q.id} qid={q.id} text={q.text} value={answers[q.id]} color={dim.color} onChange={function(v) { setAnswers(function(p) { const n = Object.assign({}, p); n[q.id] = v; return n; }); }} />;
        })}
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          {dimIdx > 0 && <button onClick={function() { setDimIdx(function(i) { return i - 1; }); }} style={btn(MUTED, false)}>← Anterior</button>}
          {dimIdx < dims.length - 1
            ? <button disabled={!dimDone} onClick={function() { setDimIdx(function(i) { return i + 1; }); }} style={btn(dim.color, !dimDone)}>Siguiente →</button>
            : <button disabled={!dimDone || saving} onClick={submit} style={btn(GREEN, !dimDone || saving)}>{saving ? "Guardando…" : "Enviar ✓"}</button>
          }
        </div>
      </div>
    </div>
  );
}

// ── Deep Dive Survey ──────────────────────────────────────────────────────────
function DeepSurvey({ mod, onDone, onBack, engagementCode, inheritedMeta }) {
  const allQs = [];
  mod.groups.forEach(function(g) { g.qs.forEach(function(q) { allQs.push(q); }); });

  // Use inheritedMeta from parent or localStorage fallback
  var storedMeta = loadSavedMeta();
  const [meta, setMeta] = useState(inheritedMeta || storedMeta || null);
  const [groupIdx, setGroupIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    const id = "R_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
    await saveResponse({ id: id, timestamp: new Date().toISOString(), survey: "deep_" + mod.id, meta: meta, answers: answers, engagement_code: engagementCode || "" });
    markSurveyDone("deep_" + mod.id); // track locally so UI shows "Completado"
    setSaving(false);
    setDone(true);
    onDone();
  }

  if (done) {
    return <DoneScreen title={mod.fullName} color={mod.color} onBack={onBack} onNew={function() { clearSavedMeta(); setMeta(null); setGroupIdx(0); setAnswers({}); setDone(false); }} />;
  }
  if (!meta) {
    return <MetaForm title={mod.index + " — " + mod.name} subtitle={mod.fullName + " · " + allQs.length + " preguntas"} onStart={function(m) { saveMeta(m); setMeta(m); }} />;
  }

  const grp = mod.groups[groupIdx];
  const grpDone = grp.qs.every(function(q) { return answers[q.id] != null; });
  const answered = allQs.filter(function(q) { return answers[q.id] != null; }).length;
  const pct = (answered / allQs.length) * 100;

  return (
    <div>
      <SurveyHeader title={grp.label} sub={mod.index + " · " + (groupIdx + 1) + "/" + mod.groups.length} accent={mod.color} pct={pct} />
      <div style={{ padding: "16px 18px 26px", maxWidth: 560, margin: "0 auto" }}>
        <p style={{ fontSize: 10, color: MUTED_LT, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>{answered}/{allQs.length}</p>
        {grp.qs.map(function(q) {
          return <LikertQuestion key={q.id} qid={q.id} text={q.text} value={answers[q.id]} color={mod.color} onChange={function(v) { setAnswers(function(p) { const n = Object.assign({}, p); n[q.id] = v; return n; }); }} />;
        })}
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          {groupIdx > 0 && <button onClick={function() { setGroupIdx(function(i) { return i - 1; }); }} style={btn(MUTED, false)}>← Anterior</button>}
          {groupIdx < mod.groups.length - 1
            ? <button disabled={!grpDone} onClick={function() { setGroupIdx(function(i) { return i + 1; }); }} style={btn(mod.color, !grpDone)}>Siguiente →</button>
            : <button disabled={!grpDone || saving} onClick={submit} style={btn(GREEN, !grpDone || saving)}>{saving ? "Guardando…" : "Enviar ✓"}</button>
          }
        </div>
      </div>
    </div>
  );
}

// ── Cascade Survey Selector ───────────────────────────────────────────────────
function CascadeSelector({ coreScores, fullScores, deepCounts, onSelect }) {
  const l2 = checkL2(coreScores);
  const l3 = checkL3(fullScores);
  const activeMods = DEEP_MODULES.filter(function(m) { return l3.mods.indexOf(m.id) >= 0; });
  const nCore = coreScores ? coreScores.n : 0;
  const nFull = fullScores ? fullScores.n : 0;

  return (
    <div style={{ padding: "20px 18px", maxWidth: 560, margin: "0 auto" }}>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 21, color: GREEN, marginBottom: 3 }}>Aplicar Diagnóstico</div>
      <div style={{ fontSize: 12, color: MUTED, marginBottom: 18 }}>Los módulos se activan automáticamente según los resultados.</div>

      <SurveyCard level="Level 1" badge={nCore > 0 ? nCore + " resp." : "Primer paso"} label="OPRI Core 25" desc="Diagnóstico rápido · 25 preguntas · ~8 min" color={GREEN} status="available" onClick={function() { onSelect({ id: "core" }); }} />

      {nCore === 0 && (
        <SurveyCard level="Level 2" badge="Bloqueado" label="OPRI Full 60" desc="Requiere OPRI Core primero" color={GREEN_MID} status="locked" lockMsg="Complete el OPRI Core 25 para desbloquear este nivel." />
      )}
      {nCore > 0 && !l2.active && (
        <SurveyCard level="Level 2" badge="No requerido" label="OPRI Full 60" desc={"Core " + coreScores.opri.toFixed(2) + " — dentro del umbral"} color={GREEN_MID} status="not_required" lockMsg="Los resultados del Core no activan el Full." />
      )}
      {nCore > 0 && l2.active && (
        <SurveyCard level="Level 2" badge={nFull > 0 ? nFull + " resp." : "Activado"} label="OPRI Full 60" desc="60 preguntas · ~18 min" color={GREEN_MID} status="activated" triggers={l2.reasons.slice(0, 3)} onClick={function() { onSelect({ id: "full" }); }} />
      )}

      {nFull === 0 && l2.active && (
        <div style={{ padding: "11px 13px", background: CREAM_DK, borderRadius: 8, fontSize: 12, color: MUTED, marginTop: 4 }}>
          Los módulos Deep Dive se calcularán una vez completado el OPRI Full 60.
        </div>
      )}
      {nFull > 0 && activeMods.length === 0 && (
        <div style={{ padding: "12px 14px", background: "#DCFCE7", borderRadius: 9, border: "1px solid " + GREEN_LT + "55", marginTop: 8 }}>
          <div style={{ fontSize: 11, color: GREEN, fontWeight: 700, marginBottom: 2 }}>✓ Sin Deep Dive requerido</div>
          <div style={{ fontSize: 12, color: GREEN_MID }}>Los resultados del OPRI Full no activan ningún módulo de diagnóstico profundo.</div>
        </div>
      )}
      {nFull > 0 && activeMods.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 10, color: MUTED, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 7 }}>
            {"Level 3 — Deep Dive" + (l3.fdd ? " · Full Deep Dive activado" : "")}
          </div>
          {activeMods.map(function(m) {
            const qCount = m.groups.reduce(function(sum, g) { return sum + g.qs.length; }, 0);
            const trigger = l3.reasons.find(function(r) { return r.indexOf(m.code) >= 0 || r.indexOf("Full Deep Dive") >= 0; });
            return (
              <SurveyCard key={m.id} level={m.index} badge={deepCounts[m.id] > 0 ? deepCounts[m.id] + " resp." : "Activado"} label={m.fullName} desc={qCount + " preguntas"} color={m.color} status="activated" triggers={trigger ? [trigger] : []} onClick={function() { onSelect({ id: "deep_" + m.id, mod: m }); }} />
            );
          })}
        </div>
      )}
    </div>
  );
}

function SurveyCard({ level, badge, label, desc, color, status, triggers, lockMsg, onClick }) {
  const locked = status === "locked" || status === "not_required";
  const done = status === "done";
  const borderColor = done ? GREEN_LT + "88" : (locked ? CREAM_DK : status === "activated" ? color + "55" : CREAM_DK);
  const bgColor = done ? "#F0FDF4" : (locked ? "#F9F9F7" : WHITE);
  return (
    <div style={{ marginBottom: 7, borderRadius: 10, border: "1px solid " + borderColor, background: bgColor, overflow: "hidden", opacity: locked ? 0.65 : 1 }}>
      <button onClick={(locked || done) ? undefined : onClick} disabled={locked || done} style={{ display: "flex", alignItems: "center", gap: 11, width: "100%", padding: "12px 14px", background: "transparent", border: "none", cursor: (locked || done) ? "default" : "pointer", textAlign: "left", fontFamily: "inherit" }}>
        <div style={{ width: 32, height: 32, borderRadius: 7, background: done ? GREEN_LT + "22" : color + (locked ? "0D" : "18"), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {done ? <span style={{ fontSize: 15 }}>✓</span> : locked ? <span style={{ fontSize: 13 }}>🔒</span> : <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: done ? GREEN : (locked ? MUTED : CHARCOAL), marginBottom: 1 }}>{label}</div>
          <div style={{ fontSize: 11, color: done ? GREEN_LT : MUTED }}>{done ? "Respondido — gracias por su participación" : desc}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2, flexShrink: 0 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: done ? GREEN : (status === "activated" ? color : MUTED), background: (done ? GREEN : (status === "activated" ? color : MUTED)) + "18", padding: "2px 6px", borderRadius: 99, textTransform: "uppercase" }}>{level}</span>
          {badge && <span style={{ fontSize: 9, color: done ? GREEN_LT : MUTED_LT, fontWeight: done ? 700 : 400 }}>{badge}</span>}
        </div>
      </button>
      {!done && status === "activated" && triggers && triggers.length > 0 && (
        <div style={{ padding: "0 14px 10px", display: "flex", flexWrap: "wrap", gap: 4 }}>
          {triggers.map(function(t, i) { return <span key={i} style={{ fontSize: 10, color: color, background: color + "14", padding: "2px 7px", borderRadius: 99, fontWeight: 600 }}>{t}</span>; })}
        </div>
      )}
      {locked && lockMsg && <div style={{ padding: "0 14px 10px", fontSize: 11, color: MUTED, fontStyle: "italic" }}>{lockMsg}</div>}
    </div>
  );
}

// ── Dashboard views ───────────────────────────────────────────────────────────
function OPRIDash({ tag, title, dims, responses }) {
  const rr = responses.filter(function(r) { return r.survey === tag; });
  const sc = computeOPRI(rr, dims);
  if (!sc) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: MUTED_LT }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>◎</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 17, color: MUTED }}>Sin datos aún</div>
        <div style={{ fontSize: 12, marginTop: 4 }}>{"No hay respuestas de " + title + "."}</div>
      </div>
    );
  }
  return (
    <div style={{ padding: "18px 16px", maxWidth: 640, margin: "0 auto" }}>
      <div style={{ background: "linear-gradient(135deg, " + GREEN + ", " + GREEN_MID + ")", borderRadius: 12, padding: "20px", marginBottom: 14, border: "2px solid " + GOLD + "33" }}>
        <div style={{ fontSize: 9, color: GOLD, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>{title + " · OPRI™"}</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 48, color: WHITE, lineHeight: 1, fontWeight: 600 }}>{sc.opri.toFixed(2)}</div>
        <div style={{ marginTop: 6, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <MaturityPill score={sc.opri} />
          <span style={{ color: GOLD_PALE, fontSize: 11 }}>{sc.n + (sc.n !== 1 ? " respondentes" : " respondente")}</span>
        </div>
      </div>
      <div style={{ background: WHITE, borderRadius: 10, padding: "15px", marginBottom: 12, border: "1px solid " + CREAM_DK }}>
        <SectionHeader title="Perfil de Capacidades" />
        {dims.map(function(d) {
          const score = sc.dimScores[d.id];
          const pct = score != null ? ((score - 1) / 4) * 100 : 0;
          return (
            <div key={d.id} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                <div>
                  <span style={{ fontSize: 12, color: CHARCOAL, fontWeight: 500 }}>{d.short}</span>
                  <span style={{ fontSize: 9, color: MUTED_LT, marginLeft: 4 }}>{"(" + (d.weight * 100).toFixed(0) + "%)"}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {score != null && <span style={{ fontSize: 9, color: getMaturity(score).color, fontWeight: 600, textTransform: "uppercase" }}>{getMaturity(score).es}</span>}
                  <ScoreBadge score={score} size="sm" />
                </div>
              </div>
              <div style={{ height: 5, background: CREAM_DK, borderRadius: 99, overflow: "hidden" }}>
                <div style={{ height: "100%", width: pct + "%", background: "linear-gradient(90deg, " + d.color + "55, " + d.color + ")", borderRadius: 99, transition: "width 0.7s" }} />
              </div>
            </div>
          );
        })}
      </div>
      <RespondenteTable responses={rr} dims={dims} />
    </div>
  );
}

function PAIDash({ tag, title, dims, responses }) {
  const rr = responses.filter(function(r) { return r.survey === tag; });
  const sc = computeOPRI(rr, dims);
  if (!sc) return <div style={{ padding: 40, textAlign: "center", color: MUTED_LT }}>Sin datos aún.</div>;
  const lC = rr.filter(function(r) { return PAI_LEAD.indexOf(r.meta.level) >= 0; }).length;
  const oC = rr.filter(function(r) { return PAI_ORG.indexOf(r.meta.level) >= 0; }).length;
  const paiValid = sc.paiGlobal != null && lC > 0 && oC > 0;
  return (
    <div style={{ padding: "18px 16px", maxWidth: 640, margin: "0 auto" }}>
      <div style={{ background: "linear-gradient(135deg, #1e1b4b, #312e81)", borderRadius: 12, padding: "20px", marginBottom: 12, border: "2px solid " + VIOLET + "44" }}>
        <div style={{ fontSize: 9, color: "#A5B4FC", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>{"PAI™ · " + title}</div>
        {paiValid ? (
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 44, color: WHITE, lineHeight: 1 }}>{sc.paiGlobal.toFixed(2)}</div>
            <div style={{ marginTop: 6, display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ background: getPAIBand(sc.paiGlobal).color, color: WHITE, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99 }}>{getPAIBand(sc.paiGlobal).label}</span>
              <span style={{ color: "#C7D2FE", fontSize: 11 }}>{lC + (lC !== 1 ? " líderes" : " líder") + " · " + oC + (oC !== 1 ? " colaboradores" : " colaborador")}</span>
            </div>
          </div>
        ) : (
          <div style={{ color: "#C7D2FE", fontSize: 12, marginTop: 6 }}>Se requieren respuestas de ambos grupos para calcular el PAI.</div>
        )}
      </div>
      {paiValid && (
        <div>
          <div style={{ background: WHITE, borderRadius: 10, overflow: "hidden", border: "1px solid " + CREAM_DK, marginBottom: 12 }}>
            <div style={{ padding: "10px 15px", borderBottom: "1px solid " + CREAM_DK }}><SectionHeader title="Gap por Dimensión" /></div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 400 }}>
                <thead>
                  <tr style={{ background: CREAM }}>
                    <th style={Object.assign({}, s.th, { textAlign: "left" })}>Dimensión</th>
                    <th style={s.th}>Liderazgo</th>
                    <th style={s.th}>Organización</th>
                    <th style={s.th}>GAP</th>
                    <th style={Object.assign({}, s.th, { textAlign: "left" })}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {dims.map(function(d, i) {
                    const p = sc.paiByDim[d.id];
                    const band = p.gap != null ? getPAIBand(p.gap) : null;
                    return (
                      <tr key={d.id} style={{ borderTop: "1px solid " + CREAM_DK, background: i % 2 === 0 ? WHITE : CREAM + "44" }}>
                        <td style={{ padding: "7px 12px", fontSize: 12 }}>{d.short}</td>
                        <td style={{ padding: "7px 9px", textAlign: "center" }}>{p.ls != null ? <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, color: GREEN }}>{p.ls.toFixed(2)}</span> : <span style={{ color: MUTED_LT }}>—</span>}</td>
                        <td style={{ padding: "7px 9px", textAlign: "center" }}>{p.os != null ? <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, color: VIOLET }}>{p.os.toFixed(2)}</span> : <span style={{ color: MUTED_LT }}>—</span>}</td>
                        <td style={{ padding: "7px 9px", textAlign: "center" }}>{p.gap != null ? <span style={{ fontWeight: 700, color: band.color }}>{p.gap.toFixed(2)}</span> : <span style={{ color: MUTED_LT }}>—</span>}</td>
                        <td style={{ padding: "7px 9px" }}>{band ? <span style={{ fontSize: 10, color: band.color, fontWeight: 600 }}>{band.label}</span> : <span style={{ color: MUTED_LT }}>—</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div style={{ background: WHITE, borderRadius: 10, padding: "14px", border: "1px solid " + CREAM_DK }}>
            <SectionHeader title="OPRI × PAI Matrix" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {[
                { label: "Aligned & Capable", sub: "Capacidades fuertes y visión compartida.", color: GREEN, active: sc.opri >= 3.5 && sc.paiGlobal < 0.7 },
                { label: "Capable but Disconnected", sub: "Capacidades fuertes, percepción divergente.", color: AMBER, active: sc.opri >= 3.5 && sc.paiGlobal >= 0.7 },
                { label: "Shared Recognition", sub: "Coinciden en el diagnóstico.", color: BLUE, active: sc.opri < 3.5 && sc.paiGlobal < 0.7 },
                { label: "Fragile & Disconnected", sub: "Brecha + percepciones desalineadas. Crítico.", color: RED, active: sc.opri < 3.5 && sc.paiGlobal >= 0.7 },
              ].map(function(q) {
                return (
                  <div key={q.label} style={{ padding: "10px", borderRadius: 7, background: q.active ? q.color + "18" : CREAM, border: q.active ? "2px solid " + q.color : "1px solid " + CREAM_DK }}>
                    {q.active && <div style={{ fontSize: 8, color: q.color, fontWeight: 700, marginBottom: 2 }}>◆ ACTUAL</div>}
                    <div style={{ fontSize: 11, fontWeight: 600, color: q.active ? q.color : MUTED, marginBottom: 2 }}>{q.label}</div>
                    <div style={{ fontSize: 10, color: MUTED, lineHeight: 1.4 }}>{q.sub}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HeatView({ tag, dims, responses }) {
  const rr = responses.filter(function(r) { return r.survey === tag; });
  const sc = computeOPRI(rr, dims);
  if (!sc) return <div style={{ padding: 40, textAlign: "center", color: MUTED_LT }}>Sin datos aún.</div>;
  const areas = Object.keys(sc.heatArea);
  return (
    <div style={{ padding: "18px 16px", maxWidth: 700, margin: "0 auto" }}>
      <SectionHeader title="Por Nivel Organizacional" />
      <div style={{ overflowX: "auto", marginBottom: 18 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 440 }}>
          <thead>
            <tr style={{ background: GREEN }}>
              <th style={Object.assign({}, s.th, { color: WHITE, textAlign: "left", background: "transparent" })}>Nivel</th>
              <th style={Object.assign({}, s.th, { color: GOLD, background: "transparent" })}>N</th>
              {dims.map(function(d) { return <th key={d.id} style={Object.assign({}, s.th, { color: GOLD_PALE, background: "transparent", fontSize: 9 })}>{d.short}</th>; })}
            </tr>
          </thead>
          <tbody>
            {LEVELS.map(function(lv, i) {
              const h = sc.heatLevel[lv];
              return (
                <tr key={lv} style={{ borderTop: "1px solid " + CREAM_DK, background: i % 2 === 0 ? WHITE : CREAM + "55" }}>
                  <td style={{ padding: "6px 11px", fontSize: 12 }}>{lv}</td>
                  <td style={{ padding: "6px 7px", textAlign: "center", fontSize: 11, color: MUTED }}>{h ? h.count : 0}</td>
                  {dims.map(function(d) { return <HeatCell key={d.id} score={h ? h.scores[d.id] : null} />; })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {areas.length > 0 && (
        <div>
          <SectionHeader title="Por Área" />
          <div style={{ overflowX: "auto", marginBottom: 14 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 440 }}>
              <thead>
                <tr style={{ background: GREEN_MID }}>
                  <th style={Object.assign({}, s.th, { color: WHITE, textAlign: "left", background: "transparent" })}>Área</th>
                  <th style={Object.assign({}, s.th, { color: GOLD, background: "transparent" })}>N</th>
                  {dims.map(function(d) { return <th key={d.id} style={Object.assign({}, s.th, { color: GOLD_PALE, background: "transparent", fontSize: 9 })}>{d.short}</th>; })}
                </tr>
              </thead>
              <tbody>
                {areas.map(function(area, i) {
                  const h = sc.heatArea[area];
                  return (
                    <tr key={area} style={{ borderTop: "1px solid " + CREAM_DK, background: i % 2 === 0 ? WHITE : CREAM + "55" }}>
                      <td style={{ padding: "6px 11px", fontSize: 12 }}>{area}</td>
                      <td style={{ padding: "6px 7px", textAlign: "center", fontSize: 11, color: MUTED }}>{h.count}</td>
                      {dims.map(function(d) { return <HeatCell key={d.id} score={h.scores[d.id]} />; })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {MATURITY.map(function(m) {
          return (
            <div key={m.es} style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: m.color }} />
              <span style={{ fontSize: 10, color: MUTED }}>{m.es}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DeepDash({ mod, responses }) {
  const rr = responses.filter(function(r) { return r.survey === "deep_" + mod.id; });
  const sc = computeDeep(rr, mod);
  if (!sc) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: MUTED_LT }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>◎</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 17, color: MUTED }}>Sin datos aún</div>
        <div style={{ fontSize: 12, marginTop: 4 }}>{"No hay respuestas de " + mod.fullName + "."}</div>
      </div>
    );
  }
  return (
    <div style={{ padding: "18px 16px", maxWidth: 600, margin: "0 auto" }}>
      <div style={{ background: "linear-gradient(135deg, " + mod.color + "EE, " + mod.color + ")", borderRadius: 12, padding: "20px", marginBottom: 12 }}>
        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>{mod.index + " · " + mod.fullName}</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 44, color: WHITE, lineHeight: 1, fontWeight: 600 }}>{sc.globalScore.toFixed(2)}</div>
        <div style={{ marginTop: 6, display: "flex", gap: 8, alignItems: "center" }}>
          <MaturityPill score={sc.globalScore} />
          <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 11 }}>{sc.n + (sc.n !== 1 ? " respondentes" : " respondente")}</span>
        </div>
      </div>
      <div style={{ background: WHITE, borderRadius: 10, padding: "15px", border: "1px solid " + CREAM_DK }}>
        <SectionHeader title="Por Grupo" color={mod.color} />
        {mod.groups.map(function(g) {
          const score = sc.groupScores[g.label];
          const pct = score != null ? ((score - 1) / 4) * 100 : 0;
          return (
            <div key={g.label} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                <span style={{ fontSize: 12, color: CHARCOAL }}>{g.label}</span>
                <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                  {score != null && <span style={{ fontSize: 9, color: getMaturity(score).color, fontWeight: 600, textTransform: "uppercase" }}>{getMaturity(score).es}</span>}
                  <ScoreBadge score={score} size="sm" />
                </div>
              </div>
              <div style={{ height: 5, background: CREAM_DK, borderRadius: 99, overflow: "hidden" }}>
                <div style={{ height: "100%", width: pct + "%", background: "linear-gradient(90deg, " + mod.color + "55, " + mod.color + ")", borderRadius: 99, transition: "width 0.7s" }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RespondenteTable({ responses, dims }) {
  if (!responses || responses.length === 0) return null;
  const allQs = [];
  dims.forEach(function(d) { d.questions.forEach(function(q) { allQs.push(q); }); });
  function overallScore(r) {
    const vals = allQs.map(function(q) { return r.answers[q.id]; }).filter(function(v) { return v != null; });
    return vals.length > 0 ? avg(vals) : null;
  }
  return (
    <div style={{ background: WHITE, borderRadius: 10, overflow: "hidden", border: "1px solid " + CREAM_DK }}>
      <div style={{ padding: "10px 15px", borderBottom: "1px solid " + CREAM_DK }}>
        <div style={{ fontSize: 9, color: MUTED, textTransform: "uppercase", letterSpacing: "0.1em" }}>{"Respondentes (" + responses.length + ")"}</div>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 380 }}>
          <thead>
            <tr style={{ background: CREAM }}>
              <th style={Object.assign({}, s.th, { textAlign: "left" })}>Nombre</th>
              <th style={Object.assign({}, s.th, { textAlign: "left" })}>Nivel</th>
              <th style={Object.assign({}, s.th, { textAlign: "left" })}>Área</th>
              <th style={s.th}>Score</th>
              <th style={s.th}>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {responses.slice().reverse().map(function(r, i) {
              return (
                <tr key={r.id} style={{ borderTop: "1px solid " + CREAM_DK, background: i % 2 === 0 ? WHITE : CREAM + "44" }}>
                  <td style={{ padding: "6px 11px", fontSize: 12 }}>{r.meta.name || "—"}</td>
                  <td style={{ padding: "6px 9px", fontSize: 11, color: MUTED }}>{r.meta.level}</td>
                  <td style={{ padding: "6px 9px", fontSize: 11, color: MUTED }}>{r.meta.area || "—"}</td>
                  <td style={{ padding: "6px 9px", textAlign: "center" }}><ScoreBadge score={overallScore(r)} size="sm" /></td>
                  <td style={{ padding: "6px 9px", textAlign: "center", fontSize: 10, color: MUTED_LT }}>{new Date(r.timestamp).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Results panel with cascade tabs ──────────────────────────────────────────
function CompanySelector({ responses, selected, onSelect }) {
  const companies = [];
  responses.forEach(function(r) {
    if (r.meta && r.meta.company && companies.indexOf(r.meta.company) < 0) {
      companies.push(r.meta.company);
    }
  });
  if (companies.length === 0) return null;
  return (
    <div style={{ padding: "12px 16px", background: WHITE, borderBottom: "1px solid " + CREAM_DK, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <span style={{ fontSize: 11, color: MUTED, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0 }}>Empresa:</span>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <button onClick={function() { onSelect("ALL"); }} style={{ padding: "4px 12px", borderRadius: 99, border: selected === "ALL" ? "2px solid " + GREEN : "1px solid " + CREAM_DK, background: selected === "ALL" ? GREEN + "18" : WHITE, color: selected === "ALL" ? GREEN : MUTED, fontSize: 11, fontWeight: selected === "ALL" ? 700 : 400, cursor: "pointer", fontFamily: "inherit" }}>Todas</button>
        {companies.map(function(c) {
          return (
            <button key={c} onClick={function() { onSelect(c); }} style={{ padding: "4px 12px", borderRadius: 99, border: selected === c ? "2px solid " + GREEN : "1px solid " + CREAM_DK, background: selected === c ? GREEN + "18" : WHITE, color: selected === c ? GREEN : MUTED, fontSize: 11, fontWeight: selected === c ? 700 : 400, cursor: "pointer", fontFamily: "inherit" }}>{c}</button>
          );
        })}
      </div>
    </div>
  );
}

function ResultsPanel({ responses, coreScores, fullScores, l2, l3, activeMods, hideCompanySelector }) {
  const [selectedCompany, setSelectedCompany] = useState("ALL");
  const filteredResponses = selectedCompany === "ALL" ? responses : responses.filter(function(r) { return r.meta && r.meta.company === selectedCompany; });
  const fCoreRR = filteredResponses.filter(function(r) { return r.survey === "core"; });
  const fFullRR = filteredResponses.filter(function(r) { return r.survey === "full"; });
  const fCoreScores = computeOPRI(fCoreRR, CORE_DIMS);
  const fFullScores = computeOPRI(fFullRR, FULL_DIMS);
  const fL2 = checkL2(fCoreScores);
  const fL3 = checkL3(fFullScores);
  const fActiveMods = DEEP_MODULES.filter(function(m) { return fL3.mods.indexOf(m.id) >= 0; });

  const tabs = [
    { id: "core_opri", label: "Core OPRI", sub: "L1" },
    { id: "core_pai",  label: "Core PAI",  sub: "L1" },
    { id: "core_heat", label: "Core Maps", sub: "L1" },
  ];
  if (coreScores && l2.active) {
    tabs.push({ id: "full_opri", label: "Full OPRI", sub: "L2" });
    tabs.push({ id: "full_pai",  label: "Full PAI",  sub: "L2" });
    tabs.push({ id: "full_heat", label: "Full Maps", sub: "L2" });
  }
  fActiveMods.forEach(function(m) { tabs.push({ id: "deep_" + m.id, label: m.index, sub: "L3", mod: m }); });

  const [activeTab, setActiveTab] = useState(tabs[0] ? tabs[0].id : "core_opri");

  function renderContent() {
    if (activeTab === "core_opri") return <OPRIDash tag="core" title="OPRI Core 25" dims={CORE_DIMS} responses={filteredResponses} />;
    if (activeTab === "core_pai")  return <PAIDash  tag="core" title="OPRI Core"    dims={CORE_DIMS} responses={filteredResponses} />;
    if (activeTab === "core_heat") return <HeatView tag="core" dims={CORE_DIMS} responses={filteredResponses} />;
    if (activeTab === "full_opri") return <OPRIDash tag="full" title="OPRI Full 60" dims={FULL_DIMS} responses={filteredResponses} />;
    if (activeTab === "full_pai")  return <PAIDash  tag="full" title="OPRI Full"    dims={FULL_DIMS} responses={filteredResponses} />;
    if (activeTab === "full_heat") return <HeatView tag="full" dims={FULL_DIMS} responses={filteredResponses} />;
    const t = tabs.find(function(t) { return t.id === activeTab; });
    if (t && t.mod) return <DeepDash mod={t.mod} responses={filteredResponses} />;
    return null;
  }

  return (
    <div>
      {!hideCompanySelector && <CompanySelector responses={responses} selected={selectedCompany} onSelect={setSelectedCompany} />}
      <div style={{ padding: "10px 16px", background: WHITE, borderBottom: "1px solid " + CREAM_DK, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <CascadeStatusNode label="Core" score={fCoreScores ? fCoreScores.opri : null} n={fCoreRR.length} color={GREEN} />
        <span style={{ fontSize: 12, color: fL2.active ? AMBER : MUTED_LT }}>{"→"}</span>
        <CascadeStatusNode label="Full" score={fFullScores ? fFullScores.opri : null} n={fFullRR.length} color={GREEN_MID} locked={!fCoreScores || !fL2.active} />
        {fActiveMods.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ fontSize: 12, color: VIOLET }}>{"→"}</span>
            {fActiveMods.map(function(m) { return <span key={m.id} style={{ fontSize: 10, color: m.color, background: m.color + "18", padding: "2px 6px", borderRadius: 99, fontWeight: 700 }}>{m.index}</span>; })}
          </div>
        )}
      </div>
      <div style={{ background: WHITE, borderBottom: "1px solid " + CREAM_DK, overflowX: "auto", display: "flex" }}>
        {tabs.map(function(t) {
          return (
            <button key={t.id} onClick={function() { setActiveTab(t.id); }} style={{ padding: "9px 10px", border: "none", background: "transparent", borderBottom: activeTab === t.id ? "2px solid " + GOLD : "2px solid transparent", color: activeTab === t.id ? GREEN : MUTED, fontSize: 9, fontWeight: activeTab === t.id ? 700 : 400, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap", display: "flex", flexDirection: "column", alignItems: "center", gap: 1, fontFamily: "inherit" }}>
              <span>{t.label}</span>
              <span style={{ fontSize: 8, color: activeTab === t.id ? GOLD : MUTED_LT }}>{t.sub}</span>
            </button>
          );
        })}
      </div>
      {renderContent()}
    </div>
  );
}

function CascadeStatusNode({ label, score, n, color, locked }) {
  return (
    <div style={{ padding: "5px 9px", borderRadius: 6, border: "1px solid " + (locked ? CREAM_DK : color + "44"), background: n > 0 ? color + "0F" : CREAM, minWidth: 52, textAlign: "center" }}>
      <div style={{ fontSize: 9, color: locked ? MUTED_LT : color, fontWeight: 700, textTransform: "uppercase" }}>{label}</div>
      {score != null
        ? <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, color: getMaturity(score).color }}>{score.toFixed(2)}</div>
        : <div style={{ fontSize: 9, color: MUTED_LT }}>{n > 0 ? n + "r" : "—"}</div>
      }
    </div>
  );
}

// ── Home screen ───────────────────────────────────────────────────────────────
function HomeScreen({ responses, coreScores, fullScores, l2, l3, activeMods, deepCounts, onNavigate, onLoadDemo, onClearData }) {
  function stepStatus(which) {
    if (which === "core") return responses.filter(function(r) { return r.survey === "core"; }).length > 0 ? "done" : "pending";
    if (which === "full") {
      if (!coreScores) return "locked";
      if (!l2.active) return "not_required";
      return responses.filter(function(r) { return r.survey === "full"; }).length > 0 ? "done" : "pending";
    }
    return "pending";
  }

  function StepRow({ label, desc, score, n, color, status, subItems }) {
    const icons = { done: "✓", pending: "◌", locked: "🔒", not_required: "○" };
    const colors = { done: color, pending: AMBER, locked: MUTED_LT, not_required: MUTED_LT };
    const ic = colors[status] || MUTED_LT;
    return (
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div style={{ width: 24, height: 24, borderRadius: "50%", background: ic + "22", border: "2px solid " + ic, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: ic, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{icons[status]}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: status === "done" ? color : MUTED, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
              <span style={{ fontSize: 12, color: CHARCOAL }}>{desc}</span>
              {n > 0 && <span style={{ fontSize: 10, color: MUTED }}>{n + " resp."}</span>}
              {score != null && (
                <span>
                  <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 14, color: getMaturity(score).color, fontWeight: 600 }}>{score.toFixed(2)}</span>
                  {" "}
                  <MaturityPill score={score} />
                </span>
              )}
            </div>
            {status === "not_required" && <div style={{ fontSize: 11, color: MUTED, marginTop: 2, fontStyle: "italic" }}>Resultados dentro del umbral.</div>}
          </div>
        </div>
        {subItems && subItems.length > 0 && (
          <div style={{ marginLeft: 34, marginTop: 6 }}>
            {subItems}
          </div>
        )}
      </div>
    );
  }

  const coreN = responses.filter(function(r) { return r.survey === "core"; }).length;
  const fullN  = responses.filter(function(r) { return r.survey === "full"; }).length;

  return (
    <div style={{ padding: "22px 18px", maxWidth: 540, margin: "0 auto" }}>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: GREEN, marginBottom: 4, lineHeight: 1.2 }}>Organizational Performance & Resilience Index</div>
      <div style={{ fontSize: 12, color: MUTED, marginBottom: 20, lineHeight: 1.6 }}>Diagnóstico en cascada · activación automática basada en resultados</div>
      <div style={{ background: WHITE, borderRadius: 11, padding: "16px", border: "1px solid " + CREAM_DK, marginBottom: 18 }}>
        <SectionHeader title="Estado del Diagnóstico" />
        <StepRow label="Level 1" desc="OPRI Core 25" n={coreN} score={coreScores ? coreScores.opri : null} color={GREEN} status={stepStatus("core")} />
        <StepRow label="Level 2" desc="OPRI Full 60" n={fullN} score={fullScores ? fullScores.opri : null} color={GREEN_MID} status={stepStatus("full")}
          subItems={fullN > 0 && activeMods.length === 0 ? [
            <div key="nodp" style={{ padding: "7px 10px", background: "#DCFCE7", borderRadius: 7, fontSize: 11, color: GREEN, border: "1px solid " + GREEN_LT + "44" }}>✓ Sin Deep Dive requerido.</div>
          ] : activeMods.map(function(m) {
            const mN = deepCounts[m.id] || 0;
            const mSc = mN > 0 ? computeDeep(responses.filter(function(r) { return r.survey === "deep_" + m.id; }), m) : null;
            return (
              <StepRow key={m.id} label={m.index} desc={m.fullName} n={mN} score={mSc ? mSc.globalScore : null} color={m.color} status={fullN === 0 ? "locked" : mN > 0 ? "done" : "pending"} />
            );
          })}
        />
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={function() { onNavigate("survey"); }} style={btn(GREEN, false)}>Continuar diagnóstico →</button>
        {responses.length > 0 && <button onClick={function() { onNavigate("results"); }} style={btn(MUTED, false)}>Ver resultados</button>}
      </div>
      {responses.length === 0 && (
        <div style={{ marginTop: 16, padding: "13px 14px", background: WHITE, borderRadius: 10, border: "1px solid " + CREAM_DK }}>
          <div style={{ fontSize: 11, color: MUTED, marginBottom: 8 }}>¿Quieres ver cómo funciona el sistema de cascada? Carga datos de demostración.</div>
          <button onClick={onLoadDemo} style={Object.assign({}, btn(AMBER, false), { fontSize: 12 })}>Cargar datos demo →</button>
        </div>
      )}
      {responses.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <button onClick={onClearData} style={{ background: "none", border: "none", color: MUTED_LT, fontSize: 11, cursor: "pointer", textDecoration: "underline", padding: 0 }}>Limpiar todos los datos</button>
        </div>
      )}
    </div>
  );
}

// ── Admin Panel ──────────────────────────────────────────────────────────────
function AdminLogin({ onAuth }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  async function tryLogin() {
    setLoading(true); setError(false);
    const engs = await apiLoadEngagements(pw);
    if (engs !== null) { onAuth(pw); }
    else { setError(true); }
    setLoading(false);
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: CREAM, padding: 24 }}>
      <div style={{ background: WHITE, borderRadius: 14, padding: "32px 28px", maxWidth: 360, width: "100%", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, color: GREEN, marginBottom: 4 }}>OPRI™ Admin</div>
        <div style={{ fontSize: 12, color: MUTED, marginBottom: 24 }}>Promundial Consulting Group</div>
        <label style={s.label}>Contraseña</label>
        <input type="password" value={pw} onChange={function(e) { setPw(e.target.value); setError(false); }} onKeyDown={function(e) { if (e.key === "Enter") tryLogin(); }} placeholder="••••••••" style={Object.assign({}, s.input, { marginBottom: 8 })} />
        {error && <div style={{ fontSize: 12, color: RED, marginBottom: 8 }}>Contraseña incorrecta.</div>}
        <button onClick={tryLogin} disabled={!pw || loading} style={Object.assign({}, btn(GREEN, !pw || loading), { width: "100%", marginTop: 8 })}>{loading ? "Verificando…" : "Ingresar"}</button>
      </div>
    </div>
  );
}

function AdminPanel({ password, onExit }) {
  const [engagements, setEngagements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ company: "", consultant: "", close_date: "" });
  const [savingNew, setSavingNew] = useState(false);
  const [selectedEng, setSelectedEng] = useState(null);
  const [engResponses, setEngResponses] = useState([]);
  const [loadingResults, setLoadingResults] = useState(false);

  async function reload() {
    setLoading(true);
    const data = await apiLoadEngagements(password);
    if (data) setEngagements(data);
    setLoading(false);
  }
  useEffect(function() { reload(); }, []);

  async function handleCreate() {
    if (!form.company || !form.consultant) return;
    setSavingNew(true);
    const result = await apiCreateEngagement(password, { company: form.company, consultant: form.consultant, close_date: form.close_date || undefined });
    if (result.success) { setForm({ company: "", consultant: "", close_date: "" }); setCreating(false); await reload(); }
    setSavingNew(false);
  }

  async function handleClose(eng) {
    await apiUpdateEngagement(password, { id: eng.id, status: "closed" });
    await reload();
  }

  async function handleReopen(eng) {
    await apiUpdateEngagement(password, { id: eng.id, status: "active" });
    await reload();
  }

  async function viewResults(eng) {
    setSelectedEng(eng);
    setLoadingResults(true);
    const data = await loadResponses(eng.code);
    setEngResponses(data);
    setLoadingResults(false);
  }

  if (selectedEng) {
    const coreRR = engResponses.filter(function(r) { return r.survey === "core"; });
    const fullRR = engResponses.filter(function(r) { return r.survey === "full"; });
    const coreScores = computeOPRI(coreRR, CORE_DIMS);
    const fullScores = computeOPRI(fullRR, FULL_DIMS);
    const l2 = checkL2(coreScores);
    const l3 = checkL3(fullScores);
    const activeMods = DEEP_MODULES.filter(function(m) { return l3.mods.indexOf(m.id) >= 0; });
    return (
      <div style={{ fontFamily: "'Jost', sans-serif", background: CREAM, minHeight: "100vh" }}>
        <style>{"@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Jost:wght@400;500;600;700&display=swap');"}</style>
        <div style={{ background: GREEN, padding: "12px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "2px solid " + GOLD }}>
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: WHITE, fontWeight: 600 }}>{selectedEng.company}</div>
            <div style={{ fontSize: 9, color: GOLD, textTransform: "uppercase", letterSpacing: "0.1em" }}>OPRI™ Resultados · {selectedEng.code}</div>
          </div>
          <button onClick={function() { setSelectedEng(null); setEngResponses([]); }} style={Object.assign({}, btn(MUTED, false), { fontSize: 11 })}>← Volver</button>
        </div>
        {loadingResults ? <div style={{ padding: 40, textAlign: "center", color: MUTED }}>Cargando resultados…</div> : (
          <ResultsPanel responses={engResponses} coreScores={coreScores} fullScores={fullScores} l2={l2} l3={l3} activeMods={activeMods} hideCompanySelector={true} />
        )}
      </div>
    );
  }

  const active = engagements.filter(function(e) { return e.status === "active"; });
  const closed = engagements.filter(function(e) { return e.status === "closed"; });

  return (
    <div style={{ fontFamily: "'Jost', sans-serif", background: CREAM, minHeight: "100vh" }}>
      <style>{"@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Jost:wght@400;500;600;700&display=swap');"}</style>
      <div style={{ background: GREEN, padding: "12px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "2px solid " + GOLD }}>
        <div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: WHITE, fontWeight: 600 }}>OPRI™ Admin</div>
          <div style={{ fontSize: 9, color: GOLD, textTransform: "uppercase", letterSpacing: "0.1em" }}>Promundial Consulting Group</div>
        </div>
        <button onClick={onExit} style={Object.assign({}, btn(MUTED, false), { fontSize: 11 })}>Salir</button>
      </div>

      <div style={{ padding: "22px 18px", maxWidth: 700, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: GREEN }}>Engagements</div>
          <button onClick={function() { setCreating(true); }} style={btn(GREEN, false)}>+ Nuevo engagement</button>
        </div>

        {creating && (
          <div style={{ background: WHITE, borderRadius: 12, padding: "20px", border: "2px solid " + GREEN + "44", marginBottom: 18 }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: GREEN, marginBottom: 16 }}>Nuevo Engagement</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={s.label}>Empresa *</label>
                <input value={form.company} onChange={function(e) { setForm(function(p) { return Object.assign({}, p, { company: e.target.value }); }); }} placeholder="Ej. Banco Pichincha" style={s.input} />
              </div>
              <div>
                <label style={s.label}>Consultor *</label>
                <input value={form.consultant} onChange={function(e) { setForm(function(p) { return Object.assign({}, p, { consultant: e.target.value }); }); }} placeholder="Ej. José Ricardo" style={s.input} />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={s.label}>Fecha de cierre (opcional)</label>
              <input type="date" value={form.close_date} onChange={function(e) { setForm(function(p) { return Object.assign({}, p, { close_date: e.target.value }); }); }} style={s.input} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleCreate} disabled={!form.company || !form.consultant || savingNew} style={btn(GREEN, !form.company || !form.consultant || savingNew)}>{savingNew ? "Creando…" : "Crear engagement"}</button>
              <button onClick={function() { setCreating(false); }} style={btn(MUTED, false)}>Cancelar</button>
            </div>
          </div>
        )}

        {loading ? <div style={{ padding: 32, textAlign: "center", color: MUTED }}>Cargando…</div> : (
          <div>
            {active.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <SectionHeader title={"Activos (" + active.length + ")"} color={GREEN} />
                {active.map(function(eng) { return <EngCard key={eng.id} eng={eng} onClose={handleClose} onResults={viewResults} password={password} onReload={reload} />; })}
              </div>
            )}
            {closed.length > 0 && (
              <div>
                <SectionHeader title={"Cerrados (" + closed.length + ")"} color={MUTED} />
                {closed.map(function(eng) { return <EngCard key={eng.id} eng={eng} onReopen={handleReopen} onResults={viewResults} closed={true} />; })}
              </div>
            )}
            {engagements.length === 0 && (
              <div style={{ padding: 40, textAlign: "center", color: MUTED_LT }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>◎</div>
                <div>No hay engagements aún. Crea el primero.</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EngCard({ eng, onClose, onReopen, onResults, closed, password, onReload }) {
  const surveyUrl = window.location.origin + "/e/" + eng.code;
  const [copied, setCopied] = useState(false);
  function copyLink() {
    navigator.clipboard.writeText(surveyUrl);
    setCopied(true);
    setTimeout(function() { setCopied(false); }, 2000);
  }
  const isExpired = eng.close_date && new Date(eng.close_date) < new Date();
  return (
    <div style={{ background: WHITE, borderRadius: 10, padding: "14px 16px", border: "1px solid " + CREAM_DK, marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: GREEN, fontWeight: 600 }}>{eng.company}</span>
            <span style={{ fontSize: 9, background: closed ? MUTED + "18" : GREEN + "18", color: closed ? MUTED : GREEN, padding: "2px 7px", borderRadius: 99, fontWeight: 700, textTransform: "uppercase" }}>{closed ? "Cerrado" : isExpired ? "Expirado" : "Activo"}</span>
          </div>
          <div style={{ fontSize: 12, color: MUTED, marginBottom: 6 }}>
            Consultor: {eng.consultant} · Código: <span style={{ fontFamily: "monospace", color: CHARCOAL }}>{eng.code}</span> · {eng.response_count || 0} respuestas
          </div>
          {!closed && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 11, color: MUTED_LT, fontFamily: "monospace" }}>{surveyUrl}</span>
              <button onClick={copyLink} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: copied ? GREEN : MUTED }}>{copied ? "✓ Copiado" : "Copiar"}</button>
            </div>
          )}
          {eng.close_date && <div style={{ fontSize: 11, color: MUTED_LT, marginTop: 3 }}>Cierre: {new Date(eng.close_date).toLocaleDateString("es-ES")}</div>}
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button onClick={function() { onResults(eng); }} style={Object.assign({}, btn(BLUE, false), { fontSize: 11, padding: "7px 14px" })}>Ver resultados</button>
          {!closed && <button onClick={function() { onClose(eng); }} style={Object.assign({}, btn(RED, false), { fontSize: 11, padding: "7px 14px" })}>Cerrar</button>}
          {closed && onReopen && <button onClick={function() { onReopen(eng); }} style={Object.assign({}, btn(MUTED, false), { fontSize: 11, padding: "7px 14px" })}>Reabrir</button>}
        </div>
      </div>
    </div>
  );
}

// ── Engagement Survey (public URL /e/:code) ───────────────────────────────────
function EngagementSurveyPage({ code }) {
  const [engagement, setEngagement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSurvey, setActiveSurvey] = useState(null);
  const [responses, setResponses] = useState([]);
  const [savedMeta, setSavedMeta] = useState(null); // persists meta across levels
  const [completedSurveys, setCompletedSurveys] = useState(loadCompletedSurveys()); // tracks what THIS respondent finished

  useEffect(function() {
    async function init() {
      const eng = await apiGetEngagement(code);
      setEngagement(eng);
      if (eng && eng.status === "active") {
        const data = await loadResponses(code);
        setResponses(data);
      }
      setLoading(false);
    }
    init();
  }, [code]);

  async function handleDone() {
    const data = await loadResponses(code);
    setResponses(data);
    setCompletedSurveys(loadCompletedSurveys()); // refresh completion state
    setActiveSurvey(null);
  }

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: CREAM }}><div style={{ textAlign: "center", color: MUTED }}><div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: GREEN, marginBottom: 6 }}>OPRI™</div><div>Cargando…</div></div></div>;

  if (!engagement) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: CREAM, padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 320 }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: GREEN, marginBottom: 8 }}>Encuesta no encontrada</div>
        <div style={{ fontSize: 13, color: MUTED }}>El código de encuesta no existe o ha expirado.</div>
      </div>
    </div>
  );

  const isExpired = engagement.close_date && new Date(engagement.close_date) < new Date();
  if (engagement.status === "closed" || isExpired) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: CREAM, padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 340 }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>✓</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: GREEN, marginBottom: 8 }}>Esta encuesta ha cerrado</div>
        <div style={{ fontSize: 13, color: MUTED }}>Gracias por su participación. Los resultados están siendo procesados por el equipo de Promundial.</div>
      </div>
    </div>
  );

  const coreRR = responses.filter(function(r) { return r.survey === "core"; });
  const fullRR = responses.filter(function(r) { return r.survey === "full"; });
  const coreScores = computeOPRI(coreRR, CORE_DIMS);
  const fullScores = computeOPRI(fullRR, FULL_DIMS);
  const l2 = checkL2(coreScores);
  const l3 = checkL3(fullScores);
  const activeMods = DEEP_MODULES.filter(function(m) { return l3.mods.indexOf(m.id) >= 0; });
  const deepCounts = {};
  DEEP_MODULES.forEach(function(m) { deepCounts[m.id] = responses.filter(function(r) { return r.survey === "deep_" + m.id; }).length; });

  function renderSurvey() {
    if (!activeSurvey) {
      const coreDone = completedSurveys.indexOf("core") >= 0;
      const fullDone = completedSurveys.indexOf("full") >= 0;

      // Determine if the respondent has completed everything required
      const coreOnly = coreDone && !l2.active;
      const fullRequired = l2.active;
      const deepRequired = fullDone && activeMods.length > 0;
      const allDeepDone = deepRequired && activeMods.every(function(m) { return completedSurveys.indexOf("deep_" + m.id) >= 0; });
      const everythingDone = coreOnly || (fullRequired && fullDone && (!deepRequired || allDeepDone));

      if (everythingDone) {
        return (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", padding: "32px 24px", textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: GREEN + "18", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
              <span style={{ fontSize: 30, color: GREEN }}>✓</span>
            </div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, color: GREEN, fontWeight: 600, marginBottom: 10 }}>¡Muchas gracias!</div>
            <div style={{ fontSize: 14, color: MUTED, maxWidth: 320, lineHeight: 1.7, marginBottom: 6 }}>
              {"Su participación en el diagnóstico OPRI™ de " + engagement.company + " ha sido registrada."}
            </div>
            <div style={{ fontSize: 13, color: MUTED_LT, maxWidth: 300, lineHeight: 1.6 }}>
              El equipo de Promundial procesará los resultados y los compartirá con su organización.
            </div>
            <div style={{ marginTop: 24, padding: "10px 18px", background: GOLD_PALE, borderRadius: 8, border: "1px solid " + GOLD + "44" }}>
              <span style={{ fontSize: 11, color: CHARCOAL, letterSpacing: "0.05em" }}>OPRI™ ENTERPRISE EDITION · PROMUNDIAL CONSULTING GROUP</span>
            </div>
          </div>
        );
      }

      return (
        <div style={{ padding: "22px 18px", maxWidth: 540, margin: "0 auto" }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: GREEN, marginBottom: 4 }}>{engagement.company}</div>
          <div style={{ fontSize: 12, color: MUTED, marginBottom: 20 }}>OPRI™ Core Survey · Complete su diagnóstico</div>
          <SurveyCard level="Level 1" badge={coreDone ? "✓ Completado" : (coreRR.length > 0 ? coreRR.length + " resp." : "Iniciar")} label="OPRI Core 25" desc="Diagnóstico rápido · 25 preguntas · ~8 min" color={GREEN} status={coreDone ? "done" : "available"} onClick={coreDone ? undefined : function() { setActiveSurvey({ id: "core" }); }} />
          {coreRR.length > 0 && l2.active && (
            <SurveyCard level="Level 2" badge={fullDone ? "✓ Completado" : (fullRR.length > 0 ? fullRR.length + " resp." : "Activado")} label="OPRI Full 60" desc="60 preguntas · ~18 min" color={GREEN_MID} status={fullDone ? "done" : "activated"} triggers={fullDone ? [] : l2.reasons.slice(0, 2)} onClick={fullDone ? undefined : function() { setActiveSurvey({ id: "full" }); }} />
          )}
          {coreRR.length > 0 && !l2.active && (
            <div style={{ padding: "13px 14px", background: "#DCFCE7", borderRadius: 9, border: "1px solid " + GREEN_LT + "55", marginTop: 8 }}>
              <div style={{ fontSize: 11, color: GREEN, fontWeight: 700, marginBottom: 2 }}>✓ Diagnóstico Core completo</div>
              <div style={{ fontSize: 12, color: GREEN_MID }}>Sus resultados han sido registrados. Gracias por participar.</div>
            </div>
          )}
          {fullRR.length > 0 && activeMods.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 10, color: MUTED, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 7 }}>
                {"Level 3 — Deep Dive" + (l3.fdd ? " · Full Deep Dive activado" : "")}
              </div>
              {activeMods.map(function(m) {
                const deepDone = completedSurveys.indexOf("deep_" + m.id) >= 0;
                const qCount = m.groups.reduce(function(sum, g) { return sum + g.qs.length; }, 0);
                const trigger = l3.reasons.find(function(r) { return r.indexOf(m.code) >= 0 || r.indexOf("Full Deep Dive") >= 0; });
                return (
                  <SurveyCard key={m.id} level={m.index} badge={deepDone ? "✓ Completado" : (deepCounts[m.id] > 0 ? deepCounts[m.id] + " resp." : "Activado")} label={m.fullName} desc={qCount + " preguntas"} color={m.color} status={deepDone ? "done" : "activated"} triggers={deepDone ? [] : (trigger ? [trigger] : [])} onClick={deepDone ? undefined : function() { setActiveSurvey({ id: "deep_" + m.id, mod: m }); }} />
                );
              })}
            </div>
          )}
        </div>
      );
    }
    if (activeSurvey.id === "core") return <OPRISurvey level="core" engagementCode={code} presetCompany={engagement.company} onDone={handleDone} onMetaSaved={setSavedMeta} onBack={function() { setActiveSurvey(null); }} />;
    if (activeSurvey.id === "full") return <OPRISurvey level="full" engagementCode={code} presetCompany={engagement.company} inheritedMeta={savedMeta} onDone={handleDone} onBack={function() { setActiveSurvey(null); }} />;
    if (activeSurvey.mod) return <DeepSurvey mod={activeSurvey.mod} engagementCode={code} inheritedMeta={savedMeta} onDone={handleDone} onBack={function() { setActiveSurvey(null); }} />;
    return null;
  }

  return (
    <div style={{ fontFamily: "'Jost', sans-serif", background: CREAM, minHeight: "100vh", maxWidth: 800, margin: "0 auto" }}>
      <style>{"@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Jost:wght@400;500;600;700&display=swap');"}</style>
      <div style={{ background: GREEN, padding: "12px 18px", borderBottom: "2px solid " + GOLD }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: WHITE, fontWeight: 600 }}>OPRI™</div>
        <div style={{ fontSize: 9, color: GOLD, textTransform: "uppercase", letterSpacing: "0.1em" }}>Enterprise Edition · Promundial</div>
      </div>
      {renderSurvey()}
      <div style={{ padding: "12px", textAlign: "center", borderTop: "1px solid " + CREAM_DK, marginTop: 16 }}>
        <span style={{ fontSize: 9, color: MUTED_LT, letterSpacing: "0.08em" }}>{"OPRI™ ENTERPRISE EDITION · PROMUNDIAL CONSULTING GROUP · " + new Date().getFullYear()}</span>
      </div>
    </div>
  );
}

// ── Demo data generator ──────────────────────────────────────────────────────
function makeDemoAnswers(dims, low) {
  const answers = {};
  dims.forEach(function(d) {
    d.questions.forEach(function(q) {
      answers[q.id] = low ? (2 + Math.floor(Math.random() * 2)) : (4 + Math.floor(Math.random() * 2));
    });
  });
  return answers;
}
function generateDemoData() {
  const lvls = ["Comité Ejecutivo","Directores/Gerentes","Supervisores","Colaboradores","Colaboradores"];
  const areas = ["Operaciones","Comercial","Finanzas","RRHH","TI"];
  const data = [];
  for (let i = 0; i < 5; i++) {
    data.push({ id: "DEMO_" + i, timestamp: new Date(Date.now() - i * 3600000).toISOString(), survey: "core",
      meta: { name: "Demo " + (i + 1), level: lvls[i], area: areas[i], country: "Ecuador", bu: "Corp" },
      answers: makeDemoAnswers(CORE_DIMS, i >= 2) });
  }
  return data;
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  // ── Routing ──────────────────────────────────────────────────────────────────
  const path = typeof window !== "undefined" ? window.location.pathname : "/";
  const engCode = (function() { const m = path.match(/^\/e\/([a-z0-9]+)$/); return m ? m[1] : null; })();
  const [adminPassword, setAdminPassword] = useState(null);
  if (engCode) return <EngagementSurveyPage code={engCode} />;
  if (path === "/admin") {
    if (!adminPassword) return <AdminLogin onAuth={setAdminPassword} />;
    return <AdminPanel password={adminPassword} onExit={function() { setAdminPassword(null); window.history.pushState({}, "", "/"); window.location.reload(); }} />;
  }

  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState("home");
  const [activeSurvey, setActiveSurvey] = useState(null);

  const loadData = useCallback(async function() {
    try {
      const data = await loadResponses();
      setResponses(data);
    } catch (err) {
      setResponses([]);
    }
    setLoading(false);
  }, []);

  async function loadDemoData() {
    const demo = generateDemoData();
    setResponses(demo);
  }
  async function clearData() {
    setResponses([]);
  }

  useEffect(function() { loadData(); }, [loadData]);

  const coreRR  = responses.filter(function(r) { return r.survey === "core"; });
  const fullRR  = responses.filter(function(r) { return r.survey === "full"; });
  const coreScores = computeOPRI(coreRR, CORE_DIMS);
  const fullScores = computeOPRI(fullRR, FULL_DIMS);
  const l2 = checkL2(coreScores);
  const l3 = checkL3(fullScores);
  const activeMods = DEEP_MODULES.filter(function(m) { return l3.mods.indexOf(m.id) >= 0; });
  const deepCounts = {};
  DEEP_MODULES.forEach(function(m) { deepCounts[m.id] = responses.filter(function(r) { return r.survey === "deep_" + m.id; }).length; });

  function handleNavigate(sec) {
    setSection(sec);
    if (sec === "survey") setActiveSurvey(null);
  }

  function renderSurvey() {
    if (!activeSurvey) {
      return <CascadeSelector coreScores={coreScores} fullScores={fullScores} deepCounts={deepCounts} onSelect={function(sv) { setActiveSurvey(sv); }} />;
    }
    if (activeSurvey.id === "core") {
      return <OPRISurvey level="core" onDone={loadData} onBack={function() { setActiveSurvey(null); }} />;
    }
    if (activeSurvey.id === "full") {
      return <OPRISurvey level="full" onDone={loadData} onBack={function() { setActiveSurvey(null); }} />;
    }
    if (activeSurvey.mod) {
      return <DeepSurvey mod={activeSurvey.mod} onDone={loadData} onBack={function() { setActiveSurvey(null); }} engagementCode={""} />;
    }
    return null;
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: CREAM, fontFamily: "sans-serif" }}>
        <div style={{ textAlign: "center", color: MUTED }}>
          <div style={{ fontSize: 24, marginBottom: 8, color: GREEN }}>OPRI™</div>
          <div style={{ fontSize: 13 }}>Cargando…</div>
        </div>
      </div>
    );
  }

  const hasData = responses.length > 0;

  return (
    <div style={{ fontFamily: "'Jost', sans-serif", background: CREAM, minHeight: "100vh", maxWidth: 800, margin: "0 auto" }}>
      <style>{"@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Jost:wght@400;500;600;700&display=swap');"}</style>

      <div style={{ background: GREEN, padding: "12px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, borderBottom: "2px solid " + GOLD }}>
        <div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: WHITE, fontWeight: 600, lineHeight: 1 }}>OPRI™</div>
          <div style={{ fontSize: 9, color: GOLD, textTransform: "uppercase", letterSpacing: "0.1em" }}>Enterprise Edition · Promundial</div>
        </div>
        {coreScores && (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 19, color: WHITE }}>{coreScores.opri.toFixed(2)}</div>
            <div style={{ fontSize: 9, color: getMaturity(coreScores.opri).color, fontWeight: 700, textTransform: "uppercase" }}>{getMaturity(coreScores.opri).es}</div>
          </div>
        )}
      </div>

      <div style={{ background: WHITE, borderBottom: "1px solid " + CREAM_DK, display: "flex" }}>
        {[{ id: "home", icon: "⌂", label: "Inicio" }, { id: "survey", icon: "✎", label: "Diagnóstico" }, { id: "results", icon: "◈", label: "Resultados" }].map(function(t) {
          return (
            <button key={t.id} onClick={function() { handleNavigate(t.id); }} style={{ flex: 1, padding: "11px 4px", border: "none", background: "transparent", borderBottom: section === t.id ? "3px solid " + GOLD : "3px solid transparent", color: section === t.id ? GREEN : MUTED, fontSize: 11, fontWeight: section === t.id ? 700 : 500, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, fontFamily: "inherit" }}>
              <span style={{ fontSize: 14 }}>{t.icon}</span>
              {t.label}
            </button>
          );
        })}
      </div>

      {section === "home" && (
        <HomeScreen responses={responses} coreScores={coreScores} fullScores={fullScores} l2={l2} l3={l3} activeMods={activeMods} deepCounts={deepCounts} onNavigate={handleNavigate} onLoadDemo={loadDemoData} onClearData={clearData} />
      )}
      {section === "survey" && renderSurvey()}
      {section === "results" && (
        <ResultsPanel responses={responses} coreScores={coreScores} fullScores={fullScores} l2={l2} l3={l3} activeMods={activeMods} />
      )}

      <div style={{ padding: "12px", textAlign: "center", borderTop: "1px solid " + CREAM_DK, marginTop: 16 }}>
        <span style={{ fontSize: 9, color: MUTED_LT, letterSpacing: "0.08em" }}>{"OPRI™ ENTERPRISE EDITION · PROMUNDIAL CONSULTING GROUP · " + new Date().getFullYear()}</span>
      </div>
    </div>
  );
}
