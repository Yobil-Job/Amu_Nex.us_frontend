# Club Admin Data Fetching & Implementation Groups

## Overview
This document outlines the implementation plan for the **CLUB_ADMIN (ADMIN)** role, following the same structure as `student_data_fetching_groups.md` and `super_admin_data_fetching_groups.md`.

**Role:** `ADMIN` (Club Admin) - Manages specific club(s) assigned by SUPER_ADMIN

**Backend Role Name:** `ADMIN` (Note: In backend enum, club admin is 'ADMIN', not 'CLUB_ADMIN')

---

## GROUP 10: Navigation & Layout 🧭
**Priority: HIGH** (Must be done first - affects all pages)

### Features to Verify:
- ✅ Role-based sidebar navigation (Already exists in MainLayout.tsx)
- ✅ Club Admin specific menu items (Already exists)
- ✅ Routing for all club admin pages (Partially exists)
- ⚠️ Dashboard route needs to route to club admin dashboard

### API Endpoints to Check:
- N/A (Navigation only)

### Files to Check/Modify:
- ✅ `src/components/layout/MainLayout.tsx` - Already has club admin navigation
- ⚠️ `src/pages/Dashboard.tsx` - Needs to route ADMIN to club admin dashboard
- ✅ `src/App.tsx` - Already has some club admin routes
- ✅ `src/lib/roles.ts` - Already has club admin role checks

### Issues to Fix:
- [ ] Verify Dashboard.tsx routes ADMIN role to club admin dashboard
- [ ] Ensure all club admin routes are properly protected
- [ ] Verify navigation menu shows correct items for ADMIN role
- [ ] Check if club admin can see their managed clubs in navigation

---

## GROUP 1: Dashboard Overview & Analytics 📊
**Priority: HIGH** (Foundation - First thing Club Admin sees)

### Features to Verify:
- ⚠️ Overview cards: Total members, authorities, upcoming events, announcements, fees collected
- ⚠️ Graphs: Member growth over time, events per month, fee collection trend
- ⚠️ Quick actions panel: Create announcement, Create event, Manage requests
- ⚠️ Club logo and responsive widgets
- ⚠️ Club selector (if admin manages multiple clubs)

### API Endpoints to Check:
- GET `/clubs/{id}/get-members` - ✅ Exists (for total members)
- GET `/authorities` - ✅ Exists (filter by club for authorities count)
- GET `/events/club/{clubId}` - ✅ Exists (for upcoming events)
- GET `/announcements/retriveAnnouncementByClub/{clubId}` - ✅ Exists (for announcements)
- GET `/fees/clubs/{clubId}` - ✅ Exists (for fees collected)
- GET `/fees/clubs/{clubId}/total` - ✅ Exists (for total fees)
- GET `/clubs/{id}/requests/pending` - ✅ Exists (for pending requests count)
- GET `/clubs/{id}` - ✅ Exists (for club info and logo)

### Files to Check:
- ✅ `src/pages/club-admin/Dashboard.tsx` - Exists (verify data fetching)
- ✅ `src/components/club-admin/StatsCards.tsx` - Exists (verify calculations)
- ✅ `src/components/club-admin/MemberGrowthChart.tsx` - Exists (verify data)
- ✅ `src/components/club-admin/EventsChart.tsx` - Exists (verify data)
- ✅ `src/components/club-admin/FeesChart.tsx` - Exists (verify data)
- ✅ `src/components/club-admin/QuickActionsPanel.tsx` - Exists (verify actions)
- ⚠️ `src/pages/Dashboard.tsx` - Needs to route ADMIN to club admin dashboard

### Issues to Fix:
- [ ] Verify dashboard loads managed clubs correctly
- [ ] Verify all stats cards calculate correctly
- [ ] Verify charts fetch and display data correctly
- [ ] Verify quick actions navigate to correct pages
- [ ] Verify club selector works if admin manages multiple clubs
- [ ] Verify club logo displays correctly

---

## GROUP 2: Club Members Management 👥
**Priority: HIGH** (Core functionality)

