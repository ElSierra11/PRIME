/**
 * Microservice: Referee AI Consultant (IFAB & COARC)
 * Provides technical and disciplinary referee analysis according to IFAB Laws of the Game 2024/2025/2026.
 * Zero-emoji professional output.
 */

const fs = require('fs');
const path = require('path');

// Knowledge base for rule-based instant offline consultation
const IFAB_PLAY_PATTERNS = [
  {
    keywords: ['fuera de juego', 'offside', 'despeje', 'deliberado', 'desvio', 'habilita', 'rebote'],
    technicalDecision: 'Gol concedido o continuar la jugada (según la acción deliberada del defensor) o Tiro Libre Indirecto si existió desvío involuntario.',
    disciplinaryAction: 'Ninguna.',
    restartPoint: 'Lugar de la reanudación correspondiente (o saque de centro tras gol).',
    ifabLaw: 'Regla 11 - El Fuera de Juego (Circular IFAB sobre Juego Deliberado vs Desvío)',
    detailedReasoning: 'La circular oficial de la IFAB establece que un jugador en posición de fuera de juego solo queda habilitado si el defensor realiza una "acción deliberada de jugar el balón". Para considerarse deliberada, el defensor debe tener visión clara, tiempo para coordinar su movimiento físico y no tratarse de un reflejo instintivo ante un remate violento. Si el defensor mide el balón y salta a rechazar de cabeza o con el pie, aunque su contacto sea imperfecto, se califica como juego deliberado y habilita al atacante. En contraste, si el balón simplemente rebota o se desvía sin tiempo de reacción, no es juego deliberado y se sanciona el fuera de juego con Tiro Libre Indirecto.'
  },
  {
    keywords: ['dogso', 'penal', 'area', 'sujecion', 'camiseta', 'doble castigo', 'ultimo hombre', 'manifiesta'],
    technicalDecision: 'Tiro Penal.',
    disciplinaryAction: 'Tarjeta Roja (Expulsión directa) si hubo sujeción, empujón o sin disputa de balón. Tarjeta Amarilla si existió intento genuino de disputar el balón.',
    restartPoint: 'Punto penal.',
    ifabLaw: 'Regla 12 - Faltas y Conducta Incorrecta (Sección 3: Ocasión Manifiesta de Gol / DOGSO)',
    detailedReasoning: 'La reforma de la IFAB contra el "triple castigo" (penal, expulsión y suspensión) dentro del área penal solo aplica cuando el infractor comete la falta disputando o intentando disputar el balón de forma genuina. En tales casos se desescala a Tarjeta Amarilla. No obstante, si la falta en DOGSO consiste en sujetar de la camiseta, empujar, zancadillear sin posibilidad de jugar la pelota o cometer una mano voluntaria, NO existe disputa del balón. En consecuencia, la sanción obligatoria es Tiro Penal y Tarjeta Roja directa.'
  },
  {
    keywords: ['mano', 'rebote', 'apoyo', 'silueta', 'voluntaria', 'cuerpo', 'natural'],
    technicalDecision: 'Continuar el juego (no es infracción) salvo que el brazo amplíe antinaturalmente la silueta sin justificación biomecánica.',
    disciplinaryAction: 'Ninguna sanción disciplinaria, a menos que detenga un tiro a puerta o una ocasión manifiesta de gol.',
    restartPoint: 'Continuación del juego o reanudación según proceda.',
    ifabLaw: 'Regla 12 - Faltas y Conducta Incorrecta (Sección 1: Contacto del balón con la mano o brazo)',
    detailedReasoning: 'No toda mano es infracción. La IFAB tipifica como contacto no punible cuando el balón procede directamente de la propia cabeza o cuerpo del defensor tras un despeje deliberado, siempre que el movimiento del brazo sea consecuencia natural del salto o equilibrio biomecánico. Asimismo, la mano de apoyo en el suelo al caer no se sanciona a menos que se extienda lateralmente para bloquear el paso de la pelota.'
  },
  {
    keywords: ['finta', 'penal', 'penalti', 'carrera', 'paradinha'],
    technicalDecision: 'Tiro Libre Indirecto para el equipo defensor. El gol, si se anotó, se anula.',
    disciplinaryAction: 'Tarjeta Amarilla (Amonestación) al ejecutor por conducta antideportiva.',
    restartPoint: 'Punto penal (o lugar exacto de la infracción según criterio arbitral).',
    ifabLaw: 'Regla 14 - El Tiro Penal (Infracciones durante la ejecución)',
    detailedReasoning: 'La IFAB autoriza fintas durante la carrera preparatoria hacia el balón. Sin embargo, realizar una finta para patear una vez concluida la carrera se considera una conducta antideportiva prohibida. Con independencia de si el balón ingresó o no en la portería, el tiro penal no se repite: se amonesta al pateador con Tarjeta Amarilla y se reanuda con Tiro Libre Indirecto para el equipo rival.'
  },
  {
    keywords: ['balon a tierra', 'rebote arbitro', 'toca al arbitro', 'gol arbitro'],
    technicalDecision: 'Balón a tierra.',
    disciplinaryAction: 'Ninguna.',
    restartPoint: 'Lugar donde el balón tocó al árbitro. Si ocurrió dentro del área penal, el balón a tierra se concede exclusivamente al guardameta defensor.',
    ifabLaw: 'Regla 9 - El Balón en Juego (Balón que toca a un miembro del equipo arbitral)',
    detailedReasoning: 'Si el balón toca a un árbitro y permanece en el terreno de juego pero genera cualquiera de estas tres consecuencias: (1) un equipo inicia un ataque prometedor, (2) entra directamente en la portería, o (3) cambia la posesión de equipo, el juego debe detenerse de inmediato y reanudarse con un balón a tierra para el equipo que tenía la posesión antes del impacto. Si el contacto ocurre dentro del área penal, se entrega siempre al portero defensor.'
  },
  {
    keywords: ['plancha', 'fuerza excesiva', 'canilla', 'espinilla', 'tacos', 'juego brusco grave'],
    technicalDecision: 'Tiro Libre Directo (o Tiro Penal si ocurrió en el área penal).',
    disciplinaryAction: 'Tarjeta Roja (Expulsión directa) por Juego Brusco Grave.',
    restartPoint: 'Lugar exacto del contacto antirreglamentario.',
    ifabLaw: 'Regla 12 - Faltas y Conducta Incorrecta (Juego Brusco Grave)',
    detailedReasoning: 'Cualquier entrada que ponga en peligro inminente la integridad física del adversario, o que sea ejecutada con fuerza excesiva o brutalidad (por ejemplo, tacos expuestos por delante a la altura de la tibia o rodilla con velocidad e intensidad), debe sancionarse como Juego Brusco Grave con expulsión inmediata mediante Tarjeta Roja.'
  }
];

