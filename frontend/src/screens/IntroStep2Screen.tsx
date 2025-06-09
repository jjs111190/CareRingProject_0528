import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'; // ✅ 수정
import { globalStyles } from '../styles/globalStyles';

const IntroStep2Screen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets(); // ✅ 상태바 높이 고려

  const handleSkip = () => {
    navigation.navigate('Home');
  };

  const handleNext = () => {
    navigation.navigate('IntroStep3Screen');
  };

  const handlePrev = () => {
    navigation.navigate('Intro');
  };

  return (
    <SafeAreaView style={globalStyles.container}>
      {/* Skip 버튼 */}
      <TouchableOpacity
        style={[styles.skipButton, { top: insets.top + 10 }]} // ✅ SafeArea 고려
        onPress={handleSkip}
      >
        <Text style={[globalStyles.linkText, { fontSize: 18 }]}>Skip</Text>
      </TouchableOpacity>

      {/* 이미지 */}
      <Image 
        source={require('../../assets/check-ingredient.png')}
        style={{ width: 200, height: 200, marginBottom: 20 }}
        resizeMode="contain"
      />

      {/* 설명 텍스트 */}
      <Text style={styles.titleText}>Check the ingredient</Text>
      <Text style={styles.descriptionText}>
        Take a <Text style={styles.highlight}>picture</Text> of{'\n'}
        the ingredients to check them
      </Text>

      {/* 페이지 인디케이터와 버튼 */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity onPress={handlePrev}>
          <Image source={require('../../assets/left.png')} style={styles.imageButton} />
        </TouchableOpacity>

        <View style={[styles.indicator, { backgroundColor: '#D1D5DB' }]} />
        <View style={[styles.indicator, { backgroundColor: '#4387E5' }]} />
        <View style={[styles.indicator, { backgroundColor: '#D1D5DB' }]} />

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
  titleText: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
    color: '#4387E5',
  },
  descriptionText: {
    fontSize: 18,
    textAlign: 'center',
    marginVertical: 10,
  },
  highlight: {
    color: '#4387E5',
    fontWeight: 'bold',
  },
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 40,
    width: '100%',
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

export default IntroStep2Screen;