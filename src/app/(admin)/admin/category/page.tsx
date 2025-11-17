import { CategoryTable } from "@/components/tables/CategoryTable";
import { ICategory } from "@/lib/models/category";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

export const dynamic = 'force-dynamic';

async function getCategories(): Promise<ICategory[]> {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/category`, {
        cache: "no-store",
    });

    if (!res.ok) {
        throw new Error("Failed to fetch categories.");
    }

    return res.json();
}

export default async function CategoryPage() {
    const categories = await getCategories();

    return (

        <div className="flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
                <Button asChild>
                    <Link href="/admin/category/add-category">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Category
                    </Link>
                </Button>
            </div>
            <CategoryTable initialCategories={categories} />
        
            </div>
        </div>
        
    );
}