import React, { useState, useRef, useEffect, useCallback } from 'react';
import Geolocation from 'react-native-geolocation-service';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform, Alert } from 'react-native';
import MapView, { LatLng, Polyline } from 'react-native-maps';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { haversine, calculateDistance, formatTime } from './utils/trackingHelpers';

import StatsRow from './components/StatsRow';
import MapCard from './components/MapCard';

const SCREEN_WIDTH = Dimensions.get('window').width;

// Custom style for the map
const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#21284c' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#21284c' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#7a7afc' }] },
];

const MapScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const insets = useSafeAreaInsets();

  // This state tracks if we are recording or not
  const [isTracking, setIsTracking] = useState(false);
  const isTrackingRef = useRef(isTracking);
  const watchID = useRef<any>(null);

  // Stores the actual route for this workout
  const [coordinates, setCoordinates] = useState<LatLng[]>([]);
  const coordinatesRef = useRef<LatLng[]>([]);

  // For the timer
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Whenever we navigate back to this page, reset everything
  useFocusEffect(
    useCallback(() => {
      setIsTracking(false);
      isTrackingRef.current = false;
      setCoordinates([]);
      coordinatesRef.current = [];
      setStartTime(null);
      setElapsedTime(0);
      // Remove previous session backup if it exists
      AsyncStorage.removeItem('workout_coords_backup');
      // If there's any active geolocation watcher, clear it
      if (watchID.current) {
        Geolocation.clearWatch(watchID.current);
        watchID.current = null;
      }
    }, [])
  );

  // Tick every second only if we're tracking
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

  // Make sure the ref always matches the latest isTracking state
  useEffect(() => {
    isTrackingRef.current = isTracking;
  }, [isTracking]);

  // Save workout progress in case app crashes or user leaves the app
  useEffect(() => {
    if (coordinates.length > 0) {
      AsyncStorage.setItem('workout_coords_backup', JSON.stringify({
        coordinates,
        startTime: startTime ? startTime.toISOString() : null,
      }));
    }
  }, [coordinates, startTime]);

  // This handles location permissions for both iOS and Android
  const requestPermissions = async () => {
    try {
      let status;
      if (Platform.OS === 'ios') {
        status = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
      } else if (Platform.OS === 'android') {
        status = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
      }
      switch (status) {
        case RESULTS.GRANTED:
          return true;
        case RESULTS.DENIED:
          Alert.alert(
            "Location Permission Needed",
            "Turn on location access so we can track your workout routes!"
          );
          return false;
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

  // Starts a new workout and begins tracking location
  const startTracking = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    setCoordinates([]);
    coordinatesRef.current = [];
    setIsTracking(true);
    setStartTime(new Date());

    // Start listening for location changes
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
      (error) => { /* can show an error here if you want */ },
      {
        enableHighAccuracy: true,
        distanceFilter: 5,
        showsBackgroundLocationIndicator: true,
      }
    );
  };

  // Stops workout, clears up, and navigates to the "Workout Complete" page
  const endTracking = async () => {
    setIsTracking(false);

    // Clear the location watcher if we started it
    if (watchID.current) {
      Geolocation.clearWatch(watchID.current);
      watchID.current = null;
    }

    // Remove any backup
    await AsyncStorage.removeItem('workout_coords_backup');

    navigation.navigate('WorkoutComplete', {
      coordinates: coordinatesRef.current,
      startTime,
      endTime: new Date(),
    });
  };

  // Calculate distance for stats display
  const totalMeters = calculateDistance(coordinates);
  const totalDistance = (totalMeters / 1000).toFixed(2);
    
    return (
      <LinearGradient
        colors={['#25155c', '#232969']}
        style={{ flex: 1 }}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      >
        {/* Timer and Distance stats (now using the StatsRow component) */}
        <StatsRow
          time={formatTime(elapsedTime)}
          distance={totalDistance}
          unit="km"
        />

        {/* The Map (now using the MapCard component) */}
        <MapCard
          coordinates={coordinates}
          customMapStyle={darkMapStyle}
        />

        {/* Start or Stop button, depending on current state */}
        <View
          style={[
            styles.buttonWrapper,
            { bottom: insets.bottom ? insets.bottom + 24 : 40 },
          ]}
        >
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
    borderRadius: 999,
    alignItems: 'center',
    width: SCREEN_WIDTH * 0.95,
    maxWidth: 370,
    minWidth: 200,
    height: 100,
    marginBottom: 50,
  },
  buttonText: {
    color: 'white',
    fontSize: 26,
    fontWeight: '600',
    textAlign: 'center',
    paddingRight: 90,
  },
});


