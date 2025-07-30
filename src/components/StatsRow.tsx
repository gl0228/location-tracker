import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatsRowProps {
  time: string;
  distance: string;
  unit?: string;
  speed?: string;
}

const StatsRow: React.FC<StatsRowProps> = ({ time, distance, unit = 'km', speed }) => (
  <View style={styles.statsRow}>
    <View style={styles.statCol}>
      <Text style={styles.statValue}>{time}</Text>
      <Text style={styles.statLabel}>TIME</Text>
    </View>
    <View style={styles.verticalDivider} />
    <View style={styles.statCol}>
      <Text style={styles.statValue}>{distance}</Text>
      <Text style={styles.statLabel}>{unit}</Text>
    </View>
    {speed !== undefined && (
      <>
        <View style={styles.verticalDivider} />
        <View style={styles.statCol}>
          <Text style={styles.statValue}>{speed}</Text>
          <Text style={styles.statLabel}>KM/HR</Text>
        </View>
      </>
    )}
  </View>
);

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
});

export default StatsRow;

