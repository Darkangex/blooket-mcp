#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
//  🎮 BLOOKET MCP SERVER v1.0.0
//  Servidor MCP para crear Blookets con Perplexity AI
//  Autor: Angel Fernandez — Veracruz, MX
// ═══════════════════════════════════════════════════════════════
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { generarPreguntas } from "./lib/perplexity.js";
import { crearSetBlooket, obtenerMisSets } from "./lib/blooket.js";
import { guardarCSV, generarResumen, preguntasACSV } from "./lib/csv.js";

// ── Configuración desde variables de entorno ──────────────────
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY || "";
const BLOOKET_TOKEN = process.env.BLOOKET_TOKEN || "";

// ── Crear servidor MCP ────────────────────────────────────────
const server = new Server(
  { name: "blooket-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// ── Definición de herramientas disponibles ────────────────────
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "generar_preguntas",
      description:
        "🧠 Genera preguntas de quiz para Blooket usando Perplexity AI. " +
        "Crea preguntas de opción múltiple sobre cualquier tema educativo.",
      inputSchema: {
        type: "object",
        properties: {
          tema: {
            type: "string",
            description:
              "Tema del quiz. Ej: 'Present Perfect en inglés', 'Vocabulario B1', 'Verbos irregulares'",
          },
          num_preguntas: {
            type: "number",
            description: "Cantidad de preguntas a generar (5-30). Por defecto: 10",
            default: 10,
          },
          nivel: {
            type: "string",
            description:
              "Nivel educativo: 'primaria', 'secundaria', 'preparatoria', 'principiante', 'intermedio', 'avanzado'",
            default: "secundaria",
          },
          idioma: {
            type: "string",
            description: "Idioma de las preguntas: 'español' o 'inglés'",
            default: "inglés",
          },
        },
        required: ["tema"],
      },
    },
    {
      name: "crear_set_blooket",
      description:
        "🚀 Crea un Question Set directamente en tu cuenta de Blooket via API. " +
        "Requiere BLOOKET_TOKEN configurado en .env (ver README para obtenerlo).",
      inputSchema: {
        type: "object",
        properties: {
          titulo: {
            type: "string",
            description: "Título del Question Set en Blooket",
          },
          preguntas: {
            type: "array",
            description: "Array de preguntas generadas por generar_preguntas",
            items: { type: "object" },
          },
          descripcion: {
            type: "string",
            description: "Descripción opcional del set",
            default: "",
          },
        },
        required: ["titulo", "preguntas"],
      },
    },
    {
      name: "exportar_csv",
      description:
        "💾 Exporta las preguntas a un archivo CSV compatible con importadores de Blooket. " +
        "El archivo se guarda en tu Escritorio (Desktop).",
      inputSchema: {
        type: "object",
        properties: {
          preguntas: {
            type: "array",
            description: "Array de preguntas a exportar",
            items: { type: "object" },
          },
          nombre_archivo: {
            type: "string",
            description: "Nombre del archivo CSV. Ej: 'verbos_irregulares.csv'",
            default: "blooket_questions.csv",
          },
        },
        required: ["preguntas"],
      },
    },
    {
      name: "flujo_completo",
      description:
        "⚡ FLUJO COMPLETO: Genera preguntas con Perplexity AI Y las sube directamente a Blooket " +
        "(si tienes BLOOKET_TOKEN) O las exporta a CSV. Todo en un solo paso.",
      inputSchema: {
        type: "object",
        properties: {
          tema: {
            type: "string",
            description: "Tema del quiz",
          },
          titulo_set: {
            type: "string",
            description: "Título para el Question Set en Blooket",
          },
          num_preguntas: {
            type: "number",
            description: "Número de preguntas (5-30)",
            default: 10,
          },
          nivel: {
            type: "string",
            description: "Nivel educativo",
            default: "secundaria",
          },
          idioma: {
            type: "string",
            description: "Idioma: 'español' o 'inglés'",
            default: "inglés",
          },
          descripcion: {
            type: "string",
            description: "Descripción del set (opcional)",
            default: "",
          },
        },
        required: ["tema", "titulo_set"],
      },
    },
    {
      name: "mis_sets_blooket",
      description:
        "📚 Obtiene la lista de Question Sets de tu cuenta de Blooket. " +
        "Requiere BLOOKET_TOKEN configurado.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
  ],
}));

