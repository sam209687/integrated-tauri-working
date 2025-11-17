// src/components/adminPanel/memoEvent.tsx
"use client";

import * as React from "react";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type MemoEventDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  date: Date | null;
  eventName: string;
  hasEvent: boolean;
  onSave: (newEventName: string) => void;
  onDelete: () => void;
};

export function MemoEventDialog({
  isOpen,
  onOpenChange,
  date,
  eventName,
  hasEvent,
  onSave,
  onDelete,
}: MemoEventDialogProps) {
  const [currentEventName, setCurrentEventName] = React.useState("");

  React.useEffect(() => {
    if (isOpen) {
      setCurrentEventName(eventName);
    }
  }, [isOpen, eventName]);

  const handleSaveClick = () => {
    onSave(currentEventName);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Event for {date ? format(date, "PPP") : ""}</DialogTitle>
          <DialogDescription>
            Add, edit, or delete the event for this day. Click save when **you&apos;re**
            done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="event-name" className="text-right">
              Event
            </Label>
            <Input
              id="event-name"
              value={currentEventName}
              onChange={(e) => setCurrentEventName(e.target.value)}
              className="col-span-3"
              placeholder="e.g., Doctor&apos;s Appointment"
            />
          </div>
        </div>
        <DialogFooter className="sm:justify-between">
          {hasEvent ? (
            <Button type="button" variant="destructive" onClick={onDelete}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
          ) : (
            <div></div>
          )}
          <Button type="submit" onClick={handleSaveClick}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}