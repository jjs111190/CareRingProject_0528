import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';

const AICameraScreen: React.FC = () => {
  const handleCapture = () => {
    // 📸 추후 카메라 촬영 기능 연결
    alert('촬영 기능은 추후 구현 예정입니다.');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AI Camera</Text>
      <Text style={styles.subtitle}>Analyze your pills using AI</Text>

      {/* 카메라 프리뷰 대체 이미지 */}
      <View style={styles.cameraPlaceholder}>
        <Image
          source={require('../../assets/camera.png')} // 🖼 예시 이미지 (없다면 default 배경으로 대체)
          style={styles.previewImage}
          resizeMode="cover"
        />
      </View>

      {/* 촬영 버튼 */}
      <TouchableOpacity style={styles.captureButton} onPress={handleCapture}>
        <Text style={styles.captureButtonText}>Capture</Text>
      </TouchableOpacity>
    </View>
  );
};

export default AICameraScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 40,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    marginBottom: 20,
  },
  cameraPlaceholder: {
    width: '100%',
    height: 400,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  captureButton: {
    marginTop: 30,
    backgroundColor: '#4387E5',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 30,
  },
  captureButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});