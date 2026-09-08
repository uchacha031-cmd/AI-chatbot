import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, MessageSquare, ArrowUpRight } from 'lucide-react';
import { ChatMessage } from '../types/index.ts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onJumpToMessage: (messageId: string) => void;
  miyuNickname: string;
  userNickname: string;
}

export function InChatSearchModal({
  isOpen,
  onClose,
  messages,
  onJumpToMessage,
  miyuNickname,
  userNickname,
}: Props) {
  const [searchTerm, setSearchTerm] = useState('');

  const searchResults = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return [];

    return messages
      .filter((msg) => msg.content && msg.content.toLowerCase().includes(term))
      .map((msg) => {
        const lower = msg.content.toLowerCase();
        const matchIndex = lower.indexOf(term);
        const start = Math.max(0, matchIndex - 30);
        const end = Math.min(msg.content.length, matchIndex + term.length + 30);
        const snippet = (start > 0 ? '...' : '') + msg.content.substring(start, end) + (end < msg.content.length ? '...' : '');

        return {
          id: msg.id,
          role: msg.role,
          content: msg.content,
          snippet,
          timestamp: msg.timestamp,
        };
      });
  }, [searchTerm, messages]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-2 sm:p-4 pt-16 sm:pt-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-xs"
        />

        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-2xl shadow-black z-10 max-h-[80vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-indigo-400" />
              <h3 className="text-base font-semibold text-zinc-100">Tìm kiếm trong đoạn chat</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-full text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search bar */}
          <div className="relative mt-3">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nhập từ khóa cần tìm..."
              className="w-full bg-zinc-800/90 border border-zinc-700/80 rounded-xl pl-9 pr-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Result Stats */}
          <div className="mt-2 text-xs text-zinc-400 px-1">
            {searchTerm.trim()
              ? `Tìm thấy ${searchResults.length} tin nhắn phù hợp`
              : `Nhập nội dung để tìm trong toàn bộ ${messages.length} tin nhắn`}
          </div>

          {/* Result List */}
          <div className="flex-1 overflow-y-auto mt-2 space-y-2 pr-1">
            {searchTerm.trim() && searchResults.length === 0 && (
              <div className="text-center py-8 text-zinc-500 text-sm">
                Không tìm thấy tin nhắn nào có cụm từ "{searchTerm}"
              </div>
            )}

            {searchResults.map((item) => {
              const time = new Date(item.timestamp).toLocaleString([], {
                hour: '2-digit',
                minute: '2-digit',
                day: '2-digit',
                month: '2-digit',
              });
              const sender = item.role === 'user' ? userNickname : miyuNickname;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onJumpToMessage(item.id);
                    onClose();
                  }}
                  className="w-full text-left p-3 rounded-xl bg-zinc-800/40 hover:bg-zinc-800 border border-zinc-700/50 hover:border-indigo-500/50 transition-all group flex items-start justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold ${item.role === 'user' ? 'text-indigo-400' : 'text-purple-400'}`}>
                        {sender}
                      </span>
                      <span className="text-[10px] text-zinc-500">{time}</span>
                    </div>
                    <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">
                      {item.snippet}
                    </p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-indigo-400 shrink-0 mt-1 transition-colors" />
                </button>
              );
            })}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
