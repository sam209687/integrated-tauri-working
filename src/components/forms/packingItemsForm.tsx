// src/components/forms/packingItemsForm.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTransition, useState, useEffect } from "react";
import { toast } from 'sonner';

import { 
    createPackingMaterial,
    updatePackingMaterial, 
    deletePackingMaterial, 
    PackingMaterialWithBalance
} from "@/actions/packingMaterial.actions";
import { getUnits } from "@/actions/unit.actions"; 

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Trash2 } from "lucide-react"; 
import { PackingMaterialFormValues, PackingMaterialSchema } from "@/lib/schemas";

import { 
    AlertDialog, 
    AlertDialogAction, 
    AlertDialogCancel, 
    AlertDialogContent, 
    AlertDialogDescription, 
    AlertDialogFooter, 
    AlertDialogHeader, 
    AlertDialogTitle, 
    AlertDialogTrigger
} from "@/components/ui/alert-dialog";


// 💡 Define a reliable type for the populated Unit data for the dropdown
interface UnitOption {
    _id: string;
    name: string;
    code: string; 
}

// 💡 FIX: Define the expected structure of the raw unit data from getUnits
interface RawUnitData {
    _id: string; // Could be a mongoose ObjectId, but we treat it as string here for mapping
    name: string;
    code: string;
    // Include other necessary fields if they exist
}

interface PackingItemsFormProps {
  initialData?: PackingMaterialWithBalance | null;
}

