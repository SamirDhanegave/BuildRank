import React, { useState, useEffect } from 'react';
import { FirebaseProvider, useFirebaseAuth } from './components/FirebaseProvider';
import { Navigation } from './components/Navigation';
import { ExploreFeed } from './components/ExploreFeed';
import { Leaderboard } from './components/Leaderboard';
import { ProfileView } from './components/ProfileView';
import { PostFormModal } from './components/PostFormModal';
import { db, handleFirestoreError, OperationType } from './firebase';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { Profile } from './types';
import { 
  Sparkles, 
  Compass, 
  Trophy, 
  User as UserIcon, 
  Search, 
  LogOut, 
  Terminal, 
  Cpu, 
  Award,
  ChevronRight,
  Plus
} from 'lucide-react';

function ApplicationShell() {
  const { user, profile, loading, login, logout } = useFirebaseAuth();
  const [activeTab, setActiveTab] = useState<'explore' | 'leaderboard' | 'profile'>('explore');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [likedPostIds, setLikedPostIds] = useState<string[]>([]);
  const [topProfiles, setTopProfiles] = useState<Profile[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(true);

  // Sync Top 10 profiles in real-time
  useEffect(() => {
    const profilesRef = collection(db, 'profiles');
    const q = query(profilesRef, orderBy('points', 'desc'), limit(10));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Profile[] = [];
      snapshot.forEach((doc) => {
        list.push({
          uid: doc.id,
          ...doc.data()
        } as Profile);
      });
      setTopProfiles(list);
      setProfilesLoading(false);
    }, (error) => {
      setProfilesLoading(false);
      handleFirestoreError(error, OperationType.GET, 'profiles');
    });

    return () => unsubscribe();
  }, []);

  // Sync current user's liked post IDs in real-time
  useEffect(() => {
    if (!user) {
      setLikedPostIds([]);
      return;
    }

    const likesRef = collection(db, 'likes');
    const q = query(likesRef, where('userId', '==', user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: string[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data().postId);
      });
      setLikedPostIds(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'likes');
    });

    return () => unsubscribe();
  }, [user]);

  const currentUserRankIndex = topProfiles.findIndex(p => p.uid === user?.uid);
  const currentUserRank = currentUserRankIndex !== -1 ? `#${currentUserRankIndex + 1}` : (profile && profile.points > 0 ? "~#10+" : "Unranked");
  
  const points = profile?.points ?? 0;
  const rankTitle = points >= 1500 ? "Diamond Builder" : points >= 1000 ? "Platinum Builder" : points >= 500 ? "Gold Builder" : points >= 200 ? "Silver Builder" : "Rising Trainee";

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans select-none flex flex-col lg:flex-row lg:h-screen lg:overflow-hidden selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Mobile-Only Responsive Top Navigation */}
      <div className="lg:hidden shrink-0">
        <Navigation
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            if (tab !== 'explore') setSearchQuery('');
          }}
          searchQuery={searchQuery}
          setSearchQuery={(query) => {
            setSearchQuery(query);
            if (activeTab !== 'explore') setActiveTab('explore');
          }}
        />
      </div>

      {/* Desktop-Only Left Sidebar */}
      <aside className="hidden lg:flex w-64 border-r border-slate-200 bg-white flex-col shrink-0 h-full overflow-y-auto">
        <div className="p-6 border-b border-slate-100 shrink-0">
          {/* Logo / Branding */}
          <div className="flex items-center gap-3 mb-6 cursor-pointer" onClick={() => setActiveTab('explore')}>
            <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-md shadow-indigo-100">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight text-indigo-650 block leading-tight">BuildRank</h1>
              <span className="text-[9px] font-mono tracking-widest text-slate-400 font-bold uppercase block">PROOF OF SKILL</span>
            </div>
          </div>

          {/* User Profile Block in Sidebar */}
          {user ? (
            <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <img
                  referrerPolicy="no-referrer"
                  src={profile?.photoURL || user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150'}
                  alt={profile?.username || 'Builder'}
                  className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm"
                />
                <div className="min-w-0">
                  <div className="font-bold text-xs leading-snug text-slate-800 truncate" title={profile?.username}>
                    {profile?.username || 'Builder'}
                  </div>
                  <div className="text-[9px] uppercase font-bold text-indigo-600 tracking-wider font-mono mt-0.5">
                    {rankTitle}
                  </div>
                </div>
              </div>

              <div className="flex justify-between text-center border-t border-slate-200/50 pt-2.5">
                <div>
                  <div className="text-xs font-bold text-slate-900">{profile?.points ?? 0}</div>
                  <div className="text-[9px] text-slate-400 uppercase tracking-widest font-mono">Points</div>
                </div>
                <div className="border-l border-slate-200/50"></div>
                <div>
                  <div className="text-xs font-bold text-slate-900 font-mono">{currentUserRank}</div>
                  <div className="text-[9px] text-slate-400 uppercase tracking-widest font-mono">Global</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center">
              <p className="text-[11px] text-slate-500 font-medium mb-3">Join other elite developers & display your work.</p>
              <button
                onClick={login}
                className="w-full py-1.8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-[10px] uppercase tracking-wider transition-all shadow-sm shadow-indigo-105 select-none"
              >
                Sign in with Google
              </button>
            </div>
          )}
        </div>

        {/* Navigation Sidebar List */}
        <nav className="flex-1 px-4 py-6 space-y-1 select-none">
          <button
            onClick={() => {
              setActiveTab('explore');
              setSearchQuery('');
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider font-mono transition-all ${
              activeTab === 'explore'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Compass className="w-4 h-4 text-slate-450" /> Explore Projects
          </button>

          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider font-mono transition-all ${
              activeTab === 'leaderboard'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Trophy className="w-4 h-4 text-slate-450" /> Hall of Elite
          </button>

          {user && (
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider font-mono transition-all ${
                activeTab === 'profile'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <UserIcon className="w-4 h-4 text-slate-450" /> Developer Profile
            </button>
          )}

          {user && (
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 text-rose-600 hover:bg-rose-50 rounded-lg font-bold text-xs uppercase tracking-wider font-mono transition-all"
            >
              <LogOut className="w-4 h-4 text-rose-450" /> Sign Out Session
            </button>
          )}
        </nav>

        {/* Post Creation Bottom Trigger */}
        <div className="p-4 border-t border-slate-100 shrink-0">
          <button
            onClick={() => {
              if (user) {
                setIsPostModalOpen(true);
              } else {
                login();
              }
            }}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-extrabold uppercase tracking-widest shadow-md transition-all active:scale-[0.98] select-none"
          >
            + New Project
          </button>
        </div>
      </aside>

      {/* Center Layout Workspace Column */}
      <main className="flex-1 flex flex-col bg-slate-50/50 lg:h-full lg:overflow-hidden min-w-0">
        {/* Desktop Sticky Header bar */}
        <header className="hidden lg:flex h-16 border-b border-slate-200 bg-white items-center justify-between px-6 shrink-0 z-10">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-sm">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (activeTab !== 'explore') setActiveTab('explore');
                }}
                placeholder="Search technologies, builders, or projects..."
                className="w-full pl-9 pr-4 py-2 bg-slate-100 border-transparent rounded-full text-xs font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500/20 md:border md:border-slate-200/50 outline-none transition-all placeholder:text-slate-400 text-slate-800"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2.5 text-slate-400 select-none">
            {activeTab === 'explore' && searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-2.5 py-1 text-[10px] bg-slate-50 border border-slate-200 rounded font-bold text-slate-650 hover:bg-slate-100"
              >
                Clear Search
              </button>
            )}
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono bg-slate-50/60 p-1.5 px-2.5 rounded-lg border border-slate-100">
              UTC: {new Date().toISOString().slice(11, 19)} Live
            </span>
          </div>
        </header>

        {/* Scrollable Main body content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6 lg:p-8 no-scrollbar scroll-smooth">
          {activeTab === 'explore' && (
            <ExploreFeed
              onAddPostClick={() => setIsPostModalOpen(true)}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              likedPostIds={likedPostIds}
            />
          )}

          {activeTab === 'leaderboard' && (
            <Leaderboard />
          )}

          {activeTab === 'profile' && (
            <ProfileView
              onSuggestPostCreation={() => setIsPostModalOpen(true)}
              likedPostIds={likedPostIds}
            />
          )}
        </div>
      </main>

      {/* Desktop-Only Right Sidebar (Top rankings + Tags preset shortcuts + Tips) */}
      <aside className="hidden xl:flex w-72 border-l border-slate-200 bg-white p-6 flex-col shrink-0 h-full overflow-y-auto">
        <div>
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-1.5 font-mono">
            <Trophy className="w-3.5 h-3.5 text-amber-500" /> Top Builders
          </h2>
          
          {profilesLoading ? (
            <div className="flex flex-col gap-2 py-4">
              <div className="h-10 bg-slate-50 animate-pulse rounded-lg border border-slate-100" />
              <div className="h-10 bg-slate-50 animate-pulse rounded-lg border border-slate-100" />
              <div className="h-10 bg-slate-50 animate-pulse rounded-lg border border-slate-100" />
            </div>
          ) : topProfiles.length > 0 ? (
            <div className="space-y-4">
              {topProfiles.slice(0, 3).map((prof, idx) => (
                <div key={prof.uid} className="flex items-center gap-4">
                  <div className="relative">
                    <img
                      referrerPolicy="no-referrer"
                      src={prof.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150'}
                      alt={prof.username}
                      className="w-10 h-10 rounded-full object-cover border border-slate-100 bg-slate-50"
                    />
                    <span className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black border-2 border-white text-white shadow-sm ${
                      idx === 0 ? 'bg-amber-400' : idx === 1 ? 'bg-slate-400' : 'bg-orange-400'
                    }`}>
                      {idx + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-extrabold text-slate-900 truncate leading-none mb-1">{prof.username}</p>
                    <p className="text-[10px] text-indigo-700 font-bold uppercase tracking-wider font-mono">
                      ✨ {prof.points} PTS
                    </p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                </div>
              ))}

              <button
                onClick={() => setActiveTab('leaderboard')}
                className="w-full mt-2 py-2 border border-slate-200 hover:bg-slate-50 rounded text-[11px] font-bold text-slate-500 transition-all select-none"
              >
                View Full Rankings
              </button>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-3 italic font-mono">No builders registered.</p>
          )}

          {/* Trending Skills Presets block */}
          <div className="mt-10 pt-10 border-t border-slate-100">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5 font-mono">
              <Cpu className="w-3.5 h-3.5 text-indigo-500" /> Trending Skills
            </h2>
            <div className="flex flex-wrap gap-2">
              {["React", "TypeScript", "LLM", "Docker", "NextJS", "Go", "Supabase", "Rust"].map((tag) => (
                <span
                  key={tag}
                  onClick={() => {
                    setSearchQuery(tag);
                    setActiveTab('explore');
                  }}
                  className="px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-600 rounded-md text-[9px] font-bold uppercase tracking-tighter cursor-pointer hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-100 transition-all font-mono"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Pro Tip Card */}
        <div className="mt-auto p-4 bg-indigo-950 text-white rounded-xl shadow-lg border border-slate-800">
          <p className="text-[9px] font-black uppercase tracking-widest text-indigo-300 mb-1 font-mono">PRO TIP</p>
          <p className="text-[11px] font-semibold leading-relaxed text-indigo-100">
            Receive +2 points for every like on your project. Publishing a showcase builds credibility. Consistency builds trust!
          </p>
        </div>
      </aside>

      {/* Post Modal overlay */}
      {isPostModalOpen && (
        <PostFormModal
          onClose={() => setIsPostModalOpen(false)}
          onPostCreated={() => {
            setActiveTab('explore');
            setSearchQuery('');
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <FirebaseProvider>
      <ApplicationShell />
    </FirebaseProvider>
  );
}
