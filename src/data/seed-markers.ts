import { BAKU_PORT } from "@/data/corridors";
import type { AdminMarker } from "@/types/admin";
import type { LocalizedText } from "@/types/map";

function localizedText(
  en: string,
  overrides: Partial<LocalizedText> = {},
): LocalizedText {
  return {
    az: overrides.az ?? en,
    en,
    ru: overrides.ru ?? en,
  };
}

export const SEED_MARKERS: AdminMarker[] = [
  {
    id: BAKU_PORT.id,
    name: BAKU_PORT.name,
    description: BAKU_PORT.role,
    category: "port",
    icon: "fas:anchor",
    coordinates: BAKU_PORT.coordinates,
    connectedCorridorIds: BAKU_PORT.connectedCorridorIds,
  },
  {
    id: "xian-inland-port",
    name: localizedText("Xi'an Inland Port", {
      az: "Sian Quru Limanı",
      ru: "Сухой порт Сиань",
    }),
    description: localizedText(
      "Eastern rail gateway feeding the East-West corridor from inland China.",
      {
        az: "Şərq-Qərb dəhlizini daxili Çindən qidalandıran əsas şərq dəmir yolu qovşağı.",
        ru: "Восточный железнодорожный шлюз, подпитывающий коридор Восток-Запад из внутренних районов Китая.",
      },
    ),
    category: "station",
    icon: "fas:warehouse",
    coordinates: [34.3416, 108.9398],
    connectedCorridorIds: ["middle-corridor"],
  },
  {
    id: "almaty-logistics-hub",
    name: localizedText("Almaty Logistics Hub", {
      az: "Almatı Logistika Qovşağı",
      ru: "Логистический хаб Алматы",
    }),
    description: localizedText(
      "A Central Asian consolidation point for rail cargo moving toward the Caspian crossing.",
      {
        az: "Xəzər keçidinə yönələn dəmir yolu yükləri üçün Mərkəzi Asiyanın əsas konsolidasiya nöqtəsi.",
        ru: "Ключевой центральноазиатский пункт консолидации железнодорожных грузов на подходе к Каспию.",
      },
    ),
    category: "station",
    icon: "fas:boxes-stacked",
    coordinates: [43.2389, 76.8897],
    connectedCorridorIds: ["middle-corridor"],
  },
  {
    id: "aktau-seaport",
    name: localizedText("Aktau Seaport", {
      az: "Aktau Dəniz Limanı",
      ru: "Морской порт Актау",
    }),
    description: localizedText(
      "A Caspian maritime transfer node connecting Kazakhstan rail flows to Baku.",
      {
        az: "Qazaxıstan dəmir yolu axınlarını Bakı ilə birləşdirən əsas Xəzər dəniz keçid qovşağı.",
        ru: "Каспийский морской узел перегрузки, связывающий казахстанские железнодорожные потоки с Баку.",
      },
    ),
    category: "port",
    icon: "fas:ship",
    coordinates: [43.6532, 51.1975],
    connectedCorridorIds: ["middle-corridor"],
  },
  {
    id: "tbilisi-intermodal-hub",
    name: localizedText("Tbilisi Intermodal Hub", {
      az: "Tbilisi İntermodal Qovşağı",
      ru: "Тбилисский интермодальный хаб",
    }),
    description: localizedText(
      "A South Caucasus transfer point linking Caspian traffic with onward rail and road distribution.",
      {
        az: "Xəzər axınlarını sonrakı dəmir yolu və avtomobil paylaması ilə birləşdirən Cənubi Qafqaz transfer nöqtəsi.",
        ru: "Южнокавказский перевалочный узел, связывающий каспийские потоки с дальнейшим железнодорожным и автодорожным распределением.",
      },
    ),
    category: "station",
    icon: "fas:train",
    coordinates: [41.7151, 44.8271],
    connectedCorridorIds: ["middle-corridor", "lapis-lazuli"],
  },
  {
    id: "kars-logistics-terminal",
    name: localizedText("Kars Logistics Terminal", {
      az: "Qars Logistika Terminalı",
      ru: "Логистический терминал Карс",
    }),
    description: localizedText(
      "A key Anatolian rail handoff point for East-West, South-West, and Zangazur corridor traffic.",
      {
        az: "Şərq-Qərb, Cənub-Qərb və Zəngəzur dəhlizi trafikləri üçün əsas Anadolu dəmir yolu ötürmə nöqtəsi.",
        ru: "Ключевая анатолийская железнодорожная точка передачи потоков коридоров Восток-Запад, Юго-Запад и Зангезур.",
      },
    ),
    category: "station",
    icon: "fas:warehouse",
    coordinates: [40.6013, 43.0947],
    connectedCorridorIds: ["middle-corridor", "lapis-lazuli", "zangazur"],
  },
  {
    id: "istanbul-gateway",
    name: localizedText("Istanbul Gateway", {
      az: "İstanbul Keçid Qovşağı",
      ru: "Стамбульский шлюз",
    }),
    description: localizedText(
      "A Bosporus-side gateway where corridor traffic fans into European road, sea, and rail networks.",
      {
        az: "Dəhliz trafikinin Avropanın avtomobil, dəniz və dəmir yolu şəbəkələrinə şaxələndiyi Bosfor qovşağı.",
        ru: "Узел на Босфоре, где трафик коридоров распределяется по европейским автомобильным, морским и железнодорожным сетям.",
      },
    ),
    category: "port",
    icon: "fas:bridge",
    coordinates: [41.0082, 28.9784],
    connectedCorridorIds: ["middle-corridor", "lapis-lazuli"],
  },
  {
    id: "moscow-freight-hub",
    name: localizedText("Moscow Freight Hub", {
      az: "Moskva Yük Qovşağı",
      ru: "Грузовой хаб Москва",
    }),
    description: localizedText(
      "A northern corridor control point for long-haul Eurasian and North-South freight distribution.",
      {
        az: "Uzun məsafəli Avrasiya və Şimal-Cənub yük paylaması üçün əsas şimal qovşağı.",
        ru: "Северный опорный узел для распределения грузов по евразийским и северо-южным направлениям.",
      },
    ),
    category: "station",
    icon: "fas:industry",
    coordinates: [55.7558, 37.6173],
    connectedCorridorIds: ["eurasian-corridor", "north-south"],
  },
  {
    id: "vladivostok-port",
    name: localizedText("Vladivostok Port", {
      az: "Vladivostok Limanı",
      ru: "Порт Владивосток",
    }),
    description: localizedText(
      "Pacific maritime endpoint anchoring the eastern side of the North-West corridor.",
      {
        az: "Şimal-Qərb dəhlizinin şərq ucunu təmin edən Sakit okean dəniz terminalı.",
        ru: "Тихоокеанский морской терминал, закрепляющий восточную часть коридора Северо-Запад.",
      },
    ),
    category: "port",
    icon: "fas:ship",
    coordinates: [43.1155, 131.8855],
    connectedCorridorIds: ["eurasian-corridor"],
  },
  {
    id: "bandar-abbas-port",
    name: localizedText("Bandar Abbas Port", {
      az: "Bəndər-Abbas Limanı",
      ru: "Порт Бендер-Аббас",
    }),
    description: localizedText(
      "A Persian Gulf port gateway receiving North-South corridor freight from the Caucasus.",
      {
        az: "Qafqazdan gələn Şimal-Cənub dəhlizi yüklərini qəbul edən Fars körfəzi liman qapısı.",
        ru: "Портовый шлюз в Персидском заливе, принимающий грузы коридора Север-Юг из Кавказского региона.",
      },
    ),
    category: "port",
    icon: "fas:anchor",
    coordinates: [27.1832, 56.2666],
    connectedCorridorIds: ["north-south"],
  },
  {
    id: "tehran-logistics-hub",
    name: localizedText("Tehran Logistics Hub", {
      az: "Tehran Logistika Qovşağı",
      ru: "Логистический хаб Тегеран",
    }),
    description: localizedText(
      "An inland transfer hub balancing northbound cargo with Gulf and South Asia connections.",
      {
        az: "Şimal istiqamətli yük axınlarını Körfəz və Cənubi Asiya bağlantıları ilə balanslaşdıran daxili transfer mərkəzi.",
        ru: "Внутренний перевалочный хаб, балансирующий северные потоки грузов с направлениями к Персидскому заливу и Южной Азии.",
      },
    ),
    category: "station",
    icon: "fas:industry",
    coordinates: [35.6892, 51.389],
    connectedCorridorIds: ["north-south", "lapis-lazuli"],
  },
  {
    id: "karachi-gateway",
    name: localizedText("Karachi Gateway", {
      az: "Kəraçi Keçid Qovşağı",
      ru: "Карачинский шлюз",
    }),
    description: localizedText(
      "A South Asia maritime gateway at the lower end of southern corridor flows.",
      {
        az: "Cənub dəhlizi axınlarının aşağı ucunda yerləşən Cənubi Asiya dəniz qapısı.",
        ru: "Южноазиатский морской шлюз на южном окончании коридорных потоков.",
      },
    ),
    category: "port",
    icon: "fas:ship",
    coordinates: [24.8607, 67.0011],
    connectedCorridorIds: ["north-south", "lapis-lazuli"],
  },
  {
    id: "nakhchivan-terminal",
    name: localizedText("Nakhchivan Corridor Terminal", {
      az: "Naxçıvan Dəhliz Terminalı",
      ru: "Коридорный терминал Нахчыван",
    }),
    description: localizedText(
      "A western Azerbaijan transfer point supporting the Zangazur corridor connection.",
      {
        az: "Zəngəzur dəhlizi bağlantısını dəstəkləyən qərbi Azərbaycan transfer nöqtəsi.",
        ru: "Точка перевалки в западном Азербайджане, поддерживающая связь по Зангезурскому коридору.",
      },
    ),
    category: "station",
    icon: "fas:warehouse",
    coordinates: [39.2089, 45.4122],
    connectedCorridorIds: ["zangazur"],
  },
  {
    id: "faw-grand-port",
    name: localizedText("Faw Grand Port", {
      az: "Faw Böyük Limanı",
      ru: "Большой порт Фао",
    }),
    description: localizedText(
      "The southern maritime anchor of the Iraq railway development axis.",
      {
        az: "İraq dəmir yolu inkişaf oxunun cənub dəniz dayağı.",
        ru: "Южный морской якорь оси развития иракской железной дороги.",
      },
    ),
    category: "port",
    icon: "fas:anchor",
    coordinates: [29.9744, 48.4728],
    connectedCorridorIds: ["iraq-railway"],
  },
  {
    id: "baghdad-cargo-terminal",
    name: localizedText("Baghdad Cargo Terminal", {
      az: "Bağdad Yük Terminalı",
      ru: "Грузовой терминал Багдад",
    }),
    description: localizedText(
      "A central Iraqi inland terminal linking the Gulf approach with northern rail development.",
      {
        az: "Körfəz yanaşmasını şimal dəmir yolu inkişafı ilə birləşdirən mərkəzi İraq daxili terminalı.",
        ru: "Центральный иракский внутренний терминал, связывающий подход из Персидского залива с северным железнодорожным развитием.",
      },
    ),
    category: "station",
    icon: "fas:boxes-stacked",
    coordinates: [33.3152, 44.3661],
    connectedCorridorIds: ["iraq-railway"],
  },
  {
    id: "amman-freight-hub",
    name: localizedText("Amman Freight Hub", {
      az: "Amman Yük Qovşağı",
      ru: "Грузовой хаб Амман",
    }),
    description: localizedText(
      "A Levantine transfer node positioned on the revived Hejaz corridor spine.",
      {
        az: "Yenidən canlandırılan Hicaz dəhlizi oxu üzərində yerləşən Levant transfer qovşağı.",
        ru: "Левантийский перевалочный узел на оси возрождаемого Хиджазского коридора.",
      },
    ),
    category: "station",
    icon: "fas:warehouse",
    coordinates: [31.9539, 35.9106],
    connectedCorridorIds: ["hejaz-railway"],
  },
  {
    id: "damascus-terminal",
    name: localizedText("Damascus Terminal", {
      az: "Dəməşq Terminalı",
      ru: "Терминал Дамаск",
    }),
    description: localizedText(
      "A northern Hejaz endpoint supporting regional rail recovery and cross-border transfer.",
      {
        az: "Regional dəmir yolu bərpasını və sərhədlərarası transferi dəstəkləyən şimal Hicaz son dayanacağı.",
        ru: "Северная конечная точка Хиджазского направления, поддерживающая восстановление региональной железной дороги и трансграничную перевалку.",
      },
    ),
    category: "station",
    icon: "fas:train",
    coordinates: [33.5138, 36.2765],
    connectedCorridorIds: ["hejaz-railway"],
  },
];
