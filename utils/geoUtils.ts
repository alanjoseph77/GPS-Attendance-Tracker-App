
/**
 * Calculates the distance between two points in meters using the Haversine formula.
 */
export const getDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
};

/**
 * Basic fraud detection: checks if the location is mocked or if there's an impossible jump.
 */
export const isLocationValid = (
    currentLat: number,
    currentLon: number,
    lastLat: number | null,
    lastLon: number | null,
    isMocked: boolean,
    maxSpeedMs: number = 50
): boolean => {
    if (isMocked) return false;

    if (lastLat !== null && lastLon !== null) {
        const distance = getDistance(currentLat, currentLon, lastLat, lastLon);
        // If distance is too large in a short time, could be a jump (simplified here)
        // In a real app, we'd check distance / time_delta
        if (distance > 5000) { // 5km jump between updates is suspicious
            return false;
        }
    }

    return true;
};
