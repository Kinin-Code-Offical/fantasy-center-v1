export interface Player {
  id: string;
  name: string;
  points: number;
  trend: 'up' | 'down' | 'stable';
  image: string;
}

export interface StatPoint {
  name: string;
  value: number;
  fullMark: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
}

export enum ViewState {
  LANDING = 'LANDING',
  ANALYST = 'ANALYST'
}