import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { AlertCircle } from 'lucide-react';
import { useChat } from './features/chat/useChat.ts';
import { ChatHeader } from './components/ChatHeader.tsx';
import { ChatMessageItem } from './components/ChatMessageItem.tsx';
import { TypingIndicator } from './components/TypingIndicator.tsx';
import { EmptyState } from './components/EmptyState.tsx';
import { ChatInput } from './components/ChatInput.tsx';
import { MemoryDrawer } from './components/MemoryDrawer.tsx';
import { ChatInfoDrawer } from './components/ChatInfoDrawer.tsx';
import { ReactionPickerModal } from './components/ReactionPickerModal.tsx';
import { NicknameModal } from './components/NicknameModal.tsx';
import { InChatSearchModal } from './components/InChatSearchModal.tsx';
import { WallpaperModal } from './components/WallpaperModal.tsx';
import { PinnedMessagesModal } from './components/PinnedMessagesModal.tsx';
import { MediaViewerModal } from './components/MediaViewerModal.tsx';
import { ResetModal } from './components/ResetModal.tsx';
import { extractMediaFromMessages } from './services/firebase.ts';
import { WALLPAPER_PRESETS } from './features/chat/chatSettingsDefaults.ts';

export default function App() {
  const {
    userId,
    messages,
    memories,
    chatSettings,
    updateChatSettings,
    toggleReaction,
    togglePin,
    isTyping,
    errorStatus,
    sendMessage,
    retryMessage,
    handleTypingStart,
    handleTypingPause,
    handleTypingStop,
    addMemory,
    updateMemory,
    deleteMemory,
    resetChat,
  } = useChat();

  const [inputText, setInputText] = useState('');
  const [isMemoryOpen, setIsMemoryOpen] = useState(false);
  const [isChatInfoOpen, setIsChatInfoOpen] = useState(false);
  const [isNicknamesOpen, setIsNicknamesOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isWallpaperOpen, setIsWallpaperOpen] = useState(false);
  const [isPinnedOpen, setIsPinnedOpen] = useState(false);
  const [isMediaOpen, setIsMediaOpen] = useState(false);
  const [isFullReactionPickerOpen, setIsFullReactionPickerOpen] = useState(false);
  const [targetReactionMessageId, setTargetReactionMessageId] = useState<string | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatScrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Dynamic real media items extracted from chat messages (no fake 357 numbers)
  const mediaItems = useMemo(() => extractMediaFromMessages(messages), [messages]);

  // Current wallpaper resolution
  const currentWallpaperClass = useMemo(() => {
    if (chatSettings.wallpaperType === 'custom') return '';
    const found = WALLPAPER_PRESETS.find((wp) => wp.id === chatSettings.wallpaper);
    return found ? found.className : 'bg-zinc-950';
  }, [chatSettings.wallpaper, chatSettings.wallpaperType]);

  // Smooth scroll to bottom on new messages or typing state change
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
    }
  }, []);

  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages, isTyping, scrollToBottom]);

  // Mobile virtual keyboard viewport adaptation
  useEffect(() => {
    const handleViewportChange = () => {
      scrollToBottom('auto');
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
      window.visualViewport.addEventListener('scroll', handleViewportChange);
    }
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
        window.visualViewport.removeEventListener('scroll', handleViewportChange);
      }
    };
  }, [scrollToBottom]);

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;
    setInputText('');
    sendMessage(trimmed);
  };

  const handleSelectStarter = (starterText: string) => {
    sendMessage(starterText);
  };

  // Jump to specific message and highlight it
  const handleJumpToMessage = (messageId: string) => {
    setHighlightedMessageId(messageId);
    setTimeout(() => {
      const el = document.getElementById(`msg-${messageId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
    setTimeout(() => setHighlightedMessageId(null), 3500);
  };

  // Open full reaction picker modal
  const handleOpenFullReactionPicker = (messageId: string) => {
    setTargetReactionMessageId(messageId);
    setIsFullReactionPickerOpen(true);
  };

  const handleSelectReactionFromModal = (emoji: string) => {
    if (targetReactionMessageId) {
      toggleReaction(targetReactionMessageId, emoji);
    }
  };

  return (
    <div
      className={`flex flex-col h-screen h-[100dvh] ${currentWallpaperClass} text-zinc-100 font-sans antialiased select-text overflow-hidden transition-colors duration-300`}
      style={
        chatSettings.wallpaperType === 'custom'
          ? {
              backgroundImage: `url(${chatSettings.wallpaper})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : undefined
      }
    >
      {/* Top Header with "!" Chat Info button and search */}
      <ChatHeader
        memoryCount={memories.length}
        miyuNickname={chatSettings.miyuNickname}
        miyuAvatar={chatSettings.miyuAvatar}
        onOpenMemories={() => setIsMemoryOpen(true)}
        onOpenChatInfo={() => setIsChatInfoOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onResetChat={() => setShowResetConfirm(true)}
      />

      {/* Error status notice */}
      {errorStatus && (
        <div className="bg-rose-950/60 border-b border-rose-800/50 px-4 py-2 text-xs text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-1.5 truncate">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{errorStatus}</span>
          </div>
        </div>
      )}

      {/* Main Message List / Conversation View */}
      <main
        ref={chatScrollContainerRef}
        className="flex-1 overflow-y-auto overscroll-contain py-4 px-1 sm:px-4 flex flex-col"
      >
        <div className="max-w-3xl w-full mx-auto flex-1 flex flex-col justify-end">
          {messages.length === 0 ? (
            <EmptyState onSelectStarter={handleSelectStarter} />
          ) : (
            <div className="space-y-1">
              {messages.map((msg, index) => (
                <ChatMessageItem
                  key={msg.id}
                  message={msg}
                  userId={userId}
                  currentMiyuAvatar={chatSettings.miyuAvatar}
                  isHighlighted={highlightedMessageId === msg.id}
                  isLast={index === messages.length - 1}
                  onRetry={(messageId) => retryMessage(messageId)}
                  onToggleReaction={(messageId, emoji) => toggleReaction(messageId, emoji)}
                  onOpenFullReactionPicker={handleOpenFullReactionPicker}
                  onTogglePin={(messageId) => togglePin(messageId)}
                />
              ))}

              {isTyping && <TypingIndicator />}
              <div ref={messagesEndRef} className="h-2" />
            </div>
          )}
        </div>
      </main>

      {/* Bottom Chat Input Bar - Never locked during generation */}
      <ChatInput
        value={inputText}
        onChange={setInputText}
        onSend={handleSend}
        onTypingStart={handleTypingStart}
        onTypingPause={handleTypingPause}
        onTypingStop={handleTypingStop}
        disabled={false}
      />

      {/* Modern Messenger-Style Chat Info Panel */}
      <ChatInfoDrawer
        isOpen={isChatInfoOpen}
        onClose={() => setIsChatInfoOpen(false)}
        settings={chatSettings}
        messages={messages}
        mediaItems={mediaItems}
        onUpdateSettings={updateChatSettings}
        onOpenNicknames={() => setIsNicknamesOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenWallpaper={() => setIsWallpaperOpen(true)}
        onOpenPinned={() => setIsPinnedOpen(true)}
        onOpenMedia={() => setIsMediaOpen(true)}
        onOpenMemories={() => setIsMemoryOpen(true)}
        onOpenReset={() => {
          setIsChatInfoOpen(false);
          setShowResetConfirm(true);
        }}
      />

      {/* 40-Emoji Reaction Picker Modal */}
      <ReactionPickerModal
        isOpen={isFullReactionPickerOpen}
        onClose={() => {
          setIsFullReactionPickerOpen(false);
          setTargetReactionMessageId(null);
        }}
        onSelectReaction={handleSelectReactionFromModal}
        currentMessageId={targetReactionMessageId || undefined}
      />

      {/* Nicknames Modal (Aa Đặt biệt danh) */}
      <NicknameModal
        isOpen={isNicknamesOpen}
        onClose={() => setIsNicknamesOpen(false)}
        miyuNickname={chatSettings.miyuNickname}
        userNickname={chatSettings.userNickname}
        onSave={(miyuName, userName) =>
          updateChatSettings({ miyuNickname: miyuName, userNickname: userName })
        }
      />

      {/* In-Chat Search Modal */}
      <InChatSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        messages={messages}
        onJumpToMessage={handleJumpToMessage}
        miyuNickname={chatSettings.miyuNickname}
        userNickname={chatSettings.userNickname}
      />

      {/* Wallpaper Switcher Modal */}
      <WallpaperModal
        isOpen={isWallpaperOpen}
        onClose={() => setIsWallpaperOpen(false)}
        currentWallpaper={chatSettings.wallpaper}
        onSelectWallpaper={(wallpaperId, type) =>
          updateChatSettings({ wallpaper: wallpaperId, wallpaperType: type })
        }
      />

      {/* Pinned Messages Modal */}
      <PinnedMessagesModal
        isOpen={isPinnedOpen}
        onClose={() => setIsPinnedOpen(false)}
        messages={messages}
        onJumpToMessage={handleJumpToMessage}
        onTogglePin={togglePin}
        miyuNickname={chatSettings.miyuNickname}
        userNickname={chatSettings.userNickname}
      />

      {/* Media, Files, and Links Viewer Modal */}
      <MediaViewerModal
        isOpen={isMediaOpen}
        onClose={() => setIsMediaOpen(false)}
        items={mediaItems}
        onJumpToMessage={handleJumpToMessage}
      />

      {/* Memory Drawer Sheet */}
      <MemoryDrawer
        isOpen={isMemoryOpen}
        onClose={() => setIsMemoryOpen(false)}
        memories={memories}
        onAddMemory={addMemory}
        onUpdateMemory={updateMemory}
        onDeleteMemory={deleteMemory}
      />

      {/* Reset Options Modal (Part 5C: Conversation Reset + Memory Separation) */}
      <ResetModal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirmReset={async (type) => {
          await resetChat(type);
        }}
        memoryCount={memories.length}
      />
    </div>
  );
}
