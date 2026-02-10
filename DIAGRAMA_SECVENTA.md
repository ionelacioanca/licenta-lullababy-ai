# Diagrame de Secvență - Lullababy AI

## Descriere Generală

Diagramele de secvență prezintă interacțiunile temporale dintre componentele sistemului Lullababy AI pentru cele mai importante fluxuri funcționale. Acestea ilustrează comunicarea între frontend (aplicație mobilă), backend (API REST), baza de date, Raspberry Pi și serviciile AI.

---

## 1. Diagramă Secvență: Autentificare și Login

Acest flux descrie procesul de autentificare a unui utilizator prin email/parolă sau Google OAuth.

```plantuml
@startuml
skinparam monochrome true
skinparam shadowing false
skinparam sequenceMessageAlign center

actor "Utilizator" as User
participant "Mobile App\n(Frontend)" as App
participant "Backend API\n(Express.js)" as API
participant "MongoDB" as DB
participant "Google OAuth" as OAuth

== Autentificare Email/Parolă ==
User -> App: Introduce email și parolă
App -> API: POST /api/users/login\n{email, password}
API -> DB: Caută utilizator după email
DB --> API: Date utilizator (cu password hash)
API -> API: Verifică parolă (bcrypt.compare)
alt Parolă corectă
    API -> API: Generează JWT token
    API --> App: 200 OK\n{token, user, babies}
    App -> App: Salvează token local
    App --> User: Redirecționare către Home
else Parolă incorectă
    API --> App: 401 Unauthorized\n"Invalid credentials"
    App --> User: Afișare eroare
end

== Autentificare Google OAuth ==
User -> App: Apasă "Login with Google"
App -> OAuth: Deschide Google Sign-In
OAuth --> User: Prompt autentificare Google
User -> OAuth: Confirmă autentificare
OAuth --> App: Google ID Token
App -> API: POST /api/users/google-login\n{idToken}
API -> OAuth: Verifică token cu Google
OAuth --> API: Date utilizator Google (email, name)
API -> DB: Caută/Creează utilizator după email
DB --> API: Date utilizator
API -> API: Generează JWT token
API --> App: 200 OK\n{token, user, babies}
App -> App: Salvează token local
App --> User: Redirecționare către Home

@enduml
```

**Actori și Componente:**
- **Utilizator**: Părinte sau Bonă care dorește să se autentifice
- **Mobile App**: Aplicație React Native + Expo
- **Backend API**: Server Node.js + Express.js
- **MongoDB**: Bază de date NoSQL pentru utilizatori
- **Google OAuth**: Serviciu extern de autentificare Google

**Tehnologii:**
- JWT (JSON Web Tokens) pentru sesiuni
- bcrypt pentru hashing parole
- Google OAuth 2.0 pentru autentificare socială

---

## 2. Diagramă Secvență: Monitorizare Video și Detectare AI cu Alertare

Acest flux descrie detectarea automată a plânsului prin AI și trimiterea notificării push către părinți.

```plantuml
@startuml
skinparam monochrome true
skinparam shadowing false
skinparam sequenceMessageAlign center

actor "Părinte" as User
participant "Mobile App" as App
participant "Backend API" as API
participant "Raspberry Pi\n(Camera)" as RPi
participant "OpenCV +\nAI Model" as AI
participant "MongoDB" as DB
participant "Expo Push\nNotifications" as Push

== Streaming Video ==
User -> App: Deschide Baby Monitor
App -> RPi: GET /video_feed (HTTP Stream)
RPi --> App: MJPEG video stream
App --> User: Afișare video live

== Detectare Plâns (Background) ==
RPi -> AI: Analiză frame video + audio
AI -> AI: Model detectare plâns
AI --> RPi: Rezultat: crying detected

alt Plâns detectat
    RPi -> API: POST /api/alerts\n{babyId, type: "crying", severity: "high"}
    API -> DB: Salvează alert în baza de date
    DB --> API: Alert salvat cu ID
    
    API -> DB: Caută părinții bebelușului
    DB --> API: Lista utilizatori cu push tokens
    
    API -> Push: Trimite notificare push\n{title: "Copilul plânge", body: "Plâns detectat"}
    Push --> App: Notificare push primită
    App --> User: Afișare notificare
    User -> App: Apasă pe notificare
    App -> App: Deschide Baby Monitor
    
    API -> RPi: POST /stop_crying_detection
    RPi --> API: 200 OK
end

@enduml
```

