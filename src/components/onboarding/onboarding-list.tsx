"use client";

import { Eye } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface OnboardingRecord {
  id: string;
  candidate_name: string;
  position: string;
  department: {
    name: string;
  };
  joining_date: string;
  status: "PENDING" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  checklist: any[];
}

interface OnboardingListProps {
  records: OnboardingRecord[];
}

const statusColors = {
  PENDING: "bg-yellow-100 text-yellow-800",
  ACCEPTED: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-purple-100 text-purple-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export function OnboardingList({ records }: OnboardingListProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredRecords =
    statusFilter === "all" ? records : records.filter((r) => r.status === statusFilter);

  const calculateProgress = (checklist: any[]) => {
    if (!Array.isArray(checklist) || checklist.length === 0) return 0;
    const completed = checklist.filter((item) => item?.completed === true).length;
    return Math.round((completed / checklist.length) * 100);
  };

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="w-full sm:w-64">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="ACCEPTED">Accepted</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Candidate Name</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Joining Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRecords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                  No onboarding records found
                </TableCell>
              </TableRow>
            ) : (
              filteredRecords.map((record) => {
                const progress = calculateProgress(record.checklist);
                return (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.candidate_name}</TableCell>
                    <TableCell>{record.position}</TableCell>
                    <TableCell>{record.department.name}</TableCell>
                    <TableCell>
                      {new Date(record.joining_date).toLocaleDateString("en-IN")}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[record.status]}>{record.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={progress} className="w-24" />
                        <span className="text-sm text-gray-600">{progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link href={`/onboarding/${record.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredRecords.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-gray-500">
              No onboarding records found
            </CardContent>
          </Card>
        ) : (
          filteredRecords.map((record) => {
            const progress = calculateProgress(record.checklist);
            return (
              <Card key={record.id}>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{record.candidate_name}</h3>
                        <p className="text-sm text-gray-600">{record.position}</p>
                      </div>
                      <Badge className={statusColors[record.status]}>{record.status}</Badge>
                    </div>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Department:</span>
                        <span>{record.department.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Joining Date:</span>
                        <span>{new Date(record.joining_date).toLocaleDateString("en-IN")}</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-500">Progress</span>
                        <span className="text-sm font-medium">{progress}%</span>
                      </div>
                      <Progress value={progress} />
                    </div>
                    <Link href={`/onboarding/${record.id}`} className="block">
                      <Button variant="outline" className="w-full">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
