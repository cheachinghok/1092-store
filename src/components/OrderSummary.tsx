import React from 'react';
import { ArrowLeftIcon, UserIcon } from '@heroicons/react/24/outline';

const OrderSummary = ({ cart, user, total, shippingAddress, onShippingChange, paymentMethod, onPaymentMethodChange, onPlaceOrder, onBackToCart }) => {
  const handleShipping = (e) => {
    const { name, value } = e.target;
    onShippingChange(prev => ({ ...prev, [name]: value }));
  };

  const shippingComplete = shippingAddress.fullName && shippingAddress.address &&
    shippingAddress.city && shippingAddress.postalCode && shippingAddress.country;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <button
          onClick={onBackToCart}
          className="flex items-center text-indigo-600 hover:text-indigo-500 mr-4"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-1" />
          Back to Cart
        </button>
        <h2 className="text-2xl font-bold text-gray-900">Order Summary</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: Customer + Shipping */}
        <div className="lg:col-span-1 space-y-6">
          {/* Customer Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <UserIcon className="h-6 w-6 text-gray-400 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Customer</h3>
            </div>
            <div className="space-y-2 text-sm">
              <p className="text-gray-900 font-medium">{user?.name}</p>
              <p className="text-gray-500">{user?.email}</p>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipping Address</h3>
            <div className="space-y-3">
              {[
                { label: 'Full Name', name: 'fullName', required: true },
                { label: 'Address', name: 'address', required: true },
                { label: 'City', name: 'city', required: true },
                { label: 'Postal Code', name: 'postalCode', required: true },
                { label: 'Country', name: 'country', required: true },
                { label: 'Phone', name: 'phone', required: false },
              ].map(field => (
                <div key={field.name}>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    {field.label}{field.required && ' *'}
                  </label>
                  <input
                    type="text"
                    name={field.name}
                    value={shippingAddress[field.name]}
                    onChange={handleShipping}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h3>
            <div className="space-y-2">
              {[
                { value: 'credit_card', label: 'Credit Card' },
                { value: 'paypal', label: 'PayPal' },
                { value: 'cash_on_delivery', label: 'Cash on Delivery' },
              ].map(option => (
                <label key={option.value} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={option.value}
                    checked={paymentMethod === option.value}
                    onChange={() => onPaymentMethodChange(option.value)}
                    className="text-indigo-600"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: Order items + total */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Order Items</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {cart.map((item) => (
                <div key={item.id} className="p-6 flex items-center space-x-4">
                  <div className="flex-shrink-0 w-16 h-16 border border-gray-200 rounded-lg overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover object-center"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-md font-medium text-gray-900">{item.name}</h4>
                    <p className="text-gray-500 text-sm">Quantity: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-md font-semibold text-gray-900">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                    <p className="text-gray-500 text-sm">${item.price} each</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Total */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Total</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900">${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className="text-gray-900">$0.00</span>
              </div>
              <div className="flex justify-between text-lg font-semibold border-t border-gray-200 pt-3">
                <span className="text-gray-900">Total</span>
                <span className="text-gray-900">${total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={onPlaceOrder}
              disabled={!shippingComplete}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 transition-colors font-medium mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Place Order
            </button>
            {!shippingComplete && (
              <p className="text-xs text-gray-500 text-center mt-2">
                Fill in all required shipping fields to continue
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;
