import { useRef } from 'react'
import { ArtistScene } from './three/ArtistScene.jsx'
import cupsize from './data/artists/cupsize.json'
import cupsizeZppp from './data/tracks/cupsize/cupsize_zppp.json'

export default function App() {
  const audioRef = useRef(null)

  return (
    <div id="matplayer-root">
      <audio ref={audioRef} src={`/audio/${cupsizeZppp.audio_src}`} autoPlay loop crossOrigin="anonymous" />
      <ArtistScene artist={cupsize} track={cupsizeZppp} audioElementRef={audioRef} />
    </div>
  )
}
