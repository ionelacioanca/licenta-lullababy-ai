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
    { keywords: ["postpartum", "post partum", "recovery", "healing", "baby blues", "depression", "ppd", "after birth", "dupa nastere", "după naștere", "depresie postpartum"], file: "postpartum.txt" },
    { keywords: ["breastfeed", "breast feed", "breastfeeding", "nursing", "latch", "milk", "pump", "pumping", "weaning", "alăptare", "alaptare", "lapte matern", "sân"], file: "breastfeeding.txt" },
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
function buildPrompt(message, lang, knowledge, babyContext, userContext) {
  const baseInstructionEn = `
You are BabyCareBuddy — a calm, empathetic, friendly assistant for parents of babies.
IMPORTANT: If baby age information is provided below, ALWAYS consider the baby's specific age when giving advice.
You CAN answer direct questions about the baby's information (name, age, weight, length) using the data provided.
For example, colic typically occurs in babies under 3-4 months and is rare in older babies.
Use the provided context if helpful, but do NOT invent medical facts.
Never diagnose, always suggest contacting a doctor when symptoms are serious.

CRITICAL: Pay attention to WHO you are talking to:
- If user information is provided below, address THE PARENT by their name (not the baby's name).
- When the question is about the PARENT'S health (postpartum, breastfeeding, recovery), talk to THE PARENT directly.
- When the question is about the BABY's health, you can refer to the baby by name.
Answer in English, in a warm and supportive tone.
`;

  const baseInstructionRo = `
Ești BabyCareBuddy — un asistent calm, empatic și prietenos pentru părinți de bebeluși.
IMPORTANT: Dacă sunt furnizate informații despre vârsta bebelușului mai jos, ÎNTOTDEAUNA ia în considerare vârsta specifică a bebelușului când dai sfaturi.
POȚI răspunde la întrebări directe despre informațiile bebelușului (nume, vârstă, greutate, lungime) folosind datele furnizate.
De exemplu, colicile apar de obicei la bebelușii sub 3-4 luni și sunt rare la bebelușii mai mari.
Răspunde DOAR în limba română naturală și conversațională (nu formal sau robotizat).
Folosește un ton cald, blând și plin de înțelegere, ca și cum ai vorbi cu un prieten.
Evită limbajul tehnic sau medical excesiv - vorbește simplu și natural.
Folosește contextul oferit când e relevant, dar nu inventa niciodată informații medicale.
Nu diagnostica - recomandă părinților să consulte medicul când simptomele sunt îngrijorătoare.

ESENȚIAL: Fii atent CU CINE vorbești:
- Dacă sunt furnizate informații despre utilizator mai jos, adresează-te PĂRINTELUI cu numele lor (NU cu numele bebelușului).
- Când întrebarea este despre sănătatea PĂRINTELUI (postpartum, alăptare, recuperare), vorbește direct cu PĂRINTELE.
- Când întrebarea este despre sănătatea BEBELUȘULUI, poți referi bebelușul cu numele lui.
`;

  const baseInstruction = lang === "ro" ? baseInstructionRo : baseInstructionEn;

  // Build user information section
  let userInfo = "";
  if (userContext) {
    console.log('[Chatbot Prompt] Building user info with context:', userContext);
    const { name, role } = userContext;
    const roleTranslations = {
      mother: { en: 'mother', ro: 'mamă' },
      father: { en: 'father', ro: 'tată' },
      guardian: { en: 'guardian', ro: 'tutore' },
      aunt: { en: 'aunt', ro: 'mătușă' },
      uncle: { en: 'uncle', ro: 'unchi' },
      grandma: { en: 'grandmother', ro: 'bunică' },
      grandpa: { en: 'grandfather', ro: 'bunic' },
    };
    
    const translatedRole = roleTranslations[role]?.[lang === 'ro' ? 'ro' : 'en'] || (lang === 'ro' ? 'părinte' : 'parent');
    
    if (lang === "ro") {
      userInfo = `\n${"=".repeat(50)}\nPERSOANA CU CARE VORBEȘTI (THE PARENT YOU'RE TALKING TO):\n`;
      userInfo += `Nume părintelui: ${name}\n`;
      userInfo += `Rolul: ${translatedRole === 'părinte' ? 'un părinte' : translatedRole}\n`;
      userInfo += `${"=".repeat(50)}`;
    } else {
      userInfo = `\n${"=".repeat(50)}\nTHE PARENT YOU ARE TALKING TO:\n`;
      userInfo += `Parent's name: ${name}\n`;
      userInfo += `Role: ${translatedRole}\n`;
      userInfo += `${"=".repeat(50)}`;
    }
    console.log('[Chatbot Prompt] Generated userInfo string:', userInfo);
  } else {
    console.log('[Chatbot Prompt] No userContext provided - userInfo will be empty');
  }

  // Build baby information section
  let babyInfo = "";
  if (babyContext) {
    const { name: babyName, gender, ageInMonths, ageInDays, weight, length, headCircumference } = babyContext;
    
    if (lang === "ro") {
      babyInfo += "\n\n" + "=".repeat(50) + "\n";
      babyInfo += "INFORMAȚII DESPRE BEBELUȘ (THE BABY'S INFORMATION):\n";
      babyInfo += `Numele bebelușului: ${babyName}\n`;
      babyInfo += `Gen: ${gender === 'male' ? 'băiat' : 'fată'}\n`;
      if (ageInMonths > 0) {
        babyInfo += `Vârstă: ${ageInMonths} ${ageInMonths === 1 ? 'lună' : 'luni'} (${ageInDays} zile)\n`;
      } else {
        babyInfo += `Vârstă: ${ageInDays} ${ageInDays === 1 ? 'zi' : 'zile'}\n`;
      }
      if (weight) babyInfo += `Greutate: ${weight} kg\n`;
      if (length) babyInfo += `Lungime: ${length} cm\n`;
      if (headCircumference) babyInfo += `Circumferința capului: ${headCircumference} cm\n`;
      babyInfo += `\n⚠️ IMPORTANT: Aceast bebeluș are ${ageInMonths} luni. Dă sfaturi SPECIFICE pentru această vârstă, NU pentru bebeluși mai mici sau mai mari.\n`;
      babyInfo += "=".repeat(50);
    } else {
      babyInfo += "\n\n" + "=".repeat(50) + "\n";
      babyInfo += "THE BABY'S INFORMATION:\n";
      babyInfo += `Baby's name: ${babyName}\n`;
      babyInfo += `Gender: ${gender}\n`;
      if (ageInMonths > 0) {
        babyInfo += `Age: ${ageInMonths} ${ageInMonths === 1 ? 'month' : 'months'} old (${ageInDays} days)\n`;
      } else {
        babyInfo += `Age: ${ageInDays} ${ageInDays === 1 ? 'day' : 'days'} old\n`;
      }
      if (weight) babyInfo += `Weight: ${weight} kg\n`;
      if (length) babyInfo += `Length: ${length} cm\n`;
      if (headCircumference) babyInfo += `Head Circumference: ${headCircumference} cm\n`;
      babyInfo += `\n⚠️ IMPORTANT: This baby is ${ageInMonths} months old. Provide advice SPECIFIC to this age, NOT for younger or older babies.\n`;
      babyInfo += "=".repeat(50);
    }
  }

  // Structure: instruction -> user info (WHO you're talking to) -> baby info -> knowledge -> question
  let finalPrompt = baseInstruction;
  
  // User info comes first - this is WHO the chatbot is talking to
  if (userInfo) {
    finalPrompt += userInfo;
  }
  
  // Baby info comes second - this is ABOUT whom the parent might ask
  if (babyInfo) {
    finalPrompt += babyInfo;
  }
  
  if (knowledge) {
    finalPrompt += "\n\nAdditional Context (use if relevant):\n";
    finalPrompt += knowledge;
  }
  
  finalPrompt += "\n\nUser: " + message;
  finalPrompt += "\nAssistant:";
  
  return finalPrompt;
}

