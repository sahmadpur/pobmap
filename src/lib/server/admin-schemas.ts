import { z } from "zod";

const localizedTextSchema = z.object({
  az: z.string(),
  en: z.string(),
  ru: z.string(),
});

const coordinateSchema = z.tuple([z.number(), z.number()]);

export const corridorSegmentSchema = z.object({
  id: z.string().min(1),
  mode: z.enum(["rail", "ship", "road"]),
  from: localizedTextSchema,
  to: localizedTextSchema,
  distanceKm: z.coerce.number().int().nonnegative(),
  coordinates: z.array(coordinateSchema),
  displayCoordinates: z.array(coordinateSchema).optional(),
  stopIds: z.array(z.string().min(1)).optional(),
  lineStyle: z.enum(["solid", "dotted"]).optional(),
});

export const corridorRouteSchema = z.object({
  id: z.string().min(1),
  name: localizedTextSchema,
  routeColor: z.string().min(4),
  type: z.enum(["primary", "secondary"]),
  totalDistanceKm: z.coerce.number().int().nonnegative(),
  transitTime: localizedTextSchema,
  countries: z.array(z.string().min(2)),
  description: localizedTextSchema,
  status: z.enum(["active", "planned", "suspended"]),
  animationSpeed: z.coerce.number().positive(),
  segments: z.array(corridorSegmentSchema),
});

export const adminMarkerSchema = z.object({
  id: z.string().min(1),
  name: localizedTextSchema,
  description: localizedTextSchema,
  category: z.enum(["port", "station", "border", "city"]),
  icon: z.string().min(1),
  coordinates: coordinateSchema,
  connectedCorridorIds: z.array(z.string()),
  countryCode: z.string().length(2).optional(),
  corridorTiers: z.record(z.string(), z.enum(["major", "standard"])).optional(),
});

export const adminStopSchema = z.object({
  id: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, digits and single dashes."),
  name: localizedTextSchema,
  countryCode: z.string().length(2),
  coordinates: coordinateSchema,
  editorVisible: z.boolean().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
