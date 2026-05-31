import React, { useState, useEffect } from 'react';
import { useFirebaseAuth } from './FirebaseProvider';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { Post } from '../types';
import { PostCard } from './PostCard';
import { EmptyState } from './EmptyState';
import { 
  User as UserIcon, 
  Settings, 
  Plus, 
  X, 
  Check, 
  BookOpen, 
  Lightbulb, 
  Sparkles, 
  Boxes,
  Cpu,
  Mail
} from 'lucide-react';

interface ProfileViewProps {
  onSuggestPostCreation: () => void;
  likedPostIds: string[];
}

export const ProfileView: React.FC<ProfileViewProps> = ({ 
  onSuggestPostCreation, 
  likedPostIds 
}) => {
  const { user, profile, updateProfile } = useFirebaseAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Edit fields state
  const [usernameInput, setUsernameInput] = useState('');
  const [bioInput, setBioInput] = useState('');
  const [skillsList, setSkillsList] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);

  // Initialize edit form states when profile changes
  useEffect(() => {
    if (profile) {
      setUsernameInput(profile.username || '');
      setBioInput(profile.bio || '');
      setSkillsList(profile.skills || []);
    }
  }, [profile, isEditing]);

  // Load user's posts in real-time
  useEffect(() => {
    if (!user) return;

    setPostsLoading(true);
    const postsRef = collection(db, 'posts');
    const q = query(
      postsRef, 
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Post[] = [];
      snapshot.forEach((doc) => {
        list.push({
          id: doc.id,
          ...doc.data()
        } as Post);
      });
      setPosts(list);
      setPostsLoading(false);
    }, (error) => {
      setPostsLoading(false);
      handleFirestoreError(error, OperationType.GET, 'posts');
    });

    return () => unsubscribe();
  }, [user]);

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSkill = skillInput.trim().replace(/[^a-zA-Z0-9_\-+:\s]/g, '');
    if (cleanSkill && !skillsList.includes(cleanSkill)) {
      if (skillsList.length >= 20) return;
      setSkillsList([...skillsList, cleanSkill]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkillsList(skillsList.filter(s => s !== skillToRemove));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (usernameInput.trim().length < 2 || usernameInput.trim().length > 30) {
      alert("Username must be between 2 and 30 characters.");
      return;
    }

    setSaveLoading(true);
    try {
      await updateProfile({
        username: usernameInput.trim(),
        bio: bioInput.trim(),
        skills: skillsList
      });
      setIsEditing(false);
    } catch (err) {
      console.error("Failed saving profile:", err);
      alert("Error saving profile. Review rules and retry.");
    } finally {
      setSaveLoading(false);
    }
  };

  if (!user || !profile) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-2xl border border-slate-100 shadow p-8 text-center">
        <UserIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-800 mb-1">Unlock Builder Profile</h3>
        <p className="text-sm text-slate-500 mb-6">Create or link your profile to start showcasing projects, gaining reputation, and climbing the ranking ladder.</p>
        <span className="text-xs text-indigo-600 font-bold bg-indigo-50 px-3 py-1.5 rounded-lg font-mono">Sign in with Google from the top menu</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-4">
      {/* Upper Profile Cover/Card Header */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6 md:p-8">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start justify-between">
          
          {/* Avatar and basic info */}
          <div className="flex flex-col sm:flex-row gap-5 items-center text-center sm:text-left">
            <img
              referrerPolicy="no-referrer"
              src={profile.photoURL || user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150'}
              alt={profile.username}
              className="w-24 h-24 rounded-2xl object-cover ring-2 ring-indigo-50 shadow-md"
            />
            
            <div className="space-y-1.5 flex-1 select-text">
              <div className="flex items-center justify-center sm:justify-start gap-2.5">
                <h2 className="text-2xl font-black text-slate-900">{profile.username}</h2>
                <span className="bg-indigo-50 text-indigo-700 text-[10px] font-mono px-2 py-0.5 rounded font-bold">BUILDER</span>
              </div>
              <p className="text-slate-400 text-xs font-mono flex items-center gap-1.5 justify-center sm:justify-start">
                <Mail className="w-3.5 h-3.5" /> {profile.email}
              </p>
              <p className="text-slate-500 text-sm leading-relaxed max-w-lg mt-2">
                {profile.bio || "This developer hasn't composed a bio yet. Set up one in profile settings!"}
              </p>
              
              {/* Profile Skills List */}
              {profile.skills && profile.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-3 justify-center sm:justify-start">
                  {profile.skills.map((skill) => (
                    <span 
                      key={skill}
                      className="bg-indigo-50/20 text-indigo-700 border border-indigo-100/30 px-2 py-0.6 text-[10px] font-semibold font-mono rounded"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* User Score Stats Dashboard & Settings Trigger */}
          <div className="w-full md:w-auto flex flex-col items-center sm:items-end justify-between self-stretch gap-6">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-xs font-bold transition-all ${
                isEditing 
                  ? 'bg-rose-50 border-rose-200 text-rose-600' 
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {isEditing ? <X className="w-4 h-4" /> : <Settings className="w-4 h-4 text-slate-400" />}
              {isEditing ? 'Close Settings' : 'Edit Profile Details'}
            </button>

            {/* Score totals */}
            <div className="flex gap-4 w-full sm:w-auto mt-auto">
              <div className="bg-indigo-50/30 border border-indigo-100/10 p-3.5 py-2.5 rounded-2xl flex-1 text-center font-mono">
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Reputation Score</span>
                <span className="text-lg font-black text-indigo-700 block mt-1.5">✨ {profile.points} pts</span>
              </div>
              
              <div className="bg-slate-50 border border-slate-100 p-3.5 py-2.5 rounded-2xl flex-1 text-center font-mono">
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Projects Showcase</span>
                <span className="text-lg font-black text-slate-700 block mt-1.5">{posts.length} posted</span>
              </div>
            </div>
          </div>
        </div>

        {/* Inline Edit Form Overlay */}
        {isEditing && (
          <div className="mt-8 pt-8 border-t border-slate-100">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 font-mono mb-4 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-500" /> Modify Developer Metadata
            </h3>
            
            <form onSubmit={handleSaveProfile} className="space-y-4 max-w-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Username */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 font-mono">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="Enter short developer handle..."
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 bg-slate-50/20 font-sans"
                  />
                  <span className="text-[9px] text-slate-400 mt-0.5 block font-mono">Allowed size: 2 - 30 characters</span>
                </div>

                {/* Skills add */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 font-mono">
                    Add Skills Tag (React, Rust, Py, ML...)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      placeholder="e.g., Spring Boot"
                      className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 bg-slate-50/20 font-sans"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSkill(e);
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={(e) => handleAddSkill(e)}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shrink-0 flex items-center justify-center placeholder:text-slate-300"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Skills edit stack */}
              {skillsList.length > 0 && (
                <div className="flex flex-wrap gap-1 p-2 border border-slate-100 rounded-xl bg-slate-50">
                  {skillsList.map(skill => (
                    <span 
                      key={skill}
                      onClick={() => handleRemoveSkill(skill)}
                      className="inline-flex items-center gap-1 bg-white text-slate-700 border border-slate-200 px-2 py-0.8 rounded text-[10px] hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all font-mono font-semibold cursor-pointer"
                      title="Click chip to remove"
                    >
                      {skill} <X className="w-3 h-3 text-slate-400 shrink-0" />
                    </span>
                  ))}
                </div>
              )}

              {/* Bio */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 font-mono">
                  Short Developer Biography
                </label>
                <textarea
                  rows={3}
                  value={bioInput}
                  onChange={(e) => setBioInput(e.target.value)}
                  placeholder="I build full stack Web and AI services..."
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 bg-slate-50/20 font-sans leading-relaxed"
                />
                <span className="text-[9px] text-slate-400 block text-right font-mono">{bioInput.length}/300 characters</span>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shadow-indigo-100"
                >
                  {saveLoading ? 'Optimising profile...' : (<><Check className="w-4 h-4" /> Save Metadata</>)}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* User's Showcase Showcase posts */}
      <div className="space-y-4">
        <h3 className="text-lg font-extrabold text-slate-800 tracking-tight font-sans">
          Your Spotlight Project Showcases
        </h3>

        {postsLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <EmptyState
            title="Launch Your First Spotlight!"
            description="You haven't added any project showcases yet. Highlight your code or designs, accumulate likes/comments, and build a stellar builder score."
            actionText="Publish Projects (+10 reputation)"
            onAction={onSuggestPostCreation}
            type="profile"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 select-text">
            {posts.map((post) => (
              <PostCard 
                key={post.id} 
                post={post} 
                isLiked={likedPostIds.includes(post.id)} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
