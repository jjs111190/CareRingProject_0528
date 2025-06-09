from sqlalchemy import Column, Integer, ForeignKey, JSON
from app.database import Base

class WidgetLayout(Base):
    __tablename__ = "widget_layouts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    layout_json = Column(JSON, nullable=False)