import api from './api';
import { Product } from '../types/product';

export async function fetchProducts() {
  const response = await api.get<Product[]>('/products');
  return response.data;
}

export async function fetchProductById(id: string) {
  const response = await api.get<Product>(`/products/${id}`);
  return response.data;
}

export async function fetchCategories() {
  const response = await api.get<{ _id: string; name: string; icon: string; image: string }[]>('/categories');
  return response.data;
}

export async function createProduct(product: Omit<Product, '_id' | 'createdAt'>) {
  const response = await api.post<Product>('/products', product);
  return response.data;
}

export async function updateProduct(id: string, product: Partial<Product>) {
  const response = await api.put<Product>(`/products/${id}`, product);
  return response.data;
}

export async function deleteProduct(id: string) {
  await api.delete(`/products/${id}`);
}
