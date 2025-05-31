import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Image, ScrollView, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import { Animated } from 'react-native';
import FloatingButton from './FloatingButton';
import { io, Socket } from 'socket.io-client';
import Sound from 'react-native-sound';

let typingTimeout: NodeJS.Timeout;
Sound.setCategory('Playback');

const MessageScreen: React.FC = () => {
  const route = useRoute<RouteProp<{ params: { userId: number } }, 'params'>>();
  const navigation = useNavigation();
  const { userId } = route.params;
  const [isSending, setIsSending] = useState(false);
  const sendButtonAnim = useRef(new Animated.Value(0)).current;
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [receiver, setReceiver] = useState<{ id: number; nickname: string } | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const socketRef = useRef<Socket | null>(null);

  const socketInitialized = useRef(false);




useEffect(() => {
  const connectWebSocket = async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token) return;

    const decoded: any = jwtDecode(token);
    const myId = decoded.user_id;

    const ws = new WebSocket('wss://carering.loca.lt/ws'); // Android 에뮬레이터 기준

    ws.onopen = () => {
      console.log('🟢 WebSocket 연결 성공');
      ws.send(JSON.stringify({ room: `user_${myId}` })); // ✅ 반드시 room 정보 전송!
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('📩 WebSocket 수신 메시지:', data);
      setMessages(prev => [...prev, data]);
    };

    ws.onerror = (e) => {
      console.error('❌ WebSocket 오류:', e.message);
    };

    ws.onclose = () => {
      console.log('🔌 WebSocket 연결 종료');
    };
  };

  connectWebSocket();
}, []);

