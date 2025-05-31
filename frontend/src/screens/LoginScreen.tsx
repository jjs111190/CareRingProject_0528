import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Dimensions,
  Switch,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { globalStyles } from '../styles/globalStyles';

const { width } = Dimensions.get('window');
const SCALE_FACTOR = 375;

const SOCIAL_ICONS = {
  apple: require('../../assets/apple.png'),
  google: require('../../assets/google.png'),
  facebook: require('../../assets/facebook.png'),
};

const scale = (size: number) => (width / SCALE_FACTOR) * size;

const HeaderSection = () => (
  <>
    <Text style={globalStyles.title}>Sign In</Text>
    <Text style={globalStyles.subtitle}>
      Hi welcome back, you’ve been missed
    </Text>
  </>
);

const SocialSignInSection = () => (
  <>
    <View style={globalStyles.socialSignInContainer}>
      <View style={globalStyles.divider} />
      <Text style={globalStyles.socialSignInText}>Or sign in with</Text>
      <View style={globalStyles.divider} />
    </View>
    <View style={globalStyles.socialButtonsContainer}>
      {Object.entries(SOCIAL_ICONS).map(([platform, source]) => (
        <TouchableOpacity key={platform}>
          <Image
            source={source}
            style={globalStyles.socialIcon}
            accessibilityLabel={`${platform} sign in`}
          />
        </TouchableOpacity>
      ))}
    </View>
  </>
);

const LoginScreen = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [autoLogin, setAutoLogin] = useState(false);

  useEffect(() => {
    const tryAutoLogin = async () => {
      const autoLoginEnabled = await AsyncStorage.getItem('autoLogin');
      if (autoLoginEnabled === 'true') {
        const savedEmail = await AsyncStorage.getItem('autoLoginEmail');
        const savedPassword = await AsyncStorage.getItem('autoLoginPassword');
        if (savedEmail && savedPassword) {
          setEmail(savedEmail);
          setPassword(savedPassword);
          handleLogin(savedEmail, savedPassword);
        }
      }
    };
    tryAutoLogin();
  }, []);

  const toggleAutoLogin = async (value: boolean) => {
    setAutoLogin(value);

    if (value) {
      if (!email || !password) {
        Alert.alert('Input required', 'Please enter your email and password first for automatic login.');
        setAutoLogin(false);
        return;
      }
      await AsyncStorage.setItem('autoLogin', 'true');
      await AsyncStorage.setItem('autoLoginEmail', email);
      await AsyncStorage.setItem('autoLoginPassword', password);
    } else {
      await AsyncStorage.setItem('autoLogin', 'false');
      await AsyncStorage.removeItem('autoLoginEmail');
      await AsyncStorage.removeItem('autoLoginPassword');
    }
  };

  const handleLogin = async (inputEmail?: string, inputPassword?: string) => {
    const emailToUse = inputEmail || email;
    const passwordToUse = inputPassword || password;

    if (!emailToUse || !emailToUse.includes('@')) {
      Alert.alert('Input required', 'Please enter a valid email address.');
      return;
    }

    if (!passwordToUse || passwordToUse.length < 4) {
      Alert.alert('Input required', 'Password must be at least 4 characters long.');
      return;
    }

    try {
      const response = await axios.post('https://mycarering.loca.lt/auth/login', {
        email: emailToUse,
        password: passwordToUse,
      });

      const token = response.data.access_token;
      console.log('✅ 받은 토큰:', token);
      console.log('🧪 로그인 응답:', response.data);
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('userEmail', emailToUse);

      const introSeen = await AsyncStorage.getItem(`introSeen-${emailToUse}`);
      if (introSeen) {
        navigation.navigate('Home');
      } else {
        await AsyncStorage.setItem(`introSeen-${emailToUse}`, 'true');
        navigation.navigate('Intro');
      }
    } catch (err: any) {
      console.error('🔴 로그인 실패:', err.response?.data || err.message);
      Alert.alert('Login failed', 'Email or password is incorrect.');
    }
  };

  return (
    <View style={globalStyles.container}>
      <HeaderSection />

      <View style={globalStyles.inputContainer}>
        <Text style={globalStyles.label}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          style={globalStyles.input}
          keyboardType="email-address"
        />
      </View>

      <View style={globalStyles.inputContainer}>
        <Text style={globalStyles.label}>Password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
          style={globalStyles.input}
        />
      </View>

      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 4,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Switch value={autoLogin} onValueChange={toggleAutoLogin} />
          <Text style={{ marginLeft: 1 }}>automatic login</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('NewPassword')}>
          <Text style={[globalStyles.forgotPasswordText, { marginLeft: 60 }]}>
            Forgot Password?
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={globalStyles.button}
        onPress={() => handleLogin()}
        accessibilityRole="button"
      >
        <Text style={globalStyles.buttonText}>Sign In</Text>
      </TouchableOpacity>

      <SocialSignInSection />

      <TouchableOpacity
        onPress={() => navigation.navigate('SignUp')}
        accessibilityRole="link"
      >
        <Text style={globalStyles.footerText}>
          Don’t have an account?{' '}
          <Text style={globalStyles.linkText}>Sign Up</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default LoginScreen;