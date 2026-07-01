import { useEffect, useState } from 'react';
import { Inquiry } from '../types/inquiry';
import { fetchMyInquiries, updateInquiryStatus } from '../services/inquiryService';
import { ClipboardList, Package, Clock, CheckCircle } from 'lucide-react';

function MyInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyInquiries().then(setInquiries).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="pt-24 min-h-screen flex items-center justify-center"><div className="animate-pulse text-soft">Loading...</div></div>;

  return (
    <div className="pt-24 min-h-screen">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-charcoal">My Inquiries</h1>
          <p className="mt-1 text-sm text-soft">{inquiries.length} inquiry{inquiries.length !== 1 ? 'ies' : 'y'}</p>
        </div>

        {inquiries.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <ClipboardList size={48} className="text-soft mx-auto" />
            <p className="text-soft">You haven't submitted any inquiries yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {inquiries.map((inquiry) => (
              <div key={inquiry._id} className="bg-white border border-border/60 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Package size={15} className="text-primary shrink-0" />
                    <span className="text-xs font-mono text-soft">{inquiry._id.slice(-8)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-charcoal">{inquiry.status}</span>
                    {inquiry.status !== 'Sold' && inquiry.status !== 'Cancelled' && (
                      <button
                        onClick={async () => {
                          const updated = await updateInquiryStatus(inquiry._id, 'Sold');
                          setInquiries((prev) => prev.map((i) => (i._id === inquiry._id ? updated : i)));
                        }}
                        className="bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 hover:bg-emerald-100 transition flex items-center gap-1"
                      >
                        <CheckCircle size={11} /> Sold
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <p className="text-soft">{inquiry.customer.name}</p>
                    <p className="text-soft">{inquiry.customer.phone}</p>
                  </div>
                  <div>
                    <p className="text-soft">{inquiry.customer.county || 'N/A'}{inquiry.customer.town ? `, ${inquiry.customer.town}` : ''}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-soft">{new Date(inquiry.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-1.5 font-medium text-soft">Product</th>
                      <th className="text-left py-1.5 font-medium text-soft">Qty</th>
                      <th className="text-right py-1.5 font-medium text-soft">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inquiry.items.map((item) => (
                      <tr key={item.productId} className="border-b border-border/50">
                        <td className="py-1.5 font-medium text-charcoal">{item.name}</td>
                        <td className="py-1.5 text-soft">{item.quantity}</td>
                        <td className="py-1.5 text-right font-medium text-charcoal">KSh {item.price.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-xs text-soft">Total</span>
                  <span className="text-base font-bold text-charcoal">KSh {inquiry.estimatedTotal.toLocaleString()}</span>
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
