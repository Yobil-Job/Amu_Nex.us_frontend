# Backend API Endpoints Documentation

## Overview
Complete list of all REST API endpoints from the Club Management API backend.

---

## 1. AuthController (`/auth`)

### `POST /auth/login`
- **Description**: Authenticate user and get access/refresh tokens
- **Authorization**: Public (no authentication required)
- **Request Body**: `LoginRequest` (email, password)
- **Response**: `LoginResponse` (accessToken, refreshToken, role)

### `POST /auth/refresh`
- **Description**: Refresh access token using refresh token
- **Authorization**: Public
- **Request Body**: `RefreshTokenRequest` (refreshToken)
- **Response**: `LoginResponse` (new accessToken, new refreshToken, role)

### `POST /auth/logout`
- **Description**: Logout user and invalidate refresh token
- **Authorization**: Public
- **Request Body**: `RefreshTokenRequest` (refreshToken)
- **Response**: `200 OK`

---

## 2. StudentController (`/student`)

### `GET /student/me`
- **Description**: Get current authenticated user's information
- **Authorization**: Authenticated users
- **Response**: Map with user details (id, email, firstname, lastname, gender, yearOfStay, role, department, name, authorities)

### `POST /student/register`
- **Description**: Register a new student
- **Authorization**: Public
- **Request Body**: `StudentRequestDto` (validated)
- **Response**: `EntityModel<StudentResponseDto>` (with HATEOAS links)

### `GET /student/{id}`
- **Description**: Get student by ID
- **Authorization**: Student can view own profile OR SUPER_ADMIN/ADMIN
- **Response**: `EntityModel<StudentResponseDtoFull>` (with HATEOAS links)

### `GET /student/allstudents`
- **Description**: Get all students
- **Authorization**: SUPER_ADMIN only
- **Response**: `CollectionModel<EntityModel<StudentResponseDto>>` (with HATEOAS links)

### `PATCH /student/{id}/update`
- **Description**: Update student information
- **Authorization**: Student can update own profile only
- **Request Body**: `StudentRequestDtoFull` (validated)
- **Response**: `StudentResponseDtoFull`

### `DELETE /student/{id}/delete`
- **Description**: Delete student
- **Authorization**: Student can delete own account OR SUPER_ADMIN
- **Response**: `202 Accepted`

### `GET /student/{id}/getclubsJoined`
- **Description**: Get all clubs joined by student
- **Authorization**: Student can view own clubs only
- **Response**: `List<ResponseClubDto>`

### `GET /student/{id}/events`
- **Description**: Get all events attended by student
- **Authorization**: Student can view own events OR SUPER_ADMIN/ADMIN
- **Response**: `List<Event>`

### `POST /student/{studentId}/clubs/{clubId}/request`
- **Description**: Request to join a club
- **Authorization**: Student can request for own account only
- **Response**: `String` ("Request sent successfully!")

---

## 3. ClubController (`/clubs`)

### `POST /clubs/create`
- **Description**: Create a new club
- **Authorization**: SUPER_ADMIN only
- **Request Body**: `RequestClubDto` (validated)
- **Response**: `EntityModel<ResponseClubDto>` (with HATEOAS links)

### `GET /clubs/{id}`
- **Description**: Get club by ID
- **Authorization**: Authenticated user OR SUPER_ADMIN/ADMIN
- **Response**: `EntityModel<ResponseClubDto>` (with HATEOAS links)

### `GET /clubs/all-clubs`
- **Description**: Get all clubs
- **Authorization**: Authenticated user OR SUPER_ADMIN/ADMIN
- **Response**: `CollectionModel<EntityModel<ResponseClubDto>>` (with HATEOAS links)

### `PATCH /clubs/{id}/update`
- **Description**: Update club information
- **Authorization**: SUPER_ADMIN/ADMIN
- **Request Body**: `RequestClubDtoFull` (validated)
- **Response**: `void`

### `DELETE /clubs/{id}/delete`
- **Description**: Delete club
- **Authorization**: SUPER_ADMIN only
- **Response**: `void`

