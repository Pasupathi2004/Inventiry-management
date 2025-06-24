import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { TrendingUp, Package, Users, Activity, Calendar, User, FileSpreadsheet } from 'lucide-react';
import { Analytics as AnalyticsType } from '../types';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import * as XLSX from 'xlsx';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const Analytics: React.FC = () => {
  const { token } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/analytics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (data.success) {
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateExcelReport = () => {
    if (!analytics) return;

    const workbook = XLSX.utils.book_new();
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm');

    // Summary Sheet
    const summaryData = [
      ['Inventory Management System - Analytics Report'],
      ['Generated At:', format(new Date(), 'yyyy-MM-dd HH:mm:ss')],
      [''],
      ['Metric', 'Value'],
      ['Total Items', analytics.totalItems.toString()],
      ['Low Stock Items', analytics.lowStockItems.toString()],
      ['Total Transactions', analytics.totalTransactions.toString()],
      ['Items Consumed', analytics.itemsConsumed.toString()],
      ['Items Added', analytics.itemsAdded.toString()],
      ['Active Users', analytics.activeUsers.toString()]
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Recent Transactions Sheet with only the requested columns
    if (analytics.recentTransactions && analytics.recentTransactions.length > 0) {
      const transactionsData = [
        ['Transaction ID', 'Item Name', 'Transaction Type', 'Quantity Changed', 'User', 'Date & Time', 'Action']
      ];

      analytics.recentTransactions.forEach(transaction => {
        const action = transaction.type === 'added' ? 'Stock Added' : 
                      transaction.type === 'taken' ? 'Stock Taken' : 'Stock Updated';
        transactionsData.push([
          transaction.id?.toString() ?? '',
          transaction.itemName ?? '',
          (transaction.type ?? '').toUpperCase(),
          transaction.quantity?.toString() ?? '',
          transaction.user ?? '',
          transaction.timestamp ? format(new Date(transaction.timestamp), 'yyyy-MM-dd HH:mm:ss') : '',
          action
        ]);
      });

      const transactionsSheet = XLSX.utils.aoa_to_sheet(transactionsData);
      XLSX.utils.book_append_sheet(workbook, transactionsSheet, 'Transactions');
    }

    // Low Stock Alerts Sheet
    if (analytics.lowStockAlerts && analytics.lowStockAlerts.length > 0) {
      const lowStockData = [
        ['Item ID', 'Item Name', 'Make', 'Model', 'Specification', 'Current Quantity', 'Location', 'Last Updated', 'Updated By', 'Status']
      ];

      analytics.lowStockAlerts.forEach(item => {
        const status = item.quantity === 0 ? 'Out of Stock' : 'Low Stock';
        lowStockData.push([
          item.id.toString(),
          item.name,
          item.make,
          item.model,
          item.specification,
          item.quantity.toString(),
          `${item.rack}-${item.bin}`,
          format(new Date(item.updatedAt), 'yyyy-MM-dd HH:mm:ss'),
          item.updatedBy,
          status
        ]);
      });

      const lowStockSheet = XLSX.utils.aoa_to_sheet(lowStockData);
      XLSX.utils.book_append_sheet(workbook, lowStockSheet, 'Low Stock Alerts');
    }

    // Export the workbook
    XLSX.writeFile(workbook, `inventory_report_${timestamp}.xlsx`);
    
    // Show success message
    setSuccessMessage('Excel report generated successfully!');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2E8B57]"></div>
      </div>
    );
  }

  const stockStatusData = {
    labels: ['Out of Stock', 'Low Stock', 'Medium Stock', 'In Stock'],
    datasets: [
      {
        data: [
          analytics?.lowStockAlerts?.filter(item => item.quantity === 0).length || 0,
          analytics?.lowStockAlerts?.filter(item => item.quantity > 0 && item.quantity <= 5).length || 0,
          Math.max(0, (analytics?.totalItems || 0) - (analytics?.lowStockItems || 0) - Math.floor((analytics?.totalItems || 0) * 0.6)),
          Math.floor((analytics?.totalItems || 0) * 0.6)
        ],
        backgroundColor: ['#EF4444', '#F97316', '#F59E0B', '#10B981'],
        borderWidth: 0,
      },
    ],
  };

  const activityData = {
    labels: ['Items Added', 'Items Consumed'],
    datasets: [
      {
        label: 'Quantity',
        data: [analytics?.itemsAdded || 0, analytics?.itemsConsumed || 0],
        backgroundColor: ['#10B981', '#3B82F6'],
        borderRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

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
        <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
        <button
          onClick={generateExcelReport}
          className="flex items-center space-x-2 px-4 py-2 bg-[#2E8B57] text-white rounded-lg hover:bg-[#236B45] transition-colors"
        >
          <FileSpreadsheet size={20} />
          <span>Generate Excel Report</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 rounded-lg p-3">
              <Package className="text-blue-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{analytics?.totalItems || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="bg-red-100 rounded-lg p-3">
              <TrendingUp className="text-red-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
              <p className="text-2xl font-bold text-gray-900">{analytics?.lowStockItems || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="bg-green-100 rounded-lg p-3">
              <Activity className="text-green-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Monthly Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{analytics?.totalTransactions || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="bg-purple-100 rounded-lg p-3">
              <Users className="text-purple-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">{analytics?.activeUsers || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Status Distribution</h3>
          <div className="h-64">
            <Doughnut data={stockStatusData} options={chartOptions} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Activity</h3>
          <div className="h-64">
            <Bar data={activityData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {analytics?.recentTransactions && analytics.recentTransactions.length > 0 ? (
            analytics.recentTransactions.map((transaction) => (
              <div key={transaction.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        transaction.type === 'added' ? 'bg-green-500' :
                        transaction.type === 'taken' ? 'bg-blue-500' : 'bg-red-500'
                      }`}></div>
                      <h4 className="font-medium text-gray-900">{transaction.itemName}</h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        transaction.type === 'added' ? 'bg-green-100 text-green-800' :
                        transaction.type === 'taken' ? 'bg-blue-100 text-blue-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {transaction.type}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                      <div>Quantity: {transaction.quantity}</div>
                      <div className="flex items-center space-x-1">
                        <User size={14} />
                        <span>{transaction.user}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar size={14} />
                        <span>{format(new Date(transaction.timestamp), 'MMM dd, yyyy HH:mm')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <Activity className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No recent transactions</h3>
              <p className="text-gray-600">Transaction history will appear here as activity occurs.</p>
            </div>
          )}
        </div>
      </div>

      {/* Low Stock Alerts */}
      {analytics?.lowStockAlerts && analytics.lowStockAlerts.length > 0 && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900 text-red-600">Low Stock Alerts</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {analytics.lowStockAlerts.map((item) => (
              <div key={item.id} className="p-6 hover:bg-red-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{item.name}</h4>
                    <p className="text-sm text-gray-600">{item.make} - {item.model}</p>
                    <p className="text-sm text-gray-500">Location: {item.rack}-{item.bin}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-red-600">{item.quantity}</div>
                    <div className="text-sm text-gray-600">remaining</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
