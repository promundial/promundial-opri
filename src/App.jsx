import { useState, useEffect, useCallback } from "react";

// ── Brand ─────────────────────────────────────────────────────────────────────
const GREEN = "#1B4332";
const GREEN_MID = "#2D6A4F";
const GREEN_LT = "#40916C";
const GOLD = "#C9A84C";
const GOLD_PALE = "#F5EDD0";
const CREAM = "#F8F4EC";
const CREAM_DK = "#EDE6D6";
const CHARCOAL = "#1A1A1A";
const MUTED = "#6B7280";
const MUTED_LT = "#9CA3AF";
const WHITE = "#FFFFFF";
const RED = "#B91C1C";
const AMBER = "#D97706";
const TEAL = "#0F766E";
const BLUE = "#1D4ED8";
const VIOLET = "#7C3AED";
const INDIGO = "#4338CA";
const ORANGE = "#EA580C";

const MATURITY = [
  { min: 0,   max: 2.5,  es: "Crítico",        color: RED },
  { min: 2.5, max: 3.2,  es: "Vulnerable",      color: ORANGE },
  { min: 3.2, max: 3.8,  es: "Estable",         color: AMBER },
  { min: 3.8, max: 4.3,  es: "Alto Desempeño",  color: GREEN_LT },
  { min: 4.3, max: 5.01, es: "World Class",     color: GREEN },
];

const PAI_BANDS = [
  { min: 0,   max: 0.3,  label: "Alta alineación",      color: GREEN },
  { min: 0.3, max: 0.7,  label: "Moderado",             color: AMBER },
  { min: 0.7, max: 1.2,  label: "Riesgo",               color: ORANGE },
  { min: 1.2, max: 99,   label: "Desconexión crítica",  color: RED },
];

function getMaturity(s) {
  return MATURITY.find(m => s >= m.min && s < m.max) || MATURITY[MATURITY.length - 1];
}
function getPAIBand(g) {
  return PAI_BANDS.find(b => g >= b.min && g < b.max) || PAI_BANDS[PAI_BANDS.length - 1];
}
function avg(arr) {
  const f = arr.filter(v => v != null);
  return f.length ? f.reduce((a, b) => a + b, 0) / f.length : null;
}

// ── Question data ─────────────────────────────────────────────────────────────
const CORE_DIMS = [
  { id: "alignment", short: "Alineación", label: "Strategic Alignment", weight: 0.20, color: BLUE, questions: [
    { id: "A1", text: "Las prioridades estratégicas de la organización están claramente definidas y son conocidas en todos los niveles." },
    { id: "A2", text: "Los mensajes sobre prioridades estratégicas son coherentes entre lo que dice la alta dirección y lo que comunican los mandos medios." },
    { id: "A3", text: "Existe una conexión clara y explícita entre los objetivos de cada área y las prioridades estratégicas de la organización." },
    { id: "A4", text: "Cuando surgen conflictos de prioridades entre áreas, se resuelven con criterios claros y sin fricciones políticas." },
    { id: "A5", text: "La organización tiene un número manejable de iniciativas en curso y les asigna los recursos necesarios para completarlas." },
  ]},
  { id: "execution", short: "Ejecución", label: "Execution Excellence", weight: 0.30, color: GREEN, questions: [
    { id: "E1", text: "Cuando un resultado importante no se logra, siempre está claro quién era el responsable y por qué no se alcanzó." },
    { id: "E2", text: "Los compromisos asumidos entre áreas y personas se cumplen sin necesidad de seguimiento constante." },
    { id: "E3", text: "Los problemas operativos se resuelven atacando su causa raíz, no solo sus síntomas." },
    { id: "E4", text: "Las decisiones importantes no se postergan y se traducen en acciones con responsables y plazos claros." },
    { id: "E5", text: "Cuando un indicador muestra una desviación, se toman acciones correctivas concretas antes de que el problema escale." },
    { id: "E6", text: "La organización tiene mecanismos efectivos para evitar que los mismos problemas se repitan." },
    { id: "E7", text: "Las iniciativas estratégicas se completan en su totalidad — no se abandonan a mitad de camino cuando surgen nuevas prioridades." },
  ]},
  { id: "leadership", short: "Liderazgo", label: "Leadership & Collective Effectiveness", weight: 0.25, color: VIOLET, questions: [
    { id: "L1", text: "Los líderes de la organización anteponen los objetivos colectivos a los intereses de su propia área." },
    { id: "L2", text: "Los líderes se dicen las cosas difíciles directamente, sin rodeos ni conversaciones paralelas." },
    { id: "L3", text: "Las personas que discrepan con una decisión importante tienen espacios reales para expresarlo antes de que se tome." },
    { id: "L4", text: "Los conflictos entre personas o áreas se abordan abiertamente en lugar de ignorarse o postergarse." },
    { id: "L5", text: "Lo que los líderes dicen en las reuniones directivas es coherente con lo que comunican a sus equipos." },
    { id: "L6", text: "Los líderes cumplen con los mismos estándares que exigen a sus equipos — no hay una regla para ellos y otra para los demás." },
  ]},
  { id: "resilience", short: "Resiliencia", label: "Change & Resilience Capability", weight: 0.15, color: AMBER, questions: [
    { id: "R1", text: "Cuando el entorno cambia inesperadamente, la organización modifica sus planes y prioridades sin resistencia excesiva." },
    { id: "R2", text: "En esta organización, cuestionar la manera en que siempre se han hecho las cosas no genera resistencia ni represalias." },
    { id: "R3", text: "Cuando algo sale mal, la organización analiza lo ocurrido formalmente y aplica los aprendizajes para evitar que se repita." },
    { id: "R4", text: "Los cambios implementados en esta organización se mantienen en el tiempo sin necesidad de presión constante para sostenerlos." },
  ]},
  { id: "culture", short: "Cultura", label: "Organizational Health & Culture", weight: 0.10, color: TEAL, questions: [
    { id: "C1", text: "Las áreas comparten información y recursos espontáneamente, sin necesidad de que alguien lo solicite o lo fuerce." },
    { id: "C2", text: "Las personas pueden tomar decisiones dentro de su rol sin tener que esperar aprobación de niveles superiores para cada cosa." },
    { id: "C3", text: "Cuando algo sale mal en otra área, las personas de esta organización se involucran para ayudar aunque no sea su responsabilidad directa." },
  ]},
];

const EXTRA_Q = {
  alignment: [
    { id: "SA6",  text: "Antes de tomar una decisión importante, se evalúa explícitamente si es coherente con las prioridades estratégicas vigentes." },
    { id: "SA7",  text: "Cuando cambian las prioridades estratégicas, los recursos se reasignan con rapidez y sin resistencia política excesiva." },
    { id: "SA8",  text: "Las personas de diferentes áreas conocen los objetivos de sus contrapartes y adaptan su trabajo para no generar conflictos entre ellos." },
    { id: "SA9",  text: "Los líderes dedican tiempo y atención personal a las iniciativas estratégicas — no solo las anuncian y luego las delegan completamente." },
    { id: "SA10", text: "Las prioridades estratégicas no cambian tan frecuentemente que impidan completar lo que se empezó." },
    { id: "SA11", text: "Cuando los objetivos de diferentes áreas entran en conflicto, existe un proceso claro para resolverlo sin que escale a política interna." },
    { id: "SA12", text: "Cuando se define una nueva prioridad, la organización también decide explícitamente qué va a dejar de hacer para liberar recursos." },
  ],
  execution: [
    { id: "EX8",  text: "Las personas escalan los problemas que no pueden resolver por sí solas sin temor a ser vistas como incapaces." },
    { id: "EX9",  text: "Al terminar una reunión de seguimiento, todos los participantes saben exactamente qué deben hacer, quién lo hará y para cuándo." },
    { id: "EX10", text: "Los equipos analizan sus datos de desempeño regularmente y toman acciones de mejora concretas basadas en lo que encuentran." },
    { id: "EX11", text: "Los indicadores de esta organización detectan problemas con suficiente anticipación como para actuar antes de que se conviertan en crisis." },
    { id: "EX12", text: "Los estándares de los procesos clave son conocidos y seguidos por quienes los ejecutan — no solo existen en documentos." },
    { id: "EX13", text: "Cuando alguien se desvía de un estándar establecido, esto se detecta y se corrige antes de que afecte los resultados." },
    { id: "EX14", text: "En los procesos que involucran varias áreas, está claro quién toma las decisiones y quién es responsable del resultado final." },
    { id: "EX15", text: "El seguimiento de proyectos estratégicos genera decisiones y ajustes concretos — no es solo un ejercicio de reporte." },
    { id: "EX16", text: "Los resultados de esta organización no dependen de que ciertas personas trabajen horas extra o se esfuercen más allá de lo razonable." },
    { id: "EX17", text: "Las mejoras de proceso que se implementan en esta organización no se revierten cuando disminuye la presión o cambia quien las lideró." },
    { id: "EX18", text: "Cuando se decide implementar un cambio, se asignan recursos, se definen responsables y se monitorea el avance hasta que el cambio está completamente consolidado." },
  ],
  leadership: [
    { id: "LE7",  text: "Los temas incómodos o conflictivos se ponen sobre la mesa en las reuniones directivas en lugar de evitarse o postergarse indefinidamente." },
    { id: "LE8",  text: "Las decisiones importantes se toman priorizando el bien de la organización, incluso cuando eso implica sacrificar los intereses de un área o de una persona influyente." },
    { id: "LE9",  text: "Cuando dos áreas tienen un conflicto persistente, los líderes intervienen y lo resuelven de manera definitiva — no solo lo gestionan temporalmente." },
    { id: "LE10", text: "Cuando los líderes reciben retroalimentación crítica, la toman en cuenta y ajustan su comportamiento o sus decisiones de manera visible." },
    { id: "LE11", text: "Los líderes mantienen sus compromisos y estándares incluso bajo presión o cuando nadie los está observando." },
    { id: "LE12", text: "Los líderes tienen conversaciones regulares y estructuradas con cada miembro de su equipo sobre su desarrollo y crecimiento profesional." },
    { id: "LE13", text: "La organización identifica a sus futuros líderes con criterios explícitos y los prepara activamente antes de que los necesite, no después." },
    { id: "LE14", text: "Las decisiones tomadas en las reuniones de liderazgo llegan a los equipos operativos con suficiente claridad como para que puedan actuar sin necesidad de interpretación adicional." },
    { id: "LE15", text: "Cada líder toma decisiones cotidianas que son consistentes con la visión de largo plazo de la organización, sin necesidad de que alguien se los recuerde." },
  ],
  resilience: [
    { id: "RC5", text: "La organización detecta cambios relevantes en su entorno con suficiente anticipación como para responder proactivamente en lugar de reaccionar tarde." },
    { id: "RC6", text: "Antes de implementar cambios importantes a gran escala, la organización los prueba en pequeño para aprender y ajustar antes de comprometer todos los recursos." },
    { id: "RC7", text: "En esta organización, cometer un error y reportarlo abiertamente no tiene consecuencias negativas para quien lo reporta." },
    { id: "RC8", text: "Las lecciones aprendidas de proyectos y errores pasados se consultan activamente y modifican la manera en que se abordan situaciones similares en el futuro." },
    { id: "RC9", text: "Cuando ocurre una situación inesperada, la organización activa una respuesta coordinada sin caer en el caos o la parálisis." },
  ],
  culture: [
    { id: "OC4", text: "La información relevante para tomar decisiones llega a quienes la necesitan sin que tengan que pedirla o buscarla activamente." },
    { id: "OC5", text: "En esta organización se puede hablar abiertamente de los fracasos y errores propios sin temor al juicio, la crítica o el impacto en la reputación personal." },
    { id: "OC6", text: "Cuando alguien no cumple con los estándares esperados, recibe retroalimentación clara y directa — no indirecta, suavizada o a través de terceros." },
  ],
};

// FULL_DIMS: estructura de SCORING (Core + Extra) — 12 preguntas por dimensión.
// Se sigue usando en todos los cálculos (dashboards, checkL3, reportes) porque
// el score de cada dimensión debe reflejar el universo completo de preguntas.
const FULL_DIMS = CORE_DIMS.map(d => ({
  ...d,
  questions: [...d.questions, ...EXTRA_Q[d.id]],
}));

// EXTRA_DIMS: estructura de la ENCUESTA del Full — solo las 35 preguntas
// nuevas (no vuelve a preguntar las 25 del Core). El score sigue
// calculándose sobre FULL_DIMS gracias al merge con el Core (ver
// mergeFullWithCore / getScoringResponses más abajo).
const EXTRA_DIMS = CORE_DIMS.map(d => ({
  ...d,
  questions: EXTRA_Q[d.id],
}));

const DEEP_MODULES = [
  { id: "lei", code: "LEI", name: "Leadership", fullName: "Leadership Effectiveness Index", color: VIOLET, index: "LEI™",
    groups: [
      { label: "Vulnerabilidad & Confianza", qs: [
        { id: "LD1", text: "Los líderes reconocen sus errores abiertamente frente a sus equipos, sin minimizarlos ni buscar justificaciones." },
        { id: "LD2", text: "Las personas pueden expresar preocupaciones difíciles a sus líderes sin temor a que eso afecte negativamente su posición o sus relaciones en el trabajo." },
        { id: "LD3", text: "Los líderes reconocen abiertamente cuando no tienen la respuesta o la capacidad para resolver algo solos, y buscan ayuda sin que eso afecte su credibilidad." },
      ]},
      { label: "Responsabilidad & Compromisos", qs: [
        { id: "LD4", text: "Cuando los resultados de su área no se logran, los líderes asumen la responsabilidad sin culpar a factores externos o a otras áreas." },
        { id: "LD5", text: "Los compromisos que los líderes asumen entre sí se cumplen en el plazo acordado, sin necesidad de recordatorios ni renegociaciones constantes." },
        { id: "LD6", text: "Cuando un líder no cumple un compromiso, otro líder se lo señala directamente en lugar de ignorarlo o comentarlo con terceros." },
      ]},
      { label: "Calidad de Decisiones", qs: [
        { id: "LD7", text: "Las decisiones importantes se toman con base en datos y análisis — no por intuición, costumbre o por quien tiene más poder en la sala." },
        { id: "LD8", text: "En esta organización las personas con menos jerarquía pueden influir genuinamente en decisiones importantes cuando tienen información o perspectivas relevantes." },
        { id: "LD9", text: "La organización revisa sistemáticamente las decisiones importantes después de implementarlas para entender qué funcionó, qué no y por qué." },
      ]},
      { label: "Gestión de Conflictos", qs: [
        { id: "LD10", text: "Los desacuerdos entre líderes se discuten directamente entre las partes involucradas, no a través de intermediarios ni en conversaciones paralelas." },
        { id: "LD11", text: "Los conflictos entre líderes no se dejan pendientes indefinidamente — se resuelven antes de que afecten el desempeño del equipo o de la organización." },
        { id: "LD12", text: "En las reuniones de liderazgo se generan debates genuinos donde las personas defienden posiciones distintas antes de llegar a una decisión." },
      ]},
      { label: "Desarrollo de Personas", qs: [
        { id: "LD13", text: "Los líderes dedican tiempo deliberado a preparar a las personas de sus equipos para asumir roles de mayor responsabilidad en el futuro." },
        { id: "LD14", text: "Las personas reciben retroalimentación específica y honesta sobre su desempeño con suficiente regularidad como para poder mejorar continuamente." },
        { id: "LD15", text: "Los líderes invierten tiempo y recursos reales en el desarrollo de su gente — no solo lo declaran como prioridad en el discurso." },
      ]},
      { label: "Comunicación & Coherencia", qs: [
        { id: "LD16", text: "Las personas saben exactamente qué se espera de ellas, con qué estándares y para cuándo — sin necesidad de adivinar o interpretar." },
        { id: "LD17", text: "Los distintos líderes de la organización comunican mensajes consistentes sobre las prioridades y expectativas — no cada uno dice una cosa diferente." },
        { id: "LD18", text: "Cuando se toma una decisión importante, los líderes explican el razonamiento detrás de ella con suficiente profundidad como para que las personas puedan actuar alineadas sin necesitar instrucciones para cada situación." },
      ]},
      { label: "Ejemplo & Valores", qs: [
        { id: "LD19", text: "Los líderes son los primeros en cumplir con las normas y estándares que exigen a sus equipos, especialmente cuando es inconveniente hacerlo." },
        { id: "LD20", text: "Cuando los valores organizacionales entran en conflicto con los intereses económicos o de corto plazo, los líderes priorizan los valores." },
        { id: "LD21", text: "Los líderes no hacen excepciones a las reglas para sí mismos o para personas cercanas, incluso cuando hay presión para hacerlo." },
      ]},
      { label: "Liderazgo Colectivo", qs: [
        { id: "LD22", text: "Los líderes de diferentes áreas trabajan juntos activamente para resolver problemas que los afectan mutuamente, sin esperar que alguien de arriba los obligue a coordinarse." },
        { id: "LD23", text: "Los líderes toman decisiones que benefician a la organización en su conjunto, incluso cuando eso perjudica los resultados o la visibilidad de su propia área." },
        { id: "LD24", text: "Los líderes confían en que sus pares cumplirán sus compromisos sin necesidad de supervisarlos o verificar constantemente su trabajo." },
        { id: "LD25", text: "El equipo directivo genera tanta claridad y consistencia de mensajes que las personas de la organización pueden tomar decisiones alineadas sin necesitar validación constante de sus superiores." },
      ]},
    ],
  },
  { id: "tcs", code: "TCS", name: "Leadership Team", fullName: "Team Cohesion Score", color: INDIGO, index: "TCS™",
    groups: [
      { label: "Alineación Estratégica", qs: [
        { id: "LT1", text: "Los miembros del equipo directivo tienen una comprensión común y consistente de hacia dónde va la organización y qué es lo más importante ahora." },
        { id: "LT2", text: "Cuando hay que elegir entre prioridades que compiten, los miembros del equipo directivo llegan a acuerdos sin que el proceso se convierta en una negociación política." },
        { id: "LT3", text: "Las decisiones que toma un miembro del equipo directivo en su área son coherentes con las decisiones que toman los demás — no se contradicen ni generan confusión en la organización." },
      ]},
      { label: "Confianza & Seguridad", qs: [
        { id: "LT4", text: "Los miembros del equipo directivo confían en las capacidades y las intenciones de sus pares — no necesitan verificar ni controlar el trabajo de los demás." },
        { id: "LT5", text: "En este equipo es seguro disentir abiertamente con cualquier miembro, incluyendo al líder más senior, sin temor a consecuencias negativas." },
        { id: "LT6", text: "Las conversaciones difíciles que este equipo necesita tener se tienen oportunamente — no se evitan ni se postergan hasta que el problema se vuelve una crisis." },
      ]},
      { label: "Responsabilidad Mutua", qs: [
        { id: "LT7", text: "Los miembros del equipo se señalan mutuamente los incumplimientos de manera directa y respetuosa, sin esperar que el líder lo haga por ellos." },
        { id: "LT8", text: "Los miembros del equipo hacen seguimiento activo a los compromisos de sus pares y reaccionan cuando detectan que algo no va a cumplirse a tiempo." },
        { id: "LT9", text: "Cuando un miembro del equipo detecta que otro está generando un problema para la organización, se lo dice directamente en lugar de ignorarlo o escalarlo al líder superior." },
      ]},
      { label: "Calidad de Decisiones", qs: [
        { id: "LT10", text: "El equipo toma decisiones difíciles con oportunidad — no las posterga por miedo al conflicto o a equivocarse." },
        { id: "LT11", text: "Después de tomar una decisión importante, todos los miembros del equipo la entienden de la misma manera y pueden explicarla consistentemente a sus equipos." },
        { id: "LT12", text: "Una vez tomada una decisión colectiva, todos los miembros del equipo la defienden públicamente ante sus equipos, aunque personalmente no estén de acuerdo con ella." },
      ]},
      { label: "Debate & Conflicto Productivo", qs: [
        { id: "LT13", text: "Antes de tomar decisiones importantes, el equipo explora activamente perspectivas opuestas y escenarios alternativos, no solo confirma la opción más obvia." },
        { id: "LT14", text: "Los desacuerdos en este equipo se expresan con franqueza y sin filtros políticos, pero siempre con respeto por la persona aunque se cuestione su posición." },
        { id: "LT15", text: "Este equipo busca activamente incorporar perspectivas que incomoden o desafíen la visión dominante antes de cerrar una decisión importante." },
      ]},
      { label: "Complementariedad", qs: [
        { id: "LT16", text: "Las responsabilidades y roles en este equipo están asignados de manera que cada miembro contribuye desde sus fortalezas reales, no solo desde su cargo formal." },
        { id: "LT17", text: "Las diferencias de estilo, pensamiento y enfoque entre los miembros del equipo se aprovechan deliberadamente para mejorar la calidad de las decisiones y los resultados." },
        { id: "LT18", text: "En este equipo las contribuciones únicas de cada miembro son reconocidas explícitamente y se consideran un activo del equipo, no una amenaza para la cohesión." },
      ]},
      { label: "Orientación Colectiva", qs: [
        { id: "LT19", text: "Los miembros del equipo toman decisiones pensando en el impacto sobre la organización completa, no solo en cómo afecta a su propia área." },
        { id: "LT20", text: "Cuando los resultados organizacionales entran en conflicto con los resultados del área propia, los miembros del equipo priorizan lo que es mejor para la organización aunque eso perjudique sus métricas individuales." },
        { id: "LT21", text: "Los miembros del equipo comunican los mismos mensajes a sus equipos sobre las prioridades y decisiones organizacionales — nadie contradice o matiza lo que acordaron colectivamente." },
      ]},
      { label: "Efectividad del Equipo", qs: [
        { id: "LT22", text: "El equipo directivo opera con tanta coordinación y confianza mutua que podría resolver problemas complejos sin necesidad de que el CEO arbitre cada decisión." },
        { id: "LT23", text: "Las personas de la organización confían en que el equipo directivo toma buenas decisiones y actúa en el mejor interés de todos — no solo en el de quienes tienen más poder." },
        { id: "LT24", text: "Cuando la organización enfrenta situaciones de alta complejidad o incertidumbre, el equipo directivo responde de manera coordinada y decisiva sin paralizarse ni fragmentarse." },
        { id: "LT25", text: "Este equipo logra resultados que ninguno de sus miembros podría alcanzar trabajando de manera independiente — la colaboración genera un valor real y visible." },
      ]},
    ],
  },
  { id: "eci", code: "ECI", name: "Execution", fullName: "Execution Capability Index", color: GREEN, index: "ECI™",
    groups: [
      { label: "Claridad de Roles", qs: [
        { id: "EXD1", text: "Cuando surge una situación que no estaba prevista, está claro qué proceso seguir para decidir quién toma la decisión y cómo." },
        { id: "EXD2", text: "En los procesos críticos, las decisiones las toma quien tiene la información y la capacidad para tomarlas — no necesariamente quien tiene el cargo más alto." },
        { id: "EXD3", text: "Los problemas críticos tienen un dueño con autoridad real y recursos suficientes para resolverlos — no solo con responsabilidad nominal en papel." },
      ]},
      { label: "Gestión de Indicadores", qs: [
        { id: "EXD4", text: "Los indicadores de esta organización miden lo que realmente importa para el éxito — no solo lo que es fácil de medir o lo que siempre se ha medido." },
        { id: "EXD5", text: "Las revisiones de resultados generan decisiones y ajustes concretos — no son solo sesiones informativas donde se presenta lo que pasó sin cambiar nada." },
        { id: "EXD6", text: "Cuando los resultados se desvían de lo esperado, las acciones correctivas se implementan con suficiente rapidez y profundidad como para revertir la tendencia antes de que el problema se agrave." },
      ]},
      { label: "Rutinas de Seguimiento", qs: [
        { id: "EXD7", text: "Las rutinas de seguimiento de esta organización tienen frecuencia, formato y participantes definidos — y se respetan aunque haya presión operativa." },
        { id: "EXD8", text: "Los equipos revisan su desempeño con suficiente frecuencia como para detectar problemas cuando aún son pequeños y manejables." },
        { id: "EXD9", text: "Los problemas operativos son visibles para quienes pueden resolverlos con suficiente anticipación como para actuar antes de que afecten a los clientes o los resultados." },
      ]},
      { label: "Decisiones con Datos", qs: [
        { id: "EXD10", text: "Las personas que usan los indicadores entienden lo que estos miden, sus limitaciones y cómo interpretarlos correctamente para tomar decisiones — no solo saben leer el número." },
        { id: "EXD11", text: "Las metas de esta organización son suficientemente exigentes para requerir esfuerzo real, pero suficientemente alcanzables para que las personas crean que vale la pena intentarlo." },
        { id: "EXD12", text: "Cuando los datos apuntan en una dirección y la intuición o la política apuntan en otra, esta organización sigue los datos." },
      ]},
      { label: "Resolución de Problemas", qs: [
        { id: "EXD13", text: "Antes de implementar una solución, esta organización dedica el tiempo necesario para entender por qué ocurrió el problema — no solo para resolver el síntoma visible." },
        { id: "EXD14", text: "Esta organización tiene metodologías de resolución de problemas que todos conocen y aplican consistentemente — no depende de que ciertas personas sepan cómo hacerlo." },
        { id: "EXD15", text: "Cuando un equipo resuelve un problema importante, ese aprendizaje llega a otros equipos de manera formal y modifica la manera en que trabajan." },
      ]},
      { label: "Escalamiento", qs: [
        { id: "EXD16", text: "Los problemas se escalan antes de que se conviertan en crisis — no cuando ya es demasiado tarde para que el nivel superior pueda intervenir efectivamente." },
        { id: "EXD17", text: "Las personas saben con precisión cuándo un problema excede su nivel de autoridad y lo escalan sin dudar ni esperar que alguien se los diga." },
        { id: "EXD18", text: "Cuando un problema se escala al nivel correcto, se resuelve con rapidez — los niveles superiores no crean más burocracia sino que desbloquean la situación." },
      ]},
      { label: "Ejecución de Proyectos", qs: [
        { id: "EXD19", text: "Cuando los proyectos estratégicos se desvían del plan, se detecta rápidamente y se toman acciones correctivas antes de que el desvío afecte el resultado final." },
        { id: "EXD20", text: "Los riesgos de los proyectos estratégicos se identifican y se mitigan proactivamente — no se descubren cuando ya se convirtieron en problemas reales." },
        { id: "EXD21", text: "Los proyectos y prioridades estratégicas cuentan con los recursos humanos y financieros necesarios para ejecutarse — no compiten por recursos escasos con las operaciones del día a día." },
      ]},
      { label: "Disciplina Operativa", qs: [
        { id: "EXD22", text: "Las mejoras operativas que se implementan en esta organización tienen dueños, indicadores y revisiones periódicas que aseguran que no se reviertan con el tiempo." },
        { id: "EXD23", text: "Los procesos de esta organización están suficientemente estandarizados como para producir resultados consistentes independientemente de quién los ejecute." },
        { id: "EXD24", text: "Los estándares operativos se mantienen con la misma rigurosidad cuando hay presión de tiempo o de resultados que cuando no la hay." },
        { id: "EXD25", text: "Los clientes, socios y partes interesadas saben que cuando esta organización se compromete a algo, lo cumple — la confiabilidad es una ventaja competitiva real, no solo una aspiración." },
      ]},
    ],
  },
  { id: "aci", code: "ACI", name: "Change", fullName: "Adaptive Capability Index", color: AMBER, index: "ACI™",
    groups: [
      { label: "Aprendizaje Organizacional", qs: [
        { id: "CH1", text: "Esta organización tiene mecanismos efectivos para que las personas adquieran las nuevas habilidades que necesitan antes de que la falta de esas habilidades se convierta en un problema." },
        { id: "CH2", text: "En esta organización dedicar tiempo a aprender y desarrollarse no se percibe como tiempo perdido — los líderes lo modelan y lo reconocen explícitamente." },
        { id: "CH3", text: "Cuando la organización aprende algo importante — de un error, un éxito o el entorno — modifica sus procesos, herramientas o comportamientos de manera formal y duradera." },
      ]},
      { label: "Cuestionamiento de Supuestos", qs: [
        { id: "CH4", text: "Esta organización revisa periódicamente si las premisas sobre las que opera siguen siendo válidas — o si el entorno ha cambiado tanto que ya no tienen sentido." },
        { id: "CH5", text: "Las personas que cuestionan prácticas o ideas establecidas son escuchadas con seriedad — no descartadas, ignoradas o vistas como problemáticas." },
        { id: "CH6", text: "Cuando la evidencia contradice una decisión o práctica establecida, esta organización está dispuesta a cambiar de curso aunque eso implique reconocer que estaba equivocada." },
      ]},
      { label: "Experimentación", qs: [
        { id: "CH7", text: "Antes de comprometer recursos significativos en un cambio importante, esta organización prueba la idea a pequeña escala para validar que funciona en su contexto real." },
        { id: "CH8", text: "Los líderes protegen activamente los espacios de experimentación — no los sacrifican ante la primera presión de resultados de corto plazo." },
        { id: "CH9", text: "Los pilotos de esta organización están diseñados con hipótesis claras y criterios de éxito definidos de antemano — no son pruebas informales donde cualquier resultado se acepta como válido." },
      ]},
      { label: "Innovación", qs: [
        { id: "CH10", text: "Las nuevas ideas en esta organización tienen un camino claro desde la propuesta hasta la evaluación y la decisión — no desaparecen en un vacío sin respuesta." },
        { id: "CH11", text: "Las personas tienen tiempo, recursos y autorización explícita para dedicar parte de su energía a explorar ideas nuevas — la innovación no es solo algo que se hace después de terminar el trabajo real." },
        { id: "CH12", text: "Esta organización tiene la capacidad de llevar una idea prometedora desde el concepto hasta la implementación real en un tiempo razonable — sin que se pierda en burocracia, comités o falta de decisión." },
      ]},
      { label: "Liderazgo del Cambio", qs: [
        { id: "CH13", text: "Los líderes están al frente de los procesos de cambio — no solo los anuncian y luego dejan que otros los implementen mientras ellos vuelven a sus rutinas habituales." },
        { id: "CH14", text: "Cuando se implementa un cambio importante, las personas entienden por qué es necesario, qué se espera de ellas y qué pasará si el cambio no se adopta." },
        { id: "CH15", text: "Durante los procesos de cambio, cada persona sabe exactamente qué comportamientos debe adoptar, qué debe dejar de hacer y cómo se medirá su contribución al cambio." },
      ]},
      { label: "Resiliencia Organizacional", qs: [
        { id: "CH16", text: "Cuando ocurre una crisis, la organización activa protocolos claros que permiten responder de manera ordenada sin paralizarse ni improvisar desde cero." },
        { id: "CH17", text: "Después de atravesar una crisis o contratiempo significativo, esta organización emerge con procesos, capacidades o aprendizajes que la hacen más fuerte que antes." },
        { id: "CH18", text: "Cuando la organización enfrenta una dificultad significativa, se recupera sin que el impacto se prolongue más allá de lo razonable — y sin que el mismo problema vuelva a ocurrir." },
        { id: "CH19", text: "Esta organización identifica los riesgos que podrían afectar su operación o sus resultados con suficiente anticipación como para reducir su probabilidad o su impacto antes de que ocurran." },
        { id: "CH20", text: "Los cambios del entorno representan oportunidades para esta organización más frecuentemente que amenazas — tiene la agilidad para aprovecharlos antes que sus competidores." },
      ]},
    ],
  },
  { id: "cei", code: "CEI", name: "Culture", fullName: "Culture Effectiveness Index", color: TEAL, index: "CEI™",
    groups: [
      { label: "Colaboración & Conocimiento", qs: [
        { id: "CU1", text: "Las áreas de esta organización comparten recursos, información y talento de manera proactiva — sin necesidad de que alguien los obligue a colaborar." },
        { id: "CU2", text: "El conocimiento crítico de esta organización no reside solo en la cabeza de ciertas personas — está documentado y accesible para quienes lo necesitan cuando lo necesitan." },
        { id: "CU3", text: "Los equipos de esta organización se ayudan mutuamente incluso cuando eso implica dedicar tiempo o recursos que necesitarían para sus propios objetivos." },
      ]},
      { label: "Comunicación & Transparencia", qs: [
        { id: "CU4", text: "Las personas reciben la información que necesitan para hacer bien su trabajo antes de que la falta de esa información se convierta en un problema o un error." },
        { id: "CU5", text: "En esta organización las malas noticias se comunican con la misma apertura y rapidez que las buenas — nadie las oculta o suaviza para protegerse o proteger a otros." },
        { id: "CU6", text: "Las personas entienden las razones detrás de las decisiones importantes que afectan su trabajo — no se enteran de los cambios sin contexto ni explicación." },
      ]},
      { label: "Empoderamiento", qs: [
        { id: "CU7", text: "Las personas tienen la autoridad para tomar las decisiones necesarias para hacer bien su trabajo — sin tener que esperar aprobación para cada cosa que está dentro de su responsabilidad." },
        { id: "CU8", text: "Las decisiones operativas las toman las personas que tienen el mejor conocimiento del problema — no se escalan innecesariamente a niveles superiores que están más lejos de la realidad." },
        { id: "CU9", text: "Las personas que toman iniciativa y proponen soluciones son reconocidas por ello — incluso cuando la iniciativa no produce el resultado esperado." },
      ]},
      { label: "Reconocimiento", qs: [
        { id: "CU10", text: "El reconocimiento en esta organización es específico, oportuno y genuino — las personas saben exactamente qué hicieron bien y sienten que ese reconocimiento es sincero." },
        { id: "CU11", text: "Las personas que tienen un desempeño sobresaliente son reconocidas públicamente de manera consistente — independientemente del área a la que pertenezcan o de quién las conozca." },
        { id: "CU12", text: "Las personas de esta organización sienten que su esfuerzo y sus contribuciones importan — los líderes lo demuestran con acciones concretas, no solo con palabras." },
      ]},
      { label: "Seguridad Psicológica", qs: [
        { id: "CU13", text: "Las personas expresan opiniones que contradicen la posición del liderazgo cuando tienen razones para hacerlo — sin filtrar su mensaje por miedo a las consecuencias." },
        { id: "CU14", text: "Cuando alguien comete un error en esta organización, puede hablarlo abiertamente con su líder o su equipo sin sentir vergüenza ni miedo a ser juzgado o penalizado." },
        { id: "CU15", text: "Las preguntas difíciles o incómodas reciben respuestas honestas en esta organización — no se desvían, minimizan o responden con evasivas para proteger a quien tiene el poder." },
      ]},
      { label: "Orientación a Resultados", qs: [
        { id: "CU16", text: "En esta organización el desempeño real determina las decisiones de promoción, reconocimiento y desarrollo — no las relaciones personales ni el tiempo de permanencia." },
        { id: "CU17", text: "Cuando los resultados organizacionales no se alcanzan, las personas de esta organización asumen su parte de responsabilidad en lugar de señalar a otras áreas o buscar culpables externos." },
        { id: "CU18", text: "Los estándares de desempeño en esta organización se aplican de manera consistente a todos — no hay excepciones para ciertas personas o áreas por razones políticas o de jerarquía." },
        { id: "CU19", text: "Esta organización tiene mecanismos concretos para identificar y eliminar ineficiencias de manera sistemática — la mejora continua es un proceso formal, no una intención ocasional." },
        { id: "CU20", text: "Las personas de esta organización se niegan a entregar trabajo de baja calidad — hay un estándar compartido de excelencia que todos sostienen, no solo cuando alguien los supervisa." },
      ]},
    ],
  },
];

