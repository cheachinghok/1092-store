import React, { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import { API_BASE } from '../lib/utils';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

interface ProductCatalogProps {
  onAddToCart: (product: any) => void;
  onViewCart: () => void;
}

const API_CATEGORIES = ['Electronics', 'Clothing', 'Books', 'Home', 'Sports', 'Other'];

const ProductCatalog = ({ onAddToCart, onViewCart }: ProductCatalogProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedCategory]);

  const fetchProducts = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (selectedCategory) params.set('category', selectedCategory);

    try {
      const res = await fetch(`${API_BASE}/api/products?${params}`);
      const data = await res.json();
      if (data.success) {
        setProducts(
          data.data.map((p: any) => ({
            id: p._id,
            _id: p._id,
            name: p.name,
            price: p.sellingPrice,
            category: p.category,
            image: p.images?.[0] || '',
            description: p.description,
          }))
        );
      }
    } catch {
      // server may not be running yet
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold text-gray-900">Our Products</h2>
        <button
          onClick={onViewCart}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          View Cart
        </button>
        <div className="flex gap-3 items-center p-5 bg-gray-100">
        <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            Options
            <svg
              className="w-4 h-4 ml-1 inline-block"
              viewBox="0 0 15 15"
              fill="none"
            >
              <path
                d="M4 6H11L7.5 10.5L4 6Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Content
          className="min-w-[220px] bg-white rounded-md p-2 shadow-lg border border-gray-200 z-50"
          sideOffset={5}
        >
          <DropdownMenu.Item className="flex items-center px-2 py-1 text-sm text-gray-900 rounded hover:bg-gray-100 cursor-pointer outline-none">
            Edit
            <div className="ml-auto text-xs text-gray-500">⌘ E</div>
          </DropdownMenu.Item>

          <DropdownMenu.Item className="flex items-center px-2 py-1 text-sm text-gray-900 rounded hover:bg-gray-100 cursor-pointer outline-none">
            Duplicate
            <div className="ml-auto text-xs text-gray-500">⌘ D</div>
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="h-px bg-gray-200 my-1" />

          <DropdownMenu.Item className="flex items-center px-2 py-1 text-sm text-gray-900 rounded hover:bg-gray-100 cursor-pointer outline-none">
            Archive
            <div className="ml-auto text-xs text-gray-500">⌘ N</div>
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="h-px bg-gray-200 my-1" />

          <DropdownMenu.Item className="flex items-center px-2 py-1 text-sm text-red-600 rounded hover:bg-red-50 cursor-pointer outline-none">
            Delete
            <div className="ml-auto text-xs text-gray-500">⌘ ⌫</div>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
      </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder:text-gray-500 focus:outline-none focus:placeholder:text-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="sm:w-48">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Categories</option>
            {API_CATEGORIES.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading products...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      )}

      {/* No Products Found */}
      {!loading && products.length === 0 && (
        <div className="text-center py-12">
          <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductCatalog;
