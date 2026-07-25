import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { pushHistoryEntry, toggleFavorite } from '../lib/player/history.js'

export const usePlayerStore = create(
  persist(
    (set) => ({
      currentArtistId: null,
      currentTrackId: null,
      currentTime: 0,
      isPlaying: false,
      uxMode: 'focus', // 'focus' | 'ambient' | 'utility'
      audioBands: { bass: 0, mid: 0, treble: 0, level: 0 },
      particleVisibleCount: 2000,
      degradationLevel: 0,
      repeatMode: 'off', // 'off' | 'all' | 'one'
      isShuffled: false,
      shuffledOrder: [],
      favorites: [],
      history: [],

      setArtist: (artistId) => set({ currentArtistId: artistId }),
      setTrack: (trackId) => set({ currentTrackId: trackId }),
      setTime: (time) => set({ currentTime: time }),
      setPlaying: (playing) => set({ isPlaying: playing }),
      setUxMode: (mode) => set({ uxMode: mode }),
      setAudioBands: (bands) => set({ audioBands: bands }),
      setParticleVisibleCount: (count) => set({ particleVisibleCount: count }),
      setDegradationLevel: (levelIndex) => set({ degradationLevel: levelIndex }),
      setRepeatMode: (mode) => set({ repeatMode: mode }),
      setShuffle: (isShuffled, shuffledOrder) => set({ isShuffled, shuffledOrder }),
      toggleFavorite: (trackId) => set((state) => ({ favorites: toggleFavorite(state.favorites, trackId) })),
      recordPlay: (trackId) => set((state) => ({ history: pushHistoryEntry(state.history, trackId) })),
    }),
    {
      name: 'matplayer-user-state',
      storage: createJSONStorage(() => localStorage),
      // Сохраняем только пользовательские предпочтения. Всё, что меняется
      // каждый кадр (audioBands, currentTime) или зависит от железа
      // (degradationLevel), в localStorage писать нельзя — это убило бы
      // производительность и восстанавливало бы неверное состояние.
      partialize: (state) => ({
        favorites: state.favorites,
        history: state.history,
        repeatMode: state.repeatMode,
      }),
    },
  ),
)
