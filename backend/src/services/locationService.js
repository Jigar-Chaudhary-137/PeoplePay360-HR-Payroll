const { query } = require('../config/db');

/**
 * Calculates great-circle distance between two GPS coordinates using the Haversine formula.
 * @param {number} lat1 Latitude of point 1 in degrees
 * @param {number} lon1 Longitude of point 1 in degrees
 * @param {number} lat2 Latitude of point 2 in degrees
 * @param {number} lon2 Longitude of point 2 in degrees
 * @returns {number} Distance in meters
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's mean radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;

  const φ1 = toRad(Number(lat1));
  const φ2 = toRad(Number(lat2));
  const Δφ = toRad(Number(lat2) - Number(lat1));
  const Δλ = toRad(Number(lon2) - Number(lon1));

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c * 100) / 100; // in meters, 2 decimal places
}

/**
 * Verifies employee location against their assigned work location.
 * 
 * Rules:
 * 1. If employee has no assigned active work location:
 *    - verification is not required -> allow check-in, location_verified = false
 * 2. If employee has an assigned work location and location data (lat/lon) is provided:
 *    - calculate Haversine distance
 *    - if distance <= radius_meters -> allow check-in, location_verified = true
 *    - if distance > radius_meters -> reject check-in with clear error message
 * 3. If employee has an assigned work location but NO location coordinates were sent:
 *    - keep existing behavior working (or allow unverified check-in if not forced)
 * 
 * @param {number} employeeId 
 * @param {number|null} latitude 
 * @param {number|null} longitude 
 * @returns {Promise<{allowed: boolean, message?: string, distance?: number, location_verified: boolean, work_location_id?: number}>}
 */
async function verifyCheckInLocation(employeeId, latitude, longitude) {
  // Query employee and their assigned active work location
  const rows = await query(
    `SELECT e.id, e.work_location_id,
            wl.id AS location_id, wl.name AS location_name,
            wl.latitude, wl.longitude, wl.radius_meters, wl.status AS location_status
     FROM employees e
     LEFT JOIN work_locations wl ON e.work_location_id = wl.id AND wl.status = 'Active'
     WHERE e.id = ? LIMIT 1`,
    [employeeId]
  );

  if (!rows || rows.length === 0) {
    return { allowed: true, location_verified: false, work_location_id: null };
  }

  const emp = rows[0];

  // Case A: No active work location configured for this employee
  if (!emp.work_location_id || !emp.latitude || !emp.longitude) {
    return {
      allowed: true,
      location_verified: false,
      work_location_id: emp.work_location_id || null,
      message: 'No work location verification configured for this employee.'
    };
  }

  // Case B: Location coordinates are NOT provided in request
  if (latitude === undefined || latitude === null || longitude === undefined || longitude === null) {
    return {
      allowed: true,
      location_verified: false,
      work_location_id: emp.work_location_id,
      message: 'Check-in recorded without location coordinates.'
    };
  }

  // Case C: Coordinates provided -> calculate Haversine distance
  const userLat = Number(latitude);
  const userLon = Number(longitude);
  const targetLat = Number(emp.latitude);
  const targetLon = Number(emp.longitude);
  const allowedRadius = Number(emp.radius_meters);

  const distance = calculateHaversineDistance(userLat, userLon, targetLat, targetLon);

  if (distance <= allowedRadius) {
    return {
      allowed: true,
      location_verified: true,
      distance,
      radius_meters: allowedRadius,
      work_location_id: emp.work_location_id,
      location_name: emp.location_name,
      message: `Location verified successfully. Distance to ${emp.location_name}: ${distance}m (within ${allowedRadius}m radius).`
    };
  } else {
    return {
      allowed: false,
      location_verified: false,
      distance,
      radius_meters: allowedRadius,
      work_location_id: emp.work_location_id,
      location_name: emp.location_name,
      message: `Check-in rejected: You are ${Math.round(distance)} meters away from your assigned work location "${emp.location_name}". Maximum permitted radius is ${allowedRadius} meters.`
    };
  }
}

module.exports = {
  calculateHaversineDistance,
  verifyCheckInLocation
};
