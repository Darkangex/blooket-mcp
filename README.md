# 🎮 Blooket MCP Server

Servidor MCP (Model Context Protocol) que conecta **Perplexity AI** con **Blooket** para generar y publicar Question Sets automáticamente.

Creado por Angel Fernandez — Veracruz, México 🇲🇽

---

## 🚀 Instalación Rápida

```bash
# 1. Clona el repositorio
git clone https://github.com/Darkangex/blooket-mcp.git
cd blooket-mcp

# 2. Instala dependencias
npm install

# 3. Configura tus API keys
cp .env.example .env
# Edita .env con tu PERPLEXITY_API_KEY

# 4. Prueba que funciona
node server.js
```

---

## ⚙️ Configuración en Claude Desktop / Cursor / Windsurf

Edita el archivo de configuración de tu cliente MCP:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "blooket": {
      "command": "node",
      "args": ["/RUTA/COMPLETA/blooket-mcp/server.js"],
      "env": {
        "PERPLEXITY_API_KEY": "pplx-tu-clave-aqui",
        "BLOOKET_TOKEN": "tu-token-opcional"
      }
    }
  }
}
```

---

## 🛠️ Herramientas Disponibles

| Herramienta | Descripción |
|---|---|
| `generar_preguntas` | Genera preguntas con Perplexity AI |
| `crear_set_blooket` | Sube un set directamente a Blooket |
| `exportar_csv` | Exporta preguntas a CSV |
| `flujo_completo` | Genera + sube/exporta en un paso |
| `mis_sets_blooket` | Lista tus sets en Blooket |

---

## 💬 Ejemplos de Uso

Una vez configurado, puedes pedir al AI:

```
"Crea un Blooket de 15 preguntas sobre Present Perfect para preparatoria en inglés"

"Genera un quiz de vocabulario B1 de 20 preguntas y expórtalo a CSV"

"Crea un set completo sobre verbos irregulares y súbelo a mi cuenta de Blooket"
```

---

## 🔑 Cómo Obtener el Token de Blooket

1. Ve a **blooket.com** e inicia sesión
2. Presiona **F12** → pestaña **Console**
3. Escribe este código:
```javascript
const key = Object.keys(localStorage).find(k => k.includes('firebase'));
const data = JSON.parse(localStorage.getItem(key));
console.log(data.stsTokenManager.accessToken);
```
4. Copia el token y ponlo en `BLOOKET_TOKEN` en tu `.env`

> ⚠️ **Nota:** El token expira cada ~1 hora. Si falla, renuévalo repitiendo los pasos.

---

## 📁 Estructura del Proyecto

```
blooket-mcp/
├── server.js          ← Servidor MCP principal
├── lib/
│   ├── perplexity.js  ← Cliente API de Perplexity
│   ├── blooket.js     ← Cliente API interna de Blooket
│   └── csv.js         ← Exportador CSV
├── package.json
├── .env               ← Tus API keys (NO subir a git)
├── .env.example       ← Plantilla
└── README.md
```

---

## ⚠️ Aviso Legal

Blooket no tiene API pública oficial. Este servidor usa la API interna de Blooket (la misma que usa el sitio web). Úsalo con responsabilidad y solo con tu propia cuenta.

---

## 🎓 Licencia

MIT — Libre para uso educativo.
