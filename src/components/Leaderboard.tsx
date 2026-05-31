import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Profile } from '../types';
import { useFirebaseAuth } from './FirebaseProvider';
import { motion } from 'motion/react';
import { Trophy, Star, ChevronRight, Sparkles, Award } from 'lucide-react';

export const Leaderboard: React.FC = () => {
  const { user } = useFirebaseAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const profilesRef = collection(db, 'profiles');
    const q = query(profilesRef, orderBy('points', 'desc'), limit(25));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Profile[] = [];
      snapshot.forEach((doc) => {
        list.push({
          uid: doc.id,
          ...doc.data()
        } as Profile);
      });
      setProfiles(list);
      setLoading(false);
    }, (error) => {
      setLoading(false);
      handleFirestoreError(error, OperationType.GET, 'profiles');
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-24">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-400 font-mono text-xs">Computing reputation rankings...</span>
        </div>
      </div>
    );
  }

  // Split into Top 3 and Others
  const topThree = profiles.slice(0, 3);
  // Reorder top 3 to read index-1 (2nd), index-0 (1st), index-2 (3rd) on grid for podium feel!
  const podiumOrder = [];
  if (topThree[1]) podiumOrder.push({ profile: topThree[1], rank: 2, badgeColor: 'bg-slate-200 border-slate-300 text-slate-700', ringColor: 'ring-slate-300', icon: '🥈' });
  if (topThree[0]) podiumOrder.push({ profile: topThree[0], rank: 1, badgeColor: 'bg-amber-100 border-amber-300 text-amber-800', ringColor: 'ring-amber-400 scale-110', icon: '🥇' });
  if (topThree[2]) podiumOrder.push({ profile: topThree[2], rank: 3, badgeColor: 'bg-orange-100 border-orange-200 text-orange-850', ringColor: 'ring-orange-350', icon: '🥉' });

  const remainingBuilders = profiles.slice(3);

  // Find current user's profile position if logged in
  const currentUserRank = profiles.findIndex(p => p.uid === user?.uid) + 1;
  const currentUserProfile = profiles.find(p => p.uid === user?.uid);

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-4">
      {/* Overview introduction */}
      <div className="text-center md:text-left md:flex md:items-center md:justify-between py-2 border-b border-slate-100">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center justify-center md:justify-start gap-2.5">
            <Trophy className="w-6 h-6 text-amber-500 animate-bounce" /> Hall of Elite Builders
          </h2>
          <p className="text-sm text-slate-500 mt-1">Proof-of-skill reputation scores compiled dynamically based on contributions, liking and peer-reviews.</p>
        </div>
        
        {/* Dynamic score summary */}
        <div className="hidden md:block bg-indigo-50 border border-indigo-100/30 rounded-xl p-3.5 px-5 font-mono text-xs max-w-xs text-indigo-950 font-medium">
          <div className="flex items-center gap-1.5 text-indigo-700 font-bold mb-1">
            <Sparkles className="w-3.5 h-3.5" /> Scoring Formula
          </div>
          Publish post: <span className="font-bold text-indigo-705">+10 pts</span><br/>
          Receive post like: <span className="font-bold text-indigo-705">+2 pts</span><br/>
          Receive comment: <span className="font-bold text-indigo-705">+5 pts</span>
        </div>
      </div>

      {/* Top 3 Podium Displays */}
      {topThree.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-end pt-10 px-4 select-none">
          {podiumOrder.map(({ profile, rank, badgeColor, ringColor, icon }) => (
            <motion.div
              key={profile.uid}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: rank * 0.1 }}
              className={`bg-white border rounded-2xl p-6 text-center flex flex-col items-center justify-between relative shadow-sm hover:translate-y-[-4px] transition-all duration-300 ${
                rank === 1 ? 'ring-2 ring-amber-400 border-amber-200 py-8 bg-amber-50/10' : 'border-slate-100'
              }`}
            >
              {/* Rank visual crown badge */}
              <div className={`absolute top-0 transform translate-y-[-50%] px-3.5 py-1.5 rounded-full border text-sm font-extrabold flex items-center gap-1 shadow-md font-mono ${badgeColor}`}>
                {icon} RANK {rank}
              </div>

              {/* Avatar picture */}
              <div className="relative mt-2">
                <img
                  referrerPolicy="no-referrer"
                  src={profile.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150'}
                  alt={profile.username}
                  className={`w-20 h-20 rounded-2xl object-cover ring-4 ${ringColor} shadow-md`}
                />
              </div>

              {/* Profile Details */}
              <div className="mt-4 w-full">
                <h3 className="font-bold text-slate-800 truncate px-2 text-lg">{profile.username}</h3>
                <p className="text-[10px] text-slate-400 font-mono truncate px-1 mt-0.5">{profile.email}</p>
                
                {/* Skills array preview */}
                {profile.skills && profile.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-1 justify-center mt-3 max-h-12 overflow-hidden px-2">
                    {profile.skills.slice(0, 3).map((tag) => (
                      <span key={tag} className="bg-slate-50 border border-slate-100 text-slate-500 rounded px-1.5 py-0.5 text-[9px] font-semibold font-mono">
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-[10px] font-medium text-slate-350 block mt-3">No skills listed yet</span>
                )}
              </div>

              {/* Points badge */}
              <div className="mt-5 w-full bg-slate-50 border border-slate-100/50 rounded-xl py-2.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider block">Reputation Score</span>
                <span className="text-xl font-black text-indigo-700 font-mono mt-0.5 block">✨ {profile.points} pts</span>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-slate-400 text-sm">No builders found yet. Keep building!</div>
      )}

      {/* Remaining list leaderboard table */}
      {remainingBuilders.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-150 overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center px-6">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Rankings #4 to #{profiles.length}</span>
            <span className="text-xs text-slate-450 font-semibold font-mono">Limit 25 leaderboard spotlights</span>
          </div>

          <div className="divide-y divide-slate-100 font-sans">
            {remainingBuilders.map((prof, index) => {
              const actualRank = index + 1 + 3;
              const isCurrentUser = user && user.uid === prof.uid;
              return (
                <div 
                  key={prof.uid}
                  className={`flex items-center justify-between p-4 px-6 hover:bg-slate-50/50 transition-all ${
                    isCurrentUser ? 'bg-indigo-50/10 font-bold' : ''
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    {/* Rank indicator */}
                    <div className="w-8 font-mono text-sm font-extrabold text-slate-400 text-left select-none">
                      #{actualRank}
                    </div>

                    {/* Profile avatar/metadata */}
                    <img
                      referrerPolicy="no-referrer"
                      src={prof.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150'}
                      alt={prof.username}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-100 bg-slate-10"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-800 truncate">{prof.username}</span>
                        {isCurrentUser && (
                          <span className="bg-indigo-100 text-indigo-700 text-[10px] px-1.5 py-0.2 rounded font-mono font-bold uppercase">
                            You
                          </span>
                        )}
                      </div>
                      
                      {/* Skills array list */}
                      {prof.skills && prof.skills.length > 0 && (
                        <div className="flex gap-1 mt-1 truncate">
                          {prof.skills.slice(0, 4).map(skill => (
                            <span key={skill} className="text-[10px] bg-slate-100 text-slate-500 px-1 py-0.2 rounded mr-1">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Points tally */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="font-mono font-extrabold text-sm text-indigo-600 block">{prof.points}</span>
                      <span className="text-[9px] text-slate-400 uppercase font-mono block">points</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Floating Personal Rank Drawer if User logged in */}
      {user && currentUserProfile && (
        <div className="p-4 bg-indigo-950 text-white rounded-2xl flex items-center justify-between shadow-xl shadow-indigo-900/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Award className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-indigo-200 tracking-wider block font-mono">Your Reputation Position</span>
              <span className="text-sm font-bold text-white block">
                {currentUserProfile.username} &nbsp;&bull;&nbsp; Global Rank #{currentUserRank}
              </span>
            </div>
          </div>

          <div className="text-right font-mono">
            <span className="text-xl font-black text-indigo-300 block">✨ {currentUserProfile.points}</span>
            <span className="text-[9px] uppercase tracking-wider text-indigo-300 font-semibold block">Total Points</span>
          </div>
        </div>
      )}
    </div>
  );
};
