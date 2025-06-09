import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface LayoutSection {
  id: string;
  type: 'about' | 'health' | 'posts' | 'custom';
  content: React.ReactNode;
}

interface Props {
  sections?: LayoutSection[]; // ✅ optional로 지정
  editable?: boolean;
  onReorder?: (updatedOrder: LayoutSection[]) => void;
}

const DecoratedLayout: React.FC<Props> = ({ sections = [], editable = false }) => {
  return (
    <View style={styles.container}>
      {sections.length === 0 ? (
        <Text style={styles.emptyText}>No sections to display.</Text>
      ) : (
        sections.map((section) => (
          <View key={section.id} style={styles.sectionBox}>
            <Text style={styles.sectionTitle}>{getSectionLabel(section.type)}</Text>
            <View>{section.content}</View>
          </View>
        ))
      )}
    </View>
  );
};

const getSectionLabel = (type: string) => {
  switch (type) {
    case 'about':
      return 'About';
    case 'health':
      return 'My Health Information';
    case 'posts':
      return 'Post';
    case 'custom':
      return 'Custom Section';
    default:
      return 'Unknown';
  }
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  sectionBox: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4387E5',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 40,
  },
});

export default DecoratedLayout;