useEffect(() => {
  const testToken = async () => {
    const token = await AsyncStorage.getItem('token');
    console.log('🪪 토큰 확인:', token); // 여기서 null이면 저장 안 된 것
    if (token) {
      const decoded: any = jwtDecode(token);
      console.log('🔍 decoded JWT:', decoded); // 여기서 user_id 나와야 함
    }
  };
  testToken();
}, []);
  const playSendSound = () => {
    const sound = new Sound(require('../../sounds/send.mp3'), Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.log('❌ Failed to load sound', error);
        return;
      }
      sound.play(() => {
        sound.release();
      });
    });
  };
  // WebSocket 연결 코드 제거 - Socket.io만 사용
  useEffect(() => {
    return () => {
      if (socketRef.current && currentUserId) {
        socketRef.current.emit('leave', { room: `user_${currentUserId}` });
        console.log(`👋 Left room: user_${currentUserId}`);
      }
    };
  }, [currentUserId]);
  
  const handleTyping = async (text: string) => {
    setMessage(text);
    const token = await AsyncStorage.getItem('token');
    if (!token || !receiver || !socketRef.current) return;
    console.log("🔼 typing emit 전송:", {
  receiverId: receiver.id,
  senderId: currentUserId,
});
    socketRef.current?.emit("typing", {
  receiverId: receiver.id,
  senderId: currentUserId, // 서버에서 sender도 필요함
});
  };
  // 🔗 WebSocket 연결 (Go 서버용)

 useEffect(() => {
  const connectSocket = async () => {
    if (socketInitialized.current) return;
    socketInitialized.current = true;

    const token = await AsyncStorage.getItem('token');
    if (!token) return;

    const decoded: JwtPayload = jwtDecode(token);
    const myId = decoded.user_id;
    setCurrentUserId(myId);

    const socketInstance = io('https://mycarering.loca.lt', {
      transports: ['websocket'],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socketInstance;

    socketInstance.on('connect', () => {
      console.log('✅ Socket Connected');
      socketInstance.emit('join', { room: `user_${myId}` });
    });

    socketInstance.on('typing', (senderId: number) => {
      if (senderId === receiver?.id) {
        setIsTyping(true);
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => setIsTyping(false), 3000);
      }
    });

    socketInstance.on('message', (msg: MessageResponse) => {
      if (
        msg.sender_id === receiver?.id &&
        msg.receiver_id === currentUserId
      ) {
        setMessages(prev => {
          const exists = prev.some(m => m.message_id === msg.message_id);
          return exists ? prev : [...prev, msg];
        });
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
      }
    });

    socketInstance.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
    });

    socketInstance.io.on('reconnect_attempt', () => {
      console.log('🔁 Reconnecting...');
    });
  };

  connectSocket();

  return () => {
    socketRef.current?.disconnect();
    clearTimeout(typingTimeout);
    socketInitialized.current = false;
  };
}, [receiver]);
useEffect(() => {
  if (receiver && currentUserId !== null) {
    fetchMessages(); // ✅ 재진입 시 자동 메시지 불러오기
  }
}, [receiver, currentUserId]);
  useEffect(() => {
    Animated.timing(sendButtonAnim, {
      toValue: message.trim().length > 0 ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [message]);

  const fetchReceiverInfo = useCallback(async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token) return;
    try {
      const res = await axios.get(`https://mycarering.loca.lt/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReceiver(res.data);
    } catch (e) {
      console.error('❌ 수신자 정보 실패:', e);
    }
  }, [userId]);

  useEffect(() => {
    fetchReceiverInfo();
  }, [fetchReceiverInfo]);

  const fetchMessages = useCallback(async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token || !receiver || currentUserId === null) return;
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const [sentRes, recvRes] = await Promise.all([
        axios.get(`https://mycarering.loca.lt/messages/sent/${receiver.id}`, config),
        axios.get(`https://mycarering.loca.lt/messages/received/${receiver.id}`, config),
      ]);
      const combined = [...sentRes.data, ...recvRes.data].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      setMessages(combined);
    } catch (err) {
      console.error('❌ 메시지 불러오기 실패:', err);
    }
  }, [receiver, currentUserId]);

  const handleSendMessage = async () => {
   const token = await AsyncStorage.getItem('token');
  console.log('🪪 token:', token);
  console.log('👤 currentUserId:', currentUserId);
  console.log('📩 receiver:', receiver);
    if (!token || currentUserId === null || !receiver) {
      Alert.alert('Transmission error', 'Invalid user information.');
      return;
    }
    if (!message.trim()) {
      Alert.alert('Input Error', 'Please enter a message.');
      return;
    }

    setIsSending(true);

    try {
      await axios.post(
        'https://mycarering.loca.lt/messages/send',
        { receiver_id: receiver.id, content: message },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    
      setMessage('');
      playSendSound();
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e: any) {
      console.error('❌ Failed to send message:', e?.response?.data || e.message || e);
    } finally {
      setIsSending(false);
    }
  };

 const formatTime = (isoTime: string) => {
  const date = new Date(isoTime);
  // UTC 기준을 강제로 KST로 보정
  const kstOffset = 9 * 60 * 60 * 1000;
  const localDate = new Date(date.getTime() + kstOffset);

  return localDate.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
         
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? -35 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Image source={require('../../assets/back.png')} style={styles.icon} />
          </TouchableOpacity>
          <View style={styles.userInfo}>
            <Image source={require('../../assets/user-icon.png')} style={styles.avatar} />
            <Text style={styles.username}>{receiver ? receiver.nickname : '...'}</Text>
          </View>
          <Image source={require('../../assets/settings.png')} style={styles.icon} />
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={{ paddingBottom: Platform.select({ ios: 100, android: 80 }), flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg, index) => {
  const isSentByCurrentUser = msg.sender_id === currentUserId;
  const isSameSenderAsNext =
    index < messages.length - 1 && messages[index + 1].sender_id === msg.sender_id;

  // ✅ 이전 메시지와 발신자가 다르면 "첫 메시지"로 판단
  const isFirstInGroup =
    index === 0 || messages[index - 1].sender_id !== msg.sender_id;

  return (
    <View key={msg.id || index}style={{ marginBottom: isSameSenderAsNext ? 2 : 8 }}>
      <View
        style={[
          styles.bubbleContainer,
          isSentByCurrentUser ? styles.sentContainer : styles.receivedContainer,
        ]}
      >
        {/* ⬅️ 왼쪽 꼬리 - 그룹의 첫 메시지일 때만 표시 */}
        {!isSentByCurrentUser && isFirstInGroup && (
          <View style={styles.leftTail} />
        )}

        {/* 💬 말풍선 */}
        <View
          style={[
            styles.bubble,
            isSentByCurrentUser ? styles.sentBubble : styles.receivedBubble,
          ]}
        >
          <Text
            style={[
              styles.bubbleText,
              isSentByCurrentUser ? styles.sentText : styles.receivedText,
            ]}
          >
            {msg.content}
          </Text>
        </View>

        {/* ➡️ 오른쪽 꼬리 - 그룹의 첫 메시지일 때만 표시 */}
        {isSentByCurrentUser && isFirstInGroup && (
          <View style={styles.rightTail} />
        )}
      </View>

      {/* 🕒 그룹 마지막 메시지에만 시간 표시 */}
      {!isSameSenderAsNext && (
        <Text
          style={[
            styles.time,
            isSentByCurrentUser ? styles.timeRight : styles.timeLeft,
          ]}
        >
          {formatTime(msg.timestamp)}
        </Text>
      )}
    </View>
  );
})}

          {isTyping && (
            <View style={styles.typingIndicator}>
              <Text style={styles.typingText}>{receiver?.nickname} is typing...</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          <View style={styles.floatingWrapper}>
       
          </View>
            <FloatingButton />
          <TextInput
            style={styles.textInput}
            value={message}
            onChangeText={handleTyping}
            placeholder="Write a message..."
            placeholderTextColor="#999"
          />
          <Animated.View
  style={{
    opacity: sendButtonAnim,
    transform: [
      {
        scale: sendButtonAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.8, 1],
        }),
      },
    ],
  }}
