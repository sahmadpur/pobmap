import { InteractiveMapShell } from "@/components/map/interactive-map-shell";
import { listRoutes } from "@/lib/server/admin-store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const routes = await listRoutes();

  return <InteractiveMapShell routes={routes} />;
}
