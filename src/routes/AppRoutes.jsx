import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MainLayout from '../components/layout/MainLayout'
import Dashboard from '../pages/Dashboard'
import WorkOrders from '../pages/WorkOrders'
import Items from '../pages/Items'
import Inventory from '../pages/Inventory'
import ProductionTracking from '../pages/ProductionTracking'
import Reports from '../pages/Reports'
import Users from '../pages/Users'

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="work-orders" element={<WorkOrders />} />
          <Route path="items" element={<Items />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="production" element={<ProductionTracking />} />
          <Route path="reports" element={<Reports />} />
          <Route path="users" element={<Users />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
