import React from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MapView, { Polyline, Marker } from 'react-native-maps';
import { haversine, calculateDistance, getBoundingRegion, getSplitTimes, getPace } from './utils/trackingHelpers';

const SCREEN_WIDTH = Dimensions.get('window').width;

const WorkoutComplete = ({ route }) => {
  const { coordinates, startTime, endTime } = route.params;

  // Calculate main stats for the workout
  const totalMeters = calculateDistance(coordinates);
  const totalDistance = (totalMeters / 1000).toFixed(2);

  // Show total workout time as m:ss (always at least 1 second)
  let duration = '';
  let totalTimeInSecs = 1;
  if (startTime && endTime) {
    totalTimeInSecs = Math.max(1, Math.floor((new Date(endTime) - new Date(startTime)) / 1000));
    const min = Math.floor(totalTimeInSecs / 60);
    const sec = totalTimeInSecs % 60;
    duration = `${min}:${sec < 10 ? '0' : ''}${sec}`;
  }

  // Average speed in km/h
  const speed = ((totalMeters / 1000) / (totalTimeInSecs / 3600)).toFixed(2);

  // Get all the split times for this workout
  const splitTimes = getSplitTimes(coordinates, startTime, endTime);

  // Figure out which split was the fastest and which was slowest
  const maxPaceSec = Math.max(...splitTimes.map(split => {
    const [min, sec] = split.pace.split(':').map(Number);
    return min * 60 + sec;
  }));

  const minPaceSec = Math.min(...splitTimes.map(split => {
    const [min, sec] = split.pace.split(':').map(Number);
    return min * 60 + sec;
  }));

  // Start of UI
  return (
    <LinearGradient
      colors={['#1b1571', '#2b1b6b']}
      style={styles.gradient}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      <ScrollView
        contentContainerStyle={{ alignItems: 'center', paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Big title at the top */}
        <Text style={styles.header}>WORKOUT</Text>
        <Text style={styles.header}>COMPLETE!</Text>

        {/* Map card with route, start and end markers */}
        <View style={styles.mapCard}>
          <MapView
            style={styles.map}
            initialRegion={getBoundingRegion(coordinates)}
            scrollEnabled={false}
            zoomEnabled={false}
            pitchEnabled={false}
            rotateEnabled={false}
            pointerEvents="none"
          >
            <Polyline coordinates={coordinates} strokeColor="#B174F9" strokeWidth={4} />
            {coordinates.length > 0 && (
              <Marker coordinate={coordinates[0]}>
                <View style={styles.startMarker}>
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>A</Text>
                </View>
              </Marker>
            )}
            {coordinates.length > 1 && (
              <Marker coordinate={coordinates[coordinates.length - 1]}>
                <View style={styles.endMarker}>
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>B</Text>
                </View>
              </Marker>
            )}
          </MapView>
        </View>

        {/* Total time, distance, and speed */}
        <View style={styles.statsRow}>
          <View style={styles.statCol}>
            <Text style={styles.statValue}>{duration}</Text>
            <Text style={styles.statLabel}>TIME</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={styles.statValue}>{totalDistance.replace('.', ',')}</Text>
            <Text style={styles.statLabel}>KM</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={styles.statValue}>{speed}</Text>
            <Text style={styles.statLabel}>KM/HR</Text>
          </View>
        </View>

        {/* Split times with bar chart */}
        {splitTimes.length > 0 && (
          <View style={styles.splitsContainer}>
            <Text style={styles.splitsHeader}>SPLITS</Text>
            <View style={{ flexDirection: 'row', marginBottom: 6 }}>
              <Text style={styles.splitsColHeader}>KM</Text>
              <Text style={styles.splitsColHeader}>PACE</Text>
              <View style={{ flex: 1 }} />
            </View>
            {splitTimes.map((split, idx) => {
              const [min, sec] = split.pace.split(':').map(Number);
              const paceSec = min * 60 + sec;
              // Bar width is longer for faster splits
              let widthPercent = 40 + 60 * (minPaceSec / paceSec);
              if (!isFinite(widthPercent) || widthPercent < 0) widthPercent = 40;
              widthPercent = Math.max(24, widthPercent);
              return (
                <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 7 }}>
                  <Text style={styles.splitsCol}>{split.split}</Text>
                  <Text style={styles.splitsCol}>{split.pace}</Text>
                  <View style={styles.splitsBarBg}>
                    <View
                      style={[
                        styles.splitsBarFill,
                        {
                          width: `${widthPercent}%`,
                          minWidth: 24,
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 36,
    backgroundColor: '#1b1571',
  },
  header: {
    color: '#fff',
    fontSize: 38,
    fontWeight: 'bold',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: -4,
    marginTop: 0,
  },
  mapCard: {
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_WIDTH * 0.38,
    borderRadius: 22,
    overflow: 'hidden',
    marginVertical: 25,
    backgroundColor: '#131330',
    alignSelf: 'center',
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
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: SCREEN_WIDTH * 0.9,
    marginTop: 10,
    marginBottom: 18,
  },
  statCol: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '700',
    marginTop: 3,
    marginBottom: 2,
  },
  statLabel: {
    color: '#aeb4f8',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 1,
  },
  splitsContainer: {
    marginTop: 10,
    width: SCREEN_WIDTH * 0.9,
    alignSelf: 'center',
  },
  splitsHeader: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 6,
    letterSpacing: 1,
  },
  splitsColHeader: {
    color: '#aaa',
    width: 55,
    fontSize: 15,
    fontWeight: '700',
  },
  splitsCol: {
    color: '#fff',
    width: 55,
    fontSize: 15,
    fontWeight: '600',
  },
  splitsBarBg: {
    flex: 1,
    height: 13,
    backgroundColor: '#232969',
    borderRadius: 9,
    overflow: 'hidden',
    marginLeft: 6,
    marginRight: 0,
  },
  splitsBarFill: {
    height: 13,
    backgroundColor: '#2f60ff',
    borderRadius: 9,
  },
});

export default WorkoutComplete;

