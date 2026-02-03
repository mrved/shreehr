"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { useState } from "react";

interface ChecklistItem {
  id: string;
  category: "IT" | "Admin" | "Manager" | "HR";
  title: string;
  assignee: string;
  due_date: string;
  required: boolean;
  completed: boolean;
  completed_at?: string;
  completed_by_name?: string;
}

interface ChecklistManagerProps {
  onboardingId: string;
  checklist: ChecklistItem[];
  status: string;
}

const categoryColors = {
  IT: "bg-blue-100 text-blue-800",
  Admin: "bg-green-100 text-green-800",
  Manager: "bg-purple-100 text-purple-800",
  HR: "bg-orange-100 text-orange-800",
};

export function ChecklistManager({ onboardingId, checklist, status }: ChecklistManagerProps) {
  const { toast } = useToast();
  const [items, setItems] = useState(checklist);
  const [updating, setUpdating] = useState<string | null>(null);

  const completedCount = items.filter((item) => item.completed).length;
  const progress = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  const handleToggleComplete = async (itemId: string, currentStatus: boolean) => {
    setUpdating(itemId);

    try {
      const response = await fetch(`/api/onboarding/${onboardingId}/checklist`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_id: itemId,
          completed: !currentStatus,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update checklist");
      }

      const updatedItem = await response.json();

      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                completed: updatedItem.completed,
                completed_at: updatedItem.completed_at,
                completed_by_name: updatedItem.completed_by_name,
              }
            : item,
        ),
      );

      toast({
        title: updatedItem.completed ? "Item marked complete" : "Item marked incomplete",
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  // Group by category
  const groupedItems = items.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, ChecklistItem[]>,
  );

  const canEdit = status !== "COMPLETED" && status !== "CANCELLED";

  return (
    <div className="space-y-6">
      {/* Progress Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Overall Progress</h3>
              <span className="text-sm text-gray-600">
                {completedCount} of {items.length} completed
              </span>
            </div>
            <Progress value={progress} className="h-3" />
            <p className="text-sm text-gray-500">{progress}% complete</p>
          </div>
        </CardContent>
      </Card>

      {/* Checklist Items by Category */}
      {Object.entries(groupedItems).map(([category, categoryItems]) => (
        <Card key={category}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{category}</CardTitle>
              <Badge className={categoryColors[category as keyof typeof categoryColors]}>
                {categoryItems.filter((i) => i.completed).length}/{categoryItems.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {categoryItems.map((item) => (
              <div
                key={item.id}
                className={`border rounded-lg p-4 ${item.completed ? "bg-gray-50" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => handleToggleComplete(item.id, item.completed)}
                    disabled={!canEdit || updating === item.id}
                    className={`flex-shrink-0 mt-0.5 ${!canEdit ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                  >
                    {updating === item.id ? (
                      <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                    ) : item.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-gray-400" />
                    )}
                  </button>

                  <div className="flex-1 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div>
                        <h4
                          className={`font-medium ${item.completed ? "text-gray-500 line-through" : ""}`}
                        >
                          {item.title}
                          {item.required && (
                            <span className="ml-2 text-xs text-red-600">*Required</span>
                          )}
                        </h4>
                        <p className="text-sm text-gray-500">Assignee: {item.assignee}</p>
                      </div>
                      <div className="text-sm text-gray-500">
                        Due: {new Date(item.due_date).toLocaleDateString("en-IN")}
                      </div>
                    </div>

                    {item.completed && item.completed_at && (
                      <div className="text-sm text-gray-500">
                        Completed on {new Date(item.completed_at).toLocaleDateString("en-IN")}
                        {item.completed_by_name && ` by ${item.completed_by_name}`}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {!canEdit && (
        <p className="text-sm text-gray-500 italic text-center">
          Checklist is read-only (onboarding {status.toLowerCase()})
        </p>
      )}
    </div>
  );
}
