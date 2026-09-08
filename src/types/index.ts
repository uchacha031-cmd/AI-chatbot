export interface PersonalityParameters {
  romanticAffection: number; // 0 - 100 (Default: 0 - strictly companion, no adult/sexual content)
  teasing: number;           // 0 - 100
  initiative: number;        // 0 - 100
  curiosity: number;         // 0 - 100
  empathy: number;           // 0 - 100
}

export interface EmotionState {
  mood: number;        // 0 - 100 (overall state: 50 is neutral, >60 upbeat, <40 subdued)
  happiness: number;   // 0 - 100
  sadness: number;     // 0 - 100
  curiosity: number;   // 0 - 100
  concern: number;     // 0 - 100
  excitement: number;  // 0 - 100
  calmness: number;    // 0 - 100
  frustration?: number; // 0 - 100 (internal qualitative dimension)
  attachment?: number;  // 0 - 100 (internal qualitative dimension)
  emotionalSalience?: number; // 0 - 100 (internal intensity of current moment)
  lastUpdated: string; // ISO date
}

export interface RelationshipState {
  familiarity: number;     // 0 - 100 (starts at 0, grows slowly based on interaction history)
  comfort: number;         // 0 - 100 (starts at 0, grows through consistent, comfortable interactions)
  trust: number;           // 0 - 100 (starts at 0, grows with consistency and shared personal openness)
  attachment: number;      // 0 - 100 (starts at 0, accumulates slowly through shared history)
  sharedHistory: number;   // 0 - 100 (accumulated depth of past interactions)
  attention?: number;      // 0 - 100 (internal attentiveness to user)
  care?: number;           // 0 - 100 (internal subtle care, emerges organically)
  emotionalSalience?: number; // 0 - 100 (internal depth of connection)
  interactionCount: number; // total count of turns
  lastInteractionTimestamp: string;
  lastUpdated: string;
}

export type MemoryCategory =
  | 'USER_PROFILE'
  | 'IMPORTANT_MEMORY'
  | 'PREFERENCE'
  | 'GOAL'
  | 'SIGNIFICANT_EVENT'
  | 'RELATIONSHIP_CONTEXT'
  | 'profile'
  | 'important'
  | 'preference'
  | 'recent_context';

export type ResetType = 'NEW_CONVERSATION' | 'CLEAR_MEMORY_AND_START_FRESH';

