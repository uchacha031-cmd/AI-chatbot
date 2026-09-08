import { RelationshipState } from '../../types/index.ts';
import { INITIAL_RELATIONSHIP } from '../constants.ts';

export interface ProgressEvaluationContext {
  userMessage: string;
  batchedMessages?: string[];
  detectedIntent?: string;
  emotionalTone?: string;
  hasNewImportantMemory?: boolean;
  isExplicitRequest?: boolean;
  totalMemoriesCount: number;
}

/**
 * Validates and sanitizes relationship state.
 * Resets to 0 if legacy mock data (like 79, 85, etc.) or corrupted structure is detected.
 */
export function cleanAndValidateRelationship(raw: any): RelationshipState {
  if (!raw || typeof raw !== 'object') {
    return { ...INITIAL_RELATIONSHIP };
  }

  // Detect legacy gamified / mock data (e.g. 79%, 85%, or missing fields)
  const isLegacy =
    typeof raw.familiarity !== 'number' ||
    typeof raw.comfort !== 'number' ||
    typeof raw.trust !== 'number' ||
    typeof raw.attachment !== 'number' ||
    raw.familiarity >= 70 ||
    raw.attachment >= 70 ||
    !raw.lastUpdated;

  if (isLegacy) {
    return { ...INITIAL_RELATIONSHIP };
  }

  return {
    familiarity: Math.max(0, Math.min(100, Number(raw.familiarity.toFixed(2)))),
    comfort: Math.max(0, Math.min(100, Number(raw.comfort.toFixed(2)))),
    trust: Math.max(0, Math.min(100, Number(raw.trust.toFixed(2)))),
    attachment: Math.max(0, Math.min(100, Number(raw.attachment.toFixed(2)))),
    sharedHistory: Math.max(0, Math.min(100, Number((raw.sharedHistory || 0).toFixed(2)))),
    attention: Math.max(0, Math.min(100, Number((raw.attention ?? 10).toFixed(2)))),
    care: Math.max(0, Math.min(100, Number((raw.care ?? 5).toFixed(2)))),
    emotionalSalience: Math.max(0, Math.min(100, Number((raw.emotionalSalience ?? 0).toFixed(2)))),
    interactionCount: Math.max(0, Number(raw.interactionCount || 0)),
    lastInteractionTimestamp: raw.lastInteractionTimestamp || new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Calculates extremely slow, history-based relationship growth.
 * Philosophy:
 * - Simple greetings & casual chats cause virtually zero increase.
 * - No single message can increase any dimension by more than +0.15 (out of 100).
 * - Attachment never grows independently of familiarity and comfort.
 * - Relationship is driven by accumulated consistency over time, not instant sweet talk.
 * - Qualitative internal dimensions (familiarity, comfort, trust, attachment, sharedHistory, attention, care, emotionalSalience)
 *   do NOT need to move together.
 */
export function calculateRelationshipProgress(
  current: RelationshipState,
  context: ProgressEvaluationContext
): RelationshipState {
  const safeCurrent = cleanAndValidateRelationship(current);
  const nextInteractionCount = safeCurrent.interactionCount + 1;

  const text = (context.userMessage || '').trim().toLowerCase();
  const isGreeting = /^(chào|chao|hi|hello|hé lô|helo|alo|ơi|ê)$/i.test(text);
  const isShortAcknowledge = /^(ừ|uh|u|ok|oke|dạ|rồi|the a|the ah|the à)$/i.test(text);

  let dFamiliarity = 0.0;
  let dComfort = 0.0;
  let dTrust = 0.0;
  let dAttachment = 0.0;
  let dAttention = 0.02;
  let dCare = 0.0;
  let dSalience = 0.0;

  if (isGreeting || isShortAcknowledge) {
    // Normal greetings or tiny acknowledgments cause almost zero increase
    dFamiliarity = 0.01;
    dComfort = 0.005;
    dTrust = 0.0;
    dAttachment = 0.0;
    dCare = 0.002;
    dSalience = 0.0;
  } else if (context.isExplicitRequest || context.hasNewImportantMemory) {
    // Deep personal sharing or explicit memory dặn dò
    dFamiliarity = 0.08;
    dComfort = 0.06;
    dTrust = 0.08;
    dAttachment = 0.02;
    dAttention = 0.08;
    dCare = 0.05;
    dSalience = 0.12;
  } else if (text.length > 50 || (context.batchedMessages && context.batchedMessages.length > 1)) {
    // Longer conversational message
    dFamiliarity = 0.04;
    dComfort = 0.03;
    dTrust = 0.02;
    dAttachment = 0.01;
    dAttention = 0.05;
    dCare = 0.02;
    dSalience = 0.05;
  } else {
    // Standard conversational turn
    dFamiliarity = 0.02;
    dComfort = 0.015;
    dTrust = 0.01;
    dAttachment = 0.0;
    dAttention = 0.03;
    dCare = 0.01;
    dSalience = 0.02;
  }

  // Hard Cap: No dimension can jump more than 0.15 in a single turn
  const MAX_STEP = 0.15;
  dFamiliarity = Math.min(MAX_STEP, dFamiliarity);
  dComfort = Math.min(MAX_STEP, dComfort);
  dTrust = Math.min(MAX_STEP, dTrust);
  dAttachment = Math.min(MAX_STEP, dAttachment);
  dAttention = Math.min(MAX_STEP, dAttention);
  dCare = Math.min(MAX_STEP, dCare);
  dSalience = Math.min(MAX_STEP, dSalience);

  // Growth slows down progressively as values approach higher tiers (sublinear growth)
  const slowFactor = (val: number) => Math.max(0.2, (100 - val) / 100);

  const nextFamiliarity = safeCurrent.familiarity + dFamiliarity * slowFactor(safeCurrent.familiarity);
  const nextComfort = safeCurrent.comfort + dComfort * slowFactor(safeCurrent.comfort);
  const nextTrust = safeCurrent.trust + dTrust * slowFactor(safeCurrent.trust);
  const nextAttention = Math.min(100, (safeCurrent.attention ?? 10) + dAttention * slowFactor(safeCurrent.attention ?? 10));
  const nextCare = Math.min(100, (safeCurrent.care ?? 5) + dCare * slowFactor(safeCurrent.care ?? 5));
  const nextSalience = Math.min(100, (safeCurrent.emotionalSalience ?? 0) + dSalience * slowFactor(safeCurrent.emotionalSalience ?? 0));

  // Attachment is capped by the current depth of familiarity & comfort
  const maxPossibleAttachment = Math.min(nextFamiliarity * 0.75, nextComfort * 0.75);
  const rawAttachment = safeCurrent.attachment + dAttachment * slowFactor(safeCurrent.attachment);
  const nextAttachment = Math.min(maxPossibleAttachment, rawAttachment);

  // Shared history reflects the accumulated turns and durable memories
  const rawSharedHistory = (nextInteractionCount * 0.04) + (context.totalMemoriesCount * 0.35);
  const nextSharedHistory = Math.min(100, rawSharedHistory);

  return {
    familiarity: Number(Math.max(0, Math.min(100, nextFamiliarity)).toFixed(2)),
    comfort: Number(Math.max(0, Math.min(100, nextComfort)).toFixed(2)),
    trust: Number(Math.max(0, Math.min(100, nextTrust)).toFixed(2)),
    attachment: Number(Math.max(0, Math.min(100, nextAttachment)).toFixed(2)),
    sharedHistory: Number(Math.max(0, Math.min(100, nextSharedHistory)).toFixed(2)),
    attention: Number(Math.max(0, Math.min(100, nextAttention)).toFixed(2)),
    care: Number(Math.max(0, Math.min(100, nextCare)).toFixed(2)),
    emotionalSalience: Number(Math.max(0, Math.min(100, nextSalience)).toFixed(2)),
    interactionCount: nextInteractionCount,
    lastInteractionTimestamp: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  };
}