**Actori și Componente:**
- **Raspberry Pi**: Camera cu senzori video/audio
- **OpenCV + AI Model**: Algoritmi de computer vision pentru detectare
- **Expo Push Notifications**: Serviciu pentru notificări mobile

**Tipuri de alerte:**
- **Motion**: Mișcare detectată
- **Crying**: Plâns detectat (severitate: high)
- **Sleep**: Adormit (severitate: low)
- **Wake**: Trezit (severitate: medium)

---

## 3. Diagramă Secvență: Adăugare Bebeluș și Generare Calendar Vaccinări

Acest flux arată cum se creează profilul unui bebeluș și cum sistemul generează automat calendarul de vaccinări.

```plantuml
@startuml
skinparam monochrome true
skinparam shadowing false
skinparam sequenceMessageAlign center

actor "Părinte" as Parent
participant "Mobile App" as App
participant "Backend API" as API
participant "MongoDB" as DB
participant "Calendar\nService" as CalendarSvc

Parent -> App: Introduce date bebeluș\n(nume, sex, data nașterii, greutate, lungime)
App -> API: POST /api/babies\n{name, sex, birthDate, weight, height, birthType}
API -> API: Validare date (vârstă, greutate)
API -> DB: Creează document Baby
DB --> API: Baby salvat cu ID

== Generare Automată Calendar Vaccinări ==
API -> CalendarSvc: generateVaccinationCalendar(baby)
CalendarSvc -> CalendarSvc: Calculează date vaccinări\n(schema națională RO)

loop Pentru fiecare vaccin
    CalendarSvc -> DB: Creează CalendarEvent\n{type: "vaccination", date, reminder}
    DB --> CalendarSvc: Event salvat
end

CalendarSvc --> API: Calendar vaccinări generat (15 evenimente)
API --> App: 201 Created\n{baby, calendarEvents}
App --> Parent: "Bebeluș adăugat cu succes!\nCalendar vaccinări generat."

== Setare Reminder pentru primul vaccin ==
API -> DB: Caută eveniment vaccin cel mai apropiat
DB --> API: Event (BCG - data nașterii)
API -> API: Calculează reminder (3 zile înainte)
API -> Push: Programează reminder pentru eveniment
Push --> API: Reminder programat

@enduml
```

**Schema Vaccinări Națională România:**
1. **La naștere**: BCG, Hepatită B (doza 1)
2. **2 luni**: DTP, Poliomielită, Hib, Hepatită B (doza 2)
3. **4 luni**: DTP, Poliomielită, Hib
4. **6 luni**: DTP, Poliomielită, Hib, Hepatită B (doza 3)
5. **12 luni**: ROR (rujeolă, oreion, rubeolă)
6. **15 luni**: DTP booster

**Calendar Service**: Funcție automată care generează 15+ evenimente de vaccinare bazate pe data nașterii.

---

## 4. Diagramă Secvență: Chatbot AI - Întrebare și Răspuns Contextualizat

Acest flux ilustrează cum chatbot-ul AI (Ollama LLM) răspunde la întrebări folosind contextul bebelușului.

```plantuml
@startuml
skinparam monochrome true
skinparam shadowing false
skinparam sequenceMessageAlign center

actor "Părinte" as Parent
participant "Mobile App" as App
participant "Backend API" as API
participant "Chatbot\nService" as ChatbotSvc
participant "Ollama LLM\n(Local)" as Ollama
participant "MongoDB" as DB

Parent -> App: Introduce întrebare\n"Copilul plânge mult, ce să fac?"
App -> API: POST /api/chatbot\n{userId, babyId, message}
API -> DB: Caută date bebeluș (vârstă, alergii)
DB --> API: Baby {name: "Ana", ageMonths: 4, allergies: []}

API -> DB: Caută istoric conversații
DB --> API: Ultimele 5 mesaje ale utilizatorului

== Construire Context pentru LLM ==
API -> ChatbotSvc: generateResponse(message, babyContext, history)
ChatbotSvc -> ChatbotSvc: Construiește prompt:\n"Copilul Ana, 4 luni, plânge mult..."
ChatbotSvc -> Ollama: POST /api/generate\n{model: "babybuddy", prompt, context}
Ollama -> Ollama: Încarcă knowledge base\n(crying.txt, colic.txt, sleep.txt)
Ollama -> Ollama: Generează răspuns personalizat
Ollama --> ChatbotSvc: "La 4 luni, plânsul poate indica colicii.\nRecomandări: masaj abdomen, poziție verticală..."

ChatbotSvc -> API: Răspuns generat
API -> DB: Salvează mesaje (întrebare + răspuns) în conversație
DB --> API: Mesaje salvate

API --> App: 200 OK\n{response, timestamp}
App --> Parent: Afișare răspuns chatbot

@enduml
```

