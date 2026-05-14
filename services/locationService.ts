
import { Platform } from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import Constants, { ExecutionEnvironment } from 'expo-constants';
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
import { GEOFENCE_CONFIG } from '../constants/GeofenceConfig';
import { getDistance, isLocationValid } from '../utils/geoUtils';
import { StorageService } from './storageService';

export const LOCATION_TASK_NAME = 'background-attendance-task';

// Configure notifications only if not in Expo Go to avoid side-effect crashes
if (!isExpoGo) {
    try {
        const Notifications = require('expo-notifications');
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowAlert: true,
                shouldPlaySound: true,
                shouldSetBadge: false,
                shouldShowBanner: true,
                shouldShowList: true,
            }),
        });
    } catch (e) {
        console.error('Failed to initialize notifications:', e);
    }
}

export const sendNotification = async (title: string, body: string) => {
    if (isExpoGo) {
        console.log(`[NOTIF SIMULATED]: ${title} - ${body}`);
        return;
    }

    try {
        const Notifications = require('expo-notifications');
        await Notifications.scheduleNotificationAsync({
            content: { title, body },
            trigger: null,
        });
    } catch (e) {
        console.error('Notification error:', e);
    }
};

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: any) => {
    if (error) {
        console.error('Background location task error:', error);
        return;
    }

    if (data) {
        const { locations } = data;
        const location = locations[0];
        if (location) {
            await handleLocationUpdate(location);
        }
    }
});

export const handleLocationUpdate = async (location: Location.LocationObject) => {
    const { latitude, longitude, accuracy } = location.coords;
    const isMocked = location.mocked || false;

    // Filter out very low accuracy updates (e.g. > 120m error) to prevent false geofence triggers
    // We are more lenient (120m) because office radius is 100m and indoor GPS can be weak.
    if (accuracy && accuracy > 120) {
        console.log(`[GEO] Ignoring very low accuracy update: ${accuracy}m`);
        return;
    }

    // Sync current position for Admin to see
    const loggedUser = await StorageService.getLoggedUser();
    if (loggedUser) {
        await StorageService.updateUserLocation(loggedUser.id, latitude, longitude);
    }

    // 1. Basic Fraud Check
    if (isMocked) {
        console.warn('Mocked location detected!');
        return;
    }

    const office = GEOFENCE_CONFIG.OFFICE;
    const distance = getDistance(latitude, longitude, office.LATITUDE, office.LONGITUDE);
    const isInside = distance <= office.RADIUS;

    const currentSession = await StorageService.getCurrentSession();

    if (isInside && !currentSession && loggedUser) {
        // ENTERING GEOFENCE
        const newSession = {
            userId: loggedUser.id,
            id: Date.now().toString(),
            enter_time: new Date().toISOString(),
            lat: latitude,
            lng: longitude,
        };
        await StorageService.saveCurrentSession(newSession);
        await sendNotification("Welcome to Office!", "You have been automatically clocked in.");
        console.log('Entered Geofence');
    } else if (!isInside && currentSession) {
        // EXITING GEOFENCE
        const enterTime = new Date(currentSession.enter_time).getTime();
        const exitTime = new Date().getTime();
        const durationMs = exitTime - enterTime;

        // Fraud/Noise Check: Only record if stay was long enough
        if (durationMs >= GEOFENCE_CONFIG.THRESHOLDS.MIN_STAY_TIME_MS) {
            const closedSession = {
                ...currentSession,
                exit_time: new Date().toISOString(),
                duration_seconds: Math.floor(durationMs / 1000),
            };

            const sessions = await StorageService.getAllSessions();
            await StorageService.saveSessions([...sessions, closedSession]);
            await StorageService.saveCurrentSession(null);
            await sendNotification("Left Office", "You have been clocked out. See you tomorrow!");
            console.log('Exited Geofence and saved session');
        } else {
            console.log('Exited Geofence too quickly, ignoring session');
            await StorageService.saveCurrentSession(null);
        }
    }
};


export const startBackgroundLocation = async () => {
    // Background location via TaskManager is NOT supported in Expo Go on iOS.
    // We skip it to prevent the crash you are seeing.
    if (Platform.OS === 'ios' && isExpoGo) {
        console.warn('Skipping background location request: Not supported in Expo Go on iOS.');
        return;
    }

    const { status } = await Location.requestBackgroundPermissionsAsync();
    if (status === 'granted') {
        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: GEOFENCE_CONFIG.TRACKING.INTERVAL,
            distanceInterval: GEOFENCE_CONFIG.TRACKING.DISTANCE_FILTER,
            foregroundService: {
                notificationTitle: "Attendance Tracker",
                notificationBody: "Tracking your location for attendance",
            },
            pausesUpdatesAutomatically: false,
        });
    }
};

export const stopBackgroundLocation = async () => {
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    if (hasStarted) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    }
};