export interface MemoryItem {
  id: string;
  userId: string;
  category: MemoryCategory;
  content: string;
  importance?: number; // 1 - 5 (internal reasoning only)
  stability?: 'stable' | 'evolving' | 'tentative';
  futureUsefulness?: number; // 1 - 5 (internal reasoning only)
  explicitUserRequest?: boolean;
  sourceSnippet?: string;
  supersedesMemoryId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DetectedMemoryOutput {
  category: MemoryCategory;
  content: string;
  importance: number;
  futureUsefulness?: number;
  stability?: 'stable' | 'evolving' | 'tentative';
  explicitUserRequest?: boolean;
  supersedesMemoryId?: string | null;
  sourceSnippet?: string;
}

export interface UserProfile {
  id: string;
  name?: string;
  preferredHonorific?: string; // Default: 'anh'
  interests?: string[];
  habits?: string[];
  goals?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type MessageStatus = 'draft' | 'queued' | 'processing' | 'completed' | 'failed';

export type GenerationState =
  | 'IDLE'
  | 'USER_TYPING'
  | 'QUEUED'
  | 'GENERATING'
  | 'ERROR';

export interface ReactionItem {
  reactionId: string;
  emoji: string;
  userId: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: string; // ISO date
  type?: 'text' | 'image' | 'system';
  mediaUrl?: string;
  mediaMetadata?: {
    name?: string;
    size?: number;
    mimeType?: string;
    width?: number;
    height?: number;
  };
  status?: MessageStatus;
  batchId?: string;
  detectedEmotion?: string;
  detectedIntent?: string;
  isMemoryCandidate?: boolean;
  reactions?: ReactionItem[];
  isPinned?: boolean;
  pinnedAt?: string;
}

export interface PinnedMessageItem {
  messageId: string;
  content: string;
  sender: 'user' | 'model' | 'system';
  timestamp: string;
  pinnedAt: string;
  pinnedBy: string;
}

export interface ChatSettings {
  wallpaper: string;
  wallpaperType: 'solid' | 'gradient' | 'preset' | 'custom';
  miyuOriginalName?: string;
  userOriginalName?: string;
  miyuNickname: string;
  userNickname: string;
  miyuAvatar?: string;
  userAvatar?: string;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  autoSaveImages: boolean;
  bubbleChatEnabled: boolean;
}

export interface ExtractedMediaItem {
  id: string;
  url: string;
  type: 'photo' | 'video' | 'file' | 'link';
  title: string;
  messageId: string;
  timestamp: string;
  sender: 'user' | 'model';
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  lastMessageSnippet?: string;
}

export interface ContextInterpretation {
  inferredIntent: string;
  emotionalTone: string;
  certainty: 'low' | 'medium' | 'high';
  subtextNotes?: string;
}

export interface DetectedMemoryOutput {
  category: MemoryCategory;
  content: string;
  importance: number;
  futureUsefulness?: number;
  stability?: 'stable' | 'evolving' | 'tentative';
  explicitUserRequest?: boolean;
  supersedesMemoryId?: string | null;
  sourceSnippet?: string;
}

export type ResponseStrategy =
  | 'DIRECT_ANSWER'
  | 'SHORT_REACTION'
  | 'OBSERVATION'
  | 'EMPATHY'
  | 'EXPLANATION'
  | 'PLAYFUL_RESPONSE'
  | 'SUPPORTIVE_RESPONSE'
  | 'CLARIFICATION'
  | 'CURIOUS_QUESTION'
  | 'OPINION'
  | 'TOPIC_TRANSITION'
  | 'CONVERSATION_END';

export interface ChatApiResponse {
  success: boolean;
  reply: string;
  replies?: string[]; // Multiple message bubbles in one conversational turn if applicable
  updatedEmotion: EmotionState;
  detectedMemories: DetectedMemoryOutput[];
  contextInterpretation: ContextInterpretation;
  responseStrategy?: ResponseStrategy | string;
  temporalContext?: TemporalContext;
  error?: string;
}

export type UserTypingState =
  | 'USER_IDLE'
  | 'USER_TYPING'
  | 'USER_PAUSED'
  | 'USER_SENT_MESSAGE'
  | 'USER_CONTINUING'
  | 'USER_FINISHED_TURN';

export type ConversationTurnState =
  | 'LISTENING'
  | 'MESSAGE_RECEIVED'
  | 'CHECK_TYPING_STATE'
  | 'WAITING_FOR_CONTINUATION'
  | 'TURN_COMPLETION_ESTIMATION'
  | 'READY_TO_RESPOND'
  | 'GENERATING'
  | 'RESPONDED';

export type MiyuInternalState = 'LISTENING' | 'THINKING' | 'RESPONDING';

export interface TemporalContext {
  currentTimeIso: string;
  currentDateFormatted: string; // e.g. "08/09/2026" (DD/MM/YYYY)
  currentWeekday: string;        // e.g. "Thứ Ba"
  currentWeekdayEn: string;      // e.g. "Tuesday"
  currentTimeFormatted: string;  // e.g. "08:04" (HH:mm)
  localTimeFormatted: string;    // backward compatibility
  timezone: string;              // "Asia/Ho_Chi_Minh (UTC+7)"
  displayDateVietnam: string;    // e.g. "Thứ Ba, 08/09/2026"
  fullDateTimeString: string;    // e.g. "Thứ Ba, 08/09/2026 08:04"
  timeOfDay: 'late_night' | 'early_morning' | 'morning' | 'afternoon' | 'evening' | 'night';
  localHour: number;
  timeSincePreviousMessageSeconds?: number;
  isLateNight: boolean;
  repeatedLateNightPattern?: boolean;
}

export interface TurnCompletenessAssessment {
  isLikelyComplete: boolean;
  continuationProbability: number;
  isTrailingIncomplete: boolean;
  isQuestion: boolean;
  isUrgentOrDirect: boolean;
  isThoughtfulOrEmotional: boolean;
  isWithdrawalOrCorrection: boolean;
  suggestedWaitMs: number;
  reason: string;
}
