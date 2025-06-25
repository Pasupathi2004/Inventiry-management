import React, { useState, useEffect, useRef } from 'react';
import { Search, Mic, MicOff, Package, MapPin, Plus, Minus } from 'lucide-react';
import { InventoryItem } from '../types';
import { useAuth } from '../context/AuthContext';

const SearchPage: React.FC = () => {
  const { token, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingItems, setUpdatingItems] = useState<Set<number>>(new Set());
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const recognition = useRef<any>(null);
  const [quantityInputs, setQuantityInputs] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    fetchInventory();
    initializeSpeechRecognition();
  }, []);

  useEffect(() => {
    filterItems();
  }, [searchQuery, inventory]);

  const fetchInventory = async () => {
    try {
      const response = await  fetch(`${import.meta.env.VITE_API_URL}/api/inventory`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (data.success) {
        setInventory(data.items);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = false;
      recognition.current.interimResults = false;
      recognition.current.lang = 'en-US';

      recognition.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSearchQuery(transcript);
        setIsListening(false);
      };

      recognition.current.onerror = () => {
        setIsListening(false);
      };

      recognition.current.onend = () => {
        setIsListening(false);
      };
    }
  };

  const startVoiceSearch = () => {
    if (recognition.current) {
      setIsListening(true);
      recognition.current.start();
    }
  };

  const stopVoiceSearch = () => {
    if (recognition.current) {
      recognition.current.stop();
      setIsListening(false);
    }
  };

  const filterItems = () => {
    if (!searchQuery.trim()) {
      setFilteredItems([]);
      return;
    }

    const filtered = inventory.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.specification.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.rack.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.bin.toLowerCase().includes(searchQuery.toLowerCase())
    );

    setFilteredItems(filtered);
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { status: 'Out of Stock', color: 'text-red-600 bg-red-100' };
    if (quantity <= 5) return { status: 'Low Stock', color: 'text-orange-600 bg-orange-100' };
    if (quantity <= 20) return { status: 'Medium Stock', color: 'text-yellow-600 bg-yellow-100' };
    return { status: 'In Stock', color: 'text-green-600 bg-green-100' };
  };

  const handleQuantityUpdate = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 0) return; // Prevent negative quantities
    
    setUpdatingItems(prev => new Set(prev).add(itemId));
    
    try {
      const response = await  fetch(`${import.meta.env.VITE_API_URL}/api/inventory/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          quantity: newQuantity,
          updatedBy: user?.username
        }),
      });

      if (response.ok) {
        // Update local state
        const updatedInventory = inventory.map(item => 
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        );
        setInventory(updatedInventory);
        
        // Update filtered items
        const updatedFilteredItems = filteredItems.map(item => 
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        );
        setFilteredItems(updatedFilteredItems);
        
        // Show success message
        setSuccessMessage(`Quantity updated successfully!`);
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const handleIncreaseQuantity = (item: InventoryItem) => {
    if (window.confirm(`Are you sure you want to increase the quantity of '${item.name}' by 1?`)) {
      handleQuantityUpdate(item.id, item.quantity + 1);
    }
  };

  const handleDecreaseQuantity = (item: InventoryItem) => {
    if (item.quantity > 0) {
      if (window.confirm(`Are you sure you want to decrease the quantity of '${item.name}' by 1?`)) {
        handleQuantityUpdate(item.id, item.quantity - 1);
      }
    }
  };

  const handleQuantityInputChange = (itemId: number, value: string) => {
    setQuantityInputs((prev) => ({ ...prev, [itemId]: value }));
  };

  const handleCustomQuantityUpdate = (item: InventoryItem) => {
    const inputValue = quantityInputs[item.id];
    const newQuantity = parseInt(inputValue, 10);
    if (isNaN(newQuantity) || newQuantity < 0) {
      alert('Please enter a valid non-negative number.');
      return;
    }
    handleQuantityUpdate(item.id, newQuantity);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2E8B57]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{successMessage}</span>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-green-500 hover:text-green-700"
          >
            ×
          </button>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Search Inventory</h1>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, make, model, specification, or location..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2E8B57] focus:border-transparent outline-none"
            />
          </div>
          
          {recognition.current && (
            <button
              onClick={isListening ? stopVoiceSearch : startVoiceSearch}
              className={`p-3 rounded-lg transition-colors ${
                isListening 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'bg-[#2E8B57] text-white hover:bg-[#236B45]'
              }`}
            >
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
          )}
        </div>
        
        {isListening && (
          <div className="mt-4 flex items-center justify-center">
            <div className="flex items-center space-x-2 text-red-600">
              <div className="animate-pulse w-3 h-3 bg-red-600 rounded-full"></div>
              <span>Listening...</span>
            </div>
          </div>
        )}
      </div>

      {/* Search Results */}
      {searchQuery && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">
              Search Results ({filteredItems.length})
            </h2>
          </div>
          
          {filteredItems.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredItems.map((item) => {
                const stockStatus = getStockStatus(item.quantity);
                return (
                  <div key={item.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <Package className="text-[#2E8B57]" size={20} />
                          <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                            {stockStatus.status}
                          </span>
                        </div>
                        
                        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div>
                            <strong>Make:</strong> {item.make}
                          </div>
                          <div>
                            <strong>Model:</strong> {item.model}
                          </div>
                          <div>
                            <strong>Specification:</strong> {item.specification}
                          </div>
                        </div>
                        
                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <MapPin size={16} />
                            <span>Location: {item.rack}-{item.bin}</span>
                          </div>
                          <div>
                            <strong>Updated:</strong> {new Date(item.updatedAt).toLocaleDateString()}
                          </div>
                          <div>
                            <strong>By:</strong> {item.updatedBy}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center justify-end space-x-2 mb-2">
                          <button
                            onClick={() => handleDecreaseQuantity(item)}
                            disabled={updatingItems.has(item.id) || item.quantity <= 0}
                            className="p-1 rounded-full bg-red-100 text-red-600 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Decrease quantity"
                          >
                            <Minus size={16} />
                          </button>
                          <div className="text-2xl font-bold text-gray-900 min-w-[3rem] text-center">
                            {updatingItems.has(item.id) ? (
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#2E8B57] mx-auto"></div>
                            ) : (
                              item.quantity
                            )}
                          </div>
                          <button
                            onClick={() => handleIncreaseQuantity(item)}
                            disabled={updatingItems.has(item.id)}
                            className="p-1 rounded-full bg-green-100 text-green-600 hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Increase quantity"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        <div className="flex flex-col items-end space-y-2 mt-2">
                          <input
                            type="number"
                            min="0"
                            value={quantityInputs[item.id] !== undefined ? quantityInputs[item.id] : item.quantity}
                            onChange={(e) => handleQuantityInputChange(item.id, e.target.value)}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-right"
                            disabled={updatingItems.has(item.id)}
                          />
                          <button
                            onClick={() => handleCustomQuantityUpdate(item)}
                            disabled={updatingItems.has(item.id)}
                            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                          >
                            Update
                          </button>
                        </div>
                        <div className="text-sm text-gray-600">in stock</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Package className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
              <p className="text-gray-600">
                No items match your search criteria. Try different keywords.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Search Instructions */}
      {!searchQuery && (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <Search className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Start searching</h3>
          <p className="text-gray-600 mb-4">
            Enter keywords to search through inventory items by name, make, model, specification, or location.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">🔍 Text Search</h4>
              <p className="text-gray-600">Type any keyword to find matching items</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">🎤 Voice Search</h4>
              <p className="text-gray-600">Click the microphone icon to search by voice</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">⌨️ Quick Search</h4>
              <p className="text-gray-600">Use keyboard shortcuts for faster navigation</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