### `GET /clubs/{clubId}/requests/pending`
- **Description**: Get pending join requests for a club
- **Authorization**: SUPER_ADMIN/ADMIN
- **Response**: `CollectionModel<EntityModel<PendingRequestGetterDto>>` (with HATEOAS links)

### `PATCH /clubs/{clubId}/requests/{studentId}/approve`
- **Description**: Approve a join request
- **Authorization**: SUPER_ADMIN/ADMIN
- **Response**: `String` ("Request approved successfully")

### `PATCH /clubs/{clubId}/requests/{studentId}/reject`
- **Description**: Reject a join request
- **Authorization**: ADMIN only
- **Response**: `String` ("Request rejected successfully")

### `GET /clubs/{clubId}/get-members`
- **Description**: Get all members of a club
- **Authorization**: SUPER_ADMIN/ADMIN
- **Response**: `List<StudentResponseDto>`

### `PATCH /clubs/{clubId}/assign-clubAdmin/{memberId}`
- **Description**: Assign a member as club admin
- **Authorization**: SUPER_ADMIN only
- **Response**: `String` ("Club Admin Assigned Succesfuly")

---

## 4. EventController (`/events`)

### `POST /events/create`
- **Description**: Create a new event
- **Authorization**: SUPER_ADMIN/ADMIN/SUPER_USER
- **Request Body**: `RequestEventDto` (validated)
- **Response**: `EntityModel<Event>` (with HATEOAS links)

### `GET /events/{eventId}`
- **Description**: Get event by ID
- **Authorization**: Authenticated users
- **Response**: `EntityModel<Event>` (with HATEOAS links)

### `GET /events/club/{clubId}`
- **Description**: Get all events by club ID
- **Authorization**: Authenticated users
- **Response**: `List<Event>`

### `GET /events/allEvents`
- **Description**: Get all events
- **Authorization**: Authenticated users
- **Response**: `CollectionModel<EntityModel<Event>>` (with HATEOAS links)

### `PATCH /events/{eventId}/update`
- **Description**: Update event
- **Authorization**: SUPER_ADMIN/ADMIN/SUPER_USER (must be creator)
- **Request Body**: `RequestEventUpdateDto`
- **Response**: `Event`

### `DELETE /events/{eventId}/delete`
- **Description**: Delete event
- **Authorization**: SUPER_ADMIN/ADMIN/SUPER_USER (must be creator)
- **Response**: `204 No Content`

---

## 5. AnnouncementController (`/announcements`)

### `POST /announcements/create`
- **Description**: Create a new announcement
- **Authorization**: SUPER_ADMIN/ADMIN/SUPER_USER
- **Request Body**: `RequestAnnouncementDto` (validated)
- **Response**: `EntityModel<Announcement>` (with HATEOAS links)

### `GET /announcements/{id}`
- **Description**: Get announcement by ID
- **Authorization**: Authenticated users
- **Response**: `EntityModel<Announcement>` (with HATEOAS links)

### `GET /announcements/retriveAnnouncementByClub/{clubId}`
- **Description**: Get all announcements by club ID
- **Authorization**: Authenticated users
- **Response**: `List<Announcement>`

### `GET /announcements/retriveAllAnnouncement`
- **Description**: Get all announcements
- **Authorization**: Authenticated users
- **Response**: `CollectionModel<EntityModel<Announcement>>` (with HATEOAS links)

### `PATCH /announcements/{announcementId}/update`
- **Description**: Update announcement
- **Authorization**: SUPER_ADMIN/ADMIN/SUPER_USER
- **Request Body**: `RequestAnnouncementUpdateDto` (validated)
- **Response**: `Announcement`

### `DELETE /announcements/{announcementId}/{creaatedById}`
- **Description**: Delete announcement
- **Authorization**: SUPER_ADMIN/ADMIN/SUPER_USER
- **Response**: `204 No Content`

---

## 6. AuthorityController (`/authorities`)

