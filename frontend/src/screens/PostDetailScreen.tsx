import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, StyleSheet, TouchableOpacity,
  FlatList, Alert, ScrollView, SafeAreaView, Platform
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CommentType {
  id: number;
  user_name: string;
  content: string;
  created_at: string;
  user_id: number;
}

interface PostDetail {
  id: number;
  user_name: string;
  image_url?: string;
  likes: number;
  phrase: string;
  hashtags?: string;
  keywords?: string;
  comments: CommentType[];
}

const PostDetailScreen: React.FC = () => {
  const route = useRoute<RouteProp<Record<string, { postId?: number }>, string>>();
  const navigation = useNavigation();

  const postId = route.params?.postId;
  const [postDetail, setPostDetail] = useState<PostDetail | null>(null);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    if (!postId) {
      Alert.alert('Error', '잘못된 접근입니다.');
      navigation.goBack();
      return;
    }

    const fetchData = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const userRes = await axios.get('https://mycarering.loca.lt/users/me', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setCurrentUserId(userRes.data.id);
        }

        const res = await axios.get(`https://mycarering.loca.lt/posts/${postId}`);
        setPostDetail(res.data);
        setComments(res.data.comments || []);
      } catch (error) {
        console.error('❌ Failed to load post details', error);
        Alert.alert('Error', 'Failed to load post');
        navigation.goBack();
      }
    };

    fetchData();
  }, [postId]);

  const handleCommentDelete = async (commentId: number) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.delete(`https://mycarering.loca.lt/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err: any) {
      if (err.response?.status === 403) {
        Alert.alert('Error', '본인의 댓글만 삭제할 수 있습니다.');
      } else if (err.response?.status === 404) {
        Alert.alert('Error', '댓글을 찾을 수 없습니다.');
      } else {
        Alert.alert('Error', '댓글 삭제 실패');
      }
    }
  };

  const renderCommentItem = ({ item }: { item: CommentType }) => (
    <View style={styles.commentRow}>
      <Image
        source={require('../../assets/user-icon.png')}
        style={styles.commentAvatar}
      />
      <View style={styles.commentBody}>
        <Text style={styles.commentAuthor}>{item.user_name}</Text>
        <Text style={styles.commentText}>{item.content}</Text>
        <Text style={styles.commentDate}>{new Date(item.created_at).toLocaleString()}</Text>
      </View>
      {currentUserId === item.user_id && (
        <TouchableOpacity onPress={() => handleCommentDelete(item.id)}>
          <Text style={styles.deleteText}>삭제</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (!postDetail) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Image source={require('../../assets/back.png')} style={styles.backIcon} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.card}>
          <View style={styles.userInfo}>
            <Image
              source={require('../../assets/user-icon.png')}
              style={styles.userAvatar}
            />
            <Text style={styles.userName}>{postDetail.user_name}</Text>
          </View>

          {postDetail.image_url && (
            <Image
              source={{ uri: `https://mycarering.loca.lt${postDetail.image_url}` }}
              style={styles.postImage}
            />
          )}

          <Text style={styles.postContent}>{postDetail.phrase || 'No content provided.'}</Text>

          {postDetail.hashtags && (
            <View style={styles.hashtagContainer}>
              {postDetail.hashtags.split(',').map((tag, index) => (
                <TouchableOpacity key={index} style={styles.hashtag}>
                  <Text style={styles.hashtagText}>#{tag.trim()}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.reactionContainer}>
            <View style={styles.reactionItem}>
              <Image source={require('../../assets/heart.png')} style={styles.reactionIcon} />
              <Text style={styles.reactionCount}>{postDetail.likes ?? 0}</Text>
            </View>
            <View style={styles.reactionItem}>
              <Image source={require('../../assets/comment.png')} style={styles.reactionIcon} />
              <Text style={styles.reactionCount}>{comments.length}</Text>
            </View>
          </View>
        </View>

        <View style={styles.commentSection}>
          <Text style={styles.sectionTitle}>Comments</Text>
          <FlatList
            data={comments}
            scrollEnabled={false}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderCommentItem}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 8,
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    width: 24,
    height: 24,
    tintColor: '#4387E5',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#4387E5',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  postImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#F1F3F5',
  },
  postContent: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333333',
    marginBottom: 16,
  },
  hashtagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  hashtag: {
    backgroundColor: '#F0F7FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  hashtagText: {
    fontSize: 14,
    color: '#4387E5',
    fontWeight: '500',
  },
  reactionContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F1F3F5',
    paddingTop: 16,
    marginTop: 8,
  },
  reactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  reactionIcon: {
    width: 20,
    height: 20,
    marginRight: 6,
    tintColor: '#666666',
  },
  reactionCount: {
    fontSize: 14,
    color: '#666666',
  },
  commentSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  commentBody: {
    flex: 1,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
    marginBottom: 4,
  },
  commentDate: {
    fontSize: 12,
    color: '#999999',
  },
  deleteText: {
    fontSize: 12,
    color: '#E63946',
    fontWeight: '500',
  },
});

export default PostDetailScreen;