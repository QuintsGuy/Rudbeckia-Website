import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { SupabaseService } from '../../../services/supabase.service';
import { Router } from '@angular/router';
import { ToastService } from '../../../services/toast.service';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-manage-payments',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './manage-payments.component.html',
  styleUrl: './manage-payments.component.css'
})
export class ManagePaymentsComponent implements OnInit {
  invoices: any[] = [];
  targetInvoice: any = null;
  lineItems: any[] = [];
  editableLineItems: any[] = [];
  editingItems: boolean = false;
  installments: any[] = [];
  editableInstallments: any[] = [];
  editingInstallments: boolean = false;
  loading: boolean = true;
  actionLoading: boolean = false;
  invoiceModal: boolean = false;
  installmentModal: boolean = false;

  subtotal: any = null
  tax: any = null;
  total: any = null;

  user: any;
  currentPage: number = 1;
  pageSize: number = 10;
  totalRecords: number = 0;

  constructor(
    private supabase: SupabaseService,
    private router: Router,
    private toast: ToastService
  ) {}

  async ngOnInit(): Promise<void> {
    const session = await this.supabase.getClient().auth.getSession();
    this.user = session.data.session?.user;

    if(!this.user) {
      this.router.navigate(['/']);
      return;
    }

    await this.fetchInvoices();
  }

  async fetchInvoices() {
    this.loading = true;
    
    const from = (this.currentPage - 1) * this.pageSize;
    const to = from + this.pageSize - 1;

    const { data: invoicesData, count, error: fetchError } = await this.supabase.getClient()
      .from('invoices')
      .select(`*, installments:installments (*), event:events (*, client:clients (*))`)
      .order('created_at', {ascending: false})
      .range(from, to);
    
    if (fetchError) {
      console.error('Failed to load invoices: ', fetchError.message);
      this.toast.showToast('Failed to load invoices', 'error');
    } else {
      this.invoices = invoicesData?.map(invoice => ({
        ...invoice,
        isExpanded: false,
      })) || [];
      this.totalRecords = count || 0;
    }
    this.loading = false;
  }

  toggleExpand(invoice: any) {
    invoice.expanded = !invoice.expanded;

    if (invoice.expanded && invoice.installments?.length) {
      invoice.installments = [...invoice.installments].sort((a, b) => {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime(); // ascending
      });
    }
  }

  async fetchLineItems(invoice_id: string): Promise<void> {
    this.loading = true;

    const { data: itemsData, error: fetchError } = await this.supabase.getClient()
      .from('invoice_line_items')
      .select('*')
      .eq('invoice_id', invoice_id);
    
    if (fetchError) {
      console.error('Failed to fetch line items: ', fetchError.message);
      this.toast.showToast('Failed to fetch line items', 'error');
    } 

    this.lineItems = itemsData ?? [];
    this.loading = false;
  }

  openInvoiceModal(invoice: any) {
    this.targetInvoice = invoice;
    this.invoiceModal = true;
    this.editingItems = false;
    this.fetchLineItems(this.targetInvoice.invoice_id);
  }

  async closeInvoiceModal() {
    this.targetInvoice = null;
    this.invoiceModal = false;
    this.lineItems = [];
    this.editableLineItems = [];
    this.editingItems = false;
    this.subtotal = null;
    this.tax = null;
    this.total = null;
  }

  startItemsEdit() {
    this.editableLineItems = this.lineItems.map(item => ({ ...item }));
    this.editingItems = true;
  }

  cancelItemsEdit() {
    this.editingItems = false;
  }

  addItem() {
    this.editableLineItems.push({ description: '', quantity: 1, rate: 0 });
  }

  removeItem(index: number) {
    this.editableLineItems.splice(index, 1);
  }

  getInvoiceSubtotal(): number {
    return this.editableLineItems.reduce((sum, item) => {
      const qty = item.quantity ?? 0;
      const price = item.unit_price ?? 0;
      this.subtotal = sum + qty * price;
      return this.subtotal;
    }, 0);
  }

  calculatedTax(): number {
    this.tax = this.subtotal * 0.07;
    return this.tax;
  }

  calculateTotal(): number {
    this.total = this.tax + this.subtotal;
    return this.total;
  }

  updateItemValue(item: any, field: string, event: Event) {
  const input = event.target as HTMLInputElement;
  if (field === 'amount' || field === 'unit_price') {
    // Remove dollar signs, commas, etc., and convert to number
    const numericValue = parseFloat(input.value.replace(/[^0-9.]/g, ''));
    item[field] = isNaN(numericValue) ? 0 : numericValue;
  } else {
    item[field] = input.value;
  }
}

