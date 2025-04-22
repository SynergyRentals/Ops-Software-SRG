import { useState } from 'react';
import { useScheduleSuggestions } from '@/hooks/use-maintenance';
import { useProperties } from '@/hooks/use-properties';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wand2 } from 'lucide-react';

interface AISchedulerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AISchedulerDialog({ open, onOpenChange }: AISchedulerDialogProps) {
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const { data: properties, isLoading: propertiesLoading } = useProperties();
  const suggestSchedule = useScheduleSuggestions();
  
  const handlePropertyChange = (value: string) => {
    setSelectedPropertyId(Number(value));
  };
  
  const handleGenerateSuggestions = () => {
    if (selectedPropertyId) {
      suggestSchedule.mutate({ propertyId: selectedPropertyId });
      onOpenChange(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>AI Schedule Suggestions</DialogTitle>
          <DialogDescription>
            Let our AI generate a maintenance schedule based on property history and seasonal needs.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="property" className="text-right">
              Property
            </Label>
            <Select onValueChange={handlePropertyChange} disabled={propertiesLoading}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a property" />
              </SelectTrigger>
              <SelectContent>
                {properties?.map(property => (
                  <SelectItem key={property.id} value={property.id.toString()}>
                    {property.nickname}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            onClick={handleGenerateSuggestions} 
            disabled={!selectedPropertyId || suggestSchedule.isPending}
          >
            <Wand2 className="mr-2 h-4 w-4" />
            {suggestSchedule.isPending ? 'Generating...' : 'Generate Suggestions'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}