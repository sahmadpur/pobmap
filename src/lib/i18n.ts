import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import az from "@/data/locales/az.json";
import en from "@/data/locales/en.json";
import ru from "@/data/locales/ru.json";

const resources = {
  az: { translation: az },
  en: { translation: en },
  ru: { translation: ru },
};

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: "az",
    fallbackLng: "az",
    interpolation: {
      escapeValue: false,
    },
    returnNull: false,
  });
}

export default i18n;