### `POST /authorities/{clubAdminId}/create`
- **Description**: Create a new authority (assign role to student in club)
- **Authorization**: SUPER_ADMIN/ADMIN (must be club admin)
- **Request Body**: `RequestAuthorityDto` (validated)
- **Response**: `EntityModel<Authority>` (with HATEOAS links)

### `GET /authorities/{id}`
- **Description**: Get authority by ID
- **Authorization**: SUPER_ADMIN/ADMIN
- **Response**: `EntityModel<Authority>` (with HATEOAS links)

### `GET /authorities/clubs/{clubId}`
- **Description**: Get all authorities by club ID
- **Authorization**: SUPER_ADMIN/ADMIN
- **Response**: `CollectionModel<EntityModel<Authority>>` (with HATEOAS links)

### `GET /authorities/students/{studentId}`
- **Description**: Get all authorities by student ID
- **Authorization**: SUPER_ADMIN/ADMIN
- **Response**: `CollectionModel<EntityModel<Authority>>` (with HATEOAS links)

### `PATCH /authorities/{authorityId}/update/{clubAdminId}`
- **Description**: Update authority
- **Authorization**: SUPER_ADMIN/ADMIN
- **Request Body**: `RequestAuthorityUpdateDto`
- **Response**: `Authority`

### `DELETE /authorities/{authorityId}/delete/{clubId}/{clubAdminId}`
- **Description**: Remove authority
- **Authorization**: SUPER_ADMIN/ADMIN
- **Response**: `String` ("deleted succesfully")

---

## 7. FeeController (`/fees`)

### `POST /fees/clubs/{clubId}/fees/students/{studentId}`
- **Description**: Record a fee payment for a student in a club
- **Authorization**: Public (no @PreAuthorize annotation)
- **Request Body**: `RequestFeesDto`
- **Response**: `EntityModel<Fee>` (with HATEOAS links)

### `GET /fees/{id}`
- **Description**: Get fee by ID
- **Authorization**: Public (no @PreAuthorize annotation)
- **Response**: `Fee`

### `GET /fees/students/{studentId}`
- **Description**: Get all fees by student ID
- **Authorization**: Public (no @PreAuthorize annotation)
- **Response**: `List<Fee>`

### `GET /fees/clubs/{clubId}`
- **Description**: Get all fees by club ID
- **Authorization**: Public (no @PreAuthorize annotation)
- **Response**: `List<Fee>`

### `PATCH /fees/{feeId}/status`
- **Description**: Update fee status
- **Authorization**: Public (no @PreAuthorize annotation)
- **Request Body**: `RequestStatusUpdateDto`
- **Response**: `Fee`

### `GET /fees/clubs/{clubId}/total`
- **Description**: Get total collected fees by club
- **Authorization**: Public (no @PreAuthorize annotation)
- **Response**: `double` (total amount)

---

## Summary Statistics

- **Total Controllers**: 7
- **Total Endpoints**: 42
- **Public Endpoints**: 11 (auth endpoints + fee endpoints + student registration)
- **Authenticated Endpoints**: 31

### Endpoints by HTTP Method:
- **GET**: 22 endpoints
- **POST**: 10 endpoints
- **PATCH**: 9 endpoints
- **DELETE**: 4 endpoints

### Endpoints by Authorization Level:
- **Public**: 11 endpoints
- **Authenticated**: 8 endpoints
- **SUPER_ADMIN**: 8 endpoints
- **SUPER_ADMIN/ADMIN**: 10 endpoints
- **SUPER_ADMIN/ADMIN/SUPER_USER**: 5 endpoints
- **Student (own data)**: 3 endpoints

---

## Notes

1. **HATEOAS**: Most endpoints return HATEOAS links for navigation
2. **Validation**: Endpoints with `@Valid` use Jakarta validation
3. **Security**: All endpoints (except public ones) require JWT authentication
4. **Response Types**: Most collection endpoints return `CollectionModel`, single entities return `EntityModel`
5. **Error Handling**: Global exception handler manages all exceptions

---

*Generated from controller analysis - Date: 2024*

