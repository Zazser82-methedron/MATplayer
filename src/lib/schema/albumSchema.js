import { z } from 'zod'

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'must be a #rrggbb hex color')

// Альбом — прослойка между артистом и треком. Каждый трек принадлежит ровно
// одному альбому; у артистов без полноценного релиза это альбом-сборник
// («Синглы»), чтобы модель оставалась однородной и в UI не появлялось двух
// разных путей «трек с альбомом» и «трек без альбома».
export const AlbumProfileSchema = z.object({
  album_id: z.string().min(1),
  artist_id: z.string().min(1),
  title: z.string().min(1),
  year: z.number().int().min(1900).max(2200).optional(),
  kind: z.enum(['album', 'ep', 'singles']).default('album'),
  cover_palette: z
    .object({
      background: hexColor,
      primary: hexColor,
    })
    .optional(),
  track_ids: z.array(z.string()).min(1),
})

export function parseAlbumProfile(json) {
  return AlbumProfileSchema.parse(json)
}
