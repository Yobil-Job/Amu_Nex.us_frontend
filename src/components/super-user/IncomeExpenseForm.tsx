import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpCircle, ArrowDownCircle, Loader2, Calendar, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface IncomeExpenseFormProps {
  clubId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  events?: any[]; // For linking expenses to events
}

// Client-side storage for income/expense records (mock)
const STORAGE_KEY = 'club_finance_records';

export const saveFinanceRecord = (record: any) => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const allRecords = stored ? JSON.parse(stored) : [];
    allRecords.push({
      ...record,
      id: Date.now(),
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allRecords));
  } catch (error) {
    console.error('Failed to save finance record:', error);
  }
};

export const loadFinanceRecords = (clubId: number): any[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const allRecords = JSON.parse(stored);
    return allRecords.filter((r: any) => r.clubId === clubId);
  } catch {
    return [];
  }
};

const IncomeExpenseForm = ({ clubId, isOpen, onClose, onSuccess, events = [] }: IncomeExpenseFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    eventId: '',
    receiptNumber: '',
    notes: '',
  });

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setType('income');
    setFormData({
      amount: '',
      description: '',
      category: type === 'income' ? 'MEMBERSHIP_FEES' : 'EVENT_COSTS',
      date: new Date().toISOString().split('T')[0],
      eventId: '',
      receiptNumber: '',
      notes: '',
    });
  };

  const handleSubmit = async () => {
    // Validate
    if (!formData.amount || !formData.description || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount greater than 0');
      return;
    }

    setIsSubmitting(true);
    try {
      // Save to localStorage (mock)
      saveFinanceRecord({
        clubId,
        type,
        amount: type === 'income' ? amount : -amount, // Negative for expenses
        description: formData.description,
        category: formData.category,
        date: formData.date,
        eventId: formData.eventId || null,
        receiptNumber: formData.receiptNumber || null,
        notes: formData.notes || null,
      });

      toast.success(`${type === 'income' ? 'Income' : 'Expense'} recorded successfully`);
      resetForm();
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || `Failed to record ${type}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const incomeCategories = [
    { value: 'MEMBERSHIP_FEES', label: 'Membership Fees' },
    { value: 'DONATIONS', label: 'Donations' },
    { value: 'EVENT_REVENUE', label: 'Event Revenue' },
    { value: 'SPONSORSHIPS', label: 'Sponsorships' },
    { value: 'OTHER', label: 'Other Income' },
  ];

  const expenseCategories = [
    { value: 'EVENT_COSTS', label: 'Event Costs' },
    { value: 'VENUE_RENTAL', label: 'Venue Rental' },
    { value: 'CATERING', label: 'Catering' },
    { value: 'MATERIALS', label: 'Materials & Supplies' },
    { value: 'MARKETING', label: 'Marketing & Promotion' },
    { value: 'TRANSPORTATION', label: 'Transportation' },
    { value: 'UTILITIES', label: 'Utilities' },
    { value: 'OTHER', label: 'Other Expenses' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="glass-card border-primary/20 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl neon-text text-white flex items-center gap-2">
            {type === 'income' ? (
              <ArrowUpCircle className="h-5 w-5 text-success" />
            ) : (
              <ArrowDownCircle className="h-5 w-5 text-destructive" />
            )}
            Record {type === 'income' ? 'Income' : 'Expense'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Record a new {type === 'income' ? 'income' : 'expense'} for your club
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Type Selector */}
          <div className="space-y-2">
            <Label className="text-white">Transaction Type</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={type === 'income' ? 'default' : 'outline'}
                onClick={() => {
                  setType('income');
                  setFormData({ ...formData, category: 'MEMBERSHIP_FEES' });
                }}
                className="flex-1 gap-2"
              >
                <ArrowUpCircle className="h-4 w-4" />
                Income
              </Button>
              <Button
                type="button"
                variant={type === 'expense' ? 'default' : 'outline'}
                onClick={() => {
                  setType('expense');
                  setFormData({ ...formData, category: 'EVENT_COSTS' });
                }}
                className="flex-1 gap-2"
              >
                <ArrowDownCircle className="h-4 w-4" />
                Expense
              </Button>
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-white">
              Amount (ETB) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="glass-card border-primary/20"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-white">
              Description <span className="text-destructive">*</span>
            </Label>
            <Input
              id="description"
              placeholder="Enter a brief description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="glass-card border-primary/20"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category" className="text-white">
              Category <span className="text-destructive">*</span>
            </Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger id="category" className="glass-card border-primary/20">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {(type === 'income' ? incomeCategories : expenseCategories).map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date" className="text-white flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="glass-card border-primary/20"
            />
          </div>

          {/* Link to Event (for expenses) */}
          {type === 'expense' && events.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="eventId" className="text-white">
                Link to Event (Optional)
              </Label>
              <Select value={formData.eventId} onValueChange={(value) => setFormData({ ...formData, eventId: value })}>
                <SelectTrigger id="eventId" className="glass-card border-primary/20">
                  <SelectValue placeholder="Select an event (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id.toString()}>
                      {event.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Receipt Number */}
          <div className="space-y-2">
            <Label htmlFor="receiptNumber" className="text-white flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Receipt Number (Optional)
            </Label>
            <Input
              id="receiptNumber"
              placeholder="Enter receipt number"
              value={formData.receiptNumber}
              onChange={(e) => setFormData({ ...formData, receiptNumber: e.target.value })}
              className="glass-card border-primary/20"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-white">
              Additional Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes or remarks"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="glass-card border-primary/20 min-h-[80px]"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.amount || !formData.description || !formData.category}
            className={`gap-2 ${type === 'income' ? 'bg-success hover:bg-success/90' : 'bg-destructive hover:bg-destructive/90'}`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Recording...
              </>
            ) : (
              <>
                {type === 'income' ? (
                  <ArrowUpCircle className="h-4 w-4" />
                ) : (
                  <ArrowDownCircle className="h-4 w-4" />
                )}
                Record {type === 'income' ? 'Income' : 'Expense'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default IncomeExpenseForm;

