// utils/layout.ts

import { LayoutSection } from '../components/layout/FreeformLayout'; // FreeformLayout에서 정의한 LayoutSection 타입을 가져옵니다.
import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// AABB (Axis-Aligned Bounding Box) 충돌 감지 헬퍼 함수
const isCollidingRect = (
  rect1: { x: number; y: number; width: number; height: number },
  rect2: { x: number; y: number; width: number; height: number }
): boolean => {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
};

// 겹치지 않는 위치를 찾아주는 함수
export const findNonOverlappingPosition = (
  existingWidgets: LayoutSection[],
  newWidgetSize: { width: number; height: number },
  canvasWidth: number = SCREEN_WIDTH, // 기본값으로 화면 너비 사용
  canvasHeight: number = SCREEN_HEIGHT * 2, // 충분히 큰 높이 (스크롤 가능성 고려)
  gridSize: number = 10,
): { x: number; y: number } => {

  // 작은 범위부터 넓은 범위까지 탐색하여 최적의 위치를 찾습니다.
  // 0,0 부터 시작해서 그리드 단위로 탐색합니다.
  for (let y = 0; y + newWidgetSize.height <= canvasHeight; y += gridSize) {
    for (let x = 0; x + newWidgetSize.width <= canvasWidth; x += gridSize) {
      const proposedRect = { x, y, ...newWidgetSize };
      let hasCollision = false;

      for (const existingWidget of existingWidgets) {
        const existingWidgetRect = {
          x: existingWidget.position.x,
          y: existingWidget.position.y,
          width: existingWidget.size?.width || 150, // 기본 위젯 크기 사용
          height: existingWidget.size?.height || 100, // 기본 위젯 크기 사용
        };

        if (isCollidingRect(proposedRect, existingWidgetRect)) {
          hasCollision = true;
          break;
        }
      }

      if (!hasCollision) {
        return { x, y };
      }
    }
  }

  // 모든 공간을 탐색했지만 겹치지 않는 위치를 찾지 못했을 경우
  // 화면 하단이나 안전한 기본 위치를 반환 (예: 기존 위젯 아래)
  const maxY = existingWidgets.reduce((max, w) => Math.max(max, w.position.y + (w.size?.height || 100)), 0);
  return { x: 0, y: maxY + gridSize };
};