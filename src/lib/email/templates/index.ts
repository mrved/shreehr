/**
 * Email templates index
 * Export all templates and provide dynamic lookup
 */

import { payslipNotificationTemplate } from './payslip-notification';

// Re-export all templates
export { payslipNotificationTemplate };

/**
 * Email template function type
 */
type TemplateFunction = (data: any) => {
  subject: string;
  html: string;
  text: string;
};

/**
 * Template registry
 */
const templates: Record<string, TemplateFunction> = {
  'payslip-notification': payslipNotificationTemplate,
};

/**
 * Get a template by name
 *
 * @param name Template name
 * @param data Template data
 * @returns Email template with subject, html, and text
 * @throws Error if template not found
 */
export function getTemplate(name: string, data: any) {
  const templateFn = templates[name];

  if (!templateFn) {
    throw new Error(`Email template not found: ${name}`);
  }

  return templateFn(data);
}
