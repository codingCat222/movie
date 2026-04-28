import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { userService } from '../services/movieService.js'
import { paymentService } from '../services/paymentService.js'
import { authService } from '../services/authService.js'
import MovieCard from '../components/MovieCard.jsx'
import { formatDate, formatCurrency, formatDuration } from '../utils/helpers.js'
import './Dashboard.css'

const TABS = [
  { id: 'profile', label: 'Profile', icon: 'fa-user' },
  { id: 'subscription', label: 'Subscription', icon: 'fa-crown' },
  { id: 'history', label: 'Watch History', icon: 'fa-history' },
  { id: 'watchlist', label: 'Watchlist', icon: 'fa-bookmark' },
  { id: 'transactions', label: 'Transactions', icon: 'fa-receipt' },
]

export default function Dashboard() {
  const { user, updateUser, isPremium, logout } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'profile'
  const setTab = (t) => setSearchParams({ tab: t })

  const [watchHistory, setWatchHistory] = useState([])
  const [watchlist, setWatchlist] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loadingData, setLoadingData] = useState(false)
  const [toast, setToast] = useState(null)

  // Profile edit
  const [editMode, setEditMode] = useState(false)
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', email: user?.email || '' })
  const [avatarFile, setAvatarFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const avatarInput = useRef(null)

  // Password change
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [pwLoading, setPwLoading] = useState(false)

  const showToast = (msg, type = 'info') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000) }

  useEffect(() => {
    const loadTabData = async () => {
      setLoadingData(true)
      try {
        if (activeTab === 'history') {
          const r = await userService.getWatchHistory(); setWatchHistory(r.data.history || [])
        } else if (activeTab === 'watchlist') {
          const r = await userService.getWatchlist(); setWatchlist(r.data.watchlist || [])
        } else if (activeTab === 'transactions') {
          const r = await paymentService.getHistory(); setTransactions(r.data.transactions || [])
        }
      } catch { }
      finally { setLoadingData(false) }
    }
    loadTabData()
  }, [activeTab])

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('name', profileForm.name)
      fd.append('email', profileForm.email)
      if (avatarFile) fd.append('avatar', avatarFile)
      const res = await authService.updateProfile(fd)
      updateUser(res.data.user)
      setEditMode(false)
      showToast('Profile updated', 'success')
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update profile', 'error')
    } finally { setSaving(false) }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (pwForm.newPassword !== pwForm.confirm) { showToast('Passwords do not match', 'error'); return }
    if (pwForm.newPassword.length < 6) { showToast('Password must be at least 6 characters', 'error'); return }
    setPwLoading(true)
    try {
      await authService.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword })
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' })
      showToast('Password changed successfully', 'success')
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to change password', 'error')
    } finally { setPwLoading(false) }
  }

  const handleRemoveFromWatchlist = async (movieId) => {
    try {
      await userService.toggleWatchlist(movieId)
      setWatchlist(w => w.filter(m => m._id !== movieId))
      showToast('Removed from watchlist', 'info')
    } catch { }
  }

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'
  const premium = isPremium()

  return (
    <div className="dashboard-page page-wrapper">
      {toast && <div className={`toast toast-${toast.type}`}><i className={`fas fa-${toast.type === 'success' ? 'check-circle' : toast.type === 'error' ? 'exclamation-circle' : 'info-circle'}`}></i>{toast.msg}</div>}

      <div className="dashboard-header">
        <h1>My <span>Account</span></h1>
        <div style={{ display:'flex', gap:10 }}>
          {!premium && (
            <Link to="/pricing" className="btn btn-primary btn-sm">
              <i className="fas fa-crown"></i> Upgrade Plan
            </Link>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="dashboard-stats">
        <div className="d-stat">
          <div className="d-stat-icon gold"><i className="fas fa-crown"></i></div>
          <div>
            <div className="d-stat-num">{premium ? 'Standard' : 'Free'}</div>
            <div className="d-stat-label">Current Plan</div>
          </div>
        </div>
        <div className="d-stat">
          <div className="d-stat-icon red"><i className="fas fa-eye"></i></div>
          <div>
            <div className="d-stat-num">{user?.watchHistory?.length || 0}</div>
            <div className="d-stat-label">Watched</div>
          </div>
        </div>
        <div className="d-stat">
          <div className="d-stat-icon green"><i className="fas fa-bookmark"></i></div>
          <div>
            <div className="d-stat-num">{user?.watchlist?.length || 0}</div>
            <div className="d-stat-label">Watchlist</div>
          </div>
        </div>
        <div className="d-stat">
          <div className="d-stat-icon blue"><i className="fas fa-download"></i></div>
          <div>
            <div className="d-stat-num">{premium ? `${user?.downloadCount || 0}/5` : '—'}</div>
            <div className="d-stat-label">Downloads</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="dashboard-tabs">
        {TABS.map(t => (
          <button key={t.id} className={`dashboard-tab ${activeTab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            <i className={`fas ${t.icon}`}></i> {t.label}
          </button>
        ))}
      </div>

      {/* ── PROFILE TAB ── */}
      {activeTab === 'profile' && (
        <div className="fade-in">
          <div className="profile-card">
            <div className="profile-avatar-wrap">
              <div className="profile-avatar">
                {user?.avatar ? <img src={user.avatar} alt={user.name} /> : initials}
              </div>
              <div className="profile-avatar-edit" onClick={() => avatarInput.current?.click()}>
                <i className="fas fa-camera"></i>
              </div>
              <input ref={avatarInput} type="file" accept="image/*" style={{ display:'none' }}
                onChange={e => { if (e.target.files[0]) { setAvatarFile(e.target.files[0]); setEditMode(true) } }} />
            </div>
            <div className="profile-info">
              <div className="profile-name">{user?.name}</div>
              <div className="profile-email"><i className="fas fa-envelope" style={{ marginRight:6, fontSize:12 }}></i>{user?.email}</div>
              <div className={`profile-sub-status ${premium ? 'premium' : 'free'}`}>
                <i className={`fas ${premium ? 'fa-crown' : 'fa-user'}`}></i>
                {premium ? `Standard — expires ${formatDate(user?.subscription?.expiryDate)}` : 'Free Plan'}
              </div>
            </div>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => { setEditMode(!editMode); setProfileForm({ name:user?.name||'', email:user?.email||'' }) }}>
                <i className={`fas ${editMode ? 'fa-times' : 'fa-edit'}`}></i> {editMode ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>
          </div>

          {editMode && (
            <form className="profile-edit-form" onSubmit={handleSaveProfile}>
              <div style={{ fontSize:14, fontWeight:600, color:'var(--txt)', marginBottom:20, display:'flex', alignItems:'center', gap:8 }}>
                <i className="fas fa-user-edit" style={{ color:'var(--gold)' }}></i> Edit Profile
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                <div className="form-group" style={{ margin:0 }}>
                  <label className="form-label">Full Name</label>
                  <input type="text" className="form-input" value={profileForm.name}
                    onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="form-group" style={{ margin:0 }}>
                  <label className="form-label">Email</label>
                  <input type="email" className="form-input" value={profileForm.email}
                    onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))} />
                </div>
              </div>
              {avatarFile && (
                <div style={{ marginTop:12, fontSize:12, color:'var(--txt3)' }}>
                  <i className="fas fa-image" style={{ marginRight:5, color:'var(--gold)' }}></i>
                  New avatar: {avatarFile.name}
                </div>
              )}
              <div style={{ marginTop:20, display:'flex', gap:10 }}>
                <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                  {saving ? <><div style={{ width:13, height:13, border:'2px solid rgba(0,0,0,0.3)', borderTopColor:'#000', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}></div> Saving...</> : <><i className="fas fa-save"></i> Save Changes</>}
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditMode(false)}>Cancel</button>
              </div>
            </form>
          )}

          {/* Change password */}
          <div className="card" style={{ marginTop:0 }}>
            <div style={{ fontSize:14, fontWeight:600, color:'var(--txt)', marginBottom:20, display:'flex', alignItems:'center', gap:8 }}>
              <i className="fas fa-lock" style={{ color:'var(--gold)' }}></i> Change Password
            </div>
            <form onSubmit={handleChangePassword}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
                {[
                  { label:'Current Password', name:'currentPassword', ph:'Current password' },
                  { label:'New Password', name:'newPassword', ph:'New password' },
                  { label:'Confirm New', name:'confirm', ph:'Repeat new password' },
                ].map(f => (
                  <div key={f.name} className="form-group" style={{ margin:0 }}>
                    <label className="form-label">{f.label}</label>
                    <input type="password" className="form-input" placeholder={f.ph}
                      value={pwForm[f.name]}
                      onChange={e => setPwForm(p => ({ ...p, [f.name]: e.target.value }))} />
                  </div>
                ))}
              </div>
              <button type="submit" className="btn btn-ghost btn-sm" style={{ marginTop:16 }} disabled={pwLoading}>
                {pwLoading ? 'Saving...' : <><i className="fas fa-key"></i> Update Password</>}
              </button>
            </form>
          </div>

          {/* Danger zone */}
          <div style={{ marginTop:16, padding:'20px 24px', background:'rgba(139,0,0,0.08)', border:'1px solid rgba(192,57,43,0.2)', borderRadius:'var(--radius)' }}>
            <div style={{ fontSize:13, fontWeight:600, color:'var(--crim3)', marginBottom:8 }}>Danger Zone</div>
            <button className="btn btn-danger btn-sm" onClick={() => { logout(); navigate('/') }}>
              <i className="fas fa-sign-out-alt"></i> Sign Out of All Devices
            </button>
          </div>
        </div>
      )}

      {/* ── SUBSCRIPTION TAB ── */}
      {activeTab === 'subscription' && (
        <div className="fade-in">
          <div className="subscription-card">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:16 }}>
              <div>
                <div style={{ fontSize:10, letterSpacing:3, color:'var(--gold)', textTransform:'uppercase', marginBottom:8 }}>Current Plan</div>
                <div style={{ fontFamily:'Playfair Display,serif', fontSize:'2rem', fontWeight:700, color: premium ? 'var(--gold)' : 'var(--txt)', marginBottom:4 }}>
                  {premium ? 'Standard' : 'Free'}
                </div>
                {premium && (
                  <div style={{ fontSize:13, color:'var(--txt2)' }}>
                    <i className="fas fa-calendar" style={{ marginRight:6, color:'var(--gold3)' }}></i>
                    Active until {formatDate(user?.subscription?.expiryDate)}
                  </div>
                )}
                {!premium && (
                  <div style={{ fontSize:13, color:'var(--txt3)' }}>Upgrade to unlock HD, no ads, and downloads</div>
                )}
              </div>
              {!premium
                ? <Link to="/pricing" className="btn btn-primary"><i className="fas fa-crown"></i> Upgrade to Standard</Link>
                : (
                  <div style={{ display:'flex', flexDirection:'column', gap:8, alignItems:'flex-end' }}>
                    <div className="badge badge-gold"><i className="fas fa-check-circle"></i> Active</div>
                    <div style={{ fontSize:12, color:'var(--txt3)' }}>₦1,000 / month</div>
                  </div>
                )
              }
            </div>
          </div>

          {/* Plan Features */}
          <div className="card">
            <div style={{ fontSize:14, fontWeight:600, color:'var(--txt)', marginBottom:20, display:'flex', alignItems:'center', gap:8 }}>
              <i className="fas fa-list" style={{ color:'var(--gold)' }}></i>
              {premium ? 'Your Standard Benefits' : 'What you get with Standard'}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12 }}>
              {[
                { icon:'fa-play-circle', text:'HD 720p & 1080p streaming', premium: true },
                { icon:'fa-ban', text:'Zero ads — uninterrupted', premium: true },
                { icon:'fa-download', text:'5 movie downloads/month', premium: true },
                { icon:'fa-certificate', text:'Early access to new releases', premium: true },
                { icon:'fa-bell', text:'Email notifications', premium: true },
                { icon:'fa-film', text:'Full movie library access', premium: true },
              ].map((f, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background: premium ? 'rgba(212,175,55,0.06)' : 'var(--bg3)', borderRadius:8, border:`1px solid ${premium ? 'rgba(212,175,55,0.15)' : 'var(--border)'}` }}>
                  <i className={`fas ${f.icon}`} style={{ color: premium ? 'var(--gold)' : 'var(--txt4)', fontSize:14, width:16 }}></i>
                  <span style={{ fontSize:13, color: premium ? 'var(--txt2)' : 'var(--txt4)' }}>{f.text}</span>
                </div>
              ))}
            </div>
            {!premium && (
              <div style={{ marginTop:20, textAlign:'center' }}>
                <Link to="/pricing" className="btn btn-primary"><i className="fas fa-crown"></i> Upgrade for ₦1,000/month</Link>
              </div>
            )}
          </div>

          {/* Download tracker */}
          {premium && (
            <div className="card" style={{ marginTop:0 }}>
              <div style={{ fontSize:14, fontWeight:600, color:'var(--txt)', marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
                <i className="fas fa-download" style={{ color:'var(--gold)' }}></i> Monthly Downloads
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:10 }}>
                <div style={{ flex:1, height:8, background:'var(--bg3)', borderRadius:4, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${((user?.downloadCount || 0) / 5) * 100}%`, background:'var(--gold)', borderRadius:4, transition:'width 0.5s ease' }}></div>
                </div>
                <span style={{ fontSize:13, color:'var(--gold)', fontWeight:600, flexShrink:0 }}>{user?.downloadCount || 0} / 5</span>
              </div>
              <div style={{ fontSize:12, color:'var(--txt3)' }}>Resets on the 1st of each month</div>
            </div>
          )}
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {activeTab === 'history' && (
        <div className="fade-in">
          <div style={{ marginBottom:20, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div className="section-eyebrow">Watch History</div>
              <h2 style={{ fontFamily:'Playfair Display,serif', fontSize:'1.4rem', color:'var(--txt)' }}>
                Recently <span style={{ color:'var(--gold)' }}>Watched</span>
              </h2>
            </div>
          </div>
          {loadingData ? (
            <div style={{ display:'flex', justifyContent:'center', padding:40 }}><div className="loading-spinner"></div></div>
          ) : watchHistory.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-history"></i>
              <h3>No watch history yet</h3>
              <p>Movies you watch will appear here.</p>
              <Link to="/home" className="btn btn-primary btn-sm"><i className="fas fa-play"></i> Browse Movies</Link>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {watchHistory.map((item, i) => item.movie && (
                <div key={i} style={{ display:'flex', gap:16, padding:'14px 16px', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--radius)', alignItems:'center', transition:'var(--transition)' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor='var(--border2)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}>
                  <div style={{ width:60, height:85, borderRadius:6, overflow:'hidden', flexShrink:0, background:'var(--bg3)' }}>
                    {item.movie.posterImage
                      ? <img src={item.movie.posterImage} alt={item.movie.title} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                      : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--txt4)' }}><i className="fas fa-film"></i></div>
                    }
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:14, fontWeight:500, color:'var(--txt)', marginBottom:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.movie.title}</div>
                    <div style={{ fontSize:12, color:'var(--txt3)', marginBottom:8 }}>
                      <i className="fas fa-clock" style={{ marginRight:5 }}></i>
                      {formatDate(item.watchedAt)}
                      {item.movie.duration && <span style={{ marginLeft:12 }}><i className="fas fa-film" style={{ marginRight:5 }}></i>{formatDuration(item.movie.duration)}</span>}
                    </div>
                    {item.progress > 0 && (
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ flex:1, maxWidth:200, height:3, background:'var(--bg3)', borderRadius:2 }}>
                          <div style={{ height:'100%', background:'var(--gold)', borderRadius:2, width:`${Math.min((item.progress/(item.movie.duration*60||3600))*100,100)}%` }}></div>
                        </div>
                        <span style={{ fontSize:11, color:'var(--txt3)' }}>
                          {Math.floor(item.progress / 60)}m watched
                        </span>
                      </div>
                    )}
                  </div>
                  <Link to={`/movie/${item.movie._id}`} className="btn btn-ghost btn-sm">
                    <i className="fas fa-play"></i> Resume
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── WATCHLIST TAB ── */}
      {activeTab === 'watchlist' && (
        <div className="fade-in">
          <div style={{ marginBottom:20 }}>
            <div className="section-eyebrow">Watchlist</div>
            <h2 style={{ fontFamily:'Playfair Display,serif', fontSize:'1.4rem', color:'var(--txt)' }}>
              Saved <span style={{ color:'var(--gold)' }}>Movies</span>
              <span style={{ fontFamily:'DM Sans,sans-serif', fontSize:14, fontWeight:400, color:'var(--txt3)', marginLeft:12 }}>({watchlist.length})</span>
            </h2>
          </div>
          {loadingData ? (
            <div style={{ display:'flex', justifyContent:'center', padding:40 }}><div className="loading-spinner"></div></div>
          ) : watchlist.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-bookmark"></i>
              <h3>Your watchlist is empty</h3>
              <p>Add movies to watch later by clicking the + button on any movie card.</p>
              <Link to="/home" className="btn btn-primary btn-sm"><i className="fas fa-film"></i> Discover Movies</Link>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:14 }}>
              {watchlist.map(m => (
                <MovieCard key={m._id} movie={m} inWatchlist={true}
                  onWatchlistChange={(id) => handleRemoveFromWatchlist(id)} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TRANSACTIONS TAB ── */}
      {activeTab === 'transactions' && (
        <div className="fade-in">
          <div style={{ marginBottom:20 }}>
            <div className="section-eyebrow">Billing</div>
            <h2 style={{ fontFamily:'Playfair Display,serif', fontSize:'1.4rem', color:'var(--txt)' }}>
              Transaction <span style={{ color:'var(--gold)' }}>History</span>
            </h2>
          </div>
          {loadingData ? (
            <div style={{ display:'flex', justifyContent:'center', padding:40 }}><div className="loading-spinner"></div></div>
          ) : transactions.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-receipt"></i>
              <h3>No transactions yet</h3>
              <p>Your payment history will appear here after upgrading.</p>
              <Link to="/pricing" className="btn btn-primary btn-sm"><i className="fas fa-crown"></i> Upgrade to Standard</Link>
            </div>
          ) : (
            <div className="card" style={{ padding:0, overflow:'hidden' }}>
              <table className="transaction-table">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Plan</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(tx => (
                    <tr key={tx._id}>
                      <td style={{ fontFamily:'monospace', fontSize:12, color:'var(--txt3)' }}>{tx.reference?.slice(-12)}</td>
                      <td><span className="badge badge-gold" style={{ textTransform:'capitalize' }}>{tx.plan}</span></td>
                      <td style={{ color:'var(--gold)', fontWeight:600 }}>{formatCurrency(tx.amount)}</td>
                      <td>{formatDate(tx.paidAt || tx.createdAt)}</td>
                      <td>
                        <span className={`tx-status ${tx.status}`}>
                          <i className={`fas fa-${tx.status === 'success' ? 'check-circle' : tx.status === 'pending' ? 'clock' : 'times-circle'}`}></i>
                          {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}