import { EmotionState, PersonalityParameters, RelationshipState } from '../types/index.ts';

export const INITIAL_PERSONALITY: PersonalityParameters = {
  romanticAffection: 0,
  teasing: 45,
  initiative: 50,
  curiosity: 65,
  empathy: 75,
};

export const INITIAL_EMOTION: EmotionState = {
  mood: 60,
  happiness: 60,
  sadness: 10,
  curiosity: 65,
  concern: 10,
  excitement: 45,
  calmness: 75,
  frustration: 0,
  attachment: 0,
  emotionalSalience: 20,
  lastUpdated: new Date().toISOString(),
};

export const INITIAL_RELATIONSHIP: RelationshipState = {
  familiarity: 0,
  comfort: 0,
  trust: 0,
  attachment: 0,
  sharedHistory: 0,
  attention: 10,
  care: 5,
  emotionalSalience: 0,
  interactionCount: 0,
  lastInteractionTimestamp: new Date().toISOString(),
  lastUpdated: new Date().toISOString(),
};

export const DEFAULT_GREETING = "Chào anh. Em là Miyu.";

export const CONVERSATION_STARTERS = [
  "Hôm nay công việc thế nào rồi anh?",
  "Anh vừa xem xong một bộ phim khá hay.",
  "Hôm nay anh hơi mệt.",
  "Dạo này có gì mới không anh?"
];
