
import { UnitType } from './types';

export const CIVILIZATIONS = [
  "Roma", "Alemania", "Gran Bretaña", "Francia", "España", 
  "China", "Japón", "Corea", "Arabia", "Imperio Otomano", 
  "Bizancio", "Vikingos", "Egipto", "Grecia"
];

export const KVK_STAGES = [
  "Preparación (Pre-KvK)", 
  "KvK 1", 
  "KvK 2", 
  "KvK 3", 
  "Temporada de Conquista (SOC)"
];

export const INITIAL_ACCOUNT_STATE = {
  power: "10000000",
  vip: 10,
  civilization: "Alemania",
  mainUnitType: UnitType.INFANTRY,
  kvkStage: "KvK 2",
  gems: "5000",
  commanders: [
    { name: "Sun Tzu", level: 60, stars: 6, skills: "5-5-5-5", isExpertise: true },
    { name: "Bjorn Ironside", level: 60, stars: 6, skills: "5-5-5-5", isExpertise: true }
  ]
};
