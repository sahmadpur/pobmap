"use client";

import { useState } from "react";
import { MapPinned, Trash2, X } from "lucide-react";

import { CountryPicker } from "@/components/admin/map-editor/city-dialog";
import {
  DEFAULT_MARKER_ICON_BY_CATEGORY,
  FEATURED_MARKER_ICON_IDS,
  getMarkerIconSvg,
  isDefaultMarkerIconForCategory,
  MARKER_ICON_OPTIONS,
} from "@/data/marker-icons";
import { slugifyStopId } from "@/lib/route-editor-model";
import type { AdminMarker, MarkerCategory } from "@/types/admin";
import type { Coordinate } from "@/types/map";

export interface MarkerDraft {
  mode: "create" | "edit";
  marker?: AdminMarker;
  coordinate: Coordinate;
  detectedCountry?: string | null;
  suggestedName?: { en: string; ru: string } | null;
  /** Corridor open in the editor; a new marker is linked to it. */
  routeId: string | null;
}

const CATEGORIES: MarkerCategory[] = ["port", "station", "border", "city"];

const FEATURED_ICONS = FEATURED_MARKER_ICON_IDS.map((iconId) =>
  MARKER_ICON_OPTIONS.find((option) => option.id === iconId),
).filter((option): option is NonNullable<typeof option> => Boolean(option));

