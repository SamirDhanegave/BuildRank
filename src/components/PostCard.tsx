import React, { useState, useEffect } from 'react';
import { useFirebaseAuth } from './FirebaseProvider';
import { likePost, unlikePost, addComment, deleteComment, deletePost } from '../services/dbOperations';
import { Post, Comment } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  MessageSquare, 
  ExternalLink, 
  Trash2, 
  Send, 
  Sparkles, 
  Calendar, 
  User as UserIcon,
  ChevronsDown,
  ChevronsUp
} from 'lucide-react';

const getTagStyle = (tag: string) => {
  const t = tag.toLowerCase();
  if (t.includes('react') || t.includes('next')) {
    return 'bg-sky-50 text-sky-700 border-sky-100';
  }
  if (t.includes('ts') || t.includes('typescript') || t.includes('js') || t.includes('javascript')) {
    return 'bg-blue-50/70 text-blue-700 border-blue-200/50';
  }
  if (t.includes('ai') || t.includes('gemini') || t.includes('llm') || t.includes('openai')) {
    return 'bg-indigo-50 text-indigo-700 border-indigo-200/60';
  }
  if (t.includes('py') || t.includes('python')) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200/60';
  }
  if (t.includes('rust') || t.includes('wasm') || t.includes('go')) {
    return 'bg-orange-50 text-orange-700 border-orange-200/60';
  }
  if (t.includes('css') || t.includes('tailwind')) {
    return 'bg-pink-50 text-pink-700 border-pink-200/50';
  }
  return 'bg-slate-50 text-slate-600 border-slate-200/60';
};

interface PostCardProps {
  post: Post;
  isLiked: boolean;
}

