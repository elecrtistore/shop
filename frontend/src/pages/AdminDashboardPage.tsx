import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Product } from '../types/product';
import { Inquiry } from '../types/inquiry';
import { fetchProducts, createProduct, updateProduct, deleteProduct } from '../services/productService';
import { fetchInquiries } from '../services/inquiryService';
import api from '../services/api';
import DiscountModal from '../components/DiscountModal';

const adminCards = [
  { id: 'products', title: 'Products', description: 'Manage shop listings and pricing', icon: '📦' },
  { id: 'orders', title: 'Inquiries', description: 'Review incoming customer requests', icon: '✉️' },
  { id: 'layout', title: 'Page layout', description: 'Rearrange product cards and page sections', icon: '🧩' },
  { id: 'discounts', title: 'Discount builder', description: 'Create a custom price layout with one click', icon: '🏷️' },
];

interface DashboardStats {
  totalProducts: number;
  totalInquiries: number;
  newInquiries: number;
  soldItems: number;
}

const initialForm = {
  name: '',
  brand: '',
  category: 'Accessories',
  description: '',
  price: '',
  stock: '1',
  imageUrl: '',
};

function AdminDashboardPage() {
  const { user } = useAuth();
  const [cards, setCards] = useState(adminCards);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCard, setActiveCard] = useState('products');
  const [newProduct, setNewProduct] = useState(initialForm);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [stats, setStats] = useState<DashboardStats>({ totalProducts: 0, totalInquiries: 0, newInquiries: 0, soldItems: 0 });
  const [formError, setFormError] = useState<string | null>(null);
  const [discountModalOpen, setDiscountModalOpen] = useState(false);
  const [discountTargetId, setDiscountTargetId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editImageInput, setEditImageInput] = useState('');

  useEffect(() => {
    fetchProducts().then(setProducts).catch(console.error);
    fetchInquiries().then(setInquiries).catch(console.error);
    api.get<DashboardStats>('/dashboard/stats').then((res) => setStats(res.data)).catch(console.error);
  }, []);

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, id: string) => {
    event.dataTransfer.setData('text/plain', id);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>, id: string) => {
    event.preventDefault();
    const draggedId = event.dataTransfer.getData('text/plain');
    if (!draggedId || draggedId === id) return;

    setCards((current) => {
      const updated = [...current];
      const fromIndex = updated.findIndex((card) => card.id === draggedId);
      const toIndex = updated.findIndex((card) => card.id === id);
      if (fromIndex === -1 || toIndex === -1) return current;
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
  };

  const updateField = (field: string, value: string) => {
    setNewProduct((current) => ({ ...current, [field]: value }));
  };

  const addImageUrl = () => {
    const nextUrl = newProduct.imageUrl.trim();
    if (!nextUrl) return;
    setImageUrls((current) => [...current, nextUrl]);
    setNewProduct((current) => ({ ...current, imageUrl: '' }));
  };

  const handleAddProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const priceValue = Number(newProduct.price);
    const stockValue = Number(newProduct.stock);
    const images = imageUrls.length ? imageUrls : newProduct.imageUrl.trim() ? [newProduct.imageUrl.trim()] : [];

    if (!newProduct.name || !newProduct.brand || !newProduct.description || !newProduct.category || !priceValue || !stockValue || images.length === 0) {
      setFormError('Please complete the form and add at least one image URL.');
      return;
    }

    try {
      const product = await createProduct({
        name: newProduct.name,
        brand: newProduct.brand,
        category: newProduct.category,
        description: newProduct.description,
        price: priceValue,
        stock: stockValue,
        images,
        sellerName: user?.displayName || 'ElectriShop Owner',
        sellerPhone: '+254700123456',
        sellerWhatsapp: '254700123456',
        featured: false,
        specifications: {},
      });
      setProducts((current) => [product, ...current]);
      setNewProduct(initialForm);
      setImageUrls([]);
      setFormError(null);
    } catch (err) {
      setFormError('Failed to create product. Please try again.');
    }
  };

  const applyDiscount = (productId: string) => {
    setDiscountTargetId(productId);
    setDiscountModalOpen(true);
  };

  const handleApplyDiscount = async (percent: number) => {
    if (!discountTargetId) return;
    setProducts((current) => current.map((p) => (p._id === discountTargetId ? { ...p, discount: percent } : p)));
    try {
      await updateProduct(discountTargetId, { discount: percent });
    } catch (err) {
      console.error('Failed to update discount', err);
    }
    setDiscountTargetId(null);
    setDiscountModalOpen(false);
  };

  const handleRemoveDiscount = async (productId: string) => {
    setProducts((current) => current.map((p) => (p._id === productId ? { ...p, discount: 0 } : p)));
    try {
      await updateProduct(productId, { discount: 0 });
    } catch (err) {
      console.error('Failed to remove discount', err);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setEditImages([...product.images]);
    setEditImageInput('');
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setEditImages([]);
    setEditImageInput('');
  };

  const handleAddEditImage = () => {
    const url = editImageInput.trim();
    if (!url) return;
    setEditImages((current) => [...current, url]);
    setEditImageInput('');
  };

  const handleRemoveEditImage = (index: number) => {
    setEditImages((current) => current.filter((_, i) => i !== index));
  };

  const handleSaveEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingProduct) return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = (formData.get('name') as string)?.trim();
    const brand = (formData.get('brand') as string)?.trim();
    const category = (formData.get('category') as string)?.trim();
    const description = (formData.get('description') as string)?.trim();
    const price = Number(formData.get('price'));
    const stock = Number(formData.get('stock'));

    if (!name || !brand || !description || !category || !price || !stock || editImages.length === 0) return;

    try {
      const updated = await updateProduct(editingProduct._id, {
        name, brand, category, description, price, stock,
        images: editImages
      });
      setProducts((current) => current.map((p) => (p._id === editingProduct._id ? { ...p, ...updated } : p)));
      setEditingProduct(null);
      setEditImages([]);
      setEditImageInput('');
    } catch (err) {
      console.error('Failed to update product', err);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteProduct(productId);
      setProducts((current) => current.filter((p) => p._id !== productId));
    } catch (err) {
      console.error('Failed to delete product', err);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-[2rem] bg-gradient-to-r from-white via-orange-50 to-slate-100 p-8 shadow-soft ring-1 ring-slate-200/70">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-600">Admin dashboard</p>
            <h1 className="mt-3 text-4xl font-semibold text-charcoal">Welcome back, {user?.displayName || 'Admin'}.</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">Manage inventory, review customer inquiries, and keep product pricing up to date.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-slate-200/70">
              <p className="text-sm text-slate-500">Products</p>
              <p className="mt-3 text-3xl font-semibold text-charcoal">{stats.totalProducts}</p>
            </div>
            <div className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-slate-200/70">
              <p className="text-sm text-slate-500">Inquiries</p>
              <p className="mt-3 text-3xl font-semibold text-charcoal">{stats.totalInquiries}</p>
            </div>
            <div className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-slate-200/70">
              <p className="text-sm text-slate-500">New</p>
              <p className="mt-3 text-3xl font-semibold text-charcoal">{stats.newInquiries}</p>
            </div>
            <div className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-slate-200/70">
              <p className="text-sm text-slate-500">Sold</p>
              <p className="mt-3 text-3xl font-semibold text-charcoal">{stats.soldItems}</p>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[300px_1fr]">
          <aside className="space-y-4">
            <div className="rounded-[1.75rem] bg-white p-6 shadow-soft ring-1 ring-slate-200/70">
              <h2 className="text-xl font-semibold text-charcoal">Control panel</h2>
              <p className="mt-3 text-sm text-slate-600">Open any section to manage products, review inquiries, or tune dashboard layout.</p>
              <div className="mt-6 space-y-3">
                {cards.map((card) => (
                  <button
                    key={card.id}
                    onClick={() => setActiveCard(card.id)}
                    className={`w-full rounded-3xl px-4 py-3 text-left text-sm font-semibold transition ${
                      activeCard === card.id ? 'bg-orange-50 text-orange-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {card.title}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[1.75rem] bg-white p-6 shadow-soft ring-1 ring-slate-200/70">
              <h2 className="text-xl font-semibold text-charcoal">Reorder cards</h2>
              <p className="mt-3 text-sm text-slate-600">Drag a card into position to customize the admin sidebar order.</p>
              <div className="mt-6 space-y-3">
                {cards.map((card) => (
                  <div
                    key={card.id}
                    draggable
                    onDragStart={(event) => handleDragStart(event, card.id)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => handleDrop(event, card.id)}
                    className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span>{card.icon}</span>
                      <span>{card.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <section className="space-y-6">
            {activeCard === 'products' && (
              <div className="space-y-6">
                <div className="rounded-[1.75rem] bg-white p-6 shadow-soft ring-1 ring-slate-200/70">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-charcoal">Add new product</h2>
                      <p className="mt-2 text-sm text-slate-600">Upload product details, set a price, and add one or more image URLs.</p>
                    </div>
                  </div>
                  <form onSubmit={handleAddProduct} className="mt-6 grid gap-5">
                    {formError && (
                      <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{formError}</div>
                    )}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span className="text-sm font-medium text-slate-700">Product name</span>
                        <input value={newProduct.name} onChange={(event) => updateField('name', event.target.value)} className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-charcoal focus:border-primary outline-none" />
                      </label>
                      <label className="block">
                        <span className="text-sm font-medium text-slate-700">Brand</span>
                        <input value={newProduct.brand} onChange={(event) => updateField('brand', event.target.value)} className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-charcoal focus:border-primary outline-none" />
                      </label>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span className="text-sm font-medium text-slate-700">Category</span>
                        <input value={newProduct.category} onChange={(event) => updateField('category', event.target.value)} className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-charcoal focus:border-primary outline-none" />
                      </label>
                      <label className="block">
                        <span className="text-sm font-medium text-slate-700">Price (KSh)</span>
                        <input type="number" value={newProduct.price} onChange={(event) => updateField('price', event.target.value)} className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-charcoal focus:border-primary outline-none" />
                      </label>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span className="text-sm font-medium text-slate-700">Stock quantity</span>
                        <input type="number" value={newProduct.stock} onChange={(event) => updateField('stock', event.target.value)} className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-charcoal focus:border-primary outline-none" />
                      </label>
                      <label className="block">
                        <span className="text-sm font-medium text-slate-700">Image URL</span>
                        <div className="mt-2 flex gap-2">
                          <input value={newProduct.imageUrl} onChange={(event) => updateField('imageUrl', event.target.value)} placeholder="https://" className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-charcoal focus:border-primary outline-none" />
                          <button type="button" onClick={addImageUrl} className="rounded-3xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">Add</button>
                        </div>
                      </label>
                    </div>

                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">Description</span>
                      <textarea value={newProduct.description} onChange={(event) => updateField('description', event.target.value)} rows={4} className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-charcoal focus:border-primary outline-none" />
                    </label>

                    {imageUrls.length > 0 && (
                      <div className="rounded-3xl bg-slate-50 p-4">
                        <p className="text-sm text-slate-500">Added image URLs</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {imageUrls.map((url, index) => (
                            <span key={`${url}-${index}`} className="rounded-full bg-white px-4 py-2 text-xs text-slate-700 shadow-sm">{url}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    <button type="submit" className="w-full rounded-[1.25rem] bg-primary px-6 py-4 text-sm font-semibold text-white transition hover:bg-orange-600">Create product</button>
                  </form>
                </div>

                {products.length > 0 && (
                  <div className="rounded-[1.75rem] bg-white p-6 shadow-soft ring-1 ring-slate-200/70">
                    <h2 className="text-xl font-semibold text-charcoal">Product catalog</h2>
                    <p className="mt-2 text-sm text-slate-600">Review, edit, or remove products and manage images.</p>
                    <div className="mt-6 space-y-4">
                      {products.map((product) => (
                        <div key={product._id} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                          <div className="grid gap-4 md:grid-cols-[140px_minmax(0,1fr)_170px] md:items-center">
                            <img src={product.images[0]} alt={product.name} className="h-32 w-full rounded-[1.5rem] object-cover md:h-32 md:w-32" />
                            <div>
                              <h3 className="text-lg font-semibold text-charcoal">{product.name}</h3>
                              <p className="mt-1 text-sm text-slate-500">{product.brand} · {product.category}</p>
                              <p className="mt-3 text-sm text-slate-600 line-clamp-2">{product.description}</p>
                            </div>
                            <div className="space-y-3 text-right">
                              <p className="text-lg font-semibold text-charcoal">KSh {product.price.toLocaleString()}</p>
                              <div className="flex flex-wrap items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleEditProduct(product)}
                                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-blue-100"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => product.discount ? handleRemoveDiscount(product._id) : applyDiscount(product._id)}
                                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                                >
                                  {product.discount ? `Remove discount (${product.discount}%)` : 'Add discount'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteProduct(product._id)}
                                  className="rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {editingProduct && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] bg-white p-8 shadow-soft">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-charcoal">Edit product</h2>
                        <button type="button" onClick={handleCancelEdit} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">&times;</button>
                      </div>
                      <form onSubmit={handleSaveEdit} className="mt-6 grid gap-5">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <label className="block">
                            <span className="text-sm font-medium text-slate-700">Product name</span>
                            <input name="name" defaultValue={editingProduct.name} className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-charcoal focus:border-primary outline-none" />
                          </label>
                          <label className="block">
                            <span className="text-sm font-medium text-slate-700">Brand</span>
                            <input name="brand" defaultValue={editingProduct.brand} className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-charcoal focus:border-primary outline-none" />
                          </label>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <label className="block">
                            <span className="text-sm font-medium text-slate-700">Category</span>
                            <input name="category" defaultValue={editingProduct.category} className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-charcoal focus:border-primary outline-none" />
                          </label>
                          <label className="block">
                            <span className="text-sm font-medium text-slate-700">Price (KSh)</span>
                            <input type="number" name="price" defaultValue={editingProduct.price} className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-charcoal focus:border-primary outline-none" />
                          </label>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <label className="block">
                            <span className="text-sm font-medium text-slate-700">Stock quantity</span>
                            <input type="number" name="stock" defaultValue={editingProduct.stock} className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-charcoal focus:border-primary outline-none" />
                          </label>
                        </div>

                        <label className="block">
                          <span className="text-sm font-medium text-slate-700">Description</span>
                          <textarea name="description" defaultValue={editingProduct.description} rows={3} className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-charcoal focus:border-primary outline-none" />
                        </label>

                        <div>
                          <span className="text-sm font-medium text-slate-700">Images</span>
                          <div className="mt-2 flex gap-2">
                            <input value={editImageInput} onChange={(e) => setEditImageInput(e.target.value)} placeholder="https://" className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-charcoal focus:border-primary outline-none" />
                            <button type="button" onClick={handleAddEditImage} className="rounded-3xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">Add</button>
                          </div>
                          {editImages.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-3">
                              {editImages.map((url, index) => (
                                <div key={`${url}-${index}`} className="group relative h-20 w-20 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                                  <img src={url} alt="" className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                                  <button type="button" onClick={() => handleRemoveEditImage(index)} className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-xs text-white opacity-0 transition group-hover:opacity-100">&times;</button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-3">
                          <button type="submit" className="flex-1 rounded-[1.25rem] bg-primary px-6 py-4 text-sm font-semibold text-white transition hover:bg-orange-600">Save changes</button>
                          <button type="button" onClick={handleCancelEdit} className="rounded-[1.25rem] border border-slate-200 bg-white px-6 py-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">Cancel</button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeCard === 'orders' && (
              <div className="rounded-[1.75rem] bg-white p-6 shadow-soft ring-1 ring-slate-200/70">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-charcoal">Inquiries</h2>
                    <p className="mt-2 text-sm text-slate-600">All submitted inquiries are listed here with buyer details and item summaries.</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">{inquiries.length} inquiries</span>
                </div>
                <div className="mt-6 space-y-4">
                  {inquiries.map((inquiry) => (
                    <div key={inquiry._id} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6">
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-sm text-slate-500">Inquiry ID</p>
                          <p className="mt-1 text-lg font-semibold text-charcoal">{inquiry._id}</p>
                        </div>
                        <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700">{inquiry.status}</div>
                      </div>
                      <div className="mt-6 grid gap-4 md:grid-cols-3">
                        <div>
                          <p className="text-sm text-slate-500">Buyer</p>
                          <p className="mt-1 text-sm font-semibold text-charcoal">{inquiry.customer.name}</p>
                          <p className="text-sm text-slate-500">{inquiry.customer.phone}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Location</p>
                          <p className="mt-1 text-sm font-semibold text-charcoal">{inquiry.customer.county}, {inquiry.customer.town}</p>
                          <p className="text-sm text-slate-500">{inquiry.customer.estate}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Submitted</p>
                          <p className="mt-1 text-sm font-semibold text-charcoal">{new Date(inquiry.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>

                      {inquiry.customer.notes && (
                        <div className="mt-6 rounded-[1.5rem] bg-white p-4">
                          <p className="text-sm text-slate-500">Buyer notes</p>
                          <p className="mt-2 text-sm text-slate-700">{inquiry.customer.notes}</p>
                        </div>
                      )}

                      <div className="mt-6 overflow-x-auto">
                        <table className="min-w-full text-left text-sm text-slate-600">
                          <thead>
                            <tr>
                              <th className="pb-3 font-semibold text-slate-800">Product</th>
                              <th className="pb-3 font-semibold text-slate-800">Qty</th>
                              <th className="pb-3 font-semibold text-slate-800">Price</th>
                            </tr>
                          </thead>
                          <tbody>
                            {inquiry.items.map((item) => (
                              <tr key={item.productId} className="border-t border-slate-200">
                                <td className="py-3 font-medium text-charcoal">{item.name}</td>
                                <td className="py-3">{item.quantity}</td>
                                <td className="py-3">KSh {item.price.toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-slate-600">Estimated total</p>
                        <p className="text-lg font-semibold text-charcoal">KSh {inquiry.estimatedTotal.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                  {inquiries.length === 0 && (
                    <p className="rounded-[1.5rem] bg-white p-6 text-center text-sm text-slate-500">No inquiries yet.</p>
                  )}
                </div>
              </div>
            )}

            <DiscountModal open={discountModalOpen} initial={10} onClose={() => { setDiscountModalOpen(false); setDiscountTargetId(null); }} onApply={handleApplyDiscount} />

            {activeCard === 'layout' && (
              <div className="rounded-[1.75rem] bg-white p-6 shadow-soft ring-1 ring-slate-200/70">
                <h2 className="text-xl font-semibold text-charcoal">Page layout</h2>
                <p className="mt-2 text-sm text-slate-600">Rearrange the admin dashboard cards and customize how these controls appear.</p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {cards.map((card) => (
                    <div key={card.id} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                      <p className="text-sm text-slate-500">{card.title}</p>
                      <p className="mt-2 text-sm text-slate-700">{card.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeCard === 'discounts' && (
              <div className="rounded-[1.75rem] bg-white p-6 shadow-soft ring-1 ring-slate-200/70">
                <h2 className="text-xl font-semibold text-charcoal">Discount builder</h2>
                <p className="mt-2 text-sm text-slate-600">Use the product catalog to apply percentage discounts and fine-tune pricing from the original product value.</p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm text-slate-500">Discounted products</p>
                    <p className="mt-2 text-2xl font-semibold text-charcoal">{products.filter((p) => p.discount && p.discount > 0).length}</p>
                  </div>
                  <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm text-slate-500">Example</p>
                    <p className="mt-2 text-sm text-slate-700">A 20% discount on KSh 5,400 becomes KSh 4,320.</p>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboardPage;
