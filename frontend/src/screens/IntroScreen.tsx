import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { globalStyles } from '../styles/globalStyles';

const IntroScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const handleSkip = () => {
    navigation.navigate('Home');
  };

  const handleNext = () => {
    navigation.navigate('IntroStep2Screen');
  };

  const handlePrev = () => {
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={globalStyles.container}>
      {/* Skip 버튼 */}
      <TouchableOpacity
        style={[styles.skipButton, { top: insets.top + 10 }]}
        onPress={handleSkip}
      >
        <Text style={[globalStyles.linkText, { fontSize: 18 }]}>Skip</Text>
      </TouchableOpacity>

      {/* 이미지 */}
      <Image
        source={require('../../assets/calendar-ative.png')}
        style={{ width: 200, height: 200, marginBottom: 20 }}
        resizeMode="contain"
      />

      {/* 설명 텍스트 */}
      <Text style={{ fontSize: 18, textAlign: 'center', marginVertical: 10 }}>
        Keep track of your <Text style={{ color: '#4387E5', fontWeight: 'bold' }}>medication</Text> times{'\n'}
        by writing them down{'\n'}on a calendar.
      </Text>

      {/* 페이지 인디케이터와 버튼 */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity onPress={handlePrev}>
          <Image source={require('../../assets/left.png')} style={styles.imageButton} />
        </TouchableOpacity>

        <View style={styles.indicatorContainer}>
          <View style={[styles.indicator, { backgroundColor: '#4387E5' }]} />
          <View style={[styles.indicator, { backgroundColor: '#D1D5DB' }]} />
          <View style={[styles.indicator, { backgroundColor: '#D1D5DB' }]} />
        </View>

        <TouchableOpacity onPress={handleNext}>
          <Image source={require('../../assets/right.png')} style={styles.imageButton} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  skipButton: {
    position: 'absolute',
    right: 20,
    zIndex: 1,
  },
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 40,
    width: '100%',
  },
  indicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  indicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  imageButton: {
    width: 50,
    height: 50,
    marginHorizontal: 10,
  },
});

export default IntroScreen;