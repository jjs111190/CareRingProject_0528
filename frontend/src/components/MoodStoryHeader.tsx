import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import MoodStoryItem from './MoodStoryItem';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MoodStoryHeader: React.FC = () => {
  const navigation = useNavigation();
  const [stories, setStories] = useState<any[]>([]);
  const [cooldownTimer, setCooldownTimer] = useState<number | null>(null);
  const [cooldownTime, setCooldownTime] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // 현재 사용자 ID 가져오기
  const getCurrentUserId = async (): Promise<number | null> => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      return userId ? parseInt(userId, 10) : null;
    } catch (error) {
      console.error('Failed to get user ID:', error);
      return null;
    }
  };

  const fetchStories = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const res = await axios.get('https://mycarering.loca.lt/mood/stories', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      let data = res.data;
      if (!Array.isArray(data)) {
        data = data.stories && Array.isArray(data.stories) ? data.stories : [];
      }
      
      setStories(data);
    } catch (err) {
      console.error('Failed to fetch stories:', err);
    }
  };

  // 쿨다운 상태 계산 함수
  const calculateCooldown = (user: any) => {
    if (!user?.recentMood) return null;
    
    const created = new Date(user.recentMood.created_at);
    const now = new Date();
    const diff = created.getTime() + 12 * 60 * 60 * 1000 - now.getTime();
    
    return diff > 0 ? diff : null;
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return { hours, minutes, seconds };
  };

  useEffect(() => {
    // 컴포넌트 마운트 시 초기화
    const init = async () => {
      const userId = await getCurrentUserId();
      setCurrentUserId(userId);
      await fetchStories();
    };

    init();
    
    // 10초마다 새로고침
    const interval = setInterval(fetchStories, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // 쿨다운 상태 업데이트
    if (!currentUserId || stories.length === 0) return;
    
    const me = stories.find(user => user.id === currentUserId);
    if (!me) return;
    
    const diff = calculateCooldown(me);
    setCooldownTimer(diff);
    
    if (diff !== null) {
      setCooldownTime(formatTime(diff));
    }
  }, [stories, currentUserId]);

  useEffect(() => {
    // 쿨다운 타이머 실행
    if (cooldownTimer === null || cooldownTimer <= 0) return;

    const timer = setInterval(() => {
      setCooldownTimer(prev => {
        if (prev === null || prev <= 1000) {
          clearInterval(timer);
          fetchStories(); // 쿨다운 종료 시 데이터 새로고침
          return null;
        }
        const newTime = prev - 1000;
        setCooldownTime(formatTime(newTime));
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldownTimer]);

  // 현재 사용자 정보
  const me = currentUserId 
    ? stories.find(user => user.id === currentUserId)
    : null;

  // 다른 사용자 필터링 (12시간 이내 기분 등록자)
  const others = stories.filter(user => {
    if (user.id === currentUserId) return false;
    if (!user.recentMood) return false;
    
    const created = new Date(user.recentMood.created_at);
    const now = new Date();
    return now.getTime() - created.getTime() < 12 * 60 * 60 * 1000;
  });

  const renderMeBlock = () => {
    // 1. 기분을 등록하지 않은 경우
    if (!me?.recentMood) {
      return (
        <TouchableOpacity 
          onPress={() => navigation.navigate('CreateMood')} 
          style={styles.addContainer}
        >
          <LinearGradient
            colors={['#89CFF0', '#4387E5']}
            style={styles.gradientBorder}
          >
            <View style={styles.innerCircle}>
              <Text style={styles.addIcon}>＋</Text>
            </View>
          </LinearGradient>
          <Text style={styles.label}>condition</Text>
        </TouchableOpacity>
      );
    }

    // 2. 쿨다운 중인 경우
    if (cooldownTimer !== null && cooldownTimer > 0) {
      return (
        <View style={styles.addContainer}>
          <View style={styles.clockContainer}>
            <View style={styles.clockFace}>
              <View style={styles.clockCenter} />
              <View style={[
                styles.clockHand, 
                styles.hourHand,
                { transform: [{ rotate: `${(cooldownTime.hours % 12) * 30 + cooldownTime.minutes * 0.5}deg` }] }
              ]} />
              <View style={[
                styles.clockHand, 
                styles.minuteHand,
                { transform: [{ rotate: `${cooldownTime.minutes * 6}deg` }] }
              ]} />
              <View style={[
                styles.clockHand, 
                styles.secondHand,
                { transform: [{ rotate: `${cooldownTime.seconds * 6}deg` }] }
              ]} />
              {[...Array(12)].map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.clockTick,
                    { transform: [{ rotate: `${i * 30}deg` }] }
                  ]}
                />
              ))}
            </View>
          </View>
          <Text style={styles.cooldownLabel}>Next post</Text>
        </View>
      );
    }

    // 3. 쿨다운 종료 후 기분 등록한 경우
    return <MoodStoryItem user={me} />;
  };

  return (
    <View style={{ paddingVertical: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {renderMeBlock()}
        <FlatList
          horizontal
          data={others}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <MoodStoryItem user={item} />}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 4 }}
        />
      </View>
      <View style={styles.separator} />
    </View>
  );
};


const styles = StyleSheet.create({
  addContainer: {
    alignItems: 'center',
    marginLeft: 8,
    width: 80,
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
  },
  addIcon: {
    fontSize: 28,
    color: '#4387E5',
    lineHeight: 30,
  },
  label: {
    marginTop: 4,
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  separator: {
    marginTop: 8,
    height: 1,
    backgroundColor: '#ddd',
    width: '100%',
    opacity: 0.5,
  },
  cooldownLabel: {
    marginTop: 4,
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
  // 시계 디자인 스타일
  clockContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
  },
  clockFace: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F5F7FC',
    borderWidth: 1,
    borderColor: '#E5E9F2',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  clockCenter: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4A6FA5',
    position: 'absolute',
    zIndex: 10,
  },
  clockHand: {
    position: 'absolute',
    transformOrigin: 'bottom center',
    bottom: '50%',
  },
  hourHand: {
    width: 2.5,
    height: 16,
    backgroundColor: '#4A6FA5',
    borderRadius: 2,
    zIndex: 5,
  },
  minuteHand: {
    width: 2,
    height: 22,
    backgroundColor: '#4A6FA5',
    borderRadius: 2,
    zIndex: 4,
  },
  secondHand: {
    width: 1,
    height: 24,
    backgroundColor: '#FF6B6B',
    borderRadius: 1,
    zIndex: 3,
  },
  clockTick: {
    position: 'absolute',
    width: 1.5,
    height: 4,
    backgroundColor: '#94A3B8',
    top: 3,
    left: '50%',
    marginLeft: -0.75,
  },
});

export default MoodStoryHeader;