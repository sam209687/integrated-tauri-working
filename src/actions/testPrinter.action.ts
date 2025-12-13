'use server'

import { ThermalPrinter, PrinterTypes, CharacterSet } from 'node-thermal-printer';
import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export async function testPrinter() {
  const results: any = {
    availableDrivers: [],
    testResults: [],
    systemInfo: {},
  };

  try {
    // Check available printer types
    results.availableDrivers = Object.keys(PrinterTypes);
    console.log('Available drivers:', results.availableDrivers);

    // Test system printer
    try {
      const printerList = await new Promise<string>((resolve, reject) => {
        exec('lpstat -p -d', (error, stdout, stderr) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(stdout);
        });
      });
      results.systemInfo.printers = printerList;
    } catch (err) {
      results.systemInfo.error = 'Could not list system printers';
    }

    // Test each driver type
    const driverTypes = [
      PrinterTypes.EPSON,
      PrinterTypes.STAR,
      PrinterTypes.TANCA,
    ];

    for (const driverType of driverTypes) {
      const driverName = Object.keys(PrinterTypes).find(
        key => PrinterTypes[key as keyof typeof PrinterTypes] === driverType
      ) || 'UNKNOWN';

      try {
        console.log(`Testing ${driverName} driver...`);
        
        const printer = new ThermalPrinter({
          type: driverType,
          interface: 'printer:RugtekPOS',
          width: 48,
          characterSet: CharacterSet.PC852_LATIN2,
        });

        printer.alignCenter();
        printer.println('=== TEST PRINT ===');
        printer.println(`Driver: ${driverName}`);
        printer.println(`Date: ${new Date().toLocaleString()}`);
        printer.println('==================');
        printer.newLine();
        printer.cut();

        const buffer = printer.getBuffer();
        const tempFile = path.join(os.tmpdir(), `test-${driverName}-${Date.now()}.bin`);
        
        await fs.writeFile(tempFile, buffer);

        // Try to print
        await new Promise<void>((resolve, reject) => {
          exec(`lp -d RugtekPOS "${tempFile}"`, (error, stdout, stderr) => {
            if (error) {
              reject(error);
              return;
            }
            resolve();
          });
        });

        await fs.unlink(tempFile).catch(() => {});

        results.testResults.push({
          driver: driverName,
          status: 'SUCCESS',
          bufferSize: buffer.length,
        });

        console.log(`✅ ${driverName} driver test passed`);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        results.testResults.push({
          driver: driverName,
          status: 'FAILED',
          error: errorMsg,
        });
        console.log(`❌ ${driverName} driver test failed:`, errorMsg);
      }
    }

    return { success: true, results };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      results,
    };
  }
}

// Simple test without driver
export async function testRawPrint() {
  try {
    // Create raw ESC/POS commands manually
    const ESC = '\x1B';
    const GS = '\x1D';
    
    let content = '';
    content += ESC + '@'; // Initialize printer
    content += ESC + 'a' + '\x01'; // Center align
    content += '=== RAW TEST PRINT ===\n';
    content += new Date().toLocaleString() + '\n';
    content += '=====================\n';
    content += '\n\n\n';
    content += GS + 'V' + '\x00'; // Cut paper

    const buffer = Buffer.from(content, 'binary');
    const tempFile = path.join(os.tmpdir(), `raw-test-${Date.now()}.bin`);
    
    await fs.writeFile(tempFile, buffer);

    await new Promise<void>((resolve, reject) => {
      exec(`lp -d RugtekPOS "${tempFile}"`, (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });

    await fs.unlink(tempFile).catch(() => {});

    return { success: true, message: 'Raw print test sent' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}