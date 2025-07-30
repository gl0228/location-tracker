import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MapView, { Polyline } from 'react-native-maps';

const SCREEN_WIDTH = Dimensions.get('window').width;

const WorkoutComplete = ({ route }) => {
  const { coordinates, startTime, endTime } = route.params;

  // Real calculations (use your functions)
  function haversine(lat1, lon1, lat2, lon2) {
    const toRad = x => (x * Math.PI) / 180;
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

  function calculateDistance(coords) {
    let total = 0;
    for (let i = 1; i < coords.length; i++) {
      const prev = coords[i - 1];
      const curr = coords[i];
      total += haversine(prev.latitude, prev.longitude, curr.latitude, curr.longitude);
    }
    return total;
  }

  const totalMeters = calculateDistance(coordinates);
  const totalDistance = (totalMeters / 1000).toFixed(2);

  let duration = '';
  let totalTimeInSecs = 1;
  if (startTime && endTime) {
    totalTimeInSecs = Math.max(1, Math.floor((new Date(endTime) - new Date(startTime)) / 1000));
    const min = Math.floor(totalTimeInSecs / 60);
    const sec = totalTimeInSecs % 60;
    duration = `${min}:${sec < 10 ? '0' : ''}${sec}`;
  }
  const speed = ((totalMeters / 1000) / (totalTimeInSecs / 3600)).toFixed(0);
                 
 // Find the midpoint of the route taken by user. The default location is set in London
 const midpoint =
 coordinates.length > 0
   ? coordinates[Math.floor(coordinates.length / 2)]
   : { latitude: 51.5074, longitude: -0.1278 };

 return (
   <LinearGradient
     colors={['#1b1571', '#2b1b6b']}
     style={styles.gradient}
     start={{ x: 0.5, y: 0 }}
     end={{ x: 0.5, y: 1 }}
   >
     {/* Header */}
     <View style={styles.headerWrap}>
       <Text style={styles.header}>WORKOUT</Text>
       <Text style={styles.header}>COMPLETE!</Text>
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
     {/* Stats */}
     <View style={styles.statsRow}>
       <View style={styles.statCol}>
         <Text style={styles.statValue}>{duration}</Text>
         <Text style={styles.statLabel}>TIME</Text>
       </View>
       <View style={styles.verticalDivider} />
       <View style={styles.statCol}>
         <Text style={styles.statValue}>{totalDistance}</Text>
         <Text style={styles.statLabel}>KM</Text>
       </View>
       <View style={styles.verticalDivider} />
       <View style={styles.statCol}>
         <Text style={styles.statValue}>{speed}</Text>
         <Text style={styles.statLabel}>KM/HR</Text>
       </View>
     </View>
   </LinearGradient>
 );
};

const styles = StyleSheet.create({
 gradient: {
   flex: 1,
   alignItems: 'center',
   paddingTop: 70,
   backgroundColor: '#1b1571',
 },
 headerWrap: {
   marginBottom: 26,
 },
 header: {
   color: '#fff',
   fontSize: 42,
   fontWeight: 'bold',
   letterSpacing: 2,
   textAlign: 'center',
   marginBottom: -8,
   marginTop: 0,
 },
    map: {
      width: '85%',
      height: 250,
      borderRadius: 16,
      marginTop: 24,
      marginBottom: 24,
      overflow: 'hidden',
    },
 mapContainer: {
   width: SCREEN_WIDTH * 0.92,
   height: SCREEN_WIDTH * 0.57,
   backgroundColor: '#222060',
   borderRadius: 30,
   marginTop: 10,
   marginBottom: 40,
   overflow: 'hidden',
   alignSelf: 'center',
   justifyContent: 'center',
   alignItems: 'center',
   position: 'relative',
 },
 // Simulated grid for effect
 gridOverlay: {
   ...StyleSheet.absoluteFillObject,
   backgroundColor: 'transparent',
   borderRadius: 30,
   zIndex: 0,
   borderWidth: 0,
 },
 // Simulate the purple route polyline
 routeLine: {
   position: 'absolute',
   left: 60,
   top: 65,
   width: SCREEN_WIDTH * 0.65,
   height: 4,
   backgroundColor: '#9271ff',
   borderRadius: 5,
   transform: [{ rotate: '-15deg' }],
   zIndex: 1,
   opacity: 0.95,
 },
 // Start marker (green dot)
 startMarker: {
   position: 'absolute',
   left: 36,
   top: 56,
   width: 28,
   height: 28,
   borderRadius: 20,
   backgroundColor: '#76e8bd',
   borderWidth: 4,
   borderColor: '#1b1571',
   zIndex: 2,
 },
 // End marker (dark circle with checker flag)
 endMarkerOuter: {
   position: 'absolute',
   right: 28,
   top: 78,
   width: 30,
   height: 30,
   borderRadius: 15,
   backgroundColor: '#11112a',
   alignItems: 'center',
   justifyContent: 'center',
   zIndex: 2,
 },
 endMarkerInner: {
   width: 22,
   height: 22,
   borderRadius: 11,
   backgroundColor: '#191930',
   alignItems: 'center',
   justifyContent: 'center',
   overflow: 'hidden',
 },
 checkerboard: {
   width: 14,
   height: 14,
   backgroundColor: 'transparent',
   borderRadius: 2,
   borderWidth: 2,
   borderColor: '#fff',
 },
 statsRow: {
   flexDirection: 'row',
   justifyContent: 'center',
   alignItems: 'flex-end',
   marginTop: 15,
   marginBottom: 0,
   width: SCREEN_WIDTH * 0.92,
   alignSelf: 'center',
   backgroundColor: 'transparent',
 },
 statCol: {
   alignItems: 'center',
   justifyContent: 'center',
   flex: 1,
 },
 statValue: {
   color: '#fff',
   fontSize: 36,
   fontWeight: 'bold',
   letterSpacing: 1,
   marginBottom: 5,
 },
 statLabel: {
   color: '#aeb4f8',
   fontSize: 16,
   fontWeight: '600',
   letterSpacing: 1.2,
   marginBottom: 4,
 },
 verticalDivider: {
   width: 1.5,
   backgroundColor: 'rgba(255,255,255,0.11)',
   height: 48,
   marginHorizontal: 8,
   alignSelf: 'center',
 },
});

export default WorkoutComplete;
