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

// OPRI™ ENTERPRISE — PREGUNTAS ACTUALIZADAS v2.0
//
// hasta el cierre de DEEP_MODULES (el "];" después del módulo CEI™)

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

const FULL_DIMS = CORE_DIMS.map(d => ({
  ...d,
  questions: [...d.questions, ...EXTRA_Q[d.id]],
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
  const canStart = meta.level && meta.company;
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
          <label style={s.label}>Nombre (opcional)</label>
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
  const dims = isCore ? CORE_DIMS : FULL_DIMS;
  const allQs = [];
  dims.forEach(function(d) { d.questions.forEach(function(q) { allQs.push(q); }); });

  var storedMeta = loadSavedMeta();
  var initialMeta = isCore ? (savedProgress && savedProgress.meta ? savedProgress.meta : null) : (inheritedMeta || storedMeta || (savedProgress && savedProgress.meta) || null);
  var initialDimIdx = (savedProgress && savedProgress.dimIdx != null && savedProgress.dimIdx < (isCore ? CORE_DIMS : FULL_DIMS).length) ? savedProgress.dimIdx : 0;
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
    if (onClearProgress) onClearProgress();
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

  useEffect(function() {
    if (meta && onProgress) onProgress({ meta: meta, dimIdx: dimIdx, answers: answers });
  }, [answers, dimIdx]);

  if (done) {
    return <DoneScreen title={isCore ? "OPRI Core 25" : "OPRI Full 60"} color={GREEN} onBack={onBack} onNew={function() { clearSavedMeta(); setMeta(null); setDimIdx(0); setAnswers({}); setDone(false); }} />;
  }
  if (!meta) {
    return <MetaForm title={isCore ? "OPRI Core 25" : "OPRI Full 60"} subtitle={isCore ? "25 preguntas · ~8 min" : "60 preguntas · ~18 min"} onStart={handleStart} presetCompany={presetCompany} />;
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
        <SurveyCard level="Level 2" badge="Bloqueado" label="OPRI Full 60" desc="Requiere OPRI Core primero" color={GREEN_MID} status="locked" lockMsg="Complete el OPRI Core 25 para desbloquear este nivel." />
      )}
      {nCore > 0 && (
        <SurveyCard level="Level 2" badge={nFull > 0 ? nFull + " resp." : "Siguiente paso"} label="OPRI Full 60" desc="60 preguntas · ~18 min" color={GREEN_MID} status="activated" triggers={[]} onClick={function() { onSelect({ id: "full" }); }} />
      )}

      {nFull === 0 && nCore > 0 && (
        <div style={{ padding: "11px 13px", background: CREAM_DK, borderRadius: 8, fontSize: 12, color: MUTED, marginTop: 4 }}>
          Los módulos Deep Dive se calcularán una vez completado el OPRI Full 60.
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
  const rr = responses.filter(function(r) { return r.survey === tag; });
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
  const rr = responses.filter(function(r) { return r.survey === tag; });
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
  const rr = responses.filter(function(r) { return r.survey === tag; });
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

// ── Results Panel ─────────────────────────────────────────────────────────────
function ResultsPanel({ responses, engagement }) {
  const [tab, setTab] = useState("core");
  const tabs = [
    { id: "core", label: "Core" },
    { id: "full", label: "Full 60" },
    { id: "pai_core", label: "PAI Core" },
    { id: "pai_full", label: "PAI Full" },
    { id: "heat_core", label: "Heat Core" },
    { id: "heat_full", label: "Heat Full" },
    ...DEEP_MODULES.map(function(m) { return { id: "deep_" + m.id, label: m.code }; }),
  ];
  return (
    <div>
      <div style={{ display: "flex", overflowX: "auto", gap: 2, padding: "8px 14px 0", background: WHITE, borderBottom: "1px solid " + CREAM_DK }}>
        {tabs.map(function(t) {
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={function() { setTab(t.id); }} style={{ padding: "7px 12px", borderRadius: "7px 7px 0 0", border: "none", background: active ? GREEN : "transparent", color: active ? WHITE : MUTED, fontSize: 11, fontWeight: active ? 700 : 400, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
              {t.label}
            </button>
          );
        })}
      </div>
      {tab === "core" && <OPRIDash tag="core" title="OPRI Core 25" dims={CORE_DIMS} responses={responses} />}
      {tab === "full" && <OPRIDash tag="full" title="OPRI Full 60" dims={FULL_DIMS} responses={responses} />}
      {tab === "pai_core" && <PAIDash tag="core" title="Core 25" dims={CORE_DIMS} responses={responses} />}
      {tab === "pai_full" && <PAIDash tag="full" title="Full 60" dims={FULL_DIMS} responses={responses} />}
      {tab === "heat_core" && <HeatView tag="core" dims={CORE_DIMS} responses={responses} />}
      {tab === "heat_full" && <HeatView tag="full" dims={FULL_DIMS} responses={responses} />}
      {DEEP_MODULES.map(function(m) {
        if (tab !== "deep_" + m.id) return null;
        return <DeepDash key={m.id} mod={m} responses={responses} />;
      })}
    </div>
  );
}

// ── Admin ─────────────────────────────────────────────────────────────────────
function AdminLogin({ onLogin }) {
  const [pw, setPw] = useState(() => { try { return localStorage.getItem(ADMIN_PASS_KEY) || ""; } catch (e) { return ""; } });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function tryLogin() {
    setLoading(true);
    setError("");
    const engs = await apiLoadEngagements(pw);
    if (engs !== null) {
      try { localStorage.setItem(ADMIN_PASS_KEY, pw); } catch (e) {}
      onLogin(pw);
    } else {
      setError("Contraseña incorrecta o error de conexión.");
    }
    setLoading(false);
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 360, padding: 28, gap: 14 }}>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: GREEN }}>OPRI™ Admin</div>
      <div style={{ width: "100%", maxWidth: 320 }}>
        <label style={s.label}>Contraseña</label>
        <input type="password" value={pw} onChange={function(e) { setPw(e.target.value); }} placeholder="••••••••" style={s.input} onKeyDown={function(e) { if (e.key === "Enter") tryLogin(); }} />
      </div>
      {error && <div style={{ fontSize: 12, color: RED }}>{error}</div>}
      <button disabled={!pw || loading} onClick={tryLogin} style={btn(GREEN, !pw || loading)}>{loading ? "Verificando…" : "Ingresar"}</button>
    </div>
  );
}

function EngCard({ eng, onSelect, onClose }) {
  const isOpen = eng.status === "open" || eng.status === "active";
  const respCount = eng.respCount || 0;
  return (
    <div style={{ border: "1px solid " + CREAM_DK, borderRadius: 10, padding: "13px 14px", background: WHITE, marginBottom: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 5 }}>
        <div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, color: GREEN, fontWeight: 600 }}>{eng.company || "—"}</div>
          <div style={{ fontSize: 10, color: MUTED, marginTop: 1 }}>Código: <code style={{ background: CREAM, padding: "1px 4px", borderRadius: 3 }}>{eng.code}</code></div>
        </div>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 99, background: isOpen ? GREEN_LT + "22" : CREAM_DK, color: isOpen ? GREEN : MUTED, fontWeight: 600, textTransform: "uppercase" }}>{eng.status}</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, fontSize: 11, color: MUTED, marginBottom: 9 }}>
        <span>{"Resp: " + respCount}</span>
        {eng.startDate && <span>{"Inicio: " + eng.startDate}</span>}
        {eng.endDate && <span>{"Cierre: " + eng.endDate}</span>}
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <button onClick={function() { onSelect(eng, "results"); }} style={btn(GREEN, false)}>Ver Resultados</button>
        <button onClick={function() { onSelect(eng, "survey"); }} style={btn(GREEN_MID, false)}>Aplicar</button>
        {isOpen && onClose && <button onClick={function() { onClose(eng); }} style={btn(RED, false)}>Cerrar</button>}
      </div>
    </div>
  );
}

