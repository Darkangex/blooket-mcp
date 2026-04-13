// ─────────────────────────────────────────────────────────────
//  lib/csv.js  — Exportador de preguntas a CSV / texto Blooket
// ─────────────────────────────────────────────────────────────
import fs from "fs";
import path from "path";
import os from "os";

function escaparCampo(valor) {
  const str = String(valor ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function preguntasACSV(preguntas) {
  const encabezado = "Question,Answer 1,Answer 2,Answer 3,Answer 4,Time Limit,Correct Answer\n";
  const filas = preguntas.map((p) => {
    const pregunta = p.pregunta || p.question || "";
    const respuestas = p.respuestas || p.answers || ["", "", "", ""];
    const correctaIdx = p.correcta ?? p.correctAnswerIdx ?? 0;
    const tiempo = p.tiempo || p.timeLimit || 20;
    const correcta = respuestas[correctaIdx] || respuestas[0];
    const r = [...respuestas];
    while (r.length < 4) r.push("");
    return [
      escaparCampo(pregunta),
      escaparCampo(r[0]), escaparCampo(r[1]),
      escaparCampo(r[2]), escaparCampo(r[3]),
      escaparCampo(tiempo),
      escaparCampo(correcta),
    ].join(",");
  });
  return encabezado + filas.join("\n");
}

export function guardarCSV(preguntas, nombreArchivo = "blooket_questions.csv") {
  const csv = preguntasACSV(preguntas);
  const escritorio = path.join(os.homedir(), "Desktop");
  const carpeta = fs.existsSync(escritorio) ? escritorio : os.homedir();
  const rutaFinal = path.join(carpeta, nombreArchivo);
  fs.writeFileSync(rutaFinal, csv, "utf8");
  return rutaFinal;
}

export function generarResumen(preguntas) {
  return preguntas.map((p, i) => {
    const respuestas = p.respuestas || p.answers || [];
    const correctaIdx = p.correcta ?? 0;
    const pregunta = p.pregunta || p.question;
    const opciones = respuestas.map((r, idx) =>
      `  ${idx === correctaIdx ? "✅" : "❌"} ${String.fromCharCode(65 + idx)}) ${r}`
    ).join("\n");
    return `📝 Pregunta ${i + 1}: ${pregunta}\n${opciones}\n⏱️ Tiempo: ${p.tiempo || 20}s`;
  }).join("\n\n");
}
