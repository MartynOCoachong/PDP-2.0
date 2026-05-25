# Security Specification & Threat Model (ABAC Invariants)

This document describes the validation rules, data invariants, and defensive patterns to prevent unauthorized modifications to the athletic governing structures.

## 1. Core Data Invariants

1. **Hierarchy Integrity**: No Club can bypass its Association; no Team can escape its parent Club; no Coach/Athlete can register under invalid team or organization paths.
2. **Identity Lock**: Standard registered users of specific roles (Association, Club, Team, Coach, Player) can only modify logs or entities associated with their direct UID, or with matching parent bindings.
3. **No self-granted roles / self-approvals**: System admins map the master keys; standard logins cannot self-approve or escalate roles.
4. **Validation Blueprints**: Every creation and modification checks critical properties (e.g., size boundaries, exact keys, and valid types) to prevent Shadow Updates and Wallet Exhaustion.

---

## 2. The Dirty Dozen (Threat Vectors)

The following malicious scenarios must result in strict `PERMISSION_DENIED`:

1. **Identity Spoofing**: An authenticated User `user-A` tries to write a UserProfile for `user-B`.
2. **Self-Escalation**: A newly signed-up player creates a `UserProfile` set directly to `role: "admin"` or `approved: true`.
3. **Orphaned Club Creation**: Creating a `Club` with a non-existent `associationId` reference.
4. **Anchorless Team Creation**: Creating a `Team` that links to a non-existent `clubId` reference.
5. **Coach Infiltration**: Reassigning an active `Coach` account to a different team or association that they do not belong to.
6. **Shadow Field Injection**: Inserting arbitrary fields (e.g., `isSuperUser: true`) during a standard Club update (Vulnerability to Shadow Updates).
7. **Denial of Wallet ID Poisoning**: Trying to create a document with an ID exceeding 128 characters or containing invalid wildcard characters.
8. **Invalid Metrics Type Injection**: A Player uploads a `dailyMetrics` report with negative numbers or non-numeric types for hydration logs.
9. **Coursework Completion Forgery**: A Player logs a `ModuleCompletion` for an educational course that they did not pass or complete.
10. **Terminal State Shuffling**: A Team changes an assignment's status or details after the due date has locked.
11. **Spoofed Activity Logging**: Logging a `RunLog` in another Player's path containing extremely large tracking coordinates (Denial of Wallet).
12. **PII Data Scraping**: A non-admin, non-parent user trying to list all emails and personal contacts from the global `users` collection without proper relational bounds.

---

## 3. Test Runner Design Specification

The test cases in our test suite verify that any of the above "Dirty Dozen" payloads result in a standard Firestore `PERMISSION_DENIED` error, maintaining secure client-side constraints.
