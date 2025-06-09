from typing import Any, List, Optional
from pydantic import BaseModel

class Position(BaseModel):
    x: int
    y: int

class Size(BaseModel):
    width: int
    height: int

class WidgetConfig(BaseModel):
    nickname: Optional[str] = None
    joinText: Optional[str] = None
    imageUrl: Optional[str] = None
    followerCount: Optional[int] = None
    followingCount: Optional[int] = None
    text: Optional[str] = None
    data: Optional[dict] = None
    posts: Optional[list] = None

class LayoutSection(BaseModel):
    id: str
    type: str
    position: Position
    size: Size
    config: WidgetConfig

class CustomizationSchema(BaseModel):
    backgroundUrl: Optional[str]
    widgets: List[LayoutSection]  # ✅ 여기가 핵심 수정