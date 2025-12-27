/**
 * Geospatial utility functions for KML boundary operations
 */

import type { KMLFeature } from "./kmlParser";

/**
 * Check if a point is inside a polygon using the Ray Casting algorithm
 * @param point - The point to check {lat, lng}
 * @param polygon - Array of coordinates forming the polygon boundary
 * @returns true if point is inside polygon, false otherwise
 */
export function isPointInPolygon(
    point: { lat: number; lng: number },
    polygon: Array<{ lat: number; lng: number }>
): boolean {
    if (polygon.length < 3) return false; // A polygon must have at least 3 points

    let inside = false;
    const x = point.lng;
    const y = point.lat;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].lng;
        const yi = polygon[i].lat;
        const xj = polygon[j].lng;
        const yj = polygon[j].lat;

        const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

        if (intersect) inside = !inside;
    }

    return inside;
}

/**
 * Find which KML boundary/area contains a given point
 * @param point - The point to check {lat, lng}
 * @param features - Array of KML features (boundaries)
 * @returns The KML feature containing the point, or null if not found
 */
export function findContainingBoundary(
    point: { lat: number; lng: number },
    features: KMLFeature[]
): KMLFeature | null {
    for (const feature of features) {
        if (isPointInPolygon(point, feature.coordinates)) {
            return feature;
        }
    }
    return null;
}

/**
 * Filter points that fall within a specific KML boundary
 * @param points - Array of points to filter
 * @param boundary - The KML boundary feature to check against
 * @returns Array of points that are inside the boundary
 */
export function filterPointsInBoundary<T extends { lat: number; lng: number }>(
    points: T[],
    boundary: KMLFeature
): T[] {
    return points.filter((point) => isPointInPolygon(point, boundary.coordinates));
}

/**
 * Find KML boundary by name (case-insensitive, supports partial matching)
 * @param name - Name or partial name of the boundary to find
 * @param features - Array of KML features to search
 * @returns Matching KML feature or null if not found
 */
export function findBoundaryByName(name: string, features: KMLFeature[]): KMLFeature | null {
    const searchTerm = name.toLowerCase().trim();

    // First try exact match
    let match = features.find((f) => f.name.toLowerCase() === searchTerm);
    if (match) return match;

    // Then try partial match
    match = features.find((f) => f.name.toLowerCase().includes(searchTerm) || searchTerm.includes(f.name.toLowerCase()));

    return match || null;
}

/**
 * Group points by their containing KML boundaries
 * @param points - Array of points to group
 * @param features - Array of KML features (boundaries)
 * @returns Map of boundary name to points in that boundary
 */
export function groupPointsByBoundary<T extends { lat: number; lng: number }>(
    points: T[],
    features: KMLFeature[]
): Map<string, { boundary: KMLFeature; points: T[] }> {
    const grouped = new Map<string, { boundary: KMLFeature; points: T[] }>();

    // Initialize map with all boundaries
    features.forEach((feature) => {
        grouped.set(feature.name, { boundary: feature, points: [] });
    });

    // Assign each point to its containing boundary
    points.forEach((point) => {
        const boundary = findContainingBoundary(point, features);
        if (boundary) {
            const entry = grouped.get(boundary.name);
            if (entry) {
                entry.points.push(point);
            }
        }
    });

    return grouped;
}

/**
 * Calculate the center point (centroid) of a polygon
 * @param polygon - Array of coordinates forming the polygon
 * @returns Center point {lat, lng}
 */
export function calculatePolygonCenter(polygon: Array<{ lat: number; lng: number }>): { lat: number; lng: number } {
    if (polygon.length === 0) return { lat: 0, lng: 0 };

    let latSum = 0;
    let lngSum = 0;

    polygon.forEach((point) => {
        latSum += point.lat;
        lngSum += point.lng;
    });

    return {
        lat: latSum / polygon.length,
        lng: lngSum / polygon.length,
    };
}

/**
 * Calculate distance between two points in meters (Haversine formula)
 * @param point1 - First point {lat, lng}
 * @param point2 - Second point {lat, lng}
 * @returns Distance in meters
 */
export function calculateDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
    const R = 6371000; // Earth's radius in meters
    const lat1 = (point1.lat * Math.PI) / 180;
    const lat2 = (point2.lat * Math.PI) / 180;
    const deltaLat = ((point2.lat - point1.lat) * Math.PI) / 180;
    const deltaLng = ((point2.lng - point1.lng) * Math.PI) / 180;

    const a =
        Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

/**
 * Find the nearest boundary to a given point
 * @param point - The point to check
 * @param features - Array of KML features
 * @returns The nearest boundary and distance in meters
 */
export function findNearestBoundary(
    point: { lat: number; lng: number },
    features: KMLFeature[]
): { boundary: KMLFeature; distance: number } | null {
    if (features.length === 0) return null;

    let nearest: { boundary: KMLFeature; distance: number } | null = null;

    features.forEach((feature) => {
        const center = calculatePolygonCenter(feature.coordinates);
        const distance = calculateDistance(point, center);

        if (!nearest || distance < nearest.distance) {
            nearest = { boundary: feature, distance };
        }
    });

    return nearest;
}

/**
 * Check if a point is near a polyline path (within threshold meters)
 * @param point - The point to check {lat, lng}
 * @param path - Array of points forming the polyline
 * @param thresholdMeters - Distance threshold in meters
 * @returns true if point is within threshold of any segment of the path
 */
export function isPointNearPath(
    point: { lat: number; lng: number },
    path: Array<{ lat: number; lng: number }>,
    thresholdMeters: number = 500
): boolean {
    if (path.length < 2) return false;

    // Helper: Distance from point P to line segment AB
    const distToSegment = (
        p: { lat: number; lng: number },
        a: { lat: number; lng: number },
        b: { lat: number; lng: number }
    ) => {
        const x = p.lng, y = p.lat;
        const x1 = a.lng, y1 = a.lat;
        const x2 = b.lng, y2 = b.lat;

        const A = x - x1;
        const B = y - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const len_sq = C * C + D * D;
        let param = -1;

        if (len_sq != 0) param = dot / len_sq;

        let xx, yy;

        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        const dx = x - xx;
        const dy = y - yy;

        // Approximate conversion to meters (roughly 111km per degree)
        return Math.sqrt(dx * dx + dy * dy) * 111320;
    };

    // Optimization: Check bounding box first
    let minLat = path[0].lat, maxLat = path[0].lat;
    let minLng = path[0].lng, maxLng = path[0].lng;

    path.forEach(p => {
        if (p.lat < minLat) minLat = p.lat;
        if (p.lat > maxLat) maxLat = p.lat;
        if (p.lng < minLng) minLng = p.lng;
        if (p.lng > maxLng) maxLng = p.lng;
    });

    // Roughly convert meters to degrees (0.001 deg ~ 111m)
    const buffer = thresholdMeters / 111000;

    if (point.lat < minLat - buffer || point.lat > maxLat + buffer ||
        point.lng < minLng - buffer || point.lng > maxLng + buffer) {
        return false;
    }

    // Check distance to each segment
    for (let i = 0; i < path.length - 1; i++) {
        const dist = distToSegment(point, path[i], path[i + 1]);
        if (dist <= thresholdMeters) return true;
    }

    return false;
}
