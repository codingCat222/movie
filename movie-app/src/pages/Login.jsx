import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import './Login.css'

export default function Login() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const canvasRef = useRef(null)
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const from = location.state?.from?.pathname || '/dashboard'

  useEffect(() => {
    if (user) navigate(from, { replace: true })
  }, [user])

  // Three.js canvas
    useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let animId
    const tryInit = () => {
      if (!window.THREE) { setTimeout(tryInit, 200); return }
      const THREE = window.THREE
      const W = canvas.clientWidth || 800, H = canvas.clientHeight || 900
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false })
      renderer.setSize(W, H)
      renderer.setClearColor(0x04030A, 1)
      const scene = new THREE.Scene()
      const cam = new THREE.PerspectiveCamera(70, W / H, 0.1, 100)
      cam.position.z = 5

      const makePoints = (n, color, size, spread) => {
        const geo = new THREE.BufferGeometry()
        const pos = new Float32Array(n * 3)
        for (let i = 0; i < n; i++) {
          pos[i*3] = (Math.random()-0.5)*spread
          pos[i*3+1] = (Math.random()-0.5)*spread
          pos[i*3+2] = (Math.random()-0.5)*4
        }
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
        return new THREE.Points(geo, new THREE.PointsMaterial({ color, size, transparent: true, opacity: 0.55 }))
      }
      scene.add(makePoints(200, 0xD4AF37, 0.04, 20))
      scene.add(makePoints(100, 0x8B0000, 0.055, 18))

      const rings = []
      ;[[3, 0x8B6914, 0.1],[5, 0xD4AF37, 0.05],[7, 0x3D1F00, 0.12]].forEach(([r,c,o], i) => {
        const m = new THREE.Mesh(
          new THREE.TorusGeometry(r, 0.007, 6, 90),
          new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o })
        )
        m.rotation.x = Math.PI/2 + i*0.4
        m.position.set(3, -1, -4)
        scene.add(m); rings.push(m)
      })

      let t = 0
      const loop = () => {
        animId = requestAnimationFrame(loop)
        t += 0.005
        scene.children[0].rotation.y = t * 0.02
        scene.children[1].rotation.y = -t * 0.018
        rings.forEach((r, i) => r.rotation.z = t * (0.08 + i * 0.025))
        renderer.render(scene, cam)
      }
      loop()
    }
    if (!window.THREE && !document.querySelector('script[src*="three.min.js"]')) {
      const s = document.createElement('script')
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
      s.onload = tryInit
      document.head.appendChild(s)
    } else if (window.THREE) {
      tryInit()
    }
    return () => cancelAnimationFrame(animId)
  }, [])

  const validate = () => {
    const e = {}
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.password) e.password = 'Password is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleChange = (e) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
    if (errors[e.target.name]) setErrors(p => ({ ...p, [e.target.name]: '' }))
    setApiError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setApiError('')
    try {
      await login(form)
      navigate(from, { replace: true })
    } catch (err) {
      setApiError(err.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <canvas ref={canvasRef} className="auth-canvas"></canvas>

      {/* Left branding */}
      <div className="auth-left">
        <Link to="/" className="auth-logo">
          <div className="auth-logo-icon"><i className="fas fa-film"></i></div>
          <div>
            <div className="auth-logo-text">CINEMAX</div>
            <div className="auth-logo-sub">Streaming</div>
          </div>
        </Link>

        <h2 className="auth-left-headline">
          Your personal<br /><span>cinema</span> awaits.
        </h2>
        <p className="auth-left-sub">
          Stream hundreds of movies in crystal-clear HD. No ads. No limits.
          Just pure cinematic experience from ₦1,000/month.
        </p>

        <div className="auth-features">
          {[
            { icon: 'fa-play-circle', title: 'HD Streaming', desc: '720p & 1080p quality' },
            { icon: 'fa-ban', title: 'Zero Ads', desc: 'Uninterrupted viewing' },
            { icon: 'fa-download', title: 'Offline Downloads', desc: '5 movies per month' },
            { icon: 'fa-bell', title: 'Early Access', desc: 'New releases first' },
          ].map((f, i) => (
            <div key={i} className="auth-feature">
              <div className="auth-feature-icon"><i className={`fas ${f.icon}`}></i></div>
              <div className="auth-feature-text">
                <strong>{f.title}</strong>
                <span>{f.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right form */}
      <div className="auth-right">
        <div className="auth-form-header">
          <h2>Welcome back</h2>
          <p>
            Don't have an account?{' '}
            <Link to="/register">Create one free</Link>
          </p>
        </div>

        {apiError && (
          <div className="auth-error-banner">
            <i className="fas fa-exclamation-circle"></i>
            {apiError}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              name="email"
              className={`form-input ${errors.email ? 'input-error' : ''}`}
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              style={{ borderColor: errors.email ? 'var(--crim3)' : undefined }}
            />
            {errors.email && <div className="form-error"><i className="fas fa-exclamation-circle" style={{ marginRight:4 }}></i>{errors.email}</div>}
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display:'flex', justifyContent:'space-between' }}>
              Password
              <span style={{ fontSize:11, color:'var(--gold3)', cursor:'pointer', fontWeight:400, letterSpacing:0 }}>Forgot password?</span>
            </label>
            <div className="input-with-icon">
              <input
                type={showPass ? 'text' : 'password'}
                name="password"
                className="form-input"
                placeholder="Your password"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
                style={{ borderColor: errors.password ? 'var(--crim3)' : undefined }}
              />
              <button type="button" className="input-icon-btn" onClick={() => setShowPass(p => !p)}>
                <i className={`fas ${showPass ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
            {errors.password && <div className="form-error"><i className="fas fa-exclamation-circle" style={{ marginRight:4 }}></i>{errors.password}</div>}
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading
              ? <><div className="btn-spinner"></div> Signing in...</>
              : <><i className="fas fa-sign-in-alt"></i> Sign In</>
            }
          </button>
        </form>

        <div className="auth-divider">
          <div className="auth-divider-line"></div>
          <span>or</span>
          <div className="auth-divider-line"></div>
        </div>

        <Link to="/register" className="btn btn-ghost" style={{ width:'100%', justifyContent:'center' }}>
          <i className="fas fa-user-plus"></i> Create a Free Account
        </Link>

        <p className="auth-footer-note">
          By signing in you agree to our{' '}
          <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
          <br />Payments secured by <a href="#" style={{ color:'var(--gold)' }}>Paystack</a>.
        </p>
      </div>
    </div>
  )
}