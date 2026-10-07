import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Supplier, SupplierService } from '../../../../services/supplier.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-suplier-form',
  templateUrl: './suplier-form.component.html',
  styleUrl: './suplier-form.component.css'
})
export class SuplierFormComponent implements OnInit {

  supplierForm: FormGroup;

  isEditMode = false;
  supplierId: string | null = null;
  errorMessage = '';
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private supplierService: SupplierService
  ) {
    // Create supplier form
    this.supplierForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      contact_email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern('^\\d{10}$')]],
      address: ['', Validators.maxLength(255)]
    });
  }

  ngOnInit(): void {

    // Get supplier ID from URL
    this.checkEditMode();
  }

  //edit mode check for supplier form
  checkEditMode(): void {

    const idParam = this.route.snapshot.paramMap.get('id');

    if (!idParam) {
      return;
    }

    this.isEditMode = true;
    this.supplierId = String(idParam);

    this.supplierService.getSupplierById(this.supplierId).subscribe({

      next: (supplier: Supplier) => {
        this.supplierForm.patchValue({
          name: supplier.name,
          contact_email: supplier.contact_email,
          phone: supplier.phone,
          address: supplier.address
        });

      },

      error: (error: HttpErrorResponse) => {

        console.error('Error loading supplier:', error);

        this.errorMessage = this.formatError(error);
      }

    });

  }

  // Format FastAPI errors into a readable message
  private formatError(error: HttpErrorResponse): string {
    const detail = (error.error as any)?.detail;

    if (typeof detail === 'string') {
      return `Error ${error.status}: ${detail}`;
    }

    if (Array.isArray(detail)) {
      return detail.map((d: any) => d.msg).join(', ');
    }

    return `Request failed (${error.status}). Please try again.`;
  }

  // Create data to send to API
  private buildPayload(): Omit<Supplier, 'id' | 'created_at'> {

    const formValue = this.supplierForm.value;

    return {
      name: formValue.name,
      contact_email: formValue.contact_email,
      phone: formValue.phone,
      address: formValue.address,
      description: undefined
    };

  }

  onSubmit(): void {

    // Check form validation
    if (this.supplierForm.invalid) {

      this.supplierForm.markAllAsTouched();

      return;
    }

    const payload = this.buildPayload();

    this.errorMessage = '';
    this.isLoading = true;

    // Update category
    if (this.isEditMode && this.supplierId) {

      this.supplierService
        .updateSupplier(this.supplierId, payload)
        .subscribe({

          next: () => {

            this.isLoading = false;

            this.router.navigate(['/suppliers']);

          },

          error: (error: HttpErrorResponse) => {

            this.isLoading = false;

            console.error('Error updating supplier:', error);

            this.errorMessage = this.formatError(error);

          }

        });

      return;
    }

    // Add supplier
    this.supplierService
      .addSupplier(payload)
      .subscribe({

        next: () => {

          this.isLoading = false;

          this.router.navigate(['/suppliers']);

        },

        error: (error: HttpErrorResponse) => {

          this.isLoading = false;

          console.error('Error adding supplier:', error);

          this.errorMessage = this.formatError(error);

        }

      });

  }

  // Go back to supplier list
  cancel(): void {

    this.supplierForm.reset({
      name: '',
      contact_email: '',
      phone: '',
      address: ''
    });

    this.router.navigate(['/suppliers']);

  }

}

