
declare namespace NodeJS {
  interface ProcessEnv {
    readonly API_KEY: string;
    readonly [key: string]: string | undefined;
  }
}
