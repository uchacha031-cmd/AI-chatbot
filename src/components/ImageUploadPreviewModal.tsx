import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Image as ImageIcon } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  file: File | null;
  onSendImage: (file: File, caption: string) => void;
  isSending?: boolean;
}

export function ImageUploadPreviewModal({
  isOpen,
  onClose,
  file,
  onSendImage,
  isSending = false,
}: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      setCaption('');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setCaption('');

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  if (!isOpen || !file || !previewUrl) return null;

  const fileSizeFormatted =
    file.size < 1024 * 1024
      ? `${(file.size / 1024).toFixed(1)} KB`
      : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSending) return;
    onSendImage(file, caption.trim());
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={!isSending ? onClose : undefined}
          className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl shadow-black z-10 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/90">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-semibold text-zinc-100">Gửi hình ảnh</h3>
            </div>
            {!isSending && (
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-full text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Image Display */}
          <div className="p-4 flex flex-col items-center justify-center bg-zinc-950/60 overflow-hidden max-h-80">
            <img
              src={previewUrl}
              alt={file.name}
              className="max-w-full max-h-72 object-contain rounded-xl shadow-lg border border-zinc-800/80"
            />
            <div className="flex items-center gap-3 mt-2 text-[11px] text-zinc-400">
              <span className="truncate max-w-[200px]">{file.name}</span>
              <span>·</span>
              <span>{fileSizeFormatted}</span>
            </div>
          </div>

          {/* Caption Input & Actions */}
          <form onSubmit={handleSubmit} className="p-4 bg-zinc-900 flex flex-col gap-3">
            <div>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Thêm lời nhắn cho Miyu (tùy chọn)..."
                disabled={isSending}
                className="w-full bg-zinc-800/90 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-indigo-500 transition-colors"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                disabled={isSending}
                className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                id="confirm-send-image-btn"
                type="submit"
                disabled={isSending}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/30 disabled:opacity-60"
              >
                {isSending ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Đang gửi...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Gửi ảnh</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
