import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import Category from '../models/Category';

const ALLOWED_FIELDS = ['name', 'icon', 'image'];

function pickAllowed(body: any) {
  const result: any = {};
  for (const key of ALLOWED_FIELDS) {
    if (body[key] !== undefined) result[key] = body[key];
  }
  return result;
}

export const validateCategory = [
  body('name').trim().notEmpty().withMessage('Name is required'),
];

export async function getCategories(req: Request, res: Response) {
  const categories = await Category.find().sort({ name: 1 });
  res.json(categories);
}

export async function createCategory(req: Request, res: Response) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
  }

  const data = pickAllowed(req.body);
  const category = await Category.create(data);
  res.status(201).json(category);
}

export async function updateCategory(req: Request, res: Response) {
  const data = pickAllowed(req.body);
  const category = await Category.findByIdAndUpdate(req.params.id, { $set: data }, { new: true, runValidators: true });
  if (!category) return res.status(404).json({ message: 'Category not found' });
  res.json(category);
}

export async function deleteCategory(req: Request, res: Response) {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) return res.status(404).json({ message: 'Category not found' });
  res.status(204).end();
}
