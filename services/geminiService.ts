
import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";
import { AccountState, ChatMessage } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

const SYSTEM_INSTRUCTION = `
Eres un asesor experto de Rise of Kingdoms (RoK) con años de experiencia en el juego. 
Tu objetivo es ayudar al usuario a optimizar su cuenta basándote en su estado actual.
Conoces el meta actual (Season of Conquest, comandantes, equipo, emparejamientos).

Reglas de asesoría:
1. Analiza el VIP: Prioriza llegar a VIP 10, 12 y 14 para cabezas doradas.
2. Comandantes: Sugiere parejas basadas en su tipo de unidad principal y etapa de KvK.
3. Tecnología: Enfatiza la importancia de las investigaciones de combate (T4 vs T5).
4. Recursos: Aconseja sobre el uso de gemas (More than Gems event) y aceleradores.
5. Mantén un tono profesional pero cercano, como un líder de alianza veterano.
6. Habla siempre en español.
7. Si te preguntan sobre cosas fuera de RoK, redirige amablemente al juego.

Cuando el usuario te pase su estado, da un resumen de prioridades (TOP 3 acciones inmediatas).
`;

export const getAdvisorFeedback = async (state: AccountState): Promise<string> => {
  try {
    const prompt = `
    Analiza mi cuenta de Rise of Kingdoms:
    - Poder: ${state.power}
    - VIP: ${state.vip}
    - Civilización: ${state.civilization}
    - Unidad Principal: ${state.mainUnitType}
    - Etapa actual: ${state.kvkStage}
    - Gemas: ${state.gems}
    - Comandantes clave: ${state.commanders.map(c => `${c.name} (${c.level}, ${c.skills})`).join(", ")}
    
    ¿Qué debería priorizar ahora mismo para ser más competitivo?
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      }
    });

    return response.text || "Lo siento, no pude procesar la asesoría en este momento.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error al conectar con el asesor. Verifica tu conexión.";
  }
};

export const chatWithAdvisor = async (history: ChatMessage[], state: AccountState): Promise<string> => {
  try {
    const context = `Contexto de mi cuenta: Poder ${state.power}, VIP ${state.vip}, Civ ${state.civilization}, Unidad ${state.mainUnitType}, KvK ${state.kvkStage}.`;
    
    const contents = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    const lastMsg = contents[contents.length - 1];
    lastMsg.parts[0].text = `${context}\n\nPregunta del usuario: ${lastMsg.parts[0].text}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: contents as any,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.8,
      }
    });

    return response.text || "No recibí respuesta del asesor.";
  } catch (error) {
    console.error("Chat Error:", error);
    return "Hubo un problema procesando tu pregunta.";
  }
};

export const generateSpeech = async (text: string): Promise<string | undefined> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Responde con autoridad de comandante: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Puck' }, // Una voz con tono de autoridad
          },
        },
      },
    });

    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (error) {
    console.error("TTS Error:", error);
    return undefined;
  }
};
