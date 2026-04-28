import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { movieService } from '../services/movieService.js'
import MovieCard, { MovieCardSkeleton } from '../components/MovieCard.jsx'
import { formatDuration } from '../utils/helpers.js'
import './SearchResults.css'

const GENRES   = ['Action','Comedy','Drama','Thriller','Sci-Fi','Horror','Romance','Mystery','Documentary','Animation']
const YEARS    = ['2024','2023','2022','2021','2020','2019','2018','2010s','2000s','1990s']
const SORT_OPTIONS = [
  { value:'-createdAt',   label:'Newest First' },
  { value:'createdAt',    label:'Oldest First' },
  { value:'-rating',      label:'Highest Rated' },
  { value:'-views',       label:'Most Watched' },
  { value:'title',        label:'Title A–Z' },
  { value:'-releaseYear', label:'Newest Year' },
]
const RECENT_KEY = 'cinemax_recent_searches'
const MAX_RECENT = 8

function getRecent() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') } catch { return [] }
}

function saveRecent(q) {
  try {
    const prev = getRecent().filter(r => r.toLowerCase() !== q.toLowerCase())
    localStorage.setItem(RECENT_KEY, JSON.stringify([q, ...prev].slice(0, MAX_RECENT)))
  } catch {}
}

function highlightMatch(text, query) {
  if (!query || !text) return text
  const safe = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = text.split(new RegExp(`(${safe})`, 'gi'))
  return parts.map((p, i) =>
    p.toLowerCase() === query.toLowerCase()
      ? <mark key={i} className="highlight">{p}</mark>
      : p
  )
}