### Features to Verify:
- ⚠️ View all club members (from `/clubs/{id}/get-members`)
- ⚠️ Search and filter members (client-side or backend)
- ⚠️ View detailed member info (modal)
- ⚠️ Remove member (DELETE endpoint - need to verify)
- ⚠️ Pagination for large lists
- ⚠️ See member roles (student/authority)
- ⚠️ See member join date

### API Endpoints to Check:
- GET `/clubs/{id}/get-members` - ✅ Exists
- GET `/student/{id}` - ✅ Exists (for member details)
- DELETE `/student/{id}/clubs/{clubId}/leave` - ❓ Need to verify (remove member)
- GET `/authorities` - ✅ Exists (filter by club and student for roles)

### Files to Check:
- ✅ `src/pages/club-admin/Members.tsx` - Exists (verify data fetching)
- ✅ `src/components/club-admin/MembersList.tsx` - Exists (verify display)
- ✅ `src/components/club-admin/MemberFilters.tsx` - Exists (verify filtering)
- ✅ `src/components/club-admin/MemberDetailsModal.tsx` - Exists (verify details)
- ✅ `src/components/club-admin/RemoveMemberDialog.tsx` - Exists (verify removal)

### Issues to Fix:
- [ ] Verify members list loads correctly for managed clubs
- [ ] Verify search and filter functionality
- [ ] Verify member details modal shows all information
- [ ] Verify remove member functionality (if endpoint exists)
- [ ] Verify member roles display correctly
- [ ] Verify pagination works for large member lists

---

## GROUP 3: Join Requests Management ✅
**Priority: HIGH** (Core functionality)

### Features to Verify:
- ⚠️ View all pending join requests (from `/clubs/{id}/requests/pending`)
- ⚠️ Approve join requests (PATCH `/clubs/{clubId}/requests/{studentId}/approve`)
- ⚠️ Reject join requests (PATCH `/clubs/{clubId}/requests/{studentId}/reject`)
- ⚠️ Modal for request actions
- ⚠️ Notification when new request arrives
- ⚠️ View request details (student info, date, etc.)

### API Endpoints to Check:
- GET `/clubs/{id}/requests/pending` - ✅ Exists
- PATCH `/clubs/{clubId}/requests/{studentId}/approve` - ✅ Exists
- PATCH `/clubs/{clubId}/requests/{studentId}/reject` - ✅ Exists
- GET `/student/{id}` - ✅ Exists (for student details in request)

### Files to Check:
- ✅ `src/pages/club-admin/JoinRequests.tsx` - Exists (verify data fetching)
- ✅ `src/components/club-admin/JoinRequestsList.tsx` - Exists (verify display)
- ✅ `src/components/club-admin/ApproveRequestDialog.tsx` - Exists (verify approval)
- ✅ `src/components/club-admin/RejectRequestDialog.tsx` - Exists (verify rejection)

### Issues to Fix:
- [ ] Verify pending requests load correctly
- [ ] Verify approve functionality works
- [ ] Verify reject functionality works (with reason if supported)
- [ ] Verify notifications show new requests
- [ ] Verify request details display correctly
- [ ] Verify student information displays in requests

---

## GROUP 4: Authority Management 🎖️
**Priority: MEDIUM** (Leadership management)

### Features to Verify:
- ⚠️ View all authorities with roles and durations (from `/authorities` filtered by club)
- ⚠️ Assign/create authority (POST `/authorities/{clubAdminId}/create`)
- ⚠️ Edit authority role or duration (PATCH `/authorities/{authorityId}/update/{clubAdminId}`)
- ⚠️ Remove authority (DELETE `/authorities/{authorityId}/delete/{clubId}/{clubAdminId}`)
- ⚠️ Add authority modal form
- ⚠️ Confirmation dialogs

### API Endpoints to Check:
- GET `/authorities` - ✅ Exists (filter by club)
- POST `/authorities/{clubAdminId}/create` - ✅ Exists
- PATCH `/authorities/{authorityId}/update/{clubAdminId}` - ✅ Exists
- DELETE `/authorities/{authorityId}/delete/{clubId}/{clubAdminId}` - ✅ Exists
- GET `/student/{id}` - ✅ Exists (for student details when creating authority)

