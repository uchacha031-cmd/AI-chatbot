import {
  ChatMessage,
  ChatSettings,
  ConversationTurnState,
  DetectedMemoryOutput,
  EmotionState,
  MemoryCategory,
  MemoryItem,
  MiyuInternalState,
  PersonalityParameters,
  RelationshipState,
  TemporalContext,
  UserProfile,
  UserTypingState,
} from '../../types/index.ts';
import {
  saveMessagesBatch,
  saveMessage,
  saveEmotionState,
  saveMemoryItem,
  updateMemoryItem,
  saveRelationshipState,
} from '../../services/firebase.ts';
import { evaluateMemoryCandidate, resolveMemoryConflict } from '../memory/memoryEngine.ts';
import { calculateRelationshipProgress } from '../relationship/relationshipEngine.ts';
import { analyzeTurnCompleteness } from '../timing/turnCompletenessEngine.ts';
import { buildTemporalContext } from '../timing/temporalEngine.ts';

export interface QueueControllerConfig {
  userId: string;
  conversationId: string;
  getMessages: () => ChatMessage[];
  setMessages: (updater: (prev: ChatMessage[]) => ChatMessage[]) => void;
  getMemories: () => MemoryItem[];
  setMemories: (updater: (prev: MemoryItem[]) => MemoryItem[]) => void;
  getUserProfile: () => UserProfile | null;
  getEmotion: () => EmotionState;
  setEmotion: (emotion: EmotionState) => void;
  getPersonality: () => PersonalityParameters;
  getRelationship: () => RelationshipState;
  setRelationship: (relationship: RelationshipState) => void;
  getChatSettings?: () => ChatSettings;
  onGeneratingChange: (isGenerating: boolean) => void;
  onError: (err: string | null) => void;
  onTurnStateChange?: (state: ConversationTurnState) => void;
  onMiyuStateChange?: (state: MiyuInternalState) => void;
  onMessageReceived?: (message: ChatMessage) => void;
}

export class MessageQueueController {
  private config: QueueControllerConfig;
  private pendingQueue: ChatMessage[] = [];
  private inFlightBatch: ChatMessage[] = [];
  private isGenerating: boolean = false;
  private debounceTimer: NodeJS.Timeout | null = null;
  private generationTaskId: number = 0;
  private activeBatchId: string | null = null;

  // Conversational Listening & Timing internal state machine
  private turnState: ConversationTurnState = 'LISTENING';
  private miyuState: MiyuInternalState = 'LISTENING';
  private userTypingState: UserTypingState = 'USER_IDLE';

  // Tracking recent interaction pace
  private recentMessageTimestamps: number[] = [];
  private recentMessageIntervalsMs: number[] = [];

  constructor(config: QueueControllerConfig) {
    this.config = config;
  }

