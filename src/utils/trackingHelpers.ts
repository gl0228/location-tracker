import { LatLng } from 'react-native-maps';

// Calculate distance between two lat/lng points (in meters)
export function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate the total distance for a list of coordinates (in meters)
export function calculateDistance(coords: LatLng[]): number {
  let total = 0;
  for (let i = 1; i < coords.length; i++) {
    const prev = coords[i - 1];
    const curr = coords[i];
    total += haversine(prev.latitude, prev.longitude, curr.latitude, curr.longitude);
  }
  return total;
}

// Formats seconds as m:ss string
export function formatTime(sec: number): string {
  const m = Math.floor(sec / 60).toString();
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// Centers and zooms the map so the whole route shows up on workout complete
export function getBoundingRegion(coords: LatLng[]) {
  if (!coords || coords.length === 0) {
    return {
      latitude: 51.5074,
      longitude: -0.1278,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }
  let minLat = coords[0].latitude;
  let maxLat = coords[0].latitude;
  let minLng = coords[0].longitude;
  let maxLng = coords[0].longitude;

  coords.forEach(coord => {
    minLat = Math.min(minLat, coord.latitude);
    maxLat = Math.max(maxLat, coord.latitude);
    minLng = Math.min(minLng, coord.longitude);
    maxLng = Math.max(maxLng, coord.longitude);
  });

  const latitudeDelta = Math.max(0.01, maxLat - minLat + 0.01);
  const longitudeDelta = Math.max(0.01, maxLng - minLng + 0.01);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta,
    longitudeDelta,
  };
}

// Get pace of the user (time taken to run 1 km)
export function getPace(timeSec: number, distKm: number) {
  if (distKm === 0) return '0:00';
  const paceSec = timeSec / distKm;
  const min = Math.floor(paceSec / 60);
  const sec = Math.round(paceSec % 60);
  return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

// Figure out split times for each 1km to show pacing breakdown
export function getSplitTimes(coords, startTime, endTime, splitLength = 1000) {
  if (!coords || coords.length < 2) return [];

  const splitTimes = [];
  const totalDurationMs = new Date(endTime) - new Date(startTime);
  const totalDistance = calculateDistance(coords);

  let lastSplitTime = new Date(startTime).getTime();
  let lastSplitDist = 0;

  // This array keeps track of how far the user is at each GPS point
  let cumulativeDistances = [0];
  for (let i = 1; i < coords.length; i++) {
    const prev = coords[i - 1];
    const curr = coords[i];
    const segDist = haversine(prev.latitude, prev.longitude, curr.latitude, curr.longitude);
    cumulativeDistances[i] = cumulativeDistances[i - 1] + segDist;
  }

  for (let i = 1; i < coords.length; i++) {
    // Keep creating splits until hitting the end
    while (
      cumulativeDistances[i] - lastSplitDist >= splitLength ||
      (i === coords.length - 1 && cumulativeDistances[i] > lastSplitDist)
    ) {
      let thisSplitDistance = Math.min(splitLength, cumulativeDistances[i] - lastSplitDist);

      // Interpolate the timestamp for the split
      let prevDist = cumulativeDistances[i - 1];
      let currDist = cumulativeDistances[i];
      let prevTime = lastSplitTime;
      let currTime = lastSplitTime + ((currDist - lastSplitDist) / (totalDistance - lastSplitDist)) * (totalDurationMs - (lastSplitTime - new Date(startTime).getTime()));
      let splitTimestamp;
      let fraction;

      if (thisSplitDistance === splitLength) {
        // Guess where the split should fall between two points
        fraction = (splitLength - (prevDist - lastSplitDist)) / (currDist - prevDist);
        splitTimestamp = prevTime + fraction * (currTime - prevTime);
      } else {
        // Use end time for last split
        splitTimestamp = currTime;
      }

      let splitTimeSec = (splitTimestamp - lastSplitTime) / 1000;
      let splitPace = thisSplitDistance > 0
        ? getPace(splitTimeSec, thisSplitDistance / 1000)
        : '0:00';

      splitTimes.push({
        split: splitTimes.length + 1,
        time: splitTimeSec,
        pace: splitPace,
      });

      lastSplitDist += thisSplitDistance;
      lastSplitTime = splitTimestamp;

      // Avoid infinite loops on the very last split
      if (thisSplitDistance < splitLength) break;
    }
  }
  return splitTimes;
}

