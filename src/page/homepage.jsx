import React, { useState, useEffect } from 'react';
import { API_BASE } from '../lib/utils';
import ProductCatalog from '../components/ProductCatalog';
import ShoppingCart from '../components/ShoppingCart';
import OrderSummary from '../components/OrderSummary';
import { ShoppingCartIcon, UserIcon } from '@heroicons/react/24/outline';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
// import {

// } from "../components/ui/dropdown-menu"
const App = () => {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [currentView, setCurrentView] = useState('catalog');
  const [user, setUser] = useState(null);
  const [shippingAddress, setShippingAddress] = useState({
    fullName: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
    phone: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('credit_card');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => { if (data.success) setUser(data.user); })
      .catch(() => {});
  }, []);
  const addToCart = (product, quantity) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [...prevCart, { ...product, quantity }];
      }
    });
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const placeOrder = async () => {
    if (!user) {
      alert('Please log in to place an order');
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          items: cart.map(item => ({ product: item._id, quantity: item.quantity })),
          shippingAddress,
          paymentMethod
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        alert(`Order placed! Order number: ${data.data.orderNumber}`);
        setCart([]);
        setCurrentView('catalog');
      } else {
        alert(data.message || 'Failed to place order');
      }
    } catch {
      alert('Network error — is the server running?');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">1092 Store</h1>
            
            <div className="flex items-center space-x-4">
              <button 
                className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
                onClick={() => setIsCartOpen(!isCartOpen)}
              >
                <ShoppingCartIcon className="h-6 w-6" />
                {getTotalItems() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {getTotalItems()}
                  </span>
                )}
              </button>
              
              {user && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <UserIcon className="h-5 w-5" />
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                      <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium">
                        Options
                      </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content className="min-w-[180px] bg-white rounded-md p-2 shadow-lg border border-gray-200 z-50" sideOffset={5}>
                      <DropdownMenu.Item className="flex items-center px-2 py-1 text-sm text-gray-900 rounded hover:bg-gray-100 cursor-pointer outline-none">Edit</DropdownMenu.Item>
                      <DropdownMenu.Item className="flex items-center px-2 py-1 text-sm text-gray-900 rounded hover:bg-gray-100 cursor-pointer outline-none">Duplicate</DropdownMenu.Item>
                      <DropdownMenu.Separator className="h-px bg-gray-200 my-1" />
                      <DropdownMenu.Item className="flex items-center px-2 py-1 text-sm text-gray-900 rounded hover:bg-gray-100 cursor-pointer outline-none">Archive</DropdownMenu.Item>
                      <DropdownMenu.Separator className="h-px bg-gray-200 my-1" />
                      <DropdownMenu.Item className="flex items-center px-2 py-1 text-sm text-red-600 rounded hover:bg-red-50 cursor-pointer outline-none">Delete</DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Root>

                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'catalog' && (
          <>
          <ProductCatalog 
            onAddToCart={addToCart}
            onViewCart={() => setCurrentView('cart')}
          />
          
          </>
          
          
        )}
        
        {currentView === 'cart' && (
          <ShoppingCart
            cart={cart}
            onUpdateQuantity={updateQuantity}
            onRemoveFromCart={removeFromCart}
            onContinueShopping={() => setCurrentView('catalog')}
            onCheckout={() => setCurrentView('checkout')}
          />
        )}
        
        {currentView === 'checkout' && (
          <OrderSummary
            cart={cart}
            user={user}
            total={getTotalPrice()}
            shippingAddress={shippingAddress}
            onShippingChange={setShippingAddress}
            paymentMethod={paymentMethod}
            onPaymentMethodChange={setPaymentMethod}
            onPlaceOrder={placeOrder}
            onBackToCart={() => setCurrentView('cart')}
          />
        )}
      </main>

      {/* Cart Sidebar */}
      {isCartOpen && (
        <div className="fixed inset-0 z-60 overflow-hidden">
          <div 
            className="absolute inset-0 bg-black/50 transition-opacity"
            onClick={() => setIsCartOpen(false)}
          />
          
          <div className="absolute inset-y-0 right-0 max-w-full flex">
            <div className="relative w-screen max-w-md">
              <div 
                className="h-full flex flex-col bg-white shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex-1 overflow-y-auto py-6 px-4 sm:px-6">
                  <div className="flex items-start justify-between">
                    <h2 className="text-lg font-medium text-gray-900">
                      Shopping Cart ({getTotalItems()} items)
                    </h2>
                    <button
                      type="button"
                      className="-m-2 p-2 text-gray-400 hover:text-gray-500"
                      onClick={() => setIsCartOpen(false)}
                    >
                      <span className="sr-only">Close panel</span>
                      <span className="text-2xl">×</span>
                    </button>
                  </div>

                  <div className="mt-8">
                    {cart.length === 0 ? (
                      <div className="text-center py-12">
                        <ShoppingCartIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Your cart is empty</h3>
                      </div>
                    ) : (
                      <div className="flow-root">
                        <ul className="-my-6 divide-y divide-gray-200">
                          {cart.map((item) => (
                            <li key={item.id} className="py-6 flex">
                              <div className="flex-shrink-0 w-24 h-24 border border-gray-200 rounded-md overflow-hidden">
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="w-full h-full object-center object-cover"
                                />
                              </div>

                              <div className="ml-4 flex-1 flex flex-col">
                                <div>
                                  <div className="flex justify-between text-base font-medium text-gray-900">
                                    <h3>{item.name}</h3>
                                    <p className="ml-4">${(item.price * item.quantity).toFixed(2)}</p>
                                  </div>
                                </div>
                                <div className="flex-1 flex items-end justify-between text-sm">
                                  <p className="text-gray-500">Qty {item.quantity}</p>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {cart.length > 0 && (
                  <div className="border-t border-gray-200 py-6 px-4 sm:px-6">
                    <div className="flex justify-between text-base font-medium text-gray-900 mb-4">
                      <p>Subtotal</p>
                      <p>${getTotalPrice().toFixed(2)}</p>
                    </div>
                    <button
                      onClick={() => {
                        setCurrentView('cart');
                        setIsCartOpen(false);
                      }}
                      className="w-full bg-indigo-600 border border-transparent rounded-md shadow-sm py-3 px-4 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      View Full Cart
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;