import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/profile - Return current employee profile
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Employees can only view their own profile
  if (!session.user.employeeId) {
    return NextResponse.json({ error: 'No employee record linked to this user' }, { status: 404 });
  }

  try {
    const employee = await prisma.employee.findUnique({
      where: { id: session.user.employeeId },
      select: {
        id: true,
        employee_code: true,
        first_name: true,
        middle_name: true,
        last_name: true,
        date_of_birth: true,
        gender: true,
        marital_status: true,
        blood_group: true,
        personal_email: true,
        personal_phone: true,
        emergency_contact: true,
        emergency_phone: true,
        address_line1: true,
        address_line2: true,
        city: true,
        state: true,
        postal_code: true,
        country: true,
        // PII fields - encrypted (will mask)
        pan_encrypted: true,
        aadhaar_encrypted: true,
        // Bank details (non-PII)
        bank_name: true,
        bank_branch: true,
        bank_ifsc: true,
        // Employment details
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        designation: {
          select: {
            id: true,
            title: true,
          },
        },
        reporting_manager: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            employee_code: true,
          },
        },
        date_of_joining: true,
        employment_type: true,
        employment_status: true,
        // Statutory
        uan: true,
        esic_number: true,
      },
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Mask PII (show only last 4 characters)
    const maskedProfile = {
      ...employee,
      pan: employee.pan_encrypted
        ? `******${employee.pan_encrypted.slice(-4)}`
        : null,
      aadhaar: employee.aadhaar_encrypted
        ? `********${employee.aadhaar_encrypted.slice(-4)}`
        : null,
    };

    // Remove encrypted fields from response
    const { pan_encrypted, aadhaar_encrypted, ...profileData } = maskedProfile;

    return NextResponse.json(profileData);
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}
