import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  updateDoc
} from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfigData from '../../firebase-applet-config.json';
import {
  ChatMessage,
  ChatSettings,
  Conversation,
  EmotionState,
  ExtractedMediaItem,
  MemoryItem,
  ReactionItem,
  RelationshipState,
  UserProfile
} from '../types/index.ts';
import { cleanAndValidateRelationship } from '../features/relationship/relationshipEngine.ts';
import { INITIAL_RELATIONSHIP } from '../features/constants.ts';
import { DEFAULT_CHAT_SETTINGS } from '../features/chat/chatSettingsDefaults.ts';

const firebaseConfig = {
  apiKey: firebaseConfigData.apiKey,
  authDomain: firebaseConfigData.authDomain,
  projectId: firebaseConfigData.projectId,
  storageBucket: firebaseConfigData.storageBucket,
  messagingSenderId: firebaseConfigData.messagingSenderId,
  appId: firebaseConfigData.appId,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = firebaseConfigData.firestoreDatabaseId && firebaseConfigData.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfigData.firestoreDatabaseId)
  : getFirestore(app);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Local Storage Fallback Keys
const STORAGE_KEYS = {
  USER: 'miyu_user_profile',
  MEMORIES: 'miyu_memories',
  MESSAGES: 'miyu_messages',
  CONVERSATIONS: 'miyu_conversations',
  EMOTION: 'miyu_emotion',
  RELATIONSHIP: 'miyu_relationship_state',
  ACTIVE_CONVO: 'miyu_active_convo_id',
  CHAT_SETTINGS: 'miyu_chat_settings',
};

// Safe LocalStorage helpers for cross-environment safety
function safeGetItem(key: string): string | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  return null;
}

function safeSetItem(key: string, value: string): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {
      console.warn('localStorage write failed:', e);
    }
  }
}

// Generate persistent guest UUID for the user device
export function getOrCreateLocalUserId(): string {
  const existing = safeGetItem('miyu_device_user_id');
  if (existing) return existing;
  const newId = 'user_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
  safeSetItem('miyu_device_user_id', newId);
  return newId;
}

// User Profile Operations
export async function saveUserProfile(profile: UserProfile): Promise<void> {
  try {
    safeSetItem(STORAGE_KEYS.USER, JSON.stringify(profile));
    await setDoc(doc(db, 'users', profile.id), profile, { merge: true });
  } catch (err) {
    console.warn('Firestore user save fallback to local:', err);
  }
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    if (snap.exists()) {
      const data = snap.data() as UserProfile;
      safeSetItem(STORAGE_KEYS.USER, JSON.stringify(data));
      return data;
    }
  } catch (err) {
    console.warn('Firestore user fetch fallback:', err);
  }

  const local = safeGetItem(STORAGE_KEYS.USER);
  if (local) {
    try {
      return JSON.parse(local) as UserProfile;
    } catch {
      return null;
    }
  }
  return null;
}

// Memory Operations
export async function saveMemoryItem(memory: MemoryItem): Promise<void> {
  try {
    // Save to Firestore
    await setDoc(doc(db, 'memories', memory.id), memory);
  } catch (err) {
    console.warn('Firestore memory save fallback to local:', err);
  }

  // Update local cache
  const memories = getLocalMemories();
  const existingIndex = memories.findIndex((m) => m.id === memory.id);
  if (existingIndex >= 0) {
    memories[existingIndex] = memory;
  } else {
    memories.push(memory);
  }
  safeSetItem(STORAGE_KEYS.MEMORIES, JSON.stringify(memories));
}

export async function updateMemoryItem(memoryId: string, content: string, importance: number): Promise<void> {
  try {
    await updateDoc(doc(db, 'memories', memoryId), {
      content,
      importance,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Firestore memory update fallback:', err);
  }

  const memories = getLocalMemories().map((m) =>
    m.id === memoryId ? { ...m, content, importance, updatedAt: new Date().toISOString() } : m
  );
  safeSetItem(STORAGE_KEYS.MEMORIES, JSON.stringify(memories));
}

export async function deleteMemoryItem(memoryId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'memories', memoryId));
  } catch (err) {
    console.warn('Firestore memory delete fallback:', err);
  }

  const memories = getLocalMemories().filter((m) => m.id !== memoryId);
  safeSetItem(STORAGE_KEYS.MEMORIES, JSON.stringify(memories));
}