const LEVELS = ["Comité Ejecutivo", "Directores/Gerentes", "Supervisores", "Colaboradores", "Otros"];
const PAI_LEAD = ["Comité Ejecutivo", "Directores/Gerentes"];
const PAI_ORG  = ["Supervisores", "Colaboradores", "Otros"];
const API_BASE = "";
const ADMIN_PASS_KEY = "opri_admin_pw";
const RESPONDENT_PASS = "encuestado2026";

// ── API / Airtable ──────────────────────────────────────────────────────────
async function loadResponses(engCode) {
  try {
    const url = engCode ? "/api/responses?engagement_code=" + engCode : "/api/responses";
    const r = await fetch(url);
    if (!r.ok) return [];
    const data = await r.json();
    return data.responses || [];
  } catch (err) { return []; }
}
async function saveResponse(resp) {
  try {
    await fetch("/api/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(resp),
    });
  } catch (err) { console.error("Save error:", err); }
}
async function apiLoadEngagements(pw) {
  try {
    const r = await fetch("/api/engagements", { headers: { "x-admin-password": pw } });
    if (!r.ok) return null;
    const d = await r.json();
    return d.engagements || [];
  } catch (e) { return null; }
}
async function apiCreateEngagement(pw, payload) {
  try {
    const r = await fetch("/api/engagements", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-password": pw },
      body: JSON.stringify(payload),
    });
    return r.json();
  } catch (e) { return { error: e.message }; }
}
async function apiUpdateEngagement(pw, payload) {
  try {
    const r = await fetch("/api/engagements", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-password": pw },
      body: JSON.stringify(payload),
    });
    return r.json();
  } catch (e) { return { error: e.message }; }
}
async function apiGetEngagement(code) {
  try {
    const r = await fetch("/api/engagements?code=" + code);
    if (!r.ok) return null;
    return r.json();
  } catch (e) { return null; }
}

// ── Respondent matching (Core ↔ Full) ─────────────────────────────────────────
// Misma lógica de matching que usa ConsistencyView, extraída aquí para reuso.
function respondentKey(meta) {
  if (!meta) return null;
  var name = (meta.name || "anonimo").trim().toLowerCase();
  var level = (meta.level || "").trim().toLowerCase();
  var area = (meta.area || "").trim().toLowerCase();
  return name + "|" + level + "|" + area;
}

// Combina, para cada respuesta "full" (que ahora solo trae las 35 preguntas
// adicionales), las respuestas "core" de la MISMA persona (por respondentKey).
// Devuelve un array de respuestas "full" con answers = {...core, ...extra}.
// Si no se encuentra match, la respuesta se devuelve tal cual (solo con las
// 35 respuestas nuevas) — degrada de forma segura en vez de romper.
function mergeFullWithCore(coreRR, fullRR) {
  var coreByKey = {};
  coreRR.forEach(function(r) {
    var k = respondentKey(r.meta);
    if (k) coreByKey[k] = r;
  });
  return fullRR.map(function(r) {
    var k = respondentKey(r.meta);
    var coreMatch = k ? coreByKey[k] : null;
    if (!coreMatch) return r; // sin match: solo las 35 nuevas
    return Object.assign({}, r, {
      answers: Object.assign({}, coreMatch.answers, r.answers),
    });
  });
}

// Helper único para obtener las respuestas "listas para scoring" de un tag.
// - "core": tal cual.
// - "full": mergeadas con su Core correspondiente (35 → 60 preguntas por persona).
// Engagements viejos (Full de 60 preguntas) siguen funcionando: su answers
// ya trae las 25 del Core, así que el merge simplemente no pisa nada nuevo.
function getScoringResponses(allResponses, tag) {
  if (tag === "core") {
    return allResponses.filter(function(r) { return r.survey === "core"; });
  }
  if (tag === "full") {
    var coreRR = allResponses.filter(function(r) { return r.survey === "core"; });
    var fullRR = allResponses.filter(function(r) { return r.survey === "full"; });
    return mergeFullWithCore(coreRR, fullRR);
  }
  return allResponses.filter(function(r) { return r.survey === tag; });
}


// ── Scoring ───────────────────────────────────────────────────────────────────
function computeOPRI(responses, dims) {
  if (!responses || responses.length === 0) return null;
  const dimScores = {};
  dims.forEach(function(d) {
    const qids = d.questions.map(function(q) { return q.id; });
    const vals = [];
    responses.forEach(function(r) {
      if (!r.answers) return;
      qids.forEach(function(qid) {
        if (r.answers[qid] != null) vals.push(r.answers[qid]);
      });
    });
    dimScores[d.id] = vals.length > 0 ? avg(vals) : null;
  });
  // Normalize by active weight sum to avoid deflated scores when some dims have no answers
  const activeWeight = dims.reduce(function(sum, d) {
    return sum + (dimScores[d.id] != null ? d.weight : 0);
  }, 0);
  const opri = activeWeight > 0 ? dims.reduce(function(sum, d) {
    return sum + (dimScores[d.id] != null ? (dimScores[d.id] * d.weight) / activeWeight : 0);
  }, 0) : 0;
  const lead = responses.filter(function(r) { return r.meta && PAI_LEAD.indexOf(r.meta.level) >= 0; });
  const org  = responses.filter(function(r) { return r.meta && (PAI_ORG.indexOf(r.meta.level) >= 0 || (!r.meta.level && PAI_LEAD.indexOf(r.meta.level) < 0)); });
  const paiByDim = {};
  dims.forEach(function(d) {
    const qids = d.questions.map(function(q) { return q.id; });
    const lVals = []; lead.forEach(function(r) { if (!r.answers) return; qids.forEach(function(qid) { if (r.answers[qid] != null) lVals.push(r.answers[qid]); }); });
    const oVals = []; org.forEach(function(r) { if (!r.answers) return; qids.forEach(function(qid) { if (r.answers[qid] != null) oVals.push(r.answers[qid]); }); });
    const ls = lVals.length > 0 ? avg(lVals) : null;
    const os = oVals.length > 0 ? avg(oVals) : null;
    paiByDim[d.id] = { ls: ls, os: os, gap: ls != null && os != null ? Math.abs(ls - os) : null };
  });
  const gapVals = Object.values(paiByDim).map(function(p) { return p.gap; }).filter(function(g) { return g != null; });
  const paiGlobal = gapVals.length > 0 ? avg(gapVals) : null;
  const heatLevel = {};
  LEVELS.forEach(function(lv) {
    const rr = responses.filter(function(r) { return r.meta && r.meta.level === lv; });
    if (rr.length === 0) { heatLevel[lv] = null; return; }
    const scores = {};
    dims.forEach(function(d) {
      const qids = d.questions.map(function(q) { return q.id; });
      const vals = []; rr.forEach(function(r) { if (!r.answers) return; qids.forEach(function(qid) { if (r.answers[qid] != null) vals.push(r.answers[qid]); }); });
      scores[d.id] = vals.length > 0 ? avg(vals) : null;
    });
    heatLevel[lv] = { count: rr.length, scores: scores };
  });
  const areas = [];
  responses.forEach(function(r) { if (r.meta && r.meta.area && areas.indexOf(r.meta.area) < 0) areas.push(r.meta.area); });
  const heatArea = {};
  areas.forEach(function(area) {
    const rr = responses.filter(function(r) { return r.meta && r.meta.area === area; });
    const scores = {};
    dims.forEach(function(d) {
      const qids = d.questions.map(function(q) { return q.id; });
      const vals = []; rr.forEach(function(r) { if (!r.answers) return; qids.forEach(function(qid) { if (r.answers[qid] != null) vals.push(r.answers[qid]); }); });
      scores[d.id] = vals.length > 0 ? avg(vals) : null;
    });
    heatArea[area] = { count: rr.length, scores: scores };
  });
  return { opri: opri, dimScores: dimScores, paiByDim: paiByDim, paiGlobal: paiGlobal, heatLevel: heatLevel, heatArea: heatArea, n: responses.length };
}

function computeDeep(responses, mod) {
  if (!responses || responses.length === 0) return null;
  const allQs = [];
  mod.groups.forEach(function(g) { g.qs.forEach(function(q) { allQs.push(q); }); });
  const globalVals = [];
  responses.forEach(function(r) { if (!r.answers) return; allQs.forEach(function(q) { if (r.answers[q.id] != null) globalVals.push(r.answers[q.id]); }); });
  const globalScore = globalVals.length > 0 ? avg(globalVals) : null;
  const groupScores = {};
  mod.groups.forEach(function(g) {
    const vals = [];
    responses.forEach(function(r) { if (!r.answers) return; g.qs.forEach(function(q) { if (r.answers[q.id] != null) vals.push(r.answers[q.id]); }); });
    groupScores[g.label] = vals.length > 0 ? avg(vals) : null;
  });
  return { globalScore: globalScore, groupScores: groupScores, n: responses.length };
}

// ── Cascade logic ─────────────────────────────────────────────────────────────
function checkL2(coreScores) {
  if (!coreScores) return { active: false, reasons: [] };
  const reasons = [];
  if (coreScores.opri < 3.8) reasons.push("OPRI Core " + coreScores.opri.toFixed(2) + " < 3.8");
  CORE_DIMS.forEach(function(d) {
    const s = coreScores.dimScores[d.id];
    if (s != null && s < 3.5) reasons.push(d.short + " " + s.toFixed(2) + " < 3.5");
  });
  if (coreScores.paiGlobal != null && coreScores.paiGlobal > 0.7) {
    reasons.push("PAI " + coreScores.paiGlobal.toFixed(2) + " > 0.7");
  }
  return { active: reasons.length > 0, reasons: reasons };
}

function checkL3(fullScores) {
  if (!fullScores) return { mods: [], fdd: false, reasons: [] };
  const mods = [];
  const reasons = [];
  const ds = fullScores.dimScores;
  if (ds.leadership != null && ds.leadership < 3.5) {
    if (mods.indexOf("lei") < 0) mods.push("lei");
    if (mods.indexOf("tcs") < 0) mods.push("tcs");
    reasons.push("Leadership " + ds.leadership.toFixed(2) + " < 3.5 → LEI™ + TCS™");
  }
  if (ds.execution != null && ds.execution < 3.5) {
    if (mods.indexOf("eci") < 0) mods.push("eci");
    reasons.push("Execution " + ds.execution.toFixed(2) + " < 3.5 → ECI™");
  }
  if (ds.resilience != null && ds.resilience < 3.5) {
    if (mods.indexOf("aci") < 0) mods.push("aci");
    reasons.push("Resilience " + ds.resilience.toFixed(2) + " < 3.5 → ACI™");
  }
  if (ds.culture != null && ds.culture < 3.5) {
    if (mods.indexOf("cei") < 0) mods.push("cei");
    reasons.push("Culture " + ds.culture.toFixed(2) + " < 3.5 → CEI™");
  }
  const nBelow = Object.values(ds).filter(function(s) { return s != null && s < 3.5; }).length;
  let fdd = false;
  if (fullScores.opri < 3.2) { fdd = true; reasons.push("Full Deep Dive: OPRI " + fullScores.opri.toFixed(2) + " < 3.2"); }
  if (fullScores.paiGlobal != null && fullScores.paiGlobal > 1.2) { fdd = true; reasons.push("Full Deep Dive: PAI " + fullScores.paiGlobal.toFixed(2) + " > 1.2"); }
  if (nBelow >= 2) { fdd = true; reasons.push("Full Deep Dive: " + nBelow + " dimensiones < 3.5"); }
  if (fdd) {
    DEEP_MODULES.forEach(function(m) { if (mods.indexOf(m.id) < 0) mods.push(m.id); });
  }
  return { mods: mods, fdd: fdd, reasons: reasons };
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
  label: { display: "block", fontSize: 11, color: MUTED, marginBottom: 5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" },
  input: { width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid " + CREAM_DK, background: WHITE, fontSize: 14, color: CHARCOAL, boxSizing: "border-box", outline: "none", fontFamily: "inherit" },
  th: { padding: "8px 10px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: MUTED, textAlign: "center" },
};

function btn(color, disabled) {
  return { padding: "10px 18px", borderRadius: 8, background: disabled ? CREAM_DK : color, color: disabled ? MUTED_LT : WHITE, border: "none", fontSize: 13, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit", transition: "all 0.15s" };
}

// ── Small UI components ───────────────────────────────────────────────────────
function ScoreBadge({ score, size }) {
  if (score == null) return <span style={{ color: MUTED_LT }}>—</span>;
  const m = getMaturity(score);
  const fs = size === "lg" ? 32 : size === "sm" ? 12 : 16;
  return (
    <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: fs, fontWeight: 600, color: m.color }}>
      {score.toFixed(2)}
    </span>
  );
}

function MaturityPill({ score }) {
  if (score == null) return null;
  const m = getMaturity(score);
  return (
    <span style={{ background: m.color, color: WHITE, fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 99, textTransform: "uppercase" }}>
      {m.es}
    </span>
  );
}

function HeatCell({ score }) {
  if (score == null) {
    return <td style={{ padding: "6px 8px", textAlign: "center", color: MUTED_LT, fontSize: 11 }}>—</td>;
  }
  const m = getMaturity(score);
  return (
    <td style={{ padding: "6px 8px", textAlign: "center", background: m.color + "22", color: m.color, fontWeight: 700, fontSize: 11 }}>
      {score.toFixed(2)}
    </td>
  );
}

function SectionHeader({ title, color }) {
  const c = color || GOLD;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
      <div style={{ width: 3, height: 14, background: c, borderRadius: 2 }} />
      <span style={{ fontSize: 10, color: CHARCOAL, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>{title}</span>
    </div>
  );
}

function SurveyHeader({ title, sub, accent, pct, onLogout }) {
  const ac = accent || GOLD;
  return (
    <div style={{ background: "linear-gradient(135deg, " + GREEN + ", " + GREEN_MID + ")", padding: "18px 20px 14px", borderBottom: "3px solid " + ac }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9, color: GOLD, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 3 }}>OPRI™ Enterprise</div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 19, color: WHITE, fontWeight: 600, wordBreak: "break-word" }}>{title}</div>
          <div style={{ fontSize: 11, color: GOLD_PALE, marginTop: 2 }}>{sub}</div>
        </div>
        {onLogout && (
          <button onClick={onLogout} title="Guardar progreso y salir" style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 7, color: "rgba(255,255,255,0.85)", fontSize: 11, padding: "6px 12px", cursor: "pointer", fontFamily: "inherit", flexShrink: 0, marginLeft: 10 }}>
            ⏸ Pausar
          </button>
        )}
      </div>
      {pct != null && (
        <div style={{ marginTop: 8, height: 3, background: "rgba(255,255,255,0.15)", borderRadius: 99 }}>
          <div style={{ height: "100%", width: pct + "%", background: ac, borderRadius: 99, transition: "width 0.4s" }} />
        </div>
      )}
    </div>
  );
}

function LikertQuestion({ qid, text, value, color, onChange }) {
  return (
    <div style={{ marginBottom: 16, padding: "13px 14px", background: WHITE, borderRadius: 9, border: "1px solid " + CREAM_DK }}>
      <p style={{ fontSize: 13, color: CHARCOAL, marginBottom: 11, lineHeight: 1.5, margin: "0 0 11px 0" }}>
        <span style={{ color: color, fontWeight: 700, marginRight: 6 }}>{qid}</span>{text}
      </p>
      <div style={{ display: "flex", gap: 3 }}>
        {[1, 2, 3, 4, 5].map(function(v) {
          return (
            <button key={v} onClick={function() { onChange(v); }} style={{
              flex: 1, padding: "8px 0px", borderRadius: 6, minWidth: 0,
              border: value === v ? "2px solid " + color : "1px solid " + CREAM_DK,
              background: value === v ? color + "18" : CREAM,
              color: value === v ? color : MUTED,
              fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            }}>{v}</button>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
        <span style={{ fontSize: 9, color: MUTED_LT }}>1 = Totalmente en desacuerdo</span>
        <span style={{ fontSize: 9, color: MUTED_LT }}>5 = Totalmente de acuerdo</span>
      </div>
    </div>
  );
}

function MetaForm({ onStart, title, subtitle, presetCompany }) {
  const [meta, setMeta] = useState({ company: presetCompany || "", name: "", level: "", area: "", country: "", bu: "" });
  function set(key, val) { setMeta(function(p) { const n = Object.assign({}, p); n[key] = val; return n; }); }
  const canStart = meta.level && meta.company && meta.name && meta.name.trim().length > 0;
  return (
    <div>
      <SurveyHeader title={title} sub={subtitle} />
      <div style={{ padding: "20px 20px 28px", maxWidth: 500, margin: "0 auto" }}>
        <p style={{ fontSize: 13, color: MUTED, marginBottom: 18, lineHeight: 1.6 }}>Complete su información de perfil. Sus respuestas son confidenciales.</p>
        <div style={{ marginBottom: 13 }}>
          <label style={s.label}>Empresa *</label>
          <input value={meta.company} onChange={function(e) { set("company", e.target.value); }} placeholder="Ej. Banco Pichincha" style={s.input} readOnly={!!presetCompany} />
        </div>
        <div style={{ marginBottom: 13 }}>
          <label style={s.label}>Nombre *</label>
          <input value={meta.name} onChange={function(e) { set("name", e.target.value); }} placeholder="Ej. Juan Pérez" style={s.input} />
        </div>
        <div style={{ marginBottom: 13 }}>
          <label style={s.label}>Nivel organizacional *</label>
          <select value={meta.level} onChange={function(e) { set("level", e.target.value); }} style={Object.assign({}, s.input, { cursor: "pointer" })}>
            <option value="">Seleccionar…</option>
            {LEVELS.map(function(l) { return <option key={l} value={l}>{l}</option>; })}
          </select>
        </div>
        <div style={{ marginBottom: 13 }}>
          <label style={s.label}>Área / Departamento</label>
          <input value={meta.area} onChange={function(e) { set("area", e.target.value); }} placeholder="Ej. Operaciones" style={s.input} />
        </div>
        <div style={{ marginBottom: 13 }}>
          <label style={s.label}>País</label>
          <input value={meta.country} onChange={function(e) { set("country", e.target.value); }} placeholder="Ej. Ecuador" style={s.input} />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={s.label}>Unidad de Negocio</label>
          <input value={meta.bu} onChange={function(e) { set("bu", e.target.value); }} placeholder="Ej. División Retail" style={s.input} />
        </div>
        <button disabled={!canStart} onClick={function() { onStart(meta); }} style={btn(GREEN, !canStart)}>Comenzar →</button>
      </div>
    </div>
  );
}

function DoneScreen({ title, color, onBack, onNew }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 340, gap: 12, padding: 28, textAlign: "center" }}>
      <div style={{ fontSize: 38, color: color }}>✓</div>
      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: color, margin: 0 }}>Respuesta registrada</h2>
      <p style={{ color: MUTED, fontSize: 13, maxWidth: 260 }}>{title} completado.</p>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onBack} style={btn(MUTED, false)}>← Volver</button>
        <button onClick={onNew} style={btn(color, false)}>Nueva encuesta</button>
      </div>
    </div>
  );
}

// ── Meta persistence helpers ──────────────────────────────────────────────────
var META_KEY = "opri_respondent_meta";
var DONE_KEY = "opri_respondent_done";
function loadSavedMeta() {
  try { var v = localStorage.getItem(META_KEY); return v ? JSON.parse(v) : null; } catch (e) { return null; }
}
function saveMeta(meta) {
  try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch (e) {}
}
function clearSavedMeta() {
  try { localStorage.removeItem(META_KEY); localStorage.removeItem(DONE_KEY); } catch (e) {}
}
function loadCompletedSurveys() {
  try { var v = localStorage.getItem(DONE_KEY); return v ? JSON.parse(v) : []; } catch (e) { return []; }
}

// ── OPRI Survey (Core & Full) ─────────────────────────────────────────────────
function OPRISurvey({ level, onDone, onBack, engagementCode, presetCompany, inheritedMeta, onMetaSaved, onSurveyDone, savedProgress, onProgress, onClearProgress, onLogout }) {
  const isCore = level === "core";
  // Full ya NO repite las 25 del Core: solo pregunta las 35 adicionales
  // (EXTRA_DIMS). El score sigue calculándose sobre las 12 preguntas por
  // dimensión gracias al merge con el Core (ver getScoringResponses).
  const dims = isCore ? CORE_DIMS : EXTRA_DIMS;
  const allQs = [];
  dims.forEach(function(d) { d.questions.forEach(function(q) { allQs.push(q); }); });

  // Restore from saved progress or use inheritedMeta
  var storedMeta = loadSavedMeta();
  var initialMeta = isCore ? (savedProgress && savedProgress.meta ? savedProgress.meta : null) : (inheritedMeta || storedMeta || (savedProgress && savedProgress.meta) || null);
  var initialDimIdx = (savedProgress && savedProgress.dimIdx != null && savedProgress.dimIdx < dims.length) ? savedProgress.dimIdx : 0;
  var initialAnswers = savedProgress && savedProgress.answers ? savedProgress.answers : {};

  const [meta, setMeta] = useState(initialMeta);
  const [dimIdx, setDimIdx] = useState(initialDimIdx);
  const [answers, setAnswers] = useState(initialAnswers);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    const id = "R_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
    await saveResponse({ id: id, timestamp: new Date().toISOString(), survey: level, meta: meta, answers: answers, engagement_code: engagementCode || "" });
    if (onSurveyDone) onSurveyDone(level);
    if (onClearProgress) onClearProgress(); // clear saved progress on submit
    setSaving(false);
    setDone(true);
    onDone();
  }

  function handleStart(m) {
    if (isCore) {
      saveMeta(m);
      if (onMetaSaved) onMetaSaved(m);
    }
    setMeta(m);
    if (onProgress) onProgress({ meta: m, dimIdx: 0, answers: {} });
  }

  function handleAdvanceDim(newDimIdx, newAnswers) {
    setDimIdx(newDimIdx);
    if (onProgress) onProgress({ meta: meta, dimIdx: newDimIdx, answers: newAnswers || answers });
  }

  // Auto-save (must be before ALL early returns — React rules of hooks)
  useEffect(function() {
    if (meta && onProgress) onProgress({ meta: meta, dimIdx: dimIdx, answers: answers });
  }, [answers, dimIdx]);

  if (done) {
    return <DoneScreen title={isCore ? "OPRI Core 25" : "OPRI Full — 35 adicionales"} color={GREEN} onBack={onBack} onNew={function() { clearSavedMeta(); setMeta(null); setDimIdx(0); setAnswers({}); setDone(false); }} />;
  }
  if (!meta) {
    return <MetaForm title={isCore ? "OPRI Core 25" : "OPRI Full — 35 adicionales"} subtitle={isCore ? "25 preguntas · ~8 min" : "35 preguntas · ~10 min"} onStart={handleStart} presetCompany={presetCompany} />;
  }

  const dim = dims[dimIdx];
  const dimDone = dim.questions.every(function(q) { return answers[q.id] != null; });
  const answered = allQs.filter(function(q) { return answers[q.id] != null; }).length;
  const pct = (answered / allQs.length) * 100;

  return (
    <div>
      <SurveyHeader title={dim.short + " · " + (dimIdx + 1) + "/" + dims.length} sub={dim.label} accent={dim.color} pct={pct} onLogout={onLogout} />
      <div style={{ padding: "16px 14px 26px", maxWidth: 560, margin: "0 auto", width: "100%" }}>
        <p style={{ fontSize: 10, color: MUTED_LT, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>{answered}/{allQs.length}</p>
        {dim.questions.map(function(q) {
          return <LikertQuestion key={q.id} qid={q.id} text={q.text} value={answers[q.id]} color={dim.color} onChange={function(v) { setAnswers(function(p) { const n = Object.assign({}, p); n[q.id] = v; return n; }); }} />;
        })}
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          {dimIdx > 0 && <button onClick={function() { var ni = dimIdx - 1; handleAdvanceDim(ni, answers); }} style={btn(MUTED, false)}>← Anterior</button>}
          {dimIdx < dims.length - 1
            ? <button disabled={!dimDone} onClick={function() { var ni = dimIdx + 1; var updated = answers; handleAdvanceDim(ni, updated); }} style={btn(dim.color, !dimDone)}>Siguiente →</button>
            : <button disabled={!dimDone || saving} onClick={submit} style={btn(GREEN, !dimDone || saving)}>{saving ? "Guardando…" : "Enviar ✓"}</button>
          }
        </div>
      </div>
    </div>
  );
}

// ── Deep Dive Survey ──────────────────────────────────────────────────────────
function DeepSurvey({ mod, onDone, onBack, engagementCode, inheritedMeta, onSurveyDone, savedProgress, onProgress, onClearProgress, onLogout }) {
  const allQs = [];
  mod.groups.forEach(function(g) { g.qs.forEach(function(q) { allQs.push(q); }); });

  // Restore from saved progress or use inheritedMeta
  var storedMeta = loadSavedMeta();
  var initialMeta = inheritedMeta || storedMeta || (savedProgress && savedProgress.meta) || null;
  var initialGroupIdx = savedProgress && savedProgress.groupIdx != null ? savedProgress.groupIdx : 0;
  var initialAnswers = savedProgress && savedProgress.answers ? savedProgress.answers : {};

  const [meta, setMeta] = useState(initialMeta);
  const [groupIdx, setGroupIdx] = useState(initialGroupIdx);
  const [answers, setAnswers] = useState(initialAnswers);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    const id = "R_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
    await saveResponse({ id: id, timestamp: new Date().toISOString(), survey: "deep_" + mod.id, meta: meta, answers: answers, engagement_code: engagementCode || "" });
    if (onSurveyDone) onSurveyDone("deep_" + mod.id);
    if (onClearProgress) onClearProgress();
    setSaving(false);
    setDone(true);
    onDone();
  }

  // Auto-save (must be before ALL early returns — React rules of hooks)
  useEffect(function() {
    if (meta && onProgress) onProgress({ meta: meta, groupIdx: groupIdx, answers: answers });
  }, [answers, groupIdx]);

  if (done) {
    return <DoneScreen title={mod.fullName} color={mod.color} onBack={onBack} onNew={function() { clearSavedMeta(); setMeta(null); setGroupIdx(0); setAnswers({}); setDone(false); }} />;
  }
  if (!meta) {
    return <MetaForm title={mod.index + " — " + mod.name} subtitle={mod.fullName + " · " + allQs.length + " preguntas"} onStart={function(m) { saveMeta(m); setMeta(m); if (onProgress) onProgress({ meta: m, groupIdx: 0, answers: {} }); }} />;
  }

  const grp = mod.groups[groupIdx];
  const grpDone = grp.qs.every(function(q) { return answers[q.id] != null; });
  const answered = allQs.filter(function(q) { return answers[q.id] != null; }).length;
  const pct = (answered / allQs.length) * 100;

  return (
    <div>
      <SurveyHeader title={grp.label} sub={mod.index + " · " + (groupIdx + 1) + "/" + mod.groups.length} accent={mod.color} pct={pct} onLogout={onLogout} />
      <div style={{ padding: "16px 14px 26px", maxWidth: 560, margin: "0 auto", width: "100%" }}>
        <p style={{ fontSize: 10, color: MUTED_LT, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>{answered}/{allQs.length}</p>
        {grp.qs.map(function(q) {
          return <LikertQuestion key={q.id} qid={q.id} text={q.text} value={answers[q.id]} color={mod.color} onChange={function(v) { setAnswers(function(p) { const n = Object.assign({}, p); n[q.id] = v; return n; }); }} />;
        })}
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          {groupIdx > 0 && <button onClick={function() { setGroupIdx(function(i) { return i - 1; }); }} style={btn(MUTED, false)}>← Anterior</button>}
          {groupIdx < mod.groups.length - 1
            ? <button disabled={!grpDone} onClick={function() { setGroupIdx(function(i) { return i + 1; }); }} style={btn(mod.color, !grpDone)}>Siguiente →</button>
            : <button disabled={!grpDone || saving} onClick={submit} style={btn(GREEN, !grpDone || saving)}>{saving ? "Guardando…" : "Enviar ✓"}</button>
          }
        </div>
      </div>
    </div>
  );
}

// ── Cascade Survey Selector ───────────────────────────────────────────────────
function CascadeSelector({ coreScores, fullScores, deepCounts, onSelect }) {
  const l2 = checkL2(coreScores);
  const l3 = checkL3(fullScores);
  const activeMods = DEEP_MODULES.filter(function(m) { return l3.mods.indexOf(m.id) >= 0; });
  const nCore = coreScores ? coreScores.n : 0;
  const nFull = fullScores ? fullScores.n : 0;

  return (
    <div style={{ padding: "20px 14px", maxWidth: 560, margin: "0 auto", width: "100%" }}>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 21, color: GREEN, marginBottom: 3 }}>Aplicar Diagnóstico</div>
      <div style={{ fontSize: 12, color: MUTED, marginBottom: 18 }}>Los módulos se activan automáticamente según los resultados.</div>

      <SurveyCard level="Level 1" badge={nCore > 0 ? nCore + " resp." : "Primer paso"} label="OPRI Core 25" desc="Diagnóstico rápido · 25 preguntas · ~8 min" color={GREEN} status="available" onClick={function() { onSelect({ id: "core" }); }} />

      {nCore === 0 && (
        <SurveyCard level="Level 2" badge="Bloqueado" label="OPRI Full" desc="Requiere OPRI Core primero" color={GREEN_MID} status="locked" lockMsg="Complete el OPRI Core 25 para desbloquear este nivel." />
      )}
      {nCore > 0 && (
        <SurveyCard level="Level 2" badge={nFull > 0 ? nFull + " resp." : "Siguiente paso"} label="OPRI Full" desc="35 preguntas · ~10 min" color={GREEN_MID} status="activated" triggers={[]} onClick={function() { onSelect({ id: "full" }); }} />
      )}

      {nFull === 0 && nCore > 0 && (
        <div style={{ padding: "11px 13px", background: CREAM_DK, borderRadius: 8, fontSize: 12, color: MUTED, marginTop: 4 }}>
          Los módulos Deep Dive se calcularán una vez completado el OPRI Full.
        </div>
      )}
      {nFull > 0 && activeMods.length === 0 && (
        <div style={{ padding: "12px 14px", background: "#DCFCE7", borderRadius: 9, border: "1px solid " + GREEN_LT + "55", marginTop: 8 }}>
          <div style={{ fontSize: 11, color: GREEN, fontWeight: 700, marginBottom: 2 }}>✓ Sin Deep Dive requerido</div>
          <div style={{ fontSize: 12, color: GREEN_MID }}>Los resultados del OPRI Full no activan ningún módulo de diagnóstico profundo.</div>
        </div>
      )}
      {nFull > 0 && activeMods.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 10, color: MUTED, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 7 }}>
            {"Level 3 — Deep Dive" + (l3.fdd ? " · Full Deep Dive activado" : "")}
          </div>
          {activeMods.map(function(m) {
            const qCount = m.groups.reduce(function(sum, g) { return sum + g.qs.length; }, 0);
            const trigger = l3.reasons.find(function(r) { return r.indexOf(m.code) >= 0 || r.indexOf("Full Deep Dive") >= 0; });
            return (
              <SurveyCard key={m.id} level={m.index} badge={deepCounts[m.id] > 0 ? deepCounts[m.id] + " resp." : "Activado"} label={m.fullName} desc={qCount + " preguntas"} color={m.color} status="activated" triggers={trigger ? [trigger] : []} onClick={function() { onSelect({ id: "deep_" + m.id, mod: m }); }} />
            );
          })}
        </div>
      )}
    </div>
  );
}

