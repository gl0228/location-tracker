import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform, Alert } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { calculateDistance, formatTime } from './utils/trackingHelpers';
import StatsRow from './components/StatsRow';
import MapCard from './components/MapCard';

const SCREEN_WIDTH = Dimensions.get('window').width;

// Styling for map
const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#21284c' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#21284c' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#7a7afc' }] },
];

const MapScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  // Track state
  const [isTracking, setIsTracking] = useState(false);
  const isTrackingRef = useRef(isTracking);
  const watchID = useRef<any>(null);

  // Route state
  const [restoredCoordinates, setRestoredCoordinates] = useState([]);
  const [newCoordinates, setNewCoordinates] = useState([]);

  // Time state
  const [startTime, setStartTime] = useState<Date | null>(null);    // Original session
  const [resumeTime, setResumeTime] = useState<Date | null>(null);  // After restore, when user clicks "start"
  const [initialElapsed, setInitialElapsed] = useState(0);          // Seconds, from first start to resume
  const [elapsedTime, setElapsedTime] = useState(0);                // Displayed timer

  // Restore logic on mount
  useEffect(() => {
    const restoreBackup = async () => {
      try {
        const backupStr = await AsyncStorage.getItem('workout_coords_backup');
        if (backupStr) {
          const backup = JSON.parse(backupStr);
          Alert.alert(
            "Restore Workout?",
            "A previous workout was interrupted. Do you want to restore it?",
            [
              {
                text: "No",
                style: "cancel",
                onPress: async () => {
                  setRestoredCoordinates([]);
                  setNewCoordinates([]);
                  setStartTime(null);
                  setResumeTime(null);
                  setElapsedTime(0);
                  setInitialElapsed(0);
                  await AsyncStorage.removeItem('workout_coords_backup');
                }
              },
              {
                text: "Yes",
                onPress: () => {
                  setRestoredCoordinates(backup.coordinates || []);
                  setStartTime(backup.startTime ? new Date(backup.startTime) : null);
                  // Calculate how much time had elapsed so far
                  if (backup.startTime) {
                    const elapsed = Math.floor((Date.now() - new Date(backup.startTime).getTime()) / 1000);
                    setInitialElapsed(elapsed);
                    setElapsedTime(elapsed);
                  } else {
                    setInitialElapsed(0);
                    setElapsedTime(0);
                  }
                  setNewCoordinates([]);
                  setResumeTime(null);
                }
              }
            ],
            { cancelable: false }
          );
        }
      } catch (err) {Alert.alert('Error', 'Something went wrong. Please try again.')}
    };
    restoreBackup();
  }, []);

  // Reset everything when navigating away (unless restoring)
  useFocusEffect(
    useCallback(() => {
      setIsTracking(false);
      isTrackingRef.current = false;
      setRestoredCoordinates([]);
      setNewCoordinates([]);
      setStartTime(null);
      setResumeTime(null);
      setElapsedTime(0);
      setInitialElapsed(0);
      AsyncStorage.removeItem('workout_coords_backup');
      if (watchID.current) {
        Geolocation.clearWatch(watchID.current);
        watchID.current = null;
      }
    }, [])
  );

  // Timer
  useEffect(() => {
    let interval: any;
    if (isTracking) {
      interval = setInterval(() => {
        // If resumed, elapsed is initialElapsed + time since resumeTime
        if (resumeTime) {
          setElapsedTime(initialElapsed + Math.floor((Date.now() - resumeTime.getTime()) / 1000));
        } else if (startTime) {
          setElapsedTime(Math.floor((Date.now() - startTime.getTime()) / 1000));
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking, resumeTime, startTime, initialElapsed]);

  useEffect(() => {
    isTrackingRef.current = isTracking;
  }, [isTracking]);

  // Save backup whenever progress is made
  useEffect(() => {
    if (restoredCoordinates.length > 0 || newCoordinates.length > 0) {
      AsyncStorage.setItem('workout_coords_backup', JSON.stringify({
        coordinates: [...restoredCoordinates, ...newCoordinates],
        startTime: startTime ? startTime.toISOString() : null,
      }));
    }
  }, [restoredCoordinates, newCoordinates, startTime]);

  // Permissions
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
          Alert.alert("Location Permission Needed", "Turn on location access so we can track your workout routes!");
          return false;
        case RESULTS.BLOCKED:
          Alert.alert("Location Permission Blocked", "Enable location permissions so we can track your workout routes!");
          return false;
        case RESULTS.LIMITED:
          Alert.alert("Limited Location Access", "Your location access is limited. Allow full access for best results!");
          return true;
        default:
          Alert.alert("Permission Error", "Could not determine location permission status.");
          return false;
      }
    } catch (error) {
      Alert.alert("Error", "Could not request location permission.");
      return false;
    }
  };

  // Start Tracking
  const startTracking = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    if (restoredCoordinates.length > 0 && !resumeTime) {
      // User resumed an old workout, save how much time has already elapsed
      setResumeTime(new Date());
    } else if (!startTime) {
      setStartTime(new Date());
    }

    setIsTracking(true);

    watchID.current = Geolocation.watchPosition(
      (position) => {
        if (!isTrackingRef.current) return;
        const { latitude, longitude } = position.coords;
        const newPoint = { latitude, longitude };
        setNewCoordinates(prev => [...prev, newPoint]);
      },
      (error) => {},
      {
        enableHighAccuracy: true,
        distanceFilter: 5,
        showsBackgroundLocationIndicator: true,
      }
    );
  };

  // End Tracking
  const endTracking = async () => {
    setIsTracking(false);
    if (watchID.current) {
      Geolocation.clearWatch(watchID.current);
      watchID.current = null;
    }
    await AsyncStorage.removeItem('workout_coords_backup');
    navigation.navigate('WorkoutComplete', {
      coordinates: [...restoredCoordinates, ...newCoordinates],
      startTime: startTime,
      endTime: new Date(),
    });
  };

  // Distance calculation
  const restoredMeters = calculateDistance(restoredCoordinates);
  const newMeters = calculateDistance(newCoordinates);
  const totalMeters = restoredMeters + newMeters;
  const totalDistance = (totalMeters / 1000).toFixed(2);

  // Combine for polyline display
  const allCoordinates = [...restoredCoordinates, ...newCoordinates];

  return (
    <LinearGradient
      colors={['#25155c', '#232969']}
      style={{ flex: 1 }}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      <StatsRow time={formatTime(elapsedTime)} distance={totalDistance} unit="km" />
      <MapCard coordinates={allCoordinates} customMapStyle={darkMapStyle} />
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




