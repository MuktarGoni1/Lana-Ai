// Deno namespace for Supabase Edge Functions
interface Deno {
  env: {
    get(key: string): string | undefined;
  };
}

declare const Deno: Deno;

// Type definitions for Supabase Edge Functions imports
interface Serve {
  (handler: (req: Request) => Response | Promise<Response>): void;
}

// Type definitions for Supabase client
interface SupabaseClient {
  from(table: string): any;
  select(columns?: string): any;
  eq(column: string, value: any): any;
  gte(column: string, value: any): any;
  lte(column: string, value: any): any;
  order(column: string, options?: { ascending?: boolean }): any;
  insert(data: any): any;
  update(data: any): any;
  single<T = any>(): Promise<{ data: T | null; error: any }>;
}

// Module declarations
declare module "https://deno.land/std@0.177.0/http/server.ts" {
  export const serve: Serve;
}

declare module "std/http/server.ts" {
  export const serve: Serve;
}

declare module "https://esm.sh/@supabase/supabase-js@2.41.0" {
  export function createClient(supabaseUrl: string, supabaseKey: string, options?: any): SupabaseClient;
}

declare module "@supabase/supabase-js" {
  export function createClient(supabaseUrl: string, supabaseKey: string, options?: any): SupabaseClient;
}

// For Supabase Edge Functions, the Deno global is available
// This declaration helps TypeScript recognize Deno globals