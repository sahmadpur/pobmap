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

function localizedStopName(
  en: string,
  overrides: Partial<LocalizedText> = {},
): LocalizedText {
  return {
    az: overrides.az ?? en,
    en,
    ru: overrides.ru ?? en,
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
  createStop("rotterdam", "NL", [51.9244, 4.4777], localizedStopName("Rotterdam")),
  createStop("antwerp", "BE", [51.2194, 4.4025], localizedStopName("Antwerp")),
  createStop("hamburg", "DE", [53.5511, 9.9937], localizedStopName("Hamburg")),
  createStop("bremerhaven", "DE", [53.5396, 8.5809], localizedStopName("Bremerhaven")),
  createStop("duisburg", "DE", [51.4344, 6.7623], localizedStopName("Duisburg")),
  createStop("frankfurt", "DE", [50.1109, 8.6821], localizedStopName("Frankfurt")),
  createStop("munich", "DE", [48.1351, 11.582], localizedStopName("Munich")),
  createStop("warsaw", "PL", [52.2297, 21.0122], localizedStopName("Warsaw")),
  createStop("gdansk", "PL", [54.352, 18.6466], localizedStopName("Gdansk")),
  createStop("prague", "CZ", [50.0755, 14.4378], localizedStopName("Prague")),
  createStop("vienna", "AT", [48.2082, 16.3738], localizedStopName("Vienna")),
  createStop("bratislava", "SK", [48.1486, 17.1077], localizedStopName("Bratislava")),
  createStop("belgrade", "RS", [44.7866, 20.4489], localizedStopName("Belgrade")),
  createStop("sofia", "BG", [42.6977, 23.3219], localizedStopName("Sofia")),
  createStop("thessaloniki", "GR", [40.6401, 22.9444], localizedStopName("Thessaloniki")),
  createStop("piraeus", "GR", [37.942, 23.6465], localizedStopName("Piraeus")),
  createStop("trieste", "IT", [45.6495, 13.7768], localizedStopName("Trieste")),
  createStop("milan", "IT", [45.4642, 9.19], localizedStopName("Milan")),
  createStop("genoa", "IT", [44.4056, 8.9463], localizedStopName("Genoa")),
  createStop("lyon", "FR", [45.764, 4.8357], localizedStopName("Lyon")),
  createStop("le-havre", "FR", [49.4944, 0.1079], localizedStopName("Le Havre")),
  createStop("barcelona", "ES", [41.3851, 2.1734], localizedStopName("Barcelona")),
  createStop("valencia", "ES", [39.4699, -0.3763], localizedStopName("Valencia")),
  createStop("lisbon", "PT", [38.7223, -9.1393], localizedStopName("Lisbon")),
  createStop("constanta", "RO", [44.1598, 28.6348], localizedStopName("Constanta")),
  createStop("dubai-jebel-ali", "AE", [25.0657, 55.1713], localizedStopName("Dubai / Jebel Ali")),
  createStop("abu-dhabi", "AE", [24.4539, 54.3773], localizedStopName("Abu Dhabi")),
  createStop("doha", "QA", [25.2854, 51.531], localizedStopName("Doha")),
  createStop("dammam", "SA", [26.4207, 50.0888], localizedStopName("Dammam")),
  createStop("riyadh", "SA", [24.7136, 46.6753], localizedStopName("Riyadh")),
  createStop("jeddah", "SA", [21.4858, 39.1925], localizedStopName("Jeddah")),
  createStop("kuwait-city", "KW", [29.3759, 47.9774], localizedStopName("Kuwait City")),
  createStop("muscat", "OM", [23.588, 58.3829], localizedStopName("Muscat")),
  createStop("salalah", "OM", [17.0194, 54.0897], localizedStopName("Salalah")),
  createStop("alexandria", "EG", [31.2001, 29.9187], localizedStopName("Alexandria")),
  createStop("cairo", "EG", [30.0444, 31.2357], localizedStopName("Cairo")),
  createStop("casablanca", "MA", [33.5731, -7.5898], localizedStopName("Casablanca")),
  createStop("tangier-med", "MA", [35.8946, -5.5033], localizedStopName("Tangier Med")),
  createStop("lagos", "NG", [6.5244, 3.3792], localizedStopName("Lagos")),
  createStop("durban", "ZA", [-29.8587, 31.0218], localizedStopName("Durban")),
  createStop("johannesburg", "ZA", [-26.2041, 28.0473], localizedStopName("Johannesburg")),
  createStop("nairobi", "KE", [-1.2921, 36.8219], localizedStopName("Nairobi")),
  createStop("djibouti", "DJ", [11.5721, 43.1456], localizedStopName("Djibouti")),
  createStop("addis-ababa", "ET", [8.9806, 38.7578], localizedStopName("Addis Ababa")),
  createStop("shanghai", "CN", [31.2304, 121.4737], localizedStopName("Shanghai")),
  createStop("ningbo", "CN", [29.8683, 121.544], localizedStopName("Ningbo")),
  createStop("shenzhen", "CN", [22.5431, 114.0579], localizedStopName("Shenzhen")),
  createStop("guangzhou", "CN", [23.1291, 113.2644], localizedStopName("Guangzhou")),
  createStop("qingdao", "CN", [36.0671, 120.3826], localizedStopName("Qingdao")),
  createStop("tianjin", "CN", [39.0842, 117.2009], localizedStopName("Tianjin")),
  createStop("dalian", "CN", [38.914, 121.6147], localizedStopName("Dalian")),
  createStop("chengdu", "CN", [30.5728, 104.0668], localizedStopName("Chengdu")),
  createStop("chongqing", "CN", [29.4316, 106.9123], localizedStopName("Chongqing")),
  createStop("zhengzhou", "CN", [34.7473, 113.6249], localizedStopName("Zhengzhou")),
  createStop("wuhan", "CN", [30.5928, 114.3055], localizedStopName("Wuhan")),
  createStop("yiwu", "CN", [29.3151, 120.0768], localizedStopName("Yiwu")),
  createStop("lianyungang", "CN", [34.5969, 119.2216], localizedStopName("Lianyungang")),
  createStop("hong-kong", "HK", [22.3193, 114.1694], localizedStopName("Hong Kong")),
  createStop("taipei", "TW", [25.033, 121.5654], localizedStopName("Taipei")),
  createStop("kaohsiung", "TW", [22.6273, 120.3014], localizedStopName("Kaohsiung")),
  createStop("busan", "KR", [35.1796, 129.0756], localizedStopName("Busan")),
  createStop("incheon", "KR", [37.4563, 126.7052], localizedStopName("Incheon")),
  createStop("tokyo", "JP", [35.6762, 139.6503], localizedStopName("Tokyo")),
  createStop("yokohama", "JP", [35.4437, 139.638], localizedStopName("Yokohama")),
  createStop("osaka", "JP", [34.6937, 135.5023], localizedStopName("Osaka")),
  createStop("nagoya", "JP", [35.1815, 136.9066], localizedStopName("Nagoya")),
  createStop("singapore", "SG", [1.3521, 103.8198], localizedStopName("Singapore")),
  createStop("port-klang", "MY", [3.0033, 101.3991], localizedStopName("Port Klang")),
  createStop("kuala-lumpur", "MY", [3.139, 101.6869], localizedStopName("Kuala Lumpur")),
  createStop("bangkok", "TH", [13.7563, 100.5018], localizedStopName("Bangkok")),
  createStop("laem-chabang", "TH", [13.0833, 100.8833], localizedStopName("Laem Chabang")),
  createStop("ho-chi-minh-city", "VN", [10.8231, 106.6297], localizedStopName("Ho Chi Minh City")),
  createStop("hanoi", "VN", [21.0278, 105.8342], localizedStopName("Hanoi")),
  createStop("hai-phong", "VN", [20.8449, 106.6881], localizedStopName("Hai Phong")),
  createStop("jakarta", "ID", [-6.2088, 106.8456], localizedStopName("Jakarta")),
  createStop("surabaya", "ID", [-7.2575, 112.7521], localizedStopName("Surabaya")),
  createStop("manila", "PH", [14.5995, 120.9842], localizedStopName("Manila")),
  createStop("cebu", "PH", [10.3157, 123.8854], localizedStopName("Cebu")),
  createStop("colombo", "LK", [6.9271, 79.8612], localizedStopName("Colombo")),
  createStop("chennai", "IN", [13.0827, 80.2707], localizedStopName("Chennai")),
  createStop("delhi", "IN", [28.6139, 77.209], localizedStopName("Delhi")),
  createStop("mundra", "IN", [22.8395, 69.7217], localizedStopName("Mundra")),
  createStop("new-york", "US", [40.7128, -74.006], localizedStopName("New York / New Jersey")),
  createStop("norfolk", "US", [36.8508, -76.2859], localizedStopName("Norfolk")),
  createStop("savannah", "US", [32.0809, -81.0912], localizedStopName("Savannah")),
  createStop("houston", "US", [29.7604, -95.3698], localizedStopName("Houston")),
  createStop("los-angeles", "US", [34.0522, -118.2437], localizedStopName("Los Angeles / Long Beach")),
  createStop("seattle", "US", [47.6062, -122.3321], localizedStopName("Seattle")),
  createStop("chicago", "US", [41.8781, -87.6298], localizedStopName("Chicago")),
  createStop("memphis", "US", [35.1495, -90.049], localizedStopName("Memphis")),
  createStop("atlanta", "US", [33.749, -84.388], localizedStopName("Atlanta")),
  createStop("miami", "US", [25.7617, -80.1918], localizedStopName("Miami")),
  createStop("vancouver", "CA", [49.2827, -123.1207], localizedStopName("Vancouver")),
  createStop("toronto", "CA", [43.6532, -79.3832], localizedStopName("Toronto")),
  createStop("montreal", "CA", [45.5017, -73.5673], localizedStopName("Montreal")),
  createStop("mexico-city", "MX", [19.4326, -99.1332], localizedStopName("Mexico City")),
  createStop("monterrey", "MX", [25.6866, -100.3161], localizedStopName("Monterrey")),
  createStop("veracruz", "MX", [19.1738, -96.1342], localizedStopName("Veracruz")),
  createStop("panama-city", "PA", [8.9824, -79.5199], localizedStopName("Panama City")),
  createStop("colon", "PA", [9.3547, -79.9001], localizedStopName("Colon")),
  createStop("cartagena", "CO", [10.391, -75.4794], localizedStopName("Cartagena")),
  createStop("santos", "BR", [-23.9608, -46.3336], localizedStopName("Santos")),
  createStop("sao-paulo", "BR", [-23.5558, -46.6396], localizedStopName("Sao Paulo")),
  createStop("buenos-aires", "AR", [-34.6037, -58.3816], localizedStopName("Buenos Aires")),
  createStop("montevideo", "UY", [-34.9011, -56.1645], localizedStopName("Montevideo")),
  createStop("callao", "PE", [-12.0464, -77.0428], localizedStopName("Callao / Lima")),
  createStop("santiago", "CL", [-33.4489, -70.6693], localizedStopName("Santiago")),
  createStop("sydney", "AU", [-33.8688, 151.2093], localizedStopName("Sydney")),
  createStop("melbourne", "AU", [-37.8136, 144.9631], localizedStopName("Melbourne")),
  createStop("brisbane", "AU", [-27.4698, 153.0251], localizedStopName("Brisbane")),
  createStop("perth", "AU", [-31.9505, 115.8605], localizedStopName("Perth")),
  createStop("auckland", "NZ", [-36.8509, 174.7645], localizedStopName("Auckland")),
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
