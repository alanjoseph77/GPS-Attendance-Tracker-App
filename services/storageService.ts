
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GEOFENCE_CONFIG } from '../constants/GeofenceConfig';
import { db } from './firebaseConfig';
import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    query,
    where,
    onSnapshot,
    updateDoc
} from "firebase/firestore";

export interface User {
    id: string;
    name: string;
    password?: string;
    role: 'admin' | 'staff';
    lastLocation?: {
        latitude: number;
        longitude: number;
        timestamp: string;
    };
}

export interface AttendanceSession {
    userId: string;
    id: string;
    enter_time: string;
    exit_time?: string;
    duration_seconds?: number;
    lat: number;
    lng: number;
}

const DEFAULT_ADMIN: User = {
    id: 'admin',
    name: 'Administrator',
    password: 'admin',
    role: 'admin'
};

export const StorageService = {
    // --- User Management ---
    async getUsers(): Promise<User[]> {
        try {
            // Try fetching from Firebase first
            const querySnapshot = await getDocs(collection(db, "users"));
            const users: User[] = [];
            querySnapshot.forEach((doc) => users.push(doc.data() as User));

            if (users.length === 0) {
                // Fallback to local + add admin user if empty
                const localData = await AsyncStorage.getItem('@users');
                let localUsers: User[] = localData ? JSON.parse(localData) : [DEFAULT_ADMIN];
                return localUsers;
            }

            // Always ensure admin is in the list for login
            if (!users.find(u => u.id === DEFAULT_ADMIN.id)) {
                users.push(DEFAULT_ADMIN);
            }
            return users;
        } catch {
            const data = await AsyncStorage.getItem('@users');
            return data ? JSON.parse(data) : [DEFAULT_ADMIN];
        }
    },

    async addUser(user: User): Promise<void> {
        try {
            // Save to Firebase
            await setDoc(doc(db, "users", user.id), user);
        } catch (e) {
            // Fallback to Local
            const users = await this.getUsers();
            await AsyncStorage.setItem('@users', JSON.stringify([...users, user]));
        }
    },

    async updateUserLocation(userId: string, latitude: number, longitude: number): Promise<void> {
        const timestamp = new Date().toISOString();
        try {
            // Real-time Update to Firebase
            await updateDoc(doc(db, "users", userId), {
                lastLocation: { latitude, longitude, timestamp }
            });
        } catch (e) {
            // Local fallback
        }
    },

    // --- Session Management ---
    async saveSessions(sessions: AttendanceSession[]): Promise<void> {
        await AsyncStorage.setItem(GEOFENCE_CONFIG.STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
        // Also backup to Firebase
        try {
            for (const session of sessions) {
                await setDoc(doc(db, "sessions", session.id), session);
            }
        } catch { }
    },

    async getAllSessions(): Promise<AttendanceSession[]> {
        try {
            const querySnapshot = await getDocs(collection(db, "sessions"));
            const sessions: AttendanceSession[] = [];
            querySnapshot.forEach((doc) => sessions.push(doc.data() as AttendanceSession));
            return sessions;
        } catch {
            const data = await AsyncStorage.getItem(GEOFENCE_CONFIG.STORAGE_KEYS.SESSIONS);
            return data ? JSON.parse(data) : [];
        }
    },

    async getSessionsByUser(userId: string): Promise<AttendanceSession[]> {
        try {
            const q = query(collection(db, "sessions"), where("userId", "==", userId));
            const querySnapshot = await getDocs(q);
            const sessions: AttendanceSession[] = [];
            querySnapshot.forEach((doc) => sessions.push(doc.data() as AttendanceSession));
            return sessions;
        } catch {
            const all = await this.getAllSessions();
            return all.filter(s => s.userId === userId);
        }
    },

    async saveCurrentSession(session: AttendanceSession | null): Promise<void> {
        if (session) {
            await AsyncStorage.setItem(GEOFENCE_CONFIG.STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(session));
            // Optionally sync active session to Firebase
            try { await setDoc(doc(db, "active_sessions", session.userId), session); } catch { }
        } else {
            const data = await AsyncStorage.getItem(GEOFENCE_CONFIG.STORAGE_KEYS.CURRENT_SESSION);
            if (data) {
                const s = JSON.parse(data) as AttendanceSession;
                try { await setDoc(doc(db, "active_sessions", s.userId), { ...s, active: false }); } catch { }
            }
            await AsyncStorage.removeItem(GEOFENCE_CONFIG.STORAGE_KEYS.CURRENT_SESSION);
        }
    },

    async getCurrentSession(): Promise<AttendanceSession | null> {
        const data = await AsyncStorage.getItem(GEOFENCE_CONFIG.STORAGE_KEYS.CURRENT_SESSION);
        return data ? JSON.parse(data) : null;
    },

    // --- Auth State ---
    async setLoggedUser(user: User | null): Promise<void> {
        if (user) {
            await AsyncStorage.setItem('@logged_user', JSON.stringify(user));
        } else {
            await AsyncStorage.removeItem('@logged_user');
        }
    },

    async getLoggedUser(): Promise<User | null> {
        const data = await AsyncStorage.getItem('@logged_user');
        return data ? JSON.parse(data) : null;
    },

    async clearAll(): Promise<void> {
        await AsyncStorage.clear();
    }
};

// --- Real-time staff tracking for Admin ---
export const subscribeToStaffLocation = (callback: (users: User[]) => void) => {
    const q = query(collection(db, "users"), where("role", "==", "staff"));
    return onSnapshot(q, (snapshot) => {
        const users: User[] = [];
        snapshot.forEach((doc) => users.push(doc.data() as User));
        callback(users);
    });
};