  async saveItemChanges(): Promise<void> {
    if (!this.targetInvoice?.invoice_id) {
      this.toast.showToast('No active invoice selected', 'error');
      return;
    }

    try {
      this.loading = true;

      const invoiceId = this.targetInvoice.invoice_id;
      const existingIds = this.lineItems.map(i => i.line_item_id);
      const currentIds = this.editableLineItems
        .filter(i => !!i.line_item_id)
        .map(i => i.line_item_id);

      const deletedIds = existingIds.filter(id => !currentIds.includes(id));

      if (deletedIds.length > 0) {
        const { error: deleteError } = await this.supabase.getClient()
          .from('installments')
          .delete()
          .in('installment_id', deletedIds);

        if (deleteError) {
          this.toast.showToast('Failed to delete removed line items', 'error');
          console.error('Error deleting line items: ', deleteError);
          this.loading = false;
          return;
        }
      }

      const newItems = this.editableLineItems.map(item => ({
        line_item_id: item.line_item_id || uuidv4(),
        invoice_id: invoiceId,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.quantity * item.unit_price
      }));

      const { error: insertError } = await this.supabase.getClient()
        .from('invoice_line_items')
        .upsert(newItems, {
          onConflict: 'line_item_id'
        });
        
      if (insertError) {
        this.toast.showToast('Failed to save line items.', 'error');
        console.error(insertError);
        this.loading = false;
        return;
      }

      // Step 3: Update local state
      this.lineItems = [...this.editableLineItems];
      this.editingItems = false;
      this.toast.showToast('Invoice items updated successfully!', 'success');
    } catch (err) {
      console.error('Unexpected error saving items: ', err);
      this.toast.showToast('Something went wrong while saving', 'error');
    } finally {
      this.loading = false;
    }

    await this.closeInvoiceModal();
    await this.fetchInvoices();
  }

  openInstallmentsModal(invoice: any) {
    this.targetInvoice = invoice;
    this.installmentModal = true;
    this.editingInstallments = false;
    this.fetchInstallments(this.targetInvoice.invoice_id);
  }

  async fetchInstallments(invoice_id: string): Promise<void> {
    this.loading = true;

    const { data: installmentsData, error: fetchError } = await this.supabase.getClient()
      .from('installments')
      .select('*')
      .eq('invoice_id', invoice_id)
      .order('due_date', {ascending: true});
    
    if (fetchError) {
      console.error('Failed to fetch installments: ', fetchError.message);
      this.toast.showToast('Failed to fetch installments', 'error');
    } 

    this.installments = installmentsData ?? [];
    this.loading = false;
  }

  async closeInstallmentsModal() {
    this.targetInvoice = null;
    this.installmentModal = false;
    this.installments = [];
    this.editableInstallments = [];
    this.editingInstallments = false;
  }

  startInstallmentsEdit() {
    this.editableInstallments = this.installments.map(installment => ({ ...installment }));
    this.editingInstallments = true;
  }

  cancelInstallmentsEdit() {
    this.editingInstallments = false;
  }

  addInstallment() {
    this.editableInstallments.push({ description: '', due_date: 1, amount: 0, status: 'scheduled' });
  }

  removeInstallment(index: number) {
    this.editableInstallments.splice(index, 1);
  }

  getInstallmentTotal(): number {
    return this.editableInstallments.reduce((sum, installment) => {
      return sum + parseFloat(installment.amount ?? 0);
    }, 0);
  }

  getRemainingAmount(): number {
    return Math.round((this.targetInvoice.total - this.getInstallmentTotal()));
  }

  isInstallmentValid(installment: any): boolean {
    if (installment.status === 'paid') return true; // skip validation for paid

    return (
      installment.description?.trim() &&
      installment.amount !== null &&
      installment.amount !== '' &&
      !isNaN(parseFloat(installment.amount)) &&
      installment.due_date &&
      installment.status
    );
  }

  areAllInstallmentsValid(): boolean {
    return this.editableInstallments.every(this.isInstallmentValid);
  }

  async saveInstallmentChanges(): Promise<void> {
    if (!this.targetInvoice?.invoice_id) {
      this.toast.showToast('No active invoice selected', 'error');
      return;
    }

    try {
      this.loading = true;

      const invoiceId = this.targetInvoice.invoice_id;
      const clientId = this.targetInvoice.event.client_id;
      const existingIds = this.installments.map(i => i.installment_id);
      const currentIds = this.editableInstallments
        .filter(i => !!i.installment_id)
        .map(i => i.installment_id);

      const deletedIds = existingIds.filter(id => !currentIds.includes(id));

      if (deletedIds.length > 0) {
        const { error: deleteError } = await this.supabase.getClient()
          .from('installments')
          .delete()
          .in('installment_id', deletedIds);

        if (deleteError) {
          this.toast.showToast('Failed to delete removed installments', 'error');
          console.error(deleteError);
          this.loading = false;
          return;
        }
      }

      const newInstallments = this.editableInstallments.map(installment => ({
        installment_id: installment.installment_id || uuidv4(),
        invoice_id: invoiceId,
        client_id: clientId,
        description: installment.description,
        amount: installment.amount,
        due_date: installment.due_date,
        status: installment.status
      }));

      const { error: insertError } = await this.supabase.getClient()
        .from('installments')
        .upsert(newInstallments, {
          onConflict: 'installment_id'
        });

      if (insertError) {
        this.toast.showToast('Failed to save installments.', 'error');
        console.error(insertError);
        this.loading = false;
        return;
      }

      // Step 3: Update local state
      this.installments = [...this.editableInstallments];
      this.editingInstallments = false;
      this.toast.showToast('Invoice installments updated successfully!', 'success');
    } catch (err) {
      console.error('Unexpected error saving installment: ', err);
      this.toast.showToast('Something went wrong while saving', 'error');
    } finally {
      this.loading = false;
    }

    await this.closeInstallmentsModal();
    await this.fetchInvoices();
  }
}
