// ─────────────────────────────────────────────────────────────
//  lib/blooket.js  — Cliente para la API interna de Blooket
// ─────────────────────────────────────────────────────────────
import fetch from "node-fetch";

const BLOOKET_API = "https://api.blooket.com/api";

function formatearParaBlooket(preguntas) {
  return preguntas.map((p) => {
    const respuestas = p.respuestas || p.answers || [];
    const correctaIdx = p.correcta ?? p.correctAnswerIdx ?? 0;
    return {
      question: p.pregunta || p.question,
      answers: respuestas,
      correctAnswers: [respuestas[correctaIdx]],
      timeLimit: p.tiempo || p.timeLimit || 20,
      type: "Multiple Choice",
    };
  });
}

export async function crearSetBlooket(token, titulo, descripcion = "", preguntas = []) {
  if (!token) {
    throw new Error(
      "❌ Se necesita BLOOKET_TOKEN en el archivo .env\n" +
      "Para obtenerlo:\n" +
      "1. Ve a blooket.com e inicia sesión\n" +
      "2. Abre DevTools (F12) > Consola\n" +
      "3. Escribe: const key = Object.keys(localStorage).find(k => k.includes('firebase'));\n" +
      "   const data = JSON.parse(localStorage.getItem(key));\n" +
      "   console.log(data.stsTokenManager.accessToken);\n" +
      "4. Copia el accessToken y pégalo en BLOOKET_TOKEN"
    );
  }

  const body = {
    title: titulo,
    description: descripcion,
    private: false,
    questions: formatearParaBlooket(preguntas),
  };

  const response = await fetch(`${BLOOKET_API}/users/sets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      "Origin": "https://www.blooket.com",
      "Referer": "https://www.blooket.com/",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`❌ Error al crear set en Blooket (${response.status}): ${JSON.stringify(data)}`);
  }

  return {
    success: true,
    setId: data._id || data.id || data.setId,
    titulo,
    totalPreguntas: formatearParaBlooket(preguntas).length,
    url: `https://www.blooket.com/set/${data._id || data.id || data.setId}`,
    data,
  };
}

export async function obtenerMisSets(token) {
  if (!token) throw new Error("❌ Se necesita BLOOKET_TOKEN");
  const response = await fetch(`${BLOOKET_API}/users/sets`, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Origin": "https://www.blooket.com",
    },
  });
  if (!response.ok) throw new Error(`Error al obtener sets (${response.status})`);
  return response.json();
}
