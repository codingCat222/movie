import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { paymentService } from '../services/paymentService.js'
import './Pricing.css'

const FREE_FEATURES = [
  { text: 'Limited movie library', ok: true },
  { text: '480p streaming quality', ok: true },
  { text: 'Basic watchlist', ok: true },
  { text: 'Watch history', ok: true },
  { text: 'Ads enabled', ok: false },
  { text: 'HD 720p / 1080p', ok: false },
  { text: 'Download movies', ok: false },
  { text: 'Early release access', ok: false },
]

const PREMIUM_FEATURES = [
  { text: 'Full movie library', ok: true },
  { text: 'HD 720p & 1080p streaming', ok: true },
  { text: 'Zero ads — ever', ok: true },
  { text: '5 downloads per month', ok: true },
  { text: 'Early release access', ok: true },
  { text: 'Email notifications', ok: true },
  { text: 'Secure download links', ok: true },
  { text: 'Priority support', ok: true },
]

const COMPARE_ROWS = [
  { label: 'Movie Library', free: 'Limited', premium: 'Full Access' },
  { label: 'Video Quality', free: '480p only', premium: '480p / 720p / 1080p' },
  { label: 'Ads', free: '✗', premium: '✓ Ad-Free' },
  { label: 'Downloads', free: '✗', premium: '5 / month' },
  { label: 'Early Access', free: '✗', premium: '✓' },
  { label: 'Watchlist', free: '✓', premium: '✓' },
  { label: 'Watch History', free: '✓', premium: '✓' },
  { label: 'Email Alerts', free: '✗', premium: '✓' },
]

