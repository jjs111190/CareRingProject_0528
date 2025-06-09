import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, FlatList, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
interface User {
  id: number;
  nickname: string;
  profile_image?: string;
  is_following: boolean;
  is_follower: boolean;
}

const CreateMessagesScreen = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [tab, setTab] = useState<'favorites' | 'recent' | 'new'>('favorites');

  const navigation = useNavigation();

  useEffect(() => {
  const fetchUsers = async () => {
    const token = await AsyncStorage.getItem("token");
    if (!token) return;
    const config = { headers: { Authorization: `Bearer ${token}` } };

    try {
      let res;
      if (tab === "new") {
        res = await axios.get("https://mycarering.loca.lt/messages/available-users/mutual", config);
      } else {
        res = await axios.get("https://mycarering.loca.lt/messages/available-users/mutual", config);
      }
      setUsers(res.data);
    } catch (e) {
      console.error("🔴 사용자 목록 불러오기 실패:", e);
     
    }
  };

  fetchUsers();
}, [tab]);

  const toggleFavorite = async (userId: number) => {
    const token = await AsyncStorage.getItem("token");
    const config = { headers: { Authorization: `Bearer ${token}` } };

    try {
      if (favorites.includes(userId)) {
        await axios.delete(`https://mycarering.loca.lt/favorites/${userId}`, config);
        setFavorites(prev => prev.filter(id => id !== userId));
      } else {
        await axios.post(`https://mycarering.loca.lt/favorites`, { favorite_user_id: userId }, config);
        setFavorites(prev => [...prev, userId]);
      }
    } catch (err) {
      console.error("즐겨찾기 처리 실패:", err);
    }
  };

  const startChat = (userId: number) => {
    navigation.navigate('MessageScreen', { userId });
  };

  const renderItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => startChat(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.profileContainer}>
        {item.profile_image ? (
          <Image
            source={{ uri: `https://mycarering.loca.lt${item.profile_image}` }}
            style={styles.profileImage}
          />
        ) : (
          <View style={styles.defaultProfile}>
            <Text style={styles.profileText}>{item.nickname.charAt(0)}</Text>
          </View>
        )}
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.username}>{item.nickname}</Text>
        <Text style={styles.startChatText}>Send message</Text>
      </View>

      <TouchableOpacity style={styles.starButton} onPress={() => toggleFavorite(item.id)}>
        <Image
          source={
            favorites.includes(item.id)
              ? require('../../assets/star-filled.png')
              : require('../../assets/star-outline.png')
          }
          style={styles.starIcon}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const filteredUsers = users.filter(user => {
    if (tab === 'favorites') return favorites.includes(user.id);
    if (tab === 'recent') return true;
    if (tab === 'new') return user.is_following && user.is_follower;
    return true;
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Image source={require('../../assets/back.png')} style={styles.backIcon} />
          </TouchableOpacity>
          <Text style={styles.title}>Choose your contacts</Text>
          <View style={{ width: 34 }} />
        </View>
        <View style={styles.tabBar}>
          <TouchableOpacity onPress={() => setTab('favorites')}>
            <Text style={[styles.tabText, tab === 'favorites' && styles.tabTextActive]}>
              Favorites
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setTab('recent')}>
            <Text style={[styles.tabText, tab === 'recent' && styles.tabTextActive]}>
              Recent Chats
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setTab('new')}>
            <Text style={[styles.tabText, tab === 'new' && styles.tabTextActive]}>
              Follow
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {filteredUsers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Image source={require('../../assets/group.png')} style={styles.emptyIcon} />
          <Text style={styles.emptyText}>The list is empty</Text>
          <Text style={styles.emptySubtext}>Start a conversation with your users first</Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
        />
      )}
   </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16
  },
  backButton: { padding: 4 },
  backIcon: { width: 24, height: 24, tintColor: '#000' },
  title: { fontSize: 20, fontWeight: '700', color: '#4387E5' },
  tabBar: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee'
  },
  tabText: { fontSize: 14, color: '#888' },
  tabTextActive: { fontWeight: 'bold', color: '#4387E5' },
  userItem: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    borderBottomWidth: 1, borderBottomColor: '#eee'
  },
  profileContainer: { marginRight: 16 },
  profileImage: { width: 50, height: 50, borderRadius: 25 },
  defaultProfile: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center'
  },
  profileText: { fontSize: 20, fontWeight: '600', color: '#6c757d' },
  textContainer: { flex: 1 },
  username: { fontSize: 16, fontWeight: '500', color: '#000', marginBottom: 4 },
  startChatText: { fontSize: 14, color: '#8e8e93' },
  starButton: { paddingHorizontal: 8 },
  starIcon: { width: 25, height: 25, tintColor: '#000000' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 80 },
  emptyIcon: { width: 100, height: 100, marginBottom: 20, opacity: 0.3 },
  emptyText: { fontSize: 16, color: '#8e8e93', fontWeight: '500', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#c7c7cc' },
});

export default CreateMessagesScreen;