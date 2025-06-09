import React from 'react';
import { View, Image, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';

interface User {
  id: number;
  nickname: string;
  image_url?: string;
  recentMood?: {
    emoji: string;
    phrase: string;
    created_at: string;
  };
  isMe?: boolean;
  name?: string;
}

const MoodStoryItem: React.FC<{ user: User }> = ({ user }) => {
  const navigation = useNavigation();
  const isMe = user.isMe;

const handlePress = () => {
  navigation.navigate('MoodDetail', {
    userId: user.id,
    nickname: user.nickname,
    emoji: user.recentMood?.emoji,
    phrase: user.recentMood?.phrase,
    created_at: user.recentMood?.created_at,
    image_url: user.image_url,
  });
};

  return (
   <TouchableOpacity
  style={styles.itemContainer}
  onPress={user.recentMood ? handlePress : undefined}
>
     <LinearGradient
  colors={['#89CFF0', '#4387E5']} // ✅ 항상 파란 그라데이션
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
  style={styles.gradientBorder}
>
        <View style={styles.innerCircle}>
          {user.image_url ? (
            <>
              <Image
                source={{ uri: `https://mycarering.loca.lt${user.image_url}` }}
                style={styles.profileImage}
              />
              {user.recentMood && (
                <View style={styles.emojiBadge}>
                   <Text style={styles.emojiText}>{user.recentMood.emoji}</Text> 
                </View>
              )}
            </>
          ) : (
            <Text style={styles.bigEmoji}>{user.recentMood?.phrase || '🙂'}</Text>
          )}
        </View>
      </LinearGradient>
      <Text style={styles.label} numberOfLines={1}>
        {user.name || user.nickname || 'You'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  itemContainer: {
    alignItems: 'center',
    marginLeft: 8,
  },
  gradientBorder: {
    width: 60,
    height: 60,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircle: {
    width: 54,
    height: 54,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  profileImage: {
    width: 54,
    height: 54,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  emojiBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 2,
    paddingVertical: 1,
  },
  emojiText: {
    fontSize: 14,
  },
  bigEmoji: {
    fontSize: 28,
  },
  label: {
    marginTop: 4,
    fontSize: 12,
    color: '#333',
    width: 60,
    textAlign: 'center',
  },
});

export default MoodStoryItem;