>
  <TouchableOpacity
    onPress={handleSendMessage}
    disabled={message.trim().length === 0 || isSending}
    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    style={styles.sendButtonWrapper}
    pointerEvents="auto"
  >
    <Image source={require('../../assets/send.png')} style={styles.actionIcon} />
  </TouchableOpacity>
</Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default MessageScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  icon: { width: 35, height: 35, tintColor: '#678CC8' },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 32, height: 32, borderRadius: 16, marginRight: 8 },
  username: { color: '#000000', fontWeight: '700', fontSize: 20 },
  messagesContainer: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  bubbleContainer: {
    maxWidth: '80%',
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  sentContainer: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  receivedContainer: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  bubble: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sentBubble: {
    backgroundColor: '#E5E5EA',
    //borderTopRightRadius: 4, // 더 자연스러운 곡선을 위해
  },
  receivedBubble: {
    backgroundColor: '#678CC8',
    //borderTopLeftRadius: 4, // 더 자연스러운 곡선을 위해
  },
  bubbleText: { fontSize: 16, lineHeight: 22 },
  sentText: { color: '#000' },
  receivedText: { color: '#FFF' },
  time: { fontSize: 11, color: '#777', marginTop: 2, marginHorizontal: 6 },
  timeLeft: { textAlign: 'left' },
  timeRight: { textAlign: 'right' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 5,
    paddingHorizontal: 16,
    marginHorizontal: 12,
    marginBottom: 45,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
    opacity: 0.95,
  },
  textInput: {
    flex: 1,
    paddingLeft: 20,
    paddingRight: 50,
    fontSize: 16,
    color: '#000',
  },
actionIcon: {
  width: 30,
  height: 30,
  resizeMode: 'contain',
},
 sendButtonWrapper: {
  justifyContent: 'center',
  alignItems: 'center',
  alignSelf: 'center',  // ✅ 수직 중앙 정렬
  marginLeft: 8,        // ✅ 입력창 오른쪽에 여백 줌
},
  floatingWrapper: {
    position: 'absolute',
    left: 5,
    top: '50%',
    transform: [{ translateY: Platform.OS === 'ios' ? -4.5 : -4.5 }],
    width: 25,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typingIndicator: {
    alignSelf: 'flex-start',
    marginLeft: 10,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EFEFEF',
    borderRadius: 16,
  },
  typingText: {
    fontSize: 14,
    color: '#666',
  },
leftTail: {
  position: 'absolute',
  left: -8,
  top: 12,
  width: 0,
  height: 0,
  borderTopWidth: 6,
  borderTopColor: 'transparent',
  borderBottomWidth: 6,
  borderBottomColor: 'transparent',
  borderRightWidth: 10,
  borderRightColor: '#678CC8', // 왼쪽 말풍선 배경색
},

rightTail: {
  position: 'absolute',
  right: -8,
  top: 12,
  width: 0,
  height: 0,
  borderTopWidth: 6,
  borderTopColor: 'transparent',
  borderBottomWidth: 6,
  borderBottomColor: 'transparent',
  borderLeftWidth: 10,
  borderLeftColor: '#E5E5EA', // 오른쪽 말풍선 배경색
},
});
