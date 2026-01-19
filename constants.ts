
import { TranslationData, Language } from './types';

// Helper function to merge partial translations with defaults (Deep Merge simplified)
const mergeTranslations = (base: TranslationData, update: any): TranslationData => {
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
      tracking: { ...base.selfService.tracking, ...update.selfService?.tracking }
    }
  };
};

const DE_DEFAULTS: TranslationData = {
    topTitle: "PostAssistant",
    pageTitle: "Willkommen bei der Post",
    chatHeaderTitle: "PostAssistant Chat",
    chatPlaceholder: "Schreiben Sie Ihre Frage…",
    chatSendLabel: "Senden",
    orakelViewTitle: "Wie können wir helfen?",
    orakelViewSubtitle: "Wählen Sie ein Thema oder beschreiben Sie Ihr Anliegen.",
    tiles: {
      orakel: {
        title: "Assistent",
        desc: "Stellen Sie Ihre Frage an unseren KI-Assistenten für schnelle Antworten und Lösungen.",
        btnText: "Assistent starten",
      },
      self: {
        title: "Self-Service Assistent",
        desc: "Erledigen Sie Ihre Postgeschäfte direkt hier im Self-Service, bei Bedarf mit Unterstützung eines digitalen Assistenten.",
        btnText: "Paket aufgeben",
        btnPacket: "Paket aufgeben",
        btnLetter: "Brief versenden",
        btnPayment: "Einzahlung (mit Karte)",
        btnTracking: "Paket verfolgen"
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
      welcomeChat: "Grüezi! Ich bin Ihr PostAssistant. Wie kann ich Ihnen heute helfen?",
      errorGeneric: "Es ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.",
      errorMicrophone: "Mikrofonzugriff fehlgeschlagen. Bitte überprüfen Sie die Berechtigungen.",
      retry: "Erneut versuchen",
      pay: "Bezahlen",
      accessibility: "Barrierefreiheit"
    },
    selfService: {
      title: "Paket frankieren",
      titleLetter: "Brief versenden",
      titlePayment: "Einzahlung",
      titleTracking: "Sendung verfolgen",
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
        check: "Prüfung",
        trackInput: "Eingabe",
        trackStatus: "Status"
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
        formatQuestion: "Welches Format hat Ihre Sendung?",
        formatSmall: "Brief Normal (B5)",
        formatSmallDesc: "Bis 100g, < 2cm Dicke",
        formatSmallDim: "25 x 17.6 cm",
        formatBig: "Brief Gross (B4)",
        formatBigDesc: "Bis 1000g, < 2cm Dicke",
        formatBigDim: "35.3 x 25 cm",
        shippingTitle: "Brief Versenden - Versandart",
        shippingQuestion: "Wie möchten Sie Ihre Sendung versenden?",
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
      tracking: {
        searchLabel: "Sendungsnummer",
        searchButton: "Suchen",
        placeholder: "Sendungsnummer",
        errorRequired: "Feld ist erforderlich.",
        statusTitle: "Sendungsstatus",
        statusLabel: "Aktueller Status",
        currentStatus: "Sortierung",
        history: "Verlauf",
        step1: "Aufgegeben",
        step2: "Sortiert",
        step3: "In Zustellung",
        step4: "Zugestellt"
      }
    }
};

// Creating translations for other languages
const createTranslation = (lang: string, overrides: any = {}): TranslationData => {
   return mergeTranslations(DE_DEFAULTS, overrides);
};

export const TRANSLATIONS: Record<Language, TranslationData> = {
  de: DE_DEFAULTS,
  fr: createTranslation('fr', {
    // ... (Keep existing overrides)
    selfService: {
        // ...
        letter: {
            formatSmall: "Lettre Standard (B5)",
            formatSmallDesc: "Jusqu'à 100g, < 2cm",
            formatSmallDim: "25 x 17.6 cm",
            formatBig: "Grande Lettre (B4)",
            formatBigDesc: "Jusqu'à 1000g, < 2cm",
            formatBigDim: "35.3 x 25 cm",
        },
        tracking: {
            step1: "Déposé",
            step2: "Trié",
            step3: "En distribution",
            step4: "Distribué"
        }
    }
  }),
  it: createTranslation('it', {
     selfService: {
        // ...
        letter: {
            formatSmall: "Lettera Standard (B5)",
            formatSmallDesc: "Fino a 100g, < 2cm",
            formatSmallDim: "25 x 17.6 cm",
            formatBig: "Lettera Grande (B4)",
            formatBigDesc: "Fino a 1000g, < 2cm",
            formatBigDim: "35.3 x 25 cm",
        },
        tracking: {
            step1: "Impostato",
            step2: "Smistato",
            step3: "In consegna",
            step4: "Consegnato"
        }
    }
  }),
  en: createTranslation('en', {
     selfService: {
        // ...
        letter: {
            formatSmall: "Standard Letter (B5)",
            formatSmallDesc: "Up to 100g, < 2cm",
            formatSmallDim: "25 x 17.6 cm",
            formatBig: "Large Letter (B4)",
            formatBigDesc: "Up to 1000g, < 2cm",
            formatBigDim: "35.3 x 25 cm",
        },
        tracking: {
            step1: "Posted",
            step2: "Sorted",
            step3: "Out for delivery",
            step4: "Delivered"
        }
    }
  }),
  es: createTranslation('es', {
      selfService: {
          tracking: {
              step1: "Admitido",
              step2: "Clasificado",
              step3: "En reparto",
              step4: "Entregado"
          }
      }
  }),
  pt: createTranslation('pt', {
      selfService: {
          tracking: {
              step1: "Aceite",
              step2: "Tratamento",
              step3: "Em distribuição",
              step4: "Entregue"
          }
      }
  })
};

export const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'de', label: 'Deutsch' },
  { code: 'fr', label: 'Français' },
  { code: 'it', label: 'Italiano' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'pt', label: 'Português' },
];
