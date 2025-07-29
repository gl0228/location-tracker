import React, { useState } from 'react';
import { Button, View, Alert } from 'react-native';
import MapView, { LatLng, Polyline as MapPolyline } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';

const MapScreen = () => {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const [isTracking, setIsTracking] = useState(false);
    const [points, setPoints] = useState<LatLng[]>([]);
    const [time, setTime] = useState<Date | null>(null);

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
      setIsTracking(true);
      // TODO: Implement your tracking logic here!
      Alert.alert("Tracking started!");
    };
    
    const endTracking = () => {
        setIsTracking(false);
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
        initialRegion={{
          latitude: 51.5074,
          longitude: -0.1278,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation
        followsUserLocation
       >
            {/*  Draws the user's route as a blue line */}
            <MapPolyline strokeWidth={4} strokeColor="blue" coordinates={points}/>
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