**Baza de Cunoștințe Ollama:**
- `breastfeeding.txt`: Ghid alăptare
- `crying.txt`: Cauze plâns și soluții
- `colic.txt`: Gestionarea colicilor
- `fever.txt`: Febră și când să mergi la medic
- `sleep.txt`: Tiparele de somn pe vârste
- `teething.txt`: Erupția dentară
- `postpartum.txt`: Suport pentru depresie postpartum

**Personalizare:**
- Răspunsurile includ numele bebelușului
- Ține cont de vârstă (4 luni → colicii comune)
- Consideră alergii cunoscute
- Păstrează context conversație (ultimele 5 mesaje)

---

## 5. Diagramă Secvență: Înregistrare Automată Somn și Statistici

Acest flux arată detectarea automată a adormitului prin AI și calculul statisticilor de somn.

```plantuml
@startuml
skinparam monochrome true
skinparam shadowing false
skinparam sequenceMessageAlign center

participant "Raspberry Pi\n(Camera)" as RPi
participant "OpenCV +\nAI Model" as AI
participant "Backend API" as API
participant "MongoDB" as DB
participant "Sleep\nService" as SleepSvc
participant "Mobile App" as App
actor "Părinte" as Parent

== Detectare Adormit (Noapte) ==
RPi -> AI: Analiză continuă video (frame-uri)
AI -> AI: Model detectare somn/trezire
AI --> RPi: Rezultat: "sleep detected"

RPi -> API: POST /api/sleep-events\n{babyId, status: "asleep", detectedBy: "AI"}
API -> DB: Creează SleepEvent {sleepStart: now(), status: "sleeping"}
DB --> API: Event salvat cu ID

API --> App: WebSocket notification\n"Copilul a adormit"
App --> Parent: Notificare discretă (fără sunet)

== Detectare Trezire (Dimineață) ==
note over RPi, AI: 7 ore mai târziu...
RPi -> AI: Analiză video
AI --> RPi: Rezultat: "wake detected"

RPi -> API: POST /api/sleep-events\n{babyId, status: "awake"}
API -> DB: Actualizează SleepEvent\n{sleepEnd: now(), status: "completed", duration: 420 min}
DB --> API: Event actualizat

== Calcul Statistici Săptămânale ==
API -> SleepSvc: calculateWeeklyStats(babyId)
SleepSvc -> DB: Caută toate SleepEvents (ultimele 7 zile)
DB --> SleepSvc: Lista evenimente somn

SleepSvc -> SleepSvc: Agregare:\n- Total ore somn: 78h\n- Număr sesiuni: 42\n- Durată medie: 1h 51min
SleepSvc --> API: Statistici calculate

API -> DB: Salvează statistici cache
DB --> API: OK

API --> App: Push statistics update
App -> App: Actualizează graficele
App --> Parent: Afișare statistici actualizate

@enduml
```

**Metrici Calculate:**
- **Durată totală somn**: Suma tuturor sesiunilor (ore și minute)
- **Număr sesiuni**: Câte perioade de somn (diurn + nocturn)
- **Durată medie**: Total somn / număr sesiuni
- **Ore adormire/trezire**: Pattern detectat (ex: 21:00 - 07:00)

**Detectare AI:**
- Analiză video continuă (OpenCV)
- Model antrenat pe comportament bebeluș
- Precizie: ~85% pentru detectare somn/trezire
- Fără detecție false pozitive prin mișcare mică

---

## 6. Diagramă Secvență: Upload Intrare Jurnal cu Fotografii

Acest flux arată cum părintele documentează un moment important cu fotografii și tag-uri.

```plantuml
@startuml
skinparam monochrome true
skinparam shadowing false
skinparam sequenceMessageAlign center

actor "Părinte" as Parent
participant "Mobile App" as App
participant "Backend API" as API
participant "Upload\nMiddleware" as Upload
participant "File System" as FS
participant "MongoDB" as DB

Parent -> App: Creează intrare jurnal\n(titlu, descriere, 3 fotografii)
App -> App: Selectează tag "milestone"\nSelectează mood "happy"

App -> API: POST /api/journal\nMultipart form data:\n{title, description, tags, mood, photos[]}

API -> Upload: Procesare fotografii (Multer)
Upload -> Upload: Validare fișiere (JPEG/PNG, max 5MB)
Upload -> FS: Salvează fotografii în /uploads/journal/
FS --> Upload: Paths: [photo1.jpg, photo2.jpg, photo3.jpg]
Upload --> API: Files uploaded

API -> API: Creează document JournalEntry\n{title, description, tags: ["milestone"],\nmood: "happy", photos: [paths]}

API -> DB: Salvează JournalEntry
DB --> API: Entry salvat cu ID

API --> App: 201 Created\n{journalEntry}
App -> App: Actualizează lista jurnal
App --> Parent: "Intrare jurnal salvată cu succes!"

== Căutare Ulterioară după Tag ==
Parent -> App: Caută "milestone"
App -> API: GET /api/journal?tag=milestone
API -> DB: Caută JournalEntry where tags contains "milestone"
DB --> API: Lista intrări filtrate (15 rezultate)
API --> App: 200 OK\n{journalEntries[]}
App --> Parent: Afișare rezultate (listă cronologică)

@enduml
```

