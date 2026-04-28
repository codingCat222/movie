import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { movieService } from '../services/movieService.js'
import './VideoPlayer.css'

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2]

function formatTime(secs) {
  if (!secs || isNaN(secs)) return '0:00'
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = Math.floor(secs % 60)
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
  return `${m}:${String(s).padStart(2,'0')}`
}

export default function VideoPlayer({ movieId, videoUrl, savedProgress = 0, qualityOptions = ['480p'], isPremium, onTimeUpdate }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const videoRef = useRef(null)
  const controlsTimer = useRef(null)
  const saveTimer = useRef(null)
  const wrapRef = useRef(null)

  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [buffered, setBuffered] = useState(0)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [quality, setQuality] = useState(qualityOptions[qualityOptions.length - 1] || '480p')
  const [showQuality, setShowQuality] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [controlsVisible, setControlsVisible] = useState(true)
  const [showBigPlay, setShowBigPlay] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Resume from saved progress
  useEffect(() => {
    const video = videoRef.current
    if (!video || !videoUrl) return
    const handleLoaded = () => {
      if (savedProgress > 0) {
        video.currentTime = savedProgress
      }
      setLoading(false)
    }
    video.addEventListener('loadedmetadata', handleLoaded)
    return () => video.removeEventListener('loadedmetadata', handleLoaded)
  }, [videoUrl, savedProgress])

  const showControls = useCallback(() => {
    setControlsVisible(true)
    clearTimeout(controlsTimer.current)
    if (playing) {
      controlsTimer.current = setTimeout(() => setControlsVisible(false), 3000)
    }
  }, [playing])

  useEffect(() => {
    return () => { clearTimeout(controlsTimer.current); clearTimeout(saveTimer.current) }
  }, [])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    if (playing) {
      video.pause()
      setPlaying(false)
      setShowBigPlay(true)
      setControlsVisible(true)
    } else {
      video.play().then(() => {
        setPlaying(true)
        setShowBigPlay(false)
        showControls()
      }).catch(e => setError(e.message))
    }
  }

  const handleTimeUpdate = () => {
    const video = videoRef.current
    if (!video) return
    setCurrentTime(video.currentTime)

    // Save progress every 10s
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      if (movieId && video.currentTime > 5) {
        movieService.saveProgress(movieId, video.currentTime).catch(() => {})
        onTimeUpdate?.(video.currentTime)
      }
    }, 2000)

    // Buffered
    if (video.buffered.length > 0) {
      setBuffered(video.buffered.end(video.buffered.length - 1))
    }
  }

  const handleSeek = (e) => {
    const bar = e.currentTarget
    const rect = bar.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    const newTime = pct * duration
    if (videoRef.current) videoRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleVolume = (e) => {
    const val = parseFloat(e.target.value)
    setVolume(val)
    if (videoRef.current) videoRef.current.volume = val
    setMuted(val === 0)
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !muted
      setMuted(!muted)
    }
  }

  const cycleSpeed = () => {
    const idx = SPEEDS.indexOf(speed)
    const next = SPEEDS[(idx + 1) % SPEEDS.length]
    setSpeed(next)
    if (videoRef.current) videoRef.current.playbackRate = next
  }

  const changeQuality = (q) => {
    // In real app: swap video source and restore currentTime
    setQuality(q)
    setShowQuality(false)
  }

  const toggleFullscreen = () => {
    const el = wrapRef.current
    if (!fullscreen) {
      el.requestFullscreen?.() || el.webkitRequestFullscreen?.()
    } else {
      document.exitFullscreen?.() || document.webkitExitFullscreen?.()
    }
    setFullscreen(!fullscreen)
  }

  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  const seekPercent = duration > 0 ? (currentTime / duration) * 100 : 0
  const bufferPercent = duration > 0 ? (buffered / duration) * 100 : 0

  const volumeIcon = muted || volume === 0
    ? 'fa-volume-mute'
    : volume < 0.5 ? 'fa-volume-down' : 'fa-volume-up'

  if (!videoUrl && !isPremium) {
    return (
      <div className="video-player-wrap" ref={wrapRef}>
        <div className="video-screen">
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#08031a,#030310)' }}></div>
          <div className="video-upgrade-overlay">
            <div className="video-upgrade-icon"><i className="fas fa-crown"></i></div>
            <h3>Premium Content</h3>
            <p>Upgrade to Standard plan to watch this movie in full HD.</p>
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/pricing')}>
              <i className="fas fa-crown"></i> Upgrade for ₦1,000/month
            </button>
            <span style={{ fontSize: 12, color: 'var(--txt3)' }}>Cancel anytime · Instant access</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`video-player-wrap ${fullscreen ? 'fullscreen-active' : ''}`}
      ref={wrapRef}
      onMouseMove={showControls}
      onMouseLeave={() => playing && setControlsVisible(false)}
    >
      <div className="video-screen" onClick={togglePlay}>
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={e => setDuration(e.target.duration)}
            onWaiting={() => setLoading(true)}
            onCanPlay={() => setLoading(false)}
            onEnded={() => { setPlaying(false); setShowBigPlay(true); setControlsVisible(true) }}
            onError={() => setError('Failed to load video. Please try again.')}
          />
        ) : (
          <div style={{ width:'100%', height:'100%', background:'#000', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ color:'var(--txt3)', fontSize:14 }}>No video source available</span>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="video-loading">
            <div className="loading-spinner"></div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="video-error-overlay">
            <i className="fas fa-exclamation-circle" style={{ fontSize: 32 }}></i>
            <p>{error}</p>
            <button className="btn btn-ghost btn-sm" onClick={() => setError('')}>Dismiss</button>
          </div>
        )}

        {/* Big play overlay */}
        <div className={`video-big-play ${showBigPlay ? 'visible' : ''}`}>
          <div className="video-big-play-btn">
            <i className="fas fa-play"></i>
          </div>
        </div>

        {/* Controls */}
        <div className={`video-controls ${controlsVisible ? '' : 'hidden'}`}
          onClick={e => e.stopPropagation()}>
          {/* Seek bar */}
          <div className="video-seek-area">
            <div className="video-seek-bar" onClick={handleSeek}>
              <div className="video-seek-buffer" style={{ width: `${bufferPercent}%` }}></div>
              <div className="video-seek-fill" style={{ width: `${seekPercent}%` }}></div>
            </div>
          </div>

          {/* Control row */}
          <div className="video-controls-row">
            <div className="video-controls-left">
              <button className="video-ctrl-btn play-pause" onClick={togglePlay}>
                <i className={`fas ${playing ? 'fa-pause' : 'fa-play'}`}></i>
              </button>

              <button className="video-ctrl-btn" onClick={() => { if(videoRef.current) videoRef.current.currentTime -= 10 }}>
                <i className="fas fa-rotate-left"></i>
              </button>
              <button className="video-ctrl-btn" onClick={() => { if(videoRef.current) videoRef.current.currentTime += 10 }}>
                <i className="fas fa-rotate-right"></i>
              </button>

              <div className="video-volume-wrap">
                <button className="video-ctrl-btn" onClick={toggleMute}>
                  <i className={`fas ${volumeIcon}`}></i>
                </button>
                <input
                  type="range" min="0" max="1" step="0.05"
                  value={muted ? 0 : volume}
                  onChange={handleVolume}
                  className="video-volume-slider"
                />
              </div>

              <span className="video-time">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="video-controls-right">
              <button className="video-speed-btn" onClick={cycleSpeed}>{speed}x</button>

              {qualityOptions.length > 1 && (
                <div className="video-quality-wrap">
                  <button className="video-quality-btn" onClick={() => setShowQuality(!showQuality)}>
                    {quality} <i className="fas fa-chevron-up" style={{ fontSize: 9, marginLeft: 3 }}></i>
                  </button>
                  {showQuality && (
                    <div className="video-quality-dropdown">
                      {[...qualityOptions].reverse().map(q => (
                        <div key={q}
                          className={`video-quality-option ${quality === q ? 'active' : ''}`}
                          onClick={() => changeQuality(q)}>
                          {q}
                          {quality === q && <i className="fas fa-check" style={{ fontSize: 10 }}></i>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button className="video-ctrl-btn" onClick={toggleFullscreen}>
                <i className={`fas ${fullscreen ? 'fa-compress' : 'fa-expand'}`}></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}