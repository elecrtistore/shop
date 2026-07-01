import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { UserRole } from './types/user';
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import InquiryListPage from './pages/InquiryListPage';
import InquiryFormPage from './pages/InquiryFormPage';
import InquirySuccessPage from './pages/InquirySuccessPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import MyInquiriesPage from './pages/MyInquiriesPage';
import Layout from './components/Layout';

function RoleGuard({ allowed, children }: { allowed: UserRole[]; children: JSX.Element }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowed.includes(user.role)) {
    return <Navigate to="/shop" replace />;
  }

  return children;
}

function App() {
  return (
    <div className="min-h-screen bg-background text-charcoal">
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/products/:id" element={<ProductDetailsPage />} />
          <Route path="/inquiry-list" element={<InquiryListPage />} />
          <Route path="/inquiry" element={<InquiryFormPage />} />
          <Route path="/success" element={<InquirySuccessPage />} />
          <Route path="/my-inquiries" element={<RoleGuard allowed={['Buyer', 'Seller', 'Admin']}><MyInquiriesPage /></RoleGuard>} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/admin" element={<RoleGuard allowed={['Admin']}><AdminDashboardPage /></RoleGuard>} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contacts" element={<ContactPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
        </Routes>
      </Layout>
    </div>
  );
}

export default App;