function SurveyCard({ level, badge, label, desc, color, status, triggers, lockMsg, onClick }) {
  const locked = status === "locked" || status === "not_required";
  const done = status === "done";
  const borderColor = done ? GREEN_LT + "88" : (locked ? CREAM_DK : status === "activated" ? color + "55" : CREAM_DK);
  const bgColor = done ? "#F0FDF4" : (locked ? "#F9F9F7" : WHITE);
  return (
    <div style={{ marginBottom: 7, borderRadius: 10, border: "1px solid " + borderColor, background: bgColor, overflow: "hidden", opacity: locked ? 0.65 : 1 }}>
      <button onClick={(locked || done) ? undefined : onClick} disabled={locked || done} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "12px 12px", background: "transparent", border: "none", cursor: (locked || done) ? "default" : "pointer", textAlign: "left", fontFamily: "inherit" }}>
        <div style={{ width: 32, height: 32, borderRadius: 7, background: done ? GREEN_LT + "22" : color + (locked ? "0D" : "18"), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {done ? <span style={{ fontSize: 15 }}>✓</span> : locked ? <span style={{ fontSize: 13 }}>🔒</span> : <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: done ? GREEN : (locked ? MUTED : CHARCOAL), marginBottom: 1 }}>{label}</div>
          <div style={{ fontSize: 11, color: done ? GREEN_LT : MUTED }}>{done ? "Respondido — gracias por su participación" : desc}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2, flexShrink: 0 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: done ? GREEN : (status === "activated" ? color : MUTED), background: (done ? GREEN : (status === "activated" ? color : MUTED)) + "18", padding: "2px 6px", borderRadius: 99, textTransform: "uppercase" }}>{level}</span>
          {badge && <span style={{ fontSize: 9, color: done ? GREEN_LT : MUTED_LT, fontWeight: done ? 700 : 400 }}>{badge}</span>}
        </div>
      </button>
      {!done && status === "activated" && triggers && triggers.length > 0 && (
        <div style={{ padding: "0 14px 10px", display: "flex", flexWrap: "wrap", gap: 4 }}>
          {triggers.map(function(t, i) { return <span key={i} style={{ fontSize: 10, color: color, background: color + "14", padding: "2px 7px", borderRadius: 99, fontWeight: 600 }}>{t}</span>; })}
        </div>
      )}
      {locked && lockMsg && <div style={{ padding: "0 14px 10px", fontSize: 11, color: MUTED, fontStyle: "italic" }}>{lockMsg}</div>}
    </div>
  );
}

