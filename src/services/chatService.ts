// services/chatService.ts
import api from '../api/axiosInstance';
import { apiGet, apiPost, apiPut, apiDelete } from './apiService';

export type MessageType = 'text' | 'audio' | 'video';

export interface ChatMessage {
  id: number;
  session: number;
  sender: number;
  sender_name?: string;
  message_type: MessageType;
  text?: string | null;
  file?: string | null;
  link?: string | null;
  is_read: boolean;
  created_at: string;
}

// ========== API METHODS ==========

/**
 * Get last 50 messages for a session.
 * Endpoint: GET /api/chat/messages/<session_id>/
 */
export const getMessages = async (sessionId: number): Promise<ChatMessage[]> => {
  const response = await apiGet(`chat/messages/${sessionId}/`);
  return response; // response is already the array of messages
};

/**
 * Send a text message.
 * Endpoint: POST /api/chat/send/
 * Payload: { session, message_type, text }
 */
export const sendTextMessage = async (sessionId: number, text: string) => {
  const formData = new FormData();
  formData.append('session', sessionId.toString());
  formData.append('message_type', 'text');
  formData.append('text', text);

  const response = await api.post('/chat/send/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

/**
 * Send an audio or video file.
 * Endpoint: POST /api/chat/send/
 * Payload: { session, message_type, file }
 */
export const sendFileMessage = async (
  sessionId: number,
  messageType: 'audio' | 'video',
  file: { uri: string; type: string; name: string }
) => {
  const formData = new FormData();
  formData.append('session', sessionId.toString());
  formData.append('message_type', messageType);
  formData.append('file', {
    uri: file.uri,
    type: file.type,
    name: file.name,
  } as any);

  const response = await api.post('/chat/send/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

/**
 * Update a text message (only sender, only if session active).
 * Endpoint: PUT /api/chat/update/<message_id>/
 * Payload: { text }
 */
export const updateMessage = async (messageId: number, newText: string) => {
  const response = await apiPut(`chat/update/${messageId}/`, { text: newText });
  return response.data;
};

/**
 * Delete a message (only sender, only if session active).
 * Endpoint: DELETE /api/chat/delete/<message_id>/
 */
export const deleteMessage = async (messageId: number) => {
  const response = await apiDelete(`chat/delete/${messageId}/`);
  return response.data;
};

/**
 * Mark all messages in a session as read (except current user's own).
 * Endpoint: POST /api/chat/read/<session_id>/
 */
export const markMessagesRead = async (sessionId: number) => {
  const response = await apiPost(`chat/read/${sessionId}/`, {});
  return response.data;
};

/**
 * Get unread message count for a session.
 * Endpoint: GET /api/chat/unread/<session_id>/
 */
export const getUnreadCount = async (sessionId: number): Promise<number> => {
  const response = await apiGet(`chat/unread/${sessionId}/`);
  return response.unread_count;
};