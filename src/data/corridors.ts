import type {
  Coordinate,
  CorridorRoute,
  LocalizedText,
  MapView,
  PortMarker,
  SupportedLocale,
  TransportMode,
} from "@/types/map";
export {
  COUNTRY_NAMES,
  getCountryFlagEmoji,
  getCountryLocalizedText,
  getCountryName,
  ISO_COUNTRY_CODES,
} from "@/data/countries";

export const SUPPORTED_LOCALES: SupportedLocale[] = ["az", "en", "ru"];

export const DEFAULT_MAP_VIEW: MapView = {
  center: [41, 49],
  zoom: 4,
};

export const TRANSPORT_MODE_META: Record<
  TransportMode,
  { color: string; labelKey: `mode.${TransportMode}` }
> = {
  rail: {
    color: "#E8A838",
    labelKey: "mode.rail",
  },
  ship: {
    color: "#3B8ED4",
    labelKey: "mode.ship",
  },
  road: {
    color: "#5CB85C",
    labelKey: "mode.road",
  },
};

export function getLocalizedText(
  value: LocalizedText,
  locale: SupportedLocale,
): string {
  return value[locale] ?? value.az;
}

export const BAKU_PORT: PortMarker = {
  id: "baku-port",
  coordinates: [40.3572, 49.835],
  name: {
    az: "Bakı Limanı",
    en: "Baku Port",
    ru: "Бакинский порт",
  },
  role: {
    az: "Ələt qovşağı Şərq-Qərb, Şimal-Cənub, Şimal-Qərb və Cənub-Qərb dəhlizlərini birləşdirən əsas logistika mərkəzidir.",
    en: "The Alat gateway acts as the anchor logistics hub linking the East-West, North-South, North-West, and South-West corridors.",
    ru: "Узел в Аляте служит ключевым логистическим центром, связывающим коридоры Восток-Запад, Север-Юг, Северо-Запад и Юго-Запад.",
  },
  connectedCorridorIds: [
    "middle-corridor",
    "eurasian-corridor",
    "north-south",
    "lapis-lazuli",
    "zangazur",
  ],
};

