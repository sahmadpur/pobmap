"use client";

import {
  Globe2,
  Route as RouteIcon,
  ShipWheel,
  TimerReset,
  TrainFront,
  Truck,
  X,
} from "lucide-react";
import type { TFunction } from "i18next";

import {
  getCountryFlagEmoji,
  getCountryName,
  getLocalizedText,
  TRANSPORT_MODE_META,
} from "@/data/corridors";
import type {
  CorridorRoute,
  SupportedLocale,
  TransportMode,
} from "@/types/map";

function ModeIcon({ mode }: { mode: TransportMode }) {
  if (mode === "rail") {
    return <TrainFront className="h-4 w-4" aria-hidden="true" />;
  }

  if (mode === "ship") {
    return <ShipWheel className="h-4 w-4" aria-hidden="true" />;
  }

  return <Truck className="h-4 w-4" aria-hidden="true" />;
}

interface RouteDetailsPanelProps {
  route: CorridorRoute | null;
  locale: SupportedLocale;
  theme: "dark" | "light";
  isOpen: boolean;
  selectedSegmentId: string | null;
  onClose: () => void;
  onSegmentSelect: (segmentId: string | null) => void;
  t: TFunction;
}

export function RouteDetailsPanel({
  route,
  locale,
  theme,
  isOpen,
  selectedSegmentId,
  onClose,
  onSegmentSelect,
  t,
}: RouteDetailsPanelProps) {
  const isDark = theme === "dark";
  const selectedSegment =
    route?.segments.find((segment) => segment.id === selectedSegmentId) ?? null;

  return (
    <aside
      className={`pointer-events-auto absolute inset-x-0 bottom-0 z-[500] h-[76vh] rounded-t-[2rem] border backdrop-blur xl:inset-y-4 xl:right-4 xl:left-auto xl:h-auto xl:w-[380px] xl:rounded-[2rem] ${
        isDark
          ? "border-white/14 bg-slate-950/92 shadow-2xl shadow-slate-950/40"
          : "border-slate-200 bg-white/92 shadow-xl shadow-slate-300/35"
      } ${
        isOpen ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 xl:translate-y-0 xl:translate-x-[120%]"
      } transition duration-300`}
      aria-hidden={!isOpen}
    >
      <div className="flex h-full flex-col">
        <div className={`flex items-start justify-between border-b px-5 py-5 ${isDark ? "border-white/10" : "border-slate-200"}`}>
          <div>
            <p className={`text-xs uppercase tracking-[0.28em] ${isDark ? "text-sky-200/70" : "text-sky-600"}`}>
              {t("panel.routeOverview")}
            </p>
            <h2 className={`mt-2 text-2xl font-semibold ${isDark ? "text-white" : "text-slate-950"}`}>
              {route ? getLocalizedText(route.name, locale) : t("panel.emptyTitle")}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition ${
              isDark
                ? "border-white/12 bg-white/6 text-slate-200 hover:bg-white/10"
                : "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
            aria-label={t("controls.clearSelection")}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {!route ? (
          <div className={`flex flex-1 flex-col justify-center gap-4 px-5 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
            <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl ${isDark ? "bg-sky-400/10 text-sky-200" : "bg-sky-100 text-sky-700"}`}>
              <RouteIcon className="h-7 w-7" aria-hidden="true" />
            </div>
            <p className={`max-w-sm text-sm leading-7 ${isDark ? "text-slate-300/85" : "text-slate-600"}`}>
              {t("panel.emptyBody")}
            </p>
          </div>
        ) : (
          <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                  route.status === "active"
                    ? isDark
                      ? "bg-emerald-400/12 text-emerald-200"
                      : "bg-emerald-50 text-emerald-700"
                    : isDark
                      ? "bg-amber-400/14 text-amber-100"
                      : "bg-amber-50 text-amber-700"
                }`}
              >
                {t(`status.${route.status}`)}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                  isDark ? "bg-sky-400/12 text-sky-100" : "bg-sky-50 text-sky-700"
                }`}
              >
                {t(`legend.${route.type}`)}
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className={`rounded-2xl border p-4 ${isDark ? "border-white/8 bg-white/5" : "border-slate-200 bg-slate-50/85"}`}>
                <div className={`flex items-center gap-2 text-xs uppercase tracking-[0.18em] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  <TimerReset className="h-4 w-4" aria-hidden="true" />
                  {t("panel.transitTime")}
                </div>
                <p className={`mt-3 text-lg font-semibold ${isDark ? "text-white" : "text-slate-950"}`}>
                  {getLocalizedText(route.transitTime, locale)}
                </p>
              </div>
              <div className={`rounded-2xl border p-4 ${isDark ? "border-white/8 bg-white/5" : "border-slate-200 bg-slate-50/85"}`}>
                <div className={`flex items-center gap-2 text-xs uppercase tracking-[0.18em] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  <RouteIcon className="h-4 w-4" aria-hidden="true" />
                  {t("panel.totalDistance")}
                </div>
                <p className={`mt-3 text-lg font-semibold ${isDark ? "text-white" : "text-slate-950"}`}>
                  {route.totalDistanceKm.toLocaleString()} km
                </p>
              </div>
            </div>

            <section className={`rounded-2xl border p-4 ${isDark ? "border-white/8 bg-white/4" : "border-slate-200 bg-slate-50/85"}`}>
              <div className={`flex items-center gap-2 text-xs uppercase tracking-[0.18em] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                <Globe2 className="h-4 w-4" aria-hidden="true" />
                {t("panel.countries")}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {route.countries.map((countryCode) => (
                  <span
                    key={countryCode}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${
                      isDark
                        ? "border-white/10 bg-slate-900/75 text-slate-100"
                        : "border-slate-200 bg-white text-slate-800"
                    }`}
                  >
                    <span aria-hidden="true">{getCountryFlagEmoji(countryCode)}</span>
                    {getCountryName(countryCode, locale)}
                  </span>
                ))}
              </div>
            </section>

            <section className={`rounded-2xl border p-4 ${isDark ? "border-white/8 bg-white/4" : "border-slate-200 bg-slate-50/85"}`}>
              {selectedSegment ? (
                <div className={`mb-4 rounded-2xl border p-4 ${isDark ? "border-white/10 bg-slate-900/70" : "border-slate-200 bg-white/90"}`}>
                  <div className={`flex items-center gap-2 text-xs uppercase tracking-[0.18em] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    <RouteIcon className="h-4 w-4" aria-hidden="true" />
                    {t("panel.selectedSegment")}
                  </div>
                  <div className="mt-3 flex items-start justify-between gap-4">
                    <div>
                      <div className={`flex items-center gap-2 text-sm font-medium ${isDark ? "text-white" : "text-slate-900"}`}>
                        <span
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full"
                          style={{
                            backgroundColor: `${TRANSPORT_MODE_META[selectedSegment.mode].color}22`,
                            color: TRANSPORT_MODE_META[selectedSegment.mode].color,
                          }}
                        >
                          <ModeIcon mode={selectedSegment.mode} />
                        </span>
                        {t(TRANSPORT_MODE_META[selectedSegment.mode].labelKey)}
                      </div>
                      <p className={`mt-2 text-sm leading-6 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                        {getLocalizedText(selectedSegment.from, locale)} →{" "}
                        {getLocalizedText(selectedSegment.to, locale)}
                      </p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      isDark ? "bg-white/6 text-slate-200" : "bg-slate-100 text-slate-700"
                    }`}>
                      {selectedSegment.distanceKm} km
                    </span>
                  </div>
                </div>
              ) : (
                <p className={`mb-4 text-sm leading-6 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                  {t("panel.segmentHint")}
                </p>
              )}
              <h3 className={`text-xs uppercase tracking-[0.18em] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                {t("panel.segments")}
              </h3>
              <div className="mt-4 space-y-3">
                {route.segments.map((segment) => (
                  <button
                    key={segment.id}
                    type="button"
                    onClick={() =>
                      onSegmentSelect(
                        selectedSegmentId === segment.id ? null : segment.id,
                      )
                    }
                    className={`block w-full rounded-2xl border p-4 text-left transition ${
                      selectedSegmentId === segment.id
                        ? isDark
                          ? "bg-slate-900/90 shadow-lg"
                          : "bg-white shadow-lg"
                        : isDark
                          ? "border-white/8 bg-slate-950/70 hover:border-white/16 hover:bg-slate-900/78"
                          : "border-slate-200 bg-white/90 hover:border-slate-300 hover:bg-white"
                    }`}
                    style={
                      selectedSegmentId === segment.id
                        ? {
                            borderColor: `${TRANSPORT_MODE_META[segment.mode].color}88`,
                            boxShadow: `0 18px 40px ${TRANSPORT_MODE_META[segment.mode].color}20`,
                          }
                        : undefined
                    }
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className={`flex items-center gap-2 text-sm font-medium ${isDark ? "text-white" : "text-slate-900"}`}>
                          <span
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full"
                            style={{
                              backgroundColor: `${TRANSPORT_MODE_META[segment.mode].color}22`,
                              color: TRANSPORT_MODE_META[segment.mode].color,
                            }}
                          >
                            <ModeIcon mode={segment.mode} />
                          </span>
                          {t(TRANSPORT_MODE_META[segment.mode].labelKey)}
                        </div>
                        <p className={`mt-2 text-sm leading-6 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                          {getLocalizedText(segment.from, locale)} →{" "}
                          {getLocalizedText(segment.to, locale)}
                        </p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        isDark ? "bg-white/6 text-slate-200" : "bg-slate-100 text-slate-700"
                      }`}>
                        {segment.distanceKm} km
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section className={`rounded-2xl border p-4 ${isDark ? "border-white/8 bg-white/4" : "border-slate-200 bg-slate-50/85"}`}>
              <h3 className={`text-xs uppercase tracking-[0.18em] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                {t("panel.description")}
              </h3>
              <p className={`mt-3 text-sm leading-7 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                {getLocalizedText(route.description, locale)}
              </p>
            </section>
          </div>
        )}
      </div>
    </aside>
  );
}
