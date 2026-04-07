import { getTransportStop } from "@/data/transport-stops";
import type {
  Coordinate,
  CorridorRoute,
  CorridorSegment,
  LocalizedText,
  TransportMode,
} from "@/types/map";

function localizedText(az: string, en: string, ru: string): LocalizedText {
  return { az, en, ru };
}

function getStop(stopId: string) {
  const stop = getTransportStop(stopId);

  if (!stop) {
    throw new Error(`Unknown transport stop: ${stopId}`);
  }

  return stop;
}

function createSegment({
  id,
  mode,
  stopIds,
  distanceKm,
  displayCoordinates,
}: {
  id: string;
  mode: TransportMode;
  stopIds: string[];
  distanceKm: number;
  displayCoordinates?: Coordinate[];
}): CorridorSegment {
  const stops = stopIds.map(getStop);

  return {
    id,
    mode,
    from: stops[0].name,
    to: stops[stops.length - 1].name,
    distanceKm,
    coordinates: stops.map((stop) => stop.coordinates),
    displayCoordinates,
    stopIds,
  };
}

export const REFERENCE_MAP_ROUTES: CorridorRoute[] = [
  {
    id: "east-west",
    name: localizedText(
      "Şərq-Qərb Dəhlizi",
      "East-West Corridor",
      "Коридор Восток-Запад",
    ),
    routeColor: "#E11D48",
    type: "primary",
    totalDistanceKm: 14050,
    transitTime: localizedText("12-16 gün", "12-16 days", "12-16 дней"),
    countries: ["CN", "KZ", "AZ", "GE", "TR", "RO", "HU", "AT", "DE", "NL", "BE", "FR", "ES"],
    description: localizedText(
      "Yüklənmiş Şərq-Qərb xəritəsi üzrə yenidən qurulan bu marşrut Çin sahil terminallarını Mərkəzi Asiya, Xəzər keçidi, Bakı-Tbilisi-Qars oxu və Qərbi Avropa paylama qovşaqları ilə birləşdirir.",
      "Reconstructed from the uploaded East-West reference map, this corridor links Chinese coastal terminals with Central Asia, the Caspian crossing, the Baku-Tbilisi-Kars spine, and western European distribution gateways.",
      "Пересобранный по загруженной карте East-West, этот коридор связывает китайские прибрежные терминалы с Центральной Азией, каспийским переходом, осью Баку-Тбилиси-Карс и западноевропейскими распределительными узлами.",
    ),
    status: "active",
    animationSpeed: 0.11,
    segments: [
      createSegment({
        id: "east-west-main-1",
        mode: "rail",
        stopIds: ["qingdao", "zhengzhou", "xian"],
        distanceKm: 1350,
        displayCoordinates: [
          [36.0671, 120.3826],
          [35.5, 117.6],
          [34.7473, 113.6249],
          [34.3416, 108.9398],
        ],
      }),
      createSegment({
        id: "east-west-main-2",
        mode: "rail",
        stopIds: ["xian", "urumqi", "almaty"],
        distanceKm: 2850,
        displayCoordinates: [
          [34.3416, 108.9398],
          [36.0611, 103.8343],
          [38.4872, 106.2309],
          [43.8256, 87.6168],
          [44.2, 80.4],
          [43.2389, 76.8897],
        ],
      }),
      createSegment({
        id: "east-west-main-3",
        mode: "rail",
        stopIds: ["almaty", "atyrau", "aktau"],
        distanceKm: 2650,
        displayCoordinates: [
          [43.2389, 76.8897],
          [44.8, 73.1],
          [46.4, 67.9],
          [47.1068, 51.9166],
          [45.6, 51.5],
          [43.6532, 51.1975],
        ],
      }),
      createSegment({
        id: "east-west-main-4",
        mode: "ship",
        stopIds: ["aktau", "baku-port"],
        distanceKm: 430,
        displayCoordinates: [
          [43.6532, 51.1975],
          [43.3, 50.8],
          [42.7, 50.2],
          [41.7, 49.9],
          [40.3572, 49.835],
        ],
      }),
      createSegment({
        id: "east-west-main-5",
        mode: "rail",
        stopIds: ["baku-port", "tbilisi", "kars", "ankara", "istanbul"],
        distanceKm: 1950,
        displayCoordinates: [
          [40.3572, 49.835],
          [41.7151, 44.8271],
          [40.6013, 43.0947],
          [39.9334, 32.8597],
          [41.0082, 28.9784],
        ],
      }),
      createSegment({
        id: "east-west-main-6",
        mode: "rail",
        stopIds: ["istanbul", "bucharest", "budapest", "vienna", "frankfurt", "duisburg"],
        distanceKm: 2300,
        displayCoordinates: [
          [41.0082, 28.9784],
          [42.1, 27.3],
          [44.4268, 26.1025],
          [45.8, 23.0],
          [47.4979, 19.0402],
          [48.2082, 16.3738],
          [50.1109, 8.6821],
          [51.4344, 6.7623],
        ],
      }),
      createSegment({
        id: "east-west-main-7",
        mode: "rail",
        stopIds: ["duisburg", "rotterdam"],
        distanceKm: 220,
        displayCoordinates: [
          [51.4344, 6.7623],
          [51.7, 5.6],
          [51.9244, 4.4777],
        ],
      }),
      createSegment({
        id: "east-west-main-8",
        mode: "rail",
        stopIds: ["duisburg", "brussels", "paris", "barcelona", "madrid"],
        distanceKm: 4300,
        displayCoordinates: [
          [51.4344, 6.7623],
          [50.8503, 4.3517],
          [48.8566, 2.3522],
          [45.7, 2.2],
          [41.3851, 2.1734],
          [40.4168, -3.7038],
        ],
      }),
    ],
  },
  {
    id: "north-west",
    name: localizedText(
      "Şimal-Qərb Dəhlizi",
      "North-West Corridor",
      "Коридор Северо-Запад",
    ),
    routeColor: "#4F46E5",
    type: "primary",
    totalDistanceKm: 15550,
    transitTime: localizedText("16-22 gün", "16-22 days", "16-22 дня"),
    countries: ["AZ", "RU", "FI", "TR", "JP"],
    description: localizedText(
      "Şimal-Qərb məqsəd xəritəsi əsasında qurulan marşrut Bakı Limanını Rusiya magistralı, Finlandiya qolu, Uzaq Şərq Sakit okean çıxışları və Türkiyə bağlantısı ilə birləşdirir.",
      "Built from the uploaded North-West reference map, this corridor ties Baku Port to the Russian mainline, the Finland branch, Pacific exits in the Russian Far East, and the Turkish connection.",
      "Построенный по загруженной карте North-West, этот коридор связывает Бакинский порт с российской магистралью, финской веткой, тихоокеанскими выходами на Дальнем Востоке и турецким направлением.",
    ),
    status: "active",
    animationSpeed: 0.1,
    segments: [
      createSegment({
        id: "north-west-main-1",
        mode: "rail",
        stopIds: ["baku-port", "makhachkala", "astrakhan", "moscow"],
        distanceKm: 2200,
        displayCoordinates: [
          [40.3572, 49.835],
          [41.1, 49.1],
          [42.6977, 47.5034],
          [44.2, 47.7],
          [46.3497, 48.0408],
          [49.2, 45.5],
          [52.5, 41.8],
          [55.7558, 37.6173],
        ],
      }),
      createSegment({
        id: "north-west-main-2",
        mode: "rail",
        stopIds: ["moscow", "st-petersburg"],
        distanceKm: 650,
        displayCoordinates: [
          [55.7558, 37.6173],
          [57.8, 33.6],
          [59.9343, 30.3351],
        ],
      }),
      createSegment({
        id: "north-west-main-3",
        mode: "rail",
        stopIds: ["st-petersburg", "helsinki"],
        distanceKm: 400,
        displayCoordinates: [
          [59.9343, 30.3351],
          [60.1, 28.0],
          [60.1699, 24.9384],
        ],
      }),
      createSegment({
        id: "north-west-main-4",
        mode: "rail",
        stopIds: ["moscow", "novosibirsk", "irkutsk", "khabarovsk", "vladivostok"],
        distanceKm: 9300,
        displayCoordinates: [
          [55.7558, 37.6173],
          [55.8, 48.6],
          [55.6, 60.0],
          [55.0084, 82.9357],
          [54.0, 95.0],
          [52.2869, 104.305],
          [53.4, 118.0],
          [49.7, 127.0],
          [48.4802, 135.0719],
          [43.1155, 131.8855],
        ],
      }),
      createSegment({
        id: "north-west-main-5",
        mode: "ship",
        stopIds: ["vladivostok", "yokohama"],
        distanceKm: 1150,
        displayCoordinates: [
          [43.1155, 131.8855],
          [42.1, 135.0],
          [40.4, 138.0],
          [37.8, 140.2],
          [35.4437, 139.638],
        ],
      }),
      createSegment({
        id: "north-west-main-6",
        mode: "rail",
        stopIds: ["baku-port", "tbilisi", "kars", "ankara", "istanbul"],
        distanceKm: 1850,
        displayCoordinates: [
          [40.3572, 49.835],
          [41.7151, 44.8271],
          [40.6013, 43.0947],
          [39.9334, 32.8597],
          [41.0082, 28.9784],
        ],
      }),
    ],
  },
  {
    id: "south-west",
    name: localizedText(
      "Cənub-Qərb Dəhlizi",
      "South-West Corridor",
      "Коридор Юго-Запад",
    ),
    routeColor: "#0F766E",
    type: "primary",
    totalDistanceKm: 12150,
    transitTime: localizedText("14-19 gün", "14-19 days", "14-19 дней"),
    countries: ["AZ", "GE", "TR", "RO", "HU", "AT", "DE", "BE", "FR", "ES", "GR", "IR", "PK", "IN"],
    description: localizedText(
      "Cənub-Qərb xəritəsi üzrə yenidən qurulan dəhliz Bakı-Tbilisi-Qars xəttini Avropa qovşaqları, Aralıq dənizi dəniz qolu və İran üzərindən Pakistan-Hindistan çıxışları ilə birləşdirir.",
      "Rebuilt from the uploaded South-West reference map, this corridor combines the Baku-Tbilisi-Kars line with European inland gateways, a Mediterranean maritime branch, and the Iran-to-Pakistan-India southern leg.",
      "Пересобранный по загруженной карте South-West, этот коридор объединяет линию Баку-Тбилиси-Карс с европейскими внутренними узлами, средиземноморской морской веткой и южным плечом через Иран в Пакистан и Индию.",
    ),
    status: "active",
    animationSpeed: 0.105,
    segments: [
      createSegment({
        id: "south-west-main-1",
        mode: "rail",
        stopIds: ["baku-port", "tbilisi", "kars", "ankara", "istanbul"],
        distanceKm: 1950,
        displayCoordinates: [
          [40.3572, 49.835],
          [41.7151, 44.8271],
          [40.6013, 43.0947],
          [39.9334, 32.8597],
          [41.0082, 28.9784],
        ],
      }),
      createSegment({
        id: "south-west-main-2",
        mode: "rail",
        stopIds: ["istanbul", "bucharest", "budapest", "vienna", "frankfurt", "duisburg"],
        distanceKm: 2300,
        displayCoordinates: [
          [41.0082, 28.9784],
          [42.1, 27.3],
          [44.4268, 26.1025],
          [45.8, 23.0],
          [47.4979, 19.0402],
          [48.2082, 16.3738],
          [50.1109, 8.6821],
          [51.4344, 6.7623],
        ],
      }),
      createSegment({
        id: "south-west-main-3",
        mode: "rail",
        stopIds: ["duisburg", "brussels", "paris", "barcelona", "madrid"],
        distanceKm: 2900,
        displayCoordinates: [
          [51.4344, 6.7623],
          [50.8503, 4.3517],
          [48.8566, 2.3522],
          [45.7, 2.2],
          [41.3851, 2.1734],
          [40.4168, -3.7038],
        ],
      }),
      createSegment({
        id: "south-west-main-4",
        mode: "ship",
        stopIds: ["istanbul", "piraeus", "marseille"],
        distanceKm: 1750,
        displayCoordinates: [
          [41.0082, 28.9784],
          [39.7, 26.0],
          [37.942, 23.6465],
          [38.6, 18.0],
          [40.3, 12.0],
          [43.2965, 5.3698],
        ],
      }),
      createSegment({
        id: "south-west-main-5",
        mode: "rail",
        stopIds: ["baku-port", "lankaran", "tabriz", "tehran"],
        distanceKm: 900,
        displayCoordinates: [
          [40.3572, 49.835],
          [39.2, 49.2],
          [38.4329, 48.8742],
          [37.9, 47.2],
          [37.5536, 45.0761],
          [36.4, 48.1],
          [35.6892, 51.389],
        ],
      }),
      createSegment({
        id: "south-west-main-6",
        mode: "rail",
        stopIds: ["tehran", "pakistan-corridor-junction", "karachi"],
        distanceKm: 2350,
        displayCoordinates: [
          [35.6892, 51.389],
          [34.2, 55.5],
          [32.2, 60.8],
          [30.3753, 69.3451],
          [24.8607, 67.0011],
        ],
      }),
      createSegment({
        id: "south-west-main-7",
        mode: "ship",
        stopIds: ["karachi", "mumbai"],
        distanceKm: 900,
        displayCoordinates: [
          [24.8607, 67.0011],
          [22.9, 68.9],
          [20.9, 71.1],
          [18.96, 72.82],
        ],
      }),
    ],
  },
];
