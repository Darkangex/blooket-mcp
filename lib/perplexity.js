// ─────────────────────────────────────────────────────────────
//  lib/perplexity.js  — Cliente para la API de Perplexity AI
// ─────────────────────────────────────────────────────────────
import fetch from "node-fetch";

const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions";

/**
 * Genera preguntas de quiz en formato Blooket usando Perplexity AI.
 */
export async function generarPreguntas(apiKey, tema, num = 10, nivel = "secundaria", idioma = "inglés") {
  if (!apiKey) throw new Error("❌ Se necesita PERPLEXITY_API_KEY en el archivo .env");

  const promptSistema = `Eres un experto en educación que crea preguntas de quiz para la plataforma Blooket.
Debes responder ÚNICAMENTE con un JSON válido, sin texto adicional, sin markdown, sin bloques de código.
Cada pregunta debe ser clara, educativa y apropiada para el nivel indicado.`;

  const promptUsuario = `Crea exactamente ${num} preguntas de opción múltiple sobre el tema: "${tema}"
Nivel educativo: ${nivel}
Idioma de las preguntas: ${idioma}

RESPONDE SOLO con este JSON (sin texto extra, sin bloques de código):
{
  "preguntas": [
    {
      "pregunta": "¿Texto de la pregunta?",
      "respuestas": ["Respuesta correcta", "Distractor 1", "Distractor 2", "Distractor 3"],
      "correcta": 0,
      "tiempo": 20
    }
  ]
}

REGLAS:
- El campo "correcta" es el ÍNDICE (0-3) de la respuesta correcta en el array "respuestas"
- Siempre 4 opciones de respuesta
- Tiempo entre 10 y 30 segundos según dificultad
- Las respuestas incorrectas deben ser plausibles pero claramente incorrectas`;

  const response = await fetch(PERPLEXITY_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-sonar-large-128k-online",
      messages: [
        { role: "system", content: promptSistema },
        { role: "user", content: promptUsuario },
      ],
      max_tokens: 4000,
      temperature: 0.4,
      return_citations: false,
      return_related_questions: false,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Error de Perplexity API (${response.status}): ${err}`);
  }

  const data = await response.json();
  const contenido = data.choices?.[0]?.message?.content || "";

  const jsonLimpio = contenido
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(jsonLimpio);
  } catch {
    const match = jsonLimpio.match(/\{[\s\S]*\}/);
    if (match) parsed = JSON.parse(match[0]);
    else throw new Error("❌ El LLM no devolvió JSON válido. Respuesta:\n" + contenido.slice(0, 300));
  }

  return parsed.preguntas || [];
}