class RefereeAIService {
  async consult({ question, context = {} }) {
    if (!question || typeof question !== 'string') {
      return { success: false, error: 'Pregunta requerida' };
    }

    const trimmedQuestion = question.trim();
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';

    // If Gemini API Key exists, query Gemini directly
    if (apiKey) {
      try {
        const geminiResponse = await this.queryGemini(trimmedQuestion, apiKey);
        if (geminiResponse) {
          return {
            success: true,
            provider: 'gemini',
            answer: geminiResponse
          };
        }
      } catch (err) {
        console.warn('Fallo consulta Gemini API, usando motor técnico local:', err.message);
      }
    }

    // Expert heuristic and knowledge model fallback
    const localAnswer = this.queryLocalKnowledge(trimmedQuestion);
    return {
      success: true,
      provider: 'ifab-engine',
      answer: localAnswer
    };
  }

  async queryGemini(question, apiKey) {
    const systemPrompt = `Eres el Consultor Técnico Oficial de Arbitraje IFAB para Alejo Sierra, árbitro de la corporación COARC.
Tu función es responder dudas reglamentarias sobre jugadas de fútbol con la máxima precisión según las Reglas de Juego 2024/2025/2026 de la IFAB.
Debes responder ESTRICTAMENTE en formato JSON válido con las siguientes propiedades:
{
  "technicalDecision": "Decisión técnica clara (ej. Tiro libre directo, Tiro penal, Indirecto, Balón a tierra)",
  "disciplinaryAction": "Sanción disciplinaria (ej. Ninguna, Tarjeta Amarilla, Tarjeta Roja)",
  "restartPoint": "Lugar y forma de reanudación",
  "ifabLaw": "Número y nombre de la regla IFAB aplicable",
  "detailedReasoning": "Explicación técnica detallada y fundamentada según circulares y directrices",
  "practicalAdvice": "Consejo de colocación, ángulo de visión o comunicación con asistentes para el árbitro"
}
REGLA CRÍTICA: NO USES NINGÚN EMOJI en ninguna parte del texto. Lenguaje técnico, conciso y profesional.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const payload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\nPregunta sobre la jugada: ${question}` }]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json'
      }
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`Gemini status ${res.status}`);
    }

    const data = await res.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (candidateText) {
      return JSON.parse(candidateText);
    }
    return null;
  }

  queryLocalKnowledge(question) {
    const qLower = question.toLowerCase();

    // Check matches in knowledge patterns
    for (const pattern of IFAB_PLAY_PATTERNS) {
      const match = pattern.keywords.some(kw => qLower.includes(kw));
      if (match) {
        return {
          technicalDecision: pattern.technicalDecision,
          disciplinaryAction: pattern.disciplinaryAction,
          restartPoint: pattern.restartPoint,
          ifabLaw: pattern.ifabLaw,
          detailedReasoning: pattern.detailedReasoning,
          practicalAdvice: 'Prioriza un ángulo de visión a 45 grados respecto a la disputa para evaluar contacto y trayectoria del balón.'
        };
      }
    }

    // Default professional technical response
    return {
      technicalDecision: 'Evaluación según contacto físico y trayectoria del balón.',
      disciplinaryAction: 'Amonestación si corta avance prometedor (SPA) o imprudencia; expulsión si emplea fuerza excesiva o malogra ocasión manifiesta (DOGSO).',
      restartPoint: 'Lugar donde se cometió la infracción.',
      ifabLaw: 'Regla 12 - Faltas y Conducta Incorrecta / Regla 5 - El Árbitro',
      detailedReasoning: `Para la situación planteada ("${question}"), el árbitro debe verificar: (1) si existió infracción técnica tipificada en la Regla 12, (2) si hubo disputa legítima del balón, (3) la intención o negligencia/temeridad del infractor, y (4) si procede la aplicación de ventaja para mantener el ritmo del partido.`,
      practicalAdvice: 'Verifica la señal y confirmación visual de tus árbitros asistentes antes de detener el juego si la jugada ocurre en zonas limítrofes.'
    };
  }
}

module.exports = new RefereeAIService();
