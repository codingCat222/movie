import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { movieService, userService } from '../services/movieService.js'
import { paymentService } from '../services/paymentService.js'
import VideoPlayer from '../components/VideoPlayer.jsx'
import MovieCard from '../components/MovieCard.jsx'
import { formatDuration, formatDate } from '../utils/helpers.js'
import './MovieDetails.css'

export default function MovieDetails() {
  const { id } = useParams()
  const { user, isPremium } = useAuth()
  const navigate = useNavigate()
  const [movie, setMovie] = useState(null)
  const [loading, setLoading] = useState(true)
  const [videoUrl, setVideoUrl] = useState('')
  const [videoLoading, setVideoLoading] = useState(false)
  const [videoError, setVideoError] = useState('')
  const [quality, setQuality] = useState('480p')
  const [inWatchlist, setInWatchlist] = useState(false)
  const [liked, setLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [userRating, setUserRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [savedProgress, setSavedProgress] = useState(0)
  const [relatedMovies, setRelatedMovies] = useState([])
  const [downloadLoading, setDownloadLoading] = useState(false)
  const [toast, setToast] = useState(null)

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await movieService.getMovie(id)
        const m = res.data.movie
        setMovie(m)
        setLikesCount(m.likes?.length || 0)
        if (user) {
          setLiked(m.likes?.includes(user._id))
          const history = user.watchHistory?.find(h => h.movie === id || h.movie?._id === id)
          if (history) setSavedProgress(history.progress || 0)
        }
        // Related movies
        if (m.genre?.length) {
          movieService.getMovies({ genre: m.genre[0], limit: 6 })
            .then(r => setRelatedMovies((r.data.movies || []).filter(rm => rm._id !== id)))
            .catch(() => {})
        }
      } catch {
        navigate('/home')
      } finally {
        setLoading(false)
      }
    }
    load()
    window.scrollTo(0, 0)
  }, [id])

  const handleWatch = async () => {
    if (!user) { navigate('/login'); return }
    setVideoLoading(true)
    setVideoError('')
    try {
      const q = isPremium() ? quality : '480p'
      const res = await movieService.getVideoUrl(id, q)
      setVideoUrl(res.data.videoUrl)
      setQuality(res.data.quality)
    } catch (err) {
      if (err.response?.data?.upgradeRequired) {
        setVideoError('upgrade')
      } else {
        setVideoError(err.response?.data?.message || 'Failed to load video')
      }
    } finally {
      setVideoLoading(false)
    }
  }

  const handleWatchlist = async () => {
    if (!user) { navigate('/login'); return }
    try {
      const res = await userService.toggleWatchlist(id)
      setInWatchlist(res.data.inWatchlist)
      showToast(res.data.inWatchlist ? 'Added to watchlist' : 'Removed from watchlist', 'success')
    } catch { showToast('Failed to update watchlist', 'error') }
  }

  const handleLike = async () => {
    if (!user) { navigate('/login'); return }
    try {
      const res = await movieService.toggleLike(id)
      setLiked(res.data.liked)
      setLikesCount(res.data.likesCount)
    } catch { showToast('Failed to update like', 'error') }
  }

  const handleRate = async (score) => {
    if (!user) { navigate('/login'); return }
    try {
      await movieService.rateMovie(id, score)
      setUserRating(score)
      showToast(`Rated ${score} star${score > 1 ? 's' : ''}`, 'success')
    } catch { showToast('Failed to rate movie', 'error') }
  }

  const handleDownload = async () => {
    if (!user) { navigate('/login'); return }
    if (!isPremium()) { navigate('/pricing'); return }
    setDownloadLoading(true)
    try {
      const res = await paymentService.requestDownload(id, quality)
      const url = paymentService.getDownloadUrl(res.data.token)
      window.open(url, '_blank')
      showToast(`Download started (${res.data.downloadsRemaining} remaining this month)`, 'success')
    } catch (err) {
      showToast(err.response?.data?.message || 'Download failed', 'error')
    } finally {
      setDownloadLoading(false) }
  }

  const qualityOptions = isPremium() ? ['480p', '720p', '1080p'] : ['480p']

  if (loading) {
    return (
      <div className="movie-details page-wrapper">
        <div className="movie-backdrop-section">
          <div style={{ width:'100%', height:'100%', background:'var(--bg1)' }}></div>
        </div>
        <div className="movie-info-section">
          <div className="movie-info-top">
            <div className="movie-poster-side">
              <div className="skeleton" style={{ width:'100%', aspectRatio:'2/3', borderRadius:'var(--radius)' }}></div>
            </div>
            <div className="movie-meta-side" style={{ flex:1 }}>
              <div className="skeleton" style={{ width:'70%', height:48, marginBottom:16 }}></div>
              <div className="skeleton" style={{ width:'40%', height:20, marginBottom:12 }}></div>
              <div className="skeleton" style={{ width:'100%', height:80, marginBottom:20 }}></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!movie) return null

  return (
    <div className="movie-details page-wrapper">
      {/* Toast */}
      {toast && <div className={`toast toast-${toast.type}`}><i className={`fas fa-${toast.type === 'success' ? 'check-circle' : toast.type === 'error' ? 'exclamation-circle' : 'info-circle'}`}></i>{toast.msg}</div>}

      {/* Backdrop */}
      <div className="movie-backdrop-section">
        {movie.backdropImage
          ? <img src={movie.backdropImage} alt="" className="movie-backdrop-img" />
          : movie.posterImage
            ? <img src={movie.posterImage} alt="" className="movie-backdrop-img" />
            : <div style={{ width:'100%', height:'100%', background:'linear-gradient(135deg,var(--bg2),var(--bg3))' }}></div>
        }
        <div className="movie-backdrop-grad"></div>
      </div>

      {/* Info */}
      <div className="movie-info-section">
        <div className="movie-info-top">
          <div className="movie-poster-side">
            {movie.posterImage
              ? <img src={movie.posterImage} alt={movie.title} />
              : <div className="movie-poster-placeholder"><i className="fas fa-film"></i></div>
            }
          </div>

          <div className="movie-meta-side">
            <h1 className="movie-title-main">{movie.title}</h1>

            <div className="movie-meta-row">
              <div className="movie-rating-big">
                <i className="fas fa-star"></i>
                {parseFloat(movie.rating || 0).toFixed(1)}
                <span style={{ fontSize:12, fontWeight:400, color:'var(--txt3)' }}>({movie.ratingCount} ratings)</span>
              </div>
              <div className="movie-meta-item"><i className="fas fa-calendar"></i>{movie.releaseYear}</div>
              {movie.duration && <div className="movie-meta-item"><i className="fas fa-clock"></i>{formatDuration(movie.duration)}</div>}
              {movie.language && <div className="movie-meta-item"><i className="fas fa-globe"></i>{movie.language}</div>}
              {movie.director && <div className="movie-meta-item"><i className="fas fa-video"></i>{movie.director}</div>}
            </div>

            <div className="movie-genres-row">
              {movie.genre?.map(g => <span key={g} className="badge badge-gold">{g}</span>)}
              {movie.isPremium && <span className="badge badge-pro"><i className="fas fa-crown"></i> Premium</span>}
            </div>

            <p className="movie-desc">{movie.description}</p>

            {/* Cast */}
            {movie.cast?.length > 0 && (
              <div style={{ marginBottom:24 }}>
                <div className="section-eyebrow" style={{ marginBottom:10 }}>Cast</div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {movie.cast.map(c => (
                    <span key={c} className="cast-item"><i className="fas fa-user" style={{ fontSize:10 }}></i>{c}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="movie-action-row">
              <button className="btn btn-primary btn-lg" onClick={handleWatch} disabled={videoLoading}>
                {videoLoading
                  ? <><div style={{ width:16, height:16, border:'2px solid #000', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}></div> Loading...</>
                  : <><i className="fas fa-play"></i> Watch Now</>
                }
              </button>

              {!isPremium() && movie.isPremium && (
                <Link to="/pricing" className="btn btn-outline btn-lg">
                  <i className="fas fa-crown"></i> Upgrade to Watch
                </Link>
              )}

              <button className={`btn btn-ghost btn-lg ${inWatchlist ? '' : ''}`} onClick={handleWatchlist}>
                <i className={`fas ${inWatchlist ? 'fa-bookmark' : 'fa-bookmark'}`} style={{ color: inWatchlist ? 'var(--gold)' : undefined }}></i>
                {inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
              </button>

              <button className={`btn btn-ghost`} onClick={handleLike}>
                <i className={`fas fa-heart`} style={{ color: liked ? 'var(--crim3)' : undefined }}></i>
                {likesCount}
              </button>

              {movie.downloadable && (
                <button className="btn btn-ghost" onClick={handleDownload} disabled={downloadLoading || !isPremium()}>
                  {downloadLoading
                    ? <div style={{ width:14, height:14, border:'2px solid var(--txt3)', borderTopColor:'var(--gold)', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}></div>
                    : <i className="fas fa-download" style={{ color: isPremium() ? 'var(--gold)' : undefined }}></i>
                  }
                  {isPremium() ? 'Download' : 'Pro Only'}
                </button>
              )}
            </div>

            {/* Star Rating */}
            <div style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
              <span style={{ fontSize:12, color:'var(--txt3)', letterSpacing:1 }}>Rate this movie:</span>
              <div className="star-rate-widget">
                {[1,2,3,4,5].map(star => (
                  <button key={star}
                    className={`star-rate-btn ${(hoverRating || userRating) >= star ? 'active' : ''}`}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => handleRate(star)}
                  >
                    <i className="fas fa-star"></i>
                  </button>
                ))}
              </div>
              {userRating > 0 && <span style={{ fontSize:12, color:'var(--gold)' }}>Your rating: {userRating}/5</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Video Player */}
      {(videoUrl || videoError) && (
        <div className="player-section">
          <div className="player-section-title">
            <div style={{ width:2, height:20, background:'var(--gold)', borderRadius:1 }}></div>
            <h3>Now Playing</h3>
          </div>
          {videoError === 'upgrade'
            ? (
              <div style={{ background:'var(--bg2)', border:'1px solid var(--border2)', borderRadius:'var(--radius-lg)', padding:'40px', textAlign:'center' }}>
                <i className="fas fa-crown" style={{ fontSize:36, color:'var(--gold)', marginBottom:16 }}></i>
                <h3 style={{ marginBottom:8 }}>Premium Content</h3>
                <p style={{ color:'var(--txt3)', marginBottom:20 }}>Upgrade to Standard to watch in full HD.</p>
                <Link to="/pricing" className="btn btn-primary btn-lg"><i className="fas fa-crown"></i> Upgrade for ₦1,000/month</Link>
              </div>
            ) : videoError
              ? <div style={{ color:'var(--crim3)', padding:'20px', textAlign:'center' }}><i className="fas fa-exclamation-circle" style={{ marginRight:8 }}></i>{videoError}</div>
              : (
                <VideoPlayer
                  movieId={id}
                  videoUrl={videoUrl}
                  savedProgress={savedProgress}
                  qualityOptions={qualityOptions}
                  isPremium={isPremium()}
                />
              )
          }
        </div>
      )}

      {/* Related Movies */}
      {relatedMovies.length > 0 && (
        <div className="movies-section" style={{ padding:'32px 40px' }}>
          <div className="movies-section-header">
            <div>
              <div className="section-eyebrow">More Like This</div>
              <h2 style={{ fontFamily:'Playfair Display,serif', fontSize:'1.4rem', color:'var(--txt)' }}>
                Related <span style={{ color:'var(--gold)' }}>Movies</span>
              </h2>
            </div>
          </div>
          <div className="movies-grid-5">
            {relatedMovies.slice(0, 5).map(m => <MovieCard key={m._id} movie={m} />)}
          </div>
        </div>
      )}
    </div>
  )
}