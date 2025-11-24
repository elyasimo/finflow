"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { Popover } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface DateRange {
  from: Date;
  to: Date;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  disabled?: boolean;
  className?: string;
}

export function DateRangePicker({ value, onChange, disabled, className }: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const handleSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (range?.from && range?.to) {
      onChange({ from: range.from, to: range.to });
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <Button
          variant="outline"
          className={className}
          disabled={disabled}
          aria-label="Select date range"
        >
          {value.from && value.to
            ? `${format(value.from, "MMM dd, yyyy")} - ${format(value.to, "MMM dd, yyyy")}`
            : "Pick a date range"}
        </Button>
      </Popover.Trigger>
      <Popover.Content align="start" className="p-0" sideOffset={8}>
        <DayPicker
          mode="range"
          selected={{ from: value.from, to: value.to }}
          onSelect={handleSelect}
          numberOfMonths={2}
          pagedNavigation
          disabled={disabled}
          className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-4"
          classNames={{
            months: "flex flex-col md:flex-row gap-4",
            caption: "flex justify-center mb-2",
            table: "w-full border-collapse",
            head_row: "flex",
            row: "flex",
            cell: "w-9 h-9 text-center rounded hover:bg-accent focus:bg-accent cursor-pointer",
            day_selected: "bg-primary text-white",
            day_range_start: "bg-primary text-white rounded-l-full",
            day_range_end: "bg-primary text-white rounded-r-full",
            day_range_middle: "bg-primary/20 text-primary",
          }}
        />
      </Popover.Content>
    </Popover>
  );
} 