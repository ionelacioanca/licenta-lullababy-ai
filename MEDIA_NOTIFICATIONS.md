# Notificări Media Persistente - LullaBaby

## Ce am implementat

Notificări media persistente similar cu Spotify/YouTube care permit:
- ✅ Control al redării din centrul de notificări
- ✅ Control de pe lockscreen
- ✅ Butoane: Play/Pause, Next, Previous
- ✅ Afișarea artwork-ului, titlului și artistului
- ✅ Background audio playback
- ✅ Compatibilitate cu Raspberry Pi și redarea locală

## Pachete instalate

- `expo-notifications` - Pentru permisiuni și gestionarea notificărilor
- `expo-keep-awake` - Pentru a menține app-ul activ
- `react-native-track-player` - Pentru notificări media native cu controale complete

## Configurare

### 1. Testare în Development cu Expo Go

```bash
cd frontend
npm start
```

Apoi:
1. Scanează QR code-ul cu Expo Go de pe telefon
2. Pornește o melodie din player
3. Apasă Home sau Lock - notificarea va rămâne persistentă
4. Controlează redarea din centrul de notificări

**IMPORTANT**: Expo Go are limitări pentru notificările media. Pentru funcționalitate completă, trebuie să faci un development build.

### 2. Development Build (RECOMANDAT pentru testare completă)

```bash
# Instalează EAS CLI
npm install -g eas-cli

# Login
eas login

# Configurează build-ul
cd frontend
eas build:configure

# Creează development build pentru Android
eas build --profile development --platform android
```

După ce build-ul e gata:
1. Descarcă APK-ul de pe link-ul primit
2. Instalează pe telefon
3. Pornește serverul: `npm start`
4. Scanează QR code-ul din development build

### 3. Production Build (APK final)

```bash
# Preview build (pentru testare înainte de publicare)
eas build --profile preview --platform android

# Production build
eas build --profile production --platform android
```

## Fișiere modificate/create

### Noi
- `src/services/mediaNotificationService.ts` - Serviciu pentru notificări media
- `src/services/trackPlayerService.js` - Service worker pentru react-native-track-player

### Modificate
- `src/components/SoundPlayer.tsx` - Integrare notificări
- `app.json` - Configurare permissions și plugins
- `package.json` - Dependențe noi

## Permisiuni Android

Aplicația cere acum:
- `NOTIFICATIONS` - Pentru a afișa notificări
- `FOREGROUND_SERVICE` - Pentru redare în background
- `WAKE_LOCK` - Pentru a menține device-ul activ

## Testare

### Pe Development Build sau Production APK

1. **Pornește o melodie**
   - Deschide app-ul
   - Navighează la Dashboard
   - Selectează și pornește o melodie lullaby

2. **Testează notificarea**
   - Apasă butonul Home
   - Trage down centrul de notificări
   - Ar trebui să vezi notificarea cu controale

3. **Testează controlele**
   - ▶️ Play/Pause - pornește/oprește melodia
   - ⏭️ Next - melodia următoare
   - ⏮️ Previous - melodia anterioară

4. **Testează lockscreen**
   - Lock phone (apasă butonul de power)
   - Ar trebui să vezi controlele media pe lockscreen
   - Testează butoanele

## Troubleshooting

### Notificările nu apar în Expo Go
**Soluție**: Expo Go are limitări. Folosește development build sau production APK.

### "TrackPlayer is not initialized"
**Soluție**: Repornește app-ul. Serviciul se inițializează la primul playback.

### Butoanele din notificare nu funcționează
**Soluție**: Asigură-te că ai development build sau production APK, nu Expo Go.

### Audio nu continuă în background
**Soluție**: Verifică că ai permissions în `app.json` și rebuild app-ul.

## Următorii pași

Pentru APK final:
```bash
# 1. Build production
eas build --profile production --platform android

# 2. Descarcă APK-ul când e gata
# Link-ul va fi afișat în terminal

# 3. Instalează pe telefon
# Transferă APK-ul și instalează-l
```

## Note tehnice

- Notificările media folosesc API-ul nativ Android MediaStyle
- TrackPlayer gestionează doar notificarea, redarea e controlată de expo-av sau Raspberry Pi
- Artwork-ul e afișat din thumbnail-ul melodiei
- Durata și progresul sunt sincronizate cu player-ul
