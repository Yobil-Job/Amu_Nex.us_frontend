# Role-Based UI Structure - SUPER_USER (Authorities) Code Location

## 📋 Overview
This document identifies where role-based UI is implemented and specifically where SUPER_USER (Club Authorities) role code is located in the codebase.

---

## 🎯 Role-Based UI Architecture

### 1. **Role Utilities & Helpers**
**Location:** `src/lib/roles.ts`
- **Purpose:** Central role checking functions
- **Key Functions:**
  - `isSuperUser(userRole)` - Checks if user is SUPER_USER
  - `isSuperAdmin(userRole)` - Checks if user is SUPER_ADMIN
  - `isAdmin(userRole)` - Checks if user is ADMIN (Club Admin)
  - `isStudent(userRole)` - Checks if user is STUDENT
  - `canManageEvents()`, `canManageAnnouncements()`, etc. - Permission checks
  - `getRoleDisplayName()` - Returns "Authority" for SUPER_USER
  - `getRoleBadgeColor()` - Returns badge color for SUPER_USER

### 2. **SUPER_USER Data Fetching Utilities**
**Location:** `src/lib/superUserUtils.ts`
- **Purpose:** Loads authorized clubs and user position for SUPER_USER
- **Key Functions:**
  - `loadAuthorizedClubsForUser(userId)` - Loads clubs assigned to SUPER_USER
  - `getUserPositionForClub(userId, clubId)` - Gets user's position (President, Secretary, etc.)

---

## 🗂️ SUPER_USER Specific Pages

**Location:** `src/pages/super-user/`

### Pages:
1. **`Dashboard.tsx`** - Main dashboard for SUPER_USER
   - Shows club overview, stats, quick access cards
   - Uses `loadAuthorizedClubsForUser()` to get assigned club
   - Displays user position and club information

2. **`Members.tsx`** - Member management page
   - View/approve/reject members
   - Assign internal roles
   - Filter and search members

3. **`Events.tsx`** - Event management page
   - Create/edit/delete events
   - View event calendar
   - Manage event proposals

4. **`Finance.tsx`** - Financial management page
   - View fees/income
   - Record income/expenses
   - Finance requests and reports

5. **`Announcements.tsx`** - Announcement management
   - Create/edit/delete announcements
   - Discussion board
   - Suggestion box

6. **`Resources.tsx`** - Resource management
   - Manage club resources
   - Track lending/returning
   - Resource requests

7. **`Reports.tsx`** - Reports and insights
   - Generate club reports
   - View analytics charts
   - Export reports

---

## 🧩 SUPER_USER Components

**Location:** `src/components/super-user/`

### Component List (37 components):
- `ApproveMemberDialog.tsx` - Approve member requests
- `AssignRoleDialog.tsx` - Assign internal roles
- `ClubOverviewCard.tsx` - Club overview display
- `CreateAnnouncementDialog.tsx` - Create announcements
- `CreateEventDialog.tsx` - Create events
- `DeleteEventDialog.tsx` - Delete events
- `DiscussionBoard.tsx` - Discussion board feature
- `EditEventDialog.tsx` - Edit events
- `EventCalendarView.tsx` - Calendar view for events
- `EventProposalsList.tsx` - Event proposals management
- `EventReportDialog.tsx` - Event reports
- `EventsList.tsx` - Events list display
- `ExportMembersButton.tsx` - Export members list
- `ExportReportButton.tsx` - Export reports
- `FinanceChart.tsx` - Finance charts
- `FinanceOverview.tsx` - Finance overview
- `FinanceReportDialog.tsx` - Finance reports
- `FinanceRequestsList.tsx` - Finance requests
- `IncomeExpenseForm.tsx` - Income/expense recording
- `InsightsCharts.tsx` - Analytics charts
- `LendResourceDialog.tsx` - Lend resources
- `MeetingScheduler.tsx` - Meeting scheduling
- `MemberFilters.tsx` - Member filtering
- `MembersList.tsx` - Members list display
- `NotificationBadge.tsx` - Notification badge
- `NotificationCenter.tsx` - Notification center
- `NotificationsPanel.tsx` - Notifications panel
- `QuickAccessCards.tsx` - Quick access cards
- `RejectMemberDialog.tsx` - Reject member requests
- `ReportGenerator.tsx` - Report generation
- `ResourceForm.tsx` - Resource form
- `ResourceHistory.tsx` - Resource history
- `ResourceRequestDialog.tsx` - Resource requests
- `ResourcesList.tsx` - Resources list
- `ReturnResourceDialog.tsx` - Return resources
- `Sidebar.tsx` - Sidebar navigation (not currently used in MainLayout)
- `SuggestionBox.tsx` - Suggestion box feature

---

## 🎨 Role-Based Styling

**Location:** `src/index.css` (lines 401-426)

### SUPER_USER Theme Classes:
```css
.super-user-theme {
  --super-user-primary: 220 90% 50%;
  --super-user-primary-foreground: 0 0% 100%;
  --super-user-accent: 220 80% 60%;
  --super-user-glow: 220 90% 60%;
}

.super-user-gradient {
  background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #60a5fa 100%);
}

.super-user-glow {
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.5),
              0 0 40px rgba(30, 58, 138, 0.3);
}

.super-user-border {
  border-color: rgba(59, 130, 246, 0.3);
}

.super-user-text {
  color: #60a5fa;
  text-shadow: 0 0 10px rgba(96, 165, 250, 0.5);
}
```

