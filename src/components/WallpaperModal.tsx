import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Image as ImageIcon } from 'lucide-react';
import { WALLPAPER_PRESETS, WallpaperOption } from '../features/chat/chatSettingsDefaults.ts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentWallpaper: string;
  onSelectWallpaper: (wallpaperId: string, type: 'solid' | 'gradient' | 'preset' | 'custom') => void;
}

export function WallpaperModal({
  isOpen,
  onClose,
  currentWallpaper,
  onSelectWallpaper,
}: Props) {
  const [customUrl, setCustomUrl] = useState('');

  if (!isOpen) return null;

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
          className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-2xl shadow-black z-10 max-h-[85vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div>
              <h3 className="text-base font-semibold text-zinc-100">Đổi hình nền trò chuyện</h3>
              <p className="text-xs text-zinc-400">Chọn tông màu hoặc nền bạn thích</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-full text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Wallpapers Grid */}
          <div className="flex-1 overflow-y-auto py-3 space-y-4">
            <div>
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Chủ đề & Màu sắc
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {WALLPAPER_PRESETS.map((wp: WallpaperOption) => {
                  const isSelected = currentWallpaper === wp.id;
                  return (
                    <button
                      key={wp.id}
                      type="button"
                      onClick={() => {
                        onSelectWallpaper(wp.id, wp.type);
                        onClose();
                      }}
                      className={`relative flex flex-col items-center p-2.5 rounded-xl border transition-all text-left group ${
                        isSelected
                          ? 'border-indigo-500 bg-zinc-800/80 ring-2 ring-indigo-500/30'
                          : 'border-zinc-800 bg-zinc-800/30 hover:bg-zinc-800/60 hover:border-zinc-700'
                      }`}
                    >
                      {/* Color swatch */}
                      <div
                        className="w-full h-16 rounded-lg mb-2 shadow-inner flex items-center justify-center border border-zinc-700/50"
                        style={{ background: wp.previewColor }}
                      >
                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-medium text-zinc-200 text-center w-full truncate">
                        {wp.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom image URL */}
            <div className="pt-2 border-t border-zinc-800">
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Nền từ liên kết ảnh (URL)
              </h4>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://example.com/wallpaper.jpg"
                  className="flex-1 bg-zinc-800/90 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-indigo-500"
                />
                <button
                  type="button"
                  disabled={!customUrl.trim()}
                  onClick={() => {
                    if (customUrl.trim()) {
                      onSelectWallpaper(customUrl.trim(), 'custom');
                      onClose();
                    }
                  }}
                  className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium flex items-center gap-1 transition-colors"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  Áp dụng
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