  public updateConfig(newConfig: Partial<QueueControllerConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  public getIsGenerating(): boolean {
    return this.isGenerating;
  }

  public getPendingQueueLength(): number {
    return this.pendingQueue.length;
  }

  public getTurnState(): ConversationTurnState {
    return this.turnState;
  }

  public getMiyuState(): MiyuInternalState {
    return this.miyuState;
  }

  public getUserTypingState(): UserTypingState {
    return this.userTypingState;
  }

  private setTurnState(state: ConversationTurnState) {
    this.turnState = state;
    this.config.onTurnStateChange?.(state);
  }

  private setMiyuState(state: MiyuInternalState) {
    this.miyuState = state;
    this.config.onMiyuStateChange?.(state);
  }

  /**
   * TYPING AWARENESS: User started typing a draft in the input field.
   * STRICT SEPARATION: Typing a draft NEVER enters the queue, NEVER triggers or delays
   * AI generation, and NEVER cancels in-flight tasks.
   */
  public handleUserTypingStart(): void {
    this.userTypingState = 'USER_TYPING';
    // Strictly composer-level: DO NOT cancel timers, DO NOT abort generation!
  }

  /**
   * TYPING AWARENESS: User paused typing draft.
   */
  public handleUserTypingPause(): void {
    this.userTypingState = 'USER_PAUSED';
    // Strictly composer-level: DO NOT interfere with message batch timers!
  }

  /**
   * TYPING AWARENESS: User stopped typing draft (cleared or blurred).
   */
  public handleUserTypingStop(): void {
    this.userTypingState = 'USER_IDLE';
    // Strictly composer-level: DO NOT interfere with message batch timers!
  }

  /**
   * Enqueue a confirmed sent user message.
   * Only pressing SEND invokes this. Immediately displays in UI, persists to storage,
   * and queues for conversational generation.
   */
  public enqueueMessage(text: string): ChatMessage {
    const trimmed = text.trim();
    if (!trimmed) {
      throw new Error('Message cannot be empty');
    }

    this.config.onError(null);

    const now = Date.now();
    if (this.recentMessageTimestamps.length > 0) {
      const prevTime = this.recentMessageTimestamps[this.recentMessageTimestamps.length - 1];
      const interval = Math.max(50, now - prevTime);
      this.recentMessageIntervalsMs.push(interval);
      if (this.recentMessageIntervalsMs.length > 10) {
        this.recentMessageIntervalsMs.shift();
      }
    }
    this.recentMessageTimestamps.push(now);
    if (this.recentMessageTimestamps.length > 10) {
      this.recentMessageTimestamps.shift();
    }

    const messageId = 'msg_' + now.toString(36) + Math.random().toString(36).slice(2, 6);
    const userMessage: ChatMessage = {
      id: messageId,
      conversationId: this.config.conversationId,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
      status: 'queued',
    };

    // 1. Immediately display in UI
    this.config.setMessages((prev) => [...prev, userMessage]);

    // 2. Persist immediately to prevent loss
    saveMessage(userMessage).catch((err) => {
      console.warn('Async user message save warning:', err);
    });

    // 3. Push to pending queue
    this.pendingQueue.push(userMessage);

    // 4. State Machine Transition
    this.userTypingState = 'USER_SENT_MESSAGE';
    this.setTurnState('MESSAGE_RECEIVED');

    // 5. If AI is already generating, DO NOT abort or overwrite!
    // The new message stays safely in pendingQueue and will be picked up as soon as current generation completes.
    if (this.isGenerating) {
      return userMessage;
    }

    // 6. Turn completion estimation & adaptive waiting (500ms - 750ms debounce)
    this.setTurnState('TURN_COMPLETION_ESTIMATION');
    const assessment = analyzeTurnCompleteness(
      this.pendingQueue,
      'USER_IDLE',
      this.recentMessageIntervalsMs
    );

    this.setTurnState('WAITING_FOR_CONTINUATION');
    this.scheduleBatchProcessing(assessment.suggestedWaitMs);

    return userMessage;
  }

  /**
   * Enqueue an uploaded image message.
   * Converts file to Base64 data URL, displays immediately, persists, and queues for batch processing.
   */
  public async enqueueImageMessage(file: File, caption: string): Promise<ChatMessage> {
    this.config.onError(null);

    // Read as Base64 Data URL
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });

    const now = Date.now();
    const messageId = 'img_' + now.toString(36) + Math.random().toString(36).slice(2, 6);
    const userMessage: ChatMessage = {
      id: messageId,
      conversationId: this.config.conversationId,
      role: 'user',
      type: 'image',
      content: caption.trim() || '[Hình ảnh]',
      mediaUrl: dataUrl,
      mediaMetadata: {
        name: file.name,
        size: file.size,
        mimeType: file.type || 'image/jpeg',
      },
      timestamp: new Date().toISOString(),
      status: 'queued',
    };

    // 1. Immediately display in UI
    this.config.setMessages((prev) => [...prev, userMessage]);

    // 2. Persist immediately
    saveMessage(userMessage).catch((err) => {
      console.warn('Async user image message save warning:', err);
    });

    // 3. Push to pending queue
    this.pendingQueue.push(userMessage);

    // 4. State transition
    this.userTypingState = 'USER_SENT_MESSAGE';
    this.setTurnState('MESSAGE_RECEIVED');

    if (this.isGenerating) {
      return userMessage;
    }

    this.setTurnState('WAITING_FOR_CONTINUATION');
    this.scheduleBatchProcessing(600);

