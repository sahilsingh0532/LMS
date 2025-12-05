import React, { useState, useEffect } from 'react';
import { LogOut, Send, CheckCircle, XCircle, Clock, FileText, Home, UserPlus } from 'lucide-react';
import { signUp, signIn, logout, onAuthChange } from './firebase/authService';
import { applyLeave, getUserLeaves, getAllLeaves, hodAction, principalAction } from './firebase/leaveService';
import logo from './assets/logo.png';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase/config';

const App = () => {
  const [emailStatus, setEmailStatus] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [activeView, setActiveView] = useState('dashboard');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(true);
  
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({
    fullName: '',
    email: '',
    password: '',
    department: '',
    role: 'staff'
  });
  const [leaveForm, setLeaveForm] = useState({
    leaveType: 'Sick Leave',
    startDate: '',
    endDate: '',
    reason: ''
  });

  // Auth state observer
  useEffect(() => {
    const unsubscribe = onAuthChange((authData) => {
      if (authData) {
        setCurrentUser(authData.user);
        setUserData(authData.userData);
        fetchLeaves(authData.userData);
      } else {
        setCurrentUser(null);
        setUserData(null);
        setLeaves([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const fetchLeaves = async (user) => {
    try {
      let result;
      if (user.role === 'staff') {
        result = await getUserLeaves(user.uid);
      } else if (user.role === 'hod') {
        result = await getAllLeaves(user.department);
      } else {
        result = await getAllLeaves();
      }
      
      if (result.success) {
        setLeaves(result.leaves);
      }
    } catch (error) {
      console.error('Error fetching leaves:', error);
    }
  };
  // Add this function in App.js
const checkPrincipalStatus = async () => {
  try {
    console.log('=== CHECKING PRINCIPAL STATUS ===');
    
    // Try to sign in to see if account exists
    const { signInWithEmailAndPassword } = await import('firebase/auth');
    const { auth } = await import('./firebase/config');
    
    try {
      const result = await signInWithEmailAndPassword(
        auth, 
        'principal@stbcoe.edu', 
        'Principal@123'
      );
      console.log('✅ Principal account EXISTS in Authentication');
      console.log('Principal UID:', result.user.uid);
      
      // Check Firestore
      const { getDoc, doc } = await import('firebase/firestore');
      const { db } = await import('./firebase/config');
      
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      if (userDoc.exists()) {
        console.log('✅ Principal data EXISTS in Firestore');
        console.log('Principal data:', userDoc.data());
      } else {
        console.log('❌ Principal data MISSING in Firestore');
      }
      
    } catch (authError) {
      console.log('❌ Principal account NOT FOUND in Authentication');
      console.log('Auth error code:', authError.code);
      console.log('Auth error message:', authError.message);
    }
    
  } catch (error) {
    console.error('Error checking principal status:', error);
  }
};
  
  const debugFirestore = async () => {
    console.log('=== DEBUG FIRESTORE ===');
    console.log('Current user UID:', currentUser?.uid);
    console.log('User data:', userData);
    
    try {
      const querySnapshot = await getDocs(collection(db, 'leaves'));
      const allLeaves = [];
      querySnapshot.forEach((doc) => {
        allLeaves.push({ id: doc.id, ...doc.data() });
      });
      
      console.log('All documents in leaves collection:', allLeaves);
      console.log('Total documents:', allLeaves.length);
      
      const myLeaves = allLeaves.filter(leave => leave.staffId === userData?.uid);
      console.log('My leaves:', myLeaves);
      
    } catch (error) {
      console.error('Debug query error:', error);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const result = await signIn(loginForm.email, loginForm.password);
    
    if (result.success) {
      setLoginForm({ email: '', password: '' });
      alert('Login successful!');
    } else {
      alert(result.error || 'Login failed. Please try again.');
    }
    
    setLoading(false);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const result = await signUp(
      signupForm.email,
      signupForm.password,
      signupForm.fullName,
      signupForm.department,
      signupForm.role
    );
    
    if (result.success) {
      setSignupForm({
        fullName: '',
        email: '',
        password: '',
        department: '',
        role: 'staff'
      });
      alert('Registration successful!');
    } else {
      alert(result.error || 'Registration failed. Please try again.');
    }
    
    setLoading(false);
  };

  const handleLogout = async () => {
    await logout();
    setActiveView('dashboard');
  };

  const handleApplyLeave = async (e) => {
  e.preventDefault();
  setLoading(true);
  setEmailStatus('Sending application and email notification...');
  
  const result = await applyLeave(leaveForm, userData);
  
  if (result.success) {
    setLeaveForm({
      leaveType: 'Sick Leave',
      startDate: '',
      endDate: '',
      reason: ''
    });
    
    await fetchLeaves(userData);
    setEmailStatus('✅ Leave applied and email sent successfully!');
    alert('Leave application submitted successfully! You will receive an email notification.');
    setActiveView('history');
    
    // Clear email status after 3 seconds
    setTimeout(() => setEmailStatus(''), 3000);
  } else {
    setEmailStatus('');
    alert(result.error || 'Error submitting leave application');
  }
  
  setLoading(false);
};

  const handleHODAction = async (leaveId, action) => {
  const comments = prompt(action === 'approve' ? 'Enter approval comments (optional):' : 'Enter rejection reason:');
  if (action === 'reject' && !comments) {
    alert('Please provide a reason for rejection.');
    return;
  }

  setLoading(true);
  setEmailStatus('Processing and sending email notification...');
  
  const result = await hodAction(leaveId, action, comments || '');
  
  if (result.success) {
    await fetchLeaves(userData);
    setEmailStatus('✅ Action completed and email sent!');
    alert(`Leave ${action === 'approve' ? 'approved' : 'rejected'} successfully! Email notification sent to staff.`);
    
    setTimeout(() => setEmailStatus(''), 3000);
  } else {
    setEmailStatus('');
    alert(result.error || 'Error processing leave');
  }
  
  setLoading(false);
};

// Update handlePrincipalAction similarly
const handlePrincipalAction = async (leaveId, action) => {
  const comments = prompt(action === 'approve' ? 'Enter final approval comments (optional):' : 'Enter rejection reason:');
  if (action === 'reject' && !comments) {
    alert('Please provide a reason for rejection.');
    return;
  }

  setLoading(true);
  setEmailStatus('Processing and sending email notification...');
  
  const result = await principalAction(leaveId, action, comments || '');
  
  if (result.success) {
    await fetchLeaves(userData);
    setEmailStatus('✅ Final decision made and email sent!');
    alert(`Leave ${action === 'approve' ? 'approved' : 'rejected'} successfully! Email notification sent to staff.`);
    
    setTimeout(() => setEmailStatus(''), 3000);
  } else {
    setEmailStatus('');
    alert(result.error || 'Error processing leave');
  }
  
  setLoading(false);
};

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Login/Signup Page
  if (!currentUser || !userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <img src={logo} alt="STBCOE Logo" className="w-24 h-24 mx-auto mb-4 object-contain" />
            <h1 className="text-3xl font-bold text-gray-800">STBCOE</h1>
            <p className="text-xl text-indigo-600 font-semibold mt-1">Leave Management System</p>
            <p className="text-gray-600 mt-2">{isLogin ? 'Sign in to continue' : 'Create your account'}</p>
          </div>
          
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
                isLogin ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
                !isLogin ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              Sign Up
            </button>
          </div>

          {isLogin ? (
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
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  required
                  value={signupForm.fullName}
                  onChange={(e) => setSignupForm({...signupForm, fullName: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Dr. John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  required
                  value={signupForm.email}
                  onChange={(e) => setSignupForm({...signupForm, email: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="john@stbcoe.edu"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                <select
                  required
                  value={signupForm.department}
                  onChange={(e) => setSignupForm({...signupForm, department: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Select Department</option>
                  <option value="Computer Science Engineering">CSE</option>
                  <option value="Civil">Civil</option>
                  <option value="Electronics and Telecommunication">E&TC</option>
                  <option value="Library">Library</option>
                  <option value="Mechanical">Mechanical</option>
                  <option value="Office">Office</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  required
                  value={signupForm.role}
                  onChange={(e) => setSignupForm({...signupForm, role: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="staff">Staff</option>
                  <option value="hod">Head of Department (HOD)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  required
                  minLength="6"
                  value={signupForm.password}
                  onChange={(e) => setSignupForm({...signupForm, password: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Minimum 6 characters"
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <UserPlus size={20} />
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          )}

          {isLogin && (
  <>
    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <p className="text-sm font-semibold text-blue-900 mb-2">Principal Login:</p>
      <p className="text-xs text-blue-700">Email: principal@stbcoe.edu</p>
      <p className="text-xs text-blue-700">Password: Principal@123</p>
    </div>
    
  
  </>
)}
        </div>
      </div>
    );
  }

  const StaffDashboard = () => {
    const userLeaves = leaves.filter(l => l.staffId === userData.uid);
    
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
        
        
      </div>
    );
  };

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
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Send size={20} />
          {loading ? 'Submitting...' : 'Submit Leave Application'}
        </button>
      </form>
    </div>
  );

  const LeaveHistory = () => {
    const getStatusColor = (status) => {
      if (status === 'Approved by Principal') return 'bg-green-100 text-green-800 border-green-300';
      if (status.includes('Rejected')) return 'bg-red-100 text-red-800 border-red-300';
      if (status === 'Approved by HOD') return 'bg-blue-100 text-blue-800 border-blue-300';
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    };

    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Leave History</h2>
        {leaves.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No leave applications found.</p>
        ) : (
          <div className="space-y-4">
            {leaves.map(leave => (
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
                    <p className="font-medium">{leave.startDate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">To</p>
                    <p className="font-medium">{leave.endDate}</p>
                  </div>
                </div>
                
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-1">Reason</p>
                  <p className="text-sm text-gray-700">{leave.reason}</p>
                </div>

                {(leave.hodComments || leave.principalComments) && (
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-xs text-gray-500 mb-1">Comments</p>
                    {leave.hodComments && <p className="text-sm text-gray-700 mb-1">HOD: {leave.hodComments}</p>}
                    {leave.principalComments && <p className="text-sm text-gray-700">Principal: {leave.principalComments}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const HODDashboard = () => {
    const pendingLeaves = leaves.filter(l => l.status === 'Pending');
    const approvedLeaves = leaves.filter(l => l.status === 'Approved by HOD');
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
                      <p className="text-xs text-gray-500">{leave.staffEmail}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500">Duration</p>
                      <p className="font-medium">{leave.startDate} - {leave.endDate}</p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-1">Reason</p>
                    <p className="text-sm text-gray-700">{leave.reason}</p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleHODAction(leave.id, 'approve')}
                      disabled={loading}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <CheckCircle size={18} />
                      Approve & Forward
                    </button>
                    <button
                      onClick={() => handleHODAction(leave.id, 'reject')}
                      disabled={loading}
                      className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
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

  const PrincipalDashboard = () => {
    const forwardedLeaves = leaves.filter(l => l.status === 'Approved by HOD');
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
                      <p className="text-xs text-gray-500">{leave.staffEmail}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      HOD Approved
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500">Duration</p>
                      <p className="font-medium">{leave.startDate} - {leave.endDate}</p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-1">Reason</p>
                    <p className="text-sm text-gray-700">{leave.reason}</p>
                  </div>

                  {leave.hodComments && (
                    <div className="bg-blue-50 p-3 rounded mb-4">
                      <p className="text-xs text-gray-500 mb-1">HOD Comments</p>
                      <p className="text-sm text-gray-700">{leave.hodComments}</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => handlePrincipalAction(leave.id, 'approve')}
                      disabled={loading}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <CheckCircle size={18} />
                      Final Approve
                    </button>
                    <button
                      onClick={() => handlePrincipalAction(leave.id, 'reject')}
                      disabled={loading}
                      className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-indigo-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <img src={logo} alt="STBCOE Logo" className="w-12 h-12 object-contain bg-white rounded-full p-1" />
              <div>
                <h1 className="text-2xl font-bold">STBCOE - Leave Management System</h1>
                <p className="text-indigo-200 text-sm">{userData?.fullName} - {userData?.role.toUpperCase()}</p>
              </div>
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
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <nav className="space-y-2">
                {userData?.role === 'staff' && (
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

                {(userData?.role === 'hod' || userData?.role === 'principal') && (
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

          <div className="lg:col-span-3">
            {userData?.role === 'staff' && (
              <>
                {activeView === 'dashboard' && <StaffDashboard />}
                {activeView === 'apply' && <ApplyLeaveForm />}
                {activeView === 'history' && <LeaveHistory />}
              </>
            )}

            {userData?.role === 'hod' && (
              <>
                {activeView === 'dashboard' && <HODDashboard />}
                {activeView === 'history' && <LeaveHistory />}
              </>
            )}

            {userData?.role === 'principal' && (
              <>
                {activeView === 'dashboard' && <PrincipalDashboard />}
                {activeView === 'history' && <LeaveHistory />}
              </>
            )}
          </div>
        </div>
      </div>
      {/* Email Status Notification */}
{emailStatus && (
  <div className="fixed bottom-4 right-4 bg-indigo-600 text-white px-6 py-3 rounded-lg shadow-lg animate-bounce">
    {emailStatus}
  </div>
)}

      <footer className="bg-white border-t mt-12">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-gray-600 text-sm">
            © 2025 STBCOE Leave Management System. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;