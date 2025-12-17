'use server'

import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import sharp from 'sharp';
import { printDirectToUSB } from '@/lib/directUSBPrint';

interface PrintPayload {
  invoiceData: any;
  storeDetails: any;
  qrCodeData?: string | null;
  mediaQrData?: string | null;
}

// ESC/POS Commands
const ESC = '\x1B';
const GS = '\x1D';

// Text formatting
const CMD_INIT = ESC + '@';
const CMD_ALIGN_LEFT = ESC + 'a' + '\x00';
const CMD_ALIGN_CENTER = ESC + 'a' + '\x01';
const CMD_ALIGN_RIGHT = ESC + 'a' + '\x02';
const CMD_BOLD_ON = ESC + 'E' + '\x01';
const CMD_BOLD_OFF = ESC + 'E' + '\x00';
const CMD_DOUBLE_HEIGHT = GS + '!' + '\x01';
const CMD_NORMAL_SIZE = GS + '!' + '\x00';
const CMD_NEWLINE = '\n';

// Paper cut commands - using the exact format you specified
const CMD_CUT_FULL = GS + 'V' + '\x00'; // Full cut: 0x1D, 0x56, 0x00
const CMD_CUT_PARTIAL = GS + 'V' + '\x01'; // Partial cut: 0x1D, 0x56, 0x01
const CMD_CUT_FEED = GS + 'V' + 'A' + '\x03'; // Cut with 3mm feed

function drawLine(width: number = 48) {
  return '-'.repeat(width) + CMD_NEWLINE;
}

function padText(text: string, align: 'left' | 'center' | 'right', width: number = 48): string {
  if (text.length >= width) return text.substring(0, width);
  
  if (align === 'center') {
    const padding = Math.floor((width - text.length) / 2);
    return ' '.repeat(padding) + text;
  } else if (align === 'right') {
    return ' '.repeat(width - text.length) + text;
  }
  return text;
}

// Convert image to ESC/POS bitmap format
async function imageToESCPOS(imageData: string, maxWidth: number = 384): Promise<string> {
  try {
    let imageBuffer: Buffer;
    
    if (imageData.startsWith('data:image')) {
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
      imageBuffer = Buffer.from(base64Data, 'base64');
    } else if (imageData.startsWith('/')) {
      const filePath = path.join(process.cwd(), 'public', imageData);
      console.log('Reading image from filesystem:', filePath);
      imageBuffer = await fs.readFile(filePath);
    } else {
      imageBuffer = Buffer.from(imageData, 'base64');
    }
    
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();
    
    let processedImage = image;
    if (metadata.width && metadata.width > maxWidth) {
      processedImage = image.resize(maxWidth, null, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }
    
    const { data, info } = await processedImage
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    const width = info.width;
    const height = info.height;
    
    const threshold = 128;
    const bytesPerLine = Math.ceil(width / 8);
    const bitmap: number[] = [];
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < bytesPerLine; x++) {
        let byte = 0;
        for (let bit = 0; bit < 8; bit++) {
          const px = x * 8 + bit;
          if (px < width) {
            const index = y * width + px;
            const pixel = data[index];
            if (pixel < threshold) {
              byte |= (1 << (7 - bit));
            }
          }
        }
        bitmap.push(byte);
      }
    }
    
    let cmd = GS + 'v' + '0';
    cmd += '\x00';
    cmd += String.fromCharCode(bytesPerLine & 0xFF);
    cmd += String.fromCharCode((bytesPerLine >> 8) & 0xFF);
    cmd += String.fromCharCode(height & 0xFF);
    cmd += String.fromCharCode((height >> 8) & 0xFF);
    
    for (const byte of bitmap) {
      cmd += String.fromCharCode(byte);
    }
    
    return cmd;
  } catch (error) {
    console.error('Image conversion error:', error);
    return '';
  }
}

