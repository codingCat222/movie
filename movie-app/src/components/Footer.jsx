import { Link } from 'react-router-dom'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="landing-footer">
      <div className="footer-brand">LORESSTREM</div>
      <div className="footer-links">
        <span className="footer-link">Privacy Policy</span>
        <span className="footer-link">Terms of Service</span>
        <span className="footer-link">Support</span>
        <Link to="/login" className="footer-admin">Admin Portal</Link>
      </div>
      <div className="footer-copy">© {new Date().getFullYear()} Loresstrem. All rights reserved.</div>
    </footer>
  )
}