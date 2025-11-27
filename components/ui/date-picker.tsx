"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface DatePickerProps {
  date?: Date
  selected?: Date
  onSelect: (date: Date | undefined) => void
  disabled?: (date: Date) => boolean
}

export function DatePicker({ date, selected, onSelect, disabled }: DatePickerProps) {
  // Support both 'date' and 'selected' props for compatibility
  const selectedDate = date || selected;
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen(true);
          }}
          className={cn(
            "w-full justify-start text-left font-normal",
            !selectedDate && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            onSelect(date);
            setOpen(false);
          }}
          disabled={disabled}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
