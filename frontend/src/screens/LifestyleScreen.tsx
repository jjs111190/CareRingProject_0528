import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { globalStyles } from '../styles/globalStyles';
import { scale } from '../utils/scale';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LifestyleScreen: React.FC = () => {
  const [medicalHistory, setMedicalHistory] = useState('');
  const [healthGoals, setHealthGoals] = useState('');
  const [dietTracking, setDietTracking] = useState('');
  const [sleepHabits, setSleepHabits] = useState('');
  const [smokingAlcohol, setSmokingAlcohol] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    const checkExistingInfo = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        console.log('🛰️ LifestyleScreen token (GET):', token);

        if (!token) return;

        const res = await axios.get('https://mycarering.loca.lt/lifestyle/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res?.status === 200 && res.data) {
          navigation.navigate('Intro');
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          console.log('Lifestyle not found, stay on page');
        } else {
          console.error('Error checking lifestyle info:', err.response?.data || err.message);
          Alert.alert('Error', 'Failed to check lifestyle info.');
        }
      } finally {
        setLoading(false);
      }
    };

    checkExistingInfo();
  }, []);

  const handleFinish = async () => {
    if (submitting) return;

    if (
      !medicalHistory.trim() ||
      !healthGoals.trim() ||
      !dietTracking.trim() ||
      !sleepHabits.trim() ||
      !smokingAlcohol.trim()
    ) {
      Alert.alert('Error', 'Please fill out all fields.');
      return;
    }

    try {
      setSubmitting(true);
      const token = await AsyncStorage.getItem('token');
      console.log("📤 Sending token (POST):", token);

      await axios.post(
        'https://mycarering.loca.lt/lifestyle',
        {
          medical_history: medicalHistory,
          health_goals: healthGoals,
          diet_tracking: dietTracking,
          sleep_habits: sleepHabits,
          smoking_alcohol: smokingAlcohol
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      navigation.navigate('Intro');
    } catch (err: any) {
      console.error('Failed to save lifestyle:', err.response?.data || err.message);
      Alert.alert('Error', 'Failed to save lifestyle info.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[globalStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={globalStyles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <TouchableOpacity
        style={localStyles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Image
          source={require('../../assets/back.png')}
          style={localStyles.backIcon}
        />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={localStyles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false} // ✅ 스크롤바 제거
      >
        <Text style={[globalStyles.title, localStyles.smallTitle]}>
          Lifestyle & Health Habits
        </Text>
        <Text style={[globalStyles.subtitle, localStyles.smallSubtitle]}>
          I need some brief information from you
        </Text>

        <View style={localStyles.inputGroup}>
          <Text style={globalStyles.label}>Medical history / chronic conditions</Text>
          <TextInput
            style={localStyles.input}
            value={medicalHistory}
            onChangeText={setMedicalHistory}
          />
        </View>

        <View style={localStyles.inputGroup}>
          <Text style={globalStyles.label}>Health goals</Text>
          <TextInput
            style={localStyles.input}
            value={healthGoals}
            onChangeText={setHealthGoals}
          />
        </View>

        <View style={localStyles.inputGroup}>
          <Text style={globalStyles.label}>Diet and nutrition tracking</Text>
          <TextInput
            style={localStyles.input}
            value={dietTracking}
            onChangeText={setDietTracking}
          />
        </View>

        <View style={localStyles.inputGroup}>
          <Text style={globalStyles.label}>Sleep and physical activity habits</Text>
          <TextInput
            style={localStyles.input}
            value={sleepHabits}
            onChangeText={setSleepHabits}
          />
        </View>

        <View style={localStyles.inputGroup}>
          <Text style={globalStyles.label}>Smoking/alcohol consumption status</Text>
          <TextInput
            style={localStyles.input}
            value={smokingAlcohol}
            onChangeText={setSmokingAlcohol}
          />
        </View>

        <TouchableOpacity
          style={globalStyles.button}
          onPress={handleFinish}
          disabled={submitting} // ✅ 중복 입력 방지
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={globalStyles.buttonText}>Finish</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const localStyles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingTop: scale(70),
    alignItems: 'center', // ✅ 중앙 정렬
    paddingHorizontal: scale(16),
    paddingBottom: scale(40),
  },
  backButton: {
    position: 'absolute',
    top: scale(40),
    left: scale(20),
    zIndex: 1000,
  },
  backIcon: {
    width: scale(30),
    height: scale(30),
  },
  smallTitle: {
    fontSize: scale(30),
    marginBottom: scale(8),
  },
  smallSubtitle: {
    fontSize: scale(14),
    marginBottom: scale(30),
  },
  inputGroup: {
    width: '100%', // ✅ 입력 박스 너비 통일
    marginBottom: scale(16),
  },
  input: {
    ...globalStyles.input,
    width: '100%',
  },
});

export default LifestyleScreen;
