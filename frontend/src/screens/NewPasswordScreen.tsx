import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { globalStyles } from '../styles/globalStyles';
import { SafeAreaView } from 'react-native-safe-area-context';

const NewPasswordScreen: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const navigation = useNavigation();

  const handlePasswordReset = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'All fields are required.');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Enter a valid email.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    try {
      const response = await axios.put('https://mycarering.loca.lt/users/reset-password', {
        email,
        new_password: password,
      });

      if (response.status === 200) {
        Alert.alert('Success', 'Password reset successfully.');
        navigation.goBack();
      } else {
        Alert.alert('Error', 'Unable to reset password.');
      }
    } catch (error: any) {
      console.error('Reset error:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Server error.');
    }
  };

  return (
    <SafeAreaView style={globalStyles.container}>
      {/* Back Button */}
      <TouchableOpacity
        style={{ position: 'absolute', top: 50, left: 20 }} // SafeAreaView 적용 시 top 줄여도 안전
        onPress={() => navigation.goBack()}
      >
        <Image source={require('../../assets/back.png')} style={{ width: 30, height: 30 }} />
      </TouchableOpacity>

      {/* Title */}
      <Text style={globalStyles.title}>Reset Password</Text>
      <Text style={globalStyles.subtitle}>Enter your email and new password below.</Text>

      {/* Email Input */}
      <View style={globalStyles.inputContainer}>
        <Text style={globalStyles.label}>Email</Text>
        <TextInput
          style={globalStyles.input}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
      </View>

      {/* Password Input */}
      <View style={globalStyles.inputContainer}>
        <Text style={globalStyles.label}>New Password</Text>
        <TextInput
          style={globalStyles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>

      {/* Confirm Password Input */}
      <View style={globalStyles.inputContainer}>
        <Text style={globalStyles.label}>Confirm Password</Text>
        <TextInput
          style={globalStyles.input}
          placeholder="Confirm Password"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
      </View>

      {/* Submit Button */}
      <TouchableOpacity style={globalStyles.button} onPress={handlePasswordReset}>
        <Text style={globalStyles.buttonText}>Reset Password</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default NewPasswordScreen;