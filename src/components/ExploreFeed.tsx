import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Post } from '../types';
import { PostCard } from './PostCard';
import { EmptyState } from './EmptyState';
import { useFirebaseAuth } from './FirebaseProvider';
import { Compass, Sparkles, Flame, Rocket, Filter, X } from 'lucide-react';

interface ExploreFeedProps {
  onAddPostClick: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  likedPostIds: string[];
}

const COMMON_TAGS = [
  "React", "TypeScript", "Next.js", "Tailwind CSS", "Firebase", 
  "Node.js", "AI/Gemini", "Database", "Mobile App", "UI/UX"
];

export const ExploreFeed: React.FC<ExploreFeedProps> = ({
  onAddPostClick,
  searchQuery,
  setSearchQuery,
  likedPostIds
}) => {
  const { user, login } = useFirebaseAuth();
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'new' | 'trending'>('new');
  const [activeTag, setActiveTag] = useState<string | null>(null);

  // Load all posts in real-time
  useEffect(() => {
    const postsRef = collection(db, 'posts');
    const q = query(postsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Post[] = [];
      snapshot.forEach((doc) => {
        list.push({
          id: doc.id,
          ...doc.data()
        } as Post);
      });
      setAllPosts(list);
      setLoading(false);
    }, (error) => {
      setLoading(false);
      handleFirestoreError(error, OperationType.GET, 'posts');
    });

    return () => unsubscribe();
  }, []);

  // Filter and sort combinatorial logic
  const filteredPosts = allPosts.filter((post) => {
    // 1. Tag filter
    if (activeTag && !post.tags?.includes(activeTag)) {
      return false;
    }

    // 2. Keyword search filter
    if (searchQuery.trim()) {
      const queryLower = searchQuery.toLowerCase().trim();
      const titleMatch = post.title?.toLowerCase().includes(queryLower);
      const descMatch = post.description?.toLowerCase().includes(queryLower);
      const tagMatch = post.tags?.some(tag => tag.toLowerCase().includes(queryLower));
      return titleMatch || descMatch || tagMatch;
    }

    return true;
  });

  // Client-side sorting for instant action
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (sortBy === 'trending') {
      // Sort primarily by likesCount descending, then secondary by createdAt descending
      if (b.likesCount !== a.likesCount) {
        return b.likesCount - a.likesCount;
      }
    }
    // Fallback or 'new' sort by createdAt
    const timeA = a.createdAt?.seconds || 0;
    const timeB = b.createdAt?.seconds || 0;
    return timeB - timeA;
  });

  const handleHeaderAction = () => {
    if (user) {
      onAddPostClick();
    } else {
      login();
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2">
      {/* Editorial Hero Announcement card */}
      <div className="relative bg-gradient-to-r from-slate-900 via-slate-950 to-indigo-950 rounded-3xl p-6 md:p-8 text-white overflow-hidden shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-10 w-60 h-60 bg-indigo-600/5 rounded-full blur-2xl" />
        
        <div className="relative max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/15 cursor-default transition-all text-indigo-300 font-mono text-[10px] uppercase tracking-widest rounded-full border border-white/5 font-semibold">
            <Sparkles className="w-3 h-3 text-indigo-400 rotate-12" /> Builder Ecosystem V1
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-none text-white font-sans sm:leading-tight">
            Discover developer talent through <span className="text-indigo-400">proof of skill</span>, not resumes.
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
            A verified hub where you showcase live projects, review engineering codebases, gather real evaluation reputation points, and climb the developer board.
          </p>
          <div className="pt-2">
            <button
              onClick={handleHeaderAction}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-indigo-950 flex items-center gap-1.5 cursor-pointer"
            >
              <Rocket className="w-4 h-4 animate-pulse text-indigo-200" />
              {user ? "Share Your Project Showcase (+10 pts)" : "Link Profile To Share Work"}
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Control panel toolbar */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm select-none">
        
        {/* Toggle between New and Trending */}
        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl">
          <button
            onClick={() => setSortBy('new')}
            className={`flex items-center gap-1.5 px-4.5 py-1.8 rounded-lg text-xs font-bold transition-all ${
              sortBy === 'new'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-505 text-slate-500 hover:bg-slate-100/50'
            }`}
          >
            <Compass className="w-3.5 h-3.5" /> New & Chronological
          </button>
          
          <button
            onClick={() => setSortBy('trending')}
            className={`flex items-center gap-1.5 px-4.5 py-1.8 rounded-lg text-xs font-bold transition-all ${
              sortBy === 'trending'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-505 text-slate-500 hover:bg-slate-100/50'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-500" /> Trending Projects
          </button>
        </div>

        {/* Dynamic Horizontal preset chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth flex-1 md:max-w-xl lg:max-w-2xl py-1 md:py-0">
          <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider shrink-0 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter tags:
          </span>
          
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {COMMON_TAGS.map((tag) => {
              const active = activeTag === tag;
              return (
                <button
                  key={tag}
                  onClick={() => setActiveTag(active ? null : tag)}
                  className={`px-3 py-1.2 rounded-lg text-xs font-medium border transition-all shrink-0 cursor-pointer ${
                    active
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>

          {activeTag && (
            <button
              onClick={() => setActiveTag(null)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded bg-slate-100 transition-all shrink-0 cursor-pointer"
              title="Clear active filter"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Listing details */}
      {(searchQuery || activeTag) && (
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono py-1 px-1 select-none">
          <div>
            Showing <span className="font-bold text-slate-700">{sortedPosts.length}</span> projects matching: &nbsp;
            {activeTag && <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 py-0.5 px-1.5 rounded mr-1.5 font-bold">#{activeTag}</span>}
            {searchQuery && <span className="bg-slate-100 border border-slate-200 text-slate-650 py-0.5 px-1.5 rounded font-bold font-mono">"{searchQuery}"</span>}
          </div>
          <button
            onClick={() => {
              setActiveTag(null);
              setSearchQuery('');
            }}
            className="text-indigo-650 font-bold hover:underline"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Main Grid Feed */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-24 select-none">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-400 font-mono text-xs mt-3">Compiling build feed spotlight...</span>
        </div>
      ) : sortedPosts.length === 0 ? (
        <EmptyState
          title={searchQuery || activeTag ? "No Matches Found" : "Spotlight Feed is Dry"}
          description={
            searchQuery || activeTag
              ? "We couldn't locate any matching developer portfolio projects. Expand your query syntax or try another filter tag!"
              : "No developers have launched project showcases yet. Be the elite trailblazer who sets up page #1!"
          }
          actionText={searchQuery || activeTag ? "Clear Active Filters" : "Launch Project Spotlight"}
          onAction={searchQuery || activeTag ? () => { setActiveTag(null); setSearchQuery(''); } : handleHeaderAction}
          type={searchQuery || activeTag ? 'search' : 'projects'}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedPosts.map((post) => (
            <PostCard 
              key={post.id} 
              post={post} 
              isLiked={likedPostIds.includes(post.id)} 
            />
          ))}
        </div>
      )}
    </div>
  );
};