// ── Dashboard views ───────────────────────────────────────────────────────────
function OPRIDash({ tag, title, dims, responses }) {
  const rr = getScoringResponses(responses, tag);
  const sc = computeOPRI(rr, dims);
  if (!sc) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: MUTED_LT }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>◎</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 17, color: MUTED }}>Sin datos aún</div>
        <div style={{ fontSize: 12, marginTop: 4 }}>{"No hay respuestas de " + title + "."}</div>
      </div>
    );
  }
  return (
    <div style={{ padding: "18px 16px", maxWidth: 640, margin: "0 auto" }}>
      <div style={{ background: "linear-gradient(135deg, " + GREEN + ", " + GREEN_MID + ")", borderRadius: 12, padding: "20px", marginBottom: 14, border: "2px solid " + GOLD + "33" }}>
        <div style={{ fontSize: 9, color: GOLD, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>{title + " · OPRI™"}</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 48, color: WHITE, lineHeight: 1, fontWeight: 600 }}>{sc.opri.toFixed(2)}</div>
        <div style={{ marginTop: 6, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <MaturityPill score={sc.opri} />
          <span style={{ color: GOLD_PALE, fontSize: 11 }}>{sc.n + (sc.n !== 1 ? " respondentes" : " respondente")}</span>
        </div>
      </div>
      <div style={{ background: WHITE, borderRadius: 10, padding: "15px", marginBottom: 12, border: "1px solid " + CREAM_DK }}>
        <SectionHeader title="Perfil de Capacidades" />
        {dims.map(function(d) {
          const score = sc.dimScores[d.id];
          const pct = score != null ? ((score - 1) / 4) * 100 : 0;
          return (
            <div key={d.id} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                <div>
                  <span style={{ fontSize: 12, color: CHARCOAL, fontWeight: 500 }}>{d.short}</span>
                  <span style={{ fontSize: 9, color: MUTED_LT, marginLeft: 4 }}>{"(" + (d.weight * 100).toFixed(0) + "%)"}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {score != null && <span style={{ fontSize: 9, color: getMaturity(score).color, fontWeight: 600, textTransform: "uppercase" }}>{getMaturity(score).es}</span>}
                  <ScoreBadge score={score} size="sm" />
                </div>
              </div>
              <div style={{ height: 5, background: CREAM_DK, borderRadius: 99, overflow: "hidden" }}>
                <div style={{ height: "100%", width: pct + "%", background: "linear-gradient(90deg, " + d.color + "55, " + d.color + ")", borderRadius: 99, transition: "width 0.7s" }} />
              </div>
            </div>
          );
        })}
      </div>
      <RespondenteTable responses={rr} dims={dims} />
    </div>
  );
}

function PAIDash({ tag, title, dims, responses }) {
  const rr = getScoringResponses(responses, tag);
  const sc = computeOPRI(rr, dims);
  if (!sc) return <div style={{ padding: 40, textAlign: "center", color: MUTED_LT }}>Sin datos aún.</div>;
  const lC = rr.filter(function(r) { return r.meta && PAI_LEAD.indexOf(r.meta.level) >= 0; }).length;
  const oC = rr.filter(function(r) { return r.meta && PAI_ORG.indexOf(r.meta.level) >= 0; }).length;
  const paiValid = sc.paiGlobal != null && lC > 0 && oC > 0;
  return (
    <div style={{ padding: "18px 16px", maxWidth: 640, margin: "0 auto" }}>
      <div style={{ background: "linear-gradient(135deg, #1e1b4b, #312e81)", borderRadius: 12, padding: "20px", marginBottom: 12, border: "2px solid " + VIOLET + "44" }}>
        <div style={{ fontSize: 9, color: "#A5B4FC", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>{"PAI™ · " + title}</div>
        {paiValid ? (
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 44, color: WHITE, lineHeight: 1 }}>{sc.paiGlobal.toFixed(2)}</div>
            <div style={{ marginTop: 6, display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ background: getPAIBand(sc.paiGlobal).color, color: WHITE, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99 }}>{getPAIBand(sc.paiGlobal).label}</span>
              <span style={{ color: "#C7D2FE", fontSize: 11 }}>{lC + (lC !== 1 ? " líderes" : " líder") + " · " + oC + (oC !== 1 ? " colaboradores" : " colaborador")}</span>
            </div>
          </div>
        ) : (
          <div style={{ color: "#C7D2FE", fontSize: 12, marginTop: 6 }}>Se requieren respuestas de ambos grupos para calcular el PAI.</div>
        )}
      </div>
      {paiValid && (
        <div>
          <div style={{ background: WHITE, borderRadius: 10, overflow: "hidden", border: "1px solid " + CREAM_DK, marginBottom: 12 }}>
            <div style={{ padding: "10px 15px", borderBottom: "1px solid " + CREAM_DK }}><SectionHeader title="Gap por Dimensión" /></div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 400 }}>
                <thead>
                  <tr style={{ background: CREAM }}>
                    <th style={Object.assign({}, s.th, { textAlign: "left" })}>Dimensión</th>
                    <th style={s.th}>Liderazgo</th>
                    <th style={s.th}>Organización</th>
                    <th style={s.th}>GAP</th>
                    <th style={Object.assign({}, s.th, { textAlign: "left" })}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {dims.map(function(d, i) {
                    const p = sc.paiByDim[d.id];
                    const band = p.gap != null ? getPAIBand(p.gap) : null;
                    return (
                      <tr key={d.id} style={{ borderTop: "1px solid " + CREAM_DK, background: i % 2 === 0 ? WHITE : CREAM + "44" }}>
                        <td style={{ padding: "7px 12px", fontSize: 12 }}>{d.short}</td>
                        <td style={{ padding: "7px 9px", textAlign: "center" }}>{p.ls != null ? <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, color: GREEN }}>{p.ls.toFixed(2)}</span> : <span style={{ color: MUTED_LT }}>—</span>}</td>
                        <td style={{ padding: "7px 9px", textAlign: "center" }}>{p.os != null ? <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, color: VIOLET }}>{p.os.toFixed(2)}</span> : <span style={{ color: MUTED_LT }}>—</span>}</td>
                        <td style={{ padding: "7px 9px", textAlign: "center" }}>{p.gap != null ? <span style={{ fontWeight: 700, color: band.color }}>{p.gap.toFixed(2)}</span> : <span style={{ color: MUTED_LT }}>—</span>}</td>
                        <td style={{ padding: "7px 9px" }}>{band ? <span style={{ fontSize: 10, color: band.color, fontWeight: 600 }}>{band.label}</span> : <span style={{ color: MUTED_LT }}>—</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div style={{ background: WHITE, borderRadius: 10, padding: "14px", border: "1px solid " + CREAM_DK }}>
            <SectionHeader title="OPRI × PAI Matrix" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 6 }}>
              {[
                { label: "Alineado & Capaz", sub: "Capacidades fuertes y visión compartida.", color: GREEN, active: sc.opri >= 3.5 && sc.paiGlobal < 0.7 },
                { label: "Capaz pero Desconectado", sub: "Capacidades fuertes, percepción divergente.", color: AMBER, active: sc.opri >= 3.5 && sc.paiGlobal >= 0.7 },
                { label: "Reconocimiento Compartido", sub: "Coinciden en el diagnóstico.", color: BLUE, active: sc.opri < 3.5 && sc.paiGlobal < 0.7 },
                { label: "Frágil & Desconectado", sub: "Brecha + percepciones desalineadas. Crítico.", color: RED, active: sc.opri < 3.5 && sc.paiGlobal >= 0.7 },
              ].map(function(q) {
                return (
                  <div key={q.label} style={{ padding: "10px", borderRadius: 7, background: q.active ? q.color + "18" : CREAM, border: q.active ? "2px solid " + q.color : "1px solid " + CREAM_DK }}>
                    {q.active && <div style={{ fontSize: 8, color: q.color, fontWeight: 700, marginBottom: 2 }}>◆ ACTUAL</div>}
                    <div style={{ fontSize: 11, fontWeight: 600, color: q.active ? q.color : MUTED, marginBottom: 2 }}>{q.label}</div>
                    <div style={{ fontSize: 10, color: MUTED, lineHeight: 1.4 }}>{q.sub}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HeatView({ tag, dims, responses }) {
  const rr = getScoringResponses(responses, tag);
  const sc = computeOPRI(rr, dims);
  if (!sc) return <div style={{ padding: 40, textAlign: "center", color: MUTED_LT }}>Sin datos aún.</div>;
  const areas = Object.keys(sc.heatArea);
  return (
    <div style={{ padding: "18px 16px", maxWidth: 700, margin: "0 auto" }}>
      <SectionHeader title="Por Nivel Organizacional" />
      <div style={{ overflowX: "auto", marginBottom: 18 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 440 }}>
          <thead>
            <tr style={{ background: GREEN }}>
              <th style={Object.assign({}, s.th, { color: WHITE, textAlign: "left", background: "transparent" })}>Nivel</th>
              <th style={Object.assign({}, s.th, { color: GOLD, background: "transparent" })}>N</th>
              {dims.map(function(d) { return <th key={d.id} style={Object.assign({}, s.th, { color: GOLD_PALE, background: "transparent", fontSize: 9 })}>{d.short}</th>; })}
            </tr>
          </thead>
          <tbody>
            {LEVELS.map(function(lv, i) {
              const h = sc.heatLevel[lv];
              return (
                <tr key={lv} style={{ borderTop: "1px solid " + CREAM_DK, background: i % 2 === 0 ? WHITE : CREAM + "55" }}>
                  <td style={{ padding: "6px 11px", fontSize: 12 }}>{lv}</td>
                  <td style={{ padding: "6px 7px", textAlign: "center", fontSize: 11, color: MUTED }}>{h ? h.count : 0}</td>
                  {dims.map(function(d) { return <HeatCell key={d.id} score={h ? h.scores[d.id] : null} />; })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {areas.length > 0 && (
        <div>
          <SectionHeader title="Por Área" />
          <div style={{ overflowX: "auto", marginBottom: 14 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 440 }}>
              <thead>
                <tr style={{ background: GREEN_MID }}>
                  <th style={Object.assign({}, s.th, { color: WHITE, textAlign: "left", background: "transparent" })}>Área</th>
                  <th style={Object.assign({}, s.th, { color: GOLD, background: "transparent" })}>N</th>
                  {dims.map(function(d) { return <th key={d.id} style={Object.assign({}, s.th, { color: GOLD_PALE, background: "transparent", fontSize: 9 })}>{d.short}</th>; })}
                </tr>
              </thead>
              <tbody>
                {areas.map(function(area, i) {
                  const h = sc.heatArea[area];
                  return (
                    <tr key={area} style={{ borderTop: "1px solid " + CREAM_DK, background: i % 2 === 0 ? WHITE : CREAM + "55" }}>
                      <td style={{ padding: "6px 11px", fontSize: 12 }}>{area}</td>
                      <td style={{ padding: "6px 7px", textAlign: "center", fontSize: 11, color: MUTED }}>{h.count}</td>
                      {dims.map(function(d) { return <HeatCell key={d.id} score={h.scores[d.id]} />; })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {MATURITY.map(function(m) {
          return (
            <div key={m.es} style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: m.color }} />
              <span style={{ fontSize: 10, color: MUTED }}>{m.es}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DeepDash({ mod, responses }) {
  const rr = responses.filter(function(r) { return r.survey === "deep_" + mod.id; });
  const sc = computeDeep(rr, mod);
  if (!sc) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: MUTED_LT }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>◎</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 17, color: MUTED }}>Sin datos aún</div>
        <div style={{ fontSize: 12, marginTop: 4 }}>{"No hay respuestas de " + mod.fullName + "."}</div>
      </div>
    );
  }
  return (
    <div style={{ padding: "18px 16px", maxWidth: 600, margin: "0 auto" }}>
      <div style={{ background: "linear-gradient(135deg, " + mod.color + "EE, " + mod.color + ")", borderRadius: 12, padding: "20px", marginBottom: 12 }}>
        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>{mod.index + " · " + mod.fullName}</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 44, color: WHITE, lineHeight: 1, fontWeight: 600 }}>{sc.globalScore.toFixed(2)}</div>
        <div style={{ marginTop: 6, display: "flex", gap: 8, alignItems: "center" }}>
          <MaturityPill score={sc.globalScore} />
          <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 11 }}>{sc.n + (sc.n !== 1 ? " respondentes" : " respondente")}</span>
        </div>
      </div>
      <div style={{ background: WHITE, borderRadius: 10, padding: "15px", border: "1px solid " + CREAM_DK }}>
        <SectionHeader title="Por Grupo" color={mod.color} />
        {mod.groups.map(function(g) {
          const score = sc.groupScores[g.label];
          const pct = score != null ? ((score - 1) / 4) * 100 : 0;
          return (
            <div key={g.label} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                <span style={{ fontSize: 12, color: CHARCOAL }}>{g.label}</span>
                <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                  {score != null && <span style={{ fontSize: 9, color: getMaturity(score).color, fontWeight: 600, textTransform: "uppercase" }}>{getMaturity(score).es}</span>}
                  <ScoreBadge score={score} size="sm" />
                </div>
              </div>
              <div style={{ height: 5, background: CREAM_DK, borderRadius: 99, overflow: "hidden" }}>
                <div style={{ height: "100%", width: pct + "%", background: "linear-gradient(90deg, " + mod.color + "55, " + mod.color + ")", borderRadius: 99, transition: "width 0.7s" }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RespondenteTable({ responses, dims }) {
  if (!responses || responses.length === 0) return null;
  const allQs = [];
  dims.forEach(function(d) { d.questions.forEach(function(q) { allQs.push(q); }); });
  function overallScore(r) {
    const vals = r.answers ? allQs.map(function(q) { return r.answers[q.id]; }).filter(function(v) { return v != null; }) : [];
    return vals.length > 0 ? avg(vals) : null;
  }
  return (
    <div style={{ background: WHITE, borderRadius: 10, overflow: "hidden", border: "1px solid " + CREAM_DK }}>
      <div style={{ padding: "10px 15px", borderBottom: "1px solid " + CREAM_DK }}>
        <div style={{ fontSize: 9, color: MUTED, textTransform: "uppercase", letterSpacing: "0.1em" }}>{"Respondentes (" + responses.length + ")"}</div>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 380 }}>
          <thead>
            <tr style={{ background: CREAM }}>
              <th style={Object.assign({}, s.th, { textAlign: "left" })}>Nombre</th>
              <th style={Object.assign({}, s.th, { textAlign: "left" })}>Nivel</th>
              <th style={Object.assign({}, s.th, { textAlign: "left" })}>Área</th>
              <th style={s.th}>Score</th>
              <th style={s.th}>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {responses.slice().reverse().map(function(r, i) {
              return (
                <tr key={r.id} style={{ borderTop: "1px solid " + CREAM_DK, background: i % 2 === 0 ? WHITE : CREAM + "44" }}>
                  <td style={{ padding: "6px 11px", fontSize: 12 }}>{(r.meta && r.meta.name) || "—"}</td>
                  <td style={{ padding: "6px 9px", fontSize: 11, color: MUTED }}>{(r.meta && r.meta.level) || "—"}</td>
                  <td style={{ padding: "6px 9px", fontSize: 11, color: MUTED }}>{(r.meta && r.meta.area) || "—"}</td>
                  <td style={{ padding: "6px 9px", textAlign: "center" }}><ScoreBadge score={overallScore(r)} size="sm" /></td>
                  <td style={{ padding: "6px 9px", textAlign: "center", fontSize: 10, color: MUTED_LT }}>{new Date(r.timestamp).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}


// ── Consistency View — Core vs Full-Extra per person ─────────────────────────
function ConsistencyView({ responses }) {
  const coreRR = responses.filter(function(r) { return r.survey === "core"; });
  const fullRR = responses.filter(function(r) { return r.survey === "full"; });

  if (coreRR.length === 0 || fullRR.length === 0) {
    return <div style={{ padding: 40, textAlign: "center", color: MUTED_LT }}>Se requieren respuestas de Core y Full para calcular la consistencia.</div>;
  }

  // Match respondents by meta key
  function metaKey(r) {
    if (!r.meta) return null;
    return (r.meta.name || "anonimo") + "|" + (r.meta.level || "") + "|" + (r.meta.area || "");
  }

  // Build pairs: same person in Core and Full
  const pairs = [];
  coreRR.forEach(function(cr) {
    var key = metaKey(cr);
    if (!key) return;
    var fr = fullRR.find(function(r) { return metaKey(r) === key; });
    if (fr) pairs.push({ core: cr, full: fr, key: key, name: (cr.meta && cr.meta.name) || "Anónimo", level: (cr.meta && cr.meta.level) || "—" });
  });

  if (pairs.length === 0) {
    return <div style={{ padding: 40, textAlign: "center", color: MUTED_LT }}>No se encontraron respondentes que hayan completado ambos niveles.</div>;
  }

  function dimAvg(answers, questions) {
    if (!answers) return null;
    var vals = questions.map(function(q) { return answers[q.id]; }).filter(function(v) { return v != null; });
    return vals.length > 0 ? vals.reduce(function(a,b){return a+b;},0) / vals.length : null;
  }

  // For each pair, compute per-dim scores
  var rows = pairs.map(function(p) {
    var dims = CORE_DIMS.map(function(d) {
      var coreScore = dimAvg(p.core.answers, d.questions);
      var extraQs = EXTRA_Q[d.id] || [];
      var extraScore = dimAvg(p.full.answers, extraQs);
      var diff = (coreScore != null && extraScore != null) ? extraScore - coreScore : null;
      return { dim: d, coreScore: coreScore, extraScore: extraScore, diff: diff };
    });
    return { name: p.name, level: p.level, dims: dims };
  });

  var THRESHOLD_WARN = 0.5;
  var THRESHOLD_ALERT = 1.0;

  function diffColor(diff) {
    if (diff == null) return MUTED_LT;
    var abs = Math.abs(diff);
    if (abs >= THRESHOLD_ALERT) return RED;
    if (abs >= THRESHOLD_WARN) return AMBER;
    return GREEN_LT;
  }

  function diffLabel(diff) {
    if (diff == null) return "—";
    var sign = diff > 0 ? "+" : "";
    return sign + diff.toFixed(2);
  }

  return (
    <div style={{ padding: "18px 16px", maxWidth: 800, margin: "0 auto" }}>
      <div style={{ background: WHITE, borderRadius: 10, padding: "14px 16px", marginBottom: 16, border: "1px solid " + CREAM_DK }}>
        <SectionHeader title="Índice de Consistencia · Core vs Full" />
        <p style={{ fontSize: 12, color: MUTED, lineHeight: 1.6, marginBottom: 8 }}>
          Compara el score de cada persona en el Core 25 vs las preguntas adicionales del Full por dimensión.
          Una diferencia negativa indica que la percepción se vuelve más crítica con preguntas más profundas.
        </p>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {[{color: GREEN_LT, label: "Consistente (< 0.5)"}, {color: AMBER, label: "Atención (0.5–1.0)"}, {color: RED, label: "Inconsistencia significativa (> 1.0)"}].map(function(b) {
            return <div key={b.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: b.color }} />
              <span style={{ fontSize: 10, color: MUTED }}>{b.label}</span>
            </div>;
          })}
        </div>
      </div>

      {rows.map(function(row) {
        var hasAlert = row.dims.some(function(d) { return d.diff != null && Math.abs(d.diff) >= THRESHOLD_WARN; });
        return (
          <div key={row.name} style={{ background: WHITE, borderRadius: 10, border: "1px solid " + (hasAlert ? AMBER + "55" : CREAM_DK), marginBottom: 12, overflow: "hidden" }}>
            <div style={{ padding: "10px 16px", background: hasAlert ? GOLD_PALE : CREAM, borderBottom: "1px solid " + CREAM_DK, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: CHARCOAL }}>{row.name}</span>
              <span style={{ fontSize: 11, color: MUTED }}>{row.level}</span>
              {hasAlert && <span style={{ fontSize: 9, color: AMBER, fontWeight: 700, background: AMBER + "22", padding: "1px 7px", borderRadius: 99, textTransform: "uppercase" }}>Revisar</span>}
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 500 }}>
                <thead>
                  <tr style={{ background: CREAM }}>
                    <th style={Object.assign({}, s.th, { textAlign: "left" })}>Dimensión</th>
                    <th style={s.th}>Core 25</th>
                    <th style={s.th}>Full adicional</th>
                    <th style={s.th}>Diferencia</th>
                    <th style={Object.assign({}, s.th, { textAlign: "left" })}>Interpretación</th>
                  </tr>
                </thead>
                <tbody>
                  {row.dims.map(function(d) {
                    var dc = diffColor(d.diff);
                    var abs = d.diff != null ? Math.abs(d.diff) : 0;
                    var interp = d.diff == null ? "—" :
                      abs < THRESHOLD_WARN ? "Consistente" :
                      abs < THRESHOLD_ALERT ? (d.diff < 0 ? "Profundidad revela más debilidad" : "Profundidad revela más fortaleza") :
                      (d.diff < 0 ? "Inconsistencia crítica — revisar" : "Mejora significativa con profundidad");
                    return (
                      <tr key={d.dim.id} style={{ borderTop: "1px solid " + CREAM_DK }}>
                        <td style={{ padding: "7px 12px", fontSize: 12, color: CHARCOAL }}>{d.dim.short}</td>
                        <td style={{ padding: "7px 9px", textAlign: "center" }}>
                          {d.coreScore != null ? <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, color: getMaturity(d.coreScore).color }}>{d.coreScore.toFixed(2)}</span> : <span style={{ color: MUTED_LT }}>—</span>}
                        </td>
                        <td style={{ padding: "7px 9px", textAlign: "center" }}>
                          {d.extraScore != null ? <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, color: getMaturity(d.extraScore).color }}>{d.extraScore.toFixed(2)}</span> : <span style={{ color: MUTED_LT }}>—</span>}
                        </td>
                        <td style={{ padding: "7px 9px", textAlign: "center" }}>
                          <span style={{ fontWeight: 700, fontSize: 13, color: dc }}>{diffLabel(d.diff)}</span>
                        </td>
                        <td style={{ padding: "7px 9px", fontSize: 11, color: dc }}>{interp}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Results panel with cascade tabs ──────────────────────────────────────────
function CompanySelector({ responses, selected, onSelect }) {
  const companies = [];
  responses.forEach(function(r) {
    if (r.meta && r.meta.company && companies.indexOf(r.meta.company) < 0) {
      companies.push(r.meta.company);
    }
  });
  if (companies.length === 0) return null;
  return (
    <div style={{ padding: "12px 16px", background: WHITE, borderBottom: "1px solid " + CREAM_DK, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <span style={{ fontSize: 11, color: MUTED, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0 }}>Empresa:</span>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <button onClick={function() { onSelect("ALL"); }} style={{ padding: "4px 12px", borderRadius: 99, border: selected === "ALL" ? "2px solid " + GREEN : "1px solid " + CREAM_DK, background: selected === "ALL" ? GREEN + "18" : WHITE, color: selected === "ALL" ? GREEN : MUTED, fontSize: 11, fontWeight: selected === "ALL" ? 700 : 400, cursor: "pointer", fontFamily: "inherit" }}>Todas</button>
        {companies.map(function(c) {
          return (
            <button key={c} onClick={function() { onSelect(c); }} style={{ padding: "4px 12px", borderRadius: 99, border: selected === c ? "2px solid " + GREEN : "1px solid " + CREAM_DK, background: selected === c ? GREEN + "18" : WHITE, color: selected === c ? GREEN : MUTED, fontSize: 11, fontWeight: selected === c ? 700 : 400, cursor: "pointer", fontFamily: "inherit" }}>{c}</button>
          );
        })}
      </div>
    </div>
  );
}

function ResultsPanel({ responses, coreScores, fullScores, l2, l3, activeMods, hideCompanySelector }) {
  const [selectedCompany, setSelectedCompany] = useState("ALL");
  const filteredResponses = selectedCompany === "ALL" ? responses : responses.filter(function(r) { return r.meta && r.meta.company === selectedCompany; });
  const fCoreRR = getScoringResponses(filteredResponses, "core");
  const fFullRR = getScoringResponses(filteredResponses, "full");
  const fCoreScores = computeOPRI(fCoreRR, CORE_DIMS);
  const fFullScores = computeOPRI(fFullRR, FULL_DIMS);
  const fL2 = checkL2(fCoreScores);
  const fL3 = checkL3(fFullScores);
  // Show Deep Dive tabs for any module that has responses OR is triggered by scores
  const fActiveMods = DEEP_MODULES.filter(function(m) {
    var hasResponses = filteredResponses.some(function(r) { return r.survey === "deep_" + m.id; });
    return hasResponses || fL3.mods.indexOf(m.id) >= 0;
  });

  const tabs = [
    { id: "core_opri", label: "Core OPRI", sub: "L1" },
    { id: "core_pai",  label: "Core PAI",  sub: "L1" },
    { id: "core_heat", label: "Core Maps", sub: "L1" },
  ];
  const hasFullResponses = filteredResponses.some(function(r) { return r.survey === "full"; });
  if (hasFullResponses) {
    tabs.push({ id: "full_opri", label: "Full OPRI", sub: "L2" });
    tabs.push({ id: "full_pai",  label: "Full PAI",  sub: "L2" });
    tabs.push({ id: "full_heat", label: "Full Maps", sub: "L2" });
    tabs.push({ id: "consistency", label: "Consistencia", sub: "L2" });
  }
  fActiveMods.forEach(function(m) { tabs.push({ id: "deep_" + m.id, label: m.index, sub: "L3", mod: m }); });

  const [activeTab, setActiveTab] = useState(tabs[0] ? tabs[0].id : "core_opri");

  function renderContent() {
    if (activeTab === "core_opri") return <OPRIDash tag="core" title="OPRI Core 25" dims={CORE_DIMS} responses={filteredResponses} />;
    if (activeTab === "core_pai")  return <PAIDash  tag="core" title="OPRI Core"    dims={CORE_DIMS} responses={filteredResponses} />;
    if (activeTab === "core_heat") return <HeatView tag="core" dims={CORE_DIMS} responses={filteredResponses} />;
    if (activeTab === "full_opri") return <OPRIDash tag="full" title="OPRI Full" dims={FULL_DIMS} responses={filteredResponses} />;
    if (activeTab === "full_pai")  return <PAIDash  tag="full" title="OPRI Full"    dims={FULL_DIMS} responses={filteredResponses} />;
    if (activeTab === "full_heat") return <HeatView tag="full" dims={FULL_DIMS} responses={filteredResponses} />;
    if (activeTab === "consistency") return <ConsistencyView responses={filteredResponses} />;
    const t = tabs.find(function(t) { return t.id === activeTab; });
    if (t && t.mod) return <DeepDash mod={t.mod} responses={filteredResponses} />;
    return null;
  }

  return (
    <div>
      {!hideCompanySelector && <CompanySelector responses={responses} selected={selectedCompany} onSelect={setSelectedCompany} />}
      <div style={{ padding: "10px 16px", background: WHITE, borderBottom: "1px solid " + CREAM_DK, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <CascadeStatusNode label="Core" score={fCoreScores ? fCoreScores.opri : null} n={fCoreRR.length} color={GREEN} />
        <span style={{ fontSize: 12, color: fL2.active ? AMBER : MUTED_LT }}>{"→"}</span>
        <CascadeStatusNode label="Full" score={fFullScores ? fFullScores.opri : null} n={fFullRR.length} color={GREEN_MID} locked={!fCoreScores || !fL2.active} />
        {fActiveMods.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ fontSize: 12, color: VIOLET }}>{"→"}</span>
            {fActiveMods.map(function(m) { return <span key={m.id} style={{ fontSize: 10, color: m.color, background: m.color + "18", padding: "2px 6px", borderRadius: 99, fontWeight: 700 }}>{m.index}</span>; })}
          </div>
        )}
      </div>
      <div style={{ background: WHITE, borderBottom: "1px solid " + CREAM_DK, overflowX: "auto", display: "flex" }}>
        {tabs.map(function(t) {
          return (
            <button key={t.id} onClick={function() { setActiveTab(t.id); }} style={{ padding: "9px 10px", border: "none", background: "transparent", borderBottom: activeTab === t.id ? "2px solid " + GOLD : "2px solid transparent", color: activeTab === t.id ? GREEN : MUTED, fontSize: 9, fontWeight: activeTab === t.id ? 700 : 400, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap", display: "flex", flexDirection: "column", alignItems: "center", gap: 1, fontFamily: "inherit" }}>
              <span>{t.label}</span>
              <span style={{ fontSize: 8, color: activeTab === t.id ? GOLD : MUTED_LT }}>{t.sub}</span>
            </button>
          );
        })}
      </div>
      {renderContent()}
    </div>
  );
}

function CascadeStatusNode({ label, score, n, color, locked }) {
  return (
    <div style={{ padding: "5px 9px", borderRadius: 6, border: "1px solid " + (locked ? CREAM_DK : color + "44"), background: n > 0 ? color + "0F" : CREAM, minWidth: 52, textAlign: "center" }}>
      <div style={{ fontSize: 9, color: locked ? MUTED_LT : color, fontWeight: 700, textTransform: "uppercase" }}>{label}</div>
      {score != null
        ? <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, color: getMaturity(score).color }}>{score.toFixed(2)}</div>
        : <div style={{ fontSize: 9, color: MUTED_LT }}>{n > 0 ? n + "r" : "—"}</div>
      }
    </div>
  );
}

// ── Home screen ───────────────────────────────────────────────────────────────
function HomeScreen({ responses, coreScores, fullScores, l2, l3, activeMods, deepCounts, onNavigate, onLoadDemo, onClearData }) {
  function stepStatus(which) {
    if (which === "core") return responses.filter(function(r) { return r.survey === "core"; }).length > 0 ? "done" : "pending";
    if (which === "full") {
      if (!coreScores) return "locked";
      return responses.filter(function(r) { return r.survey === "full"; }).length > 0 ? "done" : "pending";
    }
    return "pending";
  }

  function StepRow({ label, desc, score, n, color, status, subItems }) {
    const icons = { done: "✓", pending: "◌", locked: "🔒", not_required: "○" };
    const colors = { done: color, pending: AMBER, locked: MUTED_LT, not_required: MUTED_LT };
    const ic = colors[status] || MUTED_LT;
    return (
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div style={{ width: 24, height: 24, borderRadius: "50%", background: ic + "22", border: "2px solid " + ic, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: ic, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{icons[status]}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: status === "done" ? color : MUTED, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
              <span style={{ fontSize: 12, color: CHARCOAL }}>{desc}</span>
              {n > 0 && <span style={{ fontSize: 10, color: MUTED }}>{n + " resp."}</span>}
              {score != null && (
                <span>
                  <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 14, color: getMaturity(score).color, fontWeight: 600 }}>{score.toFixed(2)}</span>
                  {" "}
                  <MaturityPill score={score} />
                </span>
              )}
            </div>
            {status === "not_required" && <div style={{ fontSize: 11, color: MUTED, marginTop: 2, fontStyle: "italic" }}>Resultados dentro del umbral.</div>}
          </div>
        </div>
        {subItems && subItems.length > 0 && (
          <div style={{ marginLeft: 34, marginTop: 6 }}>
            {subItems}
          </div>
        )}
      </div>
    );
  }

  const coreN = responses.filter(function(r) { return r.survey === "core"; }).length;
  const fullN  = responses.filter(function(r) { return r.survey === "full"; }).length;

  return (
    <div style={{ padding: "22px 14px", maxWidth: 540, margin: "0 auto", width: "100%" }}>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: GREEN, marginBottom: 4, lineHeight: 1.2 }}>Organizational Performance & Resilience Index</div>
      <div style={{ fontSize: 12, color: MUTED, marginBottom: 20, lineHeight: 1.6 }}>Diagnóstico en cascada · activación automática basada en resultados</div>
      <div style={{ background: WHITE, borderRadius: 11, padding: "16px", border: "1px solid " + CREAM_DK, marginBottom: 18 }}>
        <SectionHeader title="Estado del Diagnóstico" />
        <StepRow label="Level 1" desc="OPRI Core 25" n={coreN} score={coreScores ? coreScores.opri : null} color={GREEN} status={stepStatus("core")} />
        <StepRow label="Level 2" desc="OPRI Full (35 adicionales)" n={fullN} score={fullScores ? fullScores.opri : null} color={GREEN_MID} status={stepStatus("full")}
          subItems={fullN > 0 && activeMods.length === 0 ? [
            <div key="nodp" style={{ padding: "7px 10px", background: "#DCFCE7", borderRadius: 7, fontSize: 11, color: GREEN, border: "1px solid " + GREEN_LT + "44" }}>✓ Sin Deep Dive requerido.</div>
          ] : activeMods.map(function(m) {
            const mN = deepCounts[m.id] || 0;
            const mSc = mN > 0 ? computeDeep(responses.filter(function(r) { return r.survey === "deep_" + m.id; }), m) : null;
            return (
              <StepRow key={m.id} label={m.index} desc={m.fullName} n={mN} score={mSc ? mSc.globalScore : null} color={m.color} status={fullN === 0 ? "locked" : mN > 0 ? "done" : "pending"} />
            );
          })}
        />
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={function() { onNavigate("survey"); }} style={btn(GREEN, false)}>Continuar diagnóstico →</button>
        {responses.length > 0 && <button onClick={function() { onNavigate("results"); }} style={btn(MUTED, false)}>Ver resultados</button>}
      </div>
      {responses.length === 0 && (
        <div style={{ marginTop: 16, padding: "13px 14px", background: WHITE, borderRadius: 10, border: "1px solid " + CREAM_DK }}>
          <div style={{ fontSize: 11, color: MUTED, marginBottom: 8 }}>¿Quieres ver cómo funciona el sistema de cascada? Carga datos de demostración.</div>
          <button onClick={onLoadDemo} style={Object.assign({}, btn(AMBER, false), { fontSize: 12 })}>Cargar datos demo →</button>
        </div>
      )}
      {responses.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <button onClick={onClearData} style={{ background: "none", border: "none", color: MUTED_LT, fontSize: 11, cursor: "pointer", textDecoration: "underline", padding: 0 }}>Limpiar todos los datos</button>
        </div>
      )}
    </div>
  );
}

// ── Admin Panel ──────────────────────────────────────────────────────────────
function AdminLogin({ onAuth }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  async function tryLogin() {
    setLoading(true); setError(false);
    const engs = await apiLoadEngagements(pw);
    if (engs !== null) { onAuth(pw); }
    else { setError(true); }
    setLoading(false);
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: CREAM, padding: 24 }}>
      <div style={{ background: WHITE, borderRadius: 14, padding: "32px 28px", maxWidth: 360, width: "100%", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, color: GREEN, marginBottom: 4 }}>OPRI™ Admin</div>
        <div style={{ fontSize: 12, color: MUTED, marginBottom: 24 }}>Promundial Consulting Group</div>
        <label style={s.label}>Contraseña</label>
        <input type="password" value={pw} onChange={function(e) { setPw(e.target.value); setError(false); }} onKeyDown={function(e) { if (e.key === "Enter") tryLogin(); }} placeholder="••••••••" style={Object.assign({}, s.input, { marginBottom: 8 })} />
        {error && <div style={{ fontSize: 12, color: RED, marginBottom: 8 }}>Contraseña incorrecta.</div>}
        <button onClick={tryLogin} disabled={!pw || loading} style={Object.assign({}, btn(GREEN, !pw || loading), { width: "100%", marginTop: 8 })}>{loading ? "Verificando…" : "Ingresar"}</button>
      </div>
    </div>
  );
}

function AdminPanel({ password, onExit }) {
  const [engagements, setEngagements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ company: "", consultant: "", close_date: "", survey_password: "" });
  const [savingNew, setSavingNew] = useState(false);
  const [selectedEng, setSelectedEng] = useState(null);
  const [engResponses, setEngResponses] = useState([]);
  const [loadingResults, setLoadingResults] = useState(false);

  async function reload() {
    setLoading(true);
    const data = await apiLoadEngagements(password);
    if (data) setEngagements(data);
    setLoading(false);
  }
  useEffect(function() { reload(); }, []);

  async function handleCreate() {
    if (!form.company || !form.consultant) return;
    setSavingNew(true);
    const result = await apiCreateEngagement(password, { company: form.company, consultant: form.consultant, close_date: form.close_date, survey_password: form.survey_password || undefined });
    if (result.success) { setForm({ company: "", consultant: "", close_date: "" }); setCreating(false); await reload(); }
    setSavingNew(false);
  }

  async function handleClose(eng) {
    await apiUpdateEngagement(password, { id: eng.id, status: "closed" });
    await reload();
  }

  async function handleReopen(eng) {
    await apiUpdateEngagement(password, { id: eng.id, status: "active" });
    await reload();
  }

  async function viewResults(eng) {
    setSelectedEng(eng);
    setLoadingResults(true);
    const data = await loadResponses(eng.code);
    setEngResponses(data);
    setLoadingResults(false);
  }

  if (selectedEng) {
    const coreRR = getScoringResponses(engResponses, "core");
    const fullRR = getScoringResponses(engResponses, "full");
    const coreScores = computeOPRI(coreRR, CORE_DIMS);
    const fullScores = computeOPRI(fullRR, FULL_DIMS);
    const l2 = checkL2(coreScores);
    const l3 = checkL3(fullScores);
    const activeMods = DEEP_MODULES.filter(function(m) {
      var hasResponses = engResponses.some(function(r) { return r.survey === "deep_" + m.id; });
      return hasResponses || l3.mods.indexOf(m.id) >= 0;
    });
    return (
      <div style={{ fontFamily: "'Jost', sans-serif", background: CREAM, minHeight: "100vh" }}>
        <style>{"@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Jost:wght@400;500;600;700&display=swap');*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}html,body{overflow-x:hidden;width:100%;max-width:100vw}body{overflow-x:hidden}.rg-1col{display:grid;grid-template-columns:1fr}.rg-2col{display:grid;grid-template-columns:1fr 1fr;gap:12px}.rg-3col{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}.rg-auto1fr{display:grid;grid-template-columns:auto 1fr;gap:24px;align-items:start}@media(max-width:600px){.rg-2col{grid-template-columns:1fr!important}.rg-3col{grid-template-columns:1fr!important}.rg-auto1fr{grid-template-columns:1fr!important}.hide-mobile{display:none!important}.px-mobile{padding-left:12px!important;padding-right:12px!important}.text-sm-mobile{font-size:11px!important}.flex-col-mobile{flex-direction:column!important;align-items:flex-start!important}.w-full-mobile{width:100%!important}.gap-mobile{gap:8px!important}}@media(max-width:400px){.rg-2col{grid-template-columns:1fr!important}.rg-3col{grid-template-columns:1fr!important}}"}</style>
        <div style={{ background: GREEN, padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "2px solid " + GOLD, flexWrap: "wrap", gap: 8 }}>
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: WHITE, fontWeight: 600 }}>{selectedEng.company}</div>
            <div style={{ fontSize: 9, color: GOLD, textTransform: "uppercase", letterSpacing: "0.1em" }}>OPRI™ Resultados · {selectedEng.code}</div>
          </div>
          <button onClick={function() { setSelectedEng(null); setEngResponses([]); }} style={Object.assign({}, btn(MUTED, false), { fontSize: 11 })}>← Volver</button>
        </div>
        {loadingResults ? <div style={{ padding: 40, textAlign: "center", color: MUTED }}>Cargando resultados…</div> : (
          <ResultsPanel responses={engResponses} coreScores={coreScores} fullScores={fullScores} l2={l2} l3={l3} activeMods={activeMods} hideCompanySelector={true} />
        )}
      </div>
    );
  }

  const active = engagements.filter(function(e) { return e.status === "active"; });
  const closed = engagements.filter(function(e) { return e.status === "closed"; });

  return (
    <div style={{ fontFamily: "'Jost', sans-serif", background: CREAM, minHeight: "100vh" }}>
      <style>{"@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Jost:wght@400;500;600;700&display=swap');*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}html,body{overflow-x:hidden;width:100%;max-width:100vw}body{overflow-x:hidden}.rg-1col{display:grid;grid-template-columns:1fr}.rg-2col{display:grid;grid-template-columns:1fr 1fr;gap:12px}.rg-3col{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}.rg-auto1fr{display:grid;grid-template-columns:auto 1fr;gap:24px;align-items:start}@media(max-width:600px){.rg-2col{grid-template-columns:1fr!important}.rg-3col{grid-template-columns:1fr!important}.rg-auto1fr{grid-template-columns:1fr!important}.hide-mobile{display:none!important}.px-mobile{padding-left:12px!important;padding-right:12px!important}.text-sm-mobile{font-size:11px!important}.flex-col-mobile{flex-direction:column!important;align-items:flex-start!important}.w-full-mobile{width:100%!important}.gap-mobile{gap:8px!important}}@media(max-width:400px){.rg-2col{grid-template-columns:1fr!important}.rg-3col{grid-template-columns:1fr!important}}"}</style>
      <div style={{ background: GREEN, padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "2px solid " + GOLD, flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: WHITE, fontWeight: 600 }}>OPRI™ Admin</div>
          <div style={{ fontSize: 9, color: GOLD, textTransform: "uppercase", letterSpacing: "0.1em" }}>Promundial Consulting Group</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={function() { window.open("/", "_blank"); }} style={Object.assign({}, btn(GOLD, false), { fontSize: 11, color: CHARCOAL })}>📊 Ver resultados</button>
          <button onClick={onExit} style={Object.assign({}, btn(MUTED, false), { fontSize: 11 })}>Salir</button>
        </div>
      </div>

      <div style={{ padding: "22px 16px", maxWidth: 700, margin: "0 auto", width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: GREEN }}>Engagements</div>
          <button onClick={function() { setCreating(true); }} style={btn(GREEN, false)}>+ Nuevo engagement</button>
        </div>

        {creating && (
          <div style={{ background: WHITE, borderRadius: 12, padding: "20px", border: "2px solid " + GREEN + "44", marginBottom: 18 }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: GREEN, marginBottom: 16 }}>Nuevo Engagement</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={s.label}>Empresa *</label>
                <input value={form.company} onChange={function(e) { setForm(function(p) { return Object.assign({}, p, { company: e.target.value }); }); }} placeholder="Ej. Banco Pichincha" style={s.input} />
              </div>
              <div>
                <label style={s.label}>Consultor *</label>
                <input value={form.consultant} onChange={function(e) { setForm(function(p) { return Object.assign({}, p, { consultant: e.target.value }); }); }} placeholder="Ej. José Ricardo" style={s.input} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={s.label}>Fecha de cierre (opcional)</label>
                <input type="date" value={form.close_date} onChange={function(e) { setForm(function(p) { return Object.assign({}, p, { close_date: e.target.value }); }); }} style={s.input} />
              </div>
              <div>
                <label style={s.label}>Contraseña encuestados *</label>
                <input value={form.survey_password} onChange={function(e) { setForm(function(p) { return Object.assign({}, p, { survey_password: e.target.value }); }); }} placeholder="Ej. empresa2026" style={s.input} />
                <div style={{ fontSize: 10, color: MUTED, marginTop: 3 }}>Comparte esta clave solo con los participantes</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleCreate} disabled={!form.company || !form.consultant || !form.survey_password || savingNew} style={btn(GREEN, !form.company || !form.consultant || !form.survey_password || savingNew)}>{savingNew ? "Creando…" : "Crear engagement"}</button>
              <button onClick={function() { setCreating(false); }} style={btn(MUTED, false)}>Cancelar</button>
            </div>
          </div>
        )}

        {loading ? <div style={{ padding: 32, textAlign: "center", color: MUTED }}>Cargando…</div> : (
          <div>
            {active.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <SectionHeader title={"Activos (" + active.length + ")"} color={GREEN} />
                {active.map(function(eng) { return <EngCard key={eng.id} eng={eng} onClose={handleClose} onResults={viewResults} password={password} onReload={reload} />; })}
              </div>
            )}
            {closed.length > 0 && (
              <div>
                <SectionHeader title={"Cerrados (" + closed.length + ")"} color={MUTED} />
                {closed.map(function(eng) { return <EngCard key={eng.id} eng={eng} onReopen={handleReopen} onResults={viewResults} closed={true} />; })}
              </div>
            )}
            {engagements.length === 0 && (
              <div style={{ padding: 40, textAlign: "center", color: MUTED_LT }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>◎</div>
                <div>No hay engagements aún. Crea el primero.</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EngCard({ eng, onClose, onReopen, onResults, closed, password, onReload }) {
  const surveyUrl = window.location.origin + "/e/" + eng.code;
  const [copied, setCopied] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);

  function copyLink() {
    navigator.clipboard.writeText(surveyUrl);
    setCopied(true);
    setTimeout(function() { setCopied(false); }, 2000);
  }

  async function handleGenerateReport() {
    setGeneratingReport(true);
    try {
      const allResponses = await loadResponses(eng.code);
      await generateOPRIReport(eng, allResponses, CORE_DIMS, FULL_DIMS, DEEP_MODULES, computeOPRI, computeDeep, checkL2, checkL3);
    } catch(e) {
      alert("Error generando reporte: " + e.message);
    }
    setGeneratingReport(false);
  }

  const isExpired = eng.close_date && new Date(eng.close_date) < new Date();
  return (
    <div style={{ background: WHITE, borderRadius: 10, padding: "14px 16px", border: "1px solid " + CREAM_DK, marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8, width: "100%" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: GREEN, fontWeight: 600 }}>{eng.company}</span>
            <span style={{ fontSize: 9, background: closed ? MUTED + "18" : GREEN + "18", color: closed ? MUTED : GREEN, padding: "2px 7px", borderRadius: 99, fontWeight: 700, textTransform: "uppercase" }}>{closed ? "Cerrado" : isExpired ? "Expirado" : "Activo"}</span>
          </div>
          <div style={{ fontSize: 12, color: MUTED, marginBottom: 6 }}>
            Consultor: {eng.consultant} · Código: <span style={{ fontFamily: "monospace", color: CHARCOAL }}>{eng.code}</span> · {eng.response_count || 0} respuestas{eng.survey_password ? <span style={{ marginLeft: 6, color: MUTED_LT }}>· Clave: <span style={{ fontFamily: "monospace", color: CHARCOAL }}>{eng.survey_password}</span></span> : null}
          </div>
          {!closed && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 11, color: MUTED_LT, fontFamily: "monospace", wordBreak: "break-all", flex: 1 }}>{surveyUrl}</span>
              <button onClick={copyLink} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: copied ? GREEN : MUTED }}>{copied ? "✓ Copiado" : "Copiar"}</button>
            </div>
          )}
          {eng.close_date && <div style={{ fontSize: 11, color: MUTED_LT, marginTop: 3, wordBreak: "break-word" }}>Cierre: {new Date(eng.close_date).toLocaleDateString("es-ES")}</div>}
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end", maxWidth: "100%" }}>
          <button onClick={function() { onResults(eng); }} style={Object.assign({}, btn(BLUE, false), { fontSize: 11, padding: "7px 14px" })}>Ver resultados</button>
          <button onClick={handleGenerateReport} disabled={generatingReport} style={Object.assign({}, btn(GOLD, generatingReport), { fontSize: 11, padding: "7px 14px", color: generatingReport ? MUTED_LT : CHARCOAL })}>{generatingReport ? "Generando…" : "📄 Reporte PDF"}</button>
          {!closed && <button onClick={function() { onClose(eng); }} style={Object.assign({}, btn(RED, false), { fontSize: 11, padding: "7px 14px" })}>Cerrar</button>}
          {closed && onReopen && <button onClick={function() { onReopen(eng); }} style={Object.assign({}, btn(MUTED, false), { fontSize: 11, padding: "7px 14px" })}>Reabrir</button>}
        </div>
      </div>
    </div>
  );
}


// ── Respondent Login ───────────────────────────────────────────────────────────
function RespondentLogin({ company, surveyPassword, onAuth }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);
  function attempt() {
    const correct = surveyPassword || RESPONDENT_PASS; // fallback to global if not set
    if (pw === correct) { onAuth(); }
    else { setError(true); setTimeout(function() { setError(false); }, 1800); setPw(""); }
  }
  function handleKey(e) { if (e.key === "Enter") attempt(); }
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: CREAM, padding: 24 }}>
      <style>{"@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Jost:wght@400;500;600;700&display=swap');*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}html,body{overflow-x:hidden;width:100%;max-width:100vw}body{overflow-x:hidden}.rg-1col{display:grid;grid-template-columns:1fr}.rg-2col{display:grid;grid-template-columns:1fr 1fr;gap:12px}.rg-3col{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}.rg-auto1fr{display:grid;grid-template-columns:auto 1fr;gap:24px;align-items:start}@media(max-width:600px){.rg-2col{grid-template-columns:1fr!important}.rg-3col{grid-template-columns:1fr!important}.rg-auto1fr{grid-template-columns:1fr!important}.hide-mobile{display:none!important}.px-mobile{padding-left:12px!important;padding-right:12px!important}.text-sm-mobile{font-size:11px!important}.flex-col-mobile{flex-direction:column!important;align-items:flex-start!important}.w-full-mobile{width:100%!important}.gap-mobile{gap:8px!important}}@media(max-width:400px){.rg-2col{grid-template-columns:1fr!important}.rg-3col{grid-template-columns:1fr!important}}"}</style>
      <div style={{ background: WHITE, borderRadius: 14, padding: "28px 20px", maxWidth: 380, width: "100%", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", border: "1px solid " + CREAM_DK }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: GREEN, fontWeight: 600, marginBottom: 4 }}>OPRI™</div>
          <div style={{ fontSize: 10, color: GOLD, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>Enterprise Edition · Promundial</div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: CHARCOAL, marginBottom: 4 }}>{company}</div>
          <div style={{ fontSize: 12, color: MUTED }}>Ingrese la contraseña para comenzar</div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontSize: 11, color: MUTED, marginBottom: 5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Contraseña</label>
          <input
            type="password"
            value={pw}
            onChange={function(e) { setPw(e.target.value); }}
            onKeyDown={handleKey}
            placeholder="••••••••••••"
            style={{ width: "100%", padding: "11px 14px", borderRadius: 8, border: "2px solid " + (error ? RED : CREAM_DK), background: WHITE, fontSize: 15, color: CHARCOAL, boxSizing: "border-box", outline: "none", fontFamily: "inherit", transition: "border-color 0.2s" }}
            autoFocus
          />
          {error && <div style={{ fontSize: 11, color: RED, marginTop: 5, fontWeight: 600 }}>Contraseña incorrecta. Intente nuevamente.</div>}
        </div>
        <button
          onClick={attempt}
          disabled={!pw}
          style={{ width: "100%", padding: "11px", borderRadius: 8, background: pw ? GREEN : CREAM_DK, color: pw ? WHITE : MUTED_LT, border: "none", fontSize: 14, fontWeight: 700, cursor: pw ? "pointer" : "not-allowed", fontFamily: "inherit", transition: "all 0.15s" }}
        >
          Ingresar →
        </button>
        <div style={{ textAlign: "center", marginTop: 20, fontSize: 10, color: MUTED_LT, letterSpacing: "0.06em" }}>
          OPRI™ ENTERPRISE EDITION · PROMUNDIAL CONSULTING GROUP
        </div>
      </div>
    </div>
  );
}

// ── Engagement Survey (public URL /e/:code) ───────────────────────────────────
// ── Welcome Screen ────────────────────────────────────────────────────────────
function WelcomeScreen({ company, onStart }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: CREAM, padding: 24 }}>
      <style>{"@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Jost:wght@400;500;600;700&display=swap');"}</style>
      <div style={{ background: WHITE, borderRadius: 14, padding: "36px 28px", maxWidth: 480, width: "100%", boxShadow: "0 4px 24px rgba(0,0,0,0.07)", border: "1px solid " + CREAM_DK }}>
        
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, color: GOLD, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 6 }}>Promundial Consulting Group</div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 30, color: GREEN, fontWeight: 600, marginBottom: 4 }}>OPRI™</div>
          <div style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: "0.1em" }}>Organizational Performance & Resilience Index</div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: CREAM_DK, marginBottom: 24 }} />

        {/* Content */}
        <p style={{ fontSize: 14, color: CHARCOAL, lineHeight: 1.8, marginBottom: 16 }}>
          <strong style={{ color: GREEN }}>{company}</strong> ha decidido implementar el diagnóstico OPRI™ como parte de su proceso de mejora organizacional. Este instrumento permite identificar fortalezas, brechas y oportunidades de desarrollo en las dimensiones clave del desempeño organizacional.
        </p>
        <p style={{ fontSize: 14, color: CHARCOAL, lineHeight: 1.8, marginBottom: 16 }}>
          Sus respuestas son <strong>estrictamente confidenciales</strong>. Los resultados se presentan únicamente de forma agregada — nunca de manera individual. No hay respuestas correctas ni incorrectas; lo que importa es su percepción honesta de la realidad de la organización.
        </p>
        {/* Levels */}
        <div style={{ background: CREAM, borderRadius: 10, padding: "16px 18px", marginBottom: 24, border: "1px solid " + CREAM_DK }}>
          <div style={{ fontSize: 11, color: GREEN, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Estructura del diagnóstico</div>
          {[
            { level: "Level 1", name: "OPRI Core 25", time: "~8 min", desc: "Diagnóstico base. Lo completan todos los participantes.", color: GREEN, always: true },
            { level: "Level 2", name: "OPRI Full", time: "+10 min", desc: "35 preguntas adicionales. Las completan todos los participantes después del Core.", color: GREEN_MID, always: true },
            { level: "Level 3", name: "Deep Dive", time: "+12 min", desc: "Módulos especializados que se activan según los resultados del Full.", color: VIOLET, always: false },
          ].map(function(l) {
            return (
              <div key={l.level} style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: l.color + "18", border: "2px solid " + l.color + "55", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: l.color }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: l.color }}>{l.name}</span>
                    <span style={{ fontSize: 9, color: l.color, background: l.color + "14", padding: "1px 7px", borderRadius: 99, fontWeight: 600 }}>{l.time}</span>
                    {l.always && <span style={{ fontSize: 9, color: GREEN, background: GREEN + "14", padding: "1px 7px", borderRadius: 99, fontWeight: 600 }}>Todos</span>}
                  </div>
                  <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.5 }}>{l.desc}</div>
                </div>
              </div>
            );
          })}
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid " + CREAM_DK, fontSize: 12, color: MUTED }}>
            Tiempo total estimado: <strong style={{ color: CHARCOAL }}>entre 8 y 22 minutos</strong>, según los niveles que se activen para usted.
          </div>
        </div>
        <p style={{ fontSize: 14, color: CHARCOAL, lineHeight: 1.8, marginBottom: 28 }}>
          Le agradecemos su tiempo y su disposición a contribuir al desarrollo de {company}.
        </p>

        {/* Divider */}
        <div style={{ height: 1, background: CREAM_DK, marginBottom: 24 }} />

        <button
          onClick={onStart}
          style={{ width: "100%", padding: "13px", borderRadius: 8, background: GREEN, color: WHITE, border: "none", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.03em" }}
        >
          Comenzar diagnóstico →
        </button>

        <div style={{ textAlign: "center", marginTop: 16, fontSize: 10, color: MUTED_LT, letterSpacing: "0.06em" }}>
          OPRI™ ENTERPRISE EDITION · PROMUNDIAL CONSULTING GROUP
        </div>
      </div>
    </div>
  );
}

function EngagementSurveyPage({ code }) {
  const [engagement, setEngagement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSurvey, setActiveSurvey] = useState(null);
  const [responses, setResponses] = useState([]);
  const [savedMeta, setSavedMeta] = useState(null); // persists meta across levels
  const [authenticated, setAuthenticated] = useState(false); // respondent login
  const [welcomed, setWelcomed] = useState(false); // welcome screen shown
  // completedSurveys is keyed by engagement code so different engagements don't bleed
  var SESSION_KEY = "opri_session_" + code;
  function loadSession() { try { var v = sessionStorage.getItem(SESSION_KEY); return v ? JSON.parse(v) : { done: [], progress: {} }; } catch(e) { return { done: [], progress: {} }; } }
  function saveSession(s) { try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch(e) {} }
  function updateProgress(surveyId, data) {
    var s = loadSession();
    s.progress = s.progress || {};
    s.progress[surveyId] = data;
    saveSession(s);
  }
  function clearProgress(surveyId) {
    var s = loadSession();
    if (s.progress) { delete s.progress[surveyId]; saveSession(s); }
  }
  function getProgress(surveyId) {
    var s = loadSession();
    return (s.progress && s.progress[surveyId]) || null;
  }
  const [session, setSession] = useState(loadSession());
  var completedSurveys = session.done;

  useEffect(function() {
    async function init() {
      const eng = await apiGetEngagement(code);
      setEngagement(eng);
      if (eng && eng.status === "active") {
        const data = await loadResponses(code);
        setResponses(data);

        // Restore completedSurveys from Airtable if sessionStorage is empty
        // Match by respondent meta saved in sessionStorage
        var s = loadSession();
        if (s.done.length === 0 && data.length > 0) {
          var savedMeta = loadSavedMeta();
          if (savedMeta && savedMeta.company) {
            // Find responses from this respondent by matching name+level+area
            var myResponses = data.filter(function(r) {
              if (!r.meta) return false;
              var nameMatch = !savedMeta.name || !r.meta.name || r.meta.name === savedMeta.name;
              var levelMatch = r.meta.level === savedMeta.level;
              var areaMatch = r.meta.area === savedMeta.area;
              return levelMatch && areaMatch && nameMatch;
            });
            if (myResponses.length > 0) {
              myResponses.forEach(function(r) {
                if (s.done.indexOf(r.survey) < 0) s.done.push(r.survey);
              });
              saveSession(s);
              setSession(Object.assign({}, s));
            }
          }
        }
      }
      setLoading(false);
    }
    init();
  }, [code]);

  async function handleDone() {
    const data = await loadResponses(code);
    setResponses(data);
    var s = loadSession();
    setSession(Object.assign({}, s)); // refresh session state
    setActiveSurvey(null);
  }

  function handleSurveyDone(surveyId) {
    var s = loadSession();
    if (s.done.indexOf(surveyId) < 0) {
      s.done.push(surveyId);
      saveSession(s);
      setSession(Object.assign({}, s));
    }
  }

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: CREAM, padding: 16 }}><div style={{ textAlign: "center", color: MUTED }}><div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: GREEN, marginBottom: 6 }}>OPRI™</div><div>Cargando…</div></div></div>;

  if (!authenticated && engagement && engagement.status === "active") {
    return <RespondentLogin company={engagement.company} surveyPassword={engagement.survey_password} onAuth={function() { setAuthenticated(true); }} />;
  }

  if (authenticated && !welcomed && engagement && engagement.status === "active") {
    return <WelcomeScreen company={engagement.company} onStart={function() { setWelcomed(true); }} />;
  }

  if (!engagement) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: CREAM, padding: 16, padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 320 }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: GREEN, marginBottom: 8 }}>Encuesta no encontrada</div>
        <div style={{ fontSize: 13, color: MUTED }}>El código de encuesta no existe o ha expirado.</div>
      </div>
    </div>
  );

  const isExpired = engagement.close_date && new Date(engagement.close_date) < new Date();
  if (engagement.status === "closed" || isExpired) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: CREAM, padding: 16, padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 340 }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>✓</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: GREEN, marginBottom: 8 }}>Esta encuesta ha cerrado</div>
        <div style={{ fontSize: 13, color: MUTED }}>Gracias por su participación. Los resultados están siendo procesados por el equipo de Promundial.</div>
      </div>
    </div>
  );

  const coreRR = getScoringResponses(responses, "core");
  const fullRR = getScoringResponses(responses, "full");
  const coreScores = computeOPRI(coreRR, CORE_DIMS);
  const fullScores = computeOPRI(fullRR, FULL_DIMS);
  const l2 = checkL2(coreScores);
  const l3 = checkL3(fullScores);
  const activeMods = DEEP_MODULES.filter(function(m) {
    var hasResponses = responses.some(function(r) { return r.survey === "deep_" + m.id; });
    return hasResponses || l3.mods.indexOf(m.id) >= 0;
  });
  const deepCounts = {};
  DEEP_MODULES.forEach(function(m) { deepCounts[m.id] = responses.filter(function(r) { return r.survey === "deep_" + m.id; }).length; });

  function renderSurvey() {
    if (!activeSurvey) {
      const coreDone = completedSurveys.indexOf("core") >= 0;
      const fullDone = completedSurveys.indexOf("full") >= 0;

      // Use ONLY this respondent's session to determine what to show.
      // Compute scores from their own submitted responses (stored in Airtable but
      // we match by session: after coreDone we use aggregate scores to determine
      // whether Full/Deep are needed — but only show them after this person completed Core).
      const myL2 = coreDone ? checkL2(coreScores) : { active: false, reasons: [] };
      const myL3 = fullDone ? checkL3(fullScores) : { mods: [], fdd: false, reasons: [] };
      const myActiveMods = DEEP_MODULES.filter(function(m) { return myL3.mods.indexOf(m.id) >= 0; });

      const allDeepDone = myActiveMods.length > 0 && myActiveMods.every(function(m) { return completedSurveys.indexOf("deep_" + m.id) >= 0; });
      const everythingDone = coreDone && fullDone && (myActiveMods.length === 0 || allDeepDone);

      if (everythingDone) {
        return (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", padding: "32px 16px", textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: GREEN + "18", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
              <span style={{ fontSize: 30, color: GREEN }}>✓</span>
            </div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, color: GREEN, fontWeight: 600, marginBottom: 10 }}>¡Muchas gracias!</div>
            <div style={{ fontSize: 14, color: MUTED, maxWidth: 320, lineHeight: 1.7, marginBottom: 6, wordBreak: "break-word" }}>
              {"Su participación en el diagnóstico OPRI™ de " + engagement.company + " ha sido registrada."}
            </div>
            <div style={{ fontSize: 13, color: MUTED_LT, maxWidth: 300, lineHeight: 1.6 }}>
              El equipo de Promundial procesará los resultados y los compartirá con su organización.
            </div>
            <div style={{ marginTop: 24, padding: "10px 18px", background: GOLD_PALE, borderRadius: 8, border: "1px solid " + GOLD + "44" }}>
              <span style={{ fontSize: 11, color: CHARCOAL, letterSpacing: "0.05em" }}>OPRI™ ENTERPRISE EDITION · PROMUNDIAL CONSULTING GROUP</span>
            </div>
          </div>
        );
      }

      return (
        <div style={{ padding: "22px 14px", maxWidth: 540, margin: "0 auto", width: "100%" }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: GREEN, marginBottom: 4, wordBreak: "break-word" }}>{engagement.company}</div>
          <div style={{ fontSize: 12, color: MUTED, marginBottom: 20 }}>OPRI™ Core Survey · Complete su diagnóstico</div>

          {/* Level 1 — always visible */}
          <SurveyCard level="Level 1" badge={coreDone ? "✓ Completado" : "Iniciar"} label="OPRI Core 25" desc="Diagnóstico rápido · 25 preguntas · ~8 min" color={GREEN} status={coreDone ? "done" : "available"} onClick={coreDone ? undefined : function() { setActiveSurvey({ id: "core" }); }} />

          {/* Level 2 — always shown after Core */}
          {coreDone && (
            <SurveyCard level="Level 2" badge={fullDone ? "✓ Completado" : "Siguiente paso"} label="OPRI Full" desc="35 preguntas · ~10 min" color={GREEN_MID} status={fullDone ? "done" : "activated"} triggers={[]} onClick={fullDone ? undefined : function() { setActiveSurvey({ id: "full" }); }} />
          )}

          {/* Level 3 — only shown after THIS respondent completes Full */}
          {fullDone && myActiveMods.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 10, color: MUTED, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 7 }}>Level 3 — Deep Dive</div>
              {myActiveMods.map(function(m) {
                const deepDone = completedSurveys.indexOf("deep_" + m.id) >= 0;
                const qCount = m.groups.reduce(function(sum, g) { return sum + g.qs.length; }, 0);
                return (
                  <SurveyCard key={m.id} level={m.index} badge={deepDone ? "✓ Completado" : "Activado"} label={m.fullName} desc={qCount + " preguntas"} color={m.color} status={deepDone ? "done" : "activated"} triggers={[]} onClick={deepDone ? undefined : function() { setActiveSurvey({ id: "deep_" + m.id, mod: m }); }} />
                );
              })}
            </div>
          )}
        </div>
      );
    }
    if (activeSurvey.id === "core") return <OPRISurvey level="core" engagementCode={code} presetCompany={engagement.company} onDone={handleDone} onMetaSaved={setSavedMeta} onSurveyDone={handleSurveyDone} onBack={function() { setActiveSurvey(null); }} savedProgress={getProgress("core")} onProgress={function(d) { updateProgress("core", d); }} onClearProgress={function() { clearProgress("core"); }} onLogout={function() { setAuthenticated(false); }} />;
    if (activeSurvey.id === "full") return <OPRISurvey level="full" engagementCode={code} presetCompany={engagement.company} inheritedMeta={savedMeta} onDone={handleDone} onSurveyDone={handleSurveyDone} onBack={function() { setActiveSurvey(null); }} savedProgress={getProgress("full")} onProgress={function(d) { updateProgress("full", d); }} onClearProgress={function() { clearProgress("full"); }} onLogout={function() { setAuthenticated(false); }} />;
    if (activeSurvey.mod) return <DeepSurvey mod={activeSurvey.mod} engagementCode={code} inheritedMeta={savedMeta} onDone={handleDone} onSurveyDone={handleSurveyDone} onBack={function() { setActiveSurvey(null); }} savedProgress={getProgress("deep_" + activeSurvey.mod.id)} onProgress={function(d) { updateProgress("deep_" + activeSurvey.mod.id, d); }} onClearProgress={function() { clearProgress("deep_" + activeSurvey.mod.id); }} onLogout={function() { setAuthenticated(false); }} />;
    return null;
  }

  return (
    <div style={{ fontFamily: "'Jost', sans-serif", background: CREAM, minHeight: "100vh", maxWidth: 860, margin: "0 auto", width: "100%" }}>
      <style>{"@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Jost:wght@400;500;600;700&display=swap');*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}html,body{overflow-x:hidden;width:100%;max-width:100vw}body{overflow-x:hidden}.rg-1col{display:grid;grid-template-columns:1fr}.rg-2col{display:grid;grid-template-columns:1fr 1fr;gap:12px}.rg-3col{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}.rg-auto1fr{display:grid;grid-template-columns:auto 1fr;gap:24px;align-items:start}@media(max-width:600px){.rg-2col{grid-template-columns:1fr!important}.rg-3col{grid-template-columns:1fr!important}.rg-auto1fr{grid-template-columns:1fr!important}.hide-mobile{display:none!important}.px-mobile{padding-left:12px!important;padding-right:12px!important}.text-sm-mobile{font-size:11px!important}.flex-col-mobile{flex-direction:column!important;align-items:flex-start!important}.w-full-mobile{width:100%!important}.gap-mobile{gap:8px!important}}@media(max-width:400px){.rg-2col{grid-template-columns:1fr!important}.rg-3col{grid-template-columns:1fr!important}}"}</style>
      <div style={{ background: GREEN, padding: "12px 18px", borderBottom: "2px solid " + GOLD }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: WHITE, fontWeight: 600 }}>OPRI™</div>
        <div style={{ fontSize: 9, color: GOLD, textTransform: "uppercase", letterSpacing: "0.1em" }}>Enterprise Edition · Promundial</div>
      </div>
      {renderSurvey()}
      <div style={{ padding: "12px", textAlign: "center", borderTop: "1px solid " + CREAM_DK, marginTop: 16 }}>
        <span style={{ fontSize: 9, color: MUTED_LT, letterSpacing: "0.08em" }}>{"OPRI™ ENTERPRISE EDITION · PROMUNDIAL CONSULTING GROUP · " + new Date().getFullYear()}</span>
      </div>
    </div>
  );
}

