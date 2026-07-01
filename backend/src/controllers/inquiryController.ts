import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import Inquiry from '../models/Inquiry';
import Admin from '../models/Admin';
import Product from '../models/Product';

export const validateInquiry = [
  body('customer.name').trim().notEmpty().withMessage('Customer name is required'),
  body('customer.phone').trim().notEmpty().withMessage('Phone is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.productId').isMongoId().withMessage('Invalid product ID'),
  body('items.*.name').trim().notEmpty().withMessage('Item name is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('items.*.price').isFloat({ min: 0 }).withMessage('Price must be positive'),
  body('estimatedTotal').isFloat({ min: 0 }).withMessage('Total must be positive'),
];

export async function createInquiry(req: Request, res: Response) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
  }

  const { customer, items, estimatedTotal } = req.body;
  const firebaseUser = res.locals.firebaseUser;
  const firebaseUID = firebaseUser?.uid || '';

  const inquiry = await Inquiry.create({ firebaseUID, customer, items, estimatedTotal });
  res.status(201).json(inquiry);
}

export async function getInquiries(req: Request, res: Response) {
  const inquiries = await Inquiry.find().sort({ createdAt: -1 });
  res.json(inquiries);
}

export async function getMyInquiries(req: Request, res: Response) {
  const firebaseUser = res.locals.firebaseUser;
  if (!firebaseUser) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const inquiries = await Inquiry.find({ firebaseUID: firebaseUser.uid }).sort({ createdAt: -1 });
  res.json(inquiries);
}

export async function getInquiryById(req: Request, res: Response) {
  const inquiry = await Inquiry.findById(req.params.id);
  if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });

  const firebaseUser = res.locals.firebaseUser;
  if (!firebaseUser) return res.status(401).json({ message: 'Unauthorized' });

  const adminRecord = await Admin.findOne({ firebaseUID: firebaseUser.uid });
  const isAdmin = !!adminRecord;
  const isOwner = inquiry.firebaseUID === firebaseUser.uid;
  if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Forbidden' });

  res.json(inquiry);
}

export async function updateInquiryStatus(req: Request, res: Response) {
  const { status } = req.body;
  const validStatuses = ['New', 'Contacted', 'Negotiating', 'Reserved', 'Sold', 'Cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  const inquiry = await Inquiry.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });
  res.json(inquiry);
}
