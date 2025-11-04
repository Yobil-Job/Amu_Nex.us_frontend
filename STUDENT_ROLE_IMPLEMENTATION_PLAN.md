# Student Role UI Implementation Plan

## Overview
Complete student-specific UI implementation organized by functional groups for systematic development.

---

## Implementation Order (Priority-based grouping)

### **Group 1: Student Profile & Account Management** 🔐
**Priority: HIGH** (Foundation for all other features)

#### Tasks:
1. ✅ View personal profile (Already exists - enhance)
2. ⚠️ Update personal information (Already exists - verify & enhance)
3. ✅ View departments, year, gender, name (Already exists)
4. ❌ Change password (Frontend logic - UI only)
5. ❌ View membership roles/authorities (Read from backend)
   - Display roles from `/student/{id}/events` endpoint context
   - Show authorities from `/authorities/students/{studentId}` endpoint
   - Display club-specific roles (President, Secretary, Finance Officer, etc.)

**Files to create/modify:**
- `src/pages/Profile.tsx` - Enhance existing profile page
- `src/components/student/PasswordChange.tsx` - New component (UI only)
- `src/components/student/RolesView.tsx` - New component for displaying roles

---

### **Group 2: Club Discovery & Joining** 🤝
**Priority: HIGH** (Core student functionality)

#### Tasks:
1. ⚠️ View all available clubs (Partially exists - needs student-specific view)
2. ❌ Search clubs by name (Add search functionality)
3. ⚠️ View club details (Exists but needs student context)
4. ⚠️ Request to join a club (Exists - verify functionality)
5. ❌ View status of club join requests (New feature)
   - Show pending/approved/rejected status
   - Display which clubs student requested to join
6. ⚠️ See list of clubs joined (Exists - enhance with better UI)

**Files to create/modify:**
- `src/pages/student/ClubsDiscovery.tsx` - New student-specific clubs page
- `src/components/student/ClubRequestStatus.tsx` - New component
- `src/components/student/JoinRequestCard.tsx` - New component
- `src/pages/Clubs.tsx` - Modify for student role context

---

### **Group 3: Joined Club Dashboard** 🏛️
**Priority: MEDIUM** (Enhanced club management for students)

#### Tasks:
1. ❌ View club information (Dedicated student view)
2. ❌ View club members (Read-only for students)
3. ❌ View club admins (Display club leadership)
4. ❌ Leave club (Frontend logic - UI only, no backend endpoint)

**Files to create/modify:**
- `src/pages/student/JoinedClubDashboard.tsx` - New page
- `src/components/student/ClubInfoCard.tsx` - New component
- `src/components/student/ClubMembersList.tsx` - New component
- `src/components/student/LeaveClubButton.tsx` - New component (UI only)

---

### **Group 4: Events Management** 📅
**Priority: HIGH** (Core student engagement feature)

#### Tasks:
1. ⚠️ View all events from joined clubs (Partially exists - filter by joined clubs)
2. ❌ Filter events (Upcoming / Past) (Add date filtering)
3. ❌ Show event on map (lat/long) (Map integration)
4. ⚠️ Event details modal/card (Exists - enhance)
5. ❌ Mark event as going or interested (Client-side UX)
6. ❌ Calendar view (UI only - visual calendar)

**Files to create/modify:**
- `src/pages/student/Events.tsx` - New student-specific events page
- `src/components/student/EventCard.tsx` - Enhanced event card
- `src/components/student/EventMap.tsx` - New map component
- `src/components/student/EventCalendar.tsx` - New calendar view
- `src/components/student/EventInteraction.tsx` - Going/Interested buttons

---

### **Group 5: Announcements** 📢
**Priority: MEDIUM** (Communication feature)

#### Tasks:
1. ⚠️ View announcements from joined clubs (Partially exists - filter by clubs)
2. ❌ Notifications panel (New component)
3. ❌ Mark announcements as read (Client-side - localStorage)

**Files to create/modify:**
- `src/pages/student/Announcements.tsx` - New student-specific page
- `src/components/student/NotificationsPanel.tsx` - New component
- `src/components/student/AnnouncementCard.tsx` - Enhanced card with read status

---

### **Group 6: Fees/Payments** 💰
**Priority: MEDIUM** (Financial tracking)

#### Tasks:
1. ⚠️ View fee records (Partially exists - needs student filtering)
2. ⚠️ View payment status (Exists - enhance)
3. ❌ Show total fees paid (Calculate from fee records)

**Files to create/modify:**
- `src/pages/student/Fees.tsx` - New student-specific fees page
- `src/components/student/FeeSummary.tsx` - New component
- `src/components/student/PaymentStatusCard.tsx` - Enhanced status display

---

### **Group 7: Dashboard Widgets** 📊
**Priority: HIGH** (Main landing page enhancement)

#### Tasks:
1. ❌ Number of clubs joined (Widget)
2. ❌ Upcoming events (List + Calendar widget)
3. ❌ Latest announcements (Widget)
4. ❌ My roles (Widget showing assigned authorities)
5. ❌ Activity timeline (Client-side activity log)

**Files to create/modify:**
- `src/pages/student/Dashboard.tsx` - New student-specific dashboard
- `src/components/student/ClubsJoinedWidget.tsx` - New widget
- `src/components/student/UpcomingEventsWidget.tsx` - New widget
- `src/components/student/AnnouncementsWidget.tsx` - New widget
- `src/components/student/RolesWidget.tsx` - New widget
- `src/components/student/ActivityTimeline.tsx` - New component

---

## Implementation Strategy

### Phase 1: Foundation (Groups 1 & 7)
- Enhance profile page
- Create student-specific dashboard
- Add role viewing functionality

### Phase 2: Core Features (Groups 2 & 4)
- Club discovery and joining
- Events management with filtering
- Calendar view

### Phase 3: Engagement (Groups 3, 5, 6)
- Joined club dashboard
- Announcements with notifications
- Fees tracking

---

## Backend Endpoints Reference

### Student-specific endpoints:
- `GET /student/me` - Current user info
- `GET /student/{id}` - Student details
- `PATCH /student/{id}/update` - Update profile
- `GET /student/{id}/getclubsJoined` - Joined clubs
- `GET /student/{id}/events` - Student events
- `POST /student/{studentId}/clubs/{clubId}/request` - Join request

### Club endpoints (student access):
- `GET /clubs/all-clubs` - All clubs (authenticated users)
- `GET /clubs/{id}` - Club details
- `GET /clubs/{clubId}/get-members` - Club members (ADMIN only - check if student can access)

### Events endpoints:
- `GET /events/allEvents` - All events
- `GET /events/club/{clubId}` - Club events
- `GET /events/{eventId}` - Event details

### Announcements endpoints:
- `GET /announcements/retriveAllAnnouncement` - All announcements
- `GET /announcements/retriveAnnouncementByClub/{clubId}` - Club announcements

### Fees endpoints:
- `GET /fees/students/{studentId}` - Student fees

### Authorities endpoints:
- `GET /authorities/students/{studentId}` - Student authorities (ADMIN only - check access)

---

## Design Considerations

1. **Role-based Routing**: Create `/student/*` routes separate from admin routes
2. **Navigation**: Student-specific navigation menu
3. **UI/UX**: Clean, intuitive interface focused on student needs
4. **Responsive**: Mobile-first approach
5. **Performance**: Efficient data loading and caching
6. **Client-side Features**: Implement features that don't need backend (read status, calendar, etc.)

---

## Notes

- ⚠️ = Partially implemented - needs enhancement
- ❌ = Not implemented - needs to be created
- ✅ = Already implemented - verify functionality
