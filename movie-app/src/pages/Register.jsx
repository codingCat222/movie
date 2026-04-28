import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import './Login.css'

export default function Register() {
  const { register, user } = useAuth()
  const navigate = useNavigate()
  const canvasRef = useRef(null)
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [strength, setStrength] = useState(0)

  useEffect(() => { if (user) navigate('/dashboard') }, [user])

  // Reuse Three.js init from Login
    useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let animId
    const tryInit = () => {
      if (!window.THREE) { setTimeout(tryInit, 200); return }
      const THREE = window.THREE
      const W = canvas.clientWidth || 800, H = canvas.clientHeight || 900
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false })
      renderer.setSize(W, H); renderer.setClearColor(0x04030A, 1)
      const scene = new THREE.Scene()
      const cam = new THREE.PerspectiveCamera(70, W / H, 0.1, 100); cam.position.z = 5
      const geo = new THREE.BufferGeometry()
      const pos = new Float32Array(280 * 3)
      for (let i = 0; i < 280; i++) { pos[i*3]=(Math.random()-0.5)*20; pos[i*3+1]=(Math.random()-0.5)*20; pos[i*3+2]=(Math.random()-0.5)*4 }
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
      const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xD4AF37, size: 0.038, transparent: true, opacity: 0.5 }))
      scene.add(pts)
      const rings = []
      ;[[3.5, 0xD4AF37, 0.08],[5.5, 0x8B6914, 0.05],[7.5, 0x8B0000, 0.1]].forEach(([r,c,o],i) => {
        const m = new THREE.Mesh(new THREE.TorusGeometry(r, 0.006, 6, 90), new THREE.MeshBasicMaterial({ color:c, transparent:true, opacity:o }))
        m.rotation.x = Math.PI/2 + i*0.3; m.position.set(-3, 1, -4); scene.add(m); rings.push(m)
      })
      let t = 0
      const loop = () => { animId = requestAnimationFrame(loop); t += 0.005; pts.rotation.y = t*0.02; rings.forEach((r,i)=>r.rotation.z=t*(0.07+i*0.02)); renderer.render(scene,cam) }
      loop()
    }
    if (window.THREE) { tryInit(); }
    else if (!document.querySelector('script[src*="three.min.js"]')) { 
      const s = document.createElement('script'); 
      s.src='https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'; 
      s.onload=tryInit; 
      document.head.appendChild(s); 
    }
    return () => cancelAnimationFrame(animId)
  }, [])
  const calcStrength = (pwd) => {
    let s = 0
    if (pwd.length >= 8) s++
    if (/[A-Z]/.test(pwd)) s++
    if (/[0-9]/.test(pwd)) s++
    if (/[^A-Za-z0-9]/.test(pwd)) s++
    setStrength(s)
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Full name is required'
    else if (form.name.trim().length < 2) e.name = 'Name must be at least 2 characters'
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email address'
    if (!form.password) e.password = 'Password is required'
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters'
    if (!form.confirm) e.confirm = 'Please confirm your password'
    else if (form.password !== form.confirm) e.confirm = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(p => ({ ...p, [name]: value }))
    if (name === 'password') calcStrength(value)
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }))
    setApiError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true); setApiError('')
    try {
      await register({ name: form.name.trim(), email: form.email.trim(), password: form.password })
      navigate('/dashboard')
    } catch (err) {
      setApiError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally { setLoading(false) }
  }

  const strengthColors = ['', 'var(--crim3)', '#f39c12', '#3498db', '#2ecc71']
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong']

  return (
    <div className="auth-page">
      <canvas ref={canvasRef} className="auth-canvas"></canvas>

      {/* Left branding */}
      <div className="auth-left">
        <Link to="/" className="auth-logo">
          <div className="auth-logo-icon"><i className="fas fa-film"></i></div>
          <div>
            <div className="auth-logo-text">LORESSTREM</div>
            <div className="auth-logo-sub">Streaming</div>
          </div>
        </Link>
        <h2 className="auth-left-headline">
          Join <span>4,800+</span><br />movie lovers.
        </h2>
        <p className="auth-left-sub">
          Create your free account and start streaming instantly.
          Upgrade to Standard at any time for full HD and no ads.
        </p>
        <div className="auth-features">
          {[
            { icon: 'fa-user-plus', title: 'Free Forever', desc: 'No credit card required' },
            { icon: 'fa-film', title: 'Instant Access', desc: 'Start watching immediately' },
            { icon: 'fa-crown', title: 'Upgrade Anytime', desc: 'Standard from ₦1,000/month' },
            { icon: 'fa-lock', title: 'Secure & Private', desc: 'Your data is protected' },
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
      <div className="auth-right" style={{ overflowY: 'auto' }}>
        <div className="auth-form-header">
          <h2>Create account</h2>
          <p>Already have an account? <Link to="/login">Sign in</Link></p>
        </div>

        {apiError && (
          <div className="auth-error-banner">
            <i className="fas fa-exclamation-circle"></i>{apiError}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {/* Name */}
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text" name="name" className="form-input"
              placeholder="John Doe" value={form.name} onChange={handleChange}
              autoComplete="name"
              style={{ borderColor: errors.name ? 'var(--crim3)' : undefined }}
            />
            {errors.name && <div className="form-error"><i className="fas fa-exclamation-circle" style={{ marginRight:4 }}></i>{errors.name}</div>}
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email" name="email" className="form-input"
              placeholder="you@example.com" value={form.email} onChange={handleChange}
              autoComplete="email"
              style={{ borderColor: errors.email ? 'var(--crim3)' : undefined }}
            />
            {errors.email && <div className="form-error"><i className="fas fa-exclamation-circle" style={{ marginRight:4 }}></i>{errors.email}</div>}
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-with-icon">
              <input
                type={showPass ? 'text' : 'password'} name="password" className="form-input"
                placeholder="Min. 6 characters" value={form.password} onChange={handleChange}
                autoComplete="new-password"
                style={{ borderColor: errors.password ? 'var(--crim3)' : undefined }}
              />
              <button type="button" className="input-icon-btn" onClick={() => setShowPass(p => !p)}>
                <i className={`fas ${showPass ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
            {/* Strength bar */}
            {form.password && (
              <div style={{ marginTop:8 }}>
                <div style={{ display:'flex', gap:4, marginBottom:4 }}>
                  {[1,2,3,4].map(s => (
                    <div key={s} style={{ flex:1, height:3, borderRadius:2, background: strength >= s ? strengthColors[strength] : 'var(--bg4)', transition:'background 0.3s' }}></div>
                  ))}
                </div>
                {strength > 0 && <div style={{ fontSize:11, color: strengthColors[strength] }}>{strengthLabels[strength]} password</div>}
              </div>
            )}
            {errors.password && <div className="form-error"><i className="fas fa-exclamation-circle" style={{ marginRight:4 }}></i>{errors.password}</div>}
          </div>

          {/* Confirm */}
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <div className="input-with-icon">
              <input
                type={showConfirm ? 'text' : 'password'} name="confirm" className="form-input"
                placeholder="Repeat your password" value={form.confirm} onChange={handleChange}
                autoComplete="new-password"
                style={{ borderColor: errors.confirm ? 'var(--crim3)' : form.confirm && form.password === form.confirm ? 'rgba(46,204,113,0.5)' : undefined }}
              />
              <button type="button" className="input-icon-btn" onClick={() => setShowConfirm(p => !p)}>
                <i className={`fas ${showConfirm ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
            {form.confirm && form.password === form.confirm && !errors.confirm && (
              <div style={{ fontSize:11, color:'#2ecc71', marginTop:5 }}><i className="fas fa-check-circle" style={{ marginRight:4 }}></i>Passwords match</div>
            )}
            {errors.confirm && <div className="form-error"><i className="fas fa-exclamation-circle" style={{ marginRight:4 }}></i>{errors.confirm}</div>}
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading
              ? <><div className="btn-spinner"></div> Creating account...</>
              : <><i className="fas fa-user-plus"></i> Create Free Account</>
            }
          </button>
        </form>

        <p className="auth-footer-note">
          By creating an account you agree to our{' '}
          <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
          <br />Payments secured by <a href="#" style={{ color:'var(--gold)' }}>Paystack</a>.
        </p>
      </div>
    </div>
  )
}