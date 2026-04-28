import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { movieService } from '../services/movieService.js'
import Footer from '../components/Footer.jsx'
import './Landing.css'

const GENRES = ['Action', 'Drama', 'Comedy', 'Thriller', 'Sci-Fi', 'Horror', 'Romance', 'Mystery']

const MOCK_MOVIES = [
  { color: '#1a0508', title: 'The Dark Horizon', genre: 'Thriller', year: '2024', rating: 4.8 },
  { color: '#050f1a', title: 'Ocean\'s Edge', genre: 'Drama', year: '2024', rating: 4.5 },
  { color: '#14100a', title: 'Golden Dawn', genre: 'Action', year: '2023', rating: 4.9 },
  { color: '#091408', title: 'Forest Kingdom', genre: 'Sci-Fi', year: '2024', rating: 4.2 },
  { color: '#180a14', title: 'Crimson Night', genre: 'Horror', year: '2024', rating: 4.6 },
  { color: '#0a0516', title: 'Mystic Falls', genre: 'Mystery', year: '2023', rating: 4.7 }
]

const POSTER_BG = [
  'https://picsum.photos/seed/movie1/300/450',
  'https://picsum.photos/seed/movie2/300/450',
  'https://picsum.photos/seed/movie3/300/450',
  'https://picsum.photos/seed/movie4/300/450',
  'https://picsum.photos/seed/movie5/300/450',
  'https://picsum.photos/seed/movie6/300/450'
]