export default function Pricing() {
  const { user, isPremium } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleUpgrade = async () => {
    if (!user) { navigate('/register', { state: { from: { pathname: '/pricing' } } }); return }
    if (isPremium()) return
    setLoading(true); setError('')
    try {
      const res = await paymentService.initializePayment()
      window.location.href = res.data.authorizationUrl
    } catch (err) {
      setError(err.response?.data?.message || 'Payment initialization failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="pricing-page page-wrapper">

      {/* Hero */}
      <div className="pricing-hero fade-in">
        <div className="pricing-hero-eyebrow">
          <i className="fas fa-crown"></i> Plans & Pricing
        </div>
        <h1>Simple, <span>Transparent</span> Pricing</h1>
        <p>Start free. Upgrade when you're ready. No hidden fees. Cancel anytime.</p>
      </div>

      {/* Error */}
      {error && (
        <div style={{ maxWidth:480, margin:'0 auto 24px', padding:'12px 20px', background:'rgba(139,0,0,0.15)', border:'1px solid rgba(192,57,43,0.3)', borderRadius:8, color:'var(--crim3)', fontSize:13, textAlign:'center' }}>
          <i className="fas fa-exclamation-circle" style={{ marginRight:8 }}></i>{error}
        </div>
      )}

      {/* Cards */}
      <div className="pricing-cards-wrap">
        {/* Free */}
        <div className="pricing-card fade-in-up">
          <div className="pricing-card-plan free">Free Plan</div>
          <div className="pricing-card-price free">₦0 <sub>/ forever</sub></div>
          <p className="pricing-card-desc">Perfect for discovering what Cinemax has to offer.</p>
          <div className="pricing-card-divider"></div>
          <ul className="pricing-card-features">
            {FREE_FEATURES.map((f, i) => (
              <li key={i} className={`pricing-feat ${f.ok ? 'ok' : 'no'}`}>
                <div className="pricing-feat-ic">
                  <i className={`fas ${f.ok ? 'fa-check' : 'fa-times'}`}></i>
                </div>
                {f.text}
              </li>
            ))}
          </ul>
          {user
            ? <div style={{ width:'100%', padding:14, textAlign:'center', background:'rgba(255,255,255,0.04)', borderRadius:8, fontSize:13, color:'var(--txt3)', border:'1px solid var(--border)' }}>
                <i className="fas fa-check-circle" style={{ marginRight:6, color:'var(--txt4)' }}></i>Your current plan
              </div>
            : <Link to="/register" className="pricing-card-btn free-btn">
                <i className="fas fa-user-plus"></i> Get Started Free
              </Link>
          }
        </div>

        {/* Standard */}
        <div className="pricing-card featured fade-in-up" style={{ animationDelay:'0.1s' }}>
          <div className="pricing-card-badge"><i className="fas fa-crown" style={{ marginRight:5 }}></i>Most Popular</div>
          <div className="pricing-card-plan premium">⭐ Standard Plan</div>
          <div className="pricing-card-price premium">₦1,000 <sub>/ month</sub></div>
          <p className="pricing-card-desc" style={{ color:'var(--txt2)' }}>Full premium cinema experience. Everything unlocked.</p>
          <div className="pricing-card-divider" style={{ background:'rgba(212,175,55,0.2)' }}></div>
          <ul className="pricing-card-features">
            {PREMIUM_FEATURES.map((f, i) => (
              <li key={i} className="pricing-feat ok">
                <div className="pricing-feat-ic"><i className="fas fa-check"></i></div>
                {f.text}
              </li>
            ))}
          </ul>

          {isPremium() ? (
            <div className="already-subscribed">
              <i className="fas fa-check-circle"></i>
              You're on Standard — active until{' '}
              {user?.subscription?.expiryDate
                ? new Date(user.subscription.expiryDate).toLocaleDateString('en-NG', { day:'numeric', month:'short', year:'numeric' })
                : 'N/A'
              }
            </div>
          ) : (
            <button
              className="pricing-card-btn premium-btn"
              onClick={handleUpgrade}
              disabled={loading}
            >
              {loading
                ? <><div style={{ width:16, height:16, border:'2px solid rgba(0,0,0,0.3)', borderTopColor:'#000', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}></div> Redirecting...</>
                : <><i className="fas fa-credit-card"></i> Upgrade with Paystack</>
              }
            </button>
          )}

          <div style={{ textAlign:'center', marginTop:14, fontSize:12, color:'var(--txt4)' }}>
            <i className="fas fa-lock" style={{ marginRight:5 }}></i>
            Secured by Paystack · Cancel anytime
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="pricing-compare">
        <h2>Feature <span>Comparison</span></h2>
        <table className="compare-table">
          <thead>
            <tr>
              <th>Feature</th>
              <th>Free</th>
              <th className="gold">Standard</th>
            </tr>
          </thead>
          <tbody>
            {COMPARE_ROWS.map((row, i) => (
              <tr key={i}>
                <td style={{ color:'var(--txt)', fontWeight:500 }}>{row.label}</td>
                <td>
                  {row.free === '✗'
                    ? <i className="fas fa-times compare-no"></i>
                    : row.free === '✓'
                      ? <i className="fas fa-check compare-yes"></i>
                      : <span style={{ color:'var(--txt3)' }}>{row.free}</span>
                  }
                </td>
                <td>
                  {row.premium === '✗'
                    ? <i className="fas fa-times compare-no"></i>
                    : row.premium.startsWith('✓')
                      ? <span style={{ color:'var(--gold)' }}><i className="fas fa-check"></i>{row.premium.slice(1)}</span>
                      : <span style={{ color:'var(--gold)', fontWeight:500 }}>{row.premium}</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Guarantee */}
      <div className="pricing-guarantee">
        <div className="pricing-guarantee-icon"><i className="fas fa-shield-alt"></i></div>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:15, fontWeight:600, color:'var(--txt)', marginBottom:4 }}>
            Cancel Anytime Guarantee
          </div>
          <div style={{ fontSize:13, color:'var(--txt3)', lineHeight:1.6 }}>
            No long-term contracts. Cancel your Standard plan at any time with no penalties.
            You'll retain access until the end of your billing period.
            Payments are processed securely by <strong style={{ color:'var(--gold3)' }}>Paystack</strong>.
          </div>
        </div>
        {!isPremium() && (
          <button className="btn btn-primary" onClick={handleUpgrade} disabled={loading} style={{ flexShrink:0 }}>
            <i className="fas fa-crown"></i> Upgrade Now
          </button>
        )}
      </div>

      {/* FAQ */}
      <div style={{ padding:'48px 40px 0', maxWidth:720, margin:'0 auto' }}>
        <h2 style={{ fontFamily:'Playfair Display,serif', fontSize:'1.6rem', color:'var(--txt)', textAlign:'center', marginBottom:28 }}>
          Frequently Asked <span style={{ color:'var(--gold)' }}>Questions</span>
        </h2>
        {[
          { q: 'How does billing work?', a: 'You are billed ₦1,000 per month. Payment is processed securely via Paystack and your subscription activates instantly after payment.' },
          { q: 'Can I cancel my subscription?', a: 'Yes, you can cancel at any time. Your access continues until the end of the billing period. No refunds are issued for partial months.' },
          { q: 'What happens when I downgrade to Free?', a: 'You lose access to HD streaming, downloads, and premium-only movies. Your watchlist and history are preserved.' },
          { q: 'How many devices can I use?', a: 'Your account can be used on any device — phone, tablet, or desktop. Stream from any browser.' },
          { q: 'What does "5 downloads per month" mean?', a: 'Each calendar month you can generate up to 5 secure download links. Links expire after 48 hours for security.' },
        ].map((faq, i) => (
          <FaqItem key={i} q={faq.q} a={faq.a} />
        ))}
      </div>
    </div>
  )
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderBottom:'1px solid var(--border)', marginBottom:0 }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width:'100%', background:'none', border:'none', padding:'18px 0',
        display:'flex', justifyContent:'space-between', alignItems:'center',
        cursor:'pointer', textAlign:'left', gap:16
      }}>
        <span style={{ fontSize:15, fontWeight:500, color: open ? 'var(--gold)' : 'var(--txt)', transition:'color 0.2s' }}>{q}</span>
        <i className={`fas fa-chevron-${open ? 'up' : 'down'}`} style={{ color:'var(--txt3)', fontSize:12, flexShrink:0, transition:'transform 0.2s' }}></i>
      </button>
      {open && (
        <div style={{ fontSize:14, color:'var(--txt3)', lineHeight:1.7, paddingBottom:18, animation:'fadeInUp 0.2s ease' }}>
          {a}
        </div>
      )}
    </div>
  )
}