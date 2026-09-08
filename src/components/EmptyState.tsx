import { Sparkles, MessageCircleHeart } from 'lucide-react';
import { CONVERSATION_STARTERS, DEFAULT_GREETING } from '../features/constants.ts';

interface Props {
  onSelectStarter: (text: string) => void;
}

export function EmptyState({ onSelectStarter }: Props) {
  return (
    <div id="empty-state-view" className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="relative mb-5">
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500/20 to-purple-500/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shadow-lg shadow-indigo-950/40">
          <MessageCircleHeart className="w-8 h-8 text-indigo-300" />
        </div>
        <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-zinc-900 shadow-sm" />
      </div>

      <div className="max-w-sm rounded-2xl bg-zinc-800/80 border border-zinc-700/60 p-4 mb-6 shadow-sm text-left">
        <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-medium mb-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Miyu • 16 tuổi</span>
        </div>
        <p className="text-zinc-200 text-sm leading-relaxed">{DEFAULT_GREETING}</p>
      </div>

      <div className="w-full max-w-sm">
        <p className="text-xs text-zinc-400 font-medium mb-2.5 text-left px-1">Gợi ý bắt đầu:</p>
        <div className="flex flex-col gap-2">
          {CONVERSATION_STARTERS.map((starter, index) => (
            <button
              key={index}
              id={`starter-btn-${index}`}
              onClick={() => onSelectStarter(starter)}
              className="w-full text-left text-xs sm:text-sm bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/60 hover:border-indigo-500/50 text-zinc-300 hover:text-zinc-100 rounded-xl px-3.5 py-2.5 transition-all active:scale-[0.99] text-left leading-normal"
            >
              {starter}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
