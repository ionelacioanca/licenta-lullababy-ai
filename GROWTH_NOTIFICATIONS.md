# Growth Tracking Notification System

Sistem complet de notificări pentru urmărirea creșterii bebelușului, cu notificări push și centru de notificări in-app.

## 📋 Funcționalități

### Backend

1. **Programare automată a notificărilor**
   - La crearea unui bebeluș, se programează automat notificări
   - Frecvență adaptivă bazată pe vârstă:
     - 0-6 luni: lunar (în ziua nașterii)
     - 6-12 luni: la 2 luni
     - 12+ luni: la 3 luni

2. **Trimitere automată notificări**
   - Cron job care rulează la fiecare oră
   - Verifică notificările programate și le trimite la momentul potrivit
   - Notificări push + in-app

3. **Gestionare notificări**
   - Marcare ca citite
   - Marcare ca completate (când se adaugă măsurătoare)
   - Respingere (dismiss)
   - Programare automată următoare notificare

4. **Multi-user support**
   - Notificări pentru părinți și utilizatori conectați (linked users)
   - Fiecare utilizator primește notificarea personalizată

### Frontend

1. **Centru de notificări**
   - Vizualizare toate notificările
   - Filtrare (citite/necitite)
   - Badge cu număr notificări necitite
   - Acțiuni rapide (completează, respinge)

2. **Integrare dashboard**
   - Badge pe iconița de notificări
   - Navigare directă către growth tracking

3. **Push notifications**
   - Notificări native iOS/Android
   - Navigare către ecran relevant

## 🏗️ Arhitectură

### Backend

```
backend/
├── models/
│   └── GrowthNotification.js       # Model notificări growth
├── services/
│   └── growthNotificationService.js # Logică business notificări
├── routes/
│   └── growthNotificationRoutes.js  # API endpoints
└── controllers/
    └── growthController.js          # Actualizat cu logică notificări
```

### Frontend

```
frontend/
├── src/
│   ├── services/
│   │   └── growthNotificationService.ts  # API calls
│   └── pages/
│       └── NotificationCenterPage.tsx    # UI centru notificări
└── app/
    └── notifications.tsx                  # Route
```

## 🚀 Setup & Testing

### 1. Backend Setup

Serverul pornește automat scheduler-ul la startup (verifică `server.js`).

### 2. Test Backend

```bash
cd backend
node test-growth-notifications.js
```

Acest script va:
- Testa calculul datelor următoare măsurători
- Programa notificări pentru un bebeluș test
- Simula trimiterea notificărilor
- Testa marcarea ca completate

### 3. Test Manual API

#### Obține notificările utilizatorului
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://192.168.1.56:5000/api/growth-notifications
```

#### Număr notificări necitite
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://192.168.1.56:5000/api/growth-notifications/unread-count
```

#### Marchează ca citită
```bash
curl -X PUT \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://192.168.1.56:5000/api/growth-notifications/NOTIFICATION_ID/read
```

#### Marchează ca completată
```bash
curl -X PUT \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://192.168.1.56:5000/api/growth-notifications/NOTIFICATION_ID/complete
```

#### Trimite notificări pending (manual)
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://192.168.1.56:5000/api/growth-notifications/send-pending
```

### 4. Test Frontend

1. Deschide aplicația
2. Dashboard-ul va afișa badge cu număr notificări
3. Apasă pe iconița de notificări
4. Vei vedea centrul de notificări cu toate reminder-urile

## 📱 Flow Utilizator

### Crearea bebelușului
1. Utilizatorul adaugă un bebeluș nou
2. Backend programează automat prima notificare (1 lună de la naștere)

### Primirea notificării
1. La data programată, serverul trimite:
   - Notificare push (dacă utilizatorul are push token)
   - Notificare in-app (vizibilă în centrul de notificări)
2. Badge-ul de notificări se actualizează

### Interacțiune cu notificarea
1. Utilizatorul vede notificarea (push sau in-app)
2. Opțiuni:
   - **"Record Measurement"**: Navighează la growth tracking, după salvare:
     - Notificarea e marcată automat ca "completed"
     - Se programează automat următoarea notificare
   - **"Dismiss"**: Respinge notificarea (nu mai apare)
   - **Click pe notificare**: Navighează la profilul copilului

## 🔄 Logica de programare

```javascript
// 0-6 luni: monthly
if (ageInMonths < 6) {
  nextMeasurement = currentDate + 1 month;
}

// 6-12 luni: every 2 months
else if (ageInMonths < 12) {
  nextMeasurement = currentDate + 2 months;
}

