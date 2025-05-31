import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  Pressable
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import NoDataImage from '../../assets/empty-chat.png'; // 적절한 경로의 이미지 사용

const { width: windowWidth } = Dimensions.get('window');
const TABS = ['All Chats', 'Groups', 'Contacts'];

const TabScreen = ({ menus, contents }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const tabWidth = windowWidth / menus.length;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: selectedIndex * tabWidth,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [selectedIndex]);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.tabsContainer}>
        <Animated.View
          style={[
            styles.animatedUnderline,
            {
              transform: [{ translateX: animatedValue }],
              width: tabWidth,
            },
          ]}
        />
        {menus.map((label, index) => (
          <Pressable
            key={label}
            style={styles.tabPressable}
            onPress={() => setSelectedIndex(index)}
          >
            <Text style={[styles.tabText, selectedIndex === index && styles.activeTabText]}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={{ flex: 1 }}>{contents[selectedIndex]}</View>
    </View>
  );
};

const ChatScreen = () => {
  const [users, setUsers] = useState([]);
  const navigation = useNavigation();

  const fetchMessageUsers = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get('https://mycarering.loca.lt/messages/users', config);
      setUsers(res.data);
    } catch (e) {
      console.error('🔴 API 호출 실패:', e.response?.data || e.message);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    fetchMessageUsers();
  }, [fetchMessageUsers]));

  useEffect(() => {
    const interval = setInterval(fetchMessageUsers, 5000);
    return () => clearInterval(interval);
  }, [fetchMessageUsers]);

  const handleDeleteChat = async (userId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.delete(`https://mycarering.loca.lt/messages/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(users.filter(user => user.user_id !== userId));
    } catch (e) {
      console.error('❌ 삭제 실패:', e);
    }
  };

  const markAsRead = async (userId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      // 백엔드에 맞는 읽음 처리 API 경로로 수정 필요
      await axios.post(
        `https://mycarering.loca.lt/messages/${userId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.user_id === userId ? { ...user, unread_count: 0 } : user
        )
      );
    } catch (e) {
      console.error('❌ 읽음 처리 실패:', e);
    }
  };

  const renderRightActions = (progress, dragX, userId) => (
    <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteChat(userId)}>
      <Image source={require('../../assets/delete-comment.png')} style={styles.deleteIcon} />
    </TouchableOpacity>
  );

  const EmptyPlaceholder = ({ message }) => (
    <View style={styles.emptyPlaceholder}>
      <Image source={NoDataImage} style={styles.emptyImage} />
      <Text style={styles.emptyTextMessage}>{message}</Text>
    </View>
  );

  const ChatContent = users.length === 0 ? (
    <View style={{ flex: 1 }}>
      <EmptyPlaceholder message="There are no users in the conversation." />
    </View>
  ) : (
    <ScrollView style={{ marginTop: 10 }}>
      {users.map((user, idx) => (
        <Swipeable
          key={idx}
          renderRightActions={(progress, dragX) =>
            renderRightActions(progress, dragX, user.user_id)
          }
          friction={2}
          rightThreshold={40}
        >
          <TouchableOpacity
            style={styles.messageItem}
            onPress={async () => {
              await markAsRead(user.user_id);
              navigation.navigate('MessageScreen', { userId: user.user_id });
            }}
          >
            <View style={{ position: 'relative' }}>
              <Image
                source={
                  user.profile_image
                    ? { uri: `https://mycarering.loca.lt${user.profile_image}` }
                    : require('../../assets/user-icon.png')
                }
                style={styles.profileImage}
              />
              {user.unread_count > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{user.unread_count}</Text>
                </View>
              )}
            </View>
            <View style={styles.messageInfo}>
              <View style={styles.messageHeader}>
                <Text style={styles.username}>{user.username}</Text>
                <Text style={styles.time}>{user.time}</Text>
              </View>
              <Text style={styles.content}>{user.last_message}</Text>
            </View>
          </TouchableOpacity>
        </Swipeable>
      ))}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image source={require('../../assets/back.png')} style={styles.icon} />
        </TouchableOpacity>
        <View style={styles.topBarCenter}>
          <Text style={styles.topBarGreeting}>Hello..</Text>
          <Text style={styles.topBarName}>user name</Text>
        </View>
        <TouchableOpacity>
          <Image source={require('../../assets/search1.png')} style={styles.icon} />
        </TouchableOpacity>
      </View>
      <TabScreen
        menus={TABS}
        contents={[
          ChatContent,
          <EmptyPlaceholder message="There are no groups yet." />,
          <EmptyPlaceholder message="There are no contacts yet." />
        ]}
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateMessagesScreen')}
      >
        <Image source={require('../../assets/create.png')} style={styles.fabIcon} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 50,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  topBarCenter: {
    alignItems: 'center',
  },
  topBarGreeting: {
    fontSize: 14,
    color: '#888',
  },
  topBarName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
  },
  icon: {
    width: 24,
    height: 24,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    position: 'relative',
  },
  animatedUnderline: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#678CC8',
    bottom: 0,
    left: 0,
  },
  tabPressable: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    color: '#888',
  },
  activeTabText: {
    color: '#678CC8',
    fontWeight: 'bold',
  },
  messageItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  profileImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginRight: 12,
  },
  messageInfo: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  username: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#000',
  },
  time: {
    fontSize: 12,
    color: '#aaa',
  },
  content: {
    fontSize: 13,
    color: '#555',
    marginTop: 4,
  },
  badge: {
    position: 'absolute',
    right: -4,
    top: -4,
    backgroundColor: '#FF4D4D',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#FF4D4D',
    justifyContent: 'center',
    alignItems: 'center',
    width: 70,
    height: '100%',
  },
  deleteIcon: {
    width: 24,
    height: 24,
    tintColor: '#fff',
  },
  emptyPlaceholder: {
    flex: 1,
    alignItems: 'center',
    marginTop: 120,
  },
  emptyImage: {
    width: 130,
    height: 130,
    marginBottom: 16,
  },
  emptyTextMessage: {
    color: '#B1B1B1',
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 40,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#678CC8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabIcon: {
    width: 28,
    height: 28,
    tintColor: '#fff',
  },
});

export default ChatScreen;
