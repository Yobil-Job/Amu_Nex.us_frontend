# Dashboard Issues List - TO FIX

## Issues Identified:

1. **Club Admins Count (Shows 0 instead of 1)**
   - Currently: Only checking `clubAdminId` from clubs table
   - Should: Check students with `role = 'ADMIN'` AND check clubs with non-null `clubAdminId`
   - Fix: Count unique club admins from both sources

2. **Student Growth Chart (Empty/Not Displaying)**
   - Issue: Chart is empty even though students exist
   - Problem: Only showing students registered in last 30 days, and cumulative calculation might be wrong
   - Fix: Show all students with proper cumulative calculation, handle missing dates better

3. **Quick Actions and Upcoming Events Cards (Always Showing)**
   - Issue: Both cards show even when there are no events/announcements
   - Fix: Only show cards when there's actual data or make them conditional

4. **Recent Activity Section Issues:**
   - Events always at top even when announcements are newer
   - UI is cropped - last activity row cut off
   - Fix: Proper sorting by actual timestamp, fix overflow/height issues

5. **Notification Section Issues:**
   - Card grows too long when many notifications
   - Makes other card beside it longer while cards inside stay fixed
   - Notification button generating fake/random notifications
   - Fix: Limit notification height with scroll, fix layout, remove fake notifications

6. **Events Overview Section (Empty)**
   - Issue: Chart not displaying even though events exist
   - Fix: Check event data structure and date parsing

7. **Top Active Clubs Section (Empty)**
   - Issue: Pie chart and bar chart not displaying anything
   - Fix: Check club/event data association and chart rendering

---

Now fixing all these issues...

