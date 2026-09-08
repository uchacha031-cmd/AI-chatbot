import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Image as ImageIcon, Video, FileText, Link2, ExternalLink } from 'lucide-react';
import { ExtractedMediaItem } from '../types/index.ts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  items: ExtractedMediaItem[];
  onJumpToMessage: (messageId: string) => void;
}

export function MediaViewerModal({ isOpen, onClose, items, onJumpToMessage }: Props) {
  const [activeTab, setActiveTab] = useState<'all' | 'photo' | 'video' | 'file' | 'link'>('all');

  if (!isOpen) return null;

  const filteredItems = items.filter((item) => {
    if (activeTab === 'all') return true;
    return item.type === activeTab;
  });

  const photoCount = items.filter((i) => i.type === 'photo').length;
  const videoCount = items.filter((i) => i.type === 'video').length;
  const fileCount = items.filter((i) => i.type === 'file').length;
  const linkCount = items.filter((i) => i.type === 'link').length;

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
          className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-2xl shadow-black z-10 max-h-[85vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div>
              <h3 className="text-base font-semibold text-zinc-100">
                File phương tiện, file và liên kết
              </h3>
              <p className="text-xs text-zinc-400">
                Tổng cộng {items.length} mục trong lịch sử trò chuyện
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-full text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Dynamic Tabs with strictly real counts */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 border-b border-zinc-800/80 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-full font-medium transition-colors ${
                activeTab === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Tất cả ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('photo')}
              className={`px-3 py-1.5 rounded-full font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'photo'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              Ảnh ({photoCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('video')}
              className={`px-3 py-1.5 rounded-full font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'video'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              Video ({videoCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('file')}
              className={`px-3 py-1.5 rounded-full font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'file'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Tệp ({fileCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('link')}
              className={`px-3 py-1.5 rounded-full font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'link'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Link2 className="w-3.5 h-3.5" />
              Liên kết ({linkCount})
            </button>
          </div>

          {/* Media Items List */}
          <div className="flex-1 overflow-y-auto py-3 space-y-2">
            {filteredItems.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 text-sm">
                Không có mục nào trong danh mục này.
              </div>
            ) : (
              filteredItems.map((item) => {
                const dateStr = new Date(item.timestamp).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                });

                return (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-zinc-800/40 border border-zinc-700/50 flex items-center justify-between gap-3 hover:bg-zinc-800/70 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-zinc-700/50 flex items-center justify-center shrink-0 text-indigo-400">
                        {item.type === 'photo' && <ImageIcon className="w-4 h-4" />}
                        {item.type === 'video' && <Video className="w-4 h-4" />}
                        {item.type === 'file' && <FileText className="w-4 h-4" />}
                        {item.type === 'link' && <Link2 className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-zinc-200 truncate">{item.title}</p>
                        <p className="text-[10px] text-zinc-500">
                          {dateStr} • Người gửi: {item.sender === 'user' ? 'Bạn' : 'Miyu'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 transition-colors"
                        title="Mở liên kết"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          onJumpToMessage(item.messageId);
                          onClose();
                        }}
                        className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                      >
                        Đến tin
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
