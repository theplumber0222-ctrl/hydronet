/** Full legal copy — English (US). */
export const legalEn = {
  terms: {
    pageTitle: "Terms of Service",
    metaTitle: "Terms of Service | HydroNet",
    metaDescription:
      "Terms and conditions for HydroNet LLC site use, bookings, and HydroNet Gold membership.",
    introPart1: "Payment acceptance reference version:",
    introPart2:
      "Use of this site and purchasing services implies reading these terms and the",
    privacyLink: "Privacy Policy",
    introPart3: ".",
    s1Title: "1. Identity",
    s1P1:
      "HydroNet LLC (“HydroNet Plumbing”) offers plumbing and related services through this site. Information on this site describes commercial and residential plumbing with reference to the IPC 2018 code where applicable.",
    s2Title: "2. General service description",
    s2P1:
      "Services include, depending on what is booked on the site or in the field: standard appointments, hourly work, emergencies or add-ons subject to availability and calendar rules, and HydroNet Gold membership with preventive visits subject to published limits.",
    s3Title: "3. Service area and availability",
    s3P1:
      "The advertised service area focuses on Clarksville and the surrounding Tennessee region. Business hours and weekday rules for certain modalities follow the Tennessee time zone used for scheduling.",
    s4Title: "4. Bookings and scheduling",
    s4P1:
      "Bookings are made through this site’s form; initial payment may be processed via Stripe Checkout. You must provide accurate contact information and, when required, select an address from Google Places suggestions to validate location.",
    s4P2:
      "Preventive Gold visits included in membership are scheduled on business days (Mon–Fri) per the rules published on the site.",
    s5Title: "5. Reservation fee and logistics (deposit)",
    s6Title: "6. HydroNet Gold membership",
    s6P1:
      "Gold plans (monthly or annual) include benefits published on the home page (e.g., queue priority, preventive visits per cycle on business days). The monthly plan includes commitment terms and possible early-termination charges, as stated at signup and in the account dashboard.",
    s6P2Prefix: "For summarized refund and cancellation rules, see also",
    refundsLink: "Cancellations & refunds",
    s6P2Suffix: ".",
    s7Title: "7. Service limitations",
    s7L1:
      "Work is performed with professional judgment and according to the booking or written estimate.",
    s7L2:
      "Some jobs (e.g., water heaters or larger projects) may require a prior quote before a firm price is confirmed.",
    s7L3:
      "The site may show reference amounts; the final Stripe charge reflects the configured price for the selected service line.",
    s8Title: "8. Limitation of liability",
    s8P1:
      "To the fullest extent permitted by applicable law in the State of Tennessee and the United States, HydroNet LLC is not liable for indirect damages, lost profits, or unforeseeable consequences arising from use of the site or service delivery, except where such exclusion is prohibited by law. Service is performed in field conditions; the customer must provide safe access to the premises.",
    s9Title: "9. Changes",
    s9P1:
      "We may update these terms; the version applicable to a payment will be tied to transaction metadata when applicable (see version tag below). Review this page periodically.",
    s10Title: "10. Business contact",
    s10P1: "Email: use the address shown in the contact box at the bottom of this page.",
  },
  privacy: {
    pageTitle: "Privacy Policy",
    metaTitle: "Privacy Policy | HydroNet",
    metaDescription:
      "How HydroNet LLC handles personal and operational data related to bookings and accounts.",
    p1Part1: "HydroNet LLC (“HydroNet Plumbing”, “we”) respects your privacy. This policy describes data we process through",
    p1Part2:
      "for operational and billing purposes. For service and payment terms, also see",
    termsLink: "Terms of Service",
    p1Part3: ".",
    s1Title: "1. Data controller",
    s1P1Prefix: "Controller:",
    s1P1Suffix:
      ". Privacy inquiries:",
    s2Title: "2. Data we may collect",
    s2L1Label: "Identity & contact:",
    s2L1:
      "name or business name, email, phone.",
    s2L2Label: "Service location:",
    s2L2:
      "address text and, when using autocomplete, a place identifier (e.g., Google Place ID) to validate location.",
    s2L3Label: "Booking:",
    s2L3: "requested date/time, service type or catalog line.",
    s2L4Label: "Customer account:",
    s2L4:
      "if you register: email, optional name, and password stored securely (hashed); we do not store plaintext passwords.",
    s2L5Label: "Payments:",
    s2L5:
      "card payments are processed by Stripe. We do not store full card numbers on our servers; Stripe acts as processor under its own policies.",
    s2L6Label: "Gold membership:",
    s2L6:
      "subscription status and visit usage tied to your account as needed to deliver the service.",
    s3Title: "3. Purposes",
    s3L1: "Manage bookings, reminders, and service delivery.",
    s3L2: "Billing, tax compliance, and issue resolution.",
    s3L3:
      "Transactional communications (e.g., confirmation email when email sending is configured).",
    s3L4: "Authentication for registered users (dashboard access).",
    s3L5:
      "Operational integrations: if configured, structured data may be sent to automation (e.g., an n8n-compatible webhook) for internal workflows.",
    s4Title: "4. Legal basis and fair use",
    s4P1:
      "We process data to perform the contract or pre-contract steps (booking/service), to meet legal obligations where applicable in the U.S. / Tennessee, and for legitimate interest in operating the site securely. We do not sell contact lists.",
    s5Title: "5. Where data is stored",
    s5P1:
      "The application uses a PostgreSQL database via Prisma ORM, hosted with your deployment provider. Login sessions use cookies/JWT per NextAuth configuration.",
    s6Title: "6. Stripe",
    s6P1:
      "Payments are processed through Stripe. When you pay, Stripe’s privacy policy and terms apply. We may receive customer identifiers, payment status, and metadata needed to reconcile bookings or membership.",
    s7Title: "7. Email (Resend)",
    s7P1:
      "If the sending API is configured (e.g., Resend), transactional emails are sent from the business address. Resend processes delivery data under its policy.",
    s8Title: "8. Maps & autocomplete (Google)",
    s8P1:
      "If the form shows address suggestions, Google Maps / Places APIs may be used per site configuration. Google may process certain data under its terms when you use those features.",
    s9Title: "9. Cookies and similar technologies",
    s9P1:
      "The site may use cookies necessary for login sessions and secure form operation. This project does not use third-party advertising cookies by default; if analytics are added later, this policy will be updated.",
    s10Title: "10. Retention",
    s10P1:
      "We retain information as long as needed to provide the service, meet legal obligations, and resolve disputes, unless deletion is legally required.",
    s11Title: "11. Your rights and contact",
    s11P1Prefix:
      "You may request access, correction, or deletion of personal data where applicable, or ask privacy questions by writing to",
    s11P1Suffix: ". We will respond within a reasonable time.",
    s12Title: "12. Children",
    s12P1:
      "This site is not directed at children under 13; we do not knowingly collect data from children.",
    s13Title: "13. Changes",
    s13P1:
      "We may update this policy; the current version is the one published at this URL. Continued use after material changes constitutes acceptance where permitted by law.",
  },
  refunds: {
    pageTitle: "Cancellations & refunds",
    metaTitle: "Cancellations & refunds | HydroNet",
    metaDescription:
      "Deposit policy, cancellations, Gold membership, and how to request a review — HydroNet LLC.",
    p1Part1:
      "This page summarizes deposit, cancellation, and adjustment rules for ",
    p1Part2: "Further contractual detail is in the ",
    p1Part3: ".",
    s1Title: "1. Reservation fee and deposit ($50)",
    s1NonGoldScheduling:
      "For bookings that are not part of a HydroNet Plumbing Gold membership (for example a single jetting visit or hourly work where the $50 reservation applies): cancellations should be requested at least 24 hours before the scheduled service time so we can adjust scheduling and evaluate any refund or credit of the deposit. Any amounts or adjustments will be determined according to the services actually provided and what is recorded in Stripe. These scheduling and deposit rules do not apply to subscription billing or included preventive visits under a Gold membership with HydroNet Plumbing.",
    s2Title: "2. Hourly service",
    s2P1Prefix:
      "Hourly service is billed with a minimum of one hour at checkout when configured; additional time may be billed per agreement on site. See the booking form for current rates (reference:",
    s2P1Suffix: "USD per hour or fraction, unless otherwise published).",
    s3Title: "3. HydroNet Gold membership",
    s3P2:
      "A HydroNet Plumbing Gold membership is billed as a subscription. Subscription cancellation may be managed from the customer dashboard when available. Early-termination or adjustment charges, if any, follow the commitment terms at signup and what is recorded in Stripe—they are separate from the 24-hour scheduling rule for non-membership bookings in section 1.",
    s4Title: "4. Jobs requiring a quote",
    s4P1Prefix: "Some jobs (e.g.,",
    s4P1Bold:
      "water heaters or work requiring prior evaluation",
    s4P1Suffix:
      ") may need a quote before a firm price is set. In those cases, refund or deposit scope depends on what is agreed in writing or in the quoting flow.",
    s5Title: "5. How to request a review",
    s5P1Prefix:
      "For charge disputes, payment questions, or cancellation-related requests, email",
    s5P1Suffix:
      "with the email used for the booking, approximate service date, and Stripe session ID if available (from confirmation email or receipt).",
    s6Title: "6. Business contact",
  },
};