async function imageToBitmapData(imageData: string, maxWidth: number = 192): Promise<{
  width: number;
  height: number;
  bytesPerLine: number;
  bitmap: number[];
} | null> {
  try {
    let imageBuffer: Buffer;
    
    if (imageData.startsWith('data:image')) {
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
      imageBuffer = Buffer.from(base64Data, 'base64');
    } else if (imageData.startsWith('/')) {
      const filePath = path.join(process.cwd(), 'public', imageData);
      imageBuffer = await fs.readFile(filePath);
    } else {
      imageBuffer = Buffer.from(imageData, 'base64');
    }
    
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();
    
    let processedImage = image;
    if (metadata.width && metadata.width > maxWidth) {
      processedImage = image.resize(maxWidth, null, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }
    
    const { data, info } = await processedImage
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    const width = info.width;
    const height = info.height;
    const threshold = 128;
    const bytesPerLine = Math.ceil(width / 8);
    const bitmap: number[] = [];
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < bytesPerLine; x++) {
        let byte = 0;
        for (let bit = 0; bit < 8; bit++) {
          const px = x * 8 + bit;
          if (px < width) {
            const index = y * width + px;
            const pixel = data[index];
            if (pixel < threshold) {
              byte |= (1 << (7 - bit));
            }
          }
        }
        bitmap.push(byte);
      }
    }
    
    return { width, height, bytesPerLine, bitmap };
  } catch (error) {
    console.error('Bitmap conversion error:', error);
    return null;
  }
}

function combineBitmapsSideBySide(
  left: { width: number; height: number; bytesPerLine: number; bitmap: number[] },
  right: { width: number; height: number; bytesPerLine: number; bitmap: number[] },
  spacing: number = 16
): string {
  const maxHeight = Math.max(left.height, right.height);
  const spacingBytes = Math.ceil(spacing / 8);
  const combinedBytesPerLine = left.bytesPerLine + spacingBytes + right.bytesPerLine;
  const combinedBitmap: number[] = [];
  
  for (let y = 0; y < maxHeight; y++) {
    if (y < left.height) {
      const leftStart = y * left.bytesPerLine;
      for (let x = 0; x < left.bytesPerLine; x++) {
        combinedBitmap.push(left.bitmap[leftStart + x]);
      }
    } else {
      for (let x = 0; x < left.bytesPerLine; x++) {
        combinedBitmap.push(0);
      }
    }
    
    for (let x = 0; x < spacingBytes; x++) {
      combinedBitmap.push(0);
    }
    
    if (y < right.height) {
      const rightStart = y * right.bytesPerLine;
      for (let x = 0; x < right.bytesPerLine; x++) {
        combinedBitmap.push(right.bitmap[rightStart + x]);
      }
    } else {
      for (let x = 0; x < right.bytesPerLine; x++) {
        combinedBitmap.push(0);
      }
    }
  }
  
  let cmd = GS + 'v' + '0';
  cmd += '\x00';
  cmd += String.fromCharCode(combinedBytesPerLine & 0xFF);
  cmd += String.fromCharCode((combinedBytesPerLine >> 8) & 0xFF);
  cmd += String.fromCharCode(maxHeight & 0xFF);
  cmd += String.fromCharCode((maxHeight >> 8) & 0xFF);
  
  for (const byte of combinedBitmap) {
    cmd += String.fromCharCode(byte);
  }
  
  return cmd;
}

