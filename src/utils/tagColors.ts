import { TagColorId } from '../types/study';

export interface TagColorSpec {
  id: TagColorId;
  label: string;
  dotClass: string;
  swatchClass: string;
  activeControlClass: string;
  textClass: string;
}

export const TAG_COLOR_PALETTE: Record<TagColorId, TagColorSpec> = {
  teal: {
    id: 'teal',
    label: 'Teal',
    dotClass: 'bg-[#087F83] dark:bg-[#42E6D0]',
    swatchClass: 'bg-[#087F83] dark:bg-[#42E6D0]',
    activeControlClass:
      'bg-[#087F83]/10 dark:bg-[#42E6D0]/15 border-[#087F83]/45 dark:border-[#42E6D0]/50 text-[#065E61] dark:text-[#7AF2E2]',
    textClass: 'text-[#065E61] dark:text-[#7AF2E2]',
  },
  amber: {
    id: 'amber',
    label: 'Amber',
    dotClass: 'bg-amber-600 dark:bg-[#FFBE73]',
    swatchClass: 'bg-amber-500 dark:bg-[#FFBE73]',
    activeControlClass:
      'bg-amber-500/12 dark:bg-[#FFBE73]/15 border-amber-600/40 dark:border-[#FFBE73]/50 text-amber-800 dark:text-[#FFD49E]',
    textClass: 'text-amber-800 dark:text-[#FFD49E]',
  },
  sky: {
    id: 'sky',
    label: 'Sky Blue',
    dotClass: 'bg-sky-600 dark:bg-sky-400',
    swatchClass: 'bg-sky-600 dark:bg-sky-400',
    activeControlClass:
      'bg-sky-500/10 dark:bg-sky-400/15 border-sky-600/40 dark:border-sky-400/50 text-sky-800 dark:text-sky-200',
    textClass: 'text-sky-800 dark:text-sky-200',
  },
  emerald: {
    id: 'emerald',
    label: 'Emerald',
    dotClass: 'bg-emerald-600 dark:bg-emerald-400',
    swatchClass: 'bg-emerald-600 dark:bg-emerald-400',
    activeControlClass:
      'bg-emerald-500/10 dark:bg-emerald-400/15 border-emerald-600/40 dark:border-emerald-400/50 text-emerald-800 dark:text-emerald-200',
    textClass: 'text-emerald-800 dark:text-emerald-200',
  },
  violet: {
    id: 'violet',
    label: 'Violet',
    dotClass: 'bg-violet-600 dark:bg-violet-400',
    swatchClass: 'bg-violet-600 dark:bg-violet-400',
    activeControlClass:
      'bg-violet-500/10 dark:bg-violet-400/15 border-violet-600/40 dark:border-violet-400/50 text-violet-800 dark:text-violet-200',
    textClass: 'text-violet-800 dark:text-violet-200',
  },
  rose: {
    id: 'rose',
    label: 'Coral Rose',
    dotClass: 'bg-rose-600 dark:bg-rose-400',
    swatchClass: 'bg-rose-600 dark:bg-rose-400',
    activeControlClass:
      'bg-rose-500/10 dark:bg-rose-400/15 border-rose-600/40 dark:border-rose-400/50 text-rose-800 dark:text-rose-200',
    textClass: 'text-rose-800 dark:text-rose-200',
  },
  slate: {
    id: 'slate',
    label: 'Slate',
    dotClass: 'bg-slate-600 dark:bg-slate-300',
    swatchClass: 'bg-slate-600 dark:bg-slate-400',
    activeControlClass:
      'bg-slate-500/10 dark:bg-slate-400/15 border-slate-600/40 dark:border-slate-400/50 text-slate-800 dark:text-slate-200',
    textClass: 'text-slate-700 dark:text-slate-200',
  },
};

export const TAG_COLOR_OPTIONS: TagColorSpec[] = Object.values(TAG_COLOR_PALETTE);
