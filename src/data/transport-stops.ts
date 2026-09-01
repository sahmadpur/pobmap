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
  createStop("beijing", "CN", [39.848382997920844, 116.63069557250218], {
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
  createStop("baku-city", "AZ", [40.41198017472428, 49.86442770644292], {
    az: "Bakı şəhəri",
    en: "Baku City",
    ru: "Баку",
  }),
  createStop("tbilisi", "GE", [41.7151, 44.8271], {
    az: "Tbilisi",
    en: "Tbilisi",
    ru: "Тбилиси",
  }),
  createStop("kars", "TR", [40.600439086831614, 43.09907678698981], {
    az: "Qars",
    en: "Kars",
    ru: "Карс",
  }),
  createStop("istanbul", "TR", [41.012778558625435, 28.989682085852195], {
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
  createStop("makhachkala", "RU", [42.98868773101421, 47.49974364170113], {
    az: "Maxaçqala",
    en: "Makhachkala",
    ru: "Махачкала",
  }),
  createStop("astrakhan", "RU", [46.36181378554353, 48.04775306886071], {
    az: "Həştərxan",
    en: "Astrakhan",
    ru: "Астрахань",
  }),
  createStop("moscow", "RU", [55.7558, 37.6173], {
    az: "Moskva",
    en: "Moscow",
    ru: "Москва",
  }),
  createStop("st-petersburg", "RU", [59.93460060344935, 30.331845425988515], {
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
  createStop("helsinki", "FI", [60.18239550906139, 24.929459847023125], {
    az: "Helsinki",
    en: "Helsinki",
    ru: "Хельсинки",
  }),
  createStop("lankaran", "AZ", [38.75782003253777, 48.769426789343576], {
    az: "Lənkəran",
    en: "Lankaran",
    ru: "Ленкорань",
  }),
  createStop("tabriz", "IR", [38.0804, 46.2919], {
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
  createStop("marseille", "FR", [43.30483000061793, 5.376721134822359], {
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
  createStop("ganja", "AZ", [40.6828, 46.3606], {
    az: "Gəncə",
    en: "Ganja",
    ru: "Гянджа",
  }),
  createStop("boyuk-kasik", "AZ", [41.3086, 45.0919], {
    az: "Böyük Kəsik",
    en: "Boyuk Kasik",
    ru: "Беюк-Кясик",
  }),
  createStop("horadiz", "AZ", [39.45479701763839, 47.32168503617963], {
    az: "Horadiz",
    en: "Horadiz",
    ru: "Горадиз",
  }),
  createStop("aghband", "AZ", [38.9118, 46.574], {
    az: "Ağbənd",
    en: "Aghband",
    ru: "Агбенд",
  }),
  createStop("ordubad", "AZ", [38.8485, 46.1386], {
    az: "Ordubad",
    en: "Ordubad",
    ru: "Ордубад",
  }),
  createStop("julfa", "AZ", [38.9559, 45.6308], {
    az: "Culfa",
    en: "Julfa",
    ru: "Джульфа",
  }),
  createStop("nakhchivan", "AZ", [39.2029, 45.4053], {
    az: "Naxçıvan",
    en: "Nakhchivan",
    ru: "Нахчыван",
  }),
  createStop("igdir", "TR", [39.92562614977315, 44.040365699646536], {
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
  createStop("rotterdam", "NL", [51.9244, 4.4777], localizedStopName("Rotterdam", { ru: "Роттердам" })),
  createStop("antwerp", "BE", [51.2194, 4.4025], localizedStopName("Antwerp", { az: "Antverpen", ru: "Антверпен" })),
  createStop("hamburg", "DE", [53.5511, 9.9937], {
    az: "Hamburq",
    en: "Hamburg",
    ru: "Гамбург",
  }),
  createStop("bremerhaven", "DE", [53.5396, 8.5809], localizedStopName("Bremerhaven", { az: "Bremerhafen", ru: "Бремерхафен" })),
  createStop("duisburg", "DE", [51.4344, 6.7623], localizedStopName("Duisburg", { az: "Duisburq", ru: "Дуйсбург" })),
  createStop("frankfurt", "DE", [50.1109, 8.6821], localizedStopName("Frankfurt", { ru: "Франкфурт" })),
  createStop("munich", "DE", [48.1351, 11.582], localizedStopName("Munich", { az: "Münhen", ru: "Мюнхен" })),
  createStop("warsaw", "PL", [52.2297, 21.0122], localizedStopName("Warsaw", { az: "Varşava", ru: "Варшава" })),
  createStop("gdansk", "PL", [54.352, 18.6466], localizedStopName("Gdansk", { az: "Qdansk", ru: "Гданьск" })),
  createStop("prague", "CZ", [50.0755, 14.4378], localizedStopName("Prague", { az: "Praqa", ru: "Прага" })),
  createStop("vienna", "AT", [48.2082, 16.3738], localizedStopName("Vienna", { az: "Vyana", ru: "Вена" })),
  createStop("bratislava", "SK", [48.1486, 17.1077], localizedStopName("Bratislava", { ru: "Братислава" })),
  createStop("belgrade", "RS", [44.7866, 20.4489], localizedStopName("Belgrade", { az: "Belqrad", ru: "Белград" })),
  createStop("sofia", "BG", [42.6977, 23.3219], localizedStopName("Sofia", { az: "Sofiya", ru: "София" })),
  createStop("thessaloniki", "GR", [40.6401, 22.9444], localizedStopName("Thessaloniki", { az: "Saloniki", ru: "Салоники" })),
  createStop("piraeus", "GR", [37.942, 23.6465], localizedStopName("Piraeus", { az: "Pirey", ru: "Пирей" })),
  createStop("trieste", "IT", [45.659785485030035, 13.778999799715153], localizedStopName("Trieste", { az: "Triyest", ru: "Триест" })),
  createStop("milan", "IT", [45.50433699583818, 9.167047936478804], localizedStopName("Milan", { ru: "Милан" })),
  createStop("genoa", "IT", [44.4056, 8.9463], localizedStopName("Genoa", { az: "Genuya", ru: "Генуя" })),
  createStop("lyon", "FR", [45.764, 4.8357], localizedStopName("Lyon", { az: "Lion", ru: "Лион" })),
  createStop("le-havre", "FR", [49.4944, 0.1079], localizedStopName("Le Havre", { az: "Havr", ru: "Гавр" })),
  createStop("barcelona", "ES", [41.35789331399737, 2.2567791725067354], localizedStopName("Barcelona", { az: "Barselona", ru: "Барселона" })),
  createStop("valencia", "ES", [39.4699, -0.3763], localizedStopName("Valencia", { az: "Valensiya", ru: "Валенсия" })),
  createStop("lisbon", "PT", [38.7223, -9.1393], localizedStopName("Lisbon", { az: "Lissabon", ru: "Лиссабон" })),
  createStop("constanta", "RO", [44.1598, 28.6348], localizedStopName("Constanta", { az: "Konstansa", ru: "Констанца" })),
  createStop("dubai-jebel-ali", "AE", [25.0657, 55.1713], localizedStopName("Dubai / Jebel Ali", { az: "Dubay / Cəbəl Əli", ru: "Дубай / Джебель-Али" })),
  createStop("abu-dhabi", "AE", [24.4539, 54.3773], localizedStopName("Abu Dhabi", { az: "Əbu-Dabi", ru: "Абу-Даби" })),
  createStop("doha", "QA", [25.2854, 51.531], localizedStopName("Doha", { ru: "Доха" })),
  createStop("dammam", "SA", [26.4207, 50.0888], localizedStopName("Dammam", { az: "Dəmmam", ru: "Даммам" })),
  createStop("riyadh", "SA", [24.7136, 46.6753], localizedStopName("Riyadh", { az: "Ər-Riyad", ru: "Эр-Рияд" })),
  createStop("jeddah", "SA", [21.4858, 39.1925], localizedStopName("Jeddah", { az: "Ciddə", ru: "Джидда" })),
  createStop("kuwait-city", "KW", [29.3759, 47.9774], localizedStopName("Kuwait City", { az: "Əl-Küveyt", ru: "Эль-Кувейт" })),
  createStop("muscat", "OM", [23.588, 58.3829], localizedStopName("Muscat", { az: "Maskat", ru: "Маскат" })),
  createStop("salalah", "OM", [17.0194, 54.0897], localizedStopName("Salalah", { az: "Salala", ru: "Салала" })),
  createStop("alexandria", "EG", [31.2001, 29.9187], localizedStopName("Alexandria", { az: "İsgəndəriyyə", ru: "Александрия" })),
  createStop("cairo", "EG", [30.0444, 31.2357], localizedStopName("Cairo", { az: "Qahirə", ru: "Каир" })),
  createStop("casablanca", "MA", [33.5731, -7.5898], localizedStopName("Casablanca", { az: "Kasablanka", ru: "Касабланка" })),
  createStop("tangier-med", "MA", [35.8946, -5.5033], localizedStopName("Tangier Med", { az: "Tanca Med", ru: "Танжер Мед" })),
  createStop("lagos", "NG", [6.5244, 3.3792], localizedStopName("Lagos", { az: "Laqos", ru: "Лагос" })),
  createStop("durban", "ZA", [-29.8587, 31.0218], localizedStopName("Durban", { ru: "Дурбан" })),
  createStop("johannesburg", "ZA", [-26.2041, 28.0473], localizedStopName("Johannesburg", { az: "Yohannesburq", ru: "Йоханнесбург" })),
  createStop("nairobi", "KE", [-1.2921, 36.8219], localizedStopName("Nairobi", { az: "Nayrobi", ru: "Найроби" })),
  createStop("djibouti", "DJ", [11.5721, 43.1456], localizedStopName("Djibouti", { az: "Cibuti", ru: "Джибути" })),
  createStop("addis-ababa", "ET", [8.9806, 38.7578], localizedStopName("Addis Ababa", { az: "Əddis-Əbəbə", ru: "Аддис-Абеба" })),
  createStop("shanghai", "CN", [31.2304, 121.4737], localizedStopName("Shanghai", { az: "Şanxay", ru: "Шанхай" })),
  createStop("ningbo", "CN", [29.8683, 121.544], localizedStopName("Ningbo", { az: "Ninbo", ru: "Нинбо" })),
  createStop("shenzhen", "CN", [22.5431, 114.0579], localizedStopName("Shenzhen", { az: "Şençjen", ru: "Шэньчжэнь" })),
  createStop("guangzhou", "CN", [23.1291, 113.2644], localizedStopName("Guangzhou", { az: "Quançjou", ru: "Гуанчжоу" })),
  createStop("qingdao", "CN", [36.0671, 120.3826], localizedStopName("Qingdao", { az: "Tsindao", ru: "Циндао" })),
  createStop("tianjin", "CN", [39.0842, 117.2009], localizedStopName("Tianjin", { az: "Tyantszin", ru: "Тяньцзинь" })),
  createStop("dalian", "CN", [39.01973304854119, 121.63880517002599], localizedStopName("Dalian", { az: "Dalyan", ru: "Далянь" })),
  createStop("chengdu", "CN", [30.5728, 104.0668], localizedStopName("Chengdu", { az: "Çendu", ru: "Чэнду" })),
  createStop("chongqing", "CN", [29.4316, 106.9123], localizedStopName("Chongqing", { az: "Çuntsin", ru: "Чунцин" })),
  createStop("zhengzhou", "CN", [34.7473, 113.6249], localizedStopName("Zhengzhou", { az: "Çjençjou", ru: "Чжэнчжоу" })),
  createStop("wuhan", "CN", [30.5928, 114.3055], localizedStopName("Wuhan", { az: "Uhan", ru: "Ухань" })),
  createStop("yiwu", "CN", [29.3151, 120.0768], localizedStopName("Yiwu", { az: "İu", ru: "Иу" })),
  createStop("lianyungang", "CN", [34.5969, 119.2216], localizedStopName("Lianyungang", { az: "Lyanyunqan", ru: "Ляньюньган" })),
  createStop("hong-kong", "HK", [22.3193, 114.1694], localizedStopName("Hong Kong", { az: "Honkonq", ru: "Гонконг" })),
  createStop("taipei", "TW", [25.033, 121.5654], localizedStopName("Taipei", { az: "Taybey", ru: "Тайбэй" })),
  createStop("kaohsiung", "TW", [22.6273, 120.3014], localizedStopName("Kaohsiung", { az: "Qaosyun", ru: "Гаосюн" })),
  createStop("busan", "KR", [35.1796, 129.0756], localizedStopName("Busan", { az: "Pusan", ru: "Пусан" })),
  createStop("incheon", "KR", [37.4563, 126.7052], localizedStopName("Incheon", { az: "İnçhon", ru: "Инчхон" })),
  createStop("tokyo", "JP", [35.67671321338031, 139.64656797497057], localizedStopName("Tokyo", { az: "Tokio", ru: "Токио" })),
  createStop("yokohama", "JP", [35.4437, 139.638], localizedStopName("Yokohama", { ru: "Иокогама" })),
  createStop("osaka", "JP", [34.69646803954196, 135.5012411138975], localizedStopName("Osaka", { ru: "Осака" })),
  createStop("nagoya", "JP", [35.1815, 136.9066], localizedStopName("Nagoya", { az: "Naqoya", ru: "Нагоя" })),
  createStop("singapore", "SG", [1.3521, 103.8198], localizedStopName("Singapore", { az: "Sinqapur", ru: "Сингапур" })),
  createStop("port-klang", "MY", [3.0033, 101.3991], localizedStopName("Port Klang", { az: "Port-Klanq", ru: "Порт-Кланг" })),
  createStop("kuala-lumpur", "MY", [3.139, 101.6869], localizedStopName("Kuala Lumpur", { az: "Kuala-Lumpur", ru: "Куала-Лумпур" })),
  createStop("bangkok", "TH", [13.7563, 100.5018], localizedStopName("Bangkok", { az: "Banqkok", ru: "Бангкок" })),
  createStop("laem-chabang", "TH", [13.0833, 100.8833], localizedStopName("Laem Chabang", { az: "Laem-Çabanq", ru: "Лем-Чабанг" })),
  createStop("ho-chi-minh-city", "VN", [10.8231, 106.6297], localizedStopName("Ho Chi Minh City", { az: "Hoşimin", ru: "Хошимин" })),
  createStop("hanoi", "VN", [21.0278, 105.8342], localizedStopName("Hanoi", { az: "Hanoy", ru: "Ханой" })),
  createStop("hai-phong", "VN", [20.8449, 106.6881], localizedStopName("Hai Phong", { az: "Hayfon", ru: "Хайфон" })),
  createStop("jakarta", "ID", [-6.2088, 106.8456], localizedStopName("Jakarta", { az: "Cakarta", ru: "Джакарта" })),
  createStop("surabaya", "ID", [-7.2575, 112.7521], localizedStopName("Surabaya", { ru: "Сурабая" })),
  createStop("manila", "PH", [14.5995, 120.9842], localizedStopName("Manila", { ru: "Манила" })),
  createStop("cebu", "PH", [10.3157, 123.8854], localizedStopName("Cebu", { az: "Sebu", ru: "Себу" })),
  createStop("colombo", "LK", [6.9271, 79.8612], localizedStopName("Colombo", { az: "Kolombo", ru: "Коломбо" })),
  createStop("chennai", "IN", [13.0827, 80.2707], localizedStopName("Chennai", { az: "Çennai", ru: "Ченнаи" })),
  createStop("delhi", "IN", [28.6139, 77.209], localizedStopName("Delhi", { az: "Dehli", ru: "Дели" })),
  createStop("mundra", "IN", [22.8395, 69.7217], localizedStopName("Mundra", { ru: "Мундра" })),
  createStop("new-york", "US", [40.7128, -74.006], localizedStopName("New York / New Jersey", { az: "Nyu-York / Nyu-Cersi", ru: "Нью-Йорк / Нью-Джерси" })),
  createStop("norfolk", "US", [36.8508, -76.2859], localizedStopName("Norfolk", { ru: "Норфолк" })),
  createStop("savannah", "US", [32.0809, -81.0912], localizedStopName("Savannah", { az: "Savanna", ru: "Саванна" })),
  createStop("houston", "US", [29.7604, -95.3698], localizedStopName("Houston", { az: "Hyuston", ru: "Хьюстон" })),
  createStop("los-angeles", "US", [34.0522, -118.2437], localizedStopName("Los Angeles / Long Beach", { az: "Los-Anceles / Lonq-Biç", ru: "Лос-Анджелес / Лонг-Бич" })),
  createStop("seattle", "US", [47.6062, -122.3321], localizedStopName("Seattle", { az: "Sietl", ru: "Сиэтл" })),
  createStop("chicago", "US", [41.8781, -87.6298], localizedStopName("Chicago", { az: "Çikaqo", ru: "Чикаго" })),
  createStop("memphis", "US", [35.1495, -90.049], localizedStopName("Memphis", { az: "Memfis", ru: "Мемфис" })),
  createStop("atlanta", "US", [33.749, -84.388], localizedStopName("Atlanta", { ru: "Атланта" })),
  createStop("miami", "US", [25.7617, -80.1918], localizedStopName("Miami", { az: "Mayami", ru: "Майами" })),
  createStop("vancouver", "CA", [49.2827, -123.1207], localizedStopName("Vancouver", { az: "Vankuver", ru: "Ванкувер" })),
  createStop("toronto", "CA", [43.6532, -79.3832], localizedStopName("Toronto", { ru: "Торонто" })),
  createStop("montreal", "CA", [45.5017, -73.5673], localizedStopName("Montreal", { az: "Monreal", ru: "Монреаль" })),
  createStop("mexico-city", "MX", [19.4326, -99.1332], localizedStopName("Mexico City", { az: "Mexiko", ru: "Мехико" })),
  createStop("monterrey", "MX", [25.6866, -100.3161], localizedStopName("Monterrey", { ru: "Монтеррей" })),
  createStop("veracruz", "MX", [19.1738, -96.1342], localizedStopName("Veracruz", { az: "Verakrus", ru: "Веракрус" })),
  createStop("panama-city", "PA", [8.9824, -79.5199], localizedStopName("Panama City", { az: "Panama", ru: "Панама" })),
  createStop("colon", "PA", [9.3547, -79.9001], localizedStopName("Colon", { az: "Kolon", ru: "Колон" })),
  createStop("cartagena", "CO", [10.391, -75.4794], localizedStopName("Cartagena", { az: "Kartahena", ru: "Картахена" })),
  createStop("santos", "BR", [-23.9608, -46.3336], localizedStopName("Santos", { ru: "Сантус" })),
  createStop("sao-paulo", "BR", [-23.5558, -46.6396], localizedStopName("Sao Paulo", { az: "San-Paulu", ru: "Сан-Паулу" })),
  createStop("buenos-aires", "AR", [-34.6037, -58.3816], localizedStopName("Buenos Aires", { az: "Buenos-Ayres", ru: "Буэнос-Айрес" })),
  createStop("montevideo", "UY", [-34.9011, -56.1645], localizedStopName("Montevideo", { ru: "Монтевидео" })),
  createStop("callao", "PE", [-12.0464, -77.0428], localizedStopName("Callao / Lima", { az: "Kalyao / Lima", ru: "Кальяо / Лима" })),
  createStop("santiago", "CL", [-33.4489, -70.6693], localizedStopName("Santiago", { az: "Santyaqo", ru: "Сантьяго" })),
  createStop("sydney", "AU", [-33.8688, 151.2093], localizedStopName("Sydney", { az: "Sidney", ru: "Сидней" })),
  createStop("melbourne", "AU", [-37.8136, 144.9631], localizedStopName("Melbourne", { az: "Melburn", ru: "Мельбурн" })),
  createStop("brisbane", "AU", [-27.4698, 153.0251], localizedStopName("Brisbane", { az: "Brisben", ru: "Брисбен" })),
  createStop("perth", "AU", [-31.9505, 115.8605], localizedStopName("Perth", { az: "Pert", ru: "Перт" })),
  createStop("auckland", "NZ", [-36.8509, 174.7645], localizedStopName("Auckland", { az: "Oklend", ru: "Окленд" })),
  // Stops added from the official ADY corridor reference maps (img/).
  createStop("lanzhou", "CN", [36.0611, 103.8343], {
    az: "Lançjou",
    en: "Lanzhou",
    ru: "Ланьчжоу",
  }),
  createStop("kashgar", "CN", [39.4704, 75.9898], {
    az: "Kaşqar",
    en: "Kashgar",
    ru: "Кашгар",
  }),
  createStop("andijan", "UZ", [40.7821, 72.3442], {
    az: "Əndican",
    en: "Andijan",
    ru: "Андижан",
  }),
  createStop("tashkent", "UZ", [41.2995, 69.2401], {
    az: "Daşkənd",
    en: "Tashkent",
    ru: "Ташкент",
  }),
  createStop("samarkand", "UZ", [39.6542, 66.9597], {
    az: "Səmərqənd",
    en: "Samarkand",
    ru: "Самарканд",
  }),
  createStop("bukhara", "UZ", [39.7681, 64.4556], {
    az: "Buxara",
    en: "Bukhara",
    ru: "Бухара",
  }),
  createStop("khujand", "TJ", [40.2826, 69.6222], {
    az: "Xucənd",
    en: "Khujand",
    ru: "Худжанд",
  }),
  createStop("dushanbe", "TJ", [38.5598, 68.787], {
    az: "Düşənbə",
    en: "Dushanbe",
    ru: "Душанбе",
  }),
  createStop("bishkek", "KG", [42.8746, 74.5698], {
    az: "Bişkek",
    en: "Bishkek",
    ru: "Бишкек",
  }),
  createStop("ashgabat", "TM", [37.9601, 58.3261], {
    az: "Aşqabad",
    en: "Ashgabat",
    ru: "Ашхабад",
  }),
  createStop("turkmenbashi", "TM", [40.0224, 52.9697], {
    az: "Türkmənbaşı",
    en: "Turkmenbashi",
    ru: "Туркменбаши",
  }),
  createStop("mary", "TM", [37.6, 61.8303], {
    az: "Marı",
    en: "Mary",
    ru: "Мары",
  }),
  createStop("turkmenabat", "TM", [39.0733, 63.5786], {
    az: "Türkmənabad",
    en: "Turkmenabat",
    ru: "Туркменабад",
  }),
  createStop("towrgondi", "AF", [35.2183, 62.2591], {
    az: "Turqundi",
    en: "Towrgondi",
    ru: "Тургунди",
  }),
  createStop("aqina", "AF", [37.0891, 65.6572], {
    az: "Akina",
    en: "Aqina",
    ru: "Акина",
  }),
  createStop("mazar-i-sharif", "AF", [36.7069, 67.1109], {
    az: "Məzari-Şərif",
    en: "Mazar-i-Sharif",
    ru: "Мазари-Шариф",
  }),
  createStop("beyneu", "KZ", [45.3167, 55.2], {
    az: "Beyneu",
    en: "Beyneu",
    ru: "Бейнеу",
  }),
  createStop("poti", "GE", [42.1462, 41.6719], {
    az: "Poti",
    en: "Poti",
    ru: "Поти",
  }),
  createStop("batumi", "GE", [41.6459, 41.6404], {
    az: "Batumi",
    en: "Batumi",
    ru: "Батуми",
  }),
  createStop("sivas", "TR", [39.7477, 37.0179], {
    az: "Sivas",
    en: "Sivas",
    ru: "Сивас",
  }),
  createStop("samsun", "TR", [41.2867, 36.33], {
    az: "Samsun",
    en: "Samsun",
    ru: "Самсун",
  }),
  createStop("mersin", "TR", [36.8, 34.6333], {
    az: "Mersin",
    en: "Mersin",
    ru: "Мерсин",
  }),
  createStop("izmir", "TR", [38.50741105808165, 27.16057937780109], {
    az: "İzmir",
    en: "Izmir",
    ru: "Измир",
  }),
  createStop("astara", "AZ", [38.46418832953136, 48.86131188409395], {
    az: "Astara",
    en: "Astara",
    ru: "Астара",
  }),
  createStop("rasht", "IR", [37.29755444245026, 49.59576181276999], {
    az: "Rəşt",
    en: "Rasht",
    ru: "Решт",
  }),
  createStop("qazvin", "IR", [36.2688, 50.0041], {
    az: "Qəzvin",
    en: "Qazvin",
    ru: "Казвин",
  }),
  createStop("yazd", "IR", [31.8974, 54.3569], {
    az: "Yəzd",
    en: "Yazd",
    ru: "Йезд",
  }),
  createStop("kerman", "IR", [30.2839, 57.0834], {
    az: "Kirman",
    en: "Kerman",
    ru: "Керман",
  }),
  createStop("zahedan", "IR", [29.4963, 60.8629], {
    az: "Zahidan",
    en: "Zahedan",
    ru: "Захедан",
  }),
  createStop("quetta", "PK", [30.1798, 66.975], {
    az: "Kvetta",
    en: "Quetta",
    ru: "Кветта",
  }),
  createStop("ahvaz", "IR", [31.3183, 48.6706], {
    az: "Əhvaz",
    en: "Ahvaz",
    ru: "Ахваз",
  }),
  createStop("bandar-khomeini", "IR", [30.4333, 49.0864], {
    az: "Bəndər İmam Xomeyni",
    en: "Bandar Khomeini",
    ru: "Бендер-Хомейни",
  }),
  createStop("chabahar", "IR", [25.2919, 60.643], {
    az: "Çabahar",
    en: "Chabahar",
    ru: "Чабахар",
  }),
  createStop("minsk", "BY", [53.9006, 27.559], {
    az: "Minsk",
    en: "Minsk",
    ru: "Минск",
  }),
  createStop("riga", "LV", [56.967754356112856, 24.10566681062681], {
    az: "Riqa",
    en: "Riga",
    ru: "Рига",
  }),
  createStop("ventspils", "LV", [57.39342571728238, 21.606527806309877], {
    az: "Ventspils",
    en: "Ventspils",
    ru: "Вентспилс",
  }),
  createStop("muuga", "EE", [59.4968, 24.9573], {
    az: "Muuqa",
    en: "Muuga",
    ru: "Мууга",
  }),
  createStop("paldiski", "EE", [59.3567, 24.0531], {
    az: "Paldiski",
    en: "Paldiski",
    ru: "Палдиски",
  }),
  createStop("berlin", "DE", [52.52, 13.405], {
    az: "Berlin",
    en: "Berlin",
    ru: "Берлин",
  }),
  createStop("wroclaw", "PL", [51.1079, 17.0385], {
    az: "Vrotslav",
    en: "Wroclaw",
    ru: "Вроцлав",
  }),
  createStop("yekaterinburg", "RU", [56.8389, 60.6057], {
    az: "Yekaterinburq",
    en: "Yekaterinburg",
    ru: "Екатеринбург",
  }),
  createStop("chita", "RU", [52.0339, 113.4994], {
    az: "Çita",
    en: "Chita",
    ru: "Чита",
  }),
  createStop("komsomolsk", "RU", [50.5496, 137.0079], {
    az: "Komsomolsk-na-Amure",
    en: "Komsomolsk-on-Amur",
    ru: "Комсомольск-на-Амуре",
  }),
  createStop("vanino", "RU", [49.0869, 140.2543], {
    az: "Vanino",
    en: "Vanino",
    ru: "Ванино",
  }),
  createStop("nakhodka", "RU", [42.8236, 132.8928], {
    az: "Naxodka",
    en: "Nakhodka",
    ru: "Находка",
  }),
  createStop("aomori", "JP", [40.8221, 140.7474], {
    az: "Aomori",
    en: "Aomori",
    ru: "Аомори",
  }),
  createStop("chaozhou", "CN", [23.6567, 116.6226], {
    az: "Çaoçjou",
    en: "Chaozhou",
    ru: "Чаочжоу",
  }),
  createStop("kunming", "CN", [25.0389, 102.7183], {
    az: "Kunmin",
    en: "Kunming",
    ru: "Куньмин",
  }),
  createStop("fangcheng", "CN", [21.6867, 108.3547], {
    az: "Fançen",
    en: "Fangcheng",
    ru: "Фанчэн",
  }),
  createStop("termez", "UZ", [37.2242, 67.2783], {
    az: "Termiz",
    en: "Termez",
    ru: "Термез",
  }),
  createStop("krakow", "PL", [50.0647, 19.945], {
    az: "Krakov",
    en: "Krakow",
    ru: "Краков",
  }),
  createStop("lviv", "UA", [49.8397, 24.0297], {
    az: "Lvov",
    en: "Lviv",
    ru: "Львов",
  }),
  createStop("chisinau", "MD", [47.0105, 28.8638], {
    az: "Kişinyov",
    en: "Chisinau",
    ru: "Кишинёв",
  }),
  createStop("odessa", "UA", [46.4825, 30.7233], {
    az: "Odessa",
    en: "Odessa",
    ru: "Одесса",
  }),
  createStop("chernomorsk", "UA", [46.3017, 30.6569], {
    az: "Çernomorsk",
    en: "Chernomorsk",
    ru: "Черноморск",
  }),
  createStop("varna", "BG", [43.2141, 27.9147], {
    az: "Varna",
    en: "Varna",
    ru: "Варна",
  }),
  createStop("burgas", "BG", [42.5048, 27.4626], {
    az: "Burqas",
    en: "Burgas",
    ru: "Бургас",
  }),
  createStop("luxembourg", "LU", [49.6116, 6.1319], {
    az: "Lüksemburq",
    en: "Luxembourg",
    ru: "Люксембург",
  }),
  createStop("bern", "CH", [46.948, 7.4474], {
    az: "Bern",
    en: "Bern",
    ru: "Берн",
  }),
  createStop("london", "GB", [51.5074, -0.1278], {
    az: "London",
    en: "London",
    ru: "Лондон",
  }),
  // Stops added from the city.md manual coordinate list.
  createStop("tangshan", "CN", [39.69138875413673, 118.22962515474589], {
    az: "Tanşan",
    en: "Tangshan",
    ru: "Таншань",
  }),
  createStop("qinhuangdao", "CN", [39.98243285297037, 119.75123158928783], {
    az: "Çinxuandao",
    en: "Qinhuangdao",
    ru: "Циньхуандао",
  }),
  createStop("panjin", "CN", [41.0969972963909, 122.12977161525099], {
    az: "Panjin",
    en: "Panjin",
    ru: "Паньцзинь",
  }),
  createStop("yingkou", "CN", [40.70402493540751, 122.3497984484184], {
    az: "Yinkou",
    en: "Yingkou",
    ru: "Инкоу",
  }),
  createStop("montpellier", "FR", [43.616640660677035, 3.8570102743066355], {
    az: "Monpelye",
    en: "Montpellier",
    ru: "Монпелье",
  }),
  createStop("vicenza", "IT", [45.540951835761895, 11.518751453337707], {
    az: "Viçentsa",
    en: "Vicenza",
    ru: "Виченца",
  }),
  createStop("balikesir", "TR", [39.72880040700178, 27.787700306275752], {
    az: "Balıkesir",
    en: "Balikesir",
    ru: "Балыкесир",
  }),
  createStop("masalli", "AZ", [39.037841574051015, 48.700762238804906], {
    az: "Masallı",
    en: "Masally",
    ru: "Масаллы",
  }),
  createStop("rizvanshahr", "IR", [37.561656806593334, 49.11767648746933], {
    az: "Rizvanşəhər",
    en: "Rizvanshahr",
    ru: "Резваншехр",
  }),
  createStop("artezian", "RU", [44.93254732802284, 46.67265977329368], {
    az: "Artezian",
    en: "Artezian",
    ru: "Артезиан",
  }),
  createStop("babayurt", "RU", [43.59338296617132, 46.78494626522904], {
    az: "Babayurd",
    en: "Babayurt",
    ru: "Бабаюрт",
  }),
  createStop("angarsk", "RU", [52.54691524733757, 103.89146123332462], {
    az: "Anqarsk",
    en: "Angarsk",
    ru: "Ангарск",
  }),
  createStop("kultuk", "RU", [51.73767681239316, 103.70691783547667], {
    az: "Kultuk",
    en: "Kultuk",
    ru: "Култук",
  }),
  createStop("kamensk", "RU", [51.992250151819924, 106.55968113241094], {
    az: "Kamensk",
    en: "Kamensk",
    ru: "Каменск",
  }),
  createStop("ulan-ude", "RU", [51.83343914027329, 107.58380679496995], {
    az: "Ulan Ude",
    en: "Ulan-Ude",
    ru: "Улан-Удэ",
  }),
  createStop("vyborg", "RU", [60.707603769782864, 28.764043085416162], {
    az: "Viborq",
    en: "Vyborg",
    ru: "Выборг",
  }),
  createStop("porvoo", "FI", [60.40253330529121, 25.674165959395086], {
    az: "Porvoo",
    en: "Porvoo",
    ru: "Порвоо",
  }),
  createStop("strazde", "LV", [57.129312982439714, 22.741574008179473], {
    az: "Strazde",
    en: "Strazde",
    ru: "Страздэ",
  }),
  createStop("saatli", "AZ", [39.910927219952846, 48.34914519673688], {
    az: "Saatlı",
    en: "Saatly",
    ru: "Саатлы",
  }),
  createStop("gobustan", "AZ", [40.08695554589084, 49.413046268934075], {
    az: "Qobustan",
    en: "Gobustan",
    ru: "Гобустан",
  }),
  createStop("sangachal", "AZ", [40.174117699668514, 49.467633414317035], {
    az: "Sanqaçal",
    en: "Sangachal",
    ru: "Сангачал",
  }),
  createStop("demirchi", "AZ", [39.61600709459735, 44.948751254999436], {
    az: "Dəmirçi",
    en: "Demirchi",
    ru: "Демирчи",
  }),
  createStop("sarachli", "AZ", [39.909765666312694, 44.46493725109202], {
    az: "Saraçlı",
    en: "Sarachli",
    ru: "Сарачлы",
  }),
  createStop("rustavi", "GE", [41.54451108652713, 45.012473053308526], {
    az: "Rustavi",
    en: "Rustavi",
    ru: "Рустави",
  }),
  createStop("manglisi", "GE", [41.67589941837711, 44.379596212915146], {
    az: "Manqlisi",
    en: "Manglisi",
    ru: "Манглиси",
  }),
  createStop("gamdzani", "GE", [41.357444670365446, 43.753960886357596], {
    az: "Qamdzani",
    en: "Gamdzani",
    ru: "Гамдзани",
  }),
  createStop("oyama", "JP", [35.360948128928996, 138.9867016435153], {
    az: "Oyama",
    en: "Oyama",
    ru: "Ояма",
  }),
  createStop("okazaki", "JP", [34.965202290939786, 137.1890637022306], {
    az: "Okazaki",
    en: "Okazaki",
    ru: "Оказаки",
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
