from .user import User
from .basic_info import BasicInfo
from .lifestyle import Lifestyle
from .post import Post
from .comment import Comment
from .message import Message  # ✅ 새로 추가한 모델
from .follow import Follow
from .comment_like import CommentLike  # 또는 models.py라면 from .models import CommentLike
from .mood import Mood  # ← 이것이 있어야 Base.metadata.create_all 이 먹힘
__all__ = [
    "User",
    "BasicInfo",
    "Lifestyle",
    "Post",
    "Comment",
    "Message",
    "Follow",
    "CommentLike",
   "Mood"
]