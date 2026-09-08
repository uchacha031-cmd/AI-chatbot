export function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 px-3 py-2 text-zinc-300">
      <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-xs bg-zinc-800/90 border border-zinc-700/60 px-4 py-3 shadow-sm">
        <span className="text-xs text-zinc-400 mr-1 select-none">Miyu đang trả lời</span>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.3s]"></span>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.15s]"></span>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce"></span>
      </div>
    </div>
  );
}