function AdminPanel({ pw, onLogout }) {
  const [engagements, setEngagements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newEng, setNewEng] = useState({ company: "", startDate: "", endDate: "" });
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState("list");
  const [responses, setResponses] = useState([]);
  const [loadingResp, setLoadingResp] = useState(false);
  const [genReport, setGenReport] = useState(false);

  useEffect(function() { refresh(); }, []);

  async function refresh() {
    setLoading(true);
    const engs = await apiLoadEngagements(pw);
    if (engs) {
      for (var i = 0; i < engs.length; i++) {
        const rr = await loadResponses(engs[i].code);
        engs[i].respCount = rr.length;
      }
      setEngagements(engs);
    }
    setLoading(false);
  }

  async function create() {
    setCreating(true);
    const code = (newEng.company || "eng").slice(0, 6).toLowerCase().replace(/[^a-z0-9]/g, "") + Math.random().toString(36).slice(2, 6);
    await apiCreateEngagement(pw, { company: newEng.company, startDate: newEng.startDate, endDate: newEng.endDate, code: code, status: "open" });
    setNewEng({ company: "", startDate: "", endDate: "" });
    setCreating(false);
    refresh();
  }

  async function closeEng(eng) {
    if (!window.confirm("¿Cerrar " + eng.company + "?")) return;
    await apiUpdateEngagement(pw, { id: eng.id, status: "closed" });
    refresh();
  }

  async function selectEng(eng, viewType) {
    setSelected(eng);
    setView(viewType);
    if (viewType === "results") {
      setLoadingResp(true);
      const rr = await loadResponses(eng.code);
      setResponses(rr);
      setLoadingResp(false);
    }
  }

  if (view === "results" && selected) {
    return (
      <div>
        <div style={{ background: "linear-gradient(135deg, " + GREEN + ", " + GREEN_MID + ")", padding: "14px 16px", borderBottom: "3px solid " + GOLD, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 9, color: GOLD, textTransform: "uppercase", letterSpacing: "0.1em" }}>OPRI™ Admin — Resultados</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 17, color: WHITE }}>{selected.company}</div>
          </div>
          <button onClick={function() { setView("list"); setSelected(null); }} style={btn(GREEN_MID, false)}>← Volver</button>
        </div>
        {loadingResp ? (
          <div style={{ padding: 40, textAlign: "center", color: MUTED }}>Cargando…</div>
        ) : (
          <ResultsPanel responses={responses} engagement={selected} />
        )}
      </div>
    );
  }

  if (view === "survey" && selected) {
    return <EngagementSurveyPage engCode={selected.code} company={selected.company} onBack={function() { setView("list"); }} />;
  }

  return (
    <div>
      <div style={{ background: "linear-gradient(135deg, " + GREEN + ", " + GREEN_MID + ")", padding: "14px 16px", borderBottom: "3px solid " + GOLD, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 9, color: GOLD, textTransform: "uppercase", letterSpacing: "0.1em" }}>OPRI™ Enterprise</div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 17, color: WHITE }}>Panel de Administración</div>
        </div>
        <button onClick={onLogout} style={btn(GREEN_MID, false)}>Salir</button>
      </div>
      <div style={{ padding: "16px", maxWidth: 580, margin: "0 auto" }}>
        <SectionHeader title="Nuevo Engagement" />
        <div style={{ background: WHITE, borderRadius: 10, padding: "13px", border: "1px solid " + CREAM_DK, marginBottom: 16 }}>
          <div style={{ marginBottom: 10 }}>
            <label style={s.label}>Empresa</label>
            <input value={newEng.company} onChange={function(e) { setNewEng(function(p) { return Object.assign({}, p, { company: e.target.value }); }); }} placeholder="Nombre del cliente" style={s.input} />
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={s.label}>Inicio</label>
              <input type="date" value={newEng.startDate} onChange={function(e) { setNewEng(function(p) { return Object.assign({}, p, { startDate: e.target.value }); }); }} style={s.input} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={s.label}>Cierre</label>
              <input type="date" value={newEng.endDate} onChange={function(e) { setNewEng(function(p) { return Object.assign({}, p, { endDate: e.target.value }); }); }} style={s.input} />
            </div>
          </div>
          <button disabled={!newEng.company || creating} onClick={create} style={btn(GREEN, !newEng.company || creating)}>{creating ? "Creando…" : "Crear Engagement"}</button>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <SectionHeader title={"Engagements (" + engagements.length + ")"} />
          <button onClick={refresh} style={btn(GREEN_MID, false)}>↻ Actualizar</button>
        </div>
        {loading ? (
          <div style={{ padding: 30, textAlign: "center", color: MUTED }}>Cargando…</div>
        ) : engagements.length === 0 ? (
          <div style={{ padding: 30, textAlign: "center", color: MUTED_LT }}>No hay engagements aún.</div>
        ) : (
          engagements.map(function(eng) {
            return <EngCard key={eng.id} eng={eng} onSelect={selectEng} onClose={closeEng} />;
          })
        )}
      </div>
    </div>
  );
}

