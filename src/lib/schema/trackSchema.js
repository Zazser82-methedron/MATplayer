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

export const StructureSegmentSchema = z
  .object({
    start: z.number().min(0),
    end: z.number().min(0),
    label: z.string().min(1),
  })
  .refine((segment) => segment.end >= segment.start, {
    message: 'segment end must not precede its start',
  })

// Опциональный блок предвычисленного анализа. Заполняется будущим бэкендом
// или пайплайном загрузки; при его отсутствии движок работает на обычном FFT
// общего микса, как сейчас. Смысл stem_urls — развести источники по разным
// визуальным элементам (вокал на мимику, барабаны на деформацию частиц).
export const AudioAnalysisSchema = z.object({
  // Предвычисляется при сборке (scripts/import-cupsize-tracks.mjs). Пока
  // этих полей нет, клиент вынужден скачивать трек ВТОРОЙ раз целиком и
  // декодировать его только ради формы волны — именно так делать не надо,
  // и ни один крупный сервис так не делает.
  waveform_peaks: z.array(z.number().min(0).max(1)).optional(),
  bpm: z.number().positive().nullable().optional(),
  beat_offset: z.number().min(0).optional(),
  duration: z.number().positive().optional(),

  structure_segments: z.array(StructureSegmentSchema).optional(),
  stem_urls: z.record(z.string(), z.string().min(1)).optional(),
  spectral_centroid_peaks: z.array(z.number()).optional(),
})

export const AiAdaptationSchema = z.object({
  facial_blendshape_weights: z.array(z.number()).optional(),
  generative_prompt_seed: z.number().int().nonnegative().optional(),
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
  audio_analysis: AudioAnalysisSchema.optional(),
  ai_adaptation: AiAdaptationSchema.optional(),
})

export function parseTrackProfile(json) {
  return TrackProfileSchema.parse(json)
}