export function MarkerDialog({
  draft,
  saving,
  error,
  onSave,
  onDelete,
  onCancel,
  onCoordinateChange,
}: {
  draft: MarkerDraft;
  saving: boolean;
  error: string | null;
  onSave: (marker: AdminMarker) => void;
  onDelete?: () => void;
  onCancel: () => void;
  onCoordinateChange: (coordinate: Coordinate) => void;
}) {
  const isEdit = draft.mode === "edit";
  const existing = draft.marker;
  const [nameEn, setNameEn] = useState(existing?.name.en ?? draft.suggestedName?.en ?? "");
  const [nameAz, setNameAz] = useState(existing?.name.az ?? "");
  const [nameRu, setNameRu] = useState(existing?.name.ru ?? "");
  const [description, setDescription] = useState(existing?.description.en ?? "");
  const [manualId, setManualId] = useState<string | null>(existing?.id ?? null);
  const [category, setCategory] = useState<MarkerCategory>(existing?.category ?? "port");
  const [icon, setIcon] = useState(existing?.icon ?? DEFAULT_MARKER_ICON_BY_CATEGORY.port);
  const [countryCode, setCountryCode] = useState(
    existing?.countryCode ?? draft.detectedCountry ?? "",
  );
  const [showIcons, setShowIcons] = useState(false);
  const id = manualId ?? slugifyStopId(nameEn);
  const [lat, lng] = draft.coordinate;
  const suggestedRu =
    draft.suggestedName && nameEn.trim() === draft.suggestedName.en ? draft.suggestedName.ru : "";

  const canSave = nameEn.trim().length > 0 && id.trim().length > 0 && !saving;

  function submit() {
    if (!canSave) {
      return;
    }

    const name = {
      en: nameEn.trim(),
      az: nameAz.trim() || nameEn.trim(),
      ru: nameRu.trim() || suggestedRu || nameEn.trim(),
    };
    const descriptionText = description.trim();
    const connected = new Set(existing?.connectedCorridorIds ?? []);

    if (draft.routeId) {
      connected.add(draft.routeId);
    }

    onSave({
      ...existing,
      id: id.trim(),
      name,
      description: existing
        ? { ...existing.description, en: descriptionText }
        : { en: descriptionText, az: descriptionText, ru: descriptionText },
      category,
      icon,
      coordinates: [lat, lng],
      connectedCorridorIds: Array.from(connected),
      countryCode: countryCode || undefined,
    });
  }

  return (
    <div className="hc-panel absolute right-4 top-4 z-[1100] max-h-[calc(100%-2rem)] w-[360px] max-w-[calc(100%-2rem)] overflow-y-auto p-4 shadow-2xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="hc-eyebrow flex items-center gap-2">
            <MapPinned className="h-3.5 w-3.5" aria-hidden="true" />
            {isEdit ? "Edit marker" : "New marker"}
          </p>
          <p className="mt-1 text-xs text-[var(--hc-muted)]">
            Ports, terminals and hubs. Legs can start or end here. Drag the pin to fine-tune.
          </p>
        </div>
        <button type="button" onClick={onCancel} className="hc-btn hc-btn--xs" aria-label="Close">
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      <div className="mt-3 space-y-3">
        <label className="block">
          <span className="hc-label mb-1.5">Name · EN</span>
          <input
            autoFocus
            value={nameEn}
            onChange={(event) => setNameEn(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                submit();
              }
            }}
            placeholder="Marker name"
            className="hc-field"
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="hc-label mb-1.5">Name · AZ</span>
            <input
              value={nameAz}
              onChange={(event) => setNameAz(event.target.value)}
              placeholder={nameEn || "Same as EN"}
              className="hc-field"
            />
          </label>
          <label className="block">
            <span className="hc-label mb-1.5">Name · RU</span>
            <input
              value={nameRu}
              onChange={(event) => setNameRu(event.target.value)}
              placeholder={suggestedRu || nameEn || "Same as EN"}
              className="hc-field"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="hc-label mb-1.5">Marker ID</span>
            <input
              value={id}
              disabled={isEdit}
              onChange={(event) => setManualId(event.target.value)}
              placeholder="auto from name"
              className="hc-field hc-mono disabled:opacity-60"
            />
          </label>
          <label className="block">
            <span className="hc-label mb-1.5">Category</span>
            <select
              value={category}
              onChange={(event) => {
                const next = event.target.value as MarkerCategory;

                if (isDefaultMarkerIconForCategory(icon, category)) {
                  setIcon(DEFAULT_MARKER_ICON_BY_CATEGORY[next]);
                }

                setCategory(next);
              }}
              className="hc-field"
            >
              {CATEGORIES.map((option) => (
                <option key={option} value={option}>
                  {option[0].toUpperCase() + option.slice(1)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <span className="hc-label">Icon</span>
            <button
              type="button"
              onClick={() => setShowIcons((current) => !current)}
              className="hc-btn hc-btn--xs"
            >
              <span
                className="grid h-4 w-4 place-items-center [&_svg]:h-3.5 [&_svg]:w-3.5"
                dangerouslySetInnerHTML={{ __html: getMarkerIconSvg(icon, category) }}
              />
              {showIcons ? "Done" : "Change"}
            </button>
          </div>
          {showIcons ? (
            <div className="mt-2 grid grid-cols-8 gap-1">
              {FEATURED_ICONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  title={option.label}
                  onClick={() => setIcon(option.id)}
                  className={`grid h-8 w-8 place-items-center rounded-lg border [&_svg]:h-4 [&_svg]:w-4 ${
                    option.id === icon
                      ? "border-[rgba(246,181,61,0.6)] bg-[rgba(246,181,61,0.16)] text-[var(--hc-accent-ink)]"
                      : "border-[var(--hc-line)] text-[var(--hc-muted)] hover:border-[var(--hc-line-strong)]"
                  }`}
                  dangerouslySetInnerHTML={{ __html: option.svg }}
                />
              ))}
            </div>
          ) : null}
        </div>

        <label className="block">
          <span className="hc-label mb-1.5">Description · EN</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={2}
            placeholder="Shown in the marker popup. Translate in the console."
            className="hc-field !min-h-0"
          />
        </label>

        <div>
          <span className="hc-label mb-1.5">Country</span>
          <CountryPicker value={countryCode} onChange={setCountryCode} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="hc-label mb-1.5">Latitude</span>
            <input
              type="number"
              step="0.0001"
              value={lat}
              onChange={(event) => onCoordinateChange([Number(event.target.value), lng])}
              className="hc-field hc-mono"
            />
          </label>
          <label className="block">
            <span className="hc-label mb-1.5">Longitude</span>
            <input
              type="number"
              step="0.0001"
              value={lng}
              onChange={(event) => onCoordinateChange([lat, Number(event.target.value)])}
              className="hc-field hc-mono"
            />
          </label>
        </div>

        {error ? <p className="hc-mono text-xs text-[var(--hc-rose)]">⚠ {error}</p> : null}

        <div className="flex items-center justify-between gap-2 pt-1">
          {isEdit && onDelete ? (
            <button type="button" onClick={onDelete} className="hc-btn hc-btn--xs hc-btn--danger">
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              Delete
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button type="button" onClick={onCancel} className="hc-btn hc-btn--xs">
              Cancel
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={!canSave}
              className="hc-btn hc-btn--xs hc-btn--primary"
            >
              {saving ? "Saving…" : isEdit ? "Save marker" : "Add marker"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
