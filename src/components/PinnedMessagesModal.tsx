import { motion, AnimatePresence } from 'motion/react';
import { X, Pin, ArrowUpRight } from 'lucide-react';
import { ChatMessage } from '../types/index.ts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onJumpToMessage: (messageId: string) => void;
  onTogglePin: (messageId: string) => void;
  miyuNickname: string;
  userNickname: string;
}

export function PinnedMessagesModal({
  isOpen,
  onClose,
  messages,
  onJumpToMessage,
  onTogglePin,
  miyuNickname,
  userNickname,
}: Props) {
  if (!isOpen) return null;

  const pinnedList = messages.filter((m) => m.isPinned);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
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
          className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-2xl shadow-black z-10 max-h-[80vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Pin className="w-4 h-4 text-amber-400 rotate-45" />
              <div>
                <h3 className="text-base font-semibold text-zinc-100">Tin nhắn đã ghim</h3>
                <p className="text-xs text-zinc-400">{pinnedList.length} tin nhắn quan trọng</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-full text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto py-3 space-y-2">
            {pinnedList.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 text-sm">
                Chưa có tin nhắn nào được ghim.
                <br />
                <span className="text-xs text-zinc-600 mt-1 block">
                  Nhấn vào biểu tượng ghim bên cạnh tin nhắn để ghim lại đây.
                </span>
              </div>
            ) : (
              pinnedList.map((msg) => {
                const dateStr = new Date(msg.timestamp).toLocaleString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  day: '2-digit',
                  month: '2-digit',
                });
                const senderName = msg.role === 'user' ? userNickname : miyuNickname;

                return (
                  <div
                    key={msg.id}
                    className="p-3 rounded-xl bg-zinc-800/40 border border-zinc-700/50 hover:border-amber-500/40 transition-all flex items-start justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-semibold ${msg.role === 'user' ? 'text-indigo-400' : 'text-purple-400'}`}>
                          {senderName}
                        </span>
                        <span className="text-[10px] text-zinc-500">{dateStr}</span>
                      </div>
                      <p className="text-xs text-zinc-200 line-clamp-3 leading-relaxed whitespace-pre-wrap">
                        {msg.content}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          onJumpToMessage(msg.id);
                          onClose();
                        }}
                        title="Đến tin nhắn này"
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 transition-colors"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onTogglePin(msg.id)}
                        title="Bỏ ghim"
                        className="p-1.5 rounded-lg text-amber-400 hover:text-zinc-400 hover:bg-zinc-700 transition-colors"
                      >
                        <Pin className="w-4 h-4 rotate-45" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
