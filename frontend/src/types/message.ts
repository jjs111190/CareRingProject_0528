export interface MessageType {
  id: number;
  content: string;
  sender_id: number;
  receiver_id: number;
  timestamp: string;
}

export interface MessageResponse extends MessageType {
  status?: string;
}

export interface JwtPayload {
  user_id: number;
  email: string;
  iat: number;
  exp: number;
} 