// ── Demo data generator ──────────────────────────────────────────────────────
function makeDemoAnswers(dims, low) {
  const answers = {};
  dims.forEach(function(d) {
    d.questions.forEach(function(q) {
      answers[q.id] = low ? (2 + Math.floor(Math.random() * 2)) : (4 + Math.floor(Math.random() * 2));
    });
  });
  return answers;
}
function generateDemoData() {
  const lvls = ["Comité Ejecutivo","Directores/Gerentes","Supervisores","Colaboradores","Colaboradores"];
  const areas = ["Operaciones","Comercial","Finanzas","RRHH","TI"];
  const data = [];
  for (let i = 0; i < 5; i++) {
    data.push({ id: "DEMO_" + i, timestamp: new Date(Date.now() - i * 3600000).toISOString(), survey: "core",
      meta: { name: "Demo " + (i + 1), level: lvls[i], area: areas[i], country: "Ecuador", bu: "Corp" },
      answers: makeDemoAnswers(CORE_DIMS, i >= 2) });
  }
  return data;
}

// ── OPRI™ Report Generator ────────────────────────────────────────────────────
// Called from EngCard: generateReport(eng, responses, scores)
// Opens a new window with the full HTML report + print button

const MATURITY_ES = [
  { min: 0,   max: 2.5,  es: "Crítico",       en: "Critical",       color: RED },
  { min: 2.5, max: 3.2,  es: "Vulnerable",    en: "Vulnerable",     color: ORANGE },
  { min: 3.2, max: 3.8,  es: "Estable",       en: "Stable",         color: AMBER },
  { min: 3.8, max: 4.3,  es: "Alto Desempeño",en: "High Performance",color: GREEN_LT },
  { min: 4.3, max: 5.01, es: "World Class",   en: "World Class",    color: GREEN },
];
function getM(s) { return MATURITY_ES.find(function(m) { return s >= m.min && s < m.max; }) || MATURITY_ES[MATURITY_ES.length-1]; }

const RPT_PAI_BANDS = [
  { min: 0,   max: 0.3,  es: "Alta alineación",      en: "High Alignment",       color: GREEN },
  { min: 0.3, max: 0.7,  es: "Moderado",             en: "Moderate",             color: AMBER },
  { min: 0.7, max: 1.2,  es: "Riesgo",               en: "Risk",                 color: ORANGE },
  { min: 1.2, max: 99,   es: "Desconexión crítica",  en: "Critical Disconnection",color: RED },
];
function getPAI(g) { return RPT_PAI_BANDS.find(function(b) { return g >= b.min && g < b.max; }) || RPT_PAI_BANDS[RPT_PAI_BANDS.length-1]; }

const DIM_META = {
  alignment:  { es: "Alineación Estratégica",          en: "Strategic Alignment",             color: BLUE,   icon: "◈" },
  execution:  { es: "Excelencia de Ejecución",         en: "Execution Excellence",            color: GREEN,  icon: "◆" },
  leadership: { es: "Liderazgo & Efectividad Colectiva",en: "Leadership & Collective Effectiveness", color: VIOLET, icon: "◉" },
  resilience: { es: "Cambio & Resiliencia",            en: "Change & Resilience",             color: AMBER,  icon: "◐" },
  culture:    { es: "Salud Organizacional & Cultura",  en: "Organizational Health & Culture", color: TEAL,   icon: "◑" },
};

// ── Gauge SVG ─────────────────────────────────────────────────────────────────
function gaugeHTML(score, color, size) {
  size = size || 120;
  var sw = size * 0.09;
  var r = size * 0.38;
  var cx = size / 2;
  var cy = r + sw;
  var svgW = size;
  var svgH = cy + size * 0.22;
  var pct = Math.min(Math.max(score / 5, 0), 1);

  // Key points
  var lx = (cx - r).toFixed(2), ly = cy.toFixed(2);  // left
  var tx = cx.toFixed(2), ty = (cy - r).toFixed(2);  // top
  var rx2 = (cx + r).toFixed(2), ry = cy.toFixed(2); // right

  // End point of score arc
  var endAngle = Math.PI * (1 - pct);
  var ex = (cx + r * Math.cos(endAngle)).toFixed(2);
  var ey = (cy - r * Math.sin(endAngle)).toFixed(2);

  // Background: full semicircle left→top→right (one arc, sweep=1)
  var bg = "<path d=\"M " + lx + " " + ly + " A " + r + " " + r + " 0 0 1 " + rx2 + " " + ry + "\" fill=\"none\" stroke=\"#E5E7EB\" stroke-width=\"" + sw + "\" stroke-linecap=\"round\"/>";

  // Score arc: always two segments via top point
  // Seg1: left → top (always, if pct > 0)
  // Seg2: top → endpoint (only if pct > 0.5)
  var scoreArcs = "";
  if (pct > 0) {
    if (pct <= 0.5) {
      // Single small arc: left → endpoint (sweep=1)
      scoreArcs = "<path d=\"M " + lx + " " + ly + " A " + r + " " + r + " 0 0 1 " + ex + " " + ey + "\" fill=\"none\" stroke=\"" + color + "\" stroke-width=\"" + sw + "\" stroke-linecap=\"round\"/>";
    } else {
      // Two arcs via top
      scoreArcs =
        "<path d=\"M " + lx + " " + ly + " A " + r + " " + r + " 0 0 1 " + tx + " " + ty + "\" fill=\"none\" stroke=\"" + color + "\" stroke-width=\"" + sw + "\" stroke-linecap=\"round\"/>" +
        "<path d=\"M " + tx + " " + ty + " A " + r + " " + r + " 0 0 1 " + ex + " " + ey + "\" fill=\"none\" stroke=\"" + color + "\" stroke-width=\"" + sw + "\" stroke-linecap=\"round\"/>";
    }
  }

  return (
    "<svg width=\"" + svgW + "\" height=\"" + svgH.toFixed(1) + "\" viewBox=\"0 0 " + svgW + " " + svgH.toFixed(1) + "\">" +
    bg + scoreArcs +
    "<text x=\"" + cx + "\" y=\"" + (cy + size*0.10).toFixed(1) + "\" text-anchor=\"middle\" font-size=\"" + (size*0.21) + "\" font-weight=\"700\" fill=\"" + color + "\" font-family=\"Georgia,serif\">" + score.toFixed(2) + "</text>" +
    "<text x=\"" + cx + "\" y=\"" + (cy + size*0.19).toFixed(1) + "\" text-anchor=\"middle\" font-size=\"" + (size*0.086) + "\" fill=\"#6B7280\" font-family=\"sans-serif\">/ 5.00</text>" +
    "</svg>"
  );
}


// ── Bar chart ─────────────────────────────────────────────────────────────────
// MBB-style: monochrome bars (charcoal), maturity shown as a small text label,
// not as a colored fill — color is reserved for meaning (a dot), not decoration.
function barHTML(dims, scores) {
  var bars = dims.map(function(d) {
    var sc = scores.dimScores[d.id];
    var m = sc != null ? getM(sc) : null;
    var meta = DIM_META[d.id];
    var pct = sc != null ? (sc / 5 * 100).toFixed(1) : 0;
    return '<div style="margin-bottom:14px">' +
      '<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px">' +
        '<span style="font-size:11px;color:' + CHARCOAL + ';font-weight:600">' + meta.es + ' <span style="color:#9CA3AF;font-weight:400;font-size:10px">/ ' + meta.en + '</span></span>' +
        '<span style="display:flex;align-items:baseline;gap:6px">' +
          (m ? '<span style="width:6px;height:6px;border-radius:50%;background:' + m.color + ';display:inline-block"></span>' : '') +
          '<span style="font-family:Georgia,serif;font-size:15px;font-weight:700;color:' + CHARCOAL + '">' + (sc != null ? sc.toFixed(2) : '—') + '</span>' +
        '</span>' +
      '</div>' +
      '<div style="background:#EDEDED;height:3px">' +
        '<div style="width:' + pct + '%;height:100%;background:' + CHARCOAL + '"></div>' +
      '</div>' +
    '</div>';
  }).join('');
  return bars;
}

// ── PAI table ─────────────────────────────────────────────────────────────────
// MBB-style: horizontal rules only, no zebra striping, no colored pill badges —
// state is conveyed with a small dot + plain text, not a colored background.
function paiTableHTML(dims, scores) {
  var rows = dims.map(function(d) {
    var p = scores.paiByDim[d.id];
    var meta = DIM_META[d.id];
    var band = p && p.gap != null ? getPAI(p.gap) : null;
    return '<tr style="border-bottom:1px solid #E5E5E5">' +
      '<td style="padding:9px 10px;font-size:12px;color:' + CHARCOAL + ';font-weight:600">' + meta.es + '</td>' +
      '<td style="padding:9px 10px;text-align:center;font-size:12px;font-family:Georgia,serif;color:' + CHARCOAL + '">' + (p && p.ls != null ? p.ls.toFixed(2) : '—') + '</td>' +
      '<td style="padding:9px 10px;text-align:center;font-size:12px;font-family:Georgia,serif;color:' + CHARCOAL + '">' + (p && p.os != null ? p.os.toFixed(2) : '—') + '</td>' +
      '<td style="padding:9px 10px;text-align:center;font-size:13px;font-weight:700;font-family:Georgia,serif;color:' + CHARCOAL + '">' + (p && p.gap != null ? p.gap.toFixed(2) : '—') + '</td>' +
      '<td style="padding:9px 10px;text-align:left"><span style="display:inline-flex;align-items:center;gap:6px;font-size:11px;color:' + MUTED + '">' + (band ? '<span style="width:6px;height:6px;border-radius:50%;background:' + band.color + ';display:inline-block;flex-shrink:0"></span>' + band.es : '—') + '</span></td>' +
    '</tr>';
  }).join('');
  return '<table style="width:100%;border-collapse:collapse">' +
    '<thead><tr style="border-bottom:1.5px solid ' + CHARCOAL + '">' +
      '<th style="padding:8px 10px;text-align:left;font-size:9px;color:' + MUTED + ';text-transform:uppercase;letter-spacing:0.08em;font-weight:600">Dimensión</th>' +
      '<th style="padding:8px 10px;text-align:center;font-size:9px;color:' + MUTED + ';text-transform:uppercase;letter-spacing:0.08em;font-weight:600">Liderazgo</th>' +
      '<th style="padding:8px 10px;text-align:center;font-size:9px;color:' + MUTED + ';text-transform:uppercase;letter-spacing:0.08em;font-weight:600">Organización</th>' +
      '<th style="padding:8px 10px;text-align:center;font-size:9px;color:' + MUTED + ';text-transform:uppercase;letter-spacing:0.08em;font-weight:600">GAP</th>' +
      '<th style="padding:8px 10px;text-align:left;font-size:9px;color:' + MUTED + ';text-transform:uppercase;letter-spacing:0.08em;font-weight:600">Estado</th>' +
    '</tr></thead><tbody>' + rows + '</tbody></table>';
}

// ── PAI explainer (static, human-written — no API call needed for this one) ──
function paiExplainer(scores) {
  var dims = Object.keys(scores.paiByDim).map(function(id) {
    return Object.assign({ id: id }, scores.paiByDim[id]);
  }).filter(function(p) { return p.gap != null; });
  if (dims.length === 0) {
    return "El PAI™ mide qué tan distinta es la lectura de la organización según el nivel jerárquico de quien responde: compara el promedio de las respuestas del Comité Ejecutivo y Directores/Gerentes contra el de Supervisores y Colaboradores, dimensión por dimensión. Un gap alto no dice quién tiene razón — dice que ambos grupos están operando con información o experiencias distintas, lo cual suele ser en sí mismo parte del problema.";
  }
  dims.sort(function(a, b) { return b.gap - a.gap; });
  var widest = dims[0];
  var widestMeta = DIM_META[widest.id];
  var leaderHigher = widest.ls > widest.os;
  var direction = leaderHigher
    ? "el liderazgo la percibe considerablemente mejor de lo que la vive el resto de la organización"
    : "el resto de la organización la percibe mejor de lo que reconoce el propio liderazgo";
  var implication = leaderHigher
    ? "eso normalmente significa que hay una historia que se cuenta arriba y una que se vive abajo, y ninguna intervención va a funcionar si primero no se cierra esa distancia de información"
    : "es un patrón menos común, y suele indicar que el equipo está compensando o resolviendo por su cuenta problemas que el liderazgo todavía no ve como tales";
  return "El PAI™ compara cómo ve cada dimensión el Comité Ejecutivo y Directores/Gerentes frente a cómo la ve el resto de la organización. La brecha más amplia aquí está en " + widestMeta.es + " (" + widest.gap.toFixed(2) + " puntos): " + direction + ". En la práctica, " + implication + ".";
}

// ── Recommendation logic ──────────────────────────────────────────────────────
// Column labels: lss = "Lean Six Sigma / Operational Excellence & I2E™", belbin = "Belbin Team Roles", leadership = "Leadership Excellence"
function getRecommendations(dimId, score) {
  var isCritical = score < 2.5;
  var isVulnerable = score >= 2.5 && score < 3.2;
  var isStable = score >= 3.2 && score < 3.8;

  var recs = {
    alignment: {
      lss: isCritical ? [
        "Taller de QFD (Quality Function Deployment) para traducir prioridades estratégicas en KPIs financieros y operativos",
        "Implementar VSM (Value Stream Mapping) del proceso de cascada estratégica",
        "Hoshin Kanri / X-Matrix: alinear objetivos estratégicos con metas operativas por área",
        "I2E™ Fase OBSERVE: diagnóstico de fricciones entre estrategia declarada y ejecución real",
      ] : isVulnerable ? [
        "QFD Nivel 1: House of Quality para alinear voz del cliente con prioridades estratégicas",
        "Mapeo de iniciativas actuales vs. prioridades estratégicas (Urgente/Importante + OKR)",
        "I2E™ Fase DECODE: identificar por qué las prioridades no se traducen en acción",
        "Rutinas de seguimiento estratégico mensual (S&OP adaptado)",
      ] : [
        "QFD avanzado: despliegue a indicadores financieros (EVA, EBITDA) y operativos por proceso",
        "I2E™ Fase SCALE: estandarizar el modelo de comunicación estratégica sin perder agilidad",
        "Dashboard estratégico en tiempo real ligado a KPIs financieros",
      ],
      belbin: isCritical ? [
        "Talleres Belbin para identificar Coordinador/Cerebro en el equipo directivo",
        "Análisis de roles faltantes en el equipo de planificación estratégica",
        "Workshop: 'Arquitectura de equipo para la ejecución estratégica'",
      ] : isVulnerable ? [
        "Identificar perfiles Coordinador e Investigador de Recursos para liderar comunicación estratégica",
        "Sesión de feedback Belbin con el equipo de dirección",
      ] : [
        "Aprovechar perfiles Especialista para profundizar en análisis estratégico",
        "Reforzar el rol de Monitor Evaluador en revisiones de estrategia",
      ],
      leadership: isCritical ? [
        "Programa de alineación de liderazgo: 'Leading with Strategy'",
        "Coaching ejecutivo para Comité Directivo en comunicación de visión",
        "Taller: 'Del propósito a la acción: cómo los líderes crean alineación'",
      ] : isVulnerable ? [
        "Sesiones de calibración de mensajes entre niveles de liderazgo",
        "Programa de storytelling estratégico para líderes de área",
      ] : [
        "Desarrollo de líderes como embajadores de la estrategia",
        "Programa de mentoring cruzado entre áreas para reforzar alineación",
      ],
    },
    execution: {
      lss: isCritical ? [
        "Implementación de Lean Daily Management (LDM) con tableros visuales por área",
        "Programa Green Belt en áreas críticas de ejecución",
        "Mapa de flujo de valor (VSM) de los 3 procesos más críticos",
        "Sistema de gestión de problemas: Daily Standup + Escalamiento estructurado",
        "I2E™ Fase EXPERIMENT: pilotos de mejora rápida en procesos de mayor impacto",
        "I2E™ Fase EXECUTE: convertir mejoras en procesos, roles, KPIs y rutinas de accountability",
      ] : isVulnerable ? [
        "Implementar PDCA como ciclo estándar de mejora en cada área",
        "Definir estándares de proceso para las 5 rutinas operativas clave",
        "Dashboard operativo con semáforos de desempeño por área",
        "I2E™ Fase ADAPT: traducir mejores prácticas al contexto cultural y tecnológico de la empresa",
        "I2E™ Fase SUSTAIN: asegurar ownership y governance de mejoras implementadas",
      ] : [
        "Evolucionar de Lean hacia Six Sigma: reducción de variabilidad en procesos clave",
        "I2E™ Fase SCALE: estandarizar, desplegar y replicar modelo operativo sin perder agilidad",
        "Sistema de sugerencias Kaizen + I2E™ para innovación incremental desde la base",
      ],
      belbin: isCritical ? [
        "Identificar perfiles Implementador y Finalizador — roles críticos en ejecución",
        "Rediseñar equipos de proyecto asignando responsabilidades según roles Belbin",
        "Taller: 'De la intención a la acción: cómo los equipos ejecutan'",
      ] : isVulnerable ? [
        "Fortalecer perfiles Cohesionador para mejorar seguimiento y disciplina operativa",
        "Análisis de brechas de roles en los equipos de mayor responsabilidad",
      ] : [
        "Optimizar la composición de equipos de mejora continua",
        "Programa de desarrollo de Finalizadores internos",
      ],
      leadership: isCritical ? [
        "Programa 'Accountability Leadership': cultura de responsabilidad y seguimiento",
        "Implementar reuniones de gestión de desempeño estructuradas (L10 o equivalente)",
        "Coaching en disciplina operativa para gerentes de primera línea",
      ] : isVulnerable ? [
        "Taller de liderazgo situacional aplicado a equipos de ejecución",
        "Desarrollo de rituales de seguimiento en cada nivel jerárquico",
      ] : [
        "Evolucionar hacia liderazgo de alto rendimiento: delegación y autonomía",
        "Programa de desarrollo de líderes de mejora continua",
      ],
    },
    leadership: {
      lss: isCritical ? [
        "Diagnóstico de capacidad de gestión: análisis de rutinas directivas",
        "Implementar War Room / Sala de Situación para visibilidad de resultados",
        "Definir estándares de reuniones de liderazgo (agenda, frecuencia, outputs)",
        "I2E™ Fase OBSERVE: mapear las fricciones en la dinámica del equipo directivo",
        "I2E™ Fase DECODE: identificar el principio subyacente que bloquea la efectividad colectiva",
      ] : isVulnerable ? [
        "Estandarizar el proceso de toma de decisiones con datos (A3 Thinking)",
        "Implementar revisiones de desempeño estructuradas mensuales",
        "I2E™ Fase ADAPT: adecuar modelo de liderazgo colectivo a cultura y capacidades actuales",
      ] : [
        "Evolucionar hacia gestión predictiva: de KPIs reactivos a leading indicators",
        "I2E™ Fase SCALE: institucionalizar el modelo de liderazgo de alto rendimiento",
        "Sistema de gestión visual integrado entre niveles directivos",
      ],
      belbin: isCritical ? [
        "Diagnóstico Belbin completo del Comité Directivo",
        "Taller intensivo: 'Construcción de equipos directivos de alto rendimiento'",
        "Identificación de roles ausentes: Coordinador, Cohesionador y Finalizador",
        "Plan de intervención por perfil: fortalezas y zonas de desarrollo",
      ] : isVulnerable ? [
        "Sesión de retroalimentación Belbin entre pares directivos",
        "Taller: 'Cómo los roles de equipo impactan la efectividad del liderazgo colectivo'",
        "Coaching individual basado en perfil Belbin para C-Suite",
      ] : [
        "Programa avanzado de liderazgo colectivo basado en complementariedad de roles",
        "Facilitar conversaciones de confianza usando perfiles Belbin como lenguaje común",
      ],
      leadership: isCritical ? [
        "Programa de desarrollo de confianza directiva: 'Building Trust at the Top'",
        "Intervención en dinámicas de equipo: facilitación de conversaciones difíciles",
        "Coaching sistémico para el equipo directivo completo",
        "Taller: 'Liderazgo vulnerable: el poder de la apertura en el C-Suite'",
      ] : isVulnerable ? [
        "Programa de comunicación no violenta para líderes",
        "Sesiones de co-creación de acuerdos de trabajo en el equipo directivo",
        "Taller de inteligencia emocional aplicada al liderazgo colectivo",
      ] : [
        "Evolucionar hacia liderazgo distribuido y co-liderazgo",
        "Programa de desarrollo de líderes de líderes",
      ],
    },
    resilience: {
      lss: isCritical ? [
        "Implementar FMEA (Análisis de Modo y Efecto de Fallo) en procesos críticos",
        "Plan de continuidad operativa basado en análisis de riesgos",
        "I2E™ Fase OBSERVE: escanear el entorno — clientes, fricciones, benchmarks y señales de cambio",
        "I2E™ Fase EXPERIMENT: probar rápido con prototipos antes de comprometer recursos",
        "I2E™ Fase SUSTAIN: asegurar mejora continua y evolución permanente ante el cambio",
      ] : isVulnerable ? [
        "Implementar ciclos de retrospectiva mensual (Lessons Learned estructurado)",
        "I2E™ Fase ADAPT: traducir aprendizajes al contexto real de cultura, procesos y tecnología",
        "I2E™ Fase DECODE: identificar qué principios subyacentes bloquean la adaptación",
      ] : [
        "I2E™ Fase SCALE: estandarizar y replicar la capacidad de innovación sin perder agilidad",
        "I2E™ Fase EXECUTE: convertir la innovación en procesos, KPIs y rutinas de gestión",
        "Sistema de gestión de ideas e innovación incremental institucionalizado",
      ],
      belbin: isCritical ? [
        "Identificar perfiles Cerebro e Investigador de Recursos — clave para adaptabilidad",
        "Taller: 'Equipos resilientes: diversidad de roles ante la incertidumbre'",
      ] : isVulnerable ? [
        "Potenciar el perfil Investigador de Recursos para detectar tendencias",
        "Desarrollar la capacidad de Monitor Evaluador para analizar opciones ante el cambio",
      ] : [
        "Aprovechar perfiles Cerebro para impulsar innovación organizacional",
        "Crear equipos de innovación con diversidad de roles Belbin",
      ],
      leadership: isCritical ? [
        "Programa de liderazgo en tiempos de cambio: 'Leading Through Uncertainty'",
        "Taller de gestión del cambio para líderes: modelos Kotter y Prosci",
        "Desarrollo de comunicación de cambio: cómo los líderes reducen la resistencia",
      ] : isVulnerable ? [
        "Taller de liderazgo adaptativo: distinguir trabajo técnico de trabajo adaptativo",
        "Desarrollar la capacidad de aprendizaje organizacional desde el liderazgo",
      ] : [
        "Evolucionar hacia liderazgo de innovación: crear condiciones para experimentar",
        "Programa de desarrollo de cultura de aprendizaje continuo",
      ],
    },
    culture: {
      lss: isCritical ? [
        "Diagnóstico de clima organizacional + plan de acción estructurado",
        "Implementar programa de reconocimiento ligado a comportamientos clave",
        "I2E™ Fase OBSERVE: entender las fricciones culturales desde la perspectiva de las personas",
        "I2E™ Fase DECODE: identificar el principio que hace que la cultura actual persista",
        "I2E™ Fase EXECUTE: convertir intervenciones culturales en rutinas, roles y KPIs visibles",
      ] : isVulnerable ? [
        "Diseñar sistema de reconocimiento peer-to-peer",
        "Implementar canales formales de comunicación interna bidireccional",
        "I2E™ Fase ADAPT: adecuar iniciativas culturales al contexto real de cada área",
        "I2E™ Fase SUSTAIN: asegurar ownership cultural con governance y evolución permanente",
      ] : [
        "I2E™ Fase SCALE: replicar la cultura de alto rendimiento en toda la organización",
        "Programa de embajadores culturales en cada área",
        "Medición periódica de cultura con pulso trimestral",
      ],
      belbin: isCritical ? [
        "Taller Belbin para toda la organización: crear lenguaje común de roles y contribuciones",
        "Usar Belbin como herramienta de reconocimiento: visibilizar fortalezas de cada persona",
        "Programa de integración de equipos basado en complementariedad de roles",
      ] : isVulnerable ? [
        "Sesiones de team building basadas en perfiles Belbin",
        "Comunicar el valor de cada rol para reforzar la cultura de contribución",
      ] : [
        "Usar Belbin para optimizar la colaboración entre áreas",
        "Desarrollar una cultura de roles complementarios como ventaja competitiva",
      ],
      leadership: isCritical ? [
        "Programa de liderazgo cultural: 'Culture Starts at the Top'",
        "Taller de seguridad psicológica para líderes (Amy Edmondson)",
        "Intervención en dinámicas tóxicas: facilitación externa de conversaciones difíciles",
      ] : isVulnerable ? [
        "Programa de liderazgo empático y presencia ejecutiva",
        "Taller: 'Cómo los líderes construyen culturas de alto desempeño'",
      ] : [
        "Evolucionar hacia cultura de alto rendimiento y bienestar",
        "Programa de desarrollo de líderes como arquitectos culturales",
      ],
    },
  };
  return recs[dimId] || { lss: [], belbin: [], leadership: [] };
}