// ── Respondent views ──────────────────────────────────────────────────────────
function RespondentLogin({ engData, onLogin }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  function tryLogin() {
    if (pw === RESPONDENT_PASS || pw === (engData.password || RESPONDENT_PASS)) {
      onLogin();
    } else {
      setError("Contraseña incorrecta.");
    }
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 340, padding: 28, gap: 14 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: GREEN }}>{engData.company}</div>
        <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>Diagnóstico Organizacional OPRI™</div>
      </div>
      <div style={{ width: "100%", maxWidth: 300 }}>
        <label style={s.label}>Código de acceso</label>
        <input type="password" value={pw} onChange={function(e) { setPw(e.target.value); }} placeholder="••••••••" style={s.input} onKeyDown={function(e) { if (e.key === "Enter") tryLogin(); }} />
      </div>
      {error && <div style={{ fontSize: 12, color: RED }}>{error}</div>}
      <button disabled={!pw} onClick={tryLogin} style={btn(GREEN, !pw)}>Acceder →</button>
    </div>
  );
}

function WelcomeScreen({ engData }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 300, padding: 24, gap: 10, textAlign: "center" }}>
      <div style={{ fontSize: 32, color: GREEN }}>✓</div>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: GREEN }}>Bienvenido/a</div>
      <div style={{ fontSize: 13, color: MUTED, maxWidth: 260 }}>{"Diagnóstico " + engData.company + " · OPRI™"}</div>
      <div style={{ fontSize: 12, color: MUTED_LT, marginTop: 4 }}>Seleccione un módulo para comenzar.</div>
    </div>
  );
}

