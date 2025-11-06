import { LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type ViewMode = 'table' | 'cards';

interface ViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  className?: string;
}

const ViewToggle = ({ viewMode, onViewModeChange, className }: ViewToggleProps) => {
  return (
    <div className={cn('flex items-center gap-1 glass-card p-1 rounded-lg border border-primary/20', className)}>
      <Button
        variant={viewMode === 'table' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewModeChange('table')}
        className={cn(
          'h-8 px-3',
          viewMode === 'table'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-white'
        )}
      >
        <List className="h-4 w-4 mr-1" />
        <span className="hidden sm:inline">Table</span>
      </Button>
      <Button
        variant={viewMode === 'cards' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewModeChange('cards')}
        className={cn(
          'h-8 px-3',
          viewMode === 'cards'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-white'
        )}
      >
        <LayoutGrid className="h-4 w-4 mr-1" />
        <span className="hidden sm:inline">Cards</span>
      </Button>
    </div>
  );
};

export default ViewToggle;

