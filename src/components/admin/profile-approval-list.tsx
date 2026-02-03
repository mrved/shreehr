'use client';

import { useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

interface Employee {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
}

interface Approver {
  id: string;
  name: string;
}

interface ProfileUpdateRequest {
  id: string;
  employee_id: string;
  changes: Record<string, { old: any; new: any }>;
  reason: string | null;
  status: string;
  created_at: Date;
  employee: Employee;
  approver: Approver | null;
}

interface ProfileApprovalListProps {
  requests: ProfileUpdateRequest[];
  onRequestProcessed: () => void;
}

export function ProfileApprovalList({ requests, onRequestProcessed }: ProfileApprovalListProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectRequestId, setRejectRequestId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleApprove = async (requestId: string) => {
    setProcessingId(requestId);
    setError(null);

    try {
      const response = await fetch(`/api/profile/update-requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'approve',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to approve request');
      }

      onRequestProcessed();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectModal = (requestId: string) => {
    setRejectRequestId(requestId);
    setRejectionReason('');
    setShowRejectModal(true);
    setError(null);
  };

  const handleReject = async () => {
    if (!rejectRequestId || !rejectionReason.trim()) {
      setError('Please provide a rejection reason');
      return;
    }

    setProcessingId(rejectRequestId);
    setError(null);

    try {
      const response = await fetch(`/api/profile/update-requests/${rejectRequestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'reject',
          rejection_reason: rejectionReason,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reject request');
      }

      setShowRejectModal(false);
      setRejectRequestId(null);
      setRejectionReason('');
      onRequestProcessed();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No pending profile update requests</p>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Employee
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Requested Changes
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reason
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {requests.map((request) => (
              <tr key={request.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {request.employee.first_name} {request.employee.last_name}
                  </div>
                  <div className="text-sm text-gray-500">{request.employee.employee_code}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    <ChangesDisplay changes={request.changes} />
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-500 max-w-xs">
                    {request.reason || '-'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(request.created_at).toLocaleDateString('en-IN')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleApprove(request.id)}
                    disabled={processingId === request.id}
                    className="inline-flex items-center gap-1 text-green-600 hover:text-green-900 disabled:text-gray-400 mr-4"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => openRejectModal(request.id)}
                    disabled={processingId === request.id}
                    className="inline-flex items-center gap-1 text-red-600 hover:text-red-900 disabled:text-gray-400"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {requests.map((request) => (
          <div key={request.id} className="bg-white rounded-lg shadow p-4">
            <div className="mb-3">
              <div className="font-medium text-gray-900">
                {request.employee.first_name} {request.employee.last_name}
              </div>
              <div className="text-sm text-gray-500">{request.employee.employee_code}</div>
              <div className="mt-1 text-xs text-gray-500">
                {new Date(request.created_at).toLocaleDateString('en-IN')}
              </div>
            </div>

            <div className="mb-3">
              <div className="text-sm font-medium text-gray-700 mb-1">Changes:</div>
              <ChangesDisplay changes={request.changes} />
            </div>

            {request.reason && (
              <div className="mb-3">
                <div className="text-sm font-medium text-gray-700 mb-1">Reason:</div>
                <div className="text-sm text-gray-600">{request.reason}</div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => handleApprove(request.id)}
                disabled={processingId === request.id}
                className="flex-1 inline-flex justify-center items-center gap-1 px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
              >
                <CheckCircle className="h-4 w-4" />
                Approve
              </button>
              <button
                onClick={() => openRejectModal(request.id)}
                disabled={processingId === request.id}
                className="flex-1 inline-flex justify-center items-center gap-1 px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400"
              >
                <XCircle className="h-4 w-4" />
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Reject Request</h3>
            <div className="mb-4">
              <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Rejection <span className="text-red-500">*</span>
              </label>
              <textarea
                id="rejectionReason"
                rows={4}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Please explain why this request is being rejected..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleReject}
                disabled={processingId !== null || !rejectionReason.trim()}
                className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Confirm Reject
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectRequestId(null);
                  setRejectionReason('');
                  setError(null);
                }}
                disabled={processingId !== null}
                className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ChangesDisplay({ changes }: { changes: Record<string, { old: any; new: any }> }) {
  const fieldLabels: Record<string, string> = {
    address_line1: 'Address Line 1',
    address_line2: 'Address Line 2',
    city: 'City',
    state: 'State',
    postal_code: 'Postal Code',
    emergency_contact: 'Emergency Contact',
    emergency_phone: 'Emergency Phone',
    personal_phone: 'Personal Phone',
    personal_email: 'Personal Email',
  };

  return (
    <div className="space-y-2">
      {Object.entries(changes).map(([field, { old, new: newValue }]) => (
        <div key={field} className="text-sm">
          <div className="font-medium text-gray-700">{fieldLabels[field] || field}:</div>
          <div className="ml-2">
            <div className="text-red-600">
              <span className="font-medium">Old:</span> {old || '(empty)'}
            </div>
            <div className="text-green-600">
              <span className="font-medium">New:</span> {newValue || '(empty)'}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
