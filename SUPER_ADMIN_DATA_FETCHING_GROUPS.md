# SUPER_ADMIN Role - Data Fetching & API Connection Groups

This document groups all SUPER_ADMIN functionalities for systematic data fetching and API connection verification. Each group will be checked one by one to ensure:
1. Correct data fetching from backend
2. Proper API endpoint usage
3. UI customization if needed
4. Missing endpoints identification and creation

---

## GROUP 1: Dashboard Overview & Analytics 📊
**Priority: HIGH (Foundation - Must be done first)**

### Features to Verify:
- ✅ Total students count (from `/student/allstudents`)
- ✅ Total clubs count (from `/clubs/all-clubs`)
- ✅ Total club admins count (students with role ADMIN - needs verification)
- ✅ Total pending join requests (aggregated from all clubs `/clubs/{id}/requests/pending`)
- ✅ Total events count (from `/events/allEvents`)
- ✅ Total announcements count (from `/announcements/all` - verify endpoint)
- ✅ Student growth chart data (monthly registration data)
- ✅ Top active clubs chart (based on member count/activity)
- ✅ Events per month chart
- ✅ Recent activity feed (from events, clubs, announcements)
- ✅ System health indicators (mock or backend endpoint)

### API Endpoints to Check:
- `GET /student/allstudents` - ✅ Exists
- `GET /clubs/all-clubs` - ✅ Exists
- `GET /events/allEvents` - ✅ Exists
- `GET /announcements/all` - ❓ Need to verify
- `GET /clubs/{id}/requests/pending` - ✅ Exists (need to aggregate)
- `GET /student/allstudents?role=ADMIN` - ❓ Need to verify filtering
- `GET /system/health` - ❓ Need to check if exists (for system health)

### Files to Check:
- `src/pages/admin/Dashboard.tsx`
- `src/components/admin/StatsCards.tsx`
- `src/components/admin/StudentGrowthChart.tsx`
- `src/components/admin/TopClubsChart.tsx`
- `src/components/admin/EventsChart.tsx`
- `src/components/admin/QuickActionsPanel.tsx`
- `src/components/admin/NotificationsPanel.tsx`

### Missing Endpoints (if any):
- [ ] Get student registration statistics by month
- [ ] Get club activity statistics
- [ ] Get system health status
- [ ] Get recent activity feed

---

## GROUP 2: User/Student Management 👥
**Priority: HIGH (Core functionality)**

### Features to Verify:
- ✅ View all students list (from `/student/allstudents`)
- ✅ Search/filter students (client-side or backend)
- ✅ Filter by name, department, year, role
- ✅ View student profile details (from `/student/{id}`)
- ✅ View student club memberships (from `/student/{id}/getclubsJoined`)
- ✅ Update student data (PATCH `/student/{id}/update`)
- ✅ Delete student account (DELETE `/student/{id}/delete`)
- ✅ Reset student password (need to verify endpoint)
- ✅ View student roles/authorities (from `/authorities` - filter by student)
- ✅ Bulk actions (select multiple students)

### API Endpoints to Check:
- `GET /student/allstudents` - ✅ Exists
- `GET /student/{id}` - ✅ Exists
- `PATCH /student/{id}/update` - ✅ Exists
- `DELETE /student/{id}/delete` - ✅ Exists
- `GET /student/{id}/getclubsJoined` - ✅ Exists
- `GET /authorities` - ✅ Exists (filter by student)
- `POST /student/{id}/reset-password` - ❓ Need to verify
- `POST /student/bulk-update` - ❓ Need to verify (for bulk actions)
- `POST /student/bulk-delete` - ❓ Need to verify (for bulk actions)

