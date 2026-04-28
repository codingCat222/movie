import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { userService } from '../services/movieService.js'
import { formatDuration } from '../utils/helpers.js'
import './MovieCard.css'

export default function MovieCard({ movie, variant = 'vertical', inWatchlist: initialInList = false, onWatchlistChange }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [inWatchlist, setInWatchlist] = useState(initialInList)
  const [loading, setLoading] = useState(false)

  if (!movie) return <MovieCardSkeleton />

  const handlePlay = (e) => {
    e.stopPropagation()
    navigate(`/movie/${movie._id}`)
  }

  const handleWatchlist = async (e) => {
    e.stopPropagation()
    if (!user) { navigate('/login'); return }
    if (loading) return
    setLoading(true)
    try {
      const res = await userService.toggleWatchlist(movie._id)
      setInWatchlist(res.data.inWatchlist)
      onWatchlistChange?.(movie._id, res.data.inWatchlist)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const isNew = () => {
    const d = new Date(movie.createdAt)
    return (Date.now() - d.getTime()) < 7 * 24 * 60 * 60 * 1000
  }

  if (variant === 'skeleton') return <MovieCardSkeleton />

  return (
    <div className={`movie-card ${variant === 'horizontal' ? 'horizontal' : ''}`}
      onClick={() => navigate(`/movie/${movie._id}`)}>
      <div className="movie-card-thumb">
        {movie.posterImage
          ? <img src={movie.posterImage} alt={movie.title} className="movie-card-img" loading="lazy" />
          : (
            <div className="movie-card-placeholder">
              <i className="fas fa-film"></i>
              <span>No poster</span>
            </div>
          )
        }

        {/* Badges */}
        {movie.isPremium && <div className="movie-card-pro">PRO</div>}
        {isNew() && !movie.isPremium && <div className="movie-card-new">New</div>}

        {/* Rating */}
        {movie.rating > 0 && (
          <div className="movie-card-rating">
            <i className="fas fa-star"></i>
            {parseFloat(movie.rating).toFixed(1)}
          </div>
        )}

        {/* Hover Overlay */}
        <div className="movie-card-overlay">
          <div className="movie-card-tags">
            {movie.genre?.slice(0, 2).map(g => (
              <span key={g} className="badge badge-gold" style={{ fontSize: 10, padding: '2px 7px' }}>{g}</span>
            ))}
            {movie.duration && (
              <span style={{ fontSize: 10, color: 'var(--txt3)' }}>
                <i className="fas fa-clock" style={{ marginRight: 3 }}></i>
                {formatDuration(movie.duration)}
              </span>
            )}
          </div>
          <div className="movie-card-actions">
            <button className="movie-card-action-btn play" onClick={handlePlay}>
              <i className="fas fa-play"></i> Play
            </button>
            <button
              className={`movie-card-action-btn list ${inWatchlist ? 'in-list' : ''}`}
              onClick={handleWatchlist}
              disabled={loading}
            >
              <i className={`fas ${inWatchlist ? 'fa-check' : 'fa-plus'}`}></i>
            </button>
          </div>
        </div>
      </div>

      <div className="movie-card-info">
        <div className="movie-card-title">{movie.title}</div>
        <div className="movie-card-meta">
          <span className="movie-card-year">{movie.releaseYear}</span>
          {movie.genre?.[0] && (
            <>
              <div className="movie-card-dot"></div>
              <span className="movie-card-genre">{movie.genre[0]}</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export function MovieCardSkeleton() {
  return (
    <div className="movie-card movie-card-skeleton">
      <div className="movie-card-thumb">
        <div className="skeleton skeleton-thumb" style={{ height: '100%', borderRadius: 'var(--radius)' }}></div>
      </div>
      <div className="movie-card-info">
        <div className="skeleton skeleton-title"></div>
        <div className="skeleton skeleton-meta"></div>
      </div>
    </div>
  )
}