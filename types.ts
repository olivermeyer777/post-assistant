
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
    thinking: string;
    welcomeChat: string;
    errorGeneric: string;
    errorMicrophone: string;
    retry: string;
  }
}

export interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
}
