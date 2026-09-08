import { ChatMessage, TurnCompletenessAssessment, UserTypingState } from '../../types/index.ts';

// Vietnamese conjunctions and transition particles often signaling continuation
const TRAILING_CONJUNCTIONS = [
  'mà',
  'nhưng',
  'nhưng mà',
  'xong',
  'xong rồi',
  'xong gặp',
  'rồi',
  'với lại',
  'với',
  'kiểu',
  'kiểu như',
  'tại vì',
  'tại',
  'bởi vì',
  'nên',
  'cho nên',
  'thì',
  'hoặc là',
  'hay là',
  'chắc là',
  'đang',
  'tự nhiên',
  'tự dưng',
  'hình như',
  'còn',
  'định',
  'đang tính',
  'nói chung là',
  'chứ',
  'là',
  'khoan',
  'à mà',
];

// Openings that strongly suggest the user is about to elaborate
const INCOMPLETE_OPENINGS = [
  'tui vừa nghĩ ra',
  'anh vừa nghĩ ra',
  'hôm nay anh định',
  'nay tui định',
  'em biết cái này không',
  'em có biết',
  'nãy gặp',
  'vừa gặp',
  'định bảo',
  'tự nhiên thấy',
  'tự dưng nhớ',
  'có chuyện này',
  'nghe này',
  'khoan đã',
];

// Withdrawal or thought redirection markers
const WITHDRAWAL_MARKERS = [
  'thôi',
  'thôi để lát kể',
  'thôi bỏ đi',
  'để lát kể',
  'quên',
  'quên mất',
  'à khoan',
  'khoan đã',
];

// Urgent or immediate question signals
const URGENT_MARKERS = [
  'bây giờ làm sao',
  'làm sao bây giờ',
  'cứu anh',
  'cứu tui',
  'gấp',
  'ai đấy',
  'đâu rồi',
  'có sao không',
];

// Emotional or contemplative statements
const EMOTIONAL_MARKERS = [
  'không biết mình đang muốn gì',
  'có những lúc',
  'thấy trống rỗng',
  'thấy buồn quá',
  'mệt mỏi quá',
  'áp lực',
  'chán nản',
  'tâm sự',
  'bế tắc',
  'cảm giác lạc lõng',
];

// Standalone complete statements (greetings, closures, definite states)
const DEFINITE_COMPLETE_MARKERS = [
  'chào em',
  'chúc em ngủ ngon',
  'ngủ ngon em',
  'bye em',
  'tạm biệt em',
  'hôm nay mệt vl',
  'mệt vl',
  'được rồi',
  'xong rồi',
  'ổn rồi',
  'cảm ơn em',
];

/**
 * Evaluates whether the current set of pending messages looks complete or likely continuing.
 */
