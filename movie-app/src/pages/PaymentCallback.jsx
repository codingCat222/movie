import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const PaymentCallback = () => {
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'failed'
  const [currentStep, setCurrentStep] = useState(0);
  const [countdown, setCountdown] = useState(5);
  const [showConfetti, setShowConfetti] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const steps = [
    { label: 'Validating payment reference' },
    { label: 'Confirming transaction status' },
    { label: 'Verifying payment amount' },
    { label: 'Updating your account' }
  ];

  // Simulate verification process
  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < steps.length - 1) return prev + 1;
        return prev;
      });
    }, 1500);

    // Simulate final result after all steps
    const resultTimeout = setTimeout(() => {
      setStatus('success'); // or 'failed'
      setShowConfetti(true);
    }, steps.length * 1500 + 500);

    return () => {
      clearInterval(stepInterval);
      clearTimeout(resultTimeout);
    };
  }, []);

  // Countdown for redirect
  useEffect(() => {
    if (status !== 'success') return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      navigate('/dashboard');
    }
  }, [status, countdown, navigate]);

  // Confetti particles
  const confettiColors = ['#f1c40f', '#2ecc71', '#e74c3c', '#3498db', '#9b59b6', '#e67e22'];
  
  const renderConfetti = () => {
    if (!showConfetti) return null;
    
    const pieces = [];
    for (let i = 0; i < 50; i++) {
      const style = {
        left: `${Math.random() * 100}%`,
        backgroundColor: confettiColors[Math.floor(Math.random() * confettiColors.length)],
        animationDuration: `${Math.random() * 3 + 2}s`,
        animationDelay: `${Math.random() * 2}s`,
        width: `${Math.random() * 8 + 4}px`,
        height: `${Math.random() * 8 + 4}px`
      };
      pieces.push(<div key={i} className="pc-confetti-piece" style={style} />);
    }
    return <div className="pc-confetti">{pieces}</div>;
  };

  // Dashboard icon
  const DashboardIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );

  // Support icon
  const SupportIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );

  const transactionRef = searchParams.get('ref') || 'TXN-8K4F2M9P';

  return (
    <div className={`payment-callback-page status-${status}`}>
      {renderConfetti()}
      
      <div className={`pc-card ${status}`}>
        {/* Logo */}
        <a href="/" className="pc-logo">
          <div className="pc-logo-icon">B</div>
          <span className="pc-logo-text">BRILLIANT</span>
        </a>

        {/* Status Icon */}
        <div className={`pc-icon-wrap ${status}`}>
          {status === 'verifying' && (
            <div className="pc-spinner" />
          )}
          {status === 'success' && (
            <span className="pc-icon-check">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#2ecc71" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
          )}
          {status === 'failed' && (
            <span className="pc-icon-fail">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </span>
          )}
        </div>

        {/* Verifying Steps */}
        {status === 'verifying' && (
          <div className="pc-steps">
            {steps.map((step, index) => {
              let stepClass = 'pc-step waiting';
              if (index < currentStep) stepClass = 'pc-step done';
              else if (index === currentStep) stepClass = 'pc-step active';

              return (
                <div key={index} className={stepClass}>
                  <div className="pc-step-dot">
                    {index < currentStep && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#2ecc71" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                    {index === currentStep && <div className="pc-step-mini-spin" />}
                  </div>
                  <span className="pc-step-label">{step.label}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Title */}
        <h1 className={`pc-title ${status}`}>
          {status === 'verifying' && 'Verifying Payment'}
          {status === 'success' && 'Payment Successful!'}
          {status === 'failed' && 'Payment Failed'}
        </h1>

        {/* Subtitle */}
        <p className="pc-subtitle">
          {status === 'verifying' && 'Please wait while we confirm your payment. This usually takes just a few moments.'}
          {status === 'success' && 'Your payment has been processed successfully. Welcome aboard!'}
          {status === 'failed' && 'We couldn\'t process your payment. Please try again or use a different method.'}
        </p>

        {/* Reference */}
        {(status === 'success' || status === 'failed') && (
          <div className="pc-reference">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
              <line x1="4" y1="22" x2="4" y2="15" />
            </svg>
            {transactionRef}
          </div>
        )}

        {/* Success Benefits */}
        {status === 'success' && (
          <div className="pc-benefits">
            <div className="pc-benefit">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Full access to all premium features
            </div>
            <div className="pc-benefit">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Priority customer support
            </div>
            <div className="pc-benefit">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Exclusive content & resources
            </div>
            <div className="pc-benefit">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Receipt sent to your email
            </div>
          </div>
        )}

        {/* Countdown */}
        {status === 'success' && (
          <div className="pc-countdown">
            <div className="pc-countdown-ring">
              <svg width="40" height="40" viewBox="0 0 40 40">
                <circle className="pc-countdown-ring-track" cx="20" cy="20" r="16" />
                <circle 
                  className="pc-countdown-ring-fill" 
                  cx="20" cy="20" r="16"
                  style={{ strokeDashoffset: (countdown / 5) * 100 }}
                />
              </svg>
              <span className="pc-countdown-num">{countdown}</span>
            </div>
            <span className="pc-countdown-text">Redirecting to dashboard...</span>
          </div>
        )}

        {/* Failed Support Box */}
        {status === 'failed' && (
          <div className="pc-support-box">
            <div className="pc-support-box-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              What you can do
            </div>
            <ul>
              <li>Check your card details and try again</li>
              <li>Contact your bank to authorize transactions</li>
              <li>Use a different payment method</li>
              <li>Contact our support team for help</li>
            </ul>
          </div>
        )}

        {/* Divider */}
        <div className="pc-divider" />

        {/* Actions */}
        <div className="pc-actions">
          {status === 'verifying' && (
            <button className="btn btn--outline" disabled>
              <div className="pc-step-mini-spin" style={{ width: 12, height: 12, marginRight: 8 }} />
              Verifying...
            </button>
          )}
          
          {status === 'success' && (
            <>
              <button 
                className="btn btn--primary" 
                onClick={() => navigate('/dashboard')}
              >
                <DashboardIcon />
                Go to Dashboard
              </button>
              <button 
                className="btn btn--outline" 
                onClick={() => navigate('/settings')}
              >
                View Receipt
              </button>
            </>
          )}
          
          {status === 'failed' && (
            <>
              <button 
                className="btn btn--primary" 
                onClick={() => navigate('/checkout')}
              >
                Try Again
              </button>
              <button 
                className="btn btn--outline" 
                onClick={() => navigate('/support')}
              >
                <SupportIcon />
                Contact Support
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentCallback;