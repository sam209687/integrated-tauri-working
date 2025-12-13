'use server'

import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import sharp from 'sharp';

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
const CMD_CUT = GS + 'V' + '\x41' + '\x03'; // Full cut with feed
const CMD_NEWLINE = '\n';

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
    
    // Handle different input types
    if (imageData.startsWith('data:image')) {
      // Base64 data URL
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
      imageBuffer = Buffer.from(base64Data, 'base64');
    } else if (imageData.startsWith('/')) {
      // Local file path - read from filesystem
      const filePath = path.join(process.cwd(), 'public', imageData);
      console.log('Reading image from filesystem:', filePath);
      imageBuffer = await fs.readFile(filePath);
    } else {
      // Assume it's already base64
      imageBuffer = Buffer.from(imageData, 'base64');
    }
    
    // Process image with sharp
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();
    
    // Resize if needed (maintain aspect ratio)
    let processedImage = image;
    if (metadata.width && metadata.width > maxWidth) {
      processedImage = image.resize(maxWidth, null, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }
    
    // Convert to grayscale and get raw pixel data
    const { data, info } = await processedImage
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    const width = info.width;
    const height = info.height;
    
    // Convert to 1-bit monochrome
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
    
    // Build ESC/POS bitmap command
    // GS v 0 m xL xH yL yH d1...dk
    let cmd = GS + 'v' + '0'; // GS v 0 (raster bit image)
    cmd += '\x00'; // m = 0 (normal mode)
    cmd += String.fromCharCode(bytesPerLine & 0xFF); // xL
    cmd += String.fromCharCode((bytesPerLine >> 8) & 0xFF); // xH
    cmd += String.fromCharCode(height & 0xFF); // yL
    cmd += String.fromCharCode((height >> 8) & 0xFF); // yH
    
    // Add bitmap data
    for (const byte of bitmap) {
      cmd += String.fromCharCode(byte);
    }
    
    return cmd;
  } catch (error) {
    console.error('Image conversion error:', error);
    return '';
  }
}

// Convert image to bitmap data (returns raw bitmap data for side-by-side printing)
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

// Combine two bitmaps side by side
function combineBitmapsSideBySide(
  left: { width: number; height: number; bytesPerLine: number; bitmap: number[] },
  right: { width: number; height: number; bytesPerLine: number; bitmap: number[] },
  spacing: number = 16 // pixels between images
): string {
  // Pad heights to match
  const maxHeight = Math.max(left.height, right.height);
  
  // Calculate spacing in bytes
  const spacingBytes = Math.ceil(spacing / 8);
  
  // Calculate combined width
  const combinedBytesPerLine = left.bytesPerLine + spacingBytes + right.bytesPerLine;
  const combinedBitmap: number[] = [];
  
  for (let y = 0; y < maxHeight; y++) {
    // Left image
    if (y < left.height) {
      const leftStart = y * left.bytesPerLine;
      for (let x = 0; x < left.bytesPerLine; x++) {
        combinedBitmap.push(left.bitmap[leftStart + x]);
      }
    } else {
      // Padding if left image is shorter
      for (let x = 0; x < left.bytesPerLine; x++) {
        combinedBitmap.push(0);
      }
    }
    
    // Spacing
    for (let x = 0; x < spacingBytes; x++) {
      combinedBitmap.push(0);
    }
    
    // Right image
    if (y < right.height) {
      const rightStart = y * right.bytesPerLine;
      for (let x = 0; x < right.bytesPerLine; x++) {
        combinedBitmap.push(right.bitmap[rightStart + x]);
      }
    } else {
      // Padding if right image is shorter
      for (let x = 0; x < right.bytesPerLine; x++) {
        combinedBitmap.push(0);
      }
    }
  }
  
  // Build ESC/POS command
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

// Fetch image from URL and convert to base64
async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const mimeType = response.headers.get('content-type') || 'image/png';
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error('Failed to fetch image:', error);
    return null;
  }
}

export async function printInvoice(data: PrintPayload) {
  const { invoiceData, storeDetails, qrCodeData, mediaQrData } = data;

  try {
    console.log('Building ESC/POS receipt with images...');
    
    let content = '';
    
    // Initialize printer
    content += CMD_INIT;
    
    // --- LOGO ---
    // Temporarily disabled - uncomment to enable logo printing
    /*
    if (storeDetails.logo) {
      try {
        content += CMD_ALIGN_CENTER;
        console.log('Processing store logo:', storeDetails.logo);
        
        const logoCmd = await imageToESCPOS(storeDetails.logo, 250); // 250px width
        if (logoCmd) {
          console.log('✓ Logo converted successfully, size:', logoCmd.length, 'bytes');
          content += logoCmd;
          content += CMD_NEWLINE;
        } else {
          console.warn('Logo conversion returned empty string');
        }
      } catch (err) {
        console.error('Could not print logo:', err);
      }
    } else {
      console.log('No logo provided in storeDetails');
    }
    */
    
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
      
      // Format line: Item name (28 chars) + Qty (6 chars) + Total (10 chars right-aligned)
      const line = itemName.padEnd(28) + qty.padEnd(6) + total.padStart(10);
      content += line + CMD_NEWLINE;
      
      // Add price per unit on next line if needed
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
        
        // Convert both QR codes to bitmap data
        const invoiceQrBitmap = await imageToBitmapData(qrCodeData, 180);
        const mediaQrBitmap = await imageToBitmapData(mediaQrData, 180);
        
        if (invoiceQrBitmap && mediaQrBitmap) {
          // Combine side by side
          const combinedCmd = combineBitmapsSideBySide(invoiceQrBitmap, mediaQrBitmap, 16);
          content += CMD_NEWLINE;
          content += combinedCmd;
          
          // Labels below QR codes
          content += 'Invoice Details' + '        ' + 'Follow Us!' + CMD_NEWLINE;
          content += CMD_NEWLINE;
          console.log('✓ QR codes printed side by side');
        } else {
          // Fallback: print separately if combining fails
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
      // Only invoice QR
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
      // Only media QR
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
    content += CMD_NEWLINE; // Extra feed before cut
    
    // --- CUT PAPER ---
    // Try multiple cut commands for compatibility
    content += GS + 'V' + '\x41' + '\x03'; // Partial cut with 3mm feed
    content += GS + 'V' + '\x00'; // Full cut (fallback)
    
    // Convert to buffer
    const buffer = Buffer.from(content, 'binary');
    console.log(`Print buffer size: ${buffer.length} bytes`);
    
    // Write to temp file
    const tempFilePath = path.join(os.tmpdir(), `pos-print-${Date.now()}.bin`);
    await fs.writeFile(tempFilePath, buffer);
    console.log(`Temp file created: ${tempFilePath}`);
    
    // Send to printer
    await new Promise((resolve, reject) => {
      const cmd = `lp -d RugtekPOS "${tempFilePath}"`;
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
        resolve(stdout);
      });
    });
    
    // Cleanup
    await fs.unlink(tempFilePath).catch((err) => {
      console.warn('Could not delete temp file:', err);
    });
    
    console.log('✅ Invoice printed successfully with images');
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