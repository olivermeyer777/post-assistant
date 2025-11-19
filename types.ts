
export type Language = 'de' | 'fr' | 'it' | 'en' | 'es' | 'pt';

export interface TileContent {
  title: string;
  desc: string;
  btnText: string;
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
  };
  selfService: {
    title: string;
    steps: {
      start: string;
      weigh: string;
      address: string;
      options: string;
      pay: string;
      done: string;
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
  }
}

export interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
}