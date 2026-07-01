import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Bolt, Shield, MessageCircle, ChevronRight, Star, ArrowRight, Package } from 'lucide-react';
import { Product } from '../types/product';
import { fetchProducts } from '../services/productService';
import api from '../services/api';

interface HeroContent {
  title: string; subtitle: string; body: string;
  sections: { heading: string; content: string }[];
}

function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [hero, setHero] = useState<HeroContent>({ title: '', subtitle: '', body: '', sections: [] });
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [subscribeError, setSubscribeError] = useState('');

  useEffect(() => {
    fetchProducts().then(setProducts).catch(() => {});
    api.get('/site/hero').then((r) => { if (r.data.title) setHero(r.data); }).catch(() => {});
  }, []);

  const featured = products.filter(p => p.featured).length > 0
    ? products.filter(p => p.featured).slice(0, 6)
    : products.slice(0, 6);

  const productCategories = [...new Set(products.map(p => p.category).filter(Boolean))];
  const brandList = [...new Set(products.map(p => p.brand).filter(Boolean))].slice(0, 8);
  const displayBrands = brandList.length > 0 ? brandList : ['Samsung', 'Apple', 'Sony', 'LG', 'Dell', 'HP', 'Lenovo', 'JBL'];

  const handleSubscribe = async () => {
    if (!email || subscribing) return;
    setSubscribing(true);
    setSubscribeError('');
    try {
      await api.post('/email/subscribe', { email });
      setSubscribed(true);
      setEmail('');
    } catch (err: any) {
      setSubscribeError(err.response?.data?.message || 'Subscription failed. Try again.');
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <div>
      {/* ─── HERO ─── */}
      <section className="relative min-h-[70vh] lg:min-h-[90vh] flex items-center bg-[#F5F5F0] overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, #1E3A5F 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative mx-auto max-w-7xl px-6 pt-24 pb-16 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fade-in">
              <div className="inline-flex items-center gap-2 border border-primary/20 bg-primary-light px-4 py-1.5 text-sm font-medium text-primary tracking-wide">
                <Package size={14} /> Private electronics marketplace
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-charcoal leading-[1.05]">
                {hero.title || 'Premium Electronics'}
              </h1>
              <p className="text-lg text-soft leading-relaxed max-w-lg">
                {hero.subtitle || 'Browse curated electronics and request a quote directly from the seller. No middlemen, just great deals.'}
              </p>
              <div className="flex gap-3">
                <Link to="/shop" className="inline-flex items-center gap-2 bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-hover transition border border-primary">
                  Start shopping <ArrowRight size={16} />
                </Link>
                <Link to="/about" className="inline-flex items-center gap-2 border border-border bg-white px-6 py-3 text-sm font-semibold text-charcoal hover:bg-[#F5F5F0] transition">
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
                {(products.length > 0 ? products.slice(0, 6) : []).map((product) => (
                  <Link key={product._id} to={`/products/${product._id}`} className="aspect-square border border-border bg-white overflow-hidden hover:scale-105 transition-transform">
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-contain p-2" />
                  </Link>
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
          <div className="flex flex-wrap gap-3">
            {productCategories.length > 0 ? productCategories.map((cat) => (
              <Link key={cat} to={`/shop?category=${cat}`} className="rounded-full border border-border bg-white px-5 py-2.5 text-sm font-medium text-charcoal hover:bg-primary hover:text-white hover:border-primary transition">
                {cat}
              </Link>
            )) : (
              <p className="text-sm text-soft">No categories yet.</p>
            )}
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
                      <span className="flex-1 rounded-full bg-primary text-center text-sm font-semibold text-white py-2 group-hover:bg-primary-hover transition">View details</span>
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

      {/* ─── WHY CHOOSE US ─── */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-2xl font-bold text-charcoal text-center mb-4">Why Choose ALEXTRONICS</h2>
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
            <div className="space-y-3">
              {subscribeError && <p className="text-sm text-red-500">{subscribeError}</p>}
              <div className="flex gap-3 max-w-md mx-auto">
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Enter your email" className="flex-1 rounded-full border border-border bg-white px-5 py-3 text-sm text-charcoal outline-none focus:border-primary transition" />
                <button onClick={handleSubscribe} disabled={subscribing} className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-hover transition whitespace-nowrap disabled:opacity-50">
                  {subscribing ? '...' : 'Subscribe'}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default HomePage;
