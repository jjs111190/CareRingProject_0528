import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, StyleSheet, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, TextInput, Alert, RefreshControl
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useNavigation, useRoute } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';

interface Post {
  id: number;
  image_url: string;
  likes: number;
}

const ProfileScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const [userId, setUserId] = useState<number | null>(null);
  const [nickname, setNickname] = useState('');
  const [about, setAbout] = useState('');
  const [editingAbout, setEditingAbout] = useState(false);
  const [newAbout, setNewAbout] = useState('');
  const [healthInfo, setHealthInfo] = useState<any>({});
  const [posts, setPosts] = useState<Post[]>([]);
  const [joinText, setJoinText] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfileData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const meRes = await axios.get(`https://mycarering.loca.lt/users/me`, config);
      const meId = meRes.data.id;

      let finalUserId: number;
      let isMe = false;

      if ((route.params as any)?.userId) {
        finalUserId = (route.params as any).userId;
        isMe = finalUserId === meId;
      } else {
        finalUserId = meId;
        isMe = true;
      }

      setUserId(finalUserId);

      const followUrl = isMe
        ? `https://mycarering.loca.lt/follow/me`
        : `https://mycarering.loca.lt/follow/${finalUserId}`;

      const [userRes, lifestyleRes, basicInfoRes, postRes, followRes] = await Promise.all([
        axios.get(`https://mycarering.loca.lt/users/${finalUserId}`, config),
        axios.get(`https://mycarering.loca.lt/lifestyle/${finalUserId}`, config),
        axios.get(`https://mycarering.loca.lt/basic-info/${finalUserId}`, config),
        axios.get(`https://mycarering.loca.lt/posts/user/${finalUserId}`, config),
        axios.get(followUrl, config)
      ]);

      const basicInfo = basicInfoRes.data;
      const user = userRes.data;
      setNickname(basicInfo.name || user.nickname || '');
      setAbout(user.about || '');

      const joinDate = new Date(user.created_at);
      setJoinText(joinDate.toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      }));

      setHealthInfo(lifestyleRes.data);

      const relativePath = basicInfoRes.data.image_url;
      if (relativePath) {
        setImageUrl(`https://mycarering.loca.lt${relativePath}`);
      }

      setPosts(postRes.data || []);
      setFollowerCount(followRes.data.follower_count || 0);
      setFollowingCount(followRes.data.following_count || 0);
    } catch (e: any) {
      console.error('🔴 Profile fetch error:', e?.response?.config?.url || 'No URL');
      console.error('🔴 Response data:', e?.response?.data);
      Alert.alert('Error', 'Failed to load profile. Please try again.');
    }
  };

  const wait = (timeout: number) => {
    return new Promise(resolve => setTimeout(resolve, timeout));
  };

  const onRefresh = () => {
    setRefreshing(true);
    Promise.all([
      fetchProfileData(),
      wait(3000),
    ]).finally(() => setRefreshing(false));
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const handleSaveAbout = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const res = await axios.put(
        'https://mycarering.loca.lt/users/me',
        { about: newAbout },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.status === 200 || res.status === 204) {
        setAbout(newAbout);
        setEditingAbout(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update About section');
    }
  };

  // 챗버블 누르면 채팅 화면으로 이동
  const handleChatPress = () => {
    if (userId !== null) {
      navigation.navigate('ChatScreen', { userId });
    } else {
      Alert.alert('Error', 'User ID is missing.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, paddingTop: Platform.OS === 'ios' ? 40 : 0 }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>MY Profile</Text>
          <View style={styles.iconGroup}>
            <TouchableOpacity onPress={handleChatPress}>
              <Image source={require('../../assets/chatbubble.png')} style={styles.iconImage} />
            </TouchableOpacity>
            <Image source={require('../../assets/settings.png')} style={styles.iconImage} />
          </View>
        </View>

        <View style={styles.profileCard}>
          <LinearGradient
            colors={['#7F7FD5', '#86A8E7', '#91EAE4']}
            style={{ borderRadius: 55, padding: 3 }}
          >
          <Image
            source={imageUrl ? { uri: imageUrl } : require('../../assets/user-icon.png')}
            style={styles.profileImage}
          />
          </LinearGradient>
          <Text style={styles.userName}>{nickname}</Text>
          <Text style={styles.joinDate}>Joined {joinText} • Student</Text>
          <View style={styles.statsContainer}>
            <TouchableOpacity style={styles.statItem}>
              <Text style={styles.statNumber}>{followerCount}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statItem}>
              <Text style={styles.statNumber}>{followingCount}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionBox}>
          <View style={styles.aboutHeader}>
            <Text style={styles.sectionTitle}>About</Text>
            {about && !editingAbout && (
              <TouchableOpacity onPress={() => {
                setNewAbout(about);
                setEditingAbout(true);
              }}>
                <Image source={require('../../assets/edit.png')} style={styles.editIcon} />
              </TouchableOpacity>
            )}
          </View>
          {editingAbout ? (
            <>
              <TextInput
                style={[styles.aboutText, { borderBottomWidth: 1, borderColor: '#678CC8', paddingVertical: 6 }]}
                value={newAbout}
                onChangeText={setNewAbout}
                multiline
                placeholder="Write something about yourself"
                placeholderTextColor="#AAA"
              />
              <TouchableOpacity onPress={handleSaveAbout}>
                <Text style={{ color: '#678CC8', marginTop: 8, textAlign: 'right' }}>Save</Text>
              </TouchableOpacity>
            </>
          ) : about ? (
            <Text style={styles.aboutText}>{about}</Text>
          ) : (
            <TouchableOpacity onPress={() => {
              setEditingAbout(true);
              setNewAbout('');
            }}>
              <Text style={{ fontSize: 30, color: '#678CC8', textAlign: 'center' }}>+</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.sectionBox}>
          <Text style={styles.sectionTitle}>My Health Information</Text>
          {Object.entries(healthInfo)
            .filter(([key]) => key !== 'id' && key !== 'user_id')
            .map(([key, value]) => (
              value && (
                <View style={styles.infoItem} key={key}>
                  <Text style={styles.infoTitle}>{key.replace(/_/g, ' ')}</Text>
                  <Text style={styles.infoContent}>{String(value)}</Text>
                </View>
              )
            ))}
        </View>

        <View style={styles.sectionBox}>
          <Text style={styles.sectionTitle}>Post</Text>
          <View style={styles.postsGrid}>
            {posts.map((post) => (
              <TouchableOpacity
                key={post.id}
                style={styles.postItem}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('PostDetail', { postId: post.id })}
              >
                <Image
                  source={{ uri: `https://mycarering.loca.lt${post.image_url}` }}
                  style={styles.postImage}
                />
                <View style={styles.postOverlay}>
                  <Image source={require('../../assets/heart.png')} style={styles.postIcon} />
                  <Text style={styles.postLikes}>{post.likes}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#678CC8' },
  iconGroup: { flexDirection: 'row' },
  iconImage: { width: 24, height: 24, marginLeft: 15, tintColor: '#678CC8' },
  profileCard: { backgroundColor: 'white', borderRadius: 15, padding: 20, alignItems: 'center', marginBottom: 20 },
  profileImageWrapper: {
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 10,
},

gradientRing: {
  width: 108,        // 이미지보다 약간 크게
  height: 108,
  borderRadius: 54,
  alignItems: 'center',
  justifyContent: 'center',
  padding: 3,        // 링 두께
},

profileImage: {
  width: 100,
  height: 100,
  borderRadius: 50,
  backgroundColor: '#eee',
},
  userName: { fontSize: 20, fontWeight: 'bold', marginBottom: 5 },
  joinDate: { color: '#999', marginBottom: 15 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-around', width: '100%' },
  statItem: { alignItems: 'center' },
  statNumber: { fontWeight: 'bold', fontSize: 18, color: '#678CC8' },
  statLabel: { color: '#999' },
  sectionBox: { backgroundColor: 'white', borderRadius: 15, padding: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, color: '#678CC8' },
  aboutHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  editIcon: { width: 20, height: 20, tintColor: '#678CC8' },
  aboutText: { fontSize: 16, lineHeight: 24, color: '#333' },
  infoItem: { marginBottom: 10 },
  infoTitle: { fontWeight: 'bold', fontSize: 16, color: '#678CC8' },
  infoContent: { fontSize: 14, color: '#555' },
  postsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  postItem: { width: '48%', marginBottom: 15, borderRadius: 15, overflow: 'hidden', backgroundColor: '#eee' },
  postImage: { width: '100%', height: 150 },
  postOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  postIcon: { width: 14, height: 14, tintColor: 'white', marginRight: 4 },
  postLikes: { color: 'white', fontSize: 12 },
});

export default ProfileScreen;
