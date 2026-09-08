export interface ReactionDefinition {
  emoji: string;
  name: string;
  category: 'popular' | 'love' | 'face' | 'action' | 'special';
}

export const SUPPORTED_REACTIONS: ReactionDefinition[] = [
  // Popular quick reactions
  { emoji: '❤️', name: 'Thả tim (Like/Love)', category: 'popular' },
  { emoji: '👍', name: 'Đồng ý / Thích', category: 'popular' },
  { emoji: '👎', name: 'Không đồng ý', category: 'popular' },
  { emoji: '😂', name: 'Cười', category: 'popular' },
  { emoji: '🤣', name: 'Cười lăn', category: 'popular' },
  { emoji: '😮', name: 'Bất ngờ', category: 'popular' },
  { emoji: '😢', name: 'Buồn', category: 'popular' },
  { emoji: '😭', name: 'Khóc', category: 'popular' },
  { emoji: '😡', name: 'Giận', category: 'popular' },

  // Love & Affection
  { emoji: '😍', name: 'Yêu mến / Mê', category: 'love' },
  { emoji: '🥰', name: 'Dễ thương', category: 'love' },
  { emoji: '😘', name: 'Hôn nhẹ', category: 'love' },
  { emoji: '🤗', name: 'Ôm', category: 'love' },
  { emoji: '🥹', name: 'Xúc động', category: 'love' },
  { emoji: '💔', name: 'Tổn thương', category: 'love' },

  // Faces & Moods
  { emoji: '😳', name: 'Ngại ngùng', category: 'face' },
  { emoji: '🫣', name: 'Ngượng / Che mặt', category: 'face' },
  { emoji: '🤭', name: 'Cười thầm', category: 'face' },
  { emoji: '😏', name: 'Trêu chọc', category: 'face' },
  { emoji: '🙄', name: 'Ngán ngẩm', category: 'face' },
  { emoji: '😑', name: 'Cạn lời', category: 'face' },
  { emoji: '🤔', name: 'Suy ngẫm', category: 'face' },
  { emoji: '🧐', name: 'Soi xét', category: 'face' },
  { emoji: '🤨', name: 'Nghi ngờ', category: 'face' },
  { emoji: '😱', name: 'Kinh ngạc', category: 'face' },
  { emoji: '😰', name: 'Lo lắng', category: 'face' },
  { emoji: '😴', name: 'Buồn ngủ', category: 'face' },
  { emoji: '🥱', name: 'Ngáp ngủ', category: 'face' },
  { emoji: '🫠', name: 'Tan chảy', category: 'face' },

  // Actions & Emphasize
  { emoji: '🔥', name: 'Đỉnh cao', category: 'action' },
  { emoji: '💯', name: 'Chính xác / 100 điểm', category: 'action' },
  { emoji: '🎉', name: 'Ăn mừng', category: 'action' },
  { emoji: '👏', name: 'Vỗ tay', category: 'action' },
  { emoji: '🙌', name: 'Tuyệt vời', category: 'action' },
  { emoji: '🤝', name: 'Bắt tay thỏa thuận', category: 'action' },
  { emoji: '🫡', name: 'Rõ / Tuân lệnh', category: 'action' },

  // Special / Meme / Expressive
  { emoji: '💀', name: 'Cười chết mất', category: 'special' },
  { emoji: '🤡', name: 'Hề hước', category: 'special' },
  { emoji: '🗿', name: 'Tĩnh như đá', category: 'special' },
  { emoji: '✨', name: 'Lấp lánh / Wow', category: 'special' },
];

export const QUICK_REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '😡'];
