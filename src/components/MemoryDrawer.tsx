import { useState } from 'react';
import { X, Trash2, Edit3, Plus, Brain, Check, Sparkles } from 'lucide-react';
import { MemoryCategory, MemoryItem } from '../types/index.ts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  memories: MemoryItem[];
  onAddMemory: (category: MemoryCategory, content: string, importance: number) => Promise<void>;
  onUpdateMemory: (id: string, content: string, importance: number) => Promise<void>;
  onDeleteMemory: (id: string) => Promise<void>;
}

export function MemoryDrawer({
  isOpen,
  onClose,
  memories,
  onAddMemory,
  onUpdateMemory,
  onDeleteMemory,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editImportance, setEditImportance] = useState(3);

  const [isAdding, setIsAdding] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryCategory>('IMPORTANT_MEMORY');
  const [newImportance, setNewImportance] = useState(3);

  if (!isOpen) return null;

  const handleStartEdit = (mem: MemoryItem) => {
    setEditingId(mem.id);
    setEditContent(mem.content);
    setEditImportance(mem.importance);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editContent.trim()) return;
    await onUpdateMemory(editingId, editContent.trim(), editImportance);
    setEditingId(null);
  };

  const handleCreate = async () => {
    if (!newContent.trim()) return;
    await onAddMemory(newCategory, newContent.trim(), newImportance);
    setNewContent('');
    setIsAdding(false);
  };

  const getCategoryLabel = (cat: MemoryCategory) => {
    switch (cat) {
      case 'USER_PROFILE':
      case 'profile':
        return 'Hồ sơ cá nhân';
      case 'PREFERENCE':
      case 'preference':
        return 'Sở thích & Thói quen';
      case 'GOAL':
        return 'Mục tiêu & Định hướng';
      case 'SIGNIFICANT_EVENT':
        return 'Sự kiện đáng nhớ';
      case 'RELATIONSHIP_CONTEXT':
        return 'Trải nghiệm gắn kết';
      case 'recent_context':
        return 'Ngữ cảnh gần đây';
      case 'IMPORTANT_MEMORY':
      case 'important':
      default:
        return 'Ký ức quan trọng';
    }
  };

  const getCategoryColor = (cat: MemoryCategory) => {
    switch (cat) {
      case 'USER_PROFILE':
      case 'profile':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'PREFERENCE':
      case 'preference':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'GOAL':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'SIGNIFICANT_EVENT':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      case 'RELATIONSHIP_CONTEXT':
        return 'bg-pink-500/20 text-pink-300 border-pink-500/30';
      case 'recent_context':
        return 'bg-zinc-700/40 text-zinc-300 border-zinc-600/40';
      case 'IMPORTANT_MEMORY':
      case 'important':
      default:
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Sheet Container */}
      <div className="relative z-10 w-full max-w-lg max-h-[85vh] bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-100">Ký ức của Miyu</h2>
              <p className="text-xs text-zinc-400">Những điều Miyu ghi nhớ lâu dài về anh ({memories.length})</p>
            </div>
          </div>
          <button
            id="close-memory-drawer-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add Memory Form Toggle */}
        <div className="pt-3">
          {isAdding ? (
            <div className="bg-zinc-800/80 border border-zinc-700/70 rounded-2xl p-3 mb-3">
              <p className="text-xs text-zinc-300 font-medium mb-2">Thêm ký ức mới thủ công:</p>
              <input
                type="text"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Ví dụ: Anh thích uống cà phê đen không đường"
                className="w-full bg-zinc-900/90 border border-zinc-700 text-zinc-100 text-sm rounded-xl px-3 py-2 mb-2 outline-none focus:border-purple-500"
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as MemoryCategory)}
                  className="bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs rounded-lg px-2.5 py-1.5 outline-none"
                >
                  <option value="IMPORTANT_MEMORY">Ký ức quan trọng</option>
                  <option value="PREFERENCE">Sở thích & Thói quen</option>
                  <option value="GOAL">Mục tiêu & Kế hoạch</option>
                  <option value="SIGNIFICANT_EVENT">Sự kiện đáng nhớ</option>
                  <option value="RELATIONSHIP_CONTEXT">Trải nghiệm gắn kết</option>
                  <option value="USER_PROFILE">Hồ sơ cá nhân</option>
                </select>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setIsAdding(false)}
                    className="text-xs text-zinc-400 hover:text-zinc-200 px-2.5 py-1.5 rounded-lg"
                  >
                    Huỷ
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={!newContent.trim()}
                    className="text-xs bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-medium px-3 py-1.5 rounded-lg flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Lưu
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              id="add-memory-btn"
              onClick={() => setIsAdding(true)}
              className="w-full flex items-center justify-center gap-1.5 text-xs text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-xl py-2 mb-3 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Chủ động thêm ký ức cho Miyu</span>
            </button>
          )}
        </div>

        {/* Memory List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {memories.length === 0 ? (
            <div className="text-center py-10 px-4">
              <Sparkles className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-sm text-zinc-400">Miyu chưa lưu ký ức nào.</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
                Khi anh chia sẻ sở thích hay thói quen quan trọng, Miyu sẽ tự động học và lưu lại tại đây!
              </p>
            </div>
          ) : (
            memories.map((mem) => (
              <div
                key={mem.id}
                id={`memory-item-${mem.id}`}
                className="bg-zinc-800/60 border border-zinc-700/50 rounded-xl p-3 hover:border-zinc-600/80 transition-all"
              >
                {editingId === mem.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-600 text-zinc-100 text-sm rounded-lg px-2.5 py-1.5 outline-none focus:border-purple-500"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-xs text-zinc-400 hover:text-zinc-200 px-2 py-1"
                      >
                        Huỷ
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        className="text-xs bg-purple-600 text-white px-2.5 py-1 rounded-md font-medium"
                      >
                        Lưu
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-zinc-200 leading-snug flex-1">{mem.content}</p>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleStartEdit(mem)}
                          title="Chỉnh sửa ký ức"
                          className="p-1 text-zinc-400 hover:text-zinc-200 rounded-md hover:bg-zinc-700/60 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteMemory(mem.id)}
                          title="Xoá ký ức này"
                          className="p-1 text-zinc-500 hover:text-rose-400 rounded-md hover:bg-zinc-700/60 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${getCategoryColor(mem.category)}`}>
                        {getCategoryLabel(mem.category)}
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        Độ quan trọng: {mem.importance}/5
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
