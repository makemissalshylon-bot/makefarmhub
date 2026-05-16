/**
 * Lazy-loaded route components
 * Reduces initial bundle size by code splitting
 */

import { lazy } from 'react';

// Public pages (load immediately)
export { default as Home } from './pages/Home/Home';
export { default as Login } from './pages/Auth/Login';
export { default as Signup } from './pages/Auth/Signup';

// Marketplace (commonly accessed, preload)
export const Marketplace = lazy(() => import('./pages/Marketplace/Marketplace'));
export const ListingDetail = lazy(() => import('./pages/Marketplace/ListingDetail'));

// User pages (lazy load)
export const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'));
export const Profile = lazy(() => import('./pages/Profile/Profile'));
export const Orders = lazy(() => import('./pages/Orders/Orders'));
export const Messages = lazy(() => import('./pages/Messages/Messages'));
export const Wallet = lazy(() => import('./pages/Wallet/Wallet'));
export const Notifications = lazy(() => import('./pages/Notifications/Notifications'));

// Seller pages (lazy load)
export const CreateListing = lazy(() => import('./pages/CreateListing/CreateListing'));
export const MyListings = lazy(() => import('./pages/MyListings/MyListings'));

// Transport pages (lazy load)
export const Transport = lazy(() => import('./pages/Transport/Transport'));
export const TransportDashboard = lazy(() => import('./pages/Transport/TransportDashboard'));

// Admin pages (rarely accessed, aggressive splitting)
export const AdminDashboard = lazy(() => import('./pages/Admin/AdminDashboard'));
export const AdminUsers = lazy(() => import('./pages/Admin/AdminUsers'));
export const AdminDisputes = lazy(() => import('./pages/Admin/AdminDisputes'));
export const AdminAnalytics = lazy(() => import('./pages/Admin/AdminAnalytics'));

// Settings pages (lazy load)
export const Settings = lazy(() => import('./pages/Settings/Settings'));
export const PrivacyPolicy = lazy(() => import('./pages/Legal/PrivacyPolicy'));
export const TermsOfService = lazy(() => import('./pages/Legal/TermsOfService'));

// Preload commonly accessed routes
export function preloadMarketplace() {
  import('./pages/Marketplace/Marketplace');
}

export function preloadDashboard() {
  import('./pages/Dashboard/Dashboard');
}

export function preloadOrders() {
  import('./pages/Orders/Orders');
}
