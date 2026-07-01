import api from './api';

export interface AuthProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'Buyer' | 'Seller' | 'Admin';
}

export async function fetchProfile(idToken: string) {
  const response = await api.get<AuthProfile>('/auth/profile', {
    headers: {
      Authorization: `Bearer ${idToken}`
    }
  });
  return response.data;
}

export async function assignRole(idToken: string, role: string, adminCode?: string, displayName?: string) {
  const response = await api.post<AuthProfile>(
    '/auth/signup',
    { role, adminCode, displayName },
    {
      headers: {
        Authorization: `Bearer ${idToken}`
      }
    }
  );
  return response.data;
}

export async function updateProfileDisplayName(idToken: string, displayName: string) {
  const response = await api.put<AuthProfile>(
    '/auth/profile',
    { displayName },
    {
      headers: {
        Authorization: `Bearer ${idToken}`
      }
    }
  );
  return response.data;
}
