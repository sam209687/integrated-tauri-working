// Test script to verify printer cut functionality
// Run this with: npx tsx testPrinterCut.ts
// Or create an API endpoint and call it

import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

async function testPrinterCut() {
  console.log('🧪 Testing Rugtek POS Printer Cut Commands...\n');

  const tests = [
    {
      name: 'Test 1: Full Cut (GS V 0)',
      command: Buffer.from([0x1D, 0x56, 0x00]),
      description: 'Standard full cut - 0x1D, 0x56, 0x00'
    },
    {
      name: 'Test 2: Partial Cut (GS V 1)',
      command: Buffer.from([0x1D, 0x56, 0x01]),
      description: 'Standard partial cut - 0x1D, 0x56, 0x01'
    },
    {
      name: 'Test 3: Full Cut with Feed (GS V 65)',
      command: Buffer.from([0x1D, 0x56, 0x41, 0x03]),
      description: 'Full cut with 3mm feed - 0x1D, 0x56, 0x41, 0x03'
    },
    {
      name: 'Test 4: Partial Cut with Feed (GS V 66)',
      command: Buffer.from([0x1D, 0x56, 0x42, 0x03]),
      description: 'Partial cut with 3mm feed - 0x1D, 0x56, 0x42, 0x03'
    },
    {
      name: 'Test 5: ESC i (Full Cut)',
      command: Buffer.from([0x1B, 0x69]),
      description: 'Alternative full cut - 0x1B, 0x69'
    },
    {
      name: 'Test 6: ESC m (Partial Cut)',
      command: Buffer.from([0x1B, 0x6D]),
      description: 'Alternative partial cut - 0x1B, 0x6D'
    },
    {
      name: 'Test 7: Multiple Newlines + Full Cut',
      command: Buffer.concat([
        Buffer.from('\n\n\n\n\n\n'),
        Buffer.from([0x1D, 0x56, 0x00])
      ]),
      description: 'Six newlines followed by full cut'
    },
  ];

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    console.log(`\n📄 ${test.name}`);
    console.log(`   ${test.description}`);
    
    try {
      // Create test content
      const ESC = '\x1B';
      const GS = '\x1D';
      const INIT = ESC + '@';
      const ALIGN_CENTER = ESC + 'a' + '\x01';
      const BOLD_ON = ESC + 'E' + '\x01';
      const BOLD_OFF = ESC + 'E' + '\x00';
      
      let content = INIT;
      content += ALIGN_CENTER;
      content += BOLD_ON;
      content += `CUT TEST ${i + 1}\n`;
      content += BOLD_OFF;
      content += test.description + '\n';
      content += '\n';
      content += 'If this paper cuts, the command works!\n';
      content += '\n\n\n';
      
      // Add test command
      const buffer = Buffer.concat([
        Buffer.from(content, 'binary'),
        test.command
      ]);
      
      // Write to temp file
      const tempFile = path.join(os.tmpdir(), `cut-test-${i + 1}.bin`);
      await fs.writeFile(tempFile, buffer);
      
      // Print
      await new Promise((resolve, reject) => {
        exec(`lp -d RugtekPOS "${tempFile}"`, (error, stdout, stderr) => {
          if (error) {
            console.log(`   ❌ Failed: ${error.message}`);
            reject(error);
            return;
          }
          console.log(`   ✅ Sent to printer`);
          resolve(stdout);
        });
      });
      
      // Cleanup
      await fs.unlink(tempFile);
      
      // Wait between tests
      console.log(`   ⏳ Waiting 3 seconds before next test...`);
      await new Promise(resolve => setTimeout(resolve, 3000));
      
    } catch (error) {
      console.log(`   ❌ Error: ${error}`);
    }
  }
  
  console.log('\n\n✅ All tests completed!');
  console.log('Check which test successfully cut the paper.');
  console.log('Note the working command and use it in your print function.\n');
}

// Run the test
testPrinterCut().catch(console.error);

/*
 * INSTRUCTIONS:
 * 1. Save this file as: src/scripts/testPrinterCut.ts
 * 2. Run: npx tsx src/scripts/testPrinterCut.ts
 * 3. Check your printer - one of these tests should cut the paper
 * 4. Note which test number worked
 * 5. Use that exact command in your printInvoice function
 * 
 * OR create an API endpoint:
 * 
 * // src/app/api/test-cut/route.ts
 * import { NextResponse } from 'next/server';
 * import { testPrinterCut } from '@/scripts/testPrinterCut';
 * 
 * export async function GET() {
 *   await testPrinterCut();
 *   return NextResponse.json({ message: 'Tests sent to printer' });
 * }
 * 
 * Then visit: http://localhost:3000/api/test-cut
 */