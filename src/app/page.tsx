import { InteractiveMapShell } from "@/components/map/interactive-map-shell";
import { getSettings, listMarkers, listRoutes, listStops } from "@/lib/server/admin-store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const stops = await listStops();
  const routes = await listRoutes();
  const markers = await listMarkers();
  const settings = await getSettings();

  return (
    <InteractiveMapShell
      routes={routes}
      markers={markers}
      stops={stops}
      mapView={{
        defaultMapCenter: settings.defaultMapCenter,
        defaultZoom: settings.defaultZoom,
        minZoom: settings.minZoom,
        maxZoom: settings.maxZoom,
      }}
    />
  );
}
