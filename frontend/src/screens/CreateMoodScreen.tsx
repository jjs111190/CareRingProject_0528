import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MoodInput from '../components/MoodInput';
import EmojiSelector from '../components/EmojiSelector';
import ImagePickerBox from '../components/ImagePickerBox';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CreateMoodScreen: React.FC = () => {
  const navigation = useNavigation();
  const [moodText, setMoodText] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [image, setImage] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!moodText.trim() || !selectedEmoji) {
      Alert.alert('Input Error', 'Please enter your mood and select an emoji.');
      return;
    }

    try {
      setIsSubmitting(true);
      const token = await AsyncStorage.getItem('token');
      const formData = new FormData();

      formData.append('emoji', selectedEmoji);
      formData.append('memo', moodText);

      if (image) {
        formData.append('image', {
          uri: image.uri,
          name: image.fileName || 'mood.jpg',
          type: image.type || 'image/jpeg',
        });
      }

      await axios.post('https://mycarering.loca.lt/mood', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      navigation.navigate('Home', { refresh: true });
    } catch (error: any) {
      console.error('❌ Mood upload failed:', error.response?.data || error.message);
      Alert.alert('Upload Failed', 'Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView 
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerContainer}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Image
              source={require('../../assets/back.png')}
              style={styles.backIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <Text style={styles.title}>Today's Condition</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.card}>
             <EmojiSelector selected={selectedEmoji} onSelect={setSelectedEmoji} />
          </View>

          {/* <View style={styles.card}>
             <ImagePickerBox image={image} setImage={setImage} />
          </View> */}

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Describe Your Mood</Text>
            <MoodInput 
              value={moodText} 
              onChange={setMoodText} 
              placeholder="How are you feeling today?"
            />
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.button, isSubmitting && styles.disabledButton]} 
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.buttonText}>
            {isSubmitting ? 'Submitting...' : 'Share Your Mood'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    padding: 24,
    paddingTop: 60,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FC',
    borderRadius: 12,
    marginRight: 16,
  },
  backIcon: {
    width: 20,
    height: 20,
    tintColor: '#4A6FA5',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A2A3A',
    letterSpacing: -0.3,
  },
  content: {
    flex: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#EDF2F7',
    shadowColor: 'rgba(0, 0, 0, 0.02)',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A5568',
    marginBottom: 16,
    letterSpacing: -0.2,
  },
  button: {
    backgroundColor: '#4A6FA5',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: 'rgba(74, 111, 165, 0.3)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.7,
  },
});

export default CreateMoodScreen;