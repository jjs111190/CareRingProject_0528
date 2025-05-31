import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary } from 'react-native-image-picker';
import { globalStyles } from '../styles/globalStyles';

// 정적 import
import backIcon from '../../assets/back.png';
import placeholderIcon from '../../assets/user-placeholder.png';

const BasicInfoScreen: React.FC = () => {
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const navigation = useNavigation();

  useEffect(() => {
    const checkBasicInfo = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) return;

        const res = await axios.get('http://10.0.2.2:8000/basic-info/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 200 && res.data?.name) {
          navigation.navigate('Lifestyle');
        }
      } catch (err) {
        console.log('No existing basic info, continue.');
      }
    };

    checkBasicInfo();
  }, []);

  const pickImage = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        console.error('ImagePicker Error: ', response.errorMessage);
      } else if (response.assets && response.assets.length > 0) {
        setSelectedImage(response.assets[0]);
      }
    });
  };

  const validateForm = () => {
    if (!name.trim() || !birthDate.trim() || !gender || !height.trim() || !weight.trim()) {
      Alert.alert('Input Error', 'Please enter all items. (Pictures are optional)');
      return false;
    }

    if (!/^\d{8}$/.test(birthDate)) {
      Alert.alert('Input Error', 'Birth date must be in 8-digit (YYYYMMDD) format.');
      return false;
    }

    if (isNaN(Number(height)) || isNaN(Number(weight))) {
      Alert.alert('Input Error', 'Height and weight must be numbers.');
      return false;
    }

    return true;
  };

  const handleNext = async () => {
    if (!validateForm()) return;

    try {
      const token = await AsyncStorage.getItem('token');

      const formData = new FormData();
      formData.append('name', name);
      formData.append('birth_date', birthDate);
      formData.append('gender', gender);
      formData.append('height', height);
      formData.append('weight', weight);

      if (selectedImage) {
        formData.append('profile_image', {
          uri: selectedImage.uri,
          type: selectedImage.type || 'image/jpeg',
          name: selectedImage.fileName || 'profile.jpg',
        });
      }

      await axios.post('https://mycarering.loca.lt/basic-info', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      navigation.navigate('Lifestyle');
    } catch (err: any) {
      console.error('Failed to save basic info:', err.response?.data || err.message);
      Alert.alert('서버 오류', '기본 정보를 저장하는 데 실패했습니다.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            <View style={[globalStyles.container, { backgroundColor: '#ffffff' }]}>
              <TouchableOpacity
                style={{ position: 'absolute', top: 10, left: 20, zIndex: 10 }}
                onPress={() => navigation.goBack()}
              >
                <Image source={backIcon} style={{ width: 30, height: 30 }} />
              </TouchableOpacity>

              <Text style={globalStyles.title}>Basic Information</Text>
              <Text style={globalStyles.subtitle}>I need some brief information from you</Text>

              <TouchableOpacity style={globalStyles.profileImageContainer} onPress={pickImage}>
                <Image
                  source={selectedImage ? { uri: selectedImage.uri } : placeholderIcon}
                  style={globalStyles.profileImage}
                />
                <Text style={globalStyles.linkText}>Add photo</Text>
              </TouchableOpacity>

              <View style={[globalStyles.inputContainer, { width: '90%', alignSelf: 'center' }]}>
                <Text style={globalStyles.label}>Name</Text>
                <TextInput style={globalStyles.input} value={name} onChangeText={setName} />
              </View>

              <View style={{ width: '90%', alignSelf: 'center' }}>
  {/* 생년월일 */}
  <View style={globalStyles.inputContainer}>
    <Text style={globalStyles.label}>Date of birth</Text>
    <TextInput
      style={globalStyles.input}
      placeholder="YYYYMMDD"
      value={birthDate}
      onChangeText={setBirthDate}
      keyboardType="numeric"
    />
  </View>

  {/* 성별 */}
  <View style={globalStyles.inputContainer}>
    <Text style={globalStyles.label}>Gender</Text>
    <View style={globalStyles.genderButtonGroup}>
      {['male', 'female'].map((option) => (
        <TouchableOpacity
          key={option}
          style={[
            globalStyles.genderButton,
            gender === option && globalStyles.genderButtonSelected,
          ]}
          onPress={() => setGender(option)}
        >
          <Text
            style={
              gender === option
                ? globalStyles.genderTextSelected
                : globalStyles.genderText
            }
          >
            {option}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>

  {/* 키 입력 */}
<View style={globalStyles.inputContainer}>
  <Text style={globalStyles.label}>Height</Text>
  <View style={{ position: 'relative' }}>
    <TextInput
      style={[globalStyles.input, { paddingRight: 40 }]}  // 오른쪽 공간 확보
      value={height}
      onChangeText={setHeight}
      keyboardType="numeric"
    />
    <Text style={{
      position: 'absolute',
      right: 12,
      top: '50%',
      transform: [{ translateY: -8 }],
      color: '#888',
      fontSize: 16,
    }}>
      cm
    </Text>
  </View>
</View>

{/* 몸무게 입력 */}
<View style={globalStyles.inputContainer}>
  <Text style={globalStyles.label}>Weight</Text>
  <View style={{ position: 'relative' }}>
    <TextInput
      style={[globalStyles.input, { paddingRight: 40 }]}  // 오른쪽 공간 확보
      value={weight}
      onChangeText={setWeight}
      keyboardType="numeric"
    />
    <Text style={{
      position: 'absolute',
      right: 12,
      top: '50%',
      transform: [{ translateY: -8 }],
      color: '#888',
      fontSize: 16,
    }}>
      kg
    </Text>
  </View>
</View>
</View>
              <TouchableOpacity style={globalStyles.button} onPress={handleNext}>
                <Text style={globalStyles.buttonText}>Next</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default BasicInfoScreen;
