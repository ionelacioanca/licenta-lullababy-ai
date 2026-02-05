# Ghid Rapid - Testare pe Telefon Android

## Opțiunea 1: Testare Rapidă cu Expo Go (Limitată)

### Pregătire
1. **Instalează Expo Go** pe telefon din Play Store
2. **Pornește backend-ul** (dacă nu rulează deja):
   ```powershell
   cd backend
   npm start
   ```

3. **Pornește frontend-ul**:
   ```powershell
   cd frontend
   npm start
   ```

### Testare
1. Scanează QR code-ul din terminal cu Expo Go
2. App-ul se va încărca pe telefon
3. Testează funcționalitatea de bază

**⚠️ Limitări în Expo Go:**
- Notificările media nu vor funcționa complet
- Unele module native sunt limitate
- Pentru notificări media complete, vezi Opțiunea 2

---

## Opțiunea 2: Development Build (Recomandat pentru Test Complet)

### Pregătire (o singură dată)

1. **Instalează EAS CLI**:
   ```powershell
   npm install -g eas-cli
   ```

2. **Login în cont Expo** (folosește contul existent: ionela.cioanca):
   ```powershell
   eas login
   ```
   - Username: `ionela.cioanca`
   - Password: [parola ta Expo]

3. **Configurează build-ul** (dacă nu e configurat):
   ```powershell
   cd frontend
   eas build:configure
   ```

### Creează Development Build

```powershell
cd frontend
eas build --profile development --platform android
```

**Ce se întâmplă:**
- Build-ul se face pe servere Expo (15-30 min)
- Vei primi un link pentru download
- Nu trebuie să ai Android Studio

**Când e gata:**
1. Deschide link-ul de download de pe telefon
2. Descarcă APK-ul
3. Instalează (permite "Install from unknown sources")

### Testare cu Development Build

1. **Pornește backend-ul**:
   ```powershell
   cd backend
   npm start
   ```

2. **Pornește Metro bundler**:
   ```powershell
   cd frontend
   npm start
   ```

3. **Pe telefon**:
   - Deschide app-ul instalat
   - Scanează QR code-ul (prima dată)
   - App-ul se conectează la server-ul de development

4. **Testează notificările media**:
   - Pornește o melodie lullaby
   - Apasă Home
   - Trage down centrul de notificări
   - Controlează redarea (Play/Pause/Next/Previous)
   - Lock phone și testează de pe lockscreen

---

## Opțiunea 3: Production APK (Pentru Testing Final)

### Creează APK Production

```powershell
cd frontend
eas build --profile production --platform android
```

**Diferențe față de Development:**
- APK optimizat, mai mic
- Nu necesită Metro bundler
- Funcționează standalone
- Perfect pentru distribuire

### Testare Production APK

1. Descarcă APK-ul când e gata
2. Instalează pe telefon
3. Deschide app-ul - funcționează independent
4. Toate feature-urile sunt disponibile

---

## Ce Funcționează în Fiecare Variantă

| Feature | Expo Go | Dev Build | Production APK |
|---------|---------|-----------|----------------|
| UI & Navigation | ✅ | ✅ | ✅ |
| Backend API | ✅ | ✅ | ✅ |
| Audio Player | ✅ | ✅ | ✅ |
| Notificări Media | ❌ | ✅ | ✅ |
| Lockscreen Controls | ❌ | ✅ | ✅ |
| Background Audio | ⚠️ | ✅ | ✅ |
| Hot Reload | ✅ | ✅ | ❌ |
| Standalone | ❌ | ❌ | ✅ |

---

## Comenzi Rapide

### Pentru Development Zilnic
```powershell
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend  
cd frontend
npm start
```

### Pentru Testare pe Telefon
```powershell
# Asigură-te că ambele (backend + frontend) rulează
# Scanează QR code cu Expo Go sau Development Build
```

### Pentru Build Nou
```powershell
cd frontend

# Development (pentru testare cu hot reload)
eas build --profile development --platform android

# Production (APK final)
eas build --profile production --platform android
```

---

## Troubleshooting

### "Cannot connect to Metro bundler"
- Asigură-te că telefonul și PC-ul sunt pe același WiFi
- În terminal, apasă `r` pentru restart
- Verifică firewall-ul Windows

### "Network request failed" în app
- Backend-ul trebuie să ruleze
- Verifică IP-ul în cod (192.168.1.20)
- Test: deschide `http://192.168.1.20:5000` în browser-ul de pe telefon

### Build-ul eșuează
- Verifică că ai făcut login: `eas whoami`
- Curăță cache: `eas build --clear-cache`
- Verifică package.json pentru erori

### Notificările nu apar
- Folosești Development Build sau Production APK? (Nu Expo Go)
- Verifică permissions în Settings > Apps > LullaBaby
- Repornește app-ul după instalare

---

## Recomandare pentru Teza

**Pentru demonstrații și screenshots:**
→ Folosește **Production APK**

**Pentru development și debugging:**
→ Folosește **Development Build** + hot reload

**Pentru test rapid UI/UX:**
→ Folosește **Expo Go**

---

## Contact & Support

- EAS Build Dashboard: https://expo.dev/accounts/ionela.cioanca/projects/licenta-lullababy-ai
- Expo Docs: https://docs.expo.dev/
- React Native Track Player: https://react-native-track-player.js.org/
