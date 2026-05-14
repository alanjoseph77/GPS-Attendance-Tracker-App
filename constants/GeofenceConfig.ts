
export const GEOFENCE_CONFIG = {
  OFFICE: {
    LATITUDE: 13.0110549,
    LONGITUDE: 74.79495,
    RADIUS: 100, // meters
  },
  TRACKING: {
    INTERVAL: 30000, // 30 seconds
    FASTEST_INTERVAL: 15000,
    DISTANCE_FILTER: 5,
  },
  THRESHOLDS: {
    MIN_STAY_TIME_MS: 5 * 60 * 1000, // 5 minutes minimum stay
    MAX_SPEED_THRESHOLD: 50, // m/s (approx 180 km/h) to detect jumps
  },
  STORAGE_KEYS: {
    SESSIONS: '@attendance_sessions',
    CURRENT_SESSION: '@current_session',
    USER_TOKEN: '@user_token',
    LAST_LOCATION: '@last_location',
  }
};
