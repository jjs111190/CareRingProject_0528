import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import IdSearchInput from '../components/IdSearchInput';

const SearchScreen = () => {
  const handleSearch = (query: string) => {
    console.log('Search query:', query);
    // 실제 검색 로직 구현
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <IdSearchInput 
          onSearch={handleSearch}
          recentSearches={['user_001', 'user_045', 'john_doe']}
          style={styles.searchInput}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  searchInput: {
    marginTop: 50, // 공백 충분히 확보
  },
});

export default SearchScreen;
