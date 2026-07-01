import { Schema, model } from 'mongoose';

const inquirySchema = new Schema({
  firebaseUID: { type: String, default: '' },
  customer: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    county: { type: String, default: '' },
    town: { type: String, default: '' },
    estate: { type: String, default: '' },
    landmark: { type: String, default: '' },
    notes: { type: String, default: '' }
  },
  items: [
    {
      productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
      name: { type: String, required: true },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true }
    }
  ],
  estimatedTotal: { type: Number, required: true },
  status: { type: String, enum: ['New', 'Contacted', 'Negotiating', 'Reserved', 'Sold', 'Cancelled'], default: 'New' }
}, { timestamps: true });

export default model('Inquiry', inquirySchema);
