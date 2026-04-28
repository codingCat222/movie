import { useState, useEffect, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import api from '../services/api.js'
import { formatDate, formatCurrency } from '../utils/helpers.js'
import './AdminDashboard.css'

const TABS = [
  { id: 'overview', label: 'Overview', icon: 'fa-chart-bar' },
  { id: 'movies', label: 'Movies', icon: 'fa-film' },
  { id: 'upload', label: 'Upload Movie', icon: 'fa-cloud-upload-alt' },
  { id: 'users', label: 'Users', icon: 'fa-users' },
  { id: 'transactions', label: 'Transactions', icon: 'fa-receipt' },
]

const GENRES_LIST = ['Action','Comedy','Drama','Thriller','Sci-Fi','Horror','Romance','Mystery','Documentary','Animation']

export default function AdminDashboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'overview'
  const setTab = (t) => setSearchParams({ tab: t })

  const [stats, setStats] = useState(null)
  const [movies, setMovies] = useState([])
  const [users, setUsers] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    title:'', description:'', genre:[], releaseYear:'', duration:'',
    director:'', cast:'', language:'English', tags:'',
    isPremium:false, isFeatured:false, isTrending:false, downloadable:false,
    trailerUrl:''
  })
  const [uploadFiles, setUploadFiles] = useState({ poster:null, backdrop:null, video480:null, video720:null, video1080:null })
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [userSearch, setUserSearch] = useState('')
  const [movieSearch, setMovieSearch] = useState('')

  const showToast = (msg, type='info') => { setToast({msg,type}); setTimeout(()=>setToast(null),3500) }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        if (activeTab === 'overview') {
          const r = await api.get('/admin/stats'); setStats(r.data.stats)
        } else if (activeTab === 'movies') {
          const r = await api.get('/movies?limit=50'); setMovies(r.data.movies || [])
        } else if (activeTab === 'users') {
          const r = await api.get('/admin/users'); setUsers(r.data.users || [])
        } else if (activeTab === 'transactions') {
          const r = await api.get('/admin/transactions'); setTransactions(r.data.transactions || [])
        }
      } catch { }
      finally { setLoading(false) }
    }
    loadData()
  }, [activeTab])

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!uploadForm.title || !uploadForm.description || !uploadForm.releaseYear) {
      showToast('Title, description, and release year are required', 'error'); return
    }
    if (!uploadFiles.poster) { showToast('Poster image is required', 'error'); return }

    setUploading(true); setUploadProgress(0)
    try {
      const fd = new FormData()
      Object.entries(uploadForm).forEach(([k,v]) => {
        if (Array.isArray(v)) fd.append(k, v.join(','))
        else fd.append(k, v)
      })
      Object.entries(uploadFiles).forEach(([k,v]) => { if (v) fd.append(k, v) })
      await api.post('/admin/movies', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => setUploadProgress(Math.round((e.loaded * 100) / (e.total||1)))
      })
      showToast('Movie uploaded successfully!', 'success')
      setUploadForm({ title:'', description:'', genre:[], releaseYear:'', duration:'', director:'', cast:'', language:'English', tags:'', isPremium:false, isFeatured:false, isTrending:false, downloadable:false, trailerUrl:'' })
      setUploadFiles({ poster:null, backdrop:null, video480:null, video720:null, video1080:null })
      setUploadProgress(0)
    } catch (err) {
      showToast(err.response?.data?.message || 'Upload failed', 'error')
    } finally { setUploading(false) }
  }

  const handleDeleteMovie = async (id) => {
    if (!window.confirm('Delete this movie? This cannot be undone.')) return
    try {
      await api.delete(`/admin/movies/${id}`)
      setMovies(m => m.filter(mv => mv._id !== id))
      showToast('Movie deleted', 'success')
    } catch { showToast('Failed to delete movie', 'error') }
  }

  const handleBanUser = async (id) => {
    if (!window.confirm('Suspend this user?')) return
    try {
      await api.put(`/admin/users/${id}/ban`)
      setUsers(u => u.map(usr => usr._id === id ? {...usr, subscription:{...usr.subscription, status:'cancelled'}} : usr))
      showToast('User suspended', 'info')
    } catch { showToast('Failed', 'error') }
  }

  const toggleGenre = (g) => setUploadForm(p => ({
    ...p, genre: p.genre.includes(g) ? p.genre.filter(x=>x!==g) : [...p.genre, g]
  }))

  const filteredMovies = movies.filter(m => m.title?.toLowerCase().includes(movieSearch.toLowerCase()))
  const filteredUsers = users.filter(u => u.name?.toLowerCase().includes(userSearch.toLowerCase()) || u.email?.toLowerCase().includes(userSearch.toLowerCase()))

  return (
    <div className="admin-page page-wrapper">
      {toast && <div className={`toast toast-${toast.type}`}><i className={`fas fa-${toast.type==='success'?'check-circle':toast.type==='error'?'exclamation-circle':'info-circle'}`}></i>{toast.msg}</div>}

      <div className="admin-header">
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <h1>Admin <span>Panel</span></h1>
          <span className="admin-badge"><i className="fas fa-shield-alt" style={{ marginRight:5 }}></i>Admin</span>
        </div>
        <Link to="/home" className="btn btn-ghost btn-sm"><i className="fas fa-arrow-left"></i> Back to Site</Link>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        {TABS.map(t => (
          <button key={t.id} className={`admin-tab ${activeTab===t.id?'active':''}`} onClick={() => setTab(t.id)}>
            <i className={`fas ${t.icon}`}></i> {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {activeTab === 'overview' && (
        <div className="fade-in">
          <div className="admin-stats">
            {[
              { label:'Total Users', num: stats?.totalUsers ?? '—', color:'var(--gold)', icon:'fa-users' },
              { label:'Subscribers', num: stats?.activeSubscribers ?? '—', color:'#2ecc71', icon:'fa-crown' },
              { label:'Total Movies', num: stats?.totalMovies ?? '—', color:'#3498db', icon:'fa-film' },
              { label:'Total Revenue', num: stats ? formatCurrency(stats.totalRevenue) : '—', color:'var(--gold)', icon:'fa-naira-sign' },
              { label:'Monthly Revenue', num: stats ? formatCurrency(stats.monthlyRevenue) : '—', color:'#2ecc71', icon:'fa-chart-line' },
            ].map((s,i) => (
              <div key={i} className="admin-stat">
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                  <div style={{ width:32, height:32, borderRadius:8, background:`${s.color}18`, border:`1px solid ${s.color}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, color:s.color }}>
                    <i className={`fas ${s.icon}`}></i>
                  </div>
                </div>
                <div className="admin-stat-num" style={{ color: s.color }}>{loading ? '...' : s.num}</div>
                <div className="admin-stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {stats?.topMovies?.length > 0 && (
            <div className="admin-table-wrap">
              <div className="admin-table-header">
                <div className="admin-table-title"><i className="fas fa-fire"></i> Top Movies by Views</div>
              </div>
              <table className="admin-table">
                <thead><tr><th>#</th><th>Title</th><th>Views</th><th>Rating</th></tr></thead>
                <tbody>
                  {stats.topMovies.map((m,i) => (
                    <tr key={m._id}>
                      <td style={{ color:'var(--gold)', fontWeight:600 }}>#{i+1}</td>
                      <td style={{ fontWeight:500, color:'var(--txt)' }}>{m.title}</td>
                      <td>{m.views?.toLocaleString()}</td>
                      <td><i className="fas fa-star" style={{ color:'var(--gold)', marginRight:4, fontSize:11 }}></i>{parseFloat(m.rating||0).toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── MOVIES ── */}
      {activeTab === 'movies' && (
        <div className="fade-in">
          <div className="admin-table-wrap">
            <div className="admin-table-header">
              <div className="admin-table-title"><i className="fas fa-film"></i> All Movies ({filteredMovies.length})</div>
              <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                <div className="admin-search">
                  <i className="fas fa-search"></i>
                  <input placeholder="Search movies..." value={movieSearch} onChange={e => setMovieSearch(e.target.value)} />
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => setTab('upload')}>
                  <i className="fas fa-plus"></i> Upload Movie
                </button>
              </div>
            </div>
            {loading ? (
              <div style={{ display:'flex', justifyContent:'center', padding:40 }}><div className="loading-spinner"></div></div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Poster</th><th>Title</th><th>Genre</th><th>Year</th>
                    <th>Views</th><th>Rating</th><th>Plan</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMovies.map(m => (
                    <tr key={m._id}>
                      <td>
                        <div style={{ width:36, height:50, borderRadius:4, overflow:'hidden', background:'var(--bg3)' }}>
                          {m.posterImage
                            ? <img src={m.posterImage} alt={m.title} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                            : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--txt4)', fontSize:11 }}><i className="fas fa-film"></i></div>
                          }
                        </div>
                      </td>
                      <td style={{ fontWeight:500, color:'var(--txt)', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.title}</td>
                      <td style={{ color:'var(--txt3)' }}>{m.genre?.slice(0,2).join(', ')}</td>
                      <td>{m.releaseYear}</td>
                      <td>{m.views?.toLocaleString()}</td>
                      <td>
                        <span style={{ color:'var(--gold)', display:'flex', alignItems:'center', gap:4 }}>
                          <i className="fas fa-star" style={{ fontSize:10 }}></i>
                          {parseFloat(m.rating||0).toFixed(1)}
                        </span>
                      </td>
                      <td>
                        {m.isPremium
                          ? <span className="badge badge-pro"><i className="fas fa-crown"></i> Pro</span>
                          : <span className="badge badge-free">Free</span>
                        }
                      </td>
                      <td>
                        <div style={{ display:'flex', gap:6 }}>
                          <Link to={`/movie/${m._id}`} className="action-btn edit" title="View">
                            <i className="fas fa-eye"></i>
                          </Link>
                          <button className="action-btn delete" title="Delete" onClick={() => handleDeleteMovie(m._id)}>
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── UPLOAD ── */}
      {activeTab === 'upload' && (
        <div className="fade-in">
          <form className="movie-upload-form" onSubmit={handleUpload}>
            <h3><i className="fas fa-cloud-upload-alt"></i> Upload New Movie</h3>

            <div className="form-grid-2" style={{ marginBottom:16 }}>
              <div className="form-group" style={{ margin:0 }}>
                <label className="form-label">Movie Title *</label>
                <input type="text" className="form-input" placeholder="Enter movie title"
                  value={uploadForm.title} onChange={e => setUploadForm(p=>({...p,title:e.target.value}))} required />
              </div>
              <div className="form-grid-2" style={{ gap:12 }}>
                <div className="form-group" style={{ margin:0 }}>
                  <label className="form-label">Release Year *</label>
                  <input type="number" className="form-input" placeholder="2024" min="1900" max="2030"
                    value={uploadForm.releaseYear} onChange={e => setUploadForm(p=>({...p,releaseYear:e.target.value}))} required />
                </div>
                <div className="form-group" style={{ margin:0 }}>
                  <label className="form-label">Duration (mins)</label>
                  <input type="number" className="form-input" placeholder="120"
                    value={uploadForm.duration} onChange={e => setUploadForm(p=>({...p,duration:e.target.value}))} />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description *</label>
              <textarea className="form-input" rows={4} placeholder="Movie synopsis..."
                value={uploadForm.description} onChange={e => setUploadForm(p=>({...p,description:e.target.value}))} required
                style={{ resize:'vertical' }} />
            </div>

            <div className="form-grid-2" style={{ marginBottom:16 }}>
              <div className="form-group" style={{ margin:0 }}>
                <label className="form-label">Director</label>
                <input type="text" className="form-input" placeholder="Director name"
                  value={uploadForm.director} onChange={e => setUploadForm(p=>({...p,director:e.target.value}))} />
              </div>
              <div className="form-group" style={{ margin:0 }}>
                <label className="form-label">Cast (comma separated)</label>
                <input type="text" className="form-input" placeholder="Actor 1, Actor 2..."
                  value={uploadForm.cast} onChange={e => setUploadForm(p=>({...p,cast:e.target.value}))} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Genres</label>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {GENRES_LIST.map(g => (
                  <button type="button" key={g} onClick={() => toggleGenre(g)}
                    style={{ padding:'5px 14px', borderRadius:20, fontSize:12, cursor:'pointer', border:'1px solid', transition:'var(--transition)',
                      background: uploadForm.genre.includes(g) ? 'rgba(212,175,55,0.15)' : 'var(--bg3)',
                      color: uploadForm.genre.includes(g) ? 'var(--gold)' : 'var(--txt3)',
                      borderColor: uploadForm.genre.includes(g) ? 'rgba(212,175,55,0.4)' : 'var(--border)'
                    }}>
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Trailer URL (YouTube/Vimeo)</label>
              <input type="url" className="form-input" placeholder="https://youtube.com/watch?v=..."
                value={uploadForm.trailerUrl} onChange={e => setUploadForm(p=>({...p,trailerUrl:e.target.value}))} />
            </div>

            {/* File uploads */}
            <div className="form-grid-2" style={{ marginBottom:16 }}>
              <div>
                <label className="form-label">Poster Image *</label>
                <div className="upload-zone" onClick={() => document.getElementById('inp-poster').click()}>
                  <i className={`fas ${uploadFiles.poster ? 'fa-check-circle' : 'fa-image'}`} style={{ color: uploadFiles.poster ? '#2ecc71' : undefined }}></i>
                  <p>{uploadFiles.poster ? uploadFiles.poster.name : 'Click to upload poster'}</p>
                  <span>JPG, PNG, WebP</span>
                </div>
                <input id="inp-poster" type="file" accept="image/*" style={{ display:'none' }}
                  onChange={e => setUploadFiles(p=>({...p,poster:e.target.files[0]}))} />
              </div>
              <div>
                <label className="form-label">Backdrop Image</label>
                <div className="upload-zone" onClick={() => document.getElementById('inp-backdrop').click()}>
                  <i className={`fas ${uploadFiles.backdrop ? 'fa-check-circle' : 'fa-panorama'}`} style={{ color: uploadFiles.backdrop ? '#2ecc71' : undefined }}></i>
                  <p>{uploadFiles.backdrop ? uploadFiles.backdrop.name : 'Click to upload backdrop'}</p>
                  <span>Wide image (16:9)</span>
                </div>
                <input id="inp-backdrop" type="file" accept="image/*" style={{ display:'none' }}
                  onChange={e => setUploadFiles(p=>({...p,backdrop:e.target.files[0]}))} />
              </div>
            </div>

            <div className="form-grid-3" style={{ marginBottom:20 }}>
              {[['video480','480p Video'],['video720','720p Video'],['video1080','1080p Video']].map(([key,label]) => (
                <div key={key}>
                  <label className="form-label">{label}</label>
                  <div className="upload-zone" onClick={() => document.getElementById(`inp-${key}`).click()}>
                    <i className={`fas ${uploadFiles[key] ? 'fa-check-circle' : 'fa-video'}`} style={{ color: uploadFiles[key] ? '#2ecc71' : undefined }}></i>
                    <p style={{ fontSize:12 }}>{uploadFiles[key] ? uploadFiles[key].name : `Upload ${label}`}</p>
                    <span>MP4, MKV, WebM</span>
                  </div>
                  <input id={`inp-${key}`} type="file" accept="video/*" style={{ display:'none' }}
                    onChange={e => setUploadFiles(p=>({...p,[key]:e.target.files[0]}))} />
                </div>
              ))}
            </div>

            {/* Toggles */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:24 }}>
              {[
                { key:'isPremium', label:'Premium Content', icon:'fa-crown' },
                { key:'isFeatured', label:'Featured', icon:'fa-star' },
                { key:'isTrending', label:'Trending', icon:'fa-fire' },
                { key:'downloadable', label:'Downloadable', icon:'fa-download' },
              ].map(t => (
                <div key={t.key} className="toggle-switch-row" onClick={() => setUploadForm(p=>({...p,[t.key]:!p[t.key]}))}>
                  <div className={`toggle-switch ${uploadForm[t.key] ? 'on' : ''}`}></div>
                  <div>
                    <div style={{ fontSize:12, fontWeight:500, color:'var(--txt)', display:'flex', alignItems:'center', gap:6 }}>
                      <i className={`fas ${t.icon}`} style={{ color: uploadForm[t.key] ? 'var(--gold)' : 'var(--txt4)', fontSize:11 }}></i>
                      {t.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Progress */}
            {uploading && (
              <div style={{ marginBottom:20 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--txt3)', marginBottom:6 }}>
                  <span>Uploading...</span><span>{uploadProgress}%</span>
                </div>
                <div style={{ height:6, background:'var(--bg3)', borderRadius:3 }}>
                  <div style={{ height:'100%', width:`${uploadProgress}%`, background:'var(--gold)', borderRadius:3, transition:'width 0.3s' }}></div>
                </div>
              </div>
            )}

            <div style={{ display:'flex', gap:12 }}>
              <button type="submit" className="btn btn-primary" disabled={uploading}>
                {uploading ? <><div style={{ width:14, height:14, border:'2px solid rgba(0,0,0,0.3)', borderTopColor:'#000', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}></div> Uploading...</> : <><i className="fas fa-cloud-upload-alt"></i> Upload Movie</>}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setTab('movies')}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* ── USERS ── */}
      {activeTab === 'users' && (
        <div className="fade-in">
          <div className="admin-table-wrap">
            <div className="admin-table-header">
              <div className="admin-table-title"><i className="fas fa-users"></i> All Users ({filteredUsers.length})</div>
              <div className="admin-search">
                <i className="fas fa-search"></i>
                <input placeholder="Search users..." value={userSearch} onChange={e => setUserSearch(e.target.value)} />
              </div>
            </div>
            {loading ? (
              <div style={{ display:'flex', justifyContent:'center', padding:40 }}><div className="loading-spinner"></div></div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr><th>User</th><th>Email</th><th>Plan</th><th>Status</th><th>Joined</th><th>Last Login</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u._id}>
                      <td style={{ fontWeight:500, color:'var(--txt)', display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:30, height:30, borderRadius:'50%', background:'linear-gradient(135deg,var(--crimson),var(--bg3))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'var(--gold)', border:'1px solid var(--border)', overflow:'hidden', flexShrink:0 }}>
                          {u.avatar ? <img src={u.avatar} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : u.name?.slice(0,2).toUpperCase()}
                        </div>
                        {u.name}
                        {u.role === 'admin' && <span className="admin-badge" style={{ padding:'2px 7px', fontSize:9 }}>Admin</span>}
                      </td>
                      <td style={{ color:'var(--txt3)' }}>{u.email}</td>
                      <td>
                        {u.subscription?.plan === 'standard'
                          ? <span className="badge badge-gold"><i className="fas fa-crown"></i> Standard</span>
                          : <span className="badge badge-free">Free</span>
                        }
                      </td>
                      <td>
                        <span className={`tx-status ${u.subscription?.status === 'active' ? 'success' : u.subscription?.status === 'cancelled' ? 'failed' : 'pending'}`}>
                          {u.subscription?.status || 'active'}
                        </span>
                      </td>
                      <td style={{ color:'var(--txt3)' }}>{formatDate(u.createdAt)}</td>
                      <td style={{ color:'var(--txt3)' }}>{u.lastLogin ? formatDate(u.lastLogin) : '—'}</td>
                      <td>
                        <button className="action-btn delete" title="Suspend" onClick={() => handleBanUser(u._id)}>
                          <i className="fas fa-ban"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── TRANSACTIONS ── */}
      {activeTab === 'transactions' && (
        <div className="fade-in">
          <div className="admin-table-wrap">
            <div className="admin-table-header">
              <div className="admin-table-title"><i className="fas fa-receipt"></i> All Transactions ({transactions.length})</div>
              <div style={{ fontSize:13, color:'var(--gold)', fontWeight:600 }}>
                Total: {formatCurrency(transactions.filter(t=>t.status==='success').reduce((a,t)=>a+t.amount,0))}
              </div>
            </div>
            {loading ? (
              <div style={{ display:'flex', justifyContent:'center', padding:40 }}><div className="loading-spinner"></div></div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr><th>User</th><th>Email</th><th>Reference</th><th>Amount</th><th>Plan</th><th>Date</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {transactions.map(tx => (
                    <tr key={tx._id}>
                      <td style={{ fontWeight:500, color:'var(--txt)' }}>{tx.user?.name || '—'}</td>
                      <td style={{ color:'var(--txt3)' }}>{tx.user?.email || '—'}</td>
                      <td style={{ fontFamily:'monospace', fontSize:11, color:'var(--txt3)' }}>{tx.reference?.slice(-14)}</td>
                      <td style={{ color:'var(--gold)', fontWeight:600 }}>{formatCurrency(tx.amount)}</td>
                      <td><span className="badge badge-gold" style={{ textTransform:'capitalize' }}>{tx.plan}</span></td>
                      <td style={{ color:'var(--txt3)' }}>{formatDate(tx.paidAt || tx.createdAt)}</td>
                      <td>
                        <span className={`tx-status ${tx.status}`}>
                          <i className={`fas fa-${tx.status==='success'?'check-circle':tx.status==='pending'?'clock':'times-circle'}`}></i>
                          {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  )
}