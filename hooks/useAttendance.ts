import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { StorageService, AttendanceSession } from '../services/storageService';
import { GEOFENCE_CONFIG } from '../constants/GeofenceConfig';
import { getDistance } from '../utils/geoUtils';
import { handleLocationUpdate, startBackgroundLocation } from '../services/locationService';
import { useAuth } from '@/context/AuthContext';

export const useAttendance = () => {
    const { user } = useAuth();
    const [currentSession, setCurrentSession] = useState<AttendanceSession | null>(null);
    const [sessions, setSessions] = useState<AttendanceSession[]>([]);
    const [isInside, setIsInside] = useState(false);
    const [distanceToOffice, setDistanceToOffice] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const updateUIWithLocation = async (location: Location.LocationObject) => {
        const dist = getDistance(
            location.coords.latitude,
            location.coords.longitude,
            GEOFENCE_CONFIG.OFFICE.LATITUDE,
            GEOFENCE_CONFIG.OFFICE.LONGITUDE
        );
        setDistanceToOffice(dist);
        setIsInside(dist <= GEOFENCE_CONFIG.OFFICE.RADIUS);

        // Process location update logic (sessions, cloud sync, etc) immediately
        await handleLocationUpdate(location);

        // Refresh session state to reflect any new session created by handleLocationUpdate
        const storedSession = await StorageService.getCurrentSession();
        setCurrentSession(storedSession);
    };

    const refreshData = useCallback(async () => {
        if (!user) return;

        // 1. Load sessions immediately
        const storedSession = await StorageService.getCurrentSession();
        const allSessions = await StorageService.getSessionsByUser(user.id);
        setCurrentSession(storedSession);
        setSessions(allSessions);

        if (Platform.OS === 'web') {
            setLoading(false);
            return;
        }

        try {
            // First check existing status to avoid unnecessary prompts or crashes
            const { status: existingStatus } = await Location.getForegroundPermissionsAsync();

            let finalStatus = existingStatus;
            if (existingStatus !== 'granted') {
                const { status } = await Location.requestForegroundPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== 'granted') {
                setErrorMsg('Permission to access location was denied');
                setLoading(false);
                return;
            }

            // 2. Optimized Positioning:
            const lastKnown = await Location.getLastKnownPositionAsync();
            if (lastKnown) {
                updateUIWithLocation(lastKnown);
            }

            Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            }).then(location => {
                updateUIWithLocation(location);
            }).catch(e => console.log('Location fetch error:', e));

        } catch (e) {
            console.error("DEBUG - Location Permission Error:", e);
            setErrorMsg("Missing Location Keys in config - Check app.json");
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        refreshData();
        // Start background tracking on mount if permissions allow
        startBackgroundLocation().catch(console.error);

        // Set up a refresh interval for UI updates
        const interval = setInterval(refreshData, 30000);
        return () => clearInterval(interval);
    }, [refreshData]);

    const todayStr = new Date().toISOString().split('T')[0];

    const sessionsToday = sessions.filter(s => s.enter_time.startsWith(todayStr));

    const totalTimeToday = sessionsToday.reduce((total, s) => total + (s.duration_seconds || 0), 0);

    const activeDuration = currentSession
        ? Math.floor((Date.now() - new Date(currentSession.enter_time).getTime()) / 1000)
        : 0;

    // Find the earliest entry time today (either from finished sessions or current)
    const allEntryTimesToday = sessionsToday.map(s => new Date(s.enter_time).getTime());
    if (currentSession && currentSession.enter_time.startsWith(todayStr)) {
        allEntryTimesToday.push(new Date(currentSession.enter_time).getTime());
    }

    const firstEntryTime = allEntryTimesToday.length > 0
        ? new Date(Math.min(...allEntryTimesToday)).toISOString()
        : null;

    const breakCount = Math.max(0, sessionsToday.length - (currentSession ? 0 : 0)); // Simplified break logic

    return {
        currentSession,
        sessions,
        isInside,
        distanceToOffice,
        totalTimeToday: totalTimeToday + activeDuration,
        activeDuration,
        firstEntryTime,
        breakCount: sessionsToday.length,
        loading,
        errorMsg,
        refreshData,
    };
};
