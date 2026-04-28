import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { movieService } from '../services/movieService.js'
import MovieCard, { MovieCardSkeleton } from '../components/MovieCard.jsx'
import { truncate, formatDuration } from '../utils/helpers.js'
import './Home.css'

const GENRES = ['All', 'Action', 'Comedy', 'Drama', 'Thriller', 'Sci-Fi', 'Horror', 'Romance', 'Mystery']

export default function Home() {
  const { user, isPremium } = useAuth()
  const navigate = useNavigate()
  const [featured, setFeatured] = useState(null)
  const [trending, setTrending] = useState([])
  const [latest, setLatest] = useState([])
  const [filtered, setFiltered] = useState([])
  const [activeGenre, setActiveGenre] = useState('All')
  const [loading, setLoading] = useState(true)
  const [genreLoading, setGenreLoading] = useState(false)
  const [watchlist, setWatchlist] = useState([])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await movieService.getFeatured()
        setFeatured(res.data.featured)
        setTrending(res.data.trending || [])
        setLatest(res.data.latest || [])
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  useEffect(() => {
    const filterMovies = async () => {
      if (activeGenre === 'All') { setFiltered([]); return }
      setGenreLoading(true)
      try {
        const res = await movieService.getMovies({ genre: activeGenre, limit: 12 })
        setFiltered(res.data.movies || [])
      } catch (e) { console.error(e) }
      finally { setGenreLoading(false) }
    }
    filterMovies()
  }, [activeGenre])

  const handleWatchlistChange = (movieId, inList) => {
    if (inList) setWatchlist(w => [...w, movieId])
    else setWatchlist(w => w.filter(id => id !== movieId))
  }

  return (
    <div className="home-page page-wrapper">

      {/* Featured Hero */}
      {loading ? (
        <div className="featured-hero">
          <div className="featured-backdrop-fallback"></div>
          <div className="featured-backdrop-gradient"></div>
          <div className="featured-content">
            <div className="featured-inner">
              <div className="skeleton" style={{ width:140, height:22, marginBottom:16, borderRadius:20 }}></div>
              <div className="skeleton" style={{ width:'80%', height:48, marginBottom:10 }}></div>
              <div className="skeleton" style={{ width:'60%', height:48, marginBottom:20 }}></div>
              <div className="skeleton" style={{ width:'100%', height:60, marginBottom:24 }}></div>
              <div style={{ display:'flex', gap:12 }}>
                <div className="skeleton" style={{ width:130, height:44, borderRadius:8 }}></div>
                <div className="skeleton" style={{ width:130, height:44, borderRadius:8 }}></div>
              </div>
            </div>
          </div>
        </div>
      ) : featured ? (
        <div className="featured-hero">
          {featured.backdropImage
            ? <img src={featured.backdropImage} alt="" className="featured-backdrop" />
            : <div className="featured-backdrop-fallback"></div>
          }
          <div className="featured-backdrop-gradient"></div>
          <div className="featured-content">
            <div className="featured-inner">
              <div className="featured-label">
                <i className="fas fa-star"></i> Featured Tonight
              </div>
              <h1 className="featured-title">{featured.title}</h1>
              <div className="featured-meta">
                <div className="featured-rating">
                  <i className="fas fa-star"></i>
                  {parseFloat(featured.rating || 0).toFixed(1)}
                </div>
                <span className="featured-year">{featured.releaseYear}</span>
                {featured.duration && <span className="featured-year">{formatDuration(featured.duration)}</span>}
                {featured.genre?.slice(0, 2).map(g => (
                  <span key={g} className="badge badge-gold">{g}</span>
                ))}
                {featured.isPremium && <span className="badge badge-pro"><i className="fas fa-crown"></i> Premium</span>}
              </div>
              <p className="featured-desc">{truncate(featured.description, 160)}</p>
              <div className="featured-actions">
                <button className="btn btn-primary btn-lg" onClick={() => navigate(`/movie/${featured._id}`)}>
                  <i className="fas fa-play"></i> Watch Now
                </button>
                <button className="btn btn-ghost btn-lg" onClick={() => navigate(`/movie/${featured._id}`)}>
                  <i className="fas fa-info-circle"></i> More Info
                </button>
              </div>
            </div>
          </div>
          {featured.posterImage && (
            <div className="featured-poster">
              <img src={featured.posterImage} alt={featured.title} />
            </div>
          )}
        </div>
      ) : null}

      {/* Genre Filter */}
      <div className="movies-section" style={{ paddingBottom: 0 }}>
        <div className="genre-filter">
          {GENRES.map(g => (
            <button key={g} className={`genre-chip ${activeGenre === g ? 'active' : ''}`}
              onClick={() => setActiveGenre(g)}>
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Genre results */}
      {activeGenre !== 'All' && (
        <div className="movies-section">
          <div className="movies-section-header">
            <div className="movies-section-header-left">
              <div className="section-eyebrow">{activeGenre}</div>
              <h2 style={{ fontFamily:'Playfair Display,serif', fontSize:'1.6rem', color:'var(--txt)' }}>
                {activeGenre} <span style={{ color:'var(--gold)' }}>Movies</span>
              </h2>
            </div>
          </div>
          {genreLoading ? (
            <div className="movies-grid-5">
              {Array(5).fill(0).map((_,i) => <MovieCardSkeleton key={i} />)}
            </div>
          ) : filtered.length > 0 ? (
            <div className="movies-grid-5">
              {filtered.map(m => (
                <MovieCard key={m._id} movie={m} inWatchlist={watchlist.includes(m._id)} onWatchlistChange={handleWatchlistChange} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <i className="fas fa-film"></i>
              <h3>No {activeGenre} movies yet</h3>
              <p>Check back soon for new additions.</p>
            </div>
          )}
        </div>
      )}

      {/* Trending */}
      <div className="movies-section">
        <div className="movies-section-header">
          <div className="movies-section-header-left">
            <div className="section-eyebrow"><i className="fas fa-fire" style={{ color:'var(--crim3)' }}></i> Trending</div>
            <h2 style={{ fontFamily:'Playfair Display,serif', fontSize:'1.6rem', color:'var(--txt)' }}>
              What's <span style={{ color:'var(--gold)' }}>Hot</span> Right Now
            </h2>
          </div>
          <Link to="/search?trending=true" className="see-all">View all →</Link>
        </div>
        {loading ? (
          <div className="movies-grid-5">
            {Array(5).fill(0).map((_,i) => <MovieCardSkeleton key={i} />)}
          </div>
        ) : trending.length > 0 ? (
          <div className="movies-row">
            {trending.map(m => (
              <MovieCard key={m._id} movie={m} inWatchlist={watchlist.includes(m._id)} onWatchlistChange={handleWatchlistChange} />
            ))}
          </div>
        ) : (
          <div className="empty-state" style={{ padding:'40px 0' }}>
            <i className="fas fa-film"></i>
            <p>No trending movies at the moment.</p>
          </div>
        )}
      </div>

      <div className="gold-divider" style={{ margin:'0 40px' }}></div>

      {/* Latest */}
      <div className="movies-section">
        <div className="movies-section-header">
          <div className="movies-section-header-left">
            <div className="section-eyebrow"><i className="fas fa-certificate" style={{ color:'var(--gold)' }}></i> Latest</div>
            <h2 style={{ fontFamily:'Playfair Display,serif', fontSize:'1.6rem', color:'var(--txt)' }}>
              New <span style={{ color:'var(--gold)' }}>Releases</span>
            </h2>
          </div>
          <Link to="/search?sort=-createdAt" className="see-all">View all →</Link>
        </div>
        {loading ? (
          <div className="movies-grid-5">
            {Array(5).fill(0).map((_,i) => <MovieCardSkeleton key={i} />)}
          </div>
        ) : latest.length > 0 ? (
          <div className="movies-grid-5">
            {latest.slice(0, 10).map(m => (
              <MovieCard key={m._id} movie={m} inWatchlist={watchlist.includes(m._id)} onWatchlistChange={handleWatchlistChange} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <i className="fas fa-film"></i>
            <h3>No movies yet</h3>
            <p>The admin hasn't uploaded any movies yet.</p>
          </div>
        )}
      </div>

      {/* Upgrade Banner for free users */}
      {user && !isPremium() && (
        <div style={{ margin:'0 40px 40px', padding:'28px 32px', background:'linear-gradient(135deg,#130A02,#1A1005)', border:'1px solid rgba(212,175,55,0.4)', borderRadius:'var(--radius-lg)', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:16, position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', right:-20, top:-20, width:200, height:200, borderRadius:'50%', background:'radial-gradient(ellipse, rgba(212,175,55,0.06), transparent)', pointerEvents:'none' }}></div>
          <div>
            <div style={{ fontSize:10, letterSpacing:3, color:'var(--gold)', textTransform:'uppercase', marginBottom:6 }}>Upgrade Plan</div>
            <div style={{ fontFamily:'Playfair Display,serif', fontSize:'1.3rem', color:'var(--txt)', marginBottom:4 }}>Unlock Full HD — ₦1,000/month</div>
            <div style={{ fontSize:13, color:'var(--txt3)' }}>HD streaming · No ads · 5 downloads/month · Early access</div>
          </div>
          <Link to="/pricing" className="btn btn-primary">
            <i className="fas fa-crown"></i> Upgrade with Paystack
          </Link>
        </div>
      )}
    </div>
  )
}