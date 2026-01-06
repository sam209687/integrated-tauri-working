// app/admin/products/examples/page.tsx
// This is an OPTIONAL educational page to help understand selling types

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Calculator } from "lucide-react";

export default function SellingTypesExamplePage() {
  const router = useRouter();
  const [activeType, setActiveType] = useState<'WEIGHT' | 'VOLUME' | 'VALUE' | 'FIXED'>('WEIGHT');
  const [quantity, setQuantity] = useState('');
  const [basePrice, setBasePrice] = useState('370');

  const examples = {
    WEIGHT: {
      icon: '⚖️',
      title: 'Weight-Based Selling',
      description: 'Perfect for oils, grains, spices, vegetables',
      baseUnit: 'kg',
      product: 'Sesame Oil',
      color: 'bg-green-50 border-green-200',
      scenarios: [
        { input: '1 kg', calculation: '1 × ₹370 = ₹370' },
        { input: '100 g', calculation: '0.1 × ₹370 = ₹37' },
        { input: '250 g', calculation: '0.25 × ₹370 = ₹92.50' },
        { input: '500 g', calculation: '0.5 × ₹370 = ₹185' },
      ]
    },
    VOLUME: {
      icon: '🧪',
      title: 'Volume-Based Selling',
      description: 'Perfect for liquids, beverages, dairy',
      baseUnit: 'liter',
      product: 'Coconut Oil',
      color: 'bg-purple-50 border-purple-200',
      scenarios: [
        { input: '1 L', calculation: '1 × ₹370 = ₹370' },
        { input: '100 ml', calculation: '0.1 × ₹370 = ₹37' },
        { input: '500 ml', calculation: '0.5 × ₹370 = ₹185' },
        { input: '2 L', calculation: '2 × ₹370 = ₹740' },
      ]
    },
    VALUE: {
      icon: '💰',
      title: 'Value-Based Selling',
      description: 'Customer specifies amount to spend',
      baseUnit: 'rupees',
      product: 'Mixed Dry Fruits',
      color: 'bg-orange-50 border-orange-200',
      scenarios: [
        { input: '₹100', calculation: '₹100 ÷ 370 = 0.27 kg' },
        { input: '₹200', calculation: '₹200 ÷ 370 = 0.54 kg' },
        { input: '₹500', calculation: '₹500 ÷ 370 = 1.35 kg' },
        { input: '₹1000', calculation: '₹1000 ÷ 370 = 2.70 kg' },
      ]
    },
    FIXED: {
      icon: '📦',
      title: 'Fixed Quantity Selling',
      description: 'Pre-packaged products',
      baseUnit: 'pieces',
      product: 'Bottled Sesame Oil (1L)',
      color: 'bg-blue-50 border-blue-200',
      scenarios: [
        { input: '1 bottle', calculation: '1 × ₹370 = ₹370' },
        { input: '2 bottles', calculation: '2 × ₹370 = ₹740' },
        { input: '5 bottles', calculation: '5 × ₹370 = ₹1,850' },
        { input: '10 bottles', calculation: '10 × ₹370 = ₹3,700' },
      ]
    }
  };

  const calculateResult = () => {
    const qty = parseFloat(quantity);
    const price = parseFloat(basePrice);
    
    if (isNaN(qty) || isNaN(price)) return '—';
    
    if (activeType === 'VALUE') {
      return `${(qty / price).toFixed(2)} ${examples[activeType].baseUnit === 'rupees' ? 'kg' : examples[activeType].baseUnit}`;
    }
    
    return `₹${(qty * price).toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Selling Types Guide</h1>
            <p className="text-gray-600 mt-1">
              Understanding flexible quantity-based selling
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Button>
        </div>

        {/* Type Selector */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Object.entries(examples).map(([key, data]) => (
            <Card
              key={key}
              className={`cursor-pointer transition-all ${
                activeType === key
                  ? 'ring-2 ring-blue-500 shadow-lg scale-105'
                  : 'hover:shadow-md'
              }`}
              onClick={() => setActiveType(key as any)}
            >
              <CardHeader className="text-center pb-2">
                <div className="text-4xl mb-2">{data.icon}</div>
                <CardTitle className="text-sm">{key}</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Active Type Details */}
        <Card className={`border-2 ${examples[activeType].color}`}>
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="text-5xl">{examples[activeType].icon}</div>
              <div>
                <CardTitle className="text-2xl">{examples[activeType].title}</CardTitle>
                <CardDescription className="text-base mt-1">
                  {examples[activeType].description}
                </CardDescription>
                <p className="text-sm text-blue-600 font-medium mt-2">
                  Example: {examples[activeType].product} • Base: {examples[activeType].baseUnit}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Scenarios Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {examples[activeType].scenarios.map((scenario, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-white rounded-lg border"
                >
                  <div className="font-semibold text-sm text-gray-900 mb-1">
                    Customer: "{scenario.input}"
                  </div>
                  <div className="text-xs text-gray-600">
                    {scenario.calculation}
                  </div>
                </div>
              ))}
            </div>

            {/* Calculator */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Live Calculator
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {activeType === 'VALUE' ? 'Amount (₹)' : `Quantity (${examples[activeType].baseUnit})`}
                    </label>
                    <Input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder={activeType === 'VALUE' ? '100' : '1'}
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Base Price (₹/{examples[activeType].baseUnit})
                    </label>
                    <Input
                      type="number"
                      value={basePrice}
                      onChange={(e) => setBasePrice(e.target.value)}
                      placeholder="370"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {activeType === 'VALUE' ? 'Quantity Delivered' : 'Total Price'}
                    </label>
                    <div className="h-10 flex items-center px-4 bg-green-100 rounded-md border-2 border-green-500 font-bold text-green-900">
                      {calculateResult()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        {/* Implementation Guide */}
        <Card>
          <CardHeader>
            <CardTitle>Implementation Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-bold mb-2">✅ What This Enables</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Customer flexibility in purchase amounts</li>
                  <li>• Automatic price calculation</li>
                  <li>• Support for fractional quantities</li>
                  <li>• Value-based selling (₹100 worth)</li>
                  <li>• Both wholesale and retail operations</li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-2">🎯 Next Steps</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>1. Set selling type when creating products</li>
                  <li>2. Create variants with specific sizes/prices</li>
                  <li>3. POS will auto-calculate any quantity</li>
                  <li>4. Supports both fixed and loose sales</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}