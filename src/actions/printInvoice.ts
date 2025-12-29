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

// --- IMPROVED CUT COMMAND ---
// GS V m n : Select cut mode and cut paper
// m=66 (0x42): Feeds paper to (cutting position + n x vertical motion unit) and cuts.
// This is safer than the standard cut as it ensures text clears the blade.
const CMD_FEED_AND_CUT = Buffer.from([0x1D, 0x56, 0x42, 0x00]); 

function drawLine(width: number = 48) {
  return '-'.repeat(width) + CMD_NEWLINE;
}

// ... [Keep your existing image helper functions exactly as they were] ...
// (I am omitting the body of imageToESCPOS, imageToBitmapData, and combineBitmapsSideBySide 
//  to save space, but DO NOT DELETE THEM from your file)

async function imageToESCPOS(imageData: string, maxWidth: number = 384): Promise<string> {
  // ... [Paste your existing imageToESCPOS function body here] ...
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

async function imageToBitmapData(imageData: string, maxWidth: number = 192): Promise<{ width: number; height: number; bytesPerLine: number; bitmap: number[] } | null> {
  // ... [Paste your existing imageToBitmapData function body here] ...
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

function combineBitmapsSideBySide(left: any, right: any, spacing: number = 16): string {
  // ... [Paste your existing combineBitmapsSideBySide function body here] ...
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
    
    // --- QR CODES ---
    content += CMD_ALIGN_CENTER;
    if (qrCodeData && mediaQrData) {
      // ... (Existing QR logic) ...
       try {
        const invoiceQrBitmap = await imageToBitmapData(qrCodeData, 180);
        const mediaQrBitmap = await imageToBitmapData(mediaQrData, 180);
        if (invoiceQrBitmap && mediaQrBitmap) {
          content += CMD_NEWLINE + combineBitmapsSideBySide(invoiceQrBitmap, mediaQrBitmap, 16);
          content += 'Invoice Details' + '        ' + 'Follow Us!' + CMD_NEWLINE;
        } else {
             if(invoiceQrBitmap) content += CMD_NEWLINE + await imageToESCPOS(qrCodeData, 200) + 'Scan Invoice' + CMD_NEWLINE;
             if(mediaQrBitmap) content += CMD_NEWLINE + await imageToESCPOS(mediaQrData, 200) + 'Follow Us' + CMD_NEWLINE;
        }
      } catch (err) { console.error('QR Print Error', err); }
    } else if (qrCodeData) {
       // ...
       const cmd = await imageToESCPOS(qrCodeData, 200);
       if(cmd) content += CMD_NEWLINE + cmd + 'Scan for Details' + CMD_NEWLINE;
    } else if (mediaQrData) {
        // ...
        const cmd = await imageToESCPOS(mediaQrData, 200);
        if(cmd) content += CMD_NEWLINE + cmd + 'Follow us!' + CMD_NEWLINE;
    }
    
    // --- FOOTER ---
    content += CMD_NEWLINE;
    content += CMD_ALIGN_CENTER;
    content += 'Thank you for your business!' + CMD_NEWLINE;
    content += 'Goods once sold will not be taken back.' + CMD_NEWLINE;
    content += CMD_NEWLINE;
    content += CMD_NEWLINE; // Few extra lines for padding
    
    // --- IMPORTANT: BUILD FINAL BUFFER WITH CUT COMMAND ---
    console.log('Adding Feed-and-Cut command...');
    
    // 1. Convert the string content to a binary Buffer
    const contentBuffer = Buffer.from(content, 'binary');
    
    // 2. Combine content + Cut Command (GS V 66 0)
    // This safely appends the binary 0x00 without it being treated as EOF
    const finalBuffer = Buffer.concat([contentBuffer, CMD_FEED_AND_CUT]);
    
    console.log(`Print buffer built. Size: ${finalBuffer.length} bytes`);
    
    // Write to temp file
    const tempFilePath = path.join(os.tmpdir(), `pos-print-${Date.now()}.bin`);
    await fs.writeFile(tempFilePath, finalBuffer);
    
    // --- EXECUTE PRINT ---
    // Try Direct USB first
    const directResult = await printDirectToUSB(finalBuffer);
    
    if (directResult.success) {
      await fs.unlink(tempFilePath).catch(() => {});
      return { success: true, message: 'Invoice printed via USB' };
    }
    
    // Fallback to CUPS Raw
    await new Promise((resolve, reject) => {
      exec(`lp -d RugtekPOS -o raw "${tempFilePath}"`, (error, stdout) => {
        if (error) reject(error);
        else resolve(stdout);
      });
    });
    
    await fs.unlink(tempFilePath).catch(() => {});
    return { success: true, message: 'Invoice printed via CUPS' };

  } catch (error) {
    console.error("Print action failed:", error);
    return { success: false, error: String(error) };
  }
}