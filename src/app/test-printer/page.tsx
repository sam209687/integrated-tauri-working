'use client';

import { testPrinter, testRawPrint } from '@/actions/testPrinter.action';
import { useState } from 'react';

export default function TestPrinterPage() {
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [rawTesting, setRawTesting] = useState(false);
  const [rawResult, setRawResult] = useState<any>(null);

  const handleTestDrivers = async () => {
    setTesting(true);
    setTestResults(null);
    try {
      const result = await testPrinter();
      setTestResults(result);
      console.log('Test results:', result);
    } catch (error) {
      console.error('Test error:', error);
      setTestResults({ success: false, error: String(error) });
    } finally {
      setTesting(false);
    }
  };

  const handleRawTest = async () => {
    setRawTesting(true);
    setRawResult(null);
    try {
      const result = await testRawPrint();
      setRawResult(result);
      console.log('Raw test result:', result);
    } catch (error) {
      console.error('Raw test error:', error);
      setRawResult({ success: false, error: String(error) });
    } finally {
      setRawTesting(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl bg-gray-900 min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-6">Thermal Printer Test</h1>
      
      <div className="space-y-6">
        {/* Test All Drivers */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Test All Drivers</h2>
          <p className="text-gray-400 text-sm mb-4">
            Tests EPSON, STAR, and TANCA drivers to see which one works with your printer
          </p>
          
          <button 
            onClick={handleTestDrivers} 
            disabled={testing}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition"
          >
            {testing ? 'Testing Drivers...' : 'Test All Drivers'}
          </button>

          {testResults && (
            <div className="mt-4 space-y-4">
              {/* System Info */}
              {testResults.results?.systemInfo && (
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">System Printers:</h3>
                  <pre className="text-xs overflow-auto text-gray-300">
                    {testResults.results.systemInfo.printers || testResults.results.systemInfo.error}
                  </pre>
                </div>
              )}

              {/* Driver Results */}
              {testResults.results?.testResults && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Driver Test Results:</h3>
                  {testResults.results.testResults.map((result: any, idx: number) => (
                    <div 
                      key={idx} 
                      className={`p-3 rounded-lg flex items-center justify-between ${
                        result.status === 'SUCCESS' 
                          ? 'bg-green-900 text-green-100' 
                          : 'bg-red-900 text-red-100'
                      }`}
                    >
                      <span className="font-semibold">{result.driver}</span>
                      <span className="text-sm">
                        {result.status === 'SUCCESS' 
                          ? `✓ ${result.bufferSize} bytes` 
                          : `✗ ${result.error}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Available Drivers */}
              {testResults.results?.availableDrivers && (
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Available Drivers:</h3>
                  <div className="flex flex-wrap gap-2">
                    {testResults.results.availableDrivers.map((driver: string) => (
                      <span key={driver} className="px-2 py-1 bg-blue-600 rounded text-sm">
                        {driver}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Raw Print Test */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Raw ESC/POS Test</h2>
          <p className="text-gray-400 text-sm mb-4">
            Tests direct ESC/POS commands without using any driver library
          </p>
          
          <button 
            onClick={handleRawTest} 
            disabled={rawTesting}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition"
          >
            {rawTesting ? 'Sending Raw Test...' : 'Test Raw Print'}
          </button>

          {rawResult && (
            <div className={`mt-4 p-4 rounded-lg ${
              rawResult.success 
                ? 'bg-green-900 text-green-100' 
                : 'bg-red-900 text-red-100'
            }`}>
              {rawResult.success ? (
                <span>✓ {rawResult.message}</span>
              ) : (
                <span>✗ {rawResult.error}</span>
              )}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Instructions</h2>
          <div className="space-y-2 text-sm text-gray-300">
            <p><strong>1.</strong> Make sure your Rugtek RP82 printer is connected and powered on</p>
            <p><strong>2.</strong> Verify the printer is installed in CUPS with: <code className="bg-gray-700 px-2 py-1 rounded">lpstat -p -d</code></p>
            <p><strong>3.</strong> Click "Test All Drivers" to find which driver works</p>
            <p><strong>4.</strong> If all fail, try "Test Raw Print" for basic ESC/POS test</p>
            <p><strong>5.</strong> Check your terminal/console for detailed logs</p>
          </div>
        </div>
      </div>
    </div>
  );
}