### Files to Check:
- ✅ `src/pages/club-admin/Authorities.tsx` - Exists (verify data fetching)
- ✅ `src/components/club-admin/AuthoritiesList.tsx` - Exists (verify display)
- ✅ `src/components/club-admin/CreateAuthorityDialog.tsx` - Exists (verify creation)
- ✅ `src/components/club-admin/EditAuthorityDialog.tsx` - Exists (verify editing)
- ✅ `src/components/club-admin/DeleteAuthorityDialog.tsx` - Exists (verify deletion)

### Issues to Fix:
- [ ] Verify authorities list loads correctly for managed clubs
- [ ] Verify create authority form works correctly
- [ ] Verify edit authority form works correctly
- [ ] Verify delete authority works correctly
- [ ] Verify authority roles and durations display correctly
- [ ] Verify student selection works when creating authority

---

## GROUP 5: Event Management 📅
**Priority: MEDIUM** (Event management)

### Features to Verify:
- ⚠️ View all events (past, current, upcoming) from `/events/club/{clubId}`
- ⚠️ Create events for club (POST `/events/create`)
- ⚠️ Edit events (PATCH `/events/{id}/update`)
- ⚠️ Delete events (DELETE `/events/{id}/delete`)
- ⚠️ Event calendar view (month/week/day)
- ⚠️ Event cards with countdown timers
- ⚠️ View participation count

### API Endpoints to Check:
- GET `/events/club/{clubId}` - ✅ Exists
- GET `/events/{id}` - ✅ Exists
- POST `/events/create` - ✅ Exists
- PATCH `/events/{id}/update` - ✅ Exists
- DELETE `/events/{id}/delete` - ✅ Exists
- GET `/events/participation/{eventId}` - ❓ Need to verify (for participation count)

### Files to Check:
- ✅ `src/pages/club-admin/Events.tsx` - Exists (verify data fetching)
- ✅ `src/components/club-admin/EventsList.tsx` - Exists (verify display)
- ✅ `src/components/club-admin/CreateEventDialog.tsx` - Exists (verify creation)
- ✅ `src/components/club-admin/EditEventDialog.tsx` - Exists (verify editing)
- ✅ `src/components/club-admin/DeleteEventDialog.tsx` - Exists (verify deletion)
- ✅ `src/components/club-admin/EventCalendarView.tsx` - Exists (verify calendar)
- ⚠️ `src/pages/Events.tsx` - Needs to route ADMIN to club admin events

### Issues to Fix:
- [ ] Verify events load correctly for managed clubs
- [ ] Verify create event form works correctly
- [ ] Verify edit event form works correctly
- [ ] Verify delete event works correctly
- [ ] Verify calendar view displays events correctly
- [ ] Verify event cards show countdown timers
- [ ] Verify participation count displays (if endpoint exists)

---

## GROUP 6: Announcement Management 📢
**Priority: MEDIUM** (Communication)

### Features to Verify:
- ⚠️ View all announcements (from `/announcements/retriveAnnouncementByClub/{clubId}`)
- ⚠️ Create announcements (POST `/announcements/create`)
- ⚠️ Edit announcements (PATCH `/announcements/{id}/update`)
- ⚠️ Delete announcements (DELETE `/announcements/{id}/delete`)
- ⚠️ Filter by creator/date
- ⚠️ Pinned announcements display

### API Endpoints to Check:
- GET `/announcements/retriveAnnouncementByClub/{clubId}` - ✅ Exists
- GET `/announcements/{id}` - ✅ Exists
- POST `/announcements/create` - ✅ Exists
- PATCH `/announcements/{id}/update` - ✅ Exists
- DELETE `/announcements/{id}/delete` - ✅ Exists