// Funcția principală apelată din controller
async function getChatbotReply(message, userLanguage, babyContext = null, userContext = null) {
  try {
    // Use explicit language preference if provided, otherwise detect from message
    const lang = userLanguage === 'ro' || userLanguage === 'en' ? userLanguage : detectLanguage(message);
    const knowledge = getKnowledge(message);
    const prompt = buildPrompt(message, lang, knowledge, babyContext, userContext);

    console.log(`[Chatbot] Processing message (${lang}): "${message.substring(0, 50)}..."`);
    if (babyContext) {
      console.log(`[Chatbot] Baby context received:`, JSON.stringify(babyContext, null, 2));
    } else {
      console.log(`[Chatbot] WARNING: No baby context provided`);
    }
    
    // Log the complete prompt to debug
    console.log('\n========== COMPLETE PROMPT ==========');
    console.log(prompt);
    console.log('=====================================\n');
    
    const startTime = Date.now();

    // apelăm Ollama HTTP API – ai nevoie de modelul 'babybuddy' creat
    const response = await axios.post("http://localhost:11434/api/generate", {
      model: "babybuddy", // ⬅️ Numele modelului tău Ollama
      prompt,
      stream: false,
      keep_alive: "5m", // Keep model loaded for 5 minutes to speed up subsequent requests
      options: {
        temperature: 0.7,
        num_predict: 500, // Increased to allow complete responses
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
