/**
 * rulesData.js — Banco Completo y Estructurado de las 17 Reglas IFAB 2026/27
 *
 * Cada regla cuenta con:
 * - Revelación progresiva en 3 niveles:
 *     Nivel 1: Esencial (30 s)
 *     Nivel 2: Detalle normativo
 *     Nivel 3: Excepciones y casos límite
 * - Tabla estructurada: Infracción → Reanudación → Sanción disciplinaria
 * - Estado de auditoría: "Verificada ✔ (fecha)" o "Por verificar"
 * - Criterio práctico en cancha (sin referencias no fundamentadas)
 * - Enlace directo al texto oficial en theifab.com
 * - Indicador de novedades 2026/27 y notas "TODO: verificar" cuando aplique
 */

export const IFAB_LAWS_DATA = [
  {
    number: 1,
    title: 'El Terreno de Juego',
    category: 'structure',
    officialUrl: 'https://www.theifab.com/es/laws/latest/the-field-of-play/',
    auditStatus: 'Verificada ✔ (06/10/2026)',
    hasNovelty2026: false,
    needsVerification: false,
    verificationNotes: null,
    level1: {
      title: 'Esencial (30 s)',
      summary: 'El rectángulo de juego está delimitado por líneas que forman parte de las áreas que encierran. Las metas, áreas y cuadrantes deben garantizar la seguridad de los participantes.',
      corePoints: [
        'Las líneas pertenecen íntegramente a las zonas que delimitan (el contacto sobre la línea del área penal es dentro del área).',
        'Postes y travesaños deben ser de material y color seguros (blanco) y estar firmemente anclados.',
        'El área técnica delimita el espacio del cuerpo técnico: solo una persona a la vez puede estar de pie dando instrucciones tácticas.'
      ]
    },
    level2: {
      title: 'Detalle normativo',
      sections: [
        {
          subtitle: 'Líneas y demarcación del campo',
          text: 'Las líneas de banda miden entre 90 y 120 m (100 a 110 m en partidos internacionales) y las de meta entre 45 y 90 m (64 a 75 m en internacionales). El ancho máximo de todas las líneas es de 12 cm. El punto penal se ubica a exactamente 11 m del centro de la línea de meta.'
        },
        {
          subtitle: 'Porterías y elementos de seguridad',
          text: 'La distancia entre los postes interiores es de 7.32 m y la altura del borde inferior del travesaño al suelo es de 2.44 m. Los postes deben ser blancos o plateados. Si el travesaño se rompe o se desplaza, el juego se suspende a menos que pueda sustituirse o repararse de forma segura (no se permite usar una cuerda).'
        },
        {
          subtitle: 'Banderines y cuadrantes de esquina',
          text: 'En cada esquina se ubica un poste de banderín no puntiagudo con una altura mínima de 1.5 m. El cuadrante de esquina tiene un radio de 1 m desde el poste.'
        }
      ]
    },
    level3: {
      title: 'Excepciones y casos límite',
      cases: [
        {
          caseTitle: 'Desplazamiento accidental o deliberado de la portería',
          text: 'Si un defensor mueve deliberadamente la portería y el balón iba a entrar, el árbitro concederá el gol si el balón habría cruzado entre los postes en su posición original, y amonestará al infractor.'
        },
        {
          caseTitle: 'Líneas borrosas o afectadas por el clima',
          text: 'Si las líneas quedan borrosas durante el juego, el árbitro utilizará su juicio visual apoyado por los asistentes para estimar los límites mientras no sea posible remarcar en el intermedio.'
        }
      ]
    },
    table: [
      {
        infraction: 'Defensor mueve la portería para evitar un gol y el balón entra',
        restart: 'Gol válido (si habría entrado en posición normal)',
        sanction: 'Tarjeta Amarilla por conducta antideportiva'
      },
      {
        infraction: 'Defensor mueve la portería y evita que el balón entre',
        restart: 'Tiro penal',
        sanction: 'Tarjeta Roja (DOGSO)'
      },
      {
        infraction: 'Ocupante del área técnica interfiere entrando al terreno sin balón',
        restart: 'Tiro libre indirecto',
        sanction: 'Amonestación (Tarjeta Amarilla)'
      }
    ],
    practicalCriteria: 'Revisa redes, anclaje de postes y banderines 45 minutos antes del silbatazo inicial. Si hay un charco profundo o una línea de área penal despintada, exige su corrección inmediata antes del saque inicial.'
  },
  {
    number: 2,
    title: 'El Balón',
    category: 'structure',
    officialUrl: 'https://www.theifab.com/es/laws/latest/the-ball/',
    auditStatus: 'Verificada ✔ (06/10/2026)',
    hasNovelty2026: false,
    needsVerification: false,
    verificationNotes: null,
    level1: {
      title: 'Esencial (30 s)',
      summary: 'El balón es el elemento central del juego: esférico, de circunferencia entre 68 y 70 cm y presión entre 0.6 y 1.1 atmósferas. Solo puede sustituirse con autorización explícita del árbitro.',
      corePoints: [
        'Si el balón se revienta o desinfla durante el juego: detención y reanudación con balón a tierra.',
        'Si se rompe durante la ejecución de un tiro penal antes de tocar a otro jugador o poste: se repite el penal.',
        'La presencia de un segundo balón solo obliga a detener el juego si interfiere directamente en la jugada.'
      ]
    },
    level2: {
      title: 'Detalle normativo',
      sections: [
        {
          subtitle: 'Especificaciones técnicas',
          text: 'Circunferencia: 68-70 cm. Peso: 410-450 g al comienzo del partido. Presión: 0.6-1.1 atm (600-1100 g/cm²) al nivel del mar. Si un balón no cumple estas normas, no debe utilizarse en ninguna circunstancia.'
        },
        {
          subtitle: 'Procedimiento ante balón defectuoso',
          text: 'Si el balón pierde sus propiedades en juego, el árbitro detiene el partido, solicita un balón de recambio que cumpla los requisitos y reanuda con balón a tierra en el punto donde se detectó el defecto.'
        }
      ]
    },
    level3: {
      title: 'Excepciones y casos límite',
      cases: [
        {
          caseTitle: 'Segundo balón en el campo sin interferencia',
          text: 'Si un balón adicional entra al terreno pero no estorba la jugada activa, el árbitro debe permitir continuar el juego y ordenar retirarlo en la siguiente interrupción.'
        },
        {
          caseTitle: 'Segundo balón lanzado con intención de interferir',
          text: 'Si un jugador suplente o integrante del cuerpo técnico lanza un segundo balón al campo para cortar un ataque prometedor o un gol, se sanciona tiro libre directo o penal en el punto de interferencia y tarjeta roja por DOGSO o amarilla por SPA.'
        }
      ]
    },
    table: [
      {
        infraction: 'Balón se desinfla o explota en juego activo',
        restart: 'Balón a tierra con balón nuevo',
        sanction: 'Sin sanción disciplinaria'
      },
      {
        infraction: 'Balón se revienta al patear un tiro penal (antes de tocar poste o portero)',
        restart: 'Repetición del tiro penal con balón nuevo',
        sanction: 'Sin sanción disciplinaria'
      },
      {
        infraction: 'Suplente arroja un balón al campo para desviar un remate a gol',
        restart: 'Tiro penal (si ocurre en área) o tiro libre directo',
        sanction: 'Tarjeta Roja directa (DOGSO)'
      }
    ],
    practicalCriteria: 'Ten siempre preparados al menos dos balones con la misma calibración de presión junto a los banquillos o recogepelotas para evitar demoras innecesarias de juego.'
  },
  {
    number: 3,
    title: 'Los Jugadores',
    category: 'structure',
    officialUrl: 'https://www.theifab.com/es/laws/latest/the-players/',
    auditStatus: 'Verificada ✔ (06/10/2026)',
    hasNovelty2026: true,
    noveltyText: 'Sustituciones adicionales permanentes por conmoción cerebral aprobadas por la IFAB como enmienda permanente en el reglamento.',
    needsVerification: false,
    verificationNotes: null,
    level1: {
      title: 'Esencial (30 s)',
      summary: 'El partido se disputa entre dos equipos de máximo 11 jugadores cada uno (uno de ellos guardameta). Un partido no puede iniciar ni continuar si un equipo tiene menos de 7 jugadores.',
      corePoints: [
        'Mínimo 7 jugadores en cancha por equipo para competir reglamentariamente.',
        'El jugador sustituido debe abandonar el campo por el punto más cercano de la línea delimitadora, salvo autorización arbitral por lesión o seguridad.',
        'Sustitución adicional permanente por sospecha de conmoción cerebral autorizada según el protocolo de competición.'
      ]
    },
    level2: {
      title: 'Detalle normativo',
      sections: [
        {
          subtitle: 'Número de sustitutos y ventanas',
          text: 'El reglamento IFAB autoriza hasta 5 sustituciones en competiciones oficiales de primer nivel, realizadas en un máximo de 3 ventanas (más el descanso). Las competiciones pueden autorizar sustituciones adicionales en prórroga.'
        },
        {
          subtitle: 'Sustituto adicional por conmoción cerebral',
          text: 'Cuando un jugador sufre un golpe en la cabeza con sospecha de conmoción, el equipo puede realizar un cambio permanente adicional que no consume las ventanas de cambio ordinarias, priorizando la salud del futbolista.'
        },
        {
          subtitle: 'Expulsiones antes y después del pitazo inicial',
          text: 'Un jugador expulsado antes de la entrega de planillas no puede figurar en ella. Si es expulsado entre la entrega de planillas y el saque inicial, puede ser reemplazado por un suplente nombrado sin gastar sustitución. Si es expulsado después del saque inicial, el equipo queda en inferioridad numérica.'
        }
      ]
    },
    level3: {
      title: 'Excepciones y casos límite',
      cases: [
        {
          caseTitle: 'Gol anotado con una persona de más en el terreno',
          text: 'Si el equipo que anotó tenía un jugador de más (suplente o expulsado) en el momento del gol, el gol se anula y se reanuda con tiro libre directo o penal desde donde estaba el intruso. Si el intruso era del equipo que recibió el gol, el gol es legal.'
        },
        {
          caseTitle: 'Reingreso sin autorización de un jugador que salió a cambiarse',
          text: 'Si entra al campo e interfiere con el juego, se sanciona tiro libre directo o penal en el lugar de la interferencia, más tarjeta amarilla por entrar sin permiso.'
        }
      ]
    },
    table: [
      {
        infraction: 'Suplente entra sin permiso y toca el balón o interfiere a un rival',
        restart: 'Tiro libre directo o tiro penal',
        sanction: 'Tarjeta Amarilla (o Roja si comete DOGSO)'
      },
      {
        infraction: 'Suplente entra al terreno sin interferir en la jugada activa',
        restart: 'Tiro libre indirecto donde estaba el balón',
        sanction: 'Tarjeta Amarilla por entrar sin permiso'
      },
      {
        infraction: 'Jugador sustituido se niega a salir del terreno de juego',
        restart: 'El juego continúa (el árbitro no obliga la salida si el jugador se rehúsa)',
        sanction: 'Sin sanción inmediata al jugador; no se realiza el cambio'
      }
    ],
    practicalCriteria: 'Anota meticulosamente el minuto y los dorsales de cada ventana de cambio. Asegúrate de que el sustituido abandone el campo antes de que el sustituto pise el terreno de juego.'
  },
  {
    number: 4,
    title: 'El Equipamiento de los Jugadores',
    category: 'structure',
    officialUrl: 'https://www.theifab.com/es/laws/latest/the-players-equipment/',
    auditStatus: 'Por verificar',
    hasNovelty2026: true,
    noveltyText: 'Revisión sobre accesorios cubiertos de forma segura: análisis en protocolos 2026/27 sobre la distinción entre objetos lesivos rígidos y protectores acolchados o vendajes de fijación permitidos. TODO: verificar redacción exacta en el PDF oficial 2026/27.',
    needsVerification: true,
    verificationNotes: 'TODO: verificar contra el texto del PDF oficial de las Reglas de Juego 2026/27 si la prohibición estricta de cubrir joyas con cinta adhesiva se mantiene inalterada en fútbol élite o si se incorporan excepciones precisas para dispositivos biométricos blandos o protectores certificados.',
    level1: {
      title: 'Esencial (30 s)',
      summary: 'El equipamiento obligatorio consta de camiseta con mangas, pantaloneta, medias, canilleras y calzado. Los participantes no deben llevar ningún objeto peligroso para sí mismos ni para los demás.',
      corePoints: [
        'La seguridad es el principio rector: cualquier accesorio peligroso está prohibido.',
        'Las canilleras son obligatorias, deben ofrecer un grado razonable de protección y estar totalmente cubiertas por las medias.',
        'Calzas térmicas o calentadores deben coincidir con el color principal de la pantaloneta o su dobladillo.'
      ]
    },
    level2: {
      title: 'Detalle normativo',
      sections: [
        {
          subtitle: 'Equipamiento básico obligatorio',
          text: 'Camiseta con mangas; pantaloneta; medias (si se aplica cinta exterior, debe ser del mismo color que la parte de la media que cubre); canilleras de material adecuado; y calzado de fútbol. Los guardametas deben vestir colores que los distingan de los demás jugadores y del equipo arbitral.'
        },
        {
          subtitle: 'Joyas y elementos no autorizados',
          text: 'Históricamente, la IFAB prohíbe todas las joyas (collares, anillos, pulseras, aretes, bandas de goma o cuero). En la reglamentación tradicional, cubrirlos con cinta no se considera protección suficiente si el elemento subyacente es rígido o punzante. TODO: verificar matices 2026/27.'
        },
        {
          subtitle: 'Equipamiento protector permitido',
          text: 'Se permiten protectores de cabeza blandos, máscaras faciales anatómicas, rodilleras acolchadas y gafas deportivas certificadas que no supongan peligro.'
        }
      ]
    },
    level3: {
      title: 'Excepciones y casos límite',
      cases: [
        {
          caseTitle: 'Pérdida accidental del calzado o canillera durante una jugada',
          text: 'Un jugador que pierde accidentalmente una bota o canillera en una disputa puede continuar jugando de forma inmediata y marcar un gol o participar en la jugada, debiendo calzarse o recolocarse la protección en la siguiente interrupción.'
        },
        {
          caseTitle: 'Jugador que reingresa con equipamiento antirreglamentario',
          text: 'Si el árbitro ordenó a un jugador salir para retirar una joya o corregir sus botas, el jugador debe ser revisado por un miembro arbitral antes de volver. Si entra sin permiso, se le amonesta con tarjeta amarilla.'
        }
      ]
    },
    table: [
      {
        infraction: 'Jugador se niega a retirar un accesorio peligroso tras orden del árbitro',
        restart: 'El jugador debe abandonar el terreno de juego',
        sanction: 'Tarjeta Amarilla si rehúsa obedecer reiteradamente'
      },
      {
        infraction: 'Jugador sale a corregir su indumentaria y reingresa sin autorización arbitral',
        restart: 'Tiro libre indirecto donde estaba el balón (o directo si interfiere)',
        sanction: 'Tarjeta Amarilla por ingresar sin permiso'
      },
      {
        infraction: 'Gol anotado descalzo tras pérdida accidental del calzado en esa misma acción',
        restart: 'Gol válido',
        sanction: 'Sin sanción disciplinaria'
      }
    ],
    practicalCriteria: 'Inspecciona canilleras y orejas/muñecas antes de salir al campo. Prevenir un corte facial por un aro o arete antes del inicio es responsabilidad directa del cuerpo arbitral.'
  },
  {
    number: 5,
    title: 'El Árbitro',
    category: 'game',
    officialUrl: 'https://www.theifab.com/es/laws/latest/the-referee/',
    auditStatus: 'Verificada ✔ (06/10/2026)',
    hasNovelty2026: true,
    noveltyText: 'Directriz de interlocución exclusiva con el capitán: solo el capitán de cada equipo está facultado para dialogar con el árbitro en decisiones cruciales, reduciendo las protestas colectivas.',
    needsVerification: false,
    verificationNotes: null,
    level1: {
      title: 'Esencial (30 s)',
      summary: 'El árbitro posee la máxima autoridad para hacer cumplir las Reglas de Juego en el partido. Sus decisiones sobre hechos del juego son definitivas una vez que el partido se ha reanudado.',
      corePoints: [
        'Autoridad total desde el ingreso a las inmediaciones del campo hasta la salida del recinto.',
        'Ley de la Ventaja: permitir que el juego continúe cuando el equipo agraviado se beneficie de una progresión prometedora.',
        'Poder disciplinario: amonestar, expulsar y adoptar medidas contra miembros del cuerpo técnico en el área técnica.'
      ]
    },
    level2: {
      title: 'Detalle normativo',
      sections: [
        {
          subtitle: 'Aplicación de la ventaja y demora de silbato',
          text: 'El árbitro evalúa la ventaja durante 2-3 segundos. Si la ventaja anticipada no se materializa en ese lapso, debe detener el juego y sancionar la infracción inicial. Si la infracción ameritaba expulsión por juego brusco grave o conducta violenta, solo debe conceder ventaja si hay una oportunidad inmediata de gol.'
        },
        {
          subtitle: 'Diálogo exclusivo con el capitán',
          text: 'Ante decisiones polémicas o de alta tensión, el árbitro puede convocar únicamente a los capitanes para explicar su decisión. Cualquier compañero que invada el espacio del árbitro o proteste de forma vehemente debe ser amonestado con tarjeta amarilla.'
        },
        {
          subtitle: 'Modificación de decisiones arbitrales',
          text: 'El árbitro solo puede modificar una decisión si se da cuenta de que es incorrecta antes de haber reanudado el juego o antes de haber señalado el final del primer o segundo periodo.'
        }
      ]
    },
    level3: {
      title: 'Excepciones y casos límite',
      cases: [
        {
          caseTitle: 'Pitazo antes de que el balón cruce la línea de meta',
          text: 'Si el árbitro hace sonar su silbato por error un instante antes de que el balón traspase la línea de gol, el juego queda detenido en ese milisegundo y el gol NO es legal. Se reanuda con balón a tierra.'
        },
        {
          caseTitle: 'Ventaja en falta de tarjeta roja que luego interviene',
          text: 'Si se concede ventaja en una acción de tarjeta roja y el infractor interviene en la jugada activa antes de la interrupción, el árbitro detiene el juego de inmediato, expulsa al jugador y reanuda con tiro libre indirecto.'
        }
      ]
    },
    table: [
      {
        infraction: 'Acoso o invasión del espacio del árbitro por jugadores no capitanes',
        restart: 'Según la jugada previa (o tiro libre indirecto si el juego estaba detenido)',
        sanction: 'Tarjeta Amarilla por conducta antideportiva / protestar'
      },
      {
        infraction: 'Infracción merecedora de tarjeta roja con ventaja concedida; infractor toca el balón',
        restart: 'Tiro libre indirecto para el adversario',
        sanction: 'Tarjeta Roja directa (expulsión diferida ejecutada de inmediato)'
      },
      {
        infraction: 'Miembro del cuerpo técnico desaprueba con gestos ofensivos desde el banquillo',
        restart: 'No afecta reanudación si el balón no estaba en juego',
        sanction: 'Tarjeta Roja directa al oficial infractor'
      }
    ],
    practicalCriteria: 'Modula el silbato: un pitazo suave y breve para faltas simples de trámite; un silbatazo enérgico y largo para faltas tácticas, cortes de ataque o amonestaciones.'
  },
  {
    number: 6,
    title: 'Los Otros Miembros del Equipo Arbitral',
    category: 'game',
    officialUrl: 'https://www.theifab.com/es/laws/latest/the-other-match-officials/',
    auditStatus: 'Verificada ✔ (06/10/2026)',
    hasNovelty2026: false,
    needsVerification: false,
    verificationNotes: null,
    level1: {
      title: 'Esencial (30 s)',
      summary: 'Los árbitros asistentes, cuarto árbitro y demás oficiales asisten al árbitro central en el control del encuentro. El árbitro principal conserva siempre la decisión final en todas las situaciones.',
      corePoints: [
        'Los asistentes señalan fueras de juego, balones fuera del terreno y faltas fuera de la vista del central.',
        'El cuarto árbitro controla las áreas técnicas, sustituciones, reingresos y la notificación del tiempo añadido.',
        'La cooperación en equipo se fundamenta en contacto visual permanente y señales claras antes de cada reanudación.'
      ]
    },
    level2: {
      title: 'Detalle normativo',
      sections: [
        {
          subtitle: 'Funciones específicas del árbitro asistente',
          text: 'Señalar cuándo el balón ha traspasado totalmente las líneas; a qué equipo corresponde el saque; cuándo debe sancionarse a un jugador por fuera de juego; y cuándo se cometen infracciones cerca de su línea de banda o a la espalda del árbitro central.'
        },
        {
          subtitle: 'Tareas del cuarto árbitro',
          text: 'Supervisar el procedimiento de sustituciones; verificar el equipamiento de suplentes antes de su ingreso; controlar las conductas en los banquillos; y exhibir el tiempo adicional fijado por el central.'
        }
      ]
    },
    level3: {
      title: 'Excepciones y casos límite',
      cases: [
        {
          caseTitle: 'Discrepancia en una falta entre asistente y central',
          text: 'Si el asistente levanta el banderín por una falta pero el árbitro central hace la señal de continuar el juego porque observó la acción y no considera infracción o aplica ventaja, la decisión del árbitro central prevalece y el asistente debe bajar el banderín con discreción.'
        },
        {
          caseTitle: 'Incapacidad física del árbitro central durante el partido',
          text: 'El cuarto árbitro o el primer árbitro asistente asume la conducción del encuentro según el orden de prelación oficial establecido por el reglamento del torneo.'
        }
      ]
    },
    table: [
      {
        infraction: 'Asistente detecta agresión violenta fuera de la visión del árbitro principal',
        restart: 'Tiro libre directo o penal en el lugar de la agresión',
        sanction: 'Tarjeta Roja directa (comunicada al árbitro central)'
      },
      {
        infraction: 'Banquillo protesta de forma reiterada ante el cuarto árbitro',
        restart: 'El juego continúa si el balón estaba en juego',
        sanction: 'Tarjeta Amarilla o Roja al primer entrenador'
      },
      {
        infraction: 'Señal de fuera de juego del asistente con toque posterior involuntario del defensor',
        restart: 'Tiro libre indirecto si no hubo juego deliberado',
        sanction: 'Sin sanción disciplinaria'
      }
    ],
    practicalCriteria: 'En la reunión técnica previa al partido, acuerda con tus asistentes: "Si la jugada ocurre a espaldas mías o a menos de 5 metros de tu línea de banda, toma la decisión tú con convicción y firmeza".'
  },
  {
    number: 7,
    title: 'La Duración del Partido',
    category: 'game',
    officialUrl: 'https://www.theifab.com/es/laws/latest/the-duration-of-the-match/',
    auditStatus: 'Verificada ✔ (06/10/2026)',
    hasNovelty2026: false,
    needsVerification: false,
    verificationNotes: null,
    level1: {
      title: 'Esencial (30 s)',
      summary: 'El partido consta de dos periodos iguales de 45 minutos (salvo acuerdo previo en categorías especiales), con un descanso de hasta 15 minutos. El árbitro debe compensar con exactitud todo el tiempo perdido.',
      corePoints: [
        'Tiempo adicional obligatorio por sustituciones, lesiones, demoras deliberadas, celebraciones y revisiones.',
        'El tiempo añadido anunciado por el cuarto árbitro puede aumentarse, pero NUNCA reducirse.',
        'Si se concede un tiro penal sobre el final del periodo, debe permitirse su ejecución completa.'
      ]
    },
    level2: {
      title: 'Detalle normativo',
      sections: [
        {
          subtitle: 'Causas de compensación de tiempo',
          text: 'Sustituciones; atención médica o traslado de jugadores lesionados; pérdidas deliberadas de tiempo; sanciones disciplinarias; paradas de hidratación (máx 1 min) o enfriamiento (máx 3 min); y cualquier demora significativa imputable a incidentes en el partido.'
        },
        {
          subtitle: 'Extensión para ejecución de tiro penal',
          text: 'Si debe ejecutarse o repetirse un tiro penal al final de cualquiera de los dos periodos, la duración de ese tiempo debe extenderse hasta que el penal haya concluido su trayectoria y desenlace (anotación, atajada definitiva o salida del balón).'
        }
      ]
    },
    level3: {
      title: 'Excepciones y casos límite',
      cases: [
        {
          caseTitle: 'Fin de tiempo anunciado y nueva pérdida de tiempo dentro de la adición',
          text: 'Si se añaden 4 minutos y en el minuto 92 un jugador simula una lesión demorando 2 minutos, el árbitro tiene la obligación reglamentaria de prolongar el juego hasta el minuto 96 o más.'
        },
        {
          caseTitle: 'Partido suspendido antes del tiempo reglamentario',
          text: 'Un partido suspendido definitivamente por causas de fuerza mayor se completará o resolverá de acuerdo con lo estipulado por el reglamento de la competición.'
        }
      ]
    },
    table: [
      {
        infraction: 'Pérdida de tiempo deliberada al reanudar el juego (retrasar saque)',
        restart: 'Se reanuda con el saque correspondiente',
        sanction: 'Tarjeta Amarilla por demorar la reanudación del juego'
      },
      {
        infraction: 'Penal concedido con el tiempo reglamentario vencido',
        restart: 'Ejecución del tiro penal con tiempo prolongado',
        sanction: 'El periodo finaliza inmediatamente tras el desenlace del tiro'
      },
      {
        infraction: 'Confusión en el cronómetro del árbitro con silbatazo antes del minuto 45',
        restart: 'Hacer regresar a los jugadores y disputar los minutos faltantes',
        sanction: 'Sin sanción disciplinaria'
      }
    ],
    practicalCriteria: 'Maneja cronómetro dual: uno para tiempo corrido total y otro de tiempo detenido. Activa el cronómetro de paro en cada sustitución y celebración para fijar una adición justa.'
  },
  {
    number: 8,
    title: 'El Inicio y la Reanudación del Juego',
    category: 'restarts',
    officialUrl: 'https://www.theifab.com/es/laws/latest/the-start-and-restart-of-play/',
    auditStatus: 'Verificada ✔ (06/10/2026)',
    hasNovelty2026: false,
    needsVerification: false,
    verificationNotes: null,
    level1: {
      title: 'Esencial (30 s)',
      summary: 'El juego se inicia o reinicia con saque de centro (al inicio de cada mitad o tras gol) o con balón a tierra cuando el juego se detiene por motivos no contemplados en las otras reglas.',
      corePoints: [
        'Saque inicial: el balón puede patearse en cualquier dirección y se puede marcar gol directamente en la meta adversaria.',
        'Balón a tierra en el área penal: se entrega SIEMPRE al guardameta del equipo defensor.',
        'Balón a tierra fuera del área penal: se entrega a un jugador del último equipo que tocó el balón, en el punto exacto del último contacto. Todos los demás a mínimo 4 metros.'
      ]
    },
    level2: {
      title: 'Detalle normativo',
      sections: [
        {
          subtitle: 'Procedimiento del saque de centro',
          text: 'Todos los jugadores, excepto quien ejecute el saque, deben encontrarse en su propia mitad del terreno. Los adversarios deben situarse a al menos 9.15 m del balón (fuera del círculo central). El balón está en juego en cuanto es pateado y se mueve con claridad.'
        },
        {
          subtitle: 'Protocolo de balón a tierra',
          text: 'El árbitro deja caer el balón en el punto donde se encontraba cuando se detuvo el juego. Si la detención ocurrió con el balón dentro del área penal (o si el último toque fue en dicha área), se deja caer para el guardameta en su área. Los jugadores de ambos equipos deben mantenerse a 4 metros de distancia.'
        },
        {
          subtitle: 'Balón que golpea en un miembro del equipo arbitral',
          text: 'Si el balón toca al árbitro central (o a un asistente dentro del campo) y como consecuencia directa: a) entra en la portería, b) cambia la posesión de equipo, o c) inicia un ataque prometedor, el juego se detiene de inmediato y se reanuda con balón a tierra.'
        }
      ]
    },
    level3: {
      title: 'Excepciones y casos límite',
      cases: [
        {
          caseTitle: 'Balón a tierra que entra a la portería sin tocar a ningún jugador',
          text: 'Si tras un balón a tierra el balón entra a la portería sin haber sido tocado por al menos dos jugadores, no es gol: si entra en la meta rival, se reanuda con saque de meta; si entra en la propia meta, se concede saque de esquina.'
        },
        {
          caseTitle: 'Autogol directo en un saque de centro',
          text: 'Si un jugador ejecuta el saque inicial pateando directamente hacia su propia portería y el balón entra sin que nadie lo toque, el gol se invalida y se reanuda con saque de esquina a favor del adversario.'
        }
      ]
    },
    table: [
      {
        infraction: 'El balón toca al árbitro y da inicio a un contraataque prometedor para el rival',
        restart: 'Detención del juego y Balón a tierra para el equipo que tenía la posesión',
        sanction: 'Sin sanción disciplinaria'
      },
      {
        infraction: 'Ejecutor del saque inicial toca el balón dos veces consecutivas sin que nadie más lo toque',
        restart: 'Tiro libre indirecto para el adversario (directo si fue con la mano)',
        sanction: 'Sin sanción disciplinaria ordinaria'
      },
      {
        infraction: 'Rival no respeta la distancia de 4 metros en un balón a tierra a pesar de advertencia',
        restart: 'Repetición del balón a tierra',
        sanction: 'Tarjeta Amarilla por no respetar la distancia reglamentaria'
      }
    ],
    practicalCriteria: 'El árbitro ya no es considerado "parte del aire o del terreno". Si un pase tuyo favorece un cambio de posesión o corta un avance, no dudes en pitar de inmediato y devolver el balón a tierra a quien correspondía.'
  },
  {
    number: 9,
    title: 'El Balón en Juego o Fuera de Juego',
    category: 'game',
    officialUrl: 'https://www.theifab.com/es/laws/latest/the-ball-in-and-out-of-play/',
    auditStatus: 'Verificada ✔ (06/10/2026)',
    hasNovelty2026: false,
    needsVerification: false,
    verificationNotes: null,
    level1: {
      title: 'Esencial (30 s)',
      summary: 'El balón permanece en juego en todo momento, a menos que haya traspasado COMPLETAMENTE una línea limítrofe por tierra o por aire, o que el árbitro haya detenido las acciones.',
      corePoints: [
        'El 100% de la circunferencia del balón debe rebasar la línea de banda o de meta para considerarse fuera.',
        'Si una pequeña curvatura del balón se proyecta verticalmente sobre la línea, el balón está legalmente en juego.',
        'El rebote en postes, travesaños y banderines mantiene el balón en juego si no abandona los límites del terreno.'
      ]
    },
    level2: {
      title: 'Detalle normativo',
      sections: [
        {
          subtitle: 'Proyección cilíndrica y esférica',
          text: 'La evaluación de si el balón ha salido se basa en la proyección geométrica de toda su circunferencia sobre el plano vertical de la línea. Aunque la base del balón apoyada en el suelo esté fuera de la pintura blanca, si la panza superior se alinea un milímetro con el borde externo de la línea, la pelota sigue en juego.'
        },
        {
          subtitle: 'Balón que toca al árbitro sin cambiar la jugada',
          text: 'Si el balón impacta en el árbitro y permanece en el terreno sin provocar un cambio de posesión, sin dar inicio a un ataque prometedor y sin entrar a portería, el balón sigue en juego.'
        }
      ]
    },
    level3: {
      title: 'Excepciones y casos límite',
      cases: [
        {
          caseTitle: 'Efecto curvo en saque de esquina',
          text: 'Si el balón lanzado con efecto curvo desde una esquina traspasa completamente el plano exterior de la línea de meta por el aire y luego regresa adentro del campo, el balón está fuera de juego desde el momento en que salió en el aire: se reanuda con saque de meta.'
        },
        {
          caseTitle: 'Jugador fuera del campo que juega el balón ubicado sobre la línea',
          text: 'La posición del cuerpo del jugador no determina si el balón está en juego o fuera. Lo que manda es la posición del balón. Un jugador parado afuera del campo puede tocar un balón que está sobre la línea sin que esté fuera de juego.'
        }
      ]
    },
    table: [
      {
        infraction: 'Balón cruza completamente la línea de banda por el aire',
        restart: 'Saque de banda para el equipo rival',
        sanction: 'Sin sanción disciplinaria'
      },
      {
        infraction: 'Balón cruza completamente la línea de meta impulsado por un defensor (sin gol)',
        restart: 'Saque de esquina',
        sanction: 'Sin sanción disciplinaria'
      },
      {
        infraction: 'Balón cruza completamente la línea de meta impulsado por un atacante (sin gol)',
        restart: 'Saque de meta',
        sanction: 'Sin sanción disciplinaria'
      }
    ],
    practicalCriteria: 'Entrena tu vista de línea: no te apresures a pitar saque de banda si el balón rueda por el borde. Aguarda la confirmación de tu asistente cuando el ángulo visual esté comprometido.'
  },
  {
    number: 10,
    title: 'El Resultado de un Partido',
    category: 'game',
    officialUrl: 'https://www.theifab.com/es/laws/latest/determining-the-outcome-of-a-match/',
    auditStatus: 'Verificada ✔ (06/10/2026)',
    hasNovelty2026: false,
    needsVerification: false,
    verificationNotes: null,
    level1: {
      title: 'Esencial (30 s)',
      summary: 'Se valida gol cuando el balón atraviesa completamente la línea de meta entre los postes y bajo el travesaño, sin infracción previa del equipo anotador. El equipo con más goles es el ganador.',
      corePoints: [
        'El balón debe traspasar enteramente la línea de meta para conceder el gol.',
        'En caso de empate que requiera desempate: prórroga, tanda de penales u otros mecanismos reglamentarios de la competición.',
        'Principio de igualdad numérica en la tanda de penales si un equipo finaliza con menos futbolistas.'
      ]
    },
    level2: {
      title: 'Detalle normativo',
      sections: [
        {
          subtitle: 'Validación del gol',
          text: 'Si el árbitro hace una señal de gol antes de que el balón haya rebasado en su totalidad la línea de meta, el gol no puede concederse y el juego debe reanudarse con balón a tierra.'
        },
        {
          subtitle: 'Protocolo de tanda de penales',
          text: 'Solo pueden participar en la tanda de penales los jugadores presentes en el terreno de juego al sonar el silbatazo final (o que estén temporalmente fuera por lesión autorizada). Si un equipo termina con menos jugadores que el rival (por expulsiones o lesiones), el rival debe reducir su número de ejecutores para igualar el número.'
        }
      ]
    },
    level3: {
      title: 'Excepciones y casos límite',
      cases: [
        {
          caseTitle: 'Portero lesionado durante la tanda de penales',
          text: 'Un guardameta que no pueda continuar durante la tanda de penales puede ser sustituido por un suplente nombrado (si al equipo le quedan sustituciones disponibles) o por un jugador de campo que haya sido igualado previamente.'
        },
        {
          caseTitle: 'Gol marcado con la mano tras impacto involuntario inmediato',
          text: 'Si un delantero anota directamente con su mano o brazo, o el balón golpea accidentalmente su mano e inmediatamente después anota, el gol se anula siempre.'
        }
      ]
    },
    table: [
      {
        infraction: 'Delantero introduce el balón al arco deliberadamente con la mano',
        restart: 'Tiro libre directo para el equipo defensor',
        sanction: 'Tarjeta Amarilla por conducta antideportiva'
      },
      {
        infraction: 'Árbitro valida gol sin percatarse de que el balón entró por un lateral roto de la red',
        restart: 'Saque de meta si el error se advierte antes de reanudar el juego',
        sanction: 'Sin sanción disciplinaria'
      },
      {
        infraction: 'Jugador no autorizado interviene en la tanda de penales',
        restart: 'Tiro anulado y repetición con tirador legítimo',
        sanction: 'Tarjeta Amarilla por conducta antideportiva'
      }
    ],
    practicalCriteria: 'En tandas de penales, registra en tu tarjeta el dorsal y orden de cada pateador. Informa con antelación a los arqueros sobre la obligación estricta de tener un pie en la línea.'
  },
  {
    number: 11,
    title: 'El Fuera de Juego (Offside)',
    category: 'fouls',
    officialUrl: 'https://www.theifab.com/es/laws/latest/offside/',
    auditStatus: 'Verificada ✔ (06/10/2026)',
    hasNovelty2026: true,
    noveltyText: 'Clarificación consolidada de la IFAB sobre la diferencia entre juego deliberado (deliberate play) vs desvío (deflection) y salvada voluntaria (save).',
    needsVerification: false,
    verificationNotes: null,
    level1: {
      title: 'Esencial (30 s)',
      summary: 'Estar en posición adelantada NO es infracción por sí solo. Solo se sanciona cuando un jugador situado en dicha posición en el momento del pase se involucra activamente en la jugada.',
      corePoints: [
        'Posición adelantada: cabeza, tronco o pies más cerca de la línea de meta contraria que el balón y el penúltimo rival.',
        'NO hay fuera de juego en la propia mitad del campo ni cuando el atacante está en línea con el penúltimo adversario (o con los dos últimos). Manos y brazos no cuentan.',
        'El momento de evaluación es EXACTAMENTE cuando el compañero juega o toca el balón (no cuando el atacante lo recibe).',
        'Excepciones sin fuera de juego: NUNCA hay fuera de juego al recibir el balón directamente de un saque de meta, saque de banda o saque de esquina.'
      ]
    },
    level2: {
      title: 'Detalle normativo',
      sections: [
        {
          subtitle: 'Momento de evaluación y posición anatómica',
          text: 'La posición se juzga en el instante exacto en que un compañero toca o juega el balón. No se consideran las manos ni los brazos de ningún jugador (incluido el portero, tomando el límite superior de la axila). En línea no es posición adelantada.'
        },
        {
          subtitle: 'Las tres formas exclusivas de infracción',
          text: '1) Interferir en el juego: jugar o tocar el balón pasado por un compañero. 2) Interferir a un adversario: impedir que juegue o dispute el balón al obstruir claramente su campo visual; disputarle el balón; intentar jugar claramente un balón cercano cuando esa acción impacta en el rival; o realizar una acción manifiesta que afecte con claridad la capacidad del adversario para jugar la pelota. 3) Sacar ventaja: jugar el balón tras un rebote en postes, travesaño, árbitro o rival, o tras una salvada deliberada ("save") de cualquier adversario.'
        },
        {
          subtitle: 'Juego deliberado frente a desvío y salvada',
          text: 'Juego Deliberado ("Deliberate Play"): cuando un defensor tiene tiempo, visión clara y coordinación para jugar voluntariamente el balón (despejar, pasar o controlar), aunque su toque resulte defectuoso, HABILITA al atacante adelantado (no hay fuera de juego). Desvío ("Deflection"): un rebote instintivo o sin tiempo de reacción en un defensor NO habilita al atacante (sí hay fuera de juego si participa). Salvada ("Save"): acción deliberada de cualquier adversario para evitar o intentar evitar un gol inminente; si el rebote llega al atacante adelantado, SÍ se sanciona fuera de juego.'
        },
        {
          subtitle: 'Excepciones de saque y punto de reanudación',
          text: 'No existe fuera de juego si el jugador recibe el balón directamente de un saque de meta, un saque de banda o un saque de esquina. Cuando se comete la infracción, se reanuda con Tiro Libre Indirecto en el lugar donde ocurrió la infracción (incluso si está en la propia mitad del campo si el atacante regresó desde posición adelantada para jugar el balón).'
        }
      ]
    },
    level3: {
      title: 'Excepciones y casos límite',
      cases: [
        {
          caseTitle: 'Atacante que retrocede a su propia mitad para disputar el balón',
          text: 'Si un jugador estaba en posición adelantada en campo rival al momento del pase y retrocede hasta su propia mitad para recibir el balón o disputarlo a un rival, la infracción se consuma al tocar o disputar el balón: se reanuda con tiro libre indirecto dentro de su propia mitad.'
        },
        {
          caseTitle: 'Defensor que sale del campo para provocar el fuera de juego',
          text: 'Cualquier defensor que abandone deliberadamente el terreno de juego sin autorización del árbitro será considerado como situado sobre su propia línea de meta o banda a efectos del fuera de juego, hasta la siguiente interrupción de las acciones o hasta que el equipo defensor haya jugado el balón hacia la línea media.'
        },
        {
          caseTitle: 'Atacante inmóvil dentro de la portería contraria',
          text: 'Si un atacante en posición adelantada se encuentra inmóvil dentro de las redes de la portería rival mientras el balón entra, el gol es legal a menos que el atacante cometa una infracción o distraiga o estorbe activamente al guardameta.'
        }
      ]
    },
    table: [
      {
        infraction: 'Atacante adelantado recibe y juega el balón tras pase de su compañero',
        restart: 'Tiro libre indirecto en el punto de contacto',
        sanction: 'Sin sanción disciplinaria'
      },
      {
        infraction: 'Atacante adelantado obstruye la visión directa del portero en un remate lejano',
        restart: 'Tiro libre indirecto en el punto donde obstruyó la visión',
        sanction: 'Sin sanción disciplinaria (gol anulado)'
      },
      {
        infraction: 'Atacante adelantado aprovecha el rebote de una atajada del portero que evitó gol',
        restart: 'Tiro libre indirecto en el punto del rebote',
        sanction: 'Sin sanción disciplinaria'
      },
      {
        infraction: 'Atacante adelantado recibe el balón tras un despeje pifiado voluntario del defensor',
        restart: 'El juego continúa (Gol válido o jugada legal: acción deliberada habilita)',
        sanction: 'Sin infracción'
      },
      {
        infraction: 'Atacante adelantado recibe el balón directamente de un saque de meta o banda',
        restart: 'El juego continúa (Excepción legal sin fuera de juego)',
        sanction: 'Sin infracción'
      }
    ],
    practicalCriteria: 'Diferencia siempre: "¿El defensor tuvo tiempo, visión y control de su cuerpo para coordinar el rechazo?" Si la respuesta es sí, es juego deliberado y habilita al atacante, aunque le pegue mal. Si el balón le pegó por sorpresa o fue un reflejo desesperado, es desvío y persiste el fuera de juego.'
  },
  {
    number: 12,
    title: 'Faltas y Conducta Incorrecta',
    category: 'fouls',
    officialUrl: 'https://www.theifab.com/es/laws/latest/fouls-and-misconduct/',
    auditStatus: 'Verificada ✔ (06/10/2026)',
    hasNovelty2026: true,
    noveltyText: 'Directriz sobre conducta de capitanes, atenuación de doble castigo en manos accidentales en área y ensayos en curso sobre tiempo de retención del arquero (cuenta visual de 8 segundos).',
    needsVerification: false,
    verificationNotes: null,
    level1: {
      title: 'Esencial (30 s)',
      summary: 'Distingue entre faltas de contacto físico (directas e indirectas), manos punibles y medidas disciplinarias (amonestaciones y expulsiones según gravedad, temeridad y frustración táctica).',
      corePoints: [
        'Gradación física: Imprudente (falta sin tarjeta), Temeraria (Tarjeta Amarilla), Fuerza Excesiva (Tarjeta Roja directa).',
        'Criterio de Manos: contacto voluntario o cuando el brazo agranda la silueta de manera antinatural no justificada por el movimiento del cuerpo.',
        'DOGSO (Denegar Ocasión Manifiesta de Gol): Roja directa; si ocurre en el área penal disputando el balón se degrada a Tarjeta Amarilla + Penal.',
        'SPA (Detener Ataque Prometedor): Tarjeta Amarilla obligatoria, salvo si se concedió ventaja y la jugada culminó en gol.'
      ]
    },
    level2: {
      title: 'Detalle normativo',
      sections: [
        {
          subtitle: 'Faltas de tiro libre directo e indirecto',
          text: 'Tiro libre directo por cargar, saltar, dar una patada, empujar, golpear, hacer zancadilla o sujetar de forma imprudente, temeraria o con fuerza excesiva, así como tocar el balón con la mano deliberadamente o morder/escupir. Tiro libre indirecto por juego peligroso, obstaculizar sin contacto, impedir saque del guardameta o retención del portero.'
        },
        {
          subtitle: 'Protocolo de manos IFAB',
          text: 'Constituye infracción si el jugador: toca el balón deliberadamente con la mano o el brazo; o si toca el balón con la mano/brazo en posición antinatural habiendo agrandado su cuerpo de manera injustificada biomecánicamente. No es infracción si el balón proviene directamente de su propia cabeza o cuerpo tras despejarlo, ni si es la mano de apoyo en el suelo durante una caída.'
        },
        {
          subtitle: 'DOGSO vs SPA y las 4D',
          text: 'Para DOGSO deben confluir las 4 D: Distancia a la portería, Dirección general del juego, Disposición y control probable del balón, y número y ubicación de Defensores. Si falta uno, se tipifica como SPA. En el área penal: si la falta de DOGSO es con intento de disputar el balón = Tarjeta Amarilla + Penal. Si es sujeción, empujón o sin opción de jugar el balón = Tarjeta Roja + Penal.'
        }
      ]
    },
    level3: {
      title: 'Excepciones y casos límite',
      cases: [
        {
          caseTitle: 'Ventaja en jugada de SPA que termina en gol',
          text: 'Si el árbitro aplica la ley de la ventaja tras una infracción que cortaba un ataque prometedor y la jugada culmina directamente en gol, NO se muestra tarjeta amarilla por SPA porque el fin antideportivo de cortar el ataque no se consumó.'
        },
        {
          caseTitle: 'Portero que retiene el balón con las manos tras pase voluntario con el pie de un compañero',
          text: 'Se sanciona Tiro Libre Indirecto en el lugar de la infracción para el adversario (con la limitación de la línea del área de meta si ocurrió en el área chica). No conlleva tarjeta disciplinaria.'
        }
      ]
    },
    table: [
      {
        infraction: 'Entrada con fuerza excesiva poniendo en peligro la integridad física',
        restart: 'Tiro libre directo o tiro penal',
        sanction: 'Tarjeta Roja directa (Juego Brusco Grave)'
      },
      {
        infraction: 'DOGSO dentro del área cometiendo falta en disputa legítima del balón',
        restart: 'Tiro penal',
        sanction: 'Tarjeta Amarilla (despenalización de doble castigo)'
      },
      {
        infraction: 'DOGSO dentro del área con jalón de camiseta sin disputa de balón',
        restart: 'Tiro penal',
        sanction: 'Tarjeta Roja directa (mantiene expulsión)'
      },
      {
        infraction: 'Corte de ataque prometedor (SPA) mediante zancadilla en medio campo',
        restart: 'Tiro libre directo',
        sanction: 'Tarjeta Amarilla por falta táctica'
      },
      {
        infraction: 'Guardameta agarra con la mano un pase deliberado con el pie de su defensor',
        restart: 'Tiro libre indirecto',
        sanction: 'Sin sanción disciplinaria'
      }
    ],
    practicalCriteria: 'Revisa de inmediato: ¿Fue imprudente (descuido sin malicia), temeraria (sin medir el riesgo para el rival) o con fuerza excesiva (peligro inminente de lesión con tacos expuestos)? Calibra la tarjeta con frialdad y congruencia.'
  },
  {
    number: 13,
    title: 'Tiros Libres',
    category: 'restarts',
    officialUrl: 'https://www.theifab.com/es/laws/latest/free-kicks/',
    auditStatus: 'Verificada ✔ (06/10/2026)',
    hasNovelty2026: false,
    needsVerification: false,
    verificationNotes: null,
    level1: {
      title: 'Esencial (30 s)',
      summary: 'Se clasifican en directos (se puede anotar gol directamente) e indirectos (requiere toque de un segundo jugador). La distancia reglamentaria para los adversarios es de 9.15 metros.',
      corePoints: [
        'Señal del tiro libre indirecto: el árbitro levanta un brazo verticalmente hasta que otro jugador toque el balón o salga del juego.',
        'Distancia de la barrera: los rivales deben situarse a al menos 9.15 m del balón.',
        'Si la barrera defensiva tiene 3 o más jugadores: los atacantes deben mantenerse a al menos 1 metro de distancia de la barrera.'
      ]
    },
    level2: {
      title: 'Detalle normativo',
      sections: [
        {
          subtitle: 'Ejecución y balón en juego',
          text: 'El balón debe estar completamente quieto antes del golpeo. El balón está en juego en cuanto es pateado y se mueve con claridad. Puede ejecutarse en cualquier dirección. En tiros libres dentro de la propia área, el balón está en juego sin necesidad de salir del área penal.'
        },
        {
          subtitle: 'Restricción a atacantes en la barrera',
          text: 'Cuando tres o más defensores forman una barrera, todos los compañeros del ejecutor deben permanecer a una distancia mínima de 1 metro de dicha barrera hasta que el balón esté en juego. Si un atacante no respeta el metro al momento del disparo, se sanciona tiro libre indirecto para la defensa.'
        }
      ]
    },
    level3: {
      title: 'Excepciones y casos límite',
      cases: [
        {
          caseTitle: 'Tiro libre indirecto que entra directamente a la portería',
          text: 'Si se ejecuta un tiro libre indirecto y el balón entra directamente en la meta adversaria sin que ningún otro jugador lo toque, el gol no es válido: se concede saque de meta al adversario.'
        },
        {
          caseTitle: 'Autogol directo en tiro libre (directo o indirecto)',
          text: 'Ningún tiro libre permite anotar un autogol directamente. Si un tiro libre es pateado directamente hacia la propia meta y entra sin rozar a nadie más, se reanuda con saque de esquina para el equipo rival.'
        }
      ]
    },
    table: [
      {
        infraction: 'Atacante se ubica a menos de 1 metro de una barrera defensiva de 3 hombres',
        restart: 'Tiro libre indirecto para el equipo defensor',
        sanction: 'Sin sanción disciplinaria'
      },
      {
        infraction: 'Ejecutor toca el balón por segunda vez antes de que otro jugador lo toque',
        restart: 'Tiro libre indirecto (o directo si fue con la mano)',
        sanction: 'Sin sanción disciplinaria ordinaria'
      },
      {
        infraction: 'Rival adelanta la barrera deliberadamente antes de que el balón esté en juego',
        restart: 'Repetición del tiro libre',
        sanction: 'Tarjeta Amarilla por no respetar la distancia'
      }
    ],
    practicalCriteria: 'Calibra tus pasos para medir con exactitud los 9.15 m y aplica el spray desvaneciente. Si un atacante intenta meterse en la barrera para abrir huecos, adviértele antes del pitazo.'
  },
  {
    number: 14,
    title: 'El Tiro Penal',
    category: 'restarts',
    officialUrl: 'https://www.theifab.com/es/laws/latest/the-penalty-kick/',
    auditStatus: 'Verificada ✔ (06/10/2026)',
    hasNovelty2026: true,
    noveltyText: 'Reafirmación de la conducta del guardameta: prohibido distraer de forma antideportiva al ejecutor y exigencia de mantener al menos parte de un pie sobre o detrás de la línea de meta.',
    needsVerification: false,
    verificationNotes: null,
    level1: {
      title: 'Esencial (30 s)',
      summary: 'Se concede por una infracción de tiro libre directo cometida dentro del área penal del infractor. El ejecutor debe estar identificado y el guardameta situado sobre la línea de meta.',
      corePoints: [
        'Ubicación del balón en el punto penal (11 metros). Todos los jugadores, salvo ejecutor y arquero, fuera del área y a 9.15 m del punto.',
        'El guardameta debe tener al menos una parte de cualquier pie tocando o proyectándose sobre la línea de meta en el momento del pateo.',
        'Fintas en la carrera permitidas; fintas ilegales una vez completada la carrera hacia el balón sancionadas con tarjeta amarilla.'
      ]
    },
    level2: {
      title: 'Detalle normativo',
      sections: [
        {
          subtitle: 'Comportamiento del guardameta',
          text: 'El portero debe permanecer sobre la línea de meta, de frente al ejecutor, entre los postes, sin tocar los postes, el travesaño ni la red hasta que el balón haya sido pateado. No debe distraer de forma antirreglamentaria al pateador.'
        },
        {
          subtitle: 'Finta ilegal y pase hacia adelante',
          text: 'El balón debe ser pateado hacia adelante. Se permite pasar el balón hacia adelante a un compañero siempre que este no haya invadido el área antes del golpeo. Amagar una vez finalizada la carrera hacia la pelota es conducta antideportiva y anula el gol.'
        }
      ]
    },
    level3: {
      title: 'Excepciones y casos límite',
      cases: [
        {
          caseTitle: 'Invasión simultánea de área por jugadores de ambos equipos',
          text: 'Si jugadores de ambos equipos invaden el área o el semicírculo antes del pateo, el tiro penal se repite siempre, sin importar si el tiro terminó en gol o fue atajado.'
        },
        {
          caseTitle: 'Adelantamiento del arquero con atajada vs tiro que sale desviado',
          text: 'Si el guardameta se adelanta ilegalmente y ataja el tiro, se repite el penal (y se le advierte o amonesta si reincide). Sin embargo, si el portero se adelanta pero el disparo sale completamente desviado o pega en el poste sin que el arquero toque el balón, NO se repite el tiro a menos que el adelantamiento haya influido claramente en el pateador.'
        }
      ]
    },
    table: [
      {
        infraction: 'Invasión del área por defensor: el balón termina en gol',
        restart: 'Gol válido',
        sanction: 'Sin sanción disciplinaria'
      },
      {
        infraction: 'Invasión del área por defensor: el guardameta ataja el tiro',
        restart: 'Repetición del tiro penal',
        sanction: 'Advertencia al defensor invasor'
      },
      {
        infraction: 'Invasión del área por atacante: el balón termina en gol',
        restart: 'Repetición del tiro penal',
        sanction: 'Advertencia al atacante'
      },
      {
        infraction: 'Invasión del área por atacante: el balón no entra a la meta',
        restart: 'Tiro libre indirecto para el equipo defensor',
        sanction: 'Sin sanción disciplinaria'
      },
      {
        infraction: 'Finta ilegal del ejecutor tras terminar la carrera hacia el balón',
        restart: 'Tiro libre indirecto para el adversario (sin gol)',
        sanction: 'Tarjeta Amarilla al ejecutor por conducta antideportiva'
      }
    ],
    practicalCriteria: 'Colócate en el vértice del área chica con línea de meta para vigilar al guardameta y al asistente. No pites el saque hasta que todos los jugadores estén fuera del semicírculo y del área penal.'
  },
  {
    number: 15,
    title: 'El Saque de Banda',
    category: 'restarts',
    officialUrl: 'https://www.theifab.com/es/laws/latest/the-throw-in/',
    auditStatus: 'Verificada ✔ (06/10/2026)',
    hasNovelty2026: false,
    needsVerification: false,
    verificationNotes: null,
    level1: {
      title: 'Esencial (30 s)',
      summary: 'Se concede cuando el balón traspasa completamente la línea de banda. Se ejecuta de frente al terreno de juego, con ambas manos desde atrás y por encima de la cabeza, con ambos pies en el suelo sobre o detrás de la línea.',
      corePoints: [
        'Los adversarios deben situarse a al menos 2 metros del punto de la línea donde se efectúa el saque.',
        'NO se puede marcar un gol directamente de un saque de banda.',
        'En un saque de banda NO existe fuera de juego al recibir el balón directamente del lanzador.'
      ]
    },
    level2: {
      title: 'Detalle normativo',
      sections: [
        {
          subtitle: 'Técnica reglamentaria de lanzamiento',
          text: 'Al momento de lanzar, el ejecutor debe estar de pie de cara al terreno; tener parte de ambos pies sobre o detrás de la línea de banda; y lanzar el balón con ambas manos desde atrás y por encima de la cabeza desde el punto por donde salió la pelota.'
        },
        {
          subtitle: 'Doble toque del ejecutor',
          text: 'Si el lanzador vuelve a tocar el balón antes de que haya tocado a otro jugador, se sanciona tiro libre indirecto (o tiro libre directo si comete infracción por mano).'
        }
      ]
    },
    level3: {
      title: 'Excepciones y casos límite',
      cases: [
        {
          caseTitle: 'Balón lanzado directamente a la portería contraria',
          text: 'Si el saque de banda entra en el arco rival sin que ningún jugador lo toque, el gol no es válido: se concede saque de meta al adversario.'
        },
        {
          caseTitle: 'Balón lanzado directamente a la propia portería',
          text: 'Si el balón es lanzado directamente hacia el propio arco y entra sin tocar a nadie, el autogol no es válido: se concede saque de esquina al equipo rival.'
        }
      ]
    },
    table: [
      {
        infraction: 'Saque de banda mal ejecutado (levantar un pie o lanzar con una mano)',
        restart: 'Saque de banda para el equipo adversario',
        sanction: 'Sin sanción disciplinaria'
      },
      {
        infraction: 'Rival se para a menos de 2 metros del lanzador e interfiere el saque',
        restart: 'Repetición del saque de banda si se ejecutó',
        sanction: 'Tarjeta Amarilla por no respetar la distancia'
      },
      {
        infraction: 'Lanzador arroja deliberadamente el balón con fuerza contra un rival',
        restart: 'Tiro libre directo o tiro penal',
        sanction: 'Tarjeta Roja por conducta violenta'
      }
    ],
    practicalCriteria: 'No permitas que ganen 10 metros avanzando ilegalmente antes del lanzamiento. Si sacan mal con los pies despegados del suelo, pasa de inmediato la posesión al rival sin dudar.'
  },
  {
    number: 16,
    title: 'El Saque de Meta',
    category: 'restarts',
    officialUrl: 'https://www.theifab.com/es/laws/latest/the-goal-kick/',
    auditStatus: 'Verificada ✔ (06/10/2026)',
    hasNovelty2026: false,
    needsVerification: false,
    verificationNotes: null,
    level1: {
      title: 'Esencial (30 s)',
      summary: 'Se concede cuando el balón cruza la línea de meta por fuera de los postes tras ser tocado en último término por un atacante. Se ejecuta desde cualquier punto del área de meta.',
      corePoints: [
        'El balón entra en juego en cuanto es pateado y se mueve con claridad (no requiere salir del área penal).',
        'Los adversarios deben permanecer fuera del área penal hasta que el balón esté en juego.',
        'Se puede anotar gol válido directamente en la portería adversaria; NO hay fuera de juego al recibir el balón directamente.'
      ]
    },
    level2: {
      title: 'Detalle normativo',
      sections: [
        {
          subtitle: 'Procedimiento de ejecución',
          text: 'El balón se coloca en cualquier punto del área de meta y no puede moverse antes del golpeo. Los rivales deben encontrarse fuera del área penal hasta que el balón esté en juego. Si un rival disputa el balón habiendo estado dentro del área antes del saque, se repite el saque de meta.'
        },
        {
          subtitle: 'Autogol directo',
          text: 'Si el balón es pateado directamente hacia la propia meta y entra sin haber sido tocado por ningún otro jugador, el gol no es válido: se concede saque de esquina para el adversario.'
        }
      ]
    },
    level3: {
      title: 'Excepciones y casos límite',
      cases: [
        {
          caseTitle: 'Rival que no tuvo tiempo de salir del área pero no interfiere',
          text: 'Si un equipo decide sacar rápido de meta mientras un adversario aún no ha salido del área, ese adversario no puede disputar el balón de inmediato, pero si el equipo saca hacia él o juega voluntariamente, el árbitro puede permitir continuar si no hubo ventaja desleal.'
        },
        {
          caseTitle: 'Estrategia para eludir la regla (truco de cabeza al arquero)',
          text: 'Si un jugador eleva deliberadamente el balón con el pie desde el saque de meta para que un compañero se lo devuelva con la cabeza y el arquero lo tome con las manos, es conducta antideportiva: se repite el saque de meta y se amonesta al infractor.'
        }
      ]
    },
    table: [
      {
        infraction: 'Rival dentro del área penal disputa el balón antes de que esté legalmente en juego',
        restart: 'Repetición del saque de meta',
        sanction: 'Advertencia (o tarjeta amarilla si es reiterado)'
      },
      {
        infraction: 'Ejecutor toca el balón con la mano tras haberlo pateado sin que otro lo toque',
        restart: 'Tiro libre directo (o penal si fue jugador de campo en su área)',
        sanction: 'Sin sanción disciplinaria ordinaria'
      },
      {
        infraction: 'El balón sale del área de meta pero entra directamente en la propia portería',
        restart: 'Saque de esquina para el adversario',
        sanction: 'Sin sanción disciplinaria'
      }
    ],
    practicalCriteria: 'Verifica siempre que el balón esté completamente estático antes de que el portero lo impacte. Recuerda a tus asistentes que no hay fuera de juego directo desde un saque de meta.'
  },
  {
    number: 17,
    title: 'El Saque de Esquina',
    category: 'restarts',
    officialUrl: 'https://www.theifab.com/es/laws/latest/the-corner-kick/',
    auditStatus: 'Verificada ✔ (06/10/2026)',
    hasNovelty2026: false,
    needsVerification: false,
    verificationNotes: null,
    level1: {
      title: 'Esencial (30 s)',
      summary: 'Se concede cuando el balón traspasa la línea de meta por fuera de los postes tras haber sido tocado en último término por un defensor. Se ejecuta desde el cuadrante de esquina más cercano.',
      corePoints: [
        'El balón debe colocarse dentro del cuadrante de esquina o tocando alguna de sus líneas.',
        'Los adversarios deben situarse a al menos 9.15 m del cuadrante de esquina.',
        'Se puede anotar gol olímpico válido directamente; NO hay fuera de juego al recibir el balón directamente del saque.'
      ]
    },
    level2: {
      title: 'Detalle normativo',
      sections: [
        {
          subtitle: 'Colocación y bandera de esquina',
          text: 'El poste de banderín no debe moverse ni inclinarse para facilitar el saque. El balón está en juego en cuanto es pateado y se mueve con claridad, sin necesidad de salir del cuadrante de esquina.'
        },
        {
          subtitle: 'Autogol directo',
          text: 'Si el saque de esquina es ejecutado hacia la propia portería y entra directamente sin que nadie lo toque, el autogol no se valida: se reanuda con saque de esquina a favor del adversario.'
        }
      ]
    },
    level3: {
      title: 'Excepciones y casos límite',
      cases: [
        {
          caseTitle: 'Doble toque del ejecutor tras dar en el poste de la portería',
          text: 'Si el balón pega en el poste y regresa al ejecutor sin que ningún otro jugador lo toque y este vuelve a jugar el balón, se sanciona tiro libre indirecto para el adversario por doble toque.'
        },
        {
          caseTitle: 'Rival que no respeta la distancia de 9.15 m del cuadrante',
          text: 'Si un defensor se coloca a menos de 9.15 metros y bloquea o desvía el balón lanzado, el saque de esquina se repite y el infractor es amonestado con tarjeta amarilla.'
        }
      ]
    },
    table: [
      {
        infraction: 'Rival no respeta la distancia reglamentaria de 9.15 m en el córner',
        restart: 'Repetición del saque de esquina',
        sanction: 'Tarjeta Amarilla por no respetar la distancia'
      },
      {
        infraction: 'Ejecutor toca el balón dos veces consecutivas antes de que otro lo toque',
        restart: 'Tiro libre indirecto para el adversario',
        sanction: 'Sin sanción disciplinaria'
      },
      {
        infraction: 'Jugador mueve o retira el poste de banderín de esquina antes de patear',
        restart: 'El poste debe reponerse en su sitio vertical',
        sanction: 'Tarjeta Amarilla por conducta antideportiva'
      }
    ],
    practicalCriteria: 'Ubícate en la diagonal del área chica hacia el punto penal vigilando empujones y sujeciones antes de que salga el balón del cuadrante de esquina.'
  }
];
