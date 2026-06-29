# 🧪 Growth Reminder Testing Guide

## Overview
This testing dashboard allows you to simulate growth reminder notifications and diagnose notification system issues.

## Quick Start

### 1. Access the Test Page

In your app, navigate to the test page using the router:
```typescript
router.push('/testGrowthReminder');
```

Or access it programmatically from any page:
```typescript
import { useRouter } from 'expo-router';

export const MyComponent = () => {
  const router = useRouter();
  
  const goToTestingDashboard = () => {
    router.push('/testGrowthReminder');
  };
  
  return (
    <Button onPress={goToTestingDashboard} title="Go to Testing Dashboard" />
  );
};
```

### 2. Test Growth Reminder

**Step by step:**

1. **Login** to your account (this registers your push token)
2. **Navigate to** `/testGrowthReminder` 
3. **Click** "Simulate Growth Reminder"
4. **Check your phone** for a test push notification
5. **Open the app** and go to Notification Center → Growth tab to see the reminder

**Expected flow:**
```
Frontend Click
    ↓
POST /api/growth-notifications/test/simulate/:babyId
    ↓
Backend:
  - Finds baby (69b3f0b451e700b403e2156f)
  - Finds parent user
  - Creates GrowthNotification with status='sent'
  - Sends push notification to user
    ↓
Phone receives push notification 🔔
    ↓
App shows notification in:
  - Notification Center (Growth tab)
  - Push notification banner (if in foreground)
```

---

## Test Components

### 1. 🧪 Simulate Growth Reminder
**What it does:**
- Creates a test growth measurement reminder
- Sends a real push notification to your phone
- Marks it as "sent" status

**Expected result:**
- ✅ Notification appears in Notification Center
- ✅ Push notification on device
- ✅ Notification shows: "🧪 TEST: [BabyName] is X months old. Record weight and length."

**Debug if failing:**
- Check if push token is registered (see "Check User Info")
- Check backend logs for errors marked with `[TEST]`
- Verify baby ID is correct

### 2. 🔍 Check User Info & Token
**What it does:**
- Shows your logged-in user email
- Shows your user ID
- Indicates if push token is registered

**Expected result:**
- ✅ Your email address
- ✅ Non-empty user ID
- ✅ Push token should be registered (checked in app on login)

**Debug if failing:**
- If push token not shown: logout and login again to re-register
- Check browser console for push token registration logs

### 3. 📊 Fetch Growth Notifications
**What it does:**
- Retrieves all growth notifications for your account
- Shows total count and unread count

**Expected result:**
- ✅ Total count increases by 1 after simulation
- ✅ Unread count reflects unread notifications
- ✅ Test notifications marked with "🧪 TEST"

**Debug if failing:**
- Check if backend is responding to `/api/growth-notifications`
- Check auth token is valid (may need to login again)

---

## Backend Endpoint Details

### Simulate Growth Reminder
```
POST /api/growth-notifications/test/simulate/:babyId
Authorization: Bearer <token>

Params:
  - babyId: 69b3f0b451e700b403e2156f (example)

Response:
{
  "success": true,
  "notification": {
    "_id": "...",
    "babyId": "...",
    "userId": "...",
    "status": "sent",
    "title": "📏 Test Reminder: Time to measure [BabyName]",
    "body": "🧪 TEST: [BabyName] is X months old. Record weight and length."
  },
  "baby": {
    "name": "Baby Name",
    "ageInMonths": 6
  },
  "user": {
    "email": "user@example.com",
    "hasPushToken": true
  }
}
```

### Backend Console Output
When you simulate a reminder, you'll see detailed logging:
```
export async function evaluateGrowth(weight, length, ageInMonths) {
    // Standarde WHO simplificate pentru vîrstele cheie (0-24 luni)
    const weightStandard = WHO_STANDARDS.weight[closestAgeBracket];
    
    let weightStatus = 'normal';
    if (weight < weightStandard.min) {
        weightStatus = 'below_normal'; // Risc de subponderabilitate
    } else if (weight > weightStandard.max) {
        weightStatus = 'above_normal'; // Risc de supragreutate
    }

    // Generarea feedback-ului textual pentru interfața client
    let feedback = `La vârsta de ${ageInMonths} luni:\n`;
    feedback += `📊 Greutate: ${weight}kg (Interval WHO: ${weightStandard.min}-${weightStandard.max}kg)`;
    
    return { weightStatus, lengthStatus, feedback };
}
```
========== 🧪 [TEST] SIMULATE GROWTH REMINDER ==========
  babyId: 69b3f0b451e700b403e2156f
  userId: ...
  
  🔍 Looking for baby: 69b3f0b451e700b403e2156f
  ✅ Found baby: [BabyName] (parentId: ...)
  
  🔍 Looking for user: ...
  ✅ Found user: user@example.com
  📱 Push token exists: true
  
  👶 Baby age: 6 months
  
  📅 Next measurement in 2 month(s) → ...
  
  📝 Creating test GrowthNotification...
  ✅ Notification created: ...
  
  📤 Sending test push notification...
  ✅ Push result: ✅ SUCCESS

