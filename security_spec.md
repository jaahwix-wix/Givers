# Security Specification: School Management Authentication & Privileges

## 1. Data Invariants
- **Auth Identity Match**: A user can only write to their own profile document (`/users/{userId}`) where `userId == request.auth.uid`.
- **Privilege Escalation Prevention**: Non-admin users cannot grant themselves or others the `admin` role or modify privileged collections.
- **Admin Supremacy**: Users in `/admins/{userId}` or with the bootstrapped admin email (`nabieumelissajosephine@gmail.com`) have administrative privileges.
- **Verified Users**: Critical write operations mandate authenticated requests.
- **Default Deny**: All unspecified paths are closed by default (`match /{document=**} { allow read, write: if false; }`).

## 2. Dirty Dozen Security Payloads
1. **Unauthenticated Profile Write**: Anonymous or null auth attempting to write to `/users/{userId}` -> *DENIED*.
2. **Impersonation Attack**: User A (uid: "user_a") writing to `/users/user_b` -> *DENIED*.
3. **Self-Promoted Admin Attack**: Standard teacher attempting to write to `/admins/{userId}` -> *DENIED*.
4. **Ghost Field Injection**: Adding unknown keys `isSuperRoot: true` to a user profile update -> *DENIED*.
5. **ID Poisoning Attack**: Attempting to write with oversized doc ID (10,000 bytes) -> *DENIED*.
6. **Denial of Wallet Attack**: Inserting a 2MB string in the displayName field -> *DENIED*.
7. **Email Spoofing Attack**: Request with forged unverified email claim -> *DENIED*.
8. **Catch-All Probe**: Direct access attempt to arbitrary internal paths -> *DENIED*.
9. **Role Injection via Client**: Client overwriting role from `student_parent` to `admin` without authorization -> *DENIED*.
10. **Orphaned User Creation**: User creating profile with mismatched internal ID and document ID -> *DENIED*.
11. **Malicious Admin Deletion**: Non-admin attempting to delete from `/admins/` -> *DENIED*.
12. **Cross-Tenant Write**: Attempt to mutate records outside the application's assigned database -> *DENIED*.