const PRESENTATION_SEGMENT_PATHS: Record<string, Coordinate[]> = {
  "middle-1": [
    [34.3416, 108.9398],
    [36.0611, 103.8343],
    [38.4872, 106.2309],
    [43.8256, 87.6168],
    [44.2, 80.4],
    [43.2389, 76.8897],
  ],
  "middle-2": [
    [43.2389, 76.8897],
    [44.8, 73.1],
    [46.5, 67.8],
    [45.1, 59.2],
    [43.6532, 51.1975],
  ],
  "middle-3": [
    [43.6532, 51.1975],
    [43.4, 50.7],
    [42.7, 50.1],
    [41.8, 49.7],
    [40.3572, 49.835],
  ],
  "middle-4": [
    [40.3572, 49.835],
    [41.7151, 44.8271],
    [40.6013, 43.0947],
    [39.9334, 32.8597],
    [41.0082, 28.9784],
    [42.6977, 23.3219],
    [44.7866, 20.4489],
    [47.4979, 19.0402],
  ],
  "middle-5": [
    [47.4979, 19.0402],
    [48.2082, 16.3738],
    [50.1109, 8.6821],
    [51.9244, 4.4777],
    [50.8503, 4.3517],
    [48.8566, 2.3522],
    [41.3851, 2.1734],
    [40.4168, -3.7038],
  ],
  "eurasian-1": [
    [40.3572, 49.835],
    [42.6977, 47.5034],
    [46.3497, 48.0408],
    [48.708, 44.5133],
    [52.286, 43.996],
    [55.7558, 37.6173],
  ],
  "eurasian-2": [
    [55.7558, 37.6173],
    [56.8389, 60.6057],
    [55.0084, 82.9357],
    [52.2869, 104.305],
    [52.0339, 113.4994],
    [48.4802, 135.0719],
    [43.1155, 131.8855],
  ],
  "eurasian-3": [
    [40.3572, 49.835],
    [41.7151, 44.8271],
    [40.6013, 43.0947],
  ],
  "north-south-1": [
    [60.1699, 24.9384],
    [59.9343, 30.3351],
    [55.7558, 37.6173],
    [50.4501, 30.5234],
    [46.3497, 48.0408],
    [42.6977, 47.5034],
    [40.3572, 49.835],
  ],
  "north-south-2": [
    [40.3572, 49.835],
    [38.4329, 48.8742],
    [37.5536, 45.0761],
    [35.6892, 51.389],
    [31.8974, 54.3569],
    [29.5918, 52.5837],
    [27.1832, 56.2666],
  ],
  "north-south-3": [
    [27.1832, 56.2666],
    [24.8, 60.4],
    [22.3, 65.2],
    [20.2, 69.9],
    [18.96, 72.82],
  ],
  "lapis-1": [
    [40.3572, 49.835],
    [41.7151, 44.8271],
    [40.6013, 43.0947],
    [39.9334, 32.8597],
    [41.0082, 28.9784],
  ],
  "lapis-2": [
    [41.0082, 28.9784],
    [42.6977, 23.3219],
    [44.7866, 20.4489],
    [45.815, 15.9819],
    [45.4642, 9.19],
    [43.2965, 5.3698],
    [41.3851, 2.1734],
    [40.4168, -3.7038],
  ],
  "lapis-3": [
    [40.3572, 49.835],
    [38.4329, 48.8742],
    [35.6892, 51.389],
    [31.5497, 74.3436],
    [24.8607, 67.0011],
    [18.96, 72.82],
  ],
  "zangazur-1": [
    [40.3572, 49.835],
    [39.3989, 47.0289],
    [39.2089, 45.4122],
  ],
  "zangazur-2": [
    [39.2089, 45.4122],
    [39.7191, 43.0503],
    [40.6013, 43.0947],
  ],
  "iraq-1": [
    [29.9744, 48.4728],
    [30.5085, 47.7804],
    [31.0428, 46.2619],
    [33.3152, 44.3661],
  ],
  "iraq-2": [
    [33.3152, 44.3661],
    [36.3367, 43.1189],
    [37.0662, 37.3833],
  ],
  "hejaz-1": [
    [24.5247, 39.5692],
    [28.3998, 36.5715],
    [31.9539, 35.9106],
  ],
  "hejaz-2": [
    [31.9539, 35.9106],
    [32.5556, 36.0062],
    [33.5138, 36.2765],
  ],
};

function applyPresentationPaths(routes: CorridorRoute[]): CorridorRoute[] {
  return routes.map((route) => ({
    ...route,
    segments: route.segments.map((segment) => ({
      ...segment,
      displayCoordinates:
        PRESENTATION_SEGMENT_PATHS[segment.id] ?? segment.displayCoordinates,
    })),
  }));
}

