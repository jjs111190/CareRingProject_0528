// components/layout/DraggableResizAbleWidget.tsx
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Linking, Dimensions, Alert } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    useAnimatedGestureHandler,
    withSpring,
    runOnJS,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { LayoutSection } from './FreeformLayout';

interface DraggableResizAbleWidgetProps {
    widget: LayoutSection;
    editable: boolean;
    onDragEnd: (id: string, snappedX: number, snappedY: number, width: number, height: number) => void;
    onSectionsChange: (updater: (prevSections: LayoutSection[]) => LayoutSection[]) => void;
    onPostPress?: (postId: number) => void;
    nonDeletableWidgetIds: string[];
    MAX_LAYOUT_WIDTH: number;
    MAX_LAYOUT_HEIGHT: number;
    GRID_SIZE: number;
    SCREEN_WIDTH: number;
    SCREEN_HEIGHT: number;
    onEditWidget?: (id: string, type: LayoutSection['type']) => void; // onEditWidget 추가
}

const DraggableResizAbleWidget: React.FC<DraggableResizAbleWidgetProps> = ({
    widget,
    editable,
    onDragEnd,
    onSectionsChange,
    onPostPress,
    nonDeletableWidgetIds,
    MAX_LAYOUT_WIDTH,
    MAX_LAYOUT_HEIGHT,
    GRID_SIZE,
    onEditWidget, // Prop 추가
    // SCREEN_WIDTH, // 사용되지 않으므로 제거하거나 주석 처리
    // SCREEN_HEIGHT, // 사용되지 않으므로 제거하거나 주석 처리
}) => {
    const { id, type, position, size, config } = widget;

    const MIN_WIDGET_WIDTH = 80;
    const MIN_WIDGET_HEIGHT = 80;

    const x = useSharedValue(position.x);
    const y = useSharedValue(position.y);
    const w = useSharedValue(size?.width || 150);
    const h = useSharedValue(size?.height || 100);

    // 위젯 prop이 변경될 때 공유 값을 업데이트합니다.
    React.useEffect(() => {
        x.value = withSpring(position.x, { damping: 15, stiffness: 100 });
        y.value = withSpring(position.y, { damping: 15, stiffness: 100 });
        w.value = withSpring(size?.width || w.value, { damping: 15, stiffness: 100 });
        h.value = withSpring(size?.height || h.value, { damping: 15, stiffness: 100 });
    }, [position, size, x, y, w, h]); // 종속성 배열에 SharedValue를 추가 (경고 방지)

    // 드래그 시작 시점의 위치를 저장하는 SharedValue
    const startX = useSharedValue(position.x);
    const startY = useSharedValue(position.y);
    const startW = useSharedValue(size?.width || 150);
    const startH = useSharedValue(size?.height || 100);

    // 위젯의 애니메이션 스타일 (위치 및 크기)
    const animatedWidgetStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: x.value },
                { translateY: y.value },
            ],
            width: w.value,
            height: h.value,
        };
    });

    // 드래그 제스처 핸들러
    const onPanGestureEvent = useAnimatedGestureHandler({
        onStart: (event, ctx: any) => {
            ctx.offsetX = x.value; // 드래그 시작 시 현재 x 값 저장
            ctx.offsetY = y.value; // 드래그 시작 시 현재 y 값 저장
        },
        onActive: (event, ctx) => {
            let newX = event.translationX + ctx.offsetX;
            let newY = event.translationY + ctx.offsetY;

            // 그리드에 스냅 (드래그 중에도 적용)
            newX = Math.round(newX / GRID_SIZE) * GRID_SIZE;
            newY = Math.round(newY / GRID_SIZE) * GRID_SIZE;

            // 레이아웃 경계 내로 제한
            newX = Math.max(0, Math.min(newX, MAX_LAYOUT_WIDTH - w.value));
            newY = Math.max(0, Math.min(newY, MAX_LAYOUT_HEIGHT - h.value));

            x.value = newX;
            y.value = newY;
        },
        onEnd: () => {
            // 드래그 종료 시 최종 위치와 크기를 부모 컴포넌트로 전달
            runOnJS(onDragEnd)(id, x.value, y.value, w.value, h.value);
        },
    });

    // 리사이즈 제스처 핸들러 (우측 하단)
    const onResizeGestureEvent = useAnimatedGestureHandler({
        onStart: (event, ctx: any) => {
            ctx.startWidth = w.value; // 리사이즈 시작 시 현재 너비 저장
            ctx.startHeight = h.value; // 리사이즈 시작 시 현재 높이 저장
        },
        onActive: (event, ctx) => {
            let newW = ctx.startWidth + event.translationX;
            let newH = ctx.startHeight + event.translationY;

            // 최소 너비/높이 제약 적용
            newW = Math.max(MIN_WIDGET_WIDTH, newW);
            newH = Math.max(MIN_WIDGET_HEIGHT, newH);

            // 레이아웃 경계 내로 제한
            newW = Math.min(newW, MAX_LAYOUT_WIDTH - x.value);
            newH = Math.min(newH, MAX_LAYOUT_HEIGHT - y.value);

            // 그리드에 스냅 (리사이즈 중에도 적용)
            newW = Math.round(newW / GRID_SIZE) * GRID_SIZE;
            newH = Math.round(newH / GRID_SIZE) * GRID_SIZE;

            w.value = newW;
            h.value = newH;
        },
        onEnd: () => {
            // 리사이즈 종료 시 최종 위치와 크기를 부모 컴포넌트로 전달
            runOnJS(onDragEnd)(id, x.value, y.value, w.value, h.value);
        },
    });

    // 위젯 콘텐츠를 렌더링하는 함수
    const widgetContent = (currentWidget: LayoutSection) => {
        switch (currentWidget.type) {
            case 'profileCard':
                return (
                    <View style={widgetStyles.profileCard}>
                        <LinearGradient
                            colors={['#7F7FD5', '#86A8E7', '#91EAE4']}
                            style={widgetStyles.gradientRing}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Image
                                // 이미지 경로 수정 (../../../assets -> ../../assets) 또는 실제 경로에 맞게 조정 필요
                                source={currentWidget.config?.imageUrl ? { uri: currentWidget.config.imageUrl } : require('../../../assets/user-icon.png')}
                                style={widgetStyles.profileImage}
                            />
                        </LinearGradient>
                        <Text style={widgetStyles.userName}>{currentWidget.config?.nickname || 'User'}</Text>
                        <Text style={widgetStyles.joinDate}>Joined {currentWidget.config?.joinText || 'N/A'} • Student</Text>
                        <View style={widgetStyles.statsContainer}>
                            <View style={widgetStyles.statItem}>
                                <Text style={widgetStyles.statNumber}>{currentWidget.config?.followerCount || 0}</Text>
                                <Text style={widgetStyles.statLabel}>Followers</Text>
                            </View>
                            <View style={widgetStyles.statItem}>
                                <Text style={widgetStyles.statNumber}>{currentWidget.config?.followingCount || 0}</Text>
                                <Text style={widgetStyles.statLabel}>Following</Text>
                            </View>
                        </View>
                    </View>
                );
            case 'about':
                return (
                    <View style={widgetStyles.sectionBox}>
                        <Text style={widgetStyles.sectionTitle}>About</Text>
                        <Text style={widgetStyles.aboutText}>{currentWidget.config?.text || 'No description provided.'}</Text>
                        {editable && ( // editable이 true일 때만 편집 버튼 표시
                            <TouchableOpacity
                                style={widgetStyles.editButton}
                                onPress={() => onEditWidget && onEditWidget(id, type)}
                            >
                                <Text style={widgetStyles.editButtonText}>Edit</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                );
            case 'healthSummary':
                const healthData = currentWidget.config?.data || {};
                const filteredHealthEntries = Object.entries(healthData)
                                                .filter(([key]) => key !== 'id' && key !== 'user_id');
                return (
                    <View style={widgetStyles.sectionBox}>
                        <Text style={widgetStyles.sectionTitle}>My Health Info</Text>
                        {filteredHealthEntries.length > 0 ? (
                            filteredHealthEntries.map(([key, value]) => (
                                value !== null && value !== undefined ? ( // null, undefined 체크 강화
                                    <View style={widgetStyles.infoItem} key={key}>
                                        <Text style={widgetStyles.infoTitle}>{key.replace(/_/g, ' ')}</Text>
                                        <Text style={widgetStyles.infoContent}>{String(value)}</Text>
                                    </View>
                                ) : null
                            ))
                        ) : (
                            <Text style={widgetStyles.noInfoText}>No health information available.</Text>
                        )}
                    </View>
                );
            case 'posts':
                console.log('Posts widget received config.posts:', currentWidget.config?.posts);
                return (
                    <View style={widgetStyles.sectionBox}>
                        <Text style={widgetStyles.sectionTitle}>Posts</Text>
                        <View style={widgetStyles.postsGrid}>
                            {currentWidget.config?.posts && currentWidget.config.posts.length > 0 ? (
                                currentWidget.config.posts.map((post: any) => (
                                    <TouchableOpacity
                                        key={post.id} // post.id가 유니크하고 존재하는지 확인
                                        style={widgetStyles.postItem}
                                        activeOpacity={0.8}
                                        onPress={() => onPostPress && onPostPress(post.id)}
                                    >
                                        <Image
                                            // post.image_url이 유효한 URL인지 확인
                                            source={{ uri: post.image_url.startsWith('http') ? post.image_url : `https://mycarering.loca.lt${post.image_url}` }}
                                            style={widgetStyles.postImage}
                                        />
                                        <View style={widgetStyles.postOverlay}>
                                            <Image source={require('../../../assets/heart.png')} style={widgetStyles.postIcon} />
                                            <Text style={widgetStyles.postLikes}>{post.likes}</Text> {/* post.likes가 숫자인지 확인 */}
                                        </View>
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <Text style={widgetStyles.noPostsText}>No posts yet.</Text>
                            )}
                        </View>
                    </View>
                );
            case 'customText':
                return (
                    <View style={widgetStyles.commonWidgetPadding}>
                        <Text style={widgetStyles.customTextContent}>{currentWidget.config?.text || 'Custom Text Widget'}</Text>
                    </View>
                );
            case 'image':
                return (
                    <View style={widgetStyles.commonWidgetPadding}>
                        {currentWidget.config?.imageUrl ? (
                            <Image
                                source={{ uri: currentWidget.config.imageUrl }}
                                style={widgetStyles.fullImageWidget}
                                resizeMode="cover"
                            />
                        ) : (
                            <Text style={widgetStyles.placeholderText}>No Image Selected</Text>
                        )}
                    </View>
                );
            case 'link':
                return (
                    <TouchableOpacity
                        style={widgetStyles.linkWidget}
                        onPress={() => currentWidget.config?.url && Linking.openURL(currentWidget.config.url)}
                        // editable이 true일 때만 disabled (사용자가 편집 중에는 링크 클릭 방지)
                        disabled={!currentWidget.config?.url || editable}
                    >
                        <Text style={widgetStyles.linkText}>
                            {currentWidget.config?.label || currentWidget.config?.url || 'Link Widget'}
                        </Text>
                        {currentWidget.config?.url && (
                            <Text style={widgetStyles.linkUrl}>{currentWidget.config.url}</Text>
                        )}
                    </TouchableOpacity>
                );
            case 'socialMedia':
                const socialLinksData = currentWidget.config?.socialLinks || {};
                return (
                    <View style={widgetStyles.sectionBox}>
                        <Text style={widgetStyles.sectionTitle}>Social Media</Text>
                        {Object.keys(socialLinksData).length > 0 ? (
                            Object.entries(socialLinksData).map(([platform, url]) => (
                                url ? (
                                    <TouchableOpacity
                                        key={platform}
                                        style={widgetStyles.socialMediaItem}
                                        onPress={() => Linking.openURL(url as string)}
                                        // editable이 true일 때만 disabled (사용자가 편집 중에는 링크 클릭 방지)
                                        disabled={editable}
                                    >
                                        {/* 이미지 경로 수정 (../../../assets -> ../../assets) 또는 실제 경로에 맞게 조정 필요 */}
                                        <Image source={
                                            platform === 'instagram' ? require('../../../assets/instagram.png') :
                                            platform === 'twitter' ? require('../../../assets/twitter.png') :
                                            platform === 'facebook' ? require('../../../assets/facebook1.png') :
                                            require('../../../assets/link.png') // 기본 아이콘
                                        } style={widgetStyles.socialMediaIcon} />
                                        <Text style={widgetStyles.socialMediaText}>{platform.charAt(0).toUpperCase() + platform.slice(1)}</Text>
                                    </TouchableOpacity>
                                ) : null
                            ))
                        ) : (
                            <Text style={widgetStyles.noInfoText}>No social links added.</Text>
                        )}
                    </View>
                );
            case 'calendar':
                return (
                    <View style={widgetStyles.sectionBox}>
                        <Text style={widgetStyles.sectionTitle}>Upcoming Events</Text>
                        <Text style={widgetStyles.noInfoText}>No events scheduled.</Text>
                    </View>
                );
            case 'divider':
                return (
                    <View
                        style={{
                            width: '100%',
                            height: currentWidget.size?.height || 5, // 기본 높이 설정
                            backgroundColor: currentWidget.config?.color || '#D3D3D3',
                            marginVertical: 5,
                            borderRadius: 2,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.2,
                            shadowRadius: 1,
                            elevation: 1,
                        }}
                    />
                );
            default:
                return (
                    <View style={widgetStyles.commonWidgetPadding}>
                        <Text style={widgetStyles.placeholderText}>
                            Unknown Widget ({currentWidget.type})
                        </Text>
                    </View>
                );
        }
    };

    return (
        <PanGestureHandler
            key={`pan-${id}`}
            onGestureEvent={onPanGestureEvent}
            enabled={editable} // 편집 모드일 때만 드래그 가능
        >
            <Animated.View
                key={id}
                style={[
                    styles.widgetContainer,
                    animatedWidgetStyle,
                    editable && styles.editableWidget, // 편집 모드일 때만 테두리 표시
                ]}
            >
                {widgetContent(widget)}

                {/* 편집 모드일 때만 삭제 버튼 및 리사이즈 핸들 표시 */}
                {editable && (
                    <>
                        {/* 삭제 불가능한 위젯이 아닐 경우에만 삭제 버튼 표시 */}
                        {!nonDeletableWidgetIds.includes(id) && (
                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={() => {
                                    Alert.alert(
                                        "Delete widget",
                                        "Are you sure you want to delete this widget?",
                                        [
                                            { text: "cancel", style: "cancel" },
                                            {
                                                text: "Delete",
                                                onPress: () => {
                                                    runOnJS(onSectionsChange)((prevSections: LayoutSection[]) => prevSections.filter(s => s.id !== id));
                                                },
                                                style: "destructive",
                                            },
                                        ],
                                        { cancelable: true }
                                    );
                                }}
                            >
                                <Text style={styles.deleteButtonText}>X</Text>
                            </TouchableOpacity>
                        )}
                        <PanGestureHandler
                            key={`resize-${id}`}
                            onGestureEvent={onResizeGestureEvent}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} // 터치 영역 확장
                        >
                            <Animated.View style={styles.resizeHandle} />
                        </PanGestureHandler>
                    </>
                )}
            </Animated.View>
        </PanGestureHandler>
    );
};

const styles = StyleSheet.create({
    widgetContainer: {
        position: 'absolute',
        backgroundColor: 'white',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        overflow: 'hidden',
        zIndex: 2, // 일반 위젯보다 높게 설정하여 다른 요소 위에 표시
    },
    editableWidget: {
        borderWidth: 1,
        borderColor: '#4387E5', // 편집 모드일 때 표시되는 테두리 색상
    },
    deleteButton: {
        position: 'absolute',
        top: -15, // 위젯 밖으로 나오도록 조정
        right: -15, // 위젯 밖으로 나오도록 조정
        backgroundColor: 'red',
        borderRadius: 20,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10, // 가장 위에 표시
        borderWidth: 1,
        borderColor: 'white',
    },
    deleteButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    resizeHandle: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 25,
        height: 25,
        backgroundColor: 'rgba(0, 122, 255, 0.7)', // 파란색 반투명 핸들
        borderRadius: 5,
        zIndex: 10, // 가장 위에 표시
    },
});

const widgetStyles = StyleSheet.create({
    // 공통적으로 사용되는 위젯 내부 패딩 및 중앙 정렬 스타일
    commonWidgetPadding: {
        padding: 10,
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    widgetTitle: {
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#4387E5',
        fontSize: 16,
    },
    customTextContent: {
        fontSize: 14,
        color: '#333',
        textAlign: 'center',
    },
    fullImageWidget: {
        width: '100%',
        height: '100%',
        borderRadius: 5,
    },
    linkWidget: {
        flex: 1,
        padding: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    linkText: {
        fontSize: 16,
        color: '#007AFF',
        fontWeight: 'bold',
        textDecorationLine: 'underline',
        textAlign: 'center',
    },
    linkUrl: {
        fontSize: 12,
        color: '#666',
        marginTop: 5,
        textAlign: 'center',
    },
    socialMediaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        alignSelf: 'stretch', // 부모 너비에 맞게 확장
    },
    socialMediaIcon: {
        width: 24,
        height: 24,
        marginRight: 10,
    },
    socialMediaText: {
        fontSize: 14,
        color: '#333',
    },
    placeholderText: {
        fontSize: 14,
        color: '#999',
        fontStyle: 'italic',
        textAlign: 'center',
    },
    // Profile Card Styles
    profileCard: {
        flex: 1,
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    gradientRing: {
        borderRadius: 55, // 이미지 너비의 절반 + 패딩
        padding: 3,
        marginBottom: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50, // 너비/높이의 절반
        backgroundColor: '#eee',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    userName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    joinDate: {
        color: '#999',
        fontSize: 14,
        marginBottom: 15,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        paddingHorizontal: 20,
    },
    statItem: {
        alignItems: 'center',
        padding: 5,
    },
    statNumber: {
        fontWeight: 'bold',
        fontSize: 18,
        color: '#4387E5',
    },
    statLabel: {
        color: '#777',
        fontSize: 13,
    },
    // Section Box (About, Health Summary, Social Media, Calendar)
    sectionBox: {
        flex: 1,
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 20,
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#4387E5',
    },
    aboutText: {
        fontSize: 14,
        lineHeight: 20,
        color: '#333',
    },
    // about 위젯에 추가될 편집 버튼 스타일
    editButton: {
        marginTop: 10,
        paddingVertical: 5,
        paddingHorizontal: 10,
        backgroundColor: '#4387E5',
        borderRadius: 5,
        alignSelf: 'flex-end', // 오른쪽 정렬
    },
    editButtonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    infoItem: {
        marginBottom: 8,
        alignSelf: 'stretch',
    },
    infoTitle: {
        fontWeight: 'bold',
        fontSize: 14,
        color: '#4A90E2',
    },
    infoContent: {
        fontSize: 12,
        color: '#555',
        marginLeft: 5,
    },
    noInfoText: {
        fontSize: 12,
        color: '#999',
        fontStyle: 'italic',
        textAlign: 'center',
        width: '100%',
        marginTop: 10,
    },
    // Posts Widget
    postsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignSelf: 'stretch',
    },
    postItem: {
        width: '48%', // 2열 배치
        aspectRatio: 1, // 정사각형
        marginBottom: 10,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#eee',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    postImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    postOverlay: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    postIcon: {
        width: 12,
        height: 12,
        tintColor: 'white',
        marginRight: 3,
    },
    postLikes: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    noPostsText: {
        fontSize: 12,
        color: '#999',
        fontStyle: 'italic',
        textAlign: 'center',
        width: '100%',
        marginTop: 10,
    },
});

export default DraggableResizAbleWidget;