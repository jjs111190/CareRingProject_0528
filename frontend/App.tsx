// ✅ App.tsx 또는 index.js의 최상단
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
// 나머지 import...
import { LogBox, View, Text, Platform } from 'react-native';
LogBox.ignoreAllLogs();

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { toastConfig } from './toastConfig'; // 커스텀 설정 (선택사항)
import PushNotification from 'react-native-push-notification';
import OneSignal, { OpenedEvent, InAppMessage, NotificationReceivedEvent, OSNotification } from 'react-native-onesignal';

// 📌 화면 import
import CreateMessagesScreen from './src/screens/CreateMessagesScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import NewPasswordScreen from './src/screens/NewPasswordScreen';
import BasicInfoScreen from './src/screens/BasicInfoScreen';
import LoadingScreen from './src/screens/LoadingScreen';
import LifestyleScreen from './src/screens/LifestyleScreen';
import IntroScreen from './src/screens/IntroScreen';
import IntroStep2Screen from './src/screens/IntroStep2Screen';
import IntroStep3Screen from './src/screens/IntroStep3Screen';
import TabNavigator from './src/screens/TabNavigator';
import HomScreen from './src/screens/HomeScreen';
import PostWriteScreen from './src/screens/PostWriteScreen';
import AICameraScreen from './src/screens/AICameraScreen';
import PostDetailScreen from './src/screens/PostDetailScreen';
import MessageScreen from './src/screens/MessageScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import UserProfileScreen from './src/screens/UserProfileScreen';
import ChatScreen from './src/screens/ChatScreen';
import MessageDetail from './src/screens/MessageDetail';
import CreateMoodScreen from './src/screens/CreateMoodScreen';
import IdSearchInput from './src/components/IdSearchInput';
import MoodDetailScreen from './src/screens/MoodDetailScreen';
import ProfileCustomizer from './src/screens/ProfileCustomizer';


import { GoogleSignin } from '@react-native-google-signin/google-signin';
PushNotification.configure({
  onNotification: function (notification) {
    console.log('LOCAL NOTIFICATION ==>', notification);
  },
  requestPermissions: Platform.OS === 'ios',
});
// GoogleSignin.configure({
//   webClientId: 'GOOGLE_WEB_CLIENT_ID.apps.googleusercontent.com',
// });
const Stack = createStackNavigator();

const App = () => {
  const [initialRoute, setInitialRoute] = useState<string>('Login');

  useEffect(() => {
    const checkInitialRoute = async () => {
      try {
        const seenIntro = await AsyncStorage.getItem('hasSeenIntro');
        if (seenIntro) {
          setInitialRoute('Home');
        } else {
          setInitialRoute('Intro');
        }
      } catch (error) {
        console.log('Error retrieving intro status:', error);
      }
    };
    checkInitialRoute();
  }, []);

  return (
    <>
      <NavigationContainer>
        <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
          {/* 여기에는 항상 유효한 <Stack.Screen />만 들어가야 함 */}
          <Stack.Screen name="Intro" component={IntroScreen} />
          <Stack.Screen name="IntroStep2Screen" component={IntroStep2Screen} />
          <Stack.Screen name="IntroStep3Screen" component={IntroStep3Screen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen name="NewPassword" component={NewPasswordScreen} />
          <Stack.Screen name="Loading" component={LoadingScreen} />
          <Stack.Screen name="BasicInfo" component={BasicInfoScreen} />
          <Stack.Screen name="Lifestyle" component={LifestyleScreen} />
          <Stack.Screen name="HomeScreen" component={HomScreen} />
          <Stack.Screen name="Home" component={TabNavigator} />
          <Stack.Screen name="MessageDetail" component={MessageDetail} />
          <Stack.Screen name="PostWrite" component={PostWriteScreen} />
          <Stack.Screen name="AICamera" component={AICameraScreen} />
          <Stack.Screen name="PostDetail" component={PostDetailScreen} />
          <Stack.Screen name="MessageScreen" component={MessageScreen} />
          <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
          <Stack.Screen name="UserProfile" component={UserProfileScreen} />
          <Stack.Screen name="ChatScreen" component={ChatScreen} />
          <Stack.Screen name="CreateMessagesScreen" component={CreateMessagesScreen} />
          <Stack.Screen name="CreateMood" component={CreateMoodScreen} options={{ title: '컨디션 등록' }} />
          <Stack.Screen
                name="IdSearchInput"
                component={IdSearchInput}
                options={{ headerShown: false }} // 또는 필요에 따라 true
              />
       <Stack.Screen name="MoodDetail" component={MoodDetailScreen} />
        <Stack.Screen name="ProfileCustomizer" component={ProfileCustomizer}/>
        </Stack.Navigator>
      </NavigationContainer>
      <Toast config={toastConfig} />
    </>
  );
};

export default App;