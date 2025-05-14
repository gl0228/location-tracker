import React from 'react';
import { Button, View } from 'react-native';
import MapView from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

const MapScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const reqeustPermisions = () => {
    // TODO: Implement permission request functionality
  };

  const startTracking = () => {
    // TODO: Implement tracking functionality
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
      />

      <Button title="Start Tracking" onPress={startTracking} />
    </SafeAreaView>
  );
};

export default MapScreen;
