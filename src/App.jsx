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

  // Restore from saved progress or use inheritedMeta
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
          Compara el score de cada persona en el Core 25 vs las preguntas adicionales del Full 60 por dimensión.
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
  const fCoreRR = filteredResponses.filter(function(r) { return r.survey === "core"; });
  const fFullRR = filteredResponses.filter(function(r) { return r.survey === "full"; });
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
    if (activeTab === "full_opri") return <OPRIDash tag="full" title="OPRI Full 60" dims={FULL_DIMS} responses={filteredResponses} />;
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
        <StepRow label="Level 2" desc="OPRI Full 60" n={fullN} score={fullScores ? fullScores.opri : null} color={GREEN_MID} status={stepStatus("full")}
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
    const coreRR = engResponses.filter(function(r) { return r.survey === "core"; });
    const fullRR = engResponses.filter(function(r) { return r.survey === "full"; });
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
      const resp = await fetch("/api/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          engagement_code: eng.code,
          company: eng.company,
          consultant: eng.consultant || "Promundial",
          close_date: eng.close_date || "",
        }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || "Error " + resp.status);
      }
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "OPRI_Report_" + (eng.company || "Reporte").replace(/[^a-zA-Z0-9]/g, "_") + ".pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
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
            { level: "Level 2", name: "OPRI Full 60", time: "+10 min", desc: "Lo completan todos los participantes después del Core.", color: GREEN_MID, always: true },
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
            Tiempo total estimado: <strong style={{ color: CHARCOAL }}>entre 8 y 30 minutos</strong>, según los niveles que se activen para usted.
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

  const coreRR = responses.filter(function(r) { return r.survey === "core"; });
  const fullRR = responses.filter(function(r) { return r.survey === "full"; });
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

      // Use ONLY this respondent's OWN scores to determine Deep Dive activation.
      // If their individual score on any dimension is below threshold, they get Deep Dive
      // regardless of the group average.
      var myMeta = loadSavedMeta();
      var myResponses = myMeta ? responses.filter(function(r) {
        if (!r.meta) return false;
        var nameMatch = !myMeta.name || !r.meta.name || r.meta.name === myMeta.name;
        var levelMatch = r.meta.level === myMeta.level;
        var areaMatch = r.meta.area === myMeta.area;
        return levelMatch && areaMatch && nameMatch;
      }) : [];
      var myCoreRR = myResponses.filter(function(r) { return r.survey === "core"; });
      var myFullRR = myResponses.filter(function(r) { return r.survey === "full"; });
      var myCoreScores = myCoreRR.length > 0 ? computeOPRI(myCoreRR, CORE_DIMS) : coreScores;
      var myFullScores = myFullRR.length > 0 ? computeOPRI(myFullRR, FULL_DIMS) : fullScores;
      const myL2 = coreDone ? checkL2(myCoreScores) : { active: false, reasons: [] };
      const myL3 = fullDone ? checkL3(myFullScores) : { mods: [], fdd: false, reasons: [] };
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
            <SurveyCard level="Level 2" badge={fullDone ? "✓ Completado" : "Siguiente paso"} label="OPRI Full 60" desc="60 preguntas · ~18 min" color={GREEN_MID} status={fullDone ? "done" : "activated"} triggers={[]} onClick={fullDone ? undefined : function() { setActiveSurvey({ id: "full" }); }} />
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
// LogiPro 3PL S.A. · 80 respondentes · Perfil mixto
// OPRI Core: 2.97 · Liderazgo: 2.36 (Crítico) · Cultura: 2.30 (Crítico) · Ejecución: 3.62 (Estable)
function generateDemoData() {
  return [
  {
    "id": "DEMO_Com_000_core",
    "timestamp": "2026-07-17T07:55:39.745656",
    "survey": "core",
    "meta": {
      "name": "Carlos Mendoza",
      "level": "Comité Ejecutivo",
      "area": "Almacenamiento",
      "country": "Nicaragua",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 5,
      "A2": 3,
      "A3": 3,
      "A4": 4,
      "A5": 4,
      "E1": 5,
      "E2": 4,
      "E3": 4,
      "E4": 5,
      "E5": 5,
      "E6": 4,
      "E7": 4,
      "L1": 2,
      "L2": 3,
      "L3": 2,
      "L4": 2,
      "L5": 2,
      "L6": 3,
      "R1": 4,
      "R2": 5,
      "R3": 5,
      "R4": 5,
      "C1": 1,
      "C2": 2,
      "C3": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Com_000_full",
    "timestamp": "2026-07-17T07:55:39.745656",
    "survey": "full",
    "meta": {
      "name": "Carlos Mendoza",
      "level": "Comité Ejecutivo",
      "area": "Almacenamiento",
      "country": "Nicaragua",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 5,
      "A2": 3,
      "A3": 3,
      "A4": 4,
      "A5": 4,
      "E1": 5,
      "E2": 4,
      "E3": 4,
      "E4": 5,
      "E5": 5,
      "E6": 4,
      "E7": 4,
      "L1": 2,
      "L2": 3,
      "L3": 2,
      "L4": 2,
      "L5": 2,
      "L6": 3,
      "R1": 4,
      "R2": 5,
      "R3": 5,
      "R4": 5,
      "C1": 1,
      "C2": 2,
      "C3": 1,
      "SA6": 4,
      "SA7": 3,
      "SA8": 4,
      "SA9": 3,
      "SA10": 3,
      "SA11": 3,
      "SA12": 4,
      "EX8": 5,
      "EX9": 4,
      "EX10": 5,
      "EX11": 5,
      "EX12": 5,
      "EX13": 4,
      "EX14": 5,
      "EX15": 4,
      "EX16": 5,
      "EX17": 5,
      "EX18": 5,
      "LE7": 4,
      "LE8": 4,
      "LE9": 4,
      "LE10": 4,
      "LE11": 4,
      "LE12": 3,
      "LE13": 5,
      "LE14": 4,
      "LE15": 3,
      "RC5": 2,
      "RC6": 3,
      "RC7": 3,
      "RC8": 4,
      "RC9": 3,
      "OC4": 3,
      "OC5": 4,
      "OC6": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Com_000_deep_lei",
    "timestamp": "2026-07-17T08:25:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Carlos Mendoza",
      "level": "Comité Ejecutivo",
      "area": "Almacenamiento",
      "country": "Nicaragua",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 3,
      "LD2": 2,
      "LD3": 3,
      "LD4": 3,
      "LD5": 3,
      "LD6": 3,
      "LD7": 4,
      "LD8": 3,
      "LD9": 3,
      "LD10": 5,
      "LD11": 3,
      "LD12": 3,
      "LD13": 3,
      "LD14": 3,
      "LD15": 3,
      "LD16": 3,
      "LD17": 2,
      "LD18": 4,
      "LD19": 1,
      "LD20": 1,
      "LD21": 1,
      "LD22": 2,
      "LD23": 2,
      "LD24": 3,
      "LD25": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Com_000_deep_tcs",
    "timestamp": "2026-07-17T08:25:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Carlos Mendoza",
      "level": "Comité Ejecutivo",
      "area": "Almacenamiento",
      "country": "Nicaragua",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 2,
      "LT2": 3,
      "LT3": 4,
      "LT4": 3,
      "LT5": 3,
      "LT6": 3,
      "LT7": 4,
      "LT8": 4,
      "LT9": 4,
      "LT10": 3,
      "LT11": 3,
      "LT12": 2,
      "LT13": 3,
      "LT14": 3,
      "LT15": 3,
      "LT16": 4,
      "LT17": 3,
      "LT18": 3,
      "LT19": 4,
      "LT20": 3,
      "LT21": 3,
      "LT22": 3,
      "LT23": 3,
      "LT24": 3,
      "LT25": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Com_000_deep_cei",
    "timestamp": "2026-07-17T08:25:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Carlos Mendoza",
      "level": "Comité Ejecutivo",
      "area": "Almacenamiento",
      "country": "Nicaragua",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 3,
      "CU2": 3,
      "CU3": 3,
      "CU4": 3,
      "CU5": 3,
      "CU6": 4,
      "CU7": 2,
      "CU8": 2,
      "CU9": 4,
      "CU10": 2,
      "CU11": 2,
      "CU12": 2,
      "CU13": 3,
      "CU14": 2,
      "CU15": 2,
      "CU16": 3,
      "CU17": 2,
      "CU18": 2,
      "CU19": 3,
      "CU20": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Com_001_core",
    "timestamp": "2026-07-18T02:16:39.745656",
    "survey": "core",
    "meta": {
      "name": "Ana Rodríguez",
      "level": "Comité Ejecutivo",
      "area": "Almacenamiento",
      "country": "Guatemala",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 3,
      "A2": 5,
      "A3": 5,
      "A4": 3,
      "A5": 3,
      "E1": 3,
      "E2": 4,
      "E3": 5,
      "E4": 4,
      "E5": 5,
      "E6": 3,
      "E7": 5,
      "L1": 1,
      "L2": 3,
      "L3": 3,
      "L4": 2,
      "L5": 3,
      "L6": 2,
      "R1": 3,
      "R2": 4,
      "R3": 4,
      "R4": 4,
      "C1": 3,
      "C2": 4,
      "C3": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Com_001_full",
    "timestamp": "2026-07-18T02:16:39.745656",
    "survey": "full",
    "meta": {
      "name": "Ana Rodríguez",
      "level": "Comité Ejecutivo",
      "area": "Almacenamiento",
      "country": "Guatemala",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 3,
      "A2": 5,
      "A3": 5,
      "A4": 3,
      "A5": 3,
      "E1": 3,
      "E2": 4,
      "E3": 5,
      "E4": 4,
      "E5": 5,
      "E6": 3,
      "E7": 5,
      "L1": 1,
      "L2": 3,
      "L3": 3,
      "L4": 2,
      "L5": 3,
      "L6": 2,
      "R1": 3,
      "R2": 4,
      "R3": 4,
      "R4": 4,
      "C1": 3,
      "C2": 4,
      "C3": 3,
      "SA6": 5,
      "SA7": 5,
      "SA8": 4,
      "SA9": 5,
      "SA10": 5,
      "SA11": 5,
      "SA12": 5,
      "EX8": 5,
      "EX9": 5,
      "EX10": 5,
      "EX11": 5,
      "EX12": 4,
      "EX13": 4,
      "EX14": 4,
      "EX15": 3,
      "EX16": 5,
      "EX17": 5,
      "EX18": 4,
      "LE7": 3,
      "LE8": 3,
      "LE9": 5,
      "LE10": 2,
      "LE11": 3,
      "LE12": 3,
      "LE13": 3,
      "LE14": 3,
      "LE15": 3,
      "RC5": 3,
      "RC6": 4,
      "RC7": 4,
      "RC8": 4,
      "RC9": 4,
      "OC4": 2,
      "OC5": 4,
      "OC6": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Com_001_deep_lei",
    "timestamp": "2026-07-18T02:46:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Ana Rodríguez",
      "level": "Comité Ejecutivo",
      "area": "Almacenamiento",
      "country": "Guatemala",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 4,
      "LD2": 3,
      "LD3": 3,
      "LD4": 2,
      "LD5": 3,
      "LD6": 2,
      "LD7": 3,
      "LD8": 2,
      "LD9": 3,
      "LD10": 3,
      "LD11": 3,
      "LD12": 3,
      "LD13": 1,
      "LD14": 1,
      "LD15": 1,
      "LD16": 3,
      "LD17": 4,
      "LD18": 3,
      "LD19": 3,
      "LD20": 4,
      "LD21": 4,
      "LD22": 2,
      "LD23": 3,
      "LD24": 3,
      "LD25": 4
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Com_001_deep_tcs",
    "timestamp": "2026-07-18T02:46:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Ana Rodríguez",
      "level": "Comité Ejecutivo",
      "area": "Almacenamiento",
      "country": "Guatemala",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 3,
      "LT2": 4,
      "LT3": 3,
      "LT4": 3,
      "LT5": 3,
      "LT6": 3,
      "LT7": 2,
      "LT8": 2,
      "LT9": 3,
      "LT10": 4,
      "LT11": 4,
      "LT12": 5,
      "LT13": 3,
      "LT14": 3,
      "LT15": 2,
      "LT16": 3,
      "LT17": 2,
      "LT18": 3,
      "LT19": 3,
      "LT20": 4,
      "LT21": 4,
      "LT22": 4,
      "LT23": 2,
      "LT24": 2,
      "LT25": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Com_001_deep_cei",
    "timestamp": "2026-07-18T02:46:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Ana Rodríguez",
      "level": "Comité Ejecutivo",
      "area": "Almacenamiento",
      "country": "Guatemala",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 2,
      "CU2": 3,
      "CU3": 3,
      "CU4": 3,
      "CU5": 4,
      "CU6": 3,
      "CU7": 3,
      "CU8": 3,
      "CU9": 3,
      "CU10": 3,
      "CU11": 3,
      "CU12": 3,
      "CU13": 3,
      "CU14": 5,
      "CU15": 4,
      "CU16": 3,
      "CU17": 3,
      "CU18": 2,
      "CU19": 4,
      "CU20": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Com_002_core",
    "timestamp": "2026-07-14T05:13:39.745656",
    "survey": "core",
    "meta": {
      "name": "José García",
      "level": "Comité Ejecutivo",
      "area": "Distribución",
      "country": "Nicaragua",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 4,
      "A2": 3,
      "A3": 4,
      "A4": 4,
      "A5": 3,
      "E1": 3,
      "E2": 5,
      "E3": 5,
      "E4": 4,
      "E5": 5,
      "E6": 5,
      "E7": 5,
      "L1": 3,
      "L2": 2,
      "L3": 2,
      "L4": 3,
      "L5": 3,
      "L6": 3,
      "R1": 2,
      "R2": 2,
      "R3": 4,
      "R4": 3,
      "C1": 3,
      "C2": 1,
      "C3": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Com_002_full",
    "timestamp": "2026-07-14T05:13:39.745656",
    "survey": "full",
    "meta": {
      "name": "José García",
      "level": "Comité Ejecutivo",
      "area": "Distribución",
      "country": "Nicaragua",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 4,
      "A2": 3,
      "A3": 4,
      "A4": 4,
      "A5": 3,
      "E1": 3,
      "E2": 5,
      "E3": 5,
      "E4": 4,
      "E5": 5,
      "E6": 5,
      "E7": 5,
      "L1": 3,
      "L2": 2,
      "L3": 2,
      "L4": 3,
      "L5": 3,
      "L6": 3,
      "R1": 2,
      "R2": 2,
      "R3": 4,
      "R4": 3,
      "C1": 3,
      "C2": 1,
      "C3": 3,
      "SA6": 5,
      "SA7": 5,
      "SA8": 5,
      "SA9": 4,
      "SA10": 5,
      "SA11": 5,
      "SA12": 4,
      "EX8": 4,
      "EX9": 5,
      "EX10": 5,
      "EX11": 5,
      "EX12": 4,
      "EX13": 4,
      "EX14": 4,
      "EX15": 5,
      "EX16": 5,
      "EX17": 4,
      "EX18": 5,
      "LE7": 4,
      "LE8": 2,
      "LE9": 3,
      "LE10": 2,
      "LE11": 2,
      "LE12": 3,
      "LE13": 2,
      "LE14": 2,
      "LE15": 3,
      "RC5": 3,
      "RC6": 4,
      "RC7": 5,
      "RC8": 3,
      "RC9": 3,
      "OC4": 2,
      "OC5": 1,
      "OC6": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Com_002_deep_lei",
    "timestamp": "2026-07-14T05:43:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "José García",
      "level": "Comité Ejecutivo",
      "area": "Distribución",
      "country": "Nicaragua",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 4,
      "LD2": 4,
      "LD3": 4,
      "LD4": 2,
      "LD5": 4,
      "LD6": 3,
      "LD7": 3,
      "LD8": 3,
      "LD9": 3,
      "LD10": 5,
      "LD11": 4,
      "LD12": 4,
      "LD13": 2,
      "LD14": 1,
      "LD15": 1,
      "LD16": 3,
      "LD17": 3,
      "LD18": 3,
      "LD19": 3,
      "LD20": 5,
      "LD21": 3,
      "LD22": 4,
      "LD23": 3,
      "LD24": 3,
      "LD25": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Com_002_deep_tcs",
    "timestamp": "2026-07-14T05:43:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "José García",
      "level": "Comité Ejecutivo",
      "area": "Distribución",
      "country": "Nicaragua",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 3,
      "LT2": 3,
      "LT3": 2,
      "LT4": 3,
      "LT5": 3,
      "LT6": 3,
      "LT7": 3,
      "LT8": 1,
      "LT9": 1,
      "LT10": 3,
      "LT11": 4,
      "LT12": 4,
      "LT13": 3,
      "LT14": 2,
      "LT15": 2,
      "LT16": 4,
      "LT17": 4,
      "LT18": 3,
      "LT19": 3,
      "LT20": 4,
      "LT21": 4,
      "LT22": 3,
      "LT23": 3,
      "LT24": 3,
      "LT25": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Com_002_deep_aci",
    "timestamp": "2026-07-14T05:43:39.745656",
    "survey": "deep_aci",
    "meta": {
      "name": "José García",
      "level": "Comité Ejecutivo",
      "area": "Distribución",
      "country": "Nicaragua",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CH1": 3,
      "CH2": 3,
      "CH3": 3,
      "CH4": 3,
      "CH5": 4,
      "CH6": 2,
      "CH7": 4,
      "CH8": 4,
      "CH9": 4,
      "CH10": 4,
      "CH11": 3,
      "CH12": 4,
      "CH13": 3,
      "CH14": 4,
      "CH15": 3,
      "CH16": 3,
      "CH17": 4,
      "CH18": 4,
      "CH19": 3,
      "CH20": 4
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Com_002_deep_cei",
    "timestamp": "2026-07-14T05:43:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "José García",
      "level": "Comité Ejecutivo",
      "area": "Distribución",
      "country": "Nicaragua",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 2,
      "CU2": 3,
      "CU3": 2,
      "CU4": 3,
      "CU5": 4,
      "CU6": 3,
      "CU7": 2,
      "CU8": 2,
      "CU9": 3,
      "CU10": 3,
      "CU11": 3,
      "CU12": 3,
      "CU13": 3,
      "CU14": 2,
      "CU15": 3,
      "CU16": 2,
      "CU17": 1,
      "CU18": 2,
      "CU19": 3,
      "CU20": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Com_003_core",
    "timestamp": "2026-07-12T11:07:39.745656",
    "survey": "core",
    "meta": {
      "name": "María López",
      "level": "Comité Ejecutivo",
      "area": "Distribución",
      "country": "Nicaragua",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 4,
      "A2": 4,
      "A3": 4,
      "A4": 5,
      "A5": 5,
      "E1": 4,
      "E2": 4,
      "E3": 3,
      "E4": 4,
      "E5": 5,
      "E6": 4,
      "E7": 4,
      "L1": 2,
      "L2": 4,
      "L3": 4,
      "L4": 4,
      "L5": 5,
      "L6": 4,
      "R1": 3,
      "R2": 3,
      "R3": 3,
      "R4": 3,
      "C1": 4,
      "C2": 4,
      "C3": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Com_003_full",
    "timestamp": "2026-07-12T11:07:39.745656",
    "survey": "full",
    "meta": {
      "name": "María López",
      "level": "Comité Ejecutivo",
      "area": "Distribución",
      "country": "Nicaragua",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 4,
      "A2": 4,
      "A3": 4,
      "A4": 5,
      "A5": 5,
      "E1": 4,
      "E2": 4,
      "E3": 3,
      "E4": 4,
      "E5": 5,
      "E6": 4,
      "E7": 4,
      "L1": 2,
      "L2": 4,
      "L3": 4,
      "L4": 4,
      "L5": 5,
      "L6": 4,
      "R1": 3,
      "R2": 3,
      "R3": 3,
      "R4": 3,
      "C1": 4,
      "C2": 4,
      "C3": 3,
      "SA6": 5,
      "SA7": 5,
      "SA8": 4,
      "SA9": 4,
      "SA10": 5,
      "SA11": 4,
      "SA12": 5,
      "EX8": 4,
      "EX9": 5,
      "EX10": 5,
      "EX11": 4,
      "EX12": 4,
      "EX13": 4,
      "EX14": 4,
      "EX15": 4,
      "EX16": 3,
      "EX17": 4,
      "EX18": 5,
      "LE7": 2,
      "LE8": 2,
      "LE9": 3,
      "LE10": 2,
      "LE11": 4,
      "LE12": 3,
      "LE13": 2,
      "LE14": 3,
      "LE15": 2,
      "RC5": 3,
      "RC6": 3,
      "RC7": 3,
      "RC8": 3,
      "RC9": 3,
      "OC4": 4,
      "OC5": 2,
      "OC6": 4
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Com_003_deep_lei",
    "timestamp": "2026-07-12T11:37:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "María López",
      "level": "Comité Ejecutivo",
      "area": "Distribución",
      "country": "Nicaragua",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 2,
      "LD2": 4,
      "LD3": 3,
      "LD4": 4,
      "LD5": 3,
      "LD6": 4,
      "LD7": 2,
      "LD8": 2,
      "LD9": 3,
      "LD10": 4,
      "LD11": 3,
      "LD12": 3,
      "LD13": 2,
      "LD14": 2,
      "LD15": 2,
      "LD16": 3,
      "LD17": 3,
      "LD18": 3,
      "LD19": 3,
      "LD20": 3,
      "LD21": 3,
      "LD22": 2,
      "LD23": 2,
      "LD24": 2,
      "LD25": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Com_003_deep_tcs",
    "timestamp": "2026-07-12T11:37:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "María López",
      "level": "Comité Ejecutivo",
      "area": "Distribución",
      "country": "Nicaragua",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 4,
      "LT2": 3,
      "LT3": 3,
      "LT4": 3,
      "LT5": 4,
      "LT6": 3,
      "LT7": 3,
      "LT8": 3,
      "LT9": 4,
      "LT10": 3,
      "LT11": 3,
      "LT12": 3,
      "LT13": 3,
      "LT14": 2,
      "LT15": 2,
      "LT16": 3,
      "LT17": 3,
      "LT18": 4,
      "LT19": 3,
      "LT20": 2,
      "LT21": 3,
      "LT22": 4,
      "LT23": 3,
      "LT24": 3,
      "LT25": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Com_003_deep_aci",
    "timestamp": "2026-07-12T11:37:39.745656",
    "survey": "deep_aci",
    "meta": {
      "name": "María López",
      "level": "Comité Ejecutivo",
      "area": "Distribución",
      "country": "Nicaragua",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CH1": 4,
      "CH2": 4,
      "CH3": 3,
      "CH4": 3,
      "CH5": 3,
      "CH6": 3,
      "CH7": 3,
      "CH8": 3,
      "CH9": 2,
      "CH10": 2,
      "CH11": 3,
      "CH12": 2,
      "CH13": 4,
      "CH14": 3,
      "CH15": 3,
      "CH16": 4,
      "CH17": 4,
      "CH18": 3,
      "CH19": 3,
      "CH20": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Com_004_core",
    "timestamp": "2026-07-22T02:08:39.745656",
    "survey": "core",
    "meta": {
      "name": "Luis Martínez",
      "level": "Comité Ejecutivo",
      "area": "Distribución",
      "country": "Nicaragua",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 4,
      "A2": 4,
      "A3": 5,
      "A4": 3,
      "A5": 4,
      "E1": 5,
      "E2": 4,
      "E3": 5,
      "E4": 4,
      "E5": 5,
      "E6": 5,
      "E7": 5,
      "L1": 2,
      "L2": 3,
      "L3": 2,
      "L4": 2,
      "L5": 2,
      "L6": 2,
      "R1": 3,
      "R2": 4,
      "R3": 3,
      "R4": 3,
      "C1": 2,
      "C2": 3,
      "C3": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Com_004_full",
    "timestamp": "2026-07-22T02:08:39.745656",
    "survey": "full",
    "meta": {
      "name": "Luis Martínez",
      "level": "Comité Ejecutivo",
      "area": "Distribución",
      "country": "Nicaragua",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 4,
      "A2": 4,
      "A3": 5,
      "A4": 3,
      "A5": 4,
      "E1": 5,
      "E2": 4,
      "E3": 5,
      "E4": 4,
      "E5": 5,
      "E6": 5,
      "E7": 5,
      "L1": 2,
      "L2": 3,
      "L3": 2,
      "L4": 2,
      "L5": 2,
      "L6": 2,
      "R1": 3,
      "R2": 4,
      "R3": 3,
      "R4": 3,
      "C1": 2,
      "C2": 3,
      "C3": 3,
      "SA6": 2,
      "SA7": 3,
      "SA8": 3,
      "SA9": 3,
      "SA10": 2,
      "SA11": 2,
      "SA12": 3,
      "EX8": 5,
      "EX9": 4,
      "EX10": 5,
      "EX11": 5,
      "EX12": 4,
      "EX13": 5,
      "EX14": 3,
      "EX15": 4,
      "EX16": 5,
      "EX17": 4,
      "EX18": 5,
      "LE7": 4,
      "LE8": 3,
      "LE9": 4,
      "LE10": 3,
      "LE11": 4,
      "LE12": 4,
      "LE13": 4,
      "LE14": 4,
      "LE15": 4,
      "RC5": 2,
      "RC6": 4,
      "RC7": 4,
      "RC8": 4,
      "RC9": 3,
      "OC4": 4,
      "OC5": 3,
      "OC6": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Com_004_deep_lei",
    "timestamp": "2026-07-22T02:38:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Luis Martínez",
      "level": "Comité Ejecutivo",
      "area": "Distribución",
      "country": "Nicaragua",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 3,
      "LD2": 3,
      "LD3": 3,
      "LD4": 4,
      "LD5": 3,
      "LD6": 3,
      "LD7": 2,
      "LD8": 2,
      "LD9": 2,
      "LD10": 4,
      "LD11": 4,
      "LD12": 5,
      "LD13": 5,
      "LD14": 4,
      "LD15": 4,
      "LD16": 3,
      "LD17": 3,
      "LD18": 3,
      "LD19": 2,
      "LD20": 2,
      "LD21": 2,
      "LD22": 4,
      "LD23": 3,
      "LD24": 3,
      "LD25": 4
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Com_004_deep_tcs",
    "timestamp": "2026-07-22T02:38:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Luis Martínez",
      "level": "Comité Ejecutivo",
      "area": "Distribución",
      "country": "Nicaragua",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 4,
      "LT2": 3,
      "LT3": 4,
      "LT4": 3,
      "LT5": 3,
      "LT6": 3,
      "LT7": 2,
      "LT8": 1,
      "LT9": 2,
      "LT10": 3,
      "LT11": 4,
      "LT12": 2,
      "LT13": 5,
      "LT14": 3,
      "LT15": 4,
      "LT16": 4,
      "LT17": 3,
      "LT18": 3,
      "LT19": 4,
      "LT20": 3,
      "LT21": 5,
      "LT22": 3,
      "LT23": 3,
      "LT24": 3,
      "LT25": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Com_004_deep_aci",
    "timestamp": "2026-07-22T02:38:39.745656",
    "survey": "deep_aci",
    "meta": {
      "name": "Luis Martínez",
      "level": "Comité Ejecutivo",
      "area": "Distribución",
      "country": "Nicaragua",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CH1": 4,
      "CH2": 5,
      "CH3": 4,
      "CH4": 5,
      "CH5": 4,
      "CH6": 4,
      "CH7": 3,
      "CH8": 5,
      "CH9": 5,
      "CH10": 4,
      "CH11": 3,
      "CH12": 3,
      "CH13": 4,
      "CH14": 2,
      "CH15": 3,
      "CH16": 2,
      "CH17": 2,
      "CH18": 3,
      "CH19": 2,
      "CH20": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Com_004_deep_cei",
    "timestamp": "2026-07-22T02:38:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Luis Martínez",
      "level": "Comité Ejecutivo",
      "area": "Distribución",
      "country": "Nicaragua",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 2,
      "CU2": 2,
      "CU3": 3,
      "CU4": 3,
      "CU5": 4,
      "CU6": 3,
      "CU7": 3,
      "CU8": 3,
      "CU9": 3,
      "CU10": 3,
      "CU11": 3,
      "CU12": 3,
      "CU13": 2,
      "CU14": 2,
      "CU15": 2,
      "CU16": 2,
      "CU17": 2,
      "CU18": 2,
      "CU19": 2,
      "CU20": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Dir_000_core",
    "timestamp": "2026-07-11T23:18:39.745656",
    "survey": "core",
    "meta": {
      "name": "Patricia Flores",
      "level": "Directores/Gerentes",
      "area": "Comercial",
      "country": "Costa Rica",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 4,
      "A2": 4,
      "A3": 5,
      "A4": 5,
      "A5": 5,
      "E1": 4,
      "E2": 5,
      "E3": 4,
      "E4": 4,
      "E5": 5,
      "E6": 5,
      "E7": 4,
      "L1": 4,
      "L2": 3,
      "L3": 4,
      "L4": 3,
      "L5": 3,
      "L6": 4,
      "R1": 4,
      "R2": 3,
      "R3": 3,
      "R4": 1,
      "C1": 3,
      "C2": 4,
      "C3": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Dir_000_full",
    "timestamp": "2026-07-11T23:18:39.745656",
    "survey": "full",
    "meta": {
      "name": "Patricia Flores",
      "level": "Directores/Gerentes",
      "area": "Comercial",
      "country": "Costa Rica",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 4,
      "A2": 4,
      "A3": 5,
      "A4": 5,
      "A5": 5,
      "E1": 4,
      "E2": 5,
      "E3": 4,
      "E4": 4,
      "E5": 5,
      "E6": 5,
      "E7": 4,
      "L1": 4,
      "L2": 3,
      "L3": 4,
      "L4": 3,
      "L5": 3,
      "L6": 4,
      "R1": 4,
      "R2": 3,
      "R3": 3,
      "R4": 1,
      "C1": 3,
      "C2": 4,
      "C3": 2,
      "SA6": 3,
      "SA7": 4,
      "SA8": 3,
      "SA9": 4,
      "SA10": 4,
      "SA11": 4,
      "SA12": 3,
      "EX8": 4,
      "EX9": 5,
      "EX10": 4,
      "EX11": 5,
      "EX12": 4,
      "EX13": 4,
      "EX14": 4,
      "EX15": 5,
      "EX16": 5,
      "EX17": 4,
      "EX18": 4,
      "LE7": 4,
      "LE8": 4,
      "LE9": 3,
      "LE10": 3,
      "LE11": 3,
      "LE12": 4,
      "LE13": 4,
      "LE14": 5,
      "LE15": 3,
      "RC5": 4,
      "RC6": 3,
      "RC7": 2,
      "RC8": 4,
      "RC9": 3,
      "OC4": 4,
      "OC5": 2,
      "OC6": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Dir_000_deep_aci",
    "timestamp": "2026-07-11T23:48:39.745656",
    "survey": "deep_aci",
    "meta": {
      "name": "Patricia Flores",
      "level": "Directores/Gerentes",
      "area": "Comercial",
      "country": "Costa Rica",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CH1": 3,
      "CH2": 4,
      "CH3": 4,
      "CH4": 3,
      "CH5": 3,
      "CH6": 4,
      "CH7": 4,
      "CH8": 3,
      "CH9": 3,
      "CH10": 2,
      "CH11": 2,
      "CH12": 2,
      "CH13": 3,
      "CH14": 2,
      "CH15": 2,
      "CH16": 2,
      "CH17": 2,
      "CH18": 2,
      "CH19": 2,
      "CH20": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Dir_000_deep_cei",
    "timestamp": "2026-07-11T23:48:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Patricia Flores",
      "level": "Directores/Gerentes",
      "area": "Comercial",
      "country": "Costa Rica",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 3,
      "CU2": 3,
      "CU3": 3,
      "CU4": 2,
      "CU5": 3,
      "CU6": 2,
      "CU7": 1,
      "CU8": 1,
      "CU9": 1,
      "CU10": 1,
      "CU11": 1,
      "CU12": 1,
      "CU13": 3,
      "CU14": 2,
      "CU15": 3,
      "CU16": 3,
      "CU17": 3,
      "CU18": 2,
      "CU19": 3,
      "CU20": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Dir_001_core",
    "timestamp": "2026-07-16T01:50:39.745656",
    "survey": "core",
    "meta": {
      "name": "Roberto Hernández",
      "level": "Directores/Gerentes",
      "area": "Operaciones",
      "country": "Costa Rica",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 5,
      "A2": 5,
      "A3": 5,
      "A4": 5,
      "A5": 5,
      "E1": 4,
      "E2": 3,
      "E3": 5,
      "E4": 4,
      "E5": 4,
      "E6": 5,
      "E7": 3,
      "L1": 1,
      "L2": 2,
      "L3": 3,
      "L4": 2,
      "L5": 1,
      "L6": 1,
      "R1": 5,
      "R2": 5,
      "R3": 5,
      "R4": 5,
      "C1": 3,
      "C2": 2,
      "C3": 4
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Dir_001_full",
    "timestamp": "2026-07-16T01:50:39.745656",
    "survey": "full",
    "meta": {
      "name": "Roberto Hernández",
      "level": "Directores/Gerentes",
      "area": "Operaciones",
      "country": "Costa Rica",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 5,
      "A2": 5,
      "A3": 5,
      "A4": 5,
      "A5": 5,
      "E1": 4,
      "E2": 3,
      "E3": 5,
      "E4": 4,
      "E5": 4,
      "E6": 5,
      "E7": 3,
      "L1": 1,
      "L2": 2,
      "L3": 3,
      "L4": 2,
      "L5": 1,
      "L6": 1,
      "R1": 5,
      "R2": 5,
      "R3": 5,
      "R4": 5,
      "C1": 3,
      "C2": 2,
      "C3": 4,
      "SA6": 3,
      "SA7": 3,
      "SA8": 4,
      "SA9": 3,
      "SA10": 4,
      "SA11": 4,
      "SA12": 4,
      "EX8": 4,
      "EX9": 3,
      "EX10": 4,
      "EX11": 3,
      "EX12": 3,
      "EX13": 4,
      "EX14": 3,
      "EX15": 3,
      "EX16": 4,
      "EX17": 5,
      "EX18": 4,
      "LE7": 3,
      "LE8": 4,
      "LE9": 4,
      "LE10": 2,
      "LE11": 4,
      "LE12": 3,
      "LE13": 4,
      "LE14": 4,
      "LE15": 4,
      "RC5": 2,
      "RC6": 2,
      "RC7": 3,
      "RC8": 2,
      "RC9": 3,
      "OC4": 2,
      "OC5": 2,
      "OC6": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Dir_001_deep_lei",
    "timestamp": "2026-07-16T02:20:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Roberto Hernández",
      "level": "Directores/Gerentes",
      "area": "Operaciones",
      "country": "Costa Rica",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 3,
      "LD2": 4,
      "LD3": 3,
      "LD4": 3,
      "LD5": 3,
      "LD6": 3,
      "LD7": 2,
      "LD8": 2,
      "LD9": 3,
      "LD10": 3,
      "LD11": 3,
      "LD12": 4,
      "LD13": 4,
      "LD14": 3,
      "LD15": 3,
      "LD16": 3,
      "LD17": 3,
      "LD18": 3,
      "LD19": 2,
      "LD20": 3,
      "LD21": 1,
      "LD22": 2,
      "LD23": 2,
      "LD24": 1,
      "LD25": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Dir_001_deep_tcs",
    "timestamp": "2026-07-16T02:20:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Roberto Hernández",
      "level": "Directores/Gerentes",
      "area": "Operaciones",
      "country": "Costa Rica",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 3,
      "LT2": 3,
      "LT3": 2,
      "LT4": 2,
      "LT5": 3,
      "LT6": 3,
      "LT7": 3,
      "LT8": 3,
      "LT9": 2,
      "LT10": 2,
      "LT11": 2,
      "LT12": 2,
      "LT13": 2,
      "LT14": 2,
      "LT15": 3,
      "LT16": 3,
      "LT17": 2,
      "LT18": 3,
      "LT19": 3,
      "LT20": 4,
      "LT21": 4,
      "LT22": 3,
      "LT23": 3,
      "LT24": 3,
      "LT25": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Dir_001_deep_cei",
    "timestamp": "2026-07-16T02:20:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Roberto Hernández",
      "level": "Directores/Gerentes",
      "area": "Operaciones",
      "country": "Costa Rica",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 2,
      "CU2": 2,
      "CU3": 2,
      "CU4": 3,
      "CU5": 3,
      "CU6": 3,
      "CU7": 2,
      "CU8": 3,
      "CU9": 3,
      "CU10": 2,
      "CU11": 1,
      "CU12": 2,
      "CU13": 2,
      "CU14": 2,
      "CU15": 2,
      "CU16": 1,
      "CU17": 1,
      "CU18": 2,
      "CU19": 2,
      "CU20": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Dir_002_core",
    "timestamp": "2026-07-14T21:07:39.745656",
    "survey": "core",
    "meta": {
      "name": "Sandra Torres",
      "level": "Directores/Gerentes",
      "area": "Distribución",
      "country": "Nicaragua",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 3,
      "A2": 4,
      "A3": 4,
      "A4": 3,
      "A5": 4,
      "E1": 4,
      "E2": 3,
      "E3": 3,
      "E4": 3,
      "E5": 4,
      "E6": 4,
      "E7": 3,
      "L1": 3,
      "L2": 2,
      "L3": 3,
      "L4": 2,
      "L5": 3,
      "L6": 2,
      "R1": 4,
      "R2": 4,
      "R3": 5,
      "R4": 4,
      "C1": 2,
      "C2": 2,
      "C3": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Dir_002_full",
    "timestamp": "2026-07-14T21:07:39.745656",
    "survey": "full",
    "meta": {
      "name": "Sandra Torres",
      "level": "Directores/Gerentes",
      "area": "Distribución",
      "country": "Nicaragua",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 3,
      "A2": 4,
      "A3": 4,
      "A4": 3,
      "A5": 4,
      "E1": 4,
      "E2": 3,
      "E3": 3,
      "E4": 3,
      "E5": 4,
      "E6": 4,
      "E7": 3,
      "L1": 3,
      "L2": 2,
      "L3": 3,
      "L4": 2,
      "L5": 3,
      "L6": 2,
      "R1": 4,
      "R2": 4,
      "R3": 5,
      "R4": 4,
      "C1": 2,
      "C2": 2,
      "C3": 2,
      "SA6": 3,
      "SA7": 4,
      "SA8": 4,
      "SA9": 3,
      "SA10": 3,
      "SA11": 3,
      "SA12": 3,
      "EX8": 3,
      "EX9": 4,
      "EX10": 5,
      "EX11": 3,
      "EX12": 5,
      "EX13": 3,
      "EX14": 3,
      "EX15": 4,
      "EX16": 4,
      "EX17": 4,
      "EX18": 4,
      "LE7": 3,
      "LE8": 4,
      "LE9": 3,
      "LE10": 2,
      "LE11": 3,
      "LE12": 2,
      "LE13": 2,
      "LE14": 3,
      "LE15": 2,
      "RC5": 4,
      "RC6": 4,
      "RC7": 4,
      "RC8": 3,
      "RC9": 4,
      "OC4": 1,
      "OC5": 1,
      "OC6": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Dir_002_deep_lei",
    "timestamp": "2026-07-14T21:37:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Sandra Torres",
      "level": "Directores/Gerentes",
      "area": "Distribución",
      "country": "Nicaragua",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 4,
      "LD2": 4,
      "LD3": 3,
      "LD4": 3,
      "LD5": 3,
      "LD6": 2,
      "LD7": 2,
      "LD8": 1,
      "LD9": 1,
      "LD10": 2,
      "LD11": 3,
      "LD12": 2,
      "LD13": 4,
      "LD14": 2,
      "LD15": 3,
      "LD16": 2,
      "LD17": 2,
      "LD18": 1,
      "LD19": 4,
      "LD20": 4,
      "LD21": 4,
      "LD22": 3,
      "LD23": 3,
      "LD24": 3,
      "LD25": 4
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Dir_002_deep_tcs",
    "timestamp": "2026-07-14T21:37:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Sandra Torres",
      "level": "Directores/Gerentes",
      "area": "Distribución",
      "country": "Nicaragua",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 2,
      "LT2": 2,
      "LT3": 3,
      "LT4": 3,
      "LT5": 3,
      "LT6": 2,
      "LT7": 2,
      "LT8": 3,
      "LT9": 3,
      "LT10": 3,
      "LT11": 3,
      "LT12": 2,
      "LT13": 1,
      "LT14": 2,
      "LT15": 1,
      "LT16": 2,
      "LT17": 2,
      "LT18": 2,
      "LT19": 2,
      "LT20": 2,
      "LT21": 2,
      "LT22": 2,
      "LT23": 1,
      "LT24": 2,
      "LT25": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Dir_002_deep_cei",
    "timestamp": "2026-07-14T21:37:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Sandra Torres",
      "level": "Directores/Gerentes",
      "area": "Distribución",
      "country": "Nicaragua",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 2,
      "CU2": 2,
      "CU3": 3,
      "CU4": 2,
      "CU5": 2,
      "CU6": 4,
      "CU7": 3,
      "CU8": 3,
      "CU9": 2,
      "CU10": 1,
      "CU11": 1,
      "CU12": 1,
      "CU13": 3,
      "CU14": 3,
      "CU15": 3,
      "CU16": 3,
      "CU17": 2,
      "CU18": 2,
      "CU19": 3,
      "CU20": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Dir_003_core",
    "timestamp": "2026-07-18T05:47:39.745656",
    "survey": "core",
    "meta": {
      "name": "Miguel Díaz",
      "level": "Directores/Gerentes",
      "area": "Tecnología",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 2,
      "A2": 4,
      "A3": 4,
      "A4": 5,
      "A5": 3,
      "E1": 4,
      "E2": 4,
      "E3": 4,
      "E4": 3,
      "E5": 5,
      "E6": 4,
      "E7": 4,
      "L1": 3,
      "L2": 3,
      "L3": 3,
      "L4": 3,
      "L5": 2,
      "L6": 2,
      "R1": 4,
      "R2": 3,
      "R3": 3,
      "R4": 3,
      "C1": 3,
      "C2": 2,
      "C3": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Dir_003_full",
    "timestamp": "2026-07-18T05:47:39.745656",
    "survey": "full",
    "meta": {
      "name": "Miguel Díaz",
      "level": "Directores/Gerentes",
      "area": "Tecnología",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 2,
      "A2": 4,
      "A3": 4,
      "A4": 5,
      "A5": 3,
      "E1": 4,
      "E2": 4,
      "E3": 4,
      "E4": 3,
      "E5": 5,
      "E6": 4,
      "E7": 4,
      "L1": 3,
      "L2": 3,
      "L3": 3,
      "L4": 3,
      "L5": 2,
      "L6": 2,
      "R1": 4,
      "R2": 3,
      "R3": 3,
      "R4": 3,
      "C1": 3,
      "C2": 2,
      "C3": 3,
      "SA6": 3,
      "SA7": 5,
      "SA8": 3,
      "SA9": 5,
      "SA10": 3,
      "SA11": 3,
      "SA12": 4,
      "EX8": 4,
      "EX9": 4,
      "EX10": 4,
      "EX11": 4,
      "EX12": 4,
      "EX13": 4,
      "EX14": 3,
      "EX15": 4,
      "EX16": 4,
      "EX17": 4,
      "EX18": 3,
      "LE7": 2,
      "LE8": 3,
      "LE9": 4,
      "LE10": 3,
      "LE11": 3,
      "LE12": 3,
      "LE13": 4,
      "LE14": 4,
      "LE15": 3,
      "RC5": 3,
      "RC6": 2,
      "RC7": 3,
      "RC8": 2,
      "RC9": 3,
      "OC4": 2,
      "OC5": 3,
      "OC6": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Dir_003_deep_lei",
    "timestamp": "2026-07-18T06:17:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Miguel Díaz",
      "level": "Directores/Gerentes",
      "area": "Tecnología",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 1,
      "LD2": 1,
      "LD3": 1,
      "LD4": 3,
      "LD5": 2,
      "LD6": 3,
      "LD7": 4,
      "LD8": 3,
      "LD9": 3,
      "LD10": 3,
      "LD11": 4,
      "LD12": 3,
      "LD13": 4,
      "LD14": 4,
      "LD15": 4,
      "LD16": 2,
      "LD17": 2,
      "LD18": 2,
      "LD19": 3,
      "LD20": 3,
      "LD21": 3,
      "LD22": 2,
      "LD23": 2,
      "LD24": 3,
      "LD25": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Dir_003_deep_tcs",
    "timestamp": "2026-07-18T06:17:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Miguel Díaz",
      "level": "Directores/Gerentes",
      "area": "Tecnología",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 1,
      "LT2": 1,
      "LT3": 1,
      "LT4": 3,
      "LT5": 3,
      "LT6": 3,
      "LT7": 3,
      "LT8": 3,
      "LT9": 3,
      "LT10": 2,
      "LT11": 3,
      "LT12": 2,
      "LT13": 3,
      "LT14": 2,
      "LT15": 2,
      "LT16": 5,
      "LT17": 4,
      "LT18": 4,
      "LT19": 3,
      "LT20": 4,
      "LT21": 3,
      "LT22": 3,
      "LT23": 4,
      "LT24": 3,
      "LT25": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Dir_003_deep_aci",
    "timestamp": "2026-07-18T06:17:39.745656",
    "survey": "deep_aci",
    "meta": {
      "name": "Miguel Díaz",
      "level": "Directores/Gerentes",
      "area": "Tecnología",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CH1": 3,
      "CH2": 4,
      "CH3": 3,
      "CH4": 2,
      "CH5": 2,
      "CH6": 2,
      "CH7": 4,
      "CH8": 3,
      "CH9": 4,
      "CH10": 3,
      "CH11": 3,
      "CH12": 3,
      "CH13": 2,
      "CH14": 3,
      "CH15": 3,
      "CH16": 2,
      "CH17": 3,
      "CH18": 3,
      "CH19": 2,
      "CH20": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Dir_003_deep_cei",
    "timestamp": "2026-07-18T06:17:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Miguel Díaz",
      "level": "Directores/Gerentes",
      "area": "Tecnología",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 2,
      "CU2": 3,
      "CU3": 2,
      "CU4": 1,
      "CU5": 2,
      "CU6": 2,
      "CU7": 2,
      "CU8": 2,
      "CU9": 2,
      "CU10": 3,
      "CU11": 2,
      "CU12": 3,
      "CU13": 3,
      "CU14": 2,
      "CU15": 3,
      "CU16": 3,
      "CU17": 2,
      "CU18": 2,
      "CU19": 1,
      "CU20": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Dir_004_core",
    "timestamp": "2026-07-21T21:54:39.745656",
    "survey": "core",
    "meta": {
      "name": "Carmen Ruiz",
      "level": "Directores/Gerentes",
      "area": "Almacenamiento",
      "country": "Nicaragua",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 4,
      "A2": 3,
      "A3": 2,
      "A4": 4,
      "A5": 4,
      "E1": 4,
      "E2": 4,
      "E3": 2,
      "E4": 5,
      "E5": 3,
      "E6": 5,
      "E7": 4,
      "L1": 2,
      "L2": 2,
      "L3": 3,
      "L4": 3,
      "L5": 3,
      "L6": 2,
      "R1": 3,
      "R2": 3,
      "R3": 4,
      "R4": 3,
      "C1": 3,
      "C2": 2,
      "C3": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Dir_004_full",
    "timestamp": "2026-07-21T21:54:39.745656",
    "survey": "full",
    "meta": {
      "name": "Carmen Ruiz",
      "level": "Directores/Gerentes",
      "area": "Almacenamiento",
      "country": "Nicaragua",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 4,
      "A2": 3,
      "A3": 2,
      "A4": 4,
      "A5": 4,
      "E1": 4,
      "E2": 4,
      "E3": 2,
      "E4": 5,
      "E5": 3,
      "E6": 5,
      "E7": 4,
      "L1": 2,
      "L2": 2,
      "L3": 3,
      "L4": 3,
      "L5": 3,
      "L6": 2,
      "R1": 3,
      "R2": 3,
      "R3": 4,
      "R4": 3,
      "C1": 3,
      "C2": 2,
      "C3": 3,
      "SA6": 2,
      "SA7": 3,
      "SA8": 3,
      "SA9": 2,
      "SA10": 2,
      "SA11": 2,
      "SA12": 1,
      "EX8": 4,
      "EX9": 3,
      "EX10": 3,
      "EX11": 3,
      "EX12": 4,
      "EX13": 3,
      "EX14": 4,
      "EX15": 4,
      "EX16": 4,
      "EX17": 3,
      "EX18": 3,
      "LE7": 3,
      "LE8": 2,
      "LE9": 3,
      "LE10": 3,
      "LE11": 2,
      "LE12": 3,
      "LE13": 3,
      "LE14": 3,
      "LE15": 3,
      "RC5": 4,
      "RC6": 4,
      "RC7": 4,
      "RC8": 4,
      "RC9": 5,
      "OC4": 3,
      "OC5": 2,
      "OC6": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Dir_004_deep_lei",
    "timestamp": "2026-07-21T22:24:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Carmen Ruiz",
      "level": "Directores/Gerentes",
      "area": "Almacenamiento",
      "country": "Nicaragua",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 1,
      "LD2": 2,
      "LD3": 2,
      "LD4": 1,
      "LD5": 1,
      "LD6": 2,
      "LD7": 4,
      "LD8": 5,
      "LD9": 5,
      "LD10": 2,
      "LD11": 3,
      "LD12": 3,
      "LD13": 2,
      "LD14": 3,
      "LD15": 2,
      "LD16": 2,
      "LD17": 2,
      "LD18": 3,
      "LD19": 2,
      "LD20": 2,
      "LD21": 2,
      "LD22": 2,
      "LD23": 2,
      "LD24": 2,
      "LD25": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Dir_004_deep_tcs",
    "timestamp": "2026-07-21T22:24:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Carmen Ruiz",
      "level": "Directores/Gerentes",
      "area": "Almacenamiento",
      "country": "Nicaragua",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 3,
      "LT2": 2,
      "LT3": 1,
      "LT4": 3,
      "LT5": 3,
      "LT6": 3,
      "LT7": 3,
      "LT8": 3,
      "LT9": 4,
      "LT10": 3,
      "LT11": 3,
      "LT12": 4,
      "LT13": 3,
      "LT14": 1,
      "LT15": 2,
      "LT16": 3,
      "LT17": 4,
      "LT18": 1,
      "LT19": 3,
      "LT20": 3,
      "LT21": 2,
      "LT22": 3,
      "LT23": 4,
      "LT24": 3,
      "LT25": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Dir_004_deep_cei",
    "timestamp": "2026-07-21T22:24:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Carmen Ruiz",
      "level": "Directores/Gerentes",
      "area": "Almacenamiento",
      "country": "Nicaragua",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 1,
      "CU2": 1,
      "CU3": 1,
      "CU4": 3,
      "CU5": 3,
      "CU6": 3,
      "CU7": 2,
      "CU8": 2,
      "CU9": 2,
      "CU10": 2,
      "CU11": 2,
      "CU12": 2,
      "CU13": 2,
      "CU14": 2,
      "CU15": 1,
      "CU16": 2,
      "CU17": 2,
      "CU18": 2,
      "CU19": 3,
      "CU20": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Dir_005_core",
    "timestamp": "2026-07-23T08:13:39.745656",
    "survey": "core",
    "meta": {
      "name": "Felipe Morales",
      "level": "Directores/Gerentes",
      "area": "Tecnología",
      "country": "Nicaragua",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 3,
      "A2": 4,
      "A3": 4,
      "A4": 4,
      "A5": 3,
      "E1": 5,
      "E2": 5,
      "E3": 5,
      "E4": 4,
      "E5": 5,
      "E6": 4,
      "E7": 4,
      "L1": 2,
      "L2": 1,
      "L3": 2,
      "L4": 1,
      "L5": 2,
      "L6": 3,
      "R1": 4,
      "R2": 4,
      "R3": 3,
      "R4": 5,
      "C1": 3,
      "C2": 3,
      "C3": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Dir_005_full",
    "timestamp": "2026-07-23T08:13:39.745656",
    "survey": "full",
    "meta": {
      "name": "Felipe Morales",
      "level": "Directores/Gerentes",
      "area": "Tecnología",
      "country": "Nicaragua",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 3,
      "A2": 4,
      "A3": 4,
      "A4": 4,
      "A5": 3,
      "E1": 5,
      "E2": 5,
      "E3": 5,
      "E4": 4,
      "E5": 5,
      "E6": 4,
      "E7": 4,
      "L1": 2,
      "L2": 1,
      "L3": 2,
      "L4": 1,
      "L5": 2,
      "L6": 3,
      "R1": 4,
      "R2": 4,
      "R3": 3,
      "R4": 5,
      "C1": 3,
      "C2": 3,
      "C3": 3,
      "SA6": 1,
      "SA7": 2,
      "SA8": 2,
      "SA9": 3,
      "SA10": 3,
      "SA11": 2,
      "SA12": 2,
      "EX8": 3,
      "EX9": 4,
      "EX10": 4,
      "EX11": 3,
      "EX12": 4,
      "EX13": 4,
      "EX14": 5,
      "EX15": 4,
      "EX16": 4,
      "EX17": 4,
      "EX18": 5,
      "LE7": 2,
      "LE8": 3,
      "LE9": 1,
      "LE10": 2,
      "LE11": 1,
      "LE12": 1,
      "LE13": 1,
      "LE14": 2,
      "LE15": 2,
      "RC5": 4,
      "RC6": 3,
      "RC7": 4,
      "RC8": 3,
      "RC9": 3,
      "OC4": 1,
      "OC5": 2,
      "OC6": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Dir_005_deep_lei",
    "timestamp": "2026-07-23T08:43:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Felipe Morales",
      "level": "Directores/Gerentes",
      "area": "Tecnología",
      "country": "Nicaragua",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 3,
      "LD2": 3,
      "LD3": 4,
      "LD4": 4,
      "LD5": 4,
      "LD6": 3,
      "LD7": 2,
      "LD8": 1,
      "LD9": 1,
      "LD10": 2,
      "LD11": 2,
      "LD12": 2,
      "LD13": 3,
      "LD14": 3,
      "LD15": 4,
      "LD16": 3,
      "LD17": 3,
      "LD18": 3,
      "LD19": 3,
      "LD20": 4,
      "LD21": 3,
      "LD22": 3,
      "LD23": 2,
      "LD24": 3,
      "LD25": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Dir_005_deep_tcs",
    "timestamp": "2026-07-23T08:43:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Felipe Morales",
      "level": "Directores/Gerentes",
      "area": "Tecnología",
      "country": "Nicaragua",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 3,
      "LT2": 3,
      "LT3": 4,
      "LT4": 2,
      "LT5": 3,
      "LT6": 2,
      "LT7": 3,
      "LT8": 3,
      "LT9": 5,
      "LT10": 3,
      "LT11": 3,
      "LT12": 3,
      "LT13": 2,
      "LT14": 1,
      "LT15": 2,
      "LT16": 4,
      "LT17": 3,
      "LT18": 3,
      "LT19": 2,
      "LT20": 1,
      "LT21": 3,
      "LT22": 2,
      "LT23": 3,
      "LT24": 3,
      "LT25": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Dir_005_deep_cei",
    "timestamp": "2026-07-23T08:43:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Felipe Morales",
      "level": "Directores/Gerentes",
      "area": "Tecnología",
      "country": "Nicaragua",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 2,
      "CU2": 3,
      "CU3": 4,
      "CU4": 2,
      "CU5": 3,
      "CU6": 3,
      "CU7": 1,
      "CU8": 1,
      "CU9": 1,
      "CU10": 1,
      "CU11": 2,
      "CU12": 2,
      "CU13": 2,
      "CU14": 2,
      "CU15": 1,
      "CU16": 1,
      "CU17": 2,
      "CU18": 2,
      "CU19": 2,
      "CU20": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Dir_006_core",
    "timestamp": "2026-07-21T11:45:39.745656",
    "survey": "core",
    "meta": {
      "name": "Isabel Sánchez",
      "level": "Directores/Gerentes",
      "area": "Distribución",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 3,
      "A2": 3,
      "A3": 3,
      "A4": 4,
      "A5": 4,
      "E1": 4,
      "E2": 4,
      "E3": 5,
      "E4": 4,
      "E5": 4,
      "E6": 4,
      "E7": 4,
      "L1": 1,
      "L2": 2,
      "L3": 2,
      "L4": 2,
      "L5": 3,
      "L6": 1,
      "R1": 3,
      "R2": 3,
      "R3": 4,
      "R4": 4,
      "C1": 3,
      "C2": 2,
      "C3": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Dir_006_full",
    "timestamp": "2026-07-21T11:45:39.745656",
    "survey": "full",
    "meta": {
      "name": "Isabel Sánchez",
      "level": "Directores/Gerentes",
      "area": "Distribución",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 3,
      "A2": 3,
      "A3": 3,
      "A4": 4,
      "A5": 4,
      "E1": 4,
      "E2": 4,
      "E3": 5,
      "E4": 4,
      "E5": 4,
      "E6": 4,
      "E7": 4,
      "L1": 1,
      "L2": 2,
      "L3": 2,
      "L4": 2,
      "L5": 3,
      "L6": 1,
      "R1": 3,
      "R2": 3,
      "R3": 4,
      "R4": 4,
      "C1": 3,
      "C2": 2,
      "C3": 3,
      "SA6": 5,
      "SA7": 4,
      "SA8": 4,
      "SA9": 3,
      "SA10": 4,
      "SA11": 3,
      "SA12": 4,
      "EX8": 5,
      "EX9": 4,
      "EX10": 3,
      "EX11": 5,
      "EX12": 4,
      "EX13": 4,
      "EX14": 4,
      "EX15": 4,
      "EX16": 4,
      "EX17": 3,
      "EX18": 4,
      "LE7": 2,
      "LE8": 2,
      "LE9": 3,
      "LE10": 3,
      "LE11": 3,
      "LE12": 2,
      "LE13": 2,
      "LE14": 1,
      "LE15": 2,
      "RC5": 3,
      "RC6": 2,
      "RC7": 3,
      "RC8": 2,
      "RC9": 3,
      "OC4": 2,
      "OC5": 3,
      "OC6": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Dir_006_deep_lei",
    "timestamp": "2026-07-21T12:15:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Isabel Sánchez",
      "level": "Directores/Gerentes",
      "area": "Distribución",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 2,
      "LD2": 2,
      "LD3": 3,
      "LD4": 4,
      "LD5": 5,
      "LD6": 5,
      "LD7": 3,
      "LD8": 3,
      "LD9": 2,
      "LD10": 4,
      "LD11": 2,
      "LD12": 4,
      "LD13": 2,
      "LD14": 2,
      "LD15": 1,
      "LD16": 2,
      "LD17": 1,
      "LD18": 2,
      "LD19": 3,
      "LD20": 2,
      "LD21": 2,
      "LD22": 2,
      "LD23": 3,
      "LD24": 3,
      "LD25": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Dir_006_deep_tcs",
    "timestamp": "2026-07-21T12:15:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Isabel Sánchez",
      "level": "Directores/Gerentes",
      "area": "Distribución",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 3,
      "LT2": 3,
      "LT3": 4,
      "LT4": 2,
      "LT5": 2,
      "LT6": 3,
      "LT7": 3,
      "LT8": 3,
      "LT9": 1,
      "LT10": 3,
      "LT11": 3,
      "LT12": 3,
      "LT13": 4,
      "LT14": 3,
      "LT15": 3,
      "LT16": 2,
      "LT17": 2,
      "LT18": 2,
      "LT19": 3,
      "LT20": 3,
      "LT21": 3,
      "LT22": 3,
      "LT23": 2,
      "LT24": 2,
      "LT25": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Dir_006_deep_aci",
    "timestamp": "2026-07-21T12:15:39.745656",
    "survey": "deep_aci",
    "meta": {
      "name": "Isabel Sánchez",
      "level": "Directores/Gerentes",
      "area": "Distribución",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CH1": 2,
      "CH2": 3,
      "CH3": 3,
      "CH4": 3,
      "CH5": 3,
      "CH6": 3,
      "CH7": 4,
      "CH8": 5,
      "CH9": 4,
      "CH10": 3,
      "CH11": 4,
      "CH12": 2,
      "CH13": 2,
      "CH14": 2,
      "CH15": 3,
      "CH16": 4,
      "CH17": 3,
      "CH18": 3,
      "CH19": 4,
      "CH20": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Dir_006_deep_cei",
    "timestamp": "2026-07-21T12:15:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Isabel Sánchez",
      "level": "Directores/Gerentes",
      "area": "Distribución",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 1,
      "CU2": 3,
      "CU3": 2,
      "CU4": 3,
      "CU5": 3,
      "CU6": 3,
      "CU7": 3,
      "CU8": 3,
      "CU9": 2,
      "CU10": 4,
      "CU11": 3,
      "CU12": 4,
      "CU13": 1,
      "CU14": 2,
      "CU15": 2,
      "CU16": 2,
      "CU17": 2,
      "CU18": 2,
      "CU19": 3,
      "CU20": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Dir_007_core",
    "timestamp": "2026-07-14T10:15:39.745656",
    "survey": "core",
    "meta": {
      "name": "Andrés Ramírez",
      "level": "Directores/Gerentes",
      "area": "Operaciones",
      "country": "Nicaragua",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 2,
      "A2": 4,
      "A3": 3,
      "A4": 3,
      "A5": 3,
      "E1": 5,
      "E2": 4,
      "E3": 5,
      "E4": 4,
      "E5": 4,
      "E6": 3,
      "E7": 5,
      "L1": 2,
      "L2": 1,
      "L3": 1,
      "L4": 1,
      "L5": 2,
      "L6": 1,
      "R1": 4,
      "R2": 3,
      "R3": 4,
      "R4": 4,
      "C1": 1,
      "C2": 1,
      "C3": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Dir_007_full",
    "timestamp": "2026-07-14T10:15:39.745656",
    "survey": "full",
    "meta": {
      "name": "Andrés Ramírez",
      "level": "Directores/Gerentes",
      "area": "Operaciones",
      "country": "Nicaragua",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 2,
      "A2": 4,
      "A3": 3,
      "A4": 3,
      "A5": 3,
      "E1": 5,
      "E2": 4,
      "E3": 5,
      "E4": 4,
      "E5": 4,
      "E6": 3,
      "E7": 5,
      "L1": 2,
      "L2": 1,
      "L3": 1,
      "L4": 1,
      "L5": 2,
      "L6": 1,
      "R1": 4,
      "R2": 3,
      "R3": 4,
      "R4": 4,
      "C1": 1,
      "C2": 1,
      "C3": 2,
      "SA6": 4,
      "SA7": 4,
      "SA8": 4,
      "SA9": 4,
      "SA10": 3,
      "SA11": 4,
      "SA12": 3,
      "EX8": 3,
      "EX9": 3,
      "EX10": 4,
      "EX11": 4,
      "EX12": 4,
      "EX13": 3,
      "EX14": 4,
      "EX15": 5,
      "EX16": 3,
      "EX17": 5,
      "EX18": 4,
      "LE7": 3,
      "LE8": 3,
      "LE9": 3,
      "LE10": 3,
      "LE11": 3,
      "LE12": 3,
      "LE13": 3,
      "LE14": 3,
      "LE15": 3,
      "RC5": 3,
      "RC6": 2,
      "RC7": 2,
      "RC8": 4,
      "RC9": 3,
      "OC4": 3,
      "OC5": 3,
      "OC6": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Dir_007_deep_lei",
    "timestamp": "2026-07-14T10:45:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Andrés Ramírez",
      "level": "Directores/Gerentes",
      "area": "Operaciones",
      "country": "Nicaragua",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 2,
      "LD2": 2,
      "LD3": 3,
      "LD4": 2,
      "LD5": 3,
      "LD6": 2,
      "LD7": 3,
      "LD8": 3,
      "LD9": 4,
      "LD10": 3,
      "LD11": 3,
      "LD12": 2,
      "LD13": 3,
      "LD14": 3,
      "LD15": 4,
      "LD16": 3,
      "LD17": 4,
      "LD18": 3,
      "LD19": 2,
      "LD20": 2,
      "LD21": 3,
      "LD22": 2,
      "LD23": 2,
      "LD24": 1,
      "LD25": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Dir_007_deep_tcs",
    "timestamp": "2026-07-14T10:45:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Andrés Ramírez",
      "level": "Directores/Gerentes",
      "area": "Operaciones",
      "country": "Nicaragua",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 1,
      "LT2": 3,
      "LT3": 3,
      "LT4": 3,
      "LT5": 2,
      "LT6": 3,
      "LT7": 2,
      "LT8": 2,
      "LT9": 3,
      "LT10": 2,
      "LT11": 3,
      "LT12": 2,
      "LT13": 2,
      "LT14": 2,
      "LT15": 2,
      "LT16": 3,
      "LT17": 2,
      "LT18": 3,
      "LT19": 2,
      "LT20": 2,
      "LT21": 3,
      "LT22": 1,
      "LT23": 2,
      "LT24": 2,
      "LT25": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Dir_007_deep_aci",
    "timestamp": "2026-07-14T10:45:39.745656",
    "survey": "deep_aci",
    "meta": {
      "name": "Andrés Ramírez",
      "level": "Directores/Gerentes",
      "area": "Operaciones",
      "country": "Nicaragua",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CH1": 3,
      "CH2": 3,
      "CH3": 3,
      "CH4": 4,
      "CH5": 4,
      "CH6": 4,
      "CH7": 2,
      "CH8": 3,
      "CH9": 2,
      "CH10": 2,
      "CH11": 2,
      "CH12": 3,
      "CH13": 2,
      "CH14": 3,
      "CH15": 3,
      "CH16": 3,
      "CH17": 2,
      "CH18": 3,
      "CH19": 3,
      "CH20": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Dir_007_deep_cei",
    "timestamp": "2026-07-14T10:45:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Andrés Ramírez",
      "level": "Directores/Gerentes",
      "area": "Operaciones",
      "country": "Nicaragua",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 2,
      "CU2": 2,
      "CU3": 2,
      "CU4": 2,
      "CU5": 3,
      "CU6": 2,
      "CU7": 2,
      "CU8": 3,
      "CU9": 3,
      "CU10": 1,
      "CU11": 2,
      "CU12": 2,
      "CU13": 1,
      "CU14": 2,
      "CU15": 1,
      "CU16": 3,
      "CU17": 3,
      "CU18": 2,
      "CU19": 2,
      "CU20": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Dir_008_core",
    "timestamp": "2026-07-20T10:06:39.745656",
    "survey": "core",
    "meta": {
      "name": "Lucía Jiménez",
      "level": "Directores/Gerentes",
      "area": "Distribución",
      "country": "Guatemala",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 4,
      "A2": 4,
      "A3": 4,
      "A4": 4,
      "A5": 4,
      "E1": 5,
      "E2": 3,
      "E3": 5,
      "E4": 4,
      "E5": 3,
      "E6": 3,
      "E7": 3,
      "L1": 3,
      "L2": 2,
      "L3": 4,
      "L4": 2,
      "L5": 4,
      "L6": 2,
      "R1": 4,
      "R2": 3,
      "R3": 3,
      "R4": 3,
      "C1": 1,
      "C2": 1,
      "C3": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Dir_008_full",
    "timestamp": "2026-07-20T10:06:39.745656",
    "survey": "full",
    "meta": {
      "name": "Lucía Jiménez",
      "level": "Directores/Gerentes",
      "area": "Distribución",
      "country": "Guatemala",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 4,
      "A2": 4,
      "A3": 4,
      "A4": 4,
      "A5": 4,
      "E1": 5,
      "E2": 3,
      "E3": 5,
      "E4": 4,
      "E5": 3,
      "E6": 3,
      "E7": 3,
      "L1": 3,
      "L2": 2,
      "L3": 4,
      "L4": 2,
      "L5": 4,
      "L6": 2,
      "R1": 4,
      "R2": 3,
      "R3": 3,
      "R4": 3,
      "C1": 1,
      "C2": 1,
      "C3": 2,
      "SA6": 3,
      "SA7": 3,
      "SA8": 2,
      "SA9": 4,
      "SA10": 3,
      "SA11": 3,
      "SA12": 4,
      "EX8": 4,
      "EX9": 4,
      "EX10": 4,
      "EX11": 4,
      "EX12": 4,
      "EX13": 4,
      "EX14": 4,
      "EX15": 4,
      "EX16": 3,
      "EX17": 4,
      "EX18": 5,
      "LE7": 3,
      "LE8": 4,
      "LE9": 2,
      "LE10": 3,
      "LE11": 3,
      "LE12": 3,
      "LE13": 3,
      "LE14": 3,
      "LE15": 3,
      "RC5": 3,
      "RC6": 2,
      "RC7": 2,
      "RC8": 2,
      "RC9": 3,
      "OC4": 3,
      "OC5": 5,
      "OC6": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Dir_008_deep_lei",
    "timestamp": "2026-07-20T10:36:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Lucía Jiménez",
      "level": "Directores/Gerentes",
      "area": "Distribución",
      "country": "Guatemala",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 1,
      "LD2": 1,
      "LD3": 2,
      "LD4": 3,
      "LD5": 3,
      "LD6": 3,
      "LD7": 1,
      "LD8": 1,
      "LD9": 1,
      "LD10": 3,
      "LD11": 3,
      "LD12": 3,
      "LD13": 3,
      "LD14": 3,
      "LD15": 2,
      "LD16": 2,
      "LD17": 2,
      "LD18": 3,
      "LD19": 1,
      "LD20": 3,
      "LD21": 4,
      "LD22": 2,
      "LD23": 2,
      "LD24": 2,
      "LD25": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Dir_008_deep_tcs",
    "timestamp": "2026-07-20T10:36:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Lucía Jiménez",
      "level": "Directores/Gerentes",
      "area": "Distribución",
      "country": "Guatemala",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 1,
      "LT2": 2,
      "LT3": 2,
      "LT4": 2,
      "LT5": 2,
      "LT6": 2,
      "LT7": 2,
      "LT8": 2,
      "LT9": 2,
      "LT10": 2,
      "LT11": 3,
      "LT12": 3,
      "LT13": 1,
      "LT14": 1,
      "LT15": 1,
      "LT16": 2,
      "LT17": 3,
      "LT18": 3,
      "LT19": 2,
      "LT20": 2,
      "LT21": 1,
      "LT22": 4,
      "LT23": 3,
      "LT24": 3,
      "LT25": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Dir_008_deep_aci",
    "timestamp": "2026-07-20T10:36:39.745656",
    "survey": "deep_aci",
    "meta": {
      "name": "Lucía Jiménez",
      "level": "Directores/Gerentes",
      "area": "Distribución",
      "country": "Guatemala",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CH1": 4,
      "CH2": 3,
      "CH3": 2,
      "CH4": 2,
      "CH5": 2,
      "CH6": 2,
      "CH7": 3,
      "CH8": 3,
      "CH9": 3,
      "CH10": 4,
      "CH11": 3,
      "CH12": 4,
      "CH13": 4,
      "CH14": 3,
      "CH15": 4,
      "CH16": 2,
      "CH17": 3,
      "CH18": 2,
      "CH19": 2,
      "CH20": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Dir_008_deep_cei",
    "timestamp": "2026-07-20T10:36:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Lucía Jiménez",
      "level": "Directores/Gerentes",
      "area": "Distribución",
      "country": "Guatemala",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 3,
      "CU2": 2,
      "CU3": 3,
      "CU4": 2,
      "CU5": 1,
      "CU6": 1,
      "CU7": 1,
      "CU8": 2,
      "CU9": 1,
      "CU10": 3,
      "CU11": 2,
      "CU12": 3,
      "CU13": 2,
      "CU14": 4,
      "CU15": 2,
      "CU16": 2,
      "CU17": 1,
      "CU18": 2,
      "CU19": 2,
      "CU20": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Dir_009_core",
    "timestamp": "2026-07-22T21:04:39.745656",
    "survey": "core",
    "meta": {
      "name": "Eduardo Castro",
      "level": "Directores/Gerentes",
      "area": "Finanzas",
      "country": "Costa Rica",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 5,
      "A2": 4,
      "A3": 3,
      "A4": 4,
      "A5": 4,
      "E1": 5,
      "E2": 3,
      "E3": 3,
      "E4": 3,
      "E5": 4,
      "E6": 3,
      "E7": 4,
      "L1": 1,
      "L2": 1,
      "L3": 1,
      "L4": 1,
      "L5": 1,
      "L6": 1,
      "R1": 4,
      "R2": 3,
      "R3": 4,
      "R4": 5,
      "C1": 3,
      "C2": 3,
      "C3": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Dir_009_full",
    "timestamp": "2026-07-22T21:04:39.745656",
    "survey": "full",
    "meta": {
      "name": "Eduardo Castro",
      "level": "Directores/Gerentes",
      "area": "Finanzas",
      "country": "Costa Rica",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 5,
      "A2": 4,
      "A3": 3,
      "A4": 4,
      "A5": 4,
      "E1": 5,
      "E2": 3,
      "E3": 3,
      "E4": 3,
      "E5": 4,
      "E6": 3,
      "E7": 4,
      "L1": 1,
      "L2": 1,
      "L3": 1,
      "L4": 1,
      "L5": 1,
      "L6": 1,
      "R1": 4,
      "R2": 3,
      "R3": 4,
      "R4": 5,
      "C1": 3,
      "C2": 3,
      "C3": 3,
      "SA6": 3,
      "SA7": 4,
      "SA8": 3,
      "SA9": 4,
      "SA10": 3,
      "SA11": 4,
      "SA12": 3,
      "EX8": 4,
      "EX9": 4,
      "EX10": 2,
      "EX11": 4,
      "EX12": 3,
      "EX13": 3,
      "EX14": 3,
      "EX15": 4,
      "EX16": 5,
      "EX17": 3,
      "EX18": 4,
      "LE7": 3,
      "LE8": 4,
      "LE9": 3,
      "LE10": 4,
      "LE11": 4,
      "LE12": 3,
      "LE13": 4,
      "LE14": 3,
      "LE15": 4,
      "RC5": 3,
      "RC6": 4,
      "RC7": 4,
      "RC8": 3,
      "RC9": 4,
      "OC4": 2,
      "OC5": 2,
      "OC6": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Dir_009_deep_lei",
    "timestamp": "2026-07-22T21:34:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Eduardo Castro",
      "level": "Directores/Gerentes",
      "area": "Finanzas",
      "country": "Costa Rica",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 3,
      "LD2": 3,
      "LD3": 2,
      "LD4": 2,
      "LD5": 1,
      "LD6": 1,
      "LD7": 2,
      "LD8": 1,
      "LD9": 1,
      "LD10": 3,
      "LD11": 3,
      "LD12": 3,
      "LD13": 1,
      "LD14": 2,
      "LD15": 2,
      "LD16": 4,
      "LD17": 3,
      "LD18": 4,
      "LD19": 3,
      "LD20": 3,
      "LD21": 3,
      "LD22": 2,
      "LD23": 3,
      "LD24": 3,
      "LD25": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Dir_009_deep_tcs",
    "timestamp": "2026-07-22T21:34:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Eduardo Castro",
      "level": "Directores/Gerentes",
      "area": "Finanzas",
      "country": "Costa Rica",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 3,
      "LT2": 2,
      "LT3": 2,
      "LT4": 4,
      "LT5": 3,
      "LT6": 4,
      "LT7": 3,
      "LT8": 2,
      "LT9": 3,
      "LT10": 2,
      "LT11": 2,
      "LT12": 2,
      "LT13": 3,
      "LT14": 3,
      "LT15": 3,
      "LT16": 2,
      "LT17": 1,
      "LT18": 2,
      "LT19": 3,
      "LT20": 3,
      "LT21": 2,
      "LT22": 2,
      "LT23": 2,
      "LT24": 2,
      "LT25": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Dir_009_deep_cei",
    "timestamp": "2026-07-22T21:34:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Eduardo Castro",
      "level": "Directores/Gerentes",
      "area": "Finanzas",
      "country": "Costa Rica",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 2,
      "CU2": 3,
      "CU3": 3,
      "CU4": 4,
      "CU5": 4,
      "CU6": 4,
      "CU7": 3,
      "CU8": 2,
      "CU9": 1,
      "CU10": 1,
      "CU11": 2,
      "CU12": 2,
      "CU13": 2,
      "CU14": 2,
      "CU15": 2,
      "CU16": 1,
      "CU17": 2,
      "CU18": 2,
      "CU19": 3,
      "CU20": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Dir_010_core",
    "timestamp": "2026-07-19T18:10:39.745656",
    "survey": "core",
    "meta": {
      "name": "Valentina Vargas",
      "level": "Directores/Gerentes",
      "area": "Transporte",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 4,
      "A2": 4,
      "A3": 4,
      "A4": 5,
      "A5": 4,
      "E1": 3,
      "E2": 4,
      "E3": 3,
      "E4": 4,
      "E5": 3,
      "E6": 3,
      "E7": 4,
      "L1": 2,
      "L2": 2,
      "L3": 2,
      "L4": 3,
      "L5": 1,
      "L6": 1,
      "R1": 3,
      "R2": 3,
      "R3": 2,
      "R4": 3,
      "C1": 4,
      "C2": 5,
      "C3": 5
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Dir_010_full",
    "timestamp": "2026-07-19T18:10:39.745656",
    "survey": "full",
    "meta": {
      "name": "Valentina Vargas",
      "level": "Directores/Gerentes",
      "area": "Transporte",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 4,
      "A2": 4,
      "A3": 4,
      "A4": 5,
      "A5": 4,
      "E1": 3,
      "E2": 4,
      "E3": 3,
      "E4": 4,
      "E5": 3,
      "E6": 3,
      "E7": 4,
      "L1": 2,
      "L2": 2,
      "L3": 2,
      "L4": 3,
      "L5": 1,
      "L6": 1,
      "R1": 3,
      "R2": 3,
      "R3": 2,
      "R4": 3,
      "C1": 4,
      "C2": 5,
      "C3": 5,
      "SA6": 3,
      "SA7": 3,
      "SA8": 2,
      "SA9": 4,
      "SA10": 3,
      "SA11": 3,
      "SA12": 3,
      "EX8": 4,
      "EX9": 5,
      "EX10": 4,
      "EX11": 3,
      "EX12": 4,
      "EX13": 3,
      "EX14": 4,
      "EX15": 4,
      "EX16": 4,
      "EX17": 3,
      "EX18": 4,
      "LE7": 3,
      "LE8": 2,
      "LE9": 3,
      "LE10": 3,
      "LE11": 2,
      "LE12": 2,
      "LE13": 3,
      "LE14": 3,
      "LE15": 2,
      "RC5": 5,
      "RC6": 4,
      "RC7": 3,
      "RC8": 4,
      "RC9": 4,
      "OC4": 2,
      "OC5": 1,
      "OC6": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Dir_010_deep_lei",
    "timestamp": "2026-07-19T18:40:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Valentina Vargas",
      "level": "Directores/Gerentes",
      "area": "Transporte",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 2,
      "LD2": 3,
      "LD3": 3,
      "LD4": 2,
      "LD5": 3,
      "LD6": 2,
      "LD7": 2,
      "LD8": 3,
      "LD9": 3,
      "LD10": 2,
      "LD11": 3,
      "LD12": 2,
      "LD13": 4,
      "LD14": 4,
      "LD15": 4,
      "LD16": 2,
      "LD17": 3,
      "LD18": 3,
      "LD19": 3,
      "LD20": 2,
      "LD21": 2,
      "LD22": 3,
      "LD23": 2,
      "LD24": 2,
      "LD25": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Dir_010_deep_tcs",
    "timestamp": "2026-07-19T18:40:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Valentina Vargas",
      "level": "Directores/Gerentes",
      "area": "Transporte",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 4,
      "LT2": 4,
      "LT3": 3,
      "LT4": 3,
      "LT5": 4,
      "LT6": 4,
      "LT7": 1,
      "LT8": 2,
      "LT9": 2,
      "LT10": 2,
      "LT11": 2,
      "LT12": 2,
      "LT13": 2,
      "LT14": 2,
      "LT15": 1,
      "LT16": 3,
      "LT17": 3,
      "LT18": 4,
      "LT19": 3,
      "LT20": 3,
      "LT21": 2,
      "LT22": 4,
      "LT23": 4,
      "LT24": 4,
      "LT25": 4
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Dir_010_deep_aci",
    "timestamp": "2026-07-19T18:40:39.745656",
    "survey": "deep_aci",
    "meta": {
      "name": "Valentina Vargas",
      "level": "Directores/Gerentes",
      "area": "Transporte",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CH1": 2,
      "CH2": 2,
      "CH3": 2,
      "CH4": 2,
      "CH5": 3,
      "CH6": 2,
      "CH7": 3,
      "CH8": 4,
      "CH9": 4,
      "CH10": 3,
      "CH11": 2,
      "CH12": 4,
      "CH13": 3,
      "CH14": 5,
      "CH15": 4,
      "CH16": 3,
      "CH17": 4,
      "CH18": 4,
      "CH19": 4,
      "CH20": 4
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Dir_010_deep_cei",
    "timestamp": "2026-07-19T18:40:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Valentina Vargas",
      "level": "Directores/Gerentes",
      "area": "Transporte",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 5,
      "CU2": 4,
      "CU3": 4,
      "CU4": 3,
      "CU5": 3,
      "CU6": 4,
      "CU7": 2,
      "CU8": 1,
      "CU9": 1,
      "CU10": 4,
      "CU11": 4,
      "CU12": 3,
      "CU13": 1,
      "CU14": 1,
      "CU15": 1,
      "CU16": 3,
      "CU17": 2,
      "CU18": 1,
      "CU19": 2,
      "CU20": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Dir_011_core",
    "timestamp": "2026-07-14T05:41:39.745656",
    "survey": "core",
    "meta": {
      "name": "Pablo Reyes",
      "level": "Directores/Gerentes",
      "area": "Almacenamiento",
      "country": "Nicaragua",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 4,
      "A2": 3,
      "A3": 4,
      "A4": 2,
      "A5": 3,
      "E1": 5,
      "E2": 4,
      "E3": 4,
      "E4": 5,
      "E5": 5,
      "E6": 5,
      "E7": 3,
      "L1": 4,
      "L2": 4,
      "L3": 4,
      "L4": 4,
      "L5": 5,
      "L6": 3,
      "R1": 3,
      "R2": 5,
      "R3": 4,
      "R4": 3,
      "C1": 2,
      "C2": 1,
      "C3": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Dir_011_full",
    "timestamp": "2026-07-14T05:41:39.745656",
    "survey": "full",
    "meta": {
      "name": "Pablo Reyes",
      "level": "Directores/Gerentes",
      "area": "Almacenamiento",
      "country": "Nicaragua",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 4,
      "A2": 3,
      "A3": 4,
      "A4": 2,
      "A5": 3,
      "E1": 5,
      "E2": 4,
      "E3": 4,
      "E4": 5,
      "E5": 5,
      "E6": 5,
      "E7": 3,
      "L1": 4,
      "L2": 4,
      "L3": 4,
      "L4": 4,
      "L5": 5,
      "L6": 3,
      "R1": 3,
      "R2": 5,
      "R3": 4,
      "R4": 3,
      "C1": 2,
      "C2": 1,
      "C3": 2,
      "SA6": 3,
      "SA7": 5,
      "SA8": 4,
      "SA9": 4,
      "SA10": 4,
      "SA11": 4,
      "SA12": 3,
      "EX8": 3,
      "EX9": 3,
      "EX10": 3,
      "EX11": 4,
      "EX12": 3,
      "EX13": 5,
      "EX14": 4,
      "EX15": 3,
      "EX16": 4,
      "EX17": 4,
      "EX18": 3,
      "LE7": 3,
      "LE8": 2,
      "LE9": 3,
      "LE10": 2,
      "LE11": 2,
      "LE12": 3,
      "LE13": 3,
      "LE14": 3,
      "LE15": 2,
      "RC5": 4,
      "RC6": 3,
      "RC7": 5,
      "RC8": 4,
      "RC9": 4,
      "OC4": 3,
      "OC5": 2,
      "OC6": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Dir_011_deep_lei",
    "timestamp": "2026-07-14T06:11:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Pablo Reyes",
      "level": "Directores/Gerentes",
      "area": "Almacenamiento",
      "country": "Nicaragua",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 3,
      "LD2": 3,
      "LD3": 3,
      "LD4": 3,
      "LD5": 3,
      "LD6": 3,
      "LD7": 2,
      "LD8": 3,
      "LD9": 3,
      "LD10": 2,
      "LD11": 2,
      "LD12": 2,
      "LD13": 2,
      "LD14": 2,
      "LD15": 3,
      "LD16": 3,
      "LD17": 5,
      "LD18": 4,
      "LD19": 1,
      "LD20": 3,
      "LD21": 1,
      "LD22": 4,
      "LD23": 3,
      "LD24": 4,
      "LD25": 4
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Dir_011_deep_tcs",
    "timestamp": "2026-07-14T06:11:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Pablo Reyes",
      "level": "Directores/Gerentes",
      "area": "Almacenamiento",
      "country": "Nicaragua",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 3,
      "LT2": 2,
      "LT3": 3,
      "LT4": 1,
      "LT5": 2,
      "LT6": 2,
      "LT7": 1,
      "LT8": 2,
      "LT9": 2,
      "LT10": 2,
      "LT11": 1,
      "LT12": 2,
      "LT13": 2,
      "LT14": 2,
      "LT15": 3,
      "LT16": 2,
      "LT17": 3,
      "LT18": 2,
      "LT19": 3,
      "LT20": 3,
      "LT21": 3,
      "LT22": 3,
      "LT23": 2,
      "LT24": 3,
      "LT25": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Dir_011_deep_cei",
    "timestamp": "2026-07-14T06:11:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Pablo Reyes",
      "level": "Directores/Gerentes",
      "area": "Almacenamiento",
      "country": "Nicaragua",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 3,
      "CU2": 3,
      "CU3": 4,
      "CU4": 1,
      "CU5": 1,
      "CU6": 1,
      "CU7": 2,
      "CU8": 3,
      "CU9": 4,
      "CU10": 2,
      "CU11": 2,
      "CU12": 2,
      "CU13": 4,
      "CU14": 4,
      "CU15": 2,
      "CU16": 2,
      "CU17": 3,
      "CU18": 2,
      "CU19": 3,
      "CU20": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_000_core",
    "timestamp": "2026-07-20T08:49:39.745656",
    "survey": "core",
    "meta": {
      "name": "Daniela Ortega",
      "level": "Supervisores",
      "area": "Distribución",
      "country": "Guatemala",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 3,
      "A2": 3,
      "A3": 3,
      "A4": 4,
      "A5": 2,
      "E1": 4,
      "E2": 2,
      "E3": 2,
      "E4": 1,
      "E5": 1,
      "E6": 3,
      "E7": 2,
      "L1": 1,
      "L2": 1,
      "L3": 1,
      "L4": 1,
      "L5": 2,
      "L6": 1,
      "R1": 5,
      "R2": 5,
      "R3": 3,
      "R4": 3,
      "C1": 2,
      "C2": 2,
      "C3": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_000_full",
    "timestamp": "2026-07-20T08:49:39.745656",
    "survey": "full",
    "meta": {
      "name": "Daniela Ortega",
      "level": "Supervisores",
      "area": "Distribución",
      "country": "Guatemala",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 3,
      "A2": 3,
      "A3": 3,
      "A4": 4,
      "A5": 2,
      "E1": 4,
      "E2": 2,
      "E3": 2,
      "E4": 1,
      "E5": 1,
      "E6": 3,
      "E7": 2,
      "L1": 1,
      "L2": 1,
      "L3": 1,
      "L4": 1,
      "L5": 2,
      "L6": 1,
      "R1": 5,
      "R2": 5,
      "R3": 3,
      "R4": 3,
      "C1": 2,
      "C2": 2,
      "C3": 2,
      "SA6": 3,
      "SA7": 4,
      "SA8": 3,
      "SA9": 3,
      "SA10": 1,
      "SA11": 4,
      "SA12": 3,
      "EX8": 4,
      "EX9": 4,
      "EX10": 4,
      "EX11": 4,
      "EX12": 3,
      "EX13": 3,
      "EX14": 3,
      "EX15": 4,
      "EX16": 4,
      "EX17": 3,
      "EX18": 4,
      "LE7": 3,
      "LE8": 3,
      "LE9": 3,
      "LE10": 3,
      "LE11": 2,
      "LE12": 3,
      "LE13": 3,
      "LE14": 2,
      "LE15": 2,
      "RC5": 3,
      "RC6": 3,
      "RC7": 3,
      "RC8": 3,
      "RC9": 3,
      "OC4": 3,
      "OC5": 3,
      "OC6": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_000_deep_lei",
    "timestamp": "2026-07-20T09:19:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Daniela Ortega",
      "level": "Supervisores",
      "area": "Distribución",
      "country": "Guatemala",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 1,
      "LD2": 2,
      "LD3": 2,
      "LD4": 2,
      "LD5": 1,
      "LD6": 2,
      "LD7": 3,
      "LD8": 2,
      "LD9": 3,
      "LD10": 1,
      "LD11": 2,
      "LD12": 2,
      "LD13": 3,
      "LD14": 3,
      "LD15": 3,
      "LD16": 2,
      "LD17": 1,
      "LD18": 2,
      "LD19": 3,
      "LD20": 3,
      "LD21": 4,
      "LD22": 2,
      "LD23": 2,
      "LD24": 2,
      "LD25": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_000_deep_tcs",
    "timestamp": "2026-07-20T09:19:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Daniela Ortega",
      "level": "Supervisores",
      "area": "Distribución",
      "country": "Guatemala",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 4,
      "LT2": 3,
      "LT3": 3,
      "LT4": 2,
      "LT5": 2,
      "LT6": 3,
      "LT7": 1,
      "LT8": 2,
      "LT9": 2,
      "LT10": 1,
      "LT11": 1,
      "LT12": 1,
      "LT13": 2,
      "LT14": 2,
      "LT15": 3,
      "LT16": 1,
      "LT17": 1,
      "LT18": 2,
      "LT19": 1,
      "LT20": 1,
      "LT21": 1,
      "LT22": 3,
      "LT23": 2,
      "LT24": 2,
      "LT25": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_000_deep_eci",
    "timestamp": "2026-07-20T09:19:39.745656",
    "survey": "deep_eci",
    "meta": {
      "name": "Daniela Ortega",
      "level": "Supervisores",
      "area": "Distribución",
      "country": "Guatemala",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "EXD1": 3,
      "EXD2": 1,
      "EXD3": 3,
      "EXD4": 2,
      "EXD5": 3,
      "EXD6": 4,
      "EXD7": 4,
      "EXD8": 3,
      "EXD9": 4,
      "EXD10": 4,
      "EXD11": 2,
      "EXD12": 4,
      "EXD13": 3,
      "EXD14": 3,
      "EXD15": 4,
      "EXD16": 3,
      "EXD17": 3,
      "EXD18": 3,
      "EXD19": 4,
      "EXD20": 5,
      "EXD21": 5,
      "EXD22": 4,
      "EXD23": 3,
      "EXD24": 4,
      "EXD25": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_000_deep_aci",
    "timestamp": "2026-07-20T09:19:39.745656",
    "survey": "deep_aci",
    "meta": {
      "name": "Daniela Ortega",
      "level": "Supervisores",
      "area": "Distribución",
      "country": "Guatemala",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CH1": 3,
      "CH2": 3,
      "CH3": 3,
      "CH4": 3,
      "CH5": 3,
      "CH6": 4,
      "CH7": 3,
      "CH8": 3,
      "CH9": 3,
      "CH10": 1,
      "CH11": 1,
      "CH12": 1,
      "CH13": 2,
      "CH14": 3,
      "CH15": 2,
      "CH16": 3,
      "CH17": 2,
      "CH18": 3,
      "CH19": 2,
      "CH20": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_000_deep_cei",
    "timestamp": "2026-07-20T09:19:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Daniela Ortega",
      "level": "Supervisores",
      "area": "Distribución",
      "country": "Guatemala",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 1,
      "CU2": 2,
      "CU3": 2,
      "CU4": 3,
      "CU5": 2,
      "CU6": 3,
      "CU7": 1,
      "CU8": 1,
      "CU9": 1,
      "CU10": 2,
      "CU11": 3,
      "CU12": 3,
      "CU13": 1,
      "CU14": 1,
      "CU15": 1,
      "CU16": 1,
      "CU17": 1,
      "CU18": 1,
      "CU19": 1,
      "CU20": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_001_core",
    "timestamp": "2026-07-12T10:52:39.745656",
    "survey": "core",
    "meta": {
      "name": "Sebastián Gutiérrez",
      "level": "Supervisores",
      "area": "Calidad",
      "country": "Costa Rica",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 4,
      "A2": 5,
      "A3": 3,
      "A4": 5,
      "A5": 4,
      "E1": 3,
      "E2": 5,
      "E3": 4,
      "E4": 5,
      "E5": 4,
      "E6": 4,
      "E7": 5,
      "L1": 3,
      "L2": 2,
      "L3": 3,
      "L4": 3,
      "L5": 3,
      "L6": 4,
      "R1": 2,
      "R2": 2,
      "R3": 1,
      "R4": 1,
      "C1": 3,
      "C2": 3,
      "C3": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_001_full",
    "timestamp": "2026-07-12T10:52:39.745656",
    "survey": "full",
    "meta": {
      "name": "Sebastián Gutiérrez",
      "level": "Supervisores",
      "area": "Calidad",
      "country": "Costa Rica",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 4,
      "A2": 5,
      "A3": 3,
      "A4": 5,
      "A5": 4,
      "E1": 3,
      "E2": 5,
      "E3": 4,
      "E4": 5,
      "E5": 4,
      "E6": 4,
      "E7": 5,
      "L1": 3,
      "L2": 2,
      "L3": 3,
      "L4": 3,
      "L5": 3,
      "L6": 4,
      "R1": 2,
      "R2": 2,
      "R3": 1,
      "R4": 1,
      "C1": 3,
      "C2": 3,
      "C3": 2,
      "SA6": 5,
      "SA7": 4,
      "SA8": 4,
      "SA9": 3,
      "SA10": 5,
      "SA11": 3,
      "SA12": 4,
      "EX8": 4,
      "EX9": 5,
      "EX10": 3,
      "EX11": 3,
      "EX12": 5,
      "EX13": 4,
      "EX14": 5,
      "EX15": 4,
      "EX16": 3,
      "EX17": 4,
      "EX18": 4,
      "LE7": 3,
      "LE8": 4,
      "LE9": 4,
      "LE10": 4,
      "LE11": 3,
      "LE12": 4,
      "LE13": 4,
      "LE14": 3,
      "LE15": 4,
      "RC5": 4,
      "RC6": 4,
      "RC7": 4,
      "RC8": 3,
      "RC9": 3,
      "OC4": 3,
      "OC5": 3,
      "OC6": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_001_deep_lei",
    "timestamp": "2026-07-12T11:22:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Sebastián Gutiérrez",
      "level": "Supervisores",
      "area": "Calidad",
      "country": "Costa Rica",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 3,
      "LD2": 2,
      "LD3": 2,
      "LD4": 2,
      "LD5": 1,
      "LD6": 1,
      "LD7": 3,
      "LD8": 3,
      "LD9": 2,
      "LD10": 2,
      "LD11": 3,
      "LD12": 3,
      "LD13": 3,
      "LD14": 3,
      "LD15": 2,
      "LD16": 2,
      "LD17": 2,
      "LD18": 3,
      "LD19": 2,
      "LD20": 1,
      "LD21": 1,
      "LD22": 3,
      "LD23": 2,
      "LD24": 3,
      "LD25": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_001_deep_tcs",
    "timestamp": "2026-07-12T11:22:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Sebastián Gutiérrez",
      "level": "Supervisores",
      "area": "Calidad",
      "country": "Costa Rica",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 1,
      "LT2": 2,
      "LT3": 2,
      "LT4": 1,
      "LT5": 1,
      "LT6": 1,
      "LT7": 3,
      "LT8": 2,
      "LT9": 2,
      "LT10": 1,
      "LT11": 2,
      "LT12": 2,
      "LT13": 2,
      "LT14": 2,
      "LT15": 1,
      "LT16": 4,
      "LT17": 3,
      "LT18": 3,
      "LT19": 2,
      "LT20": 1,
      "LT21": 1,
      "LT22": 2,
      "LT23": 2,
      "LT24": 1,
      "LT25": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_001_deep_aci",
    "timestamp": "2026-07-12T11:22:39.745656",
    "survey": "deep_aci",
    "meta": {
      "name": "Sebastián Gutiérrez",
      "level": "Supervisores",
      "area": "Calidad",
      "country": "Costa Rica",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CH1": 4,
      "CH2": 4,
      "CH3": 3,
      "CH4": 3,
      "CH5": 3,
      "CH6": 4,
      "CH7": 3,
      "CH8": 2,
      "CH9": 3,
      "CH10": 2,
      "CH11": 2,
      "CH12": 3,
      "CH13": 3,
      "CH14": 4,
      "CH15": 3,
      "CH16": 3,
      "CH17": 3,
      "CH18": 3,
      "CH19": 3,
      "CH20": 4
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_001_deep_cei",
    "timestamp": "2026-07-12T11:22:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Sebastián Gutiérrez",
      "level": "Supervisores",
      "area": "Calidad",
      "country": "Costa Rica",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 1,
      "CU2": 2,
      "CU3": 1,
      "CU4": 4,
      "CU5": 4,
      "CU6": 2,
      "CU7": 3,
      "CU8": 3,
      "CU9": 2,
      "CU10": 2,
      "CU11": 3,
      "CU12": 2,
      "CU13": 2,
      "CU14": 2,
      "CU15": 2,
      "CU16": 1,
      "CU17": 1,
      "CU18": 1,
      "CU19": 1,
      "CU20": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_002_core",
    "timestamp": "2026-07-14T09:25:39.745656",
    "survey": "core",
    "meta": {
      "name": "Natalia Ramos",
      "level": "Supervisores",
      "area": "Almacenamiento",
      "country": "Nicaragua",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 2,
      "A2": 3,
      "A3": 2,
      "A4": 3,
      "A5": 3,
      "E1": 4,
      "E2": 4,
      "E3": 4,
      "E4": 4,
      "E5": 4,
      "E6": 5,
      "E7": 5,
      "L1": 4,
      "L2": 4,
      "L3": 4,
      "L4": 4,
      "L5": 4,
      "L6": 4,
      "R1": 4,
      "R2": 3,
      "R3": 3,
      "R4": 3,
      "C1": 2,
      "C2": 2,
      "C3": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_002_full",
    "timestamp": "2026-07-14T09:25:39.745656",
    "survey": "full",
    "meta": {
      "name": "Natalia Ramos",
      "level": "Supervisores",
      "area": "Almacenamiento",
      "country": "Nicaragua",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 2,
      "A2": 3,
      "A3": 2,
      "A4": 3,
      "A5": 3,
      "E1": 4,
      "E2": 4,
      "E3": 4,
      "E4": 4,
      "E5": 4,
      "E6": 5,
      "E7": 5,
      "L1": 4,
      "L2": 4,
      "L3": 4,
      "L4": 4,
      "L5": 4,
      "L6": 4,
      "R1": 4,
      "R2": 3,
      "R3": 3,
      "R4": 3,
      "C1": 2,
      "C2": 2,
      "C3": 2,
      "SA6": 5,
      "SA7": 5,
      "SA8": 4,
      "SA9": 3,
      "SA10": 5,
      "SA11": 4,
      "SA12": 5,
      "EX8": 3,
      "EX9": 4,
      "EX10": 4,
      "EX11": 4,
      "EX12": 4,
      "EX13": 5,
      "EX14": 4,
      "EX15": 5,
      "EX16": 4,
      "EX17": 4,
      "EX18": 4,
      "LE7": 3,
      "LE8": 2,
      "LE9": 3,
      "LE10": 2,
      "LE11": 3,
      "LE12": 2,
      "LE13": 3,
      "LE14": 2,
      "LE15": 3,
      "RC5": 3,
      "RC6": 4,
      "RC7": 4,
      "RC8": 3,
      "RC9": 4,
      "OC4": 1,
      "OC5": 3,
      "OC6": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_002_deep_lei",
    "timestamp": "2026-07-14T09:55:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Natalia Ramos",
      "level": "Supervisores",
      "area": "Almacenamiento",
      "country": "Nicaragua",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 4,
      "LD2": 2,
      "LD3": 2,
      "LD4": 2,
      "LD5": 2,
      "LD6": 2,
      "LD7": 3,
      "LD8": 3,
      "LD9": 2,
      "LD10": 1,
      "LD11": 1,
      "LD12": 1,
      "LD13": 3,
      "LD14": 3,
      "LD15": 3,
      "LD16": 1,
      "LD17": 1,
      "LD18": 1,
      "LD19": 3,
      "LD20": 3,
      "LD21": 2,
      "LD22": 3,
      "LD23": 3,
      "LD24": 3,
      "LD25": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_002_deep_tcs",
    "timestamp": "2026-07-14T09:55:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Natalia Ramos",
      "level": "Supervisores",
      "area": "Almacenamiento",
      "country": "Nicaragua",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 3,
      "LT2": 3,
      "LT3": 4,
      "LT4": 2,
      "LT5": 2,
      "LT6": 2,
      "LT7": 2,
      "LT8": 1,
      "LT9": 2,
      "LT10": 1,
      "LT11": 1,
      "LT12": 1,
      "LT13": 4,
      "LT14": 4,
      "LT15": 2,
      "LT16": 3,
      "LT17": 3,
      "LT18": 4,
      "LT19": 3,
      "LT20": 2,
      "LT21": 2,
      "LT22": 3,
      "LT23": 2,
      "LT24": 2,
      "LT25": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_002_deep_aci",
    "timestamp": "2026-07-14T09:55:39.745656",
    "survey": "deep_aci",
    "meta": {
      "name": "Natalia Ramos",
      "level": "Supervisores",
      "area": "Almacenamiento",
      "country": "Nicaragua",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CH1": 3,
      "CH2": 3,
      "CH3": 2,
      "CH4": 2,
      "CH5": 3,
      "CH6": 3,
      "CH7": 2,
      "CH8": 2,
      "CH9": 3,
      "CH10": 4,
      "CH11": 4,
      "CH12": 4,
      "CH13": 3,
      "CH14": 3,
      "CH15": 2,
      "CH16": 3,
      "CH17": 3,
      "CH18": 3,
      "CH19": 2,
      "CH20": 4
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_002_deep_cei",
    "timestamp": "2026-07-14T09:55:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Natalia Ramos",
      "level": "Supervisores",
      "area": "Almacenamiento",
      "country": "Nicaragua",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 3,
      "CU2": 3,
      "CU3": 4,
      "CU4": 1,
      "CU5": 1,
      "CU6": 1,
      "CU7": 2,
      "CU8": 2,
      "CU9": 2,
      "CU10": 1,
      "CU11": 1,
      "CU12": 1,
      "CU13": 3,
      "CU14": 4,
      "CU15": 4,
      "CU16": 1,
      "CU17": 1,
      "CU18": 2,
      "CU19": 1,
      "CU20": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_003_core",
    "timestamp": "2026-07-23T02:36:39.745656",
    "survey": "core",
    "meta": {
      "name": "Alejandro Molina",
      "level": "Supervisores",
      "area": "Finanzas",
      "country": "Costa Rica",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 3,
      "A2": 2,
      "A3": 2,
      "A4": 2,
      "A5": 1,
      "E1": 3,
      "E2": 2,
      "E3": 3,
      "E4": 3,
      "E5": 3,
      "E6": 3,
      "E7": 3,
      "L1": 1,
      "L2": 3,
      "L3": 1,
      "L4": 2,
      "L5": 1,
      "L6": 1,
      "R1": 3,
      "R2": 2,
      "R3": 4,
      "R4": 3,
      "C1": 4,
      "C2": 3,
      "C3": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_003_full",
    "timestamp": "2026-07-23T02:36:39.745656",
    "survey": "full",
    "meta": {
      "name": "Alejandro Molina",
      "level": "Supervisores",
      "area": "Finanzas",
      "country": "Costa Rica",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 3,
      "A2": 2,
      "A3": 2,
      "A4": 2,
      "A5": 1,
      "E1": 3,
      "E2": 2,
      "E3": 3,
      "E4": 3,
      "E5": 3,
      "E6": 3,
      "E7": 3,
      "L1": 1,
      "L2": 3,
      "L3": 1,
      "L4": 2,
      "L5": 1,
      "L6": 1,
      "R1": 3,
      "R2": 2,
      "R3": 4,
      "R4": 3,
      "C1": 4,
      "C2": 3,
      "C3": 3,
      "SA6": 2,
      "SA7": 3,
      "SA8": 2,
      "SA9": 2,
      "SA10": 3,
      "SA11": 3,
      "SA12": 2,
      "EX8": 3,
      "EX9": 3,
      "EX10": 3,
      "EX11": 2,
      "EX12": 2,
      "EX13": 2,
      "EX14": 2,
      "EX15": 2,
      "EX16": 2,
      "EX17": 2,
      "EX18": 3,
      "LE7": 1,
      "LE8": 1,
      "LE9": 1,
      "LE10": 2,
      "LE11": 2,
      "LE12": 2,
      "LE13": 2,
      "LE14": 2,
      "LE15": 2,
      "RC5": 3,
      "RC6": 4,
      "RC7": 4,
      "RC8": 3,
      "RC9": 3,
      "OC4": 3,
      "OC5": 2,
      "OC6": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_003_deep_lei",
    "timestamp": "2026-07-23T03:06:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Alejandro Molina",
      "level": "Supervisores",
      "area": "Finanzas",
      "country": "Costa Rica",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 1,
      "LD2": 2,
      "LD3": 2,
      "LD4": 1,
      "LD5": 2,
      "LD6": 1,
      "LD7": 3,
      "LD8": 2,
      "LD9": 3,
      "LD10": 2,
      "LD11": 2,
      "LD12": 2,
      "LD13": 1,
      "LD14": 1,
      "LD15": 1,
      "LD16": 2,
      "LD17": 1,
      "LD18": 1,
      "LD19": 2,
      "LD20": 2,
      "LD21": 2,
      "LD22": 3,
      "LD23": 3,
      "LD24": 3,
      "LD25": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_003_deep_tcs",
    "timestamp": "2026-07-23T03:06:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Alejandro Molina",
      "level": "Supervisores",
      "area": "Finanzas",
      "country": "Costa Rica",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 1,
      "LT2": 1,
      "LT3": 1,
      "LT4": 2,
      "LT5": 3,
      "LT6": 2,
      "LT7": 2,
      "LT8": 2,
      "LT9": 2,
      "LT10": 1,
      "LT11": 1,
      "LT12": 1,
      "LT13": 1,
      "LT14": 1,
      "LT15": 1,
      "LT16": 3,
      "LT17": 2,
      "LT18": 2,
      "LT19": 1,
      "LT20": 3,
      "LT21": 2,
      "LT22": 2,
      "LT23": 2,
      "LT24": 2,
      "LT25": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_003_deep_eci",
    "timestamp": "2026-07-23T03:06:39.745656",
    "survey": "deep_eci",
    "meta": {
      "name": "Alejandro Molina",
      "level": "Supervisores",
      "area": "Finanzas",
      "country": "Costa Rica",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "EXD1": 4,
      "EXD2": 4,
      "EXD3": 4,
      "EXD4": 5,
      "EXD5": 5,
      "EXD6": 4,
      "EXD7": 3,
      "EXD8": 3,
      "EXD9": 3,
      "EXD10": 3,
      "EXD11": 3,
      "EXD12": 4,
      "EXD13": 4,
      "EXD14": 3,
      "EXD15": 4,
      "EXD16": 3,
      "EXD17": 4,
      "EXD18": 4,
      "EXD19": 4,
      "EXD20": 3,
      "EXD21": 3,
      "EXD22": 3,
      "EXD23": 4,
      "EXD24": 3,
      "EXD25": 4
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_003_deep_aci",
    "timestamp": "2026-07-23T03:06:39.745656",
    "survey": "deep_aci",
    "meta": {
      "name": "Alejandro Molina",
      "level": "Supervisores",
      "area": "Finanzas",
      "country": "Costa Rica",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CH1": 5,
      "CH2": 4,
      "CH3": 4,
      "CH4": 2,
      "CH5": 2,
      "CH6": 2,
      "CH7": 1,
      "CH8": 3,
      "CH9": 3,
      "CH10": 3,
      "CH11": 3,
      "CH12": 4,
      "CH13": 4,
      "CH14": 5,
      "CH15": 4,
      "CH16": 3,
      "CH17": 3,
      "CH18": 3,
      "CH19": 4,
      "CH20": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_003_deep_cei",
    "timestamp": "2026-07-23T03:06:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Alejandro Molina",
      "level": "Supervisores",
      "area": "Finanzas",
      "country": "Costa Rica",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 2,
      "CU2": 2,
      "CU3": 3,
      "CU4": 2,
      "CU5": 2,
      "CU6": 2,
      "CU7": 2,
      "CU8": 2,
      "CU9": 2,
      "CU10": 2,
      "CU11": 2,
      "CU12": 2,
      "CU13": 1,
      "CU14": 1,
      "CU15": 3,
      "CU16": 2,
      "CU17": 1,
      "CU18": 1,
      "CU19": 1,
      "CU20": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_004_core",
    "timestamp": "2026-07-18T12:57:39.745656",
    "survey": "core",
    "meta": {
      "name": "Fernanda Cruz",
      "level": "Supervisores",
      "area": "Calidad",
      "country": "Nicaragua",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 1,
      "A2": 3,
      "A3": 1,
      "A4": 1,
      "A5": 3,
      "E1": 3,
      "E2": 3,
      "E3": 3,
      "E4": 2,
      "E5": 3,
      "E6": 4,
      "E7": 3,
      "L1": 1,
      "L2": 2,
      "L3": 3,
      "L4": 2,
      "L5": 2,
      "L6": 3,
      "R1": 4,
      "R2": 3,
      "R3": 4,
      "R4": 4,
      "C1": 2,
      "C2": 5,
      "C3": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_004_full",
    "timestamp": "2026-07-18T12:57:39.745656",
    "survey": "full",
    "meta": {
      "name": "Fernanda Cruz",
      "level": "Supervisores",
      "area": "Calidad",
      "country": "Nicaragua",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 1,
      "A2": 3,
      "A3": 1,
      "A4": 1,
      "A5": 3,
      "E1": 3,
      "E2": 3,
      "E3": 3,
      "E4": 2,
      "E5": 3,
      "E6": 4,
      "E7": 3,
      "L1": 1,
      "L2": 2,
      "L3": 3,
      "L4": 2,
      "L5": 2,
      "L6": 3,
      "R1": 4,
      "R2": 3,
      "R3": 4,
      "R4": 4,
      "C1": 2,
      "C2": 5,
      "C3": 2,
      "SA6": 2,
      "SA7": 2,
      "SA8": 2,
      "SA9": 3,
      "SA10": 3,
      "SA11": 2,
      "SA12": 2,
      "EX8": 5,
      "EX9": 5,
      "EX10": 5,
      "EX11": 5,
      "EX12": 4,
      "EX13": 4,
      "EX14": 5,
      "EX15": 4,
      "EX16": 5,
      "EX17": 4,
      "EX18": 4,
      "LE7": 3,
      "LE8": 3,
      "LE9": 2,
      "LE10": 2,
      "LE11": 3,
      "LE12": 1,
      "LE13": 3,
      "LE14": 3,
      "LE15": 3,
      "RC5": 3,
      "RC6": 3,
      "RC7": 4,
      "RC8": 3,
      "RC9": 3,
      "OC4": 1,
      "OC5": 1,
      "OC6": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_004_deep_lei",
    "timestamp": "2026-07-18T13:27:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Fernanda Cruz",
      "level": "Supervisores",
      "area": "Calidad",
      "country": "Nicaragua",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 1,
      "LD2": 2,
      "LD3": 1,
      "LD4": 2,
      "LD5": 2,
      "LD6": 2,
      "LD7": 1,
      "LD8": 1,
      "LD9": 1,
      "LD10": 1,
      "LD11": 2,
      "LD12": 1,
      "LD13": 2,
      "LD14": 2,
      "LD15": 3,
      "LD16": 2,
      "LD17": 2,
      "LD18": 2,
      "LD19": 2,
      "LD20": 1,
      "LD21": 1,
      "LD22": 2,
      "LD23": 3,
      "LD24": 3,
      "LD25": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_004_deep_tcs",
    "timestamp": "2026-07-18T13:27:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Fernanda Cruz",
      "level": "Supervisores",
      "area": "Calidad",
      "country": "Nicaragua",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 3,
      "LT2": 2,
      "LT3": 3,
      "LT4": 1,
      "LT5": 2,
      "LT6": 2,
      "LT7": 4,
      "LT8": 3,
      "LT9": 3,
      "LT10": 3,
      "LT11": 2,
      "LT12": 2,
      "LT13": 4,
      "LT14": 3,
      "LT15": 2,
      "LT16": 2,
      "LT17": 3,
      "LT18": 4,
      "LT19": 1,
      "LT20": 2,
      "LT21": 1,
      "LT22": 1,
      "LT23": 1,
      "LT24": 1,
      "LT25": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_004_deep_aci",
    "timestamp": "2026-07-18T13:27:39.745656",
    "survey": "deep_aci",
    "meta": {
      "name": "Fernanda Cruz",
      "level": "Supervisores",
      "area": "Calidad",
      "country": "Nicaragua",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CH1": 3,
      "CH2": 3,
      "CH3": 4,
      "CH4": 2,
      "CH5": 2,
      "CH6": 2,
      "CH7": 3,
      "CH8": 4,
      "CH9": 3,
      "CH10": 3,
      "CH11": 2,
      "CH12": 4,
      "CH13": 3,
      "CH14": 3,
      "CH15": 2,
      "CH16": 2,
      "CH17": 2,
      "CH18": 2,
      "CH19": 2,
      "CH20": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_004_deep_cei",
    "timestamp": "2026-07-18T13:27:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Fernanda Cruz",
      "level": "Supervisores",
      "area": "Calidad",
      "country": "Nicaragua",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 3,
      "CU2": 3,
      "CU3": 4,
      "CU4": 3,
      "CU5": 3,
      "CU6": 3,
      "CU7": 4,
      "CU8": 2,
      "CU9": 2,
      "CU10": 3,
      "CU11": 3,
      "CU12": 3,
      "CU13": 3,
      "CU14": 4,
      "CU15": 3,
      "CU16": 4,
      "CU17": 2,
      "CU18": 2,
      "CU19": 3,
      "CU20": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_005_core",
    "timestamp": "2026-07-19T13:19:39.745656",
    "survey": "core",
    "meta": {
      "name": "Diego Medina",
      "level": "Supervisores",
      "area": "Calidad",
      "country": "Nicaragua",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 3,
      "A2": 4,
      "A3": 4,
      "A4": 4,
      "A5": 4,
      "E1": 2,
      "E2": 2,
      "E3": 1,
      "E4": 2,
      "E5": 2,
      "E6": 3,
      "E7": 2,
      "L1": 3,
      "L2": 3,
      "L3": 3,
      "L4": 2,
      "L5": 2,
      "L6": 3,
      "R1": 4,
      "R2": 3,
      "R3": 2,
      "R4": 3,
      "C1": 2,
      "C2": 2,
      "C3": 4
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_005_full",
    "timestamp": "2026-07-19T13:19:39.745656",
    "survey": "full",
    "meta": {
      "name": "Diego Medina",
      "level": "Supervisores",
      "area": "Calidad",
      "country": "Nicaragua",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 3,
      "A2": 4,
      "A3": 4,
      "A4": 4,
      "A5": 4,
      "E1": 2,
      "E2": 2,
      "E3": 1,
      "E4": 2,
      "E5": 2,
      "E6": 3,
      "E7": 2,
      "L1": 3,
      "L2": 3,
      "L3": 3,
      "L4": 2,
      "L5": 2,
      "L6": 3,
      "R1": 4,
      "R2": 3,
      "R3": 2,
      "R4": 3,
      "C1": 2,
      "C2": 2,
      "C3": 4,
      "SA6": 2,
      "SA7": 1,
      "SA8": 3,
      "SA9": 3,
      "SA10": 1,
      "SA11": 1,
      "SA12": 2,
      "EX8": 5,
      "EX9": 4,
      "EX10": 4,
      "EX11": 3,
      "EX12": 3,
      "EX13": 4,
      "EX14": 4,
      "EX15": 4,
      "EX16": 4,
      "EX17": 3,
      "EX18": 4,
      "LE7": 2,
      "LE8": 2,
      "LE9": 1,
      "LE10": 3,
      "LE11": 2,
      "LE12": 2,
      "LE13": 2,
      "LE14": 1,
      "LE15": 2,
      "RC5": 1,
      "RC6": 1,
      "RC7": 2,
      "RC8": 1,
      "RC9": 1,
      "OC4": 3,
      "OC5": 1,
      "OC6": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_005_deep_lei",
    "timestamp": "2026-07-19T13:49:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Diego Medina",
      "level": "Supervisores",
      "area": "Calidad",
      "country": "Nicaragua",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 1,
      "LD2": 1,
      "LD3": 1,
      "LD4": 2,
      "LD5": 3,
      "LD6": 3,
      "LD7": 2,
      "LD8": 2,
      "LD9": 3,
      "LD10": 2,
      "LD11": 2,
      "LD12": 2,
      "LD13": 2,
      "LD14": 2,
      "LD15": 1,
      "LD16": 1,
      "LD17": 1,
      "LD18": 1,
      "LD19": 2,
      "LD20": 1,
      "LD21": 1,
      "LD22": 2,
      "LD23": 1,
      "LD24": 3,
      "LD25": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_005_deep_tcs",
    "timestamp": "2026-07-19T13:49:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Diego Medina",
      "level": "Supervisores",
      "area": "Calidad",
      "country": "Nicaragua",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 3,
      "LT2": 3,
      "LT3": 4,
      "LT4": 3,
      "LT5": 2,
      "LT6": 3,
      "LT7": 3,
      "LT8": 3,
      "LT9": 3,
      "LT10": 1,
      "LT11": 2,
      "LT12": 2,
      "LT13": 2,
      "LT14": 3,
      "LT15": 2,
      "LT16": 2,
      "LT17": 2,
      "LT18": 1,
      "LT19": 1,
      "LT20": 1,
      "LT21": 1,
      "LT22": 1,
      "LT23": 3,
      "LT24": 2,
      "LT25": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_005_deep_eci",
    "timestamp": "2026-07-19T13:49:39.745656",
    "survey": "deep_eci",
    "meta": {
      "name": "Diego Medina",
      "level": "Supervisores",
      "area": "Calidad",
      "country": "Nicaragua",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "EXD1": 3,
      "EXD2": 3,
      "EXD3": 3,
      "EXD4": 3,
      "EXD5": 2,
      "EXD6": 3,
      "EXD7": 5,
      "EXD8": 4,
      "EXD9": 5,
      "EXD10": 3,
      "EXD11": 3,
      "EXD12": 4,
      "EXD13": 3,
      "EXD14": 3,
      "EXD15": 4,
      "EXD16": 2,
      "EXD17": 3,
      "EXD18": 3,
      "EXD19": 4,
      "EXD20": 4,
      "EXD21": 3,
      "EXD22": 2,
      "EXD23": 3,
      "EXD24": 4,
      "EXD25": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_005_deep_aci",
    "timestamp": "2026-07-19T13:49:39.745656",
    "survey": "deep_aci",
    "meta": {
      "name": "Diego Medina",
      "level": "Supervisores",
      "area": "Calidad",
      "country": "Nicaragua",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CH1": 3,
      "CH2": 3,
      "CH3": 2,
      "CH4": 3,
      "CH5": 4,
      "CH6": 4,
      "CH7": 3,
      "CH8": 4,
      "CH9": 4,
      "CH10": 4,
      "CH11": 4,
      "CH12": 4,
      "CH13": 2,
      "CH14": 3,
      "CH15": 2,
      "CH16": 4,
      "CH17": 4,
      "CH18": 4,
      "CH19": 4,
      "CH20": 5
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_005_deep_cei",
    "timestamp": "2026-07-19T13:49:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Diego Medina",
      "level": "Supervisores",
      "area": "Calidad",
      "country": "Nicaragua",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 3,
      "CU2": 3,
      "CU3": 4,
      "CU4": 1,
      "CU5": 1,
      "CU6": 1,
      "CU7": 4,
      "CU8": 3,
      "CU9": 4,
      "CU10": 3,
      "CU11": 2,
      "CU12": 2,
      "CU13": 3,
      "CU14": 3,
      "CU15": 2,
      "CU16": 3,
      "CU17": 3,
      "CU18": 3,
      "CU19": 2,
      "CU20": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_006_core",
    "timestamp": "2026-07-11T22:46:39.745656",
    "survey": "core",
    "meta": {
      "name": "Paola Aguilar",
      "level": "Supervisores",
      "area": "Calidad",
      "country": "Costa Rica",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 4,
      "A2": 3,
      "A3": 3,
      "A4": 3,
      "A5": 3,
      "E1": 3,
      "E2": 3,
      "E3": 3,
      "E4": 4,
      "E5": 3,
      "E6": 4,
      "E7": 4,
      "L1": 3,
      "L2": 4,
      "L3": 4,
      "L4": 4,
      "L5": 4,
      "L6": 4,
      "R1": 3,
      "R2": 3,
      "R3": 3,
      "R4": 3,
      "C1": 3,
      "C2": 4,
      "C3": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_006_full",
    "timestamp": "2026-07-11T22:46:39.745656",
    "survey": "full",
    "meta": {
      "name": "Paola Aguilar",
      "level": "Supervisores",
      "area": "Calidad",
      "country": "Costa Rica",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 4,
      "A2": 3,
      "A3": 3,
      "A4": 3,
      "A5": 3,
      "E1": 3,
      "E2": 3,
      "E3": 3,
      "E4": 4,
      "E5": 3,
      "E6": 4,
      "E7": 4,
      "L1": 3,
      "L2": 4,
      "L3": 4,
      "L4": 4,
      "L5": 4,
      "L6": 4,
      "R1": 3,
      "R2": 3,
      "R3": 3,
      "R4": 3,
      "C1": 3,
      "C2": 4,
      "C3": 3,
      "SA6": 4,
      "SA7": 5,
      "SA8": 5,
      "SA9": 4,
      "SA10": 3,
      "SA11": 4,
      "SA12": 4,
      "EX8": 3,
      "EX9": 3,
      "EX10": 3,
      "EX11": 4,
      "EX12": 4,
      "EX13": 4,
      "EX14": 2,
      "EX15": 3,
      "EX16": 3,
      "EX17": 3,
      "EX18": 3,
      "LE7": 4,
      "LE8": 3,
      "LE9": 3,
      "LE10": 3,
      "LE11": 4,
      "LE12": 2,
      "LE13": 3,
      "LE14": 4,
      "LE15": 3,
      "RC5": 3,
      "RC6": 2,
      "RC7": 2,
      "RC8": 2,
      "RC9": 3,
      "OC4": 1,
      "OC5": 1,
      "OC6": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_006_deep_lei",
    "timestamp": "2026-07-11T23:16:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Paola Aguilar",
      "level": "Supervisores",
      "area": "Calidad",
      "country": "Costa Rica",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 2,
      "LD2": 3,
      "LD3": 2,
      "LD4": 2,
      "LD5": 3,
      "LD6": 3,
      "LD7": 2,
      "LD8": 3,
      "LD9": 2,
      "LD10": 3,
      "LD11": 2,
      "LD12": 2,
      "LD13": 2,
      "LD14": 3,
      "LD15": 3,
      "LD16": 2,
      "LD17": 2,
      "LD18": 2,
      "LD19": 2,
      "LD20": 1,
      "LD21": 1,
      "LD22": 3,
      "LD23": 3,
      "LD24": 3,
      "LD25": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_006_deep_tcs",
    "timestamp": "2026-07-11T23:16:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Paola Aguilar",
      "level": "Supervisores",
      "area": "Calidad",
      "country": "Costa Rica",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 3,
      "LT2": 3,
      "LT3": 3,
      "LT4": 2,
      "LT5": 2,
      "LT6": 1,
      "LT7": 2,
      "LT8": 2,
      "LT9": 3,
      "LT10": 4,
      "LT11": 4,
      "LT12": 3,
      "LT13": 2,
      "LT14": 1,
      "LT15": 3,
      "LT16": 1,
      "LT17": 1,
      "LT18": 2,
      "LT19": 2,
      "LT20": 1,
      "LT21": 2,
      "LT22": 1,
      "LT23": 1,
      "LT24": 1,
      "LT25": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_006_deep_eci",
    "timestamp": "2026-07-11T23:16:39.745656",
    "survey": "deep_eci",
    "meta": {
      "name": "Paola Aguilar",
      "level": "Supervisores",
      "area": "Calidad",
      "country": "Costa Rica",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "EXD1": 3,
      "EXD2": 4,
      "EXD3": 4,
      "EXD4": 4,
      "EXD5": 4,
      "EXD6": 5,
      "EXD7": 4,
      "EXD8": 3,
      "EXD9": 4,
      "EXD10": 5,
      "EXD11": 3,
      "EXD12": 4,
      "EXD13": 3,
      "EXD14": 4,
      "EXD15": 4,
      "EXD16": 3,
      "EXD17": 4,
      "EXD18": 3,
      "EXD19": 4,
      "EXD20": 4,
      "EXD21": 3,
      "EXD22": 4,
      "EXD23": 4,
      "EXD24": 4,
      "EXD25": 5
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_006_deep_aci",
    "timestamp": "2026-07-11T23:16:39.745656",
    "survey": "deep_aci",
    "meta": {
      "name": "Paola Aguilar",
      "level": "Supervisores",
      "area": "Calidad",
      "country": "Costa Rica",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CH1": 3,
      "CH2": 4,
      "CH3": 3,
      "CH4": 2,
      "CH5": 2,
      "CH6": 3,
      "CH7": 3,
      "CH8": 3,
      "CH9": 3,
      "CH10": 3,
      "CH11": 3,
      "CH12": 3,
      "CH13": 4,
      "CH14": 4,
      "CH15": 4,
      "CH16": 3,
      "CH17": 3,
      "CH18": 2,
      "CH19": 3,
      "CH20": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_006_deep_cei",
    "timestamp": "2026-07-11T23:16:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Paola Aguilar",
      "level": "Supervisores",
      "area": "Calidad",
      "country": "Costa Rica",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 2,
      "CU2": 2,
      "CU3": 1,
      "CU4": 1,
      "CU5": 1,
      "CU6": 1,
      "CU7": 2,
      "CU8": 2,
      "CU9": 2,
      "CU10": 2,
      "CU11": 2,
      "CU12": 1,
      "CU13": 2,
      "CU14": 2,
      "CU15": 2,
      "CU16": 2,
      "CU17": 2,
      "CU18": 2,
      "CU19": 1,
      "CU20": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_007_core",
    "timestamp": "2026-07-20T14:41:39.745656",
    "survey": "core",
    "meta": {
      "name": "Ricardo León",
      "level": "Supervisores",
      "area": "Calidad",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 2,
      "A2": 2,
      "A3": 4,
      "A4": 4,
      "A5": 3,
      "E1": 3,
      "E2": 3,
      "E3": 3,
      "E4": 4,
      "E5": 3,
      "E6": 3,
      "E7": 4,
      "L1": 2,
      "L2": 2,
      "L3": 2,
      "L4": 3,
      "L5": 3,
      "L6": 2,
      "R1": 3,
      "R2": 2,
      "R3": 3,
      "R4": 3,
      "C1": 3,
      "C2": 3,
      "C3": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_007_full",
    "timestamp": "2026-07-20T14:41:39.745656",
    "survey": "full",
    "meta": {
      "name": "Ricardo León",
      "level": "Supervisores",
      "area": "Calidad",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 2,
      "A2": 2,
      "A3": 4,
      "A4": 4,
      "A5": 3,
      "E1": 3,
      "E2": 3,
      "E3": 3,
      "E4": 4,
      "E5": 3,
      "E6": 3,
      "E7": 4,
      "L1": 2,
      "L2": 2,
      "L3": 2,
      "L4": 3,
      "L5": 3,
      "L6": 2,
      "R1": 3,
      "R2": 2,
      "R3": 3,
      "R4": 3,
      "C1": 3,
      "C2": 3,
      "C3": 3,
      "SA6": 4,
      "SA7": 5,
      "SA8": 5,
      "SA9": 5,
      "SA10": 4,
      "SA11": 5,
      "SA12": 5,
      "EX8": 5,
      "EX9": 4,
      "EX10": 3,
      "EX11": 4,
      "EX12": 3,
      "EX13": 4,
      "EX14": 5,
      "EX15": 4,
      "EX16": 4,
      "EX17": 5,
      "EX18": 4,
      "LE7": 2,
      "LE8": 2,
      "LE9": 1,
      "LE10": 2,
      "LE11": 2,
      "LE12": 2,
      "LE13": 1,
      "LE14": 2,
      "LE15": 1,
      "RC5": 3,
      "RC6": 3,
      "RC7": 3,
      "RC8": 3,
      "RC9": 3,
      "OC4": 3,
      "OC5": 3,
      "OC6": 4
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_007_deep_lei",
    "timestamp": "2026-07-20T15:11:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Ricardo León",
      "level": "Supervisores",
      "area": "Calidad",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 4,
      "LD2": 4,
      "LD3": 3,
      "LD4": 1,
      "LD5": 2,
      "LD6": 2,
      "LD7": 1,
      "LD8": 1,
      "LD9": 1,
      "LD10": 2,
      "LD11": 2,
      "LD12": 2,
      "LD13": 4,
      "LD14": 4,
      "LD15": 4,
      "LD16": 3,
      "LD17": 3,
      "LD18": 3,
      "LD19": 2,
      "LD20": 2,
      "LD21": 3,
      "LD22": 3,
      "LD23": 2,
      "LD24": 2,
      "LD25": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_007_deep_tcs",
    "timestamp": "2026-07-20T15:11:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Ricardo León",
      "level": "Supervisores",
      "area": "Calidad",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 1,
      "LT2": 2,
      "LT3": 3,
      "LT4": 3,
      "LT5": 3,
      "LT6": 3,
      "LT7": 1,
      "LT8": 2,
      "LT9": 2,
      "LT10": 2,
      "LT11": 2,
      "LT12": 1,
      "LT13": 4,
      "LT14": 4,
      "LT15": 4,
      "LT16": 1,
      "LT17": 2,
      "LT18": 1,
      "LT19": 4,
      "LT20": 4,
      "LT21": 3,
      "LT22": 2,
      "LT23": 2,
      "LT24": 2,
      "LT25": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_007_deep_aci",
    "timestamp": "2026-07-20T15:11:39.745656",
    "survey": "deep_aci",
    "meta": {
      "name": "Ricardo León",
      "level": "Supervisores",
      "area": "Calidad",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CH1": 3,
      "CH2": 3,
      "CH3": 4,
      "CH4": 3,
      "CH5": 3,
      "CH6": 3,
      "CH7": 3,
      "CH8": 3,
      "CH9": 2,
      "CH10": 3,
      "CH11": 1,
      "CH12": 2,
      "CH13": 2,
      "CH14": 2,
      "CH15": 3,
      "CH16": 3,
      "CH17": 4,
      "CH18": 3,
      "CH19": 3,
      "CH20": 4
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_007_deep_cei",
    "timestamp": "2026-07-20T15:11:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Ricardo León",
      "level": "Supervisores",
      "area": "Calidad",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 3,
      "CU2": 1,
      "CU3": 3,
      "CU4": 2,
      "CU5": 2,
      "CU6": 3,
      "CU7": 4,
      "CU8": 3,
      "CU9": 3,
      "CU10": 1,
      "CU11": 1,
      "CU12": 1,
      "CU13": 3,
      "CU14": 3,
      "CU15": 3,
      "CU16": 1,
      "CU17": 2,
      "CU18": 1,
      "CU19": 1,
      "CU20": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_008_core",
    "timestamp": "2026-07-15T16:36:39.745656",
    "survey": "core",
    "meta": {
      "name": "Claudia Peña",
      "level": "Supervisores",
      "area": "Almacenamiento",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 2,
      "A2": 1,
      "A3": 1,
      "A4": 2,
      "A5": 2,
      "E1": 5,
      "E2": 4,
      "E3": 5,
      "E4": 5,
      "E5": 5,
      "E6": 5,
      "E7": 4,
      "L1": 3,
      "L2": 3,
      "L3": 2,
      "L4": 4,
      "L5": 2,
      "L6": 2,
      "R1": 3,
      "R2": 3,
      "R3": 2,
      "R4": 3,
      "C1": 2,
      "C2": 2,
      "C3": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_008_full",
    "timestamp": "2026-07-15T16:36:39.745656",
    "survey": "full",
    "meta": {
      "name": "Claudia Peña",
      "level": "Supervisores",
      "area": "Almacenamiento",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 2,
      "A2": 1,
      "A3": 1,
      "A4": 2,
      "A5": 2,
      "E1": 5,
      "E2": 4,
      "E3": 5,
      "E4": 5,
      "E5": 5,
      "E6": 5,
      "E7": 4,
      "L1": 3,
      "L2": 3,
      "L3": 2,
      "L4": 4,
      "L5": 2,
      "L6": 2,
      "R1": 3,
      "R2": 3,
      "R3": 2,
      "R4": 3,
      "C1": 2,
      "C2": 2,
      "C3": 2,
      "SA6": 5,
      "SA7": 5,
      "SA8": 4,
      "SA9": 5,
      "SA10": 5,
      "SA11": 5,
      "SA12": 5,
      "EX8": 4,
      "EX9": 3,
      "EX10": 3,
      "EX11": 3,
      "EX12": 4,
      "EX13": 3,
      "EX14": 4,
      "EX15": 4,
      "EX16": 3,
      "EX17": 4,
      "EX18": 4,
      "LE7": 1,
      "LE8": 2,
      "LE9": 1,
      "LE10": 1,
      "LE11": 2,
      "LE12": 1,
      "LE13": 2,
      "LE14": 1,
      "LE15": 1,
      "RC5": 3,
      "RC6": 3,
      "RC7": 3,
      "RC8": 2,
      "RC9": 2,
      "OC4": 3,
      "OC5": 3,
      "OC6": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_008_deep_lei",
    "timestamp": "2026-07-15T17:06:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Claudia Peña",
      "level": "Supervisores",
      "area": "Almacenamiento",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 1,
      "LD2": 2,
      "LD3": 1,
      "LD4": 2,
      "LD5": 2,
      "LD6": 2,
      "LD7": 2,
      "LD8": 2,
      "LD9": 2,
      "LD10": 2,
      "LD11": 2,
      "LD12": 3,
      "LD13": 2,
      "LD14": 1,
      "LD15": 3,
      "LD16": 3,
      "LD17": 2,
      "LD18": 2,
      "LD19": 1,
      "LD20": 1,
      "LD21": 1,
      "LD22": 2,
      "LD23": 1,
      "LD24": 1,
      "LD25": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_008_deep_tcs",
    "timestamp": "2026-07-15T17:06:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Claudia Peña",
      "level": "Supervisores",
      "area": "Almacenamiento",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 2,
      "LT2": 2,
      "LT3": 1,
      "LT4": 3,
      "LT5": 3,
      "LT6": 2,
      "LT7": 1,
      "LT8": 1,
      "LT9": 1,
      "LT10": 3,
      "LT11": 5,
      "LT12": 3,
      "LT13": 3,
      "LT14": 2,
      "LT15": 2,
      "LT16": 2,
      "LT17": 3,
      "LT18": 1,
      "LT19": 3,
      "LT20": 2,
      "LT21": 2,
      "LT22": 3,
      "LT23": 3,
      "LT24": 3,
      "LT25": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_008_deep_aci",
    "timestamp": "2026-07-15T17:06:39.745656",
    "survey": "deep_aci",
    "meta": {
      "name": "Claudia Peña",
      "level": "Supervisores",
      "area": "Almacenamiento",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CH1": 4,
      "CH2": 2,
      "CH3": 2,
      "CH4": 3,
      "CH5": 2,
      "CH6": 5,
      "CH7": 4,
      "CH8": 5,
      "CH9": 4,
      "CH10": 3,
      "CH11": 3,
      "CH12": 3,
      "CH13": 2,
      "CH14": 2,
      "CH15": 1,
      "CH16": 2,
      "CH17": 2,
      "CH18": 2,
      "CH19": 2,
      "CH20": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_008_deep_cei",
    "timestamp": "2026-07-15T17:06:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Claudia Peña",
      "level": "Supervisores",
      "area": "Almacenamiento",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 3,
      "CU2": 2,
      "CU3": 2,
      "CU4": 2,
      "CU5": 2,
      "CU6": 1,
      "CU7": 2,
      "CU8": 3,
      "CU9": 2,
      "CU10": 1,
      "CU11": 2,
      "CU12": 2,
      "CU13": 1,
      "CU14": 1,
      "CU15": 2,
      "CU16": 2,
      "CU17": 2,
      "CU18": 3,
      "CU19": 3,
      "CU20": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_009_core",
    "timestamp": "2026-07-14T04:29:39.745656",
    "survey": "core",
    "meta": {
      "name": "Mauricio Rojas",
      "level": "Supervisores",
      "area": "Comercial",
      "country": "Nicaragua",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 3,
      "A2": 4,
      "A3": 3,
      "A4": 2,
      "A5": 3,
      "E1": 3,
      "E2": 4,
      "E3": 3,
      "E4": 4,
      "E5": 3,
      "E6": 4,
      "E7": 3,
      "L1": 2,
      "L2": 2,
      "L3": 3,
      "L4": 2,
      "L5": 2,
      "L6": 1,
      "R1": 5,
      "R2": 3,
      "R3": 4,
      "R4": 5,
      "C1": 3,
      "C2": 3,
      "C3": 4
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_009_full",
    "timestamp": "2026-07-14T04:29:39.745656",
    "survey": "full",
    "meta": {
      "name": "Mauricio Rojas",
      "level": "Supervisores",
      "area": "Comercial",
      "country": "Nicaragua",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 3,
      "A2": 4,
      "A3": 3,
      "A4": 2,
      "A5": 3,
      "E1": 3,
      "E2": 4,
      "E3": 3,
      "E4": 4,
      "E5": 3,
      "E6": 4,
      "E7": 3,
      "L1": 2,
      "L2": 2,
      "L3": 3,
      "L4": 2,
      "L5": 2,
      "L6": 1,
      "R1": 5,
      "R2": 3,
      "R3": 4,
      "R4": 5,
      "C1": 3,
      "C2": 3,
      "C3": 4,
      "SA6": 2,
      "SA7": 2,
      "SA8": 1,
      "SA9": 3,
      "SA10": 2,
      "SA11": 2,
      "SA12": 1,
      "EX8": 3,
      "EX9": 3,
      "EX10": 5,
      "EX11": 4,
      "EX12": 4,
      "EX13": 4,
      "EX14": 4,
      "EX15": 5,
      "EX16": 4,
      "EX17": 3,
      "EX18": 5,
      "LE7": 3,
      "LE8": 1,
      "LE9": 2,
      "LE10": 3,
      "LE11": 3,
      "LE12": 3,
      "LE13": 1,
      "LE14": 3,
      "LE15": 3,
      "RC5": 3,
      "RC6": 4,
      "RC7": 4,
      "RC8": 4,
      "RC9": 5,
      "OC4": 1,
      "OC5": 1,
      "OC6": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_009_deep_lei",
    "timestamp": "2026-07-14T04:59:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Mauricio Rojas",
      "level": "Supervisores",
      "area": "Comercial",
      "country": "Nicaragua",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 3,
      "LD2": 3,
      "LD3": 4,
      "LD4": 3,
      "LD5": 3,
      "LD6": 3,
      "LD7": 3,
      "LD8": 4,
      "LD9": 2,
      "LD10": 2,
      "LD11": 2,
      "LD12": 3,
      "LD13": 2,
      "LD14": 2,
      "LD15": 2,
      "LD16": 1,
      "LD17": 3,
      "LD18": 2,
      "LD19": 1,
      "LD20": 2,
      "LD21": 2,
      "LD22": 2,
      "LD23": 2,
      "LD24": 2,
      "LD25": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_009_deep_tcs",
    "timestamp": "2026-07-14T04:59:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Mauricio Rojas",
      "level": "Supervisores",
      "area": "Comercial",
      "country": "Nicaragua",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 1,
      "LT2": 1,
      "LT3": 1,
      "LT4": 2,
      "LT5": 3,
      "LT6": 2,
      "LT7": 2,
      "LT8": 3,
      "LT9": 2,
      "LT10": 2,
      "LT11": 2,
      "LT12": 2,
      "LT13": 2,
      "LT14": 2,
      "LT15": 2,
      "LT16": 2,
      "LT17": 2,
      "LT18": 2,
      "LT19": 4,
      "LT20": 3,
      "LT21": 2,
      "LT22": 3,
      "LT23": 3,
      "LT24": 3,
      "LT25": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_009_deep_cei",
    "timestamp": "2026-07-14T04:59:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Mauricio Rojas",
      "level": "Supervisores",
      "area": "Comercial",
      "country": "Nicaragua",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 2,
      "CU2": 2,
      "CU3": 2,
      "CU4": 1,
      "CU5": 2,
      "CU6": 2,
      "CU7": 2,
      "CU8": 2,
      "CU9": 3,
      "CU10": 1,
      "CU11": 1,
      "CU12": 1,
      "CU13": 2,
      "CU14": 3,
      "CU15": 2,
      "CU16": 2,
      "CU17": 2,
      "CU18": 1,
      "CU19": 1,
      "CU20": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_010_core",
    "timestamp": "2026-07-18T00:03:39.745656",
    "survey": "core",
    "meta": {
      "name": "Verónica Herrera",
      "level": "Supervisores",
      "area": "Finanzas",
      "country": "Nicaragua",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 3,
      "A2": 3,
      "A3": 3,
      "A4": 3,
      "A5": 3,
      "E1": 4,
      "E2": 5,
      "E3": 5,
      "E4": 4,
      "E5": 4,
      "E6": 4,
      "E7": 4,
      "L1": 2,
      "L2": 2,
      "L3": 2,
      "L4": 4,
      "L5": 2,
      "L6": 2,
      "R1": 2,
      "R2": 3,
      "R3": 3,
      "R4": 3,
      "C1": 2,
      "C2": 3,
      "C3": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_010_full",
    "timestamp": "2026-07-18T00:03:39.745656",
    "survey": "full",
    "meta": {
      "name": "Verónica Herrera",
      "level": "Supervisores",
      "area": "Finanzas",
      "country": "Nicaragua",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 3,
      "A2": 3,
      "A3": 3,
      "A4": 3,
      "A5": 3,
      "E1": 4,
      "E2": 5,
      "E3": 5,
      "E4": 4,
      "E5": 4,
      "E6": 4,
      "E7": 4,
      "L1": 2,
      "L2": 2,
      "L3": 2,
      "L4": 4,
      "L5": 2,
      "L6": 2,
      "R1": 2,
      "R2": 3,
      "R3": 3,
      "R4": 3,
      "C1": 2,
      "C2": 3,
      "C3": 3,
      "SA6": 2,
      "SA7": 4,
      "SA8": 4,
      "SA9": 3,
      "SA10": 3,
      "SA11": 3,
      "SA12": 4,
      "EX8": 5,
      "EX9": 4,
      "EX10": 4,
      "EX11": 4,
      "EX12": 4,
      "EX13": 3,
      "EX14": 4,
      "EX15": 4,
      "EX16": 4,
      "EX17": 3,
      "EX18": 4,
      "LE7": 4,
      "LE8": 4,
      "LE9": 5,
      "LE10": 4,
      "LE11": 4,
      "LE12": 4,
      "LE13": 4,
      "LE14": 4,
      "LE15": 4,
      "RC5": 2,
      "RC6": 2,
      "RC7": 1,
      "RC8": 2,
      "RC9": 1,
      "OC4": 3,
      "OC5": 2,
      "OC6": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_010_deep_lei",
    "timestamp": "2026-07-18T00:33:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Verónica Herrera",
      "level": "Supervisores",
      "area": "Finanzas",
      "country": "Nicaragua",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 2,
      "LD2": 2,
      "LD3": 2,
      "LD4": 3,
      "LD5": 4,
      "LD6": 4,
      "LD7": 2,
      "LD8": 2,
      "LD9": 3,
      "LD10": 3,
      "LD11": 3,
      "LD12": 3,
      "LD13": 2,
      "LD14": 3,
      "LD15": 2,
      "LD16": 2,
      "LD17": 2,
      "LD18": 2,
      "LD19": 2,
      "LD20": 2,
      "LD21": 2,
      "LD22": 2,
      "LD23": 2,
      "LD24": 2,
      "LD25": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_010_deep_tcs",
    "timestamp": "2026-07-18T00:33:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Verónica Herrera",
      "level": "Supervisores",
      "area": "Finanzas",
      "country": "Nicaragua",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 2,
      "LT2": 2,
      "LT3": 2,
      "LT4": 3,
      "LT5": 3,
      "LT6": 3,
      "LT7": 5,
      "LT8": 4,
      "LT9": 2,
      "LT10": 2,
      "LT11": 2,
      "LT12": 1,
      "LT13": 4,
      "LT14": 4,
      "LT15": 4,
      "LT16": 3,
      "LT17": 2,
      "LT18": 3,
      "LT19": 2,
      "LT20": 1,
      "LT21": 3,
      "LT22": 2,
      "LT23": 2,
      "LT24": 3,
      "LT25": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_010_deep_aci",
    "timestamp": "2026-07-18T00:33:39.745656",
    "survey": "deep_aci",
    "meta": {
      "name": "Verónica Herrera",
      "level": "Supervisores",
      "area": "Finanzas",
      "country": "Nicaragua",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CH1": 1,
      "CH2": 1,
      "CH3": 1,
      "CH4": 3,
      "CH5": 4,
      "CH6": 3,
      "CH7": 4,
      "CH8": 3,
      "CH9": 3,
      "CH10": 4,
      "CH11": 4,
      "CH12": 4,
      "CH13": 3,
      "CH14": 2,
      "CH15": 2,
      "CH16": 4,
      "CH17": 5,
      "CH18": 4,
      "CH19": 5,
      "CH20": 5
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_010_deep_cei",
    "timestamp": "2026-07-18T00:33:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Verónica Herrera",
      "level": "Supervisores",
      "area": "Finanzas",
      "country": "Nicaragua",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 1,
      "CU2": 1,
      "CU3": 1,
      "CU4": 1,
      "CU5": 1,
      "CU6": 2,
      "CU7": 1,
      "CU8": 3,
      "CU9": 3,
      "CU10": 1,
      "CU11": 3,
      "CU12": 3,
      "CU13": 2,
      "CU14": 2,
      "CU15": 3,
      "CU16": 2,
      "CU17": 2,
      "CU18": 2,
      "CU19": 2,
      "CU20": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_011_core",
    "timestamp": "2026-07-19T06:35:39.745656",
    "survey": "core",
    "meta": {
      "name": "Arturo Vega",
      "level": "Supervisores",
      "area": "Tecnología",
      "country": "Costa Rica",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 2,
      "A2": 3,
      "A3": 3,
      "A4": 3,
      "A5": 3,
      "E1": 4,
      "E2": 4,
      "E3": 3,
      "E4": 4,
      "E5": 4,
      "E6": 4,
      "E7": 2,
      "L1": 3,
      "L2": 2,
      "L3": 1,
      "L4": 1,
      "L5": 2,
      "L6": 1,
      "R1": 3,
      "R2": 2,
      "R3": 2,
      "R4": 3,
      "C1": 1,
      "C2": 1,
      "C3": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_011_full",
    "timestamp": "2026-07-19T06:35:39.745656",
    "survey": "full",
    "meta": {
      "name": "Arturo Vega",
      "level": "Supervisores",
      "area": "Tecnología",
      "country": "Costa Rica",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 2,
      "A2": 3,
      "A3": 3,
      "A4": 3,
      "A5": 3,
      "E1": 4,
      "E2": 4,
      "E3": 3,
      "E4": 4,
      "E5": 4,
      "E6": 4,
      "E7": 2,
      "L1": 3,
      "L2": 2,
      "L3": 1,
      "L4": 1,
      "L5": 2,
      "L6": 1,
      "R1": 3,
      "R2": 2,
      "R3": 2,
      "R4": 3,
      "C1": 1,
      "C2": 1,
      "C3": 1,
      "SA6": 2,
      "SA7": 2,
      "SA8": 2,
      "SA9": 3,
      "SA10": 2,
      "SA11": 2,
      "SA12": 3,
      "EX8": 3,
      "EX9": 3,
      "EX10": 3,
      "EX11": 3,
      "EX12": 3,
      "EX13": 4,
      "EX14": 4,
      "EX15": 3,
      "EX16": 2,
      "EX17": 2,
      "EX18": 3,
      "LE7": 4,
      "LE8": 5,
      "LE9": 3,
      "LE10": 4,
      "LE11": 4,
      "LE12": 4,
      "LE13": 4,
      "LE14": 3,
      "LE15": 4,
      "RC5": 2,
      "RC6": 2,
      "RC7": 2,
      "RC8": 1,
      "RC9": 2,
      "OC4": 3,
      "OC5": 1,
      "OC6": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_011_deep_lei",
    "timestamp": "2026-07-19T07:05:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Arturo Vega",
      "level": "Supervisores",
      "area": "Tecnología",
      "country": "Costa Rica",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 2,
      "LD2": 3,
      "LD3": 2,
      "LD4": 2,
      "LD5": 2,
      "LD6": 2,
      "LD7": 2,
      "LD8": 2,
      "LD9": 1,
      "LD10": 2,
      "LD11": 1,
      "LD12": 1,
      "LD13": 1,
      "LD14": 2,
      "LD15": 2,
      "LD16": 2,
      "LD17": 1,
      "LD18": 1,
      "LD19": 3,
      "LD20": 3,
      "LD21": 2,
      "LD22": 5,
      "LD23": 4,
      "LD24": 4,
      "LD25": 4
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_011_deep_tcs",
    "timestamp": "2026-07-19T07:05:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Arturo Vega",
      "level": "Supervisores",
      "area": "Tecnología",
      "country": "Costa Rica",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 2,
      "LT2": 2,
      "LT3": 1,
      "LT4": 4,
      "LT5": 4,
      "LT6": 3,
      "LT7": 3,
      "LT8": 2,
      "LT9": 2,
      "LT10": 2,
      "LT11": 2,
      "LT12": 2,
      "LT13": 3,
      "LT14": 3,
      "LT15": 2,
      "LT16": 2,
      "LT17": 2,
      "LT18": 1,
      "LT19": 2,
      "LT20": 4,
      "LT21": 2,
      "LT22": 2,
      "LT23": 2,
      "LT24": 2,
      "LT25": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_011_deep_eci",
    "timestamp": "2026-07-19T07:05:39.745656",
    "survey": "deep_eci",
    "meta": {
      "name": "Arturo Vega",
      "level": "Supervisores",
      "area": "Tecnología",
      "country": "Costa Rica",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "EXD1": 2,
      "EXD2": 4,
      "EXD3": 3,
      "EXD4": 3,
      "EXD5": 4,
      "EXD6": 3,
      "EXD7": 3,
      "EXD8": 3,
      "EXD9": 3,
      "EXD10": 2,
      "EXD11": 3,
      "EXD12": 3,
      "EXD13": 4,
      "EXD14": 2,
      "EXD15": 3,
      "EXD16": 3,
      "EXD17": 2,
      "EXD18": 3,
      "EXD19": 3,
      "EXD20": 5,
      "EXD21": 4,
      "EXD22": 3,
      "EXD23": 3,
      "EXD24": 4,
      "EXD25": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_011_deep_aci",
    "timestamp": "2026-07-19T07:05:39.745656",
    "survey": "deep_aci",
    "meta": {
      "name": "Arturo Vega",
      "level": "Supervisores",
      "area": "Tecnología",
      "country": "Costa Rica",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CH1": 4,
      "CH2": 3,
      "CH3": 3,
      "CH4": 2,
      "CH5": 2,
      "CH6": 1,
      "CH7": 3,
      "CH8": 3,
      "CH9": 3,
      "CH10": 4,
      "CH11": 4,
      "CH12": 4,
      "CH13": 4,
      "CH14": 4,
      "CH15": 4,
      "CH16": 2,
      "CH17": 2,
      "CH18": 3,
      "CH19": 1,
      "CH20": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_011_deep_cei",
    "timestamp": "2026-07-19T07:05:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Arturo Vega",
      "level": "Supervisores",
      "area": "Tecnología",
      "country": "Costa Rica",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 3,
      "CU2": 3,
      "CU3": 3,
      "CU4": 4,
      "CU5": 3,
      "CU6": 3,
      "CU7": 3,
      "CU8": 3,
      "CU9": 3,
      "CU10": 1,
      "CU11": 1,
      "CU12": 1,
      "CU13": 2,
      "CU14": 3,
      "CU15": 2,
      "CU16": 1,
      "CU17": 1,
      "CU18": 1,
      "CU19": 1,
      "CU20": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_012_core",
    "timestamp": "2026-07-20T10:48:39.745656",
    "survey": "core",
    "meta": {
      "name": "Gabriela Fuentes",
      "level": "Supervisores",
      "area": "Operaciones",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 3,
      "A2": 3,
      "A3": 4,
      "A4": 4,
      "A5": 5,
      "E1": 4,
      "E2": 3,
      "E3": 4,
      "E4": 3,
      "E5": 3,
      "E6": 4,
      "E7": 4,
      "L1": 2,
      "L2": 4,
      "L3": 3,
      "L4": 2,
      "L5": 3,
      "L6": 3,
      "R1": 3,
      "R2": 3,
      "R3": 3,
      "R4": 2,
      "C1": 1,
      "C2": 1,
      "C3": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_012_full",
    "timestamp": "2026-07-20T10:48:39.745656",
    "survey": "full",
    "meta": {
      "name": "Gabriela Fuentes",
      "level": "Supervisores",
      "area": "Operaciones",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 3,
      "A2": 3,
      "A3": 4,
      "A4": 4,
      "A5": 5,
      "E1": 4,
      "E2": 3,
      "E3": 4,
      "E4": 3,
      "E5": 3,
      "E6": 4,
      "E7": 4,
      "L1": 2,
      "L2": 4,
      "L3": 3,
      "L4": 2,
      "L5": 3,
      "L6": 3,
      "R1": 3,
      "R2": 3,
      "R3": 3,
      "R4": 2,
      "C1": 1,
      "C2": 1,
      "C3": 1,
      "SA6": 4,
      "SA7": 4,
      "SA8": 4,
      "SA9": 4,
      "SA10": 5,
      "SA11": 4,
      "SA12": 3,
      "EX8": 4,
      "EX9": 3,
      "EX10": 3,
      "EX11": 3,
      "EX12": 3,
      "EX13": 3,
      "EX14": 2,
      "EX15": 2,
      "EX16": 1,
      "EX17": 2,
      "EX18": 4,
      "LE7": 2,
      "LE8": 2,
      "LE9": 2,
      "LE10": 1,
      "LE11": 2,
      "LE12": 1,
      "LE13": 1,
      "LE14": 2,
      "LE15": 2,
      "RC5": 3,
      "RC6": 3,
      "RC7": 2,
      "RC8": 2,
      "RC9": 2,
      "OC4": 3,
      "OC5": 2,
      "OC6": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_012_deep_lei",
    "timestamp": "2026-07-20T11:18:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Gabriela Fuentes",
      "level": "Supervisores",
      "area": "Operaciones",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 3,
      "LD2": 2,
      "LD3": 3,
      "LD4": 4,
      "LD5": 4,
      "LD6": 3,
      "LD7": 4,
      "LD8": 3,
      "LD9": 3,
      "LD10": 2,
      "LD11": 2,
      "LD12": 1,
      "LD13": 3,
      "LD14": 3,
      "LD15": 3,
      "LD16": 2,
      "LD17": 2,
      "LD18": 2,
      "LD19": 1,
      "LD20": 1,
      "LD21": 1,
      "LD22": 3,
      "LD23": 2,
      "LD24": 2,
      "LD25": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_012_deep_tcs",
    "timestamp": "2026-07-20T11:18:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Gabriela Fuentes",
      "level": "Supervisores",
      "area": "Operaciones",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 4,
      "LT2": 4,
      "LT3": 4,
      "LT4": 1,
      "LT5": 1,
      "LT6": 1,
      "LT7": 2,
      "LT8": 1,
      "LT9": 1,
      "LT10": 1,
      "LT11": 1,
      "LT12": 1,
      "LT13": 2,
      "LT14": 2,
      "LT15": 2,
      "LT16": 2,
      "LT17": 1,
      "LT18": 1,
      "LT19": 1,
      "LT20": 2,
      "LT21": 2,
      "LT22": 2,
      "LT23": 2,
      "LT24": 3,
      "LT25": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_012_deep_eci",
    "timestamp": "2026-07-20T11:18:39.745656",
    "survey": "deep_eci",
    "meta": {
      "name": "Gabriela Fuentes",
      "level": "Supervisores",
      "area": "Operaciones",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "EXD1": 4,
      "EXD2": 3,
      "EXD3": 3,
      "EXD4": 5,
      "EXD5": 4,
      "EXD6": 4,
      "EXD7": 4,
      "EXD8": 4,
      "EXD9": 4,
      "EXD10": 4,
      "EXD11": 3,
      "EXD12": 3,
      "EXD13": 4,
      "EXD14": 4,
      "EXD15": 3,
      "EXD16": 3,
      "EXD17": 3,
      "EXD18": 3,
      "EXD19": 3,
      "EXD20": 3,
      "EXD21": 3,
      "EXD22": 3,
      "EXD23": 3,
      "EXD24": 3,
      "EXD25": 4
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_012_deep_aci",
    "timestamp": "2026-07-20T11:18:39.745656",
    "survey": "deep_aci",
    "meta": {
      "name": "Gabriela Fuentes",
      "level": "Supervisores",
      "area": "Operaciones",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CH1": 2,
      "CH2": 2,
      "CH3": 2,
      "CH4": 4,
      "CH5": 4,
      "CH6": 3,
      "CH7": 3,
      "CH8": 4,
      "CH9": 2,
      "CH10": 2,
      "CH11": 3,
      "CH12": 2,
      "CH13": 4,
      "CH14": 4,
      "CH15": 3,
      "CH16": 2,
      "CH17": 2,
      "CH18": 2,
      "CH19": 2,
      "CH20": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_012_deep_cei",
    "timestamp": "2026-07-20T11:18:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Gabriela Fuentes",
      "level": "Supervisores",
      "area": "Operaciones",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 1,
      "CU2": 1,
      "CU3": 1,
      "CU4": 4,
      "CU5": 3,
      "CU6": 3,
      "CU7": 3,
      "CU8": 3,
      "CU9": 3,
      "CU10": 3,
      "CU11": 3,
      "CU12": 3,
      "CU13": 2,
      "CU14": 2,
      "CU15": 2,
      "CU16": 1,
      "CU17": 1,
      "CU18": 2,
      "CU19": 1,
      "CU20": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_013_core",
    "timestamp": "2026-07-18T14:40:39.745656",
    "survey": "core",
    "meta": {
      "name": "Héctor Mendez",
      "level": "Supervisores",
      "area": "Transporte",
      "country": "Costa Rica",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 3,
      "A2": 3,
      "A3": 3,
      "A4": 3,
      "A5": 3,
      "E1": 4,
      "E2": 3,
      "E3": 3,
      "E4": 3,
      "E5": 2,
      "E6": 3,
      "E7": 4,
      "L1": 2,
      "L2": 3,
      "L3": 3,
      "L4": 3,
      "L5": 4,
      "L6": 4,
      "R1": 3,
      "R2": 4,
      "R3": 3,
      "R4": 4,
      "C1": 2,
      "C2": 2,
      "C3": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_013_full",
    "timestamp": "2026-07-18T14:40:39.745656",
    "survey": "full",
    "meta": {
      "name": "Héctor Mendez",
      "level": "Supervisores",
      "area": "Transporte",
      "country": "Costa Rica",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 3,
      "A2": 3,
      "A3": 3,
      "A4": 3,
      "A5": 3,
      "E1": 4,
      "E2": 3,
      "E3": 3,
      "E4": 3,
      "E5": 2,
      "E6": 3,
      "E7": 4,
      "L1": 2,
      "L2": 3,
      "L3": 3,
      "L4": 3,
      "L5": 4,
      "L6": 4,
      "R1": 3,
      "R2": 4,
      "R3": 3,
      "R4": 4,
      "C1": 2,
      "C2": 2,
      "C3": 1,
      "SA6": 4,
      "SA7": 3,
      "SA8": 4,
      "SA9": 4,
      "SA10": 3,
      "SA11": 3,
      "SA12": 3,
      "EX8": 5,
      "EX9": 4,
      "EX10": 5,
      "EX11": 4,
      "EX12": 4,
      "EX13": 4,
      "EX14": 3,
      "EX15": 4,
      "EX16": 4,
      "EX17": 3,
      "EX18": 4,
      "LE7": 3,
      "LE8": 3,
      "LE9": 2,
      "LE10": 2,
      "LE11": 3,
      "LE12": 3,
      "LE13": 2,
      "LE14": 3,
      "LE15": 3,
      "RC5": 4,
      "RC6": 4,
      "RC7": 4,
      "RC8": 4,
      "RC9": 3,
      "OC4": 3,
      "OC5": 3,
      "OC6": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_013_deep_lei",
    "timestamp": "2026-07-18T15:10:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Héctor Mendez",
      "level": "Supervisores",
      "area": "Transporte",
      "country": "Costa Rica",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 2,
      "LD2": 2,
      "LD3": 2,
      "LD4": 4,
      "LD5": 5,
      "LD6": 4,
      "LD7": 1,
      "LD8": 1,
      "LD9": 1,
      "LD10": 3,
      "LD11": 2,
      "LD12": 2,
      "LD13": 2,
      "LD14": 2,
      "LD15": 1,
      "LD16": 3,
      "LD17": 4,
      "LD18": 3,
      "LD19": 3,
      "LD20": 3,
      "LD21": 3,
      "LD22": 1,
      "LD23": 2,
      "LD24": 1,
      "LD25": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_013_deep_tcs",
    "timestamp": "2026-07-18T15:10:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Héctor Mendez",
      "level": "Supervisores",
      "area": "Transporte",
      "country": "Costa Rica",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 2,
      "LT2": 2,
      "LT3": 2,
      "LT4": 1,
      "LT5": 1,
      "LT6": 1,
      "LT7": 1,
      "LT8": 2,
      "LT9": 2,
      "LT10": 1,
      "LT11": 1,
      "LT12": 1,
      "LT13": 3,
      "LT14": 2,
      "LT15": 3,
      "LT16": 1,
      "LT17": 2,
      "LT18": 2,
      "LT19": 2,
      "LT20": 2,
      "LT21": 2,
      "LT22": 2,
      "LT23": 4,
      "LT24": 2,
      "LT25": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_013_deep_cei",
    "timestamp": "2026-07-18T15:10:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Héctor Mendez",
      "level": "Supervisores",
      "area": "Transporte",
      "country": "Costa Rica",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 2,
      "CU2": 3,
      "CU3": 2,
      "CU4": 4,
      "CU5": 3,
      "CU6": 3,
      "CU7": 3,
      "CU8": 2,
      "CU9": 2,
      "CU10": 3,
      "CU11": 3,
      "CU12": 3,
      "CU13": 4,
      "CU14": 3,
      "CU15": 3,
      "CU16": 1,
      "CU17": 1,
      "CU18": 1,
      "CU19": 1,
      "CU20": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_014_core",
    "timestamp": "2026-07-17T20:11:39.745656",
    "survey": "core",
    "meta": {
      "name": "Silvia Acosta",
      "level": "Supervisores",
      "area": "Distribución",
      "country": "Nicaragua",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 2,
      "A2": 3,
      "A3": 2,
      "A4": 2,
      "A5": 2,
      "E1": 4,
      "E2": 3,
      "E3": 4,
      "E4": 5,
      "E5": 4,
      "E6": 4,
      "E7": 5,
      "L1": 1,
      "L2": 2,
      "L3": 1,
      "L4": 2,
      "L5": 1,
      "L6": 1,
      "R1": 4,
      "R2": 3,
      "R3": 3,
      "R4": 4,
      "C1": 3,
      "C2": 3,
      "C3": 4
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_014_full",
    "timestamp": "2026-07-17T20:11:39.745656",
    "survey": "full",
    "meta": {
      "name": "Silvia Acosta",
      "level": "Supervisores",
      "area": "Distribución",
      "country": "Nicaragua",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 2,
      "A2": 3,
      "A3": 2,
      "A4": 2,
      "A5": 2,
      "E1": 4,
      "E2": 3,
      "E3": 4,
      "E4": 5,
      "E5": 4,
      "E6": 4,
      "E7": 5,
      "L1": 1,
      "L2": 2,
      "L3": 1,
      "L4": 2,
      "L5": 1,
      "L6": 1,
      "R1": 4,
      "R2": 3,
      "R3": 3,
      "R4": 4,
      "C1": 3,
      "C2": 3,
      "C3": 4,
      "SA6": 4,
      "SA7": 3,
      "SA8": 2,
      "SA9": 3,
      "SA10": 4,
      "SA11": 4,
      "SA12": 4,
      "EX8": 4,
      "EX9": 4,
      "EX10": 3,
      "EX11": 3,
      "EX12": 4,
      "EX13": 3,
      "EX14": 3,
      "EX15": 4,
      "EX16": 3,
      "EX17": 3,
      "EX18": 3,
      "LE7": 1,
      "LE8": 1,
      "LE9": 1,
      "LE10": 1,
      "LE11": 3,
      "LE12": 2,
      "LE13": 2,
      "LE14": 1,
      "LE15": 3,
      "RC5": 4,
      "RC6": 4,
      "RC7": 3,
      "RC8": 4,
      "RC9": 4,
      "OC4": 3,
      "OC5": 2,
      "OC6": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_014_deep_lei",
    "timestamp": "2026-07-17T20:41:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Silvia Acosta",
      "level": "Supervisores",
      "area": "Distribución",
      "country": "Nicaragua",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 2,
      "LD2": 4,
      "LD3": 3,
      "LD4": 1,
      "LD5": 1,
      "LD6": 2,
      "LD7": 1,
      "LD8": 2,
      "LD9": 2,
      "LD10": 1,
      "LD11": 1,
      "LD12": 1,
      "LD13": 4,
      "LD14": 4,
      "LD15": 3,
      "LD16": 2,
      "LD17": 3,
      "LD18": 3,
      "LD19": 1,
      "LD20": 1,
      "LD21": 2,
      "LD22": 3,
      "LD23": 4,
      "LD24": 3,
      "LD25": 4
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_014_deep_tcs",
    "timestamp": "2026-07-17T20:41:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Silvia Acosta",
      "level": "Supervisores",
      "area": "Distribución",
      "country": "Nicaragua",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 1,
      "LT2": 1,
      "LT3": 1,
      "LT4": 4,
      "LT5": 3,
      "LT6": 3,
      "LT7": 2,
      "LT8": 2,
      "LT9": 2,
      "LT10": 2,
      "LT11": 3,
      "LT12": 2,
      "LT13": 2,
      "LT14": 2,
      "LT15": 3,
      "LT16": 2,
      "LT17": 2,
      "LT18": 3,
      "LT19": 1,
      "LT20": 2,
      "LT21": 2,
      "LT22": 2,
      "LT23": 2,
      "LT24": 2,
      "LT25": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_014_deep_cei",
    "timestamp": "2026-07-17T20:41:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Silvia Acosta",
      "level": "Supervisores",
      "area": "Distribución",
      "country": "Nicaragua",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 2,
      "CU2": 2,
      "CU3": 2,
      "CU4": 1,
      "CU5": 1,
      "CU6": 2,
      "CU7": 1,
      "CU8": 2,
      "CU9": 2,
      "CU10": 1,
      "CU11": 2,
      "CU12": 1,
      "CU13": 2,
      "CU14": 3,
      "CU15": 3,
      "CU16": 3,
      "CU17": 2,
      "CU18": 4,
      "CU19": 3,
      "CU20": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_015_core",
    "timestamp": "2026-07-21T04:33:39.745656",
    "survey": "core",
    "meta": {
      "name": "Ramón Delgado",
      "level": "Supervisores",
      "area": "Operaciones",
      "country": "Costa Rica",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 4,
      "A2": 2,
      "A3": 3,
      "A4": 4,
      "A5": 4,
      "E1": 4,
      "E2": 4,
      "E3": 3,
      "E4": 3,
      "E5": 3,
      "E6": 4,
      "E7": 3,
      "L1": 2,
      "L2": 2,
      "L3": 3,
      "L4": 2,
      "L5": 2,
      "L6": 2,
      "R1": 3,
      "R2": 4,
      "R3": 2,
      "R4": 2,
      "C1": 2,
      "C2": 3,
      "C3": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_015_full",
    "timestamp": "2026-07-21T04:33:39.745656",
    "survey": "full",
    "meta": {
      "name": "Ramón Delgado",
      "level": "Supervisores",
      "area": "Operaciones",
      "country": "Costa Rica",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 4,
      "A2": 2,
      "A3": 3,
      "A4": 4,
      "A5": 4,
      "E1": 4,
      "E2": 4,
      "E3": 3,
      "E4": 3,
      "E5": 3,
      "E6": 4,
      "E7": 3,
      "L1": 2,
      "L2": 2,
      "L3": 3,
      "L4": 2,
      "L5": 2,
      "L6": 2,
      "R1": 3,
      "R2": 4,
      "R3": 2,
      "R4": 2,
      "C1": 2,
      "C2": 3,
      "C3": 2,
      "SA6": 3,
      "SA7": 2,
      "SA8": 3,
      "SA9": 2,
      "SA10": 1,
      "SA11": 3,
      "SA12": 2,
      "EX8": 4,
      "EX9": 4,
      "EX10": 5,
      "EX11": 4,
      "EX12": 4,
      "EX13": 4,
      "EX14": 3,
      "EX15": 4,
      "EX16": 4,
      "EX17": 3,
      "EX18": 3,
      "LE7": 3,
      "LE8": 3,
      "LE9": 3,
      "LE10": 3,
      "LE11": 4,
      "LE12": 3,
      "LE13": 2,
      "LE14": 3,
      "LE15": 3,
      "RC5": 4,
      "RC6": 3,
      "RC7": 2,
      "RC8": 2,
      "RC9": 2,
      "OC4": 1,
      "OC5": 2,
      "OC6": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_015_deep_lei",
    "timestamp": "2026-07-21T05:03:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Ramón Delgado",
      "level": "Supervisores",
      "area": "Operaciones",
      "country": "Costa Rica",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 3,
      "LD2": 1,
      "LD3": 3,
      "LD4": 3,
      "LD5": 2,
      "LD6": 2,
      "LD7": 2,
      "LD8": 2,
      "LD9": 1,
      "LD10": 2,
      "LD11": 3,
      "LD12": 2,
      "LD13": 1,
      "LD14": 1,
      "LD15": 1,
      "LD16": 3,
      "LD17": 3,
      "LD18": 3,
      "LD19": 1,
      "LD20": 1,
      "LD21": 1,
      "LD22": 3,
      "LD23": 3,
      "LD24": 2,
      "LD25": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_015_deep_tcs",
    "timestamp": "2026-07-21T05:03:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Ramón Delgado",
      "level": "Supervisores",
      "area": "Operaciones",
      "country": "Costa Rica",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 3,
      "LT2": 3,
      "LT3": 3,
      "LT4": 4,
      "LT5": 5,
      "LT6": 4,
      "LT7": 2,
      "LT8": 2,
      "LT9": 2,
      "LT10": 2,
      "LT11": 2,
      "LT12": 1,
      "LT13": 3,
      "LT14": 3,
      "LT15": 3,
      "LT16": 3,
      "LT17": 3,
      "LT18": 2,
      "LT19": 2,
      "LT20": 2,
      "LT21": 2,
      "LT22": 3,
      "LT23": 4,
      "LT24": 3,
      "LT25": 4
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_015_deep_aci",
    "timestamp": "2026-07-21T05:03:39.745656",
    "survey": "deep_aci",
    "meta": {
      "name": "Ramón Delgado",
      "level": "Supervisores",
      "area": "Operaciones",
      "country": "Costa Rica",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CH1": 2,
      "CH2": 3,
      "CH3": 3,
      "CH4": 3,
      "CH5": 3,
      "CH6": 3,
      "CH7": 3,
      "CH8": 3,
      "CH9": 3,
      "CH10": 1,
      "CH11": 3,
      "CH12": 2,
      "CH13": 2,
      "CH14": 2,
      "CH15": 2,
      "CH16": 4,
      "CH17": 4,
      "CH18": 4,
      "CH19": 3,
      "CH20": 4
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_015_deep_cei",
    "timestamp": "2026-07-21T05:03:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Ramón Delgado",
      "level": "Supervisores",
      "area": "Operaciones",
      "country": "Costa Rica",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 2,
      "CU2": 1,
      "CU3": 2,
      "CU4": 1,
      "CU5": 1,
      "CU6": 2,
      "CU7": 3,
      "CU8": 2,
      "CU9": 3,
      "CU10": 1,
      "CU11": 2,
      "CU12": 2,
      "CU13": 1,
      "CU14": 1,
      "CU15": 1,
      "CU16": 3,
      "CU17": 4,
      "CU18": 3,
      "CU19": 4,
      "CU20": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_016_core",
    "timestamp": "2026-07-23T15:37:39.745656",
    "survey": "core",
    "meta": {
      "name": "Mónica Guerrero",
      "level": "Supervisores",
      "area": "Almacenamiento",
      "country": "Costa Rica",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 3,
      "A2": 3,
      "A3": 3,
      "A4": 3,
      "A5": 3,
      "E1": 5,
      "E2": 5,
      "E3": 5,
      "E4": 5,
      "E5": 5,
      "E6": 5,
      "E7": 5,
      "L1": 2,
      "L2": 3,
      "L3": 4,
      "L4": 3,
      "L5": 3,
      "L6": 3,
      "R1": 1,
      "R2": 2,
      "R3": 2,
      "R4": 2,
      "C1": 2,
      "C2": 2,
      "C3": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_016_full",
    "timestamp": "2026-07-23T15:37:39.745656",
    "survey": "full",
    "meta": {
      "name": "Mónica Guerrero",
      "level": "Supervisores",
      "area": "Almacenamiento",
      "country": "Costa Rica",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 3,
      "A2": 3,
      "A3": 3,
      "A4": 3,
      "A5": 3,
      "E1": 5,
      "E2": 5,
      "E3": 5,
      "E4": 5,
      "E5": 5,
      "E6": 5,
      "E7": 5,
      "L1": 2,
      "L2": 3,
      "L3": 4,
      "L4": 3,
      "L5": 3,
      "L6": 3,
      "R1": 1,
      "R2": 2,
      "R3": 2,
      "R4": 2,
      "C1": 2,
      "C2": 2,
      "C3": 1,
      "SA6": 4,
      "SA7": 3,
      "SA8": 3,
      "SA9": 3,
      "SA10": 3,
      "SA11": 4,
      "SA12": 3,
      "EX8": 4,
      "EX9": 4,
      "EX10": 4,
      "EX11": 4,
      "EX12": 4,
      "EX13": 5,
      "EX14": 5,
      "EX15": 4,
      "EX16": 3,
      "EX17": 5,
      "EX18": 5,
      "LE7": 2,
      "LE8": 1,
      "LE9": 3,
      "LE10": 1,
      "LE11": 1,
      "LE12": 2,
      "LE13": 2,
      "LE14": 2,
      "LE15": 1,
      "RC5": 3,
      "RC6": 3,
      "RC7": 3,
      "RC8": 2,
      "RC9": 2,
      "OC4": 3,
      "OC5": 1,
      "OC6": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_016_deep_lei",
    "timestamp": "2026-07-23T16:07:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Mónica Guerrero",
      "level": "Supervisores",
      "area": "Almacenamiento",
      "country": "Costa Rica",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 1,
      "LD2": 3,
      "LD3": 2,
      "LD4": 1,
      "LD5": 1,
      "LD6": 1,
      "LD7": 2,
      "LD8": 2,
      "LD9": 3,
      "LD10": 3,
      "LD11": 2,
      "LD12": 4,
      "LD13": 2,
      "LD14": 3,
      "LD15": 2,
      "LD16": 2,
      "LD17": 2,
      "LD18": 2,
      "LD19": 2,
      "LD20": 2,
      "LD21": 2,
      "LD22": 2,
      "LD23": 2,
      "LD24": 2,
      "LD25": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_016_deep_tcs",
    "timestamp": "2026-07-23T16:07:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Mónica Guerrero",
      "level": "Supervisores",
      "area": "Almacenamiento",
      "country": "Costa Rica",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 2,
      "LT2": 1,
      "LT3": 1,
      "LT4": 2,
      "LT5": 3,
      "LT6": 3,
      "LT7": 2,
      "LT8": 1,
      "LT9": 1,
      "LT10": 2,
      "LT11": 1,
      "LT12": 1,
      "LT13": 3,
      "LT14": 3,
      "LT15": 3,
      "LT16": 1,
      "LT17": 2,
      "LT18": 1,
      "LT19": 3,
      "LT20": 4,
      "LT21": 2,
      "LT22": 2,
      "LT23": 1,
      "LT24": 2,
      "LT25": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_016_deep_aci",
    "timestamp": "2026-07-23T16:07:39.745656",
    "survey": "deep_aci",
    "meta": {
      "name": "Mónica Guerrero",
      "level": "Supervisores",
      "area": "Almacenamiento",
      "country": "Costa Rica",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CH1": 5,
      "CH2": 5,
      "CH3": 5,
      "CH4": 3,
      "CH5": 3,
      "CH6": 3,
      "CH7": 3,
      "CH8": 3,
      "CH9": 2,
      "CH10": 4,
      "CH11": 3,
      "CH12": 3,
      "CH13": 3,
      "CH14": 3,
      "CH15": 3,
      "CH16": 2,
      "CH17": 1,
      "CH18": 2,
      "CH19": 2,
      "CH20": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_016_deep_cei",
    "timestamp": "2026-07-23T16:07:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Mónica Guerrero",
      "level": "Supervisores",
      "area": "Almacenamiento",
      "country": "Costa Rica",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 1,
      "CU2": 1,
      "CU3": 1,
      "CU4": 3,
      "CU5": 2,
      "CU6": 4,
      "CU7": 1,
      "CU8": 1,
      "CU9": 1,
      "CU10": 1,
      "CU11": 1,
      "CU12": 1,
      "CU13": 3,
      "CU14": 2,
      "CU15": 2,
      "CU16": 2,
      "CU17": 1,
      "CU18": 1,
      "CU19": 2,
      "CU20": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_017_core",
    "timestamp": "2026-07-17T03:08:39.745656",
    "survey": "core",
    "meta": {
      "name": "Ernesto Silva",
      "level": "Supervisores",
      "area": "Comercial",
      "country": "Nicaragua",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 3,
      "A2": 3,
      "A3": 3,
      "A4": 3,
      "A5": 2,
      "E1": 3,
      "E2": 3,
      "E3": 3,
      "E4": 3,
      "E5": 3,
      "E6": 3,
      "E7": 4,
      "L1": 2,
      "L2": 3,
      "L3": 1,
      "L4": 2,
      "L5": 2,
      "L6": 2,
      "R1": 2,
      "R2": 2,
      "R3": 3,
      "R4": 2,
      "C1": 2,
      "C2": 3,
      "C3": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_017_full",
    "timestamp": "2026-07-17T03:08:39.745656",
    "survey": "full",
    "meta": {
      "name": "Ernesto Silva",
      "level": "Supervisores",
      "area": "Comercial",
      "country": "Nicaragua",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 3,
      "A2": 3,
      "A3": 3,
      "A4": 3,
      "A5": 2,
      "E1": 3,
      "E2": 3,
      "E3": 3,
      "E4": 3,
      "E5": 3,
      "E6": 3,
      "E7": 4,
      "L1": 2,
      "L2": 3,
      "L3": 1,
      "L4": 2,
      "L5": 2,
      "L6": 2,
      "R1": 2,
      "R2": 2,
      "R3": 3,
      "R4": 2,
      "C1": 2,
      "C2": 3,
      "C3": 2,
      "SA6": 3,
      "SA7": 4,
      "SA8": 4,
      "SA9": 4,
      "SA10": 3,
      "SA11": 4,
      "SA12": 2,
      "EX8": 4,
      "EX9": 5,
      "EX10": 4,
      "EX11": 5,
      "EX12": 5,
      "EX13": 4,
      "EX14": 5,
      "EX15": 3,
      "EX16": 5,
      "EX17": 4,
      "EX18": 5,
      "LE7": 3,
      "LE8": 3,
      "LE9": 3,
      "LE10": 3,
      "LE11": 4,
      "LE12": 2,
      "LE13": 3,
      "LE14": 3,
      "LE15": 3,
      "RC5": 2,
      "RC6": 3,
      "RC7": 2,
      "RC8": 3,
      "RC9": 2,
      "OC4": 1,
      "OC5": 3,
      "OC6": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_017_deep_lei",
    "timestamp": "2026-07-17T03:38:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Ernesto Silva",
      "level": "Supervisores",
      "area": "Comercial",
      "country": "Nicaragua",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 1,
      "LD2": 1,
      "LD3": 1,
      "LD4": 1,
      "LD5": 2,
      "LD6": 2,
      "LD7": 3,
      "LD8": 1,
      "LD9": 2,
      "LD10": 4,
      "LD11": 4,
      "LD12": 3,
      "LD13": 3,
      "LD14": 3,
      "LD15": 3,
      "LD16": 4,
      "LD17": 3,
      "LD18": 4,
      "LD19": 3,
      "LD20": 3,
      "LD21": 3,
      "LD22": 2,
      "LD23": 3,
      "LD24": 2,
      "LD25": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_017_deep_tcs",
    "timestamp": "2026-07-17T03:38:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Ernesto Silva",
      "level": "Supervisores",
      "area": "Comercial",
      "country": "Nicaragua",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 1,
      "LT2": 1,
      "LT3": 1,
      "LT4": 2,
      "LT5": 1,
      "LT6": 1,
      "LT7": 1,
      "LT8": 1,
      "LT9": 1,
      "LT10": 1,
      "LT11": 1,
      "LT12": 1,
      "LT13": 2,
      "LT14": 2,
      "LT15": 2,
      "LT16": 1,
      "LT17": 2,
      "LT18": 2,
      "LT19": 3,
      "LT20": 3,
      "LT21": 3,
      "LT22": 2,
      "LT23": 1,
      "LT24": 2,
      "LT25": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_017_deep_aci",
    "timestamp": "2026-07-17T03:38:39.745656",
    "survey": "deep_aci",
    "meta": {
      "name": "Ernesto Silva",
      "level": "Supervisores",
      "area": "Comercial",
      "country": "Nicaragua",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CH1": 3,
      "CH2": 2,
      "CH3": 2,
      "CH4": 1,
      "CH5": 2,
      "CH6": 2,
      "CH7": 3,
      "CH8": 3,
      "CH9": 2,
      "CH10": 3,
      "CH11": 4,
      "CH12": 3,
      "CH13": 2,
      "CH14": 3,
      "CH15": 1,
      "CH16": 4,
      "CH17": 3,
      "CH18": 4,
      "CH19": 3,
      "CH20": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_017_deep_cei",
    "timestamp": "2026-07-17T03:38:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Ernesto Silva",
      "level": "Supervisores",
      "area": "Comercial",
      "country": "Nicaragua",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 3,
      "CU2": 3,
      "CU3": 3,
      "CU4": 1,
      "CU5": 2,
      "CU6": 2,
      "CU7": 2,
      "CU8": 2,
      "CU9": 1,
      "CU10": 2,
      "CU11": 3,
      "CU12": 3,
      "CU13": 4,
      "CU14": 2,
      "CU15": 2,
      "CU16": 2,
      "CU17": 1,
      "CU18": 2,
      "CU19": 2,
      "CU20": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_018_core",
    "timestamp": "2026-07-17T09:47:39.745656",
    "survey": "core",
    "meta": {
      "name": "Adriana Navarro",
      "level": "Supervisores",
      "area": "Comercial",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 3,
      "A2": 2,
      "A3": 2,
      "A4": 3,
      "A5": 3,
      "E1": 3,
      "E2": 3,
      "E3": 3,
      "E4": 3,
      "E5": 3,
      "E6": 4,
      "E7": 4,
      "L1": 2,
      "L2": 4,
      "L3": 1,
      "L4": 4,
      "L5": 2,
      "L6": 1,
      "R1": 3,
      "R2": 2,
      "R3": 2,
      "R4": 2,
      "C1": 2,
      "C2": 2,
      "C3": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_018_full",
    "timestamp": "2026-07-17T09:47:39.745656",
    "survey": "full",
    "meta": {
      "name": "Adriana Navarro",
      "level": "Supervisores",
      "area": "Comercial",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 3,
      "A2": 2,
      "A3": 2,
      "A4": 3,
      "A5": 3,
      "E1": 3,
      "E2": 3,
      "E3": 3,
      "E4": 3,
      "E5": 3,
      "E6": 4,
      "E7": 4,
      "L1": 2,
      "L2": 4,
      "L3": 1,
      "L4": 4,
      "L5": 2,
      "L6": 1,
      "R1": 3,
      "R2": 2,
      "R3": 2,
      "R4": 2,
      "C1": 2,
      "C2": 2,
      "C3": 1,
      "SA6": 2,
      "SA7": 1,
      "SA8": 2,
      "SA9": 3,
      "SA10": 2,
      "SA11": 2,
      "SA12": 3,
      "EX8": 4,
      "EX9": 4,
      "EX10": 4,
      "EX11": 5,
      "EX12": 3,
      "EX13": 4,
      "EX14": 3,
      "EX15": 4,
      "EX16": 5,
      "EX17": 3,
      "EX18": 3,
      "LE7": 3,
      "LE8": 3,
      "LE9": 2,
      "LE10": 3,
      "LE11": 2,
      "LE12": 3,
      "LE13": 3,
      "LE14": 2,
      "LE15": 1,
      "RC5": 3,
      "RC6": 3,
      "RC7": 4,
      "RC8": 3,
      "RC9": 4,
      "OC4": 1,
      "OC5": 1,
      "OC6": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_018_deep_lei",
    "timestamp": "2026-07-17T10:17:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Adriana Navarro",
      "level": "Supervisores",
      "area": "Comercial",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 2,
      "LD2": 1,
      "LD3": 1,
      "LD4": 2,
      "LD5": 3,
      "LD6": 3,
      "LD7": 2,
      "LD8": 3,
      "LD9": 3,
      "LD10": 3,
      "LD11": 1,
      "LD12": 2,
      "LD13": 3,
      "LD14": 3,
      "LD15": 3,
      "LD16": 4,
      "LD17": 3,
      "LD18": 2,
      "LD19": 4,
      "LD20": 3,
      "LD21": 3,
      "LD22": 1,
      "LD23": 1,
      "LD24": 1,
      "LD25": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_018_deep_tcs",
    "timestamp": "2026-07-17T10:17:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Adriana Navarro",
      "level": "Supervisores",
      "area": "Comercial",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 3,
      "LT2": 2,
      "LT3": 4,
      "LT4": 3,
      "LT5": 2,
      "LT6": 1,
      "LT7": 1,
      "LT8": 1,
      "LT9": 1,
      "LT10": 1,
      "LT11": 1,
      "LT12": 1,
      "LT13": 2,
      "LT14": 3,
      "LT15": 4,
      "LT16": 3,
      "LT17": 3,
      "LT18": 4,
      "LT19": 4,
      "LT20": 4,
      "LT21": 4,
      "LT22": 2,
      "LT23": 1,
      "LT24": 2,
      "LT25": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_018_deep_aci",
    "timestamp": "2026-07-17T10:17:39.745656",
    "survey": "deep_aci",
    "meta": {
      "name": "Adriana Navarro",
      "level": "Supervisores",
      "area": "Comercial",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CH1": 4,
      "CH2": 3,
      "CH3": 4,
      "CH4": 3,
      "CH5": 3,
      "CH6": 3,
      "CH7": 3,
      "CH8": 2,
      "CH9": 3,
      "CH10": 2,
      "CH11": 1,
      "CH12": 2,
      "CH13": 3,
      "CH14": 3,
      "CH15": 3,
      "CH16": 4,
      "CH17": 3,
      "CH18": 4,
      "CH19": 3,
      "CH20": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_018_deep_cei",
    "timestamp": "2026-07-17T10:17:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Adriana Navarro",
      "level": "Supervisores",
      "area": "Comercial",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 1,
      "CU2": 1,
      "CU3": 1,
      "CU4": 1,
      "CU5": 1,
      "CU6": 1,
      "CU7": 4,
      "CU8": 4,
      "CU9": 3,
      "CU10": 2,
      "CU11": 2,
      "CU12": 2,
      "CU13": 3,
      "CU14": 3,
      "CU15": 3,
      "CU16": 1,
      "CU17": 1,
      "CU18": 2,
      "CU19": 1,
      "CU20": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_019_core",
    "timestamp": "2026-07-20T16:47:39.745656",
    "survey": "core",
    "meta": {
      "name": "Francisco Romero",
      "level": "Supervisores",
      "area": "Finanzas",
      "country": "Nicaragua",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 4,
      "A2": 4,
      "A3": 3,
      "A4": 4,
      "A5": 3,
      "E1": 3,
      "E2": 2,
      "E3": 4,
      "E4": 3,
      "E5": 2,
      "E6": 4,
      "E7": 4,
      "L1": 3,
      "L2": 2,
      "L3": 2,
      "L4": 2,
      "L5": 2,
      "L6": 2,
      "R1": 2,
      "R2": 3,
      "R3": 2,
      "R4": 1,
      "C1": 3,
      "C2": 1,
      "C3": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_019_full",
    "timestamp": "2026-07-20T16:47:39.745656",
    "survey": "full",
    "meta": {
      "name": "Francisco Romero",
      "level": "Supervisores",
      "area": "Finanzas",
      "country": "Nicaragua",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 4,
      "A2": 4,
      "A3": 3,
      "A4": 4,
      "A5": 3,
      "E1": 3,
      "E2": 2,
      "E3": 4,
      "E4": 3,
      "E5": 2,
      "E6": 4,
      "E7": 4,
      "L1": 3,
      "L2": 2,
      "L3": 2,
      "L4": 2,
      "L5": 2,
      "L6": 2,
      "R1": 2,
      "R2": 3,
      "R3": 2,
      "R4": 1,
      "C1": 3,
      "C2": 1,
      "C3": 1,
      "SA6": 4,
      "SA7": 4,
      "SA8": 4,
      "SA9": 4,
      "SA10": 4,
      "SA11": 4,
      "SA12": 3,
      "EX8": 4,
      "EX9": 4,
      "EX10": 4,
      "EX11": 4,
      "EX12": 5,
      "EX13": 4,
      "EX14": 3,
      "EX15": 5,
      "EX16": 4,
      "EX17": 4,
      "EX18": 4,
      "LE7": 5,
      "LE8": 4,
      "LE9": 3,
      "LE10": 4,
      "LE11": 4,
      "LE12": 3,
      "LE13": 4,
      "LE14": 3,
      "LE15": 5,
      "RC5": 3,
      "RC6": 3,
      "RC7": 3,
      "RC8": 2,
      "RC9": 3,
      "OC4": 1,
      "OC5": 1,
      "OC6": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_019_deep_lei",
    "timestamp": "2026-07-20T17:17:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Francisco Romero",
      "level": "Supervisores",
      "area": "Finanzas",
      "country": "Nicaragua",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 3,
      "LD2": 2,
      "LD3": 3,
      "LD4": 3,
      "LD5": 4,
      "LD6": 4,
      "LD7": 2,
      "LD8": 2,
      "LD9": 2,
      "LD10": 3,
      "LD11": 2,
      "LD12": 2,
      "LD13": 1,
      "LD14": 1,
      "LD15": 2,
      "LD16": 4,
      "LD17": 2,
      "LD18": 3,
      "LD19": 1,
      "LD20": 1,
      "LD21": 1,
      "LD22": 2,
      "LD23": 2,
      "LD24": 3,
      "LD25": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_019_deep_tcs",
    "timestamp": "2026-07-20T17:17:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Francisco Romero",
      "level": "Supervisores",
      "area": "Finanzas",
      "country": "Nicaragua",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 1,
      "LT2": 2,
      "LT3": 1,
      "LT4": 1,
      "LT5": 2,
      "LT6": 2,
      "LT7": 3,
      "LT8": 2,
      "LT9": 2,
      "LT10": 3,
      "LT11": 3,
      "LT12": 3,
      "LT13": 1,
      "LT14": 1,
      "LT15": 1,
      "LT16": 1,
      "LT17": 1,
      "LT18": 1,
      "LT19": 2,
      "LT20": 1,
      "LT21": 2,
      "LT22": 2,
      "LT23": 2,
      "LT24": 1,
      "LT25": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_019_deep_aci",
    "timestamp": "2026-07-20T17:17:39.745656",
    "survey": "deep_aci",
    "meta": {
      "name": "Francisco Romero",
      "level": "Supervisores",
      "area": "Finanzas",
      "country": "Nicaragua",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CH1": 4,
      "CH2": 4,
      "CH3": 3,
      "CH4": 1,
      "CH5": 2,
      "CH6": 1,
      "CH7": 2,
      "CH8": 4,
      "CH9": 3,
      "CH10": 2,
      "CH11": 3,
      "CH12": 2,
      "CH13": 2,
      "CH14": 3,
      "CH15": 3,
      "CH16": 2,
      "CH17": 2,
      "CH18": 2,
      "CH19": 2,
      "CH20": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_019_deep_cei",
    "timestamp": "2026-07-20T17:17:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Francisco Romero",
      "level": "Supervisores",
      "area": "Finanzas",
      "country": "Nicaragua",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 1,
      "CU2": 2,
      "CU3": 1,
      "CU4": 2,
      "CU5": 2,
      "CU6": 3,
      "CU7": 3,
      "CU8": 3,
      "CU9": 2,
      "CU10": 4,
      "CU11": 3,
      "CU12": 4,
      "CU13": 3,
      "CU14": 2,
      "CU15": 2,
      "CU16": 1,
      "CU17": 2,
      "CU18": 1,
      "CU19": 2,
      "CU20": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_020_core",
    "timestamp": "2026-07-22T04:43:39.745656",
    "survey": "core",
    "meta": {
      "name": "Beatriz Espinoza",
      "level": "Supervisores",
      "area": "RRHH",
      "country": "Costa Rica",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 4,
      "A2": 3,
      "A3": 2,
      "A4": 3,
      "A5": 4,
      "E1": 3,
      "E2": 4,
      "E3": 4,
      "E4": 3,
      "E5": 4,
      "E6": 3,
      "E7": 4,
      "L1": 4,
      "L2": 5,
      "L3": 5,
      "L4": 5,
      "L5": 4,
      "L6": 5,
      "R1": 2,
      "R2": 2,
      "R3": 2,
      "R4": 1,
      "C1": 2,
      "C2": 3,
      "C3": 4
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_020_full",
    "timestamp": "2026-07-22T04:43:39.745656",
    "survey": "full",
    "meta": {
      "name": "Beatriz Espinoza",
      "level": "Supervisores",
      "area": "RRHH",
      "country": "Costa Rica",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 4,
      "A2": 3,
      "A3": 2,
      "A4": 3,
      "A5": 4,
      "E1": 3,
      "E2": 4,
      "E3": 4,
      "E4": 3,
      "E5": 4,
      "E6": 3,
      "E7": 4,
      "L1": 4,
      "L2": 5,
      "L3": 5,
      "L4": 5,
      "L5": 4,
      "L6": 5,
      "R1": 2,
      "R2": 2,
      "R3": 2,
      "R4": 1,
      "C1": 2,
      "C2": 3,
      "C3": 4,
      "SA6": 3,
      "SA7": 3,
      "SA8": 3,
      "SA9": 3,
      "SA10": 4,
      "SA11": 4,
      "SA12": 3,
      "EX8": 3,
      "EX9": 3,
      "EX10": 4,
      "EX11": 3,
      "EX12": 2,
      "EX13": 4,
      "EX14": 3,
      "EX15": 3,
      "EX16": 3,
      "EX17": 3,
      "EX18": 2,
      "LE7": 1,
      "LE8": 2,
      "LE9": 2,
      "LE10": 1,
      "LE11": 2,
      "LE12": 1,
      "LE13": 1,
      "LE14": 2,
      "LE15": 1,
      "RC5": 4,
      "RC6": 3,
      "RC7": 4,
      "RC8": 2,
      "RC9": 3,
      "OC4": 2,
      "OC5": 2,
      "OC6": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_020_deep_lei",
    "timestamp": "2026-07-22T05:13:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Beatriz Espinoza",
      "level": "Supervisores",
      "area": "RRHH",
      "country": "Costa Rica",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 1,
      "LD2": 2,
      "LD3": 2,
      "LD4": 3,
      "LD5": 3,
      "LD6": 4,
      "LD7": 1,
      "LD8": 2,
      "LD9": 1,
      "LD10": 2,
      "LD11": 2,
      "LD12": 3,
      "LD13": 2,
      "LD14": 3,
      "LD15": 3,
      "LD16": 2,
      "LD17": 2,
      "LD18": 2,
      "LD19": 2,
      "LD20": 3,
      "LD21": 3,
      "LD22": 2,
      "LD23": 2,
      "LD24": 2,
      "LD25": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_020_deep_tcs",
    "timestamp": "2026-07-22T05:13:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Beatriz Espinoza",
      "level": "Supervisores",
      "area": "RRHH",
      "country": "Costa Rica",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 2,
      "LT2": 2,
      "LT3": 2,
      "LT4": 2,
      "LT5": 1,
      "LT6": 1,
      "LT7": 1,
      "LT8": 1,
      "LT9": 1,
      "LT10": 2,
      "LT11": 2,
      "LT12": 1,
      "LT13": 3,
      "LT14": 2,
      "LT15": 2,
      "LT16": 2,
      "LT17": 2,
      "LT18": 2,
      "LT19": 3,
      "LT20": 3,
      "LT21": 3,
      "LT22": 2,
      "LT23": 2,
      "LT24": 2,
      "LT25": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_020_deep_eci",
    "timestamp": "2026-07-22T05:13:39.745656",
    "survey": "deep_eci",
    "meta": {
      "name": "Beatriz Espinoza",
      "level": "Supervisores",
      "area": "RRHH",
      "country": "Costa Rica",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "EXD1": 4,
      "EXD2": 3,
      "EXD3": 4,
      "EXD4": 5,
      "EXD5": 3,
      "EXD6": 5,
      "EXD7": 4,
      "EXD8": 4,
      "EXD9": 4,
      "EXD10": 4,
      "EXD11": 4,
      "EXD12": 4,
      "EXD13": 3,
      "EXD14": 3,
      "EXD15": 3,
      "EXD16": 3,
      "EXD17": 3,
      "EXD18": 3,
      "EXD19": 5,
      "EXD20": 4,
      "EXD21": 3,
      "EXD22": 5,
      "EXD23": 5,
      "EXD24": 5,
      "EXD25": 4
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_020_deep_aci",
    "timestamp": "2026-07-22T05:13:39.745656",
    "survey": "deep_aci",
    "meta": {
      "name": "Beatriz Espinoza",
      "level": "Supervisores",
      "area": "RRHH",
      "country": "Costa Rica",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CH1": 3,
      "CH2": 2,
      "CH3": 3,
      "CH4": 3,
      "CH5": 3,
      "CH6": 3,
      "CH7": 4,
      "CH8": 3,
      "CH9": 3,
      "CH10": 2,
      "CH11": 2,
      "CH12": 3,
      "CH13": 3,
      "CH14": 3,
      "CH15": 4,
      "CH16": 3,
      "CH17": 2,
      "CH18": 3,
      "CH19": 3,
      "CH20": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_020_deep_cei",
    "timestamp": "2026-07-22T05:13:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Beatriz Espinoza",
      "level": "Supervisores",
      "area": "RRHH",
      "country": "Costa Rica",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 2,
      "CU2": 2,
      "CU3": 2,
      "CU4": 1,
      "CU5": 1,
      "CU6": 1,
      "CU7": 1,
      "CU8": 2,
      "CU9": 2,
      "CU10": 2,
      "CU11": 2,
      "CU12": 1,
      "CU13": 3,
      "CU14": 3,
      "CU15": 1,
      "CU16": 2,
      "CU17": 3,
      "CU18": 3,
      "CU19": 3,
      "CU20": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_021_core",
    "timestamp": "2026-07-13T02:07:39.745656",
    "survey": "core",
    "meta": {
      "name": "Ignacio Domínguez",
      "level": "Supervisores",
      "area": "Tecnología",
      "country": "Nicaragua",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 3,
      "A2": 3,
      "A3": 4,
      "A4": 4,
      "A5": 3,
      "E1": 5,
      "E2": 5,
      "E3": 5,
      "E4": 5,
      "E5": 5,
      "E6": 5,
      "E7": 4,
      "L1": 2,
      "L2": 3,
      "L3": 2,
      "L4": 2,
      "L5": 3,
      "L6": 2,
      "R1": 3,
      "R2": 2,
      "R3": 3,
      "R4": 4,
      "C1": 3,
      "C2": 3,
      "C3": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_021_full",
    "timestamp": "2026-07-13T02:07:39.745656",
    "survey": "full",
    "meta": {
      "name": "Ignacio Domínguez",
      "level": "Supervisores",
      "area": "Tecnología",
      "country": "Nicaragua",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 3,
      "A2": 3,
      "A3": 4,
      "A4": 4,
      "A5": 3,
      "E1": 5,
      "E2": 5,
      "E3": 5,
      "E4": 5,
      "E5": 5,
      "E6": 5,
      "E7": 4,
      "L1": 2,
      "L2": 3,
      "L3": 2,
      "L4": 2,
      "L5": 3,
      "L6": 2,
      "R1": 3,
      "R2": 2,
      "R3": 3,
      "R4": 4,
      "C1": 3,
      "C2": 3,
      "C3": 2,
      "SA6": 3,
      "SA7": 2,
      "SA8": 3,
      "SA9": 2,
      "SA10": 2,
      "SA11": 3,
      "SA12": 3,
      "EX8": 5,
      "EX9": 5,
      "EX10": 5,
      "EX11": 5,
      "EX12": 5,
      "EX13": 5,
      "EX14": 5,
      "EX15": 5,
      "EX16": 5,
      "EX17": 5,
      "EX18": 5,
      "LE7": 2,
      "LE8": 1,
      "LE9": 3,
      "LE10": 3,
      "LE11": 3,
      "LE12": 3,
      "LE13": 3,
      "LE14": 4,
      "LE15": 3,
      "RC5": 3,
      "RC6": 2,
      "RC7": 3,
      "RC8": 1,
      "RC9": 3,
      "OC4": 1,
      "OC5": 2,
      "OC6": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_021_deep_lei",
    "timestamp": "2026-07-13T02:37:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Ignacio Domínguez",
      "level": "Supervisores",
      "area": "Tecnología",
      "country": "Nicaragua",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 1,
      "LD2": 1,
      "LD3": 1,
      "LD4": 1,
      "LD5": 1,
      "LD6": 2,
      "LD7": 4,
      "LD8": 5,
      "LD9": 5,
      "LD10": 4,
      "LD11": 4,
      "LD12": 4,
      "LD13": 2,
      "LD14": 2,
      "LD15": 2,
      "LD16": 3,
      "LD17": 3,
      "LD18": 2,
      "LD19": 2,
      "LD20": 1,
      "LD21": 1,
      "LD22": 3,
      "LD23": 2,
      "LD24": 2,
      "LD25": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_021_deep_tcs",
    "timestamp": "2026-07-13T02:37:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Ignacio Domínguez",
      "level": "Supervisores",
      "area": "Tecnología",
      "country": "Nicaragua",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 2,
      "LT2": 3,
      "LT3": 3,
      "LT4": 2,
      "LT5": 3,
      "LT6": 2,
      "LT7": 2,
      "LT8": 2,
      "LT9": 2,
      "LT10": 2,
      "LT11": 3,
      "LT12": 2,
      "LT13": 4,
      "LT14": 5,
      "LT15": 4,
      "LT16": 1,
      "LT17": 3,
      "LT18": 2,
      "LT19": 2,
      "LT20": 2,
      "LT21": 3,
      "LT22": 3,
      "LT23": 2,
      "LT24": 2,
      "LT25": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_021_deep_aci",
    "timestamp": "2026-07-13T02:37:39.745656",
    "survey": "deep_aci",
    "meta": {
      "name": "Ignacio Domínguez",
      "level": "Supervisores",
      "area": "Tecnología",
      "country": "Nicaragua",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CH1": 2,
      "CH2": 2,
      "CH3": 3,
      "CH4": 5,
      "CH5": 3,
      "CH6": 4,
      "CH7": 2,
      "CH8": 2,
      "CH9": 3,
      "CH10": 2,
      "CH11": 2,
      "CH12": 3,
      "CH13": 2,
      "CH14": 3,
      "CH15": 2,
      "CH16": 1,
      "CH17": 3,
      "CH18": 1,
      "CH19": 2,
      "CH20": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_021_deep_cei",
    "timestamp": "2026-07-13T02:37:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Ignacio Domínguez",
      "level": "Supervisores",
      "area": "Tecnología",
      "country": "Nicaragua",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 2,
      "CU2": 2,
      "CU3": 2,
      "CU4": 2,
      "CU5": 1,
      "CU6": 2,
      "CU7": 2,
      "CU8": 4,
      "CU9": 3,
      "CU10": 1,
      "CU11": 1,
      "CU12": 1,
      "CU13": 2,
      "CU14": 2,
      "CU15": 2,
      "CU16": 3,
      "CU17": 3,
      "CU18": 3,
      "CU19": 3,
      "CU20": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_022_core",
    "timestamp": "2026-07-17T04:21:39.745656",
    "survey": "core",
    "meta": {
      "name": "Laura Campos",
      "level": "Supervisores",
      "area": "Distribución",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 4,
      "A2": 2,
      "A3": 3,
      "A4": 2,
      "A5": 2,
      "E1": 4,
      "E2": 4,
      "E3": 5,
      "E4": 4,
      "E5": 5,
      "E6": 5,
      "E7": 5,
      "L1": 3,
      "L2": 1,
      "L3": 2,
      "L4": 2,
      "L5": 2,
      "L6": 2,
      "R1": 2,
      "R2": 3,
      "R3": 3,
      "R4": 4,
      "C1": 2,
      "C2": 3,
      "C3": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_022_full",
    "timestamp": "2026-07-17T04:21:39.745656",
    "survey": "full",
    "meta": {
      "name": "Laura Campos",
      "level": "Supervisores",
      "area": "Distribución",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 4,
      "A2": 2,
      "A3": 3,
      "A4": 2,
      "A5": 2,
      "E1": 4,
      "E2": 4,
      "E3": 5,
      "E4": 4,
      "E5": 5,
      "E6": 5,
      "E7": 5,
      "L1": 3,
      "L2": 1,
      "L3": 2,
      "L4": 2,
      "L5": 2,
      "L6": 2,
      "R1": 2,
      "R2": 3,
      "R3": 3,
      "R4": 4,
      "C1": 2,
      "C2": 3,
      "C3": 2,
      "SA6": 4,
      "SA7": 3,
      "SA8": 3,
      "SA9": 4,
      "SA10": 3,
      "SA11": 4,
      "SA12": 4,
      "EX8": 4,
      "EX9": 4,
      "EX10": 4,
      "EX11": 4,
      "EX12": 4,
      "EX13": 4,
      "EX14": 4,
      "EX15": 4,
      "EX16": 5,
      "EX17": 3,
      "EX18": 5,
      "LE7": 3,
      "LE8": 4,
      "LE9": 3,
      "LE10": 3,
      "LE11": 3,
      "LE12": 3,
      "LE13": 4,
      "LE14": 4,
      "LE15": 2,
      "RC5": 2,
      "RC6": 4,
      "RC7": 3,
      "RC8": 3,
      "RC9": 2,
      "OC4": 2,
      "OC5": 4,
      "OC6": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_022_deep_lei",
    "timestamp": "2026-07-17T04:51:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Laura Campos",
      "level": "Supervisores",
      "area": "Distribución",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 2,
      "LD2": 2,
      "LD3": 2,
      "LD4": 2,
      "LD5": 1,
      "LD6": 2,
      "LD7": 2,
      "LD8": 2,
      "LD9": 2,
      "LD10": 3,
      "LD11": 3,
      "LD12": 3,
      "LD13": 1,
      "LD14": 1,
      "LD15": 1,
      "LD16": 4,
      "LD17": 4,
      "LD18": 3,
      "LD19": 2,
      "LD20": 1,
      "LD21": 2,
      "LD22": 1,
      "LD23": 2,
      "LD24": 1,
      "LD25": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_022_deep_tcs",
    "timestamp": "2026-07-17T04:51:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Laura Campos",
      "level": "Supervisores",
      "area": "Distribución",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 2,
      "LT2": 2,
      "LT3": 3,
      "LT4": 2,
      "LT5": 2,
      "LT6": 3,
      "LT7": 3,
      "LT8": 2,
      "LT9": 2,
      "LT10": 2,
      "LT11": 1,
      "LT12": 1,
      "LT13": 3,
      "LT14": 3,
      "LT15": 3,
      "LT16": 3,
      "LT17": 2,
      "LT18": 3,
      "LT19": 4,
      "LT20": 4,
      "LT21": 4,
      "LT22": 2,
      "LT23": 3,
      "LT24": 3,
      "LT25": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_022_deep_aci",
    "timestamp": "2026-07-17T04:51:39.745656",
    "survey": "deep_aci",
    "meta": {
      "name": "Laura Campos",
      "level": "Supervisores",
      "area": "Distribución",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CH1": 4,
      "CH2": 4,
      "CH3": 4,
      "CH4": 1,
      "CH5": 2,
      "CH6": 3,
      "CH7": 4,
      "CH8": 4,
      "CH9": 3,
      "CH10": 2,
      "CH11": 3,
      "CH12": 2,
      "CH13": 2,
      "CH14": 1,
      "CH15": 2,
      "CH16": 3,
      "CH17": 3,
      "CH18": 2,
      "CH19": 2,
      "CH20": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Sup_022_deep_cei",
    "timestamp": "2026-07-17T04:51:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Laura Campos",
      "level": "Supervisores",
      "area": "Distribución",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 2,
      "CU2": 2,
      "CU3": 3,
      "CU4": 1,
      "CU5": 1,
      "CU6": 1,
      "CU7": 3,
      "CU8": 2,
      "CU9": 2,
      "CU10": 3,
      "CU11": 3,
      "CU12": 2,
      "CU13": 2,
      "CU14": 2,
      "CU15": 1,
      "CU16": 2,
      "CU17": 1,
      "CU18": 2,
      "CU19": 2,
      "CU20": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_000_core",
    "timestamp": "2026-07-20T08:07:39.745656",
    "survey": "core",
    "meta": {
      "name": "Álvaro Rivas",
      "level": "Colaboradores",
      "area": "Distribución",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 2,
      "A2": 2,
      "A3": 2,
      "A4": 3,
      "A5": 3,
      "E1": 3,
      "E2": 4,
      "E3": 3,
      "E4": 3,
      "E5": 3,
      "E6": 3,
      "E7": 3,
      "L1": 3,
      "L2": 2,
      "L3": 2,
      "L4": 3,
      "L5": 2,
      "L6": 3,
      "R1": 3,
      "R2": 3,
      "R3": 2,
      "R4": 2,
      "C1": 1,
      "C2": 1,
      "C3": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_000_full",
    "timestamp": "2026-07-20T08:07:39.745656",
    "survey": "full",
    "meta": {
      "name": "Álvaro Rivas",
      "level": "Colaboradores",
      "area": "Distribución",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 2,
      "A2": 2,
      "A3": 2,
      "A4": 3,
      "A5": 3,
      "E1": 3,
      "E2": 4,
      "E3": 3,
      "E4": 3,
      "E5": 3,
      "E6": 3,
      "E7": 3,
      "L1": 3,
      "L2": 2,
      "L3": 2,
      "L4": 3,
      "L5": 2,
      "L6": 3,
      "R1": 3,
      "R2": 3,
      "R3": 2,
      "R4": 2,
      "C1": 1,
      "C2": 1,
      "C3": 1,
      "SA6": 3,
      "SA7": 3,
      "SA8": 3,
      "SA9": 3,
      "SA10": 3,
      "SA11": 2,
      "SA12": 3,
      "EX8": 5,
      "EX9": 5,
      "EX10": 5,
      "EX11": 4,
      "EX12": 5,
      "EX13": 5,
      "EX14": 4,
      "EX15": 5,
      "EX16": 5,
      "EX17": 4,
      "EX18": 4,
      "LE7": 2,
      "LE8": 2,
      "LE9": 2,
      "LE10": 3,
      "LE11": 3,
      "LE12": 3,
      "LE13": 3,
      "LE14": 4,
      "LE15": 2,
      "RC5": 3,
      "RC6": 2,
      "RC7": 3,
      "RC8": 2,
      "RC9": 3,
      "OC4": 2,
      "OC5": 2,
      "OC6": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_000_deep_lei",
    "timestamp": "2026-07-20T08:37:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Álvaro Rivas",
      "level": "Colaboradores",
      "area": "Distribución",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 1,
      "LD2": 2,
      "LD3": 1,
      "LD4": 4,
      "LD5": 4,
      "LD6": 4,
      "LD7": 2,
      "LD8": 2,
      "LD9": 1,
      "LD10": 2,
      "LD11": 3,
      "LD12": 2,
      "LD13": 3,
      "LD14": 2,
      "LD15": 2,
      "LD16": 2,
      "LD17": 2,
      "LD18": 1,
      "LD19": 1,
      "LD20": 1,
      "LD21": 1,
      "LD22": 1,
      "LD23": 2,
      "LD24": 2,
      "LD25": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_000_deep_tcs",
    "timestamp": "2026-07-20T08:37:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Álvaro Rivas",
      "level": "Colaboradores",
      "area": "Distribución",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 1,
      "LT2": 1,
      "LT3": 1,
      "LT4": 3,
      "LT5": 4,
      "LT6": 3,
      "LT7": 1,
      "LT8": 3,
      "LT9": 2,
      "LT10": 2,
      "LT11": 2,
      "LT12": 2,
      "LT13": 3,
      "LT14": 3,
      "LT15": 4,
      "LT16": 2,
      "LT17": 2,
      "LT18": 2,
      "LT19": 2,
      "LT20": 3,
      "LT21": 1,
      "LT22": 3,
      "LT23": 2,
      "LT24": 3,
      "LT25": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_000_deep_aci",
    "timestamp": "2026-07-20T08:37:39.745656",
    "survey": "deep_aci",
    "meta": {
      "name": "Álvaro Rivas",
      "level": "Colaboradores",
      "area": "Distribución",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CH1": 3,
      "CH2": 3,
      "CH3": 2,
      "CH4": 3,
      "CH5": 3,
      "CH6": 3,
      "CH7": 2,
      "CH8": 3,
      "CH9": 2,
      "CH10": 3,
      "CH11": 2,
      "CH12": 2,
      "CH13": 2,
      "CH14": 3,
      "CH15": 1,
      "CH16": 3,
      "CH17": 3,
      "CH18": 2,
      "CH19": 2,
      "CH20": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_000_deep_cei",
    "timestamp": "2026-07-20T08:37:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Álvaro Rivas",
      "level": "Colaboradores",
      "area": "Distribución",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 3,
      "CU2": 2,
      "CU3": 1,
      "CU4": 3,
      "CU5": 3,
      "CU6": 1,
      "CU7": 3,
      "CU8": 4,
      "CU9": 3,
      "CU10": 3,
      "CU11": 4,
      "CU12": 3,
      "CU13": 1,
      "CU14": 1,
      "CU15": 1,
      "CU16": 2,
      "CU17": 2,
      "CU18": 2,
      "CU19": 2,
      "CU20": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_001_core",
    "timestamp": "2026-07-22T06:35:39.745656",
    "survey": "core",
    "meta": {
      "name": "Diana Sandoval",
      "level": "Colaboradores",
      "area": "Comercial",
      "country": "Nicaragua",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 4,
      "A2": 4,
      "A3": 3,
      "A4": 3,
      "A5": 3,
      "E1": 4,
      "E2": 4,
      "E3": 4,
      "E4": 5,
      "E5": 5,
      "E6": 5,
      "E7": 3,
      "L1": 3,
      "L2": 3,
      "L3": 2,
      "L4": 2,
      "L5": 2,
      "L6": 3,
      "R1": 5,
      "R2": 3,
      "R3": 3,
      "R4": 4,
      "C1": 3,
      "C2": 4,
      "C3": 4
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_001_full",
    "timestamp": "2026-07-22T06:35:39.745656",
    "survey": "full",
    "meta": {
      "name": "Diana Sandoval",
      "level": "Colaboradores",
      "area": "Comercial",
      "country": "Nicaragua",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 4,
      "A2": 4,
      "A3": 3,
      "A4": 3,
      "A5": 3,
      "E1": 4,
      "E2": 4,
      "E3": 4,
      "E4": 5,
      "E5": 5,
      "E6": 5,
      "E7": 3,
      "L1": 3,
      "L2": 3,
      "L3": 2,
      "L4": 2,
      "L5": 2,
      "L6": 3,
      "R1": 5,
      "R2": 3,
      "R3": 3,
      "R4": 4,
      "C1": 3,
      "C2": 4,
      "C3": 4,
      "SA6": 2,
      "SA7": 3,
      "SA8": 2,
      "SA9": 2,
      "SA10": 2,
      "SA11": 3,
      "SA12": 4,
      "EX8": 3,
      "EX9": 4,
      "EX10": 4,
      "EX11": 4,
      "EX12": 4,
      "EX13": 3,
      "EX14": 4,
      "EX15": 4,
      "EX16": 4,
      "EX17": 4,
      "EX18": 4,
      "LE7": 4,
      "LE8": 4,
      "LE9": 4,
      "LE10": 4,
      "LE11": 5,
      "LE12": 3,
      "LE13": 5,
      "LE14": 5,
      "LE15": 5,
      "RC5": 3,
      "RC6": 3,
      "RC7": 4,
      "RC8": 4,
      "RC9": 4,
      "OC4": 1,
      "OC5": 1,
      "OC6": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_001_deep_cei",
    "timestamp": "2026-07-22T07:05:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Diana Sandoval",
      "level": "Colaboradores",
      "area": "Comercial",
      "country": "Nicaragua",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 1,
      "CU2": 2,
      "CU3": 2,
      "CU4": 3,
      "CU5": 2,
      "CU6": 3,
      "CU7": 2,
      "CU8": 3,
      "CU9": 2,
      "CU10": 4,
      "CU11": 3,
      "CU12": 2,
      "CU13": 1,
      "CU14": 3,
      "CU15": 2,
      "CU16": 1,
      "CU17": 1,
      "CU18": 1,
      "CU19": 1,
      "CU20": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_002_core",
    "timestamp": "2026-07-15T17:56:39.745656",
    "survey": "core",
    "meta": {
      "name": "Guillermo Cabrera",
      "level": "Colaboradores",
      "area": "RRHH",
      "country": "Nicaragua",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 3,
      "A2": 3,
      "A3": 3,
      "A4": 5,
      "A5": 3,
      "E1": 3,
      "E2": 3,
      "E3": 3,
      "E4": 4,
      "E5": 4,
      "E6": 4,
      "E7": 4,
      "L1": 1,
      "L2": 1,
      "L3": 2,
      "L4": 3,
      "L5": 2,
      "L6": 1,
      "R1": 4,
      "R2": 3,
      "R3": 4,
      "R4": 4,
      "C1": 3,
      "C2": 2,
      "C3": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_002_full",
    "timestamp": "2026-07-15T17:56:39.745656",
    "survey": "full",
    "meta": {
      "name": "Guillermo Cabrera",
      "level": "Colaboradores",
      "area": "RRHH",
      "country": "Nicaragua",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 3,
      "A2": 3,
      "A3": 3,
      "A4": 5,
      "A5": 3,
      "E1": 3,
      "E2": 3,
      "E3": 3,
      "E4": 4,
      "E5": 4,
      "E6": 4,
      "E7": 4,
      "L1": 1,
      "L2": 1,
      "L3": 2,
      "L4": 3,
      "L5": 2,
      "L6": 1,
      "R1": 4,
      "R2": 3,
      "R3": 4,
      "R4": 4,
      "C1": 3,
      "C2": 2,
      "C3": 3,
      "SA6": 2,
      "SA7": 3,
      "SA8": 2,
      "SA9": 1,
      "SA10": 1,
      "SA11": 2,
      "SA12": 2,
      "EX8": 4,
      "EX9": 3,
      "EX10": 3,
      "EX11": 3,
      "EX12": 2,
      "EX13": 3,
      "EX14": 3,
      "EX15": 3,
      "EX16": 3,
      "EX17": 2,
      "EX18": 3,
      "LE7": 1,
      "LE8": 2,
      "LE9": 3,
      "LE10": 2,
      "LE11": 2,
      "LE12": 2,
      "LE13": 1,
      "LE14": 1,
      "LE15": 2,
      "RC5": 2,
      "RC6": 3,
      "RC7": 4,
      "RC8": 3,
      "RC9": 4,
      "OC4": 2,
      "OC5": 4,
      "OC6": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_002_deep_lei",
    "timestamp": "2026-07-15T18:26:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Guillermo Cabrera",
      "level": "Colaboradores",
      "area": "RRHH",
      "country": "Nicaragua",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 3,
      "LD2": 3,
      "LD3": 2,
      "LD4": 2,
      "LD5": 3,
      "LD6": 4,
      "LD7": 3,
      "LD8": 3,
      "LD9": 3,
      "LD10": 2,
      "LD11": 2,
      "LD12": 3,
      "LD13": 1,
      "LD14": 1,
      "LD15": 1,
      "LD16": 1,
      "LD17": 1,
      "LD18": 1,
      "LD19": 3,
      "LD20": 4,
      "LD21": 3,
      "LD22": 2,
      "LD23": 2,
      "LD24": 3,
      "LD25": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_002_deep_tcs",
    "timestamp": "2026-07-15T18:26:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Guillermo Cabrera",
      "level": "Colaboradores",
      "area": "RRHH",
      "country": "Nicaragua",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 3,
      "LT2": 3,
      "LT3": 2,
      "LT4": 1,
      "LT5": 3,
      "LT6": 1,
      "LT7": 3,
      "LT8": 2,
      "LT9": 3,
      "LT10": 1,
      "LT11": 2,
      "LT12": 1,
      "LT13": 2,
      "LT14": 1,
      "LT15": 2,
      "LT16": 3,
      "LT17": 2,
      "LT18": 1,
      "LT19": 1,
      "LT20": 1,
      "LT21": 1,
      "LT22": 3,
      "LT23": 3,
      "LT24": 3,
      "LT25": 4
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_002_deep_eci",
    "timestamp": "2026-07-15T18:26:39.745656",
    "survey": "deep_eci",
    "meta": {
      "name": "Guillermo Cabrera",
      "level": "Colaboradores",
      "area": "RRHH",
      "country": "Nicaragua",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "EXD1": 2,
      "EXD2": 2,
      "EXD3": 2,
      "EXD4": 2,
      "EXD5": 3,
      "EXD6": 3,
      "EXD7": 5,
      "EXD8": 4,
      "EXD9": 5,
      "EXD10": 3,
      "EXD11": 3,
      "EXD12": 3,
      "EXD13": 4,
      "EXD14": 4,
      "EXD15": 4,
      "EXD16": 4,
      "EXD17": 4,
      "EXD18": 4,
      "EXD19": 5,
      "EXD20": 5,
      "EXD21": 5,
      "EXD22": 5,
      "EXD23": 3,
      "EXD24": 5,
      "EXD25": 4
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_002_deep_aci",
    "timestamp": "2026-07-15T18:26:39.745656",
    "survey": "deep_aci",
    "meta": {
      "name": "Guillermo Cabrera",
      "level": "Colaboradores",
      "area": "RRHH",
      "country": "Nicaragua",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CH1": 2,
      "CH2": 3,
      "CH3": 3,
      "CH4": 3,
      "CH5": 3,
      "CH6": 5,
      "CH7": 3,
      "CH8": 3,
      "CH9": 3,
      "CH10": 1,
      "CH11": 1,
      "CH12": 1,
      "CH13": 2,
      "CH14": 2,
      "CH15": 2,
      "CH16": 3,
      "CH17": 4,
      "CH18": 3,
      "CH19": 4,
      "CH20": 4
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_002_deep_cei",
    "timestamp": "2026-07-15T18:26:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Guillermo Cabrera",
      "level": "Colaboradores",
      "area": "RRHH",
      "country": "Nicaragua",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 1,
      "CU2": 2,
      "CU3": 2,
      "CU4": 1,
      "CU5": 1,
      "CU6": 1,
      "CU7": 2,
      "CU8": 1,
      "CU9": 2,
      "CU10": 1,
      "CU11": 1,
      "CU12": 1,
      "CU13": 4,
      "CU14": 4,
      "CU15": 3,
      "CU16": 2,
      "CU17": 2,
      "CU18": 2,
      "CU19": 1,
      "CU20": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_003_core",
    "timestamp": "2026-07-19T10:14:39.745656",
    "survey": "core",
    "meta": {
      "name": "Rosa Suárez",
      "level": "Colaboradores",
      "area": "Comercial",
      "country": "Costa Rica",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 2,
      "A2": 2,
      "A3": 2,
      "A4": 2,
      "A5": 3,
      "E1": 4,
      "E2": 2,
      "E3": 2,
      "E4": 4,
      "E5": 2,
      "E6": 4,
      "E7": 3,
      "L1": 1,
      "L2": 1,
      "L3": 1,
      "L4": 1,
      "L5": 1,
      "L6": 2,
      "R1": 2,
      "R2": 3,
      "R3": 2,
      "R4": 1,
      "C1": 1,
      "C2": 2,
      "C3": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_003_full",
    "timestamp": "2026-07-19T10:14:39.745656",
    "survey": "full",
    "meta": {
      "name": "Rosa Suárez",
      "level": "Colaboradores",
      "area": "Comercial",
      "country": "Costa Rica",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 2,
      "A2": 2,
      "A3": 2,
      "A4": 2,
      "A5": 3,
      "E1": 4,
      "E2": 2,
      "E3": 2,
      "E4": 4,
      "E5": 2,
      "E6": 4,
      "E7": 3,
      "L1": 1,
      "L2": 1,
      "L3": 1,
      "L4": 1,
      "L5": 1,
      "L6": 2,
      "R1": 2,
      "R2": 3,
      "R3": 2,
      "R4": 1,
      "C1": 1,
      "C2": 2,
      "C3": 1,
      "SA6": 3,
      "SA7": 3,
      "SA8": 2,
      "SA9": 4,
      "SA10": 3,
      "SA11": 3,
      "SA12": 3,
      "EX8": 2,
      "EX9": 3,
      "EX10": 2,
      "EX11": 4,
      "EX12": 2,
      "EX13": 1,
      "EX14": 2,
      "EX15": 2,
      "EX16": 2,
      "EX17": 2,
      "EX18": 3,
      "LE7": 1,
      "LE8": 3,
      "LE9": 1,
      "LE10": 2,
      "LE11": 2,
      "LE12": 2,
      "LE13": 2,
      "LE14": 3,
      "LE15": 1,
      "RC5": 4,
      "RC6": 5,
      "RC7": 3,
      "RC8": 3,
      "RC9": 4,
      "OC4": 2,
      "OC5": 3,
      "OC6": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_003_deep_lei",
    "timestamp": "2026-07-19T10:44:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Rosa Suárez",
      "level": "Colaboradores",
      "area": "Comercial",
      "country": "Costa Rica",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 5,
      "LD2": 5,
      "LD3": 4,
      "LD4": 2,
      "LD5": 1,
      "LD6": 2,
      "LD7": 1,
      "LD8": 1,
      "LD9": 1,
      "LD10": 3,
      "LD11": 2,
      "LD12": 3,
      "LD13": 2,
      "LD14": 1,
      "LD15": 1,
      "LD16": 3,
      "LD17": 3,
      "LD18": 2,
      "LD19": 1,
      "LD20": 2,
      "LD21": 1,
      "LD22": 2,
      "LD23": 1,
      "LD24": 2,
      "LD25": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_003_deep_tcs",
    "timestamp": "2026-07-19T10:44:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Rosa Suárez",
      "level": "Colaboradores",
      "area": "Comercial",
      "country": "Costa Rica",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 2,
      "LT2": 2,
      "LT3": 3,
      "LT4": 2,
      "LT5": 2,
      "LT6": 1,
      "LT7": 3,
      "LT8": 4,
      "LT9": 3,
      "LT10": 2,
      "LT11": 3,
      "LT12": 3,
      "LT13": 1,
      "LT14": 1,
      "LT15": 1,
      "LT16": 3,
      "LT17": 2,
      "LT18": 1,
      "LT19": 3,
      "LT20": 4,
      "LT21": 3,
      "LT22": 1,
      "LT23": 2,
      "LT24": 2,
      "LT25": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_003_deep_eci",
    "timestamp": "2026-07-19T10:44:39.745656",
    "survey": "deep_eci",
    "meta": {
      "name": "Rosa Suárez",
      "level": "Colaboradores",
      "area": "Comercial",
      "country": "Costa Rica",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "EXD1": 4,
      "EXD2": 3,
      "EXD3": 4,
      "EXD4": 4,
      "EXD5": 2,
      "EXD6": 3,
      "EXD7": 4,
      "EXD8": 4,
      "EXD9": 3,
      "EXD10": 3,
      "EXD11": 3,
      "EXD12": 2,
      "EXD13": 4,
      "EXD14": 4,
      "EXD15": 3,
      "EXD16": 3,
      "EXD17": 3,
      "EXD18": 3,
      "EXD19": 3,
      "EXD20": 4,
      "EXD21": 4,
      "EXD22": 3,
      "EXD23": 2,
      "EXD24": 3,
      "EXD25": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_003_deep_aci",
    "timestamp": "2026-07-19T10:44:39.745656",
    "survey": "deep_aci",
    "meta": {
      "name": "Rosa Suárez",
      "level": "Colaboradores",
      "area": "Comercial",
      "country": "Costa Rica",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CH1": 3,
      "CH2": 2,
      "CH3": 3,
      "CH4": 2,
      "CH5": 2,
      "CH6": 2,
      "CH7": 4,
      "CH8": 4,
      "CH9": 4,
      "CH10": 2,
      "CH11": 2,
      "CH12": 2,
      "CH13": 3,
      "CH14": 3,
      "CH15": 3,
      "CH16": 2,
      "CH17": 2,
      "CH18": 2,
      "CH19": 2,
      "CH20": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_003_deep_cei",
    "timestamp": "2026-07-19T10:44:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Rosa Suárez",
      "level": "Colaboradores",
      "area": "Comercial",
      "country": "Costa Rica",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 1,
      "CU2": 1,
      "CU3": 1,
      "CU4": 2,
      "CU5": 1,
      "CU6": 1,
      "CU7": 3,
      "CU8": 3,
      "CU9": 2,
      "CU10": 3,
      "CU11": 3,
      "CU12": 3,
      "CU13": 2,
      "CU14": 3,
      "CU15": 2,
      "CU16": 1,
      "CU17": 1,
      "CU18": 2,
      "CU19": 1,
      "CU20": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_004_core",
    "timestamp": "2026-07-20T02:47:39.745656",
    "survey": "core",
    "meta": {
      "name": "Antonio Lara",
      "level": "Colaboradores",
      "area": "RRHH",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 3,
      "A2": 3,
      "A3": 4,
      "A4": 4,
      "A5": 4,
      "E1": 2,
      "E2": 2,
      "E3": 2,
      "E4": 3,
      "E5": 4,
      "E6": 4,
      "E7": 1,
      "L1": 5,
      "L2": 4,
      "L3": 5,
      "L4": 5,
      "L5": 5,
      "L6": 4,
      "R1": 2,
      "R2": 2,
      "R3": 1,
      "R4": 2,
      "C1": 1,
      "C2": 1,
      "C3": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_004_full",
    "timestamp": "2026-07-20T02:47:39.745656",
    "survey": "full",
    "meta": {
      "name": "Antonio Lara",
      "level": "Colaboradores",
      "area": "RRHH",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 3,
      "A2": 3,
      "A3": 4,
      "A4": 4,
      "A5": 4,
      "E1": 2,
      "E2": 2,
      "E3": 2,
      "E4": 3,
      "E5": 4,
      "E6": 4,
      "E7": 1,
      "L1": 5,
      "L2": 4,
      "L3": 5,
      "L4": 5,
      "L5": 5,
      "L6": 4,
      "R1": 2,
      "R2": 2,
      "R3": 1,
      "R4": 2,
      "C1": 1,
      "C2": 1,
      "C3": 1,
      "SA6": 2,
      "SA7": 1,
      "SA8": 2,
      "SA9": 1,
      "SA10": 2,
      "SA11": 2,
      "SA12": 2,
      "EX8": 3,
      "EX9": 3,
      "EX10": 3,
      "EX11": 3,
      "EX12": 2,
      "EX13": 2,
      "EX14": 3,
      "EX15": 3,
      "EX16": 3,
      "EX17": 2,
      "EX18": 3,
      "LE7": 3,
      "LE8": 3,
      "LE9": 4,
      "LE10": 3,
      "LE11": 3,
      "LE12": 3,
      "LE13": 4,
      "LE14": 2,
      "LE15": 3,
      "RC5": 4,
      "RC6": 4,
      "RC7": 3,
      "RC8": 5,
      "RC9": 5,
      "OC4": 1,
      "OC5": 2,
      "OC6": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_004_deep_eci",
    "timestamp": "2026-07-20T03:17:39.745656",
    "survey": "deep_eci",
    "meta": {
      "name": "Antonio Lara",
      "level": "Colaboradores",
      "area": "RRHH",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "EXD1": 3,
      "EXD2": 3,
      "EXD3": 3,
      "EXD4": 3,
      "EXD5": 3,
      "EXD6": 3,
      "EXD7": 3,
      "EXD8": 2,
      "EXD9": 3,
      "EXD10": 3,
      "EXD11": 3,
      "EXD12": 2,
      "EXD13": 3,
      "EXD14": 3,
      "EXD15": 4,
      "EXD16": 3,
      "EXD17": 3,
      "EXD18": 3,
      "EXD19": 2,
      "EXD20": 2,
      "EXD21": 2,
      "EXD22": 3,
      "EXD23": 3,
      "EXD24": 2,
      "EXD25": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_004_deep_aci",
    "timestamp": "2026-07-20T03:17:39.745656",
    "survey": "deep_aci",
    "meta": {
      "name": "Antonio Lara",
      "level": "Colaboradores",
      "area": "RRHH",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CH1": 2,
      "CH2": 1,
      "CH3": 2,
      "CH4": 1,
      "CH5": 1,
      "CH6": 2,
      "CH7": 5,
      "CH8": 4,
      "CH9": 4,
      "CH10": 2,
      "CH11": 4,
      "CH12": 4,
      "CH13": 4,
      "CH14": 3,
      "CH15": 3,
      "CH16": 1,
      "CH17": 1,
      "CH18": 1,
      "CH19": 1,
      "CH20": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_004_deep_cei",
    "timestamp": "2026-07-20T03:17:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Antonio Lara",
      "level": "Colaboradores",
      "area": "RRHH",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 1,
      "CU2": 1,
      "CU3": 1,
      "CU4": 3,
      "CU5": 3,
      "CU6": 2,
      "CU7": 2,
      "CU8": 2,
      "CU9": 2,
      "CU10": 2,
      "CU11": 2,
      "CU12": 2,
      "CU13": 1,
      "CU14": 1,
      "CU15": 1,
      "CU16": 1,
      "CU17": 2,
      "CU18": 1,
      "CU19": 1,
      "CU20": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_005_core",
    "timestamp": "2026-07-15T22:10:39.745656",
    "survey": "core",
    "meta": {
      "name": "Carla Ibáñez",
      "level": "Colaboradores",
      "area": "Administración",
      "country": "Costa Rica",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 2,
      "A2": 2,
      "A3": 2,
      "A4": 3,
      "A5": 2,
      "E1": 2,
      "E2": 3,
      "E3": 4,
      "E4": 4,
      "E5": 3,
      "E6": 3,
      "E7": 2,
      "L1": 2,
      "L2": 2,
      "L3": 2,
      "L4": 2,
      "L5": 2,
      "L6": 2,
      "R1": 5,
      "R2": 5,
      "R3": 5,
      "R4": 4,
      "C1": 2,
      "C2": 2,
      "C3": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_005_full",
    "timestamp": "2026-07-15T22:10:39.745656",
    "survey": "full",
    "meta": {
      "name": "Carla Ibáñez",
      "level": "Colaboradores",
      "area": "Administración",
      "country": "Costa Rica",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 2,
      "A2": 2,
      "A3": 2,
      "A4": 3,
      "A5": 2,
      "E1": 2,
      "E2": 3,
      "E3": 4,
      "E4": 4,
      "E5": 3,
      "E6": 3,
      "E7": 2,
      "L1": 2,
      "L2": 2,
      "L3": 2,
      "L4": 2,
      "L5": 2,
      "L6": 2,
      "R1": 5,
      "R2": 5,
      "R3": 5,
      "R4": 4,
      "C1": 2,
      "C2": 2,
      "C3": 2,
      "SA6": 2,
      "SA7": 2,
      "SA8": 2,
      "SA9": 3,
      "SA10": 3,
      "SA11": 3,
      "SA12": 2,
      "EX8": 3,
      "EX9": 4,
      "EX10": 3,
      "EX11": 5,
      "EX12": 2,
      "EX13": 4,
      "EX14": 3,
      "EX15": 4,
      "EX16": 3,
      "EX17": 4,
      "EX18": 4,
      "LE7": 1,
      "LE8": 3,
      "LE9": 3,
      "LE10": 3,
      "LE11": 3,
      "LE12": 3,
      "LE13": 3,
      "LE14": 3,
      "LE15": 4,
      "RC5": 3,
      "RC6": 3,
      "RC7": 1,
      "RC8": 2,
      "RC9": 2,
      "OC4": 1,
      "OC5": 2,
      "OC6": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_005_deep_lei",
    "timestamp": "2026-07-15T22:40:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Carla Ibáñez",
      "level": "Colaboradores",
      "area": "Administración",
      "country": "Costa Rica",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 1,
      "LD2": 2,
      "LD3": 1,
      "LD4": 1,
      "LD5": 1,
      "LD6": 1,
      "LD7": 2,
      "LD8": 3,
      "LD9": 2,
      "LD10": 2,
      "LD11": 1,
      "LD12": 3,
      "LD13": 2,
      "LD14": 2,
      "LD15": 2,
      "LD16": 1,
      "LD17": 1,
      "LD18": 1,
      "LD19": 4,
      "LD20": 4,
      "LD21": 4,
      "LD22": 2,
      "LD23": 2,
      "LD24": 1,
      "LD25": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_005_deep_tcs",
    "timestamp": "2026-07-15T22:40:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Carla Ibáñez",
      "level": "Colaboradores",
      "area": "Administración",
      "country": "Costa Rica",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 4,
      "LT2": 4,
      "LT3": 5,
      "LT4": 4,
      "LT5": 3,
      "LT6": 3,
      "LT7": 2,
      "LT8": 2,
      "LT9": 1,
      "LT10": 3,
      "LT11": 3,
      "LT12": 4,
      "LT13": 2,
      "LT14": 1,
      "LT15": 1,
      "LT16": 2,
      "LT17": 2,
      "LT18": 2,
      "LT19": 1,
      "LT20": 1,
      "LT21": 1,
      "LT22": 1,
      "LT23": 1,
      "LT24": 1,
      "LT25": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_005_deep_eci",
    "timestamp": "2026-07-15T22:40:39.745656",
    "survey": "deep_eci",
    "meta": {
      "name": "Carla Ibáñez",
      "level": "Colaboradores",
      "area": "Administración",
      "country": "Costa Rica",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "EXD1": 3,
      "EXD2": 3,
      "EXD3": 3,
      "EXD4": 3,
      "EXD5": 4,
      "EXD6": 4,
      "EXD7": 3,
      "EXD8": 3,
      "EXD9": 3,
      "EXD10": 2,
      "EXD11": 3,
      "EXD12": 3,
      "EXD13": 4,
      "EXD14": 3,
      "EXD15": 3,
      "EXD16": 3,
      "EXD17": 3,
      "EXD18": 2,
      "EXD19": 3,
      "EXD20": 4,
      "EXD21": 4,
      "EXD22": 3,
      "EXD23": 3,
      "EXD24": 3,
      "EXD25": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_005_deep_aci",
    "timestamp": "2026-07-15T22:40:39.745656",
    "survey": "deep_aci",
    "meta": {
      "name": "Carla Ibáñez",
      "level": "Colaboradores",
      "area": "Administración",
      "country": "Costa Rica",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CH1": 3,
      "CH2": 3,
      "CH3": 3,
      "CH4": 4,
      "CH5": 5,
      "CH6": 4,
      "CH7": 1,
      "CH8": 1,
      "CH9": 1,
      "CH10": 3,
      "CH11": 3,
      "CH12": 2,
      "CH13": 4,
      "CH14": 4,
      "CH15": 4,
      "CH16": 3,
      "CH17": 2,
      "CH18": 2,
      "CH19": 3,
      "CH20": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_005_deep_cei",
    "timestamp": "2026-07-15T22:40:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Carla Ibáñez",
      "level": "Colaboradores",
      "area": "Administración",
      "country": "Costa Rica",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 3,
      "CU2": 3,
      "CU3": 3,
      "CU4": 2,
      "CU5": 2,
      "CU6": 1,
      "CU7": 1,
      "CU8": 1,
      "CU9": 1,
      "CU10": 1,
      "CU11": 1,
      "CU12": 1,
      "CU13": 2,
      "CU14": 2,
      "CU15": 3,
      "CU16": 2,
      "CU17": 2,
      "CU18": 4,
      "CU19": 2,
      "CU20": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_006_core",
    "timestamp": "2026-07-19T13:27:39.745656",
    "survey": "core",
    "meta": {
      "name": "Rodrigo Salinas",
      "level": "Colaboradores",
      "area": "Finanzas",
      "country": "Nicaragua",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 2,
      "A2": 3,
      "A3": 2,
      "A4": 1,
      "A5": 2,
      "E1": 3,
      "E2": 4,
      "E3": 5,
      "E4": 3,
      "E5": 4,
      "E6": 3,
      "E7": 3,
      "L1": 3,
      "L2": 3,
      "L3": 2,
      "L4": 3,
      "L5": 1,
      "L6": 3,
      "R1": 3,
      "R2": 3,
      "R3": 4,
      "R4": 3,
      "C1": 5,
      "C2": 5,
      "C3": 5
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_006_full",
    "timestamp": "2026-07-19T13:27:39.745656",
    "survey": "full",
    "meta": {
      "name": "Rodrigo Salinas",
      "level": "Colaboradores",
      "area": "Finanzas",
      "country": "Nicaragua",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 2,
      "A2": 3,
      "A3": 2,
      "A4": 1,
      "A5": 2,
      "E1": 3,
      "E2": 4,
      "E3": 5,
      "E4": 3,
      "E5": 4,
      "E6": 3,
      "E7": 3,
      "L1": 3,
      "L2": 3,
      "L3": 2,
      "L4": 3,
      "L5": 1,
      "L6": 3,
      "R1": 3,
      "R2": 3,
      "R3": 4,
      "R4": 3,
      "C1": 5,
      "C2": 5,
      "C3": 5,
      "SA6": 3,
      "SA7": 4,
      "SA8": 4,
      "SA9": 4,
      "SA10": 3,
      "SA11": 4,
      "SA12": 4,
      "EX8": 3,
      "EX9": 3,
      "EX10": 4,
      "EX11": 3,
      "EX12": 3,
      "EX13": 3,
      "EX14": 4,
      "EX15": 3,
      "EX16": 2,
      "EX17": 3,
      "EX18": 3,
      "LE7": 4,
      "LE8": 4,
      "LE9": 4,
      "LE10": 4,
      "LE11": 3,
      "LE12": 4,
      "LE13": 3,
      "LE14": 3,
      "LE15": 4,
      "RC5": 3,
      "RC6": 3,
      "RC7": 5,
      "RC8": 3,
      "RC9": 3,
      "OC4": 2,
      "OC5": 2,
      "OC6": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_006_deep_lei",
    "timestamp": "2026-07-19T13:57:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Rodrigo Salinas",
      "level": "Colaboradores",
      "area": "Finanzas",
      "country": "Nicaragua",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 3,
      "LD2": 2,
      "LD3": 2,
      "LD4": 3,
      "LD5": 2,
      "LD6": 3,
      "LD7": 2,
      "LD8": 2,
      "LD9": 2,
      "LD10": 1,
      "LD11": 1,
      "LD12": 1,
      "LD13": 1,
      "LD14": 1,
      "LD15": 1,
      "LD16": 1,
      "LD17": 1,
      "LD18": 1,
      "LD19": 1,
      "LD20": 2,
      "LD21": 1,
      "LD22": 2,
      "LD23": 2,
      "LD24": 2,
      "LD25": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_006_deep_tcs",
    "timestamp": "2026-07-19T13:57:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Rodrigo Salinas",
      "level": "Colaboradores",
      "area": "Finanzas",
      "country": "Nicaragua",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 1,
      "LT2": 2,
      "LT3": 2,
      "LT4": 1,
      "LT5": 1,
      "LT6": 1,
      "LT7": 1,
      "LT8": 1,
      "LT9": 1,
      "LT10": 2,
      "LT11": 2,
      "LT12": 1,
      "LT13": 2,
      "LT14": 2,
      "LT15": 2,
      "LT16": 1,
      "LT17": 1,
      "LT18": 1,
      "LT19": 2,
      "LT20": 2,
      "LT21": 2,
      "LT22": 2,
      "LT23": 3,
      "LT24": 1,
      "LT25": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_006_deep_eci",
    "timestamp": "2026-07-19T13:57:39.745656",
    "survey": "deep_eci",
    "meta": {
      "name": "Rodrigo Salinas",
      "level": "Colaboradores",
      "area": "Finanzas",
      "country": "Nicaragua",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "EXD1": 4,
      "EXD2": 5,
      "EXD3": 3,
      "EXD4": 3,
      "EXD5": 3,
      "EXD6": 2,
      "EXD7": 3,
      "EXD8": 3,
      "EXD9": 4,
      "EXD10": 5,
      "EXD11": 4,
      "EXD12": 4,
      "EXD13": 4,
      "EXD14": 5,
      "EXD15": 4,
      "EXD16": 4,
      "EXD17": 4,
      "EXD18": 4,
      "EXD19": 4,
      "EXD20": 3,
      "EXD21": 4,
      "EXD22": 3,
      "EXD23": 4,
      "EXD24": 3,
      "EXD25": 4
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_006_deep_aci",
    "timestamp": "2026-07-19T13:57:39.745656",
    "survey": "deep_aci",
    "meta": {
      "name": "Rodrigo Salinas",
      "level": "Colaboradores",
      "area": "Finanzas",
      "country": "Nicaragua",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CH1": 3,
      "CH2": 3,
      "CH3": 3,
      "CH4": 3,
      "CH5": 4,
      "CH6": 3,
      "CH7": 3,
      "CH8": 4,
      "CH9": 3,
      "CH10": 2,
      "CH11": 2,
      "CH12": 2,
      "CH13": 4,
      "CH14": 3,
      "CH15": 3,
      "CH16": 2,
      "CH17": 1,
      "CH18": 1,
      "CH19": 1,
      "CH20": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_007_core",
    "timestamp": "2026-07-17T19:07:39.745656",
    "survey": "core",
    "meta": {
      "name": "Teresa Bravo",
      "level": "Colaboradores",
      "area": "Comercial",
      "country": "Costa Rica",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 2,
      "A2": 3,
      "A3": 3,
      "A4": 3,
      "A5": 3,
      "E1": 3,
      "E2": 2,
      "E3": 4,
      "E4": 3,
      "E5": 2,
      "E6": 4,
      "E7": 3,
      "L1": 3,
      "L2": 5,
      "L3": 4,
      "L4": 3,
      "L5": 3,
      "L6": 3,
      "R1": 3,
      "R2": 3,
      "R3": 4,
      "R4": 3,
      "C1": 2,
      "C2": 2,
      "C3": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_007_full",
    "timestamp": "2026-07-17T19:07:39.745656",
    "survey": "full",
    "meta": {
      "name": "Teresa Bravo",
      "level": "Colaboradores",
      "area": "Comercial",
      "country": "Costa Rica",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 2,
      "A2": 3,
      "A3": 3,
      "A4": 3,
      "A5": 3,
      "E1": 3,
      "E2": 2,
      "E3": 4,
      "E4": 3,
      "E5": 2,
      "E6": 4,
      "E7": 3,
      "L1": 3,
      "L2": 5,
      "L3": 4,
      "L4": 3,
      "L5": 3,
      "L6": 3,
      "R1": 3,
      "R2": 3,
      "R3": 4,
      "R4": 3,
      "C1": 2,
      "C2": 2,
      "C3": 3,
      "SA6": 2,
      "SA7": 1,
      "SA8": 1,
      "SA9": 1,
      "SA10": 2,
      "SA11": 1,
      "SA12": 2,
      "EX8": 2,
      "EX9": 3,
      "EX10": 3,
      "EX11": 5,
      "EX12": 3,
      "EX13": 4,
      "EX14": 3,
      "EX15": 4,
      "EX16": 3,
      "EX17": 4,
      "EX18": 3,
      "LE7": 2,
      "LE8": 3,
      "LE9": 3,
      "LE10": 4,
      "LE11": 4,
      "LE12": 5,
      "LE13": 3,
      "LE14": 3,
      "LE15": 4,
      "RC5": 3,
      "RC6": 4,
      "RC7": 3,
      "RC8": 3,
      "RC9": 3,
      "OC4": 3,
      "OC5": 3,
      "OC6": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_007_deep_lei",
    "timestamp": "2026-07-17T19:37:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Teresa Bravo",
      "level": "Colaboradores",
      "area": "Comercial",
      "country": "Costa Rica",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 4,
      "LD2": 4,
      "LD3": 3,
      "LD4": 2,
      "LD5": 2,
      "LD6": 2,
      "LD7": 2,
      "LD8": 3,
      "LD9": 3,
      "LD10": 1,
      "LD11": 2,
      "LD12": 2,
      "LD13": 2,
      "LD14": 1,
      "LD15": 1,
      "LD16": 4,
      "LD17": 4,
      "LD18": 3,
      "LD19": 2,
      "LD20": 2,
      "LD21": 1,
      "LD22": 2,
      "LD23": 3,
      "LD24": 2,
      "LD25": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_007_deep_tcs",
    "timestamp": "2026-07-17T19:37:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Teresa Bravo",
      "level": "Colaboradores",
      "area": "Comercial",
      "country": "Costa Rica",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 2,
      "LT2": 2,
      "LT3": 3,
      "LT4": 2,
      "LT5": 2,
      "LT6": 2,
      "LT7": 3,
      "LT8": 4,
      "LT9": 3,
      "LT10": 1,
      "LT11": 1,
      "LT12": 1,
      "LT13": 2,
      "LT14": 1,
      "LT15": 3,
      "LT16": 3,
      "LT17": 3,
      "LT18": 4,
      "LT19": 1,
      "LT20": 2,
      "LT21": 3,
      "LT22": 2,
      "LT23": 2,
      "LT24": 1,
      "LT25": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_007_deep_eci",
    "timestamp": "2026-07-17T19:37:39.745656",
    "survey": "deep_eci",
    "meta": {
      "name": "Teresa Bravo",
      "level": "Colaboradores",
      "area": "Comercial",
      "country": "Costa Rica",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "EXD1": 4,
      "EXD2": 3,
      "EXD3": 3,
      "EXD4": 4,
      "EXD5": 2,
      "EXD6": 3,
      "EXD7": 3,
      "EXD8": 3,
      "EXD9": 4,
      "EXD10": 4,
      "EXD11": 4,
      "EXD12": 4,
      "EXD13": 4,
      "EXD14": 3,
      "EXD15": 2,
      "EXD16": 3,
      "EXD17": 3,
      "EXD18": 4,
      "EXD19": 5,
      "EXD20": 5,
      "EXD21": 5,
      "EXD22": 3,
      "EXD23": 3,
      "EXD24": 2,
      "EXD25": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_007_deep_aci",
    "timestamp": "2026-07-17T19:37:39.745656",
    "survey": "deep_aci",
    "meta": {
      "name": "Teresa Bravo",
      "level": "Colaboradores",
      "area": "Comercial",
      "country": "Costa Rica",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CH1": 3,
      "CH2": 3,
      "CH3": 3,
      "CH4": 1,
      "CH5": 1,
      "CH6": 1,
      "CH7": 3,
      "CH8": 2,
      "CH9": 2,
      "CH10": 2,
      "CH11": 1,
      "CH12": 2,
      "CH13": 1,
      "CH14": 3,
      "CH15": 1,
      "CH16": 3,
      "CH17": 3,
      "CH18": 3,
      "CH19": 4,
      "CH20": 4
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_007_deep_cei",
    "timestamp": "2026-07-17T19:37:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Teresa Bravo",
      "level": "Colaboradores",
      "area": "Comercial",
      "country": "Costa Rica",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 2,
      "CU2": 2,
      "CU3": 2,
      "CU4": 2,
      "CU5": 1,
      "CU6": 2,
      "CU7": 2,
      "CU8": 2,
      "CU9": 1,
      "CU10": 4,
      "CU11": 4,
      "CU12": 4,
      "CU13": 2,
      "CU14": 3,
      "CU15": 2,
      "CU16": 3,
      "CU17": 4,
      "CU18": 3,
      "CU19": 3,
      "CU20": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_008_core",
    "timestamp": "2026-07-20T21:08:39.745656",
    "survey": "core",
    "meta": {
      "name": "Oscar Núñez",
      "level": "Colaboradores",
      "area": "Operaciones",
      "country": "Nicaragua",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 3,
      "A2": 4,
      "A3": 3,
      "A4": 3,
      "A5": 3,
      "E1": 3,
      "E2": 4,
      "E3": 3,
      "E4": 4,
      "E5": 5,
      "E6": 2,
      "E7": 5,
      "L1": 4,
      "L2": 3,
      "L3": 3,
      "L4": 2,
      "L5": 3,
      "L6": 3,
      "R1": 3,
      "R2": 2,
      "R3": 2,
      "R4": 3,
      "C1": 1,
      "C2": 2,
      "C3": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_008_full",
    "timestamp": "2026-07-20T21:08:39.745656",
    "survey": "full",
    "meta": {
      "name": "Oscar Núñez",
      "level": "Colaboradores",
      "area": "Operaciones",
      "country": "Nicaragua",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 3,
      "A2": 4,
      "A3": 3,
      "A4": 3,
      "A5": 3,
      "E1": 3,
      "E2": 4,
      "E3": 3,
      "E4": 4,
      "E5": 5,
      "E6": 2,
      "E7": 5,
      "L1": 4,
      "L2": 3,
      "L3": 3,
      "L4": 2,
      "L5": 3,
      "L6": 3,
      "R1": 3,
      "R2": 2,
      "R3": 2,
      "R4": 3,
      "C1": 1,
      "C2": 2,
      "C3": 1,
      "SA6": 3,
      "SA7": 3,
      "SA8": 4,
      "SA9": 3,
      "SA10": 2,
      "SA11": 3,
      "SA12": 2,
      "EX8": 3,
      "EX9": 4,
      "EX10": 4,
      "EX11": 5,
      "EX12": 4,
      "EX13": 4,
      "EX14": 2,
      "EX15": 3,
      "EX16": 4,
      "EX17": 4,
      "EX18": 2,
      "LE7": 1,
      "LE8": 1,
      "LE9": 1,
      "LE10": 1,
      "LE11": 2,
      "LE12": 1,
      "LE13": 1,
      "LE14": 1,
      "LE15": 1,
      "RC5": 2,
      "RC6": 2,
      "RC7": 2,
      "RC8": 2,
      "RC9": 3,
      "OC4": 2,
      "OC5": 3,
      "OC6": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_008_deep_lei",
    "timestamp": "2026-07-20T21:38:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Oscar Núñez",
      "level": "Colaboradores",
      "area": "Operaciones",
      "country": "Nicaragua",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 4,
      "LD2": 4,
      "LD3": 4,
      "LD4": 2,
      "LD5": 1,
      "LD6": 2,
      "LD7": 3,
      "LD8": 4,
      "LD9": 4,
      "LD10": 1,
      "LD11": 1,
      "LD12": 1,
      "LD13": 1,
      "LD14": 1,
      "LD15": 2,
      "LD16": 3,
      "LD17": 3,
      "LD18": 3,
      "LD19": 1,
      "LD20": 1,
      "LD21": 1,
      "LD22": 3,
      "LD23": 1,
      "LD24": 1,
      "LD25": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_008_deep_tcs",
    "timestamp": "2026-07-20T21:38:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Oscar Núñez",
      "level": "Colaboradores",
      "area": "Operaciones",
      "country": "Nicaragua",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 2,
      "LT2": 2,
      "LT3": 3,
      "LT4": 4,
      "LT5": 5,
      "LT6": 4,
      "LT7": 1,
      "LT8": 2,
      "LT9": 1,
      "LT10": 3,
      "LT11": 3,
      "LT12": 2,
      "LT13": 2,
      "LT14": 2,
      "LT15": 3,
      "LT16": 3,
      "LT17": 3,
      "LT18": 3,
      "LT19": 2,
      "LT20": 2,
      "LT21": 2,
      "LT22": 3,
      "LT23": 2,
      "LT24": 4,
      "LT25": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_008_deep_aci",
    "timestamp": "2026-07-20T21:38:39.745656",
    "survey": "deep_aci",
    "meta": {
      "name": "Oscar Núñez",
      "level": "Colaboradores",
      "area": "Operaciones",
      "country": "Nicaragua",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CH1": 3,
      "CH2": 5,
      "CH3": 3,
      "CH4": 3,
      "CH5": 3,
      "CH6": 2,
      "CH7": 2,
      "CH8": 2,
      "CH9": 2,
      "CH10": 3,
      "CH11": 1,
      "CH12": 2,
      "CH13": 3,
      "CH14": 3,
      "CH15": 4,
      "CH16": 3,
      "CH17": 3,
      "CH18": 2,
      "CH19": 2,
      "CH20": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_008_deep_cei",
    "timestamp": "2026-07-20T21:38:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Oscar Núñez",
      "level": "Colaboradores",
      "area": "Operaciones",
      "country": "Nicaragua",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 1,
      "CU2": 1,
      "CU3": 1,
      "CU4": 1,
      "CU5": 1,
      "CU6": 2,
      "CU7": 3,
      "CU8": 3,
      "CU9": 3,
      "CU10": 1,
      "CU11": 1,
      "CU12": 1,
      "CU13": 2,
      "CU14": 1,
      "CU15": 1,
      "CU16": 2,
      "CU17": 1,
      "CU18": 3,
      "CU19": 1,
      "CU20": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_009_core",
    "timestamp": "2026-07-12T08:31:39.745656",
    "survey": "core",
    "meta": {
      "name": "Pilar Cortés",
      "level": "Colaboradores",
      "area": "RRHH",
      "country": "Nicaragua",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 3,
      "A2": 3,
      "A3": 3,
      "A4": 2,
      "A5": 2,
      "E1": 5,
      "E2": 3,
      "E3": 3,
      "E4": 5,
      "E5": 3,
      "E6": 4,
      "E7": 4,
      "L1": 1,
      "L2": 1,
      "L3": 1,
      "L4": 1,
      "L5": 1,
      "L6": 2,
      "R1": 2,
      "R2": 3,
      "R3": 3,
      "R4": 1,
      "C1": 2,
      "C2": 1,
      "C3": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_009_full",
    "timestamp": "2026-07-12T08:31:39.745656",
    "survey": "full",
    "meta": {
      "name": "Pilar Cortés",
      "level": "Colaboradores",
      "area": "RRHH",
      "country": "Nicaragua",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 3,
      "A2": 3,
      "A3": 3,
      "A4": 2,
      "A5": 2,
      "E1": 5,
      "E2": 3,
      "E3": 3,
      "E4": 5,
      "E5": 3,
      "E6": 4,
      "E7": 4,
      "L1": 1,
      "L2": 1,
      "L3": 1,
      "L4": 1,
      "L5": 1,
      "L6": 2,
      "R1": 2,
      "R2": 3,
      "R3": 3,
      "R4": 1,
      "C1": 2,
      "C2": 1,
      "C3": 2,
      "SA6": 1,
      "SA7": 2,
      "SA8": 2,
      "SA9": 3,
      "SA10": 1,
      "SA11": 3,
      "SA12": 2,
      "EX8": 3,
      "EX9": 2,
      "EX10": 4,
      "EX11": 4,
      "EX12": 3,
      "EX13": 3,
      "EX14": 3,
      "EX15": 4,
      "EX16": 3,
      "EX17": 4,
      "EX18": 4,
      "LE7": 1,
      "LE8": 2,
      "LE9": 2,
      "LE10": 1,
      "LE11": 2,
      "LE12": 1,
      "LE13": 2,
      "LE14": 3,
      "LE15": 1,
      "RC5": 2,
      "RC6": 2,
      "RC7": 1,
      "RC8": 2,
      "RC9": 2,
      "OC4": 3,
      "OC5": 2,
      "OC6": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_009_deep_lei",
    "timestamp": "2026-07-12T09:01:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Pilar Cortés",
      "level": "Colaboradores",
      "area": "RRHH",
      "country": "Nicaragua",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 2,
      "LD2": 2,
      "LD3": 2,
      "LD4": 3,
      "LD5": 3,
      "LD6": 3,
      "LD7": 2,
      "LD8": 3,
      "LD9": 3,
      "LD10": 1,
      "LD11": 1,
      "LD12": 1,
      "LD13": 3,
      "LD14": 3,
      "LD15": 5,
      "LD16": 1,
      "LD17": 2,
      "LD18": 1,
      "LD19": 2,
      "LD20": 1,
      "LD21": 2,
      "LD22": 3,
      "LD23": 2,
      "LD24": 3,
      "LD25": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_009_deep_tcs",
    "timestamp": "2026-07-12T09:01:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Pilar Cortés",
      "level": "Colaboradores",
      "area": "RRHH",
      "country": "Nicaragua",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 3,
      "LT2": 2,
      "LT3": 3,
      "LT4": 1,
      "LT5": 2,
      "LT6": 2,
      "LT7": 3,
      "LT8": 2,
      "LT9": 3,
      "LT10": 1,
      "LT11": 1,
      "LT12": 2,
      "LT13": 2,
      "LT14": 2,
      "LT15": 1,
      "LT16": 2,
      "LT17": 1,
      "LT18": 1,
      "LT19": 2,
      "LT20": 2,
      "LT21": 1,
      "LT22": 2,
      "LT23": 3,
      "LT24": 2,
      "LT25": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_009_deep_aci",
    "timestamp": "2026-07-12T09:01:39.745656",
    "survey": "deep_aci",
    "meta": {
      "name": "Pilar Cortés",
      "level": "Colaboradores",
      "area": "RRHH",
      "country": "Nicaragua",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CH1": 1,
      "CH2": 2,
      "CH3": 1,
      "CH4": 4,
      "CH5": 4,
      "CH6": 4,
      "CH7": 2,
      "CH8": 3,
      "CH9": 3,
      "CH10": 2,
      "CH11": 1,
      "CH12": 2,
      "CH13": 2,
      "CH14": 3,
      "CH15": 3,
      "CH16": 3,
      "CH17": 2,
      "CH18": 3,
      "CH19": 3,
      "CH20": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_009_deep_cei",
    "timestamp": "2026-07-12T09:01:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Pilar Cortés",
      "level": "Colaboradores",
      "area": "RRHH",
      "country": "Nicaragua",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 2,
      "CU2": 2,
      "CU3": 2,
      "CU4": 1,
      "CU5": 1,
      "CU6": 1,
      "CU7": 1,
      "CU8": 1,
      "CU9": 1,
      "CU10": 1,
      "CU11": 1,
      "CU12": 1,
      "CU13": 1,
      "CU14": 1,
      "CU15": 1,
      "CU16": 3,
      "CU17": 2,
      "CU18": 3,
      "CU19": 2,
      "CU20": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_010_core",
    "timestamp": "2026-07-17T03:18:39.745656",
    "survey": "core",
    "meta": {
      "name": "Javier Ríos",
      "level": "Colaboradores",
      "area": "Tecnología",
      "country": "Guatemala",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 3,
      "A2": 3,
      "A3": 2,
      "A4": 2,
      "A5": 4,
      "E1": 3,
      "E2": 5,
      "E3": 2,
      "E4": 4,
      "E5": 4,
      "E6": 3,
      "E7": 3,
      "L1": 3,
      "L2": 3,
      "L3": 2,
      "L4": 1,
      "L5": 2,
      "L6": 1,
      "R1": 2,
      "R2": 2,
      "R3": 2,
      "R4": 2,
      "C1": 2,
      "C2": 1,
      "C3": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_010_full",
    "timestamp": "2026-07-17T03:18:39.745656",
    "survey": "full",
    "meta": {
      "name": "Javier Ríos",
      "level": "Colaboradores",
      "area": "Tecnología",
      "country": "Guatemala",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 3,
      "A2": 3,
      "A3": 2,
      "A4": 2,
      "A5": 4,
      "E1": 3,
      "E2": 5,
      "E3": 2,
      "E4": 4,
      "E5": 4,
      "E6": 3,
      "E7": 3,
      "L1": 3,
      "L2": 3,
      "L3": 2,
      "L4": 1,
      "L5": 2,
      "L6": 1,
      "R1": 2,
      "R2": 2,
      "R3": 2,
      "R4": 2,
      "C1": 2,
      "C2": 1,
      "C3": 1,
      "SA6": 3,
      "SA7": 3,
      "SA8": 3,
      "SA9": 3,
      "SA10": 4,
      "SA11": 4,
      "SA12": 3,
      "EX8": 3,
      "EX9": 3,
      "EX10": 3,
      "EX11": 2,
      "EX12": 4,
      "EX13": 2,
      "EX14": 4,
      "EX15": 2,
      "EX16": 3,
      "EX17": 4,
      "EX18": 4,
      "LE7": 4,
      "LE8": 4,
      "LE9": 3,
      "LE10": 3,
      "LE11": 4,
      "LE12": 4,
      "LE13": 4,
      "LE14": 4,
      "LE15": 4,
      "RC5": 4,
      "RC6": 3,
      "RC7": 5,
      "RC8": 4,
      "RC9": 4,
      "OC4": 1,
      "OC5": 2,
      "OC6": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_010_deep_lei",
    "timestamp": "2026-07-17T03:48:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Javier Ríos",
      "level": "Colaboradores",
      "area": "Tecnología",
      "country": "Guatemala",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 1,
      "LD2": 1,
      "LD3": 1,
      "LD4": 3,
      "LD5": 3,
      "LD6": 2,
      "LD7": 1,
      "LD8": 1,
      "LD9": 1,
      "LD10": 3,
      "LD11": 2,
      "LD12": 3,
      "LD13": 2,
      "LD14": 2,
      "LD15": 2,
      "LD16": 2,
      "LD17": 2,
      "LD18": 3,
      "LD19": 1,
      "LD20": 1,
      "LD21": 1,
      "LD22": 3,
      "LD23": 3,
      "LD24": 2,
      "LD25": 4
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_010_deep_tcs",
    "timestamp": "2026-07-17T03:48:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Javier Ríos",
      "level": "Colaboradores",
      "area": "Tecnología",
      "country": "Guatemala",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 2,
      "LT2": 3,
      "LT3": 2,
      "LT4": 2,
      "LT5": 2,
      "LT6": 3,
      "LT7": 1,
      "LT8": 2,
      "LT9": 1,
      "LT10": 3,
      "LT11": 2,
      "LT12": 2,
      "LT13": 1,
      "LT14": 1,
      "LT15": 3,
      "LT16": 3,
      "LT17": 3,
      "LT18": 3,
      "LT19": 2,
      "LT20": 2,
      "LT21": 2,
      "LT22": 1,
      "LT23": 1,
      "LT24": 1,
      "LT25": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_010_deep_eci",
    "timestamp": "2026-07-17T03:48:39.745656",
    "survey": "deep_eci",
    "meta": {
      "name": "Javier Ríos",
      "level": "Colaboradores",
      "area": "Tecnología",
      "country": "Guatemala",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "EXD1": 3,
      "EXD2": 4,
      "EXD3": 3,
      "EXD4": 3,
      "EXD5": 3,
      "EXD6": 4,
      "EXD7": 4,
      "EXD8": 4,
      "EXD9": 4,
      "EXD10": 4,
      "EXD11": 4,
      "EXD12": 3,
      "EXD13": 3,
      "EXD14": 3,
      "EXD15": 3,
      "EXD16": 3,
      "EXD17": 4,
      "EXD18": 3,
      "EXD19": 3,
      "EXD20": 3,
      "EXD21": 4,
      "EXD22": 4,
      "EXD23": 3,
      "EXD24": 3,
      "EXD25": 5
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_010_deep_aci",
    "timestamp": "2026-07-17T03:48:39.745656",
    "survey": "deep_aci",
    "meta": {
      "name": "Javier Ríos",
      "level": "Colaboradores",
      "area": "Tecnología",
      "country": "Guatemala",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CH1": 3,
      "CH2": 3,
      "CH3": 3,
      "CH4": 3,
      "CH5": 4,
      "CH6": 3,
      "CH7": 3,
      "CH8": 2,
      "CH9": 3,
      "CH10": 1,
      "CH11": 1,
      "CH12": 1,
      "CH13": 2,
      "CH14": 2,
      "CH15": 2,
      "CH16": 2,
      "CH17": 4,
      "CH18": 3,
      "CH19": 3,
      "CH20": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_010_deep_cei",
    "timestamp": "2026-07-17T03:48:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Javier Ríos",
      "level": "Colaboradores",
      "area": "Tecnología",
      "country": "Guatemala",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 2,
      "CU2": 2,
      "CU3": 3,
      "CU4": 1,
      "CU5": 1,
      "CU6": 1,
      "CU7": 1,
      "CU8": 1,
      "CU9": 1,
      "CU10": 1,
      "CU11": 1,
      "CU12": 1,
      "CU13": 2,
      "CU14": 3,
      "CU15": 3,
      "CU16": 2,
      "CU17": 3,
      "CU18": 2,
      "CU19": 2,
      "CU20": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_011_core",
    "timestamp": "2026-07-21T13:24:39.745656",
    "survey": "core",
    "meta": {
      "name": "Norma Carrillo",
      "level": "Colaboradores",
      "area": "Finanzas",
      "country": "Nicaragua",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 3,
      "A2": 2,
      "A3": 3,
      "A4": 1,
      "A5": 1,
      "E1": 4,
      "E2": 5,
      "E3": 4,
      "E4": 5,
      "E5": 4,
      "E6": 4,
      "E7": 5,
      "L1": 2,
      "L2": 1,
      "L3": 4,
      "L4": 3,
      "L5": 3,
      "L6": 2,
      "R1": 2,
      "R2": 2,
      "R3": 1,
      "R4": 3,
      "C1": 2,
      "C2": 3,
      "C3": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_011_full",
    "timestamp": "2026-07-21T13:24:39.745656",
    "survey": "full",
    "meta": {
      "name": "Norma Carrillo",
      "level": "Colaboradores",
      "area": "Finanzas",
      "country": "Nicaragua",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 3,
      "A2": 2,
      "A3": 3,
      "A4": 1,
      "A5": 1,
      "E1": 4,
      "E2": 5,
      "E3": 4,
      "E4": 5,
      "E5": 4,
      "E6": 4,
      "E7": 5,
      "L1": 2,
      "L2": 1,
      "L3": 4,
      "L4": 3,
      "L5": 3,
      "L6": 2,
      "R1": 2,
      "R2": 2,
      "R3": 1,
      "R4": 3,
      "C1": 2,
      "C2": 3,
      "C3": 2,
      "SA6": 2,
      "SA7": 3,
      "SA8": 4,
      "SA9": 2,
      "SA10": 2,
      "SA11": 2,
      "SA12": 3,
      "EX8": 3,
      "EX9": 4,
      "EX10": 4,
      "EX11": 3,
      "EX12": 3,
      "EX13": 3,
      "EX14": 4,
      "EX15": 4,
      "EX16": 4,
      "EX17": 4,
      "EX18": 4,
      "LE7": 3,
      "LE8": 1,
      "LE9": 1,
      "LE10": 2,
      "LE11": 2,
      "LE12": 2,
      "LE13": 4,
      "LE14": 2,
      "LE15": 3,
      "RC5": 3,
      "RC6": 3,
      "RC7": 3,
      "RC8": 4,
      "RC9": 3,
      "OC4": 1,
      "OC5": 1,
      "OC6": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_011_deep_lei",
    "timestamp": "2026-07-21T13:54:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Norma Carrillo",
      "level": "Colaboradores",
      "area": "Finanzas",
      "country": "Nicaragua",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 2,
      "LD2": 1,
      "LD3": 1,
      "LD4": 2,
      "LD5": 1,
      "LD6": 1,
      "LD7": 3,
      "LD8": 3,
      "LD9": 3,
      "LD10": 1,
      "LD11": 1,
      "LD12": 1,
      "LD13": 2,
      "LD14": 3,
      "LD15": 3,
      "LD16": 2,
      "LD17": 1,
      "LD18": 1,
      "LD19": 1,
      "LD20": 1,
      "LD21": 1,
      "LD22": 1,
      "LD23": 1,
      "LD24": 1,
      "LD25": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_011_deep_tcs",
    "timestamp": "2026-07-21T13:54:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Norma Carrillo",
      "level": "Colaboradores",
      "area": "Finanzas",
      "country": "Nicaragua",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 2,
      "LT2": 2,
      "LT3": 2,
      "LT4": 2,
      "LT5": 3,
      "LT6": 3,
      "LT7": 1,
      "LT8": 1,
      "LT9": 1,
      "LT10": 1,
      "LT11": 1,
      "LT12": 1,
      "LT13": 2,
      "LT14": 2,
      "LT15": 3,
      "LT16": 2,
      "LT17": 2,
      "LT18": 3,
      "LT19": 2,
      "LT20": 2,
      "LT21": 3,
      "LT22": 3,
      "LT23": 3,
      "LT24": 2,
      "LT25": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_011_deep_aci",
    "timestamp": "2026-07-21T13:54:39.745656",
    "survey": "deep_aci",
    "meta": {
      "name": "Norma Carrillo",
      "level": "Colaboradores",
      "area": "Finanzas",
      "country": "Nicaragua",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CH1": 1,
      "CH2": 2,
      "CH3": 2,
      "CH4": 3,
      "CH5": 2,
      "CH6": 3,
      "CH7": 3,
      "CH8": 2,
      "CH9": 2,
      "CH10": 3,
      "CH11": 2,
      "CH12": 3,
      "CH13": 2,
      "CH14": 3,
      "CH15": 3,
      "CH16": 4,
      "CH17": 4,
      "CH18": 4,
      "CH19": 4,
      "CH20": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_011_deep_cei",
    "timestamp": "2026-07-21T13:54:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Norma Carrillo",
      "level": "Colaboradores",
      "area": "Finanzas",
      "country": "Nicaragua",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 2,
      "CU2": 2,
      "CU3": 3,
      "CU4": 3,
      "CU5": 2,
      "CU6": 2,
      "CU7": 1,
      "CU8": 1,
      "CU9": 2,
      "CU10": 1,
      "CU11": 1,
      "CU12": 1,
      "CU13": 1,
      "CU14": 1,
      "CU15": 1,
      "CU16": 2,
      "CU17": 1,
      "CU18": 2,
      "CU19": 2,
      "CU20": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_012_core",
    "timestamp": "2026-07-19T19:54:39.745656",
    "survey": "core",
    "meta": {
      "name": "Enrique Paredes",
      "level": "Colaboradores",
      "area": "Administración",
      "country": "Costa Rica",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 3,
      "A2": 3,
      "A3": 3,
      "A4": 4,
      "A5": 4,
      "E1": 3,
      "E2": 3,
      "E3": 5,
      "E4": 4,
      "E5": 4,
      "E6": 4,
      "E7": 4,
      "L1": 2,
      "L2": 2,
      "L3": 1,
      "L4": 2,
      "L5": 3,
      "L6": 2,
      "R1": 4,
      "R2": 3,
      "R3": 3,
      "R4": 4,
      "C1": 1,
      "C2": 2,
      "C3": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_012_full",
    "timestamp": "2026-07-19T19:54:39.745656",
    "survey": "full",
    "meta": {
      "name": "Enrique Paredes",
      "level": "Colaboradores",
      "area": "Administración",
      "country": "Costa Rica",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 3,
      "A2": 3,
      "A3": 3,
      "A4": 4,
      "A5": 4,
      "E1": 3,
      "E2": 3,
      "E3": 5,
      "E4": 4,
      "E5": 4,
      "E6": 4,
      "E7": 4,
      "L1": 2,
      "L2": 2,
      "L3": 1,
      "L4": 2,
      "L5": 3,
      "L6": 2,
      "R1": 4,
      "R2": 3,
      "R3": 3,
      "R4": 4,
      "C1": 1,
      "C2": 2,
      "C3": 1,
      "SA6": 2,
      "SA7": 2,
      "SA8": 4,
      "SA9": 2,
      "SA10": 3,
      "SA11": 2,
      "SA12": 2,
      "EX8": 3,
      "EX9": 4,
      "EX10": 4,
      "EX11": 4,
      "EX12": 3,
      "EX13": 4,
      "EX14": 2,
      "EX15": 4,
      "EX16": 3,
      "EX17": 4,
      "EX18": 5,
      "LE7": 4,
      "LE8": 3,
      "LE9": 2,
      "LE10": 4,
      "LE11": 3,
      "LE12": 4,
      "LE13": 4,
      "LE14": 4,
      "LE15": 4,
      "RC5": 1,
      "RC6": 2,
      "RC7": 1,
      "RC8": 1,
      "RC9": 1,
      "OC4": 3,
      "OC5": 3,
      "OC6": 4
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_012_deep_lei",
    "timestamp": "2026-07-19T20:24:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Enrique Paredes",
      "level": "Colaboradores",
      "area": "Administración",
      "country": "Costa Rica",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 1,
      "LD2": 1,
      "LD3": 2,
      "LD4": 2,
      "LD5": 3,
      "LD6": 3,
      "LD7": 1,
      "LD8": 1,
      "LD9": 2,
      "LD10": 2,
      "LD11": 2,
      "LD12": 3,
      "LD13": 3,
      "LD14": 2,
      "LD15": 1,
      "LD16": 1,
      "LD17": 2,
      "LD18": 1,
      "LD19": 1,
      "LD20": 1,
      "LD21": 1,
      "LD22": 2,
      "LD23": 2,
      "LD24": 2,
      "LD25": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_012_deep_tcs",
    "timestamp": "2026-07-19T20:24:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Enrique Paredes",
      "level": "Colaboradores",
      "area": "Administración",
      "country": "Costa Rica",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 2,
      "LT2": 2,
      "LT3": 2,
      "LT4": 2,
      "LT5": 2,
      "LT6": 3,
      "LT7": 4,
      "LT8": 4,
      "LT9": 4,
      "LT10": 3,
      "LT11": 1,
      "LT12": 2,
      "LT13": 3,
      "LT14": 2,
      "LT15": 2,
      "LT16": 3,
      "LT17": 2,
      "LT18": 2,
      "LT19": 3,
      "LT20": 2,
      "LT21": 3,
      "LT22": 2,
      "LT23": 3,
      "LT24": 2,
      "LT25": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_012_deep_aci",
    "timestamp": "2026-07-19T20:24:39.745656",
    "survey": "deep_aci",
    "meta": {
      "name": "Enrique Paredes",
      "level": "Colaboradores",
      "area": "Administración",
      "country": "Costa Rica",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CH1": 1,
      "CH2": 2,
      "CH3": 1,
      "CH4": 3,
      "CH5": 4,
      "CH6": 4,
      "CH7": 3,
      "CH8": 4,
      "CH9": 3,
      "CH10": 4,
      "CH11": 4,
      "CH12": 4,
      "CH13": 4,
      "CH14": 4,
      "CH15": 3,
      "CH16": 3,
      "CH17": 2,
      "CH18": 3,
      "CH19": 2,
      "CH20": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_012_deep_cei",
    "timestamp": "2026-07-19T20:24:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Enrique Paredes",
      "level": "Colaboradores",
      "area": "Administración",
      "country": "Costa Rica",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 2,
      "CU2": 3,
      "CU3": 3,
      "CU4": 1,
      "CU5": 1,
      "CU6": 2,
      "CU7": 1,
      "CU8": 1,
      "CU9": 1,
      "CU10": 1,
      "CU11": 1,
      "CU12": 2,
      "CU13": 3,
      "CU14": 4,
      "CU15": 2,
      "CU16": 2,
      "CU17": 1,
      "CU18": 1,
      "CU19": 1,
      "CU20": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_013_core",
    "timestamp": "2026-07-12T02:19:39.745656",
    "survey": "core",
    "meta": {
      "name": "Liliana Barrera",
      "level": "Colaboradores",
      "area": "Distribución",
      "country": "Costa Rica",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 3,
      "A2": 3,
      "A3": 3,
      "A4": 3,
      "A5": 3,
      "E1": 4,
      "E2": 5,
      "E3": 2,
      "E4": 4,
      "E5": 4,
      "E6": 3,
      "E7": 2,
      "L1": 5,
      "L2": 4,
      "L3": 5,
      "L4": 5,
      "L5": 3,
      "L6": 4,
      "R1": 2,
      "R2": 3,
      "R3": 1,
      "R4": 2,
      "C1": 3,
      "C2": 2,
      "C3": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_013_full",
    "timestamp": "2026-07-12T02:19:39.745656",
    "survey": "full",
    "meta": {
      "name": "Liliana Barrera",
      "level": "Colaboradores",
      "area": "Distribución",
      "country": "Costa Rica",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 3,
      "A2": 3,
      "A3": 3,
      "A4": 3,
      "A5": 3,
      "E1": 4,
      "E2": 5,
      "E3": 2,
      "E4": 4,
      "E5": 4,
      "E6": 3,
      "E7": 2,
      "L1": 5,
      "L2": 4,
      "L3": 5,
      "L4": 5,
      "L5": 3,
      "L6": 4,
      "R1": 2,
      "R2": 3,
      "R3": 1,
      "R4": 2,
      "C1": 3,
      "C2": 2,
      "C3": 3,
      "SA6": 4,
      "SA7": 2,
      "SA8": 4,
      "SA9": 3,
      "SA10": 3,
      "SA11": 4,
      "SA12": 3,
      "EX8": 3,
      "EX9": 3,
      "EX10": 3,
      "EX11": 3,
      "EX12": 2,
      "EX13": 3,
      "EX14": 3,
      "EX15": 2,
      "EX16": 3,
      "EX17": 3,
      "EX18": 3,
      "LE7": 2,
      "LE8": 2,
      "LE9": 2,
      "LE10": 3,
      "LE11": 3,
      "LE12": 3,
      "LE13": 2,
      "LE14": 3,
      "LE15": 3,
      "RC5": 2,
      "RC6": 2,
      "RC7": 3,
      "RC8": 1,
      "RC9": 2,
      "OC4": 4,
      "OC5": 5,
      "OC6": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_013_deep_lei",
    "timestamp": "2026-07-12T02:49:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Liliana Barrera",
      "level": "Colaboradores",
      "area": "Distribución",
      "country": "Costa Rica",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 2,
      "LD2": 2,
      "LD3": 2,
      "LD4": 2,
      "LD5": 3,
      "LD6": 2,
      "LD7": 1,
      "LD8": 1,
      "LD9": 1,
      "LD10": 1,
      "LD11": 1,
      "LD12": 2,
      "LD13": 3,
      "LD14": 3,
      "LD15": 3,
      "LD16": 1,
      "LD17": 1,
      "LD18": 1,
      "LD19": 3,
      "LD20": 3,
      "LD21": 3,
      "LD22": 2,
      "LD23": 2,
      "LD24": 2,
      "LD25": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_013_deep_tcs",
    "timestamp": "2026-07-12T02:49:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Liliana Barrera",
      "level": "Colaboradores",
      "area": "Distribución",
      "country": "Costa Rica",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 2,
      "LT2": 3,
      "LT3": 2,
      "LT4": 2,
      "LT5": 3,
      "LT6": 2,
      "LT7": 1,
      "LT8": 1,
      "LT9": 1,
      "LT10": 1,
      "LT11": 1,
      "LT12": 1,
      "LT13": 2,
      "LT14": 2,
      "LT15": 2,
      "LT16": 1,
      "LT17": 1,
      "LT18": 2,
      "LT19": 2,
      "LT20": 3,
      "LT21": 3,
      "LT22": 2,
      "LT23": 2,
      "LT24": 2,
      "LT25": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_013_deep_eci",
    "timestamp": "2026-07-12T02:49:39.745656",
    "survey": "deep_eci",
    "meta": {
      "name": "Liliana Barrera",
      "level": "Colaboradores",
      "area": "Distribución",
      "country": "Costa Rica",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "EXD1": 5,
      "EXD2": 4,
      "EXD3": 4,
      "EXD4": 3,
      "EXD5": 3,
      "EXD6": 3,
      "EXD7": 4,
      "EXD8": 3,
      "EXD9": 4,
      "EXD10": 5,
      "EXD11": 5,
      "EXD12": 5,
      "EXD13": 3,
      "EXD14": 4,
      "EXD15": 4,
      "EXD16": 4,
      "EXD17": 4,
      "EXD18": 4,
      "EXD19": 4,
      "EXD20": 4,
      "EXD21": 3,
      "EXD22": 4,
      "EXD23": 4,
      "EXD24": 4,
      "EXD25": 4
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_013_deep_aci",
    "timestamp": "2026-07-12T02:49:39.745656",
    "survey": "deep_aci",
    "meta": {
      "name": "Liliana Barrera",
      "level": "Colaboradores",
      "area": "Distribución",
      "country": "Costa Rica",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CH1": 3,
      "CH2": 2,
      "CH3": 1,
      "CH4": 4,
      "CH5": 4,
      "CH6": 4,
      "CH7": 3,
      "CH8": 4,
      "CH9": 3,
      "CH10": 3,
      "CH11": 4,
      "CH12": 3,
      "CH13": 1,
      "CH14": 1,
      "CH15": 1,
      "CH16": 3,
      "CH17": 3,
      "CH18": 3,
      "CH19": 3,
      "CH20": 5
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_013_deep_cei",
    "timestamp": "2026-07-12T02:49:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Liliana Barrera",
      "level": "Colaboradores",
      "area": "Distribución",
      "country": "Costa Rica",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 2,
      "CU2": 1,
      "CU3": 2,
      "CU4": 2,
      "CU5": 1,
      "CU6": 3,
      "CU7": 3,
      "CU8": 2,
      "CU9": 3,
      "CU10": 1,
      "CU11": 1,
      "CU12": 1,
      "CU13": 1,
      "CU14": 2,
      "CU15": 1,
      "CU16": 1,
      "CU17": 3,
      "CU18": 2,
      "CU19": 1,
      "CU20": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_014_core",
    "timestamp": "2026-07-20T00:02:39.745656",
    "survey": "core",
    "meta": {
      "name": "Víctor Montes",
      "level": "Colaboradores",
      "area": "Almacenamiento",
      "country": "Nicaragua",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 2,
      "A2": 2,
      "A3": 2,
      "A4": 3,
      "A5": 1,
      "E1": 3,
      "E2": 3,
      "E3": 3,
      "E4": 2,
      "E5": 3,
      "E6": 3,
      "E7": 3,
      "L1": 3,
      "L2": 3,
      "L3": 1,
      "L4": 4,
      "L5": 2,
      "L6": 3,
      "R1": 2,
      "R2": 3,
      "R3": 3,
      "R4": 3,
      "C1": 1,
      "C2": 2,
      "C3": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_014_full",
    "timestamp": "2026-07-20T00:02:39.745656",
    "survey": "full",
    "meta": {
      "name": "Víctor Montes",
      "level": "Colaboradores",
      "area": "Almacenamiento",
      "country": "Nicaragua",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 2,
      "A2": 2,
      "A3": 2,
      "A4": 3,
      "A5": 1,
      "E1": 3,
      "E2": 3,
      "E3": 3,
      "E4": 2,
      "E5": 3,
      "E6": 3,
      "E7": 3,
      "L1": 3,
      "L2": 3,
      "L3": 1,
      "L4": 4,
      "L5": 2,
      "L6": 3,
      "R1": 2,
      "R2": 3,
      "R3": 3,
      "R4": 3,
      "C1": 1,
      "C2": 2,
      "C3": 2,
      "SA6": 3,
      "SA7": 2,
      "SA8": 2,
      "SA9": 1,
      "SA10": 3,
      "SA11": 3,
      "SA12": 3,
      "EX8": 2,
      "EX9": 3,
      "EX10": 2,
      "EX11": 2,
      "EX12": 4,
      "EX13": 4,
      "EX14": 3,
      "EX15": 2,
      "EX16": 1,
      "EX17": 1,
      "EX18": 4,
      "LE7": 2,
      "LE8": 3,
      "LE9": 2,
      "LE10": 3,
      "LE11": 3,
      "LE12": 2,
      "LE13": 2,
      "LE14": 3,
      "LE15": 3,
      "RC5": 5,
      "RC6": 3,
      "RC7": 5,
      "RC8": 5,
      "RC9": 4,
      "OC4": 1,
      "OC5": 1,
      "OC6": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_014_deep_lei",
    "timestamp": "2026-07-20T00:32:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Víctor Montes",
      "level": "Colaboradores",
      "area": "Almacenamiento",
      "country": "Nicaragua",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 1,
      "LD2": 2,
      "LD3": 3,
      "LD4": 2,
      "LD5": 3,
      "LD6": 3,
      "LD7": 2,
      "LD8": 1,
      "LD9": 1,
      "LD10": 3,
      "LD11": 3,
      "LD12": 3,
      "LD13": 1,
      "LD14": 1,
      "LD15": 1,
      "LD16": 2,
      "LD17": 2,
      "LD18": 2,
      "LD19": 2,
      "LD20": 3,
      "LD21": 3,
      "LD22": 3,
      "LD23": 1,
      "LD24": 2,
      "LD25": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_014_deep_tcs",
    "timestamp": "2026-07-20T00:32:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Víctor Montes",
      "level": "Colaboradores",
      "area": "Almacenamiento",
      "country": "Nicaragua",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 2,
      "LT2": 2,
      "LT3": 3,
      "LT4": 2,
      "LT5": 3,
      "LT6": 1,
      "LT7": 1,
      "LT8": 1,
      "LT9": 1,
      "LT10": 3,
      "LT11": 3,
      "LT12": 2,
      "LT13": 1,
      "LT14": 2,
      "LT15": 2,
      "LT16": 4,
      "LT17": 3,
      "LT18": 3,
      "LT19": 2,
      "LT20": 2,
      "LT21": 1,
      "LT22": 2,
      "LT23": 2,
      "LT24": 2,
      "LT25": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_014_deep_eci",
    "timestamp": "2026-07-20T00:32:39.745656",
    "survey": "deep_eci",
    "meta": {
      "name": "Víctor Montes",
      "level": "Colaboradores",
      "area": "Almacenamiento",
      "country": "Nicaragua",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "EXD1": 2,
      "EXD2": 3,
      "EXD3": 2,
      "EXD4": 3,
      "EXD5": 4,
      "EXD6": 4,
      "EXD7": 3,
      "EXD8": 2,
      "EXD9": 4,
      "EXD10": 2,
      "EXD11": 4,
      "EXD12": 2,
      "EXD13": 3,
      "EXD14": 2,
      "EXD15": 2,
      "EXD16": 2,
      "EXD17": 4,
      "EXD18": 3,
      "EXD19": 3,
      "EXD20": 4,
      "EXD21": 3,
      "EXD22": 3,
      "EXD23": 4,
      "EXD24": 4,
      "EXD25": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_014_deep_cei",
    "timestamp": "2026-07-20T00:32:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Víctor Montes",
      "level": "Colaboradores",
      "area": "Almacenamiento",
      "country": "Nicaragua",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 2,
      "CU2": 2,
      "CU3": 2,
      "CU4": 2,
      "CU5": 2,
      "CU6": 2,
      "CU7": 1,
      "CU8": 1,
      "CU9": 1,
      "CU10": 1,
      "CU11": 1,
      "CU12": 2,
      "CU13": 2,
      "CU14": 2,
      "CU15": 1,
      "CU16": 2,
      "CU17": 1,
      "CU18": 1,
      "CU19": 2,
      "CU20": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_015_core",
    "timestamp": "2026-07-19T03:53:39.745656",
    "survey": "core",
    "meta": {
      "name": "Elena Fuentes",
      "level": "Colaboradores",
      "area": "Comercial",
      "country": "Costa Rica",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 3,
      "A2": 3,
      "A3": 4,
      "A4": 2,
      "A5": 2,
      "E1": 3,
      "E2": 4,
      "E3": 2,
      "E4": 4,
      "E5": 3,
      "E6": 3,
      "E7": 3,
      "L1": 3,
      "L2": 2,
      "L3": 2,
      "L4": 2,
      "L5": 2,
      "L6": 2,
      "R1": 2,
      "R2": 1,
      "R3": 2,
      "R4": 2,
      "C1": 1,
      "C2": 1,
      "C3": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_015_full",
    "timestamp": "2026-07-19T03:53:39.745656",
    "survey": "full",
    "meta": {
      "name": "Elena Fuentes",
      "level": "Colaboradores",
      "area": "Comercial",
      "country": "Costa Rica",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 3,
      "A2": 3,
      "A3": 4,
      "A4": 2,
      "A5": 2,
      "E1": 3,
      "E2": 4,
      "E3": 2,
      "E4": 4,
      "E5": 3,
      "E6": 3,
      "E7": 3,
      "L1": 3,
      "L2": 2,
      "L3": 2,
      "L4": 2,
      "L5": 2,
      "L6": 2,
      "R1": 2,
      "R2": 1,
      "R3": 2,
      "R4": 2,
      "C1": 1,
      "C2": 1,
      "C3": 1,
      "SA6": 2,
      "SA7": 3,
      "SA8": 2,
      "SA9": 2,
      "SA10": 2,
      "SA11": 3,
      "SA12": 2,
      "EX8": 5,
      "EX9": 4,
      "EX10": 4,
      "EX11": 3,
      "EX12": 5,
      "EX13": 4,
      "EX14": 5,
      "EX15": 4,
      "EX16": 4,
      "EX17": 4,
      "EX18": 4,
      "LE7": 1,
      "LE8": 1,
      "LE9": 1,
      "LE10": 1,
      "LE11": 1,
      "LE12": 1,
      "LE13": 1,
      "LE14": 1,
      "LE15": 1,
      "RC5": 3,
      "RC6": 3,
      "RC7": 2,
      "RC8": 2,
      "RC9": 3,
      "OC4": 2,
      "OC5": 2,
      "OC6": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_015_deep_lei",
    "timestamp": "2026-07-19T04:23:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Elena Fuentes",
      "level": "Colaboradores",
      "area": "Comercial",
      "country": "Costa Rica",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 1,
      "LD2": 2,
      "LD3": 1,
      "LD4": 2,
      "LD5": 2,
      "LD6": 3,
      "LD7": 3,
      "LD8": 4,
      "LD9": 4,
      "LD10": 1,
      "LD11": 2,
      "LD12": 2,
      "LD13": 1,
      "LD14": 1,
      "LD15": 1,
      "LD16": 1,
      "LD17": 1,
      "LD18": 1,
      "LD19": 1,
      "LD20": 1,
      "LD21": 1,
      "LD22": 5,
      "LD23": 3,
      "LD24": 4,
      "LD25": 4
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_015_deep_tcs",
    "timestamp": "2026-07-19T04:23:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Elena Fuentes",
      "level": "Colaboradores",
      "area": "Comercial",
      "country": "Costa Rica",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 2,
      "LT2": 2,
      "LT3": 2,
      "LT4": 3,
      "LT5": 3,
      "LT6": 4,
      "LT7": 3,
      "LT8": 2,
      "LT9": 2,
      "LT10": 1,
      "LT11": 1,
      "LT12": 1,
      "LT13": 1,
      "LT14": 1,
      "LT15": 1,
      "LT16": 2,
      "LT17": 2,
      "LT18": 2,
      "LT19": 2,
      "LT20": 2,
      "LT21": 2,
      "LT22": 3,
      "LT23": 2,
      "LT24": 3,
      "LT25": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_015_deep_aci",
    "timestamp": "2026-07-19T04:23:39.745656",
    "survey": "deep_aci",
    "meta": {
      "name": "Elena Fuentes",
      "level": "Colaboradores",
      "area": "Comercial",
      "country": "Costa Rica",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CH1": 4,
      "CH2": 3,
      "CH3": 4,
      "CH4": 3,
      "CH5": 2,
      "CH6": 2,
      "CH7": 3,
      "CH8": 3,
      "CH9": 4,
      "CH10": 2,
      "CH11": 2,
      "CH12": 2,
      "CH13": 2,
      "CH14": 1,
      "CH15": 1,
      "CH16": 1,
      "CH17": 2,
      "CH18": 2,
      "CH19": 2,
      "CH20": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_015_deep_cei",
    "timestamp": "2026-07-19T04:23:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Elena Fuentes",
      "level": "Colaboradores",
      "area": "Comercial",
      "country": "Costa Rica",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 1,
      "CU2": 2,
      "CU3": 2,
      "CU4": 4,
      "CU5": 3,
      "CU6": 3,
      "CU7": 1,
      "CU8": 2,
      "CU9": 1,
      "CU10": 2,
      "CU11": 3,
      "CU12": 2,
      "CU13": 2,
      "CU14": 2,
      "CU15": 3,
      "CU16": 1,
      "CU17": 1,
      "CU18": 2,
      "CU19": 2,
      "CU20": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_016_core",
    "timestamp": "2026-07-22T12:01:39.745656",
    "survey": "core",
    "meta": {
      "name": "Jorge Contreras",
      "level": "Colaboradores",
      "area": "Tecnología",
      "country": "Guatemala",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 1,
      "A2": 2,
      "A3": 1,
      "A4": 1,
      "A5": 1,
      "E1": 2,
      "E2": 3,
      "E3": 2,
      "E4": 2,
      "E5": 2,
      "E6": 3,
      "E7": 2,
      "L1": 4,
      "L2": 2,
      "L3": 3,
      "L4": 3,
      "L5": 3,
      "L6": 3,
      "R1": 3,
      "R2": 3,
      "R3": 2,
      "R4": 2,
      "C1": 3,
      "C2": 2,
      "C3": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_016_full",
    "timestamp": "2026-07-22T12:01:39.745656",
    "survey": "full",
    "meta": {
      "name": "Jorge Contreras",
      "level": "Colaboradores",
      "area": "Tecnología",
      "country": "Guatemala",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 1,
      "A2": 2,
      "A3": 1,
      "A4": 1,
      "A5": 1,
      "E1": 2,
      "E2": 3,
      "E3": 2,
      "E4": 2,
      "E5": 2,
      "E6": 3,
      "E7": 2,
      "L1": 4,
      "L2": 2,
      "L3": 3,
      "L4": 3,
      "L5": 3,
      "L6": 3,
      "R1": 3,
      "R2": 3,
      "R3": 2,
      "R4": 2,
      "C1": 3,
      "C2": 2,
      "C3": 1,
      "SA6": 3,
      "SA7": 2,
      "SA8": 3,
      "SA9": 1,
      "SA10": 2,
      "SA11": 3,
      "SA12": 2,
      "EX8": 3,
      "EX9": 3,
      "EX10": 4,
      "EX11": 4,
      "EX12": 3,
      "EX13": 3,
      "EX14": 3,
      "EX15": 4,
      "EX16": 3,
      "EX17": 3,
      "EX18": 5,
      "LE7": 2,
      "LE8": 3,
      "LE9": 3,
      "LE10": 3,
      "LE11": 1,
      "LE12": 4,
      "LE13": 4,
      "LE14": 3,
      "LE15": 3,
      "RC5": 3,
      "RC6": 3,
      "RC7": 3,
      "RC8": 3,
      "RC9": 3,
      "OC4": 1,
      "OC5": 1,
      "OC6": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_016_deep_lei",
    "timestamp": "2026-07-22T12:31:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Jorge Contreras",
      "level": "Colaboradores",
      "area": "Tecnología",
      "country": "Guatemala",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 1,
      "LD2": 1,
      "LD3": 2,
      "LD4": 2,
      "LD5": 1,
      "LD6": 1,
      "LD7": 2,
      "LD8": 4,
      "LD9": 3,
      "LD10": 1,
      "LD11": 1,
      "LD12": 1,
      "LD13": 2,
      "LD14": 2,
      "LD15": 2,
      "LD16": 2,
      "LD17": 2,
      "LD18": 2,
      "LD19": 1,
      "LD20": 1,
      "LD21": 2,
      "LD22": 4,
      "LD23": 4,
      "LD24": 4,
      "LD25": 4
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_016_deep_tcs",
    "timestamp": "2026-07-22T12:31:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Jorge Contreras",
      "level": "Colaboradores",
      "area": "Tecnología",
      "country": "Guatemala",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 1,
      "LT2": 2,
      "LT3": 2,
      "LT4": 2,
      "LT5": 2,
      "LT6": 2,
      "LT7": 4,
      "LT8": 4,
      "LT9": 4,
      "LT10": 4,
      "LT11": 3,
      "LT12": 3,
      "LT13": 4,
      "LT14": 3,
      "LT15": 4,
      "LT16": 1,
      "LT17": 1,
      "LT18": 1,
      "LT19": 3,
      "LT20": 1,
      "LT21": 2,
      "LT22": 3,
      "LT23": 2,
      "LT24": 2,
      "LT25": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_016_deep_eci",
    "timestamp": "2026-07-22T12:31:39.745656",
    "survey": "deep_eci",
    "meta": {
      "name": "Jorge Contreras",
      "level": "Colaboradores",
      "area": "Tecnología",
      "country": "Guatemala",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "EXD1": 3,
      "EXD2": 3,
      "EXD3": 4,
      "EXD4": 4,
      "EXD5": 4,
      "EXD6": 4,
      "EXD7": 1,
      "EXD8": 2,
      "EXD9": 2,
      "EXD10": 5,
      "EXD11": 5,
      "EXD12": 4,
      "EXD13": 2,
      "EXD14": 2,
      "EXD15": 2,
      "EXD16": 2,
      "EXD17": 1,
      "EXD18": 2,
      "EXD19": 3,
      "EXD20": 3,
      "EXD21": 3,
      "EXD22": 3,
      "EXD23": 3,
      "EXD24": 3,
      "EXD25": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_016_deep_aci",
    "timestamp": "2026-07-22T12:31:39.745656",
    "survey": "deep_aci",
    "meta": {
      "name": "Jorge Contreras",
      "level": "Colaboradores",
      "area": "Tecnología",
      "country": "Guatemala",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CH1": 4,
      "CH2": 4,
      "CH3": 4,
      "CH4": 2,
      "CH5": 3,
      "CH6": 2,
      "CH7": 3,
      "CH8": 3,
      "CH9": 3,
      "CH10": 3,
      "CH11": 3,
      "CH12": 3,
      "CH13": 4,
      "CH14": 3,
      "CH15": 4,
      "CH16": 2,
      "CH17": 2,
      "CH18": 2,
      "CH19": 2,
      "CH20": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_016_deep_cei",
    "timestamp": "2026-07-22T12:31:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Jorge Contreras",
      "level": "Colaboradores",
      "area": "Tecnología",
      "country": "Guatemala",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 1,
      "CU2": 1,
      "CU3": 1,
      "CU4": 2,
      "CU5": 2,
      "CU6": 1,
      "CU7": 2,
      "CU8": 3,
      "CU9": 3,
      "CU10": 4,
      "CU11": 4,
      "CU12": 3,
      "CU13": 1,
      "CU14": 1,
      "CU15": 1,
      "CU16": 2,
      "CU17": 3,
      "CU18": 3,
      "CU19": 3,
      "CU20": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_017_core",
    "timestamp": "2026-07-21T15:07:39.745656",
    "survey": "core",
    "meta": {
      "name": "Mariana Ávalos",
      "level": "Colaboradores",
      "area": "Calidad",
      "country": "Guatemala",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 1,
      "A2": 3,
      "A3": 2,
      "A4": 2,
      "A5": 2,
      "E1": 3,
      "E2": 2,
      "E3": 4,
      "E4": 3,
      "E5": 3,
      "E6": 3,
      "E7": 3,
      "L1": 2,
      "L2": 2,
      "L3": 3,
      "L4": 3,
      "L5": 2,
      "L6": 3,
      "R1": 3,
      "R2": 2,
      "R3": 2,
      "R4": 3,
      "C1": 1,
      "C2": 2,
      "C3": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_017_full",
    "timestamp": "2026-07-21T15:07:39.745656",
    "survey": "full",
    "meta": {
      "name": "Mariana Ávalos",
      "level": "Colaboradores",
      "area": "Calidad",
      "country": "Guatemala",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 1,
      "A2": 3,
      "A3": 2,
      "A4": 2,
      "A5": 2,
      "E1": 3,
      "E2": 2,
      "E3": 4,
      "E4": 3,
      "E5": 3,
      "E6": 3,
      "E7": 3,
      "L1": 2,
      "L2": 2,
      "L3": 3,
      "L4": 3,
      "L5": 2,
      "L6": 3,
      "R1": 3,
      "R2": 2,
      "R3": 2,
      "R4": 3,
      "C1": 1,
      "C2": 2,
      "C3": 2,
      "SA6": 3,
      "SA7": 2,
      "SA8": 2,
      "SA9": 2,
      "SA10": 3,
      "SA11": 3,
      "SA12": 2,
      "EX8": 3,
      "EX9": 4,
      "EX10": 4,
      "EX11": 3,
      "EX12": 3,
      "EX13": 4,
      "EX14": 4,
      "EX15": 3,
      "EX16": 5,
      "EX17": 4,
      "EX18": 4,
      "LE7": 1,
      "LE8": 1,
      "LE9": 1,
      "LE10": 1,
      "LE11": 1,
      "LE12": 1,
      "LE13": 1,
      "LE14": 1,
      "LE15": 1,
      "RC5": 2,
      "RC6": 1,
      "RC7": 2,
      "RC8": 1,
      "RC9": 2,
      "OC4": 4,
      "OC5": 2,
      "OC6": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_017_deep_lei",
    "timestamp": "2026-07-21T15:37:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Mariana Ávalos",
      "level": "Colaboradores",
      "area": "Calidad",
      "country": "Guatemala",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 4,
      "LD2": 3,
      "LD3": 3,
      "LD4": 3,
      "LD5": 3,
      "LD6": 2,
      "LD7": 2,
      "LD8": 3,
      "LD9": 3,
      "LD10": 2,
      "LD11": 1,
      "LD12": 2,
      "LD13": 2,
      "LD14": 3,
      "LD15": 2,
      "LD16": 1,
      "LD17": 1,
      "LD18": 1,
      "LD19": 1,
      "LD20": 1,
      "LD21": 1,
      "LD22": 4,
      "LD23": 4,
      "LD24": 4,
      "LD25": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_017_deep_tcs",
    "timestamp": "2026-07-21T15:37:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Mariana Ávalos",
      "level": "Colaboradores",
      "area": "Calidad",
      "country": "Guatemala",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 1,
      "LT2": 2,
      "LT3": 2,
      "LT4": 1,
      "LT5": 1,
      "LT6": 1,
      "LT7": 1,
      "LT8": 1,
      "LT9": 1,
      "LT10": 2,
      "LT11": 3,
      "LT12": 1,
      "LT13": 1,
      "LT14": 2,
      "LT15": 2,
      "LT16": 1,
      "LT17": 1,
      "LT18": 1,
      "LT19": 2,
      "LT20": 2,
      "LT21": 2,
      "LT22": 3,
      "LT23": 3,
      "LT24": 4,
      "LT25": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_017_deep_eci",
    "timestamp": "2026-07-21T15:37:39.745656",
    "survey": "deep_eci",
    "meta": {
      "name": "Mariana Ávalos",
      "level": "Colaboradores",
      "area": "Calidad",
      "country": "Guatemala",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "EXD1": 3,
      "EXD2": 3,
      "EXD3": 3,
      "EXD4": 4,
      "EXD5": 4,
      "EXD6": 4,
      "EXD7": 4,
      "EXD8": 4,
      "EXD9": 3,
      "EXD10": 3,
      "EXD11": 4,
      "EXD12": 3,
      "EXD13": 3,
      "EXD14": 3,
      "EXD15": 4,
      "EXD16": 2,
      "EXD17": 3,
      "EXD18": 2,
      "EXD19": 3,
      "EXD20": 5,
      "EXD21": 5,
      "EXD22": 3,
      "EXD23": 4,
      "EXD24": 3,
      "EXD25": 4
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_017_deep_aci",
    "timestamp": "2026-07-21T15:37:39.745656",
    "survey": "deep_aci",
    "meta": {
      "name": "Mariana Ávalos",
      "level": "Colaboradores",
      "area": "Calidad",
      "country": "Guatemala",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CH1": 3,
      "CH2": 4,
      "CH3": 4,
      "CH4": 2,
      "CH5": 3,
      "CH6": 3,
      "CH7": 4,
      "CH8": 3,
      "CH9": 4,
      "CH10": 2,
      "CH11": 2,
      "CH12": 3,
      "CH13": 2,
      "CH14": 3,
      "CH15": 3,
      "CH16": 3,
      "CH17": 3,
      "CH18": 3,
      "CH19": 3,
      "CH20": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_017_deep_cei",
    "timestamp": "2026-07-21T15:37:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Mariana Ávalos",
      "level": "Colaboradores",
      "area": "Calidad",
      "country": "Guatemala",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 1,
      "CU2": 2,
      "CU3": 2,
      "CU4": 1,
      "CU5": 1,
      "CU6": 2,
      "CU7": 3,
      "CU8": 3,
      "CU9": 4,
      "CU10": 2,
      "CU11": 2,
      "CU12": 2,
      "CU13": 3,
      "CU14": 3,
      "CU15": 4,
      "CU16": 1,
      "CU17": 1,
      "CU18": 2,
      "CU19": 2,
      "CU20": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_018_core",
    "timestamp": "2026-07-12T06:24:39.745656",
    "survey": "core",
    "meta": {
      "name": "Alfredo Ponce",
      "level": "Colaboradores",
      "area": "Comercial",
      "country": "Costa Rica",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 4,
      "A2": 3,
      "A3": 2,
      "A4": 4,
      "A5": 4,
      "E1": 4,
      "E2": 3,
      "E3": 4,
      "E4": 4,
      "E5": 4,
      "E6": 5,
      "E7": 4,
      "L1": 4,
      "L2": 4,
      "L3": 5,
      "L4": 3,
      "L5": 4,
      "L6": 4,
      "R1": 4,
      "R2": 4,
      "R3": 4,
      "R4": 4,
      "C1": 3,
      "C2": 3,
      "C3": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_018_full",
    "timestamp": "2026-07-12T06:24:39.745656",
    "survey": "full",
    "meta": {
      "name": "Alfredo Ponce",
      "level": "Colaboradores",
      "area": "Comercial",
      "country": "Costa Rica",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 4,
      "A2": 3,
      "A3": 2,
      "A4": 4,
      "A5": 4,
      "E1": 4,
      "E2": 3,
      "E3": 4,
      "E4": 4,
      "E5": 4,
      "E6": 5,
      "E7": 4,
      "L1": 4,
      "L2": 4,
      "L3": 5,
      "L4": 3,
      "L5": 4,
      "L6": 4,
      "R1": 4,
      "R2": 4,
      "R3": 4,
      "R4": 4,
      "C1": 3,
      "C2": 3,
      "C3": 2,
      "SA6": 3,
      "SA7": 3,
      "SA8": 2,
      "SA9": 3,
      "SA10": 3,
      "SA11": 2,
      "SA12": 2,
      "EX8": 2,
      "EX9": 2,
      "EX10": 2,
      "EX11": 2,
      "EX12": 3,
      "EX13": 2,
      "EX14": 2,
      "EX15": 2,
      "EX16": 2,
      "EX17": 2,
      "EX18": 4,
      "LE7": 4,
      "LE8": 2,
      "LE9": 3,
      "LE10": 4,
      "LE11": 4,
      "LE12": 2,
      "LE13": 4,
      "LE14": 3,
      "LE15": 3,
      "RC5": 1,
      "RC6": 1,
      "RC7": 1,
      "RC8": 1,
      "RC9": 1,
      "OC4": 1,
      "OC5": 2,
      "OC6": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_018_deep_eci",
    "timestamp": "2026-07-12T06:54:39.745656",
    "survey": "deep_eci",
    "meta": {
      "name": "Alfredo Ponce",
      "level": "Colaboradores",
      "area": "Comercial",
      "country": "Costa Rica",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "EXD1": 2,
      "EXD2": 2,
      "EXD3": 2,
      "EXD4": 3,
      "EXD5": 3,
      "EXD6": 4,
      "EXD7": 4,
      "EXD8": 4,
      "EXD9": 4,
      "EXD10": 4,
      "EXD11": 3,
      "EXD12": 4,
      "EXD13": 4,
      "EXD14": 4,
      "EXD15": 3,
      "EXD16": 5,
      "EXD17": 5,
      "EXD18": 5,
      "EXD19": 5,
      "EXD20": 3,
      "EXD21": 4,
      "EXD22": 2,
      "EXD23": 2,
      "EXD24": 2,
      "EXD25": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_018_deep_aci",
    "timestamp": "2026-07-12T06:54:39.745656",
    "survey": "deep_aci",
    "meta": {
      "name": "Alfredo Ponce",
      "level": "Colaboradores",
      "area": "Comercial",
      "country": "Costa Rica",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CH1": 2,
      "CH2": 2,
      "CH3": 1,
      "CH4": 3,
      "CH5": 4,
      "CH6": 4,
      "CH7": 4,
      "CH8": 4,
      "CH9": 4,
      "CH10": 1,
      "CH11": 1,
      "CH12": 2,
      "CH13": 3,
      "CH14": 3,
      "CH15": 3,
      "CH16": 3,
      "CH17": 3,
      "CH18": 3,
      "CH19": 3,
      "CH20": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_018_deep_cei",
    "timestamp": "2026-07-12T06:54:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Alfredo Ponce",
      "level": "Colaboradores",
      "area": "Comercial",
      "country": "Costa Rica",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 2,
      "CU2": 2,
      "CU3": 2,
      "CU4": 2,
      "CU5": 2,
      "CU6": 4,
      "CU7": 2,
      "CU8": 1,
      "CU9": 2,
      "CU10": 2,
      "CU11": 1,
      "CU12": 2,
      "CU13": 1,
      "CU14": 1,
      "CU15": 1,
      "CU16": 2,
      "CU17": 2,
      "CU18": 2,
      "CU19": 2,
      "CU20": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_019_core",
    "timestamp": "2026-07-23T03:22:39.745656",
    "survey": "core",
    "meta": {
      "name": "Gloria Téllez",
      "level": "Colaboradores",
      "area": "Distribución",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 1,
      "A2": 1,
      "A3": 3,
      "A4": 1,
      "A5": 2,
      "E1": 3,
      "E2": 3,
      "E3": 3,
      "E4": 2,
      "E5": 3,
      "E6": 4,
      "E7": 3,
      "L1": 3,
      "L2": 1,
      "L3": 3,
      "L4": 2,
      "L5": 2,
      "L6": 2,
      "R1": 4,
      "R2": 3,
      "R3": 4,
      "R4": 5,
      "C1": 3,
      "C2": 2,
      "C3": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_019_full",
    "timestamp": "2026-07-23T03:22:39.745656",
    "survey": "full",
    "meta": {
      "name": "Gloria Téllez",
      "level": "Colaboradores",
      "area": "Distribución",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 1,
      "A2": 1,
      "A3": 3,
      "A4": 1,
      "A5": 2,
      "E1": 3,
      "E2": 3,
      "E3": 3,
      "E4": 2,
      "E5": 3,
      "E6": 4,
      "E7": 3,
      "L1": 3,
      "L2": 1,
      "L3": 3,
      "L4": 2,
      "L5": 2,
      "L6": 2,
      "R1": 4,
      "R2": 3,
      "R3": 4,
      "R4": 5,
      "C1": 3,
      "C2": 2,
      "C3": 3,
      "SA6": 4,
      "SA7": 3,
      "SA8": 2,
      "SA9": 3,
      "SA10": 4,
      "SA11": 4,
      "SA12": 3,
      "EX8": 3,
      "EX9": 2,
      "EX10": 2,
      "EX11": 3,
      "EX12": 3,
      "EX13": 3,
      "EX14": 2,
      "EX15": 3,
      "EX16": 2,
      "EX17": 3,
      "EX18": 2,
      "LE7": 3,
      "LE8": 2,
      "LE9": 2,
      "LE10": 3,
      "LE11": 2,
      "LE12": 3,
      "LE13": 3,
      "LE14": 3,
      "LE15": 3,
      "RC5": 3,
      "RC6": 3,
      "RC7": 3,
      "RC8": 2,
      "RC9": 3,
      "OC4": 1,
      "OC5": 1,
      "OC6": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_019_deep_lei",
    "timestamp": "2026-07-23T03:52:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Gloria Téllez",
      "level": "Colaboradores",
      "area": "Distribución",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 3,
      "LD2": 3,
      "LD3": 3,
      "LD4": 1,
      "LD5": 1,
      "LD6": 2,
      "LD7": 3,
      "LD8": 2,
      "LD9": 3,
      "LD10": 2,
      "LD11": 3,
      "LD12": 3,
      "LD13": 1,
      "LD14": 1,
      "LD15": 2,
      "LD16": 1,
      "LD17": 1,
      "LD18": 1,
      "LD19": 3,
      "LD20": 2,
      "LD21": 2,
      "LD22": 1,
      "LD23": 1,
      "LD24": 1,
      "LD25": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_019_deep_tcs",
    "timestamp": "2026-07-23T03:52:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Gloria Téllez",
      "level": "Colaboradores",
      "area": "Distribución",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 2,
      "LT2": 2,
      "LT3": 3,
      "LT4": 2,
      "LT5": 2,
      "LT6": 2,
      "LT7": 1,
      "LT8": 2,
      "LT9": 1,
      "LT10": 2,
      "LT11": 3,
      "LT12": 2,
      "LT13": 2,
      "LT14": 1,
      "LT15": 1,
      "LT16": 1,
      "LT17": 2,
      "LT18": 1,
      "LT19": 2,
      "LT20": 2,
      "LT21": 1,
      "LT22": 1,
      "LT23": 1,
      "LT24": 1,
      "LT25": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_019_deep_eci",
    "timestamp": "2026-07-23T03:52:39.745656",
    "survey": "deep_eci",
    "meta": {
      "name": "Gloria Téllez",
      "level": "Colaboradores",
      "area": "Distribución",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "EXD1": 3,
      "EXD2": 4,
      "EXD3": 3,
      "EXD4": 5,
      "EXD5": 5,
      "EXD6": 5,
      "EXD7": 3,
      "EXD8": 2,
      "EXD9": 2,
      "EXD10": 4,
      "EXD11": 4,
      "EXD12": 4,
      "EXD13": 3,
      "EXD14": 3,
      "EXD15": 3,
      "EXD16": 4,
      "EXD17": 4,
      "EXD18": 3,
      "EXD19": 4,
      "EXD20": 4,
      "EXD21": 3,
      "EXD22": 3,
      "EXD23": 3,
      "EXD24": 4,
      "EXD25": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_019_deep_aci",
    "timestamp": "2026-07-23T03:52:39.745656",
    "survey": "deep_aci",
    "meta": {
      "name": "Gloria Téllez",
      "level": "Colaboradores",
      "area": "Distribución",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CH1": 2,
      "CH2": 1,
      "CH3": 1,
      "CH4": 1,
      "CH5": 3,
      "CH6": 3,
      "CH7": 3,
      "CH8": 2,
      "CH9": 3,
      "CH10": 3,
      "CH11": 2,
      "CH12": 3,
      "CH13": 3,
      "CH14": 1,
      "CH15": 2,
      "CH16": 4,
      "CH17": 4,
      "CH18": 4,
      "CH19": 4,
      "CH20": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_019_deep_cei",
    "timestamp": "2026-07-23T03:52:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Gloria Téllez",
      "level": "Colaboradores",
      "area": "Distribución",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 1,
      "CU2": 1,
      "CU3": 1,
      "CU4": 4,
      "CU5": 3,
      "CU6": 4,
      "CU7": 2,
      "CU8": 2,
      "CU9": 2,
      "CU10": 2,
      "CU11": 2,
      "CU12": 1,
      "CU13": 1,
      "CU14": 1,
      "CU15": 2,
      "CU16": 2,
      "CU17": 1,
      "CU18": 2,
      "CU19": 2,
      "CU20": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_020_core",
    "timestamp": "2026-07-21T05:52:39.745656",
    "survey": "core",
    "meta": {
      "name": "Bernardo Esquivel",
      "level": "Colaboradores",
      "area": "Tecnología",
      "country": "Guatemala",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 2,
      "A2": 3,
      "A3": 3,
      "A4": 3,
      "A5": 2,
      "E1": 4,
      "E2": 3,
      "E3": 5,
      "E4": 3,
      "E5": 4,
      "E6": 3,
      "E7": 4,
      "L1": 2,
      "L2": 3,
      "L3": 2,
      "L4": 3,
      "L5": 1,
      "L6": 2,
      "R1": 3,
      "R2": 2,
      "R3": 3,
      "R4": 2,
      "C1": 2,
      "C2": 2,
      "C3": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_020_full",
    "timestamp": "2026-07-21T05:52:39.745656",
    "survey": "full",
    "meta": {
      "name": "Bernardo Esquivel",
      "level": "Colaboradores",
      "area": "Tecnología",
      "country": "Guatemala",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 2,
      "A2": 3,
      "A3": 3,
      "A4": 3,
      "A5": 2,
      "E1": 4,
      "E2": 3,
      "E3": 5,
      "E4": 3,
      "E5": 4,
      "E6": 3,
      "E7": 4,
      "L1": 2,
      "L2": 3,
      "L3": 2,
      "L4": 3,
      "L5": 1,
      "L6": 2,
      "R1": 3,
      "R2": 2,
      "R3": 3,
      "R4": 2,
      "C1": 2,
      "C2": 2,
      "C3": 1,
      "SA6": 2,
      "SA7": 2,
      "SA8": 3,
      "SA9": 2,
      "SA10": 2,
      "SA11": 2,
      "SA12": 3,
      "EX8": 3,
      "EX9": 1,
      "EX10": 3,
      "EX11": 3,
      "EX12": 3,
      "EX13": 2,
      "EX14": 1,
      "EX15": 2,
      "EX16": 2,
      "EX17": 2,
      "EX18": 2,
      "LE7": 4,
      "LE8": 3,
      "LE9": 4,
      "LE10": 3,
      "LE11": 3,
      "LE12": 4,
      "LE13": 4,
      "LE14": 3,
      "LE15": 4,
      "RC5": 3,
      "RC6": 3,
      "RC7": 3,
      "RC8": 2,
      "RC9": 3,
      "OC4": 3,
      "OC5": 2,
      "OC6": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_020_deep_lei",
    "timestamp": "2026-07-21T06:22:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Bernardo Esquivel",
      "level": "Colaboradores",
      "area": "Tecnología",
      "country": "Guatemala",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 1,
      "LD2": 2,
      "LD3": 1,
      "LD4": 4,
      "LD5": 3,
      "LD6": 3,
      "LD7": 2,
      "LD8": 2,
      "LD9": 4,
      "LD10": 3,
      "LD11": 2,
      "LD12": 3,
      "LD13": 1,
      "LD14": 1,
      "LD15": 2,
      "LD16": 2,
      "LD17": 2,
      "LD18": 3,
      "LD19": 2,
      "LD20": 1,
      "LD21": 2,
      "LD22": 2,
      "LD23": 2,
      "LD24": 2,
      "LD25": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_020_deep_tcs",
    "timestamp": "2026-07-21T06:22:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Bernardo Esquivel",
      "level": "Colaboradores",
      "area": "Tecnología",
      "country": "Guatemala",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 2,
      "LT2": 1,
      "LT3": 1,
      "LT4": 1,
      "LT5": 1,
      "LT6": 2,
      "LT7": 1,
      "LT8": 2,
      "LT9": 2,
      "LT10": 2,
      "LT11": 1,
      "LT12": 3,
      "LT13": 2,
      "LT14": 1,
      "LT15": 2,
      "LT16": 4,
      "LT17": 2,
      "LT18": 3,
      "LT19": 1,
      "LT20": 1,
      "LT21": 1,
      "LT22": 2,
      "LT23": 1,
      "LT24": 2,
      "LT25": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_020_deep_eci",
    "timestamp": "2026-07-21T06:22:39.745656",
    "survey": "deep_eci",
    "meta": {
      "name": "Bernardo Esquivel",
      "level": "Colaboradores",
      "area": "Tecnología",
      "country": "Guatemala",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "EXD1": 5,
      "EXD2": 5,
      "EXD3": 5,
      "EXD4": 3,
      "EXD5": 3,
      "EXD6": 4,
      "EXD7": 3,
      "EXD8": 3,
      "EXD9": 2,
      "EXD10": 3,
      "EXD11": 3,
      "EXD12": 2,
      "EXD13": 5,
      "EXD14": 4,
      "EXD15": 4,
      "EXD16": 4,
      "EXD17": 5,
      "EXD18": 4,
      "EXD19": 1,
      "EXD20": 1,
      "EXD21": 2,
      "EXD22": 4,
      "EXD23": 3,
      "EXD24": 4,
      "EXD25": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_020_deep_aci",
    "timestamp": "2026-07-21T06:22:39.745656",
    "survey": "deep_aci",
    "meta": {
      "name": "Bernardo Esquivel",
      "level": "Colaboradores",
      "area": "Tecnología",
      "country": "Guatemala",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CH1": 5,
      "CH2": 5,
      "CH3": 5,
      "CH4": 3,
      "CH5": 4,
      "CH6": 4,
      "CH7": 3,
      "CH8": 2,
      "CH9": 3,
      "CH10": 3,
      "CH11": 3,
      "CH12": 3,
      "CH13": 4,
      "CH14": 4,
      "CH15": 4,
      "CH16": 3,
      "CH17": 3,
      "CH18": 2,
      "CH19": 2,
      "CH20": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_020_deep_cei",
    "timestamp": "2026-07-21T06:22:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Bernardo Esquivel",
      "level": "Colaboradores",
      "area": "Tecnología",
      "country": "Guatemala",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 1,
      "CU2": 1,
      "CU3": 2,
      "CU4": 1,
      "CU5": 2,
      "CU6": 2,
      "CU7": 3,
      "CU8": 2,
      "CU9": 2,
      "CU10": 2,
      "CU11": 4,
      "CU12": 3,
      "CU13": 1,
      "CU14": 1,
      "CU15": 1,
      "CU16": 1,
      "CU17": 1,
      "CU18": 1,
      "CU19": 2,
      "CU20": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_021_core",
    "timestamp": "2026-07-17T10:10:39.745656",
    "survey": "core",
    "meta": {
      "name": "Raquel Hidalgo",
      "level": "Colaboradores",
      "area": "Tecnología",
      "country": "Nicaragua",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 4,
      "A2": 4,
      "A3": 4,
      "A4": 4,
      "A5": 4,
      "E1": 3,
      "E2": 3,
      "E3": 4,
      "E4": 3,
      "E5": 3,
      "E6": 3,
      "E7": 3,
      "L1": 2,
      "L2": 2,
      "L3": 3,
      "L4": 2,
      "L5": 2,
      "L6": 3,
      "R1": 3,
      "R2": 3,
      "R3": 3,
      "R4": 2,
      "C1": 3,
      "C2": 3,
      "C3": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_021_full",
    "timestamp": "2026-07-17T10:10:39.745656",
    "survey": "full",
    "meta": {
      "name": "Raquel Hidalgo",
      "level": "Colaboradores",
      "area": "Tecnología",
      "country": "Nicaragua",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 4,
      "A2": 4,
      "A3": 4,
      "A4": 4,
      "A5": 4,
      "E1": 3,
      "E2": 3,
      "E3": 4,
      "E4": 3,
      "E5": 3,
      "E6": 3,
      "E7": 3,
      "L1": 2,
      "L2": 2,
      "L3": 3,
      "L4": 2,
      "L5": 2,
      "L6": 3,
      "R1": 3,
      "R2": 3,
      "R3": 3,
      "R4": 2,
      "C1": 3,
      "C2": 3,
      "C3": 3,
      "SA6": 2,
      "SA7": 3,
      "SA8": 3,
      "SA9": 3,
      "SA10": 2,
      "SA11": 2,
      "SA12": 3,
      "EX8": 4,
      "EX9": 3,
      "EX10": 3,
      "EX11": 4,
      "EX12": 5,
      "EX13": 4,
      "EX14": 2,
      "EX15": 3,
      "EX16": 4,
      "EX17": 3,
      "EX18": 4,
      "LE7": 2,
      "LE8": 1,
      "LE9": 1,
      "LE10": 1,
      "LE11": 1,
      "LE12": 2,
      "LE13": 2,
      "LE14": 1,
      "LE15": 1,
      "RC5": 4,
      "RC6": 3,
      "RC7": 4,
      "RC8": 4,
      "RC9": 3,
      "OC4": 1,
      "OC5": 1,
      "OC6": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_021_deep_lei",
    "timestamp": "2026-07-17T10:40:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Raquel Hidalgo",
      "level": "Colaboradores",
      "area": "Tecnología",
      "country": "Nicaragua",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 1,
      "LD2": 1,
      "LD3": 1,
      "LD4": 3,
      "LD5": 4,
      "LD6": 3,
      "LD7": 1,
      "LD8": 2,
      "LD9": 2,
      "LD10": 4,
      "LD11": 4,
      "LD12": 4,
      "LD13": 4,
      "LD14": 2,
      "LD15": 3,
      "LD16": 1,
      "LD17": 1,
      "LD18": 1,
      "LD19": 2,
      "LD20": 2,
      "LD21": 2,
      "LD22": 1,
      "LD23": 2,
      "LD24": 2,
      "LD25": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_021_deep_tcs",
    "timestamp": "2026-07-17T10:40:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Raquel Hidalgo",
      "level": "Colaboradores",
      "area": "Tecnología",
      "country": "Nicaragua",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 3,
      "LT2": 3,
      "LT3": 3,
      "LT4": 2,
      "LT5": 2,
      "LT6": 1,
      "LT7": 1,
      "LT8": 2,
      "LT9": 1,
      "LT10": 2,
      "LT11": 1,
      "LT12": 1,
      "LT13": 4,
      "LT14": 3,
      "LT15": 3,
      "LT16": 2,
      "LT17": 3,
      "LT18": 2,
      "LT19": 5,
      "LT20": 4,
      "LT21": 4,
      "LT22": 2,
      "LT23": 2,
      "LT24": 2,
      "LT25": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_021_deep_eci",
    "timestamp": "2026-07-17T10:40:39.745656",
    "survey": "deep_eci",
    "meta": {
      "name": "Raquel Hidalgo",
      "level": "Colaboradores",
      "area": "Tecnología",
      "country": "Nicaragua",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "EXD1": 4,
      "EXD2": 2,
      "EXD3": 3,
      "EXD4": 5,
      "EXD5": 4,
      "EXD6": 5,
      "EXD7": 4,
      "EXD8": 4,
      "EXD9": 4,
      "EXD10": 3,
      "EXD11": 2,
      "EXD12": 2,
      "EXD13": 3,
      "EXD14": 3,
      "EXD15": 3,
      "EXD16": 1,
      "EXD17": 1,
      "EXD18": 1,
      "EXD19": 3,
      "EXD20": 2,
      "EXD21": 3,
      "EXD22": 2,
      "EXD23": 3,
      "EXD24": 3,
      "EXD25": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_021_deep_aci",
    "timestamp": "2026-07-17T10:40:39.745656",
    "survey": "deep_aci",
    "meta": {
      "name": "Raquel Hidalgo",
      "level": "Colaboradores",
      "area": "Tecnología",
      "country": "Nicaragua",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CH1": 5,
      "CH2": 4,
      "CH3": 5,
      "CH4": 2,
      "CH5": 1,
      "CH6": 2,
      "CH7": 2,
      "CH8": 3,
      "CH9": 3,
      "CH10": 2,
      "CH11": 2,
      "CH12": 2,
      "CH13": 4,
      "CH14": 4,
      "CH15": 4,
      "CH16": 5,
      "CH17": 5,
      "CH18": 4,
      "CH19": 4,
      "CH20": 4
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_021_deep_cei",
    "timestamp": "2026-07-17T10:40:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Raquel Hidalgo",
      "level": "Colaboradores",
      "area": "Tecnología",
      "country": "Nicaragua",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 1,
      "CU2": 1,
      "CU3": 1,
      "CU4": 3,
      "CU5": 2,
      "CU6": 3,
      "CU7": 1,
      "CU8": 1,
      "CU9": 1,
      "CU10": 3,
      "CU11": 2,
      "CU12": 3,
      "CU13": 1,
      "CU14": 1,
      "CU15": 1,
      "CU16": 2,
      "CU17": 2,
      "CU18": 1,
      "CU19": 2,
      "CU20": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_022_core",
    "timestamp": "2026-07-20T10:32:39.745656",
    "survey": "core",
    "meta": {
      "name": "Armando Solís",
      "level": "Colaboradores",
      "area": "Tecnología",
      "country": "Nicaragua",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 3,
      "A2": 3,
      "A3": 3,
      "A4": 3,
      "A5": 4,
      "E1": 4,
      "E2": 4,
      "E3": 5,
      "E4": 5,
      "E5": 5,
      "E6": 5,
      "E7": 4,
      "L1": 3,
      "L2": 1,
      "L3": 2,
      "L4": 2,
      "L5": 2,
      "L6": 3,
      "R1": 4,
      "R2": 3,
      "R3": 4,
      "R4": 3,
      "C1": 2,
      "C2": 1,
      "C3": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_022_full",
    "timestamp": "2026-07-20T10:32:39.745656",
    "survey": "full",
    "meta": {
      "name": "Armando Solís",
      "level": "Colaboradores",
      "area": "Tecnología",
      "country": "Nicaragua",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 3,
      "A2": 3,
      "A3": 3,
      "A4": 3,
      "A5": 4,
      "E1": 4,
      "E2": 4,
      "E3": 5,
      "E4": 5,
      "E5": 5,
      "E6": 5,
      "E7": 4,
      "L1": 3,
      "L2": 1,
      "L3": 2,
      "L4": 2,
      "L5": 2,
      "L6": 3,
      "R1": 4,
      "R2": 3,
      "R3": 4,
      "R4": 3,
      "C1": 2,
      "C2": 1,
      "C3": 2,
      "SA6": 4,
      "SA7": 3,
      "SA8": 4,
      "SA9": 4,
      "SA10": 5,
      "SA11": 4,
      "SA12": 5,
      "EX8": 3,
      "EX9": 3,
      "EX10": 3,
      "EX11": 3,
      "EX12": 3,
      "EX13": 4,
      "EX14": 4,
      "EX15": 5,
      "EX16": 5,
      "EX17": 4,
      "EX18": 4,
      "LE7": 5,
      "LE8": 4,
      "LE9": 5,
      "LE10": 4,
      "LE11": 3,
      "LE12": 5,
      "LE13": 3,
      "LE14": 5,
      "LE15": 4,
      "RC5": 2,
      "RC6": 2,
      "RC7": 2,
      "RC8": 1,
      "RC9": 3,
      "OC4": 1,
      "OC5": 2,
      "OC6": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_022_deep_lei",
    "timestamp": "2026-07-20T11:02:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Armando Solís",
      "level": "Colaboradores",
      "area": "Tecnología",
      "country": "Nicaragua",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 3,
      "LD2": 2,
      "LD3": 3,
      "LD4": 2,
      "LD5": 1,
      "LD6": 2,
      "LD7": 2,
      "LD8": 1,
      "LD9": 2,
      "LD10": 3,
      "LD11": 1,
      "LD12": 2,
      "LD13": 1,
      "LD14": 1,
      "LD15": 2,
      "LD16": 2,
      "LD17": 3,
      "LD18": 2,
      "LD19": 2,
      "LD20": 2,
      "LD21": 2,
      "LD22": 2,
      "LD23": 2,
      "LD24": 1,
      "LD25": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_022_deep_tcs",
    "timestamp": "2026-07-20T11:02:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Armando Solís",
      "level": "Colaboradores",
      "area": "Tecnología",
      "country": "Nicaragua",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 3,
      "LT2": 3,
      "LT3": 2,
      "LT4": 2,
      "LT5": 2,
      "LT6": 3,
      "LT7": 3,
      "LT8": 4,
      "LT9": 3,
      "LT10": 2,
      "LT11": 3,
      "LT12": 3,
      "LT13": 2,
      "LT14": 3,
      "LT15": 2,
      "LT16": 1,
      "LT17": 1,
      "LT18": 1,
      "LT19": 2,
      "LT20": 2,
      "LT21": 2,
      "LT22": 1,
      "LT23": 1,
      "LT24": 1,
      "LT25": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_022_deep_aci",
    "timestamp": "2026-07-20T11:02:39.745656",
    "survey": "deep_aci",
    "meta": {
      "name": "Armando Solís",
      "level": "Colaboradores",
      "area": "Tecnología",
      "country": "Nicaragua",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CH1": 3,
      "CH2": 4,
      "CH3": 2,
      "CH4": 3,
      "CH5": 3,
      "CH6": 3,
      "CH7": 3,
      "CH8": 3,
      "CH9": 2,
      "CH10": 5,
      "CH11": 4,
      "CH12": 4,
      "CH13": 2,
      "CH14": 3,
      "CH15": 2,
      "CH16": 3,
      "CH17": 2,
      "CH18": 4,
      "CH19": 3,
      "CH20": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_022_deep_cei",
    "timestamp": "2026-07-20T11:02:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Armando Solís",
      "level": "Colaboradores",
      "area": "Tecnología",
      "country": "Nicaragua",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 1,
      "CU2": 1,
      "CU3": 1,
      "CU4": 3,
      "CU5": 2,
      "CU6": 3,
      "CU7": 2,
      "CU8": 2,
      "CU9": 3,
      "CU10": 1,
      "CU11": 1,
      "CU12": 1,
      "CU13": 2,
      "CU14": 2,
      "CU15": 2,
      "CU16": 1,
      "CU17": 2,
      "CU18": 1,
      "CU19": 2,
      "CU20": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_023_core",
    "timestamp": "2026-07-18T21:23:39.745656",
    "survey": "core",
    "meta": {
      "name": "Irma Pacheco",
      "level": "Colaboradores",
      "area": "Almacenamiento",
      "country": "Guatemala",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 5,
      "A2": 4,
      "A3": 4,
      "A4": 3,
      "A5": 2,
      "E1": 3,
      "E2": 4,
      "E3": 5,
      "E4": 3,
      "E5": 4,
      "E6": 4,
      "E7": 4,
      "L1": 2,
      "L2": 2,
      "L3": 3,
      "L4": 3,
      "L5": 2,
      "L6": 2,
      "R1": 2,
      "R2": 4,
      "R3": 2,
      "R4": 3,
      "C1": 2,
      "C2": 2,
      "C3": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_023_full",
    "timestamp": "2026-07-18T21:23:39.745656",
    "survey": "full",
    "meta": {
      "name": "Irma Pacheco",
      "level": "Colaboradores",
      "area": "Almacenamiento",
      "country": "Guatemala",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 5,
      "A2": 4,
      "A3": 4,
      "A4": 3,
      "A5": 2,
      "E1": 3,
      "E2": 4,
      "E3": 5,
      "E4": 3,
      "E5": 4,
      "E6": 4,
      "E7": 4,
      "L1": 2,
      "L2": 2,
      "L3": 3,
      "L4": 3,
      "L5": 2,
      "L6": 2,
      "R1": 2,
      "R2": 4,
      "R3": 2,
      "R4": 3,
      "C1": 2,
      "C2": 2,
      "C3": 2,
      "SA6": 2,
      "SA7": 2,
      "SA8": 3,
      "SA9": 2,
      "SA10": 4,
      "SA11": 3,
      "SA12": 3,
      "EX8": 3,
      "EX9": 3,
      "EX10": 4,
      "EX11": 5,
      "EX12": 4,
      "EX13": 5,
      "EX14": 3,
      "EX15": 5,
      "EX16": 4,
      "EX17": 3,
      "EX18": 3,
      "LE7": 3,
      "LE8": 2,
      "LE9": 3,
      "LE10": 3,
      "LE11": 4,
      "LE12": 3,
      "LE13": 1,
      "LE14": 3,
      "LE15": 2,
      "RC5": 4,
      "RC6": 4,
      "RC7": 4,
      "RC8": 3,
      "RC9": 4,
      "OC4": 1,
      "OC5": 1,
      "OC6": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_023_deep_lei",
    "timestamp": "2026-07-18T21:53:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Irma Pacheco",
      "level": "Colaboradores",
      "area": "Almacenamiento",
      "country": "Guatemala",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 2,
      "LD2": 2,
      "LD3": 3,
      "LD4": 2,
      "LD5": 2,
      "LD6": 2,
      "LD7": 3,
      "LD8": 2,
      "LD9": 2,
      "LD10": 2,
      "LD11": 2,
      "LD12": 3,
      "LD13": 3,
      "LD14": 3,
      "LD15": 3,
      "LD16": 5,
      "LD17": 5,
      "LD18": 5,
      "LD19": 2,
      "LD20": 1,
      "LD21": 1,
      "LD22": 3,
      "LD23": 2,
      "LD24": 2,
      "LD25": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_023_deep_tcs",
    "timestamp": "2026-07-18T21:53:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Irma Pacheco",
      "level": "Colaboradores",
      "area": "Almacenamiento",
      "country": "Guatemala",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 2,
      "LT2": 2,
      "LT3": 2,
      "LT4": 3,
      "LT5": 3,
      "LT6": 3,
      "LT7": 1,
      "LT8": 1,
      "LT9": 1,
      "LT10": 3,
      "LT11": 2,
      "LT12": 2,
      "LT13": 3,
      "LT14": 1,
      "LT15": 2,
      "LT16": 3,
      "LT17": 3,
      "LT18": 3,
      "LT19": 3,
      "LT20": 3,
      "LT21": 2,
      "LT22": 2,
      "LT23": 2,
      "LT24": 3,
      "LT25": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_023_deep_aci",
    "timestamp": "2026-07-18T21:53:39.745656",
    "survey": "deep_aci",
    "meta": {
      "name": "Irma Pacheco",
      "level": "Colaboradores",
      "area": "Almacenamiento",
      "country": "Guatemala",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CH1": 2,
      "CH2": 2,
      "CH3": 3,
      "CH4": 3,
      "CH5": 4,
      "CH6": 3,
      "CH7": 5,
      "CH8": 4,
      "CH9": 5,
      "CH10": 1,
      "CH11": 1,
      "CH12": 1,
      "CH13": 4,
      "CH14": 4,
      "CH15": 3,
      "CH16": 2,
      "CH17": 2,
      "CH18": 2,
      "CH19": 2,
      "CH20": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_023_deep_cei",
    "timestamp": "2026-07-18T21:53:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Irma Pacheco",
      "level": "Colaboradores",
      "area": "Almacenamiento",
      "country": "Guatemala",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 1,
      "CU2": 2,
      "CU3": 2,
      "CU4": 1,
      "CU5": 1,
      "CU6": 1,
      "CU7": 1,
      "CU8": 1,
      "CU9": 1,
      "CU10": 2,
      "CU11": 2,
      "CU12": 2,
      "CU13": 2,
      "CU14": 3,
      "CU15": 1,
      "CU16": 1,
      "CU17": 1,
      "CU18": 1,
      "CU19": 3,
      "CU20": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_024_core",
    "timestamp": "2026-07-12T22:49:39.745656",
    "survey": "core",
    "meta": {
      "name": "Humberto Villa",
      "level": "Colaboradores",
      "area": "RRHH",
      "country": "Nicaragua",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 2,
      "A2": 3,
      "A3": 4,
      "A4": 4,
      "A5": 3,
      "E1": 3,
      "E2": 4,
      "E3": 4,
      "E4": 4,
      "E5": 4,
      "E6": 3,
      "E7": 4,
      "L1": 1,
      "L2": 1,
      "L3": 1,
      "L4": 1,
      "L5": 2,
      "L6": 1,
      "R1": 4,
      "R2": 3,
      "R3": 4,
      "R4": 3,
      "C1": 3,
      "C2": 3,
      "C3": 4
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_024_full",
    "timestamp": "2026-07-12T22:49:39.745656",
    "survey": "full",
    "meta": {
      "name": "Humberto Villa",
      "level": "Colaboradores",
      "area": "RRHH",
      "country": "Nicaragua",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 2,
      "A2": 3,
      "A3": 4,
      "A4": 4,
      "A5": 3,
      "E1": 3,
      "E2": 4,
      "E3": 4,
      "E4": 4,
      "E5": 4,
      "E6": 3,
      "E7": 4,
      "L1": 1,
      "L2": 1,
      "L3": 1,
      "L4": 1,
      "L5": 2,
      "L6": 1,
      "R1": 4,
      "R2": 3,
      "R3": 4,
      "R4": 3,
      "C1": 3,
      "C2": 3,
      "C3": 4,
      "SA6": 3,
      "SA7": 2,
      "SA8": 2,
      "SA9": 2,
      "SA10": 4,
      "SA11": 2,
      "SA12": 1,
      "EX8": 4,
      "EX9": 5,
      "EX10": 4,
      "EX11": 5,
      "EX12": 4,
      "EX13": 5,
      "EX14": 4,
      "EX15": 3,
      "EX16": 5,
      "EX17": 4,
      "EX18": 5,
      "LE7": 2,
      "LE8": 2,
      "LE9": 2,
      "LE10": 2,
      "LE11": 2,
      "LE12": 2,
      "LE13": 2,
      "LE14": 2,
      "LE15": 2,
      "RC5": 3,
      "RC6": 3,
      "RC7": 3,
      "RC8": 3,
      "RC9": 1,
      "OC4": 1,
      "OC5": 2,
      "OC6": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_024_deep_lei",
    "timestamp": "2026-07-12T23:19:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Humberto Villa",
      "level": "Colaboradores",
      "area": "RRHH",
      "country": "Nicaragua",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 2,
      "LD2": 2,
      "LD3": 2,
      "LD4": 2,
      "LD5": 3,
      "LD6": 3,
      "LD7": 3,
      "LD8": 3,
      "LD9": 2,
      "LD10": 2,
      "LD11": 2,
      "LD12": 2,
      "LD13": 2,
      "LD14": 1,
      "LD15": 2,
      "LD16": 1,
      "LD17": 2,
      "LD18": 1,
      "LD19": 1,
      "LD20": 1,
      "LD21": 1,
      "LD22": 2,
      "LD23": 3,
      "LD24": 3,
      "LD25": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_024_deep_tcs",
    "timestamp": "2026-07-12T23:19:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Humberto Villa",
      "level": "Colaboradores",
      "area": "RRHH",
      "country": "Nicaragua",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 2,
      "LT2": 3,
      "LT3": 3,
      "LT4": 3,
      "LT5": 2,
      "LT6": 2,
      "LT7": 3,
      "LT8": 4,
      "LT9": 4,
      "LT10": 3,
      "LT11": 2,
      "LT12": 2,
      "LT13": 2,
      "LT14": 2,
      "LT15": 3,
      "LT16": 2,
      "LT17": 2,
      "LT18": 2,
      "LT19": 1,
      "LT20": 1,
      "LT21": 1,
      "LT22": 1,
      "LT23": 1,
      "LT24": 2,
      "LT25": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_024_deep_aci",
    "timestamp": "2026-07-12T23:19:39.745656",
    "survey": "deep_aci",
    "meta": {
      "name": "Humberto Villa",
      "level": "Colaboradores",
      "area": "RRHH",
      "country": "Nicaragua",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CH1": 1,
      "CH2": 1,
      "CH3": 1,
      "CH4": 2,
      "CH5": 3,
      "CH6": 2,
      "CH7": 2,
      "CH8": 2,
      "CH9": 1,
      "CH10": 3,
      "CH11": 3,
      "CH12": 3,
      "CH13": 4,
      "CH14": 3,
      "CH15": 4,
      "CH16": 1,
      "CH17": 1,
      "CH18": 1,
      "CH19": 1,
      "CH20": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_024_deep_cei",
    "timestamp": "2026-07-12T23:19:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Humberto Villa",
      "level": "Colaboradores",
      "area": "RRHH",
      "country": "Nicaragua",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 2,
      "CU2": 2,
      "CU3": 2,
      "CU4": 1,
      "CU5": 2,
      "CU6": 1,
      "CU7": 2,
      "CU8": 3,
      "CU9": 3,
      "CU10": 1,
      "CU11": 1,
      "CU12": 2,
      "CU13": 1,
      "CU14": 1,
      "CU15": 1,
      "CU16": 2,
      "CU17": 2,
      "CU18": 2,
      "CU19": 1,
      "CU20": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_025_core",
    "timestamp": "2026-07-22T07:14:39.745656",
    "survey": "core",
    "meta": {
      "name": "Yolanda Miranda",
      "level": "Colaboradores",
      "area": "Administración",
      "country": "Nicaragua",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 1,
      "A2": 1,
      "A3": 2,
      "A4": 1,
      "A5": 2,
      "E1": 5,
      "E2": 4,
      "E3": 5,
      "E4": 4,
      "E5": 3,
      "E6": 5,
      "E7": 4,
      "L1": 2,
      "L2": 1,
      "L3": 2,
      "L4": 2,
      "L5": 2,
      "L6": 1,
      "R1": 2,
      "R2": 2,
      "R3": 2,
      "R4": 1,
      "C1": 3,
      "C2": 3,
      "C3": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_025_full",
    "timestamp": "2026-07-22T07:14:39.745656",
    "survey": "full",
    "meta": {
      "name": "Yolanda Miranda",
      "level": "Colaboradores",
      "area": "Administración",
      "country": "Nicaragua",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 1,
      "A2": 1,
      "A3": 2,
      "A4": 1,
      "A5": 2,
      "E1": 5,
      "E2": 4,
      "E3": 5,
      "E4": 4,
      "E5": 3,
      "E6": 5,
      "E7": 4,
      "L1": 2,
      "L2": 1,
      "L3": 2,
      "L4": 2,
      "L5": 2,
      "L6": 1,
      "R1": 2,
      "R2": 2,
      "R3": 2,
      "R4": 1,
      "C1": 3,
      "C2": 3,
      "C3": 2,
      "SA6": 2,
      "SA7": 2,
      "SA8": 2,
      "SA9": 2,
      "SA10": 2,
      "SA11": 3,
      "SA12": 2,
      "EX8": 2,
      "EX9": 3,
      "EX10": 2,
      "EX11": 3,
      "EX12": 3,
      "EX13": 3,
      "EX14": 3,
      "EX15": 4,
      "EX16": 3,
      "EX17": 4,
      "EX18": 3,
      "LE7": 3,
      "LE8": 3,
      "LE9": 2,
      "LE10": 3,
      "LE11": 2,
      "LE12": 3,
      "LE13": 2,
      "LE14": 2,
      "LE15": 2,
      "RC5": 4,
      "RC6": 4,
      "RC7": 3,
      "RC8": 3,
      "RC9": 4,
      "OC4": 1,
      "OC5": 1,
      "OC6": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_025_deep_lei",
    "timestamp": "2026-07-22T07:44:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Yolanda Miranda",
      "level": "Colaboradores",
      "area": "Administración",
      "country": "Nicaragua",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 3,
      "LD2": 4,
      "LD3": 3,
      "LD4": 1,
      "LD5": 1,
      "LD6": 2,
      "LD7": 3,
      "LD8": 2,
      "LD9": 3,
      "LD10": 3,
      "LD11": 4,
      "LD12": 2,
      "LD13": 1,
      "LD14": 3,
      "LD15": 1,
      "LD16": 3,
      "LD17": 4,
      "LD18": 2,
      "LD19": 2,
      "LD20": 3,
      "LD21": 3,
      "LD22": 2,
      "LD23": 2,
      "LD24": 2,
      "LD25": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_025_deep_tcs",
    "timestamp": "2026-07-22T07:44:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Yolanda Miranda",
      "level": "Colaboradores",
      "area": "Administración",
      "country": "Nicaragua",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 1,
      "LT2": 1,
      "LT3": 1,
      "LT4": 1,
      "LT5": 1,
      "LT6": 3,
      "LT7": 2,
      "LT8": 2,
      "LT9": 2,
      "LT10": 1,
      "LT11": 2,
      "LT12": 2,
      "LT13": 2,
      "LT14": 1,
      "LT15": 2,
      "LT16": 2,
      "LT17": 3,
      "LT18": 4,
      "LT19": 2,
      "LT20": 2,
      "LT21": 3,
      "LT22": 3,
      "LT23": 4,
      "LT24": 2,
      "LT25": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_025_deep_aci",
    "timestamp": "2026-07-22T07:44:39.745656",
    "survey": "deep_aci",
    "meta": {
      "name": "Yolanda Miranda",
      "level": "Colaboradores",
      "area": "Administración",
      "country": "Nicaragua",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CH1": 3,
      "CH2": 4,
      "CH3": 3,
      "CH4": 4,
      "CH5": 4,
      "CH6": 3,
      "CH7": 2,
      "CH8": 3,
      "CH9": 3,
      "CH10": 3,
      "CH11": 1,
      "CH12": 1,
      "CH13": 2,
      "CH14": 3,
      "CH15": 1,
      "CH16": 4,
      "CH17": 3,
      "CH18": 4,
      "CH19": 4,
      "CH20": 4
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_025_deep_cei",
    "timestamp": "2026-07-22T07:44:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Yolanda Miranda",
      "level": "Colaboradores",
      "area": "Administración",
      "country": "Nicaragua",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 2,
      "CU2": 2,
      "CU3": 2,
      "CU4": 3,
      "CU5": 3,
      "CU6": 2,
      "CU7": 2,
      "CU8": 2,
      "CU9": 1,
      "CU10": 1,
      "CU11": 1,
      "CU12": 1,
      "CU13": 1,
      "CU14": 1,
      "CU15": 1,
      "CU16": 3,
      "CU17": 3,
      "CU18": 4,
      "CU19": 3,
      "CU20": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_026_core",
    "timestamp": "2026-07-17T01:28:39.745656",
    "survey": "core",
    "meta": {
      "name": "Gustavo Serrano",
      "level": "Colaboradores",
      "area": "Almacenamiento",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 4,
      "A2": 2,
      "A3": 4,
      "A4": 3,
      "A5": 4,
      "E1": 3,
      "E2": 3,
      "E3": 3,
      "E4": 3,
      "E5": 2,
      "E6": 4,
      "E7": 3,
      "L1": 2,
      "L2": 2,
      "L3": 2,
      "L4": 2,
      "L5": 1,
      "L6": 2,
      "R1": 3,
      "R2": 3,
      "R3": 4,
      "R4": 2,
      "C1": 3,
      "C2": 2,
      "C3": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_026_full",
    "timestamp": "2026-07-17T01:28:39.745656",
    "survey": "full",
    "meta": {
      "name": "Gustavo Serrano",
      "level": "Colaboradores",
      "area": "Almacenamiento",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 4,
      "A2": 2,
      "A3": 4,
      "A4": 3,
      "A5": 4,
      "E1": 3,
      "E2": 3,
      "E3": 3,
      "E4": 3,
      "E5": 2,
      "E6": 4,
      "E7": 3,
      "L1": 2,
      "L2": 2,
      "L3": 2,
      "L4": 2,
      "L5": 1,
      "L6": 2,
      "R1": 3,
      "R2": 3,
      "R3": 4,
      "R4": 2,
      "C1": 3,
      "C2": 2,
      "C3": 2,
      "SA6": 2,
      "SA7": 2,
      "SA8": 2,
      "SA9": 1,
      "SA10": 2,
      "SA11": 3,
      "SA12": 2,
      "EX8": 3,
      "EX9": 3,
      "EX10": 3,
      "EX11": 2,
      "EX12": 3,
      "EX13": 4,
      "EX14": 4,
      "EX15": 2,
      "EX16": 4,
      "EX17": 4,
      "EX18": 3,
      "LE7": 3,
      "LE8": 3,
      "LE9": 4,
      "LE10": 4,
      "LE11": 3,
      "LE12": 2,
      "LE13": 3,
      "LE14": 3,
      "LE15": 3,
      "RC5": 3,
      "RC6": 3,
      "RC7": 2,
      "RC8": 2,
      "RC9": 3,
      "OC4": 1,
      "OC5": 1,
      "OC6": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_026_deep_lei",
    "timestamp": "2026-07-17T01:58:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Gustavo Serrano",
      "level": "Colaboradores",
      "area": "Almacenamiento",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 1,
      "LD2": 2,
      "LD3": 1,
      "LD4": 1,
      "LD5": 2,
      "LD6": 3,
      "LD7": 2,
      "LD8": 1,
      "LD9": 1,
      "LD10": 3,
      "LD11": 4,
      "LD12": 3,
      "LD13": 2,
      "LD14": 2,
      "LD15": 3,
      "LD16": 2,
      "LD17": 4,
      "LD18": 4,
      "LD19": 2,
      "LD20": 2,
      "LD21": 2,
      "LD22": 3,
      "LD23": 3,
      "LD24": 3,
      "LD25": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_026_deep_tcs",
    "timestamp": "2026-07-17T01:58:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Gustavo Serrano",
      "level": "Colaboradores",
      "area": "Almacenamiento",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 2,
      "LT2": 2,
      "LT3": 1,
      "LT4": 2,
      "LT5": 2,
      "LT6": 2,
      "LT7": 2,
      "LT8": 2,
      "LT9": 1,
      "LT10": 1,
      "LT11": 1,
      "LT12": 1,
      "LT13": 1,
      "LT14": 2,
      "LT15": 2,
      "LT16": 1,
      "LT17": 2,
      "LT18": 1,
      "LT19": 1,
      "LT20": 1,
      "LT21": 1,
      "LT22": 3,
      "LT23": 3,
      "LT24": 3,
      "LT25": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_026_deep_eci",
    "timestamp": "2026-07-17T01:58:39.745656",
    "survey": "deep_eci",
    "meta": {
      "name": "Gustavo Serrano",
      "level": "Colaboradores",
      "area": "Almacenamiento",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "EXD1": 3,
      "EXD2": 4,
      "EXD3": 3,
      "EXD4": 4,
      "EXD5": 4,
      "EXD6": 4,
      "EXD7": 3,
      "EXD8": 2,
      "EXD9": 3,
      "EXD10": 2,
      "EXD11": 4,
      "EXD12": 3,
      "EXD13": 1,
      "EXD14": 2,
      "EXD15": 1,
      "EXD16": 3,
      "EXD17": 3,
      "EXD18": 3,
      "EXD19": 4,
      "EXD20": 3,
      "EXD21": 3,
      "EXD22": 3,
      "EXD23": 2,
      "EXD24": 3,
      "EXD25": 4
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_026_deep_aci",
    "timestamp": "2026-07-17T01:58:39.745656",
    "survey": "deep_aci",
    "meta": {
      "name": "Gustavo Serrano",
      "level": "Colaboradores",
      "area": "Almacenamiento",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CH1": 3,
      "CH2": 2,
      "CH3": 2,
      "CH4": 4,
      "CH5": 3,
      "CH6": 4,
      "CH7": 2,
      "CH8": 2,
      "CH9": 1,
      "CH10": 3,
      "CH11": 3,
      "CH12": 4,
      "CH13": 2,
      "CH14": 3,
      "CH15": 3,
      "CH16": 4,
      "CH17": 5,
      "CH18": 4,
      "CH19": 4,
      "CH20": 5
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_026_deep_cei",
    "timestamp": "2026-07-17T01:58:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Gustavo Serrano",
      "level": "Colaboradores",
      "area": "Almacenamiento",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 2,
      "CU2": 2,
      "CU3": 3,
      "CU4": 2,
      "CU5": 2,
      "CU6": 3,
      "CU7": 2,
      "CU8": 2,
      "CU9": 2,
      "CU10": 1,
      "CU11": 2,
      "CU12": 2,
      "CU13": 2,
      "CU14": 2,
      "CU15": 1,
      "CU16": 3,
      "CU17": 2,
      "CU18": 2,
      "CU19": 3,
      "CU20": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_027_core",
    "timestamp": "2026-07-12T22:48:39.745656",
    "survey": "core",
    "meta": {
      "name": "Leticia Mendoza",
      "level": "Colaboradores",
      "area": "Tecnología",
      "country": "Nicaragua",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 4,
      "A2": 3,
      "A3": 3,
      "A4": 4,
      "A5": 4,
      "E1": 2,
      "E2": 2,
      "E3": 2,
      "E4": 3,
      "E5": 3,
      "E6": 2,
      "E7": 2,
      "L1": 2,
      "L2": 3,
      "L3": 4,
      "L4": 4,
      "L5": 3,
      "L6": 3,
      "R1": 3,
      "R2": 2,
      "R3": 3,
      "R4": 3,
      "C1": 4,
      "C2": 3,
      "C3": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_027_full",
    "timestamp": "2026-07-12T22:48:39.745656",
    "survey": "full",
    "meta": {
      "name": "Leticia Mendoza",
      "level": "Colaboradores",
      "area": "Tecnología",
      "country": "Nicaragua",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 4,
      "A2": 3,
      "A3": 3,
      "A4": 4,
      "A5": 4,
      "E1": 2,
      "E2": 2,
      "E3": 2,
      "E4": 3,
      "E5": 3,
      "E6": 2,
      "E7": 2,
      "L1": 2,
      "L2": 3,
      "L3": 4,
      "L4": 4,
      "L5": 3,
      "L6": 3,
      "R1": 3,
      "R2": 2,
      "R3": 3,
      "R4": 3,
      "C1": 4,
      "C2": 3,
      "C3": 3,
      "SA6": 3,
      "SA7": 3,
      "SA8": 3,
      "SA9": 3,
      "SA10": 3,
      "SA11": 4,
      "SA12": 4,
      "EX8": 2,
      "EX9": 2,
      "EX10": 3,
      "EX11": 2,
      "EX12": 2,
      "EX13": 3,
      "EX14": 2,
      "EX15": 2,
      "EX16": 3,
      "EX17": 2,
      "EX18": 3,
      "LE7": 2,
      "LE8": 3,
      "LE9": 3,
      "LE10": 2,
      "LE11": 2,
      "LE12": 3,
      "LE13": 2,
      "LE14": 2,
      "LE15": 2,
      "RC5": 1,
      "RC6": 1,
      "RC7": 2,
      "RC8": 2,
      "RC9": 2,
      "OC4": 2,
      "OC5": 2,
      "OC6": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_027_deep_lei",
    "timestamp": "2026-07-12T23:18:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Leticia Mendoza",
      "level": "Colaboradores",
      "area": "Tecnología",
      "country": "Nicaragua",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 1,
      "LD2": 2,
      "LD3": 1,
      "LD4": 1,
      "LD5": 2,
      "LD6": 3,
      "LD7": 1,
      "LD8": 1,
      "LD9": 1,
      "LD10": 2,
      "LD11": 2,
      "LD12": 2,
      "LD13": 3,
      "LD14": 3,
      "LD15": 3,
      "LD16": 2,
      "LD17": 2,
      "LD18": 2,
      "LD19": 3,
      "LD20": 3,
      "LD21": 2,
      "LD22": 1,
      "LD23": 1,
      "LD24": 1,
      "LD25": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_027_deep_tcs",
    "timestamp": "2026-07-12T23:18:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Leticia Mendoza",
      "level": "Colaboradores",
      "area": "Tecnología",
      "country": "Nicaragua",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 1,
      "LT2": 1,
      "LT3": 1,
      "LT4": 3,
      "LT5": 2,
      "LT6": 3,
      "LT7": 3,
      "LT8": 2,
      "LT9": 2,
      "LT10": 3,
      "LT11": 2,
      "LT12": 2,
      "LT13": 1,
      "LT14": 1,
      "LT15": 2,
      "LT16": 3,
      "LT17": 2,
      "LT18": 2,
      "LT19": 1,
      "LT20": 1,
      "LT21": 1,
      "LT22": 2,
      "LT23": 2,
      "LT24": 2,
      "LT25": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_027_deep_eci",
    "timestamp": "2026-07-12T23:18:39.745656",
    "survey": "deep_eci",
    "meta": {
      "name": "Leticia Mendoza",
      "level": "Colaboradores",
      "area": "Tecnología",
      "country": "Nicaragua",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "EXD1": 3,
      "EXD2": 4,
      "EXD3": 4,
      "EXD4": 3,
      "EXD5": 4,
      "EXD6": 4,
      "EXD7": 3,
      "EXD8": 3,
      "EXD9": 3,
      "EXD10": 3,
      "EXD11": 3,
      "EXD12": 3,
      "EXD13": 5,
      "EXD14": 3,
      "EXD15": 4,
      "EXD16": 2,
      "EXD17": 2,
      "EXD18": 3,
      "EXD19": 2,
      "EXD20": 2,
      "EXD21": 3,
      "EXD22": 3,
      "EXD23": 4,
      "EXD24": 4,
      "EXD25": 4
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_027_deep_aci",
    "timestamp": "2026-07-12T23:18:39.745656",
    "survey": "deep_aci",
    "meta": {
      "name": "Leticia Mendoza",
      "level": "Colaboradores",
      "area": "Tecnología",
      "country": "Nicaragua",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CH1": 4,
      "CH2": 4,
      "CH3": 4,
      "CH4": 3,
      "CH5": 3,
      "CH6": 3,
      "CH7": 2,
      "CH8": 2,
      "CH9": 2,
      "CH10": 3,
      "CH11": 5,
      "CH12": 3,
      "CH13": 2,
      "CH14": 2,
      "CH15": 3,
      "CH16": 1,
      "CH17": 2,
      "CH18": 2,
      "CH19": 2,
      "CH20": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_027_deep_cei",
    "timestamp": "2026-07-12T23:18:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Leticia Mendoza",
      "level": "Colaboradores",
      "area": "Tecnología",
      "country": "Nicaragua",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 3,
      "CU2": 3,
      "CU3": 2,
      "CU4": 1,
      "CU5": 1,
      "CU6": 1,
      "CU7": 2,
      "CU8": 1,
      "CU9": 2,
      "CU10": 1,
      "CU11": 2,
      "CU12": 1,
      "CU13": 1,
      "CU14": 1,
      "CU15": 1,
      "CU16": 1,
      "CU17": 2,
      "CU18": 1,
      "CU19": 1,
      "CU20": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_028_core",
    "timestamp": "2026-07-19T22:58:39.745656",
    "survey": "core",
    "meta": {
      "name": "Leonardo Trejo",
      "level": "Colaboradores",
      "area": "Finanzas",
      "country": "Guatemala",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 3,
      "A2": 3,
      "A3": 3,
      "A4": 4,
      "A5": 3,
      "E1": 3,
      "E2": 2,
      "E3": 2,
      "E4": 2,
      "E5": 4,
      "E6": 3,
      "E7": 3,
      "L1": 2,
      "L2": 1,
      "L3": 1,
      "L4": 1,
      "L5": 1,
      "L6": 2,
      "R1": 1,
      "R2": 2,
      "R3": 3,
      "R4": 1,
      "C1": 1,
      "C2": 1,
      "C3": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_028_full",
    "timestamp": "2026-07-19T22:58:39.745656",
    "survey": "full",
    "meta": {
      "name": "Leonardo Trejo",
      "level": "Colaboradores",
      "area": "Finanzas",
      "country": "Guatemala",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 3,
      "A2": 3,
      "A3": 3,
      "A4": 4,
      "A5": 3,
      "E1": 3,
      "E2": 2,
      "E3": 2,
      "E4": 2,
      "E5": 4,
      "E6": 3,
      "E7": 3,
      "L1": 2,
      "L2": 1,
      "L3": 1,
      "L4": 1,
      "L5": 1,
      "L6": 2,
      "R1": 1,
      "R2": 2,
      "R3": 3,
      "R4": 1,
      "C1": 1,
      "C2": 1,
      "C3": 1,
      "SA6": 1,
      "SA7": 1,
      "SA8": 1,
      "SA9": 1,
      "SA10": 1,
      "SA11": 1,
      "SA12": 2,
      "EX8": 3,
      "EX9": 1,
      "EX10": 2,
      "EX11": 2,
      "EX12": 3,
      "EX13": 2,
      "EX14": 3,
      "EX15": 3,
      "EX16": 3,
      "EX17": 1,
      "EX18": 3,
      "LE7": 2,
      "LE8": 4,
      "LE9": 3,
      "LE10": 2,
      "LE11": 3,
      "LE12": 3,
      "LE13": 3,
      "LE14": 3,
      "LE15": 3,
      "RC5": 2,
      "RC6": 1,
      "RC7": 1,
      "RC8": 2,
      "RC9": 1,
      "OC4": 3,
      "OC5": 3,
      "OC6": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_028_deep_lei",
    "timestamp": "2026-07-19T23:28:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Leonardo Trejo",
      "level": "Colaboradores",
      "area": "Finanzas",
      "country": "Guatemala",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 3,
      "LD2": 3,
      "LD3": 2,
      "LD4": 2,
      "LD5": 1,
      "LD6": 1,
      "LD7": 2,
      "LD8": 1,
      "LD9": 2,
      "LD10": 1,
      "LD11": 1,
      "LD12": 1,
      "LD13": 3,
      "LD14": 4,
      "LD15": 3,
      "LD16": 2,
      "LD17": 2,
      "LD18": 3,
      "LD19": 1,
      "LD20": 1,
      "LD21": 3,
      "LD22": 2,
      "LD23": 2,
      "LD24": 2,
      "LD25": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_028_deep_tcs",
    "timestamp": "2026-07-19T23:28:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Leonardo Trejo",
      "level": "Colaboradores",
      "area": "Finanzas",
      "country": "Guatemala",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 1,
      "LT2": 1,
      "LT3": 1,
      "LT4": 1,
      "LT5": 1,
      "LT6": 1,
      "LT7": 1,
      "LT8": 1,
      "LT9": 1,
      "LT10": 4,
      "LT11": 3,
      "LT12": 3,
      "LT13": 3,
      "LT14": 3,
      "LT15": 2,
      "LT16": 1,
      "LT17": 1,
      "LT18": 1,
      "LT19": 1,
      "LT20": 3,
      "LT21": 2,
      "LT22": 1,
      "LT23": 1,
      "LT24": 1,
      "LT25": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_028_deep_eci",
    "timestamp": "2026-07-19T23:28:39.745656",
    "survey": "deep_eci",
    "meta": {
      "name": "Leonardo Trejo",
      "level": "Colaboradores",
      "area": "Finanzas",
      "country": "Guatemala",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "EXD1": 3,
      "EXD2": 3,
      "EXD3": 4,
      "EXD4": 4,
      "EXD5": 4,
      "EXD6": 3,
      "EXD7": 3,
      "EXD8": 3,
      "EXD9": 2,
      "EXD10": 4,
      "EXD11": 5,
      "EXD12": 4,
      "EXD13": 3,
      "EXD14": 3,
      "EXD15": 2,
      "EXD16": 3,
      "EXD17": 2,
      "EXD18": 2,
      "EXD19": 5,
      "EXD20": 5,
      "EXD21": 4,
      "EXD22": 3,
      "EXD23": 3,
      "EXD24": 3,
      "EXD25": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_028_deep_aci",
    "timestamp": "2026-07-19T23:28:39.745656",
    "survey": "deep_aci",
    "meta": {
      "name": "Leonardo Trejo",
      "level": "Colaboradores",
      "area": "Finanzas",
      "country": "Guatemala",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CH1": 2,
      "CH2": 2,
      "CH3": 2,
      "CH4": 2,
      "CH5": 3,
      "CH6": 3,
      "CH7": 3,
      "CH8": 3,
      "CH9": 2,
      "CH10": 4,
      "CH11": 3,
      "CH12": 4,
      "CH13": 2,
      "CH14": 3,
      "CH15": 1,
      "CH16": 3,
      "CH17": 4,
      "CH18": 4,
      "CH19": 4,
      "CH20": 4
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_028_deep_cei",
    "timestamp": "2026-07-19T23:28:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Leonardo Trejo",
      "level": "Colaboradores",
      "area": "Finanzas",
      "country": "Guatemala",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 2,
      "CU2": 3,
      "CU3": 3,
      "CU4": 2,
      "CU5": 2,
      "CU6": 3,
      "CU7": 3,
      "CU8": 3,
      "CU9": 2,
      "CU10": 2,
      "CU11": 2,
      "CU12": 3,
      "CU13": 1,
      "CU14": 1,
      "CU15": 1,
      "CU16": 2,
      "CU17": 2,
      "CU18": 2,
      "CU19": 1,
      "CU20": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_029_core",
    "timestamp": "2026-07-13T07:19:39.745656",
    "survey": "core",
    "meta": {
      "name": "Alicia Olvera",
      "level": "Colaboradores",
      "area": "Transporte",
      "country": "Guatemala",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 1,
      "A2": 3,
      "A3": 3,
      "A4": 2,
      "A5": 2,
      "E1": 2,
      "E2": 2,
      "E3": 3,
      "E4": 2,
      "E5": 3,
      "E6": 3,
      "E7": 3,
      "L1": 3,
      "L2": 4,
      "L3": 3,
      "L4": 3,
      "L5": 3,
      "L6": 3,
      "R1": 3,
      "R2": 4,
      "R3": 3,
      "R4": 3,
      "C1": 3,
      "C2": 3,
      "C3": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_029_full",
    "timestamp": "2026-07-13T07:19:39.745656",
    "survey": "full",
    "meta": {
      "name": "Alicia Olvera",
      "level": "Colaboradores",
      "area": "Transporte",
      "country": "Guatemala",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 1,
      "A2": 3,
      "A3": 3,
      "A4": 2,
      "A5": 2,
      "E1": 2,
      "E2": 2,
      "E3": 3,
      "E4": 2,
      "E5": 3,
      "E6": 3,
      "E7": 3,
      "L1": 3,
      "L2": 4,
      "L3": 3,
      "L4": 3,
      "L5": 3,
      "L6": 3,
      "R1": 3,
      "R2": 4,
      "R3": 3,
      "R4": 3,
      "C1": 3,
      "C2": 3,
      "C3": 2,
      "SA6": 3,
      "SA7": 3,
      "SA8": 2,
      "SA9": 3,
      "SA10": 2,
      "SA11": 2,
      "SA12": 3,
      "EX8": 3,
      "EX9": 4,
      "EX10": 2,
      "EX11": 2,
      "EX12": 3,
      "EX13": 4,
      "EX14": 2,
      "EX15": 2,
      "EX16": 4,
      "EX17": 3,
      "EX18": 2,
      "LE7": 3,
      "LE8": 2,
      "LE9": 1,
      "LE10": 2,
      "LE11": 1,
      "LE12": 2,
      "LE13": 3,
      "LE14": 3,
      "LE15": 2,
      "RC5": 1,
      "RC6": 1,
      "RC7": 2,
      "RC8": 1,
      "RC9": 2,
      "OC4": 1,
      "OC5": 1,
      "OC6": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_029_deep_lei",
    "timestamp": "2026-07-13T07:49:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Alicia Olvera",
      "level": "Colaboradores",
      "area": "Transporte",
      "country": "Guatemala",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 2,
      "LD2": 2,
      "LD3": 2,
      "LD4": 2,
      "LD5": 3,
      "LD6": 2,
      "LD7": 3,
      "LD8": 3,
      "LD9": 3,
      "LD10": 1,
      "LD11": 1,
      "LD12": 1,
      "LD13": 3,
      "LD14": 3,
      "LD15": 3,
      "LD16": 3,
      "LD17": 3,
      "LD18": 3,
      "LD19": 1,
      "LD20": 2,
      "LD21": 1,
      "LD22": 2,
      "LD23": 1,
      "LD24": 1,
      "LD25": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_029_deep_tcs",
    "timestamp": "2026-07-13T07:49:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Alicia Olvera",
      "level": "Colaboradores",
      "area": "Transporte",
      "country": "Guatemala",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 1,
      "LT2": 1,
      "LT3": 2,
      "LT4": 2,
      "LT5": 2,
      "LT6": 2,
      "LT7": 1,
      "LT8": 2,
      "LT9": 2,
      "LT10": 3,
      "LT11": 3,
      "LT12": 2,
      "LT13": 2,
      "LT14": 2,
      "LT15": 3,
      "LT16": 3,
      "LT17": 3,
      "LT18": 3,
      "LT19": 1,
      "LT20": 1,
      "LT21": 1,
      "LT22": 1,
      "LT23": 2,
      "LT24": 2,
      "LT25": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_029_deep_eci",
    "timestamp": "2026-07-13T07:49:39.745656",
    "survey": "deep_eci",
    "meta": {
      "name": "Alicia Olvera",
      "level": "Colaboradores",
      "area": "Transporte",
      "country": "Guatemala",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "EXD1": 4,
      "EXD2": 4,
      "EXD3": 4,
      "EXD4": 3,
      "EXD5": 3,
      "EXD6": 3,
      "EXD7": 4,
      "EXD8": 3,
      "EXD9": 3,
      "EXD10": 4,
      "EXD11": 4,
      "EXD12": 4,
      "EXD13": 1,
      "EXD14": 2,
      "EXD15": 2,
      "EXD16": 3,
      "EXD17": 3,
      "EXD18": 4,
      "EXD19": 3,
      "EXD20": 3,
      "EXD21": 4,
      "EXD22": 3,
      "EXD23": 3,
      "EXD24": 4,
      "EXD25": 4
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_029_deep_aci",
    "timestamp": "2026-07-13T07:49:39.745656",
    "survey": "deep_aci",
    "meta": {
      "name": "Alicia Olvera",
      "level": "Colaboradores",
      "area": "Transporte",
      "country": "Guatemala",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CH1": 3,
      "CH2": 3,
      "CH3": 3,
      "CH4": 3,
      "CH5": 4,
      "CH6": 4,
      "CH7": 2,
      "CH8": 3,
      "CH9": 1,
      "CH10": 2,
      "CH11": 2,
      "CH12": 2,
      "CH13": 2,
      "CH14": 3,
      "CH15": 2,
      "CH16": 2,
      "CH17": 3,
      "CH18": 2,
      "CH19": 2,
      "CH20": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_029_deep_cei",
    "timestamp": "2026-07-13T07:49:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Alicia Olvera",
      "level": "Colaboradores",
      "area": "Transporte",
      "country": "Guatemala",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 2,
      "CU2": 3,
      "CU3": 2,
      "CU4": 1,
      "CU5": 1,
      "CU6": 1,
      "CU7": 4,
      "CU8": 3,
      "CU9": 3,
      "CU10": 1,
      "CU11": 1,
      "CU12": 2,
      "CU13": 1,
      "CU14": 1,
      "CU15": 2,
      "CU16": 3,
      "CU17": 2,
      "CU18": 3,
      "CU19": 4,
      "CU20": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_030_core",
    "timestamp": "2026-07-19T22:31:39.745656",
    "survey": "core",
    "meta": {
      "name": "Marco Gallegos",
      "level": "Colaboradores",
      "area": "Operaciones",
      "country": "Costa Rica",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 2,
      "A2": 2,
      "A3": 1,
      "A4": 2,
      "A5": 2,
      "E1": 4,
      "E2": 4,
      "E3": 4,
      "E4": 4,
      "E5": 5,
      "E6": 3,
      "E7": 3,
      "L1": 2,
      "L2": 3,
      "L3": 3,
      "L4": 3,
      "L5": 3,
      "L6": 3,
      "R1": 3,
      "R2": 2,
      "R3": 4,
      "R4": 3,
      "C1": 1,
      "C2": 2,
      "C3": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_030_full",
    "timestamp": "2026-07-19T22:31:39.745656",
    "survey": "full",
    "meta": {
      "name": "Marco Gallegos",
      "level": "Colaboradores",
      "area": "Operaciones",
      "country": "Costa Rica",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 2,
      "A2": 2,
      "A3": 1,
      "A4": 2,
      "A5": 2,
      "E1": 4,
      "E2": 4,
      "E3": 4,
      "E4": 4,
      "E5": 5,
      "E6": 3,
      "E7": 3,
      "L1": 2,
      "L2": 3,
      "L3": 3,
      "L4": 3,
      "L5": 3,
      "L6": 3,
      "R1": 3,
      "R2": 2,
      "R3": 4,
      "R4": 3,
      "C1": 1,
      "C2": 2,
      "C3": 1,
      "SA6": 3,
      "SA7": 3,
      "SA8": 4,
      "SA9": 3,
      "SA10": 3,
      "SA11": 4,
      "SA12": 3,
      "EX8": 2,
      "EX9": 4,
      "EX10": 4,
      "EX11": 3,
      "EX12": 3,
      "EX13": 4,
      "EX14": 4,
      "EX15": 4,
      "EX16": 4,
      "EX17": 4,
      "EX18": 4,
      "LE7": 4,
      "LE8": 4,
      "LE9": 4,
      "LE10": 3,
      "LE11": 4,
      "LE12": 3,
      "LE13": 3,
      "LE14": 4,
      "LE15": 3,
      "RC5": 4,
      "RC6": 4,
      "RC7": 4,
      "RC8": 5,
      "RC9": 4,
      "OC4": 3,
      "OC5": 3,
      "OC6": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_030_deep_lei",
    "timestamp": "2026-07-19T23:01:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Marco Gallegos",
      "level": "Colaboradores",
      "area": "Operaciones",
      "country": "Costa Rica",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 4,
      "LD2": 4,
      "LD3": 3,
      "LD4": 2,
      "LD5": 2,
      "LD6": 2,
      "LD7": 3,
      "LD8": 2,
      "LD9": 2,
      "LD10": 2,
      "LD11": 1,
      "LD12": 2,
      "LD13": 1,
      "LD14": 1,
      "LD15": 1,
      "LD16": 1,
      "LD17": 1,
      "LD18": 1,
      "LD19": 1,
      "LD20": 1,
      "LD21": 1,
      "LD22": 1,
      "LD23": 1,
      "LD24": 1,
      "LD25": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_030_deep_tcs",
    "timestamp": "2026-07-19T23:01:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Marco Gallegos",
      "level": "Colaboradores",
      "area": "Operaciones",
      "country": "Costa Rica",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 1,
      "LT2": 1,
      "LT3": 1,
      "LT4": 3,
      "LT5": 3,
      "LT6": 3,
      "LT7": 3,
      "LT8": 3,
      "LT9": 2,
      "LT10": 3,
      "LT11": 3,
      "LT12": 3,
      "LT13": 1,
      "LT14": 1,
      "LT15": 1,
      "LT16": 2,
      "LT17": 3,
      "LT18": 2,
      "LT19": 1,
      "LT20": 2,
      "LT21": 2,
      "LT22": 3,
      "LT23": 3,
      "LT24": 3,
      "LT25": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_030_deep_cei",
    "timestamp": "2026-07-19T23:01:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Marco Gallegos",
      "level": "Colaboradores",
      "area": "Operaciones",
      "country": "Costa Rica",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 2,
      "CU2": 1,
      "CU3": 2,
      "CU4": 1,
      "CU5": 1,
      "CU6": 1,
      "CU7": 1,
      "CU8": 2,
      "CU9": 1,
      "CU10": 1,
      "CU11": 1,
      "CU12": 2,
      "CU13": 5,
      "CU14": 4,
      "CU15": 4,
      "CU16": 2,
      "CU17": 2,
      "CU18": 2,
      "CU19": 2,
      "CU20": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_031_core",
    "timestamp": "2026-07-19T04:31:39.745656",
    "survey": "core",
    "meta": {
      "name": "Rosario Pedraza",
      "level": "Colaboradores",
      "area": "Administración",
      "country": "Costa Rica",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 3,
      "A2": 2,
      "A3": 3,
      "A4": 2,
      "A5": 3,
      "E1": 3,
      "E2": 4,
      "E3": 3,
      "E4": 3,
      "E5": 3,
      "E6": 5,
      "E7": 3,
      "L1": 2,
      "L2": 1,
      "L3": 2,
      "L4": 1,
      "L5": 2,
      "L6": 1,
      "R1": 2,
      "R2": 3,
      "R3": 3,
      "R4": 3,
      "C1": 2,
      "C2": 2,
      "C3": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_031_full",
    "timestamp": "2026-07-19T04:31:39.745656",
    "survey": "full",
    "meta": {
      "name": "Rosario Pedraza",
      "level": "Colaboradores",
      "area": "Administración",
      "country": "Costa Rica",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 3,
      "A2": 2,
      "A3": 3,
      "A4": 2,
      "A5": 3,
      "E1": 3,
      "E2": 4,
      "E3": 3,
      "E4": 3,
      "E5": 3,
      "E6": 5,
      "E7": 3,
      "L1": 2,
      "L2": 1,
      "L3": 2,
      "L4": 1,
      "L5": 2,
      "L6": 1,
      "R1": 2,
      "R2": 3,
      "R3": 3,
      "R4": 3,
      "C1": 2,
      "C2": 2,
      "C3": 2,
      "SA6": 3,
      "SA7": 2,
      "SA8": 3,
      "SA9": 3,
      "SA10": 3,
      "SA11": 4,
      "SA12": 3,
      "EX8": 4,
      "EX9": 4,
      "EX10": 4,
      "EX11": 5,
      "EX12": 3,
      "EX13": 3,
      "EX14": 3,
      "EX15": 2,
      "EX16": 4,
      "EX17": 2,
      "EX18": 2,
      "LE7": 2,
      "LE8": 3,
      "LE9": 4,
      "LE10": 4,
      "LE11": 3,
      "LE12": 3,
      "LE13": 4,
      "LE14": 3,
      "LE15": 3,
      "RC5": 3,
      "RC6": 3,
      "RC7": 2,
      "RC8": 3,
      "RC9": 3,
      "OC4": 2,
      "OC5": 2,
      "OC6": 4
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_031_deep_lei",
    "timestamp": "2026-07-19T05:01:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Rosario Pedraza",
      "level": "Colaboradores",
      "area": "Administración",
      "country": "Costa Rica",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 3,
      "LD2": 1,
      "LD3": 1,
      "LD4": 1,
      "LD5": 1,
      "LD6": 2,
      "LD7": 1,
      "LD8": 1,
      "LD9": 2,
      "LD10": 2,
      "LD11": 2,
      "LD12": 2,
      "LD13": 2,
      "LD14": 1,
      "LD15": 1,
      "LD16": 3,
      "LD17": 1,
      "LD18": 3,
      "LD19": 3,
      "LD20": 3,
      "LD21": 2,
      "LD22": 2,
      "LD23": 2,
      "LD24": 2,
      "LD25": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_031_deep_tcs",
    "timestamp": "2026-07-19T05:01:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Rosario Pedraza",
      "level": "Colaboradores",
      "area": "Administración",
      "country": "Costa Rica",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 2,
      "LT2": 3,
      "LT3": 1,
      "LT4": 2,
      "LT5": 2,
      "LT6": 2,
      "LT7": 1,
      "LT8": 1,
      "LT9": 2,
      "LT10": 3,
      "LT11": 3,
      "LT12": 3,
      "LT13": 3,
      "LT14": 3,
      "LT15": 3,
      "LT16": 3,
      "LT17": 2,
      "LT18": 1,
      "LT19": 1,
      "LT20": 1,
      "LT21": 1,
      "LT22": 3,
      "LT23": 4,
      "LT24": 4,
      "LT25": 4
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_031_deep_eci",
    "timestamp": "2026-07-19T05:01:39.745656",
    "survey": "deep_eci",
    "meta": {
      "name": "Rosario Pedraza",
      "level": "Colaboradores",
      "area": "Administración",
      "country": "Costa Rica",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "EXD1": 3,
      "EXD2": 3,
      "EXD3": 3,
      "EXD4": 4,
      "EXD5": 5,
      "EXD6": 4,
      "EXD7": 3,
      "EXD8": 4,
      "EXD9": 4,
      "EXD10": 4,
      "EXD11": 3,
      "EXD12": 3,
      "EXD13": 2,
      "EXD14": 2,
      "EXD15": 2,
      "EXD16": 3,
      "EXD17": 2,
      "EXD18": 2,
      "EXD19": 4,
      "EXD20": 4,
      "EXD21": 4,
      "EXD22": 3,
      "EXD23": 4,
      "EXD24": 3,
      "EXD25": 4
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_031_deep_aci",
    "timestamp": "2026-07-19T05:01:39.745656",
    "survey": "deep_aci",
    "meta": {
      "name": "Rosario Pedraza",
      "level": "Colaboradores",
      "area": "Administración",
      "country": "Costa Rica",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CH1": 3,
      "CH2": 4,
      "CH3": 3,
      "CH4": 4,
      "CH5": 5,
      "CH6": 3,
      "CH7": 3,
      "CH8": 4,
      "CH9": 3,
      "CH10": 3,
      "CH11": 3,
      "CH12": 3,
      "CH13": 3,
      "CH14": 3,
      "CH15": 3,
      "CH16": 1,
      "CH17": 1,
      "CH18": 1,
      "CH19": 1,
      "CH20": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_031_deep_cei",
    "timestamp": "2026-07-19T05:01:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Rosario Pedraza",
      "level": "Colaboradores",
      "area": "Administración",
      "country": "Costa Rica",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 1,
      "CU2": 1,
      "CU3": 1,
      "CU4": 1,
      "CU5": 2,
      "CU6": 2,
      "CU7": 2,
      "CU8": 2,
      "CU9": 3,
      "CU10": 1,
      "CU11": 2,
      "CU12": 1,
      "CU13": 1,
      "CU14": 1,
      "CU15": 1,
      "CU16": 3,
      "CU17": 2,
      "CU18": 2,
      "CU19": 3,
      "CU20": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_032_core",
    "timestamp": "2026-07-21T05:15:39.745656",
    "survey": "core",
    "meta": {
      "name": "Oswaldo Nieto",
      "level": "Colaboradores",
      "area": "Operaciones",
      "country": "Nicaragua",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 3,
      "A2": 3,
      "A3": 2,
      "A4": 2,
      "A5": 3,
      "E1": 4,
      "E2": 4,
      "E3": 4,
      "E4": 5,
      "E5": 4,
      "E6": 4,
      "E7": 4,
      "L1": 2,
      "L2": 2,
      "L3": 4,
      "L4": 3,
      "L5": 3,
      "L6": 3,
      "R1": 4,
      "R2": 4,
      "R3": 3,
      "R4": 3,
      "C1": 2,
      "C2": 3,
      "C3": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_032_full",
    "timestamp": "2026-07-21T05:15:39.745656",
    "survey": "full",
    "meta": {
      "name": "Oswaldo Nieto",
      "level": "Colaboradores",
      "area": "Operaciones",
      "country": "Nicaragua",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 3,
      "A2": 3,
      "A3": 2,
      "A4": 2,
      "A5": 3,
      "E1": 4,
      "E2": 4,
      "E3": 4,
      "E4": 5,
      "E5": 4,
      "E6": 4,
      "E7": 4,
      "L1": 2,
      "L2": 2,
      "L3": 4,
      "L4": 3,
      "L5": 3,
      "L6": 3,
      "R1": 4,
      "R2": 4,
      "R3": 3,
      "R4": 3,
      "C1": 2,
      "C2": 3,
      "C3": 3,
      "SA6": 3,
      "SA7": 1,
      "SA8": 4,
      "SA9": 3,
      "SA10": 2,
      "SA11": 2,
      "SA12": 3,
      "EX8": 3,
      "EX9": 4,
      "EX10": 2,
      "EX11": 3,
      "EX12": 5,
      "EX13": 4,
      "EX14": 3,
      "EX15": 4,
      "EX16": 4,
      "EX17": 3,
      "EX18": 4,
      "LE7": 1,
      "LE8": 2,
      "LE9": 2,
      "LE10": 1,
      "LE11": 2,
      "LE12": 1,
      "LE13": 1,
      "LE14": 1,
      "LE15": 2,
      "RC5": 3,
      "RC6": 4,
      "RC7": 3,
      "RC8": 3,
      "RC9": 3,
      "OC4": 2,
      "OC5": 1,
      "OC6": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_032_deep_lei",
    "timestamp": "2026-07-21T05:45:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Oswaldo Nieto",
      "level": "Colaboradores",
      "area": "Operaciones",
      "country": "Nicaragua",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 2,
      "LD2": 1,
      "LD3": 1,
      "LD4": 1,
      "LD5": 1,
      "LD6": 1,
      "LD7": 1,
      "LD8": 1,
      "LD9": 1,
      "LD10": 2,
      "LD11": 1,
      "LD12": 1,
      "LD13": 3,
      "LD14": 4,
      "LD15": 3,
      "LD16": 2,
      "LD17": 2,
      "LD18": 2,
      "LD19": 3,
      "LD20": 2,
      "LD21": 2,
      "LD22": 3,
      "LD23": 3,
      "LD24": 2,
      "LD25": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_032_deep_tcs",
    "timestamp": "2026-07-21T05:45:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Oswaldo Nieto",
      "level": "Colaboradores",
      "area": "Operaciones",
      "country": "Nicaragua",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 2,
      "LT2": 1,
      "LT3": 3,
      "LT4": 1,
      "LT5": 2,
      "LT6": 2,
      "LT7": 4,
      "LT8": 4,
      "LT9": 3,
      "LT10": 1,
      "LT11": 2,
      "LT12": 3,
      "LT13": 2,
      "LT14": 1,
      "LT15": 2,
      "LT16": 1,
      "LT17": 1,
      "LT18": 1,
      "LT19": 2,
      "LT20": 2,
      "LT21": 2,
      "LT22": 2,
      "LT23": 2,
      "LT24": 2,
      "LT25": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_032_deep_aci",
    "timestamp": "2026-07-21T05:45:39.745656",
    "survey": "deep_aci",
    "meta": {
      "name": "Oswaldo Nieto",
      "level": "Colaboradores",
      "area": "Operaciones",
      "country": "Nicaragua",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CH1": 2,
      "CH2": 2,
      "CH3": 2,
      "CH4": 3,
      "CH5": 4,
      "CH6": 2,
      "CH7": 3,
      "CH8": 2,
      "CH9": 3,
      "CH10": 3,
      "CH11": 2,
      "CH12": 3,
      "CH13": 1,
      "CH14": 1,
      "CH15": 1,
      "CH16": 1,
      "CH17": 2,
      "CH18": 3,
      "CH19": 2,
      "CH20": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_032_deep_cei",
    "timestamp": "2026-07-21T05:45:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Oswaldo Nieto",
      "level": "Colaboradores",
      "area": "Operaciones",
      "country": "Nicaragua",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 1,
      "CU2": 1,
      "CU3": 1,
      "CU4": 1,
      "CU5": 3,
      "CU6": 2,
      "CU7": 2,
      "CU8": 2,
      "CU9": 2,
      "CU10": 1,
      "CU11": 2,
      "CU12": 1,
      "CU13": 2,
      "CU14": 2,
      "CU15": 2,
      "CU16": 2,
      "CU17": 2,
      "CU18": 2,
      "CU19": 3,
      "CU20": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_033_core",
    "timestamp": "2026-07-18T23:20:39.745656",
    "survey": "core",
    "meta": {
      "name": "Catalina Reina",
      "level": "Colaboradores",
      "area": "Almacenamiento",
      "country": "Guatemala",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 2,
      "A2": 3,
      "A3": 2,
      "A4": 2,
      "A5": 3,
      "E1": 3,
      "E2": 3,
      "E3": 4,
      "E4": 3,
      "E5": 5,
      "E6": 5,
      "E7": 5,
      "L1": 1,
      "L2": 1,
      "L3": 1,
      "L4": 1,
      "L5": 1,
      "L6": 1,
      "R1": 3,
      "R2": 3,
      "R3": 3,
      "R4": 2,
      "C1": 2,
      "C2": 2,
      "C3": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_033_full",
    "timestamp": "2026-07-18T23:20:39.745656",
    "survey": "full",
    "meta": {
      "name": "Catalina Reina",
      "level": "Colaboradores",
      "area": "Almacenamiento",
      "country": "Guatemala",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 2,
      "A2": 3,
      "A3": 2,
      "A4": 2,
      "A5": 3,
      "E1": 3,
      "E2": 3,
      "E3": 4,
      "E4": 3,
      "E5": 5,
      "E6": 5,
      "E7": 5,
      "L1": 1,
      "L2": 1,
      "L3": 1,
      "L4": 1,
      "L5": 1,
      "L6": 1,
      "R1": 3,
      "R2": 3,
      "R3": 3,
      "R4": 2,
      "C1": 2,
      "C2": 2,
      "C3": 3,
      "SA6": 2,
      "SA7": 3,
      "SA8": 2,
      "SA9": 2,
      "SA10": 3,
      "SA11": 3,
      "SA12": 2,
      "EX8": 5,
      "EX9": 3,
      "EX10": 5,
      "EX11": 5,
      "EX12": 5,
      "EX13": 4,
      "EX14": 3,
      "EX15": 4,
      "EX16": 4,
      "EX17": 4,
      "EX18": 3,
      "LE7": 3,
      "LE8": 5,
      "LE9": 4,
      "LE10": 4,
      "LE11": 3,
      "LE12": 3,
      "LE13": 5,
      "LE14": 4,
      "LE15": 5,
      "RC5": 4,
      "RC6": 3,
      "RC7": 3,
      "RC8": 3,
      "RC9": 4,
      "OC4": 4,
      "OC5": 4,
      "OC6": 4
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_033_deep_lei",
    "timestamp": "2026-07-18T23:50:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Catalina Reina",
      "level": "Colaboradores",
      "area": "Almacenamiento",
      "country": "Guatemala",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 3,
      "LD2": 2,
      "LD3": 3,
      "LD4": 2,
      "LD5": 3,
      "LD6": 4,
      "LD7": 3,
      "LD8": 2,
      "LD9": 3,
      "LD10": 2,
      "LD11": 2,
      "LD12": 2,
      "LD13": 2,
      "LD14": 1,
      "LD15": 1,
      "LD16": 3,
      "LD17": 3,
      "LD18": 3,
      "LD19": 2,
      "LD20": 2,
      "LD21": 1,
      "LD22": 3,
      "LD23": 3,
      "LD24": 3,
      "LD25": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_033_deep_tcs",
    "timestamp": "2026-07-18T23:50:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Catalina Reina",
      "level": "Colaboradores",
      "area": "Almacenamiento",
      "country": "Guatemala",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 3,
      "LT2": 2,
      "LT3": 2,
      "LT4": 1,
      "LT5": 1,
      "LT6": 1,
      "LT7": 2,
      "LT8": 3,
      "LT9": 2,
      "LT10": 1,
      "LT11": 2,
      "LT12": 2,
      "LT13": 3,
      "LT14": 3,
      "LT15": 3,
      "LT16": 2,
      "LT17": 2,
      "LT18": 2,
      "LT19": 1,
      "LT20": 1,
      "LT21": 2,
      "LT22": 3,
      "LT23": 3,
      "LT24": 3,
      "LT25": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_033_deep_aci",
    "timestamp": "2026-07-18T23:50:39.745656",
    "survey": "deep_aci",
    "meta": {
      "name": "Catalina Reina",
      "level": "Colaboradores",
      "area": "Almacenamiento",
      "country": "Guatemala",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CH1": 2,
      "CH2": 2,
      "CH3": 2,
      "CH4": 2,
      "CH5": 2,
      "CH6": 2,
      "CH7": 4,
      "CH8": 4,
      "CH9": 3,
      "CH10": 3,
      "CH11": 3,
      "CH12": 2,
      "CH13": 3,
      "CH14": 3,
      "CH15": 2,
      "CH16": 2,
      "CH17": 3,
      "CH18": 3,
      "CH19": 3,
      "CH20": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_033_deep_cei",
    "timestamp": "2026-07-18T23:50:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Catalina Reina",
      "level": "Colaboradores",
      "area": "Almacenamiento",
      "country": "Guatemala",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 2,
      "CU2": 1,
      "CU3": 1,
      "CU4": 1,
      "CU5": 1,
      "CU6": 1,
      "CU7": 1,
      "CU8": 1,
      "CU9": 1,
      "CU10": 2,
      "CU11": 2,
      "CU12": 2,
      "CU13": 3,
      "CU14": 4,
      "CU15": 2,
      "CU16": 2,
      "CU17": 2,
      "CU18": 1,
      "CU19": 2,
      "CU20": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_034_core",
    "timestamp": "2026-07-13T04:34:39.745656",
    "survey": "core",
    "meta": {
      "name": "Jaime Mora",
      "level": "Colaboradores",
      "area": "Comercial",
      "country": "Costa Rica",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 3,
      "A2": 3,
      "A3": 4,
      "A4": 4,
      "A5": 4,
      "E1": 2,
      "E2": 2,
      "E3": 2,
      "E4": 2,
      "E5": 2,
      "E6": 2,
      "E7": 2,
      "L1": 2,
      "L2": 2,
      "L3": 2,
      "L4": 1,
      "L5": 2,
      "L6": 2,
      "R1": 2,
      "R2": 2,
      "R3": 1,
      "R4": 1,
      "C1": 3,
      "C2": 3,
      "C3": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_034_full",
    "timestamp": "2026-07-13T04:34:39.745656",
    "survey": "full",
    "meta": {
      "name": "Jaime Mora",
      "level": "Colaboradores",
      "area": "Comercial",
      "country": "Costa Rica",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 3,
      "A2": 3,
      "A3": 4,
      "A4": 4,
      "A5": 4,
      "E1": 2,
      "E2": 2,
      "E3": 2,
      "E4": 2,
      "E5": 2,
      "E6": 2,
      "E7": 2,
      "L1": 2,
      "L2": 2,
      "L3": 2,
      "L4": 1,
      "L5": 2,
      "L6": 2,
      "R1": 2,
      "R2": 2,
      "R3": 1,
      "R4": 1,
      "C1": 3,
      "C2": 3,
      "C3": 2,
      "SA6": 3,
      "SA7": 3,
      "SA8": 4,
      "SA9": 4,
      "SA10": 4,
      "SA11": 4,
      "SA12": 4,
      "EX8": 3,
      "EX9": 4,
      "EX10": 3,
      "EX11": 4,
      "EX12": 4,
      "EX13": 4,
      "EX14": 4,
      "EX15": 4,
      "EX16": 4,
      "EX17": 4,
      "EX18": 4,
      "LE7": 2,
      "LE8": 2,
      "LE9": 4,
      "LE10": 4,
      "LE11": 2,
      "LE12": 2,
      "LE13": 3,
      "LE14": 3,
      "LE15": 2,
      "RC5": 4,
      "RC6": 3,
      "RC7": 3,
      "RC8": 3,
      "RC9": 2,
      "OC4": 2,
      "OC5": 2,
      "OC6": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_034_deep_lei",
    "timestamp": "2026-07-13T05:04:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Jaime Mora",
      "level": "Colaboradores",
      "area": "Comercial",
      "country": "Costa Rica",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 3,
      "LD2": 2,
      "LD3": 2,
      "LD4": 2,
      "LD5": 2,
      "LD6": 1,
      "LD7": 1,
      "LD8": 1,
      "LD9": 2,
      "LD10": 2,
      "LD11": 2,
      "LD12": 2,
      "LD13": 3,
      "LD14": 3,
      "LD15": 3,
      "LD16": 1,
      "LD17": 2,
      "LD18": 1,
      "LD19": 3,
      "LD20": 3,
      "LD21": 3,
      "LD22": 3,
      "LD23": 3,
      "LD24": 3,
      "LD25": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_034_deep_tcs",
    "timestamp": "2026-07-13T05:04:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Jaime Mora",
      "level": "Colaboradores",
      "area": "Comercial",
      "country": "Costa Rica",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 1,
      "LT2": 2,
      "LT3": 2,
      "LT4": 3,
      "LT5": 2,
      "LT6": 2,
      "LT7": 2,
      "LT8": 3,
      "LT9": 2,
      "LT10": 1,
      "LT11": 1,
      "LT12": 1,
      "LT13": 2,
      "LT14": 3,
      "LT15": 2,
      "LT16": 3,
      "LT17": 2,
      "LT18": 3,
      "LT19": 2,
      "LT20": 2,
      "LT21": 2,
      "LT22": 2,
      "LT23": 2,
      "LT24": 3,
      "LT25": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_034_deep_eci",
    "timestamp": "2026-07-13T05:04:39.745656",
    "survey": "deep_eci",
    "meta": {
      "name": "Jaime Mora",
      "level": "Colaboradores",
      "area": "Comercial",
      "country": "Costa Rica",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "EXD1": 3,
      "EXD2": 4,
      "EXD3": 5,
      "EXD4": 4,
      "EXD5": 2,
      "EXD6": 4,
      "EXD7": 4,
      "EXD8": 5,
      "EXD9": 3,
      "EXD10": 4,
      "EXD11": 3,
      "EXD12": 2,
      "EXD13": 2,
      "EXD14": 3,
      "EXD15": 3,
      "EXD16": 4,
      "EXD17": 4,
      "EXD18": 4,
      "EXD19": 3,
      "EXD20": 3,
      "EXD21": 4,
      "EXD22": 3,
      "EXD23": 2,
      "EXD24": 3,
      "EXD25": 4
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_034_deep_aci",
    "timestamp": "2026-07-13T05:04:39.745656",
    "survey": "deep_aci",
    "meta": {
      "name": "Jaime Mora",
      "level": "Colaboradores",
      "area": "Comercial",
      "country": "Costa Rica",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CH1": 3,
      "CH2": 2,
      "CH3": 3,
      "CH4": 1,
      "CH5": 2,
      "CH6": 2,
      "CH7": 2,
      "CH8": 3,
      "CH9": 3,
      "CH10": 1,
      "CH11": 2,
      "CH12": 1,
      "CH13": 2,
      "CH14": 2,
      "CH15": 2,
      "CH16": 3,
      "CH17": 3,
      "CH18": 3,
      "CH19": 3,
      "CH20": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_034_deep_cei",
    "timestamp": "2026-07-13T05:04:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Jaime Mora",
      "level": "Colaboradores",
      "area": "Comercial",
      "country": "Costa Rica",
      "bu": "División Logística",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 2,
      "CU2": 2,
      "CU3": 2,
      "CU4": 1,
      "CU5": 1,
      "CU6": 1,
      "CU7": 1,
      "CU8": 2,
      "CU9": 2,
      "CU10": 2,
      "CU11": 2,
      "CU12": 1,
      "CU13": 1,
      "CU14": 3,
      "CU15": 1,
      "CU16": 2,
      "CU17": 2,
      "CU18": 2,
      "CU19": 3,
      "CU20": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_035_core",
    "timestamp": "2026-07-20T05:05:39.745656",
    "survey": "core",
    "meta": {
      "name": "Elvira Zamora",
      "level": "Colaboradores",
      "area": "Finanzas",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 4,
      "A2": 4,
      "A3": 4,
      "A4": 4,
      "A5": 4,
      "E1": 3,
      "E2": 4,
      "E3": 3,
      "E4": 3,
      "E5": 3,
      "E6": 4,
      "E7": 4,
      "L1": 1,
      "L2": 1,
      "L3": 1,
      "L4": 1,
      "L5": 1,
      "L6": 2,
      "R1": 3,
      "R2": 4,
      "R3": 4,
      "R4": 5,
      "C1": 1,
      "C2": 1,
      "C3": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_035_full",
    "timestamp": "2026-07-20T05:05:39.745656",
    "survey": "full",
    "meta": {
      "name": "Elvira Zamora",
      "level": "Colaboradores",
      "area": "Finanzas",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 4,
      "A2": 4,
      "A3": 4,
      "A4": 4,
      "A5": 4,
      "E1": 3,
      "E2": 4,
      "E3": 3,
      "E4": 3,
      "E5": 3,
      "E6": 4,
      "E7": 4,
      "L1": 1,
      "L2": 1,
      "L3": 1,
      "L4": 1,
      "L5": 1,
      "L6": 2,
      "R1": 3,
      "R2": 4,
      "R3": 4,
      "R4": 5,
      "C1": 1,
      "C2": 1,
      "C3": 1,
      "SA6": 1,
      "SA7": 1,
      "SA8": 2,
      "SA9": 3,
      "SA10": 2,
      "SA11": 2,
      "SA12": 2,
      "EX8": 3,
      "EX9": 2,
      "EX10": 4,
      "EX11": 1,
      "EX12": 3,
      "EX13": 3,
      "EX14": 3,
      "EX15": 3,
      "EX16": 4,
      "EX17": 2,
      "EX18": 3,
      "LE7": 2,
      "LE8": 1,
      "LE9": 2,
      "LE10": 2,
      "LE11": 3,
      "LE12": 1,
      "LE13": 2,
      "LE14": 1,
      "LE15": 4,
      "RC5": 2,
      "RC6": 4,
      "RC7": 3,
      "RC8": 3,
      "RC9": 3,
      "OC4": 4,
      "OC5": 5,
      "OC6": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_035_deep_lei",
    "timestamp": "2026-07-20T05:35:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Elvira Zamora",
      "level": "Colaboradores",
      "area": "Finanzas",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 3,
      "LD2": 3,
      "LD3": 1,
      "LD4": 2,
      "LD5": 2,
      "LD6": 1,
      "LD7": 1,
      "LD8": 1,
      "LD9": 1,
      "LD10": 2,
      "LD11": 2,
      "LD12": 2,
      "LD13": 1,
      "LD14": 1,
      "LD15": 2,
      "LD16": 3,
      "LD17": 2,
      "LD18": 2,
      "LD19": 1,
      "LD20": 1,
      "LD21": 1,
      "LD22": 2,
      "LD23": 3,
      "LD24": 1,
      "LD25": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_035_deep_tcs",
    "timestamp": "2026-07-20T05:35:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Elvira Zamora",
      "level": "Colaboradores",
      "area": "Finanzas",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 3,
      "LT2": 3,
      "LT3": 4,
      "LT4": 3,
      "LT5": 4,
      "LT6": 4,
      "LT7": 3,
      "LT8": 2,
      "LT9": 3,
      "LT10": 4,
      "LT11": 4,
      "LT12": 4,
      "LT13": 2,
      "LT14": 1,
      "LT15": 1,
      "LT16": 3,
      "LT17": 3,
      "LT18": 3,
      "LT19": 1,
      "LT20": 1,
      "LT21": 1,
      "LT22": 4,
      "LT23": 3,
      "LT24": 4,
      "LT25": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_035_deep_eci",
    "timestamp": "2026-07-20T05:35:39.745656",
    "survey": "deep_eci",
    "meta": {
      "name": "Elvira Zamora",
      "level": "Colaboradores",
      "area": "Finanzas",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "EXD1": 3,
      "EXD2": 3,
      "EXD3": 4,
      "EXD4": 4,
      "EXD5": 2,
      "EXD6": 3,
      "EXD7": 4,
      "EXD8": 4,
      "EXD9": 4,
      "EXD10": 2,
      "EXD11": 3,
      "EXD12": 3,
      "EXD13": 1,
      "EXD14": 2,
      "EXD15": 2,
      "EXD16": 5,
      "EXD17": 4,
      "EXD18": 3,
      "EXD19": 2,
      "EXD20": 3,
      "EXD21": 2,
      "EXD22": 2,
      "EXD23": 3,
      "EXD24": 3,
      "EXD25": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_035_deep_aci",
    "timestamp": "2026-07-20T05:35:39.745656",
    "survey": "deep_aci",
    "meta": {
      "name": "Elvira Zamora",
      "level": "Colaboradores",
      "area": "Finanzas",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CH1": 1,
      "CH2": 2,
      "CH3": 2,
      "CH4": 3,
      "CH5": 3,
      "CH6": 3,
      "CH7": 3,
      "CH8": 3,
      "CH9": 2,
      "CH10": 1,
      "CH11": 1,
      "CH12": 1,
      "CH13": 3,
      "CH14": 3,
      "CH15": 3,
      "CH16": 3,
      "CH17": 1,
      "CH18": 3,
      "CH19": 2,
      "CH20": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_035_deep_cei",
    "timestamp": "2026-07-20T05:35:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Elvira Zamora",
      "level": "Colaboradores",
      "area": "Finanzas",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 1,
      "CU2": 1,
      "CU3": 2,
      "CU4": 2,
      "CU5": 2,
      "CU6": 2,
      "CU7": 1,
      "CU8": 1,
      "CU9": 1,
      "CU10": 1,
      "CU11": 1,
      "CU12": 1,
      "CU13": 1,
      "CU14": 1,
      "CU15": 1,
      "CU16": 1,
      "CU17": 1,
      "CU18": 1,
      "CU19": 1,
      "CU20": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_036_core",
    "timestamp": "2026-07-14T19:19:39.745656",
    "survey": "core",
    "meta": {
      "name": "Néstor Padilla",
      "level": "Colaboradores",
      "area": "RRHH",
      "country": "Nicaragua",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 2,
      "A2": 2,
      "A3": 1,
      "A4": 1,
      "A5": 2,
      "E1": 3,
      "E2": 3,
      "E3": 3,
      "E4": 3,
      "E5": 2,
      "E6": 3,
      "E7": 3,
      "L1": 3,
      "L2": 2,
      "L3": 2,
      "L4": 2,
      "L5": 2,
      "L6": 3,
      "R1": 4,
      "R2": 3,
      "R3": 4,
      "R4": 4,
      "C1": 3,
      "C2": 3,
      "C3": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_036_full",
    "timestamp": "2026-07-14T19:19:39.745656",
    "survey": "full",
    "meta": {
      "name": "Néstor Padilla",
      "level": "Colaboradores",
      "area": "RRHH",
      "country": "Nicaragua",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 2,
      "A2": 2,
      "A3": 1,
      "A4": 1,
      "A5": 2,
      "E1": 3,
      "E2": 3,
      "E3": 3,
      "E4": 3,
      "E5": 2,
      "E6": 3,
      "E7": 3,
      "L1": 3,
      "L2": 2,
      "L3": 2,
      "L4": 2,
      "L5": 2,
      "L6": 3,
      "R1": 4,
      "R2": 3,
      "R3": 4,
      "R4": 4,
      "C1": 3,
      "C2": 3,
      "C3": 2,
      "SA6": 1,
      "SA7": 2,
      "SA8": 3,
      "SA9": 2,
      "SA10": 3,
      "SA11": 2,
      "SA12": 2,
      "EX8": 4,
      "EX9": 5,
      "EX10": 5,
      "EX11": 4,
      "EX12": 5,
      "EX13": 5,
      "EX14": 4,
      "EX15": 5,
      "EX16": 5,
      "EX17": 5,
      "EX18": 5,
      "LE7": 2,
      "LE8": 2,
      "LE9": 1,
      "LE10": 2,
      "LE11": 2,
      "LE12": 1,
      "LE13": 1,
      "LE14": 3,
      "LE15": 3,
      "RC5": 4,
      "RC6": 5,
      "RC7": 4,
      "RC8": 3,
      "RC9": 4,
      "OC4": 2,
      "OC5": 3,
      "OC6": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_036_deep_lei",
    "timestamp": "2026-07-14T19:49:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Néstor Padilla",
      "level": "Colaboradores",
      "area": "RRHH",
      "country": "Nicaragua",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 2,
      "LD2": 2,
      "LD3": 2,
      "LD4": 1,
      "LD5": 1,
      "LD6": 1,
      "LD7": 2,
      "LD8": 2,
      "LD9": 2,
      "LD10": 5,
      "LD11": 4,
      "LD12": 4,
      "LD13": 2,
      "LD14": 3,
      "LD15": 2,
      "LD16": 1,
      "LD17": 1,
      "LD18": 1,
      "LD19": 2,
      "LD20": 3,
      "LD21": 3,
      "LD22": 2,
      "LD23": 3,
      "LD24": 2,
      "LD25": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_036_deep_tcs",
    "timestamp": "2026-07-14T19:49:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Néstor Padilla",
      "level": "Colaboradores",
      "area": "RRHH",
      "country": "Nicaragua",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 2,
      "LT2": 1,
      "LT3": 1,
      "LT4": 2,
      "LT5": 4,
      "LT6": 2,
      "LT7": 3,
      "LT8": 4,
      "LT9": 4,
      "LT10": 1,
      "LT11": 1,
      "LT12": 1,
      "LT13": 1,
      "LT14": 1,
      "LT15": 1,
      "LT16": 1,
      "LT17": 1,
      "LT18": 1,
      "LT19": 1,
      "LT20": 1,
      "LT21": 1,
      "LT22": 2,
      "LT23": 1,
      "LT24": 2,
      "LT25": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_036_deep_cei",
    "timestamp": "2026-07-14T19:49:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Néstor Padilla",
      "level": "Colaboradores",
      "area": "RRHH",
      "country": "Nicaragua",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 1,
      "CU2": 2,
      "CU3": 2,
      "CU4": 2,
      "CU5": 3,
      "CU6": 2,
      "CU7": 2,
      "CU8": 2,
      "CU9": 2,
      "CU10": 3,
      "CU11": 3,
      "CU12": 4,
      "CU13": 3,
      "CU14": 4,
      "CU15": 4,
      "CU16": 1,
      "CU17": 1,
      "CU18": 1,
      "CU19": 2,
      "CU20": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_037_core",
    "timestamp": "2026-07-16T16:05:39.745656",
    "survey": "core",
    "meta": {
      "name": "Josefina Arroyo",
      "level": "Colaboradores",
      "area": "Operaciones",
      "country": "Costa Rica",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 3,
      "A2": 5,
      "A3": 3,
      "A4": 3,
      "A5": 4,
      "E1": 4,
      "E2": 4,
      "E3": 5,
      "E4": 5,
      "E5": 5,
      "E6": 5,
      "E7": 5,
      "L1": 2,
      "L2": 1,
      "L3": 2,
      "L4": 1,
      "L5": 1,
      "L6": 1,
      "R1": 4,
      "R2": 3,
      "R3": 3,
      "R4": 2,
      "C1": 2,
      "C2": 2,
      "C3": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_037_full",
    "timestamp": "2026-07-16T16:05:39.745656",
    "survey": "full",
    "meta": {
      "name": "Josefina Arroyo",
      "level": "Colaboradores",
      "area": "Operaciones",
      "country": "Costa Rica",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 3,
      "A2": 5,
      "A3": 3,
      "A4": 3,
      "A5": 4,
      "E1": 4,
      "E2": 4,
      "E3": 5,
      "E4": 5,
      "E5": 5,
      "E6": 5,
      "E7": 5,
      "L1": 2,
      "L2": 1,
      "L3": 2,
      "L4": 1,
      "L5": 1,
      "L6": 1,
      "R1": 4,
      "R2": 3,
      "R3": 3,
      "R4": 2,
      "C1": 2,
      "C2": 2,
      "C3": 1,
      "SA6": 3,
      "SA7": 4,
      "SA8": 4,
      "SA9": 3,
      "SA10": 3,
      "SA11": 4,
      "SA12": 5,
      "EX8": 5,
      "EX9": 4,
      "EX10": 3,
      "EX11": 4,
      "EX12": 4,
      "EX13": 4,
      "EX14": 4,
      "EX15": 5,
      "EX16": 3,
      "EX17": 3,
      "EX18": 4,
      "LE7": 2,
      "LE8": 2,
      "LE9": 1,
      "LE10": 1,
      "LE11": 2,
      "LE12": 1,
      "LE13": 1,
      "LE14": 1,
      "LE15": 2,
      "RC5": 4,
      "RC6": 3,
      "RC7": 3,
      "RC8": 3,
      "RC9": 3,
      "OC4": 1,
      "OC5": 2,
      "OC6": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_037_deep_lei",
    "timestamp": "2026-07-16T16:35:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Josefina Arroyo",
      "level": "Colaboradores",
      "area": "Operaciones",
      "country": "Costa Rica",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 3,
      "LD2": 1,
      "LD3": 2,
      "LD4": 2,
      "LD5": 1,
      "LD6": 1,
      "LD7": 4,
      "LD8": 4,
      "LD9": 5,
      "LD10": 2,
      "LD11": 2,
      "LD12": 2,
      "LD13": 3,
      "LD14": 3,
      "LD15": 2,
      "LD16": 3,
      "LD17": 2,
      "LD18": 3,
      "LD19": 1,
      "LD20": 1,
      "LD21": 1,
      "LD22": 2,
      "LD23": 2,
      "LD24": 3,
      "LD25": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_037_deep_tcs",
    "timestamp": "2026-07-16T16:35:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Josefina Arroyo",
      "level": "Colaboradores",
      "area": "Operaciones",
      "country": "Costa Rica",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 1,
      "LT2": 2,
      "LT3": 2,
      "LT4": 3,
      "LT5": 3,
      "LT6": 3,
      "LT7": 3,
      "LT8": 3,
      "LT9": 2,
      "LT10": 1,
      "LT11": 2,
      "LT12": 2,
      "LT13": 2,
      "LT14": 2,
      "LT15": 2,
      "LT16": 1,
      "LT17": 1,
      "LT18": 1,
      "LT19": 1,
      "LT20": 1,
      "LT21": 1,
      "LT22": 3,
      "LT23": 3,
      "LT24": 2,
      "LT25": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_037_deep_aci",
    "timestamp": "2026-07-16T16:35:39.745656",
    "survey": "deep_aci",
    "meta": {
      "name": "Josefina Arroyo",
      "level": "Colaboradores",
      "area": "Operaciones",
      "country": "Costa Rica",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CH1": 4,
      "CH2": 4,
      "CH3": 4,
      "CH4": 2,
      "CH5": 2,
      "CH6": 3,
      "CH7": 3,
      "CH8": 3,
      "CH9": 3,
      "CH10": 3,
      "CH11": 3,
      "CH12": 3,
      "CH13": 1,
      "CH14": 2,
      "CH15": 2,
      "CH16": 3,
      "CH17": 3,
      "CH18": 4,
      "CH19": 4,
      "CH20": 4
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_037_deep_cei",
    "timestamp": "2026-07-16T16:35:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Josefina Arroyo",
      "level": "Colaboradores",
      "area": "Operaciones",
      "country": "Costa Rica",
      "bu": "División Transporte",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 2,
      "CU2": 3,
      "CU3": 4,
      "CU4": 3,
      "CU5": 2,
      "CU6": 3,
      "CU7": 1,
      "CU8": 2,
      "CU9": 3,
      "CU10": 3,
      "CU11": 2,
      "CU12": 2,
      "CU13": 3,
      "CU14": 3,
      "CU15": 3,
      "CU16": 1,
      "CU17": 2,
      "CU18": 2,
      "CU19": 2,
      "CU20": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_038_core",
    "timestamp": "2026-07-15T21:47:39.745656",
    "survey": "core",
    "meta": {
      "name": "Adolfo Villanueva",
      "level": "Colaboradores",
      "area": "Transporte",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 3,
      "A2": 3,
      "A3": 1,
      "A4": 3,
      "A5": 3,
      "E1": 4,
      "E2": 4,
      "E3": 4,
      "E4": 3,
      "E5": 4,
      "E6": 5,
      "E7": 5,
      "L1": 1,
      "L2": 1,
      "L3": 1,
      "L4": 1,
      "L5": 1,
      "L6": 1,
      "R1": 3,
      "R2": 3,
      "R3": 2,
      "R4": 4,
      "C1": 1,
      "C2": 2,
      "C3": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_038_full",
    "timestamp": "2026-07-15T21:47:39.745656",
    "survey": "full",
    "meta": {
      "name": "Adolfo Villanueva",
      "level": "Colaboradores",
      "area": "Transporte",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 3,
      "A2": 3,
      "A3": 1,
      "A4": 3,
      "A5": 3,
      "E1": 4,
      "E2": 4,
      "E3": 4,
      "E4": 3,
      "E5": 4,
      "E6": 5,
      "E7": 5,
      "L1": 1,
      "L2": 1,
      "L3": 1,
      "L4": 1,
      "L5": 1,
      "L6": 1,
      "R1": 3,
      "R2": 3,
      "R3": 2,
      "R4": 4,
      "C1": 1,
      "C2": 2,
      "C3": 1,
      "SA6": 4,
      "SA7": 3,
      "SA8": 3,
      "SA9": 3,
      "SA10": 4,
      "SA11": 3,
      "SA12": 2,
      "EX8": 5,
      "EX9": 5,
      "EX10": 4,
      "EX11": 4,
      "EX12": 4,
      "EX13": 4,
      "EX14": 4,
      "EX15": 4,
      "EX16": 4,
      "EX17": 4,
      "EX18": 5,
      "LE7": 4,
      "LE8": 4,
      "LE9": 5,
      "LE10": 5,
      "LE11": 5,
      "LE12": 4,
      "LE13": 4,
      "LE14": 4,
      "LE15": 5,
      "RC5": 2,
      "RC6": 2,
      "RC7": 4,
      "RC8": 3,
      "RC9": 3,
      "OC4": 2,
      "OC5": 3,
      "OC6": 4
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_038_deep_lei",
    "timestamp": "2026-07-15T22:17:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Adolfo Villanueva",
      "level": "Colaboradores",
      "area": "Transporte",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 2,
      "LD2": 2,
      "LD3": 2,
      "LD4": 2,
      "LD5": 3,
      "LD6": 3,
      "LD7": 2,
      "LD8": 2,
      "LD9": 2,
      "LD10": 2,
      "LD11": 2,
      "LD12": 2,
      "LD13": 2,
      "LD14": 1,
      "LD15": 1,
      "LD16": 1,
      "LD17": 1,
      "LD18": 1,
      "LD19": 1,
      "LD20": 1,
      "LD21": 1,
      "LD22": 1,
      "LD23": 2,
      "LD24": 1,
      "LD25": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_038_deep_tcs",
    "timestamp": "2026-07-15T22:17:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Adolfo Villanueva",
      "level": "Colaboradores",
      "area": "Transporte",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 2,
      "LT2": 3,
      "LT3": 2,
      "LT4": 2,
      "LT5": 2,
      "LT6": 1,
      "LT7": 2,
      "LT8": 2,
      "LT9": 1,
      "LT10": 3,
      "LT11": 3,
      "LT12": 4,
      "LT13": 2,
      "LT14": 1,
      "LT15": 1,
      "LT16": 1,
      "LT17": 1,
      "LT18": 1,
      "LT19": 1,
      "LT20": 1,
      "LT21": 1,
      "LT22": 4,
      "LT23": 3,
      "LT24": 4,
      "LT25": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_038_deep_aci",
    "timestamp": "2026-07-15T22:17:39.745656",
    "survey": "deep_aci",
    "meta": {
      "name": "Adolfo Villanueva",
      "level": "Colaboradores",
      "area": "Transporte",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CH1": 3,
      "CH2": 2,
      "CH3": 3,
      "CH4": 2,
      "CH5": 2,
      "CH6": 3,
      "CH7": 2,
      "CH8": 1,
      "CH9": 1,
      "CH10": 1,
      "CH11": 1,
      "CH12": 1,
      "CH13": 2,
      "CH14": 2,
      "CH15": 2,
      "CH16": 2,
      "CH17": 2,
      "CH18": 2,
      "CH19": 1,
      "CH20": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_038_deep_cei",
    "timestamp": "2026-07-15T22:17:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Adolfo Villanueva",
      "level": "Colaboradores",
      "area": "Transporte",
      "country": "Nicaragua",
      "bu": "Corporativo",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 2,
      "CU2": 2,
      "CU3": 2,
      "CU4": 2,
      "CU5": 1,
      "CU6": 2,
      "CU7": 3,
      "CU8": 2,
      "CU9": 2,
      "CU10": 1,
      "CU11": 1,
      "CU12": 1,
      "CU13": 3,
      "CU14": 4,
      "CU15": 4,
      "CU16": 1,
      "CU17": 2,
      "CU18": 1,
      "CU19": 1,
      "CU20": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_039_core",
    "timestamp": "2026-07-20T14:40:39.745656",
    "survey": "core",
    "meta": {
      "name": "Concepción Luna",
      "level": "Colaboradores",
      "area": "Finanzas",
      "country": "Nicaragua",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 4,
      "A2": 5,
      "A3": 3,
      "A4": 4,
      "A5": 4,
      "E1": 2,
      "E2": 3,
      "E3": 3,
      "E4": 3,
      "E5": 4,
      "E6": 3,
      "E7": 3,
      "L1": 1,
      "L2": 3,
      "L3": 1,
      "L4": 2,
      "L5": 1,
      "L6": 3,
      "R1": 3,
      "R2": 2,
      "R3": 1,
      "R4": 2,
      "C1": 3,
      "C2": 3,
      "C3": 2
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_039_full",
    "timestamp": "2026-07-20T14:40:39.745656",
    "survey": "full",
    "meta": {
      "name": "Concepción Luna",
      "level": "Colaboradores",
      "area": "Finanzas",
      "country": "Nicaragua",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "A1": 4,
      "A2": 5,
      "A3": 3,
      "A4": 4,
      "A5": 4,
      "E1": 2,
      "E2": 3,
      "E3": 3,
      "E4": 3,
      "E5": 4,
      "E6": 3,
      "E7": 3,
      "L1": 1,
      "L2": 3,
      "L3": 1,
      "L4": 2,
      "L5": 1,
      "L6": 3,
      "R1": 3,
      "R2": 2,
      "R3": 1,
      "R4": 2,
      "C1": 3,
      "C2": 3,
      "C3": 2,
      "SA6": 2,
      "SA7": 1,
      "SA8": 3,
      "SA9": 2,
      "SA10": 2,
      "SA11": 1,
      "SA12": 2,
      "EX8": 4,
      "EX9": 3,
      "EX10": 4,
      "EX11": 5,
      "EX12": 4,
      "EX13": 4,
      "EX14": 4,
      "EX15": 4,
      "EX16": 4,
      "EX17": 4,
      "EX18": 4,
      "LE7": 2,
      "LE8": 2,
      "LE9": 1,
      "LE10": 1,
      "LE11": 1,
      "LE12": 2,
      "LE13": 2,
      "LE14": 2,
      "LE15": 2,
      "RC5": 2,
      "RC6": 2,
      "RC7": 1,
      "RC8": 1,
      "RC9": 3,
      "OC4": 4,
      "OC5": 3,
      "OC6": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_039_deep_lei",
    "timestamp": "2026-07-20T15:10:39.745656",
    "survey": "deep_lei",
    "meta": {
      "name": "Concepción Luna",
      "level": "Colaboradores",
      "area": "Finanzas",
      "country": "Nicaragua",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LD1": 2,
      "LD2": 1,
      "LD3": 1,
      "LD4": 4,
      "LD5": 3,
      "LD6": 2,
      "LD7": 1,
      "LD8": 1,
      "LD9": 2,
      "LD10": 2,
      "LD11": 2,
      "LD12": 1,
      "LD13": 2,
      "LD14": 1,
      "LD15": 3,
      "LD16": 1,
      "LD17": 1,
      "LD18": 1,
      "LD19": 2,
      "LD20": 1,
      "LD21": 1,
      "LD22": 2,
      "LD23": 1,
      "LD24": 1,
      "LD25": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_039_deep_tcs",
    "timestamp": "2026-07-20T15:10:39.745656",
    "survey": "deep_tcs",
    "meta": {
      "name": "Concepción Luna",
      "level": "Colaboradores",
      "area": "Finanzas",
      "country": "Nicaragua",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "LT1": 4,
      "LT2": 1,
      "LT3": 3,
      "LT4": 2,
      "LT5": 2,
      "LT6": 2,
      "LT7": 1,
      "LT8": 2,
      "LT9": 1,
      "LT10": 2,
      "LT11": 2,
      "LT12": 2,
      "LT13": 1,
      "LT14": 2,
      "LT15": 2,
      "LT16": 2,
      "LT17": 2,
      "LT18": 2,
      "LT19": 3,
      "LT20": 2,
      "LT21": 3,
      "LT22": 1,
      "LT23": 1,
      "LT24": 1,
      "LT25": 1
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_039_deep_aci",
    "timestamp": "2026-07-20T15:10:39.745656",
    "survey": "deep_aci",
    "meta": {
      "name": "Concepción Luna",
      "level": "Colaboradores",
      "area": "Finanzas",
      "country": "Nicaragua",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CH1": 2,
      "CH2": 1,
      "CH3": 1,
      "CH4": 3,
      "CH5": 4,
      "CH6": 3,
      "CH7": 2,
      "CH8": 2,
      "CH9": 3,
      "CH10": 1,
      "CH11": 2,
      "CH12": 1,
      "CH13": 2,
      "CH14": 3,
      "CH15": 2,
      "CH16": 3,
      "CH17": 2,
      "CH18": 3,
      "CH19": 2,
      "CH20": 3
    },
    "engagement_code": "logipro2026"
  },
  {
    "id": "DEMO_Col_039_deep_cei",
    "timestamp": "2026-07-20T15:10:39.745656",
    "survey": "deep_cei",
    "meta": {
      "name": "Concepción Luna",
      "level": "Colaboradores",
      "area": "Finanzas",
      "country": "Nicaragua",
      "bu": "División Almacén",
      "company": "LogiPro 3PL S.A."
    },
    "answers": {
      "CU1": 1,
      "CU2": 1,
      "CU3": 1,
      "CU4": 3,
      "CU5": 3,
      "CU6": 3,
      "CU7": 2,
      "CU8": 1,
      "CU9": 2,
      "CU10": 2,
      "CU11": 3,
      "CU12": 1,
      "CU13": 1,
      "CU14": 1,
      "CU15": 1,
      "CU16": 1,
      "CU17": 1,
      "CU18": 1,
      "CU19": 1,
      "CU20": 1
    },
    "engagement_code": "logipro2026"
  }
];
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
function barHTML(dims, scores) {
  var bars = dims.map(function(d) {
    var sc = scores.dimScores[d.id];
    var m = sc != null ? getM(sc) : null;
    var meta = DIM_META[d.id];
    var pct = sc != null ? (sc / 5 * 100).toFixed(1) : 0;
    return '<div style="margin-bottom:10px">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">' +
        '<span style="font-size:11px;color:' + CHARCOAL + ';font-weight:600">' + meta.es + ' <span style="color:#999;font-weight:400;font-size:10px">/ ' + meta.en + '</span></span>' +
        '<span style="font-size:13px;font-weight:700;color:' + (m ? m.color : MUTED) + '">' + (sc != null ? sc.toFixed(2) : '—') + '</span>' +
      '</div>' +
      '<div style="background:#E5E7EB;border-radius:99px;height:8px;overflow:hidden">' +
        '<div style="width:' + pct + '%;height:100%;background:' + (m ? m.color : '#ccc') + ';border-radius:99px;transition:width 0.4s"></div>' +
      '</div>' +
    '</div>';
  }).join('');
  return bars;
}

// ── PAI table ─────────────────────────────────────────────────────────────────
function paiTableHTML(dims, scores) {
  var rows = dims.map(function(d) {
    var p = scores.paiByDim[d.id];
    var meta = DIM_META[d.id];
    var band = p && p.gap != null ? getPAI(p.gap) : null;
    return '<tr style="border-bottom:1px solid #F3F4F6">' +
      '<td style="padding:8px 10px;font-size:12px;color:' + CHARCOAL + ';font-weight:600">' + meta.es + '</td>' +
      '<td style="padding:8px 10px;text-align:center;font-size:12px;color:' + meta.color + ';font-weight:700">' + (p && p.ls != null ? p.ls.toFixed(2) : '—') + '</td>' +
      '<td style="padding:8px 10px;text-align:center;font-size:12px;color:' + MUTED + '">' + (p && p.os != null ? p.os.toFixed(2) : '—') + '</td>' +
      '<td style="padding:8px 10px;text-align:center;font-size:13px;font-weight:700;color:' + (band ? band.color : MUTED) + '">' + (p && p.gap != null ? p.gap.toFixed(2) : '—') + '</td>' +
      '<td style="padding:8px 10px;text-align:center"><span style="font-size:9px;font-weight:700;background:' + (band ? band.color : MUTED) + '22;color:' + (band ? band.color : MUTED) + ';padding:2px 8px;border-radius:99px">' + (band ? band.es : '—') + '</span></td>' +
    '</tr>';
  }).join('');
  return '<table style="width:100%;border-collapse:collapse">' +
    '<thead><tr style="background:#F9F9F7">' +
      '<th style="padding:8px 10px;text-align:left;font-size:10px;color:' + MUTED + ';text-transform:uppercase;letter-spacing:0.06em">Dimensión</th>' +
      '<th style="padding:8px 10px;text-align:center;font-size:10px;color:' + MUTED + ';text-transform:uppercase;letter-spacing:0.06em">Liderazgo</th>' +
      '<th style="padding:8px 10px;text-align:center;font-size:10px;color:' + MUTED + ';text-transform:uppercase;letter-spacing:0.06em">Organización</th>' +
      '<th style="padding:8px 10px;text-align:center;font-size:10px;color:' + MUTED + ';text-transform:uppercase;letter-spacing:0.06em">GAP</th>' +
      '<th style="padding:8px 10px;text-align:center;font-size:10px;color:' + MUTED + ';text-transform:uppercase;letter-spacing:0.06em">Estado</th>' +
    '</tr></thead><tbody>' + rows + '</tbody></table>';
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
// ── Main report generator ─────────────────────────────────────────────────────
var LOGO_B64 = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODU4IiBoZWlnaHQ9IjEyOSIgdmlld0JveD0iMCAwIDg1OCAxMjkiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xMTguMTk1IDU0LjgxNzRMOTkuNDA4MyAzNi4wMzA4TDg3LjYwMDMgNDguNDQzM0wxMDkuMTg5IDQ4LjY1MDhMMTAxLjA2MyA2MC4xNzE5TDgwLjAzNTcgNTkuOTcwNEw3Ni44MzAzIDU5LjkzOTlMNjYuNDgxNSA1OS44NDIyVjI0LjI4MzlMNzcuNDUzIDE2LjczMTRWMzguMzQ0OEw4OS44Nzc3IDI2LjUwMDJMNzEuMTgyNyA3LjgwNTI0QzY2LjEwOTEgMi43MzE1OSA1Ny44OTExIDIuNzMxNTkgNTIuODE3NCA3LjgwNTI0TDM0LjAzMDkgMjYuNTkxOEw0Ni40NDMzIDM4LjM5OThMNDYuNjUwOSAxNi44MTA4TDU4LjE3MTkgMjQuOTM3Mkw1Ny45NzA0IDQ1Ljk2NDRMNTcuOTM5OSA0OS4xNjk4TDU3Ljg0MjIgNTkuNTE4NkgyMi4yODM5TDE0LjczMTQgNDguNTQ3SDM2LjM0NDhMMjQuNTAwMiAzNi4xMjI0TDUuODA1MjQgNTQuODE3NEMwLjczMTU4NyA1OS44OTEgMC43MzE1ODcgNjguMTE1MSA1LjgwNTI0IDczLjE4MjZMMjQuNTkxOCA5MS45NjkyTDM2LjM5OTggNzkuNTU2N0wxNC44MTA4IDc5LjM0OTJMMjIuOTM3MiA2Ny44MjgxTDQzLjk2NDUgNjguMDI5Nkw0Ny4xNjk5IDY4LjA2MDFMNTcuNTE4NiA2OC4xNTc4VjEwMy43MTZMNDYuNTQ3MSAxMTEuMjY5Vjg5LjY1NTJMMzQuMTIyNSAxMDEuNUw1Mi44MTc0IDEyMC4xOTVDNTcuODkxMSAxMjUuMjY4IDY2LjEwOTEgMTI1LjI2OCA3MS4xODI3IDEyMC4xOTVMODkuOTY5MiAxMDEuNDA4TDc3LjU1NjggODkuNjAwMkw3Ny4zNDkyIDExMS4xODlMNjUuODI4MiAxMDMuMDYzTDY2LjAyOTcgODIuMDM1Nkw2Ni4wNjAyIDc4LjgzMDJMNjYuMTU3OSA2OC40ODE0SDEwMS43MTZMMTA5LjI2OSA3OS40NTNIODcuNjU1M0w5OS40OTk5IDkxLjg3NzZMMTE4LjE5NSA3My4xODI2QzEyMy4yNjkgNjguMTA5IDEyMy4yNjkgNTkuODkxIDExOC4xOTUgNTQuODE3NFoiIGZpbGw9IiNGN0YwRUQiLz4KPHBhdGggZD0iTTE3My45NzcgNzMuMTlDMTcyLjcwMSA3My4xOSAxNzEuNDI1IDczLjE5IDE3MC4xNDkgNzMuMTlDMTY4Ljg3MyA3My4xOSAxNjcuNzM4IDczLjA0ODIgMTY2LjYwNCA3Mi45MDY1VjEwNC4wOThIMTUyVjI0LjI3NTlIMTc1LjExMUMxNzguOTM5IDI0LjI3NTkgMTgyLjM0MiAyNC40MTc3IDE4NS4xNzggMjQuODQzQzE4OC4wMTQgMjUuMjY4NCAxOTAuNzA4IDI1LjY5MzcgMTkyLjk3NiAyNi40MDI2QzE5OC4zNjQgMjguMTAzOSAyMDIuNjE4IDMwLjc5NzggMjA1LjU5NSAzNC4zNDIzQzIwOC41NzMgMzguMDI4NiAyMDkuOTkxIDQyLjcwNzMgMjA5Ljk5MSA0OC4zNzg1QzIwOS45OTEgNTIuMjA2NiAyMDkuMTQgNTUuNzUxMSAyMDcuNTggNTguNzI4NEMyMDYuMDIxIDYxLjg0NzYgMjAzLjYxIDY0LjM5OTYgMjAwLjYzMyA2Ni41MjYzQzE5Ny41MTMgNjguNjUzIDE5My44MjcgNzAuMzU0NCAxODkuNDMyIDcxLjQ4ODdDMTg0Ljg5NCA3Mi42MjI5IDE3OS43OSA3My4xOSAxNzMuOTc3IDczLjE5Wk0xNjYuNjA0IDYwLjU3MTZDMTY3LjQ1NSA2MC43MTM0IDE2OC40NDcgNjAuNzEzNCAxNjkuODY1IDYwLjg1NTFDMTcxLjE0MSA2MC44NTUxIDE3Mi41NTkgNjAuOTk3IDE3My44MzUgNjAuOTk3QzE3Ny44MDUgNjAuOTk3IDE4MS4wNjYgNjAuNzEzNCAxODMuNzYgNjAuMDA0NUMxODYuNDU0IDU5LjQzNzQgMTg4LjU4MSA1OC40NDQ5IDE5MC4xNDEgNTcuMzEwNkMxOTEuODQyIDU2LjE3NjQgMTkyLjk3NiA1NC43NTg2IDE5My42ODUgNTMuMTk5MUMxOTQuMzk0IDUxLjYzOTUgMTk0LjgxOSA0OS43OTYzIDE5NC44MTkgNDcuOTUzMkMxOTQuODE5IDQ1LjU0MjkgMTk0LjI1MiA0My41NTggMTkzLjI2IDQxLjg1NjdDMTkyLjEyNiA0MC4xNTUzIDE5MC4yODIgMzguODc5MyAxODcuNTg4IDM3Ljg4NjhDMTg2LjE3MSAzNy40NjE1IDE4NC40NjkgMzcuMDM2MSAxODIuNDg0IDM2Ljg5NDNDMTgwLjQ5OSAzNi42MTA4IDE3Ny45NDcgMzYuNjEwOCAxNzQuOTY5IDM2LjYxMDhIMTY2Ljc0NlY2MC41NzE2SDE2Ni42MDRaIiBmaWxsPSIjRjdGMEVEIi8+CjxwYXRoIGQ9Ik0yNzcuMTk3IDQ4LjIzN0MyNzcuMTk3IDUzLjc2NjQgMjc1LjYzOCA1OC41ODcgMjcyLjUxOSA2Mi40MTVDMjY5LjM5OSA2Ni4yNDMxIDI2NC43MiA2OS4yMjA0IDI1OC4xOTggNzEuMDYzNlY3MS4zNDcyTDI4Mi4wMTggMTA0LjI0SDI2NC40MzdMMjQyLjc0MyA3My4zMzIxSDIzMi42NzdWMTA0LjI0SDIxOC4wNzNWMjQuNDE4SDI0Mi4zMThDMjQ2LjI4OCAyNC40MTggMjUwLjExNiAyNC43MDE1IDI1My41MTkgMjUuMTI2OUMyNTYuOTIyIDI1LjU1MjIgMjU5LjkgMjYuMjYxMSAyNjIuNDUyIDI3LjI1MzZDMjY3LjEzMSAyOS4wOTY3IDI3MC44MTcgMzEuNjQ4NyAyNzMuMzY5IDM1LjE5MzJDMjc1LjkyMSAzOC40NTQyIDI3Ny4xOTcgNDIuOTkxMiAyNzcuMTk3IDQ4LjIzN1pNMjM5LjkwOCA2MC45OTcyQzI0My4zMTEgNjAuOTk3MiAyNDYuMTQ2IDYwLjg1NTUgMjQ4LjQxNSA2MC41NzE5QzI1MC42ODMgNjAuMjg4MyAyNTIuNjY4IDU5Ljg2MyAyNTQuMjI4IDU5LjI5NTlDMjU3LjIwNiA1OC4xNjE2IDI1OS4xOTEgNTYuNjAyIDI2MC4zMjUgNTQuNzU4OUMyNjEuNDU5IDUyLjc3MzkgMjYyLjAyNiA1MC42NDcyIDI2Mi4wMjYgNDguMDk1MkMyNjIuMDI2IDQ1Ljk2ODUgMjYxLjYwMSA0My45ODM2IDI2MC43NSA0Mi40MjRDMjU5LjkgNDAuNzIyNiAyNTguMzQgMzkuNDQ2NiAyNTYuMjEzIDM4LjQ1NDJDMjU0Ljc5NSAzNy43NDUzIDI1My4wOTQgMzcuMzE5OSAyNTAuOTY3IDM3LjAzNjRDMjQ4Ljg0IDM2Ljc1MjggMjQ2LjI4OCAzNi42MTEgMjQzLjE2OSAzNi42MTFIMjMyLjY3N1Y2MS4xMzlIMjM5LjkwOFY2MC45OTcyWiIgZmlsbD0iI0Y3RjBFRCIvPgo8cGF0aCBkPSJNMzYxLjg0MyA2NC4yNThDMzYxLjg0MyA3MC4zNTQ1IDM2MC45OTIgNzUuODgzOSAzNTkuMjkxIDgwLjk4OEMzNTcuNTkgODYuMDkyMSAzNTUuMDM3IDkwLjQ4NzMgMzUxLjc3NiA5NC4wMzE4QzM0OC41MTUgOTcuNzE4MSAzNDQuNDAzIDEwMC41NTQgMzM5LjU4MyAxMDIuNTM5QzMzNC43NjIgMTA0LjUyNCAzMjkuMjMyIDEwNS41MTYgMzIzLjEzNSAxMDUuNTE2QzMxNi44OTcgMTA1LjUxNiAzMTEuNTA5IDEwNC41MjQgMzA2LjY4OCAxMDIuNTM5QzMwMS44NjcgMTAwLjU1NCAyOTcuNzU2IDk3LjcxODEgMjk0LjQ5NSA5NC4wMzE4QzI5MS4yMzMgOTAuMzQ1NSAyODguNjgxIDg1Ljk1MDMgMjg2Ljk4IDgwLjk4OEMyODUuMjc4IDc1Ljg4MzkgMjg0LjQyOCA3MC4zNTQ1IDI4NC40MjggNjQuMjU4QzI4NC40MjggNTguMTYxNCAyODUuMjc4IDUyLjYzMiAyODYuOTggNDcuNTI3OUMyODguNjgxIDQyLjQyMzkgMjkxLjIzMyAzOC4wMjg3IDI5NC40OTUgMzQuNDg0MkMyOTcuNzU2IDMwLjc5NzkgMzAxLjg2NyAyNy45NjIzIDMwNi42ODggMjUuOTc3M0MzMTEuNTA5IDIzLjk5MjQgMzE3LjAzOSAyMyAzMjMuMTM1IDIzQzMyOS4zNzQgMjMgMzM0Ljc2MiAyMy45OTI0IDMzOS41ODMgMjUuOTc3M0MzNDQuNDAzIDI3Ljk2MjMgMzQ4LjUxNSAzMC43OTc5IDM1MS43NzYgMzQuNDg0MkMzNTUuMDM3IDM4LjE3MDQgMzU3LjU5IDQyLjU2NTYgMzU5LjI5MSA0Ny41Mjc5QzM2MC45OTIgNTIuNDkwMyAzNjEuODQzIDU4LjE2MTQgMzYxLjg0MyA2NC4yNThaTTM0Ni42NzIgNjQuMjU4QzM0Ni42NzIgNTkuNDM3NSAzNDYuMTA1IDU1LjE4NDEgMzQ0LjgyOSA1MS40OTc4QzM0My42OTUgNDcuODExNSAzNDEuOTkzIDQ0LjgzNDEgMzM5Ljg2NiA0Mi40MjM4QzMzNy43MzkgNDAuMDEzNSAzMzUuMTg3IDM4LjE3MDQgMzMyLjM1MiAzNy4wMzYyQzMyOS4zNzQgMzUuOTAxOSAzMjYuMjU1IDM1LjE5MzEgMzIyLjg1MiAzNS4xOTMxQzMxOS40NDkgMzUuMTkzMSAzMTYuMTg4IDM1Ljc2MDIgMzEzLjM1MiAzNy4wMzYyQzMxMC4zNzUgMzguMTcwNCAzMDcuOTY0IDQwLjAxMzUgMzA1LjgzOCA0Mi40MjM4QzMwMy43MTEgNDQuODM0MSAzMDIuMDA5IDQ3Ljk1MzMgMzAwLjg3NSA1MS40OTc4QzI5OS43NDEgNTUuMTg0MSAyOTkuMDMyIDU5LjQzNzUgMjk5LjAzMiA2NC4yNThDMjk5LjAzMiA2OS4wNzg1IDI5OS41OTkgNzMuMzMxOSAzMDAuODc1IDc3LjAxODJDMzAyLjAwOSA4MC43MDQ1IDMwMy43MTEgODMuNjgxOSAzMDUuODM4IDg2LjA5MjJDMzA3Ljk2NCA4OC41MDI0IDMxMC41MTYgOTAuMzQ1NiAzMTMuMzUyIDkxLjQ3OThDMzE2LjE4OCA5Mi43NTU4IDMxOS40NDkgOTMuMzIyOSAzMjIuODUyIDkzLjMyMjlDMzI2LjI1NSA5My4zMjI5IDMyOS41MTYgOTIuNzU1OCAzMzIuMzUyIDkxLjQ3OThDMzM1LjE4NyA5MC4yMDM4IDMzNy43MzkgODguNTAyNCAzMzkuODY2IDg2LjA5MjJDMzQxLjk5MyA4My42ODE5IDM0My42OTUgODAuNzA0NSAzNDQuODI5IDc3LjAxODJDMzQ2LjEwNSA3My4zMzE5IDM0Ni42NzIgNjkuMDc4NSAzNDYuNjcyIDY0LjI1OFoiIGZpbGw9IiNGN0YwRUQiLz4KPHBhdGggZD0iTTQxMS4wNDMgODIuNjg5MkM0MTIuNzQ1IDc2LjQ1MDkgNDE1LjAxMyA2OS42NDU1IDQxNy41NjUgNjIuNDE0N0w0MzEuMzE5IDI0LjEzNEg0NTEuODc4VjEwMy45NTZINDM3LjI3NFY2My40MDcxQzQzNy4yNzQgNTcuNDUyNCA0MzcuNTU3IDUwLjY0NjkgNDM3Ljk4MyA0Mi43MDcySDQzNy40MTVDNDM2LjcwNiA0NC45NzU3IDQzNS45OTggNDcuNTI3NyA0MzUuMDA1IDUwLjM2MzNDNDM0LjE1NCA1My4xOTkgNDMzLjE2MiA1Ni4wMzQ1IDQzMi4xNjkgNTguNzI4M0w0MTUuNTggMTAzLjgxNEg0MDYuMDgxTDM4OS40OTIgNTguNzI4M0MzODguNDk5IDU2LjAzNDUgMzg3LjUwNyA1My4xOTkgMzg2LjY1NiA1MC4zNjMzQzM4NS44MDUgNDcuNTI3NyAzODQuOTU0IDQ0Ljk3NTcgMzg0LjI0NSA0Mi43MDcySDM4My42NzhDMzg0LjEwNCA1MC4wNzk4IDM4NC4zODcgNTYuODg1MiAzODQuMzg3IDYzLjI2NTNWMTAzLjgxNEgzNjkuNzgzVjIzLjk5MjJIMzkwLjJMNDAzLjk1NCA2MS45ODkzQzQwNi4yMjIgNjguMzY5NCA0MDguNDkxIDc1LjE3NDggNDEwLjQ3NiA4Mi40MDU2SDQxMS4wNDNWODIuNjg5MloiIGZpbGw9IiNGN0YwRUQiLz4KPHBhdGggZD0iTTQ5Ni42ODMgMTA1LjY1OEM0OTIuNTcxIDEwNS42NTggNDg4Ljc0MyAxMDUuMjMyIDQ4NS4zNCAxMDQuMzgyQzQ4MS45MzcgMTAzLjUzMSA0NzkuMTAxIDEwMi4zOTcgNDc2LjU0OSAxMDAuODM3QzQ3My45OTcgOTkuMjc3NyA0NzEuODcgOTcuNDM0NiA0NzAuMDI3IDk1LjE2NjFDNDY4LjE4NCA5Mi44OTc2IDQ2Ni43NjYgOTAuNDg3NCA0NjUuNzczIDg3LjY1MThDNDY0LjkyMyA4NS4zODMzIDQ2NC4yMTQgODIuOTczIDQ2My45MyA4MC4yNzkyQzQ2My41MDUgNzcuNTg1NCA0NjMuMzYzIDc0LjYwOCA0NjMuMzYzIDcxLjIwNTNWMjQuMTM0M0g0NzcuOTY3VjY5LjkyOTNDNDc3Ljk2NyA3NS42MDA1IDQ3OC42NzYgNzkuOTk1NiA0NzkuOTUyIDgzLjExNDhDNDgxLjUxMiA4Ni42NTkzIDQ4My42MzkgODkuMjExNCA0ODYuNjE2IDkwLjc3MUM0ODkuNDUyIDkyLjMzMDUgNDkyLjk5NiA5My4xODEyIDQ5Ni44MjUgOTMuMTgxMkM1MDAuNzk1IDkzLjE4MTIgNTA0LjE5OCA5Mi4zMzA1IDUwNy4wMzMgOTAuNzcxQzUwOS44NjkgODkuMjExNCA1MTIuMTM4IDg2LjY1OTMgNTEzLjY5NyA4My4xMTQ4QzUxNS4xMTUgNzkuOTk1NiA1MTUuNjgyIDc1LjQ1ODcgNTE1LjY4MiA2OS45MjkzVjI0LjEzNDNINTMwLjI4NlY3MS4yMDUzQzUzMC4yODYgNzQuNjA4IDUzMC4xNDQgNzcuNTg1NCA1MjkuNzE5IDgwLjI3OTJDNTI5LjI5NCA4Mi45NzMgNTI4LjcyNyA4NS41MjUxIDUyNy44NzYgODcuNjUxOEM1MjYuNzQyIDkwLjQ4NzQgNTI1LjMyNCA5Mi44OTc2IDUyMy40ODEgOTUuMTY2MUM1MjEuNjM3IDk3LjQzNDYgNTE5LjUxMSA5OS4yNzc3IDUxNi44MTcgMTAwLjgzN0M1MTQuMjY0IDEwMi4zOTcgNTExLjE0NSAxMDMuNTMxIDUwNy44ODQgMTA0LjM4MkM1MDQuNjIzIDEwNS4yMzIgNTAwLjkzNiAxMDUuNjU4IDQ5Ni42ODMgMTA1LjY1OFoiIGZpbGw9IiNGN0YwRUQiLz4KPHBhdGggZD0iTTU4My41OTcgNjEuNDIyM0M1ODkuMjY5IDY5LjY0NTUgNTkzLjk0OCA3Ni44NzYzIDU5Ny42MzQgODMuMTE0Nkg1OTguMDZDNTk3LjYzNCA3Mi43NjQ3IDU5Ny4zNTEgNjUuMTA4NiA1OTcuMzUxIDYwLjQyOThWMjQuMjc1OUg2MTEuOTU1VjEwNC4wOThINTk2LjY0Mkw1NzAuNTUzIDY3LjM3NzFDNTY2LjAxNiA2MC45OTcgNTYxLjE5NSA1My42MjQ0IDU1Ni4zNzQgNDUuMjU5M0g1NTUuODA3QzU1Ni4yMzMgNTUuMDQyMiA1NTYuNTE2IDYyLjY5ODMgNTU2LjUxNiA2Ny45NDQxVjEwNC4wOThINTQxLjkxMlYyNC4yNzU5SDU1Ny4yMjVMNTgzLjU5NyA2MS40MjIzWiIgZmlsbD0iI0Y3RjBFRCIvPgo8cGF0aCBkPSJNNjIzLjU4MiAxMDQuMDk4VjI0LjI3NTlINjQ0LjcwOEM2NDYuNTUxIDI0LjI3NTkgNjQ4LjUzNiAyNC4yNzU5IDY1MC4zNzkgMjQuNDE3N0M2NTIuMzY0IDI0LjU1OTUgNjU0LjIwOCAyNC43MDEyIDY1Ni4wNTEgMjQuOTg0OEM2NTcuODk0IDI1LjI2ODMgNjU5LjU5NiAyNS41NTIgNjYxLjI5NyAyNS44MzU1QzY2Mi45OTggMjYuMTE5MSA2NjQuNTU4IDI2LjU0NDQgNjY1Ljk3NiAyNy4xMTE1QzY3MC4yMyAyOC41MjkzIDY3NC4wNTggMzAuMjMwNyA2NzcuMzE5IDMyLjY0MDlDNjgwLjU4IDM0LjkwOTQgNjgzLjI3NCAzNy43NDUgNjg1LjU0MyA0MC44NjQyQzY4Ny44MTEgNDMuOTgzMyA2ODkuMzcxIDQ3LjUyNzkgNjkwLjUwNSA1MS4zNTU5QzY5MS42MzkgNTUuMTg0IDY5Mi4yMDYgNTkuNDM3NCA2OTIuMjA2IDYzLjk3NDNDNjkyLjIwNiA2OC4yMjc3IDY5MS43ODEgNzIuMzM5NCA2OTAuNzg5IDc2LjAyNTZDNjg5Ljc5NiA3OS44NTM3IDY4OC4zNzggODMuMjU2NCA2ODYuMzkzIDg2LjM3NTZDNjg0LjQwOCA4OS40OTQ3IDY4MS45OTggOTIuMTg4NiA2NzkuMDIgOTQuNTk4OUM2NzYuMDQzIDk3LjAwOTIgNjcyLjQ5OCA5OC44NTIzIDY2OC41MjggMTAwLjQxMkM2NjUuMTI1IDEwMS42ODggNjYxLjI5NyAxMDIuNjggNjU3LjA0MyAxMDMuMjQ3QzY1Mi43OSAxMDMuOTU2IDY0Ny45NjkgMTA0LjI0IDY0Mi41ODEgMTA0LjI0SDYyMy41ODJWMTA0LjA5OFpNNjQ0LjI4MyA5MS45MDVDNjUyLjc5IDkxLjkwNSA2NTkuNTk2IDkwLjc3MDggNjY0LjQxNiA4OC4zNjA1QzY2OC42NyA4Ni4yMzM4IDY3MS45MzEgODMuMjU2NCA2NzQuMDU4IDc5LjE0NDhDNjc2LjE4NSA3NS4xNzUgNjc3LjMxOSA2OS45MjkxIDY3Ny4zMTkgNjMuNjkwN0M2NzcuMzE5IDYwLjQyOTggNjc2Ljg5NCA1Ny40NTI1IDY3Ni4xODUgNTQuOTAwNEM2NzUuNDc2IDUyLjIwNjYgNjc0LjQ4MyA0OS45MzgxIDY3My4wNjUgNDcuOTUzMkM2NzEuNjQ3IDQ1Ljk2ODMgNjcwLjA4OCA0NC4xMjUxIDY2OC4xMDMgNDIuNzA3M0M2NjYuMTE4IDQxLjI4OTUgNjYzLjk5MSA0MC4wMTM1IDY2MS41ODEgMzkuMDIxMUM2NTkuMzEyIDM4LjE3MDQgNjU2Ljc2IDM3LjQ2MTUgNjU0LjA2NiAzNy4xNzc5QzY1MS4yMyAzNi43NTI2IDY0OC4xMTEgMzYuNjEwOCA2NDQuNzA4IDM2LjYxMDhINjM4LjMyOFY5MS45MDVINjQ0LjI4M1oiIGZpbGw9IiNGN0YwRUQiLz4KPHBhdGggZD0iTTcwMC40MyAxMDQuMDk4VjI0LjI3NTlINzE1LjAzNFYxMDQuMDk4SDcwMC40M1oiIGZpbGw9IiNGN0YwRUQiLz4KPHBhdGggZD0iTTc3Mi42IDgzLjgyMzhINzQyLjU0MUw3MzQuNzQzIDEwNC4yNEg3MTkuMTQ2TDc1MC45MDcgMjQuNDE4SDc2NC4yMzVMNzk1Ljk5NSAxMDQuMjRINzgwLjU0TDc3Mi42IDgzLjgyMzhaTTc1Ny40MjkgNDMuNDE2NUM3NTQuNTkzIDUxLjc4MTUgNzUyLjE4MyA1OC43Mjg3IDc0OS45MTQgNjQuMzk5OUw3NDcuMjIgNzEuNDg4OUg3NjcuOTIxTDc2NS4yMjcgNjQuMzk5OUM3NjMuMSA1OC43Mjg3IDc2MC41NDggNTEuNzgxNSA3NTcuNzEyIDQzLjQxNjVINzU3LjQyOVoiIGZpbGw9IiNGN0YwRUQiLz4KPHBhdGggZD0iTTgxNC41NjkgMjQuMjc1OVY5MS45MDVIODUyLjAwMVYxMDQuMDk4SDc5OS45NjVWMjQuMjc1OUg4MTQuNTY5WiIgZmlsbD0iI0Y3RjBFRCIvPgo8L3N2Zz4K";

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
        belbin: isCritical ? ["Identificar quién lidera la comunicación — Coordinador o Investigador de Recursos son ideales","Taller: 'Mensajes que mueven: cómo los roles Belbin impactan la comunicación'"] : ["Reforzar el rol de Cohesionador para asegurar consistencia del mensaje entre áreas"],
        leadership: isCritical ? ["Programa de comunicación ejecutiva: claridad, consistencia y presencia","Taller: 'De la información a la inspiración: comunicación que genera acción'"] : ["Sesiones de alineación de mensajes antes de comunicaciones organizacionales clave"],
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


async function generateOPRIReport(eng, allResponses, CORE_DIMS, FULL_DIMS, DEEP_MODULES, computeOPRI, computeDeep, checkL2, checkL3, preOpenedWin) {
  var coreRR = allResponses.filter(function(r) { return r.survey === "core"; });
  var fullRR = allResponses.filter(function(r) { return r.survey === "full"; });
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
  var win = preOpenedWin || window.open("", "_blank");
  if (!preOpenedWin) {
    win.document.write('<html><body style="font-family:sans-serif;padding:40px;text-align:center;color:#6B7280"><h2 style="color:#1B4332">Generando reporte OPRI™...</h2><p>Consultando inteligencia artificial · Por favor espere</p><div style="font-size:32px;margin-top:20px">⏳</div></body></html>');
  }

  var aiInterpretations = {};
  try {
    var dimContext = mainDims.map(function(d) {
      var sc = mainScores.dimScores[d.id];
      var meta = DIM_META[d.id];
      return meta.en + " (" + meta.es + "): " + (sc != null ? sc.toFixed(2) : "N/A") + "/5.00";
    }).join(", ");

    var prompt = "You are an expert organizational consultant from Promundial Consulting Group specializing in Operational Excellence, Lean Six Sigma, Belbin Team Roles, and Leadership Development.\n\n" +
      "Company: " + eng.company + "\n" +
      "OPRI™ Score: " + mainScores.opri.toFixed(2) + "/5.00 (" + getM(mainScores.opri).en + ")\n" +
      "Respondents: " + mainScores.n + "\n" +
      "Dimension scores: " + dimContext + "\n" +
      (mainScores.paiGlobal != null ? "PAI™ (Perception Alignment Index): " + mainScores.paiGlobal.toFixed(2) + " (" + getPAI(mainScores.paiGlobal).en + ")\n" : "") +
      "\nGenerate a bilingual (Spanish/English) executive interpretation for each dimension. For each, write:\n" +
      "- 2-3 sentences in Spanish describing the organizational reality implied by the score\n" +
      "- 2-3 sentences in English describing the same\n" +
      "Also write a 3-sentence executive summary in Spanish and English about the overall organizational health.\n\n" +
      "Respond ONLY with valid JSON in this exact format:\n" +
      '{"summary_es":"...","summary_en":"...","dims":{"alignment":{"es":"...","en":"..."},"execution":{"es":"...","en":"..."},"leadership":{"es":"...","en":"..."},"resilience":{"es":"...","en":"..."},"culture":{"es":"...","en":"..."}}}';

    var resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }]
      })
    });
    var data = await resp.json();
    var text = data.content && data.content[0] ? data.content[0].text : "";
    text = text.replace(/```json|```/g, "").trim();
    aiInterpretations = JSON.parse(text);
  } catch(e) {
    aiInterpretations = {
      summary_es: "El análisis OPRI™ revela áreas críticas de atención que requieren intervención inmediata por parte del equipo directivo.",
      summary_en: "The OPRI™ analysis reveals critical areas requiring immediate attention from the leadership team.",
      dims: {}
    };
  }

  // ── Build HTML report ──────────────────────────────────────────────────────
  var date = new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" });
  var maturity = getM(mainScores.opri);

  var dimSections = mainDims.map(function(d) {
    var sc = mainScores.dimScores[d.id];
    var meta = DIM_META[d.id];
    var m = sc != null ? getM(sc) : null;
    var aiDim = aiInterpretations.dims && aiInterpretations.dims[d.id] ? aiInterpretations.dims[d.id] : { es: "", en: "" };
    var recs = getRecommendations(d.id, sc || 0);
    return '<div style="page-break-inside:avoid;margin-bottom:32px;border:1px solid #E5E7EB;border-radius:12px;overflow:hidden">' +
      '<div style="background:' + meta.color + '18;border-left:4px solid ' + meta.color + ';padding:14px 18px;display:flex;align-items:center;gap:12px">' +
        '<span style="font-size:20px">' + meta.icon + '</span>' +
        '<div style="flex:1">' +
          '<div style="font-size:14px;font-weight:700;color:' + CHARCOAL + '">' + meta.es + '</div>' +
          '<div style="font-size:11px;color:' + MUTED + '">' + meta.en + '</div>' +
        '</div>' +
        '<div style="text-align:right">' +
          '<div style="font-size:22px;font-weight:700;color:' + (m ? m.color : MUTED) + ';font-family:Georgia,serif">' + (sc != null ? sc.toFixed(2) : '—') + '</div>' +
          '<span style="font-size:9px;font-weight:700;background:' + (m ? m.color : MUTED) + ';color:white;padding:2px 8px;border-radius:99px">' + (m ? m.es : '—') + '</span>' +
        '</div>' +
      '</div>' +
      '<div style="padding:16px 18px">' +
        (aiDim.es ? '<p style="font-size:12px;color:' + CHARCOAL + ';line-height:1.7;margin:0 0 6px 0"><strong>ES:</strong> ' + aiDim.es + '</p>' : '') +
        (aiDim.en ? '<p style="font-size:12px;color:' + MUTED + ';line-height:1.7;margin:0 0 14px 0"><strong>EN:</strong> ' + aiDim.en + '</p>' : '') +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin-top:12px">' +
          recBlock("🔧 LSS / I2E™ Innovation-to-Execution", recs.lss, "#EFF6FF", BLUE) +
          recBlock("👥 Belbin Team Roles", recs.belbin, "#F5F3FF", VIOLET) +
          recBlock("🎯 Leadership Excellence", recs.leadership, "#F0FDF4", GREEN) +
        '</div>' +
      '</div>' +
    '</div>';
  }).join('');

  function recBlock(title, items, bg, color) {
    return '<div style="background:' + bg + ';border-radius:8px;padding:12px">' +
      '<div style="font-size:10px;font-weight:700;color:' + color + ';margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em">' + title + '</div>' +
      '<ul style="margin:0;padding-left:14px">' +
        items.map(function(i) { return '<li style="font-size:11px;color:' + CHARCOAL + ';line-height:1.6;margin-bottom:4px">' + i + '</li>'; }).join('') +
      '</ul>' +
    '</div>';
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
        recsHtml = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:8px;margin-top:10px;padding:10px;background:#F9F9F7;border-radius:8px">' +
          recBlock("🔧 LSS / I2E™", recs.lss.slice(0,2), "#EFF6FF", BLUE) +
          recBlock("👥 Belbin", recs.belbin.slice(0,2), "#F5F3FF", VIOLET) +
          recBlock("🎯 Leadership", recs.leadership.slice(0,2), "#F0FDF4", GREEN) +
        '</div>';
      }
      return '<div style="margin-bottom:' + (recsHtml ? '14' : '8') + 'px;padding-bottom:' + (recsHtml ? '14' : '0') + 'px;border-bottom:1px solid #F3F4F6">' +
        '<div style="display:flex;justify-content:space-between;margin-bottom:3px">' +
          '<span style="font-size:12px;color:' + CHARCOAL + ';font-weight:600">' + g.label + '</span>' +
          '<span style="font-size:12px;font-weight:700;color:' + (mat ? mat.color : MUTED) + '">' + (sc != null ? sc.toFixed(2) : '—') + (mat ? ' · <span style="font-size:9px;font-weight:700">' + mat.es + '</span>' : '') + '</span>' +
        '</div>' +
        '<div style="background:#E5E7EB;border-radius:99px;height:6px;margin-bottom:2px"><div style="width:' + pct + '%;height:100%;background:' + (mat ? mat.color : m.color) + ';border-radius:99px"></div></div>' +
        recsHtml +
      '</div>';
    }).join('');

    return '<div style="page-break-inside:avoid;margin-bottom:28px;border:1px solid #E5E7EB;border-radius:12px;overflow:hidden">' +
      '<div style="background:' + m.color + ';padding:14px 18px;display:flex;align-items:center;justify-content:space-between">' +
        '<div>' +
          '<div style="font-size:12px;color:rgba(255,255,255,0.8);font-weight:600">' + m.index + '</div>' +
          '<div style="font-size:16px;font-weight:700;color:white">' + m.fullName + '</div>' +
        '</div>' +
        '<div style="text-align:right">' +
          '<div style="font-size:28px;font-weight:700;color:white;font-family:Georgia,serif">' + (deepSc.globalScore != null ? deepSc.globalScore.toFixed(2) : '—') + '</div>' +
          '<div style="font-size:10px;color:rgba(255,255,255,0.8)">' + deepSc.n + ' respondentes</div>' +
        '</div>' +
      '</div>' +
      '<div style="padding:16px 18px">' + groupBars + '</div>' +
    '</div>';
  }).join('');

  // Roadmap priorities
  var roadmapItems = dimsSorted.slice(0, 3).map(function(x, i) {
    var meta = DIM_META[x.dim.id];
    var m = getM(x.score);
    var priority = i === 0 ? "Prioridad 1 — Intervención Inmediata" : i === 1 ? "Prioridad 2 — Intervención a 60 días" : "Prioridad 3 — Intervención a 90 días";
    return '<div style="display:flex;gap:12px;margin-bottom:12px;page-break-inside:avoid">' +
      '<div style="width:28px;height:28px;border-radius:50%;background:' + m.color + ';color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0">' + (i+1) + '</div>' +
      '<div style="flex:1;border:1px solid #E5E7EB;border-radius:8px;padding:10px 14px">' +
        '<div style="font-size:10px;color:' + m.color + ';font-weight:700;text-transform:uppercase;margin-bottom:2px">' + priority + '</div>' +
        '<div style="font-size:13px;font-weight:700;color:' + CHARCOAL + '">' + meta.es + ' — ' + x.score.toFixed(2) + '</div>' +
        '<div style="font-size:11px;color:' + MUTED + ';margin-top:4px">' + meta.en + '</div>' +
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
      '.section-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:' + MUTED + ';margin:28px 0 12px 0;padding-bottom:6px;border-bottom:2px solid ' + GOLD + '}' +
    '</style></head><body>' +

    // Print button
    '<div class="no-print" style="background:' + GREEN + ';padding:12px 32px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100">' +
      '<div style="font-family:\'Cormorant Garamond\',serif;font-size:18px;color:white;font-weight:600">OPRI™ Enterprise · Reporte</div>' +
      '<button onclick="window.close()" style="background:rgba(255,255,255,0.15);color:white;border:1px solid rgba(255,255,255,0.3);padding:8px 16px;border-radius:6px;font-weight:600;cursor:pointer;font-size:13px">← Cerrar</button>' +
    '</div>' +

    '<div class="page">' +

    // Cover
    '<div style="background:linear-gradient(135deg,' + GREEN + ',' + GREEN_MID + ');border-radius:12px;padding:40px;margin:28px 0 24px;color:white">' +
      '<div style="display:flex;align-items:center;gap:14px;margin-bottom:16px"><img src="' + LOGO_B64 + '" style="height:40px;width:auto" alt="Promundial"/><div style="font-size:9px;letter-spacing:0.15em;color:' + GOLD + ';text-transform:uppercase;line-height:1.6">Promundial Consulting Group<br>OPRI™ Enterprise Edition</div></div>' +
      '<h2 style="font-size:36px;color:white;margin:0 0 6px 0">' + eng.company + '</h2>' +
      '<div style="font-size:14px;color:rgba(255,255,255,0.8);margin-bottom:24px">Organizational Performance & Resilience Index™ · Reporte Ejecutivo</div>' +
      '<div style="display:flex;gap:20px;flex-wrap:wrap">' +
        '<div><div style="font-size:10px;color:' + GOLD + ';text-transform:uppercase;letter-spacing:0.08em">OPRI™ Score</div><div style="font-family:\'Cormorant Garamond\',serif;font-size:42px;font-weight:700;line-height:1">' + mainScores.opri.toFixed(2) + '</div><div style="font-size:11px;color:' + maturity.color + ';background:rgba(255,255,255,0.15);padding:2px 10px;border-radius:99px;display:inline-block;font-weight:700">' + maturity.es + ' / ' + maturity.en + '</div></div>' +
        '<div style="border-left:1px solid rgba(255,255,255,0.2);padding-left:20px"><div style="font-size:10px;color:' + GOLD + ';text-transform:uppercase;letter-spacing:0.08em">Respondentes</div><div style="font-size:28px;font-weight:700">' + mainScores.n + '</div></div>' +
        (mainScores.paiGlobal != null ? '<div style="border-left:1px solid rgba(255,255,255,0.2);padding-left:20px"><div style="font-size:10px;color:' + GOLD + ';text-transform:uppercase;letter-spacing:0.08em">PAI™</div><div style="font-size:28px;font-weight:700">' + mainScores.paiGlobal.toFixed(2) + '</div><div style="font-size:11px;color:rgba(255,255,255,0.7)">' + getPAI(mainScores.paiGlobal).es + '</div></div>' : '') +
        '<div style="border-left:1px solid rgba(255,255,255,0.2);padding-left:20px"><div style="font-size:10px;color:' + GOLD + ';text-transform:uppercase;letter-spacing:0.08em">Consultor</div><div style="font-size:16px;font-weight:600">' + (eng.consultant || 'Promundial') + '</div><div style="font-size:11px;color:rgba(255,255,255,0.7)">' + date + '</div></div>' +
      '</div>' +
    '</div>' +

    // Executive Summary
    '<div class="section-title">Resumen Ejecutivo / Executive Summary</div>' +
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;margin-bottom:24px">' +
      '<div style="background:#F8F4EC;border-radius:8px;padding:16px;border-left:3px solid ' + GOLD + '">' +
        '<div style="font-size:10px;font-weight:700;color:' + GOLD + ';text-transform:uppercase;margin-bottom:6px">Español</div>' +
        '<p style="font-size:13px;line-height:1.7;margin:0;color:' + CHARCOAL + '">' + (aiInterpretations.summary_es || '') + '</p>' +
      '</div>' +
      '<div style="background:#F0F7FF;border-radius:8px;padding:16px;border-left:3px solid ' + BLUE + '">' +
        '<div style="font-size:10px;font-weight:700;color:' + BLUE + ';text-transform:uppercase;margin-bottom:6px">English</div>' +
        '<p style="font-size:13px;line-height:1.7;margin:0;color:' + CHARCOAL + '">' + (aiInterpretations.summary_en || '') + '</p>' +
      '</div>' +
    '</div>' +

    // Scores overview
    '<div class="section-title">Perfil de Capacidades / Capability Profile</div>' +
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px;align-items:start;margin-bottom:24px">' +
      '<div>' + gaugeHTML(mainScores.opri, maturity.color, 140) + '</div>' +
      '<div>' + barHTML(mainDims, mainScores) + '</div>' +
    '</div>' +

    // PAI
    (mainScores.paiGlobal != null ? '<div class="section-title">PAI™ — Perception Alignment Index</div>' +
    '<div style="margin-bottom:24px">' +
      '<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">' +
        '<div style="font-family:\'Cormorant Garamond\',serif;font-size:32px;font-weight:600;color:' + getPAI(mainScores.paiGlobal).color + '">' + mainScores.paiGlobal.toFixed(2) + '</div>' +
        '<div><div style="font-size:11px;color:' + CHARCOAL + ';font-weight:600">' + getPAI(mainScores.paiGlobal).es + ' / ' + getPAI(mainScores.paiGlobal).en + '</div><div style="font-size:11px;color:' + MUTED + '">Gap promedio entre Liderazgo y Organización</div></div>' +
      '</div>' +
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

    // Footer
    '<div style="border-top:2px solid ' + GOLD + ';padding-top:16px;display:flex;justify-content:space-between;align-items:center;margin-top:32px">' +
      '<div style="display:flex;align-items:center;gap:8px"><img src="' + LOGO_B64 + '" style="height:28px;width:auto" alt="Promundial"/></div>' +
      '<div style="font-size:10px;color:' + MUTED + ';text-align:right">OPRI™ Enterprise Edition · Confidencial · ' + date + '<br>© ' + new Date().getFullYear() + ' Promundial Consulting Group · All rights reserved</div>' +
    '</div>' +

    '</div></body></html>';

  win.document.open();
  win.document.write(html);
  win.document.close();
}


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

  const coreRR  = responses.filter(function(r) { return r.survey === "core"; });
  const fullRR  = responses.filter(function(r) { return r.survey === "full"; });
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
