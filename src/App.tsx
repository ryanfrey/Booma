import { Route, Routes } from 'react-router-dom'
import { SiteLayout } from './components/site/SiteLayout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AuthPage } from './pages/AuthPage'
import { HomePage } from './pages/HomePage'
import { BrowsePage } from './pages/BrowsePage'
import { ListingDetailPage } from './pages/ListingDetailPage'
import { SellerOnboardingPage } from './pages/SellerOnboardingPage'
import { CreateListingPage } from './pages/CreateListingPage'
import { SellerDashboardPage } from './pages/SellerDashboardPage'
import { StyleguidePage } from './pages/StyleguidePage'

function App() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/styleguide" element={<StyleguidePage />} />
      <Route element={<SiteLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/listings" element={<BrowsePage />} />
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
      </Route>
    </Routes>
  )
}

export default App
