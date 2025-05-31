// toastConfig.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const toastConfig = {
  success: ({ text1, text2 }: any) => (
    <View style={styles.successToast}>
      <Text style={styles.toastTitle}>{text1}</Text>
      <Text style={styles.toastMessage}>{text2}</Text>
    </View>
  ),
  error: ({ text1, text2 }: any) => (
    <View style={styles.errorToast}>
      <Text style={styles.toastTitle}>{text1}</Text>
      <Text style={styles.toastMessage}>{text2}</Text>
    </View>
  ),
};

const styles = StyleSheet.create({
  successToast: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    width: '90%',
    marginBottom: 20,
  },
  errorToast: {
    backgroundColor: '#F44336',
    padding: 15,
    borderRadius: 8,
    width: '90%',
    marginBottom: 20,
  },
  toastTitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  toastMessage: {
    color: 'white',
    fontSize: 14,
    marginTop: 5,
  },
});