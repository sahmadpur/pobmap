"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
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
  getCountryName,
  getLocalizedText,
  TRANSPORT_MODE_META,
} from "@/data/corridors";
import { CountryFlag } from "@/components/ui/country-flag";
import { resolveSegmentGroups } from "@/data/corridor-segment-groups";
import type {
  CorridorRoute,
  CorridorSegment,
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
  isMapOnlyMode?: boolean;
  selectedSegmentId: string | null;
  onClose: () => void;
  onSegmentSelect: (segmentId: string | null) => void;
  /** Fires with the open group's segments, or null when every group closes. */
  onGroupOpen: (group: { id: string; segments: CorridorSegment[] } | null) => void;
  t: TFunction;
}

export function RouteDetailsPanel({
  route,
  locale,
  theme,
  isOpen,
  isMapOnlyMode = false,
  selectedSegmentId,
  onClose,
  onSegmentSelect,
  onGroupOpen,
  t,
}: RouteDetailsPanelProps) {
  const isDark = theme === "dark";
  const selectedSegment =
    route?.segments.find((segment) => segment.id === selectedSegmentId) ?? null;

  const groups = useMemo(() => (route ? resolveSegmentGroups(route) : []), [route]);
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const [scroll, setScroll] = useState({ up: false, down: false });

  // A different corridor means a different set of groups. Reset during render
  // rather than in an effect, which is React's own adjust-state-on-prop-change
  // pattern and avoids a second paint with the stale group open.
  const [lastRouteId, setLastRouteId] = useState(route?.id ?? null);

  if ((route?.id ?? null) !== lastRouteId) {
    setLastRouteId(route?.id ?? null);
    setOpenGroupId(null);
  }

  const toggleGroup = (groupId: string) => {
    const next = openGroupId === groupId ? null : groupId;

    setOpenGroupId(next);
    onGroupOpen(
      next ? { id: next, segments: groups.find((g) => g.id === next)!.segments } : null,
    );
  };

  // Arrow affordances: the panel body is long enough that the scrollbar alone
  // is easy to miss on a projector.
  const syncScroll = useCallback(() => {
    const body = bodyRef.current;

    if (!body) {
      return;
    }

    setScroll({
      up: body.scrollTop > 8,
      down: body.scrollTop + body.clientHeight < body.scrollHeight - 8,
    });
  }, []);

  // A different corridor starts at the top of the panel, not wherever the last
  // one was left.
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
  }, [route?.id]);

  useEffect(syncScroll, [syncScroll, route?.id, openGroupId, isOpen]);

  const scrollBody = (direction: -1 | 1) => {
    bodyRef.current?.scrollBy({
      top: direction * bodyRef.current.clientHeight * 0.8,
      behavior: "smooth",
    });
  };

  // Hidden by default; appears only when a route is selected.
  // Mobile: slides up as a bottom sheet. Desktop (lg+): slides in from the right,
  // symmetric with the left filters panel.
  const shown = !isMapOnlyMode && isOpen;
  const visibilityClass = shown
    ? "translate-y-0 opacity-100 lg:translate-x-0 lg:translate-y-0"
    : "translate-y-full opacity-0 lg:translate-y-0 lg:translate-x-[120%]";

  return (
    <aside
      className={`absolute z-[500] flex flex-col border backdrop-blur transition duration-300 ${
        shown ? "pointer-events-auto" : "pointer-events-none"
      } inset-x-0 bottom-0 h-[80vh] rounded-t-[1.75rem] lg:inset-x-auto lg:right-3 lg:top-[5.5rem] lg:bottom-3 lg:h-auto lg:w-[min(22rem,calc(100vw-1.5rem))] lg:rounded-2xl ${
        isDark
          ? "border-white/12 bg-slate-950/92 shadow-[0_28px_70px_-30px_rgba(2,6,23,0.85)]"
          : "border-slate-200/70 bg-white/92 shadow-[0_28px_70px_-34px_rgba(30,58,95,0.4)]"
      } ${visibilityClass}`}
      aria-hidden={!shown}
    >
      <div className="flex h-full min-h-0 flex-col">
        <div className={`flex items-start justify-between border-b px-5 py-4 ${isDark ? "border-white/10" : "border-slate-200"}`}>
          <div>
            <p className="font-label text-[0.7rem] uppercase text-[var(--accent)]">
              {t("panel.routeOverview")}
            </p>
            <h2 className={`font-display mt-2 text-2xl font-semibold leading-tight ${isDark ? "text-white" : "text-slate-950"}`}>
              {route ? getLocalizedText(route.name, locale) : t("panel.emptyTitle")}
            </h2>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition ${
                isDark
                  ? "border-white/12 bg-white/8 text-slate-100 hover:bg-white/14"
                  : "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
              aria-label={t("controls.clearSelection")}
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
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
          <div className="relative flex min-h-0 flex-1 flex-col">
          <div
            ref={bodyRef}
            onScroll={syncScroll}
            className="flex-1 space-y-6 overflow-y-auto px-5 py-5"
          >
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
                    <CountryFlag code={countryCode} size={20} />
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
              {/* Grouped where the corridor defines groups, flat otherwise. */}
              <div className="mt-4 space-y-3">
                {(groups.length > 0
                  ? groups
                  : [{ id: "all", name: null, segments: route.segments }]
                ).map((group) => {
                  const isOnlyGroup = group.name === null;
                  const isGroupOpen = isOnlyGroup || openGroupId === group.id;

                  return (
                    <div key={group.id} className={isOnlyGroup ? "space-y-3" : undefined}>
                      {!isOnlyGroup ? (
                        <button
                          type="button"
                          onClick={() => toggleGroup(group.id)}
                          aria-expanded={isGroupOpen}
                          className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                            isGroupOpen
                              ? isDark
                                ? "border-white/18 bg-slate-900/90"
                                : "border-slate-300 bg-white shadow-sm"
                              : isDark
                                ? "border-white/8 bg-slate-950/70 hover:border-white/16"
                                : "border-slate-200 bg-white/90 hover:border-slate-300"
                          }`}
                        >
                          {isGroupOpen ? (
                            <ChevronDown className="h-4 w-4 shrink-0" aria-hidden="true" />
                          ) : (
                            <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                          )}
                          <span className={`text-sm font-medium ${isDark ? "text-white" : "text-slate-900"}`}>
                            {getLocalizedText(group.name!, locale)}
                          </span>
                          <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-medium ${
                            isDark ? "bg-white/6 text-slate-300" : "bg-slate-100 text-slate-600"
                          }`}>
                            {group.segments.length}
                          </span>
                        </button>
                      ) : null}

                      {isGroupOpen ? (
                        <div className={isOnlyGroup ? "space-y-3" : "mt-3 space-y-3 pl-2"}>
                          {group.segments.map((segment) => (
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
                      ) : null}
                    </div>
                  );
                })}
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

          {(["up", "down"] as const).map((direction) =>
            scroll[direction] ? (
              <button
                key={direction}
                type="button"
                onClick={() => scrollBody(direction === "up" ? -1 : 1)}
                className={`absolute right-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border shadow-lg transition ${
                  direction === "up" ? "top-2" : "bottom-2"
                } ${
                  isDark
                    ? "border-white/12 bg-slate-900/90 text-slate-100 hover:bg-slate-800"
                    : "border-slate-200 bg-white/95 text-slate-700 hover:bg-slate-100"
                }`}
                aria-label={t(direction === "up" ? "panel.scrollUp" : "panel.scrollDown")}
              >
                {direction === "up" ? (
                  <ChevronUp className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <ChevronDown className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            ) : null,
          )}
          </div>
        )}
      </div>
    </aside>
  );
}