### Files to Check:
- ✅ `src/pages/club-admin/Announcements.tsx` - Exists (verify data fetching)
- ✅ `src/components/club-admin/AnnouncementsList.tsx` - Exists (verify display)
- ✅ `src/components/club-admin/CreateAnnouncementDialog.tsx` - Exists (verify creation)
- ✅ `src/components/club-admin/EditAnnouncementDialog.tsx` - Exists (verify editing)
- ✅ `src/components/club-admin/DeleteAnnouncementDialog.tsx` - Exists (verify deletion)
- ✅ `src/components/club-admin/AnnouncementFilters.tsx` - Exists (verify filtering)
- ⚠️ `src/pages/Announcements.tsx` - Already routes ADMIN to club admin announcements

### Issues to Fix:
- [ ] Verify announcements load correctly for managed clubs
- [ ] Verify create announcement form works correctly
- [ ] Verify edit announcement form works correctly
- [ ] Verify delete announcement works correctly
- [ ] Verify filtering works correctly
- [ ] Verify pinned announcements display (if supported by backend)

---

## GROUP 7: Fees Management 💰
**Priority: MEDIUM** (Financial tracking)

### Features to Verify:
- ⚠️ View all fees collected for club (from `/fees/clubs/{clubId}`)
- ⚠️ View individual student fee payments
- ⚠️ See total amount collected (from `/fees/clubs/{clubId}/total`)
- ⚠️ Fees table with payment status tags
- ⚠️ Summary chart (total vs unpaid)
- ⚠️ Filter by date/member
- ⚠️ Download fee report (Excel/PDF mock)

### API Endpoints to Check:
- GET `/fees/clubs/{clubId}` - ✅ Exists
- GET `/fees/clubs/{clubId}/total` - ✅ Exists
- GET `/fees/{id}` - ✅ Exists
- PATCH `/fees/{id}/status` - ✅ Exists (update payment status)
- GET `/student/{id}` - ✅ Exists (for student details in fees)

### Files to Check:
- ✅ `src/pages/club-admin/Fees.tsx` - Exists (verify data fetching)
- ✅ `src/components/club-admin/FeesTable.tsx` - Exists (verify display)
- ✅ `src/components/club-admin/FeesOverview.tsx` - Exists (verify summary)
- ✅ `src/components/club-admin/FeesFilters.tsx` - Exists (verify filtering)
- ✅ `src/components/club-admin/FeesChart.tsx` - Exists (verify chart)
- ✅ `src/components/club-admin/ExportFeesButton.tsx` - Exists (verify export - mock)
- ⚠️ `src/pages/Fees.tsx` - Already routes ADMIN to club admin fees

### Issues to Fix:
- [ ] Verify fees load correctly for managed clubs
- [ ] Verify fees table displays all information correctly
- [ ] Verify payment status updates work correctly
- [ ] Verify summary chart displays correctly
- [ ] Verify filtering works correctly
- [ ] Verify export functionality (mock implementation)

---

## GROUP 8: Club Settings ⚙️
**Priority: LOW** (Configuration)

### Features to Verify:
- ⚠️ Update club description (PATCH `/clubs/{id}/update`)
- ⚠️ Update club logo (image upload via Cloudinary)
- ⚠️ Manage contact links (socials, email)
- ⚠️ Set visibility (public/private) - if supported by backend
- ⚠️ Preview mode before saving
- ⚠️ Editable form

### API Endpoints to Check:
- GET `/clubs/{id}` - ✅ Exists (for current club data)
- PATCH `/clubs/{id}/update` - ✅ Exists
- POST `/clubs/create` - ✅ Exists (not needed for settings)

### Files to Check:
- ✅ `src/pages/club-admin/Settings.tsx` - Exists (verify data fetching)
- ✅ `src/components/club-admin/ClubSettingsForm.tsx` - Exists (verify form)
- ✅ `src/components/club-admin/ImageUpload.tsx` - Exists (verify upload)

### Issues to Fix:
- [ ] Verify club settings load correctly
- [ ] Verify update club description works
- [ ] Verify image upload works (Cloudinary integration)
- [ ] Verify contact links save correctly
- [ ] Verify visibility setting works (if supported)
- [ ] Verify preview mode works

