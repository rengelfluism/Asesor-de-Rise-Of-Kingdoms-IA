
import React from 'react';
import { UnitType } from '../types';
import { CIVILIZATIONS, KVK_STAGES } from '../constants';

interface StatInputProps {
  label: string;
  value: string | number;
  onChange: (val: any) => void;
  type?: 'text' | 'number' | 'select';
  options?: string[] | any[];
}

const StatInput: React.FC<StatInputProps> = ({ label, value, onChange, type = 'text', options }) => {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</label>
      {type === 'select' ? (
        <select 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-md p-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none transition-all"
        >
          {options?.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      ) : (
        <input 
          type={type} 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-md p-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none transition-all"
        />
      )}
    </div>
  );
};

export default StatInput;
