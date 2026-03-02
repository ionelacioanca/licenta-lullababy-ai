# 🚀 Quick Start - Growth Tracking Notifications

## Testare Rapidă

### Backend

1. **Pornește serverul**
```bash
cd backend
npm start
```

Verifică că vezi în console:
```
📅 Growth notification scheduler started
```

2. **Rulează scriptul de test**
```bash
node test-growth-notifications.js
```

Vei vedea:
- ✅ Calculul datelor pentru notificări
- ✅ Programarea notificărilor pentru un bebeluș
- ✅ Simularea trimiterii notificărilor
- ✅ Marcarea ca completate

### Frontend

1. **Pornește aplicația**
```bash
cd frontend
npm start
```

2. **Test flow complet:**

#### Pas 1: Adaugă un bebeluș nou
- Du-te la "Babies List"
- Adaugă un bebeluș cu data de naștere acum ~1 lună
- **➡️ Backend va programa automat prima notificare!**

#### Pas 2: Forțează trimiterea notificării
```bash
# În terminal, execută:
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://192.168.1.56:5000/api/growth-notifications/send-pending
```

Sau modifică data programată în MongoDB să fie în trecut.

#### Pas 3: Vezi notificarea
- Dashboard → Apasă pe iconița clopoțel (ar trebui să vezi badge cu "1")
- Vei vedea notificarea: "Time to measure [baby name]!"

#### Pas 4: Acționează
- Apasă "Record Measurement"
- Adaugă greutate și înălțime
- Salvează
- **➡️ Notificarea se marchează automat ca completată**
- **➡️ Se programează automat următoarea notificare**

#### Pas 5: Verifică
- Întoarce-te la Notification Center
- Vei vedea notificarea marcată ca "Completed"
- Badge-ul dispare

## 🔍 Verificare Database

### Vezi toate notificările
```javascript
// În MongoDB Compass sau mongo shell:
db.growthnotifications.find().pretty()
```

### Vezi notificările pentru un bebeluș specific
```javascript
db.growthnotifications.find({ 
  babyId: ObjectId("BABY_ID_HERE") 
}).pretty()
```

### Vezi notificările necitite
```javascript
db.growthnotifications.find({ 
  read: false,
  status: "sent"
}).pretty()
```

## 📱 Test Push Notifications

### Setup
1. Asigură-te că ai Firebase Admin SDK configurat
2. Verifică că utilizatorul are `pushToken` în baza de date

### Test manual
```bash
# Obține token-ul utilizatorului din DB
# Apoi trimite o notificare de test:

curl -X POST http://192.168.1.56:5000/api/growth-notifications/send-pending \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Ar trebui să primești notificare push pe telefon!

## 🎯 Scenarii de Test

### Scenariu 1: Bebeluș nou-născut (0-1 luni)
```
Data nașterii: 15 Ianuarie 2026
Prima notificare: 15 Februarie 2026 (1 lună)
A doua notificare: 15 Martie 2026 (2 luni)
```

### Scenariu 2: Bebeluș 7 luni
```
Data nașterii: 15 Iunie 2025
Următoarea notificare: 15 Martie 2026 (9 luni)
După aceea: 15 Mai 2026 (11 luni) - la 2 luni
```

### Scenariu 3: Bebeluș 14 luni
```
Data nașterii: 15 Decembrie 2024
Următoarea notificare: 15 Martie 2026 (15 luni)
După aceea: 15 Iunie 2026 (18 luni) - la 3 luni
```

## 🐛 Debugging

### Log-uri importante

**Backend:**
```
✅ Scheduled growth notifications for baby [name]
📬 Found X pending growth notifications to send
✅ Sent growth notification to [user] for baby [name]
✅ Marked X growth notifications as completed
```

**Frontend:**
```typescript
// În Console.log când deschizi Notification Center:
console.log('Growth notifications loaded:', notifications);
console.log('Unread count:', unreadCount);
```

### Probleme comune

#### Notificările nu apar în UI
- Verifică că backend-ul rulează
- Verifică network tab: `GET /api/growth-notifications`
- Verifică token-ul de autentificare

#### Badge-ul nu se actualizează
- Verifică că `loadGrowthNotificationsCount()` e apelat
- Verifică response la: `GET /api/growth-notifications/unread-count`
- Force refresh: pull-to-refresh în Notification Center

#### Notificările nu se trimit automat
- Verifică că serverul rulează (cron job e în `server.js`)
- Verifică că data programată e în trecut
- Trigger manual: `POST /api/growth-notifications/send-pending`

## ✅ Checklist Final

- [ ] Backend pornește fără erori
- [ ] Scriptul de test rulează cu succes
- [ ] Poți adăuga un bebeluș nou
- [ ] Notificarea se programează automat
- [ ] Poți vedea notificarea în Notification Center
- [ ] Badge-ul apare pe dashboard
- [ ] Poți marca ca completată
- [ ] Următoarea notificare se programează automat
- [ ] Push notification ajunge pe telefon

## 🎉 Gata!

Sistemul e functional! Pentru detalii tehnice complete, vezi [GROWTH_NOTIFICATIONS.md](./GROWTH_NOTIFICATIONS.md).
