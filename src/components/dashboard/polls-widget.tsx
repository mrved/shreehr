'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, Plus, X, Loader2, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PollOption {
  id: string;
  label: string;
  order: number;
  _count: { responses: number };
}

interface Poll {
  id: string;
  title: string;
  is_closed: boolean;
  closes_at: string | Date | null;
  options: PollOption[];
  _count: { responses: number };
  myVote: string | null; // optionId the current user voted for, or null
  author: { name: string | null };
}

interface PollsWidgetProps {
  polls: Poll[];
  canCreate: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PollsWidget({ polls, canCreate }: PollsWidgetProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [pollTitle, setPollTitle] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function addOption() {
    if (options.length < 10) {
      setOptions((prev) => [...prev, '']);
    }
  }

  function removeOption(index: number) {
    if (options.length > 2) {
      setOptions((prev) => prev.filter((_, i) => i !== index));
    }
  }

  function updateOption(index: number, value: string) {
    setOptions((prev) => prev.map((o, i) => (i === index ? value : o)));
  }

  async function handleCreatePoll(e: React.FormEvent) {
    e.preventDefault();
    const validOptions = options.map((o) => o.trim()).filter(Boolean);
    if (!pollTitle.trim() || validOptions.length < 2) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch('/api/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: pollTitle.trim(), options: validOptions }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create poll');
      }

      setPollTitle('');
      setOptions(['', '']);
      setShowForm(false);
      router.refresh();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCancel() {
    setPollTitle('');
    setOptions(['', '']);
    setFormError(null);
    setShowForm(false);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <BarChart3 className="h-4 w-4 text-purple-600" />
          Active Polls
        </CardTitle>
        {canCreate && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 rounded-md bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700 transition-colors"
          >
            <Plus className="h-3 w-3" />
            Create Poll
          </button>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Create poll form */}
        {showForm && (
          <form
            onSubmit={handleCreatePoll}
            className="rounded-lg border border-purple-200 bg-purple-50 p-3 space-y-2"
          >
            <div>
              <input
                type="text"
                placeholder="Poll question"
                value={pollTitle}
                onChange={(e) => setPollTitle(e.target.value)}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              />
            </div>
            <div className="space-y-1.5">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder={`Option ${i + 1}`}
                    value={opt}
                    onChange={(e) => updateOption(i, e.target.value)}
                    className="flex-1 rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(i)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
              {options.length < 10 && (
                <button
                  type="button"
                  onClick={addOption}
                  className="text-xs text-purple-600 hover:underline"
                >
                  + Add option
                </button>
              )}
            </div>
            {formError && (
              <p className="text-xs text-red-600">{formError}</p>
            )}
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  !pollTitle.trim() ||
                  options.filter((o) => o.trim()).length < 2
                }
                className="flex items-center gap-1.5 rounded-md bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting && <Loader2 className="h-3 w-3 animate-spin" />}
                {isSubmitting ? 'Creating...' : 'Create Poll'}
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

        {/* Polls list */}
        <div className="max-h-80 overflow-y-auto space-y-3 pr-1">
          {polls.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-500">
              No active polls
            </div>
          ) : (
            polls.map((poll) => (
              <PollItem key={poll.id} poll={poll} onVoted={() => router.refresh()} />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Individual poll ──────────────────────────────────────────────────────────

function PollItem({ poll, onVoted }: { poll: Poll; onVoted: () => void }) {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);

  const hasVoted = poll.myVote !== null;
  const totalVotes = poll._count.responses;

  async function handleVote(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedOptionId) return;

    setIsVoting(true);
    setVoteError(null);

    try {
      const res = await fetch(`/api/polls/${poll.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId: selectedOptionId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to cast vote');
      }

      onVoted();
    } catch (err: any) {
      setVoteError(err.message);
    } finally {
      setIsVoting(false);
    }
  }

  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 space-y-2">
      <div>
        <p className="text-sm font-semibold text-gray-900">{poll.title}</p>
        <p className="text-xs text-gray-400">by {poll.author?.name || 'Admin'}</p>
      </div>

      {hasVoted ? (
        // Results view
        <div className="space-y-1.5">
          {poll.options.map((option) => {
            const count = option._count.responses;
            const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
            const isMyVote = poll.myVote === option.id;
            return (
              <div key={option.id} className="space-y-0.5">
                <div className="flex items-center justify-between text-xs">
                  <span className={`flex items-center gap-1 ${isMyVote ? 'font-semibold text-blue-700' : 'text-gray-700'}`}>
                    {isMyVote && <CheckCircle2 className="h-3 w-3 text-blue-600" />}
                    {option.label}
                  </span>
                  <span className="text-gray-500">{pct}% ({count})</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isMyVote ? 'bg-blue-500' : 'bg-gray-400'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
          <p className="text-xs text-gray-400 pt-0.5">{totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}</p>
        </div>
      ) : (
        // Voting view
        <form onSubmit={handleVote} className="space-y-2">
          <div className="space-y-1">
            {poll.options.map((option) => (
              <label
                key={option.id}
                className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors ${
                  selectedOptionId === option.id
                    ? 'bg-purple-100 text-purple-800'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <input
                  type="radio"
                  name={`poll-${poll.id}`}
                  value={option.id}
                  checked={selectedOptionId === option.id}
                  onChange={() => setSelectedOptionId(option.id)}
                  className="accent-purple-600"
                />
                {option.label}
              </label>
            ))}
          </div>
          {voteError && (
            <p className="text-xs text-red-600">{voteError}</p>
          )}
          <button
            type="submit"
            disabled={!selectedOptionId || isVoting}
            className="flex items-center gap-1.5 rounded-md bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isVoting && <Loader2 className="h-3 w-3 animate-spin" />}
            {isVoting ? 'Submitting...' : 'Vote'}
          </button>
        </form>
      )}
    </div>
  );
}
