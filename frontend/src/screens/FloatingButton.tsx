import React, { useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Text,
} from 'react-native';

const ICONS = [
  { icon: require('../../assets/photo.png'), action: () => console.log('📸 사진') },
  { icon: require('../../assets/file.png'), action: () => console.log('📁 파일') },
];

const FloatingButton = () => {
  const isExpanded = useRef(false);
  const iconAnimations = ICONS.map(() => useRef(new Animated.Value(0)).current);

  const expandIcons = () => {
    isExpanded.current = true;
    iconAnimations.forEach((anim, i) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 200 + i * 50,
        useNativeDriver: true,
      }).start();
    });
  };

  const collapseIcons = () => {
    isExpanded.current = false;
    iconAnimations.forEach((anim) => {
      Animated.timing(anim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  return (
    <View style={styles.container}>
      {ICONS.map((item, i) => {
        const translateY = iconAnimations[i].interpolate({
          inputRange: [0, 1],
          outputRange: [0, -(i + 1) * 50],
        });

        return (
          <Animated.View
            key={i}
            style={[
              styles.iconContainer,
              {
                transform: [{ translateY }],
                opacity: iconAnimations[i],
              },
            ]}
          >
            <TouchableOpacity onPress={item.action} style={styles.iconButton}>
              <Image source={item.icon} style={styles.iconImage} />
            </TouchableOpacity>
          </Animated.View>
        );
      })}

      <TouchableOpacity
        onPress={() => {
          isExpanded.current ? collapseIcons() : expandIcons();
        }}
        style={styles.button}
      >
        <Text style={styles.text}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#4387E5',
    width: 30,
    height: 30,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
     marginLeft: -8, // ✅ 왼쪽으로 더 밀착
  marginRight: 8,
  },
  text: {
    fontSize: 22,
    color: 'white',
    fontWeight: 'bold',
  },
  iconContainer: {
  position: 'absolute',
  bottom: 0,
  width: 44,
  height: 44,
  borderRadius: 22,
  backgroundColor: '#fff',
  justifyContent: 'center',
  alignItems: 'center',
  elevation: 4,
},
iconButton: {
  width: 40,
  height: 40,
  justifyContent: 'center',
  alignItems: 'center',
},
iconImage: {
  width: 24,
  height: 24,
  resizeMode: 'contain',
},
});

export default FloatingButton;