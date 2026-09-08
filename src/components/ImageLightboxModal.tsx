import { motion, AnimatePresence } from 'motion/react';
import { X, Download } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  imageName?: string;
}

export function ImageLightboxModal({ isOpen, onClose, imageUrl, imageName }: Props) {
  if (!isOpen || !imageUrl) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
        {/* Controls */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
          <a
            href={imageUrl}
            download={imageName || 'miyu-image.png'}
            className="p-2.5 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 hover:text-white transition-colors"
            title="Tải ảnh về máy"
          >
            <Download className="w-5 h-5" />
          </a>
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 hover:text-white transition-colors"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Image Content */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative max-w-full max-h-[85vh] flex flex-col items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={imageUrl}
            alt={imageName || 'Chat image'}
            className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
          />
          {imageName && (
            <span className="mt-2 text-xs text-zinc-400 font-mono truncate max-w-md">
              {imageName}
            </span>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
