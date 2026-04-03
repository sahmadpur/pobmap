import { COUNTRY_NAMES } from "@/data/corridors";
import type { Coordinate, LocalizedText, SupportedLocale } from "@/types/map";

export interface TransportStop {
  id: string;
  name: LocalizedText;
  countryCode: string;
  coordinates: Coordinate;
  editorVisible?: boolean;
}

function createStop(
  id: string,
  countryCode: string,
  coordinates: Coordinate,
  name: LocalizedText,
  editorVisible = true,
): TransportStop {
  return {
    id,
    name,
    countryCode,
    coordinates,
    editorVisible,
  };
}

export const TRANSPORT_STOPS: TransportStop[] = [
  createStop("xian", "CN", [34.3416, 108.9398], {
    az: "Sian",
    en: "Xi'an",
    ru: "Сиань",
  }),
  createStop("beijing", "CN", [39.9042, 116.4074], {
    az: "Pekin",
    en: "Beijing",
    ru: "Пекин",
  }),
  createStop("shenyang", "CN", [41.8057, 123.4315], {
    az: "Şenyan",
    en: "Shenyang",
    ru: "Шэньян",
  }),
  createStop("urumqi", "CN", [43.8256, 87.6168], {
    az: "Urumçi",
    en: "Urumqi",
    ru: "Урумчи",
  }),
  createStop("almaty", "KZ", [43.2389, 76.8897], {
    az: "Almatı",
    en: "Almaty",
    ru: "Алматы",
  }),
  createStop("atyrau", "KZ", [47.1068, 51.9166], {
    az: "Atırau",
    en: "Atyrau",
    ru: "Атырау",
  }),
  createStop("aktau", "KZ", [43.6532, 51.1975], {
    az: "Aktau",
    en: "Aktau",
    ru: "Актау",
  }),
  createStop("caspian-crossing", "XZ", [42.6, 50.9], {
    az: "Xəzər keçidi",
    en: "Caspian Crossing",
    ru: "Каспийский переход",
  }, false),
  createStop("baku-port", "AZ", [40.3572, 49.835], {
    az: "Bakı",
    en: "Baku",
    ru: "Баку",
  }),
  createStop("baku-city", "AZ", [40.4093, 49.8671], {
    az: "Bakı şəhəri",
    en: "Baku City",
    ru: "Баку",
  }),
  createStop("tbilisi", "GE", [41.7151, 44.8271], {
    az: "Tbilisi",
    en: "Tbilisi",
    ru: "Тбилиси",
  }),
  createStop("kars", "TR", [40.6013, 43.0947], {
    az: "Qars",
    en: "Kars",
    ru: "Карс",
  }),
  createStop("istanbul", "TR", [41.0082, 28.9784], {
    az: "İstanbul",
    en: "Istanbul",
    ru: "Стамбул",
  }),
  createStop("bucharest", "RO", [44.4268, 26.1025], {
    az: "Buxarest",
    en: "Bucharest",
    ru: "Бухарест",
  }),
  createStop("budapest", "HU", [47.4979, 19.0402], {
    az: "Budapeşt",
    en: "Budapest",
    ru: "Будапешт",
  }),
  createStop("paris", "FR", [48.8566, 2.3522], {
    az: "Paris",
    en: "Paris",
    ru: "Париж",
  }),
  createStop("brussels", "BE", [50.8503, 4.3517], {
    az: "Brüssel",
    en: "Brussels",
    ru: "Брюссель",
  }),
  createStop("amsterdam", "NL", [52.3676, 4.9041], {
    az: "Amsterdam",
    en: "Amsterdam",
    ru: "Амстердам",
  }),
  createStop("madrid", "ES", [40.4168, -3.7038], {
    az: "Madrid",
    en: "Madrid",
    ru: "Мадрид",
  }),
  createStop("makhachkala", "RU", [42.6977, 47.5034], {
    az: "Maxaçqala",
    en: "Makhachkala",
    ru: "Махачкала",
  }),
  createStop("astrakhan", "RU", [46.3497, 48.0408], {
    az: "Həştərxan",
    en: "Astrakhan",
    ru: "Астрахань",
  }),
  createStop("moscow", "RU", [55.7558, 37.6173], {
    az: "Moskva",
    en: "Moscow",
    ru: "Москва",
  }),
  createStop("st-petersburg", "RU", [59.9343, 30.3351], {
    az: "Sankt-Peterburq",
    en: "St. Petersburg",
    ru: "Санкт-Петербург",
  }),
  createStop("novosibirsk", "RU", [55.0084, 82.9357], {
    az: "Novosibirsk",
    en: "Novosibirsk",
    ru: "Новосибирск",
  }),
  createStop("irkutsk", "RU", [52.2869, 104.305], {
    az: "İrkutsk",
    en: "Irkutsk",
    ru: "Иркутск",
  }),
  createStop("khabarovsk", "RU", [48.4802, 135.0719], {
    az: "Xabarovsk",
    en: "Khabarovsk",
    ru: "Хабаровск",
  }),
  createStop("vladivostok", "RU", [43.1155, 131.8855], {
    az: "Vladivostok",
    en: "Vladivostok",
    ru: "Владивосток",
  }),
  createStop("helsinki", "FI", [60.1699, 24.9384], {
    az: "Helsinki",
    en: "Helsinki",
    ru: "Хельсинки",
  }),
  createStop("lankaran", "AZ", [38.4329, 48.8742], {
    az: "Lənkəran",
    en: "Lankaran",
    ru: "Ленкорань",
  }),
  createStop("tabriz", "IR", [37.5536, 45.0761], {
    az: "Təbriz",
    en: "Tabriz",
    ru: "Тебриз",
  }),
  createStop("tehran", "IR", [35.6892, 51.389], {
    az: "Tehran",
    en: "Tehran",
    ru: "Тегеран",
  }),
  createStop("bandar-abbas", "IR", [27.1832, 56.2666], {
    az: "Bəndər-Abbas",
    en: "Bandar Abbas",
    ru: "Бендер-Аббас",
  }),
  createStop("karachi", "PK", [24.8607, 67.0011], {
    az: "Kəraçi",
    en: "Karachi",
    ru: "Карачи",
  }),
  createStop("mumbai", "IN", [18.96, 72.82], {
    az: "Mumbay",
    en: "Mumbai",
    ru: "Мумбаи",
  }),
  createStop("ankara", "TR", [39.9334, 32.8597], {
    az: "Ankara",
    en: "Ankara",
    ru: "Анкара",
  }),
  createStop("rome", "IT", [41.9028, 12.4964], {
    az: "Roma",
    en: "Rome",
    ru: "Рим",
  }),
  createStop("marseille", "FR", [43.2965, 5.3698], {
    az: "Marsel",
    en: "Marseille",
    ru: "Марсель",
  }),
  createStop("pakistan-corridor-junction", "PK", [30.3753, 69.3451], {
    az: "Pakistan qovşağı",
    en: "Pakistan Corridor Junction",
    ru: "Пакистанский коридорный узел",
  }, false),
  createStop("zangilan", "AZ", [39.3989, 47.0289], {
    az: "Zəngilan",
    en: "Zangilan",
    ru: "Зангилан",
  }),
  createStop("nakhchivan", "AZ", [39.2089, 45.4122], {
    az: "Naxçıvan",
    en: "Nakhchivan",
    ru: "Нахчыван",
  }),
  createStop("igdir", "TR", [39.7191, 43.0503], {
    az: "İğdır",
    en: "Igdir",
    ru: "Ыгдыр",
  }),
  createStop("faw-port", "IQ", [29.9744, 48.4728], {
    az: "Faw Limanı",
    en: "Faw Port",
    ru: "Порт Фао",
  }),
  createStop("basra", "IQ", [30.5085, 47.7804], {
    az: "Bəsrə",
    en: "Basra",
    ru: "Басра",
  }),
  createStop("baghdad", "IQ", [33.3152, 44.3661], {
    az: "Bağdad",
    en: "Baghdad",
    ru: "Багдад",
  }),
  createStop("mosul", "IQ", [36.3367, 43.1189], {
    az: "Mosul",
    en: "Mosul",
    ru: "Мосул",
  }),
  createStop("gaziantep", "TR", [37.0662, 37.3833], {
    az: "Qaziantep",
    en: "Gaziantep",
    ru: "Газиантеп",
  }),
  createStop("medina", "SA", [24.5247, 39.5692], {
    az: "Mədinə",
    en: "Medina",
    ru: "Медина",
  }),
  createStop("tabuk", "SA", [28.3998, 36.5715], {
    az: "Tabuk",
    en: "Tabuk",
    ru: "Табук",
  }),
  createStop("amman", "JO", [31.9539, 35.9106], {
    az: "Əmman",
    en: "Amman",
    ru: "Амман",
  }),
  createStop("daraa", "SY", [32.5556, 36.0062], {
    az: "Dəraa",
    en: "Daraa",
    ru: "Дераа",
  }),
  createStop("damascus", "SY", [33.5138, 36.2765], {
    az: "Dəməşq",
    en: "Damascus",
    ru: "Дамаск",
  }),
];

