// api/generate-narrative.js
//
// Proxy server-side para la generación de la narrativa del reporte OPRI™.
//
// Por qué existe este archivo: el navegador no puede llamar directamente a
// https://api.anthropic.com — no hay forma segura de adjuntar la API key
// desde el cliente, y Anthropic además bloquea llamadas directas desde
// navegador (CORS). Este endpoint vive en el servidor (Vercel), donde SÍ
// puede leer la API key desde una variable de entorno sin exponerla nunca
// al navegador del usuario.
//
// Requiere: variable de entorno ANTHROPIC_API_KEY configurada en el
// proyecto de Vercel (Settings → Environment Variables) y en tu .env.local
// para pruebas locales con `vercel dev`.

// El prompt que genera la narrativa completa (5 dimensiones del Core, y
// potencialmente más si el reporte incluye Deep Dive) puede tardar más de
// los 10s que Vercel asigna por defecto a una función serverless en el
// plan Hobby. Sin este ajuste, la función se corta a mitad de camino y el
// navegador ve un fetch fallido genérico ("Load failed"), no un error HTTP
// identificable.
//
// 300s (5 minutos) es el máximo permitido en el plan Hobby CON Fluid
// Compute habilitado (Settings → Functions → Fluid Compute en el
// dashboard de Vercel). Si tu proyecto no tiene Fluid Compute activado,
// el máximo real en Hobby es 60s — en ese caso, baja este valor a 60
// (Vercel simplemente lo capará al máximo permitido si dejas 300 sin
// Fluid Compute, así que no rompe nada dejarlo así, pero no obtendrías
// el margen extra). Subir este número no cuesta nada mientras no se use
// — Vercel cobra por el tiempo real de ejecución, no por el máximo
// configurado.
export const config = {
  maxDuration: 300,
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "ANTHROPIC_API_KEY no está configurada en el servidor." });
    return;
  }

  const { prompt, max_tokens } = req.body || {};
  if (!prompt) {
    res.status(400).json({ error: "Falta 'prompt' en el body de la petición." });
    return;
  }

  try {
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: max_tokens || 4000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await anthropicRes.json();

    if (!anthropicRes.ok) {
      // Pasamos el error real de Anthropic al frontend para poder
      // diagnosticar (p.ej. API key inválida, rate limit, etc.) en vez de
      // que todo caiga silenciosamente al texto de respaldo genérico.
      res.status(anthropicRes.status).json(data);
      return;
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message || "Error llamando a la API de Anthropic." });
  }
}
