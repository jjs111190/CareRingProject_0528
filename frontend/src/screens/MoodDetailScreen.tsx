import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';

type MoodDetailParams = {
  MoodDetail: {
    userId: number;
    nickname: string;
    emoji?: string;
    phrase?: string;
    created_at?: string;
    image_url?: string;
  };
};

const MoodDetailScreen: React.FC = () => {
  const route = useRoute<RouteProp<MoodDetailParams, 'MoodDetail'>>();
  const navigation = useNavigation();
  const { nickname, emoji, phrase, created_at, image_url, userId } = route.params;

  const handleSendMessage = () => {
    navigation.navigate('MessageScreen', {
      userId,
      nickname,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Image source={require('../../assets/back.png')} style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Mood Detail</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Profile with Gradient Ring */}
      <View style={styles.profileContainer}>
        <LinearGradient
          colors={['#89CFF0', '#4387E5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBorder}
        >
          {image_url ? (
            <Image
              source={{ uri: `https://mycarering.loca.lt${image_url}` }}
              style={styles.profileImage}
            />
          ) : (
            <View style={styles.placeholderImage} />
          )}
        </LinearGradient>
        <Text style={styles.nickname}>{nickname}</Text>
      </View>

      {/* Mood */}
      <Text style={styles.emoji}>{emoji || '🙂'}</Text>
      <Text style={styles.phrase}>{phrase || 'No status message.'}</Text>

      {/* Timestamp */}
      <Text style={styles.timestamp}>
        {created_at
          ? new Date(created_at).toLocaleString('en-US', {
              timeZone: 'Asia/Seoul',
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })
          : ''}
      </Text>

      {/* Message Button */}
      <TouchableOpacity style={styles.messageButton} onPress={handleSendMessage}>
        <Text style={styles.messageButtonText}>Send Message</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 56,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    padding: 4,
  },
  backIcon: {
    width: 24,
    height: 24,
    tintColor: '#4387E5',
    resizeMode: 'contain',
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  profileContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  gradientBorder: {
    width: 94,
    height: 94,
    borderRadius: 47,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  profileImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#FFFFFF',
  },
  placeholderImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#E5E7EB',
  },
  nickname: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  emoji: {
    fontSize: 64,
    textAlign: 'center',
    marginBottom: 16,
  },
  phrase: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  timestamp: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 40,
  },
  messageButton: {
    alignSelf: 'center',
    backgroundColor: '#4387E5',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  messageButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MoodDetailScreen;