### Files to Check:
- `src/pages/admin/Students.tsx`
- `src/components/admin/StudentsList.tsx`
- `src/components/admin/StudentFilters.tsx`
- `src/components/admin/StudentProfileModal.tsx`
- `src/components/admin/StudentClubMemberships.tsx`
- `src/components/admin/EditStudentDialog.tsx`
- `src/components/admin/DeleteStudentDialog.tsx`
- `src/components/admin/ResetPasswordDialog.tsx`

### Missing Endpoints (if any):
- [ ] Reset student password endpoint
- [ ] Bulk update students endpoint
- [ ] Bulk delete students endpoint
- [ ] Search/filter students endpoint (backend-side)

---

## GROUP 3: Club Management 🏛️
**Priority: HIGH (Core functionality)**

### Features to Verify:
- ✅ View all clubs (from `/clubs/all-clubs`)
- ✅ View detailed club info (from `/clubs/{id}`)
- ✅ Create new club (POST `/clubs/create`)
- ✅ Update club info (PATCH `/clubs/{id}/update`)
- ✅ Delete club (DELETE `/clubs/{id}/delete`)
- ✅ Assign club admins (PATCH `/clubs/{id}/assign-clubAdmin/{memberId}`)
- ✅ Demote club admins (need to verify endpoint)
- ✅ View club members (from `/clubs/{id}/get-members`)
- ✅ View pending requests for club (from `/clubs/{id}/requests/pending`)
- ✅ Club ranking (client-side calculation or backend)
- ✅ Club verification badge (need to verify if exists in model)
- ✅ Club activity dashboard (calculate from events, members, etc.)

### API Endpoints to Check:
- `GET /clubs/all-clubs` - ✅ Exists
- `GET /clubs/{id}` - ✅ Exists
- `POST /clubs/create` - ✅ Exists
- `PATCH /clubs/{id}/update` - ✅ Exists
- `DELETE /clubs/{id}/delete` - ✅ Exists
- `GET /clubs/{id}/get-members` - ✅ Exists
- `GET /clubs/{id}/requests/pending` - ✅ Exists
- `PATCH /clubs/{id}/assign-clubAdmin/{memberId}` - ✅ Exists
- `PATCH /clubs/{id}/demote-clubAdmin/{memberId}` - ❓ Need to verify
- `GET /clubs/{id}/stats` - ❓ Need to verify (for activity dashboard)
- `GET /clubs/ranking` - ❓ Need to verify (for club ranking)

### Files to Check:
- `src/pages/admin/Clubs.tsx`
- `src/components/admin/ClubsList.tsx`
- `src/components/admin/ClubDetailsModal.tsx`
- `src/components/admin/CreateClubDialog.tsx`
- `src/components/admin/EditClubDialog.tsx`
- `src/components/admin/DeleteClubDialog.tsx`
- `src/components/admin/AssignClubAdminDialog.tsx`
- `src/components/admin/ClubMembersList.tsx`
- `src/components/admin/ClubRankingCard.tsx`
- `src/components/admin/ClubActivityDashboard.tsx`

### Missing Endpoints (if any):
- [ ] Demote club admin endpoint
- [ ] Club statistics/activity endpoint
- [ ] Club ranking endpoint
- [ ] Club verification status update endpoint

---

## GROUP 4: Join Requests Management ✅
**Priority: MEDIUM**

### Features to Verify:
- ✅ View all pending join requests (aggregate from all clubs)
- ✅ Approve requests (PATCH `/clubs/{clubId}/requests/{studentId}/approve`)
- ✅ Reject requests (PATCH `/clubs/{clubId}/requests/{studentId}/reject`)
- ✅ Filter by club, student name, date, status
- ✅ Bulk approve/reject (need to verify if endpoint exists)
- ✅ Request details modal
- ✅ Request history (need to verify if endpoint exists)