export function analyzeTurnCompleteness(
  pendingMessages: ChatMessage[],
  userTypingState: UserTypingState = 'USER_IDLE',
  recentMessageIntervalsMs: number[] = []
): TurnCompletenessAssessment {
  if (pendingMessages.length === 0) {
    return {
      isLikelyComplete: true,
      continuationProbability: 0,
      isTrailingIncomplete: false,
      isQuestion: false,
      isUrgentOrDirect: false,
      isThoughtfulOrEmotional: false,
      isWithdrawalOrCorrection: false,
      suggestedWaitMs: 1000,
      reason: 'No pending messages',
    };
  }

  const latestMsg = pendingMessages[pendingMessages.length - 1];
  const rawText = latestMsg.content.trim();
  const lowerText = rawText.toLowerCase();

  // 1. Check for trailing ellipsis or comma / hyphen
  const hasTrailingEllipsis = /\.{2,}$/i.test(rawText) || /…$/i.test(rawText);
  const hasTrailingIncompletePunctuation = /[,;:\-–—~/\\]$/i.test(rawText);

  // 2. Check for trailing conjunction words
  const words = lowerText.split(/\s+/);
  const lastWord = words[words.length - 1] || '';
  const lastTwoWords = words.slice(-2).join(' ');
  const hasTrailingConjunction =
    TRAILING_CONJUNCTIONS.includes(lastWord) || TRAILING_CONJUNCTIONS.includes(lastTwoWords);

  // 3. Check for incomplete openings (e.g. "Tui vừa nghĩ ra cái này", "Hôm nay anh định...")
  const hasIncompleteOpening = INCOMPLETE_OPENINGS.some((op) => lowerText.startsWith(op));

  // 4. Check withdrawal / correction markers
  const isWithdrawalOrCorrection = WITHDRAWAL_MARKERS.some(
    (wm) => lowerText === wm || lowerText.endsWith(wm) || lowerText.startsWith(wm)
  );

  // 5. Check urgent question
  const isUrgentOrDirect = URGENT_MARKERS.some((um) => lowerText.includes(um));

  // 6. Check question mark
  const isQuestion = rawText.endsWith('?');

  // 7. Check emotional / contemplative
  const isThoughtfulOrEmotional = EMOTIONAL_MARKERS.some((em) => lowerText.includes(em));

  // 8. Check definite completion
  const isDefiniteComplete = DEFINITE_COMPLETE_MARKERS.some(
    (dm) => lowerText === dm || lowerText.startsWith(dm)
  );

  // 9. Short fragment check (e.g. "Hôm nay", "Nay", "xong gặp...", "khoan")
  const isShortFragment = words.length <= 3 && !isQuestion && !isDefiniteComplete && rawText.length < 18;

  // 10. Check rapid multi-message pattern: user just sent several short messages consecutively
  const isRapidSequence =
    pendingMessages.length >= 2 ||
    (recentMessageIntervalsMs.length >= 2 &&
      recentMessageIntervalsMs.slice(-2).every((interval) => interval < 2500));

  // Overall incomplete signal
  const isTrailingIncomplete =
    hasTrailingEllipsis ||
    hasTrailingIncompletePunctuation ||
    hasTrailingConjunction ||
    (hasIncompleteOpening && words.length < 9) ||
    isShortFragment;

  // Calculate continuation probability based strictly on confirmed sent messages
  let continuationProb = 0.2;

  if (isTrailingIncomplete) continuationProb += 0.3;
  if (hasTrailingEllipsis) continuationProb += 0.25;
  if (hasTrailingConjunction) continuationProb += 0.25;
  if (hasIncompleteOpening) continuationProb += 0.2;
  if (isRapidSequence) continuationProb += 0.2;
  if (isWithdrawalOrCorrection) continuationProb -= 0.3;
  if (isUrgentOrDirect) continuationProb -= 0.3;
  if (isDefiniteComplete) continuationProb -= 0.4;

  // Clamp 0.0 - 1.0
  continuationProb = Math.max(0.05, Math.min(0.95, continuationProb));

  const isLikelyComplete = continuationProb < 0.55;

  // Fast, responsive debounce window (500ms - 800ms) for conversational batching
  let suggestedWaitMs = 600;
  let reason = 'standard_natural_pause';

  if (isRapidSequence && pendingMessages.length < 5) {
    // User is sending rapid short messages in quick succession
    suggestedWaitMs = 700;
    reason = 'rapid_fragments_grouping';
  } else if (isTrailingIncomplete || hasTrailingConjunction || hasIncompleteOpening) {
    // Slight allowance for multi-part sent thought, capped at 750ms
    suggestedWaitMs = 750;
    reason = 'trailing_continuation_debounce';
  } else if (isUrgentOrDirect || isDefiniteComplete) {
    // Brisk prompt dispatch
    suggestedWaitMs = 500;
    reason = 'prompt_dispatch';
  } else {
    suggestedWaitMs = 600;
    reason = 'normal_debounce';
  }

  return {
    isLikelyComplete,
    continuationProbability: Math.round(continuationProb * 100) / 100,
    isTrailingIncomplete,
    isQuestion,
    isUrgentOrDirect,
    isThoughtfulOrEmotional,
    isWithdrawalOrCorrection,
    suggestedWaitMs,
    reason,
  };
}
