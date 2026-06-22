/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    locale: import("./i18n").Locale;
    dir: "ltr" | "rtl";
    t: import("./i18n").TranslationDict;
  }
}