export const CORRIDORS: CorridorRoute[] = applyPresentationPaths([
  {
    id: "middle-corridor",
    name: {
      az: "Şərq-Qərb Dəhlizi",
      en: "East-West Corridor",
      ru: "Коридор Восток-Запад",
    },
    routeColor: "#F97316",
    type: "primary",
    totalDistanceKm: 11200,
    transitTime: {
      az: "14-18 gün",
      en: "14-18 days",
      ru: "14-18 дней",
    },
    countries: ["CN", "KZ", "AZ", "GE", "TR", "RO", "HU", "DE", "NL", "BE", "FR", "ES", "IT"],
    description: {
      az: "Yükləri Çin və Mərkəzi Asiyadan Xəzər keçidi, Bakı-Tbilisi-Qars oxu və Avropadakı paylama şəbəkələrinə bağlayan əsas Şərq-Qərb marşrutu.",
      en: "The principal East-West corridor links China and Central Asia to the Caspian crossing, the Baku-Tbilisi-Kars spine, and onward European distribution networks.",
      ru: "Основной коридор Восток-Запад связывает Китай и Центральную Азию с каспийским переходом, осью Баку-Тбилиси-Карс и европейскими распределительными сетями.",
    },
    status: "active",
    animationSpeed: 0.12,
    segments: [
      {
        id: "middle-1",
        mode: "rail",
        from: {
          az: "Sian",
          en: "Xi'an",
          ru: "Сиань",
        },
        to: {
          az: "Almatı",
          en: "Almaty",
          ru: "Алматы",
        },
        distanceKm: 3900,
        coordinates: [
          [34.3416, 108.9398],
          [39.9042, 116.4074],
          [41.8057, 123.4315],
          [43.8256, 87.6168],
          [43.2389, 76.8897],
        ],
      },
      {
        id: "middle-2",
        mode: "rail",
        from: {
          az: "Almatı",
          en: "Almaty",
          ru: "Алматы",
        },
        to: {
          az: "Aktau",
          en: "Aktau",
          ru: "Актау",
        },
        distanceKm: 2700,
        coordinates: [
          [43.2389, 76.8897],
          [47.1068, 51.9166],
          [43.6532, 51.1975],
        ],
      },
      {
        id: "middle-3",
        mode: "ship",
        from: {
          az: "Aktau",
          en: "Aktau",
          ru: "Актау",
        },
        to: {
          az: "Bakı",
          en: "Baku",
          ru: "Баку",
        },
        distanceKm: 470,
        coordinates: [
          [43.6532, 51.1975],
          [42.6, 50.9],
          [40.3572, 49.835],
        ],
      },
      {
        id: "middle-4",
        mode: "rail",
        from: {
          az: "Bakı",
          en: "Baku",
          ru: "Баку",
        },
        to: {
          az: "Budapeşt",
          en: "Budapest",
          ru: "Будапешт",
        },
        distanceKm: 3200,
        coordinates: [
          [40.3572, 49.835],
          [41.7151, 44.8271],
          [40.6013, 43.0947],
          [41.0082, 28.9784],
          [44.4268, 26.1025],
          [47.4979, 19.0402],
        ],
      },
      {
        id: "middle-5",
        mode: "road",
        from: {
          az: "Budapeşt",
          en: "Budapest",
          ru: "Будапешт",
        },
        to: {
          az: "Benilüks / İberiya qovşaqları",
          en: "Benelux / Iberian gateways",
          ru: "Узлы Бенилюкса и Иберии",
        },
        distanceKm: 1400,
        coordinates: [
          [47.4979, 19.0402],
          [48.8566, 2.3522],
          [50.8503, 4.3517],
          [52.3676, 4.9041],
          [40.4168, -3.7038],
        ],
      },
    ],
  },
  {
    id: "eurasian-corridor",
    name: {
      az: "Şimal-Qərb Dəhlizi",
      en: "North-West Corridor",
      ru: "Коридор Северо-Запад",
    },
    routeColor: "#06B6D4",
    type: "primary",
    totalDistanceKm: 9800,
    transitTime: {
      az: "16-20 gün",
      en: "16-20 days",
      ru: "16-20 дней",
    },
    countries: ["AZ", "RU", "KZ", "CN", "FI", "TR"],
    description: {
      az: "Şimal-Qərb dəhlizi Bakı qovşağını Moskva, Sankt-Peterburq, Rusiya boyunca Uzaq Şərq çıxışları və Türkiyə bağlantıları ilə birləşdirir.",
      en: "The North-West corridor links the Baku hub with Moscow, St. Petersburg, Russia's Far East gateways, and supporting western links through Turkey.",
      ru: "Коридор Северо-Запад связывает бакинский узел с Москвой, Санкт-Петербургом, дальневосточными выходами России и западными связями через Турцию.",
    },
    status: "active",
    animationSpeed: 0.1,
    segments: [
      {
        id: "eurasian-1",
        mode: "rail",
        from: {
          az: "Bakı",
          en: "Baku",
          ru: "Баку",
        },
        to: {
          az: "Moskva",
          en: "Moscow",
          ru: "Москва",
        },
        distanceKm: 2500,
        coordinates: [
          [40.3572, 49.835],
          [42.6977, 47.5034],
          [46.3497, 48.0408],
          [55.7558, 37.6173],
        ],
      },
      {
        id: "eurasian-2",
        mode: "rail",
        from: {
          az: "Moskva",
          en: "Moscow",
          ru: "Москва",
        },
        to: {
          az: "Vladivostok",
          en: "Vladivostok",
          ru: "Владивосток",
        },
        distanceKm: 6500,
        coordinates: [
          [55.7558, 37.6173],
          [59.9343, 30.3351],
          [55.0084, 82.9357],
          [52.2869, 104.305],
          [48.4802, 135.0719],
          [43.1155, 131.8855],
        ],
      },
      {
        id: "eurasian-3",
        mode: "rail",
        from: {
          az: "Bakı",
          en: "Baku",
          ru: "Баку",
        },
        to: {
          az: "Qars",
          en: "Kars",
          ru: "Карс",
        },
        distanceKm: 800,
        coordinates: [
          [40.3572, 49.835],
          [41.7151, 44.8271],
          [40.6013, 43.0947],
        ],
      },
    ],
  },
  {
    id: "north-south",
    name: {
      az: "Şimal-Cənub Dəhlizi",
      en: "North-South Corridor",
      ru: "Коридор Север-Юг",
    },
    routeColor: "#22C55E",
    type: "primary",
    totalDistanceKm: 9100,
    transitTime: {
      az: "18-22 gün",
      en: "18-22 days",
      ru: "18-22 дня",
    },
    countries: ["RU", "AZ", "IR", "IN", "FI", "DE", "NL", "BE", "FR"],
    description: {
      az: "Şimal-Cənub dəhlizi Skandinaviya və Rusiya bazarlarını Azərbaycan və İran üzərindən Hind okeanı limanlarına bağlayan əsas ox kimi göstərilir.",
      en: "The North-South corridor is presented as the main axis linking Nordic and Russian markets through Azerbaijan and Iran to Indian Ocean gateways.",
      ru: "Коридор Север-Юг показан как основная ось, связывающая северные и российские рынки через Азербайджан и Иран с портами Индийского океана.",
    },
    status: "active",
    animationSpeed: 0.09,
    segments: [
      {
        id: "north-south-1",
        mode: "rail",
        from: {
          az: "Helsinki / Sankt-Peterburq",
          en: "Helsinki / St. Petersburg",
          ru: "Хельсинки / Санкт-Петербург",
        },
        to: {
          az: "Bakı",
          en: "Baku",
          ru: "Баку",
        },
        distanceKm: 3200,
        coordinates: [
          [60.1699, 24.9384],
          [59.9343, 30.3351],
          [55.7558, 37.6173],
          [46.3497, 48.0408],
          [40.4093, 49.8671],
          [40.3572, 49.835],
        ],
      },
      {
        id: "north-south-2",
        mode: "rail",
        from: {
          az: "Bakı",
          en: "Baku",
          ru: "Баку",
        },
        to: {
          az: "Bəndər-Abbas",
          en: "Bandar Abbas",
          ru: "Бендер-Аббас",
        },
        distanceKm: 3600,
        coordinates: [
          [40.3572, 49.835],
          [38.4329, 48.8742],
          [37.5536, 45.0761],
          [35.6892, 51.389],
          [27.1832, 56.2666],
        ],
      },
      {
        id: "north-south-3",
        mode: "ship",
        from: {
          az: "Bəndər-Abbas",
          en: "Bandar Abbas",
          ru: "Бендер-Аббас",
        },
        to: {
          az: "Mumbay",
          en: "Mumbai",
          ru: "Мумбаи",
        },
        distanceKm: 1500,
        coordinates: [
          [27.1832, 56.2666],
          [24.8607, 67.0011],
          [18.96, 72.82],
        ],
      },
    ],
  },
  {
    id: "lapis-lazuli",
    name: {
      az: "Cənub-Qərb Dəhlizi",
      en: "South-West Corridor",
      ru: "Коридор Юго-Запад",
    },
    routeColor: "#A855F7",
    type: "primary",
    totalDistanceKm: 7600,
    transitTime: {
      az: "12-17 gün",
      en: "12-17 days",
      ru: "12-17 дней",
    },
    countries: ["AZ", "GE", "TR", "RO", "HU", "IT", "FR", "ES", "IR", "PK", "IN"],
    description: {
      az: "Cənub-Qərb dəhlizi Bakıdan bir tərəfdən Türkiyə və Cənubi Avropa şəbəkələrinə, digər tərəfdən İran vasitəsilə Pakistan və Hindistana uzanan marşrutları əhatə edir.",
      en: "The South-West corridor covers flows from Baku toward Turkey and Southern Europe, while also extending south through Iran to Pakistan and India.",
      ru: "Коридор Юго-Запад охватывает потоки из Баку в сторону Турции и Южной Европы, а также южное продолжение через Иран к Пакистану и Индии.",
    },
    status: "active",
    animationSpeed: 0.08,
    segments: [
      {
        id: "lapis-1",
        mode: "rail",
        from: {
          az: "Bakı",
          en: "Baku",
          ru: "Баку",
        },
        to: {
          az: "İstanbul",
          en: "Istanbul",
          ru: "Стамбул",
        },
        distanceKm: 2200,
        coordinates: [
          [40.3572, 49.835],
          [41.7151, 44.8271],
          [40.6013, 43.0947],
          [39.9334, 32.8597],
          [41.0082, 28.9784],
        ],
      },
      {
        id: "lapis-2",
        mode: "road",
        from: {
          az: "İstanbul",
          en: "Istanbul",
          ru: "Стамбул",
        },
        to: {
          az: "Madrid",
          en: "Madrid",
          ru: "Мадрид",
        },
        distanceKm: 2600,
        coordinates: [
          [41.0082, 28.9784],
          [41.9028, 12.4964],
          [43.2965, 5.3698],
          [48.8566, 2.3522],
          [40.4168, -3.7038],
        ],
      },
      {
        id: "lapis-3",
        mode: "road",
        from: {
          az: "Bakı",
          en: "Baku",
          ru: "Баку",
        },
        to: {
          az: "Mumbay",
          en: "Mumbai",
          ru: "Мумбаи",
        },
        distanceKm: 2800,
        coordinates: [
          [40.3572, 49.835],
          [35.6892, 51.389],
          [30.3753, 69.3451],
          [24.8607, 67.0011],
          [18.96, 72.82],
        ],
      },
    ],
  },
  {
    id: "zangazur",
    name: {
      az: "Zəngəzur Dəhlizi",
      en: "Zangazur Corridor",
      ru: "Зангезурский коридор",
    },
    routeColor: "#EF4444",
    type: "secondary",
    totalDistanceKm: 960,
    transitTime: {
      az: "2-4 gün",
      en: "2-4 days",
      ru: "2-4 дня",
    },
    countries: ["AZ", "TR"],
    description: {
      az: "Azərbaycanın qərb rayonlarını Naxçıvan və Türkiyə ilə daha birbaşa birləşdirməsi nəzərdə tutulan dəhliz.",
      en: "A planned corridor designed to connect mainland Azerbaijan more directly with Nakhchivan and Turkey.",
      ru: "Планируемый коридор, который должен напрямую связать основную территорию Азербайджана с Нахчываном и Турцией.",
    },
    status: "planned",
    animationSpeed: 0.06,
    segments: [
      {
        id: "zangazur-1",
        mode: "road",
        from: {
          az: "Bakı",
          en: "Baku",
          ru: "Баку",
        },
        to: {
          az: "Naxçıvan",
          en: "Nakhchivan",
          ru: "Нахчыван",
        },
        distanceKm: 520,
        coordinates: [
          [40.3572, 49.835],
          [39.3989, 47.0289],
          [39.2089, 45.4122],
        ],
      },
      {
        id: "zangazur-2",
        mode: "rail",
        from: {
          az: "Naxçıvan",
          en: "Nakhchivan",
          ru: "Нахчыван",
        },
        to: {
          az: "Qars",
          en: "Kars",
          ru: "Карс",
        },
        distanceKm: 440,
        coordinates: [
          [39.2089, 45.4122],
          [39.7191, 43.0503],
          [40.6013, 43.0947],
        ],
      },
    ],
  },
  {
    id: "iraq-railway",
    name: {
      az: "İraq Dəmir Yolu",
      en: "Iraq Railway",
      ru: "Железная дорога Ирака",
    },
    routeColor: "#84CC16",
    type: "secondary",
    totalDistanceKm: 1680,
    transitTime: {
      az: "4-6 gün",
      en: "4-6 days",
      ru: "4-6 дней",
    },
    countries: ["IQ", "TR"],
    description: {
      az: "Faw limanını Bağdad və Türkiyə sərhədi ilə birləşdirən planlaşdırılan yük xətti regionun cənub bağlantısını gücləndirə bilər.",
      en: "The planned freight spine from Faw Port through Baghdad to Turkey would strengthen the southern link of regional corridor systems.",
      ru: "Планируемая грузовая магистраль от порта Фао через Багдад к Турции может усилить южное звено региональных коридоров.",
    },
    status: "planned",
    animationSpeed: 0.05,
    segments: [
      {
        id: "iraq-1",
        mode: "rail",
        from: {
          az: "Faw Limanı",
          en: "Faw Port",
          ru: "Порт Фао",
        },
        to: {
          az: "Bağdad",
          en: "Baghdad",
          ru: "Багдад",
        },
        distanceKm: 620,
        coordinates: [
          [29.9744, 48.4728],
          [30.5085, 47.7804],
          [33.3152, 44.3661],
        ],
      },
      {
        id: "iraq-2",
        mode: "rail",
        from: {
          az: "Bağdad",
          en: "Baghdad",
          ru: "Багдад",
        },
        to: {
          az: "Qaziantep",
          en: "Gaziantep",
          ru: "Газиантеп",
        },
        distanceKm: 1060,
        coordinates: [
          [33.3152, 44.3661],
          [36.3367, 43.1189],
          [37.0662, 37.3833],
        ],
      },
    ],
  },
  {
    id: "hejaz-railway",
    name: {
      az: "Hicaz Dəmir Yolu",
      en: "Hejaz Railway",
      ru: "Хиджазская железная дорога",
    },
    routeColor: "#EAB308",
    type: "secondary",
    totalDistanceKm: 1520,
    transitTime: {
      az: "5-7 gün",
      en: "5-7 days",
      ru: "5-7 дней",
    },
    countries: ["SA", "JO", "SY"],
    description: {
      az: "Ərəbistan yarımadasını İordaniya və Suriya üzərindən Levant marşrutları ilə birləşdirən tarixi və potensial müasir dəmir yolu oxu.",
      en: "A historic and potentially revived rail axis connecting the Arabian Peninsula with Jordan and Syria.",
      ru: "Историческая и потенциально возрождаемая железнодорожная ось, соединяющая Аравийский полуостров с Иорданией и Сирией.",
    },
    status: "planned",
    animationSpeed: 0.05,
    segments: [
      {
        id: "hejaz-1",
        mode: "rail",
        from: {
          az: "Mədinə",
          en: "Medina",
          ru: "Медина",
        },
        to: {
          az: "Əmman",
          en: "Amman",
          ru: "Амман",
        },
        distanceKm: 980,
        coordinates: [
          [24.5247, 39.5692],
          [28.3998, 36.5715],
          [31.9539, 35.9106],
        ],
      },
      {
        id: "hejaz-2",
        mode: "rail",
        from: {
          az: "Əmman",
          en: "Amman",
          ru: "Амман",
        },
        to: {
          az: "Dəməşq",
          en: "Damascus",
          ru: "Дамаск",
        },
        distanceKm: 540,
        coordinates: [
          [31.9539, 35.9106],
          [32.5556, 36.0062],
          [33.5138, 36.2765],
        ],
      },
    ],
  },
]);
