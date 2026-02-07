import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Sets up test data in the database
 * This should be run before running the E2E tests
 */
export async function setupTestData() {
  console.log('Setting up test data...');
  
  try {
    // Run database seeds for test users
    await execAsync('pnpm db:seed-test', { cwd: process.cwd() });
    console.log('Test data setup completed successfully');
  } catch (error) {
    console.error('Failed to setup test data:', error);
    throw error;
  }
}

/**
 * Cleans up test data after tests
 */
export async function cleanupTestData() {
  console.log('Cleaning up test data...');
  // Implement cleanup logic if needed
  // This could involve running a cleanup script or 
  // resetting the database to a known state
}

/**
 * Waits for the application to be ready
 */
export async function waitForApp(url: string = 'http://localhost:3000', timeout: number = 30000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        console.log('Application is ready');
        return;
      }
    } catch (error) {
      // App not ready yet, continue waiting
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  throw new Error(`Application did not become ready within ${timeout}ms`);
}