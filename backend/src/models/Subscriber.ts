import { Schema, model } from 'mongoose';

const subscriberSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  name: { type: String, default: '' },
  active: { type: Boolean, default: true },
}, { timestamps: true });

export default model('Subscriber', subscriberSchema);
