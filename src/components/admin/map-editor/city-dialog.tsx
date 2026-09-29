"use client";

import { useState } from "react";
import { MapPin, Trash2, X } from "lucide-react";

import { COUNTRY_NAMES, getCountryFlagEmoji } from "@/data/corridors";
import type { TransportStop } from "@/data/transport-stops";
import { slugifyStopId } from "@/lib/route-editor-model";
import type { AdminStop } from "@/types/admin";
import type { Coordinate } from "@/types/map";

const COUNTRY_OPTIONS = Object.entries(COUNTRY_NAMES)
  .map(([code, name]) => ({ code, name: name.en }))
  .sort((first, second) => first.name.localeCompare(second.name));

/** Chip with the chosen country, or a search box until one is picked. */
export function CountryPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (code: string) => void;
}) {
  const [query, setQuery] = useState("");
  const results = query.trim()
    ? COUNTRY_OPTIONS.filter((country) =>
        `${country.code} ${country.name}`.toLowerCase().includes(query.trim().toLowerCase()),
      ).slice(0, 8)
    : [];

  if (value) {
    return (
      <button type="button" onClick={() => onChange("")} className="hc-chip" title="Change country">
        <span aria-hidden="true">{getCountryFlagEmoji(value)}</span>
        <span>{COUNTRY_NAMES[value]?.en ?? value}</span>
        <span className="text-[var(--hc-faint)]">×</span>
      </button>
    );
  }

  return (
    <>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search country"
        className="hc-field"
      />
      {results.length ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {results.map((country) => (
            <button
              key={country.code}
              type="button"
              onClick={() => {
                onChange(country.code);
                setQuery("");
              }}
              className="hc-chip"
            >
              <span aria-hidden="true">{getCountryFlagEmoji(country.code)}</span>
              {country.name}
            </button>
          ))}
        </div>
      ) : null}
    </>
  );
}

export interface CityDraft {
  mode: "create" | "edit";
  /** The stop being edited; absent when creating. */
  stop?: TransportStop;
  coordinate: Coordinate;
  /** Country detected from the click position, when known. */
  detectedCountry?: string | null;
  /** Nearby Natural Earth city, offered as the default name. */
  suggestedName?: { en: string; ru: string } | null;
}

export function CityDialog({
  draft,
  saving,
  error,
  onSave,
  onDelete,
  onCancel,
  onCoordinateChange,
}: {
  draft: CityDraft;
  saving: boolean;
  error: string | null;
  onSave: (stop: AdminStop) => void;
  onDelete?: () => void;
  onCancel: () => void;
  onCoordinateChange: (coordinate: Coordinate) => void;
}) {
  const isEdit = draft.mode === "edit";
  const [nameEn, setNameEn] = useState(draft.stop?.name.en ?? draft.suggestedName?.en ?? "");
  const [nameAz, setNameAz] = useState(draft.stop?.name.az ?? "");
  const [nameRu, setNameRu] = useState(draft.stop?.name.ru ?? "");
  // The suggested Russian name only holds while the English one is the
  // suggested city; a renamed place must not keep another city's name.
  const suggestedRu =
    draft.suggestedName && nameEn.trim() === draft.suggestedName.en ? draft.suggestedName.ru : "";
  const effectiveRu = nameRu.trim() || suggestedRu || nameEn.trim();
  // The id follows the English name until the admin edits it by hand.
  const [manualId, setManualId] = useState<string | null>(draft.stop?.id ?? null);
  const id = manualId ?? slugifyStopId(nameEn);
  const [countryCode, setCountryCode] = useState(
    draft.stop?.countryCode ?? draft.detectedCountry ?? "",
  );

  // The pin can be dragged while the form is open; keep the fields in step.
  const [lat, lng] = draft.coordinate;

  const canSave =
    nameEn.trim().length > 0 && id.trim().length > 0 && countryCode.length === 2 && !saving;

  function submit() {
    if (!canSave) {
      return;
    }

    onSave({
      id: id.trim(),
      name: {
        en: nameEn.trim(),
        az: nameAz.trim() || nameEn.trim(),
        ru: effectiveRu,
      },
      countryCode,
      coordinates: [lat, lng],
      editorVisible: draft.stop?.editorVisible ?? true,
    });
  }

  return (
    <div className="hc-panel absolute right-4 top-4 z-[1100] w-[340px] max-w-[calc(100%-2rem)] p-4 shadow-2xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="hc-eyebrow flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            {isEdit ? "Edit city" : "New city"}
          </p>
          <p className="mt-1 text-xs text-[var(--hc-muted)]">
            Drag the pin on the map to fine-tune the position.
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
            placeholder="City name"
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

        <label className="block">
          <span className="hc-label mb-1.5">City ID</span>
          <input
            value={id}
            disabled={isEdit}
            onChange={(event) => setManualId(event.target.value)}
            placeholder="auto from name"
            className="hc-field hc-mono disabled:opacity-60"
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
              {saving ? "Saving…" : isEdit ? "Save city" : "Add city"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
