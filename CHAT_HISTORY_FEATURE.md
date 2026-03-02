# Chat History Feature - Documentație

## 📝 Descriere

Sistemul salvează automat toate conversațiile dintre utilizatori și asistentul AI LullaBaby în baza de date MongoDB, pentru:
- Referințe viitoare ale utilizatorilor
- Analiză și îmbunătățire continuă a sistemului
- Debugging și training AI
- Conformitate GDPR (ștergere automată după 90 zile)

## 🗄️ Model de Date: ChatHistory

```javascript
{
  userId: ObjectId,           // Utilizatorul care a pus întrebarea
  babyId: ObjectId,           // Bebelușul asociat (opțional)
  role: 'user' | 'assistant', // Cine a trimis mesajul
  content: String,            // Conținutul mesajului
  language: 'ro' | 'en',      // Limba conversației
  contextUsed: {              // Context RAG folosit (doar pentru AI)
    babyAge: Number,
    babyWeight: Number,
    babyLength: Number,
    userName: String,
    userRole: String
  },
  metadata: {
    responseTime: Number,     // Milliseconds (doar pentru AI)
    model: String,            // 'gemini' sau 'openai'
    knowledgeFilesUsed: []    // Fișiere RAG folosite
  },
  createdAt: Date,
  updatedAt: Date
}
```

## 🔌 API Endpoints

### 1. Chat cu AI (salvează automat conversația)
```http
POST /api/chatbot
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "De ce plânge bebelușul meu?",
  "language": "ro",
  "babyId": "65f1234567890abcdef12345"
}
```

**Răspuns:**
```json
{
  "reply": "Bebelușii pot plânge din multiple motive..."
}
```

**Side effect:** Salvează automat în `ChatHistory`:
- Mesajul utilizatorului (role: 'user')
- Răspunsul AI (role: 'assistant')

---

### 2. Obține istoric conversații
```http
GET /api/chatbot/history?babyId=xxx&limit=50
Authorization: Bearer <token>
```

**Răspuns:**
```json
{
  "conversations": [
    {
      "question": {
        "_id": "...",
        "role": "user",
        "content": "De ce plânge bebelușul?",
        "createdAt": "2026-02-25T10:00:00Z"
      },
      "answer": {
        "_id": "...",
        "role": "assistant",
        "content": "Bebelușii pot plânge din...",
        "contextUsed": {...},
        "metadata": {
          "responseTime": 1234,
          "model": "gemini"
        },
        "createdAt": "2026-02-25T10:00:02Z"
      }
    }
  ],
  "total": 100
}
```

---

### 3. Șterge tot istoricul utilizatorului
```http
DELETE /api/chatbot/history
Authorization: Bearer <token>
```

**Răspuns:**
```json
{
  "message": "Chat history deleted successfully",
  "deletedCount": 42
}
```

## 🧹 Curățare Automată (GDPR Compliance)

Conversațiile mai vechi de **90 de zile** sunt șterse automat.

### Configurare în `.env`:
```bash
CHAT_HISTORY_RETENTION_DAYS=90
```

### Rulare manuală:
```bash
cd backend
node scripts/cleanup-chat-history.js
```

### Cron Job (Linux/Production):
```bash
# Adaugă în crontab (rulează zilnic la 2 AM)
crontab -e

0 2 * * * cd /path/to/backend && node scripts/cleanup-chat-history.js >> ../logs/cleanup.log 2>&1
```

### Windows Task Scheduler:
1. Deschide Task Scheduler
2. Create Basic Task → "Cleanup Chat History"
3. Trigger: Daily la 2:00 AM
4. Action: Start a program
   - Program: `node`
   - Arguments: `C:\path\to\backend\scripts\cleanup-chat-history.js`

## 📊 Metrici și Analiză

### Query pentru statistici:
```javascript
// Număr total conversații per utilizator
db.chathistories.aggregate([
  { $match: { role: 'user' } },
  { $group: { _id: '$userId', count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])

// Timp mediu de răspuns
db.chathistories.aggregate([
  { $match: { role: 'assistant', 'metadata.responseTime': { $exists: true } } },
  { $group: { _id: null, avgTime: { $avg: '$metadata.responseTime' } } }
])

// Cele mai folosite fișiere knowledge (RAG)
db.chathistories.aggregate([
  { $unwind: '$metadata.knowledgeFilesUsed' },
  { $group: { _id: '$metadata.knowledgeFilesUsed', count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])
```

## 🔒 Securitate și Privacy

✅ **Implementat:**
- Autentificare obligatorie (JWT)
- Fiecare utilizator vede doar propriile conversații
- Ștergere automată după 90 zile (GDPR)
- Opțiune de ștergere manuală
- Date criptate în tranzit (HTTPS)

⚠️ **Recomandări:**
- Encriptare la nivel de câmp pentru conținutul sensibil (MongoDB Field-Level Encryption)
- Backup-uri regulate cu criptare
- Audit log pentru accesul la date
- Compliance GDPR complet (export date, consimțământ explicit)

## 🚀 Dezvoltări Viitoare

- [ ] Export conversații în PDF
- [ ] Partajare conversații cu medicul pediatru
- [ ] Analiză sentiment pentru detectarea stresului parental
- [ ] Feedback thumbs up/down pentru răspunsuri
- [ ] Cache pentru întrebări frecvente
- [ ] Sugestii automate de întrebări similare
- [ ] Notificări când AI detectează pattern îngrijorător

## 📝 Exemple de Utilizare în Frontend

### React Native (TypeScript):
```typescript
// Trimite mesaj
const sendMessage = async (message: string, babyId: string) => {
  const response = await fetch('http://backend/api/chatbot', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ message, language: 'ro', babyId })
  });
  const data = await response.json();
  return data.reply;
};

// Încarcă istoric
const loadHistory = async (babyId: string) => {
  const response = await fetch(
    `http://backend/api/chatbot/history?babyId=${babyId}&limit=50`,
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );
  const data = await response.json();
  return data.conversations;
};

// Șterge istoric
const clearHistory = async () => {
  await fetch('http://backend/api/chatbot/history', {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
};
```

---

**Autor:** Ionela  
**Data:** 25 Februarie 2026  
**Versiune:** 1.0
