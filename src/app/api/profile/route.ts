import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { decrypt, maskPAN, maskAadhaar } from "@/lib/encryption";

// GET /api/profile - Return current employee profile
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Employees can only view their own profile
  if (!session.user.employeeId) {
    return NextResponse.json({ error: "No employee record linked to this user" }, { status: 404 });
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
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Decrypt and mask PII for display
    let maskedPan: string | null = null;
    let maskedAadhaar: string | null = null;

    try {
      if (employee.pan_encrypted) {
        const decryptedPan = decrypt(employee.pan_encrypted);
        maskedPan = maskPAN(decryptedPan);
      }
    } catch {
      maskedPan = "******ERROR";
    }

    try {
      if (employee.aadhaar_encrypted) {
        const decryptedAadhaar = decrypt(employee.aadhaar_encrypted);
        maskedAadhaar = maskAadhaar(decryptedAadhaar);
      }
    } catch {
      maskedAadhaar = "XXXX XXXX ERROR";
    }

    // Remove encrypted fields and add masked versions
    const { pan_encrypted, aadhaar_encrypted, ...baseProfile } = employee;
    const profileData = {
      ...baseProfile,
      pan: maskedPan,
      aadhaar: maskedAadhaar,
    };

    return NextResponse.json(profileData);
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}
