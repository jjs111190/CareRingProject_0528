import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

const UserProfileScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { userId } = route.params as { userId: number };

  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [user, setUser] = useState<any>(null);
  const [basicInfo, setBasicInfo] = useState<any>(null);
  const [lifestyle, setLifestyle] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userId) {
        Alert.alert('Error', '사용자 정보가 없습니다.');
        navigation.goBack();
        return;
      }

      try {
        const token = await AsyncStorage.getItem('token');
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

        const [meRes, userRes, basicRes, lifestyleRes, postRes, followRes] = await Promise.all([
          axios.get(`https://mycarering.loca.lt/users/me`, config),
          axios.get(`https://mycarering.loca.lt/users/${userId}`, config),
          axios.get(`https://mycarering.loca.lt/basic-info/${userId}`),
          axios.get(`https://mycarering.loca.lt/lifestyle/${userId}`),
          axios.get(`https://mycarering.loca.lt/posts/user/${userId}`),
          axios.get(`https://mycarering.loca.lt/follow/${userId}`, config),
        ]);

        setCurrentUserId(meRes.data.id);
        setUser(userRes.data);
        setBasicInfo(basicRes.data);
        setLifestyle(lifestyleRes.data);
        setPosts(postRes.data);
        setFollowerCount(followRes.data.follower_count);
        setFollowingCount(followRes.data.following_count);
        setIsFollowing(followRes.data.is_following);
      } catch (err) {
        Alert.alert('Error', 'Failed to load user profile.');
        console.error(err);
      }
    };

    fetchUserProfile();
  }, [userId]);

  const handleFollowToggle = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.post(`https://mycarering.loca.lt/follow/${userId}`, {}, config);

      setIsFollowing(res.data.is_following);
      setFollowerCount(res.data.follower_count);
    } catch (err) {
      Alert.alert('Error', '팔로우 상태를 변경할 수 없습니다.');
      console.error(err);
    }
  };

  if (!user) return null;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={90}
      >
        <ScrollView style={styles.container}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Image source={require('../../assets/back.png')} style={styles.backIcon} />
          </TouchableOpacity>

          <View style={styles.profileCard}>
                    <LinearGradient
  colors={['#7F7FD5', '#86A8E7', '#91EAE4']}
       start={{ x: 0.25, y: 0 }}
         end={{ x: 0.75, y: 1 }}
         style={styles.gradientRing}
    >
            <Image
              source={basicInfo?.image_url ? { uri: `https://mycarering.loca.lt${basicInfo.image_url}` } : require('../../assets/user-icon.png')}
              style={styles.profileImage}
            />
            </LinearGradient>
            <Text style={styles.userName}>{user.nickname}</Text>
            <Text style={styles.joinDate}>Joined {new Date(user.created_at).toLocaleDateString()}</Text>
            <View style={styles.followRow}>
              <Text style={styles.followText}>Followers: {followerCount}</Text>
              <Text style={styles.followText}>Following: {followingCount}</Text>
            </View>
            {currentUserId !== userId && (
              <TouchableOpacity style={styles.followButton} onPress={handleFollowToggle}>
                <Text style={styles.followButtonText}>{isFollowing ? 'Unfollow' : 'Follow'}</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.sectionBox}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.aboutText}>{user.about || 'No description provided.'}</Text>
          </View>

          <View style={styles.sectionBox}>
            <Text style={styles.sectionTitle}>Health Info</Text>
            {Object.entries(lifestyle || {})
              .filter(([key]) => key !== 'id' && key !== 'user_id')
              .map(([key, value]) => (
                <View key={key} style={styles.infoRow}>
                  <Text style={styles.infoKey}>{key.replace(/_/g, ' ')}</Text>
                  <Text style={styles.infoValue}>{String(value)}</Text>
                </View>
              ))}
          </View>

          <View style={styles.sectionBox}>
            <Text style={styles.sectionTitle}>Posts</Text>
            <View style={styles.postsGrid}>
              {posts.map(post => (
                <TouchableOpacity
                  key={post.id}
                  onPress={() => navigation.navigate('PostDetail', { post })}
                >
                  <Image
                    source={{ uri: `https://mycarering.loca.lt${post.image_url}` }}
                    style={styles.postImage}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA', padding: 20 },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 10 : 20,
    left: 20,
    zIndex: 10,
  },
  backIcon: { width: 24, height: 24 },
  profileCard: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  profileImage: {
  width: 100,
  height: 100,
  borderRadius: 50,
  backgroundColor: '#eee',
},
  userName: { fontSize: 22, fontWeight: '700', color: '#1F2937' },
  joinDate: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  followRow: { flexDirection: 'row', gap: 20, marginTop: 8 },
  followText: { fontSize: 14, color: '#374151' },
  followButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: '#4387E5',
    borderRadius: 20,
  },
  followButtonText: { color: 'white', fontWeight: '600' },
  sectionBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#4387E5', marginBottom: 12 },
  aboutText: { fontSize: 15, color: '#374151', lineHeight: 22 },
  infoRow: { marginBottom: 10 },
  infoKey: { fontSize: 14, color: '#4B5563', fontWeight: '600', marginBottom: 2 },
  infoValue: { fontSize: 15, color: '#111827' },
  postsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  postImage: { width: '30%', aspectRatio: 1, borderRadius: 12, backgroundColor: '#E5E7EB' },
  gradientRing: {
  width: 108,
  height: 108,
  borderRadius: 54,
  alignItems: 'center',
  justifyContent: 'center',
  padding: 3,
  backgroundColor: '#fff', // 내부 여백 대비용
},
});

export default UserProfileScreen;
