// app/agent-chat/page.tsx
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import axiosInstance from '@/api/axiosInstance';
import { BASE_URL } from '@/config/env';
import { getTokens } from '@/services/storageService'; // adjust path as needed

// ---------- Types ----------
interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  isEscalation?: boolean;
  doubtData?: any;
  escalationReason?: string;
}

interface Conversation {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  messages: Message[];
}

interface StreamEvent {
  event: 'start' | 'token' | 'done' | 'escalate' | 'error';
  data: any;
}

// ---------- Web version of streamMessageToAI ----------
async function* streamMessageToAIWeb(
  message: string,
  conversationId: number | null,
  signal?: AbortSignal
): AsyncGenerator<StreamEvent> {
  const tokens = await getTokens();
  const accessToken = tokens?.access || '';

  const response = await fetch(`${BASE_URL}ai/chat/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      message,
      conversation_id: conversationId,
    }),
    signal,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(err.detail || `HTTP ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('ReadableStream not supported');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split('\n\n');
    buffer = parts.pop() || '';

    for (const rawEvent of parts) {
      const lines = rawEvent.split('\n');
      let eventType = '';
      let data = '';

      for (const line of lines) {
        if (line.startsWith('event:')) {
          eventType = line.substring(6).trim();
        } else if (line.startsWith('data:')) {
          data += line.substring(5).trim();
        }
      }

      if (!data) continue;

      try {
        const parsed = JSON.parse(data);
        // The event type might be embedded in the JSON or sent as an SSE field
        const finalEvent = eventType || parsed.event;
        const finalData = eventType ? parsed : parsed.data;

        yield {
          event: finalEvent as StreamEvent['event'],
          data: finalData,
        };
      } catch (e) {
        console.warn('SSE parse error:', data);
      }
    }
  }
}

// ---------- Subcomponents ----------
const CodeBlock = ({ code, language }: { code: string; language: string }) => {
  const handleRun = () => {
    const encodedCode = encodeURIComponent(code);
    const urlMap: Record<string, string> = {
      html: 'https://onecompiler.com/html',
      htmlcss: 'https://onecompiler.com/html',
      css: 'https://onecompiler.com/javascript',
      javascript: 'https://onecompiler.com/javascript',
      js: 'https://onecompiler.com/javascript',
      python: 'https://onecompiler.com/python',
      java: 'https://onecompiler.com/java',
      cpp: 'https://onecompiler.com/cpp',
      'c++': 'https://onecompiler.com/cpp',
    };
    const base = urlMap[language.toLowerCase()] || 'https://onecompiler.com/embed';
    window.open(`${base}?code=${encodedCode}`, '_blank');
  };

  return (
    <div className="my-2 rounded-lg border border-white/10 bg-black/30">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/10">
        <span className="text-xs font-semibold uppercase text-violet-300">{language || 'code'}</span>
        <button
          onClick={handleRun}
          className="rounded-full bg-green-500 px-3 py-0.5 text-xs font-bold text-white hover:bg-green-600"
        >
          ▶ Run
        </button>
      </div>
      <pre className="overflow-auto p-3 text-sm text-gray-200 font-mono whitespace-pre-wrap">
        <code>{code}</code>
      </pre>
    </div>
  );
};

