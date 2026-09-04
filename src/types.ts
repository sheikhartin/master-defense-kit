export interface SlideData {
  id: number;
  title: string;
  section: string;
  time: string;
  goal?: string;
  visual: string;
  speech: string;
  notes?: string;
  duration: number; // in seconds for the timer
}

export interface QAData {
  id: number;
  question: string;
  answer: string;
  difficulty: "آسان" | "متوسط" | "سخت" | "دام‌دار" | "محدودیت" | "روش" | "پیچیدگی" | "کاربردی" | "آماری" | string;
  notes?: string;
}

export interface ChecklistItem {
  id: number;
  text: string;
}

export interface ChecklistCategory {
  title: string;
  items: ChecklistItem[];
}

export interface DoAndDont {
  do: string;
  dont: string;
}

export interface KeyFact {
  label: string;
  value: string;
  type: 'رابطه' | 'عدد' | 'مرز ادعا';
}

export interface CoreEquationParameter {
  symbol: string;
  name: string;
  description: string;
}

export interface CoreEquation {
  id: string;
  title: string;
  englishTitle: string;
  formula: string;
  verbalExplanation: string;
  conceptSummary: string;
  parameters: CoreEquationParameter[];
}
