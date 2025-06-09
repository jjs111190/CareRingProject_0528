from typing import List, Dict, Any
from pydantic import BaseModel

class WidgetSection(BaseModel):
    id: str
    type: str
    position: Dict[str, int]
    size: Dict[str, int] | None = None
    config: Dict[str, Any] | None = None

class SaveLayoutRequest(BaseModel):
    user_id: int
    layout: List[WidgetSection]