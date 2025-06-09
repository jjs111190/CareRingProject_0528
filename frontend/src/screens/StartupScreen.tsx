import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const StartupScreen = () => {
  const navigation = useNavigation();

  useEffect(() => {
    const checkLogin = async () => {
      const token = await AsyncStorage.getItem('token');
      const email = await AsyncStorage.getItem('userEmail');
      const autoLogin = await AsyncStorage.getItem('autoLogin');

      if (token && email && autoLogin === 'true') {
        const introSeen = await AsyncStorage.getItem(`introSeen-${email}`);
        if (introSeen) {
          navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
        } else {
          navigation.reset({ index: 0, routes: [{ name: 'Intro' }] });
        }
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      }
    };

    checkLogin();
  }, [navigation]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#4387E5" />
    </View>
  );
};

export default StartupScreen;