export const TRANSPORT_STOPS_BY_ID = Object.fromEntries(
  TRANSPORT_STOPS.map((stop) => [stop.id, stop]),
) as Record<string, TransportStop>;

export function getStopCoordinateKey(coordinate: Coordinate): string {
  return `${coordinate[0]},${coordinate[1]}`;
}

export const TRANSPORT_STOPS_BY_COORDINATE = Object.fromEntries(
  TRANSPORT_STOPS.map((stop) => [getStopCoordinateKey(stop.coordinates), stop]),
) as Record<string, TransportStop>;

export function getTransportStop(stopId: string): TransportStop | null {
  return TRANSPORT_STOPS_BY_ID[stopId] ?? null;
}

export function getTransportStopByCoordinate(
  coordinate: Coordinate,
): TransportStop | null {
  return TRANSPORT_STOPS_BY_COORDINATE[getStopCoordinateKey(coordinate)] ?? null;
}

export function getTransportStopLabel(
  stop: TransportStop,
  locale: SupportedLocale,
): string {
  return stop.name[locale];
}

export function getTransportStopCountryLabel(
  stop: TransportStop,
  locale: SupportedLocale,
): string {
  return COUNTRY_NAMES[stop.countryCode]?.[locale] ?? stop.countryCode;
}

export function searchTransportStops(query: string): TransportStop[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();

  if (!normalizedQuery) {
    return TRANSPORT_STOPS.filter((stop) => stop.editorVisible !== false).slice(0, 10);
  }

  return TRANSPORT_STOPS.filter((stop) => {
    if (stop.editorVisible === false) {
      return false;
    }

    const searchable = [
      stop.id,
      stop.countryCode,
      stop.name.az,
      stop.name.en,
      stop.name.ru,
      COUNTRY_NAMES[stop.countryCode]?.az,
      COUNTRY_NAMES[stop.countryCode]?.en,
      COUNTRY_NAMES[stop.countryCode]?.ru,
    ]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase();

    return searchable.includes(normalizedQuery);
  }).slice(0, 10);
}
