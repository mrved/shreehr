'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

const CATEGORIES = ['LEAVE', 'PAYROLL', 'ATTENDANCE', 'EXPENSE', 'GENERAL'];

export default function NewPolicyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'GENERAL',
    content: '',
    visibleToRoles: [] as string[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create policy');
      }

      router.push('/dashboard/policies');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-3xl">
      <div className="mb-6">
        <Link href="/dashboard/policies" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Policies
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">Add Policy Document</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            placeholder="e.g., Leave Policy"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Description (optional)</label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            placeholder="Brief description of this policy"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Category</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Content</label>
          <p className="text-xs text-muted-foreground">
            Use Markdown formatting. Headings (## Section) help with document chunking.
          </p>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            required
            rows={15}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-mono"
            placeholder="# Leave Policy

## Casual Leave
Employees are entitled to 12 days of casual leave per year...

## Sick Leave
Employees are entitled to 6 days of sick leave per year..."
          />
        </div>

        <div className="flex justify-end gap-3">
          <Link href="/dashboard/policies">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Policy
          </Button>
        </div>
      </form>
    </div>
  );
}
