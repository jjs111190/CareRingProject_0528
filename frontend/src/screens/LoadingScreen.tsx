import React, { useEffect } from 'react';
import { View, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const LOGO_IMAGE = require('../../assets/Logo.png'); // 로고 아이콘
const LOGO_TEXT_IMAGE = require('../../assets/care_logo.png'); // CareRing 텍스트 이미지
const LOADING_TIMEOUT = 3000;

const LoadingScreen = () => {
  const navigation = useNavigation();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    }, LOADING_TIMEOUT);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.logoWrapper}>
        <Image 
          source={LOGO_IMAGE} 
          style={styles.logoIcon} 
          accessibilityLabel="CareRing Icon"
        />
        <Image 
          source={LOGO_TEXT_IMAGE} 
          style={styles.logoText} 
          accessibilityLabel="CareRing Text"
        />
      </View>
      <ActivityIndicator 
        size="large" 
        color="#4387E5" 
        style={styles.spinner}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoWrapper: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoIcon: {
    width: 50,
    height: 50,
    marginBottom: 5,
    resizeMode: 'contain',
  },
  logoText: {
    width: 180,
    height: 50,
    resizeMode: 'contain',
  },
  spinner: {
    marginTop: 20,
  },
});

export default LoadingScreen;