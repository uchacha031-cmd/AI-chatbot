import { MemoryCategory, MemoryItem, DetectedMemoryOutput } from '../../types/index.ts';

/**
 * Normalizes Vietnamese text for semantic keyword matching and tokenization.
 * Strips accents and non-alphanumeric characters, converts to lowercase.
 */
export function normalizeText(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalizes any category string into one of the 6 canonical logical categories:
 * USER_PROFILE | IMPORTANT_MEMORY | PREFERENCE | GOAL | SIGNIFICANT_EVENT | RELATIONSHIP_CONTEXT
 */
export function normalizeCategory(cat: string): MemoryCategory {
  const upper = (cat || '').toUpperCase().trim();
  if (upper === 'USER_PROFILE' || upper === 'PROFILE') return 'USER_PROFILE';
  if (upper === 'IMPORTANT_MEMORY' || upper === 'IMPORTANT') return 'IMPORTANT_MEMORY';
  if (upper === 'PREFERENCE') return 'PREFERENCE';
  if (upper === 'GOAL') return 'GOAL';
  if (upper === 'SIGNIFICANT_EVENT') return 'SIGNIFICANT_EVENT';
  if (upper === 'RELATIONSHIP_CONTEXT' || upper === 'RECENT_CONTEXT') return 'RELATIONSHIP_CONTEXT';
  return 'IMPORTANT_MEMORY';
}

/**
 * Checks if the user explicitly commanded Miyu to remember something.
 * Patterns: "Nhớ điều này", "Nhớ giúp anh", "Đừng quên", "Nhớ rằng", "Hãy nhớ"...
 */
export function detectExplicitMemoryCommand(text: string): boolean {
  return /(nhớ (điều|cái|chuyện|giúp|kỹ|hộ|lấy|rằng)|đừng quên|ghi nhớ|lưu lại giúp|hãy nhớ|nhớ nha|nhớ nhé)/i.test(
    text || ''
  );
}

/**
 * Checks if a candidate statement is ephemeral, transient activity, or short-term mood
 * that should NEVER be stored as permanent long-term memory.
 *
 * Examples usually NOT worth permanent storage:
 * - "Anh đang ăn mì"
 * - "Anh đang ngồi"
 * - "Anh hơi buồn hôm nay"
 * - "Hôm nay mệt vl"
 */
export function isEphemeralInfo(content: string): boolean {
  const norm = normalizeText(content);

  // Present-continuous transient actions (đang ăn, vừa ăn, đang ngồi, đang nằm, đang lướt...)
  const transientActionPatterns = [
    /\bdang an\b/,
    /\bvua an\b/,
    /\ban com\b/,
    /\ban trua\b/,
    /\ban toi\b/,
    /\ban sang\b/,
    /\ban dem\b/,
    /\bdang uong\b/,
    /\bdang ngoi\b/,
    /\bdang nam\b/,
    /\bdang dung\b/,
    /\bdang di (xe|duong|lam|choi|dao)\b/,
    /\bdang xem (dien thoai|phim|clip|tivi)\b/,
    /\bdang luot\b/,
    /\bdang choi game\b/,
    /\bchuan bi ngu\b/,
    /\bbuon ngu\b/,
    /\bdi tam\b/,
    /\btam rua\b/,
    /\bdang o quan\b/,
    /\bdang doi\b/
  ];

  if (transientActionPatterns.some((p) => p.test(norm))) {
    // Exception: If it explicitly says "thích ăn" or "thích uống", it's a preference, not a transient action
    if (/thich an|thich uong|ghien|me an|khoai an/.test(norm)) {
      return false;
    }
    return true;
  }

  // Temporary ephemeral emotional states of the day
  const ephemeralMoodPatterns = [
    /\b(hoi|dang|rat) buon hom nay\b/,
    /\bhom nay (hoi|rat)? (buon|met|vui|chan)\b/,
    /\bmet moi hom nay\b/,
    /\bmet vl\b/,
    /\bmet qua\b/,
    /\bhoi met\b/,
    /\btroi (nong|mua|lanh|dep|am u)\b/,
    /\bchao em\b/,
    /\btam biet\b/,
    /\bhen gap\b/
  ];

  if (ephemeralMoodPatterns.some((p) => p.test(norm))) {
    return true;
  }

  return false;
}

/**
 * Evaluates whether a memory candidate qualifies for permanent long-term storage.
 * Criteria:
 * - Long-term usefulness (>= 3 on 1-5 scale)
 * - Explicitness / Stability (reject tentative, prioritize stable)
 * - Personal significance
 * - Reject ephemeral small talk and transient meals/actions
 */
export function evaluateMemoryCandidate(
  candidate: DetectedMemoryOutput,
  userMessage: string
): boolean {
  if (!candidate || !candidate.content || candidate.content.trim().length < 4) {
    return false;
  }

  // If user explicitly commanded to remember, prioritize saving
  const isExplicit = candidate.explicitUserRequest || detectExplicitMemoryCommand(userMessage);
  if (isExplicit) {
    return true;
  }

  // Strictly reject transient / ephemeral info (e.g. "đang ăn mì", "đang ngồi", "hơi buồn hôm nay")
  if (isEphemeralInfo(candidate.content) || isEphemeralInfo(userMessage)) {
    return false;
  }

  // Reject tentative impressions
  if (candidate.stability === 'tentative') {
    return false;
  }

  // Strict thresholds for spontaneous extraction
  const importance = candidate.importance || 1;
  const usefulness = candidate.futureUsefulness || 1;

  // Must have clear future usefulness (>= 3) and moderate-to-high importance (>= 3)
  return importance >= 3 && usefulness >= 3;
}

/**
 * Resolves conflicts between a new memory candidate and existing memories.
 *
 * Rule: Prefer newer explicit information.
 * Example:
 * Old: "Anh không thích cà phê."
 * Later: "Giờ anh uống cà phê rồi." / "Anh uống cà phê thường xuyên rồi."
 * Expected: Update or supersede the older preference.
 * Do not keep contradictory active memories as if both are currently true.
 */
export function resolveMemoryConflict(
  candidate: DetectedMemoryOutput,
  existingMemories: MemoryItem[]
): { action: 'insert' } | { action: 'update'; targetMemoryId: string; updatedContent: string } {
  // 1. Model explicitly identified the superseded memory ID
  if (candidate.supersedesMemoryId) {
    const target = existingMemories.find((m) => m.id === candidate.supersedesMemoryId);
    if (target) {
      return {
        action: 'update',
        targetMemoryId: target.id,
        updatedContent: candidate.content,
      };
    }
  }

  const newNorm = normalizeText(candidate.content);
  const newTokens = new Set(newNorm.split(' ').filter((t) => t.length >= 2 && !isStopword(t)));

  // Key change / negation / update indicators
  const updateIndicators = [
    'khong con', 'khong thich', 'bo roi', 'doi sang', 'ngung', 'thoi khong', 'khong nua',
    'gio', 'bay gio', 'roi', 'bat dau', 'thuong xuyen', 'chuyen sang', 'thay vi'
  ];
  const hasUpdateIndicator = updateIndicators.some((kw) => newNorm.includes(kw));

  // Subject keywords to check for exact domain conflicts
  const domainSubjects = [
    'ca phe', 'tra', 'ca', 'thit', 'mi', 'mau', 'anime', 'manga', 'hoc', 'nghe',
    'lam', 'sinh nhat', 'que', 'ten', 'biet danh'
  ];

  for (const existing of existingMemories) {
    const existNorm = normalizeText(existing.content);
    const existTokens = existNorm.split(' ').filter((t) => t.length >= 2 && !isStopword(t));

    // Check shared domain subject
    const sharedSubject = domainSubjects.find((subj) => existNorm.includes(subj) && newNorm.includes(subj));

    if (sharedSubject) {
      // Both memories are talking about the exact same subject (e.g. cà phê, cá, màu sắc)
      // Check if categories are compatible (preferences or user info)
      const candCat = normalizeCategory(candidate.category);
      const existCat = normalizeCategory(existing.category);

      if (
        candCat === existCat ||
        candCat === 'PREFERENCE' ||
        existCat === 'PREFERENCE' ||
        candCat === 'USER_PROFILE' ||
        existCat === 'USER_PROFILE'
      ) {
        // If one is negated and one is positive, or new one has an update indicator
        const existHasNegation = /khong|chua|bo|ghet|ngung/.test(existNorm);
        const newHasNegation = /khong|chua|bo|ghet|ngung/.test(newNorm);

        if (existHasNegation !== newHasNegation || hasUpdateIndicator || candCat === 'PREFERENCE') {
          return {
            action: 'update',
            targetMemoryId: existing.id,
            updatedContent: candidate.content,
          };
        }
      }
    }

    // Secondary semantic check: high token overlap (> 60% of existing core tokens present in new candidate)
    if (existTokens.length > 0) {
      let matchCount = 0;
      for (const token of existTokens) {
        if (newTokens.has(token)) matchCount++;
      }
      const overlapRatio = matchCount / existTokens.length;

      if (overlapRatio >= 0.6 && (hasUpdateIndicator || normalizeCategory(candidate.category) === 'PREFERENCE')) {
        return {
          action: 'update',
          targetMemoryId: existing.id,
          updatedContent: candidate.content,
        };
      }
    }
  }

  return { action: 'insert' };
}

/**
 * Retrieves ONLY memories relevant to the current conversation context.
 * Strictly prevents dumping the entire memory database into the prompt.
 *
 * Supports semantic topic matching for:
 * - Food & Drink queries ("thích ăn gì", "món", "cà phê", "cá")
 * - Color queries ("màu gì", "màu trắng")
 * - Anime & Entertainment queries ("anime", "phim", "manga")
 * - Profile & Goals ("tên", "nghề", "học", "kế hoạch")
 * - Explicit retrieval questions ("còn nhớ...", "nhớ anh dặn...")
 */
export function retrieveRelevantMemories(params: {
  userMessage: string;
  batchedMessages?: string[];
  conversationHistory: Array<{ role: 'user' | 'model'; content: string }>;
  allMemories: MemoryItem[];
  limit?: number;
}): MemoryItem[] {
  const { userMessage, batchedMessages, conversationHistory, allMemories, limit = 4 } = params;

  if (!allMemories || allMemories.length === 0) {
    return [];
  }

  // Combine recent context for query extraction
  const recentMessages = conversationHistory.slice(-3).map((m) => m.content);
  const contextCorpus = [
    userMessage,
    ...(batchedMessages || []),
    ...recentMessages,
  ].join(' ');

  const queryNorm = normalizeText(contextCorpus);
  const queryTokens = new Set(
    queryNorm.split(' ').filter((token) => token.length >= 2 && !isStopword(token))
  );

  // Topic classification flags
  const isFoodQuery = /\b(an|uong|mon|thuc an|do an|ca|thit|rau|com|mi|pho|tra|ca phe|kem|banh)\b/.test(queryNorm);
  const isColorQuery = /\b(mau|sac|mau sac|trang|den|xanh|do|vang|tim|hong|cam|xam)\b/.test(queryNorm);
  const isAnimeQuery = /\b(anime|manga|phim|truyen|hoat hinh|tap|season|nhan vat)\b/.test(queryNorm);
  const isGoalQuery = /\b(hoc|thi|muc tieu|ke hoach|du dinh|nghe|nghiep|cong viec|lam viec)\b/.test(queryNorm);
  const isMemoryQuery = /\b(con nho|nho khong|nho gi|co nho|quen|da dan|tung noi)\b/.test(queryNorm);

  const scored: Array<{ memory: MemoryItem; score: number }> = [];

  for (const memory of allMemories) {
    let score = 0;
    const memNorm = normalizeText(memory.content);
    const memTokens = memNorm.split(' ').filter((token) => token.length >= 2 && !isStopword(token));
    const memCategory = normalizeCategory(memory.category);

    // 1. Keyword overlap
    let matchCount = 0;
    for (const token of memTokens) {
      if (queryTokens.has(token)) {
        matchCount++;
      }
    }

    if (matchCount > 0) {
      score += matchCount * 3.5;
    }

    // 2. Substring matches
    if (queryNorm.includes(memNorm) || memNorm.includes(normalizeText(userMessage))) {
      score += 6.0;
    }

    // 3. Thematic topic boosts
    if (isFoodQuery && (memCategory === 'PREFERENCE' || /\b(an|uong|ca|thit|mi|com|ca phe|tra)\b/.test(memNorm))) {
      score += 8.0;
    }
    if (isColorQuery && (memCategory === 'PREFERENCE' || /\b(mau|trang|den|xanh|do|vang)\b/.test(memNorm))) {
      score += 8.0;
    }
    if (isAnimeQuery && (memCategory === 'PREFERENCE' || /\b(anime|manga|phim)\b/.test(memNorm))) {
      score += 8.0;
    }
    if (isGoalQuery && memCategory === 'GOAL') {
      score += 7.0;
    }

    // 4. Memory query boost ("Em còn nhớ anh thích ăn gì không?")
    if (isMemoryQuery) {
      if (isFoodQuery && /\b(ca|thit|mi|com|an|uong|thich an)\b/.test(memNorm)) {
        score += 10.0;
      }
      if (isColorQuery && /\b(mau|trang|den|xanh|do)\b/.test(memNorm)) {
        score += 10.0;
      }
      if (memory.explicitUserRequest) {
        score += 5.0;
      }
    }

    // 5. Explicit request & Category bonuses
    if (memory.explicitUserRequest) {
      score += 2.0;
    }
    if (memCategory === 'USER_PROFILE') {
      score += 1.5;
    }
    if (memCategory === 'PREFERENCE') {
      score += 1.5;
    }

    if (score > 0) {
      scored.push({ memory, score });
    }
  }

  // Sort descending by relevance score
  scored.sort((a, b) => b.score - a.score);

  // Return top matches up to limit
  return scored.slice(0, limit).map((s) => s.memory);
}

/**
 * Filter out common non-substantive Vietnamese functional words and particles.
 * Notice: 2-letter nouns and verbs like 'an', 'ca', 'mi', 'do' are deliberately NOT stopwords.
 */
function isStopword(word: string): boolean {
  const common = [
    'la', 'va', 'cua', 'trong', 'co', 'duoc', 'thi', 'ma', 'cho',
    'nay', 'nao', 'the', 'sao', 'se', 'chut', 'nha', 'nhe', 'oi', 'ha',
    'da', 'voi', 've', 'o', 'nhu', 'den', 'ra', 'lai', 'boi', 'vi'
  ];
  return common.includes(word);
}