---

## GROUP 9: Notifications Panel 🔔
**Priority: LOW** (Nice to have)

### Features to Verify:
- ⚠️ New join requests notifications
- ⚠️ Upcoming event reminders
- ⚠️ Announcement confirmation alerts

### API Endpoints to Check:
- Notification generation is client-side based on data from:
  - GET `/clubs/{id}/requests/pending` - ✅ Exists
  - GET `/events/club/{clubId}` - ✅ Exists
  - GET `/announcements/retriveAnnouncementByClub/{clubId}` - ✅ Exists

### Files to Check:
- ✅ `src/components/club-admin/NotificationCenter.tsx` - Exists (verify functionality)
- ✅ `src/components/club-admin/NotificationBadge.tsx` - Exists (verify display)
- ✅ `src/components/club-admin/NotificationsPanel.tsx` - Exists (verify panel)

### Issues to Fix:
- [ ] Verify notifications generate correctly for new join requests
- [ ] Verify event reminders work correctly
- [ ] Verify announcement alerts work correctly
- [ ] Verify notification badge shows correct count
- [ ] Verify notifications panel displays correctly

---

## Implementation Order

1. **GROUP 10: Navigation & Layout** (First - routing foundation)
2. **GROUP 1: Dashboard Overview & Analytics** (Foundation - first thing admin sees)
3. **GROUP 2: Club Members Management** (Core functionality)
4. **GROUP 3: Join Requests Management** (Core functionality)
5. **GROUP 4: Authority Management** (Leadership management)
6. **GROUP 5: Event Management** (Event management)
7. **GROUP 6: Announcement Management** (Communication)
8. **GROUP 7: Fees Management** (Financial tracking)
9. **GROUP 8: Club Settings** (Configuration)
10. **GROUP 9: Notifications Panel** (Optional)

---

## Key Implementation Notes

1. **Club Admin Role:** Backend uses `ADMIN` role, not `CLUB_ADMIN`
2. **Managed Clubs:** Club admin can manage one or more clubs (check via authorities with name='ADMIN')
3. **Club Selector:** If admin manages multiple clubs, dashboard should have a club selector
4. **Data Filtering:** All data should be filtered by managed club(s)
5. **API Calls:** Most endpoints require `clubId` parameter
6. **Permissions:** Club admin can only manage their assigned clubs
7. **Navigation:** Club admin has specific menu items in the "Admin" dropdown

---

## Common Data Fetching Patterns

1. **Load Managed Clubs:**
   ```typescript
   // Get clubs where user is admin (authority with name='ADMIN')
   const authoritiesRes = await authorityApi.getByStudent(user.id);
   const userAuthorities = extractCollection(authoritiesRes)
     .filter(auth => auth.name?.toUpperCase() === 'ADMIN');
   const managedClubIds = userAuthorities.map(auth => auth.club?.id);
   ```

2. **Load Club Data:**
   ```typescript
   const clubRes = await clubApi.getById(clubId);
   ```

3. **Load Members:**
   ```typescript
   const membersRes = await clubApi.getMembers(clubId);
   const members = extractCollection(membersRes);
   ```

4. **Load Events:**
   ```typescript
   const eventsRes = await eventApi.getByClub(clubId);
   const events = extractCollection(eventsRes);
   ```

5. **Load Announcements:**
   ```typescript
   const announcementsRes = await announcementApi.getByClub(clubId);
   const announcements = extractCollection(announcementsRes);
   ```

6. **Load Fees:**
   ```typescript
   const feesRes = await feeApi.getByClub(clubId);
   const fees = extractCollection(feesRes);
   ```

---

## Testing Checklist

For each group, verify:
- [ ] Data loads correctly from API
- [ ] Data displays correctly in UI
- [ ] Filters/search work correctly
- [ ] Create/Edit/Delete operations work
- [ ] Error handling works correctly
- [ ] Loading states display correctly
- [ ] Empty states display correctly
- [ ] Responsive design works on mobile
- [ ] Navigation works correctly
- [ ] Permissions are enforced correctly

