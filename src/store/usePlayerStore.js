import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { pushHistoryEntry, toggleFavorite } from '../lib/player/history.js'

// zustand вызывает setItem на КАЖДЫЙ set() — partialize определяет только,
// ЧТО попадёт в хранилище, но не ЗАПИСЫВАТЬ ли вообще; никакого сравнения
// внутри middleware нет. В сторе живут audioBands и currentTime, которые
// обновляются дважды за кадр, поэтому без этой обёртки выходит ~120
// синхронных записей в localStorage в секунду, все с одинаковым содержимым.
// Синхронная запись блокирует главный поток и роняет FPS рендера.
export function createDedupedStorage(backing = localStorage) {
  let lastWritten = null
  return {
    getItem: (name) => {
      const raw = backing.getItem(name)
      return raw === null ? null : JSON.parse(raw)
    },
    setItem: (name, value) => {
      const serialized = JSON.stringify(value)
      if (serialized === lastWritten) return
      lastWritten = serialized
      backing.setItem(name, serialized)
    },
    removeItem: (name) => {
      lastWritten = null
      backing.removeItem(name)
    },
  }
}

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
      storage: createDedupedStorage(),
      // Сохраняем только пользовательские предпочтения. Всё, что меняется
      // каждый кадр (audioBands, currentTime) или зависит от железа
      // (degradationLevel), сюда попадать не должно. Само по себе это не
      // спасает от записи на каждый кадр — за это отвечает дедупликация
      // в createDedupedStorage выше.
      partialize: (state) => ({
        favorites: state.favorites,
        history: state.history,
        repeatMode: state.repeatMode,
      }),
    },
  ),
)
