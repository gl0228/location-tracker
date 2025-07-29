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
    // Get coordinates from MapScreen
    const { coordinates, startTime, endTime } = route.params;
    const totalDistance = (calculateDistance(coordinates) / 1000).toFixed(2);

  // Calculate duration of time in min:sec format
  let duration = '';
    if (startTime && endTime) {
      const totalTimeInSecs = Math.floor((new Date(endTime) - new Date(startTime)) / 1000);
      const min = Math.floor(totalTimeInSecs / 60);
      const sec = totalTimeInSecs % 60;
      duration = `${min}m ${sec}s`;
    }
    
    // Find the midpoint of the route taken by user. The default location is set in London
    const midpoint =
    coordinates.length > 0
      ? coordinates[Math.floor(coordinates.length / 2)]
      : { latitude: 51.5074, longitude: -0.1278 };

    return (
    <View style={styles.container}>
      {/* Gradient Header */}
      <LinearGradient
        colors={['#6F52ED', '#3EC6FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <Text style={styles.headerText}>Workout Complete!</Text>
      </LinearGradient>

      {/* Cards displaying info eg. time, distance */}
      <View style={styles.cardRow}>
        <View style={[styles.card, { borderColor: '#6F52ED' }]}>
          <Text style={styles.cardLabel}>Distance</Text>
          <Text style={styles.cardValue}>{totalDistance} km</Text>
        </View>
        <View style={[styles.card, { borderColor: '#3EC6FF' }]}>
          <Text style={styles.cardLabel}>Time</Text>
          <Text style={styles.cardValue}>{duration}</Text>
        </View>
      </View>

      {/* Map of route taken by user */}
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: midpoint.latitude,
          longitude: midpoint.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        scrollEnabled={false}
        zoomEnabled={false}
        pitchEnabled={false}
        rotateEnabled={false}
      >
        <Polyline
          coordinates={coordinates}
          strokeColor="#6F52ED"
          strokeWidth={5}
        />
      </MapView>

    {/* Done Button */}
    <TouchableOpacity
        style={styles.buttonWrapper}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('Home')}
    >
    <LinearGradient
        colors={['#6F52ED', '#3EC6FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.button}
    >
          <Text style={styles.buttonText}>Done</Text>
    </LinearGradient>
    </TouchableOpacity>
          </View>
    );
    };

const CARD_SIZE = (SCREEN_WIDTH - 60) / 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    paddingHorizontal: 20,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  header: {
    width: '100%',
    borderRadius: 18,
    marginTop: 40,
    paddingVertical: 32,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#3EC6FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 8,
  },
  headerText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cardRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 16,
  },
  card: {
    flex: 1,
    minWidth: CARD_SIZE,
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 2,
    paddingVertical: 24,
    paddingHorizontal: 18,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#3EC6FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 4,
  },
  cardLabel: {
    fontSize: 16,
    color: '#888',
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  cardValue: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#222',
    letterSpacing: 0.8,
  },
  map: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    marginTop: 24,
    marginBottom: 24,
    overflow: 'hidden',
  },
  buttonWrapper: {
    width: '100%',
    marginTop: 10,
    marginBottom: 30,
  },
  button: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#3EC6FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 1,
  },
});

export default WorkoutComplete;
