# STUDENT Role - Data Fetching & API Connection Groups

This document groups all STUDENT functionalities for systematic data fetching and API connection verification. Each group will be checked one by one to ensure:
1. Correct data fetching from backend
2. Proper API endpoint usage
3. UI customization if needed
4. Missing endpoints identification and creation

---

## GROUP 1: Student Profile & Account Management 🔐
**Priority: HIGH (Foundation - Must be done first)**

### Features to Verify:
- ✅ View personal profile (from `/student/me` or `/student/{id}`)
- ⚠️ Update personal information (PATCH `/student/{id}/update` - verify & enhance)
- ✅ View departments, year, gender, name (Already exists)
- ⚠️ Change password (Frontend logic in Profile.tsx - verify backend support)
- ✅ View membership roles/authorities (from `/authorities/students/{studentId}`)
- ✅ Display roles from `/student/{id}/events` endpoint context
- ✅ Show authorities from `/authorities/students/{studentId}` endpoint
- ✅ Display club-specific roles (President, Secretary, Finance Officer, etc.)

### API Endpoints to Check:
- `GET /student/me` - ✅ Exists
- `GET /student/{id}` - ✅ Exists
- `PATCH /student/{id}/update` - ✅ Exists
- `GET /student/{id}/getclubsJoined` - ✅ Exists
- `GET /student/{id}/events` - ✅ Exists
- `GET /authorities/students/{studentId}` - ✅ Exists
- `PATCH /student/{id}/change-password` - ❓ Need to verify (password change endpoint)

### Files to Check:
- `src/pages/Profile.tsx` - ✅ Exists (enhance password change)
- `src/components/student/PasswordChange.tsx` - ✅ Exists (verify functionality)
- `src/components/student/RolesView.tsx` - ✅ Exists (verify data display)

### Issues to Fix:
- [ ] Verify password change endpoint exists or use update endpoint with password field
- [ ] Ensure profile update includes all fields (department, year, gender)
- [ ] Verify authorities data structure and display correctly
- [ ] Check if role display shows club-specific roles properly

### Missing Endpoints (if any):
- [ ] Change password endpoint (or verify if update endpoint accepts password)

---

## GROUP 2: Student Dashboard Widgets 📊
**Priority: HIGH (Main landing page - Foundation)**

### Features to Verify:
- ✅ Number of clubs joined (Widget - from `/student/{id}/getclubsJoined`)
- ✅ Upcoming events (List + Calendar widget - from `/student/{id}/events` and `/events/club/{clubId}`)
- ✅ Latest announcements (Widget - from `/announcements/retriveAnnouncementByClub/{clubId}`)
- ✅ My roles (Widget showing assigned authorities - from `/authorities/students/{studentId}`)
- ✅ Activity timeline (Client-side activity log - localStorage)

### API Endpoints to Check:
- `GET /student/{id}/getclubsJoined` - ✅ Exists
- `GET /student/{id}/events` - ✅ Exists
- `GET /events/club/{clubId}` - ✅ Exists
- `GET /announcements/retriveAnnouncementByClub/{clubId}` - ✅ Exists
- `GET /authorities/students/{studentId}` - ✅ Exists

### Files to Check:
- `src/pages/student/Dashboard.tsx` - ✅ Exists (verify data fetching)
- `src/components/student/ClubsJoinedWidget.tsx` - ✅ Exists
- `src/components/student/UpcomingEventsWidget.tsx` - ✅ Exists
- `src/components/student/AnnouncementsWidget.tsx` - ✅ Exists
- `src/components/student/RolesWidget.tsx` - ✅ Exists
- `src/components/student/ActivityTimeline.tsx` - ✅ Exists
- `src/components/student/ParticipationStatsWidget.tsx` - ✅ Exists

### Issues to Fix:
- [ ] Verify events are correctly filtered (upcoming vs past)
- [ ] Ensure announcements are loaded from all joined clubs
- [ ] Check if authorities display correctly with club information
- [ ] Verify activity timeline stores and displays activities correctly
- [ ] Ensure dashboard loads efficiently (parallel API calls)

