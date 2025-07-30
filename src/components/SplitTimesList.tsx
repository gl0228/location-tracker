import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface SplitTimesListProps {
  splitTimes: { split: number; pace: string }[];
  minPaceSec: number;
    maxPaceSec?: number;
}

const SplitTimesList: React.FC<SplitTimesListProps> = ({ splitTimes, minPaceSec }) => (
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
);

const styles = StyleSheet.create({
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

export default SplitTimesList;

