import React from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity
} from 'react-native';

const { width } = Dimensions.get('window');
const IMAGE_SIZE = width / 3;

const dummyImages = [
  // 임시 데이터 (서버 연결 시 API 호출로 대체)
  { id: '1', uri: 'https://source.unsplash.com/random/300x300?sig=1' },
  { id: '2', uri: 'https://source.unsplash.com/random/300x300?sig=2' },
  { id: '3', uri: 'https://source.unsplash.com/random/300x300?sig=3' },
  { id: '4', uri: 'https://source.unsplash.com/random/300x300?sig=4' },
  { id: '5', uri: 'https://source.unsplash.com/random/300x300?sig=5' },
  { id: '6', uri: 'https://source.unsplash.com/random/300x300?sig=6' },
  { id: '7', uri: 'https://source.unsplash.com/random/300x300?sig=7' },
  { id: '8', uri: 'https://source.unsplash.com/random/300x300?sig=8' },
  { id: '9', uri: 'https://source.unsplash.com/random/300x300?sig=9' },
];

const SearchImageScreen = () => {
  const renderItem = ({ item }: { item: { id: string; uri: string } }) => (
    <TouchableOpacity onPress={() => console.log(`Pressed image ${item.id}`)}>
      <Image source={{ uri: item.uri }} style={styles.image} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={dummyImages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={3}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default SearchImageScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  image: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderWidth: 0.5,
    borderColor: '#eee',
  },
});