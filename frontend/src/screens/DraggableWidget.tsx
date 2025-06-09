import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';
// 올바른 방식 ✅
import useDraggableWidget from '../components/layout/useDraggableWidget';
import { Widget } from '../types/index';
import WidgetRenderer from '../components/layout/WidgetRenderer';

interface Props {
  widget: Widget;
  onDragEnd: (updatedWidget: Widget) => void;
}

const DraggableWidget: React.FC<Props> = ({ widget, onDragEnd }) => {
  const { pan, panHandlers } = useDraggableWidget(widget, onDragEnd);

  return (
    <Animated.View
      style={[
        styles.widgetContainer,
        {
          transform: pan.getTranslateTransform(),
        },
      ]}
      {...panHandlers}
    >
      <WidgetRenderer widget={widget} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  widgetContainer: {
    position: 'absolute',
  },
});

export default DraggableWidget;