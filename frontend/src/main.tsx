import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { InquiryProvider } from './contexts/InquiryContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <InquiryProvider>
        <BrowserRouter basename="/Alextronics">
          <App />
        </BrowserRouter>
      </InquiryProvider>
    </AuthProvider>
  </React.StrictMode>
);
