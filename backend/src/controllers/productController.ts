import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import Product from '../models/Product';

const ALLOWED_FIELDS = ['name', 'description', 'images', 'brand', 'category', 'price', 'discount', 'stock', 'sellerName', 'sellerPhone', 'sellerWhatsapp', 'featured', 'specifications'];
const SENSITIVE_FIELDS = ['sellerPhone', 'sellerWhatsapp'];

function pickAllowed(body: any) {
  const result: any = {};
  for (const key of ALLOWED_FIELDS) {
    if (body[key] !== undefined) result[key] = body[key];
  }
  return result;
}

export const validateProduct = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('brand').trim().notEmpty().withMessage('Brand is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be positive'),
  body('images').isArray({ min: 1 }).withMessage('At least one image is required'),
  body('images.*').isString().isURL().withMessage('Each image must be a valid URL'),
];

function sanitizeProduct(doc: any) {
  if (!doc) return doc;
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  for (const field of SENSITIVE_FIELDS) {
    delete obj[field];
  }
  return obj;
}

export async function getProducts(req: Request, res: Response) {
  const products = await Product.find().sort({ createdAt: -1 });
  res.json(products.map(sanitizeProduct));
}

export async function getProductById(req: Request, res: Response) {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json(sanitizeProduct(product));
}

export async function createProduct(req: Request, res: Response) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
  }

  const data = pickAllowed(req.body);
  const product = await Product.create(data);
  res.status(201).json(product);
}

export async function updateProduct(req: Request, res: Response) {
  const data = pickAllowed(req.body);
  const product = await Product.findByIdAndUpdate(req.params.id, { $set: data }, { new: true, runValidators: true });
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json(product);
}

export async function deleteProduct(req: Request, res: Response) {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.status(204).end();
}
