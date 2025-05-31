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

interface SearchResult {
  id: string;
  name: string;
}

interface SearchInputProps {
  style?: StyleProp<ViewStyle>;
  onSearch: (query: string) => void;
  recentSearches?: string[];
}

const IdSearchInput: React.FC<SearchInputProps> = ({
  style,
  onSearch,
  recentSearches = [],
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // 임시 검색 결과 데이터
  const [searchResults] = useState<SearchResult[]>([
    { id: 'user_001', name: 'John Doe' },
    { id: 'user_002', name: 'Jane Smith' },
    { id: 'user_003', name: 'Alex Johnson' },
  ]);

  const handleSearch = () => {
    Keyboard.dismiss();
    onSearch(searchQuery);
  };

  const clearInput = () => {
    setSearchQuery('');
    Keyboard.dismiss();
  };

  return (
    <View style={[styles.container, style]}>
      {/* 검색 입력 영역 */}
      <View style={[styles.inputContainer, isFocused && styles.focusedInput]}>
        <Image
          source={require('../../assets/search.png')}
          style={styles.searchIcon}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Search ID or username..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />

        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={clearInput} style={styles.clearButton}>
            <Image
              source={require('../../assets/close.png')}
              style={styles.clearIcon}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* 검색 결과/추천 드롭다운 */}
      {(isFocused || searchQuery.length > 0) && (
        <View style={styles.dropdownContainer}>
          {searchQuery.length > 0 ? (
            <>
              {/* 검색 결과 리스트 */}
              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.resultItem}
                    onPress={() => setSearchQuery(item.id)}
                  >
                    <Text style={styles.resultId}>{item.id}</Text>
                    <Text style={styles.resultName}>{item.name}</Text>
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => (
                  <View style={styles.separator} />
                )}
              />
            </>
          ) : (
            /* 최근 검색 기록 */
            <FlatList
              data={recentSearches}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.recentItem}
                  onPress={() => setSearchQuery(item)}
                >
                  <Image
                    source={require('../../assets/history.png')}
                    style={styles.historyIcon}
                  />
                  <Text style={styles.recentText}>{item}</Text>
                </TouchableOpacity>
              )}
              ListHeaderComponent={
                <Text style={styles.sectionTitle}>Recent searches</Text>
              }
            />
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
    zIndex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  focusedInput: {
    borderColor: '#94a3b8',
    backgroundColor: '#ffffff',
  },
  searchIcon: {
    width: 20,
    height: 20,
    tintColor: '#94a3b8',
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#0f172a',
    padding: 0,
    includeFontPadding: false,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  clearIcon: {
    width: 18,
    height: 18,
    tintColor: '#94a3b8',
  },
  dropdownContainer: {
    position: 'absolute',
    top: '100%',
    width: '100%',
    maxHeight: 300,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    paddingVertical: 8,
  },
  resultItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  resultId: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0f172a',
  },
  resultName: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  separator: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    paddingHorizontal: 16,
    paddingVertical: 8,
    textTransform: 'uppercase',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  historyIcon: {
    width: 16,
    height: 16,
    tintColor: '#64748b',
    marginRight: 12,
  },
  recentText: {
    fontSize: 14,
    color: '#0f172a',
  },
});

export default IdSearchInput;