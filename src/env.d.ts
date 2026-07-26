/// <reference types="astro/client" />

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
    /** Opens the "1 month free" email popup. Registered by EmailPopup.astro. */
    openEmailPopup?: () => void;
  }
}

export {};
