import { useEffect, useRef, useState } from 'react';
import {
  Send,
  CornerDownLeft,
  Plus,
  Image as ImageIcon,
  Smile,
  Film,
  Video,
  Paperclip,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  value: string;
  onChange: (val: string) => void;
  onSend: () => void;
  disabled?: boolean;
  onTypingStart?: () => void;
  onTypingPause?: () => void;
  onTypingStop?: () => void;
  onSelectImageFile?: (file: File) => void;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  disabled = false,
  onTypingStart,
  onTypingPause,
  onTypingStop,
  onSelectImageFile,
}: Props) {
  const [showMediaMenu, setShowMediaMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pauseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingActiveRef = useRef<boolean>(false);

  // Auto-resize textarea height smoothly
  useEffect(() => {
    if (textareaRef.current) {
      if (!value) {
        textareaRef.current.style.height = '40px';
        return;
      }
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 130;
      textareaRef.current.style.height = `${Math.min(Math.max(scrollHeight, 40), maxHeight)}px`;
    }
  }, [value]);

  // Cleanup typing timers on unmount
  useEffect(() => {
    return () => {
      if (pauseTimerRef.current) {
        clearTimeout(pauseTimerRef.current);
      }
    };
  }, []);

  const handleInputChange = (newVal: string) => {
    onChange(newVal);

    if (newVal.trim().length > 0) {
      if (!isTypingActiveRef.current) {
        isTypingActiveRef.current = true;
        onTypingStart?.();
      }

      // Reset pause detection timer (1200ms idle -> pause)
      if (pauseTimerRef.current) {
        clearTimeout(pauseTimerRef.current);
      }
      pauseTimerRef.current = setTimeout(() => {
        isTypingActiveRef.current = false;
        onTypingPause?.();
      }, 1200);
    } else {
      if (pauseTimerRef.current) {
        clearTimeout(pauseTimerRef.current);
      }
      if (isTypingActiveRef.current) {
        isTypingActiveRef.current = false;
        onTypingStop?.();
      }
    }
  };

  const handleSendTrigger = () => {
    if (disabled || value.trim().length === 0) return;

    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = null;
    }
    isTypingActiveRef.current = false;
    onTypingStop?.();
    onSend();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Prevent triggering send during IME composition (Vietnamese keyboards on mobile / desktop)
    if (e.nativeEvent.isComposing) {
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendTrigger();
    }
  };

  const handleBlur = () => {
    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = null;
    }
    isTypingActiveRef.current = false;
    onTypingStop?.();
  };

  const handleImageFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSelectImageFile?.(file);
    }
    // reset input value so selecting the same file again triggers change
    e.target.value = '';
    setShowMediaMenu(false);
  };

  const isSendDisabled = disabled || value.trim().length === 0;

  return (
    <div className="w-full bg-zinc-900/95 backdrop-blur-md border-t border-zinc-800/80 px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageFilePicked}
        accept="image/*"
        className="hidden"
      />

      <div className="max-w-3xl mx-auto relative flex items-end gap-1.5 sm:gap-2 bg-zinc-800/90 rounded-2xl border border-zinc-700/60 p-1.5 focus-within:border-indigo-500/80 focus-within:ring-1 focus-within:ring-indigo-500/30 transition-all shadow-inner">
        {/* Plus Action Button (Part 5D Section 10) */}
        <div className="relative">
          <button
            id="composer-plus-btn"
            type="button"
            title="Đính kèm phương tiện"
            onClick={() => setShowMediaMenu(!showMediaMenu)}
            disabled={disabled}
            className={`min-w-[40px] min-h-[40px] w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 ${
              showMediaMenu
                ? 'bg-indigo-600 text-white rotate-45'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/60 active:scale-95'
            }`}
          >
            <Plus className="w-5 h-5 transition-transform" />
          </button>

          {/* Media Menu Popup */}
          <AnimatePresence>
            {showMediaMenu && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setShowMediaMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-12 left-0 z-30 w-52 bg-zinc-900 border border-zinc-700/80 rounded-2xl p-1.5 shadow-2xl shadow-black/80 flex flex-col gap-0.5"
                >
                  <button
                    id="attach-image-btn"
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-zinc-800 text-zinc-200 hover:text-white transition-colors text-xs font-medium group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <span>Hình ảnh</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowMediaMenu(false);
                      fileInputRef.current?.click();
                    }}
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-zinc-800 text-zinc-400 hover:text-zinc-300 transition-colors text-xs font-medium"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-pink-500/10 text-pink-400 flex items-center justify-center">
                        <Smile className="w-4 h-4" />
                      </div>
                      <span>Nhãn dán</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded-sm">Sắp có</span>
                  </button>

                  <button
                    type="button"
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-zinc-800 text-zinc-400 hover:text-zinc-300 transition-colors text-xs font-medium opacity-80"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                        <Film className="w-4 h-4" />
                      </div>
                      <span>Ảnh GIF</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded-sm">Sắp có</span>
                  </button>

                  <button
                    type="button"
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-zinc-800 text-zinc-400 hover:text-zinc-300 transition-colors text-xs font-medium opacity-80"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                        <Video className="w-4 h-4" />
                      </div>
                      <span>Video</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded-sm">Sắp có</span>
                  </button>

                  <button
                    type="button"
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-zinc-800 text-zinc-400 hover:text-zinc-300 transition-colors text-xs font-medium opacity-80"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                        <Paperclip className="w-4 h-4" />
                      </div>
                      <span>Tệp tin</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded-sm">Sắp có</span>
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          id="chat-input-field"
          rows={1}
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder="Nhắn gì đó với Miyu... (Enter để gửi)"
          disabled={disabled}
          className="flex-1 bg-transparent border-0 text-zinc-100 placeholder-zinc-500 text-[15px] resize-none outline-none py-2 max-h-32 min-h-[40px] leading-relaxed"
          style={{ height: '40px' }}
        />

        {/* Send Button */}
        <button
          id="send-message-btn"
          type="button"
          onClick={(e) => {
            e.preventDefault();
            handleSendTrigger();
          }}
          disabled={isSendDisabled}
          aria-label="Gửi tin nhắn"
          className={`min-w-[40px] min-h-[40px] w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 ${
            isSendDisabled
              ? 'text-zinc-600 bg-zinc-800/50 cursor-not-allowed'
              : 'text-white bg-indigo-600 hover:bg-indigo-500 active:scale-95 shadow-md shadow-indigo-600/30'
          }`}
        >
          <Send className="w-4 h-4 ml-0.5" />
        </button>
      </div>

      <div className="hidden sm:flex items-center justify-between text-[11px] text-zinc-500 mt-1 px-3 max-w-3xl mx-auto select-none">
        <span>Nhấn Enter để gửi, Shift + Enter để xuống dòng</span>
        <span className="flex items-center gap-1">
          <CornerDownLeft className="w-3 h-3" />
          Miyu V2
        </span>
      </div>
    </div>
  );
}
