// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types
declare namespace App {
  // interface Locals {}
  // interface PageData {}
  // interface PageError {}
  // interface Platform {}

  interface PrivateEnv {
    DEBUG_FLAG_ENABLED: boolean;
    GH_DISCUSSION_CATEGORY_ID: string;
  }
}

declare module 'rrule/dist/es5/rrule.min.js';
