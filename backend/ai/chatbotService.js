// backend/ai/chatbotService.js

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES6 equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Folderul cu fișierele tale .txt (crying, sleep, etc.)
// __dirname = backend/ai → .. = backend → .. = root → /chatbot/knowledge
const KNOWLEDGE_DIR = path.join(__dirname, "..", "..", "chatbot", "knowledge"); // ⬅️ aici e baza ta de knowledge

// Detectăm dacă textul e mai probabil română sau engleză
function detectLanguage(text) {
  const roWords = ["bebeluș", "bebelus", "plânge", "plange", "febră", "febra", "părinte", "parinte", "somn", "dinți", "dinti"];
  const lower = text.toLowerCase();
  for (const w of roWords) {
    if (lower.includes(w)) return "ro";
  }
  return "en"; // default
}

// RAG simplu: alegem fișierele relevante din knowledge/
function getKnowledge(question) {
  if (!fs.existsSync(KNOWLEDGE_DIR)) {
    console.warn("Knowledge folder not found:", KNOWLEDGE_DIR);
    return "";
  }

  const files = fs.readdirSync(KNOWLEDGE_DIR);
  const lowerQ = question.toLowerCase();

  // map keywords → fișiere (ai vital.txt, nu vitals.txt)
  const mapping = [
    { keywords: ["cry", "plâns", "plange", "plânge"], file: "crying.txt" },
    { keywords: ["sleep", "somn", "night"], file: "sleep.txt" },
    { keywords: ["colic", "colici"], file: "colic.txt" },
    { keywords: ["tooth", "teeth", "dinte", "dinti", "dintișor", "dintisor"], file: "teething.txt" },
    { keywords: ["fever", "temperature", "febră", "febra", "temp"], file: "fever.txt" },
    { keywords: ["heart", "pulse", "puls", "vital"], file: "vital.txt" },
    { keywords: ["parent", "părinte", "parinte", "guilty", "bad mom", "bad dad"], file: "emotional_support.txt" },
  ];

  let selectedFiles = new Set();

  for (const map of mapping) {
    if (map.keywords.some((k) => lowerQ.includes(k))) {
      selectedFiles.add(map.file);
    }
  }

  // dacă nu găsim nimic specific, folosim doar emotional_support pentru generalizări
  if (selectedFiles.size === 0) {
    selectedFiles.add("emotional_support.txt");
  }

  let context = "";
  for (const f of selectedFiles) {
    const fullPath = path.join(KNOWLEDGE_DIR, f);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, "utf8");
      context += `\n\n=== ${f} ===\n${content}`;
    }
  }

  return context.trim();
}

// Construim promptul final pentru modelul babybuddy
function buildPrompt(message, lang, knowledge) {
  const baseInstructionEn = `
You are BabyCareBuddy — a calm, empathetic, friendly assistant for parents of babies.
Use the provided context if helpful, but do NOT invent medical facts.
Never diagnose, always suggest contacting a doctor when symptoms are serious.
Answer in English, in a warm and supportive tone.
`;

  const baseInstructionRo = `
Ești BabyCareBuddy — un asistent calm, empatic și prietenos pentru părinți de bebeluși.
Răspunde DOAR în limba română naturală și conversațională (nu formal sau robotizat).
Folosește un ton cald, blând și plin de înțelegere, ca și cum ai vorbi cu un prieten.
Evită limbajul tehnic sau medical excesiv - vorbește simplu și natural.
Folosește contextul oferit când e relevant, dar nu inventa niciodată informații medicale.
Nu diagnostica - recomandă părinților să consulte medicul când simptomele sunt îngrijorătoare.
`;


  const baseInstruction = lang === "ro" ? baseInstructionRo : baseInstructionEn;

  return `${baseInstruction}

Context (you may use relevant parts of this):
${knowledge || "(no extra context)"}

User: ${message}
Assistant:`;
}

// Funcția principală apelată din controller
async function getChatbotReply(message, userLanguage) {
  try {
    // Use explicit language preference if provided, otherwise detect from message
    const lang = userLanguage === 'ro' || userLanguage === 'en' ? userLanguage : detectLanguage(message);
    const knowledge = getKnowledge(message);
    const prompt = buildPrompt(message, lang, knowledge);

    console.log(`[Chatbot] Processing message (${lang}): "${message.substring(0, 50)}..."`);
    const startTime = Date.now();

    // apelăm Ollama HTTP API – ai nevoie de modelul 'babybuddy' creat
    const response = await axios.post("http://localhost:11434/api/generate", {
      model: "babybuddy", // ⬅️ Numele modelului tău Ollama
      prompt,
      stream: false,
      keep_alive: "5m", // Keep model loaded for 5 minutes to speed up subsequent requests
      options: {
        temperature: 0.7,
        num_predict: 200, // Reduced for faster responses
        top_k: 40,
        top_p: 0.9,
      }
    }, {
      timeout: 50000, // 50 second timeout for Ollama
    });

    const elapsed = Date.now() - startTime;
    console.log(`[Chatbot] Response received in ${elapsed}ms`);

    return response.data?.response || "";
  } catch (error) {
    console.error("[Chatbot] Error:", error.message);
    if (error.code === 'ECONNREFUSED') {
      throw new Error("Ollama service is not running. Please start Ollama.");
    }
    if (error.code === 'ETIMEDOUT') {
      throw new Error("Ollama is taking too long to respond. Try a shorter question.");
    }
    throw error;
  }
}

export { getChatbotReply };
