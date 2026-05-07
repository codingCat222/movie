import { Link } from 'react-router-dom'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="landing-footer">
      <div className="footer-container">
        {/* Brand Section */}
        <div className="footer-section">
          <div className="footer-brand">LORESSTREM</div>
          <div className="footer-tagline">Experience the future of streaming</div>
          <div className="footer-social">
            <i className="fab fa-facebook-f social-icon"></i>
            <i className="fab fa-instagram social-icon"></i>
            <i className="fab fa-twitter social-icon"></i>
            <i className="fab fa-youtube social-icon"></i>
            <i className="fab fa-tiktok social-icon"></i>
          </div>
        </div>

        {/* Quick Links */}
        <div className="footer-section">
          <h4 className="footer-section-title">Quick Links</h4>
          <ul className="footer-menu">
            <li><span className="footer-link">Home</span></li>
            <li><span className="footer-link">Explore</span></li>
            <li><span className="footer-link">Trending</span></li>
            <li><span className="footer-link">New Releases</span></li>
            <li><span className="footer-link">About Us</span></li>
          </ul>
        </div>

        {/* Services & Opportunities */}
        <div className="footer-section">
          <h4 className="footer-section-title">Opportunities</h4>
          <ul className="footer-menu">
            <li><span className="footer-link"><i className="fas fa-bullhorn"></i> Advertise With Us</span></li>
            <li><span className="footer-link"><i className="fas fa-music"></i> Music Promotion</span></li>
            <li><span className="footer-link"><i className="fas fa-chart-line"></i> Sponsored Content</span></li>
            <li><span className="footer-link"><i className="fas fa-star"></i> Featured Artists</span></li>
            <li><span className="footer-link"><i className="fas fa-handshake"></i> Partnerships</span></li>
            <li><span className="footer-link"><i className="fas fa-gift"></i> Promotions & Giveaways</span></li>
          </ul>
        </div>

        {/* Contact Section */}
        <div className="footer-section">
          <h4 className="footer-section-title">Contact Us</h4>
          <div className="footer-contact">
            <p><i className="fas fa-phone-alt"></i> Call us: <a href="tel:+234909478580">0909 478 580</a></p>
            <p><i className="fas fa-phone"></i> Alternative: <a href="tel:+234909478580">+234 909 478 580</a></p>
            <p><i className="fas fa-envelope"></i> Email: <a href="mailto:semiloreloremikan@gmail.com">semiloreloremikan@gmail.com</a></p>
            <p><i className="fas fa-clock"></i> Support: 24/7 Available</p>
          </div>
        </div>

        {/* Legal Section */}
        <div className="footer-section">
          <h4 className="footer-section-title">Legal</h4>
          <ul className="footer-menu">
            <li><span className="footer-link">Privacy Policy</span></li>
            <li><span className="footer-link">Terms of Service</span></li>
            <li><span className="footer-link">Cookie Policy</span></li>
            <li><span className="footer-link">Support Center</span></li>
            <li><Link to="/login" className="footer-admin"><i className="fas fa-user-shield"></i> Admin Portal</Link></li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom">
        <div className="footer-copy">
          <i className="far fa-copyright"></i> {new Date().getFullYear()} Loresstrem. All rights reserved.
        </div>
        <div className="footer-payment">
          <i className="fab fa-cc-visa"></i>
          <i className="fab fa-cc-mastercard"></i>
          <i className="fab fa-cc-paypal"></i>
          <i className="fab fa-google-pay"></i>
          <i className="fab fa-apple-pay"></i>
        </div>
      </div>
    </footer>
  )
}