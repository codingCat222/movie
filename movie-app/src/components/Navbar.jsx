import { useState, useEffect, useRef } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import './Navbar.css'

export default function Navbar() {
  const { user, logout, isPremium } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [navigate])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
      setMobileOpen(false)
    }
  }

  const handleLogout = () => {
    logout()
    setDropdownOpen(false)
    setMobileOpen(false)
    navigate('/')
  }

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  return (
    <>
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        {/* Logo */}
        <Link to={user ? '/home' : '/'} className="nav-logo">
          <div className="nav-logo-icon">
            <i className="fas fa-film"></i>
          </div>
          <div>
            <div className="nav-logo-text">CINEMAX</div>
            <div className="nav-logo-sub">Streaming</div>
          </div>
        </Link>

        {/* Desktop Links */}
        <div className="nav-links">
          <NavLink to="/home" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <i className="fas fa-home" style={{ marginRight: 6, fontSize: 12 }}></i>Home
          </NavLink>
          <NavLink to="/search?genre=Action" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Movies
          </NavLink>
          <NavLink to="/search?genre=Drama" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Series
          </NavLink>
          {user && (
            <NavLink to="/watchlist" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <i className="fas fa-bookmark" style={{ marginRight: 6, fontSize: 12 }}></i>Watchlist
            </NavLink>
          )}
          <NavLink to="/pricing" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Pricing
          </NavLink>
        </div>

        {/* Search Bar */}
        <div className="nav-search">
          <form className="nav-search-form" onSubmit={handleSearch}>
            <i className="fas fa-search nav-search-icon"></i>
            <input
              type="text"
              className="nav-search-input"
              placeholder="Search movies..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </form>
        </div>

        {/* Actions */}
        <div className="nav-actions">
          {user ? (
            <>
              <span className={`nav-plan-badge ${isPremium() ? 'premium' : 'free'}`}>
                {isPremium() ? '⭐ Standard' : 'Free'}
              </span>
              <div className="nav-avatar-btn" ref={dropdownRef} onClick={() => setDropdownOpen(!dropdownOpen)}>
                <span className="nav-avatar-name hide-mobile">{user.name?.split(' ')[0]}</span>
                <div className="nav-avatar-circle">
                  {user.avatar
                    ? <img src={user.avatar} alt={user.name} />
                    : initials
                  }
                </div>

                {dropdownOpen && (
                  <div className="nav-dropdown" onClick={e => e.stopPropagation()}>
                    <div className="nav-dropdown-header">
                      <div className="nav-dropdown-name">{user.name}</div>
                      <div className="nav-dropdown-email">{user.email}</div>
                    </div>
                    <Link to="/dashboard" className="nav-dropdown-item" onClick={() => setDropdownOpen(false)}>
                      <i className="fas fa-user"></i> My Account
                    </Link>
                    <Link to="/watchlist" className="nav-dropdown-item" onClick={() => setDropdownOpen(false)}>
                      <i className="fas fa-bookmark"></i> Watchlist
                    </Link>
                    <Link to="/dashboard?tab=history" className="nav-dropdown-item" onClick={() => setDropdownOpen(false)}>
                      <i className="fas fa-history"></i> Watch History
                    </Link>
                    {!isPremium() && (
                      <Link to="/pricing" className="nav-dropdown-item" onClick={() => setDropdownOpen(false)}
                        style={{ color: 'var(--gold)' }}>
                        <i className="fas fa-crown" style={{ color: 'var(--gold)' }}></i> Upgrade Plan
                      </Link>
                    )}
                    {user.role === 'admin' && (
                      <Link to="/admin" className="nav-dropdown-item" onClick={() => setDropdownOpen(false)}>
                        <i className="fas fa-cog"></i> Admin Panel
                      </Link>
                    )}
                    <button className="nav-dropdown-item logout" onClick={handleLogout}>
                      <i className="fas fa-sign-out-alt"></i> Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm hide-mobile">Sign In</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
            </>
          )}

          {/* Hamburger */}
          <button 
            className={`nav-hamburger ${mobileOpen ? 'open' : ''}`} 
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="nav-mobile-menu">
          <form onSubmit={handleSearch} className="nav-mobile-search">
            <div className="nav-search-form" style={{ width: '100%' }}>
              <i className="fas fa-search nav-search-icon"></i>
              <input
                type="text"
                className="nav-search-input"
                placeholder="Search movies..."
                style={{ width: '100%' }}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>
          </form>
          
          <NavLink to="/home" className={({ isActive }) => `nav-mobile-link ${isActive ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>
            <i className="fas fa-home"></i> Home
          </NavLink>
          <NavLink to="/search?genre=Action" className="nav-mobile-link" onClick={() => setMobileOpen(false)}>
            <i className="fas fa-film"></i> Movies
          </NavLink>
          <NavLink to="/search?genre=Drama" className="nav-mobile-link" onClick={() => setMobileOpen(false)}>
            <i className="fas fa-tv"></i> Series
          </NavLink>
          
          {user && (
            <NavLink to="/watchlist" className="nav-mobile-link" onClick={() => setMobileOpen(false)}>
              <i className="fas fa-bookmark"></i> Watchlist
            </NavLink>
          )}
          
          <NavLink to="/pricing" className="nav-mobile-link" onClick={() => setMobileOpen(false)}>
            <i className="fas fa-crown"></i> Pricing
          </NavLink>
          
          <div className="nav-mobile-divider"></div>
          
          {user ? (
            <>
              <div className="nav-mobile-link" style={{ pointerEvents: 'none', color: 'var(--txt)' }}>
                <div className="nav-avatar-circle" style={{ width: 24, height: 24, fontSize: 10 }}>
                  {user.avatar ? <img src={user.avatar} alt="" /> : initials}
                </div>
                {user.name}
              </div>
              <NavLink to="/dashboard" className="nav-mobile-link" onClick={() => setMobileOpen(false)}>
                <i className="fas fa-user"></i> My Account
              </NavLink>
              <NavLink to="/dashboard?tab=history" className="nav-mobile-link" onClick={() => setMobileOpen(false)}>
                <i className="fas fa-history"></i> Watch History
              </NavLink>
              {user.role === 'admin' && (
                <NavLink to="/admin" className="nav-mobile-link" onClick={() => setMobileOpen(false)}>
                  <i className="fas fa-cog"></i> Admin Panel
                </NavLink>
              )}
              <button className="nav-mobile-link" style={{ color: 'var(--crim3)' }}
                onClick={handleLogout}>
                <i className="fas fa-sign-out-alt"></i> Sign Out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="nav-mobile-link" onClick={() => setMobileOpen(false)}>
                <i className="fas fa-sign-in-alt"></i> Sign In
              </NavLink>
              <NavLink to="/register" className="nav-mobile-link" onClick={() => setMobileOpen(false)}>
                <i className="fas fa-user-plus"></i> Create Account
              </NavLink>
            </>
          )}
        </div>
      )}
    </>
  )
}