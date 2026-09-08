import { EmotionState } from '../../types/index.ts';

/**
 * Calculates updated emotion state based on conversation cues, sentiment, and prior state.
 * Transitions are bounded (max delta +-15 per turn) to avoid erratic spikes.
 */
export function calculateNextEmotion(
  current: EmotionState,
  signals: {
    userTone?: 'positive' | 'negative' | 'neutral' | 'warm' | 'cold' | 'curious' | 'stressed';
    interactionDepth?: 'casual' | 'deep' | 'short_reply';
    sharedInterest?: boolean;
    vulnerabilityShared?: boolean;
  }
): EmotionState {
  const clamp = (val: number, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(val)));

  let dHappiness = 0;
  let dSadness = 0;
  let dCuriosity = 0;
  let dConcern = 0;
  let dExcitement = 0;
  let dCalmness = 0;

  switch (signals.userTone) {
    case 'positive':
    case 'warm':
      dHappiness += 6;
      dSadness -= 4;
      dCalmness += 2;
      break;

    case 'negative':
    case 'stressed':
      dConcern += 8;
      dSadness += 3;
      dHappiness -= 5;
      dCalmness -= 4;
      break;

    case 'cold':
      dHappiness -= 3;
      dCalmness += 1;
      dCuriosity += 2; // curious why user is quiet or short
      break;

    case 'curious':
      dCuriosity += 7;
      dExcitement += 4;
      break;

    default: // neutral
      dCalmness += 2;
      break;
  }

  if (signals.interactionDepth === 'deep') {
    dCuriosity += 3;
  } else if (signals.interactionDepth === 'short_reply') {
    dExcitement -= 2;
    // Miyu stays observant, not pushy
  }

  if (signals.sharedInterest) {
    dExcitement += 7;
    dHappiness += 5;
  }

  if (signals.vulnerabilityShared) {
    dConcern += 6;
    dEmpathyBoost(current);
  }

  // Calculate overall mood (weighted balance of happiness, sadness, calmness)
  const nextHappiness = clamp(current.happiness + dHappiness);
  const nextSadness = clamp(current.sadness + dSadness);
  const nextCuriosity = clamp(current.curiosity + dCuriosity);
  const nextConcern = clamp(current.concern + dConcern);
  const nextExcitement = clamp(current.excitement + dExcitement);
  const nextCalmness = clamp(current.calmness + dCalmness);

  const nextMood = clamp(
    Math.round(nextHappiness * 0.45 + nextCalmness * 0.35 + nextExcitement * 0.2 - nextSadness * 0.3 - nextConcern * 0.15)
  );

  const nextFrustration = clamp((current.frustration ?? 0) + (signals.userTone === 'cold' ? 1 : 0));
  const nextAttachment = clamp(current.attachment ?? 0);
  const nextSalience = clamp((current.emotionalSalience ?? 20) + (signals.vulnerabilityShared ? 10 : 0));

  return {
    mood: nextMood,
    happiness: nextHappiness,
    sadness: nextSadness,
    curiosity: nextCuriosity,
    concern: nextConcern,
    excitement: nextExcitement,
    calmness: nextCalmness,
    frustration: nextFrustration,
    attachment: nextAttachment,
    emotionalSalience: nextSalience,
    lastUpdated: new Date().toISOString(),
  };
}

function dEmpathyBoost(_state: EmotionState) {
  // Hook for subtle empathy tuning
}
