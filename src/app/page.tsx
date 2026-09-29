import { InteractiveMapShell } from "@/components/map/interactive-map-shell";
import { listMarkers, listRoutes, listStops } from "@/lib/server/admin-store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const stops = await listStops();
  const routes = await listRoutes();
  const markers = await listMarkers();

  return <InteractiveMapShell routes={routes} markers={markers} stops={stops} />;
}