const parseMessageContent = (content: string) => {
  const parts: { type: 'text' | 'code'; content: string; language?: string }[] = [];
  const regex = /```(\w+)?\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const [fullMatch, language, code] = match;
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: content.substring(lastIndex, match.index) });
    }
    parts.push({ type: 'code', language: language || 'text', content: code.trim() });
    lastIndex = match.index + fullMatch.length;
  }
  const remaining = content.substring(lastIndex);
  if (remaining) parts.push({ type: 'text', content: remaining });
  return parts;
};

// ---------- Main Component ----------
export default function AgentChatPage() {
  const { t } = useTranslation();
  const router = useRouter();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [streamingMessage, setStreamingMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasReceivedToken, setHasReceivedToken] = useState(false);
  const pendingUserMessageRef = useRef<string | null>(null);
  const escalationDataRef = useRef<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [feedbackGiven, setFeedbackGiven] = useState<Record<number, number>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentConvo = conversations.find((c) => c.id === currentConversationId);
  const messages = currentConvo?.messages || [];

  // Auto‑scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, streamingMessage]);

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    setFetching(true);
    try {
      const response = await axiosInstance.get(`${BASE_URL}ai/chat/`);
      const json = response.data;
      if (json.success) {
        const data: Conversation[] = json.data || [];
        setConversations(
          data.sort(
            (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          )
        );
      } else {
        toast.error(json.message || 'Failed to load conversations');
      }
    } catch (error: any) {
      console.error('Fetch conversations error:', error);
      toast.error('Could not load conversations');
    } finally {
      setFetching(false);
    }
  };

  const createNewChat = async () => {
    if (isStreaming || loading) {
      toast.error('Please wait for the current response to finish.');
      return;
    }
    if (!currentConversationId || messages.length === 0) {
      setSidebarOpen(false);
      return;
    }
    try {
      const response = await axiosInstance.post(`${BASE_URL}ai/chat/`, { create_only: true });
      const json = response.data;
      if (json.success) {
        const newConv: Conversation = json.data;
        setConversations((prev) => [newConv, ...prev]);
        setCurrentConversationId(newConv.id);
        setSidebarOpen(false);
        resetChatState();
      } else {
        toast.error(json.message || 'Failed to create new chat');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Could not create new chat');
    }
  };

  const resetChatState = () => {
    setInputText('');
    setStreamingMessage('');
    setHasReceivedToken(false);
    setIsStreaming(false);
    setLoading(false);
    pendingUserMessageRef.current = null;
    escalationDataRef.current = null;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setLoading(false);
    setStreamingMessage('');
    setHasReceivedToken(false);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    axiosInstance
      .post(`${BASE_URL}ai/upload/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((res) => {
        const imageUrl = res.data.url;
        setInputText((prev) => (prev ? prev + ' ' : '') + `[Image: ${imageUrl}]`);
      })
      .catch(() => toast.error('Failed to upload image'));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const sendMessage = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || loading || isStreaming) return;
    setInputText('');

    if (currentConvo) {
      const optimisticUserMessage: Message = {
        id: Date.now(),
        role: 'user',
        content: trimmed,
        created_at: new Date().toISOString(),
      };
      const updated = {
        ...currentConvo,
        messages: [...currentConvo.messages, optimisticUserMessage],
        updated_at: new Date().toISOString(),
      };
      setConversations((prev) => prev.map((c) => (c.id === currentConvo.id ? updated : c)));
    } else {
      pendingUserMessageRef.current = trimmed;
    }

    setLoading(true);
    setIsStreaming(true);
    setHasReceivedToken(false);
    setStreamingMessage('');

    abortControllerRef.current = new AbortController();

    try {
      const eventGenerator = streamMessageToAIWeb(
        trimmed,
        currentConvo?.id || null,
        abortControllerRef.current.signal
      );

      let conversationIdFromServer = currentConvo?.id || null;
      let latestFullText = '';

      for await (const event of eventGenerator) {
        if (abortControllerRef.current?.signal.aborted) break;

        switch (event.event) {
          case 'start': {
            const serverId = event.data.conversation_id;
            if (pendingUserMessageRef.current) {
              const userMsg = pendingUserMessageRef.current;
              const newConversation: Conversation = {
                id: serverId,
                title: userMsg.slice(0, 30),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                messages: [
                  {
                    id: Date.now(),
                    role: 'user',
                    content: userMsg,
                    created_at: new Date().toISOString(),
                  },
                ],
              };
              setConversations((prev) => [newConversation, ...prev]);
              setCurrentConversationId(serverId);
              pendingUserMessageRef.current = null;
              conversationIdFromServer = serverId;
            } else {
              conversationIdFromServer = serverId;
            }
            break;
          }

          case 'token': {
            latestFullText += event.data;
            setStreamingMessage(latestFullText);
            setHasReceivedToken(true);
            break;
          }

          case 'done': {
            const finalMessage =
              latestFullText.length > 0
                ? latestFullText
                : event.data.assistant_message || '';
            if (finalMessage) {
              const newAssistantMessage: Message = {
                id: Date.now() + 1,
                role: 'assistant',
                content: finalMessage,
                created_at: new Date().toISOString(),
              };
              setConversations((prev) => {
                const convIndex = prev.findIndex(
                  (c) => c.id === conversationIdFromServer
                );
                if (convIndex !== -1) {
                  const updated = { ...prev[convIndex] };
                  updated.messages = [...updated.messages, newAssistantMessage];
                  updated.updated_at = new Date().toISOString();
                  const newList = [...prev];
                  newList[convIndex] = updated;
                  return newList.sort(
                    (a, b) =>
                      new Date(b.updated_at).getTime() -
                      new Date(a.updated_at).getTime()
                  );
                }
                return prev;
              });
            }
            resetStreamAfterDone();
            break;
          }

          case 'escalate': {
            const doubtData = event.data.doubt_data || {};
            const reason = event.data.reason || 'ai_unable';
            escalationDataRef.current = doubtData;

            let messageText = '';
            switch (reason) {
              case 'max_user_messages':
                messageText =
                  "You've asked several questions. It might be better to post your doubt for an expert.";
                break;
              case 'inactivity':
                messageText =
                  "It seems you were inactive. Would you like to post this as a doubt for a human expert?";
                break;
              case 'duplicate':
                messageText =
                  "It seems you asked the same question. Would you like to ask a human expert for detailed help?";
                break;
              case 'max_turns':
                messageText =
                  "We've reached the message limit. Would you like to post your doubt for a human expert?";
                break;
              default:
                messageText =
                  "I'm unable to solve this completely. Would you like to ask a human expert?";
            }

            const escalationMsg: Message = {
              id: Date.now() + 2,
              role: 'assistant',
              content: messageText,
              created_at: new Date().toISOString(),
              isEscalation: true,
              doubtData,
              escalationReason: reason,
            };

            setConversations((prev) => {
              const convIndex = prev.findIndex(
                (c) => c.id === conversationIdFromServer
              );
              if (convIndex !== -1) {
                const updated = { ...prev[convIndex] };
                updated.messages = [...updated.messages, escalationMsg];
                updated.updated_at = new Date().toISOString();
                const newList = [...prev];
                newList[convIndex] = updated;
                return newList.sort(
                  (a, b) =>
                    new Date(b.updated_at).getTime() -
                    new Date(a.updated_at).getTime()
                );
              }
              return prev;
            });
            resetStreamAfterDone();
            break;
          }

          case 'error': {
            const errMsg = event.data;
            if (errMsg && errMsg.includes('Daily message limit')) {
              toast.error(errMsg, { duration: 5000 });
            } else {
              toast.error(errMsg || 'Stream error');
            }
            resetStreamAfterDone();
            break;
          }
        }
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('❌ Streaming error:', error);
        toast.error(error.message || 'Failed to send message');
      }
      resetStreamAfterDone();
    }
  };

  const resetStreamAfterDone = () => {
    setStreamingMessage('');
    setIsStreaming(false);
    setLoading(false);
    setHasReceivedToken(false);
    abortControllerRef.current = null;
  };

  const handleFeedback = async (messageId: number, rating: number) => {
    if (feedbackGiven[messageId]) return;
    try {
      const response = await axiosInstance.post(`${BASE_URL}ai/feedback/`, {
        message_id: messageId,
        rating,
      });
      if (response.data.success) {
        setFeedbackGiven((prev) => ({ ...prev, [messageId]: rating }));
      } else {
        toast.error(response.data.message || 'Could not submit feedback.');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Feedback submission failed.');
    }
  };

  const handleAskExpert = (doubtData: any) => {
    router.push(
      `/student/post-doubt?title=${encodeURIComponent(
        doubtData.title || ''
      )}&description=${encodeURIComponent(
        doubtData.description || ''
      )}&category=${encodeURIComponent(doubtData.category || '')}&mode=pool`
    );
  };

  const switchConversation = (id: number) => {
    if (isStreaming || loading) {
      toast.error('Please wait for the current response to finish.');
      return;
    }
    setCurrentConversationId(id);
    setSidebarOpen(false);
    resetChatState();
  };

  const renderMessageContent = (content: string) => {
    const parts = parseMessageContent(content);
    return parts.map((part, index) => {
      if (part.type === 'code') {
        return (
          <CodeBlock key={index} code={part.content} language={part.language || 'text'} />
        );
      }
      return (
        <span key={index} className="whitespace-pre-wrap">
          {part.content}
        </span>
      );
    });
  };

  const isNewChat = !currentConversationId || messages.length === 0;

  return (
    <div className="flex h-screen bg-[#0B0B1A] text-white">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'block' : 'hidden'
        } lg:block fixed lg:static z-40 inset-y-0 left-0 w-80 bg-[#0B0B1A] border-r border-white/10 p-4 overflow-y-auto`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Chats</h2>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/70">
            ✕
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {fetching && <p className="text-sm text-white/50">Loading...</p>}
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => switchConversation(conv.id)}
              className={`text-left p-3 rounded-xl hover:bg-white/5 transition ${
                conv.id === currentConversationId
                  ? 'bg-violet-500/20 border border-violet-400/30'
                  : ''
              }`}
            >
              <p className="font-medium truncate">{conv.title || 'New Chat'}</p>
              <p className="text-xs text-white/40 mt-1">
                {new Date(conv.updated_at).toLocaleDateString()}
              </p>
            </button>
          ))}
          <button
            onClick={createNewChat}
            disabled={isStreaming || loading}
            className="mt-4 w-full rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            + New Chat
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main chat */}
      <div className="flex-1 flex flex-col h-full">
        <header className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#0B0B1A]">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-white text-2xl">
              ☰
            </button>
            <h1 className="text-lg font-bold">Knowmato AI</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/credits')}
              className="rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold hover:bg-white/20"
            >
              Upgrade
            </button>
            {!isNewChat && (
              <button
                onClick={createNewChat}
                disabled={isStreaming || loading}
                className="rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold hover:bg-white/20 disabled:opacity-50"
              >
                New
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {fetching && messages.length === 0 && (
            <div className="text-center text-white/50">Loading conversations...</div>
          )}
          {!fetching && messages.length === 0 && !isStreaming && (
            <div className="text-center text-white/50">No messages. Start a new chat!</div>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-violet-600 text-white rounded-br-md'
                    : 'bg-white/5 border border-white/10 text-white/90 rounded-bl-md'
                }`}
              >
                {msg.isEscalation ? (
                  <>
                    <p className="text-sm">{msg.content}</p>
                    <button
                      onClick={() => handleAskExpert(msg.doubtData)}
                      className="mt-3 rounded-full bg-pink-500 px-5 py-2 text-sm font-bold text-white hover:bg-pink-600"
                    >
                      👨‍🏫 Ask Expert
                    </button>
                  </>
                ) : (
                  <div className="text-sm">{renderMessageContent(msg.content)}</div>
                )}
                {msg.role === 'assistant' && !msg.isEscalation && (
                  <div className="flex gap-3 mt-2">
                    <button
                      onClick={() => handleFeedback(msg.id, 1)}
                      disabled={!!feedbackGiven[msg.id]}
                      className={`text-lg ${
                        feedbackGiven[msg.id] === 1 ? 'text-yellow-400' : 'text-white/30'
                      } ${feedbackGiven[msg.id] ? '' : 'hover:text-yellow-300'}`}
                    >
                      👍
                    </button>
                    <button
                      onClick={() => handleFeedback(msg.id, -1)}
                      disabled={!!feedbackGiven[msg.id]}
                      className={`text-lg ${
                        feedbackGiven[msg.id] === -1 ? 'text-yellow-400' : 'text-white/30'
                      } ${feedbackGiven[msg.id] ? '' : 'hover:text-yellow-300'}`}
                    >
                      👎
                    </button>
                  </div>
                )}
                <p className="text-[10px] text-white/40 text-right mt-1">
                  {new Date(msg.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))}
          {isStreaming && !hasReceivedToken && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-2xl bg-white/5 border border-white/10 px-4 py-3 animate-pulse">
                <div className="h-3 bg-white/20 rounded w-3/4 mb-2" />
                <div className="h-3 bg-white/20 rounded w-1/2" />
              </div>
            </div>
          )}
          {isStreaming && streamingMessage && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-2xl bg-white/5 border border-white/10 px-4 py-3">
                <div className="text-sm">{renderMessageContent(streamingMessage)}</div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-white/10 bg-[#0B0B1A]">
          <div className="flex items-end gap-3">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Ask me anything..."
              className="flex-1 resize-none rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/40 outline-none focus:border-violet-400"
            />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20"
            >
              📎
            </button>
            {isStreaming ? (
              <button
                onClick={stopGeneration}
                className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white font-bold hover:bg-red-600"
              >
                ⏹
              </button>
            ) : (
              <button
                onClick={sendMessage}
                disabled={loading || !inputText.trim()}
                className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold hover:bg-violet-700 disabled:opacity-50"
              >
                {loading ? <span className="animate-spin">⏳</span> : '➤'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}