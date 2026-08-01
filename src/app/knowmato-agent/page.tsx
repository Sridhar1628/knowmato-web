'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import axiosInstance from '../../api/axiosInstance';
import { BASE_URL } from '../../config/env';
import { streamMessageToAI } from '../../services/aiService';
import styles from './ThinkingIndicator.module.css';
import { handleAINavigation } from '@/utils/aiNavigation';


const LAST_CONVERSATION_KEY = "knowmato_last_conversation";


// ---------- Types ----------
interface Message {
  id: number;
  role: 'user' | 'assistant';
  agent_used?: 'KNOWMATO' | 'KNOWMATO_PLUS';
  content: string;
  created_at: string;
  guidance?: Guidance | null;
  isEscalation?: boolean;
  doubtData?: any;
  escalationReason?: string;
}

interface Conversation {
  id: number;
  title: string;
  current_agent: 'KNOWMATO' | 'KNOWMATO_PLUS';
  created_at: string;
  updated_at: string;
  messages: Message[];
}

interface GuidanceAction {
  type: string;
  title: string;
  subtitle?: string;
  icon?: string;
  screen?: string;
  agent?: 'KNOWMATO' | 'KNOWMATO_PLUS';
}

interface Guidance {
  type: string;
  title: string;
  message: string;
  actions: GuidanceAction[];
}

// ---------- Theme ----------
const THEME = {
  KNOWMATO: {
    primary: '#7C3AED',
    primaryLight: '#A78BFA',
    secondary: '#EC4899',
    background: '#0B0B1A',
    headerBg: '#7C3AED',
    userBubble: '#7C3AED',
    sendButton: '#7C3AED',
    newChatButton: '#7C3AED',
    activeConversation: 'rgba(124,58,237,0.20)',
    cardBg: 'rgba(255,255,255,0.06)',
    border: 'rgba(255,255,255,0.10)',
    text: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.75)',
    textMuted: 'rgba(255,255,255,0.45)',
    success: '#10B981',
    warning: '#F59E0B',
    info: '#3B82F6',
    inputBg: 'rgba(255,255,255,0.08)',
  },
  KNOWMATO_PLUS: {
    primary: '#D97706',
    primaryLight: '#FBBF24',
    secondary: '#EC4899',
    background: '#0B0B1A',
    headerBg: '#1E293B',
    userBubble: '#D97706',
    sendButton: '#D97706',
    newChatButton: '#D97706',
    activeConversation: 'rgba(217,119,6,0.20)',
    cardBg: 'rgba(255,255,255,0.06)',
    border: 'rgba(255,255,255,0.10)',
    text: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.75)',
    textMuted: 'rgba(255,255,255,0.45)',
    success: '#10B981',
    warning: '#F59E0B',
    info: '#3B82F6',
    inputBg: 'rgba(255,255,255,0.08)',
  },
};

// ---------- Guidance Action Meta ----------
const ACTION_META: Record<string, { icon: string; subtitle: string }> = {
  Courses: { icon: '📚', subtitle: 'Browse available courses' },
  MyCourses: { icon: '🎯', subtitle: 'View your enrolled courses' },
  Internships: { icon: '💼', subtitle: 'Explore internships' },
  Jobs: { icon: '🏢', subtitle: 'Find job opportunities' },
  Assessments: { icon: '📝', subtitle: 'Test your knowledge' },
  SkillScore: { icon: '⭐', subtitle: 'Track your progress' },
  Certificates: { icon: '🏆', subtitle: 'View earned certificates' },
  KNOWMATO_PLUS: { icon: '🤖', subtitle: 'Continue with KnowMato+' },
};

