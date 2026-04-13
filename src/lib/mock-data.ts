export type Rank = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'grandmaster';

export interface UserProfile {
  id: string;
  name: string;
  rank: Rank;
  level: number;
  xp: number;
  xpToNext: number;
  totalHours: number;
  weeklyXp: number;
  avatar: string;
}

export interface StudyRoom {
  id: string;
  name: string;
  category: string;
  participants: number;
  maxParticipants: number;
  isActive: boolean;
  host: string;
}

export interface ChatMessage {
  id: string;
  user: string;
  text: string;
  time: string;
}

export interface TodoItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Participant {
  id: string;
  name: string;
  status: 'studying' | 'break';
  avatar: string;
}

export const rankConfig: Record<Rank, { label: string; color: string; icon: string; minXp: number }> = {
  bronze: { label: 'برونزي', color: 'text-orange-400', icon: '🥉', minXp: 0 },
  silver: { label: 'فضي', color: 'text-gray-300', icon: '🥈', minXp: 500 },
  gold: { label: 'ذهبي', color: 'text-yellow-400', icon: '🥇', minXp: 1500 },
  platinum: { label: 'بلاتيني', color: 'text-cyan-300', icon: '💎', minXp: 3000 },
  diamond: { label: 'ماسي', color: 'text-blue-300', icon: '💠', minXp: 5000 },
  grandmaster: { label: 'غراندماستر', color: 'text-purple-300', icon: '👑', minXp: 10000 },
};

export const categories = [
  { id: 'all', label: 'الكل' },
  { id: 'engineering', label: 'هندسة' },
  { id: 'medicine', label: 'طب' },
  { id: 'languages', label: 'لغات' },
  { id: 'science', label: 'علوم' },
  { id: 'other', label: 'أخرى' },
];

export const currentUser: UserProfile = {
  id: 'u1',
  name: 'أحمد محمد',
  rank: 'gold',
  level: 12,
  xp: 1850,
  xpToNext: 2000,
  totalHours: 156,
  weeklyXp: 340,
  avatar: '👨‍💻',
};

export const leaderboard: UserProfile[] = [
  { id: 'l1', name: 'سارة أحمد', rank: 'diamond', level: 25, xp: 5200, xpToNext: 6000, totalHours: 420, weeklyXp: 890, avatar: '👩‍🔬' },
  { id: 'l2', name: 'محمد علي', rank: 'platinum', level: 20, xp: 3800, xpToNext: 4500, totalHours: 350, weeklyXp: 720, avatar: '👨‍⚕️' },
  { id: 'l3', name: 'فاطمة حسن', rank: 'gold', level: 18, xp: 2900, xpToNext: 3000, totalHours: 280, weeklyXp: 650, avatar: '👩‍💻' },
  { id: 'u1', name: 'أحمد محمد', rank: 'gold', level: 12, xp: 1850, xpToNext: 2000, totalHours: 156, weeklyXp: 340, avatar: '👨‍💻' },
  { id: 'l4', name: 'عمر خالد', rank: 'silver', level: 10, xp: 1200, xpToNext: 1500, totalHours: 130, weeklyXp: 310, avatar: '👨‍🎓' },
  { id: 'l5', name: 'نور الدين', rank: 'silver', level: 9, xp: 1100, xpToNext: 1500, totalHours: 120, weeklyXp: 280, avatar: '🧑‍🏫' },
  { id: 'l6', name: 'ليلى عبدالله', rank: 'silver', level: 8, xp: 950, xpToNext: 1500, totalHours: 100, weeklyXp: 250, avatar: '👩‍🎓' },
  { id: 'l7', name: 'يوسف إبراهيم', rank: 'bronze', level: 6, xp: 480, xpToNext: 500, totalHours: 80, weeklyXp: 200, avatar: '👨‍🔧' },
  { id: 'l8', name: 'هدى سعيد', rank: 'bronze', level: 5, xp: 400, xpToNext: 500, totalHours: 60, weeklyXp: 180, avatar: '👩‍🏫' },
  { id: 'l9', name: 'كريم وليد', rank: 'bronze', level: 4, xp: 320, xpToNext: 500, totalHours: 45, weeklyXp: 150, avatar: '🧑‍💼' },
];

export const studyRooms: StudyRoom[] = [
  { id: 'r1', name: 'غرفة الرياضيات المتقدمة', category: 'engineering', participants: 5, maxParticipants: 10, isActive: true, host: 'سارة أحمد' },
  { id: 'r2', name: 'مراجعة التشريح', category: 'medicine', participants: 8, maxParticipants: 12, isActive: true, host: 'محمد علي' },
  { id: 'r3', name: 'تعلم الإنجليزية', category: 'languages', participants: 3, maxParticipants: 8, isActive: true, host: 'فاطمة حسن' },
  { id: 'r4', name: 'فيزياء الكم', category: 'science', participants: 4, maxParticipants: 6, isActive: true, host: 'عمر خالد' },
  { id: 'r5', name: 'برمجة Python', category: 'engineering', participants: 7, maxParticipants: 10, isActive: true, host: 'نور الدين' },
  { id: 'r6', name: 'دراسة حرة', category: 'other', participants: 2, maxParticipants: 15, isActive: true, host: 'ليلى عبدالله' },
];

export const roomParticipants: Participant[] = [
  { id: 'p1', name: 'سارة أحمد', status: 'studying', avatar: '👩‍🔬' },
  { id: 'p2', name: 'محمد علي', status: 'studying', avatar: '👨‍⚕️' },
  { id: 'p3', name: 'فاطمة حسن', status: 'break', avatar: '👩‍💻' },
  { id: 'p4', name: 'عمر خالد', status: 'studying', avatar: '👨‍🎓' },
  { id: 'p5', name: 'أحمد محمد', status: 'studying', avatar: '👨‍💻' },
];

export const chatMessages: ChatMessage[] = [
  { id: 'c1', user: 'سارة', text: 'مرحباً بالجميع! 👋', time: '10:05' },
  { id: 'c2', user: 'محمد', text: 'يلا نبدأ المذاكرة', time: '10:06' },
  { id: 'c3', user: 'فاطمة', text: 'خلصت الفصل الثالث ✅', time: '10:20' },
  { id: 'c4', user: 'عمر', text: 'ممتاز! أنا في الفصل الرابع', time: '10:22' },
];
