import { legalEn } from "./legal-en";

/** UI copy — English (US). Legal blocks imported from legal-en.ts */
const en = {
  meta: {
    siteTitle: "HydroNet Plumbing | Clarksville, TN · IPC 2018",
    siteDescription:
      "HydroNet Plumbing: commercial and residential plumbing, drain jetting, hourly installs, and Gold membership in Clarksville, Tennessee. Book online with Stripe.",
    siteLogoAlt: "HydroNet Plumbing — logo",
    jsonLd: {
      name: "HydroNet Plumbing",
      description:
        "HydroNet Plumbing — professional plumbing and IPC 2018 in Clarksville and Tennessee: drains, jetting, hourly work, and Gold plans.",
      knowsAbout: [
        "Commercial Drain Cleaning Clarksville",
        "Hot Water Jetting Tennessee",
        "Restaurant Grease Trap Maintenance IPC 2018",
      ],
    },
  },
  stripeUi: {
    checkoutDepositSummary:
      "Non-Gold: a $195 Dispatch fee applies to schedule (credited toward the service total); balance on service date. Gold: subscription only (no $195 Dispatch fee).",
    flatFeeTitle: "Dispatch fee: $195",
    dispatchFeePurpose:
      "This is our standard non-member reservation charge. It confirms your appointment, covers travel to your location, and the initial technical diagnosis.",
    flatFeeBlurb:
      "This amount secures your booking and includes travel to your home or business in Clarksville, specialized technical diagnosis, and any minor repair that does not require additional materials. If a major repair is needed, you will receive a detailed quote on site before proceeding.",
    hourlyFlatFeeBlurb:
      "For hourly work, the same $195 covers dispatch and your first hour of labor or diagnosis. Each additional hour is billed at $150 on site per HydroNet policy.",
    depositLegal:
      "Non-Gold bookings: $195 Dispatch fee at checkout (Gold members use the member booking flow). Hourly: first hour included in the $195; additional hours on site. Refunds: Cancellations & refunds. Tennessee commercial laws apply.",
    slaNote:
      "Emergency services outside standard hours are subject to availability and additional charges.",
    commitmentMonthly:
      "By subscribing to the monthly plan (~$183.33/mo), you agree to a 12-month service commitment. If you cancel before completing that commitment and you have already received preventive maintenance, any adjustment will be determined according to the services actually rendered and amounts paid toward your membership, as recorded in Stripe.",
    cancelAlert:
      "Your membership has an annual service commitment (12 monthly payments or the first year of the annual plan). If you cancel before fulfilling that commitment and you have already received preventive maintenance, an adjustment charge may apply for services already rendered, consistent with our published rates and your membership payments, as reflected in Stripe.",
  },
  nav: {
    backHome: "← Home",
  },
  legalShell: {
    contactTitle: "Contact",
    emailLabel: "Email:",
    siteLabel: "Site:",
  },
  footer: {
    brand: "HydroNet Plumbing",
    brandSub: "Gold membership · commercial drain maintenance · IPC 2018",
    tagline:
      "Clarksville & surrounding Tennessee · Drains · Jetting · Installs",
    legalEntity: "HydroNet LLC",
    terms: "Terms of Service",
    privacy: "Privacy",
    refunds: "Cancellations & refunds",
  },
  home: {
    heroTitle: "HydroNet Plumbing",
    heroSubtitle:
      "Commercial & residential plumbing · Drains & jetting · Book online",
    bulletWhat: "What:",
    bulletWhatText: "plumbing and drains with code-compliant workmanship.",
    bulletWhere: "Where:",
    bulletWhereText: "Clarksville and surrounding area (Tennessee).",
    bulletHow: "How to book:",
    bulletHowText: "orange button — secure payment with Stripe.",
    ctaBook: "Book appointment",
    ctaGoldLogin: "Gold member login",
    ctaTablet: "Tablet · Field service",
  },
  pricing: {
    sectionTitle: "Plans & pricing",
    sectionSubtitle:
      "HydroNet Plumbing: single jetting visit, Gold commercial drain maintenance (three visits per year), or hourly installation.",
    swipeHint: "Swipe to compare the three plans",
    carouselAria: "HydroNet Plumbing service plans",
    planSingleJettingTitle: "HydroNet Plumbing",
    planSingleJettingKicker: "Jetting · single visit",
    planSingleJettingSubtitle:
      "This service provides drain cleaning as part of maintenance. Doing it regularly helps your drain lines work properly and saves headaches and future problems when done correctly.",
    singleVisitWeekdayLabel: "Monday–Friday",
    singleVisitWeekdayPrice: "$950",
    singleVisitWeekendLabel: "Saturday–Sunday",
    singleVisitWeekendPrice: "$1,250",
    singleVisitPolicyNote:
      "A $195 Dispatch fee is required to schedule a non-member visit. Refunds follow our cancellation policy (typically 24+ hours’ notice). Thank you for giving us the opportunity to serve you.",
    ctaBookSingleJetting: "Book jetting visit",
    planGoldTitle: "HydroNet Plumbing Gold Jetting",
    planGoldKicker: "Gold · commercial drain maintenance",
    planGoldSubtitle:
      "This plan includes three visits, one every four months on a regular schedule. As a Gold member with HydroNet Plumbing you can move up a visit if needed or add one or more extra visits for $733.33 (Mon–Fri) or $950 (Sat or Sun), each charged when you book. Cancellation with 24 hours’ notice.",
    goldPayInFull: "Pay in full",
    goldOrMonthly: "or pay monthly",
    goldAnnualAmount: "$2,200",
    goldPerYear: "/ year",
    goldMonthlyAmount: "$183.33",
    goldMonthlyNote: "/ mo · 12-month commitment",
    ctaJoinAnnual: "$2,200 / year — one payment",
    ctaJoinMonthly: "$183.33 / month",
    hourlyTitle: "HydroNet Plumbing",
    hourlyKicker: "Hourly · installs & repairs",
    hourlyIntro:
      "The $195 Dispatch fee is charged in Stripe to schedule; it covers dispatch and your first hour. Each additional hour is $150 on site per HydroNet policy. If the project requires more than four hours, we will provide a quote before proceeding.",
    hourlyBullet1:
      "All types of installations for plumbing fixtures.",
    hourlyBullet2: "Repair of water supply and drain piping.",
    hourlyBullet3: "Clogged drains.",
    hourlyBullet4: "Water heaters.",
    hourlyBullet5: "Emergencies.",
    bestValue: "Best value",
    ctaBookHourly: "Book hourly",
    reservationAppliesAll:
      "Single visits (non-Gold): $195 Dispatch fee. Hourly: min. 1 hr. Full policy: Cancellations & refunds.",
  },
  sticky: {
    ctaBook: "Book appointment",
  },
  bookFlow: {
    step1: "Details",
    step2: "Secure checkout",
    trackLabel: "Booking flow",
  },
  a11y: {
    skipToContent: "Skip to main content",
  },
  commandMenu: {
    triggerAria: "Open quick navigation",
    triggerTitle: "Search pages (⌘K or Ctrl+K)",
    title: "Quick navigation",
    placeholder: "Search pages…",
    empty: "No matches.",
    hintClose: "Esc to close",
    groupPages: "Pages",
    groupLanguage: "Language",
    home: "Home",
    book: "Book appointment",
    bookGold: "Gold member booking",
    login: "Customer login",
    register: "Create account",
    dashboard: "Gold dashboard",
    tablet: "Tablet · Field service",
    terms: "Terms of Service",
    privacy: "Privacy",
    refunds: "Cancellations & refunds",
    langEn: "English (interface)",
    langEs: "Español (interfaz)",
    jobCard: "Job card (tablet)",
  },
  book: {
    back: "← Home",
    kicker: "HydroNet Plumbing · HydroNet LLC",
    title: "Book appointment",
    subtitle:
      "Book online in Clarksville (IPC 2018). Secure checkout with Stripe — call for active emergencies.",
    legalLinksTerms: "Terms of Service",
    legalLinksRefunds: "Cancellations & refunds",
    legalLinksPrivacy: "Privacy",
    cancelledBanner:
      "Payment was cancelled. You can try again whenever you’re ready.",
    loading: "Loading…",
  },
  joinGold: {
    back: "← Home",
    title: "HydroNet Plumbing Gold Jetting",
    authGateBody:
      "To continue with HydroNet Gold Jetting, please sign in or create an account. You’ll return here to complete checkout ($2,200 / year or $183.33 / month).",
    ctaRegisterPartner: "Create member account",
    ctaLoginExisting: "I already have an account · Sign in",
    subtitle:
      "Choose annual ($2,200 one payment) or monthly ($183.33). Enter your business details to continue to secure Stripe checkout.",
    pickAnnual: "Annual",
    pickMonthly: "Monthly",
    onePayment: "One payment",
    ctaPayAnnual: "Continue to pay $2,200 / year",
    ctaPayMonthly: "Continue — $183.33 / month",
    errTerms: "You must accept the terms.",
    errCommitment: "Accept the 12-month commitment to continue with the monthly plan.",
  },
  bookGold: {
    backDashboard: "← Gold dashboard",
    kicker: "HydroNet Plumbing · Gold member visits",
    title: "Member visits — Gold",
    subtitle:
      "Schedule preventive commercial drain maintenance, or purchase an additional member visit at $733.33.",
    intro:
      "Three included visits per year (~every four months); you can book earlier if needed. Extras and weekend emergencies are paid in full at booking. Gold visits do not use the $195 Dispatch fee.",
    visitsSummary:
      "Included visits used this cycle: {used} of {included}.",
    visitTypeLabel: "Visit type",
    modePreventiveTitle: "Preventive visit (included in membership)",
    modePreventiveDesc:
      "Uses one included visit while you still have visits left on your membership year. Weekdays only (Mon–Fri).",
    modeExtraTitle: "Additional member visit ($733.33)",
    modeExtraDesc:
      "Beyond your three included visits — paid in full at booking.",
    modeWeekendTitle: "Weekend emergency (Gold member)",
    modeWeekendDesc:
      "Saturday or Sunday — paid in full at booking.",
    datetimeHintWeekday:
      "Weekday preventive visits: Monday–Friday only (Tennessee time).",
    datetimeHintWeekend:
      "Weekend emergency: Saturday or Sunday only (Tennessee time).",
    depositNoteIncluded:
      "Included visit — no charge today.",
    depositNoteExtra:
      "Charged in full in Stripe at booking.",
    weekendPayNote:
      "Charged in full in Stripe at booking.",
    memberNoDepositLegal:
      "Gold member visits do not use the $195 Dispatch fee for non-member visits.",
    termsLead:
      "Amounts and policies appear at checkout.",
    submitIncluded: "Confirm included visit",
    serviceCatalogDrain:
      "Commercial drain maintenance — preventive (HydroNet Gold member)",
    errNoMembership: "Active Gold membership is required.",
    errIncludedExhausted:
      "You have used all included visits for this cycle. Choose “Additional member visit,” or wait until your membership renews.",
    noMembership:
      "We don’t see an active HydroNet Gold membership on this account.",
    viewPlans: "View plans & pricing",
    signIn: "Sign in",
  },
  booking: {
    brandBlurb:
      "compliance with the International Plumbing Code (IPC 2018).",
    billingMode: "Billing mode",
    standardAppt: "Single visit ($950 / $1,250)",
    hourlyRate: "Hourly ($150/hr after 1st)",
    serviceLabel: "Service type",
    hourlyBox:
      "Specialized technical work under IPC 2018. You pay the $195 Dispatch fee to confirm the visit; it covers dispatch and your first hour. Additional hours are $150 on site.",
    goldMemberBanner:
      "We see an active HydroNet Gold membership on this account. Book through the member page — the $195 Dispatch fee does not apply to eligible Gold visits.",
    goldMemberBannerCta: "Open member booking",
    dispatchNoShowPolicy:
      "The $195 Dispatch fee is not refundable if you cancel when the technician has already arrived on site.",
    businessName: "Home or business name",
    address: "Address",
    phone: "Phone",
    phoneHint:
      "Use 10 digits (US); +1 or parentheses are fine.",
    email: "Email",
    emailHint:
      "Invalid format: use a real domain (e.g. name@business.com).",
    datetime: "Preferred date and time",
    datetimeHint:
      "Appointments: Monday–Friday only (Tennessee time).",
    datetimeHintHourly:
      "Monday–Friday only (Tennessee time).",
    datetimeHintSingleVisit:
      "Tennessee time — rate follows the day you pick (summary below).",
    chargeSummary: "Charge summary (estimated in Stripe)",
    serviceLine: "Service:",
    hourlyRateLine: "Dispatch + 1st hour (today):",
    hourlyMin: "",
    hourlyAdditionalAfterFirst:
      "Additional labor after the first hour: $150/hour on site (per HydroNet policy).",
    chargeToday: "Charged today in Stripe: $",
    ipcNote: "IPC 2018 — professional labor · HydroNet LLC.",
    standardTotal: "Service total:",
    standardWeekday: "Mon–Fri",
    standardOffHours: "outside standard hours",
    rateBandWeekday: "Mon–Fri · $950 total",
    rateBandWeekend: "Sat–Sun · $1,250 total",
    reserveToday: "Dispatch fee today:",
    balanceDue: "Balance due:",
    depositNoteStandard:
      "Dispatch fee: $195. Cancellation requires at least 24 hours notice unless stated otherwise below. Refund rules: Cancellations & refunds.",
    hourlyLegal:
      "Dispatch fee ($195) covers dispatch and your first hour; additional hours $150 on site. Refunds: Cancellations & refunds.",
    termsCheckbox:
      "I accept the reservation fee and logistics described above, the Terms of Service, and the Cancellations & refunds policy, as well as the conditions for the selected service. Cancellation requires at least 24 hours notice.",
    termsLink: "Terms of Service",
    refundsLink: "Cancellations & refunds policy",
    submitPay: "Secure booking with Stripe",
    submitPayServiceFee: "Pay Dispatch fee ($195)",
    submitPayHourly: "Continue to checkout (min. 1 hr)",
    submitting: "Redirecting to secure payment…",
    cancelChoosePlan: "Cancel and choose another plan",
    errTerms:
      "You must accept the terms, cancellation policy, and conditions shown.",
    errBusinessName: "Enter the home or business name.",
    errPlaces:
      "Select an address from Google Places suggestions (do not type free text only).",
    errAddressLen:
      "Address must be at least 12 characters, or configure Google Places autocomplete.",
    errEmail: "Enter a valid email with a full domain.",
    errPhone:
      "Enter a valid US phone (10 digits; area code cannot start with 0 or 1).",
    errDatetime: "Select date and time.",
    errNetwork: "Could not connect. Please try again.",
    errWorkDescription:
      "Describe the problem or work needed (at least 10 characters).",
    errBillingContact:
      "Enter the name of the person responsible for payments.",
    errInvoiceEmail: "Enter a valid email for invoices.",
    errSiteContactName: "Enter the on-site contact name.",
    errSiteContactPhone: "Enter a valid on-site phone number.",
    errApprovalNote:
      "If you set a spending limit, say who to contact for approval beyond that limit.",
    errSpendLimit: "Enter a valid dollar amount or leave blank.",
    dateMismatchWeekday:
      "Monday–Friday only (Tennessee time).",
    dateMismatchWeekendNonMember:
      "The $1,250 weekend service applies to Saturday and Sunday only (Tennessee time).",
    dateMismatchWeekendGold:
      "Gold member — weekend emergency: Saturday or Sunday only (Tennessee time).",
    services: {
      drainage: {
        label: "Jetting / drain cleaning",
        hint: "High-pressure drain line cleaning (commercial and residential). The $195 Dispatch fee confirms your visit and equipment mobilization; it is credited toward your service total ($950 Mon–Fri or $1,250 Sat–Sun).",
      },
      water_heater: {
        label:
          "Water heaters: installation and replacement (gas/electric)",
        hint: "Installation and replacement; gas or electric.",
      },
      fixtures: {
        label: "Fixtures & toilets: installation and replacement",
        hint: "Installation and replacement of fixtures and toilets.",
      },
      inspection: {
        label: "Technical inspection: IPC 2018 compliance audit",
        hint: "Documented review per IPC 2018 standards.",
      },
    },
    hourlyServiceName: "Hourly installation service",
  },
  verify: {
    title: "Client & job verification",
    intro:
      "Book online here. For life-safety emergencies or active flooding, call HydroNet; routine work is scheduled through this form.",
    workDescription: "Problem / work description",
    workDescriptionHint:
      "Brief summary (minimum 10 characters) — helps us bring the right tools.",
    billingContactName: "Person responsible for payments",
    invoiceEmail: "Email for invoices",
    siteContactName: "On-site contact (name)",
    siteContactPhone: "On-site phone (access & approvals)",
    spendLimitLabel: "Repair spending limit (USD)",
    spendLimitHint:
      "Optional. Leave blank if there is no cap. If you set a limit, describe who approves overages below.",
    approvalOverLimitLabel: "Approval contact if work may exceed the limit",
    approvalOverLimitHint:
      "Name, role, or phone — who can authorize additional cost.",
    copyInvoiceEmail: "Same as contact email",
  },
  tabletCita: {
    pageTitle: "Job card · tablet",
    pageSubtitle:
      "Same verification steps as the web booking — read-only for field work.",
    workerIdLabel: "Worker ID (assigned by HydroNet)",
    workerIdHelp:
      "Your technician ID from HydroNet. Saved in this browser only. Use it with the 8-character tablet code when the server lists allowed worker IDs.",
    adminKeyLabel: "Technician / admin key (optional)",
    adminKeyHelp:
      "Same key as on-site service (ADMIN_SERVICIO_KEY). Optional if you use Worker ID + tablet code with TABLET_WORKER_IDS on the server.",
    codeOrIdLabel: "Tablet code or booking ID",
    codeOrIdHelp:
      "8-character code from the confirmation email, or the full booking ID (cuid).",
    tabletCodeLabel: "Tablet code",
    bookingIdLabel: "Booking ID",
    bookingIdHelp:
      "Paste the ID from the customer dashboard, confirmation email, or operations.",
    loadButton: "Load job card",
    refresh: "Refresh",
    notFound: "Booking not found.",
    unauthorized: "Unauthorized — check the technician key or server settings.",
    networkError: "Could not load. Try again.",
    sectionBasics: "Visit basics",
    sectionVerify: "Client verification",
    bookingReference: "Booking ID",
    mainContact: "Contact on booking",
    phoneMain: "Phone",
    emailMain: "Email",
    address: "Address",
    scheduledAt: "Scheduled",
    serviceType: "Service type",
    status: "Status",
    noVerification: "No verification data on file (older booking).",
    linkServicio: "On-site billing report",
    navHome: "← Home",
    navJobCard: "Job card",
    navServicio: "On-site service",
    navEstimates: "Estimates",
    navHistory: "Client history",
    metaNote: "HydroNet Plumbing · HydroNet LLC",
  },
  adminEstimados: {
    pageTitle: "Estimates · tablet",
    pageSubtitle:
      "Written quotes with line items — convert to an authorized work order while valid.",
    retentionNote:
      "Estimates are kept for {{days}} days; after that they may be removed unless converted.",
    createTitle: "New estimate",
    restaurantLabel: "Business / site name",
    emailLabel: "Client email",
    phoneLabel: "Phone (optional)",
    addressLabel: "Address (optional)",
    lineItemsTitle: "Line items",
    lineDesc: "Description",
    lineAmount: "Amount (USD)",
    addLine: "+ Add line",
    removeLine: "Remove",
    notesLabel: "Notes (optional)",
    createButton: "Save estimate",
    listTitle: "Recent estimates",
    refreshList: "Refresh list",
    emptyList: "No estimates yet.",
    successCreate: "Estimate saved.",
    successConvert: "Converted to authorized work order.",
    errLineDesc: "Each line with an amount needs a description.",
    errLineAmount: "Enter a valid amount for each described line.",
    errNoLines: "Add at least one line item with description and amount.",
    errConvert: "Could not convert.",
    errExpired: "This estimate has expired (past the retention window).",
    errAlready: "Already converted.",
    expiresLabel: "Valid until",
    convertButton: "Convert to authorized work order",
    converted: "Converted to work order.",
    expiredBadge: "expired",
  },
  adminHistorial: {
    pageTitle: "Client history · tablet",
    pageSubtitle:
      "Reservations, estimates, and authorized work orders for one email.",
    emailLabel: "Client email",
    loadButton: "Load history",
    emptyBeforeSearch: "Enter an email and tap Load history.",
    noRows: "No records for this email.",
    resultsFor: "Showing history for",
    kindBooking: "Booking",
    kindEstimate: "Estimate",
    kindWorkOrder: "Authorized work order",
    scheduledAt: "Scheduled",
    expiresAt: "Valid until",
    estimateRef: "From estimate",
    errEmail: "Enter a valid email address.",
  },
  success: {
    title: "Payment received",
    goldIncludedNote:
      "Included visit confirmed — no reservation fee.",
    body1:
      "Thank you. You’ll receive a confirmation email at the address provided (from",
    body1b: "when Resend is configured).",
    body2:
      "Your transaction was recorded in Stripe. The webhook will trigger n8n and operational follow-up.",
    body2GoldIncluded:
      "Your visit was saved in our system. Confirmation email and n8n follow-up will run as configured.",
    dashboard: "Gold dashboard",
    newBooking: "New booking",
    backHome: "Back to home",
    terms: "Terms",
    refunds: "Refunds",
    privacy: "Privacy",
    refLabel: "Reference:",
  },
  login: {
    title: "Customer login",
    subtitle: "Use the account you used for HydroNet Gold.",
    noAccount: "No account?",
    register: "Register",
    back: "← Home",
    email: "Email",
    password: "Password",
    error: "Incorrect email or password.",
    submit: "Sign in",
    submitting: "Signing in…",
    registered: "Account created. Sign in to continue.",
  },
  register: {
    title: "Create account",
    subtitle: "Register before purchasing the annual Gold plan.",
    subtitleGold:
      "Create your account to continue to HydroNet Gold Jetting checkout.",
    name: "Name (optional)",
    email: "Email",
    password: "Password (min. 8 characters)",
    legalCheckbox:
      "I have read and accept the Terms of Service and Privacy Policy.",
    legalIntro: "I have read and accept the",
    legalConnector: "and the",
    termsLink: "Terms of Service",
    privacyLink: "Privacy Policy",
    submit: "Register",
    submitting: "Creating…",
    hasAccount: "Already have an account?",
    signIn: "Sign in",
    errLegal:
      "You must accept the Terms of Service and Privacy Policy.",
    networkError: "Network error. Try again.",
  },
  dashboard: {
    back: "← Home",
    title: "Gold dashboard",
    hello: "Hello,",
    sectionVisits: "HydroNet Plumbing · Gold · commercial drain maintenance",
    goldMember: "Gold member ·",
    usedOf: "of",
    usedSuffix: "used",
    visitsExplainer:
      "Three preventive visits per year (Mon–Fri); ~4 months apart, or sooner if needed.",
    memberLead:
      "Included visits, extras, and weekend emergencies — member booking.",
    ctaScheduleGold: "Member booking — schedule visit",
    ctaScheduleGoldExtra: "Additional visit ($733.33)",
    cycleUntil: "Current cycle through",
    cycleTn: "(TN)",
    noMembership: "No active Gold membership.",
    bookPlan: "Book a plan",
    upcoming: "Upcoming bookings",
    none: "No paid bookings yet.",
    newBooking: "New booking",
    otherServicesHint:
      "For a one-off jetting visit or hourly work (not Gold preventive visits), use",
    otherServicesLink: "general booking",
    tabletCodeLabel: "Tablet code:",
    openTablet: "Open job card",
  },
  cancelMembership: {
    title: "Cancel membership",
    subtitle:
      "Stops renewal at the end of the current billing period (Stripe).",
    request: "Request cancellation",
    commitmentTitle: "Commitment notice",
    confirmTitle: "Confirm cancellation",
    confirmBody:
      "Your membership will end per Stripe’s billing schedule.",
    back: "Back",
    confirmBtn: "Confirm cancellation",
    processing: "Processing…",
    errGeneric: "Could not cancel. Please try again.",
    errNetwork: "Connection error. Try again.",
  },
  reschedule: {
    submit: "Reschedule ($0)",
    loading: "…",
    success: "Appointment updated at no charge.",
  },
  addressAutocomplete: {
    mapsUnavailable: "Google Maps unavailable",
    checkConsole:
      "Check the browser console (F12 → Console) for technical details.",
    selectFromList: "Select an address from the suggestions list.",
    loadingMaps: "Loading map…",
    mapsScriptError:
      "Could not load the Google Maps script. Check the API key, enabled APIs, and restrictions in Google Cloud Console.",
    loadingPlaceholder: "Loading Google Places (Clarksville)…",
    inputPlaceholder: "Type and choose an address (Clarksville / TN)",
    hintBelow: "Choose an address from Google Places suggestions.",
    missingApiKey:
      "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is missing in the client environment. Set it in .env (exact name) and restart Next.js.",
  },
  planInterval: {
    month: "Gold monthly plan",
    year: "Gold annual plan",
    default: "Gold member",
  },
  api: {
    unauthorized: "Unauthorized",
    emailExists: "An account with this email already exists.",
    registerFail: "Registration failed",
    registerInvalid:
      "Invalid data: use a valid email and a password of at least 8 characters.",
    registerDbUnavailable:
      "Could not connect to the database. If this persists, contact the site administrator.",
    membershipCancelNone: "No active subscription to cancel.",
    reschedule: {
      notFound: "Booking not found.",
      goldOnly: "Only Gold member bookings can be rescheduled here.",
    },
    invalidInput: "Invalid request. Check the date and time.",
    checkout: {
      goldCreateAccount:
        "Create an account and sign in to purchase Gold membership.",
      goldLoginBook: "Sign in to book as a Gold member.",
      goldActiveRequired: "Active Gold membership is required.",
      dateRequired: "Date is required.",
      membershipNotFound: "Membership not found.",
      unsupportedService: "Unsupported service type.",
      goldUseMemberBooking:
        "Active Gold membership: use the member booking page so the $195 Dispatch fee is not charged on eligible visits.",
      commitmentRequired:
        "You must accept the 12-month commitment and early-cancellation terms.",
      goldBillingRequired: "Select monthly or annual Gold.",
    },
  },
  operatorContactTodo:
    "Commercial address and public phone: pending publication on this site. Until then, use the email below.",
  checkoutStripe: {
    goldAdditionalSubmit: "Additional member visit — pay in full at checkout.",
    goldWeekendSubmit: "Gold weekend emergency — pay in full at checkout.",
    hourlySubmit: "Minimum 1 hour ($150) at checkout.",
    hourlyFlatFeeSubmit:
      "Dispatch fee — $195 today (dispatch + first hour). Additional hours $150/hr on site.",
    flatFeeSubmit:
      "Dispatch fee — $195 charged today. Balance per estimate on service date.",
    emergencyNonMemberSubmit:
      "$195 Dispatch fee today; balance on service date.",
  },
  legal: legalEn,
};

export type Messages = typeof en;
export default en;
