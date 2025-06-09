import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'; // ✅ 수정
import { globalStyles } from '../styles/globalStyles';

const IntroStep3Screen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets(); // ✅ 상태바 높이 고려

  const handleSkip = () => {
    navigation.navigate('Home');
  };

  const handleNext = async () => {
    const userEmail = await AsyncStorage.getItem('userEmail');
    if (userEmail) {
      await AsyncStorage.setItem(`introSeen-${userEmail}`, 'true');
    }

    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  };

  const handlePrev = () => {
    navigation.navigate('IntroStep2Screen');
  };

  return (
    <SafeAreaView style={globalStyles.container}>
      {/* Skip 버튼 */}
      <TouchableOpacity
        style={[styles.skipButton, { top: insets.top + 10 }]} // ✅ SafeArea 반영
        onPress={handleSkip}
      >
        <Text style={[globalStyles.linkText, { fontSize: 18 }]}>Skip</Text>
      </TouchableOpacity>

      {/* 이미지 */}
      <Image 
        source={require('../../assets/write-eating-habits.png')}
        style={{ width: 200, height: 200, marginBottom: 20 }}
        resizeMode="contain"
      />

      {/* 설명 텍스트 */}
      <Text style={styles.title}>Write down your eating habits</Text>
      <Text style={styles.description}>
        Write down your <Text style={styles.highlight}>eating habits</Text> based on your{'\n'}
        exercise style and ingredients.
      </Text>

      {/* 페이지 인디케이터와 버튼 */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity onPress={handlePrev}>
          <Image source={require('../../assets/left.png')} style={styles.imageButton} />
        </TouchableOpacity>

        <View style={[styles.indicator, { backgroundColor: '#D1D5DB' }]} />
        <View style={[styles.indicator, { backgroundColor: '#D1D5DB' }]} />
        <View style={[styles.indicator, { backgroundColor: '#4387E5' }]} />

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
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
    color: '#4387E5',
  },
  description: {
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

export default IntroStep3Screen;