import { Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AuthPage } from './pages/AuthPage'
import { HomePage } from './pages/HomePage'
import { ListingsPage } from './pages/ListingsPage'
import { ListingDetailPage } from './pages/ListingDetailPage'
import { SellerOnboardingPage } from './pages/SellerOnboardingPage'
import { CreateListingPage } from './pages/CreateListingPage'
import { SellerDashboardPage } from './pages/SellerDashboardPage'
import { PaymentMethodPage } from './pages/PaymentMethodPage'
import { WinsPage } from './pages/WinsPage'

function App() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/listings" element={<ListingsPage />} />
      <Route path="/listings/:id" element={<ListingDetailPage />} />
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
        path="/account/payment-method"
        element={
          <ProtectedRoute>
            <PaymentMethodPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/wins"
        element={
          <ProtectedRoute>
            <WinsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App
