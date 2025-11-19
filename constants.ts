
import { TranslationData, Language } from './types';

// Helper function to merge partial translations with defaults (Deep Merge simplified)
const mergeTranslations = (base: TranslationData, update: any): TranslationData => {
  // This is a simplified merge for this specific structure
  return {
    ...base,
    ...update,
    tiles: { ...base.tiles, ...update.tiles },
    ui: { ...base.ui, ...update.ui },
    selfService: { 
      ...base.selfService, 
      ...update.selfService,
      steps: { ...base.selfService.steps, ...update.selfService?.steps },
      franking: { 
         ...base.selfService.franking, 
         ...update.selfService?.franking,
         fields: { ...base.selfService.franking.fields, ...update.selfService?.franking?.fields }
      },
      letter: { ...base.selfService.letter, ...update.selfService?.letter },
      payment: { ...base.selfService.payment, ...update.selfService?.payment },
      chat: { ...base.selfService.chat, ...update.selfService?.chat }
    }
  };
};

const DE_DEFAULTS: TranslationData = {
    topTitle: "PostAssistant",
    pageTitle: "Willkommen bei der Post",
    chatHeaderTitle: "PostAssistant Chat",
    chatPlaceholder: "Schreibe deine Frage…",
    chatSendLabel: "Senden",
    orakelViewTitle: "Wie können wir helfen?",
    orakelViewSubtitle: "Wähle ein Thema oder beschreibe dein Anliegen.",
    tiles: {
      orakel: {
        title: "Assistent",
        desc: "Stelle deine Frage an unseren KI-Assistenten für schnelle Antworten und Lösungen.",
        btnText: "Assistent starten",
      },
      self: {
        title: "Self-Service Assistent",
        desc: "Erledigen Sie ihre Postgeschäfte direkt hier im Self-Service, bei Bedarf mit Unterstützung eines digitalen Assistenten.",
        btnText: "Paket aufgeben",
        btnPacket: "Paket aufgeben",
        btnLetter: "Brief versenden",
        btnPayment: "Einzahlung (mit Karte)",
        btnOther: "Alles andere"
      },
      video: {
        title: "Video-Beratung",
        desc: "Persönliche Beratung per Video-Call mit unseren Expertinnen und Experten.",
        btnText: "Beratung starten",
      },
    },
    ui: {
      back: "Zurück",
      next: "Weiter",
      confirm: "Bestätigen",
      cancel: "Abbrechen",
      finish: "Abschliessen",
      thinking: "Ich denke nach…",
      welcomeChat: "Grüezi! Ich bin dein PostAssistant. Wie kann ich dir heute helfen?",
      errorGeneric: "Es ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.",
      errorMicrophone: "Mikrofonzugriff fehlgeschlagen. Bitte überprüfen Sie die Berechtigungen.",
      retry: "Erneut versuchen",
      pay: "Bezahlen"
    },
    selfService: {
      title: "Paket frankieren",
      titleLetter: "Brief versenden",
      titlePayment: "Einzahlung",
      titleChat: "Post Info",
      steps: {
        start: "Start",
        weigh: "Wiegen",
        address: "Adresse",
        format: "Format",
        options: "Versandart",
        pay: "Bezahlung",
        done: "Abschluss",
        scan: "Scan",
        details: "Details",
        check: "Prüfung"
      },
      franking: {
        destCH: "Schweiz / Liechtenstein",
        destInt: "Ausland",
        destIntNote: "Versenden ins Ausland ist hier nicht möglich. Bitte wenden Sie sich an den Schalter.",
        weighIntro: "Legen Sie Ihr Paket auf die Waage um zu starten.",
        weighAction: "Paket wiegen",
        weighing: "Paket wird analysiert...",
        detectedLabel: "Gewicht und Masse Ihres Pakets erkannt",
        weight: "Gewicht",
        length: "Länge",
        width: "Breite",
        height: "Höhe",
        addressSender: "Absender",
        addressReceiver: "Empfänger erfassen",
        isCompany: "Firma",
        isPrivate: "Privatperson",
        fields: {
          name: "Name, Vorname",
          street: "Strasse, Nr.",
          zip: "PLZ",
          city: "Ort"
        },
        shippingMethod: "Versandart auswählen",
        economy: "PostPac Economy",
        priority: "PostPac Priority",
        duration2days: "2 Werktage",
        duration1day: "Nächster Werktag",
        extras: "Zusatzleistung hinzufügen",
        signature: "Signatur",
        total: "Total",
        payTerminal: "Bitte nutzen Sie zur Zahlung das Kartenterminal.",
        payInstruction: "Zahlung mit Bargeld und TWINT nicht möglich",
        payButton: "Zahlung bestätigen",
        successTitle: "Vorgang erfolgreich",
        instruction1: "Quittung entnehmen.",
        instruction2: "Zahlungsbeleg aufbewahren.",
        instruction3: "Vorgang abgeschlossen.",
        feedbackTitle: "Wie zufrieden sind Sie mit Ihrer Erfahrung?",
        feedbackThanks: "Danke für Ihren Besuch!"
      },
      letter: {
        addressCheckTitle: "Brief Versenden - Adresse",
        addressCheckQuestion: "Haben Sie die Adresse auf dem Brief bereits erfasst?",
        addressCheckYes: "Ja\nAdresse ist vorhanden",
        addressCheckNo: "Nein\nAdresse erfassen",
        formatTitle: "Brief Versenden - Format",
        formatQuestion: "Welches Format hat ihre Sendung?",
        formatSmall: "Brief Normal",
        formatSmallDesc: "25 x 17cm / bis 100g / < 2cm",
        formatBig: "Brief Gross",
        formatBigDesc: "35 x 25 cm / bis 1000g / < 2cm",
        shippingTitle: "Brief Versenden - Versandart",
        shippingQuestion: "Wie möchten Sie ihre Sendung versenden?",
        bPost: "B-Post",
        aPost: "A-Post",
        express: "Express",
        extrasTitle: "Brief Versenden - Zusatzleistungen",
        extrasQuestion: "Bitte wählen Sie allfällige Zusatzleistungen aus (Mehrfachauswahl möglich):",
        extraRegistered: "Einschreiben",
        extraPrepaid: "Bereits vorfrankiert",
        extraFormat: "Format-Zuschlag"
      },
      payment: {
        scanTitle: "Einzahlen",
        scanInstruction: "Bitte platzieren Sie den QR-Code unter der Dokumentenkamera.",
        scanAction: "QR-Code scannen",
        detailsTitle: "Einzahlen - Zahlungsdetails",
        detailsIntro: "Bitte überprüfen Sie die Zahlungsdetails.",
        fieldIban: "Konto / IBAN",
        fieldAmount: "Betrag CHF",
        fieldRef: "Referenz",
        receiverTitle: "Einzahlen - Zahlungsempfänger",
        confirmTitle: "Einzahlen - Bestätigung",
        confirmQuestion: "Sind alle Angaben korrekt?",
        confirmYes: "Ja\nWeiter zur Abrechnung",
        confirmNo: "Nein\nZurück zur Eingabe",
        summaryTitle: "Bestätigung Einzahlung",
        summaryAccount: "auf Konto"
      },
      chat: {
        introTitle: "Wie kann ich helfen?",
        introDesc: "Tippen Sie auf das Mikrofon und stellen Sie Ihre Frage.",
        listening: "Ich höre zu...",
        sources: "Quellen:",
        tryAgain: "Neue Frage stellen"
      }
    }
};

