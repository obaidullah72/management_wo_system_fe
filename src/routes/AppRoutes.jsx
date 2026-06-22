import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { BACKEND_ROLES } from '../constants'
import MainLayout from '../components/layout/MainLayout'
import { ProtectedRoute, RoleRoute, GuestRoute } from '../components/auth/ProtectedRoute'
import Login from '../pages/Login'
import Dashboard from '../pages/Dashboard'
import WorkOrders from '../pages/WorkOrders'
import Items from '../pages/Items'
import Inventory from '../pages/Inventory'
import ProductionTracking from '../pages/ProductionTracking'
import Reports from '../pages/Reports'
import Users from '../pages/Users'
import Pallets from '../pages/Pallets'
import Warehouse from '../pages/Warehouse'
import Bom from '../pages/Bom'

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<Login />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="work-orders" element={<WorkOrders />} />
            <Route path="items" element={<Items />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="production" element={<ProductionTracking />} />
            <Route path="bom" element={<Bom />} />
            <Route path="pallets" element={<Pallets />} />
            <Route path="warehouse" element={<Warehouse />} />

            <Route element={<RoleRoute minimumRole={BACKEND_ROLES.MANAGER} />}>
              <Route path="reports" element={<Reports />} />
              <Route path="users" element={<Users />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
