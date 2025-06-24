import React, { useState } from 'react';
import { Plus, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AddItem: React.FC = () => {
  const { user, token } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    make: '',
    model: '',
    specification: '',
    rack: '',
    bin: '',
    quantity: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('http://localhost:3001/api/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          updatedBy: user?.username
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Item added successfully!' });
        setFormData({
          name: '',
          make: '',
          model: '',
          specification: '',
          rack: '',
          bin: '',
          quantity: ''
        });
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to add item. Please try again.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please check if the server is running.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Add New Item</h1>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b">
          <div className="flex items-center space-x-3">
            <Package className="text-[#2E8B57]" size={24} />
            <h2 className="text-xl font-semibold text-gray-900">Item Details</h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Item Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2E8B57] focus:border-transparent outline-none"
                placeholder="Enter item name"
              />
            </div>

            <div>
              <label htmlFor="make" className="block text-sm font-medium text-gray-700 mb-2">
                Make *
              </label>
              <input
                type="text"
                id="make"
                name="make"
                value={formData.make}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2E8B57] focus:border-transparent outline-none"
                placeholder="Enter make"
              />
            </div>

            <div>
              <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-2">
                Model *
              </label>
              <input
                type="text"
                id="model"
                name="model"
                value={formData.model}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2E8B57] focus:border-transparent outline-none"
                placeholder="Enter model"
              />
            </div>

            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                Quantity *
              </label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                required
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2E8B57] focus:border-transparent outline-none"
                placeholder="Enter quantity"
              />
            </div>

            <div>
              <label htmlFor="rack" className="block text-sm font-medium text-gray-700 mb-2">
                Rack Location *
              </label>
              <input
                type="text"
                id="rack"
                name="rack"
                value={formData.rack}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2E8B57] focus:border-transparent outline-none"
                placeholder="Enter rack location"
              />
            </div>

            <div>
              <label htmlFor="bin" className="block text-sm font-medium text-gray-700 mb-2">
                Bin Location *
              </label>
              <input
                type="text"
                id="bin"
                name="bin"
                value={formData.bin}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2E8B57] focus:border-transparent outline-none"
                placeholder="Enter bin location"
              />
            </div>
          </div>

          <div className="mt-6">
            <label htmlFor="specification" className="block text-sm font-medium text-gray-700 mb-2">
              Specification *
            </label>
            <textarea
              id="specification"
              name="specification"
              value={formData.specification}
              onChange={handleChange}
              required
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2E8B57] focus:border-transparent outline-none resize-none"
              placeholder="Enter detailed specification"
            />
          </div>

          {message && (
            <div className={`mt-6 p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {message.text}
            </div>
          )}

          <div className="mt-6 flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => setFormData({
                name: '',
                make: '',
                model: '',
                specification: '',
                rack: '',
                bin: '',
                quantity: ''
              })}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Reset Form
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-[#2E8B57] text-white rounded-lg hover:bg-[#236B45] transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Plus size={20} />
                  <span>Add Item</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddItem;