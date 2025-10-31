import React, { useState, useEffect } from 'react';
import { Calendar, User, LogOut, Send, CheckCircle, XCircle, Clock, FileText, Users, Home } from 'lucide-react';

// Demo users data
const DEMO_USERS = {
  'staff@example.com': { password: '123456', role: 'staff', name: 'Dr. Rajesh Kumar', department: 'Computer Science' },
  'hod@example.com': { password: '123456', role: 'hod', name: 'Dr. Priya Sharma', department: 'Computer Science' },
  'principal@example.com': { password: '123456', role: 'principal', name: 'Dr. Anil Mehta', department: 'Administration' },
  'admin@example.com': { password: '123456', role: 'admin', name: 'Admin User', department: 'Administration' }
};

// Storage keys
const STORAGE_KEYS = {
  LEAVES: 'leaves-data',
  NOTIFICATIONS: 'notifications-data',
  CURRENT_USER: 'current-user'
};

const LeaveManagementSystem = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activeView, setActiveView] = useState('dashboard');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [leaveForm, setLeaveForm] = useState({
    leaveType: 'Sick Leave',
    startDate: '',
    endDate: '',
    reason: ''
  });

  // Initialize data from storage
  useEffect(() => {
    loadData();
  }, []);

  // Save data whenever it changes
  useEffect(() => {
    if (leaves.length > 0 || notifications.length > 0) {
      saveData();
    }
  }, [leaves, notifications]);

  const loadData = () => {
    try {
      const storedUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      const storedLeaves = localStorage.getItem(STORAGE_KEYS.LEAVES);
      const storedNotifications = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);

      if (storedUser) setCurrentUser(JSON.parse(storedUser));
      if (storedLeaves) setLeaves(JSON.parse(storedLeaves));
      if (storedNotifications) setNotifications(JSON.parse(storedNotifications));
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const saveData = () => {
    try {
      localStorage.setItem(STORAGE_KEYS.LEAVES, JSON.stringify(leaves));
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const user = DEMO_USERS[loginForm.email];
    
    if (user && user.password === loginForm.password) {
      const userData = { email: loginForm.email, ...user };
      setCurrentUser(userData);
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(userData));
      setLoginForm({ email: '', password: '' });
    } else {
      alert('Invalid credentials! Please check email and password.');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    setActiveView('dashboard');
  };

  const addNotification = (userId, message, leaveId) => {
    const notification = {
      id: Date.now() + Math.random(),
      userId,
      message,
      leaveId,
      timestamp: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [...prev, notification]);
  };

  const handleApplyLeave = (e) => {
    e.preventDefault();
    
    const newLeave = {
      id: Date.now(),
      staffEmail: currentUser.email,
      staffName: currentUser.name,
      department: currentUser.department,
      leaveType: leaveForm.leaveType,
      startDate: leaveForm.startDate,
      endDate: leaveForm.endDate,
      reason: leaveForm.reason,
      status: 'Pending',
      appliedDate: new Date().toISOString(),
      approverComments: '',
      hodApprovalDate: null,
      principalApprovalDate: null
    };

    setLeaves(prev => [...prev, newLeave]);
    addNotification(currentUser.email, `Your leave application for ${leaveForm.leaveType} has been submitted successfully.`, newLeave.id);
    
    setLeaveForm({
      leaveType: 'Sick Leave',
      startDate: '',
      endDate: '',
      reason: ''
    });
    
    alert('Leave application submitted successfully!');
    setActiveView('history');
  };

  const handleHODAction = (leaveId, action, comments = '') => {
    setLeaves(prev => prev.map(leave => {
      if (leave.id === leaveId) {
        const updatedLeave = {
          ...leave,
          status: action === 'approve' ? 'Approved by HOD' : 'Rejected by HOD',
          approverComments: comments,
          hodApprovalDate: new Date().toISOString()
        };
        
        addNotification(
          leave.staffEmail,
          action === 'approve' 
            ? `Your leave application has been approved by HOD and forwarded to Principal.`
            : `Your leave application has been rejected by HOD. Reason: ${comments}`,
          leaveId
        );
        
        return updatedLeave;
      }
      return leave;
    }));
  };

  const handlePrincipalAction = (leaveId, action, comments = '') => {
    setLeaves(prev => prev.map(leave => {
      if (leave.id === leaveId) {
        const updatedLeave = {
          ...leave,
          status: action === 'approve' ? 'Approved by Principal' : 'Rejected by Principal',
          approverComments: leave.approverComments + '\n' + comments,
          principalApprovalDate: new Date().toISOString()
        };
        
        addNotification(
          leave.staffEmail,
          action === 'approve'
            ? `🎉 Your leave application has been approved by the Principal. You may proceed with your leave.`
            : `Your leave application has been rejected by the Principal. Reason: ${comments}`,
          leaveId
        );
        
        return updatedLeave;
      }
      return leave;
    }));
  };

  // Login Page
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="bg-indigo-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">College Leave Management</h1>
            <p className="text-gray-600 mt-2">Sign in to continue</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                required
                value={loginForm.email}
                onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                required
                value={loginForm.password}
                onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter your password"
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Sign In
            </button>
          </form>
          
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-semibold text-gray-700 mb-2">Demo Credentials:</p>
            <div className="text-xs text-gray-600 space-y-1">
              <p>Staff: staff@example.com</p>
              <p>HOD: hod@example.com</p>
              <p>Principal: principal@example.com</p>
              <p>Admin: admin@example.com</p>
              <p className="mt-2 font-medium">Password: 123456</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Staff Dashboard
  const StaffDashboard = () => {
    const userLeaves = leaves.filter(l => l.staffEmail === currentUser.email);
    const userNotifications = notifications.filter(n => n.userId === currentUser.email);
    
    const stats = {
      pending: userLeaves.filter(l => l.status === 'Pending').length,
      approved: userLeaves.filter(l => l.status === 'Approved by Principal').length,
      rejected: userLeaves.filter(l => l.status.includes('Rejected')).length
    };

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-yellow-50 p-6 rounded-xl border-2 border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-700 text-sm font-medium">Pending</p>
                <p className="text-3xl font-bold text-yellow-900">{stats.pending}</p>
              </div>
              <Clock className="text-yellow-600" size={40} />
            </div>
          </div>
          
          <div className="bg-green-50 p-6 rounded-xl border-2 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-700 text-sm font-medium">Approved</p>
                <p className="text-3xl font-bold text-green-900">{stats.approved}</p>
              </div>
              <CheckCircle className="text-green-600" size={40} />
            </div>
          </div>
          
          <div className="bg-red-50 p-6 rounded-xl border-2 border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-700 text-sm font-medium">Rejected</p>
                <p className="text-3xl font-bold text-red-900">{stats.rejected}</p>
              </div>
              <XCircle className="text-red-600" size={40} />
            </div>
          </div>
        </div>

        {userNotifications.length > 0 && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <h3 className="font-semibold text-blue-900 mb-2">Recent Notifications</h3>
            <div className="space-y-2">
              {userNotifications.slice(-3).reverse().map(notif => (
                <p key={notif.id} className="text-sm text-blue-800">{notif.message}</p>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Apply Leave Form
  const ApplyLeaveForm = () => (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Apply for Leave</h2>
      <form onSubmit={handleApplyLeave} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Leave Type</label>
          <select
            value={leaveForm.leaveType}
            onChange={(e) => setLeaveForm({...leaveForm, leaveType: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            required
          >
            <option>Sick Leave</option>
            <option>Casual Leave</option>
            <option>Earned Leave</option>
            <option>Maternity Leave</option>
            <option>Paternity Leave</option>
            <option>Emergency Leave</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={leaveForm.startDate}
              onChange={(e) => setLeaveForm({...leaveForm, startDate: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={leaveForm.endDate}
              onChange={(e) => setLeaveForm({...leaveForm, endDate: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Leave</label>
          <textarea
            value={leaveForm.reason}
            onChange={(e) => setLeaveForm({...leaveForm, reason: e.target.value})}
            rows="4"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            placeholder="Please provide a detailed reason for your leave..."
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
        >
          <Send size={20} />
          Submit Leave Application
        </button>
      </form>
    </div>
  );

  // Leave History
  const LeaveHistory = () => {
    const userLeaves = currentUser.role === 'admin' 
      ? leaves 
      : leaves.filter(l => l.staffEmail === currentUser.email);

    const getStatusColor = (status) => {
      if (status === 'Approved by Principal') return 'bg-green-100 text-green-800 border-green-300';
      if (status.includes('Rejected')) return 'bg-red-100 text-red-800 border-red-300';
      if (status === 'Approved by HOD') return 'bg-blue-100 text-blue-800 border-blue-300';
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    };

    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Leave History</h2>
        {userLeaves.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No leave applications found.</p>
        ) : (
          <div className="space-y-4">
            {userLeaves.map(leave => (
              <div key={leave.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-800">{leave.leaveType}</h3>
                    <p className="text-sm text-gray-600">{leave.staffName} - {leave.department}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(leave.status)}`}>
                    {leave.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">From</p>
                    <p className="font-medium">{new Date(leave.startDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">To</p>
                    <p className="font-medium">{new Date(leave.endDate).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-1">Reason</p>
                  <p className="text-sm text-gray-700">{leave.reason}</p>
                </div>

                {leave.approverComments && (
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-xs text-gray-500 mb-1">Comments</p>
                    <p className="text-sm text-gray-700">{leave.approverComments}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // HOD Dashboard
  const HODDashboard = () => {
    const pendingLeaves = leaves.filter(l => l.status === 'Pending' && l.department === currentUser.department);
    const approvedLeaves = leaves.filter(l => l.status === 'Approved by HOD' && l.department === currentUser.department);

    const handleAction = (leaveId, action) => {
      const comments = prompt(action === 'approve' ? 'Enter approval comments (optional):' : 'Enter rejection reason:');
      if (action === 'reject' && !comments) {
        alert('Please provide a reason for rejection.');
        return;
      }
      handleHODAction(leaveId, action, comments || '');
    };

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-yellow-50 p-6 rounded-xl border-2 border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-700 text-sm font-medium">Pending Requests</p>
                <p className="text-3xl font-bold text-yellow-900">{pendingLeaves.length}</p>
              </div>
              <Clock className="text-yellow-600" size={40} />
            </div>
          </div>
          
          <div className="bg-blue-50 p-6 rounded-xl border-2 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-700 text-sm font-medium">Forwarded to Principal</p>
                <p className="text-3xl font-bold text-blue-900">{approvedLeaves.length}</p>
              </div>
              <Send className="text-blue-600" size={40} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Pending Approvals</h2>
          {pendingLeaves.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No pending requests.</p>
          ) : (
            <div className="space-y-4">
              {pendingLeaves.map(leave => (
                <div key={leave.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-800">{leave.staffName}</h3>
                      <p className="text-sm text-gray-600">{leave.leaveType}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500">Duration</p>
                      <p className="font-medium">
                        {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-1">Reason</p>
                    <p className="text-sm text-gray-700">{leave.reason}</p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleAction(leave.id, 'approve')}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={18} />
                      Approve & Forward
                    </button>
                    <button
                      onClick={() => handleAction(leave.id, 'reject')}
                      className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <XCircle size={18} />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Principal Dashboard
  const PrincipalDashboard = () => {
    const forwardedLeaves = leaves.filter(l => l.status === 'Approved by HOD');

    const handleAction = (leaveId, action) => {
      const comments = prompt(action === 'approve' ? 'Enter final approval comments (optional):' : 'Enter rejection reason:');
      if (action === 'reject' && !comments) {
        alert('Please provide a reason for rejection.');
        return;
      }
      handlePrincipalAction(leaveId, action, comments || '');
    };

    return (
      <div className="space-y-6">
        <div className="bg-blue-50 p-6 rounded-xl border-2 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-700 text-sm font-medium">Requests for Final Approval</p>
              <p className="text-3xl font-bold text-blue-900">{forwardedLeaves.length}</p>
            </div>
            <FileText className="text-blue-600" size={40} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Final Approvals</h2>
          {forwardedLeaves.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No requests pending final approval.</p>
          ) : (
            <div className="space-y-4">
              {forwardedLeaves.map(leave => (
                <div key={leave.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-800">{leave.staffName}</h3>
                      <p className="text-sm text-gray-600">{leave.department} - {leave.leaveType}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      HOD Approved
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500">Duration</p>
                      <p className="font-medium">
                        {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-1">Reason</p>
                    <p className="text-sm text-gray-700">{leave.reason}</p>
                  </div>

                  {leave.approverComments && (
                    <div className="bg-blue-50 p-3 rounded mb-4">
                      <p className="text-xs text-gray-500 mb-1">HOD Comments</p>
                      <p className="text-sm text-gray-700">{leave.approverComments}</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleAction(leave.id, 'approve')}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={18} />
                      Final Approve
                    </button>
                    <button
                      onClick={() => handleAction(leave.id, 'reject')}
                      className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <XCircle size={18} />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Main Layout
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-indigo-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">College Leave Management System</h1>
              <p className="text-indigo-200 text-sm">{currentUser.name} - {currentUser.role.toUpperCase()}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-800 transition-colors"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <nav className="space-y-2">
                {currentUser.role === 'staff' && (
                  <>
                    <button
                      onClick={() => setActiveView('dashboard')}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
                        activeView === 'dashboard' ? 'bg-indigo-600 text-white' : 'hover:bg-gray-100'
                      }`}
                    >
                      <Home size={20} />
                      Dashboard
                    </button>
                    <button
                      onClick={() => setActiveView('apply')}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
                        activeView === 'apply' ? 'bg-indigo-600 text-white' : 'hover:bg-gray-100'
                      }`}
                    >
                      <Send size={20} />
                      Apply Leave
                    </button>
                    <button
                      onClick={() => setActiveView('history')}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
                        activeView === 'history' ? 'bg-indigo-600 text-white' : 'hover:bg-gray-100'
                      }`}
                    >
                      <FileText size={20} />
                      Leave History
                    </button>
                  </>
                )}

                {(currentUser.role === 'hod' || currentUser.role === 'principal' || currentUser.role === 'admin') && (
                  <>
                    <button
                      onClick={() => setActiveView('dashboard')}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
                        activeView === 'dashboard' ? 'bg-indigo-600 text-white' : 'hover:bg-gray-100'
                      }`}
                    >
                      <Home size={20} />
                      Dashboard
                    </button>
                    <button
                      onClick={() => setActiveView('history')}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
                        activeView === 'history' ? 'bg-indigo-600 text-white' : 'hover:bg-gray-100'
                      }`}
                    >
                      <FileText size={20} />
                      All Requests
                    </button>
                  </>
                )}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {currentUser.role === 'staff' && (
              <>
                {activeView === 'dashboard' && <StaffDashboard />}
                {activeView === 'apply' && <ApplyLeaveForm />}
                {activeView === 'history' && <LeaveHistory />}
              </>
            )}

            {currentUser.role === 'hod' && (
              <>
                {activeView === 'dashboard' && <HODDashboard />}
                {activeView === 'history' && <LeaveHistory />}
              </>
            )}

            {currentUser.role === 'principal' && (
              <>
                {activeView === 'dashboard' && <PrincipalDashboard />}
                {activeView === 'history' && <LeaveHistory />}
              </>
            )}

            {currentUser.role === 'admin' && (
              <>
                {activeView === 'dashboard' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="bg-purple-50 p-6 rounded-xl border-2 border-purple-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-purple-700 text-sm font-medium">Total Requests</p>
                            <p className="text-3xl font-bold text-purple-900">{leaves.length}</p>
                          </div>
                          <FileText className="text-purple-600" size={40} />
                        </div>
                      </div>
                      <div className="bg-yellow-50 p-6 rounded-xl border-2 border-yellow-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-yellow-700 text-sm font-medium">Pending</p>
                            <p className="text-3xl font-bold text-yellow-900">
                              {leaves.filter(l => l.status === 'Pending').length}
                            </p>
                          </div>
                          <Clock className="text-yellow-600" size={40} />
                        </div>
                      </div>
                      <div className="bg-green-50 p-6 rounded-xl border-2 border-green-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-green-700 text-sm font-medium">Approved</p>
                            <p className="text-3xl font-bold text-green-900">
                              {leaves.filter(l => l.status === 'Approved by Principal').length}
                            </p>
                          </div>
                          <CheckCircle className="text-green-600" size={40} />
                        </div>
                      </div>
                      <div className="bg-red-50 p-6 rounded-xl border-2 border-red-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-red-700 text-sm font-medium">Rejected</p>
                            <p className="text-3xl font-bold text-red-900">
                              {leaves.filter(l => l.status.includes('Rejected')).length}
                            </p>
                          </div>
                          <XCircle className="text-red-600" size={40} />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-8">
                      <h2 className="text-2xl font-bold text-gray-800 mb-6">System Overview</h2>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                          <span className="font-medium">Total Users</span>
                          <span className="text-2xl font-bold text-indigo-600">
                            {Object.keys(DEMO_USERS).length}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                          <span className="font-medium">Active Notifications</span>
                          <span className="text-2xl font-bold text-indigo-600">
                            {notifications.length}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {activeView === 'history' && <LeaveHistory />}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-gray-600 text-sm">
            © 2025 College Leave Management System. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LeaveManagementSystem;