import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, Image, StyleSheet, TouchableOpacity, Alert,
  TextInput, ScrollView, Platform, ActivityIndicator, Keyboard
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'; // Import KeyboardAwareScrollView
import { KeyboardAvoidingView } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
interface CommentType {
  
  id: number;
  user_name: string;
  content: string;
  user_id: number;
  created_at: string;
  user_profile_image?: string;
  likes?: number;
  liked_by_current_user?: boolean;
}

interface MessageDetailProps {
  postId: number;
  showCommentsOnly?: boolean;
}

const MessageDetail: React.FC<MessageDetailProps> = ({ postId, showCommentsOnly = false }) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [comments, setComments] = useState<CommentType[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [currentNickname, setCurrentNickname] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  // We'll use KeyboardAwareScrollView's ref directly
  const keyboardAwareScrollViewRef = useRef<KeyboardAwareScrollView>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [commentLikesState, setCommentLikesState] = useState<Record<number, { count: number; liked: boolean }>>({});
  const [sortMode, setSortMode] = useState<'popular' | 'latest'>('popular');
  const [keyboardHeight, setKeyboardHeight] = useState(0); // Still useful for Toast position
  const [receiver, setReceiver] = useState<{ id: number; nickname: string; image_url?: string } | null>(null);
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchComments();
    setRefreshing(false);
  };
const [commentProfiles, setCommentProfiles] = useState<Record<number, string | undefined>>({});

