// components/layout/FreeformLayout.tsx

import React, { useCallback, useState, useRef } from 'react';
import { View, ImageBackground, StyleSheet, TouchableOpacity, Text, Dimensions, Image, Linking, Alert, ScrollView } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    useAnimatedGestureHandler,
    withSpring,
    runOnJS,
    withRepeat,
    withTiming,
    interpolate,
    Extrapolate,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { findNonOverlappingPosition } from '../../utils/layout';

import DraggableResizAbleWidget from './DraggableResizAbleWidget';

const { height: windowHeight } = Dimensions.get('window');

export interface LayoutSection {
    id: string;
    type: 'profileCard' | 'about' | 'healthSummary' | 'posts' | 'customText' | 'image' | 'link' | 'socialMedia' | 'calendar' | 'divider' | string;
    position: { x: number; y: number };
    size?: { width: number; height: number };
    config?: any;
}

interface FreeformLayoutProps {
    backgroundUrl: string | null;
    sections?: LayoutSection[];
    initialSections: LayoutSection[];
    editable: boolean;
    // CHANGE THIS LINE: onSectionsChange now expects a functional updater
    onSectionsChange: (updater: (prevSections: LayoutSection[]) => LayoutSection[]) => void;
    onPostPress?: (postId: number) => void;
    backgroundDimOverlay?: boolean;
    containerWidth: number;
}

const GRID_SIZE = 10;

// Here you define the IDs of widgets that should NOT be deletable.
// You need to ensure these IDs match the actual IDs of the widgets you want to protect.
// For example, if your initial 'profileCard' widget has an id 'profileCard123',
// you should add 'profileCard123' to this array.
const nonDeletableWidgetIds = ['profileCard', 'about', 'healthSummary', 'posts']; // Example: These are types, not necessarily unique IDs.
                                                                                // If your actual widget IDs are different, update this array.
                                                                                // e.g., ['myProfileCardWidget', 'myAboutWidget']

