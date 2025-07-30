import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import MapView, { Polyline, Marker, LatLng, Region } from 'react-native-maps';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface MapCardProps {
  coordinates: LatLng[];
  customMapStyle?: any;
  initialRegion?: Region;
  showMarkers?: boolean;
  scrollEnabled?: boolean;
}

const MapCard: React.FC<MapCardProps> = ({
  coordinates,
  customMapStyle,
  initialRegion,
  showMarkers = false,
  scrollEnabled = true,
}) => (
  <View style={styles.mapContainer}>
    <MapView
      style={styles.map}
      customMapStyle={customMapStyle}
      initialRegion={initialRegion}
      scrollEnabled={scrollEnabled}
      zoomEnabled={scrollEnabled}
      pitchEnabled={scrollEnabled}
      rotateEnabled={scrollEnabled}
      followsUserLocation={!showMarkers}
      showsUserLocation={!showMarkers}
      pointerEvents={scrollEnabled ? 'auto' : 'none'}
    >
      <Polyline strokeWidth={5} strokeColor="#b174f9" coordinates={coordinates} />
      {showMarkers && coordinates.length > 0 && (
        <Marker coordinate={coordinates[0]}>
          <View style={styles.startMarker}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>A</Text>
          </View>
        </Marker>
      )}
      {showMarkers && coordinates.length > 1 && (
        <Marker coordinate={coordinates[coordinates.length - 1]}>
          <View style={styles.endMarker}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>B</Text>
          </View>
        </Marker>
      )}
    </MapView>
  </View>
);

const styles = StyleSheet.create({
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
  startMarker: {
    backgroundColor: '#23ce56',
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#fff',
    borderWidth: 2,
  },
  endMarker: {
    backgroundColor: '#ec222b',
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#fff',
    borderWidth: 2,
  },
});

export default MapCard;


