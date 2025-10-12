import { ExitStatus } from 'enums/exitStatus.enum.js';
import type { Server } from 'node:http';
import type { Sql } from 'postgres';

type ExitFunction = (code: number, reason: string) => (err: Error | null, promise?: Promise<any>) => void;

// Define the terminate function
export default (
  server: Server,
  sql: Sql,
  options: { coredump: boolean; timeout: number } = {
    coredump: false,
    timeout: 500
  }
): ExitFunction => {
  // Exit function
  const exit = async (code: number): Promise<void> => {
    try {
      await sql.end({ timeout: options.timeout / 1000 }); // Ensure cleanup with sql.end()
      console.log('PostgreSQL client disconnected.');
    } catch (err) {
      console.error('Error during PostgreSQL disconnection:', err);
      code = ExitStatus.Failure;
    } finally {
      if (options.coredump) {
        console.log('Aborting proccess.');
        process.abort();
      } else {
        console.log('Exiting proccess with the code: ', code);
        process.exit(code);
      }
    }
  };

  return (code: number, reason: string) =>
    (err: Error | null, promise?: Promise<any>): void => {
      if (err != null && err instanceof Error) {
        // Log error information, use a proper logging library here :)
        console.log(err.message, err.stack);
      }

      // Attempt a graceful shutdown
      server.close((err) => {
        if (err != null) {
          console.error('Error during server close:', err);
        }
        void exit(code); // Ensure exit is handled as a promise
      });
      setTimeout(() => {
        void exit(code);
      }, options.timeout).unref(); // Ensure exit is handled as a promise
    };
};
