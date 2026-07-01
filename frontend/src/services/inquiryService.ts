import api from './api';
import { Inquiry, InquiryItem } from '../types/inquiry';

export interface InquiryRequest {
  customer: {
    name: string;
    phone: string;
  };
  items: InquiryItem[];
  estimatedTotal: number;
  status?: string;
}

export async function submitInquiry(inquiry: InquiryRequest) {
  const response = await api.post<Inquiry>('/inquiries', inquiry);
  return response.data;
}

export async function fetchInquiries() {
  const response = await api.get<Inquiry[]>('/inquiries');
  return response.data;
}

export async function fetchMyInquiries() {
  const response = await api.get<Inquiry[]>('/inquiries/my');
  return response.data;
}

export async function updateInquiryStatus(id: string, status: string) {
  const response = await api.put<Inquiry>(`/inquiries/${id}/status`, { status });
  return response.data;
}
