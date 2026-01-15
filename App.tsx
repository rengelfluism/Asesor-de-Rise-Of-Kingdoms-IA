
import React, { useState, useEffect, useRef } from 'react';
import { AccountState, UnitType, ChatMessage, Commander } from './types';
import { INITIAL_ACCOUNT_STATE, CIVILIZATIONS, KVK_STAGES } from './constants';
import { getAdvisorFeedback, chatWithAdvisor } from './services/geminiService';
import StatInput from './components/StatInput';
import CommanderForm from './components/CommanderForm';

const App: React.FC = () => {
  const [state, setState] = useState<AccountState>(INITIAL_ACCOUNT_STATE);
  const [advisorNote, setAdvisorNote] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [chatOpen, setChatOpen] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState<string>('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleUpdateAccount = async () => {
    setLoading(true);
    const feedback = await getAdvisorFeedback(state);
    setAdvisorNote(feedback);
    setLoading(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const newUserMsg: ChatMessage = { role: 'user', content: userInput };
    const updatedMessages = [...chatMessages, newUserMsg];
    setChatMessages(updatedMessages);
    setUserInput('');
    setLoading(true);

    const response = await chatWithAdvisor(updatedMessages, state);
    setChatMessages([...updatedMessages, { role: 'assistant', content: response }]);
    setLoading(false);
  };

  const removeCommander = (index: number) => {
    const newCmds = state.commanders.filter((_, i) => i !== index);
    setState({ ...state, commanders: newCmds });
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 pb-24">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.3)]">
            <svg className="w-10 h-10 text-slate-900" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-black text-amber-500 uppercase tracking-tighter">RoK Advisor Elite</h1>
            <p className="text-slate-400 text-sm font-medium">Tu estratega personal para dominar el reino</p>
          </div>
        </div>
        <button 
          onClick={handleUpdateAccount}
          disabled={loading}
          className="w-full md:w-auto bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 px-8 py-3 rounded-xl font-bold text-white shadow-lg shadow-amber-900/20 active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? 'Consultando...' : 'Obtener Asesoría Estratégica'}
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Account Setup */}
        <section className="lg:col-span-1 space-y-6">
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
            <h2 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
              <span className="w-2 h-6 bg-amber-500 rounded-full"></span>
              Estado de la Cuenta
            </h2>
            <div className="space-y-4">
              <StatInput label="Poder Total" value={state.power} onChange={(v) => setState({...state, power: v})} />
              <StatInput label="Nivel VIP" value={state.vip} type="number" onChange={(v) => setState({...state, vip: Number(v)})} />
              <StatInput label="Gemas Actuales" value={state.gems} onChange={(v) => setState({...state, gems: v})} />
              <StatInput 
                label="Civilización" 
                value={state.civilization} 
                type="select" 
                options={CIVILIZATIONS} 
                onChange={(v) => setState({...state, civilization: v})} 
              />
              <StatInput 
                label="Unidad Principal" 
                value={state.mainUnitType} 
                type="select" 
                options={Object.values(UnitType)} 
                onChange={(v) => setState({...state, mainUnitType: v as UnitType})} 
              />
              <StatInput 
                label="Etapa de KvK" 
                value={state.kvkStage} 
                type="select" 
                options={KVK_STAGES} 
                onChange={(v) => setState({...state, kvkStage: v})} 
              />
            </div>
          </div>

          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
            <h2 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
              <span className="w-2 h-6 bg-amber-500 rounded-full"></span>
              Comandantes Principales
            </h2>
            <div className="space-y-4">
              <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {state.commanders.map((cmd, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-700/50 p-3 rounded-lg border border-slate-600 group">
                    <div>
                      <p className="font-bold text-sm text-slate-100">{cmd.name}</p>
                      <p className="text-[10px] text-slate-400">Nivel {cmd.level} • {cmd.skills}</p>
                    </div>
                    <button 
                      onClick={() => removeCommander(idx)}
                      className="text-slate-500 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                  </div>
                ))}
              </div>
              <CommanderForm onAdd={(c) => setState({...state, commanders: [...state.commanders, c]})} />
            </div>
          </div>
        </section>

        {/* Right Column: Advisor Feedback */}
        <section className="lg:col-span-2 space-y-6">
          <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-lg min-h-[400px] flex flex-col">
            <h2 className="text-xl font-bold text-amber-500 mb-6 flex items-center gap-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
              Hoja de Ruta del Asesor
            </h2>
            
            {advisorNote ? (
              <div className="prose prose-invert max-w-none text-slate-300 space-y-4">
                {advisorNote.split('\n').map((line, i) => (
                  <p key={i} className={line.startsWith('#') ? 'text-xl font-bold text-slate-100 mt-4' : ''}>
                    {line}
                  </p>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-4">
                <svg className="w-16 h-16 opacity-20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
                </svg>
                <p className="text-center italic">Ingresa los datos de tu cuenta y haz clic en <br/><span className="text-amber-500 font-bold">Obtener Asesoría Estratégica</span> para comenzar.</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Floating Chat Panel */}
      <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ease-in-out ${chatOpen ? 'w-full md:w-[450px] h-[600px] max-h-[80vh]' : 'w-16 h-16 overflow-hidden'}`}>
        {!chatOpen ? (
          <button 
            onClick={() => setChatOpen(true)}
            className="w-16 h-16 bg-amber-600 hover:bg-amber-500 text-white rounded-full shadow-2xl flex items-center justify-center transition-transform active:scale-90"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 012 2h-5l-5 5v-5z"></path></svg>
          </button>
        ) : (
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl h-full flex flex-col overflow-hidden">
            <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-bold text-slate-100">Consultorio Táctico</span>
              </div>
              <button onClick={() => setChatOpen(false)} className="text-slate-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-900/50">
              {chatMessages.length === 0 && (
                <p className="text-center text-slate-500 text-sm italic mt-10">Hazme cualquier pregunta sobre tu cuenta, equipos, talentos o tácticas de guerra.</p>
              )}
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-amber-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none'}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 text-slate-400 p-3 rounded-2xl rounded-tl-none border border-slate-700 flex gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 bg-slate-800 border-t border-slate-700 flex gap-2">
              <input 
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Pregunta algo..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-100"
              />
              <button type="submit" disabled={loading} className="bg-amber-600 hover:bg-amber-500 text-white p-2 rounded-xl disabled:opacity-50 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
              </button>
            </form>
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #475569;
        }
      `}</style>
    </div>
  );
};

export default App;