    return userMessage;
  }

  /**
   * Retry a failed message without creating duplicate messages
   */
  public retryMessage(messageId: string): void {
    const currentMessages = this.config.getMessages();
    const target = currentMessages.find((m) => m.id === messageId);
    if (!target) return;

    this.config.onError(null);

    const updatedMsg: ChatMessage = {
      ...target,
      status: 'queued',
      timestamp: new Date().toISOString(),
    };

    // Update in UI
    this.config.setMessages((prev) => prev.map((m) => (m.id === messageId ? updatedMsg : m)));
    saveMessage(updatedMsg).catch(console.warn);

    // Avoid duplicate in pending queue
    if (!this.pendingQueue.some((m) => m.id === messageId)) {
      this.pendingQueue.push(updatedMsg);
    }

    this.scheduleBatchProcessing(400);
  }

  /**
   * Schedule adaptive batch execution.
   */
  private scheduleBatchProcessing(delayMs: number = 1200): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      this.executeBatch();
    }, delayMs);
  }

  /**
   * Executes the next batch of queued messages concurrently safe.
   */
  private async executeBatch(): Promise<void> {
    if (this.isGenerating || this.pendingQueue.length === 0) {
      return;
    }

    this.setTurnState('READY_TO_RESPOND');

    // Lock generation
    this.isGenerating = true;
    this.setTurnState('GENERATING');
    this.setMiyuState('THINKING');
    this.config.onGeneratingChange(true);

    // Monotonic task identifier to prevent race conditions & stale overwrite
    const taskId = ++this.generationTaskId;

    // Take snapshot of pending messages for this batch
    const currentBatch = [...this.pendingQueue];
    this.inFlightBatch = currentBatch;
    this.pendingQueue = [];

    const batchId = 'batch_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    this.activeBatchId = batchId;

    // Mark current batch as 'processing' in UI & storage
    const processingBatch = currentBatch.map((m) => ({
      ...m,
      batchId,
      status: 'processing' as const,
    }));

    const batchIdSet = new Set(processingBatch.map((m) => m.id));

    this.config.setMessages((prev) =>
      prev.map((m) => {
        const found = processingBatch.find((b) => b.id === m.id);
        return found ? found : m;
      })
    );
    saveMessagesBatch(processingBatch).catch(console.warn);

    try {
      // Gather context
      const allMessages = this.config.getMessages();
      // Only include completed messages from before this batch for conversationHistory
      const priorMessages = allMessages
        .filter((m) => !batchIdSet.has(m.id) && m.status !== 'failed')
        .slice(-10)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const batchedTexts = processingBatch.map((m) => m.content);
      const combinedText = batchedTexts.join('\n');

      // Temporal context computation
      const temporalContext: TemporalContext = buildTemporalContext(allMessages);

      // Check if batch contains an image message
      let imageAttachment: { data: string; mimeType: string } | undefined = undefined;
      const imageMsg = processingBatch.find((m) => m.type === 'image' && m.mediaUrl);
      if (imageMsg && imageMsg.mediaUrl) {
        imageAttachment = {
          data: imageMsg.mediaUrl,
          mimeType: imageMsg.mediaMetadata?.mimeType || 'image/jpeg',
        };
      }

      const settings = this.config.getChatSettings?.();

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: combinedText,
          batchedMessages: batchedTexts,
          batchId,
          conversationHistory: priorMessages,
          userProfile: this.config.getUserProfile(),
          memories: this.config.getMemories(),
          currentEmotion: this.config.getEmotion(),
          personality: this.config.getPersonality(),
          relationship: this.config.getRelationship(),
          temporalContext,
          imageAttachment,
          miyuNickname: settings?.miyuNickname,
          userNickname: settings?.userNickname,
          miyuOriginalName: settings?.miyuOriginalName || 'Miyu',
          userOriginalName: settings?.userOriginalName || 'Người dùng',
        }),
      });

      // Stale task check: if interrupted or another task superseded this, discard results
      if (taskId !== this.generationTaskId) {
        console.warn(`[Timing Engine] Discarding stale generation task #${taskId} (current #${this.generationTaskId})`);
        return;
      }

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();

      if (!data.success && data.error && !data.reply) {
        throw new Error(data.error || 'Server processing failed');
      }

      // Check again after JSON parsing
      if (taskId !== this.generationTaskId) {
        console.warn(`[Timing Engine] Discarding stale parsed response for task #${taskId}`);
        return;
      }

      // 1. Mark batch as completed
      const completedBatch = processingBatch.map((m) => ({
        ...m,
        status: 'completed' as const,
      }));

      // 2. Handle memory candidates: Silent, evaluated, and conflict-resolved
      let newlyPersistedCount = 0;
      const rawCandidates = Array.isArray(data.detectedMemories) ? data.detectedMemories : [];
      if (rawCandidates.length > 0) {
        const currentMemories = this.config.getMemories();
        for (const candidate of rawCandidates as DetectedMemoryOutput[]) {
          // Gatekeeper: only save if candidate qualifies as meaningful long-term memory
          const passesEvaluation = evaluateMemoryCandidate(candidate, combinedText);
          if (!passesEvaluation) {
            continue;
          }

          // Conflict resolution: check if supersedes or contradicts existing memory
          const conflict = resolveMemoryConflict(candidate, currentMemories);
          if (conflict.action === 'update') {
            await updateMemoryItem(
              conflict.targetMemoryId,
              conflict.updatedContent,
              candidate.importance || 3
            ).catch(console.warn);

            this.config.setMemories((prev) =>
              prev.map((m) =>
                m.id === conflict.targetMemoryId
                  ? {
                      ...m,
                      content: conflict.updatedContent,
                      importance: candidate.importance || m.importance,
                      updatedAt: new Date().toISOString(),
                    }
                  : m
              )
            );
            newlyPersistedCount++;
          } else {
            const memoryId = 'mem_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
            const memoryItem: MemoryItem = {
              id: memoryId,
              userId: this.config.userId,
              category: (candidate.category as MemoryCategory) || 'important',
              content: candidate.content,
              importance: candidate.importance || 3,
              futureUsefulness: candidate.futureUsefulness,
              stability: candidate.stability,
              explicitUserRequest: candidate.explicitUserRequest,
              sourceSnippet: candidate.sourceSnippet || batchedTexts[0] || '',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            await saveMemoryItem(memoryItem).catch(console.warn);
            this.config.setMemories((prev) => [memoryItem, ...prev]);
            newlyPersistedCount++;
          }
        }
      }

      // 3. Update emotion state (temporary reactive emotion)
      if (data.updatedEmotion) {
        this.config.setEmotion(data.updatedEmotion);
        saveEmotionState(this.config.userId, data.updatedEmotion).catch(console.warn);
      }

      // 4. Update relationship state (slow, subtle, history-based, strictly internal)
      const currentRel = this.config.getRelationship();
      const updatedRel = calculateRelationshipProgress(currentRel, {
        userMessage: combinedText,
        batchedMessages: batchedTexts,
        detectedIntent: data.contextInterpretation?.inferredIntent,
        emotionalTone: data.contextInterpretation?.emotionalTone,
        hasNewImportantMemory: newlyPersistedCount > 0,
        isExplicitRequest: rawCandidates.some((m: any) => m.explicitUserRequest),
        totalMemoriesCount: this.config.getMemories().length,
      });
      this.config.setRelationship(updatedRel);
      saveRelationshipState(this.config.userId, updatedRel).catch(console.warn);

      // 5. Create model response message(s) - supporting multiple short message bubbles within one conversational turn
      const rawReplies: string[] = Array.isArray(data.replies) && data.replies.length > 0
        ? data.replies.map((r: any) => String(r).trim()).filter((r: string) => r.length > 0)
        : (data.reply && data.reply.trim().length > 0 ? [data.reply.trim()] : ['Em nghe.']);

      const nowMs = Date.now();
      const modelMessages: ChatMessage[] = rawReplies.map((replyContent, idx) => ({
        id: 'msg_' + (nowMs + idx).toString(36) + Math.random().toString(36).slice(2, 6),
        conversationId: this.config.conversationId,
        role: 'model',
        content: replyContent,
        timestamp: new Date(nowMs + idx * 300).toISOString(),
        status: 'completed',
        batchId,
        isMemoryCandidate: false,
        detectedEmotion: data.contextInterpretation?.emotionalTone,
        detectedIntent: data.contextInterpretation?.inferredIntent,
      }));

      // 6. Commit all updates atomically in state
      this.setTurnState('RESPONDED');
      this.setMiyuState('RESPONDING');

      this.config.setMessages((prev) => {
        const updated = prev.map((m) => {
          const finished = completedBatch.find((b) => b.id === m.id);
          return finished ? finished : m;
        });
        // Append model message bubbles
        return [...updated, ...modelMessages];
      });

      for (const mm of modelMessages) {
        this.config.onMessageReceived?.(mm);
      }

      // 7. Persist to storage
      saveMessagesBatch([...completedBatch, ...modelMessages]).catch(console.warn);

      // Clear in-flight reference
      this.inFlightBatch = [];
    } catch (err: any) {
      console.error('Batch execution error:', err);

      // Check if stale
      if (taskId !== this.generationTaskId) return;

      // Mark batch messages as 'failed' so user can retry
      const failedBatch = processingBatch.map((m) => ({
        ...m,
        status: 'failed' as const,
      }));

      this.config.setMessages((prev) =>
        prev.map((m) => {
          const failedItem = failedBatch.find((b) => b.id === m.id);
          return failedItem ? failedItem : m;
        })
      );
      saveMessagesBatch(failedBatch).catch(console.warn);

      this.config.onError('Kết nối bị gián đoạn. Anh có thể bấm nút thử lại ở tin nhắn nhé.');
      this.inFlightBatch = [];
    } finally {
      if (taskId === this.generationTaskId) {
        this.isGenerating = false;
        this.activeBatchId = null;
        this.setTurnState('LISTENING');
        this.setMiyuState('LISTENING');
        this.config.onGeneratingChange(false);

        // Check if new messages arrived while we were generating
        if (this.pendingQueue.length > 0) {
          this.setTurnState('TURN_COMPLETION_ESTIMATION');
          const assessment = analyzeTurnCompleteness(
            this.pendingQueue,
            'USER_IDLE',
            this.recentMessageIntervalsMs
          );
          this.setTurnState('WAITING_FOR_CONTINUATION');
          this.scheduleBatchProcessing(assessment.suggestedWaitMs);
        }
      }
    }
  }

  public clearQueue(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.pendingQueue = [];
    this.inFlightBatch = [];
    this.isGenerating = false;
    this.activeBatchId = null;
    this.generationTaskId++;
    this.userTypingState = 'USER_IDLE';
    this.setTurnState('LISTENING');
    this.setMiyuState('LISTENING');
    this.config.onGeneratingChange(false);
  }
}
