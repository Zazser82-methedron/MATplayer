import { create } from 'zustand'

export const usePlayerStore = create((set) => ({
  currentArtistId: null,
  currentTrackId: null,
  currentTime: 0,
  isPlaying: false,
  uxMode: 'focus', // 'focus' | 'ambient' | 'utility'
  audioBands: { bass: 0, mid: 0, treble: 0, level: 0 },
  particleVisibleCount: 2000,
  degradationLevel: 0,

  setArtist: (artistId) => set({ currentArtistId: artistId }),
  setTrack: (trackId) => set({ currentTrackId: trackId }),
  setTime: (time) => set({ currentTime: time }),
  setPlaying: (playing) => set({ isPlaying: playing }),
  setUxMode: (mode) => set({ uxMode: mode }),
  setAudioBands: (bands) => set({ audioBands: bands }),
  setParticleVisibleCount: (count) => set({ particleVisibleCount: count }),
  setDegradationLevel: (levelIndex) => set({ degradationLevel: levelIndex }),
}))
