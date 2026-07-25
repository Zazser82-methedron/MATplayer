import { z } from 'zod'

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'must be a #rrggbb hex color')

export const ColorPaletteSchema = z.object({
  background: hexColor,
  primary: hexColor,
  secondary: hexColor,
})

export const ShaderPresetsSchema = z.object({
  noise_type: z.enum(['simplex_curly', 'laminar', 'turbulent_glitch']),
  outline_thickness: z.number().min(0).max(1),
  bloom_intensity: z.number().min(0).max(3),
})

export const TrackProfileSchema = z.object({
  track_id: z.string().min(1),
  title: z.string().min(1).optional(),
  tempo_bpm: z.number().positive(),
  energy: z.number().min(0).max(1),
  mood: z.string().min(1),
  color_palette: ColorPaletteSchema,
  shader_presets: ShaderPresetsSchema,
  lyrics_ref: z.string().min(1),
  audio_src: z.string().min(1),
})

export function parseTrackProfile(json) {
  return TrackProfileSchema.parse(json)
}