// ── Engagement Survey Page ────────────────────────────────────────────────────
function EngagementSurveyPage({ engCode, company, onBack }) {
  const [responses, setResponses] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [survey, setSurvey] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [savedMeta, setSavedMeta] = useState(null);
  const [progress, setProgress] = useState({});
  const [completedSurveys, setCompletedSurveys] = useState(loadCompletedSurveys);
  const [engData, setEngData] = useState({ company: company || engCode, password: RESPONDENT_PASS });

  useEffect(function() {
    async function init() {
      const stored = loadSavedMeta();
      if (stored) setSavedMeta(stored);
      const compl = loadCompletedSurveys();
      setCompletedSurveys(compl);
      const rr = await loadResponses(engCode);
      setResponses(rr);
      setLoaded(true);
    }
    init();
  }, []);

  if (!loaded) return <div style={{ padding: 40, textAlign: "center", color: MUTED }}>Cargando…</div>;

  if (!authenticated) {
    return <RespondentLogin engData={engData} onLogin={function() { setAuthenticated(true); }} />;
  }

  const coreResponses = responses.filter(function(r) { return r.survey === "core"; });
  const fullResponses = responses.filter(function(r) { return r.survey === "full"; });
  const coreScores = coreResponses.length > 0 ? computeOPRI(coreResponses, CORE_DIMS) : null;
  const fullScores = fullResponses.length > 0 ? computeOPRI(fullResponses, FULL_DIMS) : null;

  const deepCounts = {};
  DEEP_MODULES.forEach(function(m) {
    deepCounts[m.id] = responses.filter(function(r) { return r.survey === "deep_" + m.id; }).length;
  });

  function handleProgress(surveyId, data) {
    setProgress(function(p) { const n = Object.assign({}, p); n[surveyId] = data; return n; });
  }

  function handleClearProgress(surveyId) {
    setProgress(function(p) { const n = Object.assign({}, p); delete n[surveyId]; return n; });
  }

  function handleSurveyDone(surveyId) {
    const compl = loadCompletedSurveys();
    if (compl.indexOf(surveyId) < 0) {
      compl.push(surveyId);
      try { localStorage.setItem(DONE_KEY, JSON.stringify(compl)); } catch (e) {}
      setCompletedSurveys(compl);
    }
    loadResponses(engCode).then(function(rr) { setResponses(rr); });
  }

  if (survey) {
    const isSurveyDone = completedSurveys.indexOf(survey.id) >= 0;
    if (survey.id === "core") {
      return <OPRISurvey level="core" onDone={function() { setSurvey(null); }} onBack={function() { setSurvey(null); }} engagementCode={engCode} presetCompany={company} inheritedMeta={savedMeta} onMetaSaved={function(m) { setSavedMeta(m); }} onSurveyDone={function(id) { handleSurveyDone(id); }} savedProgress={progress.core} onProgress={function(d) { handleProgress("core", d); }} onClearProgress={function() { handleClearProgress("core"); }} onLogout={function() { setSurvey(null); }} />;
    }
    if (survey.id === "full") {
      return <OPRISurvey level="full" onDone={function() { setSurvey(null); }} onBack={function() { setSurvey(null); }} engagementCode={engCode} presetCompany={company} inheritedMeta={savedMeta} onMetaSaved={function(m) { setSavedMeta(m); }} onSurveyDone={function(id) { handleSurveyDone(id); }} savedProgress={progress.full} onProgress={function(d) { handleProgress("full", d); }} onClearProgress={function() { handleClearProgress("full"); }} onLogout={function() { setSurvey(null); }} />;
    }
    if (survey.id && survey.id.startsWith("deep_")) {
      const modId = survey.id.replace("deep_", "");
      const mod = DEEP_MODULES.find(function(m) { return m.id === modId; });
      if (mod) {
        return <DeepSurvey mod={mod} onDone={function() { setSurvey(null); }} onBack={function() { setSurvey(null); }} engagementCode={engCode} inheritedMeta={savedMeta} onSurveyDone={function(id) { handleSurveyDone(id); }} savedProgress={progress[survey.id]} onProgress={function(d) { handleProgress(survey.id, d); }} onClearProgress={function() { handleClearProgress(survey.id); }} onLogout={function() { setSurvey(null); }} />;
      }
    }
  }

  return (
    <div>
      <SurveyHeader title={company || engCode} sub="OPRI™ Enterprise · Diagnóstico Organizacional" />
      <WelcomeScreen engData={engData} />
      <CascadeSelector coreScores={coreScores} fullScores={fullScores} deepCounts={deepCounts} onSelect={function(sel) { setSurvey(sel); }} />
      {onBack && (
        <div style={{ padding: "0 14px 20px", maxWidth: 560, margin: "0 auto" }}>
          <button onClick={onBack} style={btn(MUTED, false)}>← Volver al Admin</button>
        </div>
      )}
    </div>
  );
}

