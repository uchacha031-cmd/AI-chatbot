import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  miyuOriginalName?: string;
  userOriginalName?: string;
  miyuNickname: string;
  userNickname: string;
  onSave: (miyuNickname: string, userNickname: string) => void;
}

export function NicknameModal({
  isOpen,
  onClose,
  miyuOriginalName = 'Miyu',
  userOriginalName = 'Người dùng',
  miyuNickname,
  userNickname,
  onSave,
}: Props) {
  const [miyuNameInput, setMiyuNameInput] = useState(miyuNickname || '');
  const [userNameInput, setUserNameInput] = useState(userNickname || '');

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(miyuNameInput.trim(), userNameInput.trim());
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
          className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-2xl shadow-black z-10"
        >
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div>
              <h3 className="text-base font-semibold text-zinc-100">Đặt biệt danh (Aa)</h3>
              <p className="text-xs text-zinc-400">Tên hiển thị & cách gọi trong cuộc trò chuyện</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-full text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSave} className="mt-4 space-y-4">
            {/* Miyu Nickname Field */}
            <div className="p-3 bg-zinc-800/50 rounded-xl border border-zinc-800">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-zinc-300">
                  Biệt danh của Miyu
                </label>
                <span className="text-[10px] text-zinc-500">Tên gốc: {miyuOriginalName}</span>
              </div>
              <input
                id="miyu-nickname-input"
                type="text"
                value={miyuNameInput}
                onChange={(e) => setMiyuNameInput(e.target.value)}
                placeholder="Để trống nếu muốn dùng tên gốc 'Miyu'..."
                maxLength={35}
                className="w-full bg-zinc-900/90 border border-zinc-700/80 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* User Nickname Field */}
            <div className="p-3 bg-zinc-800/50 rounded-xl border border-zinc-800">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-zinc-300">
                  Biệt danh của bạn (User)
                </label>
                <span className="text-[10px] text-zinc-500">Tên gốc: {userOriginalName}</span>
              </div>
              <input
                id="user-nickname-input"
                type="text"
                value={userNameInput}
                onChange={(e) => setUserNameInput(e.target.value)}
                placeholder="Ví dụ: đẹp trai số 1 thế giới, Anh Hoàng..."
                maxLength={35}
                className="w-full bg-zinc-900/90 border border-zinc-700/80 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-indigo-500 transition-colors"
              />
            </div>

            <p className="text-[11px] text-zinc-500 px-1 leading-relaxed">
              * Biệt danh không thay đổi tài khoản hay xóa ký ức. Sau khi đổi, Miyu sẽ nhận biết được tên mới này.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              >
                Hủy
              </button>
              <button
                id="save-nickname-btn"
                type="submit"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                Lưu biệt danh
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
