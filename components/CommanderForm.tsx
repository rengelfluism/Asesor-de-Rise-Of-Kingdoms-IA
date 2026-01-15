
import React, { useState } from 'react';
import { Commander } from '../types';

interface CommanderFormProps {
  onAdd: (c: Commander) => void;
}

const CommanderForm: React.FC<CommanderFormProps> = ({ onAdd }) => {
  const [name, setName] = useState('');
  const [level, setLevel] = useState(60);
  const [skills, setSkills] = useState('5-1-1-1');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    onAdd({ name, level, stars: 6, skills, isExpertise: skills === '5-5-5-5' });
    setName('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-2 items-end bg-slate-800/50 p-3 rounded-lg border border-slate-700">
      <div className="flex-1 min-w-[120px]">
        <label className="text-[10px] text-slate-400 block mb-1">Nombre</label>
        <input 
          value={name} onChange={(e) => setName(e.target.value)} 
          placeholder="Ej: Yi Seong-Gye" 
          className="w-full bg-slate-900 border border-slate-700 p-2 text-xs rounded"
        />
      </div>
      <div className="w-16">
        <label className="text-[10px] text-slate-400 block mb-1">Nivel</label>
        <input 
          type="number" value={level} onChange={(e) => setLevel(Number(e.target.value))} 
          className="w-full bg-slate-900 border border-slate-700 p-2 text-xs rounded"
        />
      </div>
      <div className="w-24">
        <label className="text-[10px] text-slate-400 block mb-1">Skills</label>
        <input 
          value={skills} onChange={(e) => setSkills(e.target.value)} 
          className="w-full bg-slate-900 border border-slate-700 p-2 text-xs rounded"
        />
      </div>
      <button type="submit" className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded text-xs font-bold transition-colors">
        Añadir
      </button>
    </form>
  );
};

export default CommanderForm;