export async function clearAllUserMemories(userId: string): Promise<void> {
  // Wipe local storage
  safeSetItem(STORAGE_KEYS.MEMORIES, JSON.stringify([]));

  // Delete all user memory documents in Firestore
  try {
    const q = query(collection(db, 'memories'), where('userId', '==', userId));
    const snap = await getDocs(q);
    const deletePromises = snap.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(deletePromises);
  } catch (err) {
    console.warn('Firestore clearAllUserMemories fallback:', err);
  }
}

export function getStoredActiveConversationId(): string | null {
  return safeGetItem('miyu_active_convo_id');
}

export function setStoredActiveConversationId(convoId: string): void {
  safeSetItem('miyu_active_convo_id', convoId);
}

export async function getUserMemories(userId: string): Promise<MemoryItem[]> {
  try {
    const q = query(collection(db, 'memories'), where('userId', '==', userId));
    const snap = await getDocs(q);
    const results: MemoryItem[] = [];
    snap.forEach((docItem) => {
      results.push(docItem.data() as MemoryItem);
    });
    if (results.length > 0) {
      safeSetItem(STORAGE_KEYS.MEMORIES, JSON.stringify(results));
      return results;
    }
  } catch (err) {
    console.warn('Firestore memories fetch fallback:', err);
  }
  return getLocalMemories().filter((m) => m.userId === userId || !m.userId);
}

function getLocalMemories(): MemoryItem[] {
  try {
    const val = safeGetItem(STORAGE_KEYS.MEMORIES);
    return val ? JSON.parse(val) : [];
  } catch {
    return [];
  }
}

// Conversation & Message Operations
export async function saveMessage(message: ChatMessage): Promise<void> {
  try {
    await setDoc(doc(db, 'messages', message.id), message, { merge: true });
  } catch (err) {
    console.warn('Firestore saveMessage fallback to local:', err);
  }

  // Update local cache without duplicates
  const messages = getLocalMessages();
  const existingIndex = messages.findIndex((m) => m.id === message.id);
  if (existingIndex >= 0) {
    messages[existingIndex] = message;
  } else {
    messages.push(message);
  }
  safeSetItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
}

export async function saveMessagesBatch(newOrUpdatedMessages: ChatMessage[]): Promise<void> {
  if (!newOrUpdatedMessages.length) return;

  // Persist each to firestore
  Promise.all(
    newOrUpdatedMessages.map((msg) =>
      setDoc(doc(db, 'messages', msg.id), msg, { merge: true }).catch((err) => {
        console.warn('Batch message firestore save fallback:', err);
      })
    )
  ).catch(console.warn);

  // Update local storage in one pass
  const messages = getLocalMessages();
  const messageMap = new Map<string, ChatMessage>();
  for (const m of messages) {
    messageMap.set(m.id, m);
  }
  for (const m of newOrUpdatedMessages) {
    messageMap.set(m.id, m);
  }
  const merged = Array.from(messageMap.values()).sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  safeSetItem(STORAGE_KEYS.MESSAGES, JSON.stringify(merged));
}

export async function getConversationMessages(conversationId: string): Promise<ChatMessage[]> {
  try {
    const q = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversationId)
    );
    const snap = await getDocs(q);
    const list: ChatMessage[] = [];
    snap.forEach((d) => list.push(d.data() as ChatMessage));
    list.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    if (list.length > 0) {
      return list;
    }
  } catch (err) {
    console.warn('Firestore getMessages fallback:', err);
  }

  return getLocalMessages()
    .filter((m) => m.conversationId === conversationId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

function getLocalMessages(): ChatMessage[] {
  try {
    const val = safeGetItem(STORAGE_KEYS.MESSAGES);
    return val ? JSON.parse(val) : [];
  } catch {
    return [];
  }
}

export async function saveConversation(convo: Conversation): Promise<void> {
  try {
    await setDoc(doc(db, 'conversations', convo.id), convo, { merge: true });
  } catch (err) {
    console.warn('Firestore saveConversation fallback:', err);
  }

  const convos = getLocalConversations();
  const idx = convos.findIndex((c) => c.id === convo.id);
  if (idx >= 0) convos[idx] = convo;
  else convos.unshift(convo);
  safeSetItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(convos));
}

export function getLocalConversations(): Conversation[] {
  try {
    const val = safeGetItem(STORAGE_KEYS.CONVERSATIONS);
    return val ? JSON.parse(val) : [];
  } catch {
    return [];
  }
}