### Missing Endpoints (if any):
- None identified (all endpoints exist)

---

## GROUP 3: Club Discovery & Joining 🤝
**Priority: HIGH (Core student functionality)**

### Features to Verify:
- ⚠️ View all available clubs (from `/clubs/all-clubs` - needs student-specific view)
- ❌ Search clubs by name (Add search functionality - client-side)
- ⚠️ View club details (Exists but needs student context - verify data display)
- ⚠️ Request to join a club (POST `/student/{studentId}/clubs/{clubId}/request` - verify functionality)
- ⚠️ View status of club join requests (Client-side localStorage - needs backend sync)
- ✅ See list of clubs joined (from `/student/{id}/getclubsJoined` - enhance with better UI)

### API Endpoints to Check:
- `GET /clubs/all-clubs` - ✅ Exists
- `GET /clubs/{id}` - ✅ Exists
- `POST /student/{studentId}/clubs/{clubId}/request` - ✅ Exists
- `GET /student/{id}/getclubsJoined` - ✅ Exists
- `GET /clubs/{id}/get-members` - ❓ Need to verify (student access)

### Files to Check:
- `src/pages/student/ClubsDiscovery.tsx` - ✅ Exists (enhance search, verify request status)
- `src/components/student/ClubRequestStatus.tsx` - ✅ Exists (verify status display)
- `src/components/student/JoinRequestCard.tsx` - ✅ Exists
- `src/components/student/ClubInfoCard.tsx` - ✅ Exists (verify data display)

### Issues to Fix:
- [ ] Add search functionality for clubs (client-side filtering)
- [ ] Verify join request status syncs with backend (check if request was approved/rejected)
- [ ] Ensure club details show all relevant information for students
- [ ] Verify join request creates properly and shows pending status
- [ ] Check if student can view club members (may be ADMIN only)

### Missing Endpoints (if any):
- [ ] Get join request status endpoint (or verify if request endpoint returns status)
- [ ] Check if `/clubs/{id}/get-members` is accessible to students

---

## GROUP 4: Joined Club Dashboard 🏛️
**Priority: MEDIUM (Enhanced club management for students)**

### Features to Verify:
- ✅ View club information (Dedicated student view - from `/clubs/{id}`)
- ⚠️ View club members (Read-only for students - from `/clubs/{id}/get-members` - verify access)
- ⚠️ View club admins (Display club leadership - from members with ADMIN role)
- ❌ Leave club (Frontend logic - UI only, no backend endpoint - verify if endpoint exists)

### API Endpoints to Check:
- `GET /clubs/{id}` - ✅ Exists
- `GET /clubs/{id}/get-members` - ❓ Need to verify (student access)
- `DELETE /student/{studentId}/clubs/{clubId}/leave` - ❓ Need to verify (leave club endpoint)

### Files to Check:
- `src/pages/student/JoinedClubDashboard.tsx` - ✅ Exists (verify data fetching)
- `src/components/student/ClubInfoCard.tsx` - ✅ Exists
- `src/components/student/ClubMembersList.tsx` - ✅ Exists (verify read-only display)
- `src/components/student/LeaveClubButton.tsx` - ✅ Exists (verify functionality)

### Issues to Fix:
- [ ] Verify student can access club members list (may be restricted)
- [ ] Ensure club admins are correctly identified and displayed
- [ ] Check if leave club functionality works (may need backend endpoint)
- [ ] Verify club information displays correctly for students

### Missing Endpoints (if any):
- [ ] Leave club endpoint (DELETE `/student/{studentId}/clubs/{clubId}/leave` or similar)
- [ ] Verify student access to `/clubs/{id}/get-members`

---

## GROUP 5: Events Management 📅
**Priority: HIGH (Core student engagement feature)**

### Features to Verify:
- ⚠️ View all events from joined clubs (from `/student/{id}/events` and `/events/club/{clubId}` - filter by joined clubs)
- ⚠️ Filter events (Upcoming / Past) (Add date filtering - client-side)
- ❌ Show event on map (lat/long) (Map integration - Google Maps or similar)
- ⚠️ Event details modal/card (Exists - enhance with map link)
- ⚠️ Mark event as going or interested (Client-side UX - localStorage)
- ⚠️ Calendar view (UI only - visual calendar - verify functionality)

