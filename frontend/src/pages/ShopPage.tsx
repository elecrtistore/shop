import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useInquiry } from '../contexts/InquiryContext';
import { Product } from '../types/product';
import { fetchProducts, updateProduct } from '../services/productService';
import api from '../services/api';
import { Search, SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import DiscountModal from '../components/DiscountModal';

interface HeroContent { title: string; subtitle: string; body: string; sections: { heading: string; content: string }[]; }

function ShopPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';
  const { addItem } = useInquiry();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [sort, setSort] = useState('Newest');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500000]);
  const [draggedProductId, setDraggedProductId] = useState<string | null>(null);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [discountModalOpen, setDiscountModalOpen] = useState(false);
  const [discountTargetId, setDiscountTargetId] = useState<string | null>(null);
  const [hero, setHero] = useState<HeroContent>({ title: 'Shop Electronics', subtitle: 'Browse our curated collection and add products to your inquiry list.', body: '', sections: [] });

  useEffect(() => {
    setLoading(true);
    fetchProducts().then(setProducts).catch(console.error).finally(() => setLoading(false));
    api.get('/site/hero').then((res) => { if (res.data.title) setHero(res.data); }).catch(() => {});
  }, []);

  useEffect(() => {
    if (searchParams.get('category')) setCategory(searchParams.get('category')!);
  }, [searchParams]);

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(products.map((p) => p.category)))],
    [products]
  );

  const filtered = useMemo(() => {
    let visible = products
      .filter((p) => category === 'All' || p.category === category)
      .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()) || p.brand.toLowerCase().includes(query.toLowerCase()))
      .filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);
    if (sort === 'Lowest') return [...visible].sort((a, b) => a.price - b.price);
    if (sort === 'Highest') return [...visible].sort((a, b) => b.price - a.price);
    if (sort === 'Custom') return visible;
    return [...visible].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [products, category, query, sort, priceRange]);

  const handleDragStart = (e: React.DragEvent, id: string) => { setDraggedProductId(id); e.dataTransfer.effectAllowed = 'move'; };
  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedProductId || draggedProductId === targetId) return;
    setProducts((prev) => {
      const next = [...prev];
      const from = next.findIndex((p) => p._id === draggedProductId);
      const to = next.findIndex((p) => p._id === targetId);
      if (from === -1 || to === -1) return prev;
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setDraggedProductId(null);
  };

  const handlePriceChange = async (id: string, value: number) => {
    setProducts((prev) => prev.map((p) => p._id === id ? { ...p, price: value } : p));
    try { await updateProduct(id, { price: value }); } catch {}
  };

  const handleApplyDiscount = async (percent: number) => {
    if (!discountTargetId) return;
    setProducts((prev) => prev.map((p) => p._id === discountTargetId ? { ...p, discount: percent } : p));
    try { await updateProduct(discountTargetId, { discount: percent }); } catch {}
    setDiscountTargetId(null); setDiscountModalOpen(false);
  };

  return (
    <div className="pt-20">
      {/* ─── PAGE HEADER ─── */}
      <section className="border-b border-border bg-white">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <h1 className="text-3xl font-bold text-charcoal">{hero.title}</h1>
          <p className="mt-2 text-soft">{hero.subtitle}</p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* ─── MOBILE FILTER TOGGLE ─── */}
        <div className="md:hidden mb-6">
          <button onClick={() => setFiltersOpen(!filtersOpen)} className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-charcoal hover:bg-slate-50 transition">
            <SlidersHorizontal size={16} />
            {filtersOpen ? 'Hide filters' : 'Filter & sort'}
            <ChevronDown size={14} className={`transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
          </button>
          {filtersOpen && (
            <div className="mt-4 space-y-6">
              <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-soft" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products..." className="w-full rounded-full border border-border bg-white pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary transition" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-charcoal mb-3">Category</h4>
                <div className="space-y-1">
                  {categories.map((cat) => (
                    <button key={cat} onClick={() => setCategory(cat)} className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition ${category === cat ? 'bg-primary/10 text-primary font-semibold' : 'text-soft hover:text-charcoal'}`}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-charcoal mb-3">Sort</h4>
                <div className="relative">
                  <select value={sort} onChange={(e) => setSort(e.target.value)} className="w-full appearance-none cursor-pointer rounded-lg border border-border bg-white px-3 py-2.5 pr-10 text-sm outline-none transition focus:border-primary">
                    <option value="Newest">Newest</option>
                    <option value="Lowest">Lowest Price</option>
                    <option value="Highest">Highest Price</option>
                    {isAdmin && <option value="Custom">Custom order</option>}
                  </select>
                  <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-soft" />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-[240px_1fr] gap-8">
          {/* ─── DESKTOP SIDEBAR ─── */}
          <aside className="hidden md:block space-y-8">
            <div>
              <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-soft" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products..." className="w-full rounded-full border border-border bg-white pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary transition" />
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-charcoal mb-3">Category</h4>
              <div className="space-y-1">
                {categories.map((cat) => (
                  <button key={cat} onClick={() => setCategory(cat)} className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition ${category === cat ? 'bg-primary/10 text-primary font-semibold' : 'text-soft hover:text-charcoal'}`}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-charcoal mb-3">Sort</h4>
              <div className="relative">
                <select value={sort} onChange={(e) => setSort(e.target.value)} className="w-full appearance-none cursor-pointer rounded-lg border border-border bg-white px-3 py-2.5 pr-10 text-sm outline-none transition focus:border-primary">
                  <option value="Newest">Newest</option>
                  <option value="Lowest">Lowest Price</option>
                  <option value="Highest">Highest Price</option>
                  {isAdmin && <option value="Custom">Custom order</option>}
                </select>
                <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-soft" />
              </div>
            </div>
          </aside>

          {/* ─── PRODUCTS ─── */}
          <div>
            {isAdmin && (
              <div className="mb-6 rounded-xl bg-primary/5 px-5 py-3 text-sm text-soft">
                Admin mode: drag to reorder &middot; click price to edit &middot; use discount buttons
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-2xl bg-white border border-border/60 overflow-hidden animate-pulse">
                    <div className="aspect-[4/3] bg-slate-200" />
                    <div className="p-5 space-y-3">
                      <div className="h-3 w-16 bg-slate-200 rounded-full" />
                      <div className="h-4 w-3/4 bg-slate-200 rounded-full" />
                      <div className="h-5 w-24 bg-slate-200 rounded-full" />
                      <div className="h-3 w-20 bg-slate-200 rounded-full" />
                      <div className="h-9 w-full bg-slate-200 rounded-full mt-3" />
                    </div>
                  </div>
                ))
              ) : (
                filtered.map((product) => {
                  const discounted = product.discount ? Math.round(product.price * (1 - product.discount / 100)) : null;
                  return (
                    <div
                      key={product._id}
                      draggable={isAdmin}
                      onDragStart={(e) => isAdmin && handleDragStart(e, product._id)}
                      onDragOver={(e) => isAdmin && e.preventDefault()}
                      onDrop={(e) => isAdmin && handleDrop(e, product._id)}
                      className={`group rounded-2xl bg-white border border-border/60 overflow-hidden animate-lift ${isAdmin ? 'cursor-grab' : ''}`}
                    >
                      <Link to={`/products/${product._id}`} className="block aspect-[4/3] overflow-hidden bg-slate-50">
                        <img src={product.images[0]} alt={product.name} className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500" />
                      </Link>
                      <div className="p-5 space-y-2">
                        <p className="text-xs font-medium text-primary uppercase tracking-wider">{product.brand}</p>
                        <Link to={`/products/${product._id}`}>
                          <h3 className="font-semibold text-charcoal leading-snug hover:text-primary transition-colors">{product.name}</h3>
                        </Link>
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
                        {product.discount ? (
                          <span className="inline-block rounded-full bg-emerald-50 px-3 py-0.5 text-xs font-semibold text-emerald-600">{product.discount}% OFF</span>
                        ) : (
                          <span className="inline-block rounded-full bg-slate-100 px-3 py-0.5 text-xs font-medium text-soft">{product.stock > 0 ? 'In stock' : 'Out of stock'}</span>
                        )}
                        <div className="pt-3 flex gap-2">
                          {isAdmin && (
                            <>
                              {editingPriceId === product._id ? (
                                <input type="number" value={product.price} onChange={(e) => handlePriceChange(product._id, Number(e.target.value))}
                                  onBlur={() => setEditingPriceId(null)} className="flex-1 rounded-full border border-border px-3 py-2 text-sm outline-none focus:border-primary" autoFocus />
                              ) : (
                                <button onClick={() => setEditingPriceId(product._id)} className="flex-1 rounded-full border border-border bg-white text-sm font-medium text-charcoal py-2 hover:bg-slate-50 transition">Edit price</button>
                              )}
                              <button onClick={() => { setDiscountTargetId(product._id); setDiscountModalOpen(true); }} className="rounded-full border border-border bg-white px-3 py-2 text-sm font-medium text-charcoal hover:bg-slate-50 transition">
                                {product.discount ? `${product.discount}%` : 'Discount'}
                              </button>
                            </>
                          )}
                          <button onClick={() => addItem(product)} className="flex-1 rounded-full bg-primary text-sm font-semibold text-white py-2 hover:bg-primary-hover transition">
                            Add to Inquiry
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {!loading && filtered.length === 0 && (
              <div className="text-center py-20 text-soft">
                <p className="text-lg font-medium">No products found</p>
                <p className="text-sm mt-2">Try adjusting your filters.</p>
              </div>
            )}
          </div>

        </div>
      </div>
      <DiscountModal open={discountModalOpen} initial={10} onClose={() => { setDiscountModalOpen(false); setDiscountTargetId(null); }} onApply={handleApplyDiscount} />
    </div>
  );
}

export default ShopPage;
