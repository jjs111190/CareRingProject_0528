import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  type: 'about' | 'health' | 'posts' | 'custom';
  config?: any;
  data?: any;
}

const SectionRenderer: React.FC<Props> = ({ type, config, data }) => {
  switch (type) {
    case 'about':
      return (
        <View style={styles.sectionBox}>
          <Text style={styles.title}>About</Text>
          <Text style={styles.content}>{data?.about || 'No about info'}</Text>
        </View>
      );

    case 'health':
      return (
        <View style={styles.sectionBox}>
          <Text style={styles.title}>My Health Information</Text>
          {Object.entries(data || {})
            .filter(([key]) => key !== 'id' && key !== 'user_id')
            .map(([key, value]) => (
              <Text key={key} style={styles.content}>
                {key.replace(/_/g, ' ')}: {String(value)}
              </Text>
            ))}
        </View>
      );

    case 'posts':
      return (
        <View style={styles.sectionBox}>
          <Text style={styles.title}>Post</Text>
          {(data?.posts || []).length > 0 ? (
            <Text style={styles.content}>Total Posts: {data.posts.length}</Text>
          ) : (
            <Text style={styles.content}>No posts</Text>
          )}
        </View>
      );

    case 'custom':
      return (
        <View style={styles.sectionBox}>
          <Text style={styles.title}>{config?.title || 'Custom Section'}</Text>
          <Text style={styles.content}>{config?.text || 'No content'}</Text>
        </View>
      );

    default:
      return (
        <View style={styles.sectionBox}>
          <Text style={styles.title}>Unknown Section</Text>
        </View>
      );
  }
};

const styles = StyleSheet.create({
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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4387E5',
    marginBottom: 8,
  },
  content: {
    fontSize: 14,
    color: '#333',
  },
});

export default SectionRenderer;