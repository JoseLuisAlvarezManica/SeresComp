import { 
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged
} from 'firebase/auth';
import { db } from './firebaseConfig';
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  collection,
  getDocs,
  updateDoc
} from 'firebase/firestore';

export const auth = getAuth();

export const initAuth = (onUserChangedCallback) => {
  setPersistence(auth, browserLocalPersistence)
    .then(() => {
      onAuthStateChanged(auth, (user) => {
        if (user) {
          console.log('User is logged in:', user.email);
          if (typeof onUserChangedCallback === 'function') {
            onUserChangedCallback(user);
          }
        } else {
          console.log('User is logged out');
          if (typeof onUserChangedCallback === 'function') {
            onUserChangedCallback(null);
          }
        }
      });
    })
    .catch((error) => {
      console.error('Error setting persistence:', error);
    });
};

export const getUserData = async () => {
  const user = auth.currentUser;
  if (!user) {
    console.error('No user is currently authenticated.');
    return null;
  }

  const userDoc = doc(db, 'Users', user.uid);
  const docSnapshot = await getDoc(userDoc);

  if (docSnapshot.exists()) {
    return docSnapshot.data();
  } else {
    console.error('No user data found in Firestore for uid:', user.uid);
    return null;
  }
};

export const registerUser = async (email, password, name) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const userId = userCredential.user.uid;

    await setDoc(doc(db, 'Users', userId), {
      name,
      role: 'pending',
      email,
      createdAt: serverTimestamp(),
    });

    console.log('User registered:', userId);
    return { user: userCredential.user.uid, error: null };
  } catch (error) {
    console.error('Error registering user:', error.message);
    return { user: null, error: error.message };
  }
};

export async function loginUser(email, password) {
  try {
    const auth = getAuth();
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const userDocRef = doc(db, 'users', user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      return { user: null, userData: null, error: 'Si la información es correcta contacte a un administrador (pendiente/banned).' };
    }

    const userData = userDocSnap.data();
    return { user, userData, error: null };
  } catch (error) {
    return { user: null, userData: null, error: error.message };
  }
}

export const logoutUser = async () => {
  try {
    await signOut(auth);
    console.log('User logged out');
    return { user: null, error: null };
  } catch (error) {
    console.error('Error logging out user:', error.message);
    return { error: error.message };
  }
};

export const getAllUsers = async () => {
  try {
    const usersCollectionRef = collection(db, 'Users');
    const snapshot = await getDocs(usersCollectionRef);

    const pendingUsers = [];
    const otherUsers = [];

    snapshot.forEach((docSnap) => {
      const userData = docSnap.data();
      if (userData.role === 'pending') {
        pendingUsers.push({ id: docSnap.id, ...userData });
      } else {
        otherUsers.push({ id: docSnap.id, ...userData });
      }
    });

    return { pendingUsers, otherUsers };
  } catch (error) {
    console.error('Error fetching all users:', error);
    return { pendingUsers: [], otherUsers: [] };
  }
};

export const updateUserRole = async (userId, newRole) => {
  try {
    const userRef = doc(db, 'Users', userId);
    await updateDoc(userRef, { role: newRole });
    console.log(`User role updated to "${newRole}" for user with ID: ${userId}`);
    return { success: true, error: null };
  } catch (error) {
    console.error('Error updating user role:', error);
    return { success: false, error: error.message };
  }
};
