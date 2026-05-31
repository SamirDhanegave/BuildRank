import React, { useState } from 'react';
import { useFirebaseAuth } from './FirebaseProvider';
import { 
  Compass, 
  Trophy, 
  User as UserIcon, 
  LogIn, 
  LogOut, 
  Search, 
  Sparkles,
  Menu,
  X
} from 'lucide-react';

interface NavigationProps {
  activeTab: 'explore' | 'leaderboard' | 'profile';
  setActiveTab: (tab: 'explore' | 'leaderboard' | 'profile') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
}) => {
  const { user, profile, login, logout } = useFirebaseAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo / Brand */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab('explore')}>
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <Sparkles className="w-5.6 h-5.6" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-indigo-650 block">BuildRank</span>
              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-mono font-semibold">Proof Of Skill</span>
            </div>
          </div>

          {/* Desktop Search Field */}
          <div className="hidden md:flex flex-1 max-w-sm mx-8">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects by title, tags, description..."
                className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all bg-slate-50/50"
              />
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setActiveTab('explore')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'explore'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Compass className="w-4 h-4" />
              Explore
            </button>
            
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'leaderboard'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Trophy className="w-4 h-4" />
              Leaderboard
            </button>

            {user && (
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'profile'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <UserIcon className="w-4 h-4" />
                Profile
              </button>
            )}
          </div>

          {/* User Sign-In/Out Indicator */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2.5 p-1 px-2 rounded-xl border border-slate-100 bg-slate-50/30 hover:bg-slate-50 transition-all align-middle"
                >
                  <img
                    referrerPolicy="no-referrer"
                    src={profile?.photoURL || user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150'}
                    alt={profile?.username || 'User'}
                    className="w-8 h-8 rounded-lg object-cover bg-slate-100"
                  />
                  <div className="text-left">
                    <span className="text-xs font-semibold text-slate-800 block leading-none">
                      {profile?.username || 'Builder'}
                    </span>
                    <span className="text-[10px] font-bold text-indigo-600 flex items-center gap-0.5 mt-0.5 bg-indigo-50 px-1 py-0.2 rounded font-mono">
                      ✨ {profile?.points ?? 0} pts
                    </span>
                  </div>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-lg py-1 text-sm z-50 origin-top-right">
                    <div className="px-4 py-2 border-b border-slate-50 text-xs text-slate-400">
                      Signed in as<br/>
                      <span className="font-semibold text-slate-700">{user.email}</span>
                    </div>
                    <button
                      onClick={() => {
                        setActiveTab('profile');
                        setDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <UserIcon className="w-4 h-4" />
                      View Profile
                    </button>
                    <button
                      onClick={() => {
                        logout();
                        setDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={login}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-sm transition-all shadow-sm shadow-indigo-100"
              >
                <LogIn className="w-4 h-4" />
                Sign in with Google
              </button>
            )}
          </div>

          {/* Mobile menu trigger */}
          <div className="flex items-center gap-2 md:hidden">
            {user && (
              <div className="flex items-center gap-1.5 bg-indigo-50 px-2 py-1 rounded-lg text-xs font-mono font-bold text-indigo-700 mr-2">
                ✨ {profile?.points ?? 0}
              </div>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1 px-2 border border-slate-100 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white/95 backdrop-blur px-4 py-4 space-y-3 shadow-inner">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => {
                setActiveTab('explore');
                setMobileMenuOpen(false);
              }}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'explore'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Compass className="w-5 h-5" />
              Explore
            </button>
            
            <button
              onClick={() => {
                setActiveTab('leaderboard');
                setMobileMenuOpen(false);
              }}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'leaderboard'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Trophy className="w-5 h-5" />
              Leaderboard
            </button>

            <button
              onClick={() => {
                if (user) {
                  setActiveTab('profile');
                } else {
                  login();
                }
                setMobileMenuOpen(false);
              }}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'profile'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <UserIcon className="w-5 h-5" />
              {user ? 'Profile' : 'Sign In'}
            </button>
          </div>

          {user && (
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  referrerPolicy="no-referrer"
                  src={profile?.photoURL || user.photoURL || ''}
                  alt={profile?.username || ''}
                  className="w-9 h-9 rounded-lg"
                />
                <div>
                  <div className="text-xs font-bold text-slate-800">{profile?.username || 'Builder'}</div>
                  <div className="text-[10px] text-slate-400">{user.email}</div>
                </div>
              </div>
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
