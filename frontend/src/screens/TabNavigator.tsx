// ✅ 전체 TabNavigator 코드
import React, { useState, useEffect, useRef } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Keyboard,
  Modal,
  Pressable,
  Animated,
  Easing,
  
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import HomeScreen from './HomeScreen';
import ProfileScreen from './ProfileScreen';
import CalendarScreen from './CalendarScreen';
import ChatScreen from './ChatScreen';

const Tab = createBottomTabNavigator();

const CustomTabButton = ({ onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={styles.customButtonContainer}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <Image source={require('../../assets/add.png')} style={styles.addIconImage} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const AnimatedTabIcon = ({
  focused,
  source,
  label,
  iconStyle, // ✅ iconStyle props 추가
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const colorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: focused ? 1.15 : 1,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.timing(colorAnim, {
        toValue: focused ? 1 : 0,
        duration: 200,
        easing: Easing.ease,
        useNativeDriver: false,
      }),
    ]).start();
  }, [focused]);

  const textColor = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#888', '#4387E5'],
  });

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], alignItems: 'center' }}>
      <View style={[styles.iconWrapper, focused && styles.focusedIconWrapper]}>
        <Image
          source={source}
          style={[
            styles.iconImage, // 기존 공통 스타일
            { tintColor: focused ? '#4387E5' : '#888' }, // 포커스 여부에 따라 색상 변화
            iconStyle, // ✅ 전달된 아이콘 스타일 적용
          ]}
        />
      </View>
      {label && (
        <Animated.Text style={[styles.iconText, { color: textColor }]}>
          {label}
        </Animated.Text>
      )}
    </Animated.View>
  );
};

const TabNavigator = () => {
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;
  const navigation = useNavigation();

  const handleCloseModal = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => setModalVisible(false));
  };

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (modalVisible) {
      slideAnim.setValue(300); // ✅ 초기 슬라이드 위치 지정
    modalOpacity.setValue(0); // ✅ 초기 투명도 지정
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(modalOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [modalVisible]);

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          tabBarShowLabel: false,
          tabBarStyle: [styles.tabBar, isKeyboardVisible && { display: 'none' }],
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <AnimatedTabIcon focused={focused} source={require('../../assets/home.png')}  />
            ),
          }}
        />
        <Tab.Screen
  name="Chat"
  component={ChatScreen}
  options={{
    headerShown: false,
    tabBarIcon: ({ focused }) => (
      <AnimatedTabIcon
        focused={focused}
        source={require('../../assets/chatbubble.png')}
       
        iconStyle={{ width: 40, height: 40 }} // ✅ 크기 축소 적용
      />
    ),
  }}
/>
   <Tab.Screen
  name="Add"
  component={() => null}
  options={{
    tabBarButton: () => (
      <View style={styles.addButtonWrapper}>
        <CustomTabButton onPress={() => setModalVisible(true)} />
      </View>
    ),
  }}
/>
        <Tab.Screen
          name="Calendar"
          component={CalendarScreen}
          options={{
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <AnimatedTabIcon focused={focused} source={require('../../assets/Calendar1.png')}  />
            ),
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <AnimatedTabIcon focused={focused} source={require('../../assets/profile.png')}  />
            ),
          }}
        />
      </Tab.Navigator>

      <Modal transparent visible={modalVisible} animationType="none" onRequestClose={handleCloseModal}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.overlayDismissArea} onPress={handleCloseModal} />
          <Animated.View
            style={[styles.bottomSheet, {
              transform: [{ translateY: slideAnim }],
              opacity: modalOpacity,
            }]}
          >
            <Pressable style={styles.closeButton} onPress={handleCloseModal}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>

            <Text style={styles.modalTitle}>Create New</Text>

            <Pressable
              style={styles.modalButton}
              onPress={() => {
                handleCloseModal();
                navigation.navigate('PostWrite');
              }}
            >
              <Image source={require('../../assets/write.png')} style={styles.modalButtonIcon} />
              <View>
                <Text style={styles.modalText}>Write a post</Text>
                <Text style={styles.modalSubText}>Share your records with photos</Text>
              </View>
            </Pressable>

            <View style={styles.divider} />

            <Pressable style={styles.modalButton} onPress={() => {
              handleCloseModal();
              navigation.navigate('AICamera');
            }}>
              <Image source={require('../../assets/camera.png')} style={styles.modalButtonIcon} />
              <View>
                <Text style={styles.modalText}>AI Camera</Text>
                <Text style={styles.modalSubText}>AI analyzes your pills</Text>
              </View>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    height: 75,
    borderTopWidth: 0,
    shadowColor: '#4387E5',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  iconImage: {
    marginTop: 20,
    width: 50,
    height: 50,
    marginBottom: 0,
    resizeMode: 'contain',
  },
  iconText: {
    fontSize: 7,
    fontWeight: '500',
  },
 customButtonContainer: {
  justifyContent: 'center',
  alignItems: 'center',
  width: 40,
  height: 40,
  borderRadius: 10,
  backgroundColor: 'white',
  borderWidth: 2,
  borderColor: '#4387E5',
  marginTop: 6,

},
// ✅ styles에 추가
addButtonWrapper: {
  position: 'absolute',
  
  left: '50%',
  transform: [{ translateX: -20 }], // 버튼 width/2 만큼 왼쪽으로 보정
  zIndex: 10,
},
addIconImage: {
  width: 35,
  height: 35,
  tintColor: '#4387E5',
},
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  overlayDismissArea: {
    flex: 1,
  },
  bottomSheet: {
    backgroundColor: 'white',
    padding: 24,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
  },
  closeText: {
    fontSize: 20,
    color: '#888',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  modalButtonIcon: {
    width: 32,
    height: 32,
    marginRight: 16,
    resizeMode: 'contain',
  },
  modalText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  modalSubText: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 8,
  },
});

export default TabNavigator;