// ---------- Components ----------
const CodeBlock: React.FC<{ code: string; language: string }> = ({ code, language }) => {
  const handleRun = () => {
    const encodedCode = encodeURIComponent(code);
    let url = '';
    const lang = language?.toLowerCase();
    if (lang === 'html' || lang === 'htmlcss') url = `https://onecompiler.com/html?code=${encodedCode}`;
    else if (lang === 'css' || lang === 'javascript' || lang === 'js') url = `https://onecompiler.com/javascript?code=${encodedCode}`;
    else if (lang === 'python') url = `https://onecompiler.com/python?code=${encodedCode}`;
    else if (lang === 'java') url = `https://onecompiler.com/java?code=${encodedCode}`;
    else if (lang === 'cpp' || lang === 'c++') url = `https://onecompiler.com/cpp?code=${encodedCode}`;
    else url = `https://onecompiler.com/embed?code=${encodedCode}`;
    window.open(url, '_blank');
  };

  return (
    <div className="bg-black/30 rounded-lg border border-white/10 p-2 my-1">
      <div className="flex justify-between items-center mb-1">
        <span className="text-purple-400 text-xs font-semibold uppercase">{language || 'code'}</span>
        <button onClick={handleRun} className="bg-green-500 px-3 py-0.5 rounded-full text-white text-xs font-bold">
          ▶ Run
        </button>
      </div>
      <pre className="bg-black/20 p-2 rounded text-gray-200 font-mono text-sm whitespace-pre-wrap">
        <code>{code}</code>
      </pre>
    </div>
  );
};

