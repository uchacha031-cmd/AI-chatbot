import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search } from 'lucide-react';
import { SUPPORTED_REACTIONS, ReactionDefinition } from '../features/reactions/reactionConstants.ts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectReaction: (emoji: string) => void;
  currentMessageId?: string;
}

export function ReactionPickerModal({ isOpen, onClose, onSelectReaction }: Props) {
  const [activeTab, setActiveTab] = useState<'all' | 'popular' | 'love' | 'face' | 'action' | 'special'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredReactions = SUPPORTED_REACTIONS.filter((r) => {
    const matchesTab = activeTab === 'all' || r.category === activeTab;
    const matchesSearch =
      !searchTerm ||
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.emoji.includes(searchTerm);
    return matchesTab && matchesSearch;
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-xs"
        />

        {/* Content Sheet */}
        <motion.div
          initial={{ y: '100%', opacity: 0.5 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full sm:max-w-md bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-2xl p-4 shadow-2xl shadow-black max-h-[85vh] flex flex-col z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div>
              <h3 className="text-base font-semibold text-zinc-100">Bày tỏ cảm xúc</h3>
              <p className="text-xs text-zinc-400">40 biểu tượng cảm xúc hỗ trợ</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search box */}
          <div className="relative mt-3 mb-2">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm biểu tượng..."
              className="w-full bg-zinc-800/90 border border-zinc-700/80 rounded-xl pl-9 pr-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1.5 scrollbar-none text-xs">
            {[
              { id: 'all', label: 'Tất cả (40)' },
              { id: 'popular', label: 'Phổ biến' },
              { id: 'love', label: 'Tình cảm' },
              { id: 'face', label: 'Biểu cảm' },
              { id: 'action', label: 'Hành động' },
              { id: 'special', label: 'Đặc biệt' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-full whitespace-nowrap font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Grid of 40 Emojis */}
          <div className="flex-1 overflow-y-auto py-3 grid grid-cols-6 sm:grid-cols-8 gap-2">
            {filteredReactions.map((r: ReactionDefinition) => (
              <motion.button
                key={r.emoji}
                whileHover={{ scale: 1.22 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                type="button"
                title={r.name}
                onClick={() => {
                  onSelectReaction(r.emoji);
                  onClose();
                }}
                className="h-11 w-11 flex items-center justify-center rounded-xl bg-zinc-800/40 hover:bg-zinc-700/60 text-2xl transition-colors cursor-pointer select-none"
              >
                {r.emoji}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
