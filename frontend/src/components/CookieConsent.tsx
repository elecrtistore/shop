import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const choice = localStorage.getItem('electrishop-cookie-consent');
    if (!choice) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem('electrishop-cookie-consent', 'accepted');
    setVisible(false);
  };

  const reject = () => {
    localStorage.setItem('electrishop-cookie-consent', 'rejected');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] bg-white border-t border-border shadow-lg p-4">
      <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center gap-4 justify-between">
        <p className="text-sm text-soft leading-relaxed">
          This site uses local storage for essential functionality (user sessions, inquiry cart). 
          By continuing, you agree to our{' '}
          <Link to="/privacy" className="text-primary underline hover:text-primary-hover">Privacy Policy</Link>.
        </p>
        <div className="flex gap-2 shrink-0">
          <button onClick={reject} className="rounded-full border border-border px-4 py-2 text-sm font-medium text-charcoal hover:bg-slate-50 transition">
            Reject
          </button>
          <button onClick={accept} className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover transition">
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

export default CookieConsent;
