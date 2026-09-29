"use client";

import { useEffect, useState } from "react";
import { LocateFixed, SlidersHorizontal, X } from "lucide-react";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";

import { basemapTileUrl } from "@/data/basemaps";
import { DEFAULT_MAP_VIEW } from "@/data/corridors";
import type { AppSettings, MapViewSettings } from "@/types/admin";

// Mirrors ZOOM_RANGE in admin-schemas.ts; the schema is server-only code.
const ZOOM_MIN = 1;
const ZOOM_MAX = 18;

const PREVIEW_TILE_URL = basemapTileUrl("default", "en");

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function roundCoordinate(value: number) {
  return Math.round(value * 1000) / 1000;
}

/**
 * Keeps the preview map's limits in step with the form, and reports the view
 * the admin drags to. Leaflet clamps the live zoom into the new limits itself,
 * which then flows back through `moveend`, so the default zoom can never leave
 * the [min, max] window.
 */
function PreviewController({
  minZoom,
  maxZoom,
  view,
  onViewChange,
}: {
  minZoom: number;
  maxZoom: number;
  /** Last value typed into the form; the map follows it. */
  view: { center: [number, number]; zoom: number } | null;
  onViewChange: (center: [number, number], zoom: number) => void;
}) {
  const map = useMap();

  useEffect(() => {
    map.setMinZoom(minZoom);
    map.setMaxZoom(maxZoom);
  }, [map, minZoom, maxZoom]);

  useEffect(() => {
    if (!view) {
      return;
    }

    const current = map.getCenter();

    if (
      roundCoordinate(current.lat) !== view.center[0] ||
      roundCoordinate(current.lng) !== view.center[1] ||
      map.getZoom() !== view.zoom
    ) {
      map.setView(view.center, view.zoom, { animate: false });
    }
  }, [map, view]);

  useMapEvents({
    moveend: () => {
      const center = map.getCenter();
      onViewChange([roundCoordinate(center.lat), roundCoordinate(center.lng)], map.getZoom());
    },
  });

  return null;
}

function ZoomField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-2">
        <span className="hc-label">{label}</span>
        <span className="hc-mono text-sm text-[var(--hc-accent-ink)]">{value}</span>
      </span>
      <input
        type="range"
        min={ZOOM_MIN}
        max={ZOOM_MAX}
        step={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-1.5 w-full accent-[var(--hc-accent)]"
      />
      <span className="mt-1 block text-xs text-[var(--hc-muted)]">{hint}</span>
    </label>
  );
}

