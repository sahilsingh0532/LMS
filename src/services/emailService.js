import emailjs from '@emailjs/browser';

// Initialize EmailJS with your public key
emailjs.init('-BaYCwG7kCA_sMofl'); // Replace with your actual public key

const EMAILJS_CONFIG = {
  serviceId: 'service_0c42am4',  // Replace with your service ID
  templateId: 'leave_status_update', // Your template ID
  publicKey: '-BaYCwG7kCA_sMofl'  // Replace with your public key
};

export const sendLeaveStatusEmail = async (leaveData, status, comments = '') => {
  try {
    const templateParams = {
      to_email: leaveData.staffEmail,
      staff_name: leaveData.staffName,
      leave_type: leaveData.leaveType,
      start_date: leaveData.startDate,
      end_date: leaveData.endDate,
      status: status,
      comments: comments,
      department: leaveData.department
    };

    console.log('Sending email to:', leaveData.staffEmail);
    
    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      templateParams,
      EMAILJS_CONFIG.publicKey
    );

    console.log('Email sent successfully:', response);
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Different email templates for different statuses
export const getStatusMessage = (status) => {
  const messages = {
    'Pending': 'Your leave application has been submitted and is pending HOD approval.',
    'Approved by HOD': 'Your leave application has been approved by HOD and forwarded to the Principal for final approval.',
    'Rejected by HOD': 'Your leave application has been rejected by the HOD.',
    'Approved by Principal': '🎉 Your leave application has been approved by the Principal. You may proceed with your leave.',
    'Rejected by Principal': 'Your leave application has been rejected by the Principal.'
  };
  
  return messages[status] || 'Your leave application status has been updated.';
};