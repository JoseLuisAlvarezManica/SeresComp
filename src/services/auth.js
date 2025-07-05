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
  serverTimestamp,
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

    return { user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
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