// Emotion State Persistence
export async function saveEmotionState(userId: string, emotion: EmotionState): Promise<void> {
  try {
    await setDoc(doc(db, 'emotion_states', userId), { userId, ...emotion }, { merge: true });
  } catch (err) {
    console.warn('Firestore saveEmotionState fallback:', err);
  }
  safeSetItem(STORAGE_KEYS.EMOTION, JSON.stringify(emotion));
}

export async function getStoredEmotionState(userId: string): Promise<EmotionState | null> {
  try {
    const snap = await getDoc(doc(db, 'emotion_states', userId));
    if (snap.exists()) {
      return snap.data() as EmotionState;
    }
  } catch (err) {
    console.warn('Firestore getStoredEmotionState fallback:', err);
  }

  const local = safeGetItem(STORAGE_KEYS.EMOTION);
  if (local) {
    try {
      return JSON.parse(local) as EmotionState;
    } catch {
      return null;
    }
  }
  return null;
}

// Relationship State Persistence (Internal Only - 0-based slow history accumulation)
export async function saveRelationshipState(userId: string, relationship: RelationshipState): Promise<void> {
  const validated = cleanAndValidateRelationship(relationship);
  try {
    await setDoc(doc(db, 'relationship_states', userId), { userId, ...validated }, { merge: true });
  } catch (err) {
    console.warn('Firestore saveRelationshipState fallback:', err);
  }
  safeSetItem(STORAGE_KEYS.RELATIONSHIP, JSON.stringify(validated));
}

export async function getStoredRelationshipState(userId: string): Promise<RelationshipState> {
  try {
    const snap = await getDoc(doc(db, 'relationship_states', userId));
    if (snap.exists()) {
      const validated = cleanAndValidateRelationship(snap.data());
      safeSetItem(STORAGE_KEYS.RELATIONSHIP, JSON.stringify(validated));
      return validated;
    }
  } catch (err) {
    console.warn('Firestore getStoredRelationshipState fallback:', err);
  }

  const local = safeGetItem(STORAGE_KEYS.RELATIONSHIP);
  if (local) {
    try {
      const parsed = JSON.parse(local);
      const validated = cleanAndValidateRelationship(parsed);
      return validated;
    } catch {
      // Return fresh 0 state
    }
  }

  const fresh = { ...INITIAL_RELATIONSHIP };
  safeSetItem(STORAGE_KEYS.RELATIONSHIP, JSON.stringify(fresh));
  return fresh;
}

export async function resetStoredRelationshipState(userId: string): Promise<RelationshipState> {
  const fresh: RelationshipState = {
    familiarity: 0,
    comfort: 0,
    trust: 0,
    attachment: 0,
    sharedHistory: 0,
    interactionCount: 0,
    lastInteractionTimestamp: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'relationship_states', userId), { userId, ...fresh }, { merge: true });
  } catch (err) {
    console.warn('Firestore resetStoredRelationshipState fallback:', err);
  }

  safeSetItem(STORAGE_KEYS.RELATIONSHIP, JSON.stringify(fresh));
  return fresh;
}

// Clear all local conversations (reset)
export function clearLocalChatHistory(conversationId: string) {
  const allMessages = getLocalMessages().filter((m) => m.conversationId !== conversationId);
  safeSetItem(STORAGE_KEYS.MESSAGES, JSON.stringify(allMessages));
}

// Chat Settings Persistence
export async function saveChatSettings(userId: string, settings: ChatSettings): Promise<void> {
  try {
    await setDoc(doc(db, 'chat_settings', userId), { userId, ...settings }, { merge: true });
  } catch (err) {
    console.warn('Firestore saveChatSettings fallback:', err);
  }
  safeSetItem(STORAGE_KEYS.CHAT_SETTINGS, JSON.stringify(settings));
}

export async function getStoredChatSettings(userId: string): Promise<ChatSettings> {
  try {
    const snap = await getDoc(doc(db, 'chat_settings', userId));
    if (snap.exists()) {
      const data = snap.data() as ChatSettings;
      safeSetItem(STORAGE_KEYS.CHAT_SETTINGS, JSON.stringify(data));
      return { ...DEFAULT_CHAT_SETTINGS, ...data };
    }
  } catch (err) {
    console.warn('Firestore getStoredChatSettings fallback:', err);
  }

  const local = safeGetItem(STORAGE_KEYS.CHAT_SETTINGS);
  if (local) {
    try {
      const parsed = JSON.parse(local);
      return { ...DEFAULT_CHAT_SETTINGS, ...parsed };
    } catch {
      // fallback
    }
  }
  return { ...DEFAULT_CHAT_SETTINGS };
}