### API Endpoints to Check:
- `GET /clubs/{id}/requests/pending` - ✅ Exists (aggregate for all clubs)
- `PATCH /clubs/{clubId}/requests/{studentId}/approve` - ✅ Exists
- `PATCH /clubs/{clubId}/requests/{studentId}/reject` - ✅ Exists
- `GET /clubs/{id}/requests/all` - ❓ Need to verify (for request history)
- `POST /clubs/requests/bulk-approve` - ❓ Need to verify
- `POST /clubs/requests/bulk-reject` - ❓ Need to verify

### Files to Check:
- `src/pages/admin/JoinRequests.tsx`
- `src/components/admin/JoinRequestsList.tsx`
- `src/components/admin/JoinRequestFilters.tsx`
- `src/components/admin/JoinRequestDetailsModal.tsx`
- `src/components/admin/BulkRequestActions.tsx`

### Missing Endpoints (if any):
- [ ] Get all requests (pending + history) endpoint
- [ ] Bulk approve requests endpoint
- [ ] Bulk reject requests endpoint

---

## GROUP 5: Events Management 📅
**Priority: MEDIUM**

### Features to Verify:
- ✅ View all events (from `/events/allEvents`)
- ✅ Edit events (PATCH `/events/{id}/update`)
- ✅ Delete events (DELETE `/events/{id}/delete`)
- ✅ Filter events (today, upcoming, past, by club, by date range)
- ✅ View event participation count (need to verify if stored)
- ✅ Event calendar view
- ✅ Event statistics

### API Endpoints to Check:
- `GET /events/allEvents` - ✅ Exists
- `GET /events/{id}` - ✅ Exists
- `PATCH /events/{id}/update` - ✅ Exists
- `DELETE /events/{id}/delete` - ✅ Exists
- `GET /events/club/{clubId}` - ✅ Exists
- `GET /events/stats` - ❓ Need to verify (for statistics)
- `GET /events/participation/{eventId}` - ❓ Need to verify (for participation count)

### Files to Check:
- `src/pages/admin/Events.tsx`
- `src/components/admin/EventsList.tsx`
- `src/components/admin/EventFilters.tsx`
- `src/components/admin/EditEventDialog.tsx`
- `src/components/admin/DeleteEventDialog.tsx`
- `src/components/admin/EventCalendarView.tsx`
- `src/components/admin/EventParticipationStats.tsx`

### Missing Endpoints (if any):
- [ ] Get event statistics endpoint
- [ ] Get event participation count endpoint
- [ ] Filter events by date range endpoint (or client-side)

---

## GROUP 6: Announcements Management 📢
**Priority: MEDIUM**

### Features to Verify:
- ✅ Create announcements (POST `/announcements/create`)
- ✅ View all announcements (GET `/announcements/all` - need to verify)
- ✅ Edit announcements (PATCH `/announcements/{id}/update`)
- ✅ Delete announcements (DELETE `/announcements/{id}/delete`)
- ✅ Create for all clubs or specific clubs
- ✅ Announcement scheduling (need to verify if supported)
- ✅ Filter by club, date, author
- ✅ Announcement statistics

### API Endpoints to Check:
- `GET /announcements/all` - ❓ Need to verify
- `GET /announcements/{id}` - ❓ Need to verify
- `POST /announcements/create` - ❓ Need to verify
- `PATCH /announcements/{id}/update` - ❓ Need to verify
- `DELETE /announcements/{id}/delete` - ❓ Need to verify
- `GET /announcements/club/{clubId}` - ❓ Need to verify
- `POST /announcements/schedule` - ❓ Need to verify (for scheduling)

### Files to Check:
- `src/pages/admin/Announcements.tsx`
- `src/components/admin/AnnouncementsList.tsx`
- `src/components/admin/CreateAnnouncementDialog.tsx`
- `src/components/admin/EditAnnouncementDialog.tsx`
- `src/components/admin/DeleteAnnouncementDialog.tsx`
- `src/components/admin/AnnouncementSchedulingDialog.tsx`
- `src/components/admin/AnnouncementFilters.tsx`

