import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const emojis = ['😊', '😢', '😡', '😍', '😴', '😎', '🤢', '🤔', '🥳', '😭'];

const EmojiSelector = ({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (emoji: string) => void;
}) => (
  <View style={styles.container}>
    <Text style={styles.label}>Choose your mood</Text>
    <View style={styles.emojiRow}>
      {emojis.map((emoji) => (
        <TouchableOpacity
          key={emoji}
          onPress={() => onSelect(emoji)}
          style={[
            styles.emojiButton,
            selected === emoji && styles.selectedEmoji,
          ]}
        >
          <Text style={styles.emoji}>{emoji}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

export default EmojiSelector;

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  emojiRow: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'center', // ✅ 추가: 이모지 중앙 정렬
  gap: 8, // 선택적으로 사용 가능
},
  emojiButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#eee',
    margin: 4,
  },
  selectedEmoji: {
    backgroundColor: '#4387E5',
  },
  emoji: {
    fontSize: 22,
  },
});