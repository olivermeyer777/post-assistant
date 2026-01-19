
export type Language = 'de' | 'fr' | 'it' | 'en' | 'es' | 'pt';

export interface TileContent {
  title: string;
  desc: string;
  btnText: string;
  // Optional buttons for the multi-action Self-Service tile
  btnPacket?: string;
  btnLetter?: string;
  btnPayment?: string;
  btnTracking?: string; // Renamed from btnOther
}

export interface TranslationData {
  topTitle: string;
  pageTitle: string;
  chatHeaderTitle: string;
  chatPlaceholder: string;
  chatSendLabel: string;
  orakelViewTitle: string;
  orakelViewSubtitle: string;
  tiles: {
    orakel: TileContent;
    self: TileContent;
    video: TileContent;
  };
  ui: {
    back: string;
    next: string;
    confirm: string;
    cancel: string;
    finish: string;
    thinking: string;
    welcomeChat: string;
    errorGeneric: string;
    errorMicrophone: string;
    retry: string;
    pay: string;
    accessibility: string; // New
  };
  selfService: {
    title: string;
    titleLetter: string;
    titlePayment: string;
    titleTracking: string; // New
    steps: {
      start: string;
      weigh: string;
      address: string;
      format: string;
      options: string;
      pay: string;
      done: string;
      scan: string;
      details: string;
      check: string;
      trackInput: string; // New
      trackStatus: string; // New
    };
    franking: {
      destCH: string;
      destInt: string;
      destIntNote: string;
      weighIntro: string;
      weighAction: string;
      weighing: string;
      detectedLabel: string;
      weight: string;
      length: string;
      width: string;
      height: string;
      addressSender: string;
      addressReceiver: string;
      isCompany: string;
      isPrivate: string;
      fields: {
        name: string;
        street: string;
        zip: string;
        city: string;
      };
      shippingMethod: string;
      economy: string;
      priority: string;
      duration2days: string;
      duration1day: string;
      extras: string;
      signature: string;
      total: string;
      payTerminal: string;
      payInstruction: string;
      payButton: string;
      successTitle: string;
      instruction1: string;
      instruction2: string;
      instruction3: string;
      feedbackTitle: string;
      feedbackThanks: string;
    };
    letter: {
      addressCheckTitle: string;
      addressCheckQuestion: string;
      addressCheckYes: string;
      addressCheckNo: string;
      formatTitle: string;
      formatQuestion: string;
      formatSmall: string;
      formatSmallDesc: string;
      formatSmallDim: string; // New
      formatBig: string;
      formatBigDesc: string;
      formatBigDim: string; // New
      shippingTitle: string;
      shippingQuestion: string;
      bPost: string;
      aPost: string;
      express: string;
      extrasTitle: string;
      extrasQuestion: string;
      extraRegistered: string;
      extraPrepaid: string;
      extraFormat: string;
    };
    payment: {
      scanTitle: string;
      scanInstruction: string;
      scanAction: string;
      detailsTitle: string;
      detailsIntro: string;
      fieldIban: string;
      fieldAmount: string;
      fieldRef: string;
      receiverTitle: string;
      confirmTitle: string;
      confirmQuestion: string;
      confirmYes: string;
      confirmNo: string;
      summaryTitle: string;
      summaryAccount: string;
    };
    // New section for Tracking
    tracking: {
      searchLabel: string;
      searchButton: string;
      placeholder: string;
      errorRequired: string;
      statusTitle: string;
      statusLabel: string;
      currentStatus: string;
      history: string;
      step1: string; // Accepted
      step2: string; // Sorted
      step3: string; // Delivery
      step4: string; // Delivered
    };
  }
}

export interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  sources?: Array<{ title: string; uri: string }>; // Added specifically for Grounding
}
