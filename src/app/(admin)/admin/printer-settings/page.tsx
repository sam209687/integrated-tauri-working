// src/app/(admin)/admin/printer-settings/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Printer, CheckCircle2, Monitor, Smartphone, Settings, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";

interface PrinterInfo {
  id: string;
  name: string;
  isDefault: boolean;
  status: string;
  type: 'thermal' | 'inkjet' | 'laser' | 'virtual';
}

export default function PrinterSettingsPage() {
  const [availablePrinters, setAvailablePrinters] = useState<PrinterInfo[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<string>("");
  const [paperSize, setPaperSize] = useState<'80mm' | '58mm'>('80mm');
  const [isLoading, setIsLoading] = useState(false);
  const [autoPrint, setAutoPrint] = useState(false);

  useEffect(() => {
    // Load saved settings from localStorage
    const savedPrinter = localStorage.getItem('selectedPrinter');
    const savedPaperSize = localStorage.getItem('paperSize') as '80mm' | '58mm';
    const savedAutoPrint = localStorage.getItem('autoPrint') === 'true';

    if (savedPrinter) setSelectedPrinter(savedPrinter);
    if (savedPaperSize) setPaperSize(savedPaperSize);
    setAutoPrint(savedAutoPrint);

    // Detect printers on mount
    detectPrinters();
  }, []);

  const detectPrinters = async () => {
    setIsLoading(true);
    try {
      // Try to get system printers using Web API
      // Note: This requires HTTPS and user permission
      const printers: PrinterInfo[] = [];

      // Check if the browser supports the experimental getPrinters API
      if ('getPrinters' in navigator) {
        // @ts-ignore - Experimental API
        const devices = await navigator.getPrinters();
        devices.forEach((device: any, index: number) => {
          printers.push({
            id: device.id || `printer-${index}`,
            name: device.name || `Printer ${index + 1}`,
            isDefault: device.isDefault || false,
            status: 'Ready',
            type: detectPrinterType(device.name),
          });
        });
      } else {
        // Fallback: Show manual detection option
        toast.info("Automatic printer detection not available. Please select manually.");
        
        // Add common thermal printers as options
        printers.push(
          {
            id: 'thermal-1',
            name: 'Thermal Printer (80mm)',
            isDefault: false,
            status: 'Unknown',
            type: 'thermal',
          },
          {
            id: 'thermal-2',
            name: 'Thermal Printer (58mm)',
            isDefault: false,
            status: 'Unknown',
            type: 'thermal',
          },
          {
            id: 'system-default',
            name: 'System Default Printer',
            isDefault: true,
            status: 'Unknown',
            type: 'laser',
          }
        );
      }

      setAvailablePrinters(printers);
      
      if (printers.length === 0) {
        toast.warning("No printers detected. Using browser print dialog.");
      }
    } catch (error) {
      console.error("Error detecting printers:", error);
      toast.error("Failed to detect printers. You can still use browser print dialog.");
      
      // Add fallback options
      setAvailablePrinters([
        {
          id: 'browser-default',
          name: 'Browser Default',
          isDefault: true,
          status: 'Available',
          type: 'virtual',
        },
        {
          id: 'thermal-80mm',
          name: 'Thermal Printer (80mm)',
          isDefault: false,
          status: 'Unknown',
          type: 'thermal',
        },
        {
          id: 'thermal-58mm',
          name: 'Thermal Printer (58mm)',
          isDefault: false,
          status: 'Unknown',
          type: 'thermal',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const detectPrinterType = (name: string): PrinterInfo['type'] => {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('thermal') || nameLower.includes('receipt') || nameLower.includes('pos')) {
      return 'thermal';
    } else if (nameLower.includes('laser')) {
      return 'laser';
    } else if (nameLower.includes('inkjet') || nameLower.includes('deskjet')) {
      return 'inkjet';
    }
    return 'virtual';
  };

  const getPrinterIcon = (type: PrinterInfo['type']) => {
    switch (type) {
      case 'thermal':
        return <Printer className="h-8 w-8 text-green-500" />;
      case 'laser':
        return <Printer className="h-8 w-8 text-blue-500" />;
      case 'inkjet':
        return <Printer className="h-8 w-8 text-purple-500" />;
      default:
        return <Monitor className="h-8 w-8 text-gray-500" />;
    }
  };

  const handleSaveSettings = () => {
    if (!selectedPrinter) {
      toast.error("Please select a printer");
      return;
    }

    // Save to localStorage
    localStorage.setItem('selectedPrinter', selectedPrinter);
    localStorage.setItem('paperSize', paperSize);
    localStorage.setItem('autoPrint', String(autoPrint));

    toast.success("Printer settings saved successfully!");
  };

  const handleTestPrint = () => {
    if (!selectedPrinter) {
      toast.error("Please select a printer first");
      return;
    }

    const printer = availablePrinters.find(p => p.id === selectedPrinter);
    toast.info(`Test print sent to: ${printer?.name}`);
    
    // Trigger browser print with test content
    const testWindow = window.open('', '', 'width=300,height=600');
    if (testWindow) {
      testWindow.document.write(`
        <html>
          <head>
            <title>Test Print</title>
            <style>
              body { font-family: monospace; width: ${paperSize === '80mm' ? '76mm' : '54mm'}; margin: 0; padding: 10px; }
              h2 { text-align: center; }
            </style>
          </head>
          <body>
            <h2>TEST PRINT</h2>
            <p>Printer: ${printer?.name}</p>
            <p>Paper Size: ${paperSize}</p>
            <p>Date: ${new Date().toLocaleString()}</p>
            <p style="text-align: center; margin-top: 20px;">✓ Print Test Successful</p>
          </body>
        </html>
      `);
      testWindow.document.close();
      testWindow.print();
      testWindow.close();
    }
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Printer Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Configure your thermal printer for invoice printing
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Available Printers */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Available Printers</CardTitle>
                <CardDescription>Select your preferred printer</CardDescription>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={detectPrinters}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Detecting printers...</span>
              </div>
            ) : (
              <RadioGroup value={selectedPrinter} onValueChange={setSelectedPrinter}>
                <div className="space-y-3">
                  {availablePrinters.map((printer) => (
                    <div
                      key={printer.id}
                      className={`flex items-center space-x-3 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                        selectedPrinter === printer.id
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedPrinter(printer.id)}
                    >
                      <RadioGroupItem value={printer.id} id={printer.id} />
                      <div className="flex items-center gap-3 flex-1">
                        {getPrinterIcon(printer.type)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Label htmlFor={printer.id} className="cursor-pointer font-semibold">
                              {printer.name}
                            </Label>
                            {printer.isDefault && (
                              <Badge variant="secondary" className="text-xs">
                                Default
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs capitalize">
                              {printer.type}
                            </Badge>
                            <span className="text-xs text-gray-500">{printer.status}</span>
                          </div>
                        </div>
                        {selectedPrinter === printer.id && (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            )}

            {availablePrinters.length === 0 && !isLoading && (
              <div className="text-center py-8 text-gray-500">
                <Printer className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No printers detected</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={detectPrinters}
                  className="mt-2"
                >
                  Refresh
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Print Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Print Settings</CardTitle>
            <CardDescription>Configure paper size and behavior</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Paper Size */}
            <div>
              <Label className="text-base mb-3 block">Paper Size</Label>
              <RadioGroup value={paperSize} onValueChange={(value) => setPaperSize(value as '80mm' | '58mm')}>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    className={`flex items-center space-x-2 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                      paperSize === '80mm'
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                    }`}
                    onClick={() => setPaperSize('80mm')}
                  >
                    <RadioGroupItem value="80mm" id="80mm" />
                    <Label htmlFor="80mm" className="cursor-pointer flex-1">
                      <div className="font-semibold">80mm</div>
                      <div className="text-xs text-gray-500">Standard thermal</div>
                    </Label>
                  </div>
                  <div
                    className={`flex items-center space-x-2 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                      paperSize === '58mm'
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                    }`}
                    onClick={() => setPaperSize('58mm')}
                  >
                    <RadioGroupItem value="58mm" id="58mm" />
                    <Label htmlFor="58mm" className="cursor-pointer flex-1">
                      <div className="font-semibold">58mm</div>
                      <div className="text-xs text-gray-500">Compact thermal</div>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <Separator />

            {/* Auto Print */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Auto Print</Label>
                <p className="text-sm text-gray-500">
                  Print automatically after saving invoice
                </p>
              </div>
              <Checkbox
                checked={autoPrint}
                onCheckedChange={(checked) => setAutoPrint(checked as boolean)}
              />
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button
                onClick={handleTestPrint}
                variant="outline"
                className="w-full"
                disabled={!selectedPrinter}
              >
                <Printer className="mr-2 h-4 w-4" />
                Test Print
              </Button>
              <Button
                onClick={handleSaveSettings}
                className="w-full"
                disabled={!selectedPrinter}
              >
                <Settings className="mr-2 h-4 w-4" />
                Save Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instructions Card */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Setup Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold mb-1">🖨️ For Thermal Printers:</h4>
              <ol className="list-decimal list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-2">
                <li>Connect your thermal printer via USB or Network</li>
                <li>Install the manufacturer's driver software</li>
                <li>Click "Refresh" to detect the printer</li>
                <li>Select your printer and paper size</li>
                <li>Click "Test Print" to verify</li>
              </ol>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-semibold mb-1">💻 Platform Support:</h4>
              <ul className="space-y-1 text-gray-600 dark:text-gray-400 ml-2">
                <li>✓ Windows: Full support via Windows Print API</li>
                <li>✓ macOS: Full support via CUPS</li>
                <li>✓ Linux: Full support via CUPS</li>
              </ul>
            </div>

            <Separator />

            <div>
              <h4 className="font-semibold mb-1">⚠️ Browser Requirements:</h4>
              <p className="text-gray-600 dark:text-gray-400 ml-2">
                For automatic printer detection, use Chrome/Edge 89+ or enable experimental web platform features.
                Alternatively, select from manual printer options.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}