// 12+ luni: every 3 months
else {
  nextMeasurement = currentDate + 3 months;
}

// Toate notificările se programează pe data de naștere
// Exemplu: născut pe 8 → notificări pe 8 ale fiecărei luni
```

## 🎨 UI Features

### Notification Card
- Avatar bebeluș cu culoare personalizată
- Titlu și mesaj notificare
- Indicator citit/necitit (linie albastră pe margine)
- Status badge (pending/sent/completed/dismissed)
- Data relativă ("Today", "2 days ago", etc.)
- Butoane acțiune:
  - "Record Measurement" (verde)
  - "Dismiss" (gri)

### Notification Center
- Header cu filtrare (toate/necitite)
- Banner cu număr notificări necitite
- Lista scrollabilă
- Pull-to-refresh
- Empty state pentru lista goală

### Dashboard Integration
- Badge pe iconița de clopot
- Badge combină:
  - Notificări growth
  - Notificări calendar/vaccin
  - Link requests
- Click pe clopot → Notification Center

## 🐛 Troubleshooting

### Notificările nu se trimit
1. Verifică că serverul rulează
2. Verifică log-urile: `📅 Growth notification scheduler started`
3. Test manual: `POST /api/growth-notifications/send-pending`

### Push notifications nu ajung
1. Verifică că utilizatorul are pushToken salvat în DB
2. Verifică Firebase Admin SDK setup
3. Verifică log-urile: `✅ Sent growth notification to...`

### Notificările nu se marchează automat
1. Verifică că `growthController.js` e actualizat
2. Verifică că userId este trimis corect în request
3. Verifică log-urile: `✅ Marked X growth notifications as completed`

## 🔮 Posibile îmbunătățiri viitoare

1. **Customizare frecvență**
   - Permiteți utilizatorilor să personalizeze intervalul
   - Opțiune să dezactiveze notificările

2. **Reminder-uri înainte**
   - Notificare cu 1 zi înainte de data măsurătorii

3. **Smart scheduling**
   - Învață din comportamentul utilizatorului
   - Ajustează ora notificărilor

4. **Statistici**
   - Dashboard admin cu rate de completare
   - Analiză frecvență măsurători

5. **Multi-baby support**
   - Badge separat pentru fiecare copil
   - Grupare notificări pe copil

## 📚 API Reference

Toate endpoint-urile necesită autentificare (header `Authorization: Bearer TOKEN`).

### GET /api/growth-notifications
Obține toate notificările utilizatorului.

**Query params:**
- `includeRead` (boolean): Include notificările citite (default: true)
- `limit` (number): Număr maxim rezultate (default: 50)
- `skip` (number): Offset pentru paginare (default: 0)

### GET /api/growth-notifications/unread-count
Returnează numărul de notificări necitite.

### POST /api/growth-notifications/:babyId/schedule
Programează notificările inițiale pentru un bebeluș.

### PUT /api/growth-notifications/:notificationId/read
Marchează o notificare ca citită.

### PUT /api/growth-notifications/:notificationId/complete
Marchează o notificare ca completată și programează următoarea.

### PUT /api/growth-notifications/:notificationId/dismiss
Respinge o notificare.

### POST /api/growth-notifications/send-pending
Trimite manual toate notificările pending (folosit și de cron job).

## 💡 Best Practices

1. **Testare**
   - Testează cu date de naștere diferite (recent, 6 luni, 12+ luni)
   - Verifică că notificările se programează corect

2. **Performance**
   - Notificările folosesc indexuri MongoDB pentru queries rapide
   - Cleanup automat notificări vechi (90+ zile)

3. **User Experience**
   - Notificările sunt non-intrusive
   - Utilizatorul poate dismisses orice notificare
   - Badge-urile se actualizează în timp real

4. **Monitoring**
   - Verifică log-urile pentru erori
   - Monitorizează rate de completare
   - Track failed push notifications

## ✅ Checklist Implementare

- [x] Model GrowthNotification
- [x] Service growthNotificationService
- [x] Routes growthNotificationRoutes
- [x] Controller updates (growthController)
- [x] Server integration (cron job)
- [x] Baby service integration (auto-schedule)
- [x] Frontend service (API calls)
- [x] Notification Center UI
- [x] Dashboard integration (badge)
- [x] Push notifications setup
- [x] Test script
- [x] Documentație

---

**Status**: ✅ Implementat și gata de testare!

**Creat**: 11 Februarie 2026
