import React, { useState } from 'react';
import { useFirebaseAuth } from './FirebaseProvider';
import { createPost } from '../services/dbOperations';
import { X, Sparkles, AlertCircle, Link as LinkIcon, Code2, Layers, Image as ImageIcon } from 'lucide-react';

interface PostFormModalProps {
  onClose: () => void;
  onPostCreated: () => void;
}

const PRESET_COVERS = [
  { name: "Minimal Developer Workspace", url: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80" },
  { name: "Terminal Dashboard", url: "https://images.unsplash.com/photo-1629654297299-c8506221ca97?auto=format&fit=crop&w=800&q=80" },
  { name: "Abstract Circuit Neon", url: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80" },
  { name: "Sleek Dark Code Glass", url: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=800&q=80" },
  { name: "High Contrast Tech Block", url: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80" },
  { name: "System Logic Flow", url: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80" }
];

const PRESET_TAGS = [
  "React", "TypeScript", "Next.js", "Tailwind CSS", "Firebase", 
  "Node.js", "AI/Gemini", "Database", "Mobile App", "UI/UX", 
  "Python", "Rust", "Web3", "Machine Learning", "Cloud native"
];

export const PostFormModal: React.FC<PostFormModalProps> = ({ onClose, onPostCreated }) => {
  const { user, profile } = useFirebaseAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [linkInput, setLinkInput] = useState('');
  const [imageURL, setImageURL] = useState(PRESET_COVERS[0].url);
  const [customImageMode, setCustomImageMode] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      if (selectedTags.length >= 10) return; // Limit 10 tags
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleAddCustomTag = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTag = tagInput.trim().replace(/[^a-zA-Z0-9_\-+:\s]/g, '');
    if (cleanTag && !selectedTags.includes(cleanTag)) {
      if (selectedTags.length >= 10) return;
      setSelectedTags([...selectedTags, cleanTag]);
      setTagInput('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) {
      setErrorMsg("You must be logged in to create a post.");
      return;
    }

    if (title.trim().length < 3 || title.trim().length > 100) {
      setErrorMsg("Title must be between 3 and 100 characters.");
      return;
    }

    if (description.trim().length < 10 || description.trim().length > 2000) {
      setErrorMsg("Description must be between 10 and 2000 characters.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      await createPost(
        user.uid,
        profile.username,
        profile.photoURL || user.photoURL || '',
        title.trim(),
        description.trim(),
        selectedTags,
        linkInput.trim(),
        imageURL.trim()
      );
      
      onPostCreated();
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Unauthorised or failed database write. Ensure inputs match security checks.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl border border-slate-100 shadow-2xl relative my-8 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
        
        {/* Banner/Header decoration */}
        <div className="bg-indigo-600 text-white p-6 relative">
          <button 
            type="button" 
            onClick={onClose} 
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-white/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-200" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Showcase a Project</h2>
              <p className="text-xs text-indigo-100 mt-0.5">Highlight your work & get evaluated by community members</p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 max-h-[85vh] overflow-y-auto no-scrollbar">
          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-sm flex gap-2.5 items-start">
              <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form Rows */}
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 font-mono">
                Project Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your project a descriptive name"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all bg-slate-50/20"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">3 - 100 characters</span>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 font-mono">
                Description / Proof of Concept <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detail what the project is, the technology used, and the direct problems it is engineered to solve..."
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all bg-slate-50/20 leading-relaxed"
              />
              <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                <span>Minimum 10 characters</span>
                <span>{description.length}/2000</span>
              </div>
            </div>

            {/* Link & Live Demop */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 font-mono flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5" /> Link (Demo or Github)
                </label>
                <input
                  type="url"
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  placeholder="https://github.com/..."
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all bg-slate-50/20"
                />
              </div>

              {/* Tags Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 font-mono flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5" /> Tags (Max 10)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Custom tag..."
                    className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-slate-50/20"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomTag(e);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={(e) => handleAddCustomTag(e)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all border border-slate-200"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Selected tags */}
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-100">
                {selectedTags.map((tag) => (
                  <span
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-1 text-xs font-mono font-semibold rounded-lg border border-indigo-100/30 hover:bg-rose-50 hover:text-rose-700 cursor-pointer transition-all"
                  >
                    {tag} <X className="w-3 h-3" />
                  </span>
                ))}
              </div>
            )}

            {/* Quick suggested chips */}
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-2">Preset Quick Tags</span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 border border-slate-50 rounded-xl bg-slate-50/50">
                {PRESET_TAGS.map((tag) => {
                  const active = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all ${
                        active
                          ? 'bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Image Cover Cover selection */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 font-mono flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5" /> Project Cover
                </label>
                <button
                  type="button"
                  onClick={() => setCustomImageMode(!customImageMode)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-all focus:outline-none"
                >
                  {customImageMode ? "Use gorgeous presets" : "Input custom Image URL"}
                </button>
              </div>

              {customImageMode ? (
                <div className="space-y-2">
                  <input
                    type="url"
                    value={imageURL}
                    onChange={(e) => setImageURL(e.target.value)}
                    placeholder="Enter visual PNG/JPG/WebP link..."
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all bg-slate-50/20"
                  />
                  {imageURL && (
                    <div className="w-full h-32 rounded-xl border border-slate border-dashed flex items-center justify-center overflow-hidden bg-slate-50 relative">
                      <img
                        referrerPolicy="no-referrer"
                        src={imageURL}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <span className="text-xs text-slate-400 absolute">Image Preview Block</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {PRESET_COVERS.map((cov) => {
                      const selected = imageURL === cov.url;
                      return (
                        <button
                          key={cov.name}
                          type="button"
                          onClick={() => setImageURL(cov.url)}
                          className={`group aspect-video rounded-xl border relative overflow-hidden transition-all text-left ${
                            selected
                              ? 'ring-2 ring-indigo-600 border-indigo-600'
                              : 'border-slate-100 hover:border-slate-300'
                          }`}
                        >
                          <img
                            referrerPolicy="no-referrer"
                            src={cov.url}
                            alt={cov.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-slate-990/60 p-2 backdrop-blur-[2px] transition-all bg-black/60">
                            <span className="text-[9px] font-semibold text-white/90 line-clamp-1 truncate font-sans">
                              {cov.name}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="text-[10px] text-slate-400 italic">
                    All preset visuals are premium Unsplash stock photography hosted on high-speed CDN.
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3.5">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-slate-200 text-slate-700 font-medium rounded-xl text-sm hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-medium rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2"
            >
              {submitting ? 'Creating spotlight...' : 'Launch Project (+10 Points)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
