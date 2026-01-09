import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: "1mb" }));

const PUBLIC_DIR = path.join(__dirname, "public");
const PRICES_PATH = path.join(PUBLIC_DIR, "prices.json");

function readPrices(){
  const raw = fs.readFileSync(PRICES_PATH, "utf-8");
  return JSON.parse(raw);
}
function writePrices(data){
  fs.writeFileSync(PRICES_PATH, JSON.stringify(data, null, 2), "utf-8");
}

app.get("/api/prices", (_req, res) => {
  try{ res.json(readPrices()); }
  catch(e){ res.status(500).json({ error: "Failed to read prices.json" }); }
});

app.post("/api/prices/refresh", (_req, res) => {
  try{
    const data = readPrices();
    const now = new Date().toISOString().slice(0,10);
    data.meta = data.meta || {};
    data.meta.updated_at = now;
    data.meta.refreshed_via = "POST /api/prices/refresh (demo)";
    writePrices(data);
    res.json(data);
  } catch(e){
    res.status(500).json({ error: "Failed to refresh prices" });
  }
});

// DeepSeek Chat proxy (key stays on server)
app.post("/api/chat", async (req, res) => {
  try{
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if(!apiKey){
      return res.status(400).json({ error: "DEEPSEEK_API_KEY is not set. Create .env and add DEEPSEEK_API_KEY=..." });
    }
    const { messages } = req.body || {};
    if(!Array.isArray(messages) || messages.length < 1){
      return res.status(400).json({ error: "messages must be a non-empty array" });
    }

    const system = {
      role: "system",
      content:
        "Ты — экспертный помощник по ремонту и отделке. Отвечай по-русски, кратко и по делу. " +
        "Если информации недостаточно (тип основания, влажность, бренд, требования), задай 1–2 уточняющих вопроса. " +
        "Не выдумывай цены и нормы: если они зависят от техкарты, укажи диапазон и уточни источник."
    };

    const payload = {
      model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
      messages: [system, ...messages],
      stream: false
    };

    const resp = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if(!resp.ok){
      const t = await resp.text();
      return res.status(resp.status).json({ error: "DeepSeek API error", details: t.slice(0, 2000) });
    }

    const data = await resp.json();
    const answer = data?.choices?.[0]?.message?.content ?? "";
    res.json({ answer, raw: { id: data.id, model: data.model } });
  } catch(e){
    res.status(500).json({ error: "Server error", details: String(e) });
  }
});

app.use(express.static(PUBLIC_DIR));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`OptiRemont landing running on http://localhost:${PORT}`));