const SUGGESTIONS = ['Action','Drama','Comedy','Sci-Fi','Thriller','Horror','Romance','Nigerian','Nollywood','Animation']
const PAGE_SIZE = 20

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const queryParam  = searchParams.get('q')        || ''
  const genreParam  = searchParams.get('genre')    || ''
  const yearParam   = searchParams.get('year')     || ''
  const sortParam   = searchParams.get('sort')     || '-createdAt'
  const planParam   = searchParams.get('plan')     || ''     // 'free' | 'premium'

  const [inputVal, setInputVal]     = useState(queryParam)
  const [results, setResults]       = useState([])
  const [total, setTotal]           = useState(0)
  const [page, setPage]             = useState(1)
  const [loading, setLoading]       = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [viewMode, setViewMode]     = useState('grid')
  const [recentSearches, setRecentSearches] = useState(getRecent())

  const inputRef = useRef(null)
  const searchTimeout = useRef(null)

  /* ── Build API params ── */
  const buildParams = useCallback((pg = 1) => {
    const p = { page: pg, limit: PAGE_SIZE, sort: sortParam }
    if (queryParam)  p.search  = queryParam
    if (genreParam)  p.genre   = genreParam
    if (yearParam && !yearParam.includes('s')) p.year = yearParam
    if (planParam === 'premium') p.isPremium = true
    if (planParam === 'free')    p.isPremium = false
    return p
  }, [queryParam, genreParam, yearParam, sortParam, planParam])

  /* ── Fetch results ── */
  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      setPage(1)
      try {
        const res = await movieService.getMovies(buildParams(1))
        setResults(res.data.movies || [])
        setTotal(res.data.total || 0)
        if (queryParam) saveRecent(queryParam)
        setRecentSearches(getRecent())
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetch()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [queryParam, genreParam, yearParam, sortParam, planParam])

  /* ── Load more ── */
  const loadMore = async () => {
    if (loadingMore || results.length >= total) return
    const nextPage = page + 1
    setLoadingMore(true)
    try {
      const res = await movieService.getMovies(buildParams(nextPage))
      setResults(prev => [...prev, ...(res.data.movies || [])])
      setPage(nextPage)
    } catch {}
    finally { setLoadingMore(false) }
  }

  /* ── Update search param on submit ── */
  const handleSearch = (e) => {
    e?.preventDefault()
    const val = inputVal.trim()
    if (!val) return
    updateParam('q', val)
  }

  /* ── Debounced live search ── */
  const handleInputChange = (val) => {
    setInputVal(val)
    clearTimeout(searchTimeout.current)
    if (val.trim().length >= 2) {
      searchTimeout.current = setTimeout(() => updateParam('q', val.trim()), 500)
    }
  }

  /* ── Param helpers ── */
  const updateParam = (key, value) => {
    const p = Object.fromEntries(searchParams.entries())
    if (value) p[key] = value; else delete p[key]
    if (key !== 'sort') delete p.page
    setSearchParams(p)
  }

  const clearParam = (key) => {
    const p = Object.fromEntries(searchParams.entries())
    delete p[key]
    setSearchParams(p)
  }

  const clearAll = () => {
    setInputVal('')
    setSearchParams({})
  }

  /* ── Active filters ── */
  const activeFilters = useMemo(() => {
    const f = []
    if (queryParam)  f.push({ key:'q',    label:`"${queryParam}"` })
    if (genreParam)  f.push({ key:'genre', label:genreParam })
    if (yearParam)   f.push({ key:'year',  label:yearParam })
    if (planParam)   f.push({ key:'plan',  label: planParam === 'premium' ? 'Premium Only' : 'Free Only' })
    return f
  }, [queryParam, genreParam, yearParam, planParam])

  const hasFilters = activeFilters.length > 0 || sortParam !== '-createdAt'

  /* ── Year range helper ── */
  const isActiveYear = (y) => {
    if (!yearParam) return false
    if (y === yearParam) return true
    if (y === '2010s' && yearParam >= '2010' && yearParam <= '2019') return true
    if (y === '2000s' && yearParam >= '2000' && yearParam <= '2009') return true
    if (y === '1990s' && yearParam >= '1990' && yearParam <= '1999') return true
    return false
  }

  const handleYearClick = (y) => {
    if (y === '2010s') { updateParam('year', ''); updateParam('yearRange', '2010-2019'); return }
    if (y === '2000s') { updateParam('year', ''); return }
    if (y === '1990s') { updateParam('year', ''); return }
    yearParam === y ? clearParam('year') : updateParam('year', y)
  }

  /* ── Render no results ── */
  const renderNoResults = () => (
    <div className="search-no-results fade-in">
      <div className="search-no-results-icon">
        <i className="fas fa-search"></i>
      </div>
      <h2>No results found</h2>
      <p>
        {queryParam
          ? `We couldn't find any movies matching "${queryParam}". Try different keywords or remove some filters.`
          : 'No movies found with the current filters. Try adjusting your search.'
        }
      </p>
      <div style={{ display:'flex', gap:10, flexWrap:'wrap', justifyContent:'center', marginTop:8 }}>
        {hasFilters && (
          <button className="btn btn-ghost btn-sm" onClick={clearAll}>
            <i className="fas fa-times"></i> Clear All Filters
          </button>
        )}
        <Link to="/home" className="btn btn-primary btn-sm">
          <i className="fas fa-home"></i> Browse All Movies
        </Link>
      </div>

      {/* Suggestions */}
      <div className="search-suggestions">
        <div style={{ fontSize:12, color:'var(--txt3)', marginBottom:12, textAlign:'center', letterSpacing:1 }}>
          TRY SEARCHING FOR
        </div>
        <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'center' }}>
          {SUGGESTIONS.map(s => (
            <button key={s} className="suggestion-query" onClick={() => { setInputVal(s); updateParam('q', s) }}>
              <i className="fas fa-search" style={{ fontSize:10, color:'var(--gold3)' }}></i>
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  /* ── Render landing (no query) ── */
  const renderLanding = () => (
    <div className="fade-in">
      {recentSearches.length > 0 && (
        <div className="recent-searches">
          <div style={{ fontSize:11, letterSpacing:2, color:'var(--txt4)', textTransform:'uppercase', marginBottom:12, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span><i className="fas fa-history" style={{ marginRight:7 }}></i>Recent Searches</span>
            <button style={{ background:'none', border:'none', fontSize:11, color:'var(--txt4)', cursor:'pointer' }}
              onClick={() => { localStorage.removeItem(RECENT_KEY); setRecentSearches([]) }}>
              Clear
            </button>
          </div>
          <div>
            {recentSearches.map(r => (
              <span key={r} className="recent-search-item"
                onClick={() => { setInputVal(r); updateParam('q', r) }}>
                <i className="fas fa-clock"></i>{r}
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginBottom:32 }}>
        <div className="section-eyebrow">Browse by Genre</div>
        <h2 style={{ fontFamily:'Playfair Display,serif', fontSize:'1.4rem', color:'var(--txt)', marginBottom:16 }}>
          What are you in the <span style={{ color:'var(--gold)' }}>mood</span> for?
        </h2>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          {GENRES.map(g => (
            <button key={g} className={`filter-pill ${genreParam === g ? 'active' : ''}`}
              onClick={() => genreParam === g ? clearParam('genre') : updateParam('genre', g)}>
              {g}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="section-eyebrow">Browse All Movies</div>
        <SearchAllMovies navigate={navigate} />
      </div>
    </div>
  )

  return (
    <div className="search-page page-wrapper">

      {/* Search Hero */}
      <div className="search-hero">
        <div className="search-hero-label">
          <i className="fas fa-search"></i> Search & Discover
        </div>
        <form onSubmit={handleSearch}>
          <div className="search-bar-wrap">
            <i className="fas fa-search search-bar-icon"></i>
            <input
              ref={inputRef}
              type="text"
              className="search-bar-input"
              placeholder="Search movies, genres, directors..."
              value={inputVal}
              onChange={e => handleInputChange(e.target.value)}
              autoFocus={!queryParam}
            />
            {inputVal && (
              <button type="button" className="search-bar-clear"
                onClick={() => { setInputVal(''); clearParam('q'); inputRef.current?.focus() }}>
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Filters */}
      <div style={{ marginBottom:20 }}>
        {/* Genre row */}
        <div className="search-filters" style={{ marginBottom:10 }}>
          <span className="filter-label">Genre</span>
          <div className="filter-group">
            {GENRES.map(g => (
              <button key={g} className={`filter-pill ${genreParam === g ? 'active' : ''}`}
                onClick={() => genreParam === g ? clearParam('genre') : updateParam('genre', g)}>
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Year row */}
        <div className="search-filters" style={{ marginBottom:10 }}>
          <span className="filter-label">Year</span>
          <div className="filter-group">
            {YEARS.map(y => (
              <button key={y} className={`filter-pill ${isActiveYear(y) ? 'active' : ''}`}
                onClick={() => handleYearClick(y)}>
                {y}
              </button>
            ))}
          </div>
        </div>

        {/* Plan row */}
        <div className="search-filters">
          <span className="filter-label">Access</span>
          <div className="filter-group">
            <button className={`filter-pill ${planParam === 'free' ? 'active' : ''}`}
              onClick={() => planParam === 'free' ? clearParam('plan') : updateParam('plan','free')}>
              <i className="fas fa-unlock" style={{ fontSize:10, marginRight:4 }}></i>Free
            </button>
            <button className={`filter-pill ${planParam === 'premium' ? 'active' : ''}`}
              onClick={() => planParam === 'premium' ? clearParam('plan') : updateParam('plan','premium')}>
              <i className="fas fa-crown" style={{ fontSize:10, marginRight:4 }}></i>Premium
            </button>
          </div>
        </div>
      </div>

      {/* Active filters summary */}
      {activeFilters.length > 0 && (
        <div className="active-filters-bar">
          <span style={{ fontSize:11, color:'var(--txt3)', letterSpacing:1 }}>ACTIVE:</span>
          {activeFilters.map(f => (
            <div key={f.key} className="active-filter-tag">
              {f.label}
              <button onClick={() => clearParam(f.key)}><i className="fas fa-times"></i></button>
            </div>
          ))}
          <button style={{ marginLeft:'auto', fontSize:11, color:'var(--txt4)', background:'none', border:'none', cursor:'pointer' }}
            onClick={clearAll}>
            Clear all
          </button>
        </div>
      )}

      {/* Controls */}
      {(queryParam || genreParam || results.length > 0) && !loading && (
        <div className="search-controls">
          <div className="search-results-meta">
            {loading ? 'Searching...' : (
              <>
                <strong>{total.toLocaleString()}</strong> result{total !== 1 ? 's' : ''}
                {queryParam && <> for <em>"{queryParam}"</em></>}
                {genreParam && <> in <em>{genreParam}</em></>}
              </>
            )}
          </div>
          <div className="search-controls-right">
            <select className="search-sort-select" value={sortParam}
              onChange={e => updateParam('sort', e.target.value)}>
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            <div className="watchlist-view-toggle">
              <button className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')} title="Grid view">
                <i className="fas fa-th-large"></i>
              </button>
              <button className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')} title="List view">
                <i className="fas fa-list"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className={viewMode === 'grid' ? 'search-results-grid' : 'search-results-list'}>
          {viewMode === 'grid'
            ? Array(10).fill(0).map((_,i) => <MovieCardSkeleton key={i} />)
            : Array(6).fill(0).map((_,i) => (
              <div key={i} className="skeleton" style={{ height:108, borderRadius:'var(--radius)' }}></div>
            ))
          }
        </div>
      ) : !queryParam && !genreParam && !yearParam && !planParam ? (
        renderLanding()
      ) : results.length === 0 ? (
        renderNoResults()
      ) : viewMode === 'grid' ? (
        <div className="search-results-grid">
          {results.map(m => (
            <MovieCard key={m._id} movie={m} />
          ))}
        </div>
      ) : (
        <div className="search-results-list">
          {results.map(m => (
            <Link key={m._id} to={`/movie/${m._id}`} className="search-list-item fade-in">
              <div className="search-list-poster">
                {m.posterImage
                  ? <img src={m.posterImage} alt={m.title} />
                  : <div className="search-list-placeholder"><i className="fas fa-film"></i></div>
                }
              </div>

              <div className="search-list-info">
                <div className="search-list-title">
                  {queryParam ? highlightMatch(m.title, queryParam) : m.title}
                </div>
                <div className="search-list-meta">
                  {m.releaseYear && <span><i className="fas fa-calendar"></i>{m.releaseYear}</span>}
                  {m.duration && <span><i className="fas fa-clock"></i>{formatDuration(m.duration)}</span>}
                  {m.rating > 0 && (
                    <span style={{ color:'var(--gold)', display:'flex', alignItems:'center', gap:3, fontWeight:600 }}>
                      <i className="fas fa-star" style={{ fontSize:9 }}></i>
                      {parseFloat(m.rating).toFixed(1)}
                    </span>
                  )}
                  {m.genre?.slice(0,3).map(g => (
                    <span key={g} className="badge badge-gold" style={{ fontSize:10, padding:'1px 7px' }}>{g}</span>
                  ))}
                  {m.isPremium && (
                    <span className="badge badge-pro" style={{ fontSize:10 }}>
                      <i className="fas fa-crown"></i> Pro
                    </span>
                  )}
                </div>
                {m.description && (
                  <div className="search-list-desc">
                    {queryParam ? highlightMatch(m.description?.slice(0, 140), queryParam) : m.description?.slice(0, 140)}
                    {m.description?.length > 140 ? '…' : ''}
                  </div>
                )}
              </div>

              <i className="fas fa-chevron-right search-list-arrow"></i>
            </Link>
          ))}
        </div>
      )}

      {/* Load more */}
      {results.length > 0 && results.length < total && (
        <div className="load-more-wrap">
          <button
            className="btn btn-ghost"
            onClick={loadMore}
            disabled={loadingMore}
          >
            {loadingMore
              ? <><div style={{ width:14, height:14, border:'2px solid var(--txt3)', borderTopColor:'var(--gold)', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}></div> Loading...</>
              : <><i className="fas fa-chevron-down"></i> Load More ({total - results.length} remaining)</>
            }
          </button>
        </div>
      )}
    </div>
  )
}

/* ── Quick all-movies grid component ── */
function SearchAllMovies({ navigate }) {
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    movieService.getMovies({ limit: 10, sort:'-createdAt' })
      .then(r => setMovies(r.data.movies || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="search-results-grid">
      {Array(5).fill(0).map((_,i) => <MovieCardSkeleton key={i} />)}
    </div>
  )

  if (!movies.length) return (
    <p style={{ color:'var(--txt3)', fontSize:14 }}>No movies available yet.</p>
  )

  return (
    <div className="search-results-grid">
      {movies.map(m => <MovieCard key={m._id} movie={m} />)}
    </div>
  )
}