import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db, loginWithGoogle, logoutUser, handleFirestoreError, OperationType } from '../firebase';
import { Profile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  login: () => Promise<User>;
  logout: () => Promise<void>;
  updateProfile: (updatedData: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Auth Listener
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (!currentUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      // Check and sync user profile doc
      const profileRef = doc(db, 'profiles', currentUser.uid);
      
      try {
        const profileSnap = await getDoc(profileRef);
        
        if (!profileSnap.exists()) {
          // New user sign up - bootstrap their profile
          const initialProfile: Omit<Profile, 'uid'> = {
            username: currentUser.displayName || currentUser.email?.split('@')[0] || 'Builder',
            bio: 'I am a builder showcase enthusiast!',
            skills: [],
            points: 0,
            photoURL: currentUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150',
            email: currentUser.email || '',
            createdAt: serverTimestamp()
          };
          
          await setDoc(profileRef, initialProfile);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `profiles/${currentUser.uid}`);
      }

      // Subscribe to real-time profile updates for accuracy
      const unsubscribeProfile = onSnapshot(profileRef, (snapshot) => {
        if (snapshot.exists()) {
          setProfile({
            uid: snapshot.id,
            ...snapshot.data()
          } as Profile);
        }
        setLoading(false);
      }, (err) => {
        setLoading(false);
        handleFirestoreError(err, OperationType.GET, `profiles/${currentUser.uid}`);
      });

      return () => unsubscribeProfile();
    });

    return () => unsubscribeAuth();
  }, []);

  const login = async () => {
    setLoading(true);
    try {
      return await loginWithGoogle();
    } catch (e) {
      setLoading(false);
      throw e;
    }
  };

  const logout = async () => {
    setLoading(true);
    await logoutUser();
    setLoading(false);
  };

  const updateProfile = async (updatedData: Partial<Profile>) => {
    if (!user) throw new Error("Must be logged in to update profile");
    const profileRef = doc(db, 'profiles', user.uid);
    try {
      await setDoc(profileRef, updatedData, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `profiles/${user.uid}`);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useFirebaseAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useFirebaseAuth must be used within a FirebaseProvider");
  }
  return context;
};
