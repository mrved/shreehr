import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { encrypt, decrypt, maskPAN, maskAadhaar, maskBankAccount } from '@/lib/encryption';
import { employeeUpdateSchema } from '@/lib/validations/employee';
import { ZodError } from 'zod';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  // Access control: employees can only view their own data
  if (session.user.role === 'EMPLOYEE' && session.user.employeeId !== id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        department: true,
        designation: true,
        reporting_manager: { select: { id: true, first_name: true, last_name: true } },
        subordinates: { select: { id: true, first_name: true, last_name: true, employee_code: true } },
      },
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Build response with masked or decrypted PII based on role
    const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'].includes(session.user.role);

    const response: any = {
      ...employee,
      // Show masked values to all users
      pan_encrypted: employee.pan_encrypted
        ? isAdmin
          ? maskPAN(decrypt(employee.pan_encrypted))
          : maskPAN('MASKED')
        : null,
      aadhaar_encrypted: employee.aadhaar_encrypted
        ? isAdmin
          ? maskAadhaar(decrypt(employee.aadhaar_encrypted))
          : maskAadhaar('MASKED')
        : null,
      bank_account_encrypted: employee.bank_account_encrypted
        ? isAdmin
          ? maskBankAccount(decrypt(employee.bank_account_encrypted))
          : maskBankAccount('MASKED')
        : null,
    };

    // Include full decrypted values only for admins (for editing)
    if (isAdmin) {
      response._sensitive = {
        panNumber: employee.pan_encrypted ? decrypt(employee.pan_encrypted) : null,
        aadhaarNumber: employee.aadhaar_encrypted ? decrypt(employee.aadhaar_encrypted) : null,
        bankAccountNumber: employee.bank_account_encrypted ? decrypt(employee.bank_account_encrypted) : null,
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Employee fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch employee' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'HR_MANAGER')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const validated = employeeUpdateSchema.parse(body);

    // Build update object with snake_case field names
    const updateData: any = {
      updated_by: session.user.id,
    };

    // Map camelCase to snake_case and handle encryption
    if (validated.firstName !== undefined) updateData.first_name = validated.firstName;
    if (validated.middleName !== undefined) updateData.middle_name = validated.middleName;
    if (validated.lastName !== undefined) updateData.last_name = validated.lastName;
    if (validated.dateOfBirth !== undefined) updateData.date_of_birth = validated.dateOfBirth;
    if (validated.gender !== undefined) updateData.gender = validated.gender;
    if (validated.maritalStatus !== undefined) updateData.marital_status = validated.maritalStatus;
    if (validated.bloodGroup !== undefined) updateData.blood_group = validated.bloodGroup;
    if (validated.personalEmail !== undefined) updateData.personal_email = validated.personalEmail;
    if (validated.personalPhone !== undefined) updateData.personal_phone = validated.personalPhone;
    if (validated.emergencyContact !== undefined) updateData.emergency_contact = validated.emergencyContact;
    if (validated.emergencyPhone !== undefined) updateData.emergency_phone = validated.emergencyPhone;
    if (validated.addressLine1 !== undefined) updateData.address_line1 = validated.addressLine1;
    if (validated.addressLine2 !== undefined) updateData.address_line2 = validated.addressLine2;
    if (validated.city !== undefined) updateData.city = validated.city;
    if (validated.state !== undefined) updateData.state = validated.state;
    if (validated.postalCode !== undefined) updateData.postal_code = validated.postalCode;
    if (validated.country !== undefined) updateData.country = validated.country;
    if (validated.dateOfJoining !== undefined) updateData.date_of_joining = validated.dateOfJoining;
    if (validated.dateOfLeaving !== undefined) updateData.date_of_leaving = validated.dateOfLeaving;
    if (validated.employmentType !== undefined) updateData.employment_type = validated.employmentType;
    if (validated.employmentStatus !== undefined) updateData.employment_status = validated.employmentStatus;
    if (validated.departmentId !== undefined) updateData.department_id = validated.departmentId;
    if (validated.designationId !== undefined) updateData.designation_id = validated.designationId;
    if (validated.reportingManagerId !== undefined) updateData.reporting_manager_id = validated.reportingManagerId;
    if (validated.bankName !== undefined) updateData.bank_name = validated.bankName;
    if (validated.bankBranch !== undefined) updateData.bank_branch = validated.bankBranch;
    if (validated.bankIfscCode !== undefined) updateData.bank_ifsc = validated.bankIfscCode;
    if (validated.uan !== undefined) updateData.uan = validated.uan;
    if (validated.esicNumber !== undefined) updateData.esic_number = validated.esicNumber;
    if (validated.previousEmployerName !== undefined) updateData.previous_employer_name = validated.previousEmployerName;
    if (validated.previousEmployerUan !== undefined) updateData.previous_employer_uan = validated.previousEmployerUan;

    // Encrypt sensitive fields if provided
    if (validated.panNumber !== undefined) {
      updateData.pan_encrypted = validated.panNumber ? encrypt(validated.panNumber) : null;
    }
    if (validated.aadhaarNumber !== undefined) {
      updateData.aadhaar_encrypted = validated.aadhaarNumber ? encrypt(validated.aadhaarNumber) : null;
    }
    if (validated.bankAccountNumber !== undefined) {
      updateData.bank_account_encrypted = validated.bankAccountNumber ? encrypt(validated.bankAccountNumber) : null;
    }

    const employee = await prisma.employee.update({
      where: { id },
      data: updateData,
      include: {
        department: { select: { id: true, name: true } },
        designation: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json(employee);
  } catch (error) {
    console.error('Employee update error:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Soft delete - set status to TERMINATED
    await prisma.employee.update({
      where: { id },
      data: {
        employment_status: 'TERMINATED',
        date_of_leaving: new Date(),
        updated_by: session.user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Employee delete error:', error);

    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Failed to terminate employee' }, { status: 500 });
  }
}
