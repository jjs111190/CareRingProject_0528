// 📁 components/widgets/QuoteWidget.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface QuoteWidgetProps {
  config: {
    text: string;
  };
}

const QuoteWidget: React.FC<QuoteWidgetProps> = ({ config }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.quoteText}>{config.text || 'No quote provided.'}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF3E0',
    borderRadius: 10,
    padding: 16,
    maxWidth: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  quoteText: {
    fontSize: 16,
    color: '#333',
    fontStyle: 'italic',
  },
});

export default QuoteWidget;
