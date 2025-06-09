import React from 'react';
import { View, ImageBackground, StyleSheet } from 'react-native';
import DraggableWidget from './DraggableWidget';
import MoodWidget from './MoodWidget';

interface WidgetData {
  type: 'mood'; // 위젯 종류를 확장하려면 여기 추가
  position: { x: number; y: number };
  data: any;
}

interface DecoratedProfileProps {
  background: string;
  widgets: WidgetData[];
}

const DecoratedProfile: React.FC<DecoratedProfileProps> = ({ background, widgets }) => {
  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: background }}
        style={styles.background}
        resizeMode="cover"
      >
        {widgets.map((widget, index) => (
          <DraggableWidget key={index} initialPosition={widget.position}>
            {widget.type === 'mood' && <MoodWidget mood={widget.data} />}
            {/* 다른 위젯 타입이 있다면 여기에 조건 추가 */}
          </DraggableWidget>
        ))}
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});

export default DecoratedProfile;