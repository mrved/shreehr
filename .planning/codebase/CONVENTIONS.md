# Coding Conventions

**Analysis Date:** 2026-02-08

## Naming Patterns

**Files:**
- Components: kebab-case (e.g., `message-input.tsx`, `profile-edit-form.tsx`)
- Libraries/utilities: kebab-case or camelCase (e.g., `encryption.ts`, `model-client.ts`)
- API routes: kebab-case directory names with `route.ts` (e.g., `/api/attendance/check-in/route.ts`)
- Validation schemas: camelCase with `schema` suffix (e.g., `profileEditSchema`, `employeeCreateSchema`)
- Types: PascalCase for interfaces and types (e.g., `ProfileEditFormProps`, `TestUser`)
- Test files: source filename + `.test.ts` (e.g., `encryption.test.ts`, `pf.test.ts`)
- Page objects in E2E: PascalCase with `.page.ts` suffix (e.g., `LoginPage`, `NavigationPage`)

**Functions:**
- Utility/exported functions: camelCase (e.g., `calculatePF`, `encrypt`, `maskAadhaar`)
- React component functions: PascalCase (e.g., `ProfileEditForm`, `MessageInput`)
- Event handlers: camelCase with `handle` prefix (e.g., `handleSubmit`, `handleKeyDown`)
- Getter functions: camelCase with `get` prefix (e.g., `getEncryptionKey`, `getToolContext`)
- Custom hooks: camelCase with `use` prefix (e.g., `useToast`)

**Variables:**
- State variables: camelCase (e.g., `isSubmitting`, `isLoading`, `changedFields`)
- Constants: UPPER_SNAKE_CASE (e.g., `ALGORITHM`, `PF_WAGE_CEILING_PAISE`, `EPS_MAX_MONTHLY_PAISE`)
- Boolean variables: prefix with `is`, `has`, `should`, `can` (e.g., `isLoading`, `hasAccess`, `shouldRender`)
- Database/model fields: snake_case (e.g., `first_name`, `employment_status`, `pan_encrypted`)

**Types:**
- Interfaces: PascalCase with descriptive suffix (e.g., `ProfileEditFormProps`, `TestUser`, `EmployerPFBreakdown`)
- Type aliases: PascalCase (e.g., `UserRole`, `ProfileEditFormData`)
- Enum values: UPPER_SNAKE_CASE (e.g., `FULL_TIME`, `PART_TIME`, `MALE`, `FEMALE`)
- Generic parameters: single letter or descriptive PascalCase (e.g., `T extends AuditFields`)

## Code Style

**Formatting:**
- Tool: Biome (`@biomejs/biome` v2.3.14)
- Indent: 2 spaces
- Line width: 100 characters
- Quote style: double quotes (`"`)
- Semicolons: always required

**Linting:**
- Tool: Biome (linter enabled with recommended rules)
- Strict TypeScript enabled (`strict: true`)
- `noExplicitAny`: warn (not enforced strictly)
- `noUnknownAtRules`: off
- Target: ES2017

**Command:**
```bash
pnpm lint              # Check and fix issues
pnpm lint:check        # Check without fixing
pnpm format            # Format code
```

## Import Organization

**Order:**
1. Node.js built-in modules (e.g., `import { createCipheriv } from "node:crypto"`)
2. Third-party dependencies (e.g., `import { z } from "zod"`, `import { useState } from "react"`)
3. Local aliases and imports (e.g., `import { auth } from "@/lib/auth"`)

**Path Aliases:**
- `@/*` → `./src/*` (configured in `tsconfig.json`)
- Example: `import { encrypt } from "@/lib/encryption"`

**Barrel Files:**
- Used selectively for re-exporting (e.g., `src/types/index.ts` re-exports Prisma types)
- Not used everywhere; prefer direct imports for clarity

## Error Handling

**Patterns:**
- Try-catch blocks for async operations in API routes (e.g., in `src/app/api/employees/route.ts`)
- Return `NextResponse.json()` with error status codes (401, 400, 500)
- Throw errors in utility functions and catch at higher level:
  ```typescript
  // In encryption.ts
  if (!key) {
    throw new Error("ENCRYPTION_KEY environment variable is not set");
  }
  ```
- Validation errors use Zod schema validation with resolver:
  ```typescript
  const { formState: { errors } } = useForm({
    resolver: zodResolver(profileEditSchema),
  });
  ```
- Database operations fail with exceptions that are caught in try-catch

## Logging

**Framework:** `console` methods (console.log, console.error)

**Patterns:**
- Use `console.error()` for errors
- Use `console.log()` for general information
- Use `[Toast Error]` and `[Toast]` prefixes in toast notifications
- E2E tests log discovered elements with `console.log()`
- Custom `logError` function available in `@/lib/error-logger`

**Where to Log:**
- API routes: errors and important operations
- Client-side: limited use, prefer error boundaries
- E2E tests: debug output for element discovery

## Comments

**When to Comment:**
- JSDoc/TSDoc for all exported functions and public interfaces
- Explain complex algorithms (e.g., PF calculation breakdown)
- Explain "why" not "what" (code should be self-documenting for "what")
- Mark TODOs with plan references (e.g., `// TODO: Move to database settings in Phase 4`)

**JSDoc/TSDoc:**
- Used extensively for library functions:
  ```typescript
  /**
   * Encrypts a plaintext string using AES-256-GCM
   * Returns base64-encoded string: salt + iv + auth_tag + encrypted_data
   *
   * @param plaintext - The sensitive data to encrypt
   * @returns Base64-encoded encrypted string
   */
  export function encrypt(plaintext: string): string { ... }
  ```
- Used for type definitions and interfaces
- Optional for component props (interfaces are self-documenting)

## Function Design

**Size:**
- Keep functions focused on single responsibility
- Utility functions typically 20-50 lines
- Component functions typically 50-150 lines
- API route handlers typically 60-120 lines (including validation and response)

**Parameters:**
- Prefer object parameters for functions with multiple arguments:
  ```typescript
  export function calculateEMI(params: {
    principalPaise: number;
    annualInterestRate: number;
    tenureMonths: number;
  }): number { ... }
  ```
- React component props as single object parameter (Props interface)

**Return Values:**
- Utility functions return typed values (not `any`)
- Async functions return `Promise<T>`
- API handlers return `NextResponse.json()` with proper status codes
- Components return JSX.Element

## Module Design

**Exports:**
- Export only public APIs
- Use named exports for utilities and types
- Use default export for React components
- Example:
  ```typescript
  // utils.ts
  export function calculatePF(basicSalaryPaise: number): PFCalculationResult { ... }
  export interface PFCalculationResult { ... }

  // component.tsx
  export function MyComponent() { return <div /> }
  ```

**Barrel Files:**
- `src/types/index.ts` re-exports Prisma types and custom type utilities
- `src/components/ui/` folder uses barrel exports
- Not required for every directory

**Organization by Feature:**
- Group related code in directories (e.g., `/components/employee/`, `/lib/statutory/`, `/lib/ai/`)
- Place tests adjacent to source files (e.g., `encryption.ts` and `encryption.test.ts`)
- Place validation schemas in dedicated `lib/validations/` directory

---

*Convention analysis: 2026-02-08*