========== END TEST ==========
```

---

## Troubleshooting

### ❌ "No authentication token found"
**Problem:** You're not logged in
**Solution:** Go back and login to your account first

### ❌ "Baby not found"
**Problem:** Baby ID doesn't exist or user doesn't have access
**Solution:** Check baby ID is correct (default: 69b3f0b451e700b403e2156f)

### ❌ "User not found"
**Problem:** Authentication token is invalid or expired
**Solution:** Logout and login again

### ❌ "Push token missing" (hasPushToken: false)
**Problem:** Push notifications not registered on login
**Solution:**
1. Go to app Settings
2. Check notification permissions are enabled
3. Logout and login again
4. This will re-register push token

### ❌ Push notification not received but test passed
**Problem:** Push token exists but notification not delivered
**Possible causes:**
- Device notification permissions disabled
- Expo push service issues
- Firebase Admin SDK not configured correctly

**Debug:**
1. Check backend logs for push notification errors
2. Verify Firebase credentials in backend config
3. Check Expo push service status

### ❌ Notification in DB but not in Notification Center
**Problem:** Notification created but doesn't appear in UI
**Possible causes:**
- Notification Center not fetching baby correctly
- Status is not 'sent' or 'pending'
- User ID mismatch

**Debug:**
1. Click "Fetch Growth Notifications" to see if it appears there
2. Check if notification read/unread status
3. Verify baby is linked to parent account

---

## Integration in Your App

### Add Test Button to Dashboard

Add this to your dashboard or any button menu:

```typescript
import { useRouter } from 'expo-router';

export const DashboardPage = () => {
  const router = useRouter();

  return (
    <View>
      {/* ... existing content ... */}
      
      {/* Add this for easy access during development */}
      <TouchableOpacity 
        onPress={() => router.push('/testGrowthReminder')}
        style={styles.debugButton}
      >
        <Text>🧪 Test Growth Reminder</Text>
      </TouchableOpacity>
    </View>
  );
};
```

---

## What Gets Created

When you simulate a growth reminder, the backend creates:

1. **GrowthNotification Document** in MongoDB
   - Status: "sent"
   - Type: "growth_measurement"
   - Title: "📏 Test Reminder: Time to measure [BabyName]"
   - Body: "🧪 TEST: [BabyName] is X months old. Record weight and length."
   - Visible in: Notification Center (Growth tab)

2. **Push Notification** via Expo
   - Delivered to device
   - Appears as banner/notification
   - Includes: Title, body, baby info, timestamp

3. **Backend Logs**
   - Detailed logs marked with `[TEST]`
   - Shows flow from baby lookup → notification creation → push send

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────┐
│  Frontend: Click "Simulate Growth Reminder" │
└─────────────┬───────────────────────────────┘
              │
              ↓ POST /api/growth-notifications/test/simulate/:babyId
┌─────────────────────────────────────────────┐
│  Backend Route (Authenticated)              │
├─────────────────────────────────────────────┤
│  1. Find baby by ID                         │
│  2. Get parent (current user)               │
│  3. Calculate age in months                 │
│  4. Create GrowthNotification (status=sent) │
│  5. Send push notification                  │
│  6. Return success response                 │
└─────────────┬───────────────────────────────┘
              │
              ↓ Response + Push Notification
┌─────────────────────────────────────────────┐
│  Frontend: Show success alert               │
│  Phone: Receive push notification           │
└─────────────┬───────────────────────────────┘
              │
              ↓ Manual navigation
┌─────────────────────────────────────────────┐
│  Frontend: Open Notification Center         │
│  Growth tab shows test notification         │
└─────────────────────────────────────────────┘
```

---

## Key Test Files

| File | Purpose |
|------|---------|
| `frontend/app/testGrowthReminder.tsx` | Test UI Dashboard |
| `backend/routes/growthNotificationRoutes.js` | Test endpoint (POST /test/simulate/:babyId) |
| `backend/services/growthNotificationService.js` | Growth reminder logic |
| `frontend/src/pages/NotificationCenterPage.tsx` | Where notifications appear |

---

## Next Steps After Testing

After confirming growth reminders work:

1. ✅ Test in Notification Center
2. ✅ Verify unread count updates
3. ✅ Mark as read/completed
4. ✅ Check next reminder is scheduled
5. ✅ Test recurring reminders (monthly → bimonthly → quarterly)

## Questions?

Check these files for more details:
- `GROWTH_TRACKING_FEATURE.md` - Complete growth feature documentation
- Backend logs (when running `npm start` in backend)
- Frontend console (Expo DevTools)

```typescript
evaluateGrowth(weight, length, ageInMonths, gender = 'unknown') {
    const weightStandards = { ... };
    const lengthStandards = { ... };
    const ages = Object.keys(weightStandards).map(Number).sort((a, b) => a - b);
    let closestAge = ages[0];
    for (const age of ages) {
      if (Math.abs(age - ageInMonths) < Math.abs(closestAge - ageInMonths)) {
        closestAge = age;
      }
    }
    if (weightKg < weightRef.min) {
      weightStatus = 'below normal range';
    ...
    } else {
      weightStatus = 'healthy';
    }
    if (lengthCm < lengthRef.min) {
      lengthStatus = 'below normal range';
    ...
      lengthStatus = 'healthy';
    }
```