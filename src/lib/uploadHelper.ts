// src/lib/uploadHelper.ts
import { writeFile } from 'fs/promises';
import { join } from 'path';
import fs from 'fs'; // 💡 FIX 1: Import core 'fs' module using ES Module syntax

export const uploadFile = async (file: File | undefined, prefix: string): Promise<string | undefined> => {
  if (!file || file.size === 0) return undefined;

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Sanitize the filename to prevent path traversal issues
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '');
  const filename = `${Date.now()}-${prefix}-${sanitizedFileName}`;
  const uploadDir = join(process.cwd(), 'public/uploads');
  const path = join(uploadDir, filename);
  
  // Ensure the upload directory exists
  // 💡 FIX 2: Use the imported 'fs' variable instead of the forbidden require()
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  await writeFile(path, buffer);
  return `/uploads/${filename}`;
};