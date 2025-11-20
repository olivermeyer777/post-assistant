
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
      tracking: {
        searchLabel: "Sendungsnummer",
        searchButton: "Suchen",
        placeholder: "Sendungsnummer",
        errorRequired: "Feld ist erforderlich.",
        statusTitle: "Sendungsstatus",
        statusLabel: "Aktueller Status",
        currentStatus: "Sortierung",
        history: "Verlauf"
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
    topTitle: "PostAssistant",
    pageTitle: "Bienvenue à la Poste",
    chatHeaderTitle: "Chat PostAssistant",
    chatPlaceholder: "Posez votre question…",
    chatSendLabel: "Envoyer",
    tiles: {
      self: {
        title: "Assistant Self-Service",
        desc: "Effectuez vos opérations postales directement ici en libre-service.",
        btnPacket: "Expédier un colis",
        btnLetter: "Envoyer une lettre",
        btnPayment: "Versement (par carte)",
        btnTracking: "Suivre un envoi"
      },
      video: {
        title: "Conseil vidéo",
        desc: "Conseil personnalisé par appel vidéo avec nos experts.",
        btnText: "Démarrer le conseil"
      }
    },
    ui: {
      back: "Retour",
      next: "Suivant",
      confirm: "Confirmer",
      cancel: "Annuler",
      finish: "Terminer",
      pay: "Payer",
      thinking: "Je réfléchis...",
      errorGeneric: "Une erreur est survenue.",
      errorMicrophone: "Erreur microphone.",
    },
    selfService: {
      title: "Affranchir un colis",
      titleLetter: "Envoyer une lettre",
      titlePayment: "Versement",
      titleTracking: "Suivre un envoi",
      steps: {
        start: "Démarrer",
        weigh: "Peser",
        address: "Adresse",
        format: "Format",
        options: "Expédition",
        pay: "Paiement",
        done: "Fin",
        scan: "Scan",
        details: "Détails",
        check: "Contrôle",
        trackInput: "Saisie",
        trackStatus: "Statut"
      },
      tracking: {
        searchLabel: "Numéro d'envoi",
        searchButton: "Rechercher",
        placeholder: "Numéro d'envoi",
        errorRequired: "Champ obligatoire.",
        statusTitle: "Statut de l'envoi",
        statusLabel: "Statut actuel",
        currentStatus: "Tri",
        history: "Historique"
      }
    }
  }),
  it: createTranslation('it', {
    topTitle: "PostAssistant",
    pageTitle: "Benvenuti alla Posta",
    chatHeaderTitle: "Chat PostAssistant",
    chatPlaceholder: "Scrivi la tua domanda...",
    chatSendLabel: "Invia",
    tiles: {
       self: {
        title: "Assistente Self-Service",
        desc: "Svolgete le vostre operazioni postali direttamente qui.",
        btnPacket: "Spedire un pacco",
        btnLetter: "Inviare una lettera",
        btnPayment: "Versamento (con carta)",
        btnTracking: "Tracciare un invio"
       },
       video: {
        title: "Consulenza video",
        desc: "Consulenza personale tramite videochiamata.",
        btnText: "Avviare consulenza"
      }
    },
    ui: {
      back: "Indietro",
      next: "Avanti",
      confirm: "Confermare",
      cancel: "Annullare",
      finish: "Terminare",
      pay: "Pagare",
      thinking: "Sto pensando...",
      errorGeneric: "Si è verificato un errore.",
      errorMicrophone: "Errore microfono.",
    },
    selfService: {
      title: "Affrancare pacco",
      titleLetter: "Inviare lettera",
      titlePayment: "Versamento",
      titleTracking: "Tracciare invio",
      steps: {
        start: "Inizio",
        weigh: "Pesare",
        address: "Indirizzo",
        format: "Formato",
        options: "Spedizione",
        pay: "Pagamento",
        done: "Fine",
        scan: "Scansione",
        details: "Dettagli",
        check: "Verifica",
        trackInput: "Inserimento",
        trackStatus: "Stato"
      },
      tracking: {
        searchLabel: "Numero d'invio",
        searchButton: "Cercare",
        placeholder: "Numero d'invio",
        errorRequired: "Campo obbligatorio.",
        statusTitle: "Stato dell'invio",
        statusLabel: "Stato attuale",
        currentStatus: "Smistamento",
        history: "Cronologia"
      }
    }
  }),
  en: createTranslation('en', {
    topTitle: "PostAssistant",
    pageTitle: "Welcome to Swiss Post",
    chatHeaderTitle: "PostAssistant Chat",
    chatPlaceholder: "Type your question...",
    chatSendLabel: "Send",
    tiles: {
       self: {
        title: "Self-Service Assistant",
        desc: "Handle your postal services directly here using self-service.",
        btnPacket: "Send a parcel",
        btnLetter: "Send a letter",
        btnPayment: "Payment (card)",
        btnTracking: "Track a package"
       },
       video: {
        title: "Video Consultation",
        desc: "Personal advice via video call with our experts.",
        btnText: "Start consultation"
      }
    },
    ui: {
      back: "Back",
      next: "Next",
      confirm: "Confirm",
      cancel: "Cancel",
      finish: "Finish",
      pay: "Pay",
      thinking: "Thinking...",
      errorGeneric: "An error occurred.",
      errorMicrophone: "Microphone error.",
    },
    selfService: {
       title: "Frank a parcel",
       titleLetter: "Send a letter",
       titlePayment: "Payment",
       titleTracking: "Track package",
       steps: {
        start: "Start",
        weigh: "Weigh",
        address: "Address",
        format: "Format",
        options: "Shipping",
        pay: "Payment",
        done: "Done",
        scan: "Scan",
        details: "Details",
        check: "Check",
        trackInput: "Input",
        trackStatus: "Status"
      },
      tracking: {
        searchLabel: "Consignment number",
        searchButton: "Search",
        placeholder: "Consignment number",
        errorRequired: "Field is required.",
        statusTitle: "Shipment status",
        statusLabel: "Current status",
        currentStatus: "Sorting",
        history: "History"
      }
    }
  }),
  es: createTranslation('es', {
    topTitle: "PostAssistant",
    pageTitle: "Bienvenido a Correos",
    chatHeaderTitle: "Chat PostAssistant",
    chatPlaceholder: "Escribe tu pregunta...",
    chatSendLabel: "Enviar",
    tiles: {
      orakel: {
        title: "Asistente",
        desc: "Pregunte a nuestro asistente de IA.",
        btnText: "Iniciar asistente",
      },
      self: {
        title: "Asistente Autoservicio",
        desc: "Realice sus gestiones postales directamente aquí.",
        btnText: "Enviar paquete",
        btnPacket: "Enviar paquete",
        btnLetter: "Enviar carta",
        btnPayment: "Pago (con tarjeta)",
        btnTracking: "Rastrear paquete"
      },
      video: {
        title: "Videoconsulta",
        desc: "Asesoramiento personal por videollamada.",
        btnText: "Iniciar consulta",
      },
    },
    ui: {
      back: "Atrás",
      next: "Siguiente",
      confirm: "Confirmar",
      cancel: "Cancelar",
      finish: "Finalizar",
      pay: "Pagar",
      thinking: "Pensando...",
      welcomeChat: "¡Hola! Soy tu PostAssistant. ¿Cómo puedo ayudarte?",
      errorGeneric: "Ha ocurrido un error.",
      errorMicrophone: "Error de micrófono.",
      retry: "Reintentar"
    },
    selfService: {
      title: "Franquear paquete",
      titleLetter: "Enviar carta",
      titlePayment: "Pago",
      titleTracking: "Rastrear envío",
      steps: {
        start: "Inicio",
        weigh: "Pesar",
        address: "Dirección",
        format: "Formato",
        options: "Envío",
        pay: "Pago",
        done: "Fin",
        scan: "Escanear",
        details: "Detalles",
        check: "Revisión",
        trackInput: "Entrada",
        trackStatus: "Estado"
      },
      tracking: {
        searchLabel: "Número de envío",
        searchButton: "Buscar",
        placeholder: "Número de envío",
        errorRequired: "Campo obligatorio.",
        statusTitle: "Estado del envío",
        statusLabel: "Estado actual",
        currentStatus: "Clasificación",
        history: "Historial"
      }
    }
  }),
  pt: createTranslation('pt', {
    topTitle: "PostAssistant",
    pageTitle: "Bem-vindo aos Correios",
    chatHeaderTitle: "Chat PostAssistant",
    chatPlaceholder: "Escreva a sua pergunta...",
    chatSendLabel: "Enviar",
    tiles: {
      orakel: {
        title: "Assistente",
        desc: "Pergunte ao nosso assistente de IA.",
        btnText: "Iniciar assistente",
      },
      self: {
        title: "Assistente Self-Service",
        desc: "Realize os seus serviços postais diretamente aqui.",
        btnText: "Enviar encomenda",
        btnPacket: "Enviar encomenda",
        btnLetter: "Enviar carta",
        btnPayment: "Pagamento (cartão)",
        btnTracking: "Rastrear encomenda"
      },
      video: {
        title: "Videoconsulta",
        desc: "Aconselhamento pessoal por videochamada.",
        btnText: "Iniciar consulta",
      },
    },
    ui: {
      back: "Voltar",
      next: "Seguinte",
      confirm: "Confirmar",
      cancel: "Cancelar",
      finish: "Terminar",
      pay: "Pagar",
      thinking: "A pensar...",
      welcomeChat: "Olá! Sou o seu PostAssistant. Como posso ajudar?",
      errorGeneric: "Ocorreu um erro.",
      errorMicrophone: "Erro no microfone.",
      retry: "Tentar novamente"
    },
    selfService: {
      title: "Franquear encomenda",
      titleLetter: "Enviar carta",
      titlePayment: "Pagamento",
      titleTracking: "Rastrear",
      steps: {
        start: "Início",
        weigh: "Pesar",
        address: "Endereço",
        format: "Formato",
        options: "Envio",
        pay: "Pagamento",
        done: "Fim",
        scan: "Digitalizar",
        details: "Detalhes",
        check: "Verificação",
        trackInput: "Entrada",
        trackStatus: "Estado"
      },
      tracking: {
        searchLabel: "Número de envio",
        searchButton: "Pesquisar",
        placeholder: "Número de envio",
        errorRequired: "Campo obrigatório.",
        statusTitle: "Estado do envio",
        statusLabel: "Estado atual",
        currentStatus: "Triagem",
        history: "Histórico"
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
