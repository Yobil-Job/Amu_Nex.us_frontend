# SUPER_USER (Club Authorities) Data Fetching Groups

## Role Details
- **Backend Role:** `SUPER_USER` (from authorities table)
- **Authority Level:** Lower than Club Admin (ADMIN), higher than normal students (STUDENT)
- **Access Scope:** Can only access data of their own assigned club
- **Assignment:** Authorities assigned by club admin via `/authorities/{clubAdminId}/create`
- **Positions:** President, Secretary, Finance Office Head, etc. (stored in `authorities.name` field)
- **Must be:** An approved member of the club

---

## GROUP 1: Dashboard Overview & Navigation 🏠
**Priority: HIGH (Foundation - Must be done first)**

### Features to Verify:
- ⚠️ Personalized dashboard with club data (name, description, logo, recent events, member count, pending requests)
- ⚠️ Quick-access cards: "View Members", "Manage Events", "Finance Summary", "Resource Requests", "Club Performance Stats"
- ⚠️ Notifications panel (pending approvals, event requests, finance updates, new member join requests)
- ⚠️ Basic navigation structure
- ⚠️ Profile widget (name, position, club)

### API Endpoints to Check:
- GET `/authorities/students/{studentId}` - ✅ Exists (get user's authority/position)
- GET `/clubs/{id}` - ✅ Exists (get club details)
- GET `/clubs/{id}/get-members` - ✅ Exists (member count)
- GET `/clubs/{id}/requests/pending` - ✅ Exists (pending requests count)
- GET `/events/club/{clubId}` - ✅ Exists (recent events)
- GET `/announcements/retriveAnnouncementByClub/{clubId}` - ✅ Exists (recent announcements)

### Files to Check:
- ✅ `src/pages/super-user/Dashboard.tsx` - Exists (verify data fetching)
- ✅ `src/components/super-user/QuickAccessCards.tsx` - Exists (verify functionality)
- ✅ `src/components/super-user/ClubOverviewCard.tsx` - Exists (verify data display)
- ✅ `src/components/super-user/NotificationsPanel.tsx` - Exists (verify notifications)
- ⚠️ `src/pages/Dashboard.tsx` - Needs to route SUPER_USER to super-user dashboard

### Issues to Fix:
- [ ] Verify dashboard loads club data correctly for assigned club
- [ ] Verify quick access cards are clickable and navigate correctly
- [ ] Verify notifications panel shows correct data
- [ ] Verify profile widget displays position and club name
- [ ] Verify navigation routes SUPER_USER correctly

---

## GROUP 2: Member Management 👥
**Priority: HIGH (Core functionality)**

### Features to Verify:
- ⚠️ View all registered members in their club (from `/clubs/{id}/get-members`)
- ⚠️ Approve/reject new member registration requests (need to verify endpoint)
- ⚠️ Assign or revoke internal roles (project head, event coordinator, etc.) - client-side or backend?
- ⚠️ Filter/search members by name, department, or role (client-side)
- ⚠️ Export member list as PDF or Excel (mock - UI only)

### API Endpoints to Check:
- GET `/clubs/{id}/get-members` - ✅ Exists
- GET `/student/{id}` - ✅ Exists (for member details)
- GET `/clubs/{id}/requests/pending` - ✅ Exists (for pending requests)
- PATCH `/clubs/{clubId}/requests/{studentId}/approve` - ✅ Exists (approve request)
- PATCH `/clubs/{clubId}/requests/{studentId}/reject` - ✅ Exists (reject request)
- POST `/authorities/{clubAdminId}/create` - ✅ Exists (assign internal role - need to verify SUPER_USER access)
- GET `/authorities` - ✅ Exists (filter by club for internal roles)

### Files to Check:
- ✅ `src/pages/super-user/Members.tsx` - Exists (verify data fetching)
- ✅ `src/components/super-user/MembersList.tsx` - Exists (verify display)
- ✅ `src/components/super-user/MemberFilters.tsx` - Exists (verify filtering)
- ✅ `src/components/super-user/ApproveMemberDialog.tsx` - Exists (verify approval)
- ✅ `src/components/super-user/RejectMemberDialog.tsx` - Exists (verify rejection)
- ✅ `src/components/super-user/AssignRoleDialog.tsx` - Exists (verify role assignment)
- ✅ `src/components/super-user/ExportMembersButton.tsx` - Exists (verify export - mock)

### Issues to Fix:
- [ ] Verify members list loads correctly for assigned club
- [ ] Verify approve/reject functionality works
- [ ] Verify internal role assignment works (if supported)
- [ ] Verify search and filter functionality
- [ ] Verify export functionality (mock implementation)

---

## GROUP 3: Event Management 📅
**Priority: HIGH (Core functionality)**

### Features to Verify:
- ⚠️ Create, edit, and delete events for their club (POST `/events/create`, PATCH `/events/{id}/update`, DELETE `/events/{id}/delete`)
- ⚠️ Approve event proposals from club members (need to verify if endpoint exists)
- ⚠️ View upcoming and past events in calendar format (GET `/events/club/{clubId}`)
- ⚠️ Generate event reports (attendance, budget used, feedback summary) - need to verify endpoints
- ⚠️ Optional: image/video gallery for completed events (client-side or backend?)

### API Endpoints to Check:
- GET `/events/club/{clubId}` - ✅ Exists
- GET `/events/{id}` - ✅ Exists
- POST `/events/create` - ✅ Exists
- PATCH `/events/{id}/update` - ✅ Exists
- DELETE `/events/{id}/delete` - ✅ Exists
- GET `/events/participation/{eventId}` - ❓ Need to verify (for attendance)
- GET `/events/proposals` - ❓ Need to verify (for event proposals)
- POST `/events/proposals/{id}/approve` - ❓ Need to verify
- POST `/events/proposals/{id}/reject` - ❓ Need to verify

### Files to Check:
- ✅ `src/pages/super-user/Events.tsx` - Exists (verify data fetching)
- ✅ `src/components/super-user/EventsList.tsx` - Exists (verify display)
- ✅ `src/components/super-user/CreateEventDialog.tsx` - Exists (verify creation)
- ✅ `src/components/super-user/EditEventDialog.tsx` - Exists (verify editing)
- ✅ `src/components/super-user/DeleteEventDialog.tsx` - Exists (verify deletion)
- ✅ `src/components/super-user/EventCalendarView.tsx` - Exists (verify calendar)
- ✅ `src/components/super-user/EventProposalsList.tsx` - Exists (verify proposals)
- ✅ `src/components/super-user/EventReportDialog.tsx` - Exists (verify reports)
- ⚠️ `src/pages/Events.tsx` - Needs to route SUPER_USER to super-user events

### Issues to Fix:
- [ ] Verify events load correctly for assigned club
- [ ] Verify create event form works correctly
- [ ] Verify edit event form works correctly
- [ ] Verify delete event works correctly
- [ ] Verify calendar view displays events correctly
- [ ] Verify event proposals functionality (if endpoint exists)
- [ ] Verify event reports generation (if endpoint exists)

---

## GROUP 4: Financial Management 💰
**Priority: MEDIUM (Financial tracking)**

### Features to Verify:
- ⚠️ Record club income and expenses (under finance office head supervision) - need to verify endpoint
- ⚠️ Generate downloadable finance reports by month or event (mock - UI only)
- ⚠️ Approve or reject finance requests from members (need to verify endpoint)
- ⚠️ View analytics chart for income vs expense trends (client-side calculation or backend)
- ⚠️ View fees collected (from `/fees/clubs/{clubId}`)

### API Endpoints to Check:
- GET `/fees/clubs/{clubId}` - ✅ Exists
- GET `/fees/clubs/{clubId}/total` - ✅ Exists
- GET `/fees/{id}` - ✅ Exists
- POST `/fees/create` - ❓ Need to verify (for recording income/expenses)
- GET `/fees/requests` - ❓ Need to verify (for finance requests)
- PATCH `/fees/requests/{id}/approve` - ❓ Need to verify
- PATCH `/fees/requests/{id}/reject` - ❓ Need to verify
- GET `/fees/stats` - ❓ Need to verify (for analytics)

### Files to Check:
- ✅ `src/pages/super-user/Finance.tsx` - Exists (verify data fetching)
- ✅ `src/components/super-user/FinanceOverview.tsx` - Exists (verify summary)
- ✅ `src/components/super-user/IncomeExpenseForm.tsx` - Exists (verify form)
- ✅ `src/components/super-user/FinanceRequestsList.tsx` - Exists (verify requests)
- ✅ `src/components/super-user/FinanceChart.tsx` - Exists (verify chart)
- ✅ `src/components/super-user/FinanceReportDialog.tsx` - Exists (verify reports)
- ⚠️ `src/pages/Fees.tsx` - Needs to route SUPER_USER to super-user finance

### Issues to Fix:
- [ ] Verify fees/income data loads correctly for assigned club
- [ ] Verify income/expense recording works (if endpoint exists)
- [ ] Verify finance requests display correctly (if endpoint exists)
- [ ] Verify approve/reject finance requests works (if endpoint exists)
- [ ] Verify finance chart displays correctly
- [ ] Verify finance reports generation (mock implementation)

---

## GROUP 5: Club Resource Management 📦
**Priority: MEDIUM (Resource tracking)**

### Features to Verify:
- ⚠️ Manage club-owned items/resources (sound system, water resource tools, uniforms, etc.) - need to verify if backend exists
- ⚠️ Track lending and return of resources - need to verify if backend exists
- ⚠️ Submit resource purchase or maintenance requests to Club Admin - need to verify if backend exists
- ⚠️ View resource usage history - need to verify if backend exists

### API Endpoints to Check:
- GET `/resources/club/{clubId}` - ❓ Need to verify
- POST `/resources/create` - ❓ Need to verify
- PATCH `/resources/{id}/update` - ❓ Need to verify
- DELETE `/resources/{id}/delete` - ❓ Need to verify
- POST `/resources/{id}/lend` - ❓ Need to verify
- POST `/resources/{id}/return` - ❓ Need to verify
- POST `/resources/requests/create` - ❓ Need to verify
- GET `/resources/requests` - ❓ Need to verify
- GET `/resources/{id}/history` - ❓ Need to verify

### Files to Check:
- ✅ `src/pages/super-user/Resources.tsx` - Exists (verify data fetching)
- ✅ `src/components/super-user/ResourcesList.tsx` - Exists (verify display)
- ✅ `src/components/super-user/ResourceForm.tsx` - Exists (verify form)
- ✅ `src/components/super-user/LendResourceDialog.tsx` - Exists (verify lending)
- ✅ `src/components/super-user/ReturnResourceDialog.tsx` - Exists (verify return)
- ✅ `src/components/super-user/ResourceRequestDialog.tsx` - Exists (verify requests)
- ✅ `src/components/super-user/ResourceHistory.tsx` - Exists (verify history)

### Issues to Fix:
- [ ] Verify if resource management endpoints exist in backend
- [ ] If endpoints exist, verify all CRUD operations work
- [ ] If endpoints don't exist, implement client-side mock with localStorage
- [ ] Verify resource lending/returning works
- [ ] Verify resource requests submission works
- [ ] Verify resource history displays correctly

**Note:** This group may require client-side mock implementation if backend endpoints don't exist.

---

## GROUP 6: Communication & Collaboration 💬
**Priority: MEDIUM (Communication)**

### Features to Verify:
- ⚠️ Send announcements or updates to all club members (POST `/announcements/create`)
- ⚠️ Internal chat or discussion board for club authorities - need to verify if backend exists
- ⚠️ "Suggestion Box" feature for members to submit ideas (visible only to super users) - need to verify if backend exists
- ⚠️ Option to schedule meetings with members and export meeting notes - need to verify if backend exists

### API Endpoints to Check:
- GET `/announcements/retriveAnnouncementByClub/{clubId}` - ✅ Exists
- GET `/announcements/{id}` - ✅ Exists
- POST `/announcements/create` - ✅ Exists
- PATCH `/announcements/{id}/update` - ✅ Exists
- DELETE `/announcements/{id}/delete` - ✅ Exists
- GET `/chat/messages` - ❓ Need to verify (for discussion board)
- POST `/chat/messages` - ❓ Need to verify
- GET `/suggestions/club/{clubId}` - ❓ Need to verify (for suggestion box)
- POST `/suggestions/create` - ❓ Need to verify
- GET `/meetings/club/{clubId}` - ❓ Need to verify (for meetings)
- POST `/meetings/create` - ❓ Need to verify

### Files to Check:
- ✅ `src/pages/super-user/Announcements.tsx` - Exists (verify data fetching)
- ✅ `src/components/super-user/CreateAnnouncementDialog.tsx` - Exists (verify creation)
- ✅ `src/components/super-user/DiscussionBoard.tsx` - Exists (verify board)
- ✅ `src/components/super-user/SuggestionBox.tsx` - Exists (verify suggestions)
- ✅ `src/components/super-user/MeetingScheduler.tsx` - Exists (verify meetings)
- ⚠️ `src/pages/Announcements.tsx` - Needs to route SUPER_USER to super-user announcements

### Issues to Fix:
- [ ] Verify announcements load correctly for assigned club
- [ ] Verify create announcement form works correctly
- [ ] Verify edit/delete announcement works correctly
- [ ] Verify discussion board functionality (if endpoint exists, or use client-side mock)
- [ ] Verify suggestion box functionality (if endpoint exists, or use client-side mock)
- [ ] Verify meeting scheduler functionality (if endpoint exists, or use client-side mock)

**Note:** Discussion board, suggestion box, and meeting scheduler may require client-side mock implementation if backend endpoints don't exist.

---

## GROUP 7: Reports & Insights 📊
**Priority: LOW (Nice to have)**

### Features to Verify:
- ⚠️ Generate detailed club reports (membership growth, financial performance, event participation)
- ⚠️ Export reports as PDF or Excel (mock - UI only)
- ⚠️ Display graphical insights using charts (client-side calculation from existing data)

### API Endpoints to Check:
- GET `/reports/club/{clubId}` - ❓ Need to verify
- GET `/reports/membership-growth` - ❓ Need to verify
- GET `/reports/financial-performance` - ❓ Need to verify
- GET `/reports/event-participation` - ❓ Need to verify
- POST `/reports/generate` - ❓ Need to verify

### Files to Check:
- ✅ `src/pages/super-user/Reports.tsx` - Exists (verify data fetching)
- ✅ `src/components/super-user/ReportGenerator.tsx` - Exists (verify generation)
- ✅ `src/components/super-user/InsightsCharts.tsx` - Exists (verify charts)
- ✅ `src/components/super-user/ExportReportButton.tsx` - Exists (verify export - mock)

### Issues to Fix:
- [ ] Verify if report endpoints exist in backend
- [ ] If endpoints exist, verify report generation works
- [ ] If endpoints don't exist, implement client-side report generation from existing data
- [ ] Verify charts display correctly (using Recharts)
- [ ] Verify export functionality (mock implementation)

**Note:** This group may require client-side report generation from existing data if backend endpoints don't exist.

---

## GROUP 8: UI Enhancements & Polish ✨
**Priority: MEDIUM (User experience)**

### Features to Verify:
- ⚠️ Tabbed navigation for modules
- ⚠️ Collapsible side menu (or enhanced header navigation)
- ⚠️ Role-based color theme (deep blue for Super User)
- ⚠️ Toast notifications for actions
- ⚠️ Loading skeletons and spinners
- ⚠️ Tooltips on dashboard icons
- ⚠️ Responsive design
- ⚠️ Real-time notifications (via polling)

### Files to Check:
- ✅ `src/components/super-user/Sidebar.tsx` - Exists (verify navigation)
- ⚠️ `src/components/layout/MainLayout.tsx` - Needs to add SUPER_USER navigation
- ✅ `src/components/ui/Toast.tsx` - Should already exist (verify)
- ✅ `src/components/ui/Skeleton.tsx` - Should already exist (verify)
- ✅ `src/components/ui/Tooltip.tsx` - Should already exist (verify)

### Issues to Fix:
- [ ] Verify navigation structure for SUPER_USER
- [ ] Verify color theme is applied correctly (deep blue)
- [ ] Verify toast notifications work for all actions
- [ ] Verify loading states are displayed correctly
- [ ] Verify tooltips are present on dashboard icons
- [ ] Verify responsive design works on mobile
- [ ] Verify notifications polling works correctly

---

## Implementation Order

1. **GROUP 1: Dashboard Overview & Navigation** (HIGH - Foundation)
2. **GROUP 2: Member Management** (HIGH - Core functionality)
3. **GROUP 3: Event Management** (HIGH - Core functionality)
4. **GROUP 4: Financial Management** (MEDIUM)
5. **GROUP 5: Club Resource Management** (MEDIUM - may need mock)
6. **GROUP 6: Communication & Collaboration** (MEDIUM - may need mock)
7. **GROUP 7: Reports & Insights** (LOW - may need mock)
8. **GROUP 8: UI Enhancements & Polish** (MEDIUM)

---

## Key Considerations

1. **Club Access:** SUPER_USER can only access data for their assigned club (from authorities table)
2. **Authority Position:** User's position (President, Secretary, etc.) is stored in `authorities.name`
3. **Data Filtering:** All API calls must filter by the user's assigned club ID
4. **Mock Implementation:** Groups 5, 6, and 7 may require client-side mock implementation if backend endpoints don't exist
5. **Navigation:** Ensure SUPER_USER routes correctly in `MainLayout.tsx` and page routers
6. **Role Identification:** Use `isSuperUser()` utility function to identify SUPER_USER role
7. **Club Loading:** Load user's assigned club from authorities endpoint

---

## Notes

- All work should be done on the frontend only (backend API cannot be touched)
- Use existing API endpoints where possible
- Implement client-side mocks for features without backend support
- Follow the same patterns used in SUPER_ADMIN and CLUB_ADMIN implementations
- Ensure consistent UI/UX across all role-based dashboards

