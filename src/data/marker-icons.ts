import { icon, type IconDefinition, type IconPrefix } from "@fortawesome/fontawesome-svg-core";
import * as brandIcons from "@fortawesome/free-brands-svg-icons";
import * as regularIcons from "@fortawesome/free-regular-svg-icons";
import * as solidIcons from "@fortawesome/free-solid-svg-icons";

import type { MarkerCategory } from "@/types/admin";

export interface MarkerIconOption {
  id: string;
  label: string;
  style: string;
  svg: string;
  exportName: string;
  searchText: string;
}

const STYLE_LABEL_BY_PREFIX: Partial<Record<IconPrefix, string>> = {
  fab: "Brands",
  fad: "Duotone",
  fal: "Light",
  far: "Regular",
  fas: "Solid",
  fat: "Thin",
  fass: "Sharp Solid",
  fasds: "Sharp Duotone Solid",
  fasdr: "Sharp Duotone Regular",
  fasdl: "Sharp Duotone Light",
  fasdt: "Sharp Duotone Thin",
  fast: "Sharp Thin",
  fasl: "Sharp Light",
  fasr: "Sharp Regular",
};

const LEGACY_MARKER_ICON_ALIASES: Record<string, string> = {
  anchor: "fas:anchor",
  ship: "fas:ship",
  train: "fas:train",
  warehouse: "fas:warehouse",
  shield: "fas:shield-halved",
  city: "fas:city",
  pin: "fas:location-dot",
};

export const DEFAULT_MARKER_ICON_BY_CATEGORY: Record<MarkerCategory, string> = {
  port: "fas:anchor",
  station: "fas:train",
  border: "fas:shield-halved",
  city: "fas:city",
};

function isIconDefinition(value: unknown): value is IconDefinition {
  return (
    typeof value === "object" &&
    value !== null &&
    "prefix" in value &&
    "iconName" in value &&
    "icon" in value &&
    Array.isArray((value as { icon?: unknown }).icon)
  );
}

function humanizeIconName(iconName: string) {
  return iconName
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeMarkerIconId(iconId: string | null | undefined) {
  if (!iconId) {
    return null;
  }

  return LEGACY_MARKER_ICON_ALIASES[iconId] ?? iconId;
}

function sanitizeMarkerIconSvg(svg: string) {
  return svg
    .replace(/class="[^"]*"/g, 'class="fa-marker-icon-svg"')
    .replace(/role="img"/g, 'role="img" focusable="false"');
}

function createIconOptions(iconSet: Record<string, unknown>) {
  const definitions: Array<[string, IconDefinition]> = [];

  Object.entries(iconSet).forEach(([exportName, value]) => {
    if (/^fa[A-Z0-9]/.test(exportName) && isIconDefinition(value)) {
      definitions.push([exportName, value]);
    }
  });

  return definitions.map(([exportName, definition]) => {
      const id = `${definition.prefix}:${definition.iconName}`;
      const style = STYLE_LABEL_BY_PREFIX[definition.prefix] ?? definition.prefix;
      const label = humanizeIconName(definition.iconName);

      return {
        id,
        label,
        style,
        svg: sanitizeMarkerIconSvg(icon(definition).html.join("")),
        exportName,
        searchText: `${id} ${label} ${style} ${definition.iconName} ${exportName}`.toLocaleLowerCase(),
      } satisfies MarkerIconOption;
    });
}

const allIconOptions = [
  ...createIconOptions(solidIcons),
  ...createIconOptions(regularIcons),
  ...createIconOptions(brandIcons),
];

const dedupedIconOptions = new Map<string, MarkerIconOption>();

for (const option of allIconOptions) {
  if (!dedupedIconOptions.has(option.id)) {
    dedupedIconOptions.set(option.id, option);
  }
}

export const MARKER_ICON_OPTIONS: MarkerIconOption[] = Array.from(
  dedupedIconOptions.values(),
).sort((first, second) => {
  if (first.style !== second.style) {
    return first.style.localeCompare(second.style);
  }

  return first.label.localeCompare(second.label);
});

export const FEATURED_MARKER_ICON_IDS = [
  "fas:anchor",
  "fas:ship",
  "fas:train",
  "fas:warehouse",
  "fas:shield-halved",
  "fas:city",
  "fas:location-dot",
  "fas:truck",
  "fas:industry",
  "fas:bridge",
  "fas:flag",
  "fas:road",
];

export function getMarkerIconOption(iconId: string | null | undefined) {
  const normalizedIconId = normalizeMarkerIconId(iconId);

  return MARKER_ICON_OPTIONS.find((option) => option.id === normalizedIconId) ?? null;
}

export function getMarkerIconSvg(iconId: string | null | undefined, category: MarkerCategory) {
  return (
    getMarkerIconOption(iconId)?.svg ??
    getMarkerIconOption(DEFAULT_MARKER_ICON_BY_CATEGORY[category])?.svg ??
    MARKER_ICON_OPTIONS[0].svg
  );
}

export function isDefaultMarkerIconForCategory(
  iconId: string | null | undefined,
  category: MarkerCategory,
) {
  const normalizedIconId = normalizeMarkerIconId(iconId);

  return (
    normalizedIconId === DEFAULT_MARKER_ICON_BY_CATEGORY[category] ||
    normalizedIconId === null
  );
}
