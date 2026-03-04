'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { Megaphone, Plus, X, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string | Date;
  author: { name: string | null };
}

interface AnnouncementsWidgetProps {
  announcements: Announcement[];
  canPost: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AnnouncementsWidget({ announcements, canPost }: AnnouncementsWidgetProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), content: content.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to post announcement');
      }

      setTitle('');
      setContent('');
      setShowForm(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCancel() {
    setTitle('');
    setContent('');
    setError(null);
    setShowForm(false);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Megaphone className="h-4 w-4 text-blue-600" />
          Announcements
        </CardTitle>
        {canPost && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-3 w-3" />
            Post
          </button>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Post form */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="rounded-lg border border-blue-200 bg-blue-50 p-3 space-y-2"
          >
            <div>
              <input
                type="text"
                placeholder="Announcement title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
            <div>
              <textarea
                placeholder="Write your announcement..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none"
              />
            </div>
            {error && (
              <p className="text-xs text-red-600">{error}</p>
            )}
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={isSubmitting || !title.trim() || !content.trim()}
                className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting && <Loader2 className="h-3 w-3 animate-spin" />}
                {isSubmitting ? 'Posting...' : 'Post Announcement'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <X className="h-3 w-3" />
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Announcements feed */}
        <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
          {announcements.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-500">
              No announcements yet
            </div>
          ) : (
            announcements.map((a) => (
              <AnnouncementItem key={a.id} announcement={a} />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Announcement item ────────────────────────────────────────────────────────

function AnnouncementItem({ announcement: a }: { announcement: Announcement }) {
  const [expanded, setExpanded] = useState(false);
  const MAX_CHARS = 200;
  const isLong = a.content.length > MAX_CHARS;
  const displayContent = isLong && !expanded
    ? `${a.content.slice(0, MAX_CHARS)}...`
    : a.content;

  const createdAt = typeof a.created_at === 'string' ? new Date(a.created_at) : a.created_at;

  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 space-y-1">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-gray-900 leading-tight">{a.title}</p>
        <span className="shrink-0 text-xs text-gray-400">
          {formatDistanceToNow(createdAt, { addSuffix: true })}
        </span>
      </div>
      <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{displayContent}</p>
      {isLong && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-xs text-blue-600 hover:underline"
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
      <p className="text-xs text-gray-400">by {a.author?.name || 'Admin'}</p>
    </div>
  );
}
