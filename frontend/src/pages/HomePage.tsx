import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Bolt, Shield, MessageCircle, ChevronRight, Star, ArrowRight, Package } from 'lucide-react';
import { Product } from '../types/product';
import { fetchProducts, fetchCategories } from '../services/productService';
import api from '../services/api';

interface HeroContent {
  title: string; subtitle: string; body: string;
  sections: { heading: string; content: string }[];
}

const categoryIcons: Record<string, string> = {
  Phones: '📱', Laptops: '💻', Audio: '🎧', Accessories: '⚡', Tablets: '📲', Gaming: '🎮', Cameras: '📷', TVs: '📺'
};

function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [hero, setHero] = useState<HeroContent>({ title: '', subtitle: '', body: '', sections: [] });
  const [categories, setCategories] = useState<string[]>([]);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    fetchProducts().then(setProducts).catch(() => {});
    api.get('/site/hero').then((r) => { if (r.data.title) setHero(r.data); }).catch(() => {});
    fetchCategories().then(setCategories).catch(() => {});
  }, []);

  const featured = products.filter(p => p.featured).length > 0
    ? products.filter(p => p.featured).slice(0, 6)
    : products.slice(0, 6);

  const brandList = [...new Set(products.map(p => p.brand).filter(Boolean))].slice(0, 8);
  const displayBrands = brandList.length > 0 ? brandList : ['Samsung', 'Apple', 'Sony', 'LG', 'Dell', 'HP', 'Lenovo', 'JBL'];

  const handleSubscribe = async () => {
    if (!email || subscribing) return;
    setSubscribing(true);
    try {
      const res = await api.post('/email/subscribe', { email });
      setSubscribed(true);
      setEmail('');
    } catch { /* ignore */ } finally {
      setSubscribing(false);
    }
  };

  return (
    <div>
      {/* ─── HERO ─── */}
      <section className="relative min-h-[70vh] lg:min-h-[90vh] flex items-center bg-gradient-to-br from-orange-50 via-white to-amber-50 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,#F97316_0%,transparent_50%)] opacity-10" />
        <div className="relative mx-auto max-w-7xl px-6 pt-24 pb-16 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fade-in">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                <Package size={14} /> Private electronics marketplace
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-charcoal leading-[1.05]">
                {hero.title || 'Premium Electronics'}
              </h1>
              <p className="text-lg text-soft leading-relaxed max-w-lg">
                {hero.subtitle || 'Browse curated electronics and request a quote directly from the seller. No middlemen, just great deals.'}
              </p>
              <div className="flex gap-3">
                <Link to="/shop" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-hover transition shadow-lg shadow-primary/20">
                  Start shopping <ArrowRight size={16} />
                </Link>
                <Link to="/about" className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-6 py-3 text-sm font-semibold text-charcoal hover:bg-slate-50 transition">
                  Learn more
                </Link>
              </div>
              <div className="flex gap-6 pt-4">
                {[
                  { icon: Bolt, label: 'Best Prices' },
                  { icon: Shield, label: 'Trusted Sellers' },
                  { icon: MessageCircle, label: 'Direct Contact' }
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2 text-sm text-soft">
                    <item.icon size={16} className="text-primary" />
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
            <div className="relative hidden lg:block">
              <div className="relative grid grid-cols-3 gap-4">
                {['📺', '💻', '📱', '🎧', '📷', '⌚'].map((emoji, i) => (
                  <div key={i} className={`aspect-square rounded-2xl bg-white/80 backdrop-blur-sm shadow-soft flex items-center justify-center text-4xl hover:scale-105 transition-transform ${i === 1 ? 'translate-y-4' : i === 2 ? '-translate-y-2' : ''}`}>
                    {emoji}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CATEGORIES ─── */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl font-bold text-charcoal">Categories</h2>
            <Link to="/shop" className="text-sm font-semibold text-primary hover:text-primary-hover transition">View all</Link>
          </div>
          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-none">
            {(categories.length > 0 ? categories : ['Phones', 'Laptops', 'Audio', 'Accessories', 'Tablets', 'Gaming', 'Cameras', 'TVs']).map((cat) => (
              <Link key={cat} to={`/shop?category=${cat}`} className="flex flex-col items-center gap-3 min-w-[100px] group">
                <div className="w-16 h-16 rounded-2xl bg-white shadow-card flex items-center justify-center text-2xl group-hover:scale-110 transition-transform group-hover:shadow-soft">
                  {categoryIcons[cat] || '📦'}
                </div>
                <span className="text-sm font-medium text-charcoal text-center">{cat}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURED PRODUCTS ─── */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl font-bold text-charcoal">Featured Products</h2>
              <p className="mt-2 text-sm text-soft">Handpicked just for you</p>
            </div>
            <Link to="/shop" className="text-sm font-semibold text-primary hover:text-primary-hover transition flex items-center gap-1">
              Browse all <ChevronRight size={16} />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {featured.map((product) => {
              const discounted = product.discount ? Math.round(product.price * (1 - product.discount / 100)) : null;
              return (
                <Link key={product._id} to={`/products/${product._id}`} className="group rounded-2xl bg-background overflow-hidden animate-lift">
                  <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="p-5 space-y-2">
                    <p className="text-xs font-medium text-primary uppercase tracking-wider">{product.brand}</p>
                    <h3 className="font-semibold text-charcoal leading-snug">{product.name}</h3>
                    <div className="flex items-center gap-2">
                      {discounted ? (
                        <>
                          <span className="text-lg font-bold text-charcoal">KSh {discounted.toLocaleString()}</span>
                          <span className="text-sm text-soft line-through">KSh {product.price.toLocaleString()}</span>
                        </>
                      ) : (
                        <span className="text-lg font-bold text-charcoal">KSh {product.price.toLocaleString()}</span>
                      )}
                    </div>
                    {product.discount && (
                      <span className="inline-block rounded-full bg-emerald-50 px-3 py-0.5 text-xs font-semibold text-emerald-600">{product.discount}% OFF</span>
                    )}
                    <div className="pt-3 flex gap-2">
                      <span className="flex-1 rounded-full bg-primary text-center text-sm font-semibold text-white py-2">View details</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── BRANDS ─── */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-2xl font-bold text-charcoal text-center mb-10">Top Brands</h2>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            {displayBrands.map((brand) => (
              <div key={brand} className="text-lg font-bold text-soft hover:text-primary transition-colors cursor-pointer">
                {brand}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PROMOTIONAL BANNER ─── */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 to-orange-600 p-10 sm:p-16">
            <div className="relative z-10 max-w-lg space-y-6">
              <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight">Premium Electronics, Direct from the Seller</h2>
              <p className="text-orange-100 leading-relaxed">Skip the middleman. Inquire about any product and get a personalized quote within hours.</p>
              <Link to="/shop" className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-orange-600 hover:bg-orange-50 transition">
                Browse collection <ArrowRight size={16} />
              </Link>
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-1/3 hidden lg:block">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_white_0%,_transparent_60%)] opacity-20" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── WHY CHOOSE US ─── */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-2xl font-bold text-charcoal text-center mb-4">Why Choose ElectriShop</h2>
          <p className="text-sm text-soft text-center mb-12 max-w-lg mx-auto">We make buying electronics simple, transparent, and personal.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {[
              { icon: Bolt, title: 'Best Prices', desc: 'Get competitive quotes directly from the seller with no markup.' },
              { icon: Shield, title: 'Trusted Sellers', desc: 'Every seller is verified to ensure a safe buying experience.' },
              { icon: MessageCircle, title: 'Direct Contact', desc: 'Communicate directly via phone or WhatsApp for fast responses.' },
              { icon: Star, title: 'Premium Quality', desc: 'Curated selection of high-quality electronics from top brands.' }
            ].map((item) => (
              <div key={item.title} className="text-center sm:text-left">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 mx-auto sm:mx-0">
                  <item.icon size={20} className="text-primary" />
                </div>
                <h3 className="font-semibold text-charcoal mb-2">{item.title}</h3>
                <p className="text-sm text-soft leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── NEWSLETTER ─── */}
      <section className="py-20">
        <div className="mx-auto max-w-2xl px-6 text-center space-y-6">
          <h2 className="text-2xl font-bold text-charcoal">Stay in the Loop</h2>
          <p className="text-sm text-soft">Get notified about new arrivals, exclusive deals, and price drops.</p>
          {subscribed ? (
            <p className="text-sm font-semibold text-emerald-600">You're subscribed! Check your inbox for updates.</p>
          ) : (
            <div className="flex gap-3 max-w-md mx-auto">
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Enter your email" className="flex-1 rounded-full border border-border bg-white px-5 py-3 text-sm text-charcoal outline-none focus:border-primary transition" />
              <button onClick={handleSubscribe} disabled={subscribing} className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-hover transition whitespace-nowrap disabled:opacity-50">
                {subscribing ? '...' : 'Subscribe'}
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default HomePage;