export function PackingItemsForm({ initialData }: PackingItemsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false); 
  const [units, setUnits] = useState<UnitOption[]>([]);
  const router = useRouter();

  const isEditing = !!initialData;
  const balance = isEditing ? initialData.balance : 0;
  
  const form = useForm<PackingMaterialFormValues>({
    resolver: zodResolver(PackingMaterialSchema),
    defaultValues: {
      name: initialData?.name || "",
      capacityVolume: initialData?.capacityVolume || 0,
      capacityUnit: initialData?.capacityUnit?._id.toString() || "",
      manufacturerName: initialData?.manufacturerName || "",
      purchasedQuantity: initialData?.purchasedQuantity || 0,
      stockAlertQuantity: initialData?.stockAlertQuantity || 0,
    },
  });

  // Fetch units on mount
  useEffect(() => {
    const fetchUnits = async () => {
        try {
            const result = await getUnits(); 
            if (result.success && result.data) {
                // 💡 FIX: Used RawUnitData type instead of 'any'
                setUnits(result.data.map((u: RawUnitData) => ({ 
                    _id: u._id.toString(),
                    name: u.name,
                    code: u.code,
                }))); // Removed redundant 'as UnitOption[]' cast 
            } else {
                toast.error("Failed to load units for dropdown.");
            }
        } catch (error) {
            console.error("Unit fetch error:", error);
            toast.error("An error occurred while loading units.");
        }
    };
    fetchUnits();
  }, []);

  // --- SUBMIT FUNCTION: Handles ADD and EDIT ---
  function onSubmit(values: PackingMaterialFormValues) {
    startTransition(async () => {
        const action = isEditing 
            ? updatePackingMaterial(initialData!._id.toString(), values)
            : createPackingMaterial(values);

        const result = await action;

        if (result.success) {
            toast.success(result.message || (isEditing ? "Material updated successfully!" : "Material created successfully!"));
            router.push("/admin/packingProds");
        } else {
            // Display form-level error message
            toast.error(result.message || "Operation failed.");
            // You might want to map field errors back to RHF here if your action returns them
        }
    });
  }
  
  // --- DELETE FUNCTION ---
  async function onDelete() {
    if (!initialData) return;
    
    setIsDeleting(true);
    const result = await deletePackingMaterial(initialData._id.toString());
    setIsDeleting(false);

    if (result.success) {
        toast.success(result.message || "Material deleted successfully!");
        router.push("/admin/packingProds");
    } else {
        toast.error(result.message || "Failed to delete material.");
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-gray-900 rounded-lg shadow-xl border border-gray-700">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-white">
                {isEditing ? 'Edit Packing Material' : 'Add New Packing Material'}
            </h1>
            
            {/* Delete Button (Only visible in edit mode) */}
            {isEditing && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon" disabled={isPending || isDeleting}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-gray-800 text-white border-gray-700">
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription className="text-gray-400">
                                This action cannot be undone. This will permanently delete the 
                                material and remove its data from the server.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="bg-gray-700 border-gray-600 hover:bg-gray-600">Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={onDelete} 
                                className="bg-red-600 hover:bg-red-700"
                                disabled={isDeleting}
                            >
                                {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Continue Delete'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </div>

        {isEditing && (
            <div className="mb-4 p-3 bg-gray-800 rounded-md border border-gray-700">
                <p className="text-sm font-medium text-gray-300">Current Balance: <span className="font-bold text-lg text-blue-400">{balance}</span></p>
            </div>
        )}

        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                {/* 1. Name */}
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-gray-300">Material Name</FormLabel>
                            <FormControl>
                                <Input 
                                    className="bg-gray-800 text-white border-gray-600 focus:border-blue-500"
                                    placeholder="Plastic Bottle" 
                                    {...field} 
                                    disabled={isPending}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* 2. Manufacturer Name */}
                <FormField
                    control={form.control}
                    name="manufacturerName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-gray-300">Manufacturer Name</FormLabel>
                            <FormControl>
                                <Input 
                                    className="bg-gray-800 text-white border-gray-600 focus:border-blue-500"
                                    placeholder="PackCo" 
                                    {...field} 
                                    disabled={isPending}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* 3. Volume / Capacity */}
                    <FormField
                        control={form.control}
                        name="capacityVolume"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-gray-300">Capacity Volume</FormLabel>
                                <FormControl>
                                    <Input 
                                        type="number" 
                                        step="0.01"
                                        className="bg-gray-800 text-white border-gray-600 focus:border-blue-500"
                                        placeholder="500" 
                                        {...field} 
                                        onChange={e => field.onChange(parseFloat(e.target.value))}
                                        disabled={isPending}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    
                    {/* 4. Unit (Dropdown) */}
                    <FormField
                        control={form.control}
                        name="capacityUnit"
                        render={({ field }) => (
                        <FormItem className="md:col-span-2">
                            <FormLabel className="text-gray-300">Capacity Unit</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isPending}>
                            <FormControl className="bg-gray-800 text-white border-gray-600 focus:border-blue-500">
                                <SelectTrigger>
                                <SelectValue placeholder="Select unit" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-gray-700 text-white border-gray-600">
                                {units.map((unit) => (
                                <SelectItem key={unit._id.toString()} value={unit._id.toString()}>
                                    {unit.name} ({unit.code}) 
                                </SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 5. Purchased Quantity */}
                    <FormField
                        control={form.control}
                        name="purchasedQuantity"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-gray-300">Purchased Quantity</FormLabel>
                                <FormControl>
                                    <Input 
                                        type="number" 
                                        className="bg-gray-800 text-white border-gray-600 focus:border-blue-500"
                                        placeholder="1000" 
                                        {...field} 
                                        onChange={e => field.onChange(parseInt(e.target.value, 10))}
                                        disabled={isPending}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    
                    {/* 6. Stock Alert Quantity */}
                    <FormField
                        control={form.control}
                        name="stockAlertQuantity"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-gray-300">Stock Alert Quantity</FormLabel>
                                <FormControl>
                                    <Input 
                                        type="number" 
                                        className="bg-gray-800 text-white border-gray-600 focus:border-blue-500"
                                        placeholder="10" 
                                        {...field} 
                                        onChange={e => field.onChange(parseInt(e.target.value, 10))}
                                        disabled={isPending}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <Button 
                    type="submit" 
                    disabled={isPending || isDeleting}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
                >
                    {isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        isEditing ? 'Save Changes' : 'Create Material'
                    )}
                </Button>
            </form>
        </Form>
    </div>
  );
}