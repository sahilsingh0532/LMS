// leaveService.js
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc,
  orderBy,
  Timestamp,
  getDoc
} from 'firebase/firestore';
import { db } from './config';
import { sendLeaveStatusEmail, getStatusMessage } from '../services/emailService';

// Apply for leave
export const applyLeave = async (leaveData, userData) => {
  try {
    const leave = {
      staffId: userData.uid,
      staff_name: userData.fullName,     // matches EmailJS
      staffEmail: userData.email,
      department: userData.department,

      leave_type: leaveData.leaveType,   // matches EmailJS
      start_date: leaveData.startDate,   // matches EmailJS
      end_date: leaveData.endDate,       // matches EmailJS
      reason: leaveData.reason,

      status: 'Pending',
      appliedDate: Timestamp.now(),
      hodComments: '',
      principalComments: '',
      hodApprovalDate: null,
      principalApprovalDate: null
    };


    const docRef = await addDoc(collection(db, 'leaves'), leave);
    
    // Send email notification
    await sendLeaveStatusEmail(
      { ...leave, id: docRef.id },
      'Pending',
      'Your leave application has been submitted successfully and is pending HOD approval.'
    );

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error applying leave:', error);
    return { success: false, error: error.message };
  }
};

// Get user's leaves
export const getUserLeaves = async (uid) => {
  try {
    const q = query(
      collection(db, 'leaves'),
      where('staffId', '==', uid),
      orderBy('appliedDate', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const leaves = [];
    querySnapshot.forEach((doc) => {
      leaves.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, leaves };
  } catch (error) {
    console.error('Error getting leaves:', error);
    return { success: false, error: error.message, leaves: [] };
  }
};

// Get all leaves (for HOD/Principal)
export const getAllLeaves = async (department = null) => {
  try {
    let q;
    if (department) {
      // HOD sees only their department
      q = query(
        collection(db, 'leaves'),
        where('department', '==', department),
        orderBy('appliedDate', 'desc')
      );
    } else {
      // Principal sees all
      q = query(
        collection(db, 'leaves'),
        orderBy('appliedDate', 'desc')
      );
    }
    
    const querySnapshot = await getDocs(q);
    const leaves = [];
    querySnapshot.forEach((doc) => {
      leaves.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, leaves };
  } catch (error) {
    console.error('Error getting all leaves:', error);
    return { success: false, error: error.message, leaves: [] };
  }
};

// HOD action (approve/reject)
export const hodAction = async (leaveId, action, comments) => {
  try {
    const leaveRef = doc(db, 'leaves', leaveId);
    
    // Get the current leave data first
    const leaveDoc = await getDoc(leaveRef);
    if (!leaveDoc.exists()) {
      throw new Error('Leave not found');
    }
    
    const leaveData = leaveDoc.data();
    const newStatus = action === 'approve' ? 'Approved by HOD' : 'Rejected by HOD';
    
    // Update leave status
    await updateDoc(leaveRef, {
      status: newStatus,
      hodComments: comments,
      hodApprovalDate: Timestamp.now()
    });
    
    // Send email notification
    await sendLeaveStatusEmail(
      { ...leaveData, id: leaveId },
      newStatus,
      comments
    );
    
    return { success: true };
  } catch (error) {
    console.error('Error in HOD action:', error);
    return { success: false, error: error.message };
  }
};

// Principal action (approve/reject)
export const principalAction = async (leaveId, action, comments) => {
  try {
    const leaveRef = doc(db, 'leaves', leaveId);
    
    // Get the current leave data first
    const leaveDoc = await getDoc(leaveRef);
    if (!leaveDoc.exists()) {
      throw new Error('Leave not found');
    }
    
    const leaveData = leaveDoc.data();
    const newStatus = action === 'approve' ? 'Approved by Principal' : 'Rejected by Principal';
    
    // Update leave status
    await updateDoc(leaveRef, {
      status: newStatus,
      principalComments: comments,
      principalApprovalDate: Timestamp.now()
    });
    
    // Send email notification with combined comments
    const allComments = [
      leaveData.hodComments && `HOD: ${leaveData.hodComments}`,
      comments && `Principal: ${comments}`
    ].filter(Boolean).join('\n\n');
    
    await sendLeaveStatusEmail(
      { ...leaveData, id: leaveId },
      newStatus,
      allComments
    );
    
    return { success: true };
  } catch (error) {
    console.error('Error in Principal action:', error);
    return { success: false, error: error.message };
  }
};