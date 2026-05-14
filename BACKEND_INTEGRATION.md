# GPS Attendance App — Backend Architecture

The app uses **Firebase Firestore** as its real-time cloud backend. No custom server is required.

---

## Firebase Setup

File: `services/firebaseConfig.ts`

```ts
const firebaseConfig = {
    apiKey: "...",
    authDomain: "attendancegps-ce4d4.firebaseapp.com",
    projectId: "attendancegps-ce4d4",
    storageBucket: "attendancegps-ce4d4.firebasestorage.app",
    messagingSenderId: "790854453367",
    appId: "..."
};
```

Exports:
- `db` — Firestore database instance
- `auth` — Firebase Auth with AsyncStorage persistence (stays logged in across app restarts)

---

## Firestore Collections

### `users`
Stores all staff and admin accounts.

| Field | Type | Description |
|---|---|---|
| `id` | string | Employee ID (e.g. `EMP001`) |
| `name` | string | Full name |
| `password` | string | Plain text (migrate to Firebase Auth for production) |
| `role` | `admin` \| `staff` | Controls dashboard view |
| `lastLocation.latitude` | number | Last known GPS latitude |
| `lastLocation.longitude` | number | Last known GPS longitude |
| `lastLocation.timestamp` | string | ISO timestamp of last GPS ping |

### `sessions`
Stores completed attendance sessions (clock-out recorded).

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique session ID (timestamp-based) |
| `userId` | string | Links to `users` collection |
| `enter_time` | string | ISO timestamp of geofence entry |
| `exit_time` | string | ISO timestamp of geofence exit |
| `duration_seconds` | number | Total time inside office |
| `lat` | number | Latitude at time of entry |
| `lng` | number | Longitude at time of entry |

### `active_sessions`
Stores the currently open session per user (still inside office).

- Keyed by `userId`
- Cleared and marked `active: false` on geofence exit
- Used to resume session state if the app restarts mid-shift

---

## Data Flow

```
GPS Update (every 30s or on movement)
        │
        ▼
AsyncStorage  ──────────────────────────────────┐
(instant, local, works offline)                 │
        │                                       │
        ▼                                       │
Firebase Firestore                              │
(cloud sync, best-effort)                       │
        │                                       │
   [on failure] ────────────────────────────────┘
        │                              falls back to local
        ▼
Admin real-time map (onSnapshot listener)
```

Every write tries Firestore first and silently falls back to AsyncStorage on failure. Reads do the same in reverse — Firestore first, local fallback.

---

## Real-time Admin Tracking

`subscribeToStaffLocation()` in `services/storageService.ts` opens a **live Firestore `onSnapshot` listener** on the `users` collection filtered by `role == staff`.

- Streams location updates to the Admin map without polling
- Unsubscribes automatically when the Admin screen unmounts

```ts
export const subscribeToStaffLocation = (callback: (users: User[]) => void) => {
    const q = query(collection(db, "users"), where("role", "==", "staff"));
    return onSnapshot(q, (snapshot) => {
        const users: User[] = [];
        snapshot.forEach((doc) => users.push(doc.data() as User));
        callback(users);
    });
};
```

---

## Offline-First Strategy

| Scenario | Behaviour |
|---|---|
| No internet on clock-in | Session saved to AsyncStorage immediately |
| Internet restored | Next write syncs to Firestore |
| App killed mid-shift | `active_sessions` in Firestore restores state on relaunch |
| Firestore read fails | Falls back to local AsyncStorage data |

---

## Production Hardening (Recommended Next Steps)

1. **Migrate passwords to Firebase Auth** — replace plain-text `password` field with `firebase/auth` email+password or phone OTP
2. **Add Firestore Security Rules** — currently open; restrict reads/writes by `userId` and `role`
3. **Session conflict resolution** — handle edge case where two devices log in as the same user
4. **Background sync queue** — queue failed Firestore writes and retry when connectivity returns