### Missing Endpoints (if any):
- [ ] Get all announcements endpoint
- [ ] Create announcement endpoint
- [ ] Update announcement endpoint
- [ ] Delete announcement endpoint
- [ ] Schedule announcement endpoint
- [ ] Get announcement statistics endpoint

---

## GROUP 7: Fees & Finance Panel 💰
**Priority: MEDIUM**

### Features to Verify:
- ✅ View all fees (from `/fees/clubs/{clubId}` - aggregate for all clubs)
- ✅ Filter fees by club, date range, student, status
- ✅ Fee receipts table
- ✅ Export to Excel/PDF (mock - UI only)
- ✅ Fee graph: Club finance statistics
- ✅ Club financial dashboard
- ✅ Total fees collected by club (from `/fees/clubs/{clubId}/total`)

### API Endpoints to Check:
- `GET /fees/clubs/{clubId}` - ✅ Exists
- `GET /fees/clubs/{clubId}/total` - ✅ Exists
- `GET /fees/{id}` - ✅ Exists
- `PATCH /fees/{id}/status` - ✅ Exists
- `GET /fees/all` - ❓ Need to verify (for system-wide fees)
- `GET /fees/stats` - ❓ Need to verify (for statistics)

### Files to Check:
- `src/pages/admin/Fees.tsx`
- `src/components/admin/FeesOverview.tsx`
- `src/components/admin/FeesTable.tsx`
- `src/components/admin/FeeFilters.tsx`
- `src/components/admin/ClubFinanceChart.tsx`
- `src/components/admin/ExportButtons.tsx`

### Missing Endpoints (if any):
- [ ] Get all fees system-wide endpoint
- [ ] Get fee statistics endpoint
- [ ] Export fees endpoint (or client-side)

---

## GROUP 8: System Configuration & Insights ⚙️
**Priority: LOW**

### Features to Verify:
- ✅ System logs (mock implementation - need backend endpoint)
- ✅ Role assignment (POST `/authorities/{clubAdminId}/create`)
- ✅ Activity log per admin (need to verify endpoint)
- ✅ Dark/light mode toggle (client-side only)
- ✅ Backup/export data (mock - UI only)
- ✅ Settings page (branding, university info, system preferences)

### API Endpoints to Check:
- `GET /system/logs` - ❓ Need to verify
- `GET /system/activity-log` - ❓ Need to verify
- `POST /authorities/{clubAdminId}/create` - ✅ Exists
- `GET /authorities` - ✅ Exists
- `GET /system/settings` - ❓ Need to verify
- `PATCH /system/settings` - ❓ Need to verify
- `POST /system/backup` - ❓ Need to verify (for backup)

### Files to Check:
- `src/pages/admin/Settings.tsx`
- `src/pages/admin/SystemLogs.tsx`
- `src/components/admin/SystemLogsView.tsx`
- `src/components/admin/RoleAssignmentDialog.tsx`
- `src/components/admin/ActivityLog.tsx`
- `src/components/admin/ThemeToggle.tsx`
- `src/components/admin/BackupExportButtons.tsx`
- `src/components/admin/SettingsForm.tsx`

### Missing Endpoints (if any):
- [ ] Get system logs endpoint
- [ ] Get activity log endpoint
- [ ] Get system settings endpoint
- [ ] Update system settings endpoint
- [ ] Backup system data endpoint

---

## GROUP 9: Notifications Panel 🔔
**Priority: LOW**

### Features to Verify:
- ✅ Alerts for new club creation requests (client-side generation)
- ✅ Pending club join requests (from aggregated requests)
- ✅ New events created (from events data)
- ✅ Suspicious activity (mock - placeholder)
- ✅ Notification center
- ✅ Notification history (client-side localStorage)
- ✅ Mark as read/unread (client-side)

### API Endpoints to Check:
- Notification generation is currently client-side based on data from:
  - `GET /clubs/all-clubs` - ✅ Exists
  - `GET /events/allEvents` - ✅ Exists
  - `GET /clubs/{id}/requests/pending` - ✅ Exists
