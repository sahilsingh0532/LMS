import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './config';

// Principal credentials (hardcoded)
const PRINCIPAL_EMAIL = 'principal@stbcoe.edu';
const PRINCIPAL_PASSWORD = 'Principal@123';

// Helper function to ensure user data exists
const ensureUserDataExists = async (uid, email, fullName, department, role) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    
    if (!userDoc.exists()) {
      // Create user data in Firestore
      await setDoc(doc(db, 'users', uid), {
        uid: uid,
        email: email,
        fullName: fullName,
        department: department,
        role: role,
        createdAt: new Date().toISOString()
      });
      console.log(`Created Firestore data for ${email}`);
    }
    
    return await getUserData(uid);
  } catch (error) {
    console.error('Error ensuring user data:', error);
    throw error;
  }
};

// Sign up new user
export const signUp = async (email, password, fullName, department, role) => {
  try {
    // Create auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Save additional user data to Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: email,
      fullName: fullName,
      department: department,
      role: role || 'staff',
      createdAt: new Date().toISOString()
    });

    console.log(`User ${email} created successfully`);
    return { success: true, user };
  } catch (error) {
    console.error('Signup error:', error);
    return { success: false, error: error.message };
  }
};

// Sign in user
export const signIn = async (email, password) => {
  try {
    console.log(`Attempting login for: ${email}`);
    
    // For principal login
    if (email === PRINCIPAL_EMAIL) {
      console.log('Principal login detected');
      
      try {
        // Try to sign in
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('Principal auth successful');
        
        // Ensure principal data exists in Firestore
        const userData = await ensureUserDataExists(
          userCredential.user.uid,
          email,
          'College Principal',
          'Administration',
          'principal'
        );
        
        if (!userData) {
          throw new Error('Failed to get principal user data');
        }
        
        return { success: true, user: userCredential.user, userData };
        
      } catch (authError) {
        console.log('Principal auth error:', authError.code);
        
        // If principal doesn't exist in auth, create it
        if (authError.code === 'auth/user-not-found' || authError.code === 'auth/wrong-password') {
          console.log('Creating principal account...');
          
          try {
            // Create principal auth account
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            
            // Create principal data in Firestore
            const userData = await ensureUserDataExists(
              userCredential.user.uid,
              email,
              'College Principal',
              'Administration',
              'principal'
            );
            
            console.log('Principal account created successfully');
            return { success: true, user: userCredential.user, userData };
            
          } catch (createError) {
            console.error('Error creating principal:', createError);
            return { 
              success: false, 
              error: 'Failed to create principal account. ' + createError.message 
            };
          }
        }
        
        // For other auth errors
        return { 
          success: false, 
          error: authError.message || 'Invalid principal credentials' 
        };
      }
    }

    // Regular user login
    console.log('Regular user login');
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userData = await getUserData(userCredential.user.uid);
    
    if (!userData) {
      return { 
        success: false, 
        error: 'User data not found. Please contact administrator.' 
      };
    }
    
    return { success: true, user: userCredential.user, userData };
    
  } catch (error) {
    console.error('Login error:', error);
    
    // Provide user-friendly error messages
    let errorMessage = 'Login failed';
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'User not found. Please check your email.';
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = 'Incorrect password. Please try again.';
    } else if (error.code === 'auth/invalid-credential') {
      errorMessage = 'Invalid credentials. Please check your email and password.';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Too many failed attempts. Please try again later.';
    } else {
      errorMessage = error.message || 'Login failed. Please try again.';
    }
    
    return { success: false, error: errorMessage };
  }
};

// Get user data from Firestore
export const getUserData = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data();
    }
    console.log(`No Firestore data found for UID: ${uid}`);
    return null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

// Sign out
export const logout = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error: error.message };
  }
};

// Auth state observer
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      console.log('Auth state changed - User logged in:', user.email);
      const userData = await getUserData(user.uid);
      
      if (!userData && user.email === PRINCIPAL_EMAIL) {
        // Auto-create principal data if missing
        console.log('Auto-creating principal Firestore data...');
        const principalData = await ensureUserDataExists(
          user.uid,
          user.email,
          'College Principal',
          'Administration',
          'principal'
        );
        callback({ user, userData: principalData });
      } else {
        callback({ user, userData });
      }
    } else {
      console.log('Auth state changed - User logged out');
      callback(null);
    }
  });
};

// Create principal account manually (for testing)
export const createPrincipalManually = async () => {
  try {
    console.log('Creating principal account manually...');
    
    // Check if already exists
    try {
      const signInResult = await signInWithEmailAndPassword(auth, PRINCIPAL_EMAIL, PRINCIPAL_PASSWORD);
      console.log('Principal already exists in Auth');
      
      // Ensure Firestore data exists
      const userData = await ensureUserDataExists(
        signInResult.user.uid,
        PRINCIPAL_EMAIL,
        'College Principal',
        'Administration',
        'principal'
      );
      
      return { 
        success: true, 
        message: 'Principal account already exists',
        userData 
      };
      
    } catch (error) {
      // Create new principal
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        const result = await signUp(
          PRINCIPAL_EMAIL,
          PRINCIPAL_PASSWORD,
          'College Principal',
          'Administration',
          'principal'
        );
        
        return { 
          success: result.success, 
          message: result.success ? 'Principal created successfully' : result.error 
        };
      }
      
      throw error;
    }
  } catch (error) {
    console.error('Error creating principal manually:', error);
    return { success: false, error: error.message };
  }
};