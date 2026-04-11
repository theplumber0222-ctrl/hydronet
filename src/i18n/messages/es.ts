import type { Messages } from "./en";
import { legalEs } from "./legal-es";

/** UI copy — español (coincide en estructura con en.ts). */
const es = {
  meta: {
    siteTitle: "HydroNet Plumbing | Clarksville, TN · IPC 2018",
    siteDescription:
      "HydroNet Plumbing: plomería comercial y residencial, jetting de drenajes, instalación por hora y membresía Gold en Clarksville, Tennessee. Reserva en línea con Stripe.",
    siteLogoAlt: "HydroNet Plumbing — logotipo",
    jsonLd: {
      name: "HydroNet Plumbing",
      description:
        "HydroNet Plumbing — plomería profesional e IPC 2018 en Clarksville y Tennessee: drenajes, jetting, trabajo por hora y planes Gold.",
      knowsAbout: [
        "Limpieza de drenajes comerciales Clarksville",
        "Hidrolavado de alta presión Tennessee",
        "Mantenimiento de trampas de grasa para restaurantes IPC 2018",
      ],
    },
  },
  stripeUi: {
    checkoutDepositSummary:
      "No Gold: se requiere depósito de $50 para agendar (se acredita al total); saldo el día del servicio. Gold: suscripción (sin depósito de $50).",
    depositLegal:
      "Visita única y por hora: depósito de $50; reembolsos según Cancelaciones y reembolsos. Gold: suscripción (sin depósito de $50). Leyes comerciales de Tennessee.",
    slaNote:
      "Servicios de emergencia fuera de horario estándar están sujetos a disponibilidad y cargos adicionales.",
    commitmentMonthly:
      "Al suscribirte al plan mensual (~$183.33/mes), aceptas un compromiso de servicio de 12 meses. Si cancelas antes de cumplir ese compromiso y ya recibiste mantenimiento preventivo, cualquier ajuste se determinará según los servicios efectivamente prestados y lo abonado a tu membresía, según lo registrado en Stripe.",
    cancelAlert:
      "Tu membresía tiene un compromiso anual de servicio (12 pagos mensuales o el primer año del plan anual). Si cancelas antes de cumplir ese compromiso y ya recibiste mantenimiento preventivo, puede aplicarse un cargo de ajuste por servicios ya prestados, de acuerdo con las tarifas publicadas y lo abonado a la membresía, según se refleje en Stripe.",
  },
  nav: {
    backHome: "← Inicio",
  },
  legalShell: {
    contactTitle: "Contacto",
    emailLabel: "Correo:",
    siteLabel: "Sitio:",
  },
  footer: {
    brand: "HydroNet Plumbing",
    brandSub: "Membresía Gold · mantenimiento de drenajes comerciales · IPC 2018",
    tagline:
      "Clarksville y zona de Tennessee · Drenajes · Jetting · Instalaciones",
    legalEntity: "HydroNet LLC",
    terms: "Términos de servicio",
    privacy: "Privacidad",
    refunds: "Cancelaciones y reembolsos",
  },
  home: {
    heroTitle: "HydroNet Plumbing",
    heroSubtitle:
      "Plomería comercial y residencial · Drenajes y jetting · Reserva en línea",
    bulletWhat: "Qué:",
    bulletWhatText: "plomería y drenajes con criterio técnico bajo código.",
    bulletWhere: "Dónde:",
    bulletWhereText: "Clarksville y zona (Tennessee).",
    bulletHow: "Cómo reservar:",
    bulletHowText: "botón naranja — pago seguro con Stripe.",
    ctaBook: "Reservar cita",
    ctaGoldLogin: "Acceso socios Gold",
    ctaTablet: "Tablet · Servicio en sitio",
  },
  pricing: {
    sectionTitle: "Planes y precios",
    sectionSubtitle:
      "HydroNet Plumbing: visita única de jetting, Gold (mantenimiento de drenajes comerciales — tres visitas al año) o instalación por hora.",
    swipeHint: "Desliza para comparar los tres planes",
    carouselAria: "Planes de servicio HydroNet Plumbing",
    planSingleJettingTitle: "HydroNet Plumbing",
    planSingleJettingKicker: "Jetting · visita única",
    planSingleJettingSubtitle:
      "Este servicio te ofrece la limpieza de drenajes como parte del mantenimiento. Es importante hacerlo regularmente para el buen funcionamiento de tus líneas de drenaje: te ahorra dolores de cabeza y problemas futuros si se aplica adecuadamente.",
    singleVisitWeekdayLabel: "Lunes a viernes",
    singleVisitWeekdayPrice: "$950",
    singleVisitWeekendLabel: "Sábado y domingo",
    singleVisitWeekendPrice: "$1,250",
    singleVisitPolicyNote:
      "Se requiere reserva de $50 para agendar la cita. El reembolso de los $50 requiere cancelación con al menos 24 horas de anticipación. Gracias por darnos la oportunidad de servirle.",
    ctaBookSingleJetting: "Reservar visita de jetting",
    planGoldTitle: "HydroNet Plumbing",
    planGoldKicker: "Gold · drenajes comerciales",
    planGoldSubtitle:
      "Este plan incluye tres visitas, una cada cuatro meses de forma regular. Como socio Gold de HydroNet Plumbing podrás adelantar la cita si lo necesitas o agregar una o más citas extra por $733.33 (lun–vie) o $950 (sáb o dom); cada una se cobrará al momento de agendarla. Cancelación con 24 horas de anticipación.",
    goldPayInFull: "Pago al contado",
    goldOrMonthly: "o pago mensual",
    goldAnnualAmount: "$2,200",
    goldPerYear: "/ año",
    goldMonthlyAmount: "$183.33",
    goldMonthlyNote: "/ mes · compromiso 12 meses",
    ctaJoinAnnual: "Unirse — $2,200 / año",
    ctaJoinMonthly: "Unirse — $183.33 / mes",
    hourlyTitle: "HydroNet Plumbing",
    hourlyKicker: "Por hora · instalaciones y reparaciones",
    hourlyIntro:
      "Se requiere reserva de $50 para agendar la cita; reembolsable si se cancela con al menos 24 horas de anticipación. Este servicio cubre una hora de trabajo por el precio indicado; el total a pagar dependerá del proyecto a realizar y las partes necesarias. Si el proyecto requiere más de cuatro horas se hará una cotización y los $50 para agendar la cita formarán parte del cobro total.",
    hourlyBullet1:
      "Todo tipo de instalaciones para artículos de plomería.",
    hourlyBullet2: "Reparación de tuberías de agua y drenaje.",
    hourlyBullet3: "Drenajes tapados.",
    hourlyBullet4: "Calentadores de agua.",
    hourlyBullet5: "Emergencias.",
    bestValue: "Mejor valor",
    ctaBookHourly: "Reservar por hora",
    reservationAppliesAll:
      "Visita única y por hora: reserva $50 (no Gold). Política completa: Cancelaciones y reembolsos.",
  },
  sticky: {
    ctaBook: "Reservar cita",
  },
  bookFlow: {
    step1: "Datos",
    step2: "Pago seguro",
    trackLabel: "Flujo de reserva",
  },
  a11y: {
    skipToContent: "Ir al contenido principal",
  },
  commandMenu: {
    triggerAria: "Abrir navegación rápida",
    triggerTitle: "Buscar páginas (⌘K o Ctrl+K)",
    title: "Navegación rápida",
    placeholder: "Buscar páginas…",
    empty: "Sin resultados.",
    hintClose: "Esc para cerrar",
    groupPages: "Páginas",
    groupLanguage: "Idioma",
    home: "Inicio",
    book: "Reservar cita",
    bookGold: "Reserva de socio Gold",
    login: "Acceso clientes",
    register: "Crear cuenta",
    dashboard: "Panel Gold",
    tablet: "Tablet · Servicio en sitio",
    terms: "Términos de servicio",
    privacy: "Privacidad",
    refunds: "Cancelaciones y reembolsos",
    langEn: "English (interfaz)",
    langEs: "Español (interfaz)",
    jobCard: "Ficha de cita (tablet)",
  },
  book: {
    back: "← Inicio",
    kicker: "HydroNet Plumbing · HydroNet LLC",
    title: "Reservar cita",
    subtitle:
      "Reserve en línea en Clarksville (IPC 2018). Pago seguro con Stripe — llame en emergencias activas.",
    legalLinksTerms: "Términos de servicio",
    legalLinksRefunds: "Cancelaciones y reembolsos",
    legalLinksPrivacy: "Privacidad",
    cancelledBanner:
      "El pago fue cancelado. Puede volver a intentar cuando desee.",
    loading: "Cargando…",
  },
  bookGold: {
    backDashboard: "← Panel Gold",
    kicker: "HydroNet Plumbing · visitas Gold",
    title: "Visitas de socio — Gold",
    subtitle:
      "Programe el mantenimiento preventivo de drenajes comerciales o compre una visita adicional de socio a $733.33.",
    intro:
      "Tres visitas incluidas al año (~cada cuatro meses); puede reservar antes si lo necesita. Extras y emergencias de fin de semana se pagan en su totalidad al agendar. Las visitas Gold no usan la reserva de $50.",
    visitsSummary:
      "Visitas incluidas usadas en este ciclo: {used} de {included}.",
    visitTypeLabel: "Tipo de visita",
    modePreventiveTitle: "Visita preventiva (incluida en la membresía)",
    modePreventiveDesc:
      "Usa una visita incluida mientras le queden visitas en su año de membresía. Solo días hábiles (lun–vie).",
    modeExtraTitle: "Visita adicional de socio ($733.33)",
    modeExtraDesc:
      "Más allá de las tres incluidas — pago íntegro al agendar.",
    modeWeekendTitle: "Emergencia fin de semana (socio Gold)",
    modeWeekendDesc:
      "Sábado o domingo — pago íntegro al agendar.",
    datetimeHintWeekday:
      "Visitas preventivas entre semana: solo lunes a viernes (hora Tennessee).",
    datetimeHintWeekend:
      "Emergencia fin de semana: solo sábado o domingo (hora Tennessee).",
    depositNoteIncluded:
      "Visita incluida — sin cargo hoy.",
    depositNoteExtra:
      "Cargo íntegro en Stripe al agendar.",
    weekendPayNote:
      "Cargo íntegro en Stripe al agendar.",
    memberNoDepositLegal:
      "Las visitas de socio Gold no usan la reserva de $50.",
    termsLead:
      "Importes y políticas en el momento del pago.",
    submitIncluded: "Confirmar visita incluida",
    serviceCatalogDrain:
      "Mantenimiento de drenaje comercial — preventivo (socio HydroNet Gold)",
    errNoMembership: "Se requiere membresía Gold activa.",
    errIncludedExhausted:
      "Ya usó todas las visitas incluidas de este ciclo. Elija «Visita adicional de socio» o espere la renovación de su membresía.",
    noMembership:
      "No encontramos una membresía HydroNet Gold activa en esta cuenta.",
    viewPlans: "Ver planes y precios",
    signIn: "Iniciar sesión",
  },
  booking: {
    brandBlurb: "cumplimiento del International Plumbing Code (IPC 2018).",
    billingMode: "Modalidad de cobro",
    standardAppt: "Visita única ($950 / $1,250)",
    hourlyRate: "Por hora ($150)",
    serviceLabel: "Tipo de servicio",
    hourlyBox:
      "Servicios técnicos especializados bajo código IPC 2018. Pago mínimo: 1 hora en Stripe ($150); tiempo adicional según trabajo en sitio.",
    businessName: "Nombre de casa o negocio",
    address: "Dirección",
    phone: "Teléfono",
    phoneHint:
      "Use 10 dígitos (EE. UU.); puede incluir +1 o paréntesis.",
    email: "Correo electrónico",
    emailHint:
      "Formato inválido: use un dominio real (p. ej. nombre@empresa.com).",
    datetime: "Fecha y hora preferidas",
    datetimeHint: "Citas: solo lunes a viernes (horario Tennessee).",
    datetimeHintHourly:
      "Solo lunes a viernes (hora Tennessee).",
    datetimeHintSingleVisit:
      "Hora Tennessee — la tarifa sigue el día que elija (resumen abajo).",
    chargeSummary: "Resumen de cobro (estimado en Stripe)",
    serviceLine: "Servicio:",
    hourlyRateLine: "Tarifa:",
    hourlyMin: "/ hora o fracción (mínimo 1 hora en esta reserva).",
    chargeToday: "Total a cobrar hoy en Stripe: $",
    ipcNote: "IPC 2018 — mano de obra profesional HydroNet LLC.",
    standardTotal: "Total del servicio:",
    standardWeekday: "lun–vie",
    standardOffHours: "fuera de horario estándar",
    rateBandWeekday: "Lun–vie · total $950",
    rateBandWeekend: "Sáb–dom · total $1,250",
    reserveToday: "Reserva hoy:",
    balanceDue: "Saldo pendiente:",
    depositNoteStandard:
      "Se requiere depósito de $50 para agendar. Cancelación con al menos 24 horas de anticipación. Reembolsos: Cancelaciones y reembolsos.",
    hourlyLegal:
      "Reserva $50; mínimo 1 hora en Stripe. Tiempo adicional según política HydroNet. Reembolsos: Cancelaciones y reembolsos.",
    termsCheckbox:
      "Acepto la tarifa de reserva y la logística indicadas arriba, los Términos de servicio y la política de cancelaciones y reembolsos, así como las condiciones del servicio seleccionado. La cancelación requiere al menos 24 horas de anticipación.",
    termsLink: "Términos de servicio",
    refundsLink: "política de cancelaciones y reembolsos",
    submitPay: "Reserva segura con Stripe",
    submitting: "Redirigiendo a pago seguro…",
    errTerms:
      "Debe aceptar los términos, la política de cancelaciones y las condiciones indicadas.",
    errBusinessName: "Indique el nombre de casa o negocio.",
    errPlaces:
      "Seleccione una dirección de la lista de Google Places (no use solo texto escrito a mano).",
    errAddressLen:
      "La dirección debe tener al menos 12 caracteres, o configure Google Places para autocompletado.",
    errEmail:
      "Introduzca un correo electrónico válido (dominio completo).",
    errPhone:
      "Introduzca un teléfono de EE. UU. válido (10 dígitos; código de área no puede empezar en 0 ni 1).",
    errDatetime: "Seleccione fecha y hora.",
    errNetwork: "No se pudo conectar. Intente de nuevo.",
    errWorkDescription:
      "Describa el problema o el trabajo (mínimo 10 caracteres).",
    errBillingContact:
      "Indique el nombre de la persona encargada de los pagos.",
    errInvoiceEmail: "Introduzca un correo válido para facturas.",
    errSiteContactName: "Indique el nombre de contacto en obra.",
    errSiteContactPhone: "Introduzca un teléfono válido en obra.",
    errApprovalNote:
      "Si indica un tope de gasto, indique a quién contactar para aprobar un mayor costo.",
    errSpendLimit: "Indique un monto válido en dólares o deje en blanco.",
    dateMismatchWeekday:
      "Solo lunes a viernes (hora Tennessee).",
    dateMismatchWeekendNonMember:
      "El servicio de fin de semana ($1,250) solo aplica sábado y domingo (hora Tennessee).",
    dateMismatchWeekendGold:
      "Socio Gold — Emergencia fin de semana: solo sábado o domingo (horario Tennessee).",
    services: {
      drainage: {
        label: "Jetting / limpieza de drenajes",
        hint: "Limpieza de líneas de drenaje con equipo de presión; ámbito comercial y residencial.",
      },
      water_heater: {
        label:
          "Calentadores de agua: instalación y reemplazo (gas/eléctrico)",
        hint: "Instalación y sustitución de calentadores; gas o eléctrico.",
      },
      fixtures: {
        label: "Fixtures e inodoros: instalación y reemplazo",
        hint: "Instalación y sustitución de grifería y sanitarios.",
      },
      inspection: {
        label: "Inspección técnica: auditoría de cumplimiento IPC 2018",
        hint: "Revisión documentada según estándares IPC 2018.",
      },
    },
    hourlyServiceName: "Servicio de Instalación por Hora",
  },
  verify: {
    title: "Verificación de cliente y trabajo",
    intro:
      "Reserve aquí en la web. Para emergencias de seguridad o inundación activa, llame a HydroNet; el trabajo programado se agenda con este formulario.",
    workDescription: "Descripción del problema / trabajo",
    workDescriptionHint:
      "Resumen breve (mínimo 10 caracteres) — nos ayuda a preparar el equipo adecuado.",
    billingContactName: "Persona encargada de los pagos",
    invoiceEmail: "Correo para facturas",
    siteContactName: "Contacto en obra (nombre)",
    siteContactPhone: "Teléfono en obra (acceso y aprobaciones)",
    spendLimitLabel: "Tope de gasto en reparación (USD)",
    spendLimitHint:
      "Opcional. Deje en blanco si no hay tope. Si indica un tope, describa abajo a quién contactar para aprobar sobrecostos.",
    approvalOverLimitLabel:
      "Contacto para aprobación si el trabajo puede superar el tope",
    approvalOverLimitHint:
      "Nombre, cargo o teléfono — quién puede autorizar costo adicional.",
    copyInvoiceEmail: "Igual que el correo de contacto",
  },
  tabletCita: {
    pageTitle: "Ficha de cita · tablet",
    pageSubtitle:
      "Mismos pasos de verificación que la reserva web — solo lectura en obra.",
    workerIdLabel: "ID de trabajador (asignado por HydroNet)",
    workerIdHelp:
      "Su ID de técnico en HydroNet. Se guarda solo en este navegador. Úselo con el código tablet de 8 caracteres si el servidor tiene lista de IDs permitidos.",
    adminKeyLabel: "Clave técnico / admin (opcional)",
    adminKeyHelp:
      "Misma clave que el informe en sitio (ADMIN_SERVICIO_KEY). Opcional si usa ID de trabajador + código tablet con TABLET_WORKER_IDS en el servidor.",
    codeOrIdLabel: "Código tablet o ID de reserva",
    codeOrIdHelp:
      "Código de 8 caracteres del correo de confirmación, o el ID completo de la reserva (cuid).",
    tabletCodeLabel: "Código tablet",
    bookingIdLabel: "ID de reserva",
    bookingIdHelp:
      "Pegue el ID del panel del cliente, del correo de confirmación u operaciones.",
    loadButton: "Cargar ficha",
    refresh: "Actualizar",
    notFound: "No se encontró la reserva.",
    unauthorized: "No autorizado — revise la clave de técnico o la configuración.",
    networkError: "No se pudo cargar. Intente de nuevo.",
    sectionBasics: "Datos de la visita",
    sectionVerify: "Verificación del cliente",
    bookingReference: "ID de reserva",
    mainContact: "Contacto en la reserva",
    phoneMain: "Teléfono",
    emailMain: "Correo",
    address: "Dirección",
    scheduledAt: "Fecha y hora",
    serviceType: "Tipo de servicio",
    status: "Estado",
    noVerification:
      "Sin datos de verificación (reserva antigua o incompleta).",
    linkServicio: "Informe de cobro en sitio",
    navHome: "← Inicio",
    navJobCard: "Ficha de cita",
    navServicio: "Servicio en sitio",
    navEstimates: "Estimados",
    navHistory: "Historial cliente",
    metaNote: "HydroNet Plumbing · HydroNet LLC",
  },
  adminEstimados: {
    pageTitle: "Estimados · tablet",
    pageSubtitle:
      "Cotizaciones con partidas — convertir a orden de trabajo autorizada mientras estén vigentes.",
    retentionNote:
      "Los estimados se guardan {{days}} días; después pueden borrarse si no se convierten.",
    createTitle: "Nuevo estimado",
    restaurantLabel: "Nombre del negocio / sitio",
    emailLabel: "Correo del cliente",
    phoneLabel: "Teléfono (opcional)",
    addressLabel: "Dirección (opcional)",
    lineItemsTitle: "Partidas",
    lineDesc: "Descripción",
    lineAmount: "Importe (USD)",
    addLine: "+ Añadir partida",
    removeLine: "Quitar",
    notesLabel: "Notas (opcional)",
    createButton: "Guardar estimado",
    listTitle: "Estimados recientes",
    refreshList: "Actualizar lista",
    emptyList: "Aún no hay estimados.",
    successCreate: "Estimado guardado.",
    successConvert: "Convertido a orden de trabajo autorizada.",
    errLineDesc: "Cada partida con importe necesita descripción.",
    errLineAmount: "Indique un importe válido en cada partida descrita.",
    errNoLines: "Añada al menos una partida con descripción e importe.",
    errConvert: "No se pudo convertir.",
    errExpired: "Este estimado venció (fuera del periodo de retención).",
    errAlready: "Ya estaba convertido.",
    expiresLabel: "Válido hasta",
    convertButton: "Convertir a orden de trabajo autorizada",
    converted: "Convertido a orden de trabajo.",
    expiredBadge: "vencido",
  },
  adminHistorial: {
    pageTitle: "Historial cliente · tablet",
    pageSubtitle:
      "Reservas, estimados y órdenes autorizadas para un correo.",
    emailLabel: "Correo del cliente",
    loadButton: "Cargar historial",
    emptyBeforeSearch: "Escriba un correo y pulse Cargar historial.",
    noRows: "No hay registros para este correo.",
    resultsFor: "Historial de",
    kindBooking: "Reserva",
    kindEstimate: "Estimado",
    kindWorkOrder: "Orden autorizada",
    scheduledAt: "Programada",
    expiresAt: "Válido hasta",
    estimateRef: "Desde estimado",
    errEmail: "Indique un correo válido.",
  },
  success: {
    title: "Pago recibido",
    goldIncludedNote:
      "Visita incluida confirmada — sin tarifa de reserva.",
    body1: "Gracias. Recibirá un correo de confirmación en la dirección indicada (desde",
    body1b: "cuando Resend esté configurado).",
    body2:
      "Su operación quedó registrada en Stripe. El webhook activará n8n y el seguimiento operativo.",
    body2GoldIncluded:
      "Su cita quedó registrada en el sistema. El correo de confirmación y n8n seguirán la configuración vigente.",
    dashboard: "Panel Gold",
    newBooking: "Nueva reserva",
    backHome: "Volver al inicio",
    terms: "Términos",
    refunds: "Reembolsos",
    privacy: "Privacidad",
    refLabel: "Referencia:",
  },
  login: {
    title: "Acceso clientes",
    subtitle: "Use la cuenta con la que contrató HydroNet Gold.",
    noAccount: "¿Sin cuenta?",
    register: "Registrarse",
    back: "← Inicio",
    email: "Correo",
    password: "Contraseña",
    error: "Correo o contraseña incorrectos.",
    submit: "Entrar",
    submitting: "Entrando…",
    registered: "Cuenta creada. Inicie sesión para continuar.",
  },
  register: {
    title: "Crear cuenta",
    subtitle: "Regístrese antes de contratar el plan Gold anual.",
    name: "Nombre (opcional)",
    email: "Correo",
    password: "Contraseña (mín. 8 caracteres)",
    legalCheckbox:
      "He leído y acepto los Términos de servicio y la Política de privacidad.",
    legalIntro: "He leído y acepto los",
    legalConnector: "y la",
    termsLink: "Términos de servicio",
    privacyLink: "Política de privacidad",
    submit: "Registrarse",
    submitting: "Creando…",
    hasAccount: "¿Ya tiene cuenta?",
    signIn: "Iniciar sesión",
    errLegal:
      "Debe aceptar los Términos de servicio y la Política de privacidad.",
    networkError: "Error de red. Intente de nuevo.",
  },
  dashboard: {
    back: "← Inicio",
    title: "Panel Gold",
    hello: "Hola,",
    sectionVisits: "HydroNet Plumbing · Gold · drenajes comerciales",
    goldMember: "Socio Gold ·",
    usedOf: "de",
    usedSuffix: "usadas",
    visitsExplainer:
      "Tres visitas preventivas al año (lun–vie); ~4 meses de separación, o antes si lo necesita.",
    memberLead:
      "Visitas incluidas, extras y emergencias de fin de semana — reserva de socio.",
    ctaScheduleGold: "Reserva de socio — programar visita",
    ctaScheduleGoldExtra: "Visita adicional ($733.33)",
    cycleUntil: "Ciclo actual hasta",
    cycleTn: "(TN)",
    noMembership: "No hay membresía Gold activa.",
    bookPlan: "Contratar plan",
    upcoming: "Próximas reservas",
    none: "Sin reservas pagadas aún.",
    newBooking: "Nueva reserva",
    otherServicesHint:
      "Para una visita suelta de jetting o trabajo por hora (no visitas preventivas Gold), use",
    otherServicesLink: "la reserva general",
    tabletCodeLabel: "Código tablet:",
    openTablet: "Abrir ficha",
  },
  cancelMembership: {
    title: "Cancelar membresía",
    subtitle:
      "Detiene la renovación al final del periodo de facturación actual (Stripe).",
    request: "Solicitar cancelación",
    commitmentTitle: "Aviso de compromiso",
    confirmTitle: "Confirmar cancelación",
    confirmBody:
      "Su membresía finalizará según el calendario de facturación de Stripe.",
    back: "Volver",
    confirmBtn: "Confirmar cancelación",
    processing: "Procesando…",
    errGeneric: "No se pudo cancelar. Intente de nuevo.",
    errNetwork: "Error de red. Intente de nuevo.",
  },
  reschedule: {
    submit: "Adelantar ($0)",
    loading: "…",
    success: "Cita actualizada sin cargo.",
  },
  addressAutocomplete: {
    mapsUnavailable: "Google Maps no disponible",
    checkConsole:
      "Revise la consola del navegador (F12 → Consola) para el detalle técnico.",
    selectFromList: "Seleccione una dirección de la lista de sugerencias.",
    loadingMaps: "Cargando mapa…",
    mapsScriptError:
      "No se pudo cargar el script de Google Maps. Compruebe la clave, las APIs habilitadas y las restricciones en Google Cloud Console.",
    loadingPlaceholder: "Cargando Google Places (Clarksville)…",
    inputPlaceholder: "Escribe y elige una dirección (Clarksville / TN)",
    hintBelow: "Elija una dirección de la lista de sugerencias de Google Places.",
    missingApiKey:
      "Falta NEXT_PUBLIC_GOOGLE_MAPS_API_KEY en el entorno del cliente. Defínala en .env (nombre exacto) y reinicie Next.js.",
  },
  planInterval: {
    month: "Plan mensual Gold",
    year: "Plan anual Gold",
    default: "Socio Gold",
  },
  api: {
    unauthorized: "No autorizado",
    emailExists: "Ya existe una cuenta con este correo.",
    registerFail: "Error al registrar",
    membershipCancelNone: "No hay suscripción activa para cancelar.",
    reschedule: {
      notFound: "Reserva no encontrada.",
      goldOnly:
        "Solo las reservas de socio Gold se pueden reprogramar aquí.",
    },
    invalidInput: "Solicitud no válida. Revise la fecha y la hora.",
    checkout: {
      goldCreateAccount:
        "Cree una cuenta e inicie sesión para contratar la membresía Gold.",
      goldLoginBook: "Inicie sesión para reservar como socio Gold.",
      goldActiveRequired: "Se requiere membresía Gold activa.",
      dateRequired: "Fecha requerida.",
      membershipNotFound: "Membresía no encontrada.",
      unsupportedService: "Tipo de servicio no soportado.",
      commitmentRequired:
        "Debe aceptar el compromiso de 12 meses y las condiciones de cancelación anticipada.",
      goldBillingRequired: "Seleccione plan mensual o anual Gold.",
    },
  },
  operatorContactTodo:
    "Dirección física comercial y teléfono de atención: pendientes de publicar en este sitio. Mientras tanto, use el correo indicado más abajo.",
  checkoutStripe: {
    goldAdditionalSubmit:
      "Visita adicional de socio — pago íntegro al pagar.",
    goldWeekendSubmit:
      "Emergencia fin de semana Gold — pago íntegro al pagar.",
    hourlySubmit: "Mínimo 1 hora ($150) al pagar.",
    emergencyNonMemberSubmit:
      "Reserva $50 hoy; saldo el día del servicio.",
  },
  legal: legalEs,
} satisfies Messages;

export default es;
