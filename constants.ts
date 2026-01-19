
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
        
        // New Packet Address Check
        packetAddressCheckTitle: "Adresse prüfen",
        packetAddressCheckQuestion: "Ist die Empfängeradresse bereits auf dem Paket?",
        
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
        
        feedbackTitle: "Rückmeldung",
        feedbackQuestion: "Wie wahrscheinlich ist es, dass Sie diesen Service weiterempfehlen?",
        feedbackThanks: "Danke für Ihr Feedback!"
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
    pageTitle: "Bienvenue à la Poste",
    orakelViewSubtitle: "Choisissez un sujet ou décrivez votre demande.",
    tiles: {
        self: {
            title: "Assistant libre-service",
            desc: "Effectuez vos opérations postales directement ici, avec l'aide d'un assistant numérique si nécessaire.",
            btnPacket: "Envoyer un colis",
            btnLetter: "Envoyer une lettre",
            btnPayment: "Paiement",
            btnTracking: "Suivi de colis"
        }
    },
    ui: {
        back: "Retour",
        next: "Suivant",
        pay: "Payer",
        accessibility: "Accessibilité",
        welcomeChat: "Bonjour ! Je suis votre Assistant Poste. Comment puis-je vous aider ?"
    },
    selfService: {
        title: "Affranchir un colis",
        titleLetter: "Envoyer une lettre",
        titlePayment: "Paiement",
        titleTracking: "Suivi de l'envoi",
        franking: {
            packetAddressCheckQuestion: "L'adresse du destinataire figure-t-elle déjà sur le colis ?",
            feedbackQuestion: "Quelle est la probabilité que vous recommandiez ce service ?",
            destCH: "Suisse / Liechtenstein",
            weighAction: "Peser le colis",
            payButton: "Confirmer le paiement"
        },
        letter: {
            formatSmall: "Lettre Standard (B5)",
            formatSmallDesc: "Jusqu'à 100g, < 2cm",
            formatSmallDim: "25 x 17.6 cm",
            formatBig: "Grande Lettre (B4)",
            formatBigDesc: "Jusqu'à 1000g, < 2cm",
            formatBigDim: "35.3 x 25 cm",
            addressCheckYes: "Oui, adresse présente",
            addressCheckNo: "Non, saisir l'adresse"
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
     pageTitle: "Benvenuti alla Posta",
     orakelViewSubtitle: "Scegli un argomento o descrivi la tua richiesta.",
     tiles: {
        self: {
            title: "Assistente Self-Service",
            desc: "Svolgete le vostre operazioni postali direttamente qui, se necessario con l'aiuto di un assistente digitale.",
            btnPacket: "Inviare un pacco",
            btnLetter: "Inviare una lettera",
            btnPayment: "Pagamento",
            btnTracking: "Tracciare un pacco"
        }
     },
     ui: {
        back: "Indietro",
        next: "Avanti",
        pay: "Pagare",
        accessibility: "Accessibilità",
        welcomeChat: "Buongiorno! Sono il vostro Assistente Posta. Come posso aiutarvi?"
    },
     selfService: {
        title: "Affrancare un pacco",
        titleLetter: "Inviare una lettera",
        titlePayment: "Pagamento",
        titleTracking: "Traccia la spedizione",
        franking: {
            packetAddressCheckQuestion: "L'indirizzo del destinatario è già sul pacco?",
            feedbackQuestion: "Con quale probabilità raccomanderebbe questo servizio?",
            destCH: "Svizzera / Liechtenstein",
            weighAction: "Pesare il pacco",
            payButton: "Confermare pagamento"
        },
        letter: {
            formatSmall: "Lettera Standard (B5)",
            formatSmallDesc: "Fino a 100g, < 2cm",
            formatSmallDim: "25 x 17.6 cm",
            formatBig: "Lettera Grande (B4)",
            formatBigDesc: "Fino a 1000g, < 2cm",
            formatBigDim: "35.3 x 25 cm",
            addressCheckYes: "Sì, indirizzo presente",
            addressCheckNo: "No, inserire indirizzo"
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
     pageTitle: "Welcome to Swiss Post",
     orakelViewSubtitle: "Choose a topic or describe your request.",
     tiles: {
        self: {
            title: "Self-Service Assistant",
            desc: "Take care of your postal business right here in self-service, with the support of a digital assistant if needed.",
            btnPacket: "Send a parcel",
            btnLetter: "Send a letter",
            btnPayment: "Payment",
            btnTracking: "Track parcel"
        }
     },
     ui: {
        back: "Back",
        next: "Next",
        pay: "Pay",
        accessibility: "Accessibility",
        welcomeChat: "Hello! I am your PostAssistant. How can I help you today?"
    },
     selfService: {
        title: "Frank a parcel",
        titleLetter: "Send a letter",
        titlePayment: "Bill Payment",
        titleTracking: "Track Shipment",
        franking: {
            packetAddressCheckQuestion: "Is the recipient address already on the parcel?",
            feedbackQuestion: "How likely are you to recommend this service?",
            destCH: "Switzerland / Liechtenstein",
            weighAction: "Weigh parcel",
            payButton: "Confirm Payment"
        },
        letter: {
            formatSmall: "Standard Letter (B5)",
            formatSmallDesc: "Up to 100g, < 2cm",
            formatSmallDim: "25 x 17.6 cm",
            formatBig: "Large Letter (B4)",
            formatBigDesc: "Up to 1000g, < 2cm",
            formatBigDim: "35.3 x 25 cm",
            addressCheckYes: "Yes, address present",
            addressCheckNo: "No, enter address"
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
      pageTitle: "Bienvenido a Correos",
      ui: { back: "Atrás", next: "Siguiente", pay: "Pagar", accessibility: "Accesibilidad", welcomeChat: "¡Hola! Soy tu asistente." },
      selfService: {
          franking: {
               packetAddressCheckQuestion: "¿La dirección del destinatario ya está en el paquete?",
               feedbackQuestion: "¿Qué probabilidad hay de que recomiende este servicio?"
          },
          tracking: {
              step1: "Admitido",
              step2: "Clasificado",
              step3: "En reparto",
              step4: "Entregado"
          }
      }
  }),
  pt: createTranslation('pt', {
      pageTitle: "Bem-vindo aos Correios",
      ui: { back: "Voltar", next: "Seguinte", pay: "Pagar", accessibility: "Acessibilidade", welcomeChat: "Olá! Sou o seu assistente." },
      selfService: {
          franking: {
               packetAddressCheckQuestion: "O endereço do destinatário já está na encomenda?",
               feedbackQuestion: "Qual a probabilidade de recomendar este serviço?"
          },
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
