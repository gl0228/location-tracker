import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MapView, { Polyline } from 'react-native-maps';

const SCREEN_WIDTH = Dimensions.get('window').width;

// Function that calculates distance using Haversine formula
function haversine(lat1, lon1, lat2, lon2) {
  const toRad = x => (x * Math.PI) / 180;
  const R = 6371000; // meters
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

// Function that calculates total distance
function calculateDistance(coords) {
  let total = 0;
  for (let i = 1; i < coords.length; i++) {
    const prev = coords[i - 1];
    const curr = coords[i];
    total += haversine(prev.latitude, prev.longitude, curr.latitude, curr.longitude);
  }
  return total;
}

const WorkoutComplete = ({ route, navigation }) => {
  const { coordinates, startTime, endTime } = route.params;
  const totalMeters = calculateDistance(coordinates);
  const totalDistance = (totalMeters / 1000).toFixed(2);

  let duration = '';
  let totalTimeInSecs = 1;
  if (startTime && endTime) {
    totalTimeInSecs = Math.max(1, Math.floor((new Date(endTime) - new Date(startTime)) / 1000));
    const min = Math.floor(totalTimeInSecs / 60);
    const sec = totalTimeInSecs % 60;
    duration = `${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec}`;
  }

  const speed = ((totalMeters / 1000) / (totalTimeInSecs / 3600)).toFixed(2);

  return (
    <View style={styles.container}>
      <Text style={styles.time}>{duration}</Text>
      <View style={styles.row}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>DISTANCE</Text>
          <Text style={styles.cardValue}>{totalDistance}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>AVG. SPEED</Text>
          <Text style={styles.cardValue}>{speed}</Text>
        </View>
      </View>
    </View>
  );
};

export default WorkoutComplete;

// Styling
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#262145',
    justifyContent: 'center',
    alignItems: 'center',
  },
  time: {
    color: 'white',
    fontSize: 72,
    fontWeight: '600',
    marginBottom: 80,
    letterSpacing: 2,
  },
  row: {
    flexDirection: 'row',
    width: SCREEN_WIDTH * 0.85,
    justifyContent: 'space-between',
  },
  card: {
    alignItems: 'center',
    flex: 1,
  },
  cardLabel: {
    color: '#E0E0E0',
    fontSize: 16,
    letterSpacing: 1.2,
    fontWeight: '600',
    marginBottom: 10,
  },
  cardValue: {
    color: '#6B75F6',
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
