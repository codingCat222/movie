import { useState, useEffect, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { userService } from '../services/movieService.js'
import MovieCard, { MovieCardSkeleton } from '../components/MovieCard.jsx'
import { formatDuration } from '../utils/helpers.js'
import './Watchlist.css'

const SORT_OPTIONS = [
  { value: 'added-desc', label: 'Recently Added' },
  { value: 'added-asc',  label: 'Oldest First' },
  { value: 'title-asc',  label: 'Title A–Z' },
  { value: 'title-desc', label: 'Title Z–A' },
  { value: 'year-desc',  label: 'Newest Year' },
  { value: 'year-asc',   label: 'Oldest Year' },
  { value: 'rating-desc',label: 'Highest Rated' },
]

export default function Watchlist() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [movies, setMovies]           = useState([])
  const [loading, setLoading]         = useState(true)
  const [viewMode, setViewMode]       = useState('grid')   // 'grid' | 'list'
  const [sortBy, setSortBy]           = useState('added-desc')
  const [activeGenre, setActiveGenre] = useState('All')
  const [selected, setSelected]       = useState(new Set())
  const [removing, setRemoving]       = useState(new Set())
  const [toast, setToast]             = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await userService.getWatchlist()
        setMovies(res.data.watchlist || [])
      } catch {
        showToast('Failed to load watchlist', 'error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  /* ── Derived: genre counts ── */
  const genreCounts = useMemo(() => {
    const counts = { All: movies.length }
    movies.forEach(m => {
      m.genre?.forEach(g => {
        counts[g] = (counts[g] || 0) + 1
      })
    })
    return counts
  }, [movies])

  const allGenres = useMemo(() => ['All', ...Object.keys(genreCounts).filter(g => g !== 'All')], [genreCounts])

  /* ── Derived: filtered + sorted list ── */
  const displayMovies = useMemo(() => {
    let list = [...movies]

    // Genre filter
    if (activeGenre !== 'All') {
      list = list.filter(m => m.genre?.includes(activeGenre))
    }

    // Sort
    switch (sortBy) {
      case 'added-asc':   break  // default order
      case 'added-desc':  list.reverse(); break
      case 'title-asc':   list.sort((a,b) => a.title.localeCompare(b.title)); break
      case 'title-desc':  list.sort((a,b) => b.title.localeCompare(a.title)); break
      case 'year-desc':   list.sort((a,b) => (b.releaseYear||0) - (a.releaseYear||0)); break
      case 'year-asc':    list.sort((a,b) => (a.releaseYear||0) - (b.releaseYear||0)); break
      case 'rating-desc': list.sort((a,b) => (b.rating||0) - (a.rating||0)); break
      default: break
    }

    return list
  }, [movies, activeGenre, sortBy])

  /* ── Remove single ── */
  const handleRemove = async (movieId, e) => {
    e?.stopPropagation()
    setRemoving(prev => new Set(prev).add(movieId))
    try {
      await userService.toggleWatchlist(movieId)
      setMovies(prev => prev.filter(m => m._id !== movieId))
      setSelected(prev => { const s = new Set(prev); s.delete(movieId); return s })
      showToast('Removed from watchlist')
    } catch {
      showToast('Failed to remove', 'error')
    } finally {
      setRemoving(prev => { const s = new Set(prev); s.delete(movieId); return s })
    }
  }

  /* ── Bulk remove ── */
  const handleBulkRemove = async () => {
    const ids = [...selected]
    if (!ids.length) return
    ids.forEach(id => setRemoving(prev => new Set(prev).add(id)))
    try {
      await Promise.all(ids.map(id => userService.toggleWatchlist(id)))
      setMovies(prev => prev.filter(m => !ids.includes(m._id)))
      setSelected(new Set())
      showToast(`Removed ${ids.length} movie${ids.length > 1 ? 's' : ''}`)
    } catch {
      showToast('Bulk remove failed', 'error')
    } finally {
      setRemoving(new Set())
    }
  }

  /* ── Select toggle ── */
  const toggleSelect = (id, e) => {
    e.stopPropagation()
    setSelected(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }

  const selectAll  = () => setSelected(new Set(displayMovies.map(m => m._id)))
  const clearSelect = () => setSelected(new Set())

  /* ── Render skeleton ── */
  const renderSkeleton = () => viewMode === 'grid' ? (
    <div className="watchlist-skeleton-grid">
      {Array(10).fill(0).map((_,i) => <MovieCardSkeleton key={i} />)}
    </div>
  ) : (
    <div className="watchlist-skeleton-list">
      {Array(6).fill(0).map((_,i) => (
        <div key={i} className="skeleton skeleton-list-item"></div>
      ))}
    </div>
  )

  /* ── Render empty ── */
  const renderEmpty = () => (
    <div className="watchlist-empty fade-in">
      <div className="watchlist-empty-icon">
        <i className="fas fa-bookmark"></i>
      </div>
      <h2>
        {activeGenre !== 'All'
          ? `No ${activeGenre} movies`
          : 'Your watchlist is empty'
        }
      </h2>
      <p>
        {activeGenre !== 'All'
          ? `You haven't saved any ${activeGenre} movies yet. Switch genre or browse more.`
          : 'Save movies you want to watch later by clicking the + button on any movie card.'
        }
      </p>
      <div style={{ display:'flex', gap:10, flexWrap:'wrap', justifyContent:'center' }}>
        {activeGenre !== 'All' && (
          <button className="btn btn-ghost btn-sm" onClick={() => setActiveGenre('All')}>
            <i className="fas fa-filter"></i> Show All
          </button>
        )}
        <Link to="/home" className="btn btn-primary btn-sm">
          <i className="fas fa-film"></i> Discover Movies
        </Link>
      </div>
    </div>
  )

  /* ── Render grid ── */
  const renderGrid = () => (
    <div className="watchlist-grid">
      {displayMovies.map(movie => (
        <div key={movie._id} style={{ position:'relative' }}>
          {/* Checkbox overlay */}
          <div
            onClick={(e) => toggleSelect(movie._id, e)}
            style={{
              position:'absolute', top:8, left:8, zIndex:20,
              width:22, height:22, borderRadius:6,
              background: selected.has(movie._id) ? 'var(--gold)' : 'rgba(4,3,10,0.7)',
              border: `2px solid ${selected.has(movie._id) ? 'var(--gold)' : 'rgba(255,255,255,0.3)'}`,
              display:'flex', alignItems:'center', justifyContent:'center',
              cursor:'pointer', transition:'var(--transition)',
              backdropFilter:'blur(4px)',
            }}
          >
            {selected.has(movie._id) && <i className="fas fa-check" style={{ fontSize:10, color:'#000' }}></i>}
          </div>

          {/* Removing overlay */}
          {removing.has(movie._id) && (
            <div style={{ position:'absolute', inset:0, zIndex:30, background:'rgba(4,3,10,0.6)', borderRadius:'var(--radius)', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(4px)' }}>
              <div className="loading-spinner" style={{ width:24, height:24, borderWidth:2 }}></div>
            </div>
          )}

          <MovieCard
            movie={movie}
            inWatchlist={true}
            onWatchlistChange={(id) => handleRemove(id)}
          />
        </div>
      ))}
    </div>
  )

  /* ── Render list ── */
  const renderList = () => (
    <div className="watchlist-list">
      {displayMovies.map((movie, idx) => (
        <div
          key={movie._id}
          className="watchlist-list-item fade-in"
          style={{ animationDelay: `${idx * 0.04}s`, opacity: removing.has(movie._id) ? 0.4 : 1, transition:'opacity 0.3s' }}
          onClick={() => navigate(`/movie/${movie._id}`)}
        >
          {/* Rank number */}
          <div style={{ width:28, textAlign:'center', flexShrink:0 }}>
            <span style={{ fontSize:13, fontWeight:700, color:'var(--txt4)' }}>
              {String(idx + 1).padStart(2, '0')}
            </span>
          </div>

          {/* Poster */}
          <div className="wl-item-poster">
            {movie.posterImage
              ? <img src={movie.posterImage} alt={movie.title} />
              : <div className="wl-item-poster-placeholder"><i className="fas fa-film"></i></div>
            }
          </div>

          {/* Info */}
          <div className="wl-item-info">
            <div className="wl-item-title">{movie.title}</div>
            <div className="wl-item-meta">
              {movie.releaseYear && (
                <span className="wl-item-meta-tag">
                  <i className="fas fa-calendar"></i>{movie.releaseYear}
                </span>
              )}
              {movie.duration && (
                <span className="wl-item-meta-tag">
                  <i className="fas fa-clock"></i>{formatDuration(movie.duration)}
                </span>
              )}
              {movie.rating > 0 && (
                <span className="wl-item-rating">
                  <i className="fas fa-star" style={{ fontSize:10 }}></i>
                  {parseFloat(movie.rating).toFixed(1)}
                </span>
              )}
            </div>
            <div className="wl-item-genres">
              {movie.genre?.slice(0, 3).map(g => (
                <span key={g} className="badge badge-gold" style={{ fontSize:10, padding:'2px 8px' }}>{g}</span>
              ))}
              {movie.isPremium && (
                <span className="badge badge-pro" style={{ fontSize:10 }}>
                  <i className="fas fa-crown"></i> Pro
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="wl-item-actions" onClick={e => e.stopPropagation()}>
            <button className="wl-action-btn play" onClick={() => navigate(`/movie/${movie._id}`)}>
              <i className="fas fa-play"></i>
              <span className="hide-mobile">Watch</span>
            </button>
            <button
              className="wl-action-btn remove"
              onClick={(e) => handleRemove(movie._id, e)}
              disabled={removing.has(movie._id)}
            >
              {removing.has(movie._id)
                ? <div style={{ width:12, height:12, border:'2px solid var(--crim3)', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}></div>
                : <><i className="fas fa-trash"></i><span className="hide-mobile">Remove</span></>
              }
            </button>
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="watchlist-page page-wrapper">

      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          <i className={`fas fa-${toast.type === 'success' ? 'check-circle' : 'exclamation-circle'}`}></i>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="watchlist-header">
        <div className="watchlist-header-left">
          <div className="section-eyebrow">
            <i className="fas fa-bookmark"></i> My Library
          </div>
          <h1 className="watchlist-title">
            My <span>Watchlist</span>
          </h1>
          {!loading && (
            <div className="watchlist-count">
              <i className="fas fa-film"></i>
              {movies.length} movie{movies.length !== 1 ? 's' : ''} saved
              {activeGenre !== 'All' && ` · ${displayMovies.length} in ${activeGenre}`}
              {selected.size > 0 && (
                <span style={{ color:'var(--gold)', marginLeft:8 }}>
                  · {selected.size} selected
                </span>
              )}
            </div>
          )}
        </div>

        <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
          {selected.size > 0 && (
            <>
              <button className="btn btn-ghost btn-sm" onClick={clearSelect}>
                <i className="fas fa-times"></i> Deselect All
              </button>
              <button className="btn btn-danger btn-sm" onClick={handleBulkRemove}>
                <i className="fas fa-trash"></i> Remove {selected.size}
              </button>
            </>
          )}
          {movies.length > 0 && selected.size === 0 && (
            <button className="btn btn-ghost btn-sm" onClick={selectAll}>
              <i className="fas fa-check-square"></i> Select All
            </button>
          )}
          <Link to="/home" className="btn btn-primary btn-sm">
            <i className="fas fa-plus"></i> Add Movies
          </Link>
        </div>
      </div>

      {/* Genre filter */}
      {!loading && movies.length > 0 && (
        <div className="watchlist-filter-row">
          {allGenres.slice(0, 10).map(g => (
            <button
              key={g}
              className={`filter-chip ${activeGenre === g ? 'active' : ''}`}
              onClick={() => setActiveGenre(g)}
            >
              {g === 'All' && <i className="fas fa-th-large" style={{ fontSize:10 }}></i>}
              {g}
              <span className="chip-count">{genreCounts[g] || 0}</span>
            </button>
          ))}
        </div>
      )}

      {/* Controls */}
      {!loading && movies.length > 0 && (
        <div className="watchlist-controls">
          <select
            className="watchlist-sort-select"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <div className="watchlist-view-toggle">
            <button
              className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid view"
            >
              <i className="fas fa-th-large"></i>
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List view"
            >
              <i className="fas fa-list"></i>
            </button>
          </div>

          <div style={{ fontSize:13, color:'var(--txt3)', marginLeft:'auto' }}>
            Showing <strong style={{ color:'var(--txt)' }}>{displayMovies.length}</strong> of{' '}
            <strong style={{ color:'var(--txt)' }}>{movies.length}</strong>
          </div>
        </div>
      )}

      {/* Content */}
      {loading
        ? renderSkeleton()
        : displayMovies.length === 0
          ? renderEmpty()
          : viewMode === 'grid'
            ? renderGrid()
            : renderList()
      }

      {/* Bulk actions floating bar */}
      {selected.size > 0 && (
        <div className="watchlist-bulk-bar">
          <span className="bulk-selected-count">
            <i className="fas fa-check-circle" style={{ marginRight:6 }}></i>
            {selected.size} selected
          </span>
          <div style={{ width:1, height:20, background:'var(--border)' }}></div>
          <button className="btn btn-danger btn-sm" onClick={handleBulkRemove}>
            <i className="fas fa-trash"></i> Remove Selected
          </button>
          <button className="btn btn-ghost btn-sm" onClick={clearSelect}>
            <i className="fas fa-times"></i> Cancel
          </button>
        </div>
      )}
    </div>
  )
}