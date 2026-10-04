/**
 * Microservice: Referee & IFAB Laws of the Game Engine
 * Proporciona acceso estructurado a las 17 Reglas IFAB vigentes,
 * circulares y enmiendas recientes, así como escenarios tácticos visuales para arbitraje.
 */

const OFFICIAL_IFAB_VERSION = '2024/25';
const OFFICIAL_PORTAL_URL = 'https://www.theifab.com/laws/latest/';

const IFAB_UPDATES_AND_TRIALS = [
  {
    season: '2024/25 - 2025/26',
    title: 'Zona Exclusiva del Capitán con el Árbitro (Captain-Only Dialogue)',
    category: 'Regla 12 · Conducta',
    summary: 'Solo el capitán de cada equipo puede acercarse al árbitro central tras decisiones polémicas o de alta tensión.',
    details: 'Cualquier otro jugador que se acerque de forma agresiva, rodee o invada el espacio del árbitro debe ser amonestado con Tarjeta Amarilla por conducta antideportiva. Si el capitán es el arquero, debe designarse a un jugador de campo antes del inicio del encuentro.',
    ifabReference: 'Circular IFAB No. 27 & Directrices de Competición FIFA/UEFA/CONMEBOL'
  },
  {
    season: '2024/25',
    title: 'Mano Involuntaria y Penales (Doble Castigo atenuado)',
    category: 'Regla 12 · Faltas y Manos',
    summary: 'Aclaración precisa sobre manos no deliberadas que frustran ocasiones de gol dentro del área.',
    details: 'Si una mano accidental no deliberada sancionada con penal ocurre dentro del área sin constituir una conducta antideportiva manifiesta, se evita la amonestación a menos que haya habido una clara acción antideportiva de agrandar el cuerpo.',
    ifabReference: 'Regla 12.3 - Sanciones disciplinarias por mano'
  },
  {
    season: '2024/25 - Ensayos',
    title: 'Límite de Retención del Balón por el Guardameta (Regla de 8 Segundos)',
    category: 'Regla 12 · Guardameta',
    summary: 'Ensayos oficiales de IFAB para sustituir el tiro libre indirecto por un saque de esquina si el arquero retiene el balón más de 8 segundos.',
    details: 'El árbitro levanta su mano haciendo una cuenta regresiva visual de 5 a 0 segundos. Si el portero no despeja o juega el balón, se reanuda con saque de esquina (o saque de banda) a favor del adversario para agilizar el tiempo efectivo de juego.',
    ifabReference: 'IFAB Trial Protocols 2024/25'
  },
  {
    season: '2024/25',
    title: 'Sustituciones Adicionales por Conmoción Cerebral',
    category: 'Regla 3 · Los Jugadores',
    summary: 'Aprobación definitiva de la sustitución permanente adicional por conmoción cerebral.',
    details: 'Permite un cambio extra no contabilizado en las 5 sustituciones estándar si un jugador sufre un traumatismo craneoencefálico, priorizando su salud sin perjudicar numéricamente al equipo.',
    ifabReference: 'Regla 3.2 - Enmienda permanente IFAB'
  }
];

