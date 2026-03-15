import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/UI/Toast';
import { AppDataProvider } from './context/AppDataContext';
import { LanguageProvider } from './context/LanguageContext';
import { AccessibilityProvider } from './components/Accessibility/AccessibilityProvider';
import Layout from './components/Layout/Layout';
import DashboardLayout from './components/Dashboard/DashboardLayout';
import MetaTags from './components/SEO/MetaTags';
import StructuredData, { defaultOrganizationData } from './components/SEO/StructuredData';
import GoogleAnalytics from './components/Analytics/GoogleAnalytics';

// Lazy-load non-critical shell components
const BottomNavigation = lazy(() => import('./components/Mobile/BottomNavigation'));
const AccessibilityPanel = lazy(() => import('./components/Accessibility/AccessibilityPanel'));
const InstallPrompt = lazy(() => import('./components/PWA/InstallPrompt'));
const OfflineIndicator = lazy(() => import('./components/PWA/OfflineIndicator'));
const LiveChat = lazy(() => import('./components/Chat/LiveChat'));
const WelcomeTour = lazy(() => import('./components/Onboarding/WelcomeTour'));
import './style.css';
import './styles/animations.css';

// Lazy load pages for faster initial load
const Login = lazy(() => import('./pages/Auth/Login'));
const Signup = lazy(() => import('./pages/Auth/Signup'));
const Landing = lazy(() => import('./pages/Landing/Landing'));
const FarmerDashboard = lazy(() => import('./pages/Dashboard/FarmerDashboard'));
const BuyerDashboard = lazy(() => import('./pages/Dashboard/BuyerDashboard'));
const TransporterDashboard = lazy(() => import('./pages/Dashboard/TransporterDashboard'));
const AdminDashboard = lazy(() => import('./pages/Admin/AdminDashboard'));
const AdminTransactions = lazy(() => import('./pages/Admin/AdminTransactions'));
const AdminUsers = lazy(() => import('./pages/Admin/AdminUsers'));
const AdminDisputes = lazy(() => import('./pages/Admin/AdminDisputes'));
const AdminListings = lazy(() => import('./pages/Admin/AdminListings'));
const AdminPayments = lazy(() => import('./pages/Admin/AdminPayments'));
const AdminNotifications = lazy(() => import('./pages/Admin/AdminNotifications'));
const AdminSettings = lazy(() => import('./pages/Admin/AdminSettings'));
const AdminReports = lazy(() => import('./pages/Admin/AdminReports'));
const AdminAnalytics = lazy(() => import('./pages/Admin/AdminAnalytics'));
const Marketplace = lazy(() => import('./pages/Marketplace/Marketplace'));
const ListingDetail = lazy(() => import('./pages/Listings/ListingDetail'));
const CreateListing = lazy(() => import('./pages/Listings/CreateListing'));
const MyListings = lazy(() => import('./pages/Listings/MyListings'));
const Orders = lazy(() => import('./pages/Orders/Orders'));
const OrderDetail = lazy(() => import('./pages/Orders/OrderDetail'));
const Messages = lazy(() => import('./pages/Messages/Messages'));
const Notifications = lazy(() => import('./pages/Notifications/Notifications'));
const Profile = lazy(() => import('./pages/Profile/Profile'));
const Settings = lazy(() => import('./pages/Settings/Settings'));
const Wallet = lazy(() => import('./pages/Wallet/Wallet'));
const Favorites = lazy(() => import('./pages/Favorites/Favorites'));
const TransportBooking = lazy(() => import('./pages/Transport/TransportBooking'));
const TransportTracking = lazy(() => import('./pages/Transport/TransportTracking'));
const Vehicles = lazy(() => import('./pages/Transport/Vehicles'));
const PrivacyPolicy = lazy(() => import('./pages/Legal/PrivacyPolicy'));
const TermsConditions = lazy(() => import('./pages/Legal/TermsConditions'));
const HelpCenter = lazy(() => import('./pages/Help/HelpCenter'));

// Loading fallback component
const PageLoader = () => (
  <div className="page-loader">
    <div className="loading-spinner" />
  </div>
);

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Dashboard Router - routes to correct dashboard based on role
function DashboardRouter() {
  const { user } = useAuth();

  switch (user?.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'farmer':
      return <FarmerDashboard />;
    case 'buyer':
      return <BuyerDashboard />;
    case 'transporter':
      return <TransporterDashboard />;
    default:
      return <BuyerDashboard />;
  }
}

// Admin Route Guard
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Suspense fallback={<PageLoader />}>
    <Routes>
      {/* Public Routes */}
      <Route
        path="/"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Landing />}
      />
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        path="/signup"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Signup />}
      />
      
      {/* Public Legal Pages */}
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsConditions />} />
      <Route path="/help" element={<HelpCenter />} />

      {/* Protected Routes with Dashboard Sidebar Layout */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<DashboardRouter />} />
        <Route path="my-listings" element={<MyListings />} />
        <Route path="create-listing" element={<CreateListing />} />
        <Route path="orders" element={<Orders />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="messages" element={<Messages />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
        <Route path="wallet" element={<Wallet />} />
        <Route path="favorites" element={<Favorites />} />
        <Route path="transport/booking" element={<TransportBooking />} />
        <Route path="transport/tracking" element={<TransportTracking />} />
        <Route path="my-vehicles" element={<Vehicles />} />
        
        {/* Admin Routes */}
        <Route path="admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="admin/transactions" element={<AdminRoute><AdminTransactions /></AdminRoute>} />
        <Route path="admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
        <Route path="admin/disputes" element={<AdminRoute><AdminDisputes /></AdminRoute>} />
        <Route path="admin/disputes/:id" element={<AdminRoute><AdminDisputes /></AdminRoute>} />
        <Route path="admin/orders" element={<AdminRoute><Orders /></AdminRoute>} />
        <Route path="admin/listings" element={<AdminRoute><AdminListings /></AdminRoute>} />
        <Route path="admin/payments" element={<AdminRoute><AdminPayments /></AdminRoute>} />
        <Route path="admin/notifications" element={<AdminRoute><AdminNotifications /></AdminRoute>} />
        <Route path="admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
        <Route path="admin/reports" element={<AdminRoute><AdminReports /></AdminRoute>} />
        <Route path="admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
      </Route>

      {/* Protected Routes with Regular Layout (Browse/Public-facing) */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="marketplace" element={<Marketplace />} />
        <Route path="listing/:id" element={<ListingDetail />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/"} replace />} />
    </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <LanguageProvider>
          <AccessibilityProvider>
            <ToastProvider>
              <AuthProvider>
                <AppDataProvider>
                  <MetaTags />
                  <StructuredData type="organization" data={defaultOrganizationData} />
                  <GoogleAnalytics />
                  <Suspense fallback={null}>
                    <OfflineIndicator />
                  </Suspense>
                  <AppRoutes />
                  <Suspense fallback={null}>
                    <BottomNavigation />
                    <AccessibilityPanel />
                    <LiveChat />
                    <WelcomeTour />
                    <InstallPrompt />
                  </Suspense>
                </AppDataProvider>
              </AuthProvider>
            </ToastProvider>
          </AccessibilityProvider>
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;