// ── Public & Admin Apps ───────────────────────────────────────────────────────
function PublicApp() {
  const params = new URLSearchParams(window.location.search);
  const engCode = params.get("e") || params.get("engagement") || "";
  const [engData, setEngData] = useState(null);
  const [loading, setLoading] = useState(!!engCode);

  useEffect(function() {
    if (!engCode) { setLoading(false); return; }
    apiGetEngagement(engCode).then(function(data) {
      setEngData(data);
      setLoading(false);
    });
  }, [engCode]);

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: MUTED }}>Cargando…</div>;

  if (!engCode || !engData) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, padding: 28, gap: 12, textAlign: "center" }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: GREEN }}>OPRI™ Enterprise</div>
        <div style={{ fontSize: 13, color: MUTED, maxWidth: 280 }}>Ingrese el código de engagement proporcionado por Promundial.</div>
        <EngCodeEntry />
      </div>
    );
  }

  return <EngagementSurveyPage engCode={engCode} company={engData.company} />;
}

function EngCodeEntry() {
  const [code, setCode] = useState("");
  function go() {
    if (code.trim()) window.location.search = "?e=" + code.trim().toLowerCase();
  }
  return (
    <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
      <input value={code} onChange={function(e) { setCode(e.target.value); }} placeholder="Código de acceso" style={Object.assign({}, s.input, { width: 180 })} onKeyDown={function(e) { if (e.key === "Enter") go(); }} />
      <button disabled={!code.trim()} onClick={go} style={btn(GREEN, !code.trim())}>→</button>
    </div>
  );
}

function AdminApp() {
  const [pw, setPw] = useState(function() { try { return localStorage.getItem(ADMIN_PASS_KEY) || ""; } catch (e) { return ""; } });
  const [ready, setReady] = useState(false);

  useEffect(function() {
    if (pw) {
      apiLoadEngagements(pw).then(function(engs) {
        if (engs !== null) setReady(true);
      });
    }
  }, []);

  if (!pw || !ready) return <AdminLogin onLogin={function(p) { setPw(p); setReady(true); }} />;
  return <AdminPanel pw={pw} onLogout={function() { setPw(""); setReady(false); try { localStorage.removeItem(ADMIN_PASS_KEY); } catch (e) {} }} />;
}

// ── Root App ──────────────────────────────────────────────────────────────────
export default function App() {
  const isAdmin = window.location.pathname.includes("/admin");
  return (
    <div style={{ fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif", background: CREAM, minHeight: "100vh" }}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      {isAdmin ? <AdminApp /> : <PublicApp />}
    </div>
  );
}
