// components/widgets/MoodWidget.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface MoodWidgetProps {
  config: {
    emoji?: string;
    moodText?: string;
  };
}

const MoodWidget: React.FC<MoodWidgetProps> = ({ config }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{config.emoji || '🙂'}</Text>
      <Text style={styles.moodText}>{config.moodText || 'Feeling good!'}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#E0F7FA',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    maxWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  emoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  moodText: {
    fontSize: 16,
    color: '#00796B',
    fontWeight: '500',
  },
});

export default MoodWidget;