const parseMessageContent = (content: string) => {
  const parts: Array<{ type: 'text' | 'code'; content?: string; language?: string; code?: string }> = [];
  const regex = /```(\w+)?\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const [fullMatch, language, code] = match;
    const textBefore = content.substring(lastIndex, match.index);
    if (textBefore) parts.push({ type: 'text', content: textBefore });
    parts.push({ type: 'code', language: language || 'text', code: code.trim() });
    lastIndex = match.index + fullMatch.length;
  }
  const remaining = content.substring(lastIndex);
  if (remaining) parts.push({ type: 'text', content: remaining });
  return parts;
};

// ---------- Updated Guidance Card ----------
const GuidanceCard: React.FC<{ guidance: Guidance; onActionPress: (action: GuidanceAction) => void }> = ({
  guidance,
  onActionPress,
}) => (
  <div className="mt-3 p-4 rounded-2xl bg-purple-900/20 border border-purple-500/35">
    <h4 className="text-white text-base font-bold">{guidance.title}</h4>
    <p className="text-gray-300 mt-2 text-sm leading-relaxed">{guidance.message}</p>
    <div className="mt-4 flex flex-col gap-3">
      {guidance.actions.map((action, idx) => {
        const meta = ACTION_META[action.type] ?? (action.agent ? ACTION_META[action.agent] : undefined);
        const icon = meta?.icon ?? action.icon ?? '';
        const subtitle = action.subtitle ?? meta?.subtitle ?? '';

        return (
          <button
            key={idx}
            onClick={() => onActionPress(action)}
            className="flex items-center justify-between bg-[#211B46] rounded-2xl p-3 border border-white/10 hover:bg-white/5 transition text-left"
          >
            <div className="flex items-center gap-3 flex-1">
              <span className="text-2xl">{icon}</span>
              <div>
                <p className="text-white font-bold text-sm">{action.title}</p>
                <p className="text-[#A7A7C4] text-xs mt-0.5">{subtitle}</p>
              </div>
            </div>
            <span className="text-purple-500 text-2xl font-bold ml-2">›</span>
          </button>
        );
      })}
    </div>
  </div>
);

const SkeletonPlaceholder: React.FC = () => (
  <div className="self-start mb-3">
    <div className="bg-white/5 border border-white/10 rounded-2xl rounded-bl-md px-4 py-3">
      <div className="flex items-center gap-2">
        <span
          className="typing-dot w-2.5 h-2.5 rounded-full bg-violet-400"
          style={{ animationDelay: "0ms" }}
        />
        <span
          className="typing-dot w-2.5 h-2.5 rounded-full bg-violet-400"
          style={{ animationDelay: "200ms" }}
        />
        <span
          className="typing-dot w-2.5 h-2.5 rounded-full bg-violet-400"
          style={{ animationDelay: "400ms" }}
        />
      </div>
    </div>
  </div>
);

const StreamMessage: React.FC<{ content: string }> = ({ content }) => {
  const parts = parseMessageContent(content);
  return (
    <>
      {parts.map((part, idx) =>
        part.type === 'code' ? (
          <CodeBlock key={idx} code={part.code!} language={part.language!} />
        ) : (
          <span key={idx} className="text-white text-sm leading-5 whitespace-pre-wrap">
            {part.content}
          </span>
        )
      )}
    </>
  );
};

// ---------- Main Screen ----------
export default function AgentChatScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useSelector((state: any) => state.auth.user);

  const defaultAgent = (searchParams.get('defaultAgent') as 'KNOWMATO' | 'KNOWMATO_PLUS') || 'KNOWMATO';
  const [selectedAgent, setSelectedAgent] = useState<'KNOWMATO' | 'KNOWMATO_PLUS'>(defaultAgent);
  const [agentMenuVisible, setAgentMenuVisible] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [streamingMessage, setStreamingMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasReceivedToken, setHasReceivedToken] = useState(false);
  const pendingUserMessageRef = useRef<string | null>(null);
  const tempConversationIdRef = useRef<number | null>(null);
  const escalationDataRef = useRef<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [feedbackGiven, setFeedbackGiven] = useState<Record<number, number>>({});

  const currentConvo = conversations.find((c) => c.id === currentConversationId);
  const messages = currentConvo?.messages || [];
  const theme = THEME[selectedAgent];



  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (currentConversationId && messages.length > 0) {
      scrollToBottom();
    }
  }, [currentConversationId, messages.length, scrollToBottom]);

  const fetchConversations = async () => {
    setFetching(true);
    try {
      const response = await axiosInstance.get(`${BASE_URL}ai/chat/`);
      if (response.data.success) {
        const data: Conversation[] = response.data.data || [];
        const sorted = data.sort(
          (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
        setConversations(sorted);

        const savedConversationId = localStorage.getItem(LAST_CONVERSATION_KEY);
        if (savedConversationId) {
          const savedId = Number(savedConversationId);

          const existingConversation = sorted.find(
            (conv) => conv.id === savedId
          );

          if (existingConversation) {
            setCurrentConversationId(savedId);
            setSelectedAgent(existingConversation.current_agent);
          } else {
            localStorage.removeItem(LAST_CONVERSATION_KEY);

            if (sorted.length > 0) {
              selectConversation(sorted[0].id);
              setSelectedAgent(sorted[0].current_agent);
            } else {
              setCurrentConversationId(null);
            }
          }
        } else {
          if (sorted.length > 0) {
            setCurrentConversationId(null);
          }
        }
      } else {
        alert(response.data.message || 'Failed to load conversations');
      }
    } catch (error: any) {
      console.error(error);
      if (error.response?.status === 401) alert('Session Expired. Please login again.');
      else alert('Could not connect to server');
    } finally {
      setFetching(false);
    }
  };

  const createNewChat = async () => {
    if (isStreaming || loading) {
      alert('Please wait for the current response to finish.');
      return;
    }
    if (!currentConversationId || messages.length === 0) {
      setSidebarOpen(false);
      return;
    }
    try {
      const response = await axiosInstance.post(`${BASE_URL}ai/chat/`, { create_only: true });
      if (response.data.success) {
        const newConv: Conversation = response.data.data;
        setConversations((prev) => [newConv, ...prev]);
        selectConversation(newConv.id);
        setSidebarOpen(false);
        setInputText('');
        setStreamingMessage('');
        setHasReceivedToken(false);
        pendingUserMessageRef.current = null;
        escalationDataRef.current = null;
      } else {
        alert(response.data.message || 'Failed to create new chat');
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Could not create new chat');
    }
  };

  const stopGeneration = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsStreaming(false);
    setLoading(false);
    setStreamingMessage('');
    setHasReceivedToken(false);
  };


  const handleFeedback = async (messageId: number, rating: number) => {
    if (feedbackGiven[messageId]) return;
    try {
      const res = await axiosInstance.post(`${BASE_URL}ai/feedback/`, { message_id: messageId, rating });
      if (res.data.success) setFeedbackGiven((prev) => ({ ...prev, [messageId]: rating }));
      else alert(res.data.message);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Could not submit feedback.');
    }
  };

  const handleCopyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      alert("Copied to clipboard!");
    } catch (err) {
      console.error(err);
      alert("Failed to copy.");
    }
  };

  const selectConversation = (conversationId: number) => {
    setCurrentConversationId(conversationId);
    localStorage.setItem(
      LAST_CONVERSATION_KEY,
      conversationId.toString()
    );
  };

  // ---------- Sending a message ----------
  const sendMessage = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || loading || isStreaming) return;
    setInputText('');

    if (currentConvo) {
      const optimistic: Message = {
        id: Date.now(),
        role: 'user',
        content: trimmed,
        created_at: new Date().toISOString(),
      };
      const updated = { ...currentConvo, messages: [...currentConvo.messages, optimistic], updated_at: new Date().toISOString() };
      setConversations((prev) => prev.map((c) => (c.id === currentConvo.id ? updated : c)));
    } else {
      pendingUserMessageRef.current = trimmed;

      const tempConversationId = -Date.now();
      tempConversationIdRef.current = tempConversationId;

      const tempConversation: Conversation = {
        id: tempConversationId,
        title: trimmed.slice(0, 30),
        current_agent: selectedAgent,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        messages: [
          {
            id: Date.now(),
            role: 'user',
            content: trimmed,
            created_at: new Date().toISOString(),
          },
        ],
      };

      setConversations((prev) => [tempConversation, ...prev]);
      selectConversation(tempConversationId);
    }

    setLoading(true);
    setIsStreaming(true);
    setHasReceivedToken(false);
    setStreamingMessage('');

    abortControllerRef.current = new AbortController();

    try {
      const eventGenerator = await streamMessageToAI(
        trimmed,
        currentConvo?.id || null,
        selectedAgent,
        abortControllerRef.current.signal
      );

      let conversationIdFromServer = currentConvo?.id || null;
      let latestFullText = '';

      for await (const event of eventGenerator) {
        if (abortControllerRef.current?.signal.aborted) break;

        switch (event.event) {
          case 'start':
            const serverId = event.data.conversation_id;
            if (pendingUserMessageRef.current) {
              const tempId = tempConversationIdRef.current;

              setConversations((prev) =>
                prev.map((conv) =>
                  conv.id === tempId
                    ? { ...conv, id: serverId }
                    : conv
                )
              );

              selectConversation(serverId);

              tempConversationIdRef.current = null;
              pendingUserMessageRef.current = null;

              conversationIdFromServer = serverId;
            } else {
              conversationIdFromServer = serverId;
            }
            break;

          case 'token':
            latestFullText += event.data;
            setStreamingMessage(latestFullText);
            setHasReceivedToken(true);
            scrollToBottom();
            // 👉 Yield control so React can re-render word by word
            await new Promise(resolve => setTimeout(resolve, 0));
            break;

          case 'done':
            const finalContent = latestFullText.length > 0 ? latestFullText : event.data.assistant_message || '';
            if (finalContent) {
              const assistantMsg: Message = {
                id: Date.now() + 1,
                role: 'assistant',
                content: finalContent,
                created_at: new Date().toISOString(),
                guidance: event.data.guidance ?? null,
              };
              setConversations((prev) => {
                const idx = prev.findIndex((c) => c.id === conversationIdFromServer);
                if (idx !== -1) {
                  const updated = { ...prev[idx] };
                  updated.messages = [...updated.messages, assistantMsg];
                  updated.updated_at = new Date().toISOString();
                  return prev
                    .map((c, i) => (i === idx ? updated : c))
                    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
                }
                return prev;
              });
            }
            setStreamingMessage('');
            setIsStreaming(false);
            setLoading(false);
            setHasReceivedToken(false);
            abortControllerRef.current = null;
            scrollToBottom();
            break;

          case 'escalate': {
            const doubtData = event.data.doubt_data || {};
            const reason = event.data.reason || 'ai_unable';
            escalationDataRef.current = doubtData;
            let messageText = '';
            if (reason === 'max_user_messages') {
              messageText = "You've asked several questions. It might be better to post your doubt for an expert.";
            } else if (reason === 'inactivity') {
              messageText = 'It seems you were inactive. Would you like to post this as a doubt for a human expert?';
            } else if (reason === 'duplicate') {
              messageText = 'It seems you asked the same question. Would you like to ask a human expert for detailed help?';
            } else if (reason === 'max_turns') {
              messageText = "We've reached the message limit. Would you like to post your doubt for a human expert?";
            } else {
              messageText = "I'm unable to solve this completely. Would you like to ask a human expert?";
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
              const idx = prev.findIndex((c) => c.id === conversationIdFromServer);
              if (idx !== -1) {
                const updated = { ...prev[idx] };
                updated.messages = [...updated.messages, escalationMsg];
                updated.updated_at = new Date().toISOString();
                return prev
                  .map((c, i) => (i === idx ? updated : c))
                  .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
              }
              return prev;
            });
            setIsStreaming(false);
            setLoading(false);
            setStreamingMessage('');
            setHasReceivedToken(false);
            abortControllerRef.current = null;
            scrollToBottom();
            break;
          }

          case 'error': {
            const errMsg = event.data;
            if (errMsg && errMsg.includes('Daily message limit')) {
              alert(errMsg);
              router.push('/credits');
            } else {
              alert(errMsg || 'Stream error');
            }
            setIsStreaming(false);
            setLoading(false);
            setStreamingMessage('');
            setHasReceivedToken(false);
            abortControllerRef.current = null;
            break;
          }
        }
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Stream error:', error);
        alert(error.message || 'Failed to send message');
      }
      setStreamingMessage('');
      setIsStreaming(false);
      setLoading(false);
      setHasReceivedToken(false);
      abortControllerRef.current = null;
    } finally {
      setLoading(false);
      setIsStreaming(false);
    }
  };

  const handleAskExpert = (doubtData: any) => {
    router.push(
      `/post-doubt?title=${encodeURIComponent(doubtData.title || '')}&description=${encodeURIComponent(
        doubtData.description || ''
      )}&category=${encodeURIComponent(doubtData.category || '')}&mode=pool`
    );
  };

  const handleGuidanceAction = (action: GuidanceAction) => {
    handleAINavigation(action, router.push);
  };

  const renderMessage = (msg: Message) => {
    if (msg.isEscalation) {
      return (
        <div key={msg.id} className="max-w-[80%] self-start mb-2">
          <div className="bg-white/5 border border-white/10 rounded-2xl rounded-bl-md p-3">
            <p className="text-white text-sm">{msg.content}</p>
            <button
              onClick={() => handleAskExpert(msg.doubtData)}
              className="mt-2 bg-pink-500 px-4 py-2 rounded-full text-white font-bold text-sm"
            >
              👨‍🏫 Ask Expert
            </button>
          </div>
        </div>
      );
    }

    const isUser = msg.role === 'user';
    const feedbackRating = feedbackGiven[msg.id];

    return (
      <div key={msg.id} className={`max-w-[80%] mb-2 ${isUser ? 'self-end' : 'self-start'}`}>
        <div
          className={`rounded-2xl p-3 ${
            isUser ? 'rounded-br-md text-white' : 'bg-white/5 border border-white/10 rounded-bl-md'
          }`}
          style={isUser ? { backgroundColor: theme.userBubble } : {}}
        >
          {isUser ? (
            <p className="text-white text-sm whitespace-pre-wrap">{msg.content}</p>
          ) : (
            <>
              {parseMessageContent(msg.content).map((part, idx) =>
                part.type === 'code' ? (
                  <CodeBlock key={idx} code={part.code!} language={part.language!} />
                ) : (
                  <span key={idx} className="text-white text-sm leading-5 whitespace-pre-wrap">
                    {part.content}
                  </span>
                )
              )}
              {msg.guidance && <GuidanceCard guidance={msg.guidance} onActionPress={handleGuidanceAction} />}
              <div className="flex items-center gap-4 mt-2">
                <button
                  className={`text-lg ${feedbackRating === 1 ? 'opacity-100' : 'opacity-50'}`}
                  onClick={() => handleFeedback(msg.id, 1)}
                  disabled={!!feedbackRating}
                >
                  👍
                </button>
                <button
                  className={`text-lg ${feedbackRating === -1 ? 'opacity-100' : 'opacity-50'}`}
                  onClick={() => handleFeedback(msg.id, -1)}
                  disabled={!!feedbackRating}
                >
                  👎
                </button>
                <button
                  onClick={() => handleCopyMessage(msg.content)}
                  className="flex items-center gap-1 text-white/60 hover:text-white transition"
                  title="Copy response"
                >
                  📋

                </button>
              </div>
            </>
          )}
          <span className="text-xs text-white/40 block text-right mt-1">
            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen" style={{ backgroundColor: theme.background, color: theme.text }}>
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 h-16" style={{ backgroundColor: theme.headerBg }}>
        <button onClick={() => setSidebarOpen((prev) => !prev)} className="text-white text-2xl">
          ☰
        </button>
        <div className="relative">
          <button
            onClick={() => setAgentMenuVisible((v) => !v)}
            className="flex items-center gap-2 text-xl font-bold text-white"
          >
            {selectedAgent === 'KNOWMATO' ? '🤖 KnowMato' : '⭐ KnowMato+'}
            <span className={`text-sm transform transition-transform ${agentMenuVisible ? 'rotate-180' : ''}`}>▼</span>
          </button>
          {agentMenuVisible && (
            <div className="absolute top-full mt-2 right-0 bg-gray-900 rounded-xl border border-white/10 p-4 w-48 z-50">
              <button
                onClick={() => { setSelectedAgent('KNOWMATO'); setAgentMenuVisible(false); }}
                className={`block w-full text-left py-2 px-3 rounded-lg ${selectedAgent === 'KNOWMATO' ? 'bg-purple-500/20' : ''}`}
              >
                🤖 KnowMato
              </button>
              <button
                onClick={() => { setSelectedAgent('KNOWMATO_PLUS'); setAgentMenuVisible(false); }}
                className={`block w-full text-left py-2 px-3 rounded-lg ${selectedAgent === 'KNOWMATO_PLUS' ? 'bg-yellow-500/20' : ''}`}
              >
                ⭐ KnowMato+
              </button>
            </div>
          )}
        </div>
        <button
          onClick={createNewChat}
          disabled={loading || isStreaming}
          className="w-10 h-10 rounded-full flex items-center justify-center text-2xl font-bold text-white hover:bg-white/10 transition"
          title="New Chat"
          style={{
            opacity: loading || isStreaming ? 0.5 : 1,
          }}
        >
          ＋
        </button>
      </header>

      {/* Main content area with sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div
          className={`h-full overflow-y-auto border-r border-white/10 transition-all duration-300 ease-in-out ${
            sidebarOpen ? 'w-72' : 'w-0'
          }`}
          style={{ backgroundColor: theme.background }}
        >
          <div className="p-4 min-w-[280px]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white">Chats</h2>
              <button onClick={() => setSidebarOpen(false)} className="text-white/50 text-xl">✕</button>
            </div>
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => {
                  if (isStreaming || loading) {
                    alert('Please wait for the current response to finish.');
                    return;
                  }
                  selectConversation(conv.id);
                  setSelectedAgent(conv.current_agent);
                  setSidebarOpen(false);
                  setStreamingMessage('');
                  setIsStreaming(false);
                  setHasReceivedToken(false);
                  escalationDataRef.current = null;
                }}
                className={`w-full text-left py-3 px-2 rounded-lg mb-1 ${
                  conv.id === currentConversationId ? 'bg-white/10' : ''
                }`}
              >
                <p className="text-white font-medium truncate">{conv.title || 'New Chat'}</p>
                <p className="text-white/40 text-xs">{new Date(conv.updated_at).toLocaleDateString()}</p>
              </button>
            ))}
            <button
              onClick={createNewChat}
              disabled={isStreaming || loading}
              className="w-full mt-4 py-3 rounded-xl text-white font-bold"
              style={{ backgroundColor: theme.newChatButton, opacity: isStreaming || loading ? 0.5 : 1 }}
            >
              + New Chat
            </button>
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 flex flex-col">
            {fetching && conversations.length === 0 ? (
              <div className="flex justify-center items-center h-full text-white/50">Loading...</div>
            ) : messages.length === 0 && !isStreaming ? (
              <div className="flex justify-center items-center h-full text-white/50">No messages. Start a new chat!</div>
            ) : (
              <>
                {messages.map(renderMessage)}
                {isStreaming && (
                  <div className="max-w-[80%] self-start mb-2">
                    <div className="bg-white/5 border border-white/10 rounded-2xl rounded-bl-md p-3 transition-all duration-200">
                      {hasReceivedToken ? (
                        <StreamMessage content={streamingMessage} />
                      ) : (
                        <SkeletonPlaceholder />
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div
            className="border-t border-white/10 p-3 flex items-end gap-2 bg-opacity-95"
            style={{ backgroundColor: theme.background }}
          >
            <textarea
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-3 text-white placeholder-white/50 resize-none outline-none text-sm"
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask me anything..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            {isStreaming ? (
              <button onClick={stopGeneration} className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white font-bold">
                ⏹
              </button>
            ) : (
              <button
                onClick={sendMessage}
                disabled={loading || !inputText.trim()}
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: theme.sendButton, opacity: loading ? 0.5 : 1 }}
              >
                {loading ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  '➤'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}