import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

interface MoodWidgetProps {
  mood: 'happy' | 'sad' | 'angry' | 'neutral' | 'excited';
}

const moodIcons: Record<string, any> = {
  happy: require('../../assets/mood/happy.png'),
  sad: require('../../assets/mood/sad.png'),
  angry: require('../../assets/mood/angry.png'),
  neutral: require('../../assets/mood/neutral.png'),
  excited: require('../../assets/mood/excited.png'),
};

const MoodWidget: React.FC<MoodWidgetProps> = ({ mood }) => {
  return (
    <View style={styles.container}>
      <Image source={moodIcons[mood]} style={styles.icon} />
      <Text style={styles.label}>{mood.toUpperCase()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F4FF',
    borderRadius: 12,
    padding: 12,
    width: 100,
    height: 100,
    elevation: 4,
  },
  icon: {
    width: 40,
    height: 40,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
});

export default MoodWidget;