const VISUAL_SCENARIOS = [
  {
    id: 'offside-1',
    ruleNumber: 11,
    title: 'Fuera de Juego: Posición vs Interferencia Activa',
    description: 'Estar en posición de fuera de juego NO es infracción por sí solo. Se sanciona únicamente en el momento exacto en que el balón es tocado o jugado por un compañero si el jugador interfiere en el juego o en un adversario.',
    keyConcept: 'Momento de pase (Release point), Penúltimo defensor y Criterio de Interferencia.',
    subCases: [
      {
        id: 'play-ball',
        label: 'Interferir en el Juego',
        result: 'FUERA DE JUEGO SANCIONABLE',
        sanction: 'Tiro Libre Indirecto (IDFK)',
        detail: 'El atacante en posición adelantada toca o juega el balón que le fue pasado por su compañero.'
      },
      {
        id: 'interfere-opponent',
        label: 'Interferir a un Adversario',
        result: 'FUERA DE JUEGO SANCIONABLE',
        sanction: 'Tiro Libre Indirecto (IDFK)',
        detail: 'El atacante impide al portero ver la trayectoria del balón o le disputa físicamente el balón.'
      },
      {
        id: 'deliberate-play',
        label: 'Jugada Deliberada de un Defensor',
        result: 'HABILITADO (NO HAY FUERA DE JUEGO)',
        sanction: 'El juego continúa',
        detail: 'El defensor tiene tiempo y coordinación para despejar voluntariamente, pero pifia el balón hacia el delantero adelantado. La jugada deliberada del defensor habilita por completo al atacante.'
      },
      {
        id: 'save-deflection',
        label: 'Rebote o Salvada ("Save")',
        result: 'FUERA DE JUEGO SANCIONABLE',
        sanction: 'Tiro Libre Indirecto (IDFK)',
        detail: 'El defensor desvía instintivamente el balón o el arquero ataja un disparo (salvada). Si el rebote le queda al atacante adelantado, SÍ es fuera de juego.'
      }
    ]
  },
  {
    id: 'handball-1',
    ruleNumber: 12,
    title: 'Criterio de Manos: Silueta Natural vs Antinatural',
    description: 'La frontera anatómica es la axila (T-shirt line). Todo contacto con el hombro es juego legal. Del codo o antebrazo hacia abajo se evalúa la justificación del movimiento corporal.',
    keyConcept: 'Línea de la axila, Silueta antinatural, Apoyo en el suelo y Rebote propio.',
    subCases: [
      {
        id: 'unnatural-silhouette',
        label: 'Brazo Separado (Agrandar el cuerpo)',
        result: 'MANO SANCIONABLE',
        sanction: 'Tiro Libre Directo / Penal',
        detail: 'El brazo está separado del torso de forma no justificada por el movimiento del cuerpo del jugador.'
      },
      {
        id: 'support-arm',
        label: 'Brazo de Apoyo al Caer',
        result: 'NO SANCIONABLE (JUEGO LEGAL)',
        sanction: 'El juego continúa',
        detail: 'El jugador se desliza al piso y su mano apoya su cuerpo en el pasto sin extenderse deliberadamente.'
      },
      {
        id: 'self-deflection',
        label: 'Rebote de su Propio Pie o Cabeza',
        result: 'NO SANCIONABLE (JUEGO LEGAL)',
        sanction: 'El juego continúa',
        detail: 'El jugador cabecea o patea el balón y de forma inmediata e involuntaria este impacta su brazo en posición natural.'
      },
      {
        id: 'immediate-goal',
        label: 'Gol Inmediato tras Toque de Mano',
        result: 'GOL ANULADO SIEMPRE',
        sanction: 'Tiro Libre Directo para el rival',
        detail: 'Si un atacante marca gol directamente con la mano, o anota inmediatamente tras un contacto con su mano (incluso accidental), el gol se invalida.'
      }
    ]
  },
  {
    id: 'dogso-1',
    ruleNumber: 12,
    title: 'DOGSO vs SPA y Despenalización del Triple Castigo',
    description: 'DOGSO (Denying an Obvious Goal-Scoring Opportunity) requiere la concurrencia de las 4 "D". Dentro del área penal existe despenalización si hubo disputa legítima de balón.',
    keyConcept: 'Distancia, Dirección, Disposición del balón, Defensores + Disputa dentro del área.',
    subCases: [
      {
        id: 'dogso-inside-play',
        label: 'DOGSO Dentro del Área con Disputa',
        result: 'PENAL + TARJETA AMARILLA',
        sanction: 'Penal + Amarilla (Se evita la Roja)',
        detail: 'El defensor intenta barrer o disputar el balón limpiamente pero comete falta dentro del área penal. La IFAB rebaja la roja a amarilla para evitar triple castigo (penal + expulsión + suspensión).'
      },
      {
        id: 'dogso-inside-no-play',
        label: 'DOGSO Dentro del Área SIN Disputa',
        result: 'PENAL + TARJETA ROJA DIRECTA',
        sanction: 'Penal + Expulsión (Roja)',
        detail: 'Jalón de camiseta, empujón, patada sin balón o mano deliberada en la línea de gol dentro del área penal. NO hay reducción.'
      },
      {
        id: 'dogso-outside',
        label: 'DOGSO Fuera del Área Penal',
        result: 'TIRO LIBRE DIRECTO + ROJA DIRECTA',
        sanction: 'Tiro Libre Directo + Expulsión',
        detail: 'Cualquier infracción que corte una ocasión manifiesta de gol fuera del área penal es siempre Tarjeta Roja directa.'
      },
      {
        id: 'spa-foul',
        label: 'SPA (Ataque Prometedor)',
        result: 'FALTA + TARJETA AMARILLA',
        sanction: 'Tiro Libre Directo + Amarilla',
        detail: 'No cumple las 4 D completas, pero corta un contraataque o ataque prometedor con ventaja numérica.'
      }
    ]
  },
  {
    id: 'ball-in-out-1',
    ruleNumber: 9,
    title: 'Balón Dentro/Fuera de Juego y Gol Válido',
    description: 'El balón no está fuera de juego hasta que haya traspasado COMPLETAMENTE la línea de banda o meta, sea por el suelo o por el aire. Lo mismo aplica para conceder un gol.',
    keyConcept: 'Proyección esférica de la curvatura del balón sobre la línea de cal.',
    subCases: [
      {
        id: 'tangent-line',
        label: 'Curvatura Proyectada en la Línea',
        result: 'BALÓN EN JUEGO (NO ESTÁ AFUERA)',
        sanction: 'El juego continúa',
        detail: 'Aunque la base del balón toque el césped fuera de la línea, si la panza o curvatura superior del balón proyecta 1 milímetro sobre el borde de la línea, el balón sigue legalmente en juego.'
      },
      {
        id: 'complete-crossing',
        label: 'Traspaso del 100% de la Circunferencia',
        result: 'BALÓN FUERA / GOL VÁLIDO',
        sanction: 'Reanudación según corresponda',
        detail: 'El 100% del balón supera la línea de meta: ¡Es gol! O si supera la línea de banda: Saque de banda.'
      }
    ]
  },
  {
    id: 'penalty-1',
    ruleNumber: 14,
    title: 'El Tiro Penal: Procedimiento y Antirreglamentariedades',
    description: 'Ubicación del balón en el punto penal, guardameta sobre la línea, amagues permitidos y prohibidos, e invasión de área.',
    keyConcept: 'Pie del guardameta, Amague antirreglamentario (Feinting) e Invasión.',
    subCases: [
      {
        id: 'gk-position',
        label: 'Posición del Guardameta',
        result: 'LEGAL',
        sanction: 'Tiro válido',
        detail: 'El portero debe tener al menos una parte de cualquier pie tocando, o proyectada directamente sobre la línea de meta al momento del golpeo.'
      },
      {
        id: 'feinting-illegal',
        label: 'Amague Ilegal al Momento del Disparo',
        result: 'TIRO LIBRE INDIRECTO + AMARILLA',
        sanction: 'IDFK para el rival + Tarjeta Amarilla',
        detail: 'Amagar durante la carrera está permitido. Pero fingir el disparo una vez completada la carrera hacia el balón está prohibido por considerarse conducta antideportiva.'
      },
      {
        id: 'encroachment-attack',
        label: 'Invasión de Área por Atacante',
        result: 'SI MARCA: SE REPITE; SI FALLA: IDFK',
        sanction: 'Repetición o Tiro Libre Indirecto',
        detail: 'Un compañero del ejecutor entra al área o semicírculo antes del impacto del balón.'
      }
    ]
  }
];

class RefereeService {
  getIFABVersion() {
    return {
      version: OFFICIAL_IFAB_VERSION,
      officialPortalUrl: OFFICIAL_PORTAL_URL,
      apiNotice: 'La IFAB (International Football Association Board) no proporciona una API pública abierta. PRIME OS ofrece este microservicio estructurado con el texto reglamentario oficial 2024/25, circulares recientes y simulador visual.'
    };
  }

  getUpdates() {
    return {
      success: true,
      ifabVersion: OFFICIAL_IFAB_VERSION,
      updates: IFAB_UPDATES_AND_TRIALS
    };
  }

  getVisualScenarios() {
    return {
      success: true,
      ifabVersion: OFFICIAL_IFAB_VERSION,
      scenarios: VISUAL_SCENARIOS
    };
  }
}

module.exports = new RefereeService();
