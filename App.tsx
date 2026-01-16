
import React, { useState, useEffect, useRef } from 'react';
import { AccountState, UnitType, ChatMessage, Commander } from './types';
import { INITIAL_ACCOUNT_STATE, CIVILIZATIONS, KVK_STAGES } from './constants';
import { getAdvisorFeedback, chatWithAdvisor, generateSpeech } from './services/geminiService';
import StatInput from './components/StatInput';
import CommanderForm from './components/CommanderForm';

// Audio Helpers
function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length;
  const buffer = ctx.createBuffer(1, frameCount, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
}

const App: React.FC = () => {
  const [state, setState] = useState<AccountState>(() => {
    const saved = localStorage.getItem('rok_account_state');
    return saved ? JSON.parse(saved) : INITIAL_ACCOUNT_STATE;
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('rok_chat_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [advisorNote, setAdvisorNote] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [autoSpeak, setAutoSpeak] = useState<boolean>(false);
  const [chatOpen, setChatOpen] = useState<boolean>(false);
  const [userInput, setUserInput] = useState<string>('');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('rok_account_state', JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    localStorage.setItem('rok_chat_history', JSON.stringify(chatMessages));
    scrollToBottom();
  }, [chatMessages]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const playVoice = async (text: string) => {
    if (!text) return;
    setIsSpeaking(true);
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const ctx = audioContextRef.current;
      const base64Audio = await generateSpeech(text);
      if (base64Audio) {
        const audioBuffer = await decodeAudioData(decodeBase64(base64Audio), ctx);
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.onended = () => setIsSpeaking(false);
        source.start();
      } else {
        setIsSpeaking(false);
      }
    } catch (e) {
      console.error(e);
      setIsSpeaking(false);
    }
  };

  const handleUpdateAccount = async () => {
    setLoading(true);
    const feedback = await getAdvisorFeedback(state);
    setAdvisorNote(feedback);
    setLoading(false);
    if (autoSpeak) playVoice(feedback);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const newUserMsg: ChatMessage = { role: 'user', content: userInput };
    const updatedMessages = [...chatMessages, newUserMsg];
    setChatMessages(updatedMessages);
    setUserInput('');
    setLoading(true);

    const responseText = await chatWithAdvisor(updatedMessages, state);
    const assistantMsg: ChatMessage = { role: 'assistant', content: responseText };
    setChatMessages([...updatedMessages, assistantMsg]);
    setLoading(false);
    
    if (autoSpeak) playVoice(responseText);
  };

  const removeCommander = (index: number) => {
    const newCmds = state.commanders.filter((_, i) => i !== index);
    setState({ ...state, commanders: newCmds });
  };

  const resetAllData = () => {
    if (confirm('¿Deseas resetear toda la inteligencia de tu cuenta?')) {
      setState(INITIAL_ACCOUNT_STATE);
      setChatMessages([]);
      setAdvisorNote('');
      localStorage.clear();
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 pb-24 font-sans antialiased">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-800/90 backdrop-blur-xl p-6 rounded-3xl border border-slate-700 shadow-2xl relative">
        <div className="absolute top-3 right-6 flex gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Auto-Voz</span>
            <button 
              onClick={() => setAutoSpeak(!autoSpeak)}
              className={`w-10 h-5 rounded-full transition-colors relative ${autoSpeak ? 'bg-amber-500' : 'bg-slate-600'}`}
            >
              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${autoSpeak ? 'left-6' : 'left-1'}`}></div>
            </button>
          </div>
          <span className="text-[10px] text-green-500 font-mono flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
            Sync OK
          </span>
        </div>
        
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
            <svg className="w-10 h-10 text-slate-900" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">RoK Intel</h1>
            <p className="text-amber-500 text-xs font-bold uppercase tracking-[0.2em] mt-1">Estratega de Combate AI</p>
          </div>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={resetAllData}
            className="p-3 rounded-2xl bg-slate-700/50 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-600 transition-all group"
          >
            <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
          </button>
          <button 
            onClick={handleUpdateAccount}
            disabled={loading}
            className="flex-1 md:flex-none bg-amber-500 hover:bg-amber-400 text-slate-900 px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-[0_10px_20px_rgba(245,158,11,0.2)] active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? 'Sincronizando...' : 'Generar Reporte'}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Account Setup */}
        <section className="space-y-6">
          <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700/50 shadow-xl backdrop-blur-sm">
            <h2 className="text-sm font-black text-slate-400 mb-6 flex items-center gap-3 uppercase tracking-widest">
              <span className="w-4 h-1 bg-amber-500"></span> Datos de Cuenta
            </h2>
            <div className="grid grid-cols-1 gap-5">
              <StatInput label="Poder" value={state.power} onChange={(v) => setState({...state, power: v})} />
              <div className="grid grid-cols-2 gap-4">
                <StatInput label="VIP" value={state.vip} type="number" onChange={(v) => setState({...state, vip: Number(v)})} />
                <StatInput label="Gemas" value={state.gems} onChange={(v) => setState({...state, gems: v})} />
              </div>
              <StatInput label="Civilización" value={state.civilization} type="select" options={CIVILIZATIONS} onChange={(v) => setState({...state, civilization: v})} />
              <StatInput label="Unidad" value={state.mainUnitType} type="select" options={Object.values(UnitType)} onChange={(v) => setState({...state, mainUnitType: v as UnitType})} />
              <StatInput label="Fase KvK" value={state.kvkStage} type="select" options={KVK_STAGES} onChange={(v) => setState({...state, kvkStage: v})} />
            </div>
          </div>

          <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700/50 shadow-xl backdrop-blur-sm">
            <h2 className="text-sm font-black text-slate-400 mb-6 flex items-center gap-3 uppercase tracking-widest">
              <span className="w-4 h-1 bg-amber-500"></span> Guarnición de Comandantes
            </h2>
            <div className="space-y-4">
              <div className="max-h-72 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {state.commanders.map((cmd, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-900/60 p-4 rounded-2xl border border-slate-700 group hover:border-amber-500/50 transition-all">
                    <div>
                      <p className="font-black text-slate-100 text-xs uppercase tracking-tight">{cmd.name}</p>
                      <p className="text-[10px] text-amber-500 font-bold">LVL {cmd.level} • {cmd.skills}</p>
                    </div>
                    <button onClick={() => removeCommander(idx)} className="text-slate-600 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                  </div>
                ))}
              </div>
              <CommanderForm onAdd={(c) => setState({...state, commanders: [...state.commanders, c]})} />
            </div>
          </div>
        </section>

        {/* Advisor Roadmap */}
        <section className="lg:col-span-2 space-y-6">
          <div className="bg-slate-800/80 p-8 rounded-3xl border border-slate-700 shadow-2xl min-h-[600px] flex flex-col relative group">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-black text-white flex items-center gap-3 uppercase italic">
                <svg className="w-6 h-6 text-amber-500" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                Roadmap Estratégico
              </h2>
              {advisorNote && (
                <button 
                  onClick={() => playVoice(advisorNote)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${isSpeaking ? 'bg-amber-500 text-slate-900 animate-pulse' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                  {isSpeaking ? 'Escuchando...' : 'Escuchar Reporte'}
                </button>
              )}
            </div>

            {advisorNote ? (
              <div className="prose prose-invert max-w-none text-slate-300 space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {advisorNote.split('\n').map((line, i) => {
                  if (line.trim().startsWith('#')) return <h3 key={i} className="text-2xl font-black text-amber-500 mt-8 mb-4 border-l-4 border-amber-500 pl-4 uppercase italic">{line.replace(/#/g, '')}</h3>;
                  if (line.trim().startsWith('-') || line.trim().startsWith('*')) return <div key={i} className="flex gap-3 ml-2 text-slate-200"><span className="text-amber-500 font-bold">»</span><p>{line.substring(1).trim()}</p></div>;
                  return line.trim() ? <p key={i} className="leading-relaxed text-slate-400 font-medium">{line}</p> : null;
                })}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
                <div className="w-32 h-32 bg-slate-700/50 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-16 h-16 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
                </div>
                <h3 className="text-xl font-bold text-slate-400">Sin Inteligencia Activa</h3>
                <p className="text-sm italic mt-2">Introduce tus datos de mando para recibir órdenes.</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Chat de Consulta */}
      <div className={`fixed bottom-8 right-8 z-50 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${chatOpen ? 'w-full md:w-[500px] h-[700px] max-h-[90vh] scale-100 opacity-100' : 'w-20 h-20 scale-90 opacity-80'}`}>
        {!chatOpen ? (
          <button onClick={() => setChatOpen(true)} className="w-20 h-20 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-[2rem] shadow-[0_20px_40px_rgba(245,158,11,0.3)] flex items-center justify-center transition-all hover:-translate-y-2 group">
            <svg className="w-10 h-10 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 012 2h-5l-5 5v-5z"></path></svg>
          </button>
        ) : (
          <div className="bg-slate-900 border-2 border-slate-700 rounded-[2.5rem] shadow-2xl h-full flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-slate-800/80 p-5 flex justify-between items-center border-b border-slate-700">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20">
                  <svg className="w-7 h-7 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"></path></svg>
                </div>
                <div>
                  <h4 className="font-black text-white text-sm uppercase tracking-wider italic">Centro de Consultas</h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span>
                    <span className="text-[9px] text-green-500 font-black uppercase tracking-widest">General de Guardia</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setChatOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-900/50">
              {chatMessages.length === 0 && (
                <div className="text-center py-12 opacity-30 px-10">
                  <p className="text-sm font-bold uppercase tracking-widest leading-relaxed text-slate-500">
                    Estableciendo conexión encriptada... <br/> Haz tu pregunta, Comandante.
                  </p>
                </div>
              )}
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`relative max-w-[90%] p-4 rounded-3xl text-sm leading-relaxed shadow-lg ${msg.role === 'user' ? 'bg-amber-500 text-slate-900 font-bold rounded-tr-none' : 'bg-slate-800 text-slate-100 border border-slate-700 rounded-tl-none'}`}>
                    {msg.content}
                    {msg.role === 'assistant' && (
                      <button 
                        onClick={() => playVoice(msg.content)}
                        className="absolute -bottom-4 right-4 bg-slate-700 hover:bg-slate-600 p-2 rounded-full border border-slate-600 shadow-md text-amber-500"
                      >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3z"/></svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 p-5 rounded-3xl rounded-tl-none border border-slate-700 flex gap-2 items-center">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                      <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-6 bg-slate-800/50 border-t border-slate-700 flex gap-3 items-center">
              <input 
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Escribe tus órdenes..."
                className="flex-1 bg-slate-900 border-2 border-slate-700 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-amber-500 transition-all text-white placeholder-slate-600 font-medium"
              />
              <button type="submit" disabled={loading} className="bg-amber-500 hover:bg-amber-400 text-slate-900 p-4 rounded-2xl disabled:opacity-50 transition-all active:scale-90 shadow-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
              </button>
            </form>
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}</style>
    </div>
  );
};

export default App;