// Creating translations for other languages by merging with DE defaults (simplified for prototype)
const createTranslation = (lang: string, overrides: any = {}): TranslationData => {
   return mergeTranslations(DE_DEFAULTS, overrides);
};

export const TRANSLATIONS: Record<Language, TranslationData> = {
  de: DE_DEFAULTS,
  fr: createTranslation('fr', {
    topTitle: "PostAssistant",
    pageTitle: "Bienvenue à la Poste",
    tiles: {
      self: {
        title: "Assistant Self-Service",
        desc: "Effectuez vos opérations postales directement ici en libre-service.",
        btnPacket: "Affranchir un colis",
        btnLetter: "Envoyer une lettre",
        btnPayment: "Versement (par carte)",
        btnOther: "Tout le reste"
      }
    },
    selfService: {
      title: "Affranchir un colis",
      titleLetter: "Envoyer une lettre",
      titlePayment: "Versement",
      titleChat: "Post Info",
      chat: {
        introTitle: "Comment puis-je vous aider?",
        introDesc: "Appuyez sur le microphone et posez votre question.",
        listening: "J'écoute...",
        sources: "Sources:",
        tryAgain: "Nouvelle question"
      }
    }
  }),
  it: createTranslation('it', {
    pageTitle: "Benvenuti alla Posta",
    tiles: {
       self: {
        title: "Assistente Self-Service",
        btnPacket: "Affrancare pacco",
        btnLetter: "Inviare lettera",
        btnPayment: "Versamento (con carta)",
        btnOther: "Tutto il resto"
       }
    },
    selfService: {
      titleChat: "Info Posta",
      chat: {
        introTitle: "Come posso aiutare?",
        listening: "Ascolto...",
        sources: "Fonti:",
        tryAgain: "Nuova domanda"
      }
    }
  }),
  en: createTranslation('en', {
    pageTitle: "Welcome to Swiss Post",
    tiles: {
       self: {
        title: "Self-Service Assistant",
        btnPacket: "Frank a package",
        btnLetter: "Send letter",
        btnPayment: "Payment (card)",
        btnOther: "Everything else"
       }
    },
    selfService: {
       title: "Frank a package",
       titleLetter: "Send letter",
       titlePayment: "Payment",
       titleChat: "Post Info",
       chat: {
        introTitle: "How can I help?",
        introDesc: "Tap the microphone and ask your question.",
        listening: "Listening...",
        sources: "Sources:",
        tryAgain: "Ask new question"
      }
    }
  }),
  es: createTranslation('es', {}),
  pt: createTranslation('pt', {})
};

export const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'de', label: 'Deutsch' },
  { code: 'fr', label: 'Français' },
  { code: 'it', label: 'Italiano' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'pt', label: 'Português' },
];
