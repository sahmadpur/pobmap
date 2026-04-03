import type { LocalizedText, SupportedLocale } from "@/types/map";

const DISPLAY_NAME_LOCALES: Record<SupportedLocale, string> = {
  az: "az",
  en: "en",
  ru: "ru",
};

const DISPLAY_NAMES = {
  az: new Intl.DisplayNames([DISPLAY_NAME_LOCALES.az], { type: "region" }),
  en: new Intl.DisplayNames([DISPLAY_NAME_LOCALES.en], { type: "region" }),
  ru: new Intl.DisplayNames([DISPLAY_NAME_LOCALES.ru], { type: "region" }),
};

export const ISO_COUNTRY_CODES = [
  "AD", "AE", "AF", "AG", "AL", "AM", "AO", "AR", "AT", "AU", "AZ",
  "BA", "BB", "BD", "BE", "BF", "BG", "BH", "BI", "BJ", "BN", "BO",
  "BR", "BS", "BT", "BW", "BY", "BZ", "CA", "CD", "CF", "CG", "CH",
  "CI", "CL", "CM", "CN", "CO", "CR", "CU", "CV", "CY", "CZ", "DE",
  "DJ", "DK", "DM", "DO", "DZ", "EC", "EE", "EG", "ER", "ES", "ET",
  "FI", "FJ", "FM", "FR", "GA", "GB", "GD", "GE", "GH", "GM", "GN",
  "GQ", "GR", "GT", "GW", "GY", "HK", "HN", "HR", "HT", "HU", "ID",
  "IE", "IL", "IN", "IQ", "IR", "IS", "IT", "JM", "JO", "JP", "KE",
  "KG", "KH", "KI", "KM", "KN", "KP", "KR", "KW", "KZ", "LA", "LB",
  "LC", "LI", "LK", "LR", "LS", "LT", "LU", "LV", "LY", "MA", "MC",
  "MD", "ME", "MG", "MH", "MK", "ML", "MM", "MN", "MO", "MR", "MT",
  "MU", "MV", "MW", "MX", "MY", "MZ", "NA", "NE", "NG", "NI", "NL",
  "NO", "NP", "NR", "NZ", "OM", "PA", "PE", "PG", "PH", "PK", "PL",
  "PR", "PS", "PT", "PW", "PY", "QA", "RO", "RS", "RU", "RW", "SA",
  "SB", "SC", "SD", "SE", "SG", "SI", "SK", "SL", "SM", "SN", "SO",
  "SR", "SS", "ST", "SV", "SY", "SZ", "TD", "TG", "TH", "TJ", "TL",
  "TM", "TN", "TO", "TR", "TT", "TW", "TZ", "UA", "UG", "US", "UY",
  "UZ", "VA", "VC", "VE", "VN", "VU", "WS", "YE", "ZA", "ZM", "ZW",
] as const;

const COUNTRY_NAME_OVERRIDES: Partial<Record<string, LocalizedText>> = {
  AZ: { az: "Azərbaycan", en: "Azerbaijan", ru: "Азербайджан" },
  DE: { az: "Almaniya", en: "Germany", ru: "Германия" },
  ES: { az: "İspaniya", en: "Spain", ru: "Испания" },
  FI: { az: "Finlandiya", en: "Finland", ru: "Финляндия" },
  GE: { az: "Gürcüstan", en: "Georgia", ru: "Грузия" },
  HU: { az: "Macarıstan", en: "Hungary", ru: "Венгрия" },
  IQ: { az: "İraq", en: "Iraq", ru: "Ирак" },
  IR: { az: "İran", en: "Iran", ru: "Иран" },
  IT: { az: "İtaliya", en: "Italy", ru: "Италия" },
  JO: { az: "İordaniya", en: "Jordan", ru: "Иордания" },
  NL: { az: "Niderland", en: "Netherlands", ru: "Нидерланды" },
  RO: { az: "Rumıniya", en: "Romania", ru: "Румыния" },
  RU: { az: "Rusiya", en: "Russia", ru: "Россия" },
  SA: { az: "Səudiyyə Ərəbistanı", en: "Saudi Arabia", ru: "Саудовская Аравия" },
  SY: { az: "Suriya", en: "Syria", ru: "Сирия" },
  TM: { az: "Türkmənistan", en: "Turkmenistan", ru: "Туркменистан" },
  TR: { az: "Türkiyə", en: "Turkey", ru: "Турция" },
  US: { az: "ABŞ", en: "United States", ru: "США" },
  GB: { az: "Birləşmiş Krallıq", en: "United Kingdom", ru: "Великобритания" },
  AE: { az: "Birləşmiş Ərəb Əmirlikləri", en: "United Arab Emirates", ru: "Объединенные Арабские Эмираты" },
  CZ: { az: "Çexiya", en: "Czechia", ru: "Чехия" },
  CN: { az: "Çin", en: "China", ru: "Китай" },
};

function getDisplayName(code: string, locale: SupportedLocale): string {
  return DISPLAY_NAMES[locale].of(code) ?? code;
}

export function getCountryLocalizedText(code: string): LocalizedText {
  return (
    COUNTRY_NAME_OVERRIDES[code] ?? {
      az: getDisplayName(code, "az"),
      en: getDisplayName(code, "en"),
      ru: getDisplayName(code, "ru"),
    }
  );
}

export const COUNTRY_NAMES: Record<string, LocalizedText> = Object.fromEntries(
  ISO_COUNTRY_CODES.map((code) => [code, getCountryLocalizedText(code)]),
) as Record<string, LocalizedText>;

export function getCountryName(code: string, locale: SupportedLocale): string {
  return COUNTRY_NAMES[code]?.[locale] ?? code;
}

export function getCountryFlagEmoji(code: string): string {
  if (!/^[A-Z]{2}$/i.test(code)) {
    return "🏳";
  }

  return String.fromCodePoint(
    ...code
      .toUpperCase()
      .split("")
      .map((character) => 127397 + character.charCodeAt(0)),
  );
}
