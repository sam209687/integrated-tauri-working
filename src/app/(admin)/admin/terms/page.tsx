// src/app/(admin)/admin/terms/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner"; // ✅ Using Sonner instead of deprecated useToast
import { Loader2, Save, FileText, Trash2, CheckCircle } from "lucide-react";
import {
  getAllTerms,
  createTerms,
  updateTerms,
  deleteTerms,
  setActiveTerms,
} from "@/actions/terms.actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Terms {
  _id: string;
  terms: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function TermsPage() {
  const [allTerms, setAllTerms] = useState<Terms[]>([]);
  const [currentTerms, setCurrentTerms] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchTerms = async () => {
    setIsFetching(true);
    const result = await getAllTerms();
    if (result.success && result.data) {
      setAllTerms(result.data);
    }
    setIsFetching(false);
  };

  useEffect(() => {
    fetchTerms();
  }, []);

  const handleSubmit = async () => {
    if (!currentTerms.trim()) {
      toast.error("Validation Error", {
        description: "Terms and conditions cannot be empty.",
      });
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append("terms", currentTerms);
    formData.append("isActive", isActive.toString());

    try {
      const result = editingId
        ? await updateTerms(editingId, formData)
        : await createTerms(formData);

      if (result.success) {
        toast.success("Success", {
          description: result.message,
        });
        setCurrentTerms("");
        setEditingId(null);
        setIsActive(true);
        fetchTerms();
      } else {
        toast.error("Error", {
          description: result.message || "Operation failed.",
        });
      }
    } catch (error) {
      toast.error("Error", {
        description: "An unexpected error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (terms: Terms) => {
    setCurrentTerms(terms.terms);
    setIsActive(terms.isActive);
    setEditingId(terms._id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsLoading(true);
    const result = await deleteTerms(deleteId);

    if (result.success) {
      toast.success("Success", {
        description: result.message,
      });
      fetchTerms();
    } else {
      toast.error("Error", {
        description: result.message || "Failed to delete terms.",
      });
    }

    setDeleteId(null);
    setIsLoading(false);
  };

  const handleSetActive = async (id: string) => {
    setIsLoading(true);
    const result = await setActiveTerms(id);

    if (result.success) {
      toast.success("Success", {
        description: result.message,
      });
      fetchTerms();
    } else {
      toast.error("Error", {
        description: result.message || "Failed to set active terms.",
      });
    }

    setIsLoading(false);
  };

  const handleCancel = () => {
    setCurrentTerms("");
    setEditingId(null);
    setIsActive(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Terms & Conditions</h1>
          <p className="text-muted-foreground mt-1">
            Manage your store's terms and conditions for invoices
          </p>
        </div>
        <FileText className="h-8 w-8 text-muted-foreground" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {editingId ? "Edit Terms & Conditions" : "Create New Terms & Conditions"}
          </CardTitle>
          <CardDescription>
            {editingId 
              ? "Update the existing terms and conditions" 
              : "Add new terms and conditions for your store"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="terms">Terms & Conditions Text</Label>
              <Textarea
                id="terms"
                placeholder="Enter your terms and conditions here. Write as continuous text - it will be printed as a justified paragraph on the invoice.&#10;&#10;Example: Any disputes will be subject to negotiation and, if unresolved, handled according to the legal jurisdiction specified by the store."
                value={currentTerms}
                onChange={(e) => setCurrentTerms(e.target.value)}
                rows={10}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                {currentTerms.length} / 5000 characters
              </p>
              
              {/* Live Preview */}
              {currentTerms.trim() && (
                <div className="border rounded-lg p-4 bg-muted/50 space-y-2">
                  <p className="text-xs font-semibold">Invoice Preview:</p>
                  <div className="border-t pt-2">
                    <p className="text-center font-bold text-xs mb-1">Terms & Conditions</p>
                    <p className="text-[10px] text-justify leading-tight">
                      {currentTerms}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="active" className="cursor-pointer">
                Set as active (will be shown on invoices)
              </Label>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSubmit} disabled={isLoading || !currentTerms.trim()}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {editingId ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {editingId ? "Update Terms" : "Create Terms"}
                  </>
                )}
              </Button>
              
              {editingId && (
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Terms & Conditions</CardTitle>
          <CardDescription>
            Manage your saved terms and conditions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isFetching ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : allTerms.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No terms and conditions found.</p>
              <p className="text-sm mt-2">Create your first one above.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {allTerms.map((terms) => (
                <div
                  key={terms._id}
                  className="border rounded-lg p-4 space-y-3 relative"
                >
                  {terms.isActive && (
                    <div className="absolute top-2 right-2">
                      <span className="flex items-center gap-1 text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                        <CheckCircle className="h-3 w-3" />
                        Active
                      </span>
                    </div>
                  )}

                  <div className="space-y-2 pr-20">
                    <div className="text-sm text-muted-foreground">
                      Created: {new Date(terms.createdAt).toLocaleDateString()}
                      {" • "}
                      Updated: {new Date(terms.updatedAt).toLocaleDateString()}
                    </div>
                    
                    <div className="bg-muted p-3 rounded-md">
                      <p className="text-sm whitespace-pre-wrap font-mono">
                        {terms.terms.substring(0, 200)}
                        {terms.terms.length > 200 && "..."}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(terms)}
                    >
                      Edit
                    </Button>
                    
                    {!terms.isActive && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleSetActive(terms._id)}
                        disabled={isLoading}
                      >
                        Set Active
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setDeleteId(terms._id)}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete these terms and conditions. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}