// ── Deep Dive recommendation logic ────────────────────────────────────────────
function getDeepRecs(modId, groupLabel, score) {
  var isCritical = score < 2.5;
  var isVulnerable = score >= 2.5 && score < 3.2;

  var db = {
    lei: {
      "Vulnerabilidad & Confianza": {
        lss: isCritical ? ["Sesiones estructuradas de After Action Review (AAR) para normalizar el error como aprendizaje","I2E™ OBSERVE: mapear fricciones de confianza en el equipo directivo"] : ["I2E™ DECODE: identificar el principio que bloquea la apertura entre líderes","Implementar check-ins de equipo con formato estructurado"],
        belbin: isCritical ? ["Taller Belbin: identificar roles que inhiben la vulnerabilidad (Monitor Evaluador excesivo)","Coaching individual para líderes con perfil Especialista o Implementador muy cerrado"] : ["Sesión de retroalimentación cruzada basada en perfiles Belbin"],
        leadership: isCritical ? ["Programa 'Psychological Safety' basado en trabajo de Amy Edmondson","Taller: 'El líder vulnerable: fortaleza a través de la apertura'","Coaching sistémico enfocado en confianza entre pares directivos"] : ["Taller de comunicación no violenta para el equipo directivo","Acuerdos de trabajo explícitos sobre cómo manejar desacuerdos"],
      },
      "Responsabilidad & Compromisos": {
        lss: isCritical ? ["Implementar sistema de compromisos visibles (tablero de accountability directivo)","I2E™ EXECUTE: convertir compromisos en KPIs con ownership explícito"] : ["Rutinas de seguimiento peer-to-peer entre líderes","I2E™ SUSTAIN: governance de compromisos con revisión mensual"],
        belbin: isCritical ? ["Identificar si hay déficit de perfil Finalizador en el equipo directivo","Taller: 'Accountability colectiva: cómo los roles Belbin impactan el cumplimiento'"] : ["Reforzar el rol de Implementador para traducir compromisos en acciones concretas"],
        leadership: isCritical ? ["Programa de accountability ejecutiva: 'Leaders who deliver'","Intervención en cultura de impunidad directiva: conversaciones directas"] : ["Taller de feedback ejecutivo: cómo dar y recibir retroalimentación difícil"],
      },
      "Calidad de Decisiones": {
        lss: isCritical ? ["Implementar A3 Thinking para decisiones estratégicas importantes","QFD aplicado a decisiones: traducir impacto en criterios ponderados","I2E™ DECODE: identificar qué sesgos sistemáticos afectan la calidad decisional"] : ["Estandarizar el proceso de toma de decisiones con datos y análisis estructurado"],
        belbin: isCritical ? ["Asegurar presencia de Monitor Evaluador y Cerebro en decisiones críticas","Taller: 'Decisiones de calidad: cómo la diversidad de roles reduce el sesgo'"] : ["Aprovechar perfil Especialista para profundizar el análisis antes de decidir"],
        leadership: isCritical ? ["Programa de pensamiento crítico y decisiones bajo incertidumbre","Taller: 'De la opinión a la evidencia: liderazgo basado en datos'"] : ["Implementar devil's advocate estructurado en reuniones de decisión"],
      },
      "Gestión de Conflictos": {
        lss: isCritical ? ["I2E™ OBSERVE: mapear los patrones de conflicto recurrentes en el equipo","Definir protocolo estructurado de resolución de conflictos directivos"] : ["I2E™ ADAPT: adecuar el modelo de gestión de conflictos a la cultura actual"],
        belbin: isCritical ? ["Taller Belbin: entender cómo los roles generan tensiones naturales y productivas","Identificar si Cohesionador está ausente — rol clave para gestión de conflictos"] : ["Usar perfiles Belbin como lenguaje neutral para abordar diferencias"],
        leadership: isCritical ? ["Facilitación externa de conversaciones difíciles pendientes","Programa de negociación y gestión de conflictos para C-Suite","Taller: 'Conflicto productivo: de la evasión al debate sano'"] : ["Taller de mediación interna para líderes de área"],
      },
      "Desarrollo de Personas": {
        lss: isCritical ? ["I2E™ EXECUTE: convertir el desarrollo de personas en procesos, rutinas y KPIs medibles","Implementar sistema de feedback 360° estructurado para todos los líderes"] : ["I2E™ SCALE: replicar el modelo de desarrollo de personas en toda la organización"],
        belbin: isCritical ? ["Usar Belbin como base del plan de desarrollo individual de cada líder","Taller: 'Líderes que desarrollan líderes: el rol del Cohesionador y el Coordinador'"] : ["Programa de mentoring cruzado basado en complementariedad de roles Belbin"],
        leadership: isCritical ? ["Programa de liderazgo de desarrollo: 'Growing Others'","Implementar conversaciones de carrera estructuradas trimestrales","Taller: 'El líder coach: de dar respuestas a hacer preguntas'"] : ["Desarrollar capacidad de feedback de alto impacto en líderes de primera línea"],
      },
      "Comunicación & Coherencia": {
        lss: isCritical ? ["Estandarizar los mensajes clave del equipo directivo con frecuencia y formato definidos","I2E™ DECODE: identificar por qué los mensajes se distorsionan al bajar en la organización"] : ["Dashboard de comunicación interna con indicadores de penetración del mensaje"],
        belbin: isCritical ? ["Identificar Investigador de Recursos y Cohesionador como facilitadores de la comunicación","Taller: 'Comunicación efectiva desde los roles: quién informa, quién conecta, quién cierra'"] : ["Programa de comunicación interna liderado por embajadores culturales"],
        leadership: isCritical ? ["Programa de transparencia ejecutiva: 'Open book management'","Taller: 'Cómo los líderes construyen culturas de comunicación abierta'"] : ["Town halls regulares con espacio para preguntas difíciles"],
      },
      "Ejemplo & Valores": {
        lss: isCritical ? ["I2E™ OBSERVE: identificar brechas entre valores declarados y comportamientos observables","Auditoría de comportamientos directivos vs. valores organizacionales"] : ["I2E™ SUSTAIN: asegurar ownership de los valores con mecanismos de gobernanza visibles"],
        belbin: isCritical ? ["Taller: 'Liderazgo con ejemplo: cómo cada rol Belbin modela los valores'","Coaching individual enfocado en coherencia entre perfil y comportamiento"] : ["Sesión de reflexión grupal: cómo nuestros roles naturales expresan (o contradicen) los valores"],
        leadership: isCritical ? ["Programa de integridad y liderazgo ético","Intervención en incoherencias visibles: facilitación de conversaciones directas","Taller: 'Walk the talk: del discurso a la acción'"] : ["Programa de líderes como embajadores culturales"],
      },
      "Liderazgo Colectivo": {
        lss: isCritical ? ["I2E™ EXPERIMENT: pilotos de co-liderazgo en iniciativas transversales","Definir modelo operativo del equipo directivo: roles, decisiones, rutinas y métricas"] : ["I2E™ SCALE: institucionalizar el modelo de liderazgo colectivo en toda la organización"],
        belbin: isCritical ? ["Diagnóstico Belbin completo del Comité Directivo con taller de integración","Rediseñar la composición del equipo directivo basado en complementariedad de roles","Taller intensivo: 'Del grupo de líderes al equipo directivo de alto rendimiento'"] : ["Sesión anual de revisión de dinámica de equipo con perfiles Belbin actualizados"],
        leadership: isCritical ? ["Programa de team coaching para el Comité Directivo","Retiro estratégico de liderazgo colectivo con facilitación externa","Taller: 'Uno más uno es más que dos: el poder del liderazgo colectivo'"] : ["Programa de co-liderazgo en proyectos estratégicos transversales"],
      },
    },
    tcs: {
      "Alineación Estratégica": {
        lss: isCritical ? ["QFD aplicado al equipo: traducir la visión en acuerdos operativos medibles","I2E™ DECODE: identificar qué impide que el equipo directivo comparta prioridades"] : ["Sesiones de calibración estratégica trimestral con el modelo QFD"],
        belbin: isCritical ? ["Identificar si hay suficiente Coordinador para alinear visiones divergentes","Taller: 'Alineación estratégica desde los roles: quién une y quién diverge'"] : ["Aprovechar perfiles Cerebro para enriquecer la visión compartida"],
        leadership: isCritical ? ["Retiro estratégico de alineación de visión y prioridades del equipo directivo","Taller: 'Una sola voz: cómo los equipos directivos alinean su estrategia'"] : ["Revisión anual de visión compartida con dinámica estructurada"],
      },
      "Confianza & Seguridad": {
        lss: isCritical ? ["I2E™ OBSERVE: mapear los momentos donde la confianza se rompe en el equipo","Protocolo estructurado de recuperación de confianza tras incumplimientos"] : ["I2E™ ADAPT: adecuar el modelo de confianza a la cultura y historia del equipo"],
        belbin: isCritical ? ["Taller Belbin de team building con foco en confianza interpersonal","Sesiones de retroalimentación cruzada entre roles complementarios"] : ["Usar Belbin para normalizar las diferencias y construir respeto mutuo"],
        leadership: isCritical ? ["Programa de seguridad psicológica para el equipo directivo","Facilitación externa de conversaciones de confianza pendientes","Taller: 'Confianza como ventaja competitiva'"] : ["Check-ins de equipo mensuales con formato estructurado de apertura"],
      },
      "Responsabilidad Mutua": {
        lss: isCritical ? ["Tablero de compromisos del equipo directivo con revisión semanal","I2E™ EXECUTE: formalizar la accountability mutua en rutinas y KPIs del equipo"] : ["Sistema de seguimiento peer-to-peer de compromisos directivos"],
        belbin: isCritical ? ["Identificar déficit de Finalizador e Implementador en el equipo","Taller: 'Accountability de equipo: cómo los roles Belbin impactan el cumplimiento colectivo'"] : ["Reforzar comportamientos de Implementador para cerrar brechas de ejecución"],
        leadership: isCritical ? ["Programa de accountability colectiva: 'We own it together'","Intervención en dinámicas de evasión de responsabilidad"] : ["Taller de feedback horizontal: cómo los pares se responsabilizan mutuamente"],
      },
      "Calidad de Decisiones": {
        lss: isCritical ? ["Implementar metodología RAPID para clarificar roles en decisiones del equipo","QFD de decisiones: criterios ponderados para decisiones estratégicas del equipo","I2E™ EXPERIMENT: pilotos de nuevos modelos de toma de decisiones"] : ["Estandarizar el proceso decisional del equipo con datos y criterios explícitos"],
        belbin: isCritical ? ["Asegurar Monitor Evaluador activo en decisiones críticas del equipo","Taller: 'Decisiones de equipo: cómo la diversidad de roles mejora la calidad'"] : ["Rotar el rol de devil's advocate entre miembros del equipo según perfil"],
        leadership: isCritical ? ["Programa de pensamiento sistémico para el equipo directivo","Taller: 'Decisiones en equipo: velocidad vs. calidad'"] : ["Implementar post-mortem estructurado de decisiones importantes"],
      },
      "Debate & Conflicto Productivo": {
        lss: isCritical ? ["I2E™ OBSERVE: identificar si el conflicto es evitado o mal gestionado","Definir reglas de debate productivo para reuniones del equipo directivo"] : ["Implementar dinámica de 'six thinking hats' en reuniones estratégicas"],
        belbin: isCritical ? ["Taller: 'Tensiones productivas: cómo los roles Belbin generan el debate correcto'","Identificar si Cerebro e Investigador de Recursos tienen espacio para disentir"] : ["Crear espacio explícito para que perfiles Cerebro y Monitor Evaluador aporten perspectivas críticas"],
        leadership: isCritical ? ["Facilitación externa de debates estratégicos pendientes","Taller: 'Del consenso falso al disenso productivo'"] : ["Programa de facilitación interna de debates estratégicos"],
      },
      "Complementariedad": {
        lss: isCritical ? ["I2E™ DECODE: identificar qué impide que el equipo aproveche sus diferencias","Diagnóstico de capacidades del equipo vs. desafíos estratégicos actuales"] : ["I2E™ SCALE: replicar el modelo de aprovechamiento de complementariedad en equipos de proyecto"],
        belbin: isCritical ? ["Diagnóstico Belbin completo + taller de complementariedad","Mapeo de fortalezas del equipo vs. brechas de roles críticos","Programa de desarrollo basado en roles ausentes o infrarrepresentados"] : ["Sesión anual de actualización de perfiles y revisión de dinámica de complementariedad"],
        leadership: isCritical ? ["Taller: 'El todo es más que la suma: liderazgo desde la complementariedad'","Rediseño de responsabilidades basado en fortalezas individuales"] : ["Programa de apreciación de diversidad de estilos de liderazgo"],
      },
      "Orientación Colectiva": {
        lss: isCritical ? ["I2E™ OBSERVE: mapear comportamientos de silo vs. comportamientos colectivos","Definir métricas de desempeño colectivo del equipo directivo"] : ["Implementar OKRs compartidos entre áreas para forzar orientación colectiva"],
        belbin: isCritical ? ["Identificar perfiles con tendencia a optimizar solo su área (Especialista, Implementador)","Taller: 'Del yo al nosotros: cómo los roles Belbin pueden trabajar para el conjunto'"] : ["Programa de proyectos transversales que obligan a la colaboración inter-rol"],
        leadership: isCritical ? ["Programa de liderazgo sistémico: ver la organización como un todo","Taller: 'Líderes que piensan en el sistema, no solo en su área'"] : ["Incluir métricas de colaboración transversal en la evaluación de desempeño directivo"],
      },
      "Efectividad del Equipo": {
        lss: isCritical ? ["Diagnóstico completo de efectividad del equipo directivo con benchmarks externos","I2E™ EXPERIMENT + EXECUTE: pilotos de nuevas formas de trabajar como equipo"] : ["I2E™ SUSTAIN: asegurar evolución permanente del modelo de efectividad del equipo"],
        belbin: isCritical ? ["Intervención integral Belbin: diagnóstico, taller, coaching individual y colectivo","Rediseño del equipo directivo basado en análisis de roles y resultados"] : ["Revisión anual de efectividad del equipo con actualización de perfiles Belbin"],
        leadership: isCritical ? ["Programa de team coaching intensivo para el Comité Directivo","Retiro de efectividad de equipo con facilitación externa especializada"] : ["Programa de mejora continua de la efectividad del equipo directivo"],
      },
    },
    eci: {
      "Claridad de Roles": {
        lss: isCritical ? ["RACI completo de los 10 procesos más críticos de la organización","I2E™ DECODE: identificar por qué los roles y responsabilidades son ambiguos"] : ["Actualizar y comunicar RACI con revisión trimestral"],
        belbin: isCritical ? ["Taller Belbin: alinear roles formales con roles naturales de equipo","Identificar conflictos de rol entre perfiles Coordinador e Implementador"] : ["Usar Belbin para clarificar expectativas de contribución de cada persona"],
        leadership: isCritical ? ["Programa de claridad organizacional: 'Who owns what'","Taller para líderes: cómo definir y comunicar responsabilidades con precisión"] : ["Implementar conversaciones de claridad de rol en cada equipo"],
      },
      "Gestión de Indicadores": {
        lss: isCritical ? ["QFD para diseñar el cuadro de mando operativo: de objetivos a indicadores accionables","Implementar tableros visuales por área con semáforos de desempeño","I2E™ EXECUTE: convertir los indicadores en rutinas de gestión diaria"] : ["Evolucionar de KPIs reactivos a leading indicators por proceso"],
        belbin: isCritical ? ["Identificar quién es responsable de los indicadores — Implementador o Finalizador ideales","Taller: 'Métricas que importan: cómo cada rol Belbin usa los datos de forma diferente'"] : ["Programa de alfabetización de datos para todos los roles del equipo"],
        leadership: isCritical ? ["Programa de liderazgo basado en datos: 'Managing by metrics'","Taller: 'Del reporte al resultado: cómo los líderes usan los indicadores para decidir'"] : ["Implementar cultura de datos en cada área con líderes como modelos"],
      },
      "Rutinas de Seguimiento": {
        lss: isCritical ? ["Implementar Lean Daily Management completo: reuniones diarias + tableros + escalamiento","I2E™ EXPERIMENT: piloto de nuevas rutinas de seguimiento en el área más crítica"] : ["Optimizar la cadencia y formato de las reuniones de seguimiento existentes"],
        belbin: isCritical ? ["Asignar responsabilidad de facilitación de rutinas según perfil Cohesionador o Coordinador","Taller: 'Rituales de equipo: cómo los roles Belbin hacen que el seguimiento funcione'"] : ["Rotar la facilitación de rutinas para desarrollar capacidad en diferentes perfiles"],
        leadership: isCritical ? ["Programa de disciplina operativa para líderes de primera línea","Taller: 'El poder de las rutinas: cómo los líderes crean hábitos organizacionales'"] : ["Coaching de líderes en facilitación de reuniones de alta efectividad"],
      },
      "Decisiones con Datos": {
        lss: isCritical ? ["Programa de data literacy para equipos operativos y de gestión","QFD inverso: de indicadores a decisiones operativas clave","I2E™ DECODE: identificar por qué los datos no se usan para decidir"] : ["Implementar análisis de varianza mensual con acciones correctivas estructuradas"],
        belbin: isCritical ? ["Identificar déficit de Monitor Evaluador en equipos de gestión","Taller: 'Datos y roles: cómo cada perfil Belbin se relaciona con la evidencia'"] : ["Programa de desarrollo de Monitor Evaluador interno en cada área"],
        leadership: isCritical ? ["Programa: 'Evidence-based leadership' para el equipo directivo","Taller: 'De la intuición a la evidencia: decisiones que sostienen resultados'"] : ["Implementar revisiones de decisiones pasadas con datos para aprender"],
      },
      "Resolución de Problemas": {
        lss: isCritical ? ["Programa Yellow Belt / Green Belt en resolución estructurada de problemas","Implementar A3 Thinking como metodología estándar","I2E™ EXPERIMENT: aplicar PDCA acelerado en los 3 problemas más recurrentes"] : ["Implementar sistema de lecciones aprendidas con difusión estructurada"],
        belbin: isCritical ? ["Identificar quién lidera la resolución de problemas — Cerebro + Implementador ideales","Taller: 'Problem-solving en equipo: cómo los roles Belbin aportan perspectivas distintas'"] : ["Crear equipos multidisciplinarios de resolución de problemas con diversidad de roles"],
        leadership: isCritical ? ["Programa de liderazgo resolutivo: 'Leaders who solve'","Taller: 'Cómo los líderes crean culturas de resolución de problemas'"] : ["Coaching de líderes en facilitación de sesiones de resolución de problemas"],
      },
      "Escalamiento": {
        lss: isCritical ? ["Definir protocolo de escalamiento con tiempos, triggers y responsables","I2E™ EXECUTE: formalizar el proceso de escalamiento en rutinas y KPIs"] : ["Optimizar los criterios de escalamiento para reducir tiempos de respuesta"],
        belbin: isCritical ? ["Identificar quién debe escalar — Cohesionador e Implementador clave","Taller: 'Cuándo escalar: el rol de cada perfil en la gestión de problemas críticos'"] : ["Desarrollar la capacidad de juicio de cuándo escalar en perfiles Especialista"],
        leadership: isCritical ? ["Programa de gestión de escalamientos para líderes","Taller: 'Empoderar sin abandonar: cómo los líderes gestionan el escalamiento'"] : ["Implementar cultura de escalamiento temprano como práctica de alto rendimiento"],
      },
      "Ejecución de Proyectos": {
        lss: isCritical ? ["Implementar PMO ligera con metodología Lean de gestión de proyectos","I2E™ EXECUTE: estándares de proyecto con roles, KPIs y rutinas de seguimiento","Programa de gestión de riesgos con FMEA para proyectos críticos"] : ["Estandarizar el proceso de revisión de avance de proyectos estratégicos"],
        belbin: isCritical ? ["Asignar roles Belbin en cada proyecto: Coordinador, Implementador, Finalizador, Monitor Evaluador","Taller: 'Equipos de proyecto de alto rendimiento: la fórmula Belbin'"] : ["Revisión de composición de equipos de proyecto con análisis de roles"],
        leadership: isCritical ? ["Programa de liderazgo de proyectos: 'Delivering on time, on budget, on scope'","Taller: 'El patrocinador ejecutivo: cómo los líderes garantizan el éxito de los proyectos'"] : ["Coaching de project managers en liderazgo sin autoridad formal"],
      },
      "Disciplina Operativa": {
        lss: isCritical ? ["Implementación completa de 5S + estandarización de procesos críticos","I2E™ SUSTAIN: governance de la disciplina operativa con ownership y revisión permanente","Programa de auditorías de proceso con ciclo PDCA de mejora"] : ["I2E™ SCALE: replicar el modelo de disciplina operativa en todas las áreas"],
        belbin: isCritical ? ["Identificar déficit de Finalizador e Implementador — roles críticos para la disciplina","Taller: 'La disciplina como cultura: cómo los roles Belbin sostienen los estándares'"] : ["Programa de desarrollo de Finalizador interno en áreas críticas"],
        leadership: isCritical ? ["Programa de liderazgo operativo: 'Discipline is freedom'","Taller: 'Cómo los líderes crean y sostienen culturas de disciplina operativa'"] : ["Coaching de líderes en gestión del desempeño y estándares operativos"],
      },
    },
    aci: {
      "Aprendizaje Organizacional": {
        lss: isCritical ? ["I2E™ OBSERVE + DECODE: mapear cómo aprende (o no aprende) la organización","Implementar sistema de lecciones aprendidas con difusión estructurada","Ciclos de retrospectiva mensual por área con formato AAR"] : ["I2E™ SCALE: institucionalizar el aprendizaje como proceso organizacional"],
        belbin: isCritical ? ["Identificar Cerebro e Investigador de Recursos como motores del aprendizaje","Taller: 'Organizaciones que aprenden: el rol de cada perfil Belbin'"] : ["Programa de aprendizaje entre pares basado en complementariedad de roles"],
        leadership: isCritical ? ["Programa de liderazgo de aprendizaje: 'Learning organizations start with leaders'","Taller: 'Cómo los líderes crean culturas de aprendizaje continuo'"] : ["Desarrollar rituales de aprendizaje liderados por el equipo directivo"],
      },
      "Cuestionamiento de Supuestos": {
        lss: isCritical ? ["I2E™ DECODE: metodología para identificar y cuestionar supuestos organizacionales","Taller de pensamiento crítico aplicado a procesos y modelos de negocio"] : ["Implementar sesiones de 'Kill the company' para identificar vulnerabilidades"],
        belbin: isCritical ? ["Crear espacio explícito para que Monitor Evaluador y Cerebro cuestionen el status quo","Taller: 'El rol del disruptor: cómo los perfiles Belbin cuestionan los supuestos'"] : ["Rotar el rol de 'abogado del diablo' en revisiones estratégicas"],
        leadership: isCritical ? ["Programa de liderazgo adaptativo: distinguir trabajo técnico de trabajo adaptativo","Taller: 'Preguntas que cambian organizaciones: el arte del cuestionamiento ejecutivo'"] : ["Desarrollar la capacidad de cuestionamiento constructivo en líderes de primera línea"],
      },
      "Experimentación": {
        lss: isCritical ? ["I2E™ EXPERIMENT: metodología de pilotos rápidos con criterios claros de éxito/fracaso","Implementar Design Sprints para iniciativas de innovación","Programa de MVPs internos: cómo probar antes de invertir"] : ["I2E™ SCALE: estandarizar el proceso de experimentación en toda la organización"],
        belbin: isCritical ? ["Crear equipos de experimentación con Cerebro, Investigador de Recursos e Implementador","Taller: 'Equipos de innovación: la combinación de roles que hace que los experimentos funcionen'"] : ["Programa de emprendimiento interno basado en perfiles Belbin complementarios"],
        leadership: isCritical ? ["Programa de liderazgo de innovación: 'Leaders who experiment'","Taller: 'Cómo los líderes crean las condiciones para que la experimentación florezca'"] : ["Desarrollar tolerancia al fracaso como competencia de liderazgo"],
      },
      "Innovación": {
        lss: isCritical ? ["I2E™ completo: Observe → Decode → Adapt → Experiment → Execute → Scale → Sustain","Implementar sistema de gestión de ideas con pipeline de innovación","QFD de innovación: de necesidades del cliente a iniciativas de valor"] : ["I2E™ SUSTAIN: asegurar que la innovación sea un proceso permanente, no un evento"],
        belbin: isCritical ? ["Diagnóstico Belbin del equipo de innovación con análisis de complementariedad","Taller: 'Del brainstorming al breakthrough: cómo los roles Belbin innovan juntos'","Identificar déficit de Cerebro e Investigador de Recursos en equipos de innovación"] : ["Programa de innovación abierta con equipos multidisciplinarios Belbin"],
        leadership: isCritical ? ["Programa de liderazgo innovador: 'Ambidextrous leadership'","Taller: 'Cómo los líderes equilibran la explotación y la exploración'"] : ["Desarrollar líderes como patrocinadores activos de la innovación"],
      },
      "Liderazgo del Cambio": {
        lss: isCritical ? ["Programa de gestión del cambio con metodología ADKAR o Prosci","I2E™ ADAPT: traducir la iniciativa de cambio al contexto real de cultura y capacidades","Mapeo de stakeholders y plan de gestión de resistencia"] : ["I2E™ EXECUTE: convertir la gestión del cambio en procesos y KPIs medibles"],
        belbin: isCritical ? ["Identificar quién puede ser embajador del cambio según perfil Belbin","Taller: 'Liderazgo del cambio desde los roles: quién facilita y quién resiste'"] : ["Usar Belbin para diseñar equipos de cambio con la complementariedad correcta"],
        leadership: isCritical ? ["Programa de liderazgo transformacional: 'Leading change from the front'","Taller: 'Cómo los líderes crean urgencia, visión y coalición para el cambio'","Coaching ejecutivo en comunicación de cambio"] : ["Desarrollar la capacidad de liderazgo del cambio en gerentes de primera línea"],
      },
      "Resiliencia Organizacional": {
        lss: isCritical ? ["Plan de continuidad del negocio con análisis de riesgos y FMEA","I2E™ OBSERVE: escanear el entorno para anticipar disrupciones","I2E™ EXPERIMENT: simular escenarios de crisis y probar respuestas"] : ["I2E™ SUSTAIN: asegurar que la capacidad de resiliencia evolucione permanentemente"],
        belbin: isCritical ? ["Crear equipos de respuesta a crisis con diversidad de roles Belbin","Taller: 'Equipos resilientes: la combinación de roles que sostiene la presión'"] : ["Programa de simulacros de crisis con equipos multidisciplinarios"],
        leadership: isCritical ? ["Programa de liderazgo en crisis: 'Steady hand in the storm'","Taller: 'Cómo los líderes mantienen la calma y el foco en la incertidumbre'"] : ["Desarrollar la capacidad de liderazgo adaptativo en todos los niveles"],
      },
    },
    cei: {
      "Colaboración & Conocimiento": {
        lss: isCritical ? ["I2E™ OBSERVE: mapear silos de conocimiento y barreras de colaboración","Implementar comunidades de práctica por área de conocimiento clave"] : ["I2E™ SCALE: replicar el modelo de colaboración en toda la organización"],
        belbin: isCritical ? ["Taller Belbin cross-funcional: equipos de diferentes áreas trabajando juntos","Identificar quién puede ser conector de conocimiento — Investigador de Recursos e Cohesionador"] : ["Programa de rotación de roles para transferencia de conocimiento"],
        leadership: isCritical ? ["Programa de liderazgo colaborativo: 'Breaking silos'","Taller: 'Cómo los líderes crean puentes entre áreas'"] : ["Incluir métricas de colaboración en la evaluación de desempeño de líderes"],
      },
      "Comunicación & Transparencia": {
        lss: isCritical ? ["I2E™ DECODE: identificar por qué la información no fluye libremente","Diseñar arquitectura de comunicación interna: canales, frecuencias y responsables"] : ["Dashboard de comunicación interna con indicadores de efectividad"],
        belbin: isCritical ? ["Identificar Investigador de Recursos y Cohesionador como facilitadores de la comunicación","Taller: 'Comunicación efectiva desde los roles: quién informa, quién conecta, quién cierra'"] : ["Programa de comunicación interna liderado por embajadores culturales"],
        leadership: isCritical ? ["Programa de transparencia ejecutiva: 'Open book management'","Taller: 'Cómo los líderes construyen culturas de comunicación abierta'"] : ["Town halls regulares con espacio para preguntas difíciles"],
      },
      "Empoderamiento": {
        lss: isCritical ? ["I2E™ ADAPT: adecuar el nivel de empoderamiento a la madurez real de cada equipo","Definir matriz de delegación con niveles de autoridad claros por rol"] : ["I2E™ EXECUTE: convertir el empoderamiento en procesos, KPIs y rituales de gestión"],
        belbin: isCritical ? ["Identificar si el liderazgo tiene perfil Implementador muy controlador que bloquea la autonomía","Taller: 'Empoderamiento desde los roles: quién puede volar y quién necesita estructura'"] : ["Programa de desarrollo de autonomía progresiva basado en madurez de roles"],
        leadership: isCritical ? ["Programa de liderazgo delegador: 'Leaders who let go'","Taller: 'Del control al empoderamiento: el viaje del líder'"] : ["Coaching de líderes en delegación efectiva y gestión de la autonomía"],
      },
      "Reconocimiento": {
        lss: isCritical ? ["Diseñar sistema de reconocimiento formal e informal ligado a valores y comportamientos","I2E™ EXECUTE: convertir el reconocimiento en un proceso con frecuencia y responsables"] : ["I2E™ SUSTAIN: asegurar que el sistema de reconocimiento evolucione y se mantenga relevante"],
        belbin: isCritical ? ["Usar Belbin para personalizar el reconocimiento: cada rol valora ser reconocido de forma diferente","Taller: 'Reconocimiento que funciona: cómo hablar el idioma de cada perfil'"] : ["Programa de reconocimiento peer-to-peer con lenguaje Belbin"],
        leadership: isCritical ? ["Programa de liderazgo apreciativo: 'Leaders who celebrate'","Taller: 'El poder del reconocimiento: cómo los líderes construyen equipos motivados'"] : ["Desarrollar el hábito del reconocimiento específico y oportuno en líderes de primera línea"],
      },
      "Seguridad Psicológica": {
        lss: isCritical ? ["I2E™ OBSERVE: medir y mapear el nivel de seguridad psicológica por equipo y área","Implementar protocolo de gestión de errores sin culpa (blameless post-mortems)"] : ["I2E™ SCALE: institucionalizar la seguridad psicológica como estándar de liderazgo"],
        belbin: isCritical ? ["Taller Belbin de seguridad psicológica: cómo cada rol puede inhibir o promover la apertura","Identificar líderes con perfiles que pueden intimidar — Cerebro, Especialista fuerte"] : ["Sesiones de retroalimentación anónima para medir percepción de seguridad por equipo"],
        leadership: isCritical ? ["Programa intensivo de seguridad psicológica basado en Amy Edmondson","Taller: 'El líder que crea seguridad: de la evaluación a la curiosidad'","Intervención en comportamientos de liderazgo que destruyen la seguridad"] : ["Coaching de líderes en creación de ambientes de apertura y confianza"],
      },
      "Orientación a Resultados": {
        lss: isCritical ? ["QFD para alinear objetivos de área con resultados organizacionales","Implementar OKRs con revisión quincenal y ajuste dinámico","I2E™ EXECUTE: convertir la orientación a resultados en rutinas y KPIs medibles"] : ["I2E™ SCALE: replicar la cultura de resultados en toda la organización con estándares claros"],
        belbin: isCritical ? ["Identificar si hay déficit de Implementador y Finalizador que expliquen la falta de orientación a resultados","Taller: 'Equipos orientados a resultados: el rol de cada perfil Belbin'"] : ["Programa de desarrollo de ownership de resultados en todos los niveles"],
        leadership: isCritical ? ["Programa de liderazgo de alto rendimiento: 'Leaders who deliver results'","Taller: 'Cómo los líderes construyen culturas de excelencia y estándares altos'"] : ["Coaching de líderes en gestión del desempeño y conversaciones de resultados"],
      },
    },
  };

  var modRecs = db[modId];
  if (!modRecs) return { lss: [], belbin: [], leadership: [] };
  var groupRecs = modRecs[groupLabel];
  if (!groupRecs) return { lss: [], belbin: [], leadership: [] };
  return groupRecs;
}


