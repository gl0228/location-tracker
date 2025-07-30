import React, { useState, useRef, useEffect } from 'react';
import Geolocation from 'react-native-geolocation-service';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform, Alert } from 'react-native';
import MapView, { LatLng, Polyline } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';

const SCREEN_WIDTH = Dimensions.get('window').width;

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
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

function calculateDistance(coords: LatLng[]) {
  let total = 0;
  for (let i = 1; i < coords.length; i++) {
    const prev = coords[i - 1];
    const curr = coords[i];
    total += haversine(prev.latitude, prev.longitude, curr.latitude, curr.longitude);
  }
  return total;
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60).toString();
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#21284c' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#21284c' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#7a7afc' }] },
];

const MapScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const insets = useSafeAreaInsets();

  const [isTracking, setIsTracking] = useState(false);
  const isTrackingRef = useRef(isTracking);
  const watchID = useRef<any>(null);

  const [coordinates, setCoordinates] = useState<LatLng[]>([]);
  const coordinatesRef = useRef<LatLng[]>([]);

  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Track elapsed time live
  useEffect(() => {
    let interval: any;
    if (isTracking && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime.getTime()) / 1000));
      }, 1000);
    } else {
      setElapsedTime(0);
    }
    return () => clearInterval(interval);
  }, [isTracking, startTime]);

  useEffect(() => {
    isTrackingRef.current = isTracking;
  }, [isTracking]);

  useEffect(() => {
    return () => {
      if (watchID.current) {
        Geolocation.clearWatch(watchID.current);
        watchID.current = null;
      }
    };
  }, []);

  const requestPermissions = async () => {
    try {
      let status;

      if (Platform.OS === 'ios') {
        status = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
      } else if (Platform.OS === 'android') {
        status = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
      }

      switch (status) {
        case RESULTS.DENIED:
          Alert.alert(
            "Location Permission Needed",
            "Turn on location access so we can track your workout routes!"
          );
          return false;
        case RESULTS.GRANTED:
          return true;
        case RESULTS.BLOCKED:
          Alert.alert(
            "Location Permission Blocked",
            "Enable location permissions so we can track your workout routes!"
          );
          return false;
        case RESULTS.LIMITED:
          Alert.alert(
            "Limited Location Access",
            "Your location access is limited. Allow full access for best results!"
          );
          return true;
        default:
          Alert.alert(
            "Permission Error",
            "Could not determine location permission status."
          );
          return false;
      }
    } catch (error) {
      Alert.alert("Error", "Could not request location permission.");
      return false;
    }
  };

  const startTracking = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    setCoordinates([]);
    coordinatesRef.current = [];

    setIsTracking(true);
    setStartTime(new Date());

    watchID.current = Geolocation.watchPosition(
      (position) => {
        if (!isTrackingRef.current) return;
        const { latitude, longitude } = position.coords;
        const newCoordinates = { latitude, longitude };
        setCoordinates(prev => {
          const updated = [...prev, newCoordinates];
          coordinatesRef.current = updated;
          return updated;
        });
      },
      (error) => { /* handle error */ },
      {
        enableHighAccuracy: true,
        distanceFilter: 5,
        showsBackgroundLocationIndicator: true,
      }
    );
  };

  const endTracking = () => {
    setIsTracking(false);

    if (watchID.current) {
      Geolocation.clearWatch(watchID.current);
      watchID.current = null;
    }

    navigation.navigate('WorkoutComplete', {
      coordinates: coordinatesRef.current,
      startTime,
      endTime: new Date(),
    });
  };

  const totalMeters = calculateDistance(coordinates);
  const totalDistance = (totalMeters / 1000).toFixed(2);

  return (
    <LinearGradient
      colors={['#25155c', '#232969']}
      style={{ flex: 1 }}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statCol}>
          <Text style={styles.statValue}>{formatTime(elapsedTime)}</Text>
          <Text style={styles.statLabel}>TIME</Text>
        </View>
        <View style={styles.verticalDivider} />
        <View style={styles.statCol}>
          <Text style={styles.statValue}>{totalDistance}</Text>
          <Text style={styles.statLabel}>km</Text>
        </View>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          customMapStyle={darkMapStyle}
          showsUserLocation
          followsUserLocation
        >
          <Polyline
            strokeWidth={5}
            strokeColor="#b174f9"
            coordinates={coordinates}
          />
        </MapView>
      </View>

      {/* Start/Stop Button */}
      <View style={[
        styles.buttonWrapper,
        { bottom: insets.bottom ? insets.bottom + 24 : 40 },
      ]}>
        <TouchableOpacity
          onPress={isTracking ? endTracking : startTracking}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#9341c8', '#3ca6f6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>
              {isTracking ? 'End Tracking' : 'Start tracking'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

export default MapScreen;

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginTop: 55,
    marginBottom: 24,
    width: '90%',
    alignSelf: 'center',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: 'white',
    fontSize: 42,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 3,
  },
  statLabel: {
    color: '#7a7afc',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1.2,
    marginBottom: 5,
  },
  verticalDivider: {
    width: 1,
    height: 52,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginHorizontal: 20,
    alignSelf: 'center',
  },
  mapContainer: {
    width: SCREEN_WIDTH * 0.92,
    height: SCREEN_WIDTH * 0.92,
    borderRadius: 28,
    overflow: 'hidden',
    alignSelf: 'center',
    backgroundColor: '#181e3a',
    marginBottom: 28,
  },
  map: {
    width: '100%',
    height: '100%',
  },
    buttonWrapper: {
      position: 'absolute',
      left: 0,
      right: 0,
      alignItems: 'center',
    },
    button: {
      paddingVertical: 18,
      paddingHorizontal: 50,
        paddingLeft: 50,
      borderRadius: 999,
      alignItems: 'center',
      width: SCREEN_WIDTH * 0.95,
      maxWidth: 370,
      minWidth: 200,
      height: 100,
        marginBottom: 50
    },
    buttonText: {
      color: 'white',
      fontSize: 26,
      fontWeight: '600',
      textAlign: 'center',
        paddingRight: 90,
    },
});

