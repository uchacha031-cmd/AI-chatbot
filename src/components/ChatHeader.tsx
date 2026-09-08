import { Brain, RotateCcw, Info, Search } from 'lucide-react';
import { MIYU_AVATAR_PRESETS } from '../features/chat/chatSettingsDefaults.ts';

interface Props {
  memoryCount: number;
  miyuNickname: string;
  miyuAvatar?: string;
  onOpenMemories: () => void;
  onOpenChatInfo: () => void;
  onOpenSearch: () => void;
  onResetChat: () => void;
}

export function ChatHeader({
  memoryCount,
  miyuNickname,
  miyuAvatar,
  onOpenMemories,
  onOpenChatInfo,
  onOpenSearch,
  onResetChat,
}: Props) {
  const avatarPreset =
    MIYU_AVATAR_PRESETS.find((a) => a.id === miyuAvatar) || MIYU_AVATAR_PRESETS[0];

  return (
    <header className="sticky top-0 z-30 w-full bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800/80 px-3 sm:px-4 py-2.5 flex items-center justify-between">
      {/* Character Profile Brief */}
      <div
        className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity"
        onClick={onOpenChatInfo}
        title="Xem thông tin đoạn chat"
      >
        <div className="relative">
          <div
            className={`w-10 h-10 rounded-full bg-gradient-to-tr ${avatarPreset.bgGradient} flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-900/30`}
          >
            {avatarPreset.value}
          </div>
          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-zinc-900" />
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <h1 className="text-base font-semibold text-zinc-100 leading-tight">
              {miyuNickname || 'Miyu'}
            </h1>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-medium">
              16t
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400 font-medium">Online</span>
          </div>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Search trigger */}
        <button
          id="header-search-btn"
          type="button"
          onClick={onOpenSearch}
          title="Tìm kiếm tin nhắn"
          className="min-w-[40px] min-h-[40px] p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 flex items-center justify-center transition-colors"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Memories trigger */}
        <button
          id="open-memories-btn"
          type="button"
          onClick={onOpenMemories}
          title="Xem ký ức đã lưu"
          className="relative min-w-[40px] min-h-[40px] px-2.5 rounded-xl text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/80 flex items-center gap-1.5 text-xs transition-colors"
        >
          <Brain className="w-4 h-4 text-purple-400" />
          <span className="hidden md:inline">Ký ức</span>
          {memoryCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-purple-500/30 text-purple-300 text-[10px] font-semibold border border-purple-500/40">
              {memoryCount}
            </span>
          )}
        </button>

        {/* Reset conversation trigger */}
        <button
          id="reset-chat-btn"
          type="button"
          onClick={onResetChat}
          title="Bắt đầu hội thoại mới"
          className="min-w-[40px] min-h-[40px] p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 flex items-center justify-center transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Clear "!" Chat Info Button as strictly requested */}
        <button
          id="chat-info-btn"
          type="button"
          onClick={onOpenChatInfo}
          title="Thông tin đoạn chat & Cài đặt"
          className="min-w-[40px] min-h-[40px] p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-200 hover:text-white flex items-center justify-center transition-all border border-zinc-700/60 shadow-xs"
        >
          <Info className="w-4 h-4 text-indigo-400" />
        </button>
      </div>
    </header>
  );
}
