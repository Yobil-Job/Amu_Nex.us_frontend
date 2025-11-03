# Backend Fix Required: Refresh Token Constraint Violation

## 🔴 Problem

Users cannot login when they have an existing refresh token in the database. The error occurs because:

1. **Database Constraint:** The `refresh_tokens` table has a unique constraint on `student_id` (each student can only have ONE refresh token at a time)
2. **Backend Behavior:** The login endpoint tries to **INSERT** a new refresh token without first **DELETING** the old one
3. **Result:** Database constraint violation error (`23505 - Unique index violation`)

## 📋 Error Details

```
Unique index or primary key violation: "PUBLIC.UKCKMMP76WPKOE5BQK1A3PKA1HL_INDEX_C 
ON PUBLIC.REFRESH_TOKENS(STUDENT_ID NULLS FIRST) VALUES ( /* 7 */ CAST(6 AS BIGINT) )"
```

## 🔧 Required Backend Fix

### Option 1: Delete Old Token Before Creating New One (Recommended)

In your login endpoint/service method, before creating a new refresh token:

```java
// In AuthService or wherever you handle login
public LoginResponse login(String email, String password) {
    // ... existing authentication logic ...
    
    Student student = studentRepository.findByEmail(email)
        .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    
    // ✅ FIX: Delete old refresh token before creating new one
    refreshTokenRepository.deleteByStudentId(student.getId());
    
    // Now create new refresh token (this will work)
    RefreshToken refreshToken = new RefreshToken();
    refreshToken.setStudent(student);
    refreshToken.setToken(UUID.randomUUID().toString());
    refreshToken.setExpiryDate(LocalDateTime.now().plusDays(7));
    refreshTokenRepository.save(refreshToken);
    
    // ... rest of login logic ...
}
```

### Option 2: Use UPSERT (Update or Insert)

If your database supports it, use an UPSERT operation:

```java
// Alternative: Use Spring Data JPA save() with merge
// This will UPDATE if exists, INSERT if not
refreshTokenRepository.save(refreshToken);
```

But this requires the refresh token entity to have the student_id as part of its primary key or unique key.

### Option 3: Check and Delete in Repository Method

Add a repository method:

```java
@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    void deleteByStudentId(Long studentId);
}
```

## 🔍 Where to Make Changes

Look for your authentication/login service/controller:

1. **Controller:** `AuthController.java` - endpoint `/auth/login`
2. **Service:** `AuthService.java` or similar - method that handles login
3. **Repository:** `RefreshTokenRepository.java` - add `deleteByStudentId` method

## 🧪 Testing

After implementing the fix:

1. Ensure a user has an old refresh token in the database
2. Try to login with that user's credentials
3. Login should succeed without constraint violation error
4. Old refresh token should be deleted, new one created

## ⚠️ Temporary Workaround (Database Admin)

If you need users to login immediately before the backend fix:

```sql
-- Delete all old refresh tokens (CAUTION: This logs out all users)
DELETE FROM refresh_tokens;

-- OR delete for specific user:
DELETE FROM refresh_tokens WHERE student_id = 6;
```

## 📝 Notes

- The frontend cannot fix this issue - it's a backend database constraint problem
- The frontend now shows a helpful error message when this occurs
- All users experiencing this issue need the backend fix
- Consider also implementing token cleanup for expired tokens