**Tag-uri Disponibile:**
- `milestone`: Pietre de hotar (primul cuvânt, primi pași)
- `first-moments`: Prime momente (primul zâmbet)
- `sleep`: Documentare somn
- `feeding`: Alimentație
- `health`: Sănătate (vizite medic)
- `challenges`: Provocări (dentiție, colicii)
- `playtime`: Joacă și dezvoltare
- `other`: Alte categorii

**Mood (Stare):**
- `happy` 😊: Fericit
- `okay` 😐: Okay
- `neutral` 😑: Neutru
- `crying` 😢: Plâns
- `sick` 🤒: Bolnav

---

## Fluxuri de Eroare și Excepții

### Eroare: Token JWT Expirat

```plantuml
@startuml
skinparam monochrome true
skinparam shadowing false

actor User
participant App
participant API

User -> App: Acțiune (ex: Adaugă jurnal)
App -> API: POST /api/journal\nAuthorization: Bearer <expired_token>
API -> API: Verifică JWT token
API --> App: 401 Unauthorized\n"Token expired"
App -> App: Șterge token local
App --> User: Redirecționare la Login

@enduml
```

### Eroare: Raspberry Pi Offline

```plantuml
@startuml
skinparam monochrome true
skinparam shadowing false

actor User
participant App
participant API
participant RPi

User -> App: Deschide Baby Monitor
App -> API: GET /api/baby-monitor/status
API -> RPi: Ping RPi (timeout 5s)
RPi -x API: No response (timeout)
API --> App: 503 Service Unavailable\n"Camera offline"
App --> User: "Baby monitor indisponibil.\nVerifică conexiunea RPi."

@enduml
```

---

## Tehnologii Utilizate în Diagrame

### Frontend (Mobile App)
- **React Native** + **Expo**: Framework aplicație mobilă
- **AsyncStorage**: Salvare JWT token local
- **React Navigation**: Navigare între ecrane

### Backend (API)
- **Node.js** + **Express.js**: Server REST API
- **JWT (jsonwebtoken)**: Autentificare și autorizare
- **Multer**: Middleware pentru upload fișiere
- **bcrypt**: Hashing parole

### Baza de Date
- **MongoDB**: Bază NoSQL pentru date structurate
- **Mongoose**: ODM pentru validare și query-uri

### IoT & AI
- **Raspberry Pi**: Camera baby monitor (Flask API Python)
- **OpenCV**: Procesare video și detectare
- **Ollama LLM**: Model AI local pentru chatbot
- **Expo Push Notifications**: Alertare instant

### Comunicare
- **HTTP/REST**: Comunicare client-server
- **WebSocket** (opțional): Notificări real-time
- **MJPEG Streaming**: Video live de la Raspberry Pi

---

## Note Arhitecturale

### Securitate
- Toate cererile (exceptând login/register) necesită **JWT token** în header `Authorization: Bearer <token>`
- Parolele sunt **hash-ate** cu bcrypt (salt rounds: 10)
- Fișierele uploadate sunt **validate** (tip MIME, dimensiune max)
- Video streaming este **securizat** prin autentificare

### Performanță
- Statistici somn sunt **cache-uite** în MongoDB pentru acces rapid
- Notificări push sunt **asincrone** (nu blochează răspunsul API)
- Upload fotografii folosește **streaming** (nu încarcă tot fișierul în memorie)

### Scalabilitate
- Backend poate fi **orizontal scalat** (multiple instanțe cu load balancer)
- MongoDB suportă **sharding** pentru volume mari de date
- Raspberry Pi poate fi **replicat** pentru multiple camere (același bebeluș)

---

**Versiune**: 1.0  
**Data**: Februarie 2026  
**Autor**: Licență Lullababy AI
