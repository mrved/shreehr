import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

interface ProfileUpdateRequest {
  id: string;
  status: string;
  created_at: Date;
}

interface Department {
  id: string;
  name: string;
  code: string;
}

interface Designation {
  id: string;
  title: string;
}

interface ReportingManager {
  id: string;
  first_name: string;
  last_name: string;
  employee_code: string;
}

interface Employee {
  id: string;
  employee_code: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  date_of_birth: Date;
  gender: string;
  marital_status: string;
  blood_group: string | null;
  personal_email: string | null;
  personal_phone: string | null;
  emergency_contact: string | null;
  emergency_phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string;
  pan: string | null;
  aadhaar: string | null;
  bank_name: string | null;
  bank_branch: string | null;
  bank_ifsc: string | null;
  department: Department | null;
  designation: Designation | null;
  reporting_manager: ReportingManager | null;
  date_of_joining: Date;
  employment_type: string;
  employment_status: string;
  uan: string | null;
  esic_number: string | null;
}

interface ProfileViewProps {
  employee: Employee;
  pendingRequest?: ProfileUpdateRequest;
}

export function ProfileView({ employee, pendingRequest }: ProfileViewProps) {
  const fullName = [employee.first_name, employee.middle_name, employee.last_name]
    .filter(Boolean)
    .join(' ');

  const fullAddress = [
    employee.address_line1,
    employee.address_line2,
    employee.city,
    employee.state,
    employee.postal_code,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="space-y-6">
      {/* Pending Request Banner */}
      {pendingRequest && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-yellow-800">Update Request Pending</h3>
            <p className="mt-1 text-sm text-yellow-700">
              Your profile update request submitted on{' '}
              {new Date(pendingRequest.created_at).toLocaleDateString('en-IN')} is awaiting
              approval.
            </p>
          </div>
        </div>
      )}

      {/* Action Button */}
      <div className="flex justify-end">
        <Link
          href="/employee/profile/edit"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Edit Profile
        </Link>
      </div>

      {/* Profile Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Information */}
        <Section title="Personal Information">
          <InfoRow label="Full Name" value={fullName} />
          <InfoRow
            label="Date of Birth"
            value={new Date(employee.date_of_birth).toLocaleDateString('en-IN')}
          />
          <InfoRow label="Gender" value={employee.gender} />
          <InfoRow label="Marital Status" value={employee.marital_status} />
          {employee.blood_group && <InfoRow label="Blood Group" value={employee.blood_group} />}
        </Section>

        {/* Contact Information */}
        <Section title="Contact Information">
          <InfoRow label="Personal Email" value={employee.personal_email || '-'} />
          <InfoRow label="Personal Phone" value={employee.personal_phone || '-'} />
          <InfoRow label="Emergency Contact" value={employee.emergency_contact || '-'} />
          <InfoRow label="Emergency Phone" value={employee.emergency_phone || '-'} />
        </Section>

        {/* Address */}
        <Section title="Address">
          <InfoRow label="Full Address" value={fullAddress || '-'} />
          <InfoRow label="Country" value={employee.country} />
        </Section>

        {/* Employment Details */}
        <Section title="Employment Details">
          <InfoRow label="Employee Code" value={employee.employee_code} />
          <InfoRow label="Department" value={employee.department?.name || '-'} />
          <InfoRow label="Designation" value={employee.designation?.title || '-'} />
          <InfoRow
            label="Date of Joining"
            value={new Date(employee.date_of_joining).toLocaleDateString('en-IN')}
          />
          <InfoRow label="Employment Type" value={employee.employment_type} />
          <InfoRow label="Status" value={employee.employment_status} />
          {employee.reporting_manager && (
            <InfoRow
              label="Reporting Manager"
              value={`${employee.reporting_manager.first_name} ${employee.reporting_manager.last_name} (${employee.reporting_manager.employee_code})`}
            />
          )}
        </Section>

        {/* Statutory Information */}
        <Section title="Statutory Information">
          <InfoRow label="PAN" value={employee.pan || '-'} />
          <InfoRow label="Aadhaar" value={employee.aadhaar || '-'} />
          <InfoRow label="UAN" value={employee.uan || '-'} />
          <InfoRow label="ESIC Number" value={employee.esic_number || '-'} />
        </Section>

        {/* Bank Details */}
        <Section title="Bank Details">
          <InfoRow label="Bank Name" value={employee.bank_name || '-'} />
          <InfoRow label="Branch" value={employee.bank_branch || '-'} />
          <InfoRow label="IFSC Code" value={employee.bank_ifsc || '-'} />
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
      <dl className="space-y-3">{children}</dl>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900 sm:text-right">{value}</dd>
    </div>
  );
}
