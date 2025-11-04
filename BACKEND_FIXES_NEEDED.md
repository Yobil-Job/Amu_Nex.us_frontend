# Backend Fixes Required

## Critical Issues Found in Backend Code

### 1. **ClubController.java - Authorization Configuration Errors**

#### Issue #1: `GET /clubs/{id}` - Incorrect Authorization (Line ~60)

**Current Code:**
```java
@GetMapping("/{id}")
@PreAuthorize("#id == authentication.principal or hasAnyRole('SUPER_ADMIN','ADMIN')")
public ResponseEntity<EntityModel<ResponseClubDto>> retriveClubById(@PathVariable int id)
```

**Problem:**
- `#id` is a **club ID** (integer), but `authentication.principal` is typically the **user ID**
- This condition will **never be true**, so students cannot access club details
- This is why you're getting `AuthorizationDeniedException` when students try to view club details

**Fix:**
```java
@GetMapping("/{id}")
@PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','STUDENT')")
public ResponseEntity<EntityModel<ResponseClubDto>> retriveClubById(@PathVariable int id)
```

**OR** if you want to restrict students to only viewing clubs they're members of:
```java
@GetMapping("/{id}")
@PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN') or @clubService.isMemberOfClub(authentication.principal, #id)")
public ResponseEntity<EntityModel<ResponseClubDto>> retriveClubById(@PathVariable int id)
```

---

#### Issue #2: `GET /clubs/all-clubs` - Invalid SpEL Expression (Line ~69)

**Current Code:**
```java
@GetMapping("all-clubs")
@PreAuthorize("#id == authentication.principal or hasAnyRole('SUPER_ADMIN','ADMIN')")
public ResponseEntity<CollectionModel<EntityModel<ResponseClubDto>>> retriveAllClubs()
```

**Problem:**
- This endpoint has **NO `id` parameter**
- The SpEL expression `#id` references a variable that doesn't exist
- This will cause authorization to **fail or behave unpredictably**

**Fix:**
```java
@GetMapping("all-clubs")
@PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','STUDENT')")
public ResponseEntity<CollectionModel<EntityModel<ResponseClubDto>>> retriveAllClubs()
```

**Note:** Students need access to discover clubs and join them, so STUDENT role is included.

---

### 2. **RefreshTokenService.java - Potential Race Condition**

**Current Implementation:**
The refresh token logic in `AuthController.java` looks correct, but there's a potential race condition:

**In `/refresh` endpoint:**
```java
// 1. Find token
RefreshToken refreshToken = refreshTokenService.findByToken(refreshTokenStr)
    .orElseThrow(() -> new resourceNotFoundException("Refresh token not found"));

// 2. Verify expiration (might delete if expired)
refreshTokenService.verifyExpiration(refreshToken);

// 3. Delete old tokens
refreshTokenService.deleteByStudentId(student.getId());

// 4. Create new token
RefreshToken newRefreshToken = refreshTokenService.createRefreshToken(student.getId());
```

**Potential Issues:**
1. **Race Condition:** If multiple refresh requests come concurrently, one might delete the token while another is trying to use it
2. **Token Not Found:** If the token is already deleted (by another concurrent refresh or expired token cleanup), you'll get "Refresh token not found"

**Recommended Fix (Optional - for better reliability):**

Add transaction handling or optimistic locking:

```java
@Transactional
public RefreshToken rotateRefreshToken(String oldToken, Long studentId) {
    RefreshToken refreshToken = findByToken(oldToken)
        .orElseThrow(() -> new resourceNotFoundException("Refresh token not found"));
    
    verifyExpiration(refreshToken);
    
    // Delete the specific token instead of all tokens for the student
    refreshTokenRepository.delete(refreshToken);
    
    // Create new token
    return createRefreshToken(studentId);
}
```

**However**, the current implementation should work fine for most cases. The "Refresh token not found" error is more likely due to:
- Frontend sending an invalid/expired token
- Token was already deleted by a previous refresh
- Database constraint issues (which you already fixed by adding `deleteByStudentId` before `createRefreshToken` in login)

---

## Summary of Required Changes

### **MUST FIX (Critical):**

1. **Fix `GET /clubs/{id}` authorization** in `ClubController.java` (Line ~60)
   - Change from: `@PreAuthorize("#id == authentication.principal or hasAnyRole('SUPER_ADMIN','ADMIN')")`
   - Change to: `@PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','STUDENT')")`

2. **Fix `GET /clubs/all-clubs` authorization** in `ClubController.java` (Line ~69)
   - Change from: `@PreAuthorize("#id == authentication.principal or hasAnyRole('SUPER_ADMIN','ADMIN')")`
   - Change to: `@PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','STUDENT')")`

### **OPTIONAL (Recommended):**

3. **Consider improving refresh token rotation** to prevent race conditions (optional, current implementation should work)

---

## Files to Modify

1. `src/main/java/com/club/api/club_managment_api/controllers/ClubController.java`
   - Fix `retriveClubById` method authorization (Line ~60)
   - Fix `retriveAllClubs` method authorization (Line ~69)

---

## Testing After Fixes

1. **Test Student Access:**
   - Login as a student
   - Try to view a club detail (should work after fix #1)
   - Try to access `/clubs/all-clubs` (should work - students can discover clubs)
   - Try to view club members (should be denied - correct behavior, only admins can view members)

2. **Test Refresh Token:**
   - Login as any user
   - Wait for access token to expire
   - Verify refresh token works correctly
   - Try multiple concurrent refresh requests (should not cause errors)

---

## Expected Results After Fixes

✅ Students can view club details via `GET /clubs/{id}`
✅ Students can access `/clubs/all-clubs` to discover and join clubs
✅ Students cannot view club members (correct behavior - only admins)
✅ No more `AuthorizationDeniedException` for valid student requests
✅ Refresh tokens work reliably without "not found" errors
