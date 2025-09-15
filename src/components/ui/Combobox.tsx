"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ComboboxProps<T> {
  placeholder?: string;
  onSearch?: (search: string) => void;
  onSelect?: (item: T) => void;
  items: T[];
  isLoading?: boolean;
  renderItem?: (item: T) => React.ReactNode;
  value?: T;
  className?: string;
  disabled?: boolean;
}

export function Combobox<T>({
  placeholder = "Select item...",
  onSearch,
  onSelect,
  items = [],
  isLoading = false,
  renderItem,
  value,
  className,
  disabled = false,
}: ComboboxProps<T>) {
  const [open, setOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");

  const handleSearch = (search: string) => {
    setSearchTerm(search);
    onSearch?.(search);
  };

  const handleSelect = (item: T) => {
    onSelect?.(item);
    setOpen(false);
  };

  const defaultRenderItem = (item: T) => (
    <div className="flex items-center space-x-2">
      <span>{String(item)}</span>
    </div>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          {value
            ? renderItem
              ? renderItem(value)
              : String(value)
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search..."
            value={searchTerm}
            onValueChange={handleSearch}
            className="h-9"
          />
          <CommandList>
            <CommandEmpty>
              {isLoading ? "Loading..." : "No items found."}
            </CommandEmpty>
            <CommandGroup>
              {items.map((item, index) => (
                <CommandItem
                  key={index}
                  value={String(item)}
                  onSelect={() => handleSelect(item)}
                  className="flex items-center space-x-2"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === item ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {renderItem ? renderItem(item) : String(item)}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
