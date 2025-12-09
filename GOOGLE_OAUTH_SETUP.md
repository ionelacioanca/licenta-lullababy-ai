# Google OAuth Setup Guide

## Overview
This guide will help you set up Google OAuth authentication for LullaBaby AI.

## Prerequisites
- Google Cloud Console account
- Your app's package name (from app.json)

## Steps

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "NEW PROJECT"
3. Enter project name: "LullaBaby AI"
4. Click "CREATE"

### 2. Enable Google Sign-In API

1. In your project dashboard, go to "APIs & Services" → "Library"
2. Search for "Google Sign-In API" or "Google+ API"
3. Click on it and press "ENABLE"

### 3. Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Select "External" user type
3. Fill in required information:
   - App name: **LullaBaby AI**
   - User support email: Your email
   - Developer contact email: Your email
4. Click "SAVE AND CONTINUE"
5. Skip "Scopes" for now (click "SAVE AND CONTINUE")
6. Add test users if needed
7. Click "SAVE AND CONTINUE"

### 4. Create OAuth 2.0 Credentials

#### ⭐ For Web Application (Expo Go / Development) - **START HERE!**

**This is all you need for development and testing!**

1. Go to "APIs & Services" → "Credentials"
2. Click "CREATE CREDENTIALS" → "OAuth client ID"
3. Select "Web application"
4. Name: "LullaBaby Web"
5. Add **BOTH** of these Authorized redirect URIs:
   ```
   https://auth.expo.io/@ionela.cioanca/licenta-lullababy-ai
   http://localhost:8081
   ```
6. Click "CREATE"
7. **COPY THE CLIENT ID** - you'll need this

**✅ You're done! Skip Android and iOS sections for now.**

---

#### For Android (Production) - **OPTIONAL - Only for standalone builds**

⚠️ **Skip this section unless you're building a production APK/AAB**

1. Click "CREATE CREDENTIALS" → "OAuth client ID"
2. Select "Android"
3. Name: "LullaBaby Android"
4. Get your SHA-1 certificate fingerprint:
   ```bash
   cd frontend/android
   keytool -list -v -keystore app/debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```
5. Copy the SHA-1 fingerprint
6. Package name: `com.ionelacioanca.licenselullababyai` (from app.json slug)
7. Click "CREATE"
8. **COPY THE CLIENT ID**

#### For iOS (Production) - **OPTIONAL - Only for standalone builds**

⚠️ **Skip this section unless you're building a production IPA for App Store**

**Note:** You need an active Apple Developer account ($99/year) and an Xcode project to get a Bundle ID.

1. Click "CREATE CREDENTIALS" → "OAuth client ID"
2. Select "iOS"
3. Name: "LullaBaby iOS"
4. Bundle ID: Get from Xcode project or EAS build (e.g., `com.ionelacioanca.lullababy`)
5. Click "CREATE"
6. **COPY THE CLIENT ID**

### 5. Update Your Code

Open `frontend/src/services/googleAuthService.ts` and replace the **Web Client ID**:

```typescript
const GOOGLE_CLIENT_ID_WEB = 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com';
```

**For development with Expo Go**, you can leave iOS and Android as placeholders:

```typescript
const GOOGLE_CLIENT_ID_IOS = 'YOUR_IOS_CLIENT_ID_HERE.apps.googleusercontent.com';
const GOOGLE_CLIENT_ID_ANDROID = 'YOUR_ANDROID_CLIENT_ID_HERE.apps.googleusercontent.com';
```

They're only needed for production standalone builds.

### 6. Test the Integration

1. Restart your Expo development server:
   ```bash
   cd frontend
   npx expo start
   ```

2. Go to the Login page
3. Click "Continue with Google"
4. You should see a Google sign-in popup
5. Sign in with your Google account
6. Grant permissions
7. You should be redirected back to the app and logged in

## Important Notes

### For Expo Go Development
- Use the **Web Client ID** for testing with Expo Go
- The redirect URI should be: `https://auth.expo.io/@ionela.cioanca/licenta-lullababy-ai`

### For Production Builds
- You'll need to create a standalone Android/iOS build
- Use platform-specific client IDs (Android/iOS)
- Update redirect URIs accordingly

### Security
- Never commit your Client IDs to public repositories
- Consider using environment variables for production
- Keep your client secrets secure (if using web OAuth flow)

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Make sure your redirect URI in Google Console matches exactly
- For Expo: `https://auth.expo.io/@YOUR_USERNAME/YOUR_SLUG`
- Check that the scheme in app.json is set to `lullababy`

### Error: "Invalid client ID"
- Double-check you copied the correct Client ID
- Make sure you're using the right Client ID for the platform (Web/Android/iOS)

### User not created in database
- Check backend logs for errors
- Verify the `/api/users/auth/google` endpoint is working
- Make sure MongoDB is running

## Next Steps

Once Google OAuth is working, you can add:
- Facebook OAuth (similar process with Facebook Developer Console)
- Apple Sign-In (requires Apple Developer account)

## Support

If you encounter issues:
1. Check Google Cloud Console logs
2. Check backend console logs
3. Check Expo console logs
4. Verify all Client IDs are correct
