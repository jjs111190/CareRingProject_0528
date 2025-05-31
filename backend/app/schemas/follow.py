from pydantic import BaseModel

class FollowResponse(BaseModel):
    follower_count: int
    following_count: int
    is_following: bool