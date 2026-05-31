# Firestore Security Specification & Invariants

This document outlines the data invariants and the "Dirty Dozen" vulnerability test payloads designed to attack the Project Showcase Platform. It acts as our threat model to ensure no malicious client can spoof identity, bypass state transitions, or inject corrupted payloads.

## 1. Core Data Invariants

1. **Identity Integrity**: A user can only create or update a profile where the document ID matches their authenticated UID.
2. **Profile Immutability**: A user's `email` and `createdAt` are immutable after creation.
3. **Points Sandboxing**: A user cannot arbitrarily increase their `points` to a massive number. Profiles created must initialize with `points = 0`.
4. **Post Possession**: A post's `userId` must equal the authenticated creator's UID. Once created, `userId` and `createdAt` cannot be modified.
5. **Like Uniqueness**: A user can only like a post once. This is enforced by mapping the like document's ID to `${userId}_${postId}`, where `${userId}` must match the auth UID.
6. **Like/Comment Synchronization**: Changes to likes/comments counts on posts must occur atomically alongside the corresponding like/comment document creation/deletion.
7. **Comment Authenticity**: The `userId` of a comment must match the authenticated author's UID. Only the comment's author can delete their comment.
8. **Input Bounds**: All string inputs must have strict maximum size limits to prevent "Denial of Wallet" resource exhaustion attacks.

---

## 2. The "Dirty Dozen" Malicious Payloads

The following payloads represent illegal actions that must be rejected `PERMISSION_DENIED` by our Firestore rules.

### Test 1: Profile Hijacking (Identity Spoofing)
*   **Path**: `/profiles/attacker_uid`
*   **Payload**: `{ "username": "victim_user", "email": "victim@example.com", "points": 1000 }` (with auth UID = `victim_uid`)
*   **Target Rule**: `profiles/{userId}` write
*   **Reason for Denial**: Target path ID `attacker_uid` does NOT match the authenticated user's UID `victim_uid`.

### Test 2: Arbitrary Profile Points Inflation (Value Poisoning)
*   **Path**: `/profiles/victim_uid`
*   **Payload**: `{ "points": 999999 }` (update)
*   **Target Rule**: `profiles/{userId}` update points
*   **Reason for Denial**: Preventing user from inflating points directly outside of valid transactions/bounds, or preventing self-updates of high points.

### Test 3: Email Spoofing & Modification (Immutability Guard)
*   **Path**: `/profiles/victim_uid`
*   **Payload**: `{ "email": "new_email@spoofed.com" }` (update)
*   **Target Rule**: `profiles/{userId}` update
*   **Reason for Denial**: Email field is immutable.

### Test 4: Post Spoofing (Owner Impersonation)
*   **Path**: `/posts/some_post_id`
*   **Payload**: `{ "userId": "victim_uid", "username": "victim", "title": "Great Project", "description": "Desc", "likesCount": 0, "commentsCount": 0, "createdAt": "request.time" }` (with auth UID = `attacker_uid`)
*   **Target Rule**: `posts/{postId}` create
*   **Reason for Denial**: The `userId` property inside the payload must match the authenticated UID `attacker_uid`.

### Test 5: Post Score Tampering (Initial Likes Grafting)
*   **Path**: `/posts/new_post_id`
*   **Payload**: `{ "userId": "attacker_uid", "username": "attacker", "title": "Spoofed Post", "description": "Desc", "likesCount": 1000, "commentsCount": 50, "createdAt": "request.time" }`
*   **Target Rule**: `posts/{postId}` create
*   **Reason for Denial**: Initial `likesCount` and `commentsCount` must be exactly `0`.

### Test 6: Post Owner Reassignment (Ownership Theft)
*   **Path**: `/posts/existing_post_id`
*   **Payload**: `{ "userId": "victim_uid" }` (update by `attacker_uid`)
*   **Target Rule**: `posts/{postId}` update
*   **Reason for Denial**: `userId` is immutable after post creation.

### Test 7: Double Like Attack (Sybil Liking)
*   **Path**: `/likes/victim_postId_attacker_uid_alternate`
*   **Payload**: `{ "userId": "attacker_uid", "postId": "victim_postId", "createdAt": "request.time" }`
*   **Target Rule**: `likes/{likeId}` write
*   **Reason for Denial**: The single like document ID is strictly formatted as `${userId}_${postId}`. Creating a document with custom composite structures like generic IDs is prohibited.

### Test 8: Comment Owner Spoofing (Impostor Commenting)
*   **Path**: `/comments/comment_id`
*   **Payload**: `{ "userId": "victim_uid", "postId": "post_id", "username": "victim", "content": "Bad comment", "createdAt": "request.time" }` (with auth UID = `attacker_uid`)
*   **Target Rule**: `comments/{commentId}` create
*   **Reason for Denial**: Comment's `userId` must match auth UID.

### Test 9: Comment Content Abuse (Payload Size Poisoning)
*   **Path**: `/comments/comment_id`
*   **Payload**: `{ "userId": "attacker_uid", "postId": "post_id", "username": "attacker", "content": "<1MB massive string...>", "createdAt": "request.time" }`
*   **Target Rule**: `comments/{commentId}` create
*   **Reason for Denial**: `content` exceeds maximum size limit (e.g., 500 characters).

### Test 10: Sibling Count Deflation (Sync Failure)
*   **Path**: `/posts/post_id`
*   **Payload**: `{ "likesCount": -10 }` (update by any user)
*   **Target Rule**: `posts/{postId}` update likesCount
*   **Reason for Denial**: A single update to `likesCount` is only allowed as a unit increment (+1) or decrement (-1) from the existing value, or strictly guarded.

### Test 11: Like Ghost Creation (Orphaned Like)
*   **Path**: `/likes/attackerUid_randomPostId`
*   **Payload**: `{ "userId": "attacker_uid", "postId": "nonexistent_post_id", "createdAt": "request.time" }`
*   **Target Rule**: `likes/{likeId}` create
*   **Reason for Denial**: Cannot create a like for a non-existent post. Relational consistency requires calling `exists(/databases/$(database)/documents/posts/$(incoming().postId))`.

### Test 12: Anonymous Post Injection (Unverified Post)
*   **Path**: `/posts/some_post`
*   **Payload**: `{ "userId": "anon_uid", "title": "Anonymous post" }` (with anonymousauth or unverified email)
*   **Target Rule**: `posts/{postId}` create
*   **Reason for Denial**: Only authenticated, verified email logins are authorized to write to standard data tables.
