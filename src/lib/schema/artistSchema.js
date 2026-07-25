import { z } from 'zod'

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'must be a #rrggbb hex color')

export const AtlasPositionSchema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
})

export const ArtistProfileSchema = z.object({
  artist_id: z.string().min(1),
  name: z.string().min(1),
  bio: z.string().optional(),
  default_palette: z.object({
    background: hexColor,
    primary: hexColor,
  }),
  atlas_position: AtlasPositionSchema,
  track_ids: z.array(z.string()).min(1),
})

export function parseArtistProfile(json) {
  return ArtistProfileSchema.parse(json)
}
