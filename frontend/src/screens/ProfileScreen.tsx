// ProfileScreen.tsx

import React, { useState, useRef } from 'react';
import {
  View, Text, Image, StyleSheet, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, Alert, RefreshControl,
  SafeAreaView, Dimensions, ActivityIndicator, // ActivityIndicator 추가
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import FreeformLayout, { LayoutSection } from '../components/layout/FreeformLayout';
import ProfileCustomizerModal from './ProfileCustomizer';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface Post {
  id: number;
  image_url: string;
  likes: number;
}

export interface CustomizationWidget extends LayoutSection {
  // FreeformLayout.tsx의 LayoutSection과 동일
}

interface UserCustomization {
  backgroundUrl: string | null;
  widgets: CustomizationWidget[];
}

const getDefaultWidgets = (
  user: any, basicInfo: any, profileImageUrl: string | null,
  followData: any, lifestyleData: any, postData: Post[], // postData의 타입을 Post[]로 명시
  layoutContainerWidth: number // Pass the measured width here too
): LayoutSection[] => {
  const defaultWidgetWidth = layoutContainerWidth - 20; // Example: 10px padding on each side for widgets

  return [
    {
      id: 'profileCard',
      type: 'profileCard',
      position: { x: 0, y: 0 },
      size: { width: defaultWidgetWidth, height: 250 },
      config: {
        nickname: basicInfo.name || user.nickname || 'User',
        joinText: new Date(user.created_at).toLocaleDateString('en-US', {
          year: 'numeric', month: 'long', day: 'numeric'
        }),
        imageUrl: profileImageUrl,
        followerCount: followData.follower_count || 0,
        followingCount: followData.following_count || 0
      }
    },
    {
      id: 'about',
      type: 'about',
      position: { x: 0, y: 260 },
      size: { width: defaultWidgetWidth, height: 150 },
      config: { text: user.about || 'No description provided.' }
    },
    {
      id: 'healthSummary',
      type: 'healthSummary',
      position: { x: 0, y: 420 },
      size: { width: defaultWidgetWidth, height: 200 },
      config: { data: lifestyleData || {} }
    },
    {
      id: 'posts',
      type: 'posts',
      position: { x: 0, y: 630 },
      size: { width: defaultWidgetWidth, height: 300 },
      config: { posts: postData || [] }
    },
  ];
};


const ProfileScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const [userId, setUserId] = useState<number | null>(null);
  const [nickname, setNickname] = useState('');
  const [about, setAbout] = useState('');
  const [healthInfo, setHealthInfo] = useState<any>({});
  const [posts, setPosts] = useState<Post[]>([]);
  const [joinText, setJoinText] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [isMe, setIsMe] = useState(false);

  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [widgets, setWidgets] = useState<CustomizationWidget[]>([]); // For ProfileCustomizerModal
  const [showCustomizerModal, setShowCustomizerModal] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState(false); // State for customization mode

  const [layoutSections, setLayoutSections] = useState<LayoutSection[]>([]); // For FreeformLayout's live state
  const [userCustomization, setUserCustomization] = useState<UserCustomization>({ backgroundUrl: null, widgets: [] }); // Fetched from backend

  const [showFirstTimeHint, setShowFirstTimeHint] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // 전체 화면 로딩 인디케이터를 위한 새로운 상태


  // Measure the width of the fullScreenLayoutContainer dynamically
  const [measuredLayoutWidth, setMeasuredLayout] = useState(screenWidth - 40); // Initial guess based on padding
  const fullScreenLayoutContainerRef = useRef<TouchableOpacity>(null);

  const onLayout = (event: any) => {
    // Only update if it's different to prevent unnecessary unnecessary re-renders
    if (event.nativeEvent.layout.width !== measuredLayoutWidth) {
      setMeasuredLayout(event.nativeEvent.layout.width);
      console.log("Measured fullScreenLayoutContainer width:", event.nativeEvent.layout.width);
    }
  };


  const fetchProfileData = async () => {
    setRefreshing(true); // 새로고침 제어를 위한 새로고침 상태 시작
    setIsLoading(true); // 전체 화면 로딩 인디케이터 시작
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        navigation.navigate('Login');
        return;
      }
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const meRes = await axios.get(`https://mycarering.loca.lt/users/me`, config);
      const meId = meRes.data.id;
      console.log('Fetched meId:', meId);

      let finalUserId: number;
      if ((route.params as any)?.userId) {
        finalUserId = (route.params as any).userId;
      } else {
        finalUserId = meId;
      }
      setIsMe(finalUserId === meId);
      setUserId(finalUserId);
      console.log('Current profile user ID:', finalUserId, 'Is me:', finalUserId === meId);

      const followUrl = finalUserId === meId
        ? `https://mycarering.loca.lt/follow/me`
        : `https://mycarering.loca.lt/follow/${finalUserId}`;

      const [userRes, lifestyleRes, basicInfoRes, postRes, followRes, customizationRes] = await Promise.all([
        axios.get(`https://mycarering.loca.lt/users/${finalUserId}`, config),
        axios.get(`https://mycarering.loca.lt/lifestyle/${finalUserId}`, config),
        axios.get(`https://mycarering.loca.lt/basic-info/${finalUserId}`, config),
        axios.get(`https://mycarering.loca.lt/posts/user/${finalUserId}`, config),
        axios.get(followUrl, config),
        axios.get(`https://mycarering.loca.lt/users/${finalUserId}/customization`, config),
      ]);

      const basicInfo = basicInfoRes.data;
      const user = userRes.data;
      const joinDate = new Date(user.created_at);

      const profileImageUrl = basicInfo.image_url ? `https://mycarering.loca.lt${basicInfo.image_url}` : null;

      setNickname(basicInfo.name || user.nickname || 'User');
      setAbout(user.about || '');
      setHealthInfo(lifestyleRes.data || {});
      setPosts(postRes.data || []); // posts 상태 업데이트
      setFollowerCount(followRes.data.follower_count || 0);
      setFollowingCount(followRes.data.following_count || 0);
      setJoinText(joinDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
      setImageUrl(profileImageUrl);

      const fetchedBackgroundUrl = customizationRes.data?.backgroundUrl || null;
      let fetchedWidgets: CustomizationWidget[] = Array.isArray(customizationRes.data?.widgets)
          ? customizationRes.data.widgets
          : [];
      const hasValidWidgets = fetchedWidgets.length > 0;

      console.log('Fetched customization data:', customizationRes.data);
      console.log('Has valid widgets from backend:', hasValidWidgets);
      console.log('Number of fetched widgets:', fetchedWidgets.length);

      let finalWidgets: CustomizationWidget[] = [];

      if (hasValidWidgets) {
        console.log('Using fetched widgets from backend. Merging live data...');
        // fetchedWidgets를 직접 변경하지 않고 복사본을 만들어 사용
        finalWidgets = JSON.parse(JSON.stringify(fetchedWidgets)); 

        // 'posts' 위젯을 찾아 실제 게시물 데이터 주입
        const postsWidgetIndex = finalWidgets.findIndex(w => w.id === 'posts');
        if (postsWidgetIndex !== -1) {
          console.log("Injecting live post data into 'posts' widget config.");
          finalWidgets[postsWidgetIndex].config = {
            ...(finalWidgets[postsWidgetIndex].config || {}), // 기존 config 속성 유지
            posts: postRes.data || [], // 새로 불러온 게시물 데이터 주입
          };
          console.log("Posts widget config after injection:", finalWidgets[postsWidgetIndex].config.posts);
        } else {
            console.log("Posts widget not found in fetched backend widgets.");
            // 만약 백엔드에서 불러온 위젯 목록에 'posts' 위젯이 없다면,
            // 기본 'posts' 위젯을 추가할지 여부를 결정해야 합니다.
            // 여기서는 일단 백엔드에 저장된 위젯 목록에 'posts'가 없으면 추가하지 않도록 합니다.
            // 만약 항상 표시되어야 한다면, getDefaultWidgets에서 'posts' 위젯만 추출하여 추가하는 로직을 고려해야 합니다.
        }
      } else {
        if (finalUserId === meId) {
          console.log("Generating default widgets for current user (no saved widgets found).");
          // 이 경로는 getDefaultWidgets에 postRes.data가 이미 전달되므로 수정 불필요
          finalWidgets = getDefaultWidgets(user, basicInfo, profileImageUrl, followRes.data, lifestyleRes.data, postRes.data, measuredLayoutWidth);

          try {
            console.log('Attempting to save default layout to backend...');
            // 이 save 로직도 아래 handleSaveCustomization과 동일하게 sanitizing 필요
            const widgetsToSave = finalWidgets.map(widget => {
                if (widget.type === 'posts') {
                    const { posts, ...restConfig } = widget.config || {};
                    return { ...widget, config: restConfig };
                }
                return widget;
            });
            await axios.put(
              'https://mycarering.loca.lt/users/me/customization',
              {
                backgroundUrl: fetchedBackgroundUrl,
                widgets: widgetsToSave, // Sanitized widgets
              },
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            console.log('✅ Default layout saved successfully to backend for the first time.');
            await AsyncStorage.setItem('hasCustomizedProfile', 'true');
            setShowFirstTimeHint(false); // 기본 레이아웃이 저장되면 힌트 숨기기
          } catch (saveError: any) {
            console.error('🔴 Error saving default layout to backend:', saveError?.response?.status, saveError?.response?.data, saveError?.message);
            Alert.alert('Save Error', `Failed to save default layout. Please check backend. (${saveError?.response?.status || 'Unknown'})`);
          }

        } else {
          console.log("No saved widgets found for other user, showing empty layout.");
          finalWidgets = [];
        }
      }

      if (finalUserId === meId) {
        const customizedFlag = await AsyncStorage.getItem('hasCustomizedProfile');
        setShowFirstTimeHint(customizedFlag !== 'true');
      } else {
        setShowFirstTimeHint(false);
      }

      console.log('Final widgets applied to state:', finalWidgets.map(w => w.id));
      setUserCustomization({ backgroundUrl: fetchedBackgroundUrl, widgets: finalWidgets });
      setLayoutSections(finalWidgets);
      setWidgets(finalWidgets);

    } catch (e: any) {
      console.error('🔴 Error fetching profile:', e?.response?.config?.url || 'No URL', e?.response?.status, e?.response?.data);
      Alert.alert('Error', `Failed to load profile. Please try again. (${e?.response?.status || 'Unknown error'})`);
    } finally {
      setRefreshing(false); // 새로고침 제어 상태 종료
      setIsLoading(false); // 전체 화면 로딩 인디케이터 종료
    }
  };

  const onRefresh = () => {
    // onRefresh도 fetchProfileData를 사용하며, 이는 새로고침 및 isLoading 상태를 모두 처리합니다.
    fetchProfileData();
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchProfileData();
      return () => {
        // 필요한 경우 정리
      };
    }, [route.params, measuredLayoutWidth]) // measuredLayoutWidth를 의존성 배열에 추가
  );

  const handleChatPress = () => {
    if (userId !== null && nickname) {
      navigation.navigate('ChatScreen', { userId: userId, nickname: nickname });
    } else {
      Alert.alert('Error', 'Insufficient user information for chat.');
    }
  };

  const handleSaveCustomization = async (bgUrl: string | null, newWidgets: CustomizationWidget[]) => {
    try {
      if (!newWidgets || newWidgets.length === 0) {
        Alert.alert("Nothing to save", "No widgets to save.");
        return;
      }

      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      // 백엔드에 저장하기 전에 'posts' 위젯의 config에서 실제 posts 데이터를 제거
      const widgetsToSave = newWidgets.map(widget => {
          if (widget.type === 'posts') {
              const { posts, ...restConfig } = widget.config || {};
              return {
                  ...widget,
                  config: restConfig // 'posts' 필드를 제외한 config만 저장
              };
          }
          return widget; // 다른 위젯은 그대로 저장
      });

      await axios.put('https://mycarering.loca.lt/users/me/customization', {
        backgroundUrl: bgUrl,
        widgets: widgetsToSave, // 정제된 위젯들
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      await AsyncStorage.setItem('hasCustomizedProfile', 'true');
      setShowFirstTimeHint(false); // 성공적인 저장 후 힌트 숨기기

      setBackgroundUrl(bgUrl);
      setWidgets(newWidgets); // UI 상태는 동적 데이터 포함
      setUserCustomization({ backgroundUrl: bgUrl, widgets: newWidgets }); // UI 상태는 동적 데이터 포함
      setLayoutSections(newWidgets); // UI 상태는 동적 데이터 포함
      setShowCustomizerModal(false);
      setIsCustomizing(false);

      Alert.alert('Customization Saved', 'Your profile decorations have been updated!');
    } catch (error) {
      console.error('Error saving customization:', error);
      Alert.alert('Error', 'Failed to save customization.');
    }
  };

  const handleLayoutSectionsChange = async (updatedSections: LayoutSection[]) => {
    setLayoutSections(updatedSections);
    setWidgets(updatedSections as CustomizationWidget[]);

    if (isMe && userId !== null) {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) return;

        // 백엔드에 저장하기 전에 'posts' 위젯의 config에서 실제 posts 데이터를 제거
        const widgetsToSave = updatedSections.map(widget => {
            if (widget.type === 'posts') {
                const { posts, ...restConfig } = widget.config || {};
                return {
                    ...widget,
                    config: restConfig // 'posts' 필드를 제외한 config만 저장
                };
            }
            return widget; // 다른 위젯은 그대로 저장
        });

        // console.log('Payload being sent for auto-save:', { backgroundUrl: backgroundUrl, widgets: widgetsToSave }); // 디버깅을 위해 주석 해제 가능

        await axios.put('https://mycarering.loca.lt/users/me/customization', {
          backgroundUrl: backgroundUrl,
          widgets: widgetsToSave, // 정제된 위젯들
        }, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log('✅ Layout auto-saved successfully during editing.');
        await AsyncStorage.setItem('hasCustomizedProfile', 'true');
        setShowFirstTimeHint(false); // 자동 저장 성공 후 힌트 숨기기
      } catch (error) {
        console.error('🔴 Error auto-saving layout:', error);
      }
    }
  };

  const toggleCustomizationMode = () => {
    if (!isMe) return;

    if (isCustomizing) {
      // isCustomizing 모드에서 나갈 때 (저장 버튼 클릭 또는 토글)
      handleSaveCustomization(backgroundUrl, layoutSections as CustomizationWidget[]);
    } else {
      // isCustomizing 모드로 진입할 때
      setBackgroundUrl(userCustomization.backgroundUrl);
      setWidgets(userCustomization.widgets);
      setLayoutSections(userCustomization.widgets);
    }
    setIsCustomizing(prev => !prev);
  };

  const handleLongPressOnLayout = () => {
    if (isMe) {
      toggleCustomizationMode();
    }
  };

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.fullScreenContainer}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <ScrollView
            style={styles.container}
            contentContainerStyle={styles.scrollViewContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4387E5']} />
            }
            scrollEnabled={true}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <Text style={styles.title}>{isMe ? 'My' : `${nickname}'s`} Profile</Text>
              <View style={styles.iconGroup}>
                {!isMe && (
                  <TouchableOpacity onPress={handleChatPress}>
                    <Image source={require('../../assets/chatbubble.png')} style={styles.iconImage} />
                  </TouchableOpacity>
                )}
                {isMe && !isCustomizing && (
                  <TouchableOpacity onPress={() => setShowCustomizerModal(true)} style={styles.editButton}>
                    <Image source={require('../../assets/edit.png')} style={styles.iconImage} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                  <Image source={require('../../assets/settings.png')} style={styles.iconImage} />
                </TouchableOpacity>
              </View>
            </View>

            {/* First-time customization hint */}
            {isMe && showFirstTimeHint && (
              <View style={styles.hintContainer}>
                <Text style={styles.hintTitle}>Welcome to Profile Customization!</Text>
                <Text style={styles.hintText}>
                  Tap the <Image source={require('../../assets/edit.png')} style={styles.inlineIcon} /> icon in the top right to start decorating your profile.
                  You can add new widgets, change the background, and arrange elements.
                </Text>
                <Text style={styles.hintText}>
                  Long-press anywhere on the profile layout to enter interactive edit mode, where you can drag and resize widgets directly.
                </Text>
                <TouchableOpacity onPress={() => {
                  setShowFirstTimeHint(false);
                  AsyncStorage.setItem('hasCustomizedProfile', 'true');
                }} style={styles.gotItButton}>
                  <Text style={styles.gotItButtonText}>Got It!</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              onLongPress={handleLongPressOnLayout}
              activeOpacity={isCustomizing ? 1 : 0.8}
              style={styles.fullScreenLayoutContainer}
              onLayout={onLayout} // 레이아웃 컨테이너의 너비 측정
              ref={fullScreenLayoutContainerRef}
            >
              {measuredLayoutWidth > 0 && ( // 너비가 측정된 후에만 렌더링
                <FreeformLayout
                  backgroundUrl={userCustomization.backgroundUrl}
                  sections={layoutSections}
                  editable={isMe && isCustomizing}
                  initialSections={userCustomization.widgets}
                  onSectionsChange={handleLayoutSectionsChange}
                  containerWidth={measuredLayoutWidth} // 측정된 너비 전달
                />
              )}
            </TouchableOpacity>

            {isMe && isCustomizing && (
              <TouchableOpacity onPress={toggleCustomizationMode} style={styles.doneButtonContainer}>
                <Text style={styles.doneButtonText}>Done Editing</Text>
              </TouchableOpacity>
            )}

          </ScrollView>

          <ProfileCustomizerModal
            visible={showCustomizerModal}
            backgroundUrl={backgroundUrl}
            widgets={widgets}
            onClose={() => setShowCustomizerModal(false)}
            onSave={handleSaveCustomization}
            profileData={{ nickname, about, healthInfo, posts, imageUrl, joinText, followerCount, followingCount }}
            findNextWidgetPosition={(currentWidgets, newWidgetHeight, newWidgetWidth) => {
              let maxY = 0;
              currentWidgets.forEach(w => {
                const widgetBottom = w.position.y + (w.size?.height || 0);
                if (widgetBottom > maxY) {
                  maxY = widgetBottom;
                }
              });
              // 새 위젯을 컨테이너 너비 기준으로 위치 지정
              const newX = (measuredLayoutWidth - newWidgetWidth) / 2; // 가로 중앙 정렬
              return { x: newX, y: maxY + 20 };
            }}
          />
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
      {/* 전체 화면 로딩 오버레이 */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4387E5" />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  container: {
    // 여기에는 paddingHorizontal이 직접 없습니다. scrollViewContent를 사용합니다.
  },
  scrollViewContent: {
    paddingHorizontal: 20, // 이 패딩은 자식 요소의 너비를 효과적으로 줄입니다.
    paddingBottom: 100,
    paddingTop: 20,
    minHeight: screenHeight * 1.5,
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4387E5',
  },
  iconGroup: {
    flexDirection: 'row',
  },
  iconImage: {
    width: 24,
    height: 24,
    marginLeft: 15,
    tintColor: '#4387E5',
  },
  editButton: {
    marginLeft: 15,
  },
  inlineIcon: {
    width: 16,
    height: 16,
    tintColor: '#4387E5',
    verticalAlign: 'middle',
  },
  fullScreenLayoutContainer: {
    flex: 1,
    minHeight: screenHeight * 1.2,
    borderRadius: 10,
    overflow: 'hidden', // 테두리 반경을 유지하기 위해 유지
    backgroundColor: '#f0f0f0',
    // 여기에서 marginHorizontal 제거. 실제 너비를 측정할 것입니다.
  },
  doneButtonContainer: {
    marginTop: 15,
    paddingVertical: 10,
    paddingHorizontal: 25,
    backgroundColor: '#4CAF50',
    borderRadius: 25,
    alignSelf: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  doneButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  hintContainer: {
    backgroundColor: '#E0F2F7',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#B3E5FC',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  hintTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0288D1',
    marginBottom: 10,
    textAlign: 'center',
  },
  hintText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 20,
  },
  gotItButton: {
    backgroundColor: '#4387E5',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 10,
  },
  gotItButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000, // 다른 콘텐츠 위에 있도록 zIndex 설정
  },
});

export default ProfileScreen;