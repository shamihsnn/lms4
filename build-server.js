#!/usr/bin/env node
import { build } from 'esbuild';
import { mkdir } from 'fs/promises';
import { dirname } from 'path';

const serverFiles = [
  { input: 'server/routes.ts', output: 'dist/server/routes.js' },
  { input: 'server/supabase-storage.ts', output: 'dist/server/supabase-storage.js' },
  { input: 'server/index.ts', output: 'dist/server/index.js' },
  { input: 'server/database.ts', output: 'dist/server/database.js' },
  { input: 'server/storage.ts', output: 'dist/server/storage.js' }
];

async function buildServer() {
  console.log('Building server files for Vercel...');
  
  // Ensure output directory exists
  await mkdir('dist/server', { recursive: true });
  
  const buildPromises = serverFiles.map(async ({ input, output }) => {
    try {
      console.log(`Building ${input} -> ${output}`);
      await build({
        entryPoints: [input],
        bundle: true,
        platform: 'node',
        format: 'esm',
        outfile: output,
        packages: 'external',
        external: [
          'pg-native',
          '@supabase/supabase-js',
          'bcryptjs',
          'express',
          'express-session',
          'connect-pg-simple',
          'drizzle-orm',
          'postgres'
        ],
        target: 'node18',
        sourcemap: false,
        minify: false,
        keepNames: true
      });
      console.log(`✅ Built ${input}`);
    } catch (error) {
      console.error(`❌ Failed to build ${input}:`, error);
      throw error;
    }
  });
  
  await Promise.all(buildPromises);
  console.log('✅ All server files built successfully!');
}

buildServer().catch(error => {
  console.error('Build failed:', error);
  process.exit(1);
});
