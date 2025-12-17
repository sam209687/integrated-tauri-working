'use server'

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';

const execPromise = promisify(exec);

async function findPrinterUSBDevice(): Promise<string | null> {
  try {
    const locations = [
      '/dev/usb/lp0',
      '/dev/usb/lp1', 
      '/dev/usblp0',
      '/dev/usblp1',
    ];
    
    for (const device of locations) {
      try {
        await fs.access(device);
        console.log(`✅ Found USB device: ${device}`);
        return device;
      } catch {
        continue;
      }
    }
    
    const { stdout } = await execPromise('ls /dev/usb/lp* /dev/usblp* 2>/dev/null | head -1');
    const device = stdout.trim();
    
    if (device) {
      console.log(`✅ Found USB device: ${device}`);
      return device;
    }
    
    return null;
  } catch (error) {
    console.error('Could not find USB device:', error);
    return null;
  }
}

export async function printDirectToUSB(buffer: Buffer): Promise<{ success: boolean; message: string }> {
  try {
    console.log('🔌 Attempting direct USB print (bypassing CUPS)...');
    
    const device = await findPrinterUSBDevice();
    
    if (!device) {
      console.log('⚠️  No USB device found');
      return { success: false, message: 'USB device not found' };
    }
    
    const tempFile = `/tmp/direct-print-${Date.now()}.bin`;
    await fs.writeFile(tempFile, buffer);
    console.log(`Temp file created: ${tempFile}`);
    
    // Try to write directly
    try {
      await execPromise(`cat "${tempFile}" > ${device}`);
      console.log('✅ Data sent directly to USB device');
      await fs.unlink(tempFile);
      return { success: true, message: 'Printed via direct USB' };
    } catch (catError: any) {
      if (catError.message.includes('Permission denied')) {
        console.log('⚠️  Permission denied, need to grant USB access');
        await fs.unlink(tempFile);
        return { success: false, message: 'Permission denied - run: sudo chmod 666 ' + device };
      }
      throw catError;
    }
  } catch (error) {
    console.error('❌ Direct USB print failed:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}