import React from 'react';
import { TextInput, StyleSheet } from 'react-native';

const MoodInput = ({ value, onChange }: { value: string; onChange: (text: string) => void }) => (
  <TextInput
    style={styles.input}
    placeholder="Describe your mood today in one line."
    placeholderTextColor="#999"
    value={value}
    onChangeText={onChange}
    multiline
  />
);

export default MoodInput;

const styles = StyleSheet.create({
  input: {
    height: 120,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
  
    marginTop: 20,
    textAlignVertical: 'top',
  },
});