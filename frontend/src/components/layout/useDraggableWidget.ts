import { useRef, useEffect } from 'react';
import { Animated, PanResponder } from 'react-native';
import { Widget } from '../../types'; // Ensure this path is correct

interface DraggableConfig {
  widget: Widget;
  onDragEnd: (id: string, newPos: { x: number; y: number }) => void;
}

const useDraggableWidget = ({ widget, onDragEnd }: DraggableConfig) => {
  // Use a ref to keep track of the latest widget object.
  // This helps prevent stale closures in the PanResponder's callbacks.
  const widgetRef = useRef<Widget>(widget);
  useEffect(() => {
    widgetRef.current = widget;
  }, [widget]);

  // Determine the initial position, defaulting to {x: 0, y: 0} if undefined.
  const initialPosition = widget?.position ?? { x: 0, y: 0 };

  // Create an Animated.ValueXY to track the pan gesture's displacement.
  // It's initialized with the widget's current position.
  const pan = useRef(new Animated.ValueXY(initialPosition)).current;

  // Set up the PanResponder. This ref ensures the PanResponder instance is stable across renders.
  const panResponder = useRef(
    PanResponder.create({
      // Determines whether the view should become the responder on a touch start.
      onStartShouldSetPanResponder: () => true,

      // Called when the gesture starts.
      // We set the offset to the current accumulated value and reset the active value to zero.
      // This allows future movements (dx, dy) to be relative to the point where the drag started.
      onPanResponderGrant: () => {
        pan.setOffset({ x: pan.x._value, y: pan.y._value });
        pan.setValue({ x: 0, y: 0 });
      },

      // Called as the gesture moves.
      // Animated.event directly maps the gesture's dx and dy to pan.x and pan.y.
      // `useNativeDriver: false` is required because we're manipulating layout properties.
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),

      // Called when the gesture is released.
      onPanResponderRelease: () => {
        // Flattens the offset into the main value, making the current position the new base.
        // This is important for subsequent drags.
        pan.flattenOffset();

        // Retrieve the latest widget from the ref to ensure up-to-date data.
        const currentWidget = widgetRef.current;
        if (!currentWidget) {
          // Handle cases where widgetRef.current might be null (though unlikely in typical use).
          console.warn('Attempted to release drag on a null widget reference.');
          return;
        }

        // Call the onDragEnd callback with the widget's ID and its final position.
        // pan.x._value and pan.y._value represent the final x and y coordinates.
        onDragEnd(currentWidget.id, {
          x: pan.x._value,
          y: pan.y._value,
        });
      },
    })
  ).current;

  // Return the animated value and the pan handlers to be applied to an Animated.View.
  return {
    pan,
    panHandlers: panResponder.panHandlers,
  };
};

export default useDraggableWidget;