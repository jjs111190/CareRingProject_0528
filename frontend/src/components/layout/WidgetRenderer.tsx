import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

// Assuming you have these widget components
import MoodWidget from '../widgets/MoodWidget'; // Adjust path as needed
import QuoteWidget from '../widgets/QuoteWidget'; // Adjust path as needed

// It's good practice to define interfaces in a central types file,
// but for this example, I'll keep it here for clarity.
interface Widget {
  id: string;
  type: string;
  position: { x: number; y: number };
  config: any;
}

interface Props {
  widget: Widget;
}

const WidgetRenderer: React.FC<Props> = ({ widget }) => {
  const { type, config } = widget;

  switch (type) {
    case 'Mood':
      return <MoodWidget config={config} />;

    case 'Quote':
      return <QuoteWidget config={config} />;

    case 'Image':
      // If you plan to make 'Image' its own component (e.g., ImageWidget),
      // you would import it and render it like MoodWidget/QuoteWidget.
      // For now, it remains here as it's the only one directly rendering an Image.
      return (
        <Image
          source={{ uri: config?.imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
      );

    default:
      return (
        <View style={styles.widgetContainer}>
          <Text style={styles.unknown}>Unsupported Widget</Text>
        </View>
      );
  }
};

const styles = StyleSheet.create({
  // widgetContainer style might be less used now if individual widgets manage their own styling,
  // but keeping it for 'unknown' and potentially 'Image' if it gets wrapped.
  widgetContainer: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.7)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    maxWidth: 200,
  },
  // mood and quote styles will likely move into MoodWidget.tsx and QuoteWidget.tsx
  // mood: {
  //   fontSize: 32,
  //   textAlign: 'center',
  // },
  // quote: {
  //   fontSize: 14,
  //   fontStyle: 'italic',
  //   color: '#444',
  // },
  unknown: {
    color: '#999',
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 10,
    backgroundColor: '#eee',
  },
});

export default WidgetRenderer;