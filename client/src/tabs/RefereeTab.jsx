import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  BookOpen,
  HelpCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Search,
  Sparkles,
  Award,
  ChevronRight,
  Eye,
  Filter,
  Zap,
  Target,
  FileText
} from 'lucide-react';
import { sounds } from '../utils/audio';
import { haptics } from '../utils/haptics';
import { useToast } from '../context/ToastContext';

// ─── 17 REGLAS IFAB CON CRITERIOS TÉCNICOS Y DISCIPLINARIOS ─────────────
const IFAB_LAWS = [
  {
    number: 1,
    title: 'El Terreno de Juego',
    category: 'structure',
    summary: 'Superficie, dimensiones, demarcación, áreas de meta, penal y técnica.',
    keyPoints: [
      'Líneas forman parte de las áreas que delimitan (la línea de gol y de penal es adentro).',
      'Postes y travesaño deben ser de color blanco o plateado y no poner en peligro la integridad física.',
      'El área técnica: solo una persona a la vez está autorizada para dar instrucciones tácticas.'
    ],
    fieldCriteria: 'Revisa redes, banderines y marcación 45 min antes del pitazo inicial. Si hay un charco o línea borrosa en el área penal, es prioridad corregirlo para evitar polémica de gol o penal.',
    sanction: 'Detención del juego para corregir desperfectos estructurales.'
  },
  {
    number: 2,
    title: 'El Balón',
    category: 'structure',
    summary: 'Propiedades, medidas, presión (0.6 - 1.1 atm) y sustitución de balón defectuoso.',
    keyPoints: [
      'Si el balón se desinfla o explota en juego: balón a tierra con un balón nuevo.',
      'Si se desinfla en un tiro penal sin haber tocado a un jugador o poste: se repite el tiro penal.'
    ],
    fieldCriteria: 'Lleva siempre al menos dos balones inflados a la misma presión. Nunca permitas balones de entrenamiento desinflados en torneos COARC.',
    sanction: 'Balón a tierra en el lugar donde se averió.'
  },
  {
    number: 3,
    title: 'Los Jugadores',
    category: 'structure',
    summary: 'Número de jugadores (mínimo 7), sustituciones, reingresos indebidos y brazalete de capitán.',
    keyPoints: [
      'Un jugador expulsado antes del saque inicial puede ser sustituido por un suplente nombrado.',
      'Si un suplente o miembro del cuerpo técnico entra sin permiso e interfiere: Tiro libre directo o penal + tarjeta amarilla o roja según DOGSO/infracción.',
      'El capitán tiene la responsabilidad de ayudar a mantener la conducta de su equipo.'
    ],
    fieldCriteria: 'Controla el número de sustituciones y ventanas según la categoría de COARC. Verifica que quien sale lo haga por el límite del terreno más cercano para evitar pérdida de tiempo deliberada.',
    sanction: 'Tiro libre directo/penal si un no autorizado interfiere; indirecto si entra sin interferir.'
  },
  {
    number: 4,
    title: 'El Equipamiento de los Jugadores',
    category: 'structure',
    summary: 'Seguridad obligatoria: canilleras, medias, calzado y prohibición absoluta de joyas.',
    keyPoints: [
      'Cero joyas (anillos, cadenas, aretes, piercings). Taparlos con cinta NO está permitido por IFAB.',
      'Canilleras cubiertas por las medias y de material adecuado para proteger.',
      'Calzas térmicas del mismo color principal de la pantaloneta.'
    ],
    fieldCriteria: 'La inspección de canilleras y joyas antes de salir al campo es tu seguro de vida arbitral. Un corte por arete en una jugada es responsabilidad directa del cuerpo arbitral.',
    sanction: 'Jugador debe abandonar el terreno para corregir su indumentaria.'
  },
  {
    number: 5,
    title: 'El Árbitro',
    category: 'game',
    summary: 'Autoridad total, toma de decisiones, ley de la ventaja y control disciplinario.',
    keyPoints: [
      'Las decisiones sobre hechos de juego son definitivas.',
      'Ley de la Ventaja: Esperar 2 a 3 segundos antes de pitar si el equipo afectado mantiene posesión y progresión prometedora.',
      'Si la infracción era merecedora de Tarjeta Roja por Juego Brusco Grave y concedes ventaja: la expulsión se realiza en la siguiente interrupción, pero el infractor NO puede intervenir en la jugada.'
    ],
    fieldCriteria: 'Usa modulación del silbato (silbato corto para faltas simples, silbato fuerte y largo para faltas tácticas o tarjetas). Comunicación corporal firme y asertiva.',
    sanction: 'Gestión disciplinaria de amonestaciones y expulsiones.'
  },
  {
    number: 6,
    title: 'Los Otros Miembros del Equipo Arbitral',
    category: 'game',
    summary: 'Árbitros asistentes (banderín), cuarto árbitro y comunicación en equipo.',
    keyPoints: [
      'Asistente prioriza fueras de juego, balones fuera de banda/meta/esquina y faltas cerca a su cuadrante.',
      'Contacto visual permanente árbitro central - asistente antes de reanudar tras cada jugada dudosa.',
      'El cuarto árbitro gestiona las áreas técnicas, sustituciones y el tiempo añadido.'
    ],
    fieldCriteria: 'En la charla técnica previa con tus asistentes de COARC, define claramente: "Si la falta es en mi espalda o a 5 metros de tu línea, tómala tú con decisión".',
    sanction: 'Asistencia consultiva y señalamientos con banderola.'
  },
  {
    number: 7,
    title: 'La Duración del Partido',
    category: 'game',
    summary: 'Dos periodos de 45 minutos (o según torneo formativo) y recuperación de tiempo perdido.',
    keyPoints: [
      'Tiempo añadido se computa por: sustituciones, atención de lesiones, pérdidas de tiempo deliberadas, celebraciones y demoras del VAR/revisión.',
      'Se puede aumentar el tiempo añadido anunciado, pero NUNCA reducirlo.',
      'Pausas de hidratación (máx 1 min) vs pausas de refresco (máx 3 min).'
    ],
    fieldCriteria: 'Lleva cronómetro dual (tiempo corrido y tiempo efectivo). No permitas que el equipo que va ganando queme los últimos minutos simulando lesiones en la esquina.',
    sanction: 'Prolongación exacta del tiempo perdido.'
  },
  {
    number: 8,
    title: 'El Inicio y la Reanudación del Juego',
    category: 'restarts',
    summary: 'Saque inicial y procedimiento de balón a tierra.',
    keyPoints: [
      'Saque inicial: el balón puede patearse en cualquier dirección.',
      'Balón a tierra en el área penal: se entrega SIEMPRE al guardameta defensor.',
      'Balón a tierra fuera del área penal: se entrega al equipo que tocó por última vez el balón en el punto del último toque. Todos los demás a mínimo 4 metros.'
    ],
    fieldCriteria: 'Si el balón pega en ti (el árbitro) y: a) inicia un ataque prometedor, b) entra en el arco, o c) cambia la posesión de equipo ➜ ¡Detén el juego y da balón a tierra!',
    sanction: 'Balón a tierra con protocolo estricto de 4 metros.'
  },
  {
    number: 9,
    title: 'El Balón en Juego o Fuera de Juego',
    category: 'game',
    summary: 'Límites del terreno y toque involuntario en miembros arbitrales.',
    keyPoints: [
      'El balón está fuera cuando ha rebasado COMPLETAMENTE la línea de banda o meta, por aire o tierra.',
      'El balón sigue en juego si rebota en un poste, travesaño o banderín y permanece dentro.',
      'Si toca al árbitro y no hay cambio de posesión ni ataque prometedor, el juego continúa.'
    ],
    fieldCriteria: 'Entrena tu visión periférica: el 99% de un balón que cruza la línea todavía se considera adentro; debe pasar el 100% de la circunferencia.',
    sanction: 'Saque de banda, meta, esquina o balón a tierra según corresponda.'
  },
  {
    number: 10,
    title: 'El Resultado de un Partido',
    category: 'game',
    summary: 'Concesión de gol y tanda de penales para desempate.',
    keyPoints: [
      'Gol válido: cuando el balón rebasa completamente la línea de meta entre los postes y bajo el travesaño.',
      'Tanda de penales: solo participan jugadores elegibles en el campo al final del partido (principio de igualdad de número si un equipo tiene menos jugadores).'
    ],
    fieldCriteria: 'En tandas de penales, anota el orden de los tiradores y comunica claramente a los arqueros la exigencia del pie en la línea.',
    sanction: 'Validación de gol o tanda de penales.'
  },
  {
    number: 11,
    title: 'El Fuera de Juego (Offside)',
    category: 'fouls',
    summary: 'Posición vs Infracción, interferir en el juego, interferir a un rival y sacar ventaja.',
    keyPoints: [
      'Estar en posición adelantada NO es infracción por sí solo.',
      'Manos y brazos NO se consideran para determinar posición de fuera de juego.',
      'Juego Deliberado (Deliberate Play): Si un defensor juega el balón teniendo tiempo, visión clara y control corporal, HABILITA al atacante que estaba adelantado.',
      'Desvío involuntario (Deflection) o salvada (Save): NO habilita al atacante.'
    ],
    fieldCriteria: '¡Clave COARC!: Diferencia siempre entre un defensor que "intenta jugar el balón voluntariamente aunque le pegue mal" (juego deliberado ➜ no hay offside) y un defensor al que "el balón le rebota instintivamente sin tiempo de reacción" (desvío ➜ sí hay offside).',
    sanction: 'Tiro libre indirecto desde el punto de la infracción.'
  },
  {
    number: 12,
    title: 'Faltas y Conducta Incorrecta',
    category: 'fouls',
    summary: 'Tiros libres directos/indirectos, gradación de faltas, manos, DOGSO, SPA y tarjetas.',
    keyPoints: [
      'Gradación: Imprudente (sin tarjeta) | Temeraria (Tarjeta Amarilla) | Fuerza Excesiva (Tarjeta Roja directa).',
      'Manos: Brazo en posición antinatural ocupando más espacio de forma injustificada por el movimiento del cuerpo.',
      'DOGSO dentro del área penal: Si se comete buscando el balón o disputándolo ➜ se degrada a Tarjeta Amarilla + Penal.',
      'DOGSO con sujeción, empuje o sin opción de balón en el área ➜ Tarjeta Roja directa + Penal.',
      'SPA (Detener ataque prometedor) ➜ Tarjeta Amarilla.'
    ],
    fieldCriteria: 'Aplica el test de las 4D para DOGSO: Distancia al arco, Dirección del ataque, Disposición/control del balón y Defensores disponibles. Si falta uno de los 4, es SPA (amarilla) y no DOGSO.',
    sanction: 'Tiro libre directo, indirecto, penal y medidas disciplinarias (Amarilla/Roja).'
  },
  {
    number: 13,
    title: 'Tiros Libres',
    category: 'restarts',
    summary: 'Directos e indirectos, barrera de 3 o más defensores y distancia reglamentaria de 9.15 m.',
    keyPoints: [
      'Tiro libre indirecto: el árbitro debe mantener un brazo alzado hasta que el balón toque a otro jugador o salga del juego.',
      'Si una barrera tiene 3 o más defensores: todos los atacantes deben estar a mínimo 1 metro de distancia de la barrera.',
      'Auto-pase no permitido: si el ejecutor toca el balón dos veces antes de que otro lo toque ➜ tiro libre indirecto.'
    ],
    fieldCriteria: 'Usa el spray con firmeza a los 9.15 metros contando tus pasos calibrados. Amonesta si un rival adelanta la barrera deliberadamente tras advertencia.',
    sanction: 'Tiro libre directo o indirecto; amonestación si no respetan distancia.'
  },
  {
    number: 14,
    title: 'El Tiro Penal',
    category: 'restarts',
    summary: 'Procedimiento, adelantamiento del guardameta e invasión de área.',
    keyPoints: [
      'El arquero debe tener al menos un pie en la línea o tocándola al momento del impacto.',
      'Fintas en la carrera permitidas; fintas antirreglamentarias al momento exacto de patear ➜ Tiro libre indirecto + Tarjeta Amarilla al pateador.',
      'Invasión defensiva con atajada del arquero ➜ se repite el tiro.',
      'Invasión atacante con gol ➜ se repite el tiro.',
      'Invasión atacante sin gol ➜ Tiro libre indirecto para la defensa.'
    ],
    fieldCriteria: 'Posiciónate entre el punto penal y el borde del área chica, con vista diagonal clara a la línea de gol y a la línea del área penal para controlar adelantamiento e invasión.',
    sanction: 'Penal, repetición o tiro libre indirecto según tabla de infracciones.'
  },
  {
    number: 15,
    title: 'El Saque de Banda',
    category: 'restarts',
    summary: 'Ejecución con ambas manos, por detrás de la cabeza, pies sobre o detrás de la línea.',
    keyPoints: [
      'No se puede marcar gol directamente de un saque de banda.',
      'Los adversarios deben estar a mínimo 2 metros del punto de saque.',
      'Si el ejecutor hace doble toque antes de que otro lo toque ➜ Tiro libre indirecto.'
    ],
    fieldCriteria: 'Controla que no ganen 10 metros avanzando ilegalmente. Si sacan mal (mal saque de banda con los pies levantados) ➜ pasa la posesión al rival.',
    sanction: 'Posesión pasa al adversario o tiro libre indirecto por doble toque.'
  },
  {
    number: 16,
    title: 'El Saque de Meta',
    category: 'restarts',
    summary: 'Ejecución desde cualquier punto del área de meta. Balón en juego tan pronto es pateado.',
    keyPoints: [
      'El balón está en juego desde que se patea y se mueve (no necesita salir del área penal).',
      'Los rivales deben estar fuera del área penal hasta que el balón esté en juego.',
      'Si un rival está dentro del área antes del saque y disputa el balón antes de que salga o se toque ➜ se repite el saque de meta.'
    ],
    fieldCriteria: 'Se puede marcar gol directo a favor en saque de meta, pero nunca autogol directo (si entra en propia meta sería tiro de esquina).',
    sanction: 'Repetición del saque de meta si hay invasión adelantada.'
  },
  {
    number: 17,
    title: 'El Saque de Esquina',
    category: 'restarts',
    summary: 'Colocación en el cuadrante de esquina, bandera obligatoria y distancia de 9.15 m.',
    keyPoints: [
      'El balón debe estar dentro o tocando la línea del cuadrante de esquina.',
      'Rivales a mínimo 9.15 m del cuadrante.',
      'Se puede anotar gol olímpico directo desde el tiro de esquina.'
    ],
    fieldCriteria: 'Ubícate en la diagonal del área chica hacia el punto penal vigilando empujones y sujeciones antes de que salga el balón.',
    sanction: 'Gol directo válido; tiro libre indirecto por doble toque.'
  }
];

