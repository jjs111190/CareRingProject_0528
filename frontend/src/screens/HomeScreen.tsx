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
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import axios from 'axios';
import PostCard from '../components/PostCard';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import MoodStoryHeader from '../components/MoodStoryHeader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import IdSearchInput from '../components/IdSearchInput';
import { Easing } from 'react-native';
const { width, height } = Dimensions.get('window');
const HEADER_HEIGHT = 40;

const HomeScreen: React.FC = () => {
  const [posts, setPosts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [stories, setStories] = useState([]);
  const [loadingStories, setLoadingStories] = useState(true);
  const [isSearchModalVisible, setSearchModalVisible] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOffset = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const route = useRoute();

  const translateY = useRef(new Animated.Value(height)).current;
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    if (isSearchModalVisible) {
      setIsMounted(true);
      Animated.timing(translateY, {
        toValue: height * 0.2,
        duration: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: 600,
        duration: 300,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        setIsMounted(false);
      });
    }
  }, [isSearchModalVisible]);

  const SkeletonStoryRow = () => (
    <View style={{ flexDirection: 'row', paddingVertical: 12 }}>
      {[...Array(5)].map((_, idx) => (
        <View
          key={idx}
          style={{
            width: 60,
            height: 60,
            marginLeft: 8,
            borderRadius: 12,
            backgroundColor: '#e0e0e0',
          }}
        />
      ))}
    </View>
  );

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  useFocusEffect(
    useCallback(() => {
      if (route.params?.refresh) {
        setRefreshTrigger(prev => prev + 1);
        navigation.setParams({ refresh: false });
      }
    }, [route.params])
  );

  useEffect(() => {
    const loadCachedStories = async () => {
      try {
        const cached = await AsyncStorage.getItem('cached_stories');
        if (cached) setStories(JSON.parse(cached));
      } catch (err) {
        console.error('❌ 캐시 로딩 실패:', err);
      }
    };

    const fetchStories = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const res = await axios.get('https://mycarering.loca.lt/mood/stories', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStories(res.data);
        await AsyncStorage.setItem('cached_stories', JSON.stringify(res.data));
      } catch (error) {
        console.error('스토리 가져오기 실패:', error);
      } finally {
        setLoadingStories(false);
      }
    };

    loadCachedStories().then(fetchStories);
  }, []);

  useEffect(() => {
    const listenerId = scrollY.addListener(({ value }) => {
      const diff = value - lastScrollY.current;
      if (diff > 0 && value > HEADER_HEIGHT) {
        Animated.timing(headerOffset, {
          toValue: -HEADER_HEIGHT,
          duration: 200,
          useNativeDriver: true,
        }).start();
      } else if (diff < 0) {
        Animated.timing(headerOffset, {
          toValue: 0,
          duration: 150,
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
      const sortedPosts = res.data.sort((a, b) => b.id - a.id);
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

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View
        style={[styles.header, {
          paddingTop: insets.top + 6,
          height: HEADER_HEIGHT + insets.top,
          transform: [{ translateY: headerOffset }],
          opacity: headerOpacity,
        }]}
      >
        <View style={styles.leftSection}>
          <View style={styles.brandContainer}>
            <Image source={require('../../assets/logotext.png')} style={styles.logoImage} resizeMode="contain" />
          </View>
        </View>
        <View style={styles.rightSection}>
          <TouchableOpacity onPress={() => setSearchModalVisible(true)}>
            <Image source={require('../../assets/search.png')} style={styles.icon} />
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
        contentContainerStyle={{ paddingTop: HEADER_HEIGHT + 10, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} progressViewOffset={HEADER_HEIGHT} />}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
      >
        <View style={{ paddingHorizontal: 5, marginBottom: 0 }}>
          {loadingStories ? <SkeletonStoryRow /> : <MoodStoryHeader stories={stories} />}
        </View>
        {posts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Image source={require('../../assets/empty-box.png')} style={styles.emptyImage} />
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
              onDelete={() => setRefreshTrigger(prev => prev + 1)}
              onCommentChange={() => setRefreshTrigger(prev => prev + 1)}
              created_at={post.created_at}
              user_id={post.user_id}
              user_profile_image={post.user?.profile_image}
              hashtags={post.hashtags}
            />
          ))
        )}
      </Animated.ScrollView>

      {isMounted && (
        <Modal transparent visible>
          <TouchableWithoutFeedback onPress={() => setSearchModalVisible(false)}>
            <View style={styles.modalOverlay} />
          </TouchableWithoutFeedback>

          <Animated.View style={[styles.modalContainer, { transform: [{ translateY }] }]}>
            <View style={styles.modalHandle} />
            <IdSearchInput
              onSearch={query => console.log('검색:', query)}
              onCloseModal={() => setSearchModalVisible(false)}
            />
          </Animated.View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    position: 'absolute', top: 0, left: 0, right: 0,
    backgroundColor: '#FFFFFF', flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 0, zIndex: 100, elevation: 0,
  },
  leftSection: { flexDirection: 'row', alignItems: 'center' },
  rightSection: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingRight: 15 },
  brandContainer: { flexDirection: 'row', alignItems: 'center' },
  logoImage: { width: 120, height: 30 },
  icon: { width: 24, height: 24, tintColor: '#4387E5', marginHorizontal: 5 },
  notificationDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: 'red', position: 'absolute', top: -2, right: -2
  },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 250 },
  emptyImage: { width: 120, height: 120, marginBottom: 20, opacity: 0.6 },
  emptyText: { fontSize: 18, color: '#9CA3AF', fontWeight: '600' },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ccc',
    alignSelf: 'center',
    marginBottom: 12,
  },
});

export default HomeScreen;