// ── Manejador de llamadas a herramientas ──────────────────────
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "generar_preguntas") {
      const { tema, num_preguntas = 10, nivel = "secundaria", idioma = "inglés" } = args;
      const preguntas = await generarPreguntas(
        PERPLEXITY_API_KEY, tema,
        Math.min(Math.max(num_preguntas, 5), 30),
        nivel, idioma
      );
      const resumen = generarResumen(preguntas);
      return {
        content: [{
          type: "text",
          text:
            `✅ **${preguntas.length} preguntas generadas** sobre: "${tema}"\n` +
            `📊 Nivel: ${nivel} | Idioma: ${idioma}\n\n${resumen}\n\n---\n` +
            `📦 **JSON:**\n\`\`\`json\n${JSON.stringify(preguntas, null, 2)}\n\`\`\``,
        }],
      };
    }

    if (name === "crear_set_blooket") {
      const { titulo, preguntas, descripcion = "" } = args;
      const resultado = await crearSetBlooket(BLOOKET_TOKEN, titulo, descripcion, preguntas);
      return {
        content: [{
          type: "text",
          text:
            `🎉 **¡Set creado en Blooket!**\n\n` +
            `📚 **Título:** ${resultado.titulo}\n` +
            `❓ **Preguntas:** ${resultado.totalPreguntas}\n` +
            `🔗 **URL:** ${resultado.url}`,
        }],
      };
    }

    if (name === "exportar_csv") {
      const { preguntas, nombre_archivo = "blooket_questions.csv" } = args;
      const rutaGuardada = guardarCSV(preguntas, nombre_archivo);
      const csvPreview = preguntasACSV(preguntas).split("\n").slice(0, 4).join("\n");
      return {
        content: [{
          type: "text",
          text:
            `💾 **CSV exportado**\n\n` +
            `📁 **Guardado en:** \`${rutaGuardada}\`\n` +
            `📊 **${preguntas.length} preguntas** exportadas\n\n` +
            `\`\`\`csv\n${csvPreview}\n...\n\`\`\``,
        }],
      };
    }

    if (name === "flujo_completo") {
      const { tema, titulo_set, num_preguntas = 10, nivel = "secundaria", idioma = "inglés", descripcion = "" } = args;
      const preguntas = await generarPreguntas(
        PERPLEXITY_API_KEY, tema,
        Math.min(Math.max(num_preguntas, 5), 30),
        nivel, idioma
      );
      const resumen = generarResumen(preguntas);
      let resultado = `🧠 **${preguntas.length} preguntas generadas** sobre: "${tema}"\n\n${resumen}\n\n---\n\n`;
      if (BLOOKET_TOKEN) {
        try {
          const blooket = await crearSetBlooket(BLOOKET_TOKEN, titulo_set, descripcion, preguntas);
          resultado += `🎉 **¡Set creado en Blooket!**\n📚 ${blooket.titulo}\n🔗 ${blooket.url}`;
        } catch (e) {
          const ruta = guardarCSV(preguntas, `${titulo_set.replace(/\s+/g, "_")}.csv`);
          resultado += `⚠️ Error Blooket: ${e.message}\n💾 CSV guardado en: \`${ruta}\``;
        }
      } else {
        const ruta = guardarCSV(preguntas, `${titulo_set.replace(/\s+/g, "_").toLowerCase()}.csv`);
        resultado += `💾 **CSV exportado a:** \`${ruta}\`\n\n💡 Agrega BLOOKET_TOKEN en .env para subida automática.`;
      }
      return { content: [{ type: "text", text: resultado }] };
    }

    if (name === "mis_sets_blooket") {
      const sets = await obtenerMisSets(BLOOKET_TOKEN);
      const lista = Array.isArray(sets)
        ? sets.slice(0, 20).map((s, i) =>
            `${i + 1}. **${s.title || s.titulo}** (${s._id || s.id}) — ${s.questions?.length || 0} preguntas`
          ).join("\n")
        : JSON.stringify(sets, null, 2);
      return { content: [{ type: "text", text: `📚 **Tus Question Sets en Blooket:**\n\n${lista}` }] };
    }

    throw new Error(`Herramienta desconocida: ${name}`);
  } catch (error) {
    return { content: [{ type: "text", text: `❌ **Error:** ${error.message}` }], isError: true };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write("🎮 Blooket MCP Server iniciado correctamente\n");
}

main().catch((err) => {
  process.stderr.write(`💥 Error fatal: ${err.message}\n`);
  process.exit(1);
});