export default function Landing() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const canvasRef = useRef(null)
  const [scrolled, setScrolled] = useState(false)
  const [movies, setMovies] = useState([])
  const [counters, setCounters] = useState({ users: 0, movies: 0, subscribers: 0 })
  const [loading, setLoading] = useState(true)
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 })
  const [liveCount, setLiveCount] = useState(1247)
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [activeGenre, setActiveGenre] = useState('All')
  const [countdown, setCountdown] = useState({ hrs: '00', min: '00', sec: '00' })
  const [currentToast, setCurrentToast] = useState(null)

  const testimonials = [
    { name: 'Chidi Okafor', location: 'Lagos', avatar: 'CO', rating: 5, quote: 'Finally, a streaming service that accepts Paystack instantly. The HD quality is unmatched!' },
    { name: 'Amina Yusuf', location: 'Abuja', avatar: 'AY', rating: 5, quote: 'I love the offline downloads. Now I can watch movies on my way to work without data worries.' },
    { name: 'Tunde Bakare', location: 'Kano', avatar: 'TB', rating: 4, quote: 'The early release access is worth every naira. I get to see new movies before my friends!' }
  ]

  const toastMessages = [
    { name: 'Chidi O.', location: 'Lagos', action: 'just subscribed' },
    { name: 'Amina Y.', location: 'Abuja', action: 'started watching The Dark Horizon' },
    { name: 'Tunde B.', location: 'Kano', action: 'upgraded to Standard' },
    { name: 'Ngozi E.', location: 'Enugu', action: 'just subscribed' },
    { name: 'Emeka I.', location: 'Port Harcourt', action: 'is watching Golden Dawn' }
  ]

  useEffect(() => {
    movieService.getMovies({ limit: 6 })
      .then(r => setMovies(r.data.movies || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed')
          }
        })
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    )
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [loading])

  useEffect(() => {
    const targets = { users: 4800, movies: 320, subscribers: 1200 }
    const duration = 2000
    const steps = 60
    let step = 0
    const interval = setInterval(() => {
      step++
      const progress = step / steps
      const eased = 1 - Math.pow(1 - progress, 3)
      setCounters({
        users: Math.floor(targets.users * eased),
        movies: Math.floor(targets.movies * eased),
        subscribers: Math.floor(targets.subscribers * eased)
      })
      if (step >= steps) clearInterval(interval)
    }, duration / steps)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveCount(prev => prev + Math.floor(Math.random() * 5) - 2)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial(prev => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e) => {
      setCursorPos({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useEffect(() => {
    const calculateCountdown = () => {
      const now = new Date()
      const target = new Date(now)
      target.setDate(now.getDate() + (5 - now.getDay() + 7) % 7)
      target.setHours(20, 0, 0, 0)
      if (target < now) target.setDate(target.getDate() + 7)
      const diff = target - now
      setCountdown({
        hrs: String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, '0'),
        min: String(Math.floor((diff / (1000 * 60)) % 60)).padStart(2, '0'),
        sec: String(Math.floor((diff / 1000) % 60)).padStart(2, '0')
      })
    }
    calculateCountdown()
    const interval = setInterval(calculateCountdown, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      const msg = toastMessages[Math.floor(Math.random() * toastMessages.length)]
      const id = Date.now()
      setCurrentToast({ ...msg, id })
      setTimeout(() => setCurrentToast(null), 4000)
    }, 6000)
    setTimeout(() => {
      const msg = toastMessages[Math.floor(Math.random() * toastMessages.length)]
      setCurrentToast({ ...msg, id: Date.now() })
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2200)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || loading) return
    let animId
    let renderer, scene, camera, gold, red, white, rings
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
    script.onload = () => {
      const THREE = window.THREE
      const W = canvas.clientWidth
      const H = canvas.clientHeight
      renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false })
      renderer.setSize(W, H)
      renderer.setClearColor(0x04030A, 1)
      scene = new THREE.Scene()
      camera = new THREE.PerspectiveCamera(70, W / H, 0.1, 100)
      camera.position.z = 5
      const makePoints = (count, color, size, spread) => {
        const geo = new THREE.BufferGeometry()
        const pos = new Float32Array(count * 3)
        for (let i = 0; i < count; i++) {
          pos[i * 3] = (Math.random() - 0.5) * spread
          pos[i * 3 + 1] = (Math.random() - 0.5) * spread * 0.6
          pos[i * 3 + 2] = (Math.random() - 0.5) * spread * 0.4
        }
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
        return new THREE.Points(geo, new THREE.PointsMaterial({ color, size, transparent: true, opacity: 0.65 }))
      }
      gold = makePoints(300, 0xD4AF37, 0.035, 20)
      red = makePoints(120, 0x8B0000, 0.05, 18)
      white = makePoints(150, 0xffffff, 0.02, 22)
      scene.add(gold, red, white)
      rings = []
      const ringData = [
        [3.2, 0x8B6914, 0.12],
        [5.0, 0xD4AF37, 0.06],
        [7.2, 0x3D1F00, 0.14],
        [2.0, 0x5C1111, 0.1]
      ]
      ringData.forEach(([r, c, o], i) => {
        const m = new THREE.Mesh(
          new THREE.TorusGeometry(r, 0.006, 6, 100),
          new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o })
        )
        m.rotation.x = Math.PI / 2 + i * 0.35
        m.position.set(4, -1, -5)
        scene.add(m)
        rings.push(m)
      })
      let t = 0
      const animate = () => {
        animId = requestAnimationFrame(animate)
        t += 0.005
        if (gold) gold.rotation.y = t * 0.025
        if (gold) gold.rotation.x = t * 0.008
        if (red) red.rotation.y = -t * 0.02
        if (white) white.rotation.z = t * 0.015
        if (rings) rings.forEach((ring, i) => { ring.rotation.z = t * (0.08 + i * 0.025) })
        if (renderer && scene && camera) renderer.render(scene, camera)
      }
      animate()
      const handleResize = () => {
        const W2 = canvas.clientWidth
        const H2 = canvas.clientHeight
        if (renderer) renderer.setSize(W2, H2)
        if (camera) {
          camera.aspect = W2 / H2
          camera.updateProjectionMatrix()
        }
      }
      window.addEventListener('resize', handleResize)
    }
    document.head.appendChild(script)
    return () => {
      cancelAnimationFrame(animId)
      if (script.parentNode) script.parentNode.removeChild(script)
    }
  }, [loading])

  if (user) {
    navigate('/home')
    return null
  }

  if (loading) {
    return (
      <div className="preloader">
        <div className="preloader-bg" />
        <div className="preloader-content">
          <div className="golden-ring-container">
            <svg className="golden-ring" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(212,175,55,0.1)" strokeWidth="3" />
              <circle
                cx="60" cy="60" r="50" fill="none" stroke="url(#goldGradient)" strokeWidth="3"
                strokeLinecap="round" strokeDasharray="314" strokeDashoffset="314"
                className="golden-ring-progress"
              />
              <defs>
                <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#D4AF37" />
                  <stop offset="50%" stopColor="#FFD700" />
                  <stop offset="100%" stopColor="#8B6914" />
                </linearGradient>
              </defs>
            </svg>
            <div className="ring-particles">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="ring-particle" style={{ animationDelay: `${i * 0.12}s` }} />
              ))}
            </div>
            <div className="ring-logo">
              <div className="ring-logo-icon">
                <i className="fas fa-film" />
              </div>
            </div>
          </div>
          <div className="preloader-brand">
            <span className="preloader-letter" style={{ animationDelay: '0.1s' }}>L</span>
            <span className="preloader-letter" style={{ animationDelay: '0.2s' }}>O</span>
            <span className="preloader-letter" style={{ animationDelay: '0.3s' }}>R</span>
            <span className="preloader-letter" style={{ animationDelay: '0.4s' }}>E</span>
            <span className="preloader-letter" style={{ animationDelay: '0.5s' }}>S</span>
            <span className="preloader-letter" style={{ animationDelay: '0.6s' }}>S</span>
            <span className="preloader-letter" style={{ animationDelay: '0.7s' }}>T</span>
            <span className="preloader-letter" style={{ animationDelay: '0.8s' }}>R</span>
            <span className="preloader-letter" style={{ animationDelay: '0.9s' }}>E</span>
            <span className="preloader-letter" style={{ animationDelay: '1s' }}>M</span>
          </div>
        </div>
      </div>
    )
  }

  const displayMovies = movies.length > 0 ? movies.slice(0, 6) : MOCK_MOVIES

  return (
    <div className="landing">
      <div
        className="spotlight-cursor"
        style={{
          '--cursor-x': `${cursorPos.x}px`,
          '--cursor-y': `${cursorPos.y}px`
        }}
      />
      <div className="film-grain" />

      <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div className="nav-logo-icon">
            <i className="fas fa-film" />
          </div>
          <div>
            <div className="nav-brand-text">LORESSTREM</div>
            <div className="nav-brand-subtext">Streaming</div>
          </div>
        </Link>
        <div style={{ display: 'flex', gap: 28 }} className="hide-mobile">
          <Link to="/search" className="nav-link">Movies</Link>
          <Link to="/pricing" className="nav-link">Pricing</Link>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link to="/login" className="btn btn-ghost btn-sm hide-mobile">Sign In</Link>
          <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
        </div>
      </nav>

      <section className="hero-section">
        <canvas ref={canvasRef} className="hero-canvas" />
        <div className="hero-gradient-overlay" />

        <div className="hero-floating-cards">
          {MOCK_MOVIES.map((m, i) => (
            <div
              key={i}
              className={`floating-card card-layer-${(i % 3) + 1}`}
              style={{
                left: `${8 + i * 15}%`,
                top: `${15 + (i % 3) * 20}%`,
                '--rot': `${-8 + i * 3}deg`,
                animationDuration: `${3.5 + i * 0.8}s`,
                animationDelay: `${i * 0.35}s`
              }}
            >
              <div className="floating-card-inner">
                <div className="floating-card-placeholder" style={{ background: `linear-gradient(135deg, ${m.color}, #0a0a0f)` }}>
                  <div className="floating-card-title">{m.title}</div>
                  <i className="fas fa-film floating-card-icon" />
                </div>
                <div className="floating-card-glare" />
              </div>
            </div>
          ))}
        </div>

        <div className="hero-content">
          <div className="hero-eyebrow">
            <div className="hero-eyebrow-dot" />
            Nigeria's Premium Cinema Platform
          </div>
          <h1 className="hero-title">
            Watch Movies<br />
            <span className="hero-title-gold">Like Never Before</span>
          </h1>
          <p className="hero-tagline">
            Unlimited HD streaming, zero ads, and new releases every week.
            Your cinema, your rules — from ₦1,000/month.
          </p>
          <div className="hero-cta-row">
            <Link to="/register" className="hero-btn-primary hero-btn-pulse">
              <i className="fas fa-play" /> Start Watching Free
            </Link>
            <Link to="/pricing" className="hero-btn-outline">
              <i className="fas fa-crown" /> View Plans
            </Link>
          </div>
          <div className="hero-trust">
            {['No credit card required', 'Cancel anytime', 'Paystack secured', 'HD 1080p quality'].map(t => (
              <div key={t} className="trust-item">
                <div className="trust-check"><i className="fas fa-check" /></div>
                {t}
              </div>
            ))}
          </div>
        </div>

        <div className="live-watching">
          <div className="live-dot" />
          <span>{liveCount.toLocaleString()} people watching now</span>
        </div>

        <div className="countdown-banner">
          <div className="countdown-label">Next Premiere</div>
          <div className="countdown-timer">
            <div className="countdown-digit"><span>{countdown.hrs}</span><small>HRS</small></div>
            <div className="countdown-separator">:</div>
            <div className="countdown-digit"><span>{countdown.min}</span><small>MIN</small></div>
            <div className="countdown-separator">:</div>
            <div className="countdown-digit"><span>{countdown.sec}</span><small>SEC</small></div>
          </div>
        </div>
      </section>

      <div className="stats-bar">
        <div className="stat-item">
          <div className="stat-num">{counters.users.toLocaleString()}+</div>
          <div className="stat-label">Active Users</div>
        </div>
        <div className="stat-item">
          <div className="stat-num">{counters.movies}+</div>
          <div className="stat-label">Movies & Series</div>
        </div>
        <div className="stat-item">
          <div className="stat-num">{counters.subscribers.toLocaleString()}+</div>
          <div className="stat-label">Subscribers</div>
        </div>
        <div className="stat-item">
          <div className="stat-num">₦1,000</div>
          <div className="stat-label">Per Month</div>
        </div>
      </div>

      <section className="landing-section" style={{ background: 'var(--bg0)' }}>
        <div className="section-header-row">
          <div>
            <div className="section-eyebrow"><i className="fas fa-fire" style={{ color: 'var(--crim3)' }} /> Trending Now</div>
            <h2 className="section-title">What's <span className="text-gold">Hot</span> This Week</h2>
          </div>
          <Link to="/register" className="view-all-link">View all →</Link>
        </div>

        <div className="genre-filter-bar">
          {['All', 'Action', 'Drama', 'Sci-Fi', 'Horror', 'Comedy', 'Thriller'].map(g => (
            <button
              key={g}
              className={`genre-filter-btn ${activeGenre === g ? 'active' : ''}`}
              onClick={() => setActiveGenre(g)}
            >
              {g}
            </button>
          ))}
        </div>

        <div className="preview-movies-grid">
          {displayMovies.map((movie, i) => (
            <div key={i} className="movie-card reveal" onClick={() => navigate('/register')}>
              <div className="movie-card-poster">
                {movie.posterImage ? (
                  <img src={movie.posterImage} alt={movie.title} className="movie-poster-img" loading="lazy" />
                ) : (
                  <div className="movie-poster-placeholder" style={{ backgroundImage: `url(${POSTER_BG[i]})` }}>
                    <div className="movie-poster-fallback">
                      <i className="fas fa-film" />
                      <span>{movie.title}</span>
                    </div>
                  </div>
                )}
                <div className="movie-card-overlay">
                  <div className="movie-play-btn">
                    <i className="fas fa-play" />
                  </div>
                </div>
                <div className="movie-card-glare" />
                <div className="movie-badge-row">
                  {movie.rating >= 4.8 && <div className="movie-badge hot">HOT</div>}
                  {i === 0 && <div className="movie-badge new">NEW</div>}
                  {i > 1 && <div className="movie-badge pro">PRO</div>}
                </div>
                <div className="movie-card-info">
                  {movie.rating > 0 && (
                    <div className="movie-rating">
                      <i className="fas fa-star" /> {parseFloat(movie.rating).toFixed(1)}
                    </div>
                  )}
                  <div className="movie-duration">2h 14m</div>
                </div>
              </div>
              <div className="movie-card-details">
                <div className="movie-title">{movie.title || `Movie ${i + 1}`}</div>
                <div className="movie-meta">
                  {movie.releaseYear || movie.year || '2024'}
                  <span className="movie-dot-sep">·</span>
                  {movie.genre?.[0] || movie.genre || GENRES[i % GENRES.length]}
                  <span className="movie-dot-sep">·</span>
                  <span className="movie-quality">HD</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section social-proof-section" style={{ background: 'var(--bg1)' }}>
        <div className="landing-section-header">
          <div className="section-eyebrow">Trusted By Nigerians</div>
          <h2>What Our <span>Users Say</span></h2>
        </div>
        <div className="testimonial-carousel">
          <div className="testimonial-card" key={currentTestimonial}>
            <div className="testimonial-avatar">{testimonials[currentTestimonial].avatar}</div>
            <div className="testimonial-stars">
              {[...Array(5)].map((_, i) => (
                <i key={i} className={`fas fa-star ${i < testimonials[currentTestimonial].rating ? 'star-filled' : 'star-empty'}`} />
              ))}
            </div>
            <p className="testimonial-quote">"{testimonials[currentTestimonial].quote}"</p>
            <div className="testimonial-author">{testimonials[currentTestimonial].name}</div>
            <div className="testimonial-location">{testimonials[currentTestimonial].location}</div>
          </div>
          <div className="testimonial-dots">
            {testimonials.map((_, i) => (
              <div
                key={i}
                className={`testimonial-dot ${i === currentTestimonial ? 'active' : ''}`}
                onClick={() => setCurrentTestimonial(i)}
              />
            ))}
          </div>
        </div>
        <div className="featured-badges">
          <div className="featured-badge">TechCabal</div>
          <div className="featured-badge">Techpoint</div>
          <div className="featured-badge">Pulse Nigeria</div>
          <div className="featured-badge">Nairaland</div>
        </div>
        <div className="avatar-cluster">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="avatar-circle" style={{ marginLeft: i > 0 ? '-12px' : '0', zIndex: 4 - i }}>
              {String.fromCharCode(65 + i)}
            </div>
          ))}
          <div className="avatar-circle avatar-overflow" style={{ marginLeft: '-12px' }}>+1.2k</div>
        </div>
      </section>

      <section className="landing-section" style={{ background: 'var(--bg1)' }}>
        <div className="landing-section-header">
          <div className="section-eyebrow">Platform Features</div>
          <h2>Everything you need in <span>one place</span></h2>
          <p>Built for Nigeria. Powered by quality. Secured by Paystack.</p>
        </div>
        <div className="features-grid">
          {[
            { icon: 'fa-play-circle', title: 'HD Video Player', desc: '480p to full 1080p quality. Subtitle support, speed controls, and resume playback from where you left off.' },
            { icon: 'fa-download', title: 'Offline Downloads', desc: 'Download up to 5 movies per month on Standard plan. Secure expiring links protect your content.' },
            { icon: 'fa-bookmark', title: 'Smart Watchlist', desc: 'Like, rate, and save movies. Your full watch history synced and accessible from any device.' },
            { icon: 'fa-shield-alt', title: 'Secure Payments', desc: 'Powered by Paystack. Instant subscription activation, webhook-verified, full transaction history.' },
            { icon: 'fa-bell', title: 'New Releases Weekly', desc: 'Standard subscribers get early access. Email notifications keep you first in line every time.' },
            { icon: 'fa-chart-bar', title: 'Admin Dashboard', desc: 'Full content management, user analytics, revenue tracking, and subscription oversight in one panel.' }
          ].map((f, i) => (
            <div key={i} className="feature-card reveal" style={{ transitionDelay: `${i * 0.08}s` }}>
              <div className="feature-icon"><i className={`fas ${f.icon}`} /></div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section vibe-quiz-section" style={{ background: 'var(--bg0)' }}>
        <div className="landing-section-header">
          <div className="section-eyebrow">Quick Picker</div>
          <h2>What's Your <span>Vibe</span> Tonight?</h2>
        </div>
        <div className="vibe-options">
          {[
            { icon: 'fa-video', label: 'Blockbuster' },
            { icon: 'fa-heart', label: 'Romance' },
            { icon: 'fa-laugh', label: 'Comedy' },
            { icon: 'fa-ghost', label: 'Horror' },
            { icon: 'fa-fist-raised', label: 'Action' },
            { icon: 'fa-brain', label: 'Mystery' }
          ].map((v, i) => (
            <div key={i} className="vibe-card reveal" style={{ transitionDelay: `${i * 0.06}s` }}>
              <div className="vibe-icon"><i className={`fas ${v.icon}`} /></div>
              <div className="vibe-label">{v.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section" style={{ background: 'var(--bg0)' }}>
        <div className="landing-section-header">
          <div className="section-eyebrow">Pricing</div>
          <h2>Simple, <span>Transparent</span> Plans</h2>
          <p>Start free. Upgrade when you're ready. No hidden fees.</p>
        </div>
        <div className="pricing-grid">
          <div className="plan-card free reveal">
            <div className="plan-name free">Free Plan</div>
            <div className="plan-price free">₦0 <sub>/ forever</sub></div>
            <p className="plan-desc">Perfect for discovering Loresstrem.</p>
            <ul className="plan-features">
              {[
                { text: 'Limited movie library', has: true },
                { text: '480p streaming', has: true },
                { text: 'Basic watchlist', has: true },
                { text: 'Ads enabled', has: false },
                { text: 'No HD access', has: false },
                { text: 'No downloads', has: false }
              ].map((f, i) => (
                <li key={i} className={`plan-feature ${f.has ? 'has' : 'no'}`}>
                  <div className="plan-feature-icon"><i className={`fas ${f.has ? 'fa-check' : 'fa-times'}`} /></div>
                  {f.text}
                </li>
              ))}
            </ul>
            <Link to="/register" className="plan-btn free-btn">Continue Free</Link>
          </div>
          <div className="plan-card premium reveal" style={{ transitionDelay: '0.1s' }}>
            <div className="plan-popular">Most Popular</div>
            <div className="plan-name premium">Standard Plan</div>
            <div className="plan-price premium">₦1,000 <sub>/ month</sub></div>
            <p className="plan-desc" style={{ color: 'var(--txt2)' }}>Full premium cinema experience.</p>
            <ul className="plan-features">
              {[
                { text: 'Full movie library', has: true },
                { text: 'HD 720p & 1080p', has: true },
                { text: 'Zero ads', has: true },
                { text: '5 downloads / month', has: true },
                { text: 'Early release access', has: true },
                { text: 'Email notifications', has: true }
              ].map((f, i) => (
                <li key={i} className="plan-feature has">
                  <div className="plan-feature-icon"><i className="fas fa-check" /></div>
                  {f.text}
                </li>
              ))}
            </ul>
            <Link to="/register" className="plan-btn premium-btn">
              <i className="fas fa-crown" style={{ marginRight: 6 }} />Upgrade with Paystack
            </Link>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-glow" />
        <h2 className="cta-title">Ready to start <span>watching?</span></h2>
        <p className="cta-sub">Join over 4,800 movie lovers streaming on Loresstrem right now.</p>
        <div className="cta-btns">
          <Link to="/register" className="hero-btn-primary hero-btn-pulse">
            <i className="fas fa-user-plus" /> Create Free Account
          </Link>
          <Link to="/login" className="hero-btn-outline">Sign In</Link>
        </div>
        <p className="cta-note">
          Payments secured by <span>Paystack</span> · Cancel anytime · Instant activation
        </p>
      </section>

      <Footer />

      {currentToast && (
        <div className="toast-container" key={currentToast.id}>
          <div className="toast-notification">
            <div className="toast-avatar">{currentToast.name.split(' ')[0].charAt(0)}{currentToast.name.split(' ')[1]?.charAt(0) || ''}</div>
            <div className="toast-text">
              <div className="toast-name">{currentToast.name} from {currentToast.location}</div>
              <div className="toast-action">{currentToast.action}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}