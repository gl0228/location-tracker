import React, { useState, useRef, useEffect } from 'react';
import Geolocation from 'react-native-geolocation-service';
import { Button, View, Platform, Alert } from 'react-native';
import MapView, { LatLng, Polyline } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';

const MapScreen = () => {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    
    const [isTracking, setIsTracking] = useState(false);
    const isTrackingRef = useRef(isTracking);
    const watchID = useRef(null);
    
    const [coordinates, setCoordinates] = useState<LatLng[]>([]);
    const coordinatesRef = useRef<LatLng[]>([]);
    
    const [startTime, setStartTime] = useState<Date | null>(null);
    const [endTime, setEndTime] = useState<Date | null>(null);

    useEffect(() => {
        return () => {
            if (watchID.current) {
                Geolocation.clearWatch(watchID.current);
                watchID.current = null;
            }
            // Optionally reset here if you want a totally fresh start on remount
            // setCoordinates([]);
            // coordinatesRef.current = [];
            // setStartTime(null);
            // setEndTime(null);
        };
    }, []);

    
    useEffect(() => {
        isTrackingRef.current = isTracking;
    }, [isTracking]);
    
    const requestPermissions = async () => {
      try {
          let status;
          
          if (Platform.OS === 'ios') {
              status = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
          }
          else if (Platform.OS === 'android') {
              status = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
          }
          
          switch (status) {
              case RESULTS.DENIED:
                  console.log('Permission has been denied.');
                  Alert.alert(
                              "Location Permission Needed",
                              "Turn on location access so we can track your workout routes!"
                              );
                  return false;
              case RESULTS.GRANTED:
                  console.log('Permission is granted.');
                  return true;
              case RESULTS.BLOCKED:
                  console.log('Permission is blocked.');
                  Alert.alert(
                              "Location Permission Blocked",
                              "Enable location permissions so we can track your workout routes!"
                              );
                  return false;
              case RESULTS.LIMITED: // (iOS 14+)
                  console.log('Permission is limited.');
                  Alert.alert(
                              "Limited Location Access",
                              "Your location access is limited. Allow full access for best results!"
                              );
                  return true;
              default:
                  console.log('Permission status:', status);
                  Alert.alert(
                              "Permission Error",
                              "Could not determine location permission status."
                              );
                  return false;
          }
      } catch (error) {
          console.log("There has been an error:", error);
          Alert.alert("Error", "Could not request location permission.");
          return false;
        }
    };

    const startTracking = async () => {
        const hasPermission = await requestPermissions();
        if (!hasPermission) return;

        setCoordinates([]); // <--- Reset here!
        coordinatesRef.current = []; // <--- Reset ref here too!

        setIsTracking(true);
        setStartTime(new Date());
        Alert.alert("Tracking started!");

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
            (error) => { /* ... */ },
            {
                enableHighAccuracy: true,
                distanceFilter: 5,
                showsBackgroundLocationIndicator: true,
            }
        );
    };

    
    const endTracking = () => {
        // First, stop tracking
        setIsTracking(false);

        if (watchID.current) {
            Geolocation.clearWatch(watchID.current);
            watchID.current = null;
        }

        // Navigate immediately to summary screen with current coordinates
        navigation.navigate('WorkoutComplete', {
            coordinates: coordinatesRef.current,
            startTime,
            endTime: new Date(),
        });
    };

    const saveWorkout = () => {
    // TODO: Implement save workout functionality
    // Navigate to the workout complete screen to show the summary
    };

    return (
    <SafeAreaView
      style={{
        flex: 1,
      }}
    >
      <MapView
        style={{
          flex: 1,
        }}
        showsUserLocation
        followsUserLocation
       >
            {/*  Draws the user's route as a blue line */}
            <Polyline strokeWidth={4} strokeColor="blue" coordinates={coordinates}/>
        </MapView>

        {/* Button turns tracking on/off */}
        {isTracking ? (
            <Button title="End Tracking" onPress={endTracking} />
        ) : (
             <Button title="Start Tracking" onPress={startTracking} />
        )}
    </SafeAreaView>
    );
};

export default MapScreen;
