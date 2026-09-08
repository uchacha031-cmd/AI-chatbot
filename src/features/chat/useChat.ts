import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  ChatMessage,
  ChatSettings,
  EmotionState,
  GenerationState,
  MemoryCategory,
  MemoryItem,
  PersonalityParameters,
  RelationshipState,
  ResetType,
  UserProfile,
} from '../../types/index.ts';
import {
  INITIAL_EMOTION,
  INITIAL_PERSONALITY,
  INITIAL_RELATIONSHIP,
} from '../constants.ts';
import {
  getOrCreateLocalUserId,
  getConversationMessages,
  saveConversation,
  saveMemoryItem,
  updateMemoryItem,
  deleteMemoryItem,
  clearAllUserMemories,
  getStoredActiveConversationId,
  setStoredActiveConversationId,
  getUserMemories,
  getStoredEmotionState,
  getStoredRelationshipState,
  resetStoredRelationshipState,
  clearLocalChatHistory,
  getStoredChatSettings,
  saveChatSettings,
  toggleMessageReaction,
  togglePinMessage,
} from '../../services/firebase.ts';
import { MessageQueueController } from './messageQueue.ts';
import { DEFAULT_CHAT_SETTINGS, playWebAudioTone } from './chatSettingsDefaults.ts';

export function useChat() {
  const [userId, setUserId] = useState<string>('');
  const [conversationId, setConversationId] = useState<string>(
    () => getStoredActiveConversationId() || 'convo_main'
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [userProfile] = useState<UserProfile | null>(null);
  const [emotion, setEmotion] = useState<EmotionState>(INITIAL_EMOTION);
  const [personality] = useState<PersonalityParameters>(INITIAL_PERSONALITY);
  const [relationship, setRelationship] = useState<RelationshipState>(INITIAL_RELATIONSHIP);
  const [chatSettings, setChatSettings] = useState<ChatSettings>(DEFAULT_CHAT_SETTINGS);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [isComposerTyping, setIsComposerTyping] = useState<boolean>(false);
  const [memoryToast, setMemoryToast] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const hasQueuedMessages = messages.some((m) => m.status === 'queued');

  const generationState: GenerationState = useMemo(() => {
    if (errorStatus) return 'ERROR';
    if (isTyping) return 'GENERATING';
    if (hasQueuedMessages) return 'QUEUED';
    if (isComposerTyping) return 'USER_TYPING';
    return 'IDLE';
  }, [errorStatus, isTyping, hasQueuedMessages, isComposerTyping]);

  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Keep live references to state to prevent stale closures inside async queue handlers
  const messagesRef = useRef<ChatMessage[]>(messages);
  messagesRef.current = messages;

  const memoriesRef = useRef<MemoryItem[]>(memories);
  memoriesRef.current = memories;

  const emotionRef = useRef<EmotionState>(emotion);
  emotionRef.current = emotion;

  const personalityRef = useRef<PersonalityParameters>(personality);
  personalityRef.current = personality;

  const relationshipRef = useRef<RelationshipState>(relationship);
  relationshipRef.current = relationship;

  const userProfileRef = useRef<UserProfile | null>(userProfile);
  userProfileRef.current = userProfile;

  const chatSettingsRef = useRef<ChatSettings>(chatSettings);
  chatSettingsRef.current = chatSettings;

  const showToast = useCallback((text: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setMemoryToast(text);
    toastTimeoutRef.current = setTimeout(() => {
      setMemoryToast(null);
    }, 4500);
  }, []);

  // Instantiate MessageQueueController
  const queueControllerRef = useRef<MessageQueueController | null>(null);

  if (!queueControllerRef.current) {
    queueControllerRef.current = new MessageQueueController({
      userId: '',
      conversationId: 'convo_main',
      getMessages: () => messagesRef.current,
      setMessages,
      getMemories: () => memoriesRef.current,
      setMemories,
      getUserProfile: () => userProfileRef.current,
      getEmotion: () => emotionRef.current,
      setEmotion,
      getPersonality: () => personalityRef.current,
      getRelationship: () => relationshipRef.current,
      setRelationship,
      getChatSettings: () => chatSettingsRef.current,
      onGeneratingChange: (generating) => setIsTyping(generating),
      onError: (err) => setErrorStatus(err),
      onMessageReceived: () => {
        if (chatSettingsRef.current.soundEnabled) {
          playWebAudioTone('received');
        }
      },
    });
  }

  // Keep controller config synchronized
  useEffect(() => {
    if (queueControllerRef.current && userId) {
      queueControllerRef.current.updateConfig({
        userId,
        conversationId,
      });
    }
  }, [userId, conversationId]);

  // Initialize data on mount
  useEffect(() => {
    const uid = getOrCreateLocalUserId();
    setUserId(uid);

    async function loadData() {
      try {
        // 1. Load memories
        const userMems = await getUserMemories(uid);
        setMemories(userMems);

        // 2. Load emotion state
        const storedEmotion = await getStoredEmotionState(uid);
        if (storedEmotion) {
          setEmotion(storedEmotion);
        }

        // 3. Load relationship state (validates and cleans any legacy 79%/85% data to 0)
        const storedRel = await getStoredRelationshipState(uid);
        setRelationship(storedRel);

        // 4. Load conversation messages for active conversation
        const activeConvoId = getStoredActiveConversationId() || 'convo_main';
        setConversationId(activeConvoId);
        const savedMsgs = await getConversationMessages(activeConvoId);
        setMessages(savedMsgs);

        // 5. Load chat settings (wallpaper, nicknames, notifications, sound)
        const storedSettings = await getStoredChatSettings(uid);
        setChatSettings(storedSettings);

        // 6. Save conversation metadata
        await saveConversation({
          id: activeConvoId,
          userId: uid,
          title: 'Trò chuyện cùng Miyu',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Error loading initial chat data:', err);
      }
    }

    loadData();

    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      queueControllerRef.current?.clearQueue();
    };
  }, []);

  // Send message - Never blocks even if AI is generating!
  const sendMessage = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    try {
      if (chatSettingsRef.current.soundEnabled) {
        playWebAudioTone('sent');
      }
      queueControllerRef.current?.enqueueMessage(trimmed);
    } catch (err: any) {
      console.warn('Enqueue error:', err);
    }
  }, []);

  // Send Image Message
  const sendImageMessage = useCallback(async (file: File, caption: string) => {
    try {
      if (chatSettingsRef.current.soundEnabled) {
        playWebAudioTone('sent');
      }
      await queueControllerRef.current?.enqueueImageMessage(file, caption);
    } catch (err: any) {
      console.warn('Enqueue image message error:', err);
    }
  }, []);

  // Update nicknames with system event messages
  const updateNicknames = useCallback(
    async (newMiyuNick: string, newUserNick: string) => {
      const current = chatSettingsRef.current;
      const cleanMiyu = newMiyuNick.trim();
      const cleanUser = newUserNick.trim();

      const miyuChanged = (current.miyuNickname || '') !== cleanMiyu;
      const userChanged = (current.userNickname || '') !== cleanUser;

      if (!miyuChanged && !userChanged) return;

      const newSettings: ChatSettings = {
        ...current,
        miyuNickname: cleanMiyu,
        userNickname: cleanUser,
      };

      setChatSettings(newSettings);
      if (userId) {
        await saveChatSettings(userId, newSettings);
      }

      const sysMsgs: ChatMessage[] = [];
      const now = new Date().toISOString();

      if (miyuChanged) {
        const text = cleanMiyu
          ? `Bạn đã đổi biệt danh của ${current.miyuOriginalName || 'Miyu'} thành "${cleanMiyu}"`
          : `Bạn đã gỡ biệt danh của ${current.miyuOriginalName || 'Miyu'}`;
        const msg: ChatMessage = {
          id: 'sys_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
          conversationId,
          role: 'system',
          type: 'system',
          content: text,
          timestamp: now,
          status: 'completed',
        };
        sysMsgs.push(msg);
        saveMessage(msg).catch(console.warn);
      }

      if (userChanged) {
        const text = cleanUser
          ? `Bạn đã đổi biệt danh của mình thành "${cleanUser}"`
          : `Bạn đã gỡ biệt danh của mình`;
        const msg: ChatMessage = {
          id: 'sys_' + (Date.now() + 1).toString(36) + Math.random().toString(36).slice(2, 6),
          conversationId,
          role: 'system',
          type: 'system',
          content: text,
          timestamp: now,
          status: 'completed',
        };
        sysMsgs.push(msg);
        saveMessage(msg).catch(console.warn);
      }

      if (sysMsgs.length > 0) {
        setMessages((prev) => [...prev, ...sysMsgs]);
      }
    },
    [conversationId, userId]
  );

  // Retry a failed message
  const retryMessage = useCallback((messageId: string) => {
    queueControllerRef.current?.retryMessage(messageId);
  }, []);

  // Update chat settings
  const updateChatSettings = useCallback(
    async (newSettings: Partial<ChatSettings>) => {
      const updated = { ...chatSettingsRef.current, ...newSettings };
      setChatSettings(updated);
      if (userId) {
        await saveChatSettings(userId, updated);
      }
    },
    [userId]
  );

  // Toggle message reaction
  const toggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      if (!userId) return;
      if (chatSettingsRef.current.soundEnabled) {
        playWebAudioTone('reaction');
      }
      const res = await toggleMessageReaction(messageId, emoji, userId);
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, reactions: res.reactions } : m))
      );
    },
    [userId]
  );

  // Toggle pin message
  const togglePin = useCallback(
    async (messageId: string) => {
      if (!userId) return;
      const isNowPinned = await togglePinMessage(messageId, userId);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, isPinned: isNowPinned, pinnedAt: isNowPinned ? new Date().toISOString() : undefined }
            : m
        )
      );
      showToast(isNowPinned ? 'Đã ghim tin nhắn.' : 'Đã bỏ ghim tin nhắn.');
    },
    [userId, showToast]
  );

  // Manual memory actions (edit, delete, add)
  const addMemory = async (category: MemoryCategory, content: string, importance: number) => {
    const memId = 'mem_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const item: MemoryItem = {
      id: memId,
      userId,
      category,
      content,
      importance,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveMemoryItem(item);
    setMemories((prev) => [item, ...prev]);
    showToast(`Đã thêm ký ức mới: "${content}"`);
  };

  const updateMemory = async (id: string, content: string, importance: number) => {
    await updateMemoryItem(id, content, importance);
    setMemories((prev) =>
      prev.map((m) => (m.id === id ? { ...m, content, importance, updatedAt: new Date().toISOString() } : m))
    );
    showToast('Đã cập nhật ký ức thành công!');
  };

  const deleteMemory = async (id: string) => {
    await deleteMemoryItem(id);
    setMemories((prev) => prev.filter((m) => m.id !== id));
    showToast('Đã xoá ký ức.');
  };

  // Reset chat history with two distinct modes (Part 5C: Conversation Reset + Memory Separation)
  const resetChat = async (type: ResetType = 'NEW_CONVERSATION') => {
    queueControllerRef.current?.clearQueue();

    if (type === 'CLEAR_MEMORY_AND_START_FRESH') {
      // 1. Wipe all user persistent memories from Firestore and local cache
      if (userId) {
        await clearAllUserMemories(userId);
        const freshRel = await resetStoredRelationshipState(userId);
        setRelationship(freshRel);
      }
      setMemories([]);

      // 2. Generate dedicated new conversation thread
      const newConvoId = 'convo_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
      setStoredActiveConversationId(newConvoId);
      setConversationId(newConvoId);
      setMessages([]);
      setEmotion({ ...INITIAL_EMOTION });

      if (queueControllerRef.current) {
        queueControllerRef.current.updateConfig({ conversationId: newConvoId });
      }

      await saveConversation({
        id: newConvoId,
        userId,
        title: 'Cuộc trò chuyện mới',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      showToast('Đã xoá toàn bộ ký ức & làm mới (Hai người xa lạ).');
    } else {
      // NEW_CONVERSATION: Dedicated new thread, fresh momentum, memories preserved
      const newConvoId = 'convo_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
      setStoredActiveConversationId(newConvoId);
      setConversationId(newConvoId);
      setMessages([]);
      setEmotion({ ...INITIAL_EMOTION });

      if (userId) {
        const freshRel = await resetStoredRelationshipState(userId);
        setRelationship(freshRel);
      }

      if (queueControllerRef.current) {
        queueControllerRef.current.updateConfig({ conversationId: newConvoId });
      }

      await saveConversation({
        id: newConvoId,
        userId,
        title: 'Cuộc trò chuyện mới',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      showToast('Đã bắt đầu cuộc trò chuyện mới. Ký ức được bảo lưu.');
    }
  };

  // Typing awareness callbacks
  const handleTypingStart = useCallback(() => {
    setIsComposerTyping(true);
    queueControllerRef.current?.handleUserTypingStart();
  }, []);

  const handleTypingPause = useCallback(() => {
    queueControllerRef.current?.handleUserTypingPause();
  }, []);

  const handleTypingStop = useCallback(() => {
    setIsComposerTyping(false);
    queueControllerRef.current?.handleUserTypingStop();
  }, []);

  return {
    userId,
    messages,
    memories,
    emotion,
    personality,
    relationship,
    chatSettings,
    updateChatSettings,
    toggleReaction,
    togglePin,
    isTyping,
    generationState,
    memoryToast,
    errorStatus,
    sendMessage,
    sendImageMessage,
    updateNicknames,
    retryMessage,
    handleTypingStart,
    handleTypingPause,
    handleTypingStop,
    addMemory,
    updateMemory,
    deleteMemory,
    resetChat,
  };
}
