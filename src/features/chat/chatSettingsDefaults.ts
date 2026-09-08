import { ChatSettings } from '../../types/index.ts';

export const DEFAULT_CHAT_SETTINGS: ChatSettings = {
  wallpaper: 'default-dark',
  wallpaperType: 'solid',
  miyuOriginalName: 'Miyu',
  miyuNickname: '', // initially empty string as strictly required in Part 5D Section 1
  userOriginalName: 'Người dùng',
  userNickname: '', // initially empty string as strictly required in Part 5D Section 1
  miyuAvatar: 'default-miyu',
  userAvatar: 'default-user',
  notificationsEnabled: true,
  soundEnabled: true,
  autoSaveImages: false,
  bubbleChatEnabled: false,
};

export interface WallpaperOption {
  id: string;
  name: string;
  type: 'solid' | 'gradient' | 'preset' | 'custom';
  className: string;
  previewColor: string;
  contrastStyle?: string;
}

export const WALLPAPER_PRESETS: WallpaperOption[] = [
  {
    id: 'default-dark',
    name: 'Đen xám mặc định',
    type: 'solid',
    className: 'bg-zinc-950',
    previewColor: '#09090b',
  },
  {
    id: 'midnight-navy',
    name: 'Đêm đen biển sâu',
    type: 'solid',
    className: 'bg-slate-950',
    previewColor: '#020617',
  },
  {
    id: 'warm-stone',
    name: 'Espresso ấm',
    type: 'solid',
    className: 'bg-stone-950',
    previewColor: '#0c0a09',
  },
  {
    id: 'deep-forest',
    name: 'Rừng đêm thẳm',
    type: 'solid',
    className: 'bg-emerald-950',
    previewColor: '#022c22',
  },
  {
    id: 'rose-twilight',
    name: 'Hoàng hôn vang đỏ',
    type: 'solid',
    className: 'bg-rose-950/80',
    previewColor: '#4c0519',
  },
  {
    id: 'gradient-twilight',
    name: 'Cực quang tím biếc',
    type: 'gradient',
    className: 'bg-gradient-to-b from-indigo-950 via-zinc-950 to-zinc-950',
    previewColor: 'linear-gradient(to bottom, #1e1b4b, #09090b)',
  },
  {
    id: 'gradient-aurora',
    name: 'Tia sáng huyền bí',
    type: 'gradient',
    className: 'bg-gradient-to-b from-purple-950 via-zinc-950 to-black',
    previewColor: 'linear-gradient(to bottom, #3b0764, #09090b)',
  },
  {
    id: 'gradient-ocean',
    name: 'Đại dương khuya',
    type: 'gradient',
    className: 'bg-gradient-to-b from-cyan-950 via-slate-950 to-zinc-950',
    previewColor: 'linear-gradient(to bottom, #083344, #020617)',
  },
];

export interface AvatarOption {
  id: string;
  name: string;
  label: string;
  type: 'badge' | 'emoji' | 'url';
  value: string;
  bgGradient?: string;
}

export const MIYU_AVATAR_PRESETS: AvatarOption[] = [
  {
    id: 'default-miyu',
    name: 'Miyu Cổ Điển',
    label: 'M',
    type: 'badge',
    value: 'M',
    bgGradient: 'from-indigo-500 to-purple-600',
  },
  {
    id: 'miyu-sakura',
    name: 'Hoa Anh Đào',
    label: '🌸',
    type: 'emoji',
    value: '🌸',
    bgGradient: 'from-pink-500 to-rose-600',
  },
  {
    id: 'miyu-sparkle',
    name: 'Ánh Sao Lấp Lánh',
    label: '✨',
    type: 'emoji',
    value: '✨',
    bgGradient: 'from-amber-500 to-purple-600',
  },
  {
    id: 'miyu-cat',
    name: 'Mèo Nhỏ',
    label: '🐱',
    type: 'emoji',
    value: '🐱',
    bgGradient: 'from-emerald-500 to-teal-600',
  },
];

export const USER_AVATAR_PRESETS: AvatarOption[] = [
  {
    id: 'default-user',
    name: 'Chữ A (Mặc định)',
    label: 'A',
    type: 'badge',
    value: 'A',
    bgGradient: 'from-blue-600 to-indigo-700',
  },
  {
    id: 'user-coffee',
    name: 'Tách Cà Phê',
    label: '☕',
    type: 'emoji',
    value: '☕',
    bgGradient: 'from-amber-600 to-stone-700',
  },
  {
    id: 'user-gamer',
    name: 'Tay Cầm Game',
    label: '🎮',
    type: 'emoji',
    value: '🎮',
    bgGradient: 'from-violet-600 to-fuchsia-700',
  },
  {
    id: 'user-cool',
    name: 'Kính Râm Cool',
    label: '🕶️',
    type: 'emoji',
    value: '🕶️',
    bgGradient: 'from-zinc-600 to-zinc-800',
  },
];

// Pure Web Audio API Sound Synthesizer
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function playWebAudioTone(type: 'sent' | 'received' | 'reaction') {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'sent') {
      // Soft sent bubble pop
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(720, now + 0.08);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.start(now);
      osc.stop(now + 0.09);
    } else if (type === 'received') {
      // Pleasant double chime for incoming response
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.08); // A5

      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.start(now);
      osc.stop(now + 0.23);
    } else if (type === 'reaction') {
      // Gentle micro tap
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(500, now + 0.04);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.start(now);
      osc.stop(now + 0.06);
    }
  } catch {
    // Gracefully handle browser autoplay policy
  }
}
