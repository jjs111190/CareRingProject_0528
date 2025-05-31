import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Image,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import axios from 'axios';
import PostCard from '../components/PostCard';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const HEADER_HEIGHT = 40;

interface User {
  id: number;
  nickname: string;
  profile_image?: string;
}

interface Post {
  id: number;
  user_name: string;
  phrase: string;
  image_url?: string;
  created_at?: string;
  user_id: number;
  user?: User; // ✅ user 객체 추가 (이게 빠져 있으면 undefined로 나옴)
  hashtags?: string[]; // Added hashtags to the Post interface
}

const HomeScreen: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOffset = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    const listenerId = scrollY.addListener(({ value }) => {
      const diff = value - lastScrollY.current;

      // When scrolling down, hide the header
      if (diff > 0 && value > HEADER_HEIGHT) { // Only hide if scrolling down significantly
        Animated.timing(headerOffset, {
          toValue: -HEADER_HEIGHT,
          duration: 200, // Faster hide duration
          useNativeDriver: true,
        }).start();
      } 
      // When scrolling up, show the header faster
      else if (diff < 0) { // Show on any scroll up
        Animated.timing(headerOffset, {
          toValue: 0,
          duration: 150, // Even faster show duration
          useNativeDriver: true,
        }).start();
      }
      lastScrollY.current = value;
    });
    return () => scrollY.removeListener(listenerId);
  }, []);

  const fetchPosts = useCallback(async () => {
    try {
      const res = await axios.get('https://mycarering.loca.lt/posts');
      const sortedPosts = res.data.sort((a: Post, b: Post) => b.id - a.id);
      setPosts(sortedPosts);
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts, refreshTrigger]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  };

  const handlePostUpdated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 6,
            height: HEADER_HEIGHT + insets.top,
            transform: [{ translateY: headerOffset }],
            opacity: headerOpacity,
          },
        ]}
      >
        <View style={styles.leftSection}>
          <View style={styles.brandContainer}>
            <Text style={styles.logoText}>CareRing</Text>
          </View>
        </View>
        <View style={styles.rightSection}>
          <TouchableOpacity onPress={() => navigation.navigate('ChatScreen')}>
            <Image source={require('../../assets/chatbubble.png')} style={styles.icon} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
            <Image source={require('../../assets/bell.png')} style={styles.icon} />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: HEADER_HEIGHT + 10,
          paddingBottom: 100,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            progressViewOffset={HEADER_HEIGHT}
          />
        }
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        {posts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Image
              source={require('../../assets/empty-box.png')}
              style={styles.emptyImage}
            />
            <Text style={styles.emptyText}>There are no posts yet.</Text>
          </View>
        ) : (
          posts.map(post => (
            <PostCard
              key={post.id}
              id={post.id}
              image={post.image_url}
              text={post.phrase}
              user={post.user_name}
              onDelete={handlePostUpdated}
              onCommentChange={handlePostUpdated}
              created_at={post.created_at}
              user_id={post.user_id}
              user_profile_image={post.user?.profile_image}
              hashtags={post.hashtags}
            />
          ))
        )}
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 100,
    elevation: 0,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
 
  logoText: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#678CC8',
  },
  icon: {
    width: 24,
    height: 24,
    tintColor: '#678CC8',
    marginHorizontal: 10,
  },
  notificationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'red',
    position: 'absolute',
    top: -2,
    right: -2,
  },
  emptyContainer: {
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  paddingTop: 250,
},
emptyImage: {
  width: 120,
  height: 120,
  marginBottom: 20,
  opacity: 0.6,
},
emptyText: {
  fontSize: 18,
  color: '#9CA3AF',
  fontWeight: '600',
},
});

export default HomeScreen;