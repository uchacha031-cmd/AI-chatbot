import { useState } from 'react';
import { RotateCcw, Trash2, MessageSquarePlus, AlertTriangle, X, ShieldAlert } from 'lucide-react';
import { ResetType } from '../types/index.ts';

interface ResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmReset: (type: ResetType) => Promise<void>;
  memoryCount: number;
}

export function ResetModal({
  isOpen,
  onClose,
  onConfirmReset,
  memoryCount,
}: ResetModalProps) {
  const [selectedType, setSelectedType] = useState<ResetType>('NEW_CONVERSATION');
  const [isConfirmingDestructive, setIsConfirmingDestructive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleExecuteReset = async () => {
    if (selectedType === 'CLEAR_MEMORY_AND_START_FRESH' && !isConfirmingDestructive) {
      setIsConfirmingDestructive(true);
      return;
    }

    try {
      setIsProcessing(true);
      await onConfirmReset(selectedType);
      onClose();
      setIsConfirmingDestructive(false);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={() => !isProcessing && onClose()}
      />

      {/* Dialog Body */}
      <div className="relative z-10 w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-100">Tuỳ chọn làm mới cuộc trò chuyện</h2>
              <p className="text-xs text-zinc-400">Chọn cấp độ làm mới bạn mong muốn</p>
            </div>
          </div>
          <button
            id="close-reset-modal-btn"
            type="button"
            onClick={() => !isProcessing && onClose()}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isConfirmingDestructive ? (
          /* Step 2: Destructive warning confirmation */
          <div className="py-5 space-y-4">
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex gap-3 items-start">
              <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-rose-300">Xác nhận xoá toàn bộ ký ức?</h3>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Hành động này sẽ xoá vĩnh viễn <strong className="text-rose-300">{memoryCount} ký ức</strong> mà Miyu đã ghi nhớ về anh, đồng thời đưa mức độ thân thiết về 0. Miyu sẽ quay trở lại trạng thái <strong>"Hai người xa lạ"</strong> ban đầu.
                </p>
                <p className="text-[11px] text-zinc-400 pt-1">
                  Thao tác này không thể hoàn tác sau khi thực hiện.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setIsConfirmingDestructive(false)}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
              >
                Quay lại
              </button>
              <button
                type="button"
                id="confirm-destructive-reset-btn"
                disabled={isProcessing}
                onClick={handleExecuteReset}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors shadow-lg shadow-rose-950/40 flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isProcessing ? 'Đang xoá...' : 'Xác nhận xoá hết'}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Step 1: Select between NEW_CONVERSATION and CLEAR_MEMORY_AND_START_FRESH */
          <div className="py-5 space-y-3">
            {/* Option 1: NEW_CONVERSATION */}
            <div
              onClick={() => setSelectedType('NEW_CONVERSATION')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                selectedType === 'NEW_CONVERSATION'
                  ? 'bg-indigo-950/30 border-indigo-500/50 shadow-md shadow-indigo-950/20 ring-1 ring-indigo-500/30'
                  : 'bg-zinc-800/40 border-zinc-700/50 hover:bg-zinc-800/70 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-xl shrink-0 ${
                  selectedType === 'NEW_CONVERSATION'
                    ? 'bg-indigo-500 text-white'
                    : 'bg-zinc-800 text-zinc-400'
                }`}>
                  <MessageSquarePlus className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-zinc-100">Bắt đầu cuộc trò chuyện mới</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium border border-emerald-500/30">
                      Khuyên dùng
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Mở một luồng chat mới hoàn toàn độc lập. Cảm xúc và nhịp điệu hội thoại sẽ bắt đầu mới mẻ, không bị quán tính cũ chi phối. 
                  </p>
                  <p className="text-[11px] text-indigo-300 pt-0.5 font-medium">
                    ✓ Bảo lưu toàn bộ {memoryCount} ký ức dài hạn về anh.
                  </p>
                </div>
              </div>
            </div>

            {/* Option 2: CLEAR_MEMORY_AND_START_FRESH */}
            <div
              onClick={() => setSelectedType('CLEAR_MEMORY_AND_START_FRESH')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                selectedType === 'CLEAR_MEMORY_AND_START_FRESH'
                  ? 'bg-rose-950/30 border-rose-500/50 shadow-md shadow-rose-950/20 ring-1 ring-rose-500/30'
                  : 'bg-zinc-800/40 border-zinc-700/50 hover:bg-zinc-800/70 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-xl shrink-0 ${
                  selectedType === 'CLEAR_MEMORY_AND_START_FRESH'
                    ? 'bg-rose-600 text-white'
                    : 'bg-zinc-800 text-zinc-400'
                }`}>
                  <Trash2 className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-zinc-100">Xoá toàn bộ ký ức & Làm lại từ đầu</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-medium border border-rose-500/30">
                      Triệt để
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Trở về trạng thái "Hai người xa lạ" ban đầu. Toàn bộ thông tin cá nhân và sở thích đã lưu sẽ bị xoá sạch.
                  </p>
                  <p className="text-[11px] text-rose-300 pt-0.5 font-medium">
                    ⚠ Xoá toàn bộ ký ức và đưa mức độ thân thiết về 0.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-3">
              <button
                type="button"
                disabled={isProcessing}
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
              >
                Huỷ
              </button>
              <button
                type="button"
                id="execute-reset-option-btn"
                disabled={isProcessing}
                onClick={handleExecuteReset}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-white transition-colors shadow-lg ${
                  selectedType === 'CLEAR_MEMORY_AND_START_FRESH'
                    ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-950/40'
                    : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-950/40'
                }`}
              >
                {selectedType === 'CLEAR_MEMORY_AND_START_FRESH'
                  ? 'Tiếp tục xoá ký ức'
                  : 'Bắt đầu hội thoại mới'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