// ─── BANCO DE CASOS PRÁCTICOS & SIMULADOR DE JUICIO ARBITRAL ────────────
const REFEREE_CASES = [
  {
    id: 'case-1',
    category: 'Regla 11 · Fuera de Juego',
    title: 'Despeje fallido del defensor con delantero adelantado',
    situation: 'Un delantero se encuentra en posición de fuera de juego cuando su compañero filtra un balón largo. Un defensor retrocede con visión clara, mide el balón y salta para rechazar de cabeza, pero roza levemente el balón y este le cae al delantero adelantado, quien anota.',
    question: '¿Cuál es la decisión reglamentaria correcta según la circular IFAB?',
    options: [
      { text: 'Conceder el gol. El defensor realizó una acción deliberada de jugar el balón y por tanto habilitó al delantero.', isCorrect: true },
      { text: 'Anular el gol por fuera de juego. El defensor no controló el balón, fue solo un toque defectuoso.', isCorrect: false },
      { text: 'Balón a tierra con el arquero por interferencia en la trayectoria.', isCorrect: false },
      { text: 'Anular el gol y amonestar al delantero por actitud antideportiva.', isCorrect: false }
    ],
    explanation: 'Según la aclaración oficial de la IFAB sobre "juego deliberado", cuando un defensor intenta jugar el balón teniendo visión clara, tiempo para coordinar su movimiento y no siendo un disparo violento e imprevisto, se considera acción deliberada aunque el contacto sea defectuoso. Por tanto, HABILITA al atacante.'
  },
  {
    id: 'case-2',
    category: 'Regla 12 · DOGSO en el Área Penal',
    title: 'Doble castigo: Sujeción en ocasión manifiesta de gol',
    situation: 'Un delantero escapa solo frente al guardameta rival dentro del área penal. Un defensor que corre detrás de él, al verse superado y sin opción de jugar el balón, lo sujeta fuertemente de la camiseta derribándolo antes de que pueda rematar.',
    question: '¿Qué sanción técnica y disciplinaria debes aplicar?',
    options: [
      { text: 'Tiro penal + Tarjeta Amarilla (desdoble por ocurrir dentro del área).', isCorrect: false },
      { text: 'Tiro penal + Tarjeta Roja directa (DOGSO sin disputa de balón).', isCorrect: true },
      { text: 'Tiro libre indirecto + Tarjeta Amarilla por sujeción táctica.', isCorrect: false },
      { text: 'Tiro penal sin tarjeta disciplinaria.', isCorrect: false }
    ],
    explanation: 'La regla de eliminación del "doble castigo" (degradar de roja a amarilla) solo aplica si la falta dentro del área penal fue disputando el balón o con intención de jugarlo. Al ser una SUJECIÓN, jaloneo o empujón sin opción de balón, se mantiene la TARJETA ROJA DIRECTA por DOGSO + Tiro Penal.'
  },
  {
    id: 'case-3',
    category: 'Regla 12 · Manos',
    title: 'Rebote del propio cuerpo hacia el brazo',
    situation: 'Un defensor salta a cabecear un centro rival. Impacta el balón limpiamente con su cabeza, pero el balón desciende y pega inmediatamente en su brazo que estaba semiabierto por el impulso natural del salto.',
    question: '¿Cómo debes sancionar la jugada?',
    options: [
      { text: 'No es infracción (juega). El balón proviene directamente de su propia cabeza tras un contacto deliberado y el brazo está justificado por el salto.', isCorrect: true },
      { text: 'Tiro penal inmediato. Toda mano separada del cuerpo se sanciona sin excepción.', isCorrect: false },
      { text: 'Tiro libre indirecto por mano involuntaria peligrosa.', isCorrect: false },
      { text: 'Balón a tierra para reiniciar la acción.', isCorrect: false }
    ],
    explanation: 'No es infracción cuando el balón proviene directamente de la cabeza o cuerpo del propio jugador tras un despeje voluntario, siempre y cuando la posición de los brazos sea una consecuencia natural y biomecánicamente justificada del movimiento o salto del cuerpo.'
  },
  {
    id: 'case-4',
    category: 'Regla 14 · Tiro Penal',
    title: 'Finta ilegal al finalizar la carrera',
    situation: 'El ejecutor de un tiro penal inicia su carrera, frena un instante en el recorrido (permitido), pero al llegar a la pelota finge patear con el pie derecho, engaña completamente al arquero que se lanza a un lado, y luego empuja el balón a la red.',
    question: '¿Qué decisión debe tomar el árbitro?',
    options: [
      { text: 'Gol válido porque las fintas están autorizadas.', isCorrect: false },
      { text: 'Se repite el tiro penal y se advierte verbalmente al ejecutor.', isCorrect: false },
      { text: 'Anular el gol, Tiro Libre Indirecto para la defensa + Tarjeta Amarilla al ejecutor.', isCorrect: true },
      { text: 'Balón a tierra en el punto penal.', isCorrect: false }
    ],
    explanation: 'Hacer una finta para engañar al guardameta una vez completada la carrera hacia el balón se considera una conducta antideportiva explícita (Regla 14). El gol se anula, se reanuda con Tiro Libre Indirecto para el adversario y se amonesta con Tarjeta Amarilla al ejecutor.'
  },
  {
    id: 'case-5',
    category: 'Regla 12 · Faltas Graves',
    title: 'Plancha con fuerza excesiva en disputa de balón',
    situation: 'Dos jugadores disputan un balón dividido. Uno de ellos llega antes, pero el rival entra con la pierna completamente estirada, tacos hacia adelante a la altura de la espinilla del adversario, impactándolo con velocidad e intensidad extrema.',
    question: '¿Cuál es la tipificación técnica y sanción disciplinaria?',
    options: [
      { text: 'Falta temeraria: Tiro libre directo + Tarjeta Amarilla.', isCorrect: false },
      { text: 'Juego Brusco Grave (Fuerza Excesiva): Tiro libre directo + Tarjeta Roja directa.', isCorrect: true },
      { text: 'Falta imprudente: Tiro libre directo sin tarjeta.', isCorrect: false },
      { text: 'Conducta violenta: Balón a tierra + Tarjeta Roja.', isCorrect: false }
    ],
    explanation: 'Tacos por delante a la altura de la canilla con pierna extendida y velocidad pone en peligro inminente la integridad física del adversario. La IFAB tipifica esto como Juego Brusco Grave (Fuerza Excesiva), cuya sanción obligatoria es Tarjeta Roja directa.'
  },
  {
    id: 'case-6',
    category: 'Regla 11 · Fuera de Juego',
    title: 'Interferir en el adversario tapando la visión del guardameta',
    situation: 'Un delantero en posición de fuera de juego se encuentra parado a 2 metros del arquero, directamente en su línea visual. Un compañero del delantero dispara desde fuera del área y el balón entra al arco sin que el delantero en offside toque la pelota.',
    question: '¿Qué debe sancionar el árbitro?',
    options: [
      { text: 'Gol válido porque el delantero nunca tocó el balón.', isCorrect: false },
      { text: 'Anular el gol por Fuera de Juego: interfirió en el adversario al obstruir claramente su campo visual.', isCorrect: true },
      { text: 'Balón a tierra con el guardameta.', isCorrect: false },
      { text: 'Se repite la jugada desde fuera del área.', isCorrect: false }
    ],
    explanation: 'La Regla 11 sanciona el fuera de juego cuando un atacante en posición adelantada "interfiere en un adversario", lo cual incluye explícitamente impedir que juegue o pueda jugar el balón al obstruir claramente su campo visual.'
  },
  {
    id: 'case-7',
    category: 'Regla 8 · Balón a Tierra',
    title: 'Balón golpea al árbitro y cambia de dueño',
    situation: 'El equipo blanco tiene el balón en la mitad de la cancha armando un contragolpe. El pase choca contra la espalda del árbitro central y el rebote le queda directamente al delantero del equipo azul, que queda con opción de ataque.',
    question: '¿Cómo debe actuar el árbitro?',
    options: [
      { text: 'Dejar seguir. El árbitro es considerado "aire" o parte del campo.', isCorrect: false },
      { text: 'Detener el juego inmediatamente y conceder un Balón a Tierra para el equipo blanco.', isCorrect: true },
      { text: 'Pitar falta en contra del jugador que pateó el balón hacia el árbitro.', isCorrect: false },
      { text: 'Conceder saque de banda para el equipo blanco.', isCorrect: false }
    ],
    explanation: 'Desde la modificación de la IFAB a la Regla 8, el árbitro ya NO es "aire". Si el balón toca al árbitro y cambia la posesión de equipo, o inicia un ataque prometedor, o entra a gol, se DEBE detener el juego y dar balón a tierra al equipo que tenía la posesión en el punto del impacto.'
  },
  {
    id: 'case-8',
    category: 'Regla 12 · SPA vs Ventaja',
    title: 'Ataque prometedor con ventaja que termina en gol',
    situation: 'Un mediocampista sujeta de la camiseta a un rival para cortar un ataque prometedor (SPA). El árbitro aplica la ley de la ventaja porque el balón le queda a un compañero que avanza y remata anotando gol.',
    question: '¿Debe el árbitro amonestar al infractor con tarjeta amarilla tras el gol?',
    options: [
      { text: 'Sí, toda falta táctica se amonesta obligatoriamente tras la ventaja.', isCorrect: false },
      { text: 'No. Al haberse concretado el ataque prometedor con el gol, desaparece la justificación de la tarjeta amarilla por SPA.', isCorrect: true },
      { text: 'Debe expulsarlo con tarjeta roja.', isCorrect: false },
      { text: 'Depende de si el capitán rival lo solicita.', isCorrect: false }
    ],
    explanation: 'Si el árbitro concede ventaja tras una infracción que evitaba un ataque prometedor (SPA) y la jugada culmina directamente en gol, NO se muestra tarjeta amarilla por SPA porque el objetivo de la infracción (frustrar el ataque) no se consumó. Solo se amonestaría si la falta hubiese sido temeraria.'
  }
];

