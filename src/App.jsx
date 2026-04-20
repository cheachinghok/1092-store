import { BrowserRouter, Routes, Route } from "react-router-dom";

// Try different import approaches
import Login from "./page/login"; // If default export
import Homepage from "./page/homepage";
import ProtectedRoute from './middleware/protect';
// OR
// import { Login } from "./page/login"; // If named export

const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
      <p className="text-gray-600 mb-4">Page not found</p>
      <a href="/" className="text-blue-600 hover:text-blue-500 font-medium">
        Go back home
      </a>
    </div>
  </div>
);

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="*" element={<NotFound />} />
      <Route  
          path="/" 
          element={
            <ProtectedRoute>
              <Homepage />
            </ProtectedRoute>
          } 
        />
      {/* <Route path="/home" element={<Homepage />} /> */}
    </Routes>
  </BrowserRouter>
);

export default App;