// Reaction Toggle in Firestore and Local Storage (Part 5D: STRICT (messageId + userId) 1-reaction constraint)
export async function toggleMessageReaction(
  messageId: string,
  emoji: string,
  userId: string
): Promise<{ added: boolean; reactions: ReactionItem[] }> {
  const messages = getLocalMessages();
  const targetMsg = messages.find((m) => m.id === messageId);
  const currentReactions: ReactionItem[] = targetMsg?.reactions ? [...targetMsg.reactions] : [];

  const existingReaction = currentReactions.find((r) => r.userId === userId);
  let added = false;

  if (existingReaction && existingReaction.emoji === emoji) {
    // Tapping the same active reaction removes it (toggle off)
    const idx = currentReactions.indexOf(existingReaction);
    currentReactions.splice(idx, 1);
    added = false;
  } else {
    // Tapping another reaction replaces current reaction:
    // Only 1 reaction per participant per message allowed!
    const filtered = currentReactions.filter((r) => r.userId !== userId);
    const newReaction: ReactionItem = {
      reactionId: 'react_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      emoji,
      userId,
      createdAt: new Date().toISOString(),
    };
    filtered.push(newReaction);
    currentReactions.length = 0;
    currentReactions.push(...filtered);
    added = true;
  }

  // Update local message
  if (targetMsg) {
    targetMsg.reactions = currentReactions;
    safeSetItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
  }

  // Persist to firestore
  try {
    await updateDoc(doc(db, 'messages', messageId), {
      reactions: currentReactions,
    });
  } catch (err) {
    console.warn('Firestore toggleMessageReaction fallback:', err);
  }

  return { added, reactions: currentReactions };
}

// Toggle Pinned status of a message
export async function togglePinMessage(messageId: string, pinnedBy: string): Promise<boolean> {
  const messages = getLocalMessages();
  const targetMsg = messages.find((m) => m.id === messageId);
  if (!targetMsg) return false;

  const nextPinned = !targetMsg.isPinned;
  targetMsg.isPinned = nextPinned;
  targetMsg.pinnedAt = nextPinned ? new Date().toISOString() : undefined;

  safeSetItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));

  try {
    await updateDoc(doc(db, 'messages', messageId), {
      isPinned: nextPinned,
      pinnedAt: targetMsg.pinnedAt || null,
      pinnedBy: nextPinned ? pinnedBy : null,
    });
  } catch (err) {
    console.warn('Firestore togglePinMessage fallback:', err);
  }

  return nextPinned;
}

// Extract real media/links from stored messages (strictly calculated, no fake statistics!)
export function extractMediaFromMessages(messages: ChatMessage[]): ExtractedMediaItem[] {
  const items: ExtractedMediaItem[] = [];
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const imageRegex = /\.(jpeg|jpg|gif|png|webp|svg)($|\?)/i;
  const videoRegex = /\.(mp4|webm|mov|avi)($|\?)/i;
  const fileRegex = /\.(pdf|doc|docx|zip|rar|tar|txt|csv)($|\?)/i;

  for (const msg of messages) {
    if (msg.role === 'system') continue;

    // Check if this is an image message with mediaUrl
    if (msg.type === 'image' && msg.mediaUrl) {
      items.push({
        id: `media_${msg.id}_img`,
        url: msg.mediaUrl,
        type: 'photo',
        title: msg.mediaMetadata?.name || 'Ảnh đính kèm',
        messageId: msg.id,
        timestamp: msg.timestamp,
        sender: msg.role === 'model' ? 'model' : 'user',
      });
    }

    const urls = msg.content?.match(urlRegex) || [];
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      let type: 'photo' | 'video' | 'file' | 'link' = 'link';
      if (imageRegex.test(url)) type = 'photo';
      else if (videoRegex.test(url)) type = 'video';
      else if (fileRegex.test(url)) type = 'file';

      items.push({
        id: `media_${msg.id}_${i}`,
        url,
        type,
        title: url.split('/').pop()?.split('?')[0] || url,
        messageId: msg.id,
        timestamp: msg.timestamp,
        sender: msg.role === 'model' ? 'model' : 'user',
      });
    }
  }

  return items;
}