async function generateOPRIReport(eng, allResponses, CORE_DIMS, FULL_DIMS, DEEP_MODULES, computeOPRI, computeDeep, checkL2, checkL3) {
  var coreRR = getScoringResponses(allResponses, "core");
  var fullRR = getScoringResponses(allResponses, "full");
  var coreScores = computeOPRI(coreRR, CORE_DIMS);
  var fullScores = computeOPRI(fullRR, FULL_DIMS);
  var l2 = checkL2(coreScores);
  var l3 = checkL3(fullScores);
  var activeMods = DEEP_MODULES.filter(function(m) {
    var hasResponses = allResponses.some(function(r) { return r.survey === "deep_" + m.id; });
    return hasResponses || l3.mods.indexOf(m.id) >= 0;
  });
  var mainScores = fullScores || coreScores;
  var mainDims = fullScores ? FULL_DIMS : CORE_DIMS;

  if (!mainScores) {
    alert("No hay respuestas suficientes para generar el reporte.");
    return;
  }

  // ── Identify weakest dims for recommendations ──
  var dimsSorted = mainDims.map(function(d) {
    return { dim: d, score: mainScores.dimScores[d.id] };
  }).filter(function(x) { return x.score != null; }).sort(function(a, b) { return a.score - b.score; });

  // ── Call Claude API for AI interpretations ──
  var win = window.open("", "_blank");
  win.document.write('<html><body style="font-family:sans-serif;padding:40px;text-align:center;color:#6B7280"><h2 style="color:#1B4332">Generando reporte OPRI™...</h2><p>Redactando el análisis narrativo · Por favor espere (puede tomar un minuto)</p><div style="font-size:32px;margin-top:20px">⏳</div></body></html>');

  var aiInterpretations = {};
  var narrativeError = null;

  // Helper: one attempt at calling the narrative endpoint + parsing its JSON.
  async function tryGenerateNarrative(promptText) {
    var resp = await fetch("/api/generate-narrative", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: promptText, max_tokens: 8000 })
    });
    var data = await resp.json();
    if (!resp.ok) {
      throw new Error((data && data.error) ? JSON.stringify(data.error) : "HTTP " + resp.status);
    }
    var text = data.content && data.content[0] ? data.content[0].text : "";
    text = text.replace(/```json|```/g, "").trim();
    return JSON.parse(text);
  }

  try {
    // Build rich per-dimension context: score, maturity, PAI gap (if any),
    // and the actual recommended tools (so the model explains THESE, not generic ones).
    var dimContextBlocks = mainDims.map(function(d) {
      var sc = mainScores.dimScores[d.id];
      var meta = DIM_META[d.id];
      var mat = sc != null ? getM(sc) : null;
      var p = mainScores.paiByDim ? mainScores.paiByDim[d.id] : null;
      var recs = getRecommendations(d.id, sc || 0);
      var gapLine = "";
      if (p && p.gap != null) {
        var whoHigher = p.ls > p.os ? "leadership rates it higher than the rest of the organization" : (p.os > p.ls ? "the rest of the organization rates it higher than leadership" : "leadership and the organization rate it the same");
        gapLine = "Perception gap: leadership=" + p.ls.toFixed(2) + ", organization=" + p.os.toFixed(2) + " (gap=" + p.gap.toFixed(2) + ", " + whoHigher + ").";
      }
      return "DIMENSION: " + meta.en + " (" + meta.es + ")\n" +
        "Score: " + (sc != null ? sc.toFixed(2) : "N/A") + "/5.00 — " + (mat ? mat.en + "/" + mat.es : "N/A") + "\n" +
        gapLine + "\n" +
        "Recommended tools for THIS dimension at THIS score level (explain the rationale for 2-3 of these, don't just list them):\n" +
        "  Lean/Six Sigma & I2E™: " + recs.lss.slice(0,3).join(" | ") + "\n" +
        "  Belbin Team Roles: " + recs.belbin.slice(0,3).join(" | ") + "\n" +
        "  Leadership: " + recs.leadership.slice(0,3).join(" | ");
    }).join("\n\n");

    var prompt = "You are a senior partner at Promundial Consulting Group writing the narrative section of an OPRI™ diagnostic report for a client's leadership team. The bar for this document is a report from McKinsey or Bain — not an AI-generated summary, not a generic consulting deck. That means specific things about how it reads, not just how it sounds.\n\n" +
      "CLIENT: " + eng.company + "\n" +
      "OPRI™ overall score: " + mainScores.opri.toFixed(2) + "/5.00 (" + getM(mainScores.opri).en + ")\n" +
      "Respondents: " + mainScores.n + "\n" +
      (mainScores.paiGlobal != null ? "PAI™ (Perception Alignment Index, gap between leadership's and the organization's perception): " + mainScores.paiGlobal.toFixed(2) + " (" + getPAI(mainScores.paiGlobal).en + ")\n" : "") +
      "\n" + dimContextBlocks + "\n\n" +
      "WRITING TASK — for EACH of the 5 dimensions above, write a bilingual (Spanish and English) narrative of 5 to 8 sentences that does THREE things in flowing prose (not bullet points, not headers):\n" +
      "1. States the finding as a diagnostic claim, not an observation — the MBB move is 'X is happening because of Y, and it's costing you Z', not 'there are some challenges around X'. Be concrete about the mechanism: what is actually happening operationally when this score is what it is.\n" +
      "2. If there is a perception gap, treat it as evidence, not decoration — say what the direction of the gap implies about where the organization's real problem sits (e.g., a leadership-high gap usually means a message is being sent that isn't landing, which is itself the finding).\n" +
      "3. Justifies WHY 2-3 of the specific recommended tools listed above are the right lever — name the mechanism (what the tool actually changes structurally) and tie it explicitly back to the finding in point 1, the way a firm ties a recommendation back to its root-cause analysis. Reference each tool by its real name once, inside a sentence — never as a bolted-on list.\n\n" +
      "REGISTER — this is what separates MBB from an AI summary or a generic consulting report. Concretely:\n" +
      "- Lead with the finding, not the setup. Every paragraph's first sentence should be able to stand alone as the headline of that dimension — that's the pyramid principle: conclusion first, support after.\n" +
      "- Be precise, not verbose. MBB prose is economical — short declarative sentences carrying real content, not long sentences padded with qualifiers. Cut any sentence that doesn't add new information.\n" +
      "- State findings with authority. No 'it seems', 'this may suggest', 'could indicate' — say what the data shows and what it means, full stop. Confidence is calibrated to the evidence you were given, not hedged out of politeness.\n" +
      "- Use the actual numbers as evidence inside sentences ('a 2.1 on Execution, against a 4.0 on Alignment, means the organization knows what to do and is failing to do it') — not as a data dump, but as the proof point for the claim being made.\n" +
      "- Avoid both AI-report clichés ('in today's dynamic business environment', 'leverage', 'holistic', 'robust framework', 'foster a culture of') AND consulting-buzzword filler ('synergy', 'drive value', 'best-in-class', 'move the needle') — real MBB writing is plainer and sharper than the stereotype of consulting-speak.\n" +
      "- Vary sentence length and paragraph shape across the 5 dimensions — five identically-structured paragraphs reads like a template, which is exactly what this should not feel like.\n" +
      "- Be willing to be blunt in the weak dimensions. A 2.1 gets plain, direct language about what's broken — softening it would be doing the client a disservice, and MBB firms don't do that.\n" +
      "- Write Spanish and English as two independently composed texts in their own natural business register (Spanish: Ecuador/Latin America), not a translation of one into the other.\n\n" +
      "Also write a 4-5 sentence executive summary (Spanish and English) written as a governing thought, MBB-style: open with the single most important finding across the whole diagnostic — the one thing that, if the leadership team internalizes nothing else, they should internalize this — then briefly support it with the one or two data points that prove it.\n\n" +
      "Respond ONLY with valid JSON, no markdown fences, in this exact shape:\n" +
      '{"summary_es":"...","summary_en":"...","dims":{"alignment":{"es":"...","en":"..."},"execution":{"es":"...","en":"..."},"leadership":{"es":"...","en":"..."},"resilience":{"es":"...","en":"..."},"culture":{"es":"...","en":"..."}}}';


    // Llamamos a nuestro propio endpoint serverless (/api/generate-narrative),
    // NO directo a api.anthropic.com. Un reintento: llamadas a LLM pueden
    // fallar de forma transitoria (timeout, rate limit, JSON no perfectamente
    // válido) — antes de caer al texto de respaldo, lo intentamos una segunda vez.
    try {
      aiInterpretations = await tryGenerateNarrative(prompt);
    } catch (firstErr) {
      console.warn("Primer intento de narrativa falló, reintentando…", firstErr);
      aiInterpretations = await tryGenerateNarrative(prompt);
    }
  } catch(e) {
    console.error("Narrativa OPRI™ no disponible tras reintentar, usando texto de respaldo:", e);
    narrativeError = (e && e.message) ? e.message : String(e);
    aiInterpretations = {
      summary_es: "El análisis OPRI™ revela áreas críticas de atención que requieren intervención inmediata por parte del equipo directivo.",
      summary_en: "The OPRI™ analysis reveals critical areas requiring immediate attention from the leadership team.",
      dims: {}
    };
  }

  // ── Build HTML report ──────────────────────────────────────────────────────
  var date = new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" });
  var safeCompanyName = "OPRI-Report-" + (eng.company || "reporte").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "") + ".html";
  var maturity = getM(mainScores.opri);

  var dimSections = mainDims.map(function(d) {
    var sc = mainScores.dimScores[d.id];
    var meta = DIM_META[d.id];
    var m = sc != null ? getM(sc) : null;
    var aiDim = aiInterpretations.dims && aiInterpretations.dims[d.id] ? aiInterpretations.dims[d.id] : { es: "", en: "" };
    var recs = getRecommendations(d.id, sc || 0);
    return '<div style="page-break-inside:avoid;margin-bottom:36px;border-top:2px solid ' + CHARCOAL + ';padding-top:14px">' +
      '<div style="display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin-bottom:16px;flex-wrap:wrap">' +
        '<div>' +
          '<div style="font-size:15px;font-weight:700;color:' + CHARCOAL + '">' + meta.es + '</div>' +
          '<div style="font-size:10px;color:' + MUTED + ';text-transform:uppercase;letter-spacing:0.06em;margin-top:1px">' + meta.en + '</div>' +
        '</div>' +
        '<div style="text-align:right;flex-shrink:0">' +
          '<span style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:' + CHARCOAL + '">' + (sc != null ? sc.toFixed(2) : '—') + '</span>' +
          (m ? '<div style="font-size:9px;color:' + m.color + ';font-weight:700;text-transform:uppercase;letter-spacing:0.06em;margin-top:2px">' + m.es + '</div>' : '') +
        '</div>' +
      '</div>' +
      (aiDim.es ? '<p style="font-size:13px;color:' + CHARCOAL + ';line-height:1.85;margin:0 0 12px 0">' + aiDim.es + '</p>' : '') +
      (aiDim.en ? '<p style="font-size:12px;color:' + MUTED + ';line-height:1.8;margin:0 0 20px 0;font-style:italic;border-left:2px solid #E5E5E5;padding-left:12px">' + aiDim.en + '</p>' : '') +
      '<div style="font-size:9px;color:' + MUTED + ';text-transform:uppercase;letter-spacing:0.08em;margin:0 0 10px;font-weight:700">Herramientas de referencia</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:0;border-top:1px solid #E5E5E5">' +
        recBlock("LSS / I2E™ Innovation-to-Execution", recs.lss) +
        recBlock("Belbin Team Roles", recs.belbin) +
        recBlock("Leadership Excellence", recs.leadership) +
      '</div>' +
    '</div>';
  }).join('');

  // MBB-style reference block: no colored background, no icon — a plain
  // bordered column with a small-caps label and a minimal dash list.
  function recBlock(title, items) {
    return '<div style="padding:12px 14px 4px 0;border-right:1px solid #F0F0F0">' +
      '<div style="font-size:9px;font-weight:700;color:' + CHARCOAL + ';margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em">' + title + '</div>' +
      '<ul style="margin:0;padding:0;list-style:none">' +
        items.map(function(i) { return '<li style="font-size:11px;color:' + MUTED + ';line-height:1.65;margin-bottom:6px;padding-left:12px;position:relative"><span style="position:absolute;left:0;color:' + CHARCOAL + '">–</span>' + i + '</li>'; }).join('') +
      '</ul>' +
    '</div>';
  }

  // Short, human, non-AI-sounding connector sentences that explain WHY the
  // tools below are being suggested for this specific Deep Dive group —
  // templated (not a per-group API call) to keep report generation fast and
  // affordable, but varied enough not to feel robotic across 40 groups.
  function deepWhySentence(modName, groupLabel, sc) {
    var band = sc < 2.5 ? "crit" : sc < 3.2 ? "vuln" : "stable";
    var variants = {
      crit: [
        "Un resultado de " + sc.toFixed(2) + " en " + groupLabel + " no es un matiz — es una señal de que esto se vive como un problema recurrente dentro de " + modName + ", y por eso las líneas de abajo apuntan a intervenir directamente, no a ajustar en el margen.",
        "Con " + sc.toFixed(2) + ", " + groupLabel + " está entre los puntos más débiles de " + modName + " en esta organización; las herramientas sugeridas aquí están pensadas para casos así, donde el patrón ya es visible y sostenido, no ocasional.",
      ],
      vuln: [
        groupLabel + " se ubica en zona vulnerable (" + sc.toFixed(2) + ") dentro de " + modName + " — todavía no es crítico, pero es el tipo de brecha que se agranda si nadie la atiende a propósito; de ahí estas recomendaciones.",
        "Un " + sc.toFixed(2) + " en " + groupLabel + " sugiere que el problema aparece de forma intermitente más que sistemática dentro de " + modName + ", lo que abre la puerta a intervenciones más ligeras antes de que se vuelva estructural.",
      ],
      stable: [
        groupLabel + " ya está en un nivel razonable (" + sc.toFixed(2) + ") dentro de " + modName + ", así que estas sugerencias son más sobre consolidar y escalar lo que ya funciona que sobre corregir algo roto.",
      ],
    };
    var opts = variants[band];
    var idx = (groupLabel.length + Math.round(sc * 100)) % opts.length;
    return opts[idx];
  }

  // Deep Dive sections
  var deepSections = activeMods.map(function(m) {
    var deepRR = allResponses.filter(function(r) { return r.survey === "deep_" + m.id; });
    var deepSc = computeDeep(deepRR, m);
    if (!deepSc) return '';

    // Sort groups by score ascending to highlight weakest
    var groupsSorted = m.groups.map(function(g) {
      return { g: g, sc: deepSc.groupScores[g.label] };
    }).sort(function(a, b) { return (a.sc || 5) - (b.sc || 5); });

    var groupBars = groupsSorted.map(function(item) {
      var g = item.g; var sc = item.sc;
      var mat = sc != null ? getM(sc) : null;
      var pct = sc != null ? (sc / 5 * 100).toFixed(1) : 0;
      var recs = sc != null ? getDeepRecs(m.id, g.label, sc) : null;
      var recsHtml = '';
      if (recs && sc < 3.5) {
        recsHtml = '<div style="margin-top:10px;padding-left:14px;border-left:2px solid #E5E5E5">' +
          '<p style="font-size:11px;color:' + CHARCOAL + ';line-height:1.6;margin:0 0 10px 0">' + deepWhySentence(m.fullName, g.label, sc) + '</p>' +
          '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:0">' +
            recBlock("LSS / I2E™", recs.lss.slice(0,2)) +
            recBlock("Belbin", recs.belbin.slice(0,2)) +
            recBlock("Leadership", recs.leadership.slice(0,2)) +
          '</div>' +
        '</div>';
      }
      return '<div style="margin-bottom:' + (recsHtml ? '16' : '10') + 'px;padding-bottom:' + (recsHtml ? '16' : '10') + 'px;border-bottom:1px solid #EEEEEE">' +
        '<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px">' +
          '<span style="font-size:12px;color:' + CHARCOAL + ';font-weight:600">' + g.label + '</span>' +
          '<span style="display:flex;align-items:baseline;gap:6px">' +
            (mat ? '<span style="font-size:9px;color:' + mat.color + ';font-weight:700;text-transform:uppercase">' + mat.es + '</span>' : '') +
            '<span style="font-family:Georgia,serif;font-size:13px;font-weight:700;color:' + CHARCOAL + '">' + (sc != null ? sc.toFixed(2) : '—') + '</span>' +
          '</span>' +
        '</div>' +
        '<div style="background:#EDEDED;height:3px"><div style="width:' + pct + '%;height:100%;background:' + CHARCOAL + '"></div></div>' +
        recsHtml +
      '</div>';
    }).join('');

    return '<div style="page-break-inside:avoid;margin-bottom:32px;border-top:2px solid ' + CHARCOAL + ';padding-top:14px">' +
      '<div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:8px">' +
        '<div>' +
          '<div style="font-size:10px;color:' + MUTED + ';font-weight:600;text-transform:uppercase;letter-spacing:0.06em">' + m.index + '</div>' +
          '<div style="font-size:15px;font-weight:700;color:' + CHARCOAL + '">' + m.fullName + '</div>' +
        '</div>' +
        '<div style="text-align:right">' +
          '<span style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:' + CHARCOAL + '">' + (deepSc.globalScore != null ? deepSc.globalScore.toFixed(2) : '—') + '</span>' +
          '<div style="font-size:10px;color:' + MUTED + '">' + deepSc.n + ' respondentes</div>' +
        '</div>' +
      '</div>' +
      groupBars +
    '</div>';
  }).join('');

  // Roadmap priorities
  var roadmapItems = dimsSorted.slice(0, 3).map(function(x, i) {
    var meta = DIM_META[x.dim.id];
    var m = getM(x.score);
    var priority = i === 0 ? "Prioridad 1 — Intervención Inmediata" : i === 1 ? "Prioridad 2 — Intervención a 60 días" : "Prioridad 3 — Intervención a 90 días";
    return '<div style="display:flex;gap:14px;margin-bottom:14px;page-break-inside:avoid">' +
      '<div style="width:26px;height:26px;border:1.5px solid ' + CHARCOAL + ';color:' + CHARCOAL + ';display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;flex-shrink:0;font-family:Georgia,serif">' + (i+1) + '</div>' +
      '<div style="flex:1;border-bottom:1px solid #E5E5E5;padding-bottom:12px">' +
        '<div style="font-size:9px;color:' + MUTED + ';font-weight:700;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:3px">' + priority + '</div>' +
        '<div style="font-size:13px;font-weight:700;color:' + CHARCOAL + '">' + meta.es + ' <span style="font-family:Georgia,serif;font-weight:700">— ' + x.score.toFixed(2) + '</span></div>' +
        '<div style="font-size:11px;color:' + MUTED + ';margin-top:3px">' + meta.en + '</div>' +
      '</div>' +
    '</div>';
  }).join('');

  var html = '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">' +
    '<title>OPRI™ Report — ' + eng.company + '</title>' +
    '<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Jost:wght@400;500;600;700&display=swap" rel="stylesheet">' +
    '<style>' +
      'body{font-family:"Jost",sans-serif;background:#fff;color:' + CHARCOAL + ';margin:0;padding:0}' +
      '@media print{.no-print{display:none!important}body{font-size:11px}@page{margin:15mm}}' +
      '.page{max-width:900px;margin:0 auto;padding:0 32px 48px}@media(max-width:600px){.page{padding:0 12px 32px}h2{font-size:20px!important}}' +
      'h2{font-family:"Cormorant Garamond",serif;font-weight:600;margin:0 0 4px 0}' +
      '.section-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:' + CHARCOAL + ';margin:32px 0 14px 0;padding-bottom:7px;border-bottom:1.5px solid ' + CHARCOAL + '}' +
    '</style></head><body>' +

    // Botones de acción. window.print() abierto desde un popup construido
    // por JS resultó no ser confiable en Safari (pantalla en blanco
    // reproducible tras cerrar el diálogo de impresión, en 3 enfoques
    // distintos probados). En su lugar, "Descargar Reporte" guarda un
    // archivo .html real usando Blob + <a download> — un mecanismo de
    // descarga estándar, sin relación con el pipeline de impresión, y por
    // eso no hereda ese bug. Desde el archivo ya descargado (una pestaña
    // real, no una ventana construida por JS), Cmd+P → Guardar como PDF
    // funciona con normalidad. Se deja "Imprimir" como atajo secundario
    // para navegadores donde sí funciona directo (p. ej. Chrome).
    '<div class="no-print" style="background:' + GREEN + ';padding:12px 32px;position:sticky;top:0;z-index:100">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">' +
        '<div style="font-family:\'Cormorant Garamond\',serif;font-size:18px;color:white;font-weight:600">OPRI™ Enterprise · Reporte</div>' +
        '<div style="display:flex;gap:8px;align-items:center">' +
          '<button onclick="var blob=new Blob([document.documentElement.outerHTML],{type:\'text/html;charset=utf-8\'});var url=URL.createObjectURL(blob);var a=document.createElement(\'a\');a.href=url;a.download=\'' + safeCompanyName + '\';document.body.appendChild(a);a.click();document.body.removeChild(a);setTimeout(function(){URL.revokeObjectURL(url);},1000);" style="background:' + GOLD + ';color:' + CHARCOAL + ';border:none;padding:8px 20px;border-radius:6px;font-weight:700;cursor:pointer;font-size:13px">⬇ Descargar Reporte</button>' +
          '<button onclick="window.print()" style="background:rgba(255,255,255,0.12);color:white;border:1px solid rgba(255,255,255,0.3);padding:8px 16px;border-radius:6px;font-weight:600;cursor:pointer;font-size:13px">🖨 Imprimir</button>' +
          '<button onclick="window.close()" style="background:rgba(255,255,255,0.15);color:white;border:1px solid rgba(255,255,255,0.3);padding:8px 16px;border-radius:6px;font-weight:600;cursor:pointer;font-size:13px">← Volver</button>' +
        '</div>' +
      '</div>' +
      '<div style="font-size:10px;color:rgba(255,255,255,0.6);margin-top:6px">Presiona <strong>"⬇ Descargar Reporte"</strong> ahora mismo (no dejes esta pestaña inactiva) para guardarlo. Luego ábrelo desde Descargas y usa Cmd+P → Guardar como PDF.</div>' +
    '</div>' +
    '</div>' +

    '<div class="page">' +

    // Cover — brand identity stays (dark green, logo), but the stat row below
    // it drops the colored pill badges and decorative dividers for a plainer,
    // editorial title-page treatment.
    '<div style="background:' + GREEN + ';padding:44px 40px;margin:28px 0 0;color:white">' +
      '<div style="display:flex;align-items:center;gap:14px;margin-bottom:22px"><img src="' + LOGO_B64 + '" style="height:36px;width:auto" alt="Promundial"/><div style="font-size:9px;letter-spacing:0.15em;color:' + GOLD + ';text-transform:uppercase;line-height:1.6">Promundial Consulting Group<br>OPRI™ Enterprise Edition</div></div>' +
      '<h2 style="font-size:34px;color:white;margin:0 0 6px 0;font-weight:600">' + eng.company + '</h2>' +
      '<div style="font-size:13px;color:rgba(255,255,255,0.65);margin-bottom:30px">Organizational Performance & Resilience Index™ · Reporte Ejecutivo · ' + date + '</div>' +
      '<div style="display:flex;gap:36px;flex-wrap:wrap;border-top:1px solid rgba(255,255,255,0.18);padding-top:20px">' +
        '<div><div style="font-size:9px;color:rgba(255,255,255,0.55);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:3px">OPRI™ Score</div><div style="font-family:Georgia,serif;font-size:36px;font-weight:700;line-height:1;color:white">' + mainScores.opri.toFixed(2) + '</div><div style="font-size:10px;color:rgba(255,255,255,0.75);margin-top:3px">' + maturity.es + ' / ' + maturity.en + '</div></div>' +
        '<div><div style="font-size:9px;color:rgba(255,255,255,0.55);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:3px">Respondentes</div><div style="font-family:Georgia,serif;font-size:36px;font-weight:700;color:white">' + mainScores.n + '</div></div>' +
        (mainScores.paiGlobal != null ? '<div><div style="font-size:9px;color:rgba(255,255,255,0.55);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:3px">PAI™</div><div style="font-family:Georgia,serif;font-size:36px;font-weight:700;color:white">' + mainScores.paiGlobal.toFixed(2) + '</div><div style="font-size:10px;color:rgba(255,255,255,0.75);margin-top:3px">' + getPAI(mainScores.paiGlobal).es + '</div></div>' : '') +
        '<div><div style="font-size:9px;color:rgba(255,255,255,0.55);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:3px">Consultor</div><div style="font-size:15px;font-weight:600;color:white">' + (eng.consultant || 'Promundial') + '</div></div>' +
      '</div>' +
    '</div>' +

    // Executive Summary — single "governing finding" box, MBB-style: a plain
    // white panel with a black top rule, not two colored side-by-side cards.
    '<div style="border-top:3px solid ' + CHARCOAL + ';padding:20px 0 4px;margin-top:0">' +
      '<div style="font-size:9px;font-weight:700;color:' + MUTED + ';text-transform:uppercase;letter-spacing:0.12em;margin-bottom:12px">Hallazgo Principal / Governing Finding</div>' +
      (narrativeError ? '<div class="no-print" style="background:#FEF2F2;border:1px solid #FCA5A5;border-radius:6px;padding:10px 14px;margin-bottom:14px;font-size:11px;color:#991B1B"><strong>⚠ AVISO INTERNO (no visible al imprimir):</strong> la narrativa con IA falló incluso tras reintentar, así que este reporte quedó con el texto de respaldo genérico en el resumen y sin párrafos por dimensión. Error: ' + String(narrativeError).replace(/</g,"&lt;") + '. Intenta generar el reporte de nuevo.</div>' : '') +
      '<p style="font-size:14px;line-height:1.85;margin:0 0 16px 0;color:' + CHARCOAL + '">' + (aiInterpretations.summary_es || '') + '</p>' +
      '<p style="font-size:12px;line-height:1.8;margin:0 0 8px 0;color:' + MUTED + ';font-style:italic;border-left:2px solid #E5E5E5;padding-left:14px">' + (aiInterpretations.summary_en || '') + '</p>' +
    '</div>' +

    // Scores overview
    '<div class="section-title">Perfil de Capacidades / Capability Profile</div>' +
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:24px;align-items:start;margin-bottom:8px">' +
      '<div>' + gaugeHTML(mainScores.opri, CHARCOAL, 140) + '</div>' +
      '<div>' + barHTML(mainDims, mainScores) + '</div>' +
    '</div>' +

    // PAI
    (mainScores.paiGlobal != null ? '<div class="section-title">PAI™ — Perception Alignment Index</div>' +
    '<div style="margin-bottom:24px">' +
      '<div style="display:flex;align-items:baseline;gap:14px;margin-bottom:14px">' +
        '<div style="font-family:Georgia,serif;font-size:30px;font-weight:700;color:' + CHARCOAL + '">' + mainScores.paiGlobal.toFixed(2) + '</div>' +
        '<div><div style="font-size:11px;color:' + CHARCOAL + ';font-weight:600">' + getPAI(mainScores.paiGlobal).es + ' / ' + getPAI(mainScores.paiGlobal).en + '</div><div style="font-size:11px;color:' + MUTED + '">Gap promedio entre Liderazgo y Organización</div></div>' +
      '</div>' +
      '<p style="font-size:12px;color:' + CHARCOAL + ';line-height:1.75;margin:0 0 16px 0">' + paiExplainer(mainScores) + '</p>' +
      paiTableHTML(mainDims, mainScores) +
    '</div>' : '') +

    // Dimension details
    '<div class="section-title">Análisis por Dimensión / Dimension Analysis</div>' +
    dimSections +

    // Deep Dive
    (deepSections ? '<div class="section-title">Deep Dive — Módulos Avanzados</div>' + deepSections : '') +

    // Roadmap
    '<div class="section-title">Roadmap de Intervención / Intervention Roadmap</div>' +
    '<div style="margin-bottom:24px">' + roadmapItems + '</div>' +

    // Footer — logo asset is a light/cream fill (designed for the dark green
    // cover), so on this white footer it needs a small dark chip behind it
    // to stay visible rather than disappearing into the page.
    '<div style="border-top:1px solid #E5E5E5;padding-top:16px;display:flex;justify-content:space-between;align-items:center;margin-top:32px">' +
      '<div style="background:' + GREEN + ';padding:6px 10px;display:inline-flex;align-items:center"><img src="' + LOGO_B64 + '" style="height:16px;width:auto" alt="Promundial"/></div>' +
      '<div style="font-size:9px;color:' + MUTED + ';text-align:right">OPRI™ Enterprise Edition · Confidencial · ' + date + '<br>© ' + new Date().getFullYear() + ' Promundial Consulting Group · All rights reserved</div>' +
    '</div>' +

    '</div></body></html>';

  // Mostramos el reporte en la ventana emergente. La descarga automática
  // (intentada en una iteración anterior) resultó bloqueada por Safari: al
  // dispararse después de un await (la llamada a la API), ya no cuenta como
  // una acción directa del usuario, así que el navegador la deja "atascada"
  // en silencio. Por eso la descarga vuelve a ser manual — pero el aviso en
  // pantalla le pide al usuario que la dispare de inmediato, apenas se abre
  // el reporte, para minimizar el riesgo de que Safari descargue la pestaña
  // en segundo plano si pasa un rato inactiva antes de usarla.
  var blob = new Blob([html], { type: "text/html;charset=utf-8" });
  var blobUrl = URL.createObjectURL(blob);
  if (win && !win.closed) {
    win.location.href = blobUrl;
  } else {
    window.open(blobUrl, "_blank");
  }
}

