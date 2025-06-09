// utils/customizationHelpers.ts

import { Widget } from '../types'; // 필요한 타입 정의가 있다면 import

// ✅ 새로운 위젯을 생성할 때 사용
export const createNewWidget = (
  type: string,
  position: { x: number; y: number },
  config: any = {}
): Widget => {
  return {
    id: generateUUID(),
    type,
    position,
    config,
  };
};

// ✅ UUID 생성기 (간단 버전)
export const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// ✅ 특정 위젯의 위치를 업데이트
export const updateWidgetPosition = (
  widgets: Widget[],
  widgetId: string,
  newX: number,
  newY: number
): Widget[] => {
  return widgets.map((widget) =>
    widget.id === widgetId
      ? {
          ...widget,
          position: { x: newX, y: newY },
        }
      : widget
  );
};

// ✅ 위젯 config 업데이트
export const updateWidgetConfig = (
  widgets: Widget[],
  widgetId: string,
  newConfig: any
): Widget[] => {
  return widgets.map((widget) =>
    widget.id === widgetId
      ? {
          ...widget,
          config: {
            ...widget.config,
            ...newConfig,
          },
        }
      : widget
  );
};

// ✅ 위젯 삭제
export const removeWidget = (
  widgets: Widget[],
  widgetId: string
): Widget[] => {
  return widgets.filter((widget) => widget.id !== widgetId);
};