import React from 'react';
import { View, Image, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';

const ImagePickerBox = ({
  image,
  setImage,
}: {
  image: any;
  setImage: (img: any) => void;
}) => {
  const pickImage = () => {
    launchImageLibrary({ mediaType: 'photo' }, (res) => {
      if (res.assets && res.assets.length > 0) {
        setImage(res.assets[0]);
      }
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Attach photo</Text>
      <TouchableOpacity onPress={pickImage} style={styles.box}>
        {image ? (
          <Image
            source={{ uri: image.uri }}
            style={styles.preview}
            resizeMode="cover"
          />
        ) : (
          <Text style={styles.placeholder}>+ Select image</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default ImagePickerBox;

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  label: {
    marginBottom: 8,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  box: {
    height: 150,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    fontSize: 16,
    color: '#999',
  },
  preview: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
});