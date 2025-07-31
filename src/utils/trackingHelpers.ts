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
        latitude: 37.3349,
        longitude: -122.0090,
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
export function getPace(seconds, km) {
  if (!km || seconds <= 0) return '0:00';
  const paceSec = seconds / km;
  const min = Math.floor(paceSec / 60);
  const sec = Math.round(paceSec % 60);
  return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}


export function getSplitTimes(coords, startTime, endTime, splitLength = 1000) {
  if (!coords || coords.length < 2) return [];

  const splitTimes = [];
  let splitNum = 1;
  let lastSplitDist = 0;
  let lastSplitTime = new Date(startTime).getTime();
  let cumulativeDist = 0;

  // Use timestamps if present, otherwise interpolate
  let hasTimestamps = coords.every(pt => !!pt.timestamp);
  let times = [];
  if (hasTimestamps) {
    times = coords.map(pt => new Date(pt.timestamp).getTime());
  } else {
    // Interpolate times based on index
    const totalDuration = new Date(endTime) - new Date(startTime);
    times = coords.map((_, i) =>
      new Date(startTime).getTime() +
      (i / (coords.length - 1)) * totalDuration
    );
  }

  for (let i = 1; i < coords.length; i++) {
    const prev = coords[i - 1];
    const curr = coords[i];

    const segDist = haversine(prev.latitude, prev.longitude, curr.latitude, curr.longitude);
    const prevTime = times[i - 1];
    const currTime = times[i];

    let segStartDist = cumulativeDist;
    cumulativeDist += segDist;
    let segEndDist = cumulativeDist;

    while (segEndDist - lastSplitDist >= splitLength) {
      const distToNextSplit = splitLength - (segStartDist - lastSplitDist);
      const fraction = distToNextSplit / segDist;
      const splitTimestamp = prevTime + fraction * (currTime - prevTime);

      const splitTimeSec = (splitTimestamp - lastSplitTime) / 1000;
      const pace = getPace(splitTimeSec, splitLength / 1000);

      // The cumulative distance at this split
      const cumulativeKm = (lastSplitDist + splitLength) / 1000;

      // Don't push splits with nonpositive time
      if (splitTimeSec > 0) {
        splitTimes.push({
          split: splitNum,
          distance: cumulativeKm, // e.g. 1, 2, 3, ...
          time: splitTimeSec,
          pace,
        });
        splitNum += 1;
      }

      lastSplitDist += splitLength;
      lastSplitTime = splitTimestamp;
      segStartDist += distToNextSplit;

      if (segEndDist - lastSplitDist < 1e-6) break;
    }
  }

  // Final partial split if enough left (optional, e.g. last .26km)
  if (cumulativeDist - lastSplitDist > 200) {
    const finalTime = new Date(endTime).getTime();
    const splitDist = cumulativeDist - lastSplitDist;
    const splitTimeSec = (finalTime - lastSplitTime) / 1000;
    const pace = getPace(splitTimeSec, splitDist / 1000);
    const finalKm = cumulativeDist / 1000;
    if (splitTimeSec > 0) {
      splitTimes.push({
        split: splitNum,
        distance: finalKm, // the final cumulative distance (e.g. 2.26)
        time: splitTimeSec,
        pace,
      });
    }
  }

  return splitTimes;
}