---

## 🧭 Navigation & Routing

### 1. **Main Layout Navigation**
**Location:** `src/components/layout/MainLayout.tsx`

**Key Features:**
- **Line 13:** Imports `isSuperUser` from roles
- **Line 47:** `superUserClubId` state for notifications
- **Lines 57-61:** Loads SUPER_USER club on mount
- **Lines 202-227:** `loadSuperUserClub()` function
- **Lines 429-436:** Navigation items with role filtering
  - SUPER_USER sees: Dashboard, Clubs, Events, Fees, Announcements, Members, Resources, Reports
- **Lines 467-476:** Role-based header styling (deep blue border for SUPER_USER)
- **Lines 630-632:** SUPER_USER notification panel
- **Lines 637-639:** SUPER_USER badge styling (blue theme)
- **Lines 703-715:** Mobile navigation with SUPER_USER gradient

### 2. **Route Configuration**
**Location:** `src/App.tsx`

**SUPER_USER Routes:**
- **Line 29:** `SuperUserMembers` import
- **Line 30:** `SuperUserResources` import
- **Line 31:** `SuperUserReports` import
- **Line 72:** `/members` route (SUPER_USER only)
- **Line 73:** `/resources` route (SUPER_USER only)
- **Line 74:** `/reports` route (SUPER_USER only)

### 3. **Page-Level Routing**
**Location:** `src/pages/Dashboard.tsx`
- **Lines 12, 40-42:** Routes SUPER_USER to `SuperUserDashboard`

**Location:** `src/pages/Events.tsx`
- **Lines 18, 40-42:** Routes SUPER_USER to `SuperUserEvents`

**Location:** `src/pages/Fees.tsx`
- **Lines 20, 41-43:** Routes SUPER_USER to `SuperUserFinance`

**Location:** `src/pages/Announcements.tsx`
- **Lines 17, 39-41:** Routes SUPER_USER to `SuperUserAnnouncements`

---

## 🔐 Protected Routes

**Location:** `src/components/ProtectedRoute.tsx`
- Uses role checking to protect routes
- SUPER_USER routes are protected with `requiredRole="SUPER_USER"`

---

## 📊 Role-Based Data Fetching Pattern

### Common Pattern in SUPER_USER Pages:

```typescript
// 1. Import utilities
import { loadAuthorizedClubsForUser, getUserPositionForClub } from '@/lib/superUserUtils';

// 2. Load authorized clubs
useEffect(() => {
  if (user?.id) {
    loadUserAuthorities();
  }
}, [user?.id]);

const loadUserAuthorities = async () => {
  const clubs = await loadAuthorizedClubsForUser(user.id);
  if (clubs.length > 0) {
    setSelectedClub(clubs[0]);
    const position = await getUserPositionForClub(user.id, clubs[0].id);
    setUserPosition(position);
  }
};

// 3. Load club-specific data
useEffect(() => {
  if (selectedClub?.id) {
    loadClubData(selectedClub.id);
  }
}, [selectedClub?.id]);
```

---

## 🎯 Key Role-Based UI Features

### 1. **Conditional Rendering**
- Components check `isSuperUser(user?.role)` before rendering
- Navigation items filtered by role in `mainNavigationItems` array

### 2. **Role-Based Styling**
- SUPER_USER uses deep blue theme (`super-user-gradient`, `super-user-glow`)
- Header border changes to blue for SUPER_USER
- Badge shows "Authority" with blue styling

### 3. **Role-Based Navigation**
- SUPER_USER sees different menu items than other roles
- Members, Resources, Reports are SUPER_USER-only routes
- Quick access cards in dashboard are role-specific

### 4. **Role-Based Data Access**
- SUPER_USER can only access data for their assigned club(s)
- Uses `loadAuthorizedClubsForUser()` to get club access
- All API calls filter by assigned club ID

---

## 📝 Summary

### SUPER_USER Code Locations:

1. **Role Checking:** `src/lib/roles.ts`
2. **Data Utilities:** `src/lib/superUserUtils.ts`
3. **Pages:** `src/pages/super-user/` (7 pages)
4. **Components:** `src/components/super-user/` (37 components)
5. **Navigation:** `src/components/layout/MainLayout.tsx`
6. **Routing:** `src/App.tsx`
7. **Styling:** `src/index.css` (super-user theme classes)
8. **Page Routing:** `src/pages/Dashboard.tsx`, `Events.tsx`, `Fees.tsx`, `Announcements.tsx`

### Role Hierarchy:
- **SUPER_ADMIN** - System admin (highest)
- **ADMIN** - Club admin
- **SUPER_USER** - Club authority (President, Secretary, etc.)
- **STUDENT** - Regular student (lowest)

---

## ✅ Current Implementation Status

- ✅ Role-based routing implemented
- ✅ SUPER_USER pages created
- ✅ SUPER_USER components created
- ✅ Role-based navigation in MainLayout
- ✅ Role-based styling (deep blue theme)
- ✅ Data fetching utilities for SUPER_USER
- ✅ Protected routes configured
- ⚠️ Some features may need data fetching fixes (per your markdown doc)

