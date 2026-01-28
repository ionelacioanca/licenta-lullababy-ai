# Notificări Media - Limitări și Soluții

## ⚠️ Limitări în Expo Go

**Expo Go NU suportă complet notificările media interactive** începând cu SDK 53. Aceasta înseamnă:

❌ **Ce NU funcționează în Expo Go:**
- Butoane de control în notificare (Play/Pause, Next, Previous)
- Control volum din notificare
- Artwork/imagine în notificare
- Notificări persistente cu stil media
- Interacțiune cu notificările fără a deschide app-ul

✅ **Ce FUNCȚIONEAZĂ în Expo Go:**
- Notificări simple cu text
- Background audio (muzica continuă când app-ul e în background)
- Controale în aplicație
- Sincronizare cu Raspberry Pi

## 🚀 Soluția: Development Build

Pentru notificări media complete cu butoane și control, trebuie să creezi un **Development Build**.

### Cum creezi Development Build:

```powershell
# 1. Instalează EAS CLI (dacă nu ai)
npm install -g eas-cli

# 2. Login în cont Expo
eas login
# Username: ionela.cioanca

# 3. Creează build-ul
cd frontend
eas build --profile development --platform android
```

### Ce primești în Development Build:

✅ **Notificare persistentă cu:**
- ▶️ **Buton Play/Pause** - controlează redarea direct din notificare
- ⏭️ **Buton Next** - trece la melodia următoare
- ⏮️ **Buton Previous** - revine la melodia anterioară
- 🔊 **Afișare volum** - arată volumul curent (ex: "Volume: 70%")
- 🎵 **Artwork** - imaginea melodiei
- 📌 **Sticky notification** - rămâne vizibilă permanent

### Implementare Actuală:

Am implementat deja:
1. ✅ Handler-e pentru butoane (Play/Pause, Next, Previous, Volume Up/Down)
2. ✅ Notification categories cu acțiuni
3. ✅ Afișare volum în text
4. ✅ Previne actualizări multiple (doar când se schimbă starea)
5. ✅ Background audio configuration

### Testare în Development Build:

După instalarea APK-ului de development:

1. **Pornește o melodie** → Apare notificarea persistentă
2. **Apasă Home** → Notificarea rămâne vizibilă
3. **Controlează din notificare:**
   - Tap pe ⏯️ pentru Play/Pause
   - Tap pe ⏭️ pentru Next
   - Tap pe ⏮️ pentru Previous
4. **Lock screen** → Controalele sunt vizibile pe lockscreen

## 📱 Pentru APK Final (Production):

```powershell
cd frontend
eas build --profile production --platform android
```

Production APK are toate feature-urile + optimizări pentru distribuire.

## 🎯 Recomandări:

| Scop | Tool | Notificări Media |
|------|------|------------------|
| **Test rapid UI** | Expo Go | ❌ Limitate |
| **Development & Testing** | Development Build | ✅ Complete |
| **Demonstrație finală** | Production APK | ✅ Complete + Optimizat |

## 📝 Note Importante:

1. **Expo Go** este excelent pentru iterare rapidă UI/UX, dar are limitări pentru notificări
2. **Development Build** ia 15-30 min să se construiască, dar oferă experiență completă
3. **Production APK** este versiunea finală, optimizată, ready pentru distribuire
4. Toate build-urile se fac pe servere Expo (nu trebuie Android Studio)

## 🔧 Troubleshooting:

### Notificările nu apar deloc:
- Verifică că ai făcut `eas login`
- Verifică permissions în Settings > Apps > LullaBaby
- Repornește app-ul după instalare

### Butoanele nu funcționează:
- **Normal în Expo Go** - așteaptă Development Build
- În Development Build: verifică că handler-ele sunt înregistrate

### Volumul nu se actualizează:
- Volumul se afișează în text în notificare
- Butoanele de volum funcționează doar în Development Build

---

**TL;DR:** Pentru notificări media complete cu butoane → folosește Development Build, nu Expo Go! 🎵
