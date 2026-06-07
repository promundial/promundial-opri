# OPRI™ Enterprise — Promundial

Organizational Performance & Resilience Index — sistema de diagnóstico en cascada (3 niveles, 7 índices).

## Stack
- **Frontend:** React + Vite
- **Backend:** Vercel Serverless Functions
- **Base de datos:** Airtable

## Estructura
```
promundial-opri/
├── api/
│   ├── setup.js        # Crea tablas en Airtable (ejecutar una vez)
│   ├── respond.js      # POST — guarda una respuesta
│   └── responses.js    # GET  — lee todas las respuestas
├── src/
│   ├── App.jsx         # App completo (encuesta + dashboards)
│   └── main.jsx        # Entry point
├── index.html
├── vite.config.js
├── vercel.json
└── package.json
```

## Variables de entorno (Vercel)
```
AIRTABLE_TOKEN=pat...
AIRTABLE_BASE_ID=app...
SETUP_SECRET=clave_segura_para_setup
ALLOWED_ORIGIN=https://promundial-opri.vercel.app
```

## Setup inicial (una sola vez)
Después del primer deploy, crear las tablas en Airtable:
```bash
curl -X POST https://promundial-opri.vercel.app/api/setup \
  -H "x-setup-secret: TU_SETUP_SECRET"
```

## Niveles del diagnóstico
- **Level 1 — OPRI Core 25:** Diagnóstico rápido, 25 preguntas
- **Level 2 — OPRI Full 60:** Se activa si Core < 3.8, dimensión < 3.5 o PAI > 0.7
- **Level 3 — Deep Dive:** LEI™ / TCS™ / ECI™ / ACI™ / CEI™ según dimensiones débiles del Full
