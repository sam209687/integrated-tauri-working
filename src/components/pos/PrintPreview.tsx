// src/components/pos/PrintPreview.tsx
"use client";

import { useState, useEffect, useMemo } from 'react';
import { usePrintStore } from '@/store/printStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import QRCode from 'qrcode';
import { useStoreDetailsStore } from '@/store/storeDetails.store';
import { Trophy, Settings, Loader2, Printer, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { printInvoice } from '@/actions/printInvoice';
import { getActiveTerms } from '@/actions/terms.actions';

export function PrintPreview() {
  const { isModalOpen, invoiceData, closeModal } = usePrintStore();
  const { activeStore, fetchActiveStore } = useStoreDetailsStore();
  
  const [paperSize, setPaperSize] = useState<'80mm' | '58mm'>('80mm');
  const [invoiceQrCode, setInvoiceQrCode] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printStatus, setPrintStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [printMessage, setPrintMessage] = useState<string>('');
  const [activeTerms, setActiveTerms] = useState<string | null>(null);

  // Fetch active store details and terms when the modal opens
  useEffect(() => {
    if (isModalOpen) {
      fetchActiveStore();
      
      // Fetch active terms
      const fetchTerms = async () => {
        const result = await getActiveTerms();
        if (result.success && result.data) {
          setActiveTerms(result.data.terms);
        }
      };
      fetchTerms();
      
      const savedPaperSize = localStorage.getItem('paperSize') as '80mm' | '58mm';
      if (savedPaperSize) {
        setPaperSize(savedPaperSize);
      }
      
      setPrintStatus('idle');
      setPrintMessage('');
    }
  }, [isModalOpen, fetchActiveStore]);

  const currentMediaQrCode = useMemo(() => {
    if (!activeStore) return null;

    const qrCodes = [
      activeStore.facebookQRCode,
      activeStore.instagramQRCode,
      activeStore.youtubeQRCode,
      activeStore.twitterQRCode,
      activeStore.googleMapsQRCode,
      activeStore.websiteQRCode,
    ].filter((qr): qr is string => Boolean(qr));

    if (qrCodes.length === 0) return null;
    if (qrCodes.length === 1) return qrCodes[0];

    const daysSinceEpoch = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    const cyclePosition = Math.floor(daysSinceEpoch / 10);
    const qrIndex = cyclePosition % qrCodes.length;

    return qrCodes[qrIndex];
  }, [activeStore]);

  useEffect(() => {
    if (invoiceData) {
      const generateInvoiceQR = async () => {
        const qrText = `Invoice: ${invoiceData.invoiceNumber}, Total: ${invoiceData.totalPayable.toFixed(2)}, Date: ${new Date(invoiceData.createdAt).toLocaleDateString()}`;
        const url = await QRCode.toDataURL(qrText);
        setInvoiceQrCode(url);
      };
      generateInvoiceQR();
    }
  }, [invoiceData]);

  useEffect(() => {
    if (isModalOpen && invoiceData && invoiceQrCode) {
      const autoPrint = localStorage.getItem('autoPrint') === 'true';
      if (autoPrint) {
        setTimeout(() => {
          handlePrint();
        }, 500);
      }
    }
  }, [isModalOpen, invoiceData, invoiceQrCode]);

  if (!invoiceData || !activeStore) return null;

  const handlePrint = async () => {
    if (isPrinting) return;
    
    setIsPrinting(true);
    setPrintStatus('idle');
    setPrintMessage('');

    try {
      if (!invoiceQrCode) {
        setPrintMessage('Generating QR code...');
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const payload = {
        invoiceData: invoiceData,
        storeDetails: activeStore,
        qrCodeData: invoiceQrCode,
        mediaQrData: currentMediaQrCode
      };

      console.log("Sending print job to RugtekPOS...");
      setPrintMessage('Sending to printer...');
      
      const result = await printInvoice(payload);

      if (result.success) {
        console.log("Print successful");
        setPrintStatus('success');
        setPrintMessage('Invoice printed successfully!');
        
        setTimeout(() => {
          closeModal();
        }, 2000);
      } else {
        console.error("Print failed:", result.error);
        setPrintStatus('error');
        setPrintMessage(result.error || 'Print failed. Check printer connection.');
      }
    } catch (err) {
      console.error("Print Error:", err);
      setPrintStatus('error');
      setPrintMessage(err instanceof Error ? err.message : 'Failed to send print job');
    } finally {
      setIsPrinting(false);
    }
  };

  const isGstEnabled = invoiceData.gstAmount > 0;
  const qualifiedOffers = invoiceData.offerQualifications?.filter(q => q.qualified) || [];
  const hasWonPrizes = qualifiedOffers.length > 0;

  return (
    <Dialog open={isModalOpen} onOpenChange={closeModal}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-4xl">
        <DialogHeader>
          <DialogTitle className="sr-only">Invoice Print Preview</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col md:flex-row gap-4">
          {/* Print Controls */}
          <div className="print-hidden w-full md:w-48 flex flex-col gap-4">
            <h3 className="text-lg font-bold">Print Options</h3>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Paper Size</label>
              <div className="bg-gray-700 p-3 rounded-lg">
                <p className="text-center font-semibold">{paperSize}</p>
                <p className="text-xs text-gray-400 text-center mt-1">
                  Rugtek RP82 (Raw)
                </p>
              </div>
            </div>
            
            <Link href="/admin/printer-settings">
              <Button variant="outline" className="w-full">
                <Settings className="mr-2 h-4 w-4" />
                Printer Settings
              </Button>
            </Link>
            
            <div className="bg-gray-700 p-3 rounded-lg text-xs">
              <p className="font-semibold mb-1">Status:</p>
              <p>Printer: <span className="text-green-400">Connected</span></p>
              <p>Mode: <span className="text-blue-400">Direct Raw</span></p>
            </div>
            
            {hasWonPrizes && (
              <div className="bg-green-600 text-white p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="h-5 w-5" />
                  <span className="font-bold">Prize Won! 🎉</span>
                </div>
                <p className="text-xs">Customer qualified for {qualifiedOffers.length} offer(s)</p>
              </div>
            )}
            
            <Separator className="bg-gray-700" />
            
            {printStatus !== 'idle' && (
              <div className={cn(
                "p-3 rounded-lg flex items-center gap-2 text-sm",
                printStatus === 'success' ? 'bg-green-600' : 'bg-red-600'
              )}>
                {printStatus === 'success' ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <span>{printMessage}</span>
              </div>
            )}
            
            {printMessage && printStatus === 'idle' && (
              <div className="bg-blue-600 p-3 rounded-lg text-sm">
                {printMessage}
              </div>
            )}
            
            <Button 
              onClick={handlePrint} 
              disabled={isPrinting}
              className="bg-green-500 hover:bg-green-600 text-black font-bold h-12"
            >
              {isPrinting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Printing...
                </>
              ) : (
                <>
                  <Printer className="mr-2 h-4 w-4" />
                  Print Invoice
                </>
              )}
            </Button>
          </div>

          {/* Invoice Preview */}
          <div className="flex-1 bg-white text-black p-2 rounded-md h-[80vh] overflow-y-auto">
            <div id="invoice-content" className={cn("mx-auto font-mono text-[10px] leading-tight", paperSize === '80mm' ? 'w-[76mm]' : 'w-[54mm]')}>
              {/* Header */}
              <div className="text-center">
                {activeStore.logo && (
                  <Image src={activeStore.logo} alt="Store Logo" width={80} height={80} className="mx-auto" />
                )}
                <h2 className="text-lg font-bold">{activeStore.storeName}</h2>
                <p>{activeStore.address}, {activeStore.city}, {activeStore.pincode}</p>
                <p>Phone: {activeStore.contactNumber}</p>
                <p>Email: {activeStore.email}</p>
                {activeStore.gst && <p>GSTIN: {activeStore.gst}</p>}
                <Separator className="my-1 bg-gray-400" />
                <p>Invoice #: {invoiceData.invoiceNumber}</p>
                <p>Date: {new Date(invoiceData.createdAt).toLocaleString()}</p>
              </div>

              <Separator className="my-1 bg-gray-400" />
              
              {/* Items Table */}
              <table className="w-full">
                <thead>
                  <tr className="border-b border-black">
                    <th className="text-left">Item{isGstEnabled && "/HSN"}</th>
                    <th className="text-center">Qty</th>
                    <th className="text-right">Price</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceData.items.map((item: any, index: number) => (
                    <tr key={index} className="border-b border-dashed border-black">
                      <td className="text-left">
                        {item.name}
                        {isGstEnabled && item.hsn && <div className="text-[8px]">({item.hsn})</div>}
                      </td>
                      <td className="text-center">{item.quantity}</td>
                      <td className="text-right">{item.price.toFixed(2)}</td>
                      <td className="text-right">{(item.price * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <Separator className="my-1 bg-gray-400" />
              
              {/* Totals */}
              <div className="text-right space-y-1">
                <p>Subtotal: Rs. {invoiceData.subtotal.toFixed(2)}</p>
                {invoiceData.discount > 0 && (
                  <p>Discount: -Rs. {invoiceData.discount.toFixed(2)}</p>
                )}
                {invoiceData.packingChargeDiscount > 0 && (
                  <p>Packing Charges: -Rs. {invoiceData.packingChargeDiscount.toFixed(2)}</p>
                )}
                {invoiceData.gstAmount > 0 && (
                  <p>GST: +Rs. {invoiceData.gstAmount.toFixed(2)}</p>
                )}
                <p className="text-lg font-bold">TOTAL: Rs. {invoiceData.totalPayable.toFixed(2)}</p>
              </div>
              
              {/* Prize Section */}
              {hasWonPrizes && (
                <div className="mt-4 border-2 border-dashed border-green-600 p-2">
                  <div className="text-center">
                    <Trophy className="h-8 w-8 mx-auto text-yellow-500" />
                    <p className="font-bold text-green-600">CONGRATULATIONS!</p>
                    <p className="text-sm">You won {qualifiedOffers.length} prize(s)!</p>
                    {qualifiedOffers.map((offer: any, idx: number) => (
                      <div key={idx} className="mt-2">
                        <p className="font-semibold">{offer.offerName}</p>
                        {offer.prizeName && <p className="text-xs">Prize: {offer.prizeName}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* QR Codes */}
              <div className="mt-4 flex justify-around">
                {invoiceQrCode && (
                  <div className="text-center">
                    <Image src={invoiceQrCode} alt="Invoice QR" width={80} height={80} />
                    <p className="text-[8px]">Invoice QR</p>
                  </div>
                )}
                {currentMediaQrCode && (
                  <div className="text-center">
                    <Image src={currentMediaQrCode} alt="Social QR" width={80} height={80} />
                    <p className="text-[8px]">Follow Us!</p>
                  </div>
                )}
              </div>
              
              {/* Terms and Conditions */}
              {activeTerms && (
                <>
                  <Separator className="my-2 bg-gray-400" />
                  <div className="mt-2">
                    <p className="text-center font-bold text-[9px] mb-1">Terms & Conditions</p>
                    <p className="text-[8px] text-justify leading-tight">
                      {activeTerms}
                    </p>
                  </div>
                </>
              )}
              
              {/* Footer */}
              <div className="mt-4 text-center">
                <p className="text-xs">Thank you for your business!</p>
                <p className="text-[8px]">Goods once sold will not be taken back.</p>
              </div>
              
              <div className="mt-4 text-center">
                <p className="text-gray-400 text-[8px] italic">Preview Mode</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}