const FreeformLayout: React.FC<FreeformLayoutProps> = ({ backgroundUrl, sections = [], initialSections, editable, onSectionsChange, onPostPress, backgroundDimOverlay = false, containerWidth }) => {
    const insets = useSafeAreaInsets();

    const SCREEN_WIDTH = containerWidth;
    const SCREEN_HEIGHT = windowHeight - insets.top - insets.bottom;

    const MAX_LAYOUT_HEIGHT = SCREEN_HEIGHT * 4;
    const MAX_LAYOUT_WIDTH = SCREEN_WIDTH;

    const sectionsRef = useRef(sections);
    React.useEffect(() => {
        sectionsRef.current = sections;
    }, [sections]);

    const isColliding = (rect1: { x: number, y: number, width: number, height: number }, rect2: { x: number, y: number, width: number, height: number }) => {
        return (
            rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y
        );
    };

    const resolveOverlapAfterDrag = useCallback((
        currentWidgetId: string,
        proposedX: number,
        proposedY: number,
        proposedWidth: number,
        proposedHeight: number,
        allSections: LayoutSection[]
    ): { x: number, y: number } => {
        let finalX = proposedX;
        let finalY = proposedY;

        finalX = Math.max(0, Math.min(finalX, MAX_LAYOUT_WIDTH - proposedWidth));
        finalY = Math.max(0, Math.min(finalY, MAX_LAYOUT_HEIGHT - proposedHeight));

        const proposedRect = { x: finalX, y: finalY, width: proposedWidth, height: proposedHeight };

        let currentCollisions: LayoutSection[] = [];
        for (const otherWidget of allSections) {
            if (otherWidget.id === currentWidgetId) continue;

            const otherRect = {
                x: otherWidget.position.x,
                y: otherWidget.position.y,
                width: otherWidget.size?.width || 150,
                height: otherWidget.size?.height || 100,
            };

            if (isColliding(proposedRect, otherRect)) {
                currentCollisions.push(otherWidget);
            }
        }

        if (currentCollisions.length > 0) {
            const newPosition = findNonOverlappingPosition(
                allSections.filter(s => s.id !== currentWidgetId),
                { width: proposedWidth, height: proposedHeight },
                MAX_LAYOUT_WIDTH,
                MAX_LAYOUT_HEIGHT,
                GRID_SIZE
            );
            finalX = newPosition.x;
            finalY = newPosition.y;

            finalX = Math.max(0, Math.min(finalX, MAX_LAYOUT_WIDTH - proposedWidth));
            finalY = Math.max(0, Math.min(finalY, MAX_LAYOUT_HEIGHT - proposedHeight));
        }

        return {
            x: Math.round(finalX / GRID_SIZE) * GRID_SIZE,
            y: Math.round(finalY / GRID_SIZE) * GRID_SIZE
        };
    }, [MAX_LAYOUT_WIDTH, MAX_LAYOUT_HEIGHT]);

    const handleDragEnd = useCallback((
        widgetId: string,
        snappedX: number,
        snappedY: number,
        width: number,
        height: number
    ) => {
        const resolved = resolveOverlapAfterDrag(
            widgetId,
            snappedX,
            snappedY,
            width,
            height,
            sectionsRef.current
        );

        if (!resolved || resolved.x == null || resolved.y == null) return;

        // CHANGE THIS: Pass an updater function to onSectionsChange
        onSectionsChange(prevSections =>
            prevSections.map(s =>
                s.id === widgetId
                    ? { ...s, position: resolved, size: { width: width, height: height } }
                    : s
            )
        );
    }, [onSectionsChange, resolveOverlapAfterDrag]);

    const handleSectionsUpdate = useCallback((updater: (prevSections: LayoutSection[]) => LayoutSection[]) => {
        // This function correctly takes an updater and passes it to onSectionsChange
        onSectionsChange(updater);
    }, [onSectionsChange]);

    const handleAutoArrange = useCallback(() => {
        let arrangedSections: LayoutSection[] = [];
        const currentSectionsCopy = JSON.parse(JSON.stringify(sectionsRef.current));

        for (const section of currentSectionsCopy) {
            const size = section.size || { width: 150, height: 100 };
            const position = findNonOverlappingPosition(
                arrangedSections,
                size,
                MAX_LAYOUT_WIDTH,
                MAX_LAYOUT_HEIGHT,
                GRID_SIZE
            );

            arrangedSections.push({
                ...section,
                position: {
                    x: Math.round(position.x / GRID_SIZE) * GRID_SIZE,
                    y: Math.round(position.y / GRID_SIZE) * GRID_SIZE
                }
            });
        }
        // CHANGE THIS: Pass an updater function to onSectionsChange
        onSectionsChange(() => arrangedSections);
    }, [onSectionsChange, MAX_LAYOUT_WIDTH, MAX_LAYOUT_HEIGHT]);

    const handleResetLayout = useCallback(() => {
        Alert.alert('Reset Layout', 'Do you want to restore the initial layout?', [
            { text: 'Cancel', style: 'cancel' },
            // CHANGE THIS: Pass an updater function to onSectionsChange
            { text: 'Yes', onPress: () => onSectionsChange(() => initialSections) }
        ]);
    }, [onSectionsChange, initialSections]);

    return (
        <ScrollView
            contentContainerStyle={[
                styles.scrollViewContentContainer,
                { width: containerWidth },
            ]}
            showsVerticalScrollIndicator={false}
            horizontal={false}
            showsHorizontalScrollIndicator={false}
        >
            <ImageBackground
                source={backgroundUrl ? { uri: backgroundUrl } : undefined}
                style={[
                    styles.layoutContainer,
                    { width: containerWidth - (editable ? 4 : 0) },
                    editable && {
                        borderWidth: 2,
                        borderColor: '#4387E5',
                        borderStyle: 'dashed',
                    },
                ]}
                resizeMode="cover"
                imageStyle={styles.backgroundImageStyle}
            >
                {backgroundDimOverlay && <View style={styles.backgroundDimOverlay} />}

                {Array.isArray(sections) &&
  sections.map((section) => (
    <DraggableResizAbleWidget
      key={section.id}
      widget={section}
      editable={editable}
      onDragEnd={handleDragEnd}
      onSectionsChange={handleSectionsUpdate}
      onPostPress={onPostPress}
      nonDeletableWidgetIds={nonDeletableWidgetIds}
      MAX_LAYOUT_WIDTH={MAX_LAYOUT_WIDTH}
      MAX_LAYOUT_HEIGHT={MAX_LAYOUT_HEIGHT}
      GRID_SIZE={GRID_SIZE}
      SCREEN_WIDTH={SCREEN_WIDTH}
      SCREEN_HEIGHT={SCREEN_HEIGHT}
    />
  ))}
            </ImageBackground>

            {editable && (
                <View style={styles.toolbar}>
                    <TouchableOpacity style={styles.button} onPress={handleAutoArrange}>
                        <Text style={styles.buttonText}>auto sort</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={handleResetLayout}>
                        <Text style={styles.buttonText}>restoration</Text>
                    </TouchableOpacity>
                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollViewContentContainer: {
        minHeight: Dimensions.get('window').height * 4,
        flexGrow: 1,
    },
    layoutContainer: {
        flex: 1,
        minHeight: Dimensions.get('window').height * 4,
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#F5F5F5',
    },
    backgroundImageStyle: {
        // 배경 이미지 자체에 적용할 추가 스타일 (예: opacity, blur 등)
    },
    backgroundDimOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.2)',
        zIndex: 0,
    },
    toolbar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 10,
        paddingHorizontal: 15,
        backgroundColor: 'rgba(255,255,255,0.9)',
        width: '100%',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        zIndex: 100,
        marginTop: 20,
    },
    button: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        backgroundColor: '#4387E5',
        borderRadius: 8,
        minWidth: 100,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 5,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 15,
    },
});

export default FreeformLayout;