useEffect(() => {
  const fetchAllCommentProfiles = async () => {
    const newProfiles: Record<number, string | undefined> = {};
    await Promise.all(
      comments.map(async (comment) => {
        try {
          const res = await axios.get(`https://mycarering.loca.lt/basic-info/${comment.user_id}`);
          newProfiles[comment.user_id] = res.data.image_url;
        } catch {
          newProfiles[comment.user_id] = undefined;
        }
      })
    );
    setCommentProfiles(newProfiles);
  };

  if (comments.length > 0) fetchAllCommentProfiles();
}, [comments]);
  const showErrorToast = (message: string) => {
    Toast.show({
      type: 'error',
      text1: '오류 발생',
      text2: message,
      position: 'bottom',
      bottomOffset: Platform.OS === 'ios' ? insets.bottom + (keyboardHeight > 0 ? keyboardHeight : 0) + 20 : 100,
      visibilityTime: 3000,
    });
  };

  // const showSuccessToast = (message: string) => {
  //   Toast.show({
  //     type: 'success',
  //     text1: '성공',
  //     text2: message,
  //     position: 'bottom',
  //     bottomOffset: Platform.OS === 'ios' ? insets.bottom + (keyboardHeight > 0 ? keyboardHeight : 0) + 20 : 100,
  //     visibilityTime: 2000,
  //   });
  // };

  useFocusEffect(
    React.useCallback(() => {
      const interval = setInterval(() => {
        fetchComments();
      }, 10000); // 10초마다 새로고침

      return () => clearInterval(interval); // 화면 벗어나면 새로고침 중지
    }, [postId])
  );

  useEffect(() => {
    const fetchUserData = async () => {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        return;
      }
      try {
        const userRes = await axios.get('https://mycarering.loca.lt/users/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCurrentUserId(userRes.data.id);
        setCurrentNickname(userRes.data.nickname);
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        showErrorToast('사용자 데이터를 불러오는데 실패했습니다.');
      }
    };

    fetchUserData();
    fetchComments();
  }, [postId]);

  // Keyboard listeners for Toast position (optional, as KeyboardAwareScrollView handles layout)
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (e) => {
        console.log('🧪 keyboardDidShow', e.endCoordinates.height);
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    const ws = new WebSocket(`wss://mycarering.loca.lt/ws/comments/${postId}`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'new_comment':
          setComments(prev => {
            const isDuplicate = prev.some(c => c.id === data.comment.id);
            if (!isDuplicate) {
              if (sortMode === 'latest') {
                setTimeout(() => {
                  keyboardAwareScrollViewRef.current?.scrollToEnd({ animated: true }); // Use KeyboardAwareScrollView ref
                }, 100);
              }
              return [...prev, data.comment];
            }
            return prev;
          });
          setCommentLikesState(prev => ({
            ...prev,
            [data.comment.id]: {
              count: data.comment.likes || 0,
              liked: data.comment.liked_by_current_user || false,
            },
          }));
          break;

        case 'update_comment':
          setComments(prev => prev.map(comment =>
            comment.id === data.comment.id ? data.comment : comment
          ));
          setCommentLikesState(prev => ({
            ...prev,
            [data.comment.id]: {
              count: data.comment.likes || 0,
              liked: data.comment.liked_by_current_user || false,
            },
          }));
          break;

        case 'delete_comment':
          setComments(prev => prev.filter(comment => comment.id !== data.comment_id));
          setCommentLikesState(prev => {
            const newState = { ...prev };
            delete newState[data.comment_id];
            return newState;
          });
          break;

        case 'like_update':
          setCommentLikesState(prev => ({
            ...prev,
            [data.comment_id]: {
              count: data.likes,
              liked: data.liked_by_current_user
            }
          }));
          break;

        default:
          const newComment = data;
          setComments(prev => {
            const isDuplicate = prev.some(c => c.id === newComment.id);
            if (!isDuplicate) {
              if (sortMode === 'latest') {
                setTimeout(() => {
                  keyboardAwareScrollViewRef.current?.scrollToEnd({ animated: true }); // Use KeyboardAwareScrollView ref
                }, 100);
              }
              return [...prev, newComment];
            }
            return prev;
          });
          setCommentLikesState(prev => ({
            ...prev,
            [newComment.id]: {
              count: newComment.likes || 0,
              liked: newComment.liked_by_current_user || false,
            },
          }));
      }
    };

    ws.onerror = (err) => console.error('WebSocket Error:', err);
    ws.onclose = () => console.log('WebSocket Closed');

    return () => ws.close();
  }, [postId, sortMode]);

  const fetchComments = async () => {
    try {
      const res = await axios.get(`https://mycarering.loca.lt/posts/${postId}`);
      setComments(res.data.comments || []);

      const initialCommentLikes: Record<number, { count: number; liked: boolean }> = {};
      (res.data.comments || []).forEach((comment: CommentType) => {
        initialCommentLikes[comment.id] = {
          count: comment.likes || 0,
          liked: comment.liked_by_current_user || false,
        };
      });
      setCommentLikesState(initialCommentLikes);
    } catch (err) {
      console.error('Failed to fetch comments:', err);
      showErrorToast('댓글을 불러오는데 실패했습니다.');
    }
  };

  const handleInputChange = (text: string) => {
    setCommentInput(text);
  };

  const handleCommentSubmit = async () => {
    if (isCommenting || !commentInput.trim()) return;

    const token = await AsyncStorage.getItem('token');
    if (!token) {
      showErrorToast('로그인이 필요합니다');
      return;
    }

    setIsCommenting(true);
    try {
      await axios.post(
        `https://mycarering.loca.lt/posts/${postId}/comments`,
        { content: commentInput },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        }
      );

      setCommentInput('');
      showSuccessToast('댓글이 등록되었습니다');
      Keyboard.dismiss();

    } catch (err: any) {
      console.error('댓글 제출 실패:', err);
      const errorMessage = err.response?.data?.message
        || err.response?.data?.error
        || '댓글을 제출하지 못했습니다';
      showErrorToast(errorMessage);
    } finally {
      setIsCommenting(false);
    }
  };

  const handleCommentLike = async (commentId: number) => {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      showErrorToast('로그인이 필요합니다');
      return;
    }

    const prevState = commentLikesState[commentId];

    setCommentLikesState(prev => ({
      ...prev,
      [commentId]: {
        count: (prev[commentId]?.count || 0) + (prev[commentId]?.liked ? -1 : 1),
        liked: !prev[commentId]?.liked
      }
    }));

    try {
      if (prevState?.liked) {
        await axios.delete(
          `https://mycarering.loca.lt/comments/${commentId}/like`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post(
          `https://mycarering.loca.lt/comments/${commentId}/like`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    } catch (error: any) {
      console.error("댓글 좋아요 실패:", error.response?.data || error.message);
      showErrorToast('댓글 좋아요에 실패했습니다.');

      setCommentLikesState(prev => ({
        ...prev,
        [commentId]: prevState || {
          count: comments.find(c => c.id === commentId)?.likes || 0,
          liked: comments.find(c => c.id === commentId)?.liked_by_current_user || false
        }
      }));
    }
  };

  const handleCommentDelete = async (commentId: number) => {
    if (isDeleting) return;
    setIsDeleting(true);

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        showErrorToast('로그인이 필요합니다');
        setIsDeleting(false);
        return;
      }

      await axios.delete(`https://mycarering.loca.lt/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      showSuccessToast('댓글이 삭제되었습니다.');
    } catch (err: any) {
      console.error('댓글 삭제 실패:', err.response?.data || err.message);
      showErrorToast('댓글을 삭제하지 못했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCommentLongPress = (comment: CommentType) => {
    if (comment.user_id !== currentUserId) return;

    Alert.alert(
      '댓글 삭제',
      '이 댓글을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => handleCommentDelete(comment.id),
        },
      ],
      { cancelable: true }
    );
  };
const formatKoreanDateTimeInEnglish = (utcDateString: string): string => {
  const date = new Date(utcDateString);
  const kstTime = new Date(date.getTime() + 9 * 60 * 60 * 1000); // KST 보정

  return kstTime.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',     // e.g., "Jun"
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,       // "AM/PM" 형식
    timeZone: 'Asia/Seoul', // 명확하게 서울로 고정
  });
};
  const sortedComments = [...comments]
    .map(comment => ({
      ...comment,
      likeCount: commentLikesState[comment.id]?.count || 0,
      liked_by_current_user: commentLikesState[comment.id]?.liked || false
    }))
    .sort((a, b) => {
      if (sortMode === 'latest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else { // 'popular'
        if (a.likeCount === b.likeCount) {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        }
        return b.likeCount - a.likeCount;
      }
    });

  return (
     <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 250 : 0} // 중요!
  >
    {/* 댓글 헤더 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>comment</Text>
          <View style={styles.placeholder} />
        </View>

        {/* 정렬 탭 */}
        <View style={styles.sortTabsContainer}>
          <TouchableOpacity
            onPress={() => setSortMode('popular')}
            style={[styles.tabButton, sortMode === 'popular' && styles.activeTabButton]}
          >
            <Text style={[styles.tabButtonText, sortMode === 'popular' && styles.activeTabButtonText]}>
              Sort by popularity
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSortMode('latest')}
            style={[styles.tabButton, sortMode === 'latest' && styles.activeTabButton]}
          >
            <Text style={[styles.tabButtonText, sortMode === 'latest' && styles.activeTabButtonText]}>
              Latest
            </Text>
          </TouchableOpacity>
        </View>
  <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'left', 'right']}>
       <KeyboardAwareScrollView
        style={styles.keyboardAwareScrollView}
        contentContainerStyle={styles.keyboardAwareContentContainer}
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={Platform.OS === 'ios' ? 40 : 20}
        enableOnAndroid={true}
        ref={keyboardAwareScrollViewRef}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
      <View style={styles.contentContainer}>
        

        {/* 댓글 리스트 */}
        {sortedComments.length === 0 ? (
          <Text style={styles.noCommentsText}>There are no comments yet.</Text>
        ) : (
          sortedComments.map((comment) => (
            <TouchableOpacity
              key={comment.id}
              onLongPress={() => handleCommentLongPress(comment)}
              delayLongPress={500}
              style={styles.commentItem}
            >
              <TouchableOpacity
                onPress={() => {
                  if (comment.user_id === currentUserId) {
                    navigation.navigate('Profile');
                  } else {
                    navigation.navigate('UserProfile', { userId: comment.user_id });
                  }
                }}
              >
                {/* 댓글 이미지 렌더링 */}
<LinearGradient
  colors={['#7F7FD5', '#86A8E7', '#91EAE4']}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
  style={styles.gradientRing}
>
  <Image
    source={
      commentProfiles[comment.user_id]
        ? { uri: `https://mycarering.loca.lt${commentProfiles[comment.user_id]}` }
        : require('../../assets/user-icon.png')
    }
    style={styles.commentUserIcon}
  />
</LinearGradient>
              </TouchableOpacity>

              <View style={styles.commentContentWrapper}>
                <View style={styles.commentTextAndInfo}>
                  <Text style={styles.commentUserName}>
                    <Text
                      style={{
                        fontWeight: 'bold',
                        color: comment.user_id === currentUserId ? '#4387E5' : '#000',
                      }}
                    >
                      {comment.user_name}
                    </Text>
                  </Text>
                  <Text style={styles.commentContent}>{comment.content}</Text>
                  <Text style={styles.commentTimestamp}>
                    {new Date(comment.created_at).toLocaleString()}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.commentLikeButton}
                  onPress={() => handleCommentLike(comment.id)}
                >
                  <Image
                    source={require('../../assets/heart.png')}
                    style={[
                      styles.commentLikeIcon,
                      { tintColor: comment.liked_by_current_user ? '#e63946' : '#ccc' },
                    ]}
                  />
                  <Text style={styles.commentLikeCount}>{comment.likeCount}</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </KeyboardAwareScrollView>

   
      {/* 댓글 입력창 */}
      <View style={[styles.inputContainer, { paddingBottom: insets.bottom }]}>
        <View style={styles.commentInputWrapper}>
          <TextInput
            style={styles.commentInputField}
            value={commentInput}
            onChangeText={handleInputChange}
            placeholder="Please enter your comment..."
            multiline
            returnKeyType="send"
            onSubmitEditing={handleCommentSubmit}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            onPress={handleCommentSubmit}
            disabled={isCommenting || !commentInput.trim()}
            style={[
              styles.sendButton,
              (isCommenting || !commentInput.trim()) && styles.disabledButton,
            ]}
          >
            {isCommenting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Image source={require('../../assets/send1.png')} style={styles.sendCommentIcon} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* <Toast /> */}
    </SafeAreaView>
  </KeyboardAvoidingView>
);
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
 keyboardAwareScrollView: {
    flex: 1,
  },
  keyboardAwareContentContainer: {
    paddingBottom: 20, // 하단 여백 추가
  },
  contentContainer: {
    flex: 1, // Allows this container to take up available space, pushing input down
    paddingBottom: 10, // Add some padding to the bottom of the scrollable content
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
    width: '100%',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    height: 60, // Keep this defined for consistent header height
  },
  backButton: {
    padding: 5,
  },
  backIcon: {
    width: 24,
    height: 24,
    tintColor: '#333',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 24,
  },
  sortTabsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    width: '100%',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingHorizontal: 0,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: '#4387E5',
  },
  tabButtonText: {
    fontSize: 15,
    color: '#888',
    fontWeight: '500',
  },
  activeTabButtonText: {
    color: '#4387E5',
    fontWeight: 'bold',
  },
  // commentsContainer was the scrollable part, now content is directly in KeyboardAwareScrollView
  commentsContentContainer: { // This is now directly applied to the content INSIDE KeyboardAwareScrollView
    padding: 12,
    paddingBottom: 20, // This padding will be at the very bottom of the scrollable content
  },
  noCommentsText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#888',
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
    paddingVertical: 5,
    backgroundColor: '#fff',
    // borderRadius: 8,
    // paddingHorizontal: 10,
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.0,
    // shadowRadius: 1,
    // elevation: 2,
  },
