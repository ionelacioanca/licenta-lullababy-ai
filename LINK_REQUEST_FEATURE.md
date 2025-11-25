# Link Request System

## Overview
This feature allows nannies and other caregivers to request access to parent accounts. Parents receive in-app notifications and can accept or decline these requests.

## Features

### For Nanny/Other Users:
- **Request Parent Link**: Send a link request to a parent by entering their email address
- **Optional Message**: Include a personal message with the request
- **Track Requests**: View the status of sent requests (pending/accepted/declined)

### For Parents:
- **Notification Badge**: See the count of pending link requests in the dashboard header
- **Review Requests**: View detailed information about who wants to link
- **Accept/Decline**: Approve or reject link requests with a single tap
- **Link Management**: Once accepted, the requester gains access to baby information

## API Endpoints

### Backend Routes (`/api/link-request`)

#### `POST /send-request`
Send a link request to a parent.
- **Auth**: Required (Bearer token)
- **Body**: 
  ```json
  {
    "parentEmail": "parent@example.com",
    "message": "Optional message"
  }
  ```
- **Response**: Link request object with status "pending"

#### `GET /pending`
Get all pending link requests for the logged-in parent.
- **Auth**: Required (Bearer token)
- **Response**: Array of pending link requests

#### `GET /pending/count`
Get count of pending link requests (for notification badge).
- **Auth**: Required (Bearer token)
- **Response**: `{ count: number }`

#### `POST /accept/:requestId`
Accept a link request.
- **Auth**: Required (Bearer token, must be parent)
- **Response**: Updated link request with status "accepted"
- **Effect**: Adds parent ID to requester's `relatedParentIds`

#### `POST /decline/:requestId`
Decline a link request.
- **Auth**: Required (Bearer token, must be parent)
- **Response**: Updated link request with status "declined"

#### `GET /my-requests`
Get all link requests sent by the current user.
- **Auth**: Required (Bearer token)
- **Response**: Array of link requests with status

## Database Schema

### LinkRequest Model
```javascript
{
  requesterId: ObjectId (ref: User),
  requesterName: String,
  requesterRole: String, // "nanny", "grandparent", etc.
  parentId: ObjectId (ref: User),
  parentEmail: String,
  status: String (enum: ['pending', 'accepted', 'declined']),
  message: String (optional),
  createdAt: Date,
  updatedAt: Date
}
```

## Frontend Components

### `LinkRequestNotifications`
Modal that displays pending link requests for parents.
- Shows requester name, role, and optional message
- Time since request was sent
- Accept/Decline buttons with confirmation
- Empty state when no requests

### `SendLinkRequestModal`
Modal for nanny/others to send link requests.
- Email input with validation
- Optional message field (200 chars max)
- Info box explaining the process
- Sends request and provides success feedback

### `DashboardPage` Integration
- Notification badge in header shows pending request count
- Badge only visible for parents (mother/father roles)
- Tapping notification bell opens LinkRequestNotifications
- "Request Parent Link" option in settings for nanny/others

## Usage Flow

### Sending a Request (Nanny/Other):

**During Registration:**
1. Select "nanny" or "others" role
2. Enter parent's email in the "Related Parent Email" field
3. Complete registration
4. A link request is automatically sent to the parent
5. See message: "A link request has been sent to the parent. Once they approve it, you'll be able to access their baby information."

**After Registration (from Settings):**
1. Open Settings from dashboard
2. Tap "Request Parent Link"
3. Enter parent's email address
4. Optionally add a message
5. Tap "Send Link Request"
6. Parent receives notification

### Processing a Request (Parent):

**From Dashboard:**
1. See notification badge on dashboard bell icon with count of pending requests
2. Tap bell icon to open notifications
3. Review requester's name, role, and message
4. Tap "Accept" to grant access
   - Confirmation dialog appears
   - Requester added to relatedParentIds
   - Can now access baby data
5. Or tap "Decline" to reject
   - Confirmation dialog appears
   - Request marked as declined

**From Settings:**
1. Open Settings from dashboard
2. Tap "Link Requests" (only visible for parents)
3. Same functionality as above

## Security

- All endpoints require authentication (JWT token)
- Parents can only accept/decline requests sent to them
- Cannot send request to yourself
- Cannot send duplicate pending requests
- Email validation prevents invalid addresses
- Checks that target email belongs to a parent role
- **No automatic linking** - All nanny/others requests require parent approval
- Parents (mother/father) can link directly with each other without approval

## Future Enhancements

- [ ] Email notifications when link request is sent/accepted
- [ ] Real-time notifications using WebSockets
- [ ] Ability to revoke access after linking
- [ ] Request expiry (auto-decline after X days)
- [ ] View all linked users in account settings
- [ ] Request history for both senders and receivers
