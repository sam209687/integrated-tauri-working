"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Users, Calendar, Phone, MapPin, TrendingUp } from 'lucide-react';
import { useState } from 'react';

// Mock type for demo - replace with your actual type
interface CustomerTableData {
  _id: string;
  name: string;
  date: string;
  phone: string;
  address: string;
}

interface CustomerDetailsTableProps {
  data: CustomerTableData[];
  totalCustomerCount: number;
  isLoading: boolean;
}

export function CustomerDetailsTable({ data, totalCustomerCount, isLoading }: CustomerDetailsTableProps) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  // Loading state with glassmorphism
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative group"
      >
        <motion.div
          className="absolute inset-0 rounded-3xl blur-xl opacity-50"
          style={{ background: 'rgba(59, 130, 246, 0.3)' }}
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <Card className="relative backdrop-blur-2xl dark:bg-white/10 bg-white/70 dark:border-white/20 border-white/50 border rounded-3xl shadow-2xl h-full flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 className="h-12 w-12 text-blue-500" />
            </motion.div>
            <motion.p
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-lg font-medium dark:text-white text-gray-900"
            >
              Loading Customer Data...
            </motion.p>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.8 }}
      className="h-full relative group"
    >
      {/* Glow Effect */}
      <motion.div
        className="absolute inset-0 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: 'rgba(99, 102, 241, 0.3)' }}
      />

      <Card className="relative backdrop-blur-2xl dark:bg-white/10 bg-white/70 dark:border-white/20 border-white/50 border rounded-3xl shadow-2xl overflow-hidden h-full">
        {/* Animated Background */}
        <motion.div
          className="absolute inset-0 bg-linearto-br dark:from-indigo-500/10 dark:to-purple-500/10 from-indigo-100 to-purple-100 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />

        {/* Shimmer Effect */}
        <motion.div
          className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 5 }}
        />

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="p-2 rounded-xl bg-linearto-br from-indigo-500 to-purple-500 shadow-lg"
                >
                  <Users className="h-5 w-5 text-white" />
                </motion.div>
                <div>
                  <CardTitle className="text-xl font-bold dark:text-white text-gray-900">
                    Customer Details
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                    <p className="text-sm dark:text-gray-400 text-gray-500">
                      Total Customers: <span className="font-bold dark:text-white text-gray-900">{totalCustomerCount.toLocaleString()}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats Badge */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
                className="px-4 py-2 rounded-xl dark:bg-white/10 bg-gray-100"
              >
                <div className="text-2xl font-bold dark:text-white text-gray-900">
                  {data.length}
                </div>
                <div className="text-xs dark:text-gray-400 text-gray-500">
                  New Customers
                </div>
              </motion.div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-hidden">
            <div className="overflow-x-auto overflow-y-auto max-h-[400px] rounded-2xl dark:bg-white/5 bg-gray-50/50 backdrop-blur-sm border dark:border-white/10 border-gray-200">
              <Table>
                <TableHeader className="sticky top-0 z-10 dark:bg-gray-900/95 bg-white/95 backdrop-blur-md">
                  <TableRow className="border-b dark:border-gray-700 border-gray-300">
                    <TableHead className="dark:text-gray-300 text-gray-700 font-bold">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-indigo-500" />
                        Name
                      </div>
                    </TableHead>
                    <TableHead className="dark:text-gray-300 text-gray-700 font-bold">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-500" />
                        Date
                      </div>
                    </TableHead>
                    <TableHead className="dark:text-gray-300 text-gray-700 font-bold">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-green-500" />
                        Mobile
                      </div>
                    </TableHead>
                    <TableHead className="dark:text-gray-300 text-gray-700 font-bold">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-red-500" />
                        Address
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {data.length > 0 ? (
                      data.map((customer, index) => (
                        <motion.tr
                          key={customer._id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: index * 0.05 }}
                          onMouseEnter={() => setHoveredRow(customer._id)}
                          onMouseLeave={() => setHoveredRow(null)}
                          className={`border-b dark:border-gray-800 border-gray-200 transition-all duration-300 ${
                            hoveredRow === customer._id
                              ? 'dark:bg-white/10 bg-indigo-50 scale-[1.01]'
                              : 'dark:bg-transparent bg-transparent'
                          }`}
                        >
                          <TableCell className="font-medium dark:text-white text-gray-900">
                            <motion.div
                              animate={hoveredRow === customer._id ? { x: 5 } : { x: 0 }}
                              className="flex items-center gap-2"
                            >
                              <div className="w-8 h-8 rounded-full bg-linearto-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                                {customer.name.charAt(0).toUpperCase()}
                              </div>
                              {customer.name}
                            </motion.div>
                          </TableCell>
                          <TableCell className="dark:text-gray-300 text-gray-600">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 bg-blue-500 rounded-full" />
                              {customer.date}
                            </div>
                          </TableCell>
                          <TableCell className="dark:text-gray-300 text-gray-600">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 bg-green-500 rounded-full" />
                              {customer.phone}
                            </div>
                          </TableCell>
                          <TableCell className="dark:text-gray-300 text-gray-600">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 bg-red-500 rounded-full" />
                              <span className="truncate max-w-[200px]" title={customer.address}>
                                {customer.address}
                              </span>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ))
                    ) : (
                      <motion.tr
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <TableCell colSpan={4} className="text-center py-12">
                          <motion.div
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            className="flex flex-col items-center gap-4"
                          >
                            <div className="p-4 rounded-full dark:bg-white/5 bg-gray-100">
                              <Users className="h-12 w-12 dark:text-gray-600 text-gray-400" />
                            </div>
                            <div>
                              <p className="text-lg font-semibold dark:text-gray-400 text-gray-600">
                                No new customers found
                              </p>
                              <p className="text-sm dark:text-gray-500 text-gray-400 mt-1">
                                New customer data will appear here
                              </p>
                            </div>
                          </motion.div>
                        </TableCell>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>

            {/* Footer Stats */}
            {data.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mt-4 flex items-center justify-between text-xs dark:text-gray-400 text-gray-500"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Showing {data.length} recent customers
                </div>
                <div className="px-3 py-1 rounded-lg dark:bg-white/5 bg-gray-100">
                  Updated just now
                </div>
              </motion.div>
            )}
          </CardContent>
        </div>

        {/* Corner Decorations */}
        <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-linear-to-br from-indigo-500 to-purple-500 opacity-20 rounded-full blur-3xl" />
        <div className="absolute -top-8 -left-8 w-32 h-32 bg-linear-to-br from-indigo-500 to-purple-500 opacity-20 rounded-full blur-3xl" />
      </Card>
    </motion.div>
  );
}