export function MapSettingsDialog({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: (settings: AppSettings) => void;
}) {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  // Set only by the form fields; map drags update `settings` directly.
  const [typedView, setTypedView] = useState<{ center: [number, number]; zoom: number } | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;

    fetch("/api/admin/settings")
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Could not load settings.");
        }

        return (await response.json()) as AppSettings;
      })
      .then((payload) => {
        if (!cancelled) {
          setSettings(payload);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Could not load settings.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function patch(next: Partial<MapViewSettings>) {
    setSettings((current) => (current ? { ...current, ...next } : current));
  }

  function setMinZoom(minZoom: number) {
    if (!settings) {
      return;
    }

    // Dragging min past max pushes max along rather than fighting the admin.
    const maxZoom = Math.max(settings.maxZoom, minZoom);
    patch({ minZoom, maxZoom });
  }

  function setMaxZoom(maxZoom: number) {
    if (!settings) {
      return;
    }

    const minZoom = Math.min(settings.minZoom, maxZoom);
    patch({ minZoom, maxZoom });
  }

  function setDefaultZoom(zoom: number) {
    if (!settings) {
      return;
    }

    const defaultZoom = clamp(zoom, settings.minZoom, settings.maxZoom);
    patch({ defaultZoom });
    setTypedView({ center: settings.defaultMapCenter, zoom: defaultZoom });
  }

  function setCenter(index: 0 | 1, raw: string) {
    if (!settings) {
      return;
    }

    const value = Number(raw);

    if (!Number.isFinite(value)) {
      return;
    }

    const center: [number, number] = [...settings.defaultMapCenter];
    center[index] = index === 0 ? clamp(value, -85, 85) : clamp(value, -180, 180);
    patch({ defaultMapCenter: center });
    setTypedView({ center, zoom: settings.defaultZoom });
  }

  function resetToSeed() {
    patch({
      defaultMapCenter: DEFAULT_MAP_VIEW.center,
      defaultZoom: DEFAULT_MAP_VIEW.zoom,
      minZoom: DEFAULT_MAP_VIEW.minZoom,
      maxZoom: DEFAULT_MAP_VIEW.maxZoom,
    });
    setTypedView({ center: DEFAULT_MAP_VIEW.center, zoom: DEFAULT_MAP_VIEW.zoom });
  }

  async function save() {
    if (!settings || saving) {
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const payload = (await response.json()) as AppSettings | { error?: string };

      if (!response.ok) {
        throw new Error(("error" in payload && payload.error) || "Could not save settings.");
      }

      onSaved(payload as AppSettings);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Could not save settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[1200] flex items-center justify-center bg-[rgba(4,10,18,0.62)] p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="map-settings-title"
        className="hc-panel flex max-h-[calc(100vh-2rem)] w-full max-w-[960px] flex-col overflow-hidden shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[var(--hc-line)] px-5 py-4">
          <div>
            <p className="hc-eyebrow flex items-center gap-2">
              <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
              Public map
            </p>
            <h2
              id="map-settings-title"
              className="mt-1 text-lg font-semibold text-[var(--hc-text)]"
            >
              Map view settings
            </h2>
            <p className="mt-1 text-xs text-[var(--hc-muted)]">
              Drag and zoom the preview to set where visitors start. The sliders cap how far they
              can zoom out and in.
            </p>
          </div>
          <button type="button" onClick={onClose} className="hc-btn hc-btn--xs" aria-label="Close">
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>

        {loadError ? (
          <p className="hc-mono px-5 py-6 text-sm text-[var(--hc-rose)]">⚠ {loadError}</p>
        ) : !settings ? (
          <p className="px-5 py-6 text-sm text-[var(--hc-muted)]">Loading settings…</p>
        ) : (
          <div className="grid min-h-0 flex-1 gap-0 overflow-y-auto md:grid-cols-[minmax(0,1fr)_300px]">
            <div className="relative min-h-[320px] md:min-h-[460px]">
              <MapContainer
                center={settings.defaultMapCenter}
                zoom={settings.defaultZoom}
                minZoom={settings.minZoom}
                maxZoom={settings.maxZoom}
                attributionControl={false}
                className="corridor-map-canvas h-full w-full"
              >
                <TileLayer url={PREVIEW_TILE_URL} subdomains={["0", "1", "2", "3"]} />
                <PreviewController
                  minZoom={settings.minZoom}
                  maxZoom={settings.maxZoom}
                  view={typedView}
                  onViewChange={(center, zoom) =>
                    patch({ defaultMapCenter: center, defaultZoom: zoom })
                  }
                />
              </MapContainer>
              <div className="hc-mono pointer-events-none absolute bottom-3 left-3 z-[1000] rounded-md bg-[rgba(4,10,18,0.72)] px-2.5 py-1.5 text-xs text-white">
                zoom {settings.defaultZoom} · {settings.defaultMapCenter[0].toFixed(3)},{" "}
                {settings.defaultMapCenter[1].toFixed(3)}
              </div>
            </div>

            <div className="flex flex-col gap-4 border-t border-[var(--hc-line)] p-5 md:border-l md:border-t-0">
              <ZoomField
                label="Min zoom"
                hint="Furthest out visitors can zoom. 3 shows the whole corridor network."
                value={settings.minZoom}
                onChange={setMinZoom}
              />
              <ZoomField
                label="Max zoom"
                hint="Closest in visitors can zoom. Google tiles go to 18."
                value={settings.maxZoom}
                onChange={setMaxZoom}
              />
              <ZoomField
                label="Start zoom"
                hint="Zoom on first load. Kept between min and max."
                value={settings.defaultZoom}
                onChange={setDefaultZoom}
              />

              <div>
                <span className="hc-label">Start center</span>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="hc-mono text-[0.65rem] uppercase text-[var(--hc-muted)]">
                      Lat
                    </span>
                    <input
                      type="number"
                      step={0.001}
                      min={-85}
                      max={85}
                      value={settings.defaultMapCenter[0]}
                      onChange={(event) => setCenter(0, event.target.value)}
                      className="hc-field hc-mono"
                    />
                  </label>
                  <label className="block">
                    <span className="hc-mono text-[0.65rem] uppercase text-[var(--hc-muted)]">
                      Lng
                    </span>
                    <input
                      type="number"
                      step={0.001}
                      min={-180}
                      max={180}
                      value={settings.defaultMapCenter[1]}
                      onChange={(event) => setCenter(1, event.target.value)}
                      className="hc-field hc-mono"
                    />
                  </label>
                </div>
              </div>

              <button type="button" onClick={resetToSeed} className="hc-btn hc-btn--xs self-start">
                <LocateFixed className="h-3.5 w-3.5" aria-hidden="true" />
                Reset to Baku default
              </button>

              <div className="mt-auto space-y-3 pt-2">
                {saveError ? (
                  <p className="hc-mono text-sm text-[var(--hc-rose)]">⚠ {saveError}</p>
                ) : null}
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={onClose} className="hc-btn">
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void save()}
                    disabled={saving}
                    className="hc-btn hc-btn--primary disabled:opacity-60"
                  >
                    {saving ? "Saving…" : "Save settings"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
