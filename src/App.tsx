import { Route, Routes } from 'react-router-dom'
import { SiteLayout } from './components/site/SiteLayout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AdminRoute } from './components/AdminRoute'
import { AuthPage } from './pages/AuthPage'
import { HomePage } from './pages/HomePage'
import { BrowsePage } from './pages/BrowsePage'
import { AuctionPage } from './pages/AuctionPage'
import { LiveAuctionPage } from './pages/LiveAuctionPage'
import { LotDetailPage } from './pages/LotDetailPage'
import { SellerOnboardingPage } from './pages/SellerOnboardingPage'
import { CreateListingPage } from './pages/CreateListingPage'
import { SellerDashboardPage } from './pages/SellerDashboardPage'
import { StyleguidePage } from './pages/StyleguidePage'
import { AdminAuctionsPage } from './pages/admin/AdminAuctionsPage'
import { AdminAuctionDetailPage } from './pages/admin/AdminAuctionDetailPage'

function App() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/styleguide" element={<StyleguidePage />} />
      <Route element={<SiteLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/listings" element={<BrowsePage />} />
        <Route path="/listings/:id" element={<LotDetailPage />} />
        <Route path="/auctions/:id" element={<AuctionPage />} />
        <Route path="/auctions/:id/live" element={<LiveAuctionPage />} />
        <Route
          path="/sell"
          element={
            <ProtectedRoute>
              <SellerOnboardingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sell/new"
          element={
            <ProtectedRoute>
              <CreateListingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sell/listings"
          element={
            <ProtectedRoute>
              <SellerDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminAuctionsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/auctions/:id"
          element={
            <AdminRoute>
              <AdminAuctionDetailPage />
            </AdminRoute>
          }
        />
      </Route>
    </Routes>
  )
}

export default App
