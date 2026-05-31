import React from 'react';
import { Rocket, FileQuestion, Sparkles } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  type?: 'projects' | 'search' | 'profile';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText,
  onAction,
  type = 'projects'
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 md:p-16 bg-white rounded-2xl border border-slate-100 shadow-sm max-w-xl mx-auto my-8">
      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-500 mb-6">
        {type === 'projects' && <Rocket className="w-8 h-8 text-indigo-500 animate-pulse" />}
        {type === 'search' && <FileQuestion className="w-8 h-8 text-amber-500" />}
        {type === 'profile' && <Sparkles className="w-8 h-8 text-emerald-500" />}
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
      <p className="text-slate-500 text-sm max-w-md leading-relaxed mb-6">
        {description}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-sm transition-all shadow-sm hover:shadow-indigo-100"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
