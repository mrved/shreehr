import { paiseToRupees } from "@/lib/payroll/types";

/**
 * Format currency for display on payslip
 */
export function formatCurrencyPDF(paise: number): string {
  const rupees = paiseToRupees(paise);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rupees);
}

/**
 * Format number with Indian numbering system
 */
export function formatNumberINR(num: number): string {
  return new Intl.NumberFormat("en-IN").format(num);
}

/**
 * Mask PAN for display (show only last 4)
 */
export function maskPAN(pan: string | null): string {
  if (!pan || pan.length < 4) return "N/A";
  return "XXXXXX" + pan.slice(-4);
}

/**
 * Mask Aadhaar for display (show only last 4)
 */
export function maskAadhaar(aadhaar: string | null): string {
  if (!aadhaar || aadhaar.length < 4) return "N/A";
  return "XXXX-XXXX-" + aadhaar.slice(-4);
}

/**
 * Get month name from number
 */
export function getMonthName(month: number): string {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return months[month - 1] || "Unknown";
}

/**
 * Convert number to words (for net pay in words)
 */
export function numberToWords(num: number): string {
  if (num === 0) return "Zero";

  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  function convertLessThanThousand(n: number): string {
    if (n === 0) return "";
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
    return (
      ones[Math.floor(n / 100)] +
      " Hundred" +
      (n % 100 ? " " + convertLessThanThousand(n % 100) : "")
    );
  }

  // Indian numbering: Lakh (1,00,000) and Crore (1,00,00,000)
  if (num >= 10000000) {
    return (
      convertLessThanThousand(Math.floor(num / 10000000)) +
      " Crore " +
      numberToWords(num % 10000000)
    );
  }
  if (num >= 100000) {
    return (
      convertLessThanThousand(Math.floor(num / 100000)) + " Lakh " + numberToWords(num % 100000)
    );
  }
  if (num >= 1000) {
    return (
      convertLessThanThousand(Math.floor(num / 1000)) + " Thousand " + numberToWords(num % 1000)
    );
  }

  return convertLessThanThousand(num);
}

/**
 * Format net pay in words
 */
export function formatNetPayInWords(paise: number): string {
  const rupees = Math.round(paiseToRupees(paise));
  return "Rupees " + numberToWords(rupees) + " Only";
}