export const PostCard: React.FC<PostCardProps> = ({ post, isLiked }) => {
  const { user, profile } = useFirebaseAuth();
  const [commentsExpanded, setCommentsExpanded] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmingCommentId, setConfirmingCommentId] = useState<string | null>(null);

  // Load comments in real-time only when section is expanded to save FireStore reads (Cost-Optimised!)
  useEffect(() => {
    if (!commentsExpanded) return;

    setCommentsLoading(true);
    const commentsRef = collection(db, 'comments');
    const q = query(
      commentsRef, 
      where('postId', '==', post.id),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Comment[] = [];
      snapshot.forEach((doc) => {
        list.push({
          id: doc.id,
          ...doc.data()
        } as Comment);
      });
      setComments(list);
      setCommentsLoading(false);
    }, (error) => {
      setCommentsLoading(false);
      handleFirestoreError(error, OperationType.GET, 'comments');
    });

    return () => unsubscribe();
  }, [commentsExpanded, post.id]);

  const handleLikeToggle = async () => {
    if (!user) {
      alert("Please sign in first to interact with projects!");
      return;
    }
    if (actionLoading) return;

    setActionLoading(true);
    try {
      if (isLiked) {
        await unlikePost(user.uid, post.id, post.userId);
      } else {
        await likePost(user.uid, post.id, post.userId);
      }
    } catch (err) {
      console.error("Error toggling like:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) {
      alert("Please sign in to drop comments.");
      return;
    }
    if (!commentInput.trim()) return;

    const content = commentInput.trim();
    setCommentInput('');

    try {
      await addComment(
        user.uid,
        post.id,
        profile.username,
        profile.photoURL || user.photoURL || '',
        content,
        post.userId
      );
    } catch (err) {
      console.error("Error submitting comment:", err);
    }
  };

  const handleDeleteComment = async (commentId: string, commentAuthorId: string) => {
    try {
      await deleteComment(commentId, post.id, post.userId, commentAuthorId);
      setConfirmingCommentId(null);
    } catch (err) {
      console.error("Error deleting comment:", err);
    }
  };

  const handleDeletePost = async () => {
    try {
      await deletePost(post.id, post.userId);
      setShowDeleteConfirm(false);
    } catch (err) {
      console.error("Error deleting post:", err);
    }
  };

  // Safe formatting for Firebase timestamps
  const formatPostDate = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col hover:shadow-md hover:border-slate-300 transition-all duration-250 h-full"
    >
      {/* Cover Image Block */}
      {post.imageURL ? (
        <div className="relative aspect-video w-full overflow-hidden bg-slate-50">
          <img
            referrerPolicy="no-referrer"
            src={post.imageURL}
            alt={post.title}
            className="w-full h-full object-cover select-none brightness-[0.98] hover:brightness-100 transition-all duration-300"
            loading="lazy"
          />
          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-[2px] border border-slate-200/80 rounded-lg px-2 py-0.8 text-[9px] font-mono font-bold text-slate-500 shadow-sm uppercase tracking-wide">
            🔥 Showcase #{post.id.slice(0, 4).toUpperCase()}
          </div>
        </div>
      ) : (
        <div className="h-2 bg-indigo-600 w-full block shrink-0" />
      )}

      {/* Card Content Header */}
      <div className="p-4.5 flex-1 flex flex-col justify-between">
        <div>
          {/* Post Title */}
          <h4 className="text-sm font-bold text-slate-900 leading-snug line-clamp-1 mb-1.5 hover:text-indigo-600 cursor-pointer transition-colors" title={post.title}>
            {post.title}
          </h4>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3 select-none">
              {post.tags.map((tag) => (
                <span 
                  key={tag}
                  className={`px-2 py-0.5 text-[9px] font-bold rounded-md border tracking-tight transition-all uppercase font-mono ${getTagStyle(tag)}`}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed mb-4 whitespace-pre-wrap">
            {post.description}
          </p>
        </div>

        {/* Builder Status Block */}
        <div className="pt-3 border-t border-slate-100 mt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img
                referrerPolicy="no-referrer"
                src={post.userPhotoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150'}
                alt={post.username}
                className="w-7 h-7 rounded-full object-cover bg-slate-50 border border-slate-100"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 block line-clamp-1 leading-none">{post.username}</span>
                <span className="text-[9px] text-slate-400 font-mono flex items-center gap-1 mt-0.5 leading-none">
                  <Calendar className="w-2.5 h-2.5 text-slate-400" /> {formatPostDate(post.createdAt)}
                </span>
              </div>
            </div>

            {/* External Action link */}
            {post.link && (
              <a
                href={post.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center p-1.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-all border border-indigo-100/50"
                title="Go to external repo / live demo"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Interaction Bar & Buttons */}
      <div className="px-5 py-3.5 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between select-none shrink-0">
        <div className="flex items-center gap-2">
          {/* Like Button */}
          <button
            onClick={handleLikeToggle}
            disabled={actionLoading}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              isLiked 
                ? 'bg-rose-50 border-rose-100 text-rose-600 shadow-sm shadow-rose-100/50' 
                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'
            }`}
          >
            <Heart className={`w-3.8 h-3.8 transition-all ${isLiked ? 'fill-rose-500 text-rose-500 scale-110' : ''}`} />
            <span>{post.likesCount}</span>
          </button>

          {/* Comment Drawer Toggle */}
          <button
            onClick={() => setCommentsExpanded(!commentsExpanded)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              commentsExpanded 
                ? 'bg-indigo-50 border-indigo-100 text-indigo-700' 
                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'
            }`}
          >
            <MessageSquare className="w-3.8 h-3.8 text-slate-400 group-hover:text-indigo-600" />
            <span>{post.commentsCount}</span>
            {commentsExpanded ? <ChevronsUp className="w-3 h-3" /> : <ChevronsDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Delete Post Button (Only author of the project can delete) */}
        {user && user.uid === post.userId && (
          <div className="relative flex items-center">
            <AnimatePresence>
              {showDeleteConfirm && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  className="absolute right-0 bottom-full mb-2 bg-white border border-rose-200 rounded-xl p-3 shadow-lg flex flex-col gap-2 z-20 w-48 text-left"
                >
                  <p className="text-[10px] text-slate-600 font-medium leading-normal">
                    Are you sure? This retracts the project and deducts 10 points.
                  </p>
                  <div className="flex gap-1.5 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-2 py-1 text-[10px] font-semibold text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-lg transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDeletePost}
                      className="px-2 py-1 text-[10px] font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-all"
                    >
                      Confirm
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center justify-center p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-all cursor-pointer"
              title="Retract project showcase"
            >
              <Trash2 className="w-4.5 h-4.5" />
            </button>
          </div>
        )}
      </div>

      {/* Expandable Comments Section */}
      <AnimatePresence>
        {commentsExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-slate-100 overflow-hidden bg-slate-50/30"
          >
            <div className="p-4 md:p-5 space-y-4">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                Project Discussion
              </span>

              {/* Add Comment Area */}
              {user ? (
                <form onSubmit={handleAddCommentSubmit} className="flex gap-2">
                  <input
                    type="text"
                    required
                    maxLength={1000}
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder="Ask a technical detail or drop feedback..."
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-100 bg-white"
                  />
                  <button
                    type="submit"
                    className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-sm shrink-0 flex items-center justify-center"
                    title="Publish comment (+5 points to builder)"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              ) : (
                <div className="p-3 bg-slate-100 border border-slate-100 rounded-xl text-[11px] text-slate-500 text-center select-none font-sans">
                  🔑 Please sign in to join the discussion.
                </div>
              )}

              {/* Comments List */}
              {commentsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : comments.length === 0 ? (
                <p className="text-[11px] text-slate-400 text-center py-4 italic select-none">
                  No comments yet. Be the first to start the engineering peer-review!
                </p>
              ) : (
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1 no-scrollbar">
                  {comments.map((comment) => {
                    const isCommentOwner = user && user.uid === comment.userId;
                    const isPostOwner = user && user.uid === post.userId;
                    
                    return (
                      <div 
                        key={comment.id}
                        className="bg-white rounded-xl border border-slate-100/70 p-3 flex gap-2.5 items-start text-xs group"
                      >
                        <img
                          referrerPolicy="no-referrer"
                          src={comment.userPhotoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150'}
                          alt={comment.username}
                          className="w-6.5 h-6.5 rounded-md object-cover bg-slate-50"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-slate-700 leading-none">{comment.username}</span>
                            <span className="text-[9px] font-mono text-slate-400">{formatPostDate(comment.createdAt)}</span>
                          </div>
                          <p className="text-slate-500 leading-relaxed break-words">{comment.content}</p>
                        </div>

                         {/* Delete Comment */}
                        {(isCommentOwner || isPostOwner) && (
                          <div className="relative shrink-0 self-center">
                            {confirmingCommentId === comment.id ? (
                              <div className="flex items-center gap-1 bg-rose-50 border border-rose-100 rounded-lg p-1">
                                <button
                                  type="button"
                                  onClick={() => setConfirmingCommentId(null)}
                                  className="px-1.5 py-0.5 text-[9px] font-bold text-slate-500 hover:text-slate-800"
                                >
                                  No
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteComment(comment.id, comment.userId)}
                                  className="px-1.5 py-0.5 text-[9px] font-bold text-rose-600 hover:text-rose-800 border-l border-rose-100"
                                >
                                  Yes
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmingCommentId(comment.id)}
                                className="text-slate-350 hover:text-rose-600 rounded p-1 transition-all shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100"
                                title="Remove comment"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