- `GET /notifications` - ❓ Need to verify (if backend notifications exist)
- `PATCH /notifications/{id}/read` - ❓ Need to verify

### Files to Check:
- `src/pages/admin/Notifications.tsx`
- `src/components/admin/NotificationsPanel.tsx`
- `src/components/admin/NotificationCenter.tsx`
- `src/components/admin/NotificationBadge.tsx`

### Missing Endpoints (if any):
- [ ] Get notifications endpoint (if backend notifications are preferred)
- [ ] Mark notification as read endpoint
- [ ] Real-time notification endpoint (WebSocket or polling)

---

## GROUP 10: UI Enhancements & Polish ✨
**Priority: MEDIUM (Applied across all admin pages)**

### Features to Verify:
- ✅ Search bars (client-side or backend)
- ✅ Filters & sort dropdowns (client-side or backend)
- ✅ Table view + Cards toggle (UI only)
- ✅ Charts & analytics widgets (data from Groups 1-7)
- ✅ Responsive admin panel (UI only)
- ✅ Toast notifications (UI only - using sonner)
- ✅ Loading skeleton UI (UI only)
- ✅ Breadcrumb navigation (UI only)
- ✅ Pagination for large lists (client-side or backend)
- ✅ Empty states (UI only)

### API Endpoints to Check:
- No specific endpoints (these are UI enhancements)
- But need to verify if backend supports:
  - [ ] Pagination parameters (page, size, sort)
  - [ ] Search parameters (query, filters)
  - [ ] Sorting parameters (sortBy, order)

### Files to Check:
- `src/components/admin/DataTable.tsx`
- `src/components/admin/ViewToggle.tsx`
- `src/components/admin/Breadcrumbs.tsx`
- `src/components/admin/Pagination.tsx`
- `src/components/admin/EmptyState.tsx`

### Missing Endpoints (if any):
- [ ] Pagination support in existing endpoints
- [ ] Search/filter support in existing endpoints
- [ ] Sorting support in existing endpoints

---

## SUMMARY OF MISSING ENDPOINTS

### High Priority (Core Functionality):
1. ✅ Reset student password endpoint
2. ✅ Bulk update/delete students endpoints
3. ✅ Demote club admin endpoint
4. ✅ Get all requests (history) endpoint
5. ✅ Bulk approve/reject requests endpoints
6. ✅ Get all announcements endpoint
7. ✅ Create/update/delete announcements endpoints
8. ✅ Schedule announcements endpoint

### Medium Priority (Enhanced Features):
1. ✅ Get student registration statistics
2. ✅ Get club activity statistics
3. ✅ Get event statistics
4. ✅ Get event participation count
5. ✅ Get announcement statistics
6. ✅ Get fee statistics
7. ✅ Get all fees system-wide

### Low Priority (Nice to Have):
1. ✅ System logs endpoint
2. ✅ Activity log endpoint
3. ✅ System settings endpoints
4. ✅ Backup system data endpoint
5. ✅ Backend notifications endpoints
6. ✅ System health endpoint

### Backend Support Needed:
1. ✅ Pagination support in all list endpoints
2. ✅ Search/filter support in all list endpoints
3. ✅ Sorting support in all list endpoints

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
- [ ] Mock data is replaced with real API calls
- [ ] Client-side calculations are accurate
- [ ] Filtering/searching works correctly
- [ ] Pagination works (if applicable)
- [ ] Toast notifications show appropriate messages

---

## NEXT STEPS

1. Start with GROUP 1 (Dashboard) - verify all data fetching
2. Continue with GROUP 2 (Students) - verify CRUD operations
3. Proceed through each group systematically
4. Create missing endpoints in Spring Boot backend
5. Update frontend to use new endpoints
6. Test each group thoroughly before moving to next
7. Document any API changes needed

