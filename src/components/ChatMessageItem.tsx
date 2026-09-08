import { useState, useMemo } from 'react';
import Markdown from 'react-markdown';
import { motion } from 'motion/react';
import {
  RotateCw,
  AlertCircle,
  Clock,
  Pin,
  Copy,
  Check,
  SmilePlus,
  Sparkles,
} from 'lucide-react';
import { ChatMessage, ReactionItem } from '../types/index.ts';
import { QUICK_REACTIONS } from '../features/reactions/reactionConstants.ts';
import { MIYU_AVATAR_PRESETS } from '../features/chat/chatSettingsDefaults.ts';

interface Props {
  message: ChatMessage;
  userId: string;
  currentMiyuAvatar?: string;
  isHighlighted?: boolean;
  isLast?: boolean;
  onRetry?: (messageId: string) => void;
  onToggleReaction: (messageId: string, emoji: string) => void;
  onOpenFullReactionPicker: (messageId: string) => void;
  onTogglePin: (messageId: string) => void;
  onViewImage?: (imageUrl: string, name?: string) => void;
}

export function ChatMessageItem({
  message,
  userId,
  currentMiyuAvatar,
  isHighlighted,
  onRetry,
  onToggleReaction,
  onOpenFullReactionPicker,
  onTogglePin,
  onViewImage,
}: Props) {
  const [showQuickReactions, setShowQuickReactions] = useState(false);
  const [copied, setCopied] = useState(false);

  const isSystem = message.role === 'system' || message.type === 'system';
  const isUser = message.role === 'user';
  const isImage = message.type === 'image' && !!message.mediaUrl;
  const isFailed = message.status === 'failed';
  const isQueued = message.status === 'queued';
  const isProcessing = message.status === 'processing';

  const avatarPreset =
    MIYU_AVATAR_PRESETS.find((a) => a.id === currentMiyuAvatar) || MIYU_AVATAR_PRESETS[0];

  const timeFormatted = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Group reactions by emoji
  const groupedReactions = useMemo(() => {
    const map = new Map<string, { count: number; userReacted: boolean }>();
    const list: ReactionItem[] = message.reactions || [];

    for (const r of list) {
      const existing = map.get(r.emoji) || { count: 0, userReacted: false };
      existing.count += 1;
      if (r.userId === userId) {
        existing.userReacted = true;
      }
      map.set(r.emoji, existing);
    }

    return Array.from(map.entries()).map(([emoji, data]) => ({
      emoji,
      count: data.count,
      userReacted: data.userReacted,
    }));
  }, [message.reactions, userId]);

  // System Event Message (Part 5D Section 3: Centered, small text, subtle pill, timestamp)
  if (isSystem) {
    return (
      <div
        id={`msg-${message.id}`}
        className="w-full flex flex-col items-center justify-center my-3 px-4 select-none"
      >
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-800/60 border border-zinc-700/40 text-[11px] text-zinc-400 max-w-[90%] text-center">
          <Sparkles className="w-3 h-3 text-indigo-400 shrink-0" />
          <span className="leading-tight">{message.content}</span>
          <span className="text-[9px] text-zinc-500 shrink-0 ml-1">· {timeFormatted}</span>
        </div>
      </div>
    );
  }

  // Copy pure text without reactions metadata
  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      id={`msg-${message.id}`}
      onMouseEnter={() => setShowQuickReactions(true)}
      onMouseLeave={() => setShowQuickReactions(false)}
      className={`group relative flex flex-col mb-3.5 px-2 sm:px-3 transition-colors duration-500 rounded-xl ${
        isHighlighted ? 'bg-indigo-950/40 ring-2 ring-indigo-500/80 p-2' : ''
      } ${isUser ? 'items-end' : 'items-start'}`}
    >
      <div className={`flex items-end gap-2 max-w-full ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Model Avatar icon */}
        {!isUser && (
          <div
            className={`w-7 h-7 rounded-full bg-gradient-to-tr ${avatarPreset.bgGradient} flex items-center justify-center text-white text-xs font-bold shrink-0 mb-1 shadow-xs ring-1 ring-zinc-800`}
          >
            {avatarPreset.value}
          </div>
        )}

        <div className={`relative flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          {/* Floating Action / Reaction Bar */}
          <div
            className={`absolute -top-9 z-20 transition-all duration-200 ${
              showQuickReactions ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
            } ${isUser ? 'right-0' : 'left-0'}`}
          >
            <div className="flex items-center gap-1 bg-zinc-800/95 border border-zinc-700/80 rounded-full px-2 py-1 shadow-lg shadow-black/40 backdrop-blur-md">
              {/* Top 6 quick reactions */}
              {QUICK_REACTIONS.map((emoji) => {
                const userAlreadyReacted = groupedReactions.some(
                  (g) => g.emoji === emoji && g.userReacted
                );
                return (
                  <button
                    key={emoji}
                    type="button"
                    title={`Thả ${emoji}`}
                    onClick={() => onToggleReaction(message.id, emoji)}
                    className={`h-7 w-7 rounded-full hover:scale-125 transition-transform flex items-center justify-center text-sm cursor-pointer ${
                      userAlreadyReacted ? 'bg-indigo-500/30' : ''
                    }`}
                  >
                    {emoji}
                  </button>
                );
              })}

              {/* + button for 40 full reactions */}
              <button
                type="button"
                title="Xem tất cả 40 biểu cảm"
                onClick={() => onOpenFullReactionPicker(message.id)}
                className="h-7 w-7 rounded-full hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition-colors"
              >
                <SmilePlus className="w-4 h-4" />
              </button>

              <div className="w-px h-3.5 bg-zinc-700 mx-0.5" />

              {/* Pin toggle action */}
              <button
                type="button"
                title={message.isPinned ? 'Bỏ ghim tin này' : 'Ghim tin này'}
                onClick={() => onTogglePin(message.id)}
                className={`p-1.5 rounded-full transition-colors ${
                  message.isPinned
                    ? 'text-amber-400 hover:text-amber-300'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Pin className="w-3.5 h-3.5 rotate-45" />
              </button>

              {/* Copy pure text */}
              <button
                type="button"
                title="Sao chép nội dung tin"
                onClick={handleCopy}
                className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Pinned Badge */}
          {message.isPinned && (
            <div className="flex items-center gap-1 text-[10px] text-amber-400/90 font-medium mb-1 px-1">
              <Pin className="w-3 h-3 rotate-45 fill-amber-400/30" />
              <span>Đã ghim</span>
            </div>
          )}

          {/* Message Bubble or Image Content */}
          {isImage ? (
            <div
              className={`rounded-2xl p-1.5 shadow-md overflow-hidden max-w-[85vw] sm:max-w-xs md:max-w-sm ${
                isUser ? 'bg-indigo-600 rounded-tr-xs' : 'bg-zinc-800 rounded-tl-xs border border-zinc-700/50'
              }`}
            >
              <div
                onClick={() => onViewImage?.(message.mediaUrl!, message.mediaMetadata?.name)}
                className="group/img relative rounded-xl overflow-hidden cursor-pointer bg-zinc-950 aspect-auto"
              >
                <img
                  src={message.mediaUrl}
                  alt={message.mediaMetadata?.name || 'Image'}
                  className="w-full h-auto max-h-72 object-cover transition-transform duration-300 group-hover/img:scale-102"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-colors flex items-center justify-center">
                  <span className="opacity-0 group-hover/img:opacity-100 bg-black/60 text-white text-[11px] px-2.5 py-1 rounded-full backdrop-blur-xs transition-opacity">
                    Xem ảnh
                  </span>
                </div>
              </div>
              {message.content && message.content !== '[Hình ảnh]' && (
                <p className="mt-1.5 px-2.5 py-1 text-xs text-white/95 leading-relaxed break-words">
                  {message.content}
                </p>
              )}
            </div>
          ) : (
            <div
              onClick={() => setShowQuickReactions(!showQuickReactions)}
              className={`max-w-[85vw] sm:max-w-[70vw] md:max-w-xl rounded-2xl px-4 py-3 text-[15px] leading-relaxed break-words shadow-sm transition-all select-text cursor-default ${
                isUser
                  ? isFailed
                    ? 'bg-rose-950/80 text-rose-100 border border-rose-700/60 rounded-tr-xs'
                    : isQueued
                    ? 'bg-indigo-600/75 text-white/90 rounded-tr-xs border border-indigo-400/30'
                    : isProcessing
                    ? 'bg-indigo-600 text-white rounded-tr-xs shadow-indigo-950/20'
                    : 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-tr-xs shadow-indigo-950/20'
                  : 'bg-zinc-800/90 text-zinc-100 border border-zinc-700/50 rounded-tl-xs shadow-black/20'
              }`}
            >
              {isUser ? (
                <p className="whitespace-pre-wrap">{message.content}</p>
              ) : (
                <div className="prose prose-invert prose-sm max-w-none text-zinc-100 leading-relaxed [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:list-disc [&>ul]:pl-4 [&>ol]:list-decimal [&>ol]:pl-4">
                  <Markdown>{message.content}</Markdown>
                </div>
              )}
            </div>
          )}

          {/* Grouped Reactions Display (Smooth Animated Pop-in) */}
          {groupedReactions.length > 0 && (
            <div
              className={`flex flex-wrap items-center gap-1 mt-1 z-10 ${
                isUser ? 'justify-end' : 'justify-start'
              }`}
            >
              {groupedReactions.map((g) => (
                <motion.button
                  key={g.emoji}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.6, opacity: 0 }}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: 'spring', damping: 15, stiffness: 350 }}
                  type="button"
                  title={g.userReacted ? 'Nhấn để hủy cảm xúc' : 'Nhấn để thả cảm xúc này'}
                  onClick={() => onToggleReaction(message.id, g.emoji)}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs cursor-pointer select-none transition-all shadow-xs ${
                    g.userReacted
                      ? 'bg-indigo-600/30 border border-indigo-500/80 text-indigo-200'
                      : 'bg-zinc-800/80 border border-zinc-700/80 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  <span className="text-sm leading-none">{g.emoji}</span>
                  {g.count > 1 && <span className="text-[11px] font-semibold">{g.count}</span>}
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Meta time / status */}
      <div
        className={`flex items-center gap-1.5 mt-1 px-1 text-[11px] text-zinc-400 select-none ${
          isUser ? 'justify-end' : 'justify-start pl-9'
        }`}
      >
        {isUser && isQueued && (
          <span className="flex items-center gap-1 text-zinc-400 text-[10px]">
            <Clock className="w-3 h-3 text-indigo-400 animate-pulse" />
            <span>Chờ gửi</span>
          </span>
        )}

        {isUser && isProcessing && (
          <span className="flex items-center gap-1 text-indigo-300 text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
            <span>Đang gửi</span>
          </span>
        )}

        {isUser && isFailed && (
          <div className="flex items-center gap-1.5 text-rose-400">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span>Chưa gửi được</span>
            {onRetry && (
              <button
                id={`retry-btn-${message.id}`}
                type="button"
                onClick={() => onRetry(message.id)}
                className="ml-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-900/50 hover:bg-rose-800 text-rose-200 text-[10px] font-medium transition-colors"
                title="Thử gửi lại tin này"
              >
                <RotateCw className="w-2.5 h-2.5" />
                Thử lại
              </button>
            )}
          </div>
        )}

        {!isFailed && <span>{timeFormatted}</span>}
      </div>
    </div>
  );
}