### API Endpoints to Check:
- `GET /student/{id}/events` - ✅ Exists
- `GET /events/club/{clubId}` - ✅ Exists
- `GET /events/{eventId}` - ✅ Exists
- `GET /events/allEvents` - ✅ Exists (may be used for filtering)

### Files to Check:
- `src/pages/student/StudentEventsView.tsx` - ✅ Exists (verify data fetching, add map)
- `src/components/student/EventCard.tsx` - ✅ Exists (enhance with map link)
- `src/components/student/EventDetailsDialog.tsx` - ✅ Exists (add map integration)
- `src/components/student/EventCalendarView.tsx` - ✅ Exists (verify calendar display)
- `src/components/student/EventInteraction.tsx` - ❌ Need to create (Going/Interested buttons)

### Issues to Fix:
- [ ] Verify events are correctly filtered by joined clubs
- [ ] Add date filtering (upcoming vs past) - client-side
- [ ] Integrate map display for events with lat/long coordinates
- [ ] Verify calendar view displays events correctly
- [ ] Ensure "going/interested" interactions are stored in localStorage
- [ ] Add map link in event details (Google Maps)

### Missing Endpoints (if any):
- [ ] Event participation endpoint (POST `/events/{eventId}/participate` - if needed)
- [ ] Event interest endpoint (POST `/events/{eventId}/interested` - if needed)

---

## GROUP 6: Announcements 📢
**Priority: MEDIUM (Communication feature)**

### Features to Verify:
- ⚠️ View announcements from joined clubs (from `/announcements/retriveAnnouncementByClub/{clubId}` - filter by clubs)
- ✅ Notifications panel (Component exists - verify functionality)
- ✅ Mark announcements as read (Client-side - localStorage - verify persistence)

### API Endpoints to Check:
- `GET /announcements/retriveAllAnnouncement` - ✅ Exists
- `GET /announcements/retriveAnnouncementByClub/{clubId}` - ✅ Exists
- `GET /announcements/{id}` - ❓ Need to verify

### Files to Check:
- `src/pages/student/Announcements.tsx` - ✅ Exists (verify data fetching)
- `src/components/student/NotificationsPanel.tsx` - ✅ Exists (verify functionality)
- `src/components/student/AnnouncementCard.tsx` - ✅ Exists (verify read status display)

### Issues to Fix:
- [ ] Verify announcements are correctly filtered by joined clubs
- [ ] Ensure read status persists across sessions (localStorage)
- [ ] Check if notifications panel shows unread count correctly
- [ ] Verify announcement details display correctly

### Missing Endpoints (if any):
- [ ] Mark announcement as read endpoint (PATCH `/announcements/{id}/read` - if backend tracking needed)

---

## GROUP 7: Fees/Payments 💰
**Priority: MEDIUM (Financial tracking)**

### Features to Verify:
- ⚠️ View fee records (from `/fees/students/{studentId}` - needs student filtering)
- ⚠️ View payment status (Exists - enhance display)
- ⚠️ Show total fees paid (Calculate from fee records - client-side calculation)

### API Endpoints to Check:
- `GET /fees/students/{studentId}` - ✅ Exists
- `GET /fees/{id}` - ✅ Exists
- `GET /fees/clubs/{clubId}` - ❓ Need to verify (student access)

### Files to Check:
- `src/pages/student/Fees.tsx` - ✅ Exists (verify data fetching)
- `src/components/student/FeeSummary.tsx` - ✅ Exists (verify calculations)
- `src/components/student/PaymentStatusCard.tsx` - ✅ Exists (enhance display)

### Issues to Fix:
- [ ] Verify fees are correctly filtered for the student
- [ ] Ensure payment status displays correctly (paid, pending, failed)
- [ ] Calculate total fees paid correctly from fee records
- [ ] Verify fee details display correctly
- [ ] Check if student can view fees from all clubs or only joined clubs

