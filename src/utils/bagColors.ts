export interface ColorStyle {
  label: string;
  dot: string;
  border: string;
  bgLight: string;
  badge: string;
  headerBg: string;
  headerText: string;
  accent: string;
}

export const BAG_COLORS: Record<string, ColorStyle> = {
  blue: {
    label: 'Xanh Hải Quân',
    dot: 'bg-sky-600',
    border: 'border-sky-300',
    bgLight: 'bg-sky-50/50',
    badge: 'bg-sky-100 text-sky-900',
    headerBg: 'bg-sky-950 text-white',
    headerText: 'text-sky-900',
    accent: 'border-sky-500'
  },
  slate: {
    label: 'Xám Than',
    dot: 'bg-stone-600',
    border: 'border-stone-300',
    bgLight: 'bg-stone-50/70',
    badge: 'bg-stone-200 text-stone-900',
    headerBg: 'bg-stone-900 text-white',
    headerText: 'text-stone-900',
    accent: 'border-stone-500'
  },
  emerald: {
    label: 'Xanh Ngọc',
    dot: 'bg-emerald-600',
    border: 'border-emerald-300',
    bgLight: 'bg-emerald-50/50',
    badge: 'bg-emerald-100 text-emerald-900',
    headerBg: 'bg-emerald-950 text-white',
    headerText: 'text-emerald-900',
    accent: 'border-emerald-500'
  },
  amber: {
    label: 'Vàng Cát',
    dot: 'bg-amber-600',
    border: 'border-amber-300',
    bgLight: 'bg-amber-50/50',
    badge: 'bg-amber-100 text-amber-900',
    headerBg: 'bg-amber-950 text-white',
    headerText: 'text-amber-900',
    accent: 'border-amber-500'
  },
  rose: {
    label: 'Hồng Đất',
    dot: 'bg-rose-600',
    border: 'border-rose-300',
    bgLight: 'bg-rose-50/50',
    badge: 'bg-rose-100 text-rose-900',
    headerBg: 'bg-rose-950 text-white',
    headerText: 'text-rose-900',
    accent: 'border-rose-500'
  },
  purple: {
    label: 'Tím Oải Hương',
    dot: 'bg-purple-600',
    border: 'border-purple-300',
    bgLight: 'bg-purple-50/50',
    badge: 'bg-purple-100 text-purple-900',
    headerBg: 'bg-purple-950 text-white',
    headerText: 'text-purple-900',
    accent: 'border-purple-500'
  },
  teal: {
    label: 'Xanh Mòng Két',
    dot: 'bg-teal-600',
    border: 'border-teal-300',
    bgLight: 'bg-teal-50/50',
    badge: 'bg-teal-100 text-teal-900',
    headerBg: 'bg-teal-950 text-white',
    headerText: 'text-teal-900',
    accent: 'border-teal-500'
  }
};
