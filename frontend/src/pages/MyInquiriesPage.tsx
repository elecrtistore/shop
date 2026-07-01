import { useEffect, useState } from 'react';
import { Inquiry } from '../types/inquiry';
import { fetchInquiries, updateInquiryStatus } from '../services/inquiryService';
import { ClipboardList, Package, Clock, CheckCircle } from 'lucide-react';

function MyInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInquiries().then(setInquiries).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="pt-24 min-h-screen flex items-center justify-center"><div className="animate-pulse text-soft">Loading...</div></div>;

  return (
    <div className="pt-24 min-h-screen">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-charcoal">My Inquiries</h1>
          <p className="mt-2 text-sm text-soft">Track your inquiry status and review details for each request.</p>
        </div>

        {inquiries.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <ClipboardList size={48} className="text-soft mx-auto" />
            <p className="text-soft">You haven't submitted any inquiries yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {inquiries.map((inquiry) => (
              <div key={inquiry._id} className="rounded-2xl bg-white border border-border/60 p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Package size={18} className="text-primary" />
                    <span className="text-sm font-mono text-soft">{inquiry._id.slice(-8)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-4 py-1.5 text-xs font-semibold text-charcoal">{inquiry.status}</span>
                    {inquiry.status !== 'Sold' && inquiry.status !== 'Cancelled' && (
                      <button
                        onClick={async () => {
                          const updated = await updateInquiryStatus(inquiry._id, 'Sold');
                          setInquiries((prev) => prev.map((i) => (i._id === inquiry._id ? updated : i)));
                        }}
                        className="rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-100 transition flex items-center gap-1"
                      >
                        <CheckCircle size={12} /> Order met
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-soft">Customer</p>
                    <p className="font-semibold text-charcoal mt-1">{inquiry.customer.name}</p>
                    <p className="text-soft">{inquiry.customer.phone}</p>
                  </div>
                  <div>
                    <p className="text-soft">Location</p>
                    <p className="font-semibold text-charcoal mt-1">{inquiry.customer.county || 'N/A'}{inquiry.customer.town ? `, ${inquiry.customer.town}` : ''}</p>
                  </div>
                  <div>
                    <p className="text-soft flex items-center gap-1"><Clock size={14} /> Submitted</p>
                    <p className="font-semibold text-charcoal mt-1">{new Date(inquiry.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 font-medium text-soft">Product</th>
                        <th className="text-left py-2 font-medium text-soft">Qty</th>
                        <th className="text-right py-2 font-medium text-soft">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inquiry.items.map((item) => (
                        <tr key={item.productId} className="border-b border-border/50">
                          <td className="py-3 font-medium text-charcoal">{item.name}</td>
                          <td className="py-3 text-soft">{item.quantity}</td>
                          <td className="py-3 text-right font-medium text-charcoal">KSh {item.price.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-sm text-soft">Estimated total</span>
                  <span className="text-xl font-bold text-charcoal">KSh {inquiry.estimatedTotal.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyInquiriesPage;