gradientRing: {
  width: 42, // 아이콘보다 조금 크게
  height: 42,
  borderRadius: 21,
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: 10,
  marginTop: 5,
},

commentUserIcon: {
  width: 35,
  height: 35,
  borderRadius: 17.5,
  backgroundColor: '#fff', // 내부 배경 흰색 처리
},
  commentContentWrapper: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  commentTextAndInfo: {
    flex: 1,
  },
  commentUserName: {
    fontSize: 14,
    marginBottom: 2,
  },
  commentContent: {
    fontSize: 14,
    color: '#333',
    flexShrink: 1,
    marginBottom: 2,
  },
  commentTimestamp: {
    fontSize: 10,
    color: '#888',
  },
  commentLikeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
    padding: 5,
  },
  commentLikeIcon: {
    width: 18,
    height: 18,
    marginRight: 4,
  },
  commentLikeCount: {
    fontSize: 12,
    color: '#666',
  },
 commentInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    maxHeight: 100, // 입력창 최대 높이 제한
  },
  commentSubmitButton: {
    marginLeft: 10,
    backgroundColor: '#4387E5',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  commentSubmitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  commentInputField: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    marginRight: 10,
    backgroundColor: '#f5f5f5',
    maxHeight: 100,
    fontSize: 15,
  },
  sendButton: {
    backgroundColor: '#4387E5',
    borderRadius: 25,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#a0a0a0',
    opacity: 0.7,
  },
  sendCommentIcon: {
    width: 22,
    height: 22,
    tintColor: '#fff',
  },
  
});

export default MessageDetail;