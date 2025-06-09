import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Keyboard,
  FlatList,
  Text,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';

interface SearchResult {
  id: number | string;
  nickname?: string;
  phrase?: string;
  type: 'user' | 'post';
}

interface SearchInputProps {
  style?: StyleProp<ViewStyle>;
  recentSearches?: string[];
  onCloseModal?: () => void;
}

const IdSearchInput: React.FC<SearchInputProps> = ({ style, recentSearches = [], onCloseModal }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const fetchSearchResults = async (query: string) => {
    try {
      const res = await axios.get(`https://mycarering.loca.lt/search?query=${encodeURIComponent(query)}`);
      const merged = (res.data.results || []).map((item: any) => {
        if (item.type === 'user') {
          return { id: item.id, nickname: item.nickname, type: 'user' };
        } else if (item.type === 'post') {
          return { id: item.id, phrase: item.phrase, type: 'post' };
        } else return null;
      }).filter(Boolean);
      setSearchResults(merged);
    } catch (error) {
      console.error('❌ 검색 실패:', error);
      setSearchResults([]);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      fetchSearchResults(searchQuery.trim());
      setIsFocused(true);
    }
    Keyboard.dismiss();
  };

  const clearInput = () => {
    setSearchQuery('');
    setSearchResults([]);
    Keyboard.dismiss();
  };

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.inputContainer, isFocused && styles.focusedInput]}>
        <Image source={require('../../assets/search.png')} style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          placeholder="Search ID, username or posts..."
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            if (searchQuery.length === 0) setTimeout(() => setIsFocused(false), 100);
          }}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          onSubmitEditing={handleSearch}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={clearInput} style={styles.clearButton}>
            <Image source={require('../../assets/close.png')} style={styles.clearIcon} />
          </TouchableOpacity>
        )}
      </View>

      {isFocused && searchResults.length > 0 && (
        <View style={styles.dropdownContainer}>
          <FlatList
            data={searchResults}
            keyExtractor={(item) => `result-${item.type}-${String(item.id)}`}
            renderItem={({ item }) => {
              const handlePress = () => {
                setIsFocused(false);
                Keyboard.dismiss();
                onCloseModal?.();
                if (item.type === 'user') {
                  navigation.navigate('UserProfile', { userId: item.id });
                } else if (item.type === 'post') {
                  navigation.navigate('PostDetail', { postId: item.id });
                }
              };

              return (
                <TouchableOpacity style={styles.resultItem} onPress={handlePress}>
                  <View style={item.type === 'user' ? styles.userIcon : styles.postIcon}>
                    <Image
                      source={
                        item.type === 'user'
                          ? require('../../assets/user-icon.png')
                          : require('../../assets/post.png')
                      }
                      style={styles.icon}
                    />
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={styles.resultName}>
                      {item.type === 'user' ? item.nickname : 'Post'}
                    </Text>
                    <Text
                      style={item.type === 'user' ? styles.resultId : styles.resultPhrase}
                      numberOfLines={1}
                    >
                      {item.type === 'user' ? `@${item.id}` : item.phrase}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={() => <Text style={styles.noResult}>No results found</Text>}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'flex-start', // ✅ 검색창을 위로 붙이기
    backgroundColor: '#fff',
  },
  inputContainer: {
    marginTop: 0, // ✅ 완전 상단 붙이기
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  focusedInput: {
    borderColor: '#3b82f6',
    backgroundColor: '#ffffff',
    shadowColor: '#3b82f6',
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  searchIcon: {
    width: 20,
    height: 20,
    tintColor: '#9ca3af',
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    padding: 0,
    fontWeight: '500',
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  clearIcon: {
    width: 18,
    height: 18,
    tintColor: '#9ca3af',
  },
  dropdownContainer: {
    width: '100%',
    maxWidth: 400,
    maxHeight: 300,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginTop: 20,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  resultItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userIcon: {
    backgroundColor: '#dbeafe',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  postIcon: {
    backgroundColor: '#f0fdf4',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    width: 20,
    height: 20,
    tintColor: '#3b82f6',
  },
  textContainer: {
    flex: 1,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  resultId: {
    fontSize: 14,
    color: '#6b7280',
  },
  resultPhrase: {
    fontSize: 14,
    color: '#6b7280',
  },
  separator: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginHorizontal: 16,
  },
  noResult: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 16,
    padding: 20,
    fontWeight: '500',
  },
});

export default IdSearchInput;