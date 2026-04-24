import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./page/login";
import ProtectedRoute from './middleware/protect';
import AppLayout from './components/layout/AppLayout';
import POSScreen from './page/POSScreen';
import Dashboard from './page/Dashboard';
import Products from './page/Products';
import Inventory from './page/Inventory';
import Reports from './page/Reports';
import Settings from './page/Settings';
import Categories from './page/Categories';

const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
      <p className="text-gray-600 mb-4">Page not found</p>
      <a href="/" className="text-blue-600 hover:text-blue-500 font-medium">Go back home</a>
    </div>
  </div>
);

const Protected = ({ children }) => (
  <ProtectedRoute>
    <AppLayout>{children}</AppLayout>
  </ProtectedRoute>
);

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Protected><POSScreen /></Protected>} />
      <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
      <Route path="/products" element={<Protected><Products /></Protected>} />
      <Route path="/inventory" element={<Protected><Inventory /></Protected>} />
      <Route path="/reports" element={<Protected><Reports /></Protected>} />
      <Route path="/categories" element={<Protected><Categories /></Protected>} />
      <Route path="/settings" element={<Protected><Settings /></Protected>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);

export default App;
