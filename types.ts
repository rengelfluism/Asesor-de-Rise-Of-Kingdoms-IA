
export enum UnitType {
  INFANTRY = 'Infantería',
  CAVALRY = 'Caballería',
  ARCHER = 'Arqueros',
  LEADERSHIP = 'Liderazgo/Mixto'
}

export interface Commander {
  name: string;
  level: number;
  stars: number;
  skills: string; // e.g. "5-5-1-1"
  isExpertise: boolean;
}

export interface AccountState {
  power: string;
  vip: number;
  civilization: string;
  mainUnitType: UnitType;
  kvkStage: string;
  gems: string;
  commanders: Commander[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