var LOGO_B64 = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODU4IiBoZWlnaHQ9IjEyOSIgdmlld0JveD0iMCAwIDg1OCAxMjkiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xMTguMTk1IDU0LjgxNzRMOTkuNDA4MyAzNi4wMzA4TDg3LjYwMDMgNDguNDQzM0wxMDkuMTg5IDQ4LjY1MDhMMTAxLjA2MyA2MC4xNzE5TDgwLjAzNTcgNTkuOTcwNEw3Ni44MzAzIDU5LjkzOTlMNjYuNDgxNSA1OS44NDIyVjI0LjI4MzlMNzcuNDUzIDE2LjczMTRWMzguMzQ0OEw4OS44Nzc3IDI2LjUwMDJMNzEuMTgyNyA3LjgwNTI0QzY2LjEwOTEgMi43MzE1OSA1Ny44OTExIDIuNzMxNTkgNTIuODE3NCA3LjgwNTI0TDM0LjAzMDkgMjYuNTkxOEw0Ni40NDMzIDM4LjM5OThMNDYuNjUwOSAxNi44MTA4TDU4LjE3MTkgMjQuOTM3Mkw1Ny45NzA0IDQ1Ljk2NDRMNTcuOTM5OSA0OS4xNjk4TDU3Ljg0MjIgNTkuNTE4NkgyMi4yODM5TDE0LjczMTQgNDguNTQ3SDM2LjM0NDhMMjQuNTAwMiAzNi4xMjI0TDUuODA1MjQgNTQuODE3NEMwLjczMTU4NyA1OS44OTEgMC43MzE1ODcgNjguMTE1MSA1LjgwNTI0IDczLjE4MjZMMjQuNTkxOCA5MS45NjkyTDM2LjM5OTggNzkuNTU2N0wxNC44MTA4IDc5LjM0OTJMMjIuOTM3MiA2Ny44MjgxTDQzLjk2NDUgNjguMDI5Nkw0Ny4xNjk5IDY4LjA2MDFMNTcuNTE4NiA2OC4xNTc4VjEwMy43MTZMNDYuNTQ3MSAxMTEuMjY5Vjg5LjY1NTJMMzQuMTIyNSAxMDEuNUw1Mi44MTc0IDEyMC4xOTVDNTcuODkxMSAxMjUuMjY4IDY2LjEwOTEgMTI1LjI2OCA3MS4xODI3IDEyMC4xOTVMODkuOTY5MiAxMDEuNDA4TDc3LjU1NjggODkuNjAwMkw3Ny4zNDkyIDExMS4xODlMNjUuODI4MiAxMDMuMDYzTDY2LjAyOTcgODIuMDM1Nkw2Ni4wNjAyIDc4LjgzMDJMNjYuMTU3OSA2OC40ODE0SDEwMS43MTZMMTA5LjI2OSA3OS40NTNIODcuNjU1M0w5OS40OTk5IDkxLjg3NzZMMTE4LjE5NSA3My4xODI2QzEyMy4yNjkgNjguMTA5IDEyMy4yNjkgNTkuODkxIDExOC4xOTUgNTQuODE3NFoiIGZpbGw9IiNGN0YwRUQiLz4KPHBhdGggZD0iTTE3My45NzcgNzMuMTlDMTcyLjcwMSA3My4xOSAxNzEuNDI1IDczLjE5IDE3MC4xNDkgNzMuMTlDMTY4Ljg3MyA3My4xOSAxNjcuNzM4IDczLjA0ODIgMTY2LjYwNCA3Mi45MDY1VjEwNC4wOThIMTUyVjI0LjI3NTlIMTc1LjExMUMxNzguOTM5IDI0LjI3NTkgMTgyLjM0MiAyNC40MTc3IDE4NS4xNzggMjQuODQzQzE4OC4wMTQgMjUuMjY4NCAxOTAuNzA4IDI1LjY5MzcgMTkyLjk3NiAyNi40MDI2QzE5OC4zNjQgMjguMTAzOSAyMDIuNjE4IDMwLjc5NzggMjA1LjU5NSAzNC4zNDIzQzIwOC41NzMgMzguMDI4NiAyMDkuOTkxIDQyLjcwNzMgMjA5Ljk5MSA0OC4zNzg1QzIwOS45OTEgNTIuMjA2NiAyMDkuMTQgNTUuNzUxMSAyMDcuNTggNTguNzI4NEMyMDYuMDIxIDYxLjg0NzYgMjAzLjYxIDY0LjM5OTYgMjAwLjYzMyA2Ni41MjYzQzE5Ny41MTMgNjguNjUzIDE5My44MjcgNzAuMzU0NCAxODkuNDMyIDcxLjQ4ODdDMTg0Ljg5NCA3Mi42MjI5IDE3OS43OSA3My4xOSAxNzMuOTc3IDczLjE5Wk0xNjYuNjA0IDYwLjU3MTZDMTY3LjQ1NSA2MC43MTM0IDE2OC40NDcgNjAuNzEzNCAxNjkuODY1IDYwLjg1NTFDMTcxLjE0MSA2MC44NTUxIDE3Mi41NTkgNjAuOTk3IDE3My44MzUgNjAuOTk3QzE3Ny44MDUgNjAuOTk3IDE4MS4wNjYgNjAuNzEzNCAxODMuNzYgNjAuMDA0NUMxODYuNDU0IDU5LjQzNzQgMTg4LjU4MSA1OC40NDQ5IDE5MC4xNDEgNTcuMzEwNkMxOTEuODQyIDU2LjE3NjQgMTkyLjk3NiA1NC43NTg2IDE5My42ODUgNTMuMTk5MUMxOTQuMzk0IDUxLjYzOTUgMTk0LjgxOSA0OS43OTYzIDE5NC44MTkgNDcuOTUzMkMxOTQuODE5IDQ1LjU0MjkgMTk0LjI1MiA0My41NTggMTkzLjI2IDQxLjg1NjdDMTkyLjEyNiA0MC4xNTUzIDE5MC4yODIgMzguODc5MyAxODcuNTg4IDM3Ljg4NjhDMTg2LjE3MSAzNy40NjE1IDE4NC40NjkgMzcuMDM2MSAxODIuNDg0IDM2Ljg5NDNDMTgwLjQ5OSAzNi42MTA4IDE3Ny45NDcgMzYuNjEwOCAxNzQuOTY5IDM2LjYxMDhIMTY2Ljc0NlY2MC41NzE2SDE2Ni42MDRaIiBmaWxsPSIjRjdGMEVEIi8+CjxwYXRoIGQ9Ik0yNzcuMTk3IDQ4LjIzN0MyNzcuMTk3IDUzLjc2NjQgMjc1LjYzOCA1OC41ODcgMjcyLjUxOSA2Mi40MTVDMjY5LjM5OSA2Ni4yNDMxIDI2NC43MiA2OS4yMjA0IDI1OC4xOTggNzEuMDYzNlY3MS4zNDcyTDI4Mi4wMTggMTA0LjI0SDI2NC40MzdMMjQyLjc0MyA3My4zMzIxSDIzMi42NzdWMTA0LjI0SDIxOC4wNzNWMjQuNDE4SDI0Mi4zMThDMjQ2LjI4OCAyNC40MTggMjUwLjExNiAyNC43MDE1IDI1My41MTkgMjUuMTI2OUMyNTYuOTIyIDI1LjU1MjIgMjU5LjkgMjYuMjYxMSAyNjIuNDUyIDI3LjI1MzZDMjY3LjEzMSAyOS4wOTY3IDI3MC44MTcgMzEuNjQ4NyAyNzMuMzY5IDM1LjE5MzJDMjc1LjkyMSAzOC40NTQyIDI3Ny4xOTcgNDIuOTkxMiAyNzcuMTk3IDQ4LjIzN1pNMjM5LjkwOCA2MC45OTcyQzI0My4zMTEgNjAuOTk3MiAyNDYuMTQ2IDYwLjg1NTUgMjQ4LjQxNSA2MC41NzE5QzI1MC42ODMgNjAuMjg4MyAyNTIuNjY4IDU5Ljg2MyAyNTQuMjI4IDU5LjI5NTlDMjU3LjIwNiA1OC4xNjE2IDI1OS4xOTEgNTYuNjAyIDI2MC4zMjUgNTQuNzU4OUMyNjEuNDU5IDUyLjc3MzkgMjYyLjAyNiA1MC42NDcyIDI2Mi4wMjYgNDguMDk1MkMyNjIuMDI2IDQ1Ljk2ODUgMjYxLjYwMSA0My45ODM2IDI2MC43NSA0Mi40MjRDMjU5LjkgNDAuNzIyNiAyNTguMzQgMzkuNDQ2NiAyNTYuMjEzIDM4LjQ1NDJDMjU0Ljc5NSAzNy43NDUzIDI1My4wOTQgMzcuMzE5OSAyNTAuOTY3IDM3LjAzNjRDMjQ4Ljg0IDM2Ljc1MjggMjQ2LjI4OCAzNi42MTEgMjQzLjE2OSAzNi42MTFIMjMyLjY3N1Y2MS4xMzlIMjM5LjkwOFY2MC45OTcyWiIgZmlsbD0iI0Y3RjBFRCIvPgo8cGF0aCBkPSJNMzYxLjg0MyA2NC4yNThDMzYxLjg0MyA3MC4zNTQ1IDM2MC45OTIgNzUuODgzOSAzNTkuMjkxIDgwLjk4OEMzNTcuNTkgODYuMDkyMSAzNTUuMDM3IDkwLjQ4NzMgMzUxLjc3NiA5NC4wMzE4QzM0OC41MTUgOTcuNzE4MSAzNDQuNDAzIDEwMC41NTQgMzM5LjU4MyAxMDIuNTM5QzMzNC43NjIgMTA0LjUyNCAzMjkuMjMyIDEwNS41MTYgMzIzLjEzNSAxMDUuNTE2QzMxNi44OTcgMTA1LjUxNiAzMTEuNTA5IDEwNC41MjQgMzA2LjY4OCAxMDIuNTM5QzMwMS44NjcgMTAwLjU1NCAyOTcuNzU2IDk3LjcxODEgMjk0LjQ5NSA5NC4wMzE4QzI5MS4yMzMgOTAuMzQ1NSAyODguNjgxIDg1Ljk1MDMgMjg2Ljk4IDgwLjk4OEMyODUuMjc4IDc1Ljg4MzkgMjg0LjQyOCA3MC4zNTQ1IDI4NC40MjggNjQuMjU4QzI4NC40MjggNTguMTYxNCAyODUuMjc4IDUyLjYzMiAyODYuOTggNDcuNTI3OUMyODguNjgxIDQyLjQyMzkgMjkxLjIzMyAzOC4wMjg3IDI5NC40OTUgMzQuNDg0MkMyOTcuNzU2IDMwLjc5NzkgMzAxLjg2NyAyNy45NjIzIDMwNi42ODggMjUuOTc3M0MzMTEuNTA5IDIzLjk5MjQgMzE3LjAzOSAyMyAzMjMuMTM1IDIzQzMyOS4zNzQgMjMgMzM0Ljc2MiAyMy45OTI0IDMzOS41ODMgMjUuOTc3M0MzNDQuNDAzIDI3Ljk2MjMgMzQ4LjUxNSAzMC43OTc5IDM1MS43NzYgMzQuNDg0MkMzNTUuMDM3IDM4LjE3MDQgMzU3LjU5IDQyLjU2NTYgMzU5LjI5MSA0Ny41Mjc5QzM2MC45OTIgNTIuNDkwMyAzNjEuODQzIDU4LjE2MTQgMzYxLjg0MyA2NC4yNThaTTM0Ni42NzIgNjQuMjU4QzM0Ni42NzIgNTkuNDM3NSAzNDYuMTA1IDU1LjE4NDEgMzQ0LjgyOSA1MS40OTc4QzM0My42OTUgNDcuODExNSAzNDEuOTkzIDQ0LjgzNDEgMzM5Ljg2NiA0Mi40MjM4QzMzNy43MzkgNDAuMDEzNSAzMzUuMTg3IDM4LjE3MDQgMzMyLjM1MiAzNy4wMzYyQzMyOS4zNzQgMzUuOTAxOSAzMjYuMjU1IDM1LjE5MzEgMzIyLjg1MiAzNS4xOTMxQzMxOS40NDkgMzUuMTkzMSAzMTYuMTg4IDM1Ljc2MDIgMzEzLjM1MiAzNy4wMzYyQzMxMC4zNzUgMzguMTcwNCAzMDcuOTY0IDQwLjAxMzUgMzA1LjgzOCA0Mi40MjM4QzMwMy43MTEgNDQuODM0MSAzMDIuMDA5IDQ3Ljk1MzMgMzAwLjg3NSA1MS40OTc4QzI5OS43NDEgNTUuMTg0MSAyOTkuMDMyIDU5LjQzNzUgMjk5LjAzMiA2NC4yNThDMjk5LjAzMiA2OS4wNzg1IDI5OS41OTkgNzMuMzMxOSAzMDAuODc1IDc3LjAxODJDMzAyLjAwOSA4MC43MDQ1IDMwMy43MTEgODMuNjgxOSAzMDUuODM4IDg2LjA5MjJDMzA3Ljk2NCA4OC41MDI0IDMxMC41MTYgOTAuMzQ1NiAzMTMuMzUyIDkxLjQ3OThDMzE2LjE4OCA5Mi43NTU4IDMxOS40NDkgOTMuMzIyOSAzMjIuODUyIDkzLjMyMjlDMzI2LjI1NSA5My4zMjI5IDMyOS41MTYgOTIuNzU1OCAzMzIuMzUyIDkxLjQ3OThDMzM1LjE4NyA5MC4yMDM4IDMzNy43MzkgODguNTAyNCAzMzkuODY2IDg2LjA5MjJDMzQxLjk5MyA4My42ODE5IDM0My42OTUgODAuNzA0NSAzNDQuODI5IDc3LjAxODJDMzQ2LjEwNSA3My4zMzE5IDM0Ni42NzIgNjkuMDc4NSAzNDYuNjcyIDY0LjI1OFoiIGZpbGw9IiNGN0YwRUQiLz4KPHBhdGggZD0iTTQxMS4wNDMgODIuNjg5MkM0MTIuNzQ1IDc2LjQ1MDkgNDE1LjAxMyA2OS42NDU1IDQxNy41NjUgNjIuNDE0N0w0MzEuMzE5IDI0LjEzNEg0NTEuODc4VjEwMy45NTZINDM3LjI3NFY2My40MDcxQzQzNy4yNzQgNTcuNDUyNCA0MzcuNTU3IDUwLjY0NjkgNDM3Ljk4MyA0Mi43MDcySDQzNy40MTVDNDM2LjcwNiA0NC45NzU3IDQzNS45OTggNDcuNTI3NyA0MzUuMDA1IDUwLjM2MzNDNDM0LjE1NCA1My4xOTkgNDMzLjE2MiA1Ni4wMzQ1IDQzMi4xNjkgNTguNzI4M0w0MTUuNTggMTAzLjgxNEg0MDYuMDgxTDM4OS40OTIgNTguNzI4M0MzODguNDk5IDU2LjAzNDUgMzg3LjUwNyA1My4xOTkgMzg2LjY1NiA1MC4zNjMzQzM4NS44MDUgNDcuNTI3NyAzODQuOTU0IDQ0Ljk3NTcgMzg0LjI0NSA0Mi43MDcySDM4My42NzhDMzg0LjEwNCA1MC4wNzk4IDM4NC4zODcgNTYuODg1MiAzODQuMzg3IDYzLjI2NTNWMTAzLjgxNEgzNjkuNzgzVjIzLjk5MjJIMzkwLjJMNDAzLjk1NCA2MS45ODkzQzQwNi4yMjIgNjguMzY5NCA0MDguNDkxIDc1LjE3NDggNDEwLjQ3NiA4Mi40MDU2SDQxMS4wNDNWODIuNjg5MloiIGZpbGw9IiNGN0YwRUQiLz4KPHBhdGggZD0iTTQ5Ni42ODMgMTA1LjY1OEM0OTIuNTcxIDEwNS42NTggNDg4Ljc0MyAxMDUuMjMyIDQ4NS4zNCAxMDQuMzgyQzQ4MS45MzcgMTAzLjUzMSA0NzkuMTAxIDEwMi4zOTcgNDc2LjU0OSAxMDAuODM3QzQ3My45OTcgOTkuMjc3NyA0NzEuODcgOTcuNDM0NiA0NzAuMDI3IDk1LjE2NjFDNDY4LjE4NCA5Mi44OTc2IDQ2Ni43NjYgOTAuNDg3NCA0NjUuNzczIDg3LjY1MThDNDY0LjkyMyA4NS4zODMzIDQ2NC4yMTQgODIuOTczIDQ2My45MyA4MC4yNzkyQzQ2My41MDUgNzcuNTg1NCA0NjMuMzYzIDc0LjYwOCA0NjMuMzYzIDcxLjIwNTNWMjQuMTM0M0g0NzcuOTY3VjY5LjkyOTNDNDc3Ljk2NyA3NS42MDA1IDQ3OC42NzYgNzkuOTk1NiA0NzkuOTUyIDgzLjExNDhDNDgxLjUxMiA4Ni42NTkzIDQ4My42MzkgODkuMjExNCA0ODYuNjE2IDkwLjc3MUM0ODkuNDUyIDkyLjMzMDUgNDkyLjk5NiA5My4xODEyIDQ5Ni44MjUgOTMuMTgxMkM1MDAuNzk1IDkzLjE4MTIgNTA0LjE5OCA5Mi4zMzA1IDUwNy4wMzMgOTAuNzcxQzUwOS44NjkgODkuMjExNCA1MTIuMTM4IDg2LjY1OTMgNTEzLjY5NyA4My4xMTQ4QzUxNS4xMTUgNzkuOTk1NiA1MTUuNjgyIDc1LjQ1ODcgNTE1LjY4MiA2OS45MjkzVjI0LjEzNDNINTMwLjI4NlY3MS4yMDUzQzUzMC4yODYgNzQuNjA4IDUzMC4xNDQgNzcuNTg1NCA1MjkuNzE5IDgwLjI3OTJDNTI5LjI5NCA4Mi45NzMgNTI4LjcyNyA4NS41MjUxIDUyNy44NzYgODcuNjUxOEM1MjYuNzQyIDkwLjQ4NzQgNTI1LjMyNCA5Mi44OTc2IDUyMy40ODEgOTUuMTY2MUM1MjEuNjM3IDk3LjQzNDYgNTE5LjUxMSA5OS4yNzc3IDUxNi44MTcgMTAwLjgzN0M1MTQuMjY0IDEwMi4zOTcgNTExLjE0NSAxMDMuNTMxIDUwNy44ODQgMTA0LjM4MkM1MDQuNjIzIDEwNS4yMzIgNTAwLjkzNiAxMDUuNjU4IDQ5Ni42ODMgMTA1LjY1OFoiIGZpbGw9IiNGN0YwRUQiLz4KPHBhdGggZD0iTTU4My41OTcgNjEuNDIyM0M1ODkuMjY5IDY5LjY0NTUgNTkzLjk0OCA3Ni44NzYzIDU5Ny42MzQgODMuMTE0Nkg1OTguMDZDNTk3LjYzNCA3Mi43NjQ3IDU5Ny4zNTEgNjUuMTA4NiA1OTcuMzUxIDYwLjQyOThWMjQuMjc1OUg2MTEuOTU1VjEwNC4wOThINTk2LjY0Mkw1NzAuNTUzIDY3LjM3NzFDNTY2LjAxNiA2MC45OTcgNTYxLjE5NSA1My42MjQ0IDU1Ni4zNzQgNDUuMjU5M0g1NTUuODA3QzU1Ni4yMzMgNTUuMDQyMiA1NTYuNTE2IDYyLjY5ODMgNTU2LjUxNiA2Ny45NDQxVjEwNC4wOThINTQxLjkxMlYyNC4yNzU5SDU1Ny4yMjVMNTgzLjU5NyA2MS40MjIzWiIgZmlsbD0iI0Y3RjBFRCIvPgo8cGF0aCBkPSJNNjIzLjU4MiAxMDQuMDk4VjI0LjI3NTlINjQ0LjcwOEM2NDYuNTUxIDI0LjI3NTkgNjQ4LjUzNiAyNC4yNzU5IDY1MC4zNzkgMjQuNDE3N0M2NTIuMzY0IDI0LjU1OTUgNjU0LjIwOCAyNC43MDEyIDY1Ni4wNTEgMjQuOTg0OEM2NTcuODk0IDI1LjI2ODMgNjU5LjU5NiAyNS41NTIgNjYxLjI5NyAyNS44MzU1QzY2Mi45OTggMjYuMTE5MSA2NjQuNTU4IDI2LjU0NDQgNjY1Ljk3NiAyNy4xMTE1QzY3MC4yMyAyOC41MjkzIDY3NC4wNTggMzAuMjMwNyA2NzcuMzE5IDMyLjY0MDlDNjgwLjU4IDM0LjkwOTQgNjgzLjI3NCAzNy43NDUgNjg1LjU0MyA0MC44NjQyQzY4Ny44MTEgNDMuOTgzMyA2ODkuMzcxIDQ3LjUyNzkgNjkwLjUwNSA1MS4zNTU5QzY5MS42MzkgNTUuMTg0IDY5Mi4yMDYgNTkuNDM3NCA2OTIuMjA2IDYzLjk3NDNDNjkyLjIwNiA2OC4yMjc3IDY5MS43ODEgNzIuMzM5NCA2OTAuNzg5IDc2LjAyNTZDNjg5Ljc5NiA3OS44NTM3IDY4OC4zNzggODMuMjU2NCA2ODYuMzkzIDg2LjM3NTZDNjg0LjQwOCA4OS40OTQ3IDY4MS45OTggOTIuMTg4NiA2NzkuMDIgOTQuNTk4OUM2NzYuMDQzIDk3LjAwOTIgNjcyLjQ5OCA5OC44NTIzIDY2OC41MjggMTAwLjQxMkM2NjUuMTI1IDEwMS42ODggNjYxLjI5NyAxMDIuNjggNjU3LjA0MyAxMDMuMjQ3QzY1Mi43OSAxMDMuOTU2IDY0Ny45NjkgMTA0LjI0IDY0Mi41ODEgMTA0LjI0SDYyMy41ODJWMTA0LjA5OFpNNjQ0LjI4MyA5MS45MDVDNjUyLjc5IDkxLjkwNSA2NTkuNTk2IDkwLjc3MDggNjY0LjQxNiA4OC4zNjA1QzY2OC42NyA4Ni4yMzM4IDY3MS45MzEgODMuMjU2NCA2NzQuMDU4IDc5LjE0NDhDNjc2LjE4NSA3NS4xNzUgNjc3LjMxOSA2OS45MjkxIDY3Ny4zMTkgNjMuNjkwN0M2NzcuMzE5IDYwLjQyOTggNjc2Ljg5NCA1Ny40NTI1IDY3Ni4xODUgNTQuOTAwNEM2NzUuNDc2IDUyLjIwNjYgNjc0LjQ4MyA0OS45MzgxIDY3My4wNjUgNDcuOTUzMkM2NzEuNjQ3IDQ1Ljk2ODMgNjcwLjA4OCA0NC4xMjUxIDY2OC4xMDMgNDIuNzA3M0M2NjYuMTE4IDQxLjI4OTUgNjYzLjk5MSA0MC4wMTM1IDY2MS41ODEgMzkuMDIxMUM2NTkuMzEyIDM4LjE3MDQgNjU2Ljc2IDM3LjQ2MTUgNjU0LjA2NiAzNy4xNzc5QzY1MS4yMyAzNi43NTI2IDY0OC4xMTEgMzYuNjEwOCA2NDQuNzA4IDM2LjYxMDhINjM4LjMyOFY5MS45MDVINjQ0LjI4M1oiIGZpbGw9IiNGN0YwRUQiLz4KPHBhdGggZD0iTTcwMC40MyAxMDQuMDk4VjI0LjI3NTlINzE1LjAzNFYxMDQuMDk4SDcwMC40M1oiIGZpbGw9IiNGN0YwRUQiLz4KPHBhdGggZD0iTTc3Mi42IDgzLjgyMzhINzQyLjU0MUw3MzQuNzQzIDEwNC4yNEg3MTkuMTQ2TDc1MC45MDcgMjQuNDE4SDc2NC4yMzVMNzk1Ljk5NSAxMDQuMjRINzgwLjU0TDc3Mi42IDgzLjgyMzhaTTc1Ny40MjkgNDMuNDE2NUM3NTQuNTkzIDUxLjc4MTUgNzUyLjE4MyA1OC43Mjg3IDc0OS45MTQgNjQuMzk5OUw3NDcuMjIgNzEuNDg4OUg3NjcuOTIxTDc2NS4yMjcgNjQuMzk5OUM3NjMuMSA1OC43Mjg3IDc2MC41NDggNTEuNzgxNSA3NTcuNzEyIDQzLjQxNjVINzU3LjQyOVoiIGZpbGw9IiNGN0YwRUQiLz4KPHBhdGggZD0iTTgxNC41NjkgMjQuMjc1OVY5MS45MDVIODUyLjAwMVYxMDQuMDk4SDc5OS45NjVWMjQuMjc1OVoiIGZpbGw9IiNGN0YwRUQiLz4KPC9zdmc+Cg==";

// ── Main App ──────────────────────────────────────────────────────────────────
function PublicApp() {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState("home");
  const [activeSurvey, setActiveSurvey] = useState(null);

  const loadData = useCallback(async function() {
    try {
      const data = await loadResponses();
      setResponses(data);
    } catch (err) {
      setResponses([]);
    }
    setLoading(false);
  }, []);

  async function loadDemoData() {
    const demo = generateDemoData();
    setResponses(demo);
  }
  async function clearData() {
    setResponses([]);
  }

  useEffect(function() { loadData(); }, [loadData]);

  const coreRR  = getScoringResponses(responses, "core");
  const fullRR  = getScoringResponses(responses, "full");
  const coreScores = computeOPRI(coreRR, CORE_DIMS);
  const fullScores = computeOPRI(fullRR, FULL_DIMS);
  const l2 = checkL2(coreScores);
  const l3 = checkL3(fullScores);
  const activeMods = DEEP_MODULES.filter(function(m) {
    var hasResponses = responses.some(function(r) { return r.survey === "deep_" + m.id; });
    return hasResponses || l3.mods.indexOf(m.id) >= 0;
  });
  const deepCounts = {};
  DEEP_MODULES.forEach(function(m) { deepCounts[m.id] = responses.filter(function(r) { return r.survey === "deep_" + m.id; }).length; });

  function handleNavigate(sec) {
    setSection(sec);
    if (sec === "survey") setActiveSurvey(null);
  }

  function renderSurvey() {
    if (!activeSurvey) {
      return <CascadeSelector coreScores={coreScores} fullScores={fullScores} deepCounts={deepCounts} onSelect={function(sv) { setActiveSurvey(sv); }} />;
    }
    if (activeSurvey.id === "core") {
      return <OPRISurvey level="core" onDone={loadData} onBack={function() { setActiveSurvey(null); }} />;
    }
    if (activeSurvey.id === "full") {
      return <OPRISurvey level="full" onDone={loadData} onBack={function() { setActiveSurvey(null); }} />;
    }
    if (activeSurvey.mod) {
      return <DeepSurvey mod={activeSurvey.mod} onDone={loadData} onBack={function() { setActiveSurvey(null); }} engagementCode={""} />;
    }
    return null;
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: CREAM, padding: 16, fontFamily: "sans-serif" }}>
        <div style={{ textAlign: "center", color: MUTED }}>
          <div style={{ fontSize: 24, marginBottom: 8, color: GREEN }}>OPRI™</div>
          <div style={{ fontSize: 13 }}>Cargando…</div>
        </div>
      </div>
    );
  }

  const hasData = responses.length > 0;

  return (
    <div style={{ fontFamily: "'Jost', sans-serif", background: CREAM, minHeight: "100vh", maxWidth: 860, margin: "0 auto", width: "100%" }}>
      <style>{"@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Jost:wght@400;500;600;700&display=swap');*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}html,body{overflow-x:hidden;width:100%;max-width:100vw}body{overflow-x:hidden}.rg-1col{display:grid;grid-template-columns:1fr}.rg-2col{display:grid;grid-template-columns:1fr 1fr;gap:12px}.rg-3col{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}.rg-auto1fr{display:grid;grid-template-columns:auto 1fr;gap:24px;align-items:start}@media(max-width:600px){.rg-2col{grid-template-columns:1fr!important}.rg-3col{grid-template-columns:1fr!important}.rg-auto1fr{grid-template-columns:1fr!important}.hide-mobile{display:none!important}.px-mobile{padding-left:12px!important;padding-right:12px!important}.text-sm-mobile{font-size:11px!important}.flex-col-mobile{flex-direction:column!important;align-items:flex-start!important}.w-full-mobile{width:100%!important}.gap-mobile{gap:8px!important}}@media(max-width:400px){.rg-2col{grid-template-columns:1fr!important}.rg-3col{grid-template-columns:1fr!important}}"}</style>

      <div style={{ background: GREEN, padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, borderBottom: "2px solid " + GOLD, flexWrap: "wrap", gap: 6 }}>
        <div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: WHITE, fontWeight: 600, lineHeight: 1 }}>OPRI™</div>
          <div style={{ fontSize: 9, color: GOLD, textTransform: "uppercase", letterSpacing: "0.1em" }}>Enterprise Edition · Promundial</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {coreScores && (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 19, color: WHITE }}>{coreScores.opri.toFixed(2)}</div>
              <div style={{ fontSize: 9, color: getMaturity(coreScores.opri).color, fontWeight: 700, textTransform: "uppercase" }}>{getMaturity(coreScores.opri).es}</div>
            </div>
          )}
          <button onClick={function() { window.location.href = "/admin"; }} style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 7, color: WHITE, fontSize: 11, padding: "6px 12px", cursor: "pointer", fontFamily: "inherit" }}>Admin →</button>
        </div>
      </div>

      <div style={{ background: WHITE, borderBottom: "1px solid " + CREAM_DK, display: "flex", overflowX: "auto" }}>
        {[{ id: "home", icon: "⌂", label: "Inicio" }, { id: "survey", icon: "✎", label: "Diagnóstico" }, { id: "results", icon: "◈", label: "Resultados" }].map(function(t) {
          return (
            <button key={t.id} onClick={function() { handleNavigate(t.id); }} style={{ flex: 1, padding: "11px 4px", border: "none", background: "transparent", borderBottom: section === t.id ? "3px solid " + GOLD : "3px solid transparent", color: section === t.id ? GREEN : MUTED, fontSize: 11, fontWeight: section === t.id ? 700 : 500, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, fontFamily: "inherit" }}>
              <span style={{ fontSize: 14 }}>{t.icon}</span>
              {t.label}
            </button>
          );
        })}
      </div>

      {section === "home" && (
        <HomeScreen responses={responses} coreScores={coreScores} fullScores={fullScores} l2={l2} l3={l3} activeMods={activeMods} deepCounts={deepCounts} onNavigate={handleNavigate} onLoadDemo={loadDemoData} onClearData={clearData} />
      )}
      {section === "survey" && renderSurvey()}
      {section === "results" && (
        <ResultsPanel responses={responses} coreScores={coreScores} fullScores={fullScores} l2={l2} l3={l3} activeMods={activeMods} />
      )}

      <div style={{ padding: "12px", textAlign: "center", borderTop: "1px solid " + CREAM_DK, marginTop: 16 }}>
        <span style={{ fontSize: 9, color: MUTED_LT, letterSpacing: "0.08em" }}>{"OPRI™ ENTERPRISE EDITION · PROMUNDIAL CONSULTING GROUP · " + new Date().getFullYear()}</span>
      </div>
    </div>
  );
}

function AdminApp() {
  const [adminPassword, setAdminPassword] = useState(null);
  if (!adminPassword) return <AdminLogin onAuth={setAdminPassword} />;
  return <AdminPanel password={adminPassword} onExit={function() { setAdminPassword(null); }} />;
}

export default function App() {
  const path = typeof window !== "undefined" ? window.location.pathname : "/";
  const engCode = (function() { const m = path.match(/^\/e\/([a-z0-9]+)$/); return m ? m[1] : null; })();
  if (engCode) return <EngagementSurveyPage code={engCode} />;
  if (path === "/admin") return <AdminApp />;
  return <PublicApp />;
}
