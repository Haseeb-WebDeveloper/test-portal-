"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Filter, ArrowUpDown, ArrowUp, ArrowDown, Search } from "lucide-react";

export type SortOption = 'name' | 'lastActivity';
export type SortOrder = 'asc' | 'desc';

interface ClientsSortFilterProps {
  sortBy: SortOption;
  sortOrder: SortOrder;
  search: string;
  onSortChange: (sortBy: SortOption, sortOrder: SortOrder) => void;
  onSearchChange: (search: string) => void;
  onFiltersClick: () => void;
}

export const ClientsSortFilter = memo(function ClientsSortFilter({
  sortBy,
  sortOrder,
  search,
  onSortChange,
  onSearchChange,
  onFiltersClick,
}: ClientsSortFilterProps) {
  const sortOptions = [
    { value: 'name' as const, label: 'Alphabetical (A-Z)' },
    { value: 'lastActivity' as const, label: 'Last Checked' },
  ];

  const handleSortChange = (newSortBy: SortOption) => {
    if (newSortBy === sortBy) {
      // Toggle order if same sort option
      onSortChange(newSortBy, sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Default to ascending for new sort option
      onSortChange(newSortBy, 'asc');
    }
  };

  const getSortIcon = () => {
    if (sortOrder === 'asc') return <ArrowUp className="w-4 h-4" />;
    return <ArrowDown className="w-4 h-4" />;
  };

  const getCurrentSortLabel = () => {
    const option = sortOptions.find(opt => opt.value === sortBy);
    return option?.label || 'Sort by';
  };

  return (
    <div className="flex items-center gap-3">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search clients..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 w-64 border-primary/40 focus:border-primary"
        />
      </div>

      {/* Sort Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="border-primary/40 hover:bg-primary/10"
          >
            <ArrowUpDown className="w-4 h-4 mr-2" />
            {getCurrentSortLabel()}
            {getSortIcon()}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {sortOptions.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => handleSortChange(option.value)}
              className="flex items-center justify-between"
            >
              <span>{option.label}</span>
              {sortBy === option.value && getSortIcon()}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Filters Button */}
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onFiltersClick}
        className="border-primary/40 hover:bg-primary/10"
      >
        <Filter className="w-4 h-4 mr-2" />
        Filters
      </Button>
    </div>
  );
});