### Missing Endpoints (if any):
- [ ] Get total fees paid endpoint (or calculate client-side)
- [ ] Verify student access to `/fees/clubs/{clubId}`

---

## SUMMARY OF MISSING ENDPOINTS

### High Priority (Core Functionality):
1. ❓ Change password endpoint (or verify if update endpoint accepts password)
2. ❓ Leave club endpoint (DELETE `/student/{studentId}/clubs/{clubId}/leave` or similar)
3. ❓ Get join request status endpoint (or verify if request endpoint returns status)

### Medium Priority (Enhanced Features):
1. ❓ Event participation endpoint (POST `/events/{eventId}/participate` - if needed)
2. ❓ Event interest endpoint (POST `/events/{eventId}/interested` - if needed)
3. ❓ Mark announcement as read endpoint (PATCH `/announcements/{id}/read` - if backend tracking needed)
4. ❓ Get total fees paid endpoint (or calculate client-side)

### Access Verification Needed:
1. ❓ Verify student access to `/clubs/{id}/get-members`
2. ❓ Verify student access to `/fees/clubs/{clubId}`
3. ❓ Verify student access to `/announcements/{id}`

---

## VERIFICATION CHECKLIST

For each group, verify:
- [ ] Data is being fetched correctly from backend
- [ ] API endpoints are correctly called
- [ ] Error handling is implemented
- [ ] Loading states are shown
- [ ] Empty states are handled
- [ ] UI updates after data changes
- [ ] Missing endpoints are identified
- [ ] Client-side features work correctly (localStorage, filters, etc.)
- [ ] Filtering/searching works correctly
- [ ] Date filtering works correctly
- [ ] Map integration works (if applicable)
- [ ] Read status persists correctly

---

## IMPLEMENTATION ORDER

### Phase 1: Foundation (Groups 1 & 2)
1. **GROUP 1: Student Profile & Account Management**
   - Verify profile data fetching
   - Fix password change functionality
   - Verify roles/authorities display
   
2. **GROUP 2: Student Dashboard Widgets**
   - Verify all widgets load data correctly
   - Fix any data fetching errors
   - Ensure efficient loading

### Phase 2: Core Features (Groups 3 & 5)
3. **GROUP 3: Club Discovery & Joining**
   - Add search functionality
   - Verify join request status
   - Fix club details display
   
4. **GROUP 5: Events Management**
   - Add date filtering
   - Integrate map display
   - Verify calendar view
   - Fix event interactions

### Phase 3: Engagement (Groups 4, 6, 7)
5. **GROUP 4: Joined Club Dashboard**
   - Verify club members access
   - Fix leave club functionality
   
6. **GROUP 6: Announcements**
   - Verify filtering by clubs
   - Fix read status persistence
   
7. **GROUP 7: Fees/Payments**
   - Verify fee filtering
   - Fix payment status display
   - Calculate total fees paid

---

## NOTES

- ⚠️ = Partially implemented - needs enhancement/verification
- ❌ = Not implemented - needs to be created
- ✅ = Already implemented - verify functionality
- ❓ = Need to verify endpoint exists or access permissions

### Client-Side Features (No Backend Needed):
- Search/filter clubs (client-side)
- Filter events by date (client-side)
- Mark events as going/interested (localStorage)
- Calendar view (UI only)
- Mark announcements as read (localStorage)
- Activity timeline (localStorage)
- Leave club button (UI only - may need backend)

### Backend-Dependent Features:
- All data fetching from API endpoints
- Join club requests
- Profile updates
- Password changes
- View club members (may be restricted)
- View fees

---

## NEXT STEPS

1. Start with GROUP 1 (Profile) - verify all data fetching and password change
2. Continue with GROUP 2 (Dashboard) - verify all widgets load correctly
3. Proceed through each group systematically
4. Create missing endpoints in Spring Boot backend (if needed)
5. Update frontend to use new endpoints
6. Test each group thoroughly before moving to next
7. Document any API changes needed

