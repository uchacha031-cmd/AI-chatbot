import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Type,
  Search,
  User,
  Palette,
  Sliders,
  Pin,
  FileImage,
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  MessageCircle,
  Users,
  Save,
  Brain,
  ChevronRight,
  ShieldCheck,
  Check,
  RotateCcw,
} from 'lucide-react';
import { ChatSettings, ChatMessage, ExtractedMediaItem } from '../types/index.ts';
import { MIYU_AVATAR_PRESETS, AvatarOption } from '../features/chat/chatSettingsDefaults.ts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: ChatSettings;
  messages: ChatMessage[];
  mediaItems: ExtractedMediaItem[];
  onUpdateSettings: (newSettings: Partial<ChatSettings>) => void;
  onOpenNicknames: () => void;
  onOpenSearch: () => void;
  onOpenWallpaper: () => void;
  onOpenPinned: () => void;
  onOpenMedia: () => void;
  onOpenMemories: () => void;
  onOpenReset?: () => void;
}

export function ChatInfoDrawer({
  isOpen,
  onClose,
  settings,
  messages,
  mediaItems,
  onUpdateSettings,
  onOpenNicknames,
  onOpenSearch,
  onOpenWallpaper,
  onOpenPinned,
  onOpenMedia,
  onOpenMemories,
  onOpenReset,
}: Props) {
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showProfileCard, setShowProfileCard] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showBubbleNotice, setShowBubbleNotice] = useState(false);
  const [showGroupNotice, setShowGroupNotice] = useState(false);

  if (!isOpen) return null;

  const pinnedCount = messages.filter((m) => m.isPinned).length;
  const currentAvatarPreset =
    MIYU_AVATAR_PRESETS.find((a) => a.id === settings.miyuAvatar) || MIYU_AVATAR_PRESETS[0];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-xs"
        />

        {/* Messenger-style Side Panel */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          className="relative w-full max-w-md bg-zinc-900 border-l border-zinc-800 h-full overflow-y-auto flex flex-col z-10 shadow-2xl shadow-black"
        >
          {/* Top Bar with Close */}
          <div className="sticky top-0 z-20 bg-zinc-900/95 backdrop-blur-md px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="text-base font-semibold text-zinc-100">Thông tin đoạn chat</h2>
            <button
              id="close-chat-info-btn"
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Profile Header Block */}
          <div className="flex flex-col items-center py-6 px-4 border-b border-zinc-800/80 bg-zinc-900/50">
            {/* Avatar with click to switch avatar preset */}
            <div className="relative group cursor-pointer" onClick={() => setShowAvatarPicker(true)}>
              <div
                className={`w-20 h-20 rounded-full bg-gradient-to-tr ${currentAvatarPreset.bgGradient} flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-indigo-950/40 ring-4 ring-zinc-800 group-hover:ring-indigo-500 transition-all`}
              >
                {currentAvatarPreset.value}
              </div>
              <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-emerald-500 ring-4 ring-zinc-900" />
            </div>

            <h3 className="mt-3 text-lg font-bold text-zinc-100 flex items-center gap-1.5">
              <span>{settings.miyuNickname || 'Miyu'}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-medium">
                16t
              </span>
            </h3>

            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400 font-medium">Đang hoạt động</span>
              <span className="text-zinc-600">•</span>
              <span className="text-xs text-zinc-400">AI Companion độc lập</span>
            </div>

            {/* Quick Action Pills: Profile, Search, Mute */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-xs mt-5">
              <button
                type="button"
                onClick={() => setShowProfileCard(true)}
                className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors text-center"
              >
                <div className="w-9 h-9 rounded-full bg-zinc-700/60 flex items-center justify-center">
                  <User className="w-4 h-4 text-indigo-400" />
                </div>
                <span className="text-[11px] font-medium leading-tight">Trang cá nhân</span>
              </button>

              <button
                type="button"
                onClick={onOpenSearch}
                className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors text-center"
              >
                <div className="w-9 h-9 rounded-full bg-zinc-700/60 flex items-center justify-center">
                  <Search className="w-4 h-4 text-indigo-400" />
                </div>
                <span className="text-[11px] font-medium leading-tight">Tìm kiếm</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  onUpdateSettings({ notificationsEnabled: !settings.notificationsEnabled })
                }
                className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors text-center"
              >
                <div className="w-9 h-9 rounded-full bg-zinc-700/60 flex items-center justify-center">
                  {settings.notificationsEnabled ? (
                    <Bell className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <BellOff className="w-4 h-4 text-zinc-400" />
                  )}
                </div>
                <span className="text-[11px] font-medium leading-tight">
                  {settings.notificationsEnabled ? 'Tắt thông báo' : 'Bật thông báo'}
                </span>
              </button>
            </div>
          </div>

          {/* Core Functions List */}
          <div className="flex-1 px-4 py-3 space-y-4">
            {/* Section 1: Tùy chỉnh trò chuyện */}
            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-2 px-1">
                Tùy chỉnh đoạn chat
              </h4>
              <div className="bg-zinc-800/40 rounded-2xl border border-zinc-800 overflow-hidden divide-y divide-zinc-800/80">
                {/* 1. Đặt biệt danh */}
                <button
                  type="button"
                  onClick={onOpenNicknames}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-zinc-800/70 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                      <Type className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-200">Đặt biệt danh (Aa)</p>
                      <p className="text-xs text-zinc-400">
                        {settings.miyuNickname} • {settings.userNickname}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-500" />
                </button>

                {/* 4. Đổi hình nền */}
                <button
                  type="button"
                  onClick={onOpenWallpaper}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-zinc-800/70 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                      <Palette className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-200">Đổi hình nền</p>
                      <p className="text-xs text-zinc-400">Tông màu tối, gradient hoặc ảnh riêng</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-500" />
                </button>

                {/* 5. Tùy chỉnh giao diện */}
                <button
                  type="button"
                  onClick={() => setShowThemeModal(true)}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-zinc-800/70 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                      <Sliders className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-200">Tùy chỉnh giao diện</p>
                      <p className="text-xs text-zinc-400">Đổi avatar, biểu tượng đại diện</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-500" />
                </button>
              </div>
            </div>

            {/* Section 2: Nội dung & Ký ức */}
            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-2 px-1">
                Nội dung trong đoạn chat
              </h4>
              <div className="bg-zinc-800/40 rounded-2xl border border-zinc-800 overflow-hidden divide-y divide-zinc-800/80">
                {/* 6. Tin nhắn đã ghim */}
                <button
                  type="button"
                  onClick={onOpenPinned}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-zinc-800/70 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                      <Pin className="w-4 h-4 rotate-45" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-200">Tin nhắn đã ghim</p>
                      <p className="text-xs text-zinc-400">{pinnedCount} tin nhắn</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-500" />
                </button>

                {/* 7. Xem tất cả file phương tiện, file và liên kết */}
                <button
                  type="button"
                  onClick={onOpenMedia}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-zinc-800/70 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
                      <FileImage className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-200">
                        File phương tiện, file và liên kết
                      </p>
                      <p className="text-xs text-zinc-400">
                        {mediaItems.length} mục (được tính thực tế)
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-500" />
                </button>

                {/* Ký ức của Miyu */}
                <button
                  type="button"
                  onClick={onOpenMemories}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-zinc-800/70 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                      <Brain className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-200">Hệ thống ký ức của Miyu</p>
                      <p className="text-xs text-zinc-400">Ký ức dài hạn, thói quen và sở thích</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-500" />
                </button>
              </div>
            </div>

            {/* Section 3: Cài đặt & Quyền riêng tư */}
            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-2 px-1">
                Quyền riêng tư & Hỗ trợ
              </h4>
              <div className="bg-zinc-800/40 rounded-2xl border border-zinc-800 overflow-hidden divide-y divide-zinc-800/80">
                {/* 9. Thông báo và âm thanh */}
                <div className="px-4 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      {settings.soundEnabled ? (
                        <Volume2 className="w-4 h-4" />
                      ) : (
                        <VolumeX className="w-4 h-4 text-zinc-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-200">Âm thanh tin nhắn</p>
                      <p className="text-xs text-zinc-400">Hiệu ứng âm thanh nhẹ khi gửi/nhận</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
                    className={`w-11 h-6 rounded-full transition-colors relative ${
                      settings.soundEnabled ? 'bg-indigo-600' : 'bg-zinc-700'
                    }`}
                  >
                    <span
                      className={`block w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${
                        settings.soundEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* 10. Mở bong bóng chat */}
                <button
                  type="button"
                  onClick={() => setShowBubbleNotice(true)}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-zinc-800/70 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
                      <MessageCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-200">Mở bong bóng chat</p>
                      <p className="text-xs text-zinc-400">Chat head trên thiết bị di động</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-500" />
                </button>

                {/* 11. Tạo nhóm chat */}
                <button
                  type="button"
                  onClick={() => setShowGroupNotice(true)}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-zinc-800/70 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-200">Tạo nhóm chat</p>
                      <p className="text-xs text-zinc-400">Trò chuyện 1-1 riêng tư cùng Miyu</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-500" />
                </button>

                {/* 12. Tự động lưu ảnh */}
                <div className="px-4 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/20 text-violet-400 flex items-center justify-center">
                      <Save className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-200">Tự động lưu ảnh</p>
                      <p className="text-xs text-zinc-400">Lưu ảnh chia sẻ vào bộ nhớ máy</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSettings({ autoSaveImages: !settings.autoSaveImages })
                    }
                    className={`w-11 h-6 rounded-full transition-colors relative ${
                      settings.autoSaveImages ? 'bg-indigo-600' : 'bg-zinc-700'
                    }`}
                  >
                    <span
                      className={`block w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${
                        settings.autoSaveImages ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Section 4: Quản lý & Làm mới cuộc trò chuyện */}
            {onOpenReset && (
              <div>
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-2 px-1">
                  Làm mới & Đặt lại
                </h4>
                <div className="bg-zinc-800/40 rounded-2xl border border-zinc-800 overflow-hidden divide-y divide-zinc-800/80">
                  <button
                    type="button"
                    onClick={onOpenReset}
                    className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-zinc-800/70 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:bg-indigo-500/30">
                        <RotateCcw className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-200">Tuỳ chọn làm mới cuộc trò chuyện</p>
                        <p className="text-xs text-zinc-400">Bắt đầu luồng mới hoặc xoá toàn bộ ký ức</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-500" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Modal: Trang cá nhân của Miyu */}
        {showProfileCard && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60" onClick={() => setShowProfileCard(false)} />
            <div className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-2xl z-10">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <h3 className="text-base font-semibold text-zinc-100">Hồ sơ AI Companion</h3>
                <button
                  type="button"
                  onClick={() => setShowProfileCard(false)}
                  className="p-1 text-zinc-400 hover:text-zinc-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-4 space-y-3 text-xs text-zinc-300">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500 w-24">Tên nhân vật:</span>
                  <span className="font-medium text-zinc-100">Miyu</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500 w-24">Giới tính:</span>
                  <span className="font-medium text-zinc-100">Nữ</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500 w-24">Độ tuổi:</span>
                  <span className="font-medium text-zinc-100">16 tuổi</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500 w-24">Xưng hô:</span>
                  <span className="font-medium text-zinc-100">Gọi "anh", tự xưng "em"</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500 w-24">Tính cách:</span>
                  <span className="font-medium text-zinc-100">
                    Độc lập, tự nhiên, biết lắng nghe, không sáo rỗng
                  </span>
                </div>
                <div className="pt-3 border-t border-zinc-800 text-zinc-400 leading-relaxed">
                  Miyu không cố gắng nịnh bợ hay gặng hỏi liên tục. Cô bé phản hồi chân thực như một người em quen biết, đồng hành tự nhiên qua từng ngày.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Tùy chỉnh avatar */}
        {(showAvatarPicker || showThemeModal) && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => {
                setShowAvatarPicker(false);
                setShowThemeModal(false);
              }}
            />
            <div className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-2xl z-10">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <h3 className="text-base font-semibold text-zinc-100">Chọn ảnh đại diện cho Miyu</h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowAvatarPicker(false);
                    setShowThemeModal(false);
                  }}
                  className="p-1 text-zinc-400 hover:text-zinc-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {MIYU_AVATAR_PRESETS.map((av: AvatarOption) => {
                  const isSelected = settings.miyuAvatar === av.id;
                  return (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => {
                        onUpdateSettings({ miyuAvatar: av.id });
                        setShowAvatarPicker(false);
                        setShowThemeModal(false);
                      }}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                        isSelected
                          ? 'border-indigo-500 bg-zinc-800/90 ring-2 ring-indigo-500/30'
                          : 'border-zinc-800 bg-zinc-800/40 hover:bg-zinc-800'
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-full bg-gradient-to-tr ${av.bgGradient} flex items-center justify-center text-white text-xl font-bold shadow-md`}
                      >
                        {av.value}
                      </div>
                      <span className="text-xs font-medium text-zinc-200">{av.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Notice: Bong bóng chat */}
        {showBubbleNotice && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60" onClick={() => setShowBubbleNotice(false)} />
            <div className="relative w-full max-w-xs bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-2xl z-10 text-center">
              <MessageCircle className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-zinc-100 mb-1.5">Bong bóng chat</h3>
              <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                Tính năng bong bóng chat (Chat heads) hoạt động khi bạn cài đặt ứng dụng qua PWA hoặc trên trình duyệt di động hỗ trợ đa nhiệm.
              </p>
              <button
                type="button"
                onClick={() => setShowBubbleNotice(false)}
                className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        )}

        {/* Notice: Nhóm chat */}
        {showGroupNotice && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60" onClick={() => setShowGroupNotice(false)} />
            <div className="relative w-full max-w-xs bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-2xl z-10 text-center">
              <Users className="w-10 h-10 text-pink-400 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-zinc-100 mb-1.5">Trò chuyện 1-1 cùng Miyu</h3>
              <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                Miyu được thiết kế như một người bạn đồng hành cá nhân, riêng tư 1-on-1 để giữ trọn vẹn sự tinh tế và bảo mật dòng ký ức của bạn.
              </p>
              <button
                type="button"
                onClick={() => setShowGroupNotice(false)}
                className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        )}
      </div>
    </AnimatePresence>
  );
}