export async function printInvoice(data: PrintPayload) {
  const { invoiceData, storeDetails, qrCodeData, mediaQrData } = data;

  try {
    console.log('Building ESC/POS receipt with images...');
    
    let content = '';
    
    // Initialize printer
    content += CMD_INIT;
    
    // --- HEADER ---
    content += CMD_ALIGN_CENTER;
    content += CMD_BOLD_ON;
    content += CMD_DOUBLE_HEIGHT;
    content += storeDetails.storeName + CMD_NEWLINE;
    content += CMD_NORMAL_SIZE;
    content += CMD_BOLD_OFF;
    
    content += storeDetails.address + CMD_NEWLINE;
    content += `${storeDetails.city}, ${storeDetails.pincode}` + CMD_NEWLINE;
    content += `Phone: ${storeDetails.contactNumber}` + CMD_NEWLINE;
    if (storeDetails.email) content += storeDetails.email + CMD_NEWLINE;
    if (storeDetails.gst) content += `GSTIN: ${storeDetails.gst}` + CMD_NEWLINE;
    
    content += drawLine();
    
    // --- INVOICE META ---
    content += CMD_ALIGN_LEFT;
    content += `Invoice #: ${invoiceData.invoiceNumber}` + CMD_NEWLINE;
    content += `Date: ${new Date(invoiceData.createdAt).toLocaleString()}` + CMD_NEWLINE;
    content += drawLine();
    
    // --- ITEMS HEADER ---
    content += CMD_BOLD_ON;
    const itemHeader = 'Item'.padEnd(28) + 'Qty'.padEnd(6) + 'Total'.padStart(10);
    content += itemHeader + CMD_NEWLINE;
    content += CMD_BOLD_OFF;
    content += drawLine();
    
    // --- ITEMS ---
    invoiceData.items.forEach((item: any) => {
      const itemName = item.name.length > 28 ? item.name.substring(0, 25) + '...' : item.name;
      const qty = item.quantity.toString();
      const total = (item.price * item.quantity).toFixed(2);
      
      const line = itemName.padEnd(28) + qty.padEnd(6) + total.padStart(10);
      content += line + CMD_NEWLINE;
      
      if (item.quantity > 1) {
        const priceInfo = `  @ Rs.${item.price.toFixed(2)} each`;
        content += priceInfo + CMD_NEWLINE;
      }
    });
    
    content += drawLine();
    
    // --- TOTALS ---
    content += CMD_ALIGN_RIGHT;
    content += `Subtotal: Rs. ${invoiceData.subtotal.toFixed(2)}` + CMD_NEWLINE;
    
    if (invoiceData.discount > 0) {
      content += `Discount: -Rs. ${invoiceData.discount.toFixed(2)}` + CMD_NEWLINE;
    }
    
    if (invoiceData.gstAmount > 0) {
      content += `GST: +Rs. ${invoiceData.gstAmount.toFixed(2)}` + CMD_NEWLINE;
    }
    
    content += drawLine();
    
    content += CMD_BOLD_ON;
    content += CMD_DOUBLE_HEIGHT;
    content += `TOTAL: Rs. ${invoiceData.totalPayable.toFixed(2)}` + CMD_NEWLINE;
    content += CMD_NORMAL_SIZE;
    content += CMD_BOLD_OFF;
    
    content += drawLine();
    
    // --- PRIZE SECTION ---
    const qualifiedOffers = invoiceData.offerQualifications?.filter((q: any) => q.qualified) || [];
    if (qualifiedOffers.length > 0) {
      content += CMD_NEWLINE;
      content += CMD_ALIGN_CENTER;
      content += CMD_BOLD_ON;
      content += '*** CONGRATULATIONS! ***' + CMD_NEWLINE;
      content += CMD_BOLD_OFF;
      content += `YOU WON ${qualifiedOffers.length} PRIZE(S)!` + CMD_NEWLINE;
      content += CMD_NEWLINE;
      
      qualifiedOffers.forEach((offer: any) => {
        content += `- ${offer.offerName}` + CMD_NEWLINE;
        if (offer.prizeName) {
          content += `  Prize: ${offer.prizeName}` + CMD_NEWLINE;
        }
      });
      
      content += CMD_NEWLINE;
      content += drawLine();
    }
    
    // --- QR CODES (Side by Side) ---
    content += CMD_ALIGN_CENTER;
    
    if (qrCodeData && mediaQrData) {
      try {
        console.log('Processing QR codes side by side...');
        const invoiceQrBitmap = await imageToBitmapData(qrCodeData, 180);
        const mediaQrBitmap = await imageToBitmapData(mediaQrData, 180);
        
        if (invoiceQrBitmap && mediaQrBitmap) {
          const combinedCmd = combineBitmapsSideBySide(invoiceQrBitmap, mediaQrBitmap, 16);
          content += CMD_NEWLINE;
          content += combinedCmd;
          content += 'Invoice Details' + '        ' + 'Follow Us!' + CMD_NEWLINE;
          content += CMD_NEWLINE;
          console.log('✓ QR codes printed side by side');
        } else {
          console.log('Failed to combine QR codes, printing separately...');
          
          if (invoiceQrBitmap) {
            const cmd = await imageToESCPOS(qrCodeData, 200);
            if (cmd) {
              content += CMD_NEWLINE;
              content += cmd;
              content += 'Scan for Invoice Details' + CMD_NEWLINE;
            }
          }
          
          if (mediaQrBitmap) {
            const cmd = await imageToESCPOS(mediaQrData, 200);
            if (cmd) {
              content += CMD_NEWLINE;
              content += cmd;
              content += 'Follow us on social media!' + CMD_NEWLINE;
            }
          }
        }
      } catch (err) {
        console.error('Could not print QR codes:', err);
      }
    } else if (qrCodeData) {
      try {
        console.log('Processing invoice QR code...');
        const qrCmd = await imageToESCPOS(qrCodeData, 200);
        if (qrCmd) {
          content += CMD_NEWLINE;
          content += qrCmd;
          content += 'Scan for Invoice Details' + CMD_NEWLINE;
          content += CMD_NEWLINE;
          console.log('✓ Invoice QR printed');
        }
      } catch (err) {
        console.error('Could not print invoice QR:', err);
      }
    } else if (mediaQrData) {
      try {
        console.log('Processing media QR code:', mediaQrData);
        const qrCmd = await imageToESCPOS(mediaQrData, 200);
        if (qrCmd) {
          console.log('✓ Media QR converted successfully, size:', qrCmd.length, 'bytes');
          content += CMD_NEWLINE;
          content += qrCmd;
          content += 'Follow us on social media!' + CMD_NEWLINE;
          content += CMD_NEWLINE;
        } else {
          console.warn('Media QR conversion returned empty string');
        }
      } catch (err) {
        console.error('Could not print media QR:', err);
      }
    } else {
      console.log('No QR codes to print');
    }
    
    // --- FOOTER ---
    content += CMD_NEWLINE;
    content += CMD_ALIGN_CENTER;
    content += 'Thank you for your business!' + CMD_NEWLINE;
    content += 'Goods once sold will not be taken back.' + CMD_NEWLINE;
    content += CMD_NEWLINE;
    content += CMD_NEWLINE;
    content += CMD_NEWLINE;
    content += CMD_NEWLINE;
    content += CMD_NEWLINE;
    content += CMD_NEWLINE; // 6 line feeds for proper paper position
    
    // --- CUT PAPER ---
    // Since self-test cuts successfully, we know the hardware works
    // Use the standard ESC/POS cut command
    console.log('Adding paper cut command...');
    
    // Full cut command: GS V 0 (0x1D 0x56 0x00)
    content += String.fromCharCode(0x1D, 0x56, 0x00);
    
    // Alternative: Add partial cut as fallback (some printers prefer this)
    // content += String.fromCharCode(0x1D, 0x56, 0x01);
    
    console.log('Cut command added to buffer');
    
    // Convert to buffer
    const buffer = Buffer.from(content, 'binary');
    console.log(`Print buffer size: ${buffer.length} bytes`);
    
    // Verify cut command is in buffer
    const lastBytes = buffer.slice(-20);
    console.log('Last 20 bytes:', Array.from(lastBytes).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
    const hasCutCommand = lastBytes.includes(0x1D) && lastBytes.includes(0x56);
    console.log('Cut command in buffer:', hasCutCommand ? '✅ YES' : '❌ NO');
    
    // Write to temp file
    const tempFilePath = path.join(os.tmpdir(), `pos-print-${Date.now()}.bin`);
    await fs.writeFile(tempFilePath, buffer);
    console.log(`Temp file created: ${tempFilePath}`);
    
    // TRY DIRECT USB FIRST (bypasses CUPS filtering)
    console.log('\n=== Attempting Direct USB Print ===');
    const directResult = await printDirectToUSB(buffer);
    
    if (directResult.success) {
      console.log('✅ SUCCESS: Printed via Direct USB (CUPS bypassed)');
      // Cleanup temp file
      await fs.unlink(tempFilePath).catch((err) => {
        console.warn('Could not delete temp file:', err);
      });
      return { success: true, message: 'Invoice printed successfully via USB' };
    } else {
      console.log('⚠️  Direct USB failed:', directResult.message);
      console.log('=== Falling back to CUPS ===');
    }
    
    // FALLBACK: Use CUPS if direct USB fails
    await new Promise((resolve, reject) => {
      const cmd = `lp -d RugtekPOS -o raw "${tempFilePath}"`;
      console.log(`Executing: ${cmd}`);
      
      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          console.error(`Print command error: ${error.message}`);
          console.error(`stderr: ${stderr}`);
          reject(new Error(`Print command failed: ${error.message}`));
          return;
        }
        console.log(`Print command output: ${stdout}`);
        if (stderr) console.warn(`Print warnings: ${stderr}`);
        console.log('✅ Print job sent via CUPS');
        resolve(stdout);
      });
    });
    
    // Cleanup
    await fs.unlink(tempFilePath).catch((err) => {
      console.warn('Could not delete temp file:', err);
    });
    
    console.log('✅ Invoice printed successfully with paper cut');
    return { success: true, message: 'Invoice printed successfully' };

  } catch (error) {
    console.error("❌ Print action failed:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { 
      success: false, 
      error: `Print failed: ${errorMessage}`
    };
  }
}