export default function RefereeTab() {
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState('laws'); // 'laws' | 'cases' | 'cheatsheet' | 'flashcards'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLaw, setSelectedLaw] = useState(IFAB_LAWS[10]); // Regla 11 por defecto
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Simulator Quiz state
  const [currentCaseIndex, setCurrentCaseIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);

  // Flashcards state
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Filtered Laws
  const filteredLaws = useMemo(() => {
    return IFAB_LAWS.filter((law) => {
      const matchesCat = categoryFilter === 'all' || law.category === categoryFilter;
      const matchesSearch =
        law.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        law.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        law.fieldCriteria.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [categoryFilter, searchQuery]);

  const currentCase = REFEREE_CASES[currentCaseIndex];

  const handleSelectOption = (idx) => {
    if (hasAnswered) return;
    setSelectedOption(idx);
    setHasAnswered(true);
    setTotalAnswered(prev => prev + 1);

    const isCorrect = currentCase.options[idx].isCorrect;
    if (isCorrect) {
      setQuizScore(prev => prev + 1);
      sounds.playSuccessChime();
      haptics.seriesDone();
      toast.success({
        title: '¡Decisión Arbitral Correcta!',
        message: 'Has aplicado con precisión el criterio IFAB.'
      });
    } else {
      sounds.playAlarmBeep();
      haptics.alarmVibration();
      toast.error({
        title: 'Criterio Incorrecto',
        message: 'Revisa la fundamentación reglamentaria de la jugada.'
      });
    }
  };

  const handleNextCase = () => {
    setSelectedOption(null);
    setHasAnswered(false);
    setCurrentCaseIndex((prev) => (prev + 1) % REFEREE_CASES.length);
  };

  const handleResetQuiz = () => {
    setCurrentCaseIndex(0);
    setSelectedOption(null);
    setHasAnswered(false);
    setQuizScore(0);
    setTotalAnswered(0);
    toast.info({
      title: 'Simulador reiniciado',
      message: 'Comienza una nueva serie de jugadas polémicas.'
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Tab Header Banner */}
      <section className="bg-surface border border-border p-5 sm:p-6 rounded-2xl shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-xs shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-text tracking-tight">
                  Reglamento IFAB & Arbitraje COARC
                </h1>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  OFICIAL
                </span>
              </div>
              <p className="text-xs sm:text-sm text-text-muted mt-0.5">
                Domina las 17 reglas del fútbol, criterios de interpretación, DOGSO, manos y juicio en campo.
              </p>
            </div>
          </div>

          {/* Quick Score Badge if in quiz */}
          <div className="flex items-center gap-2 bg-surface-2 px-3.5 py-2 rounded-xl border border-border self-start sm:self-auto shadow-2xs">
            <Award className="w-4 h-4 text-emerald-400" />
            <div className="text-right text-xs">
              <span className="text-text-muted block text-[10px]">Aciertos en Simulador:</span>
              <span className="font-mono font-black text-text">
                {quizScore} / {totalAnswered || 0} ({totalAnswered ? Math.round((quizScore / totalAnswered) * 100) : 0}%)
              </span>
            </div>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-4 mt-4 border-t border-border no-scrollbar">
          <button
            onClick={() => setActiveSection('laws')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeSection === 'laws'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-xs'
                : 'bg-surface-2 text-text-muted hover:text-text hover:bg-surface border border-border'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Las 17 Reglas IFAB
          </button>

          <button
            onClick={() => setActiveSection('cases')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeSection === 'cases'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-xs'
                : 'bg-surface-2 text-text-muted hover:text-text hover:bg-surface border border-border'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Simulador de Juicio Arbitral
          </button>

          <button
            onClick={() => setActiveSection('cheatsheet')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeSection === 'cheatsheet'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-xs'
                : 'bg-surface-2 text-text-muted hover:text-text hover:bg-surface border border-border'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            Criterios Clave (Chuleta de Campo)
          </button>

          <button
            onClick={() => setActiveSection('flashcards')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeSection === 'flashcards'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-xs'
                : 'bg-surface-2 text-text-muted hover:text-text hover:bg-surface border border-border'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Flashcards Pre-Partido
          </button>
        </div>
      </section>

      {/* ─── SECTION 1: LAS 17 REGLAS IFAB ────────────────────────── */}
      {activeSection === 'laws' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Law List & Filter */}
          <div className="lg:col-span-5 space-y-3">
            {/* Search and Category filter */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Buscar regla, palabra clave (mano, DOGSO, fuera de juego)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-surface border border-border text-text text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 shadow-2xs"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {[
                  { id: 'all', label: 'Todas (17)' },
                  { id: 'fouls', label: 'Faltas y Offside' },
                  { id: 'game', label: 'Árbitro y Juego' },
                  { id: 'restarts', label: 'Reanudaciones' },
                  { id: 'structure', label: 'Estructura' }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryFilter(cat.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap border transition-all ${
                      categoryFilter === cat.id
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : 'bg-surface-2 text-text-muted border-border hover:text-text'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* List of Laws */}
            <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
              {filteredLaws.map((law) => {
                const isSelected = selectedLaw.number === law.number;
                return (
                  <button
                    key={law.number}
                    onClick={() => {
                      setSelectedLaw(law);
                      sounds.playToastChime();
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500/40 shadow-xs ring-1 ring-emerald-500/30'
                        : 'bg-surface border-border hover:bg-surface-2 hover:border-border/80'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                        isSelected ? 'bg-emerald-500 text-slate-950' : 'bg-surface-2 text-text-muted'
                      }`}>
                        {law.number}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-text truncate">
                          Regla {law.number} · {law.title}
                        </div>
                        <div className="text-[11px] text-text-muted truncate mt-0.5">
                          {law.summary}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? 'text-emerald-400 translate-x-0.5' : 'text-text-muted'}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Law Detail View */}
          <div className="lg:col-span-7">
            <div className="bg-surface border border-border rounded-2xl p-5 sm:p-6 shadow-xs space-y-5 sticky top-20">
              {/* Header */}
              <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500 text-slate-950 font-black text-lg flex items-center justify-center shadow-xs">
                    {selectedLaw.number}
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">
                      Regla Oficial IFAB
                    </span>
                    <h2 className="text-lg sm:text-xl font-extrabold text-text">
                      Regla {selectedLaw.number}: {selectedLaw.title}
                    </h2>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="p-3.5 rounded-xl bg-surface-2 border border-border text-xs text-text leading-relaxed">
                <span className="font-bold text-emerald-400 block mb-1">Concepto General:</span>
                {selectedLaw.summary}
              </div>

              {/* Key Points */}
              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-text flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Aspectos Reglamentarios Fundamentales
                </h3>
                <ul className="space-y-2 text-xs text-text-muted">
                  {selectedLaw.keyPoints.map((pt, i) => (
                    <li key={i} className="flex items-start gap-2 bg-surface-2/40 p-2.5 rounded-lg border border-border/60">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                      <span className="text-text">{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Field Criteria for COARC */}
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-black text-emerald-300">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  Criterio Práctico en Cancha (Lo que evalúa COARC):
                </div>
                <p className="text-xs text-emerald-200/90 leading-relaxed">
                  {selectedLaw.fieldCriteria}
                </p>
              </div>

              {/* Technical & Disciplinary Sanction */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-2 border border-border text-xs">
                <span className="font-bold text-text-muted">Sanción Técnica / Reanudación:</span>
                <span className="font-bold text-text">{selectedLaw.sanction}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── SECTION 2: SIMULADOR DE JUICIO ARBITRAL (QUIZ) ─────────── */}
      {activeSection === 'cases' && (
        <div className="max-w-3xl mx-auto space-y-5">
          <div className="bg-surface border border-border p-5 sm:p-7 rounded-2xl shadow-xs space-y-5">
            {/* Case Progress Bar */}
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4" /> Caso {currentCaseIndex + 1} de {REFEREE_CASES.length}
              </span>
              <span className="text-text-muted text-[11px] font-mono">
                {currentCase.category}
              </span>
            </div>

            <div className="w-full bg-surface-2 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-1.5 transition-all duration-300 rounded-full"
                style={{ width: `${((currentCaseIndex + 1) / REFEREE_CASES.length) * 100}%` }}
              />
            </div>

            {/* Situation Card */}
            <div className="space-y-3">
              <h2 className="text-lg sm:text-xl font-black text-text">
                {currentCase.title}
              </h2>

              <div className="p-4 rounded-xl bg-surface-2 border border-border text-xs sm:text-sm text-text leading-relaxed">
                <span className="font-bold text-text-muted block text-xs mb-1 uppercase tracking-wider">
                  Situación en el campo:
                </span>
                {currentCase.situation}
              </div>

              <p className="text-xs sm:text-sm font-bold text-emerald-400 pt-1">
                ❓ {currentCase.question}
              </p>
            </div>

            {/* Multiple Choice Options */}
            <div className="space-y-2.5 pt-2">
              {currentCase.options.map((opt, idx) => {
                const isSelected = selectedOption === idx;
                let btnStyle = 'bg-surface border-border hover:bg-surface-2 hover:border-emerald-500/50 text-text';

                if (hasAnswered) {
                  if (opt.isCorrect) {
                    btnStyle = 'bg-emerald-500/15 border-emerald-500 text-emerald-300 font-bold ring-1 ring-emerald-500';
                  } else if (isSelected && !opt.isCorrect) {
                    btnStyle = 'bg-red-500/15 border-red-500 text-red-300 font-bold ring-1 ring-red-500';
                  } else {
                    btnStyle = 'bg-surface/50 border-border/50 text-text-muted opacity-60';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(idx)}
                    disabled={hasAnswered}
                    className={`w-full p-3.5 sm:p-4 rounded-xl border text-left text-xs sm:text-sm transition-all flex items-start justify-between gap-3 ${btnStyle}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-lg bg-surface-2 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span>{opt.text}</span>
                    </div>

                    {hasAnswered && opt.isCorrect && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    )}
                    {hasAnswered && isSelected && !opt.isCorrect && (
                      <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Answer Feedback & Technical Explanation */}
            <AnimatePresence>
              {hasAnswered && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-surface-2 border border-border space-y-2 mt-4"
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-black uppercase text-emerald-400 tracking-wider">
                      Fundamentación Reglamentaria IFAB:
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-text leading-relaxed">
                    {currentCase.explanation}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <button
                onClick={handleResetQuiz}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-text-muted hover:text-text hover:bg-surface-2 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reiniciar Test
              </button>

              {hasAnswered && (
                <button
                  onClick={handleNextCase}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-colors shadow-xs"
                >
                  Siguiente Jugada
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── SECTION 3: CRITERIOS CLAVE (CHULETA DE CAMPO) ──────────── */}
      {activeSection === 'cheatsheet' && (
        <div className="space-y-6">
          {/* Card 1: DOGSO vs SPA */}
          <div className="bg-surface border border-border rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/30">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-text">
                  Matriz DOGSO vs SPA (Faltas Tácticas y Disciplina)
                </h3>
                <p className="text-xs text-text-muted">
                  Diferencia exacta entre Ocasión Manifiesta de Gol (DOGSO) y Detener Ataque Prometedor (SPA).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-red-300 text-sm">DOGSO (Ocasión Manifiesta de Gol)</span>
                  <span className="px-2 py-0.5 rounded font-black text-[10px] bg-red-500 text-slate-950">ROJA DIRECTA 🟥</span>
                </div>
                <p className="text-red-200/80">Deben cumplirse los 4 factores ("Las 4 D"):</p>
                <ul className="list-disc list-inside space-y-1 text-red-100">
                  <li><strong>Distancia:</strong> Cerca al arco rival.</li>
                  <li><strong>Dirección:</strong> Con trayectoria directa hacia la portería.</li>
                  <li><strong>Disposición/Control:</strong> Posibilidad real de rematar o controlar el balón.</li>
                  <li><strong>Defensores:</strong> No hay defensores rivales que puedan interceptar antes del remate.</li>
                </ul>
                <div className="p-2.5 rounded bg-surface/50 border border-red-500/40 text-[11px] text-amber-300 font-bold mt-2">
                  ⚠️ En el área penal: Se degrada a AMARILLA 🟨 SOLO si fue disputando el balón. Si fue sujeción o empujón ➜ ROJA 🟥.
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-amber-300 text-sm">SPA (Ataque Prometedor)</span>
                  <span className="px-2 py-0.5 rounded font-black text-[10px] bg-amber-500 text-slate-950">AMARILLA 🟨</span>
                </div>
                <p className="text-amber-200/80">Se sanciona cuando falta alguno de los 4 factores de DOGSO pero hay peligro:</p>
                <ul className="list-disc list-inside space-y-1 text-amber-100">
                  <li>Hay compañeros con opción de pase claro.</li>
                  <li>Espacio abierto para avanzar con superioridad numérica.</li>
                  <li>Hay un defensor que aún podía cruzar a tiempo.</li>
                </ul>
                <div className="p-2.5 rounded bg-surface/50 border border-amber-500/40 text-[11px] text-sky-300 font-bold mt-2">
                  💡 Si concedes ventaja y termina en GOL ➜ NO se muestra tarjeta por SPA.
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Criterio de Manos */}
          <div className="bg-surface border border-border rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-text">
                  Protocolo de Manos IFAB (Regla 12)
                </h3>
                <p className="text-xs text-text-muted">
                  Cómo discernir cuándo pitar penal o falta por contacto con brazo o mano.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-surface-2 border border-border space-y-2">
                <span className="font-bold text-danger text-sm flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-danger" /> SÍ ES INFRACCIÓN (Pitar falta o penal)
                </span>
                <ul className="space-y-1.5 text-text-muted list-disc list-inside">
                  <li>Tocar el balón deliberadamente (movimiento del brazo hacia el balón).</li>
                  <li>Posición antinatural: el brazo hace que el cuerpo ocupe más espacio de manera no justificada por la acción.</li>
                  <li>Anotar en la portería contraria directamente con la mano o inmediatamente después de un toque accidental.</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-surface-2 border border-border space-y-2">
                <span className="font-bold text-success text-sm flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-success" /> NO ES INFRACCIÓN (Juega)
                </span>
                <ul className="space-y-1.5 text-text-muted list-disc list-inside">
                  <li>El balón proviene directamente de la cabeza o cuerpo del propio jugador tras jugarlo voluntariamente.</li>
                  <li>Brazo pegado al cuerpo o en posición justificada por la carrera o salto natural.</li>
                  <li>Mano de apoyo en el suelo durante una caída o barrida.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── SECTION 4: FLASHCARDS PRE-PARTIDO ──────────────────────── */}
      {activeSection === 'flashcards' && (
        <div className="max-w-xl mx-auto space-y-5 text-center">
          <p className="text-xs text-text-muted">
            Toca la tarjeta para voltearla. Ideal para repasar 10 minutos antes de cada partido en la cancha.
          </p>

          <div
            onClick={() => {
              setIsFlipped(!isFlipped);
              sounds.playToastChime();
            }}
            className="cursor-pointer min-h-[260px] p-6 sm:p-8 rounded-2xl bg-surface border-2 border-emerald-500/40 shadow-lg flex flex-col items-center justify-center text-center space-y-4 hover:border-emerald-400 transition-all select-none"
          >
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
              {isFlipped ? 'RESPUESTA Y CRITERIO IFAB' : 'PREGUNTA ARBITRAL RÁPIDA'}
            </span>

            <div className="text-base sm:text-lg font-black text-text leading-relaxed">
              {isFlipped
                ? REFEREE_CASES[flashcardIndex].options.find(o => o.isCorrect)?.text
                : REFEREE_CASES[flashcardIndex].situation}
            </div>

            <p className="text-[11px] text-text-muted flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              {isFlipped ? 'Toca para volver a la pregunta' : 'Toca para ver el criterio reglamentario'}
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => {
                setIsFlipped(false);
                setFlashcardIndex(prev => (prev === 0 ? REFEREE_CASES.length - 1 : prev - 1));
              }}
              className="px-4 py-2 rounded-xl bg-surface-2 hover:bg-surface border border-border text-xs font-bold text-text transition-colors"
            >
              Anterior
            </button>

            <span className="text-xs font-mono text-text-muted">
              {flashcardIndex + 1} de {REFEREE_CASES.length}
            </span>

            <button
              onClick={() => {
                setIsFlipped(false);
                setFlashcardIndex(prev => (prev + 1) % REFEREE_CASES.length);
              }}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-colors shadow-xs"
            >
              Siguiente Tarjeta
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
