import { Component, OnInit, OnDestroy } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { ProductService } from '../../../../services/product.service';
import { CategoryService, Category } from '../../../../services/category.service';
import { SupplierService, Supplier } from '../../../../services/supplier.service';


// Validator: quantity / reorder level must be a whole number of 0 or more
export function nonNegativeInteger(control: AbstractControl): ValidationErrors | null {
  const value = control.value;

  if (value === null || value === '' || value === undefined) {
    return null;
  }

  const valid = Number.isInteger(Number(value)) && Number(value) >= 0;

  return valid ? null : { nonNegativeInteger: true };
}

@Component({
  selector: 'app-products-form',
  templateUrl: './products-form.component.html',
  styleUrl: './products-form.component.css'
})
export class ProductsFormComponent implements OnInit, OnDestroy {

  productForm!: FormGroup;

  categories: Category[] = [];
  suppliers: Supplier[] = [];

  submitting = false;
  errorMessage = '';

  editMode = false;
  productId: string | null = null;

  private categorySub?: Subscription;
  private supplierSub?: Subscription;


  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private productService: ProductService,
    private categoryService: CategoryService,
    private supplierService: SupplierService
  ) {

    this.productForm = this.fb.group({
      name: ['', Validators.required],
      sku: ['', Validators.required],
      category_id: [{ value: null, disabled: true }, Validators.required],
      category_name: ['', Validators.required],
      supplier_id: [{ value: null, disabled: true }, Validators.required],
      supplier_name: ['', Validators.required],
      unit_price: [null, [Validators.required, Validators.min(0)]],
      quantity_in_stock: [null, [Validators.required, nonNegativeInteger]],
      reorder_level: [null, [Validators.required, nonNegativeInteger]],
      description: [null]
    });

  }


  ngOnInit(): void {

    this.loadCategories();

    this.loadSuppliers();

    this.checkEditMode();

    this.watchCategorySelection();

    this.watchSupplierSelection();

  }


  // Auto-fill category_id when a category name is selected
  watchCategorySelection(): void {

    this.categorySub = this.productForm
      .get('category_name')!
      .valueChanges
      .subscribe((name: string) => {

        const category = this.categories.find(c => c.name === name);

        this.productForm.patchValue({
          category_id: category ? category.id : null
        });

      });

  }


  // Auto-fill supplier_id when a supplier name is selected
  watchSupplierSelection(): void {

    this.supplierSub = this.productForm
      .get('supplier_name')!
      .valueChanges
      .subscribe((name: string) => {

        const supplier = this.suppliers.find(s => s.name === name);

        this.productForm.patchValue({
          supplier_id: supplier ? supplier.id : null
        });

      });

  }


  // Load categories
  loadCategories(): void {

    this.categoryService.getAllCategories().subscribe({
      next: (data: Category[]) => {
        this.categories = data;
      },

      error: (error: HttpErrorResponse) => {
        console.error('Error loading categories:', error);
      }
    });

  }


  // Load suppliers
  loadSuppliers(): void {

    this.supplierService.getAllSuppliers().subscribe({
      next: (data: Supplier[]) => {
        this.suppliers = data;
      },

      error: (error: HttpErrorResponse) => {
        console.error('Error loading suppliers:', error);
      }
    });

  }


  // Check whether we are adding or editing
  checkEditMode(): void {

    const idParam = this.route.snapshot.paramMap.get('id');

    if (!idParam) {
      return;
    }

    this.editMode = true;
    this.productId = idParam;

    //calls getProducts by id 

    this.productService.getProductById(this.productId).subscribe({

      next: (product) => {

        const category = this.categories.find(c => c.id === product.category_id);
        const supplier = this.suppliers.find(s => s.id === product.supplier_id);

        this.productForm.patchValue({
          name: product.name,
          sku: product.sku,
          category_id: product.category_id,
          category_name: product.category_name || (category ? category.name : ''),
          supplier_id: product.supplier_id,
          supplier_name: product.supplier_name || (supplier ? supplier.name : ''),
          unit_price: product.unit_price,
          quantity_in_stock: product.quantity_in_stock,
          reorder_level: product.reorder_level
        });

      },

      error: (error: HttpErrorResponse) => {

        console.error('Error loading product:', error);

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


  // Submit form
  onSubmit(): void {

    if (this.productForm.invalid) {

      this.productForm.markAllAsTouched();

      return;
    }

    this.submitting = true;
    this.errorMessage = '';

    const product = this.productForm.getRawValue();


    // Edit existing product
    if (this.editMode && this.productId !== null) {

      this.productService
        .updateProduct(this.productId, product)
        .subscribe({

          next: () => {
            this.router.navigate(['/products']);
          },

          error: (error: HttpErrorResponse) => {

            console.error('Error updating product:', error);

            this.submitting = false;

            this.errorMessage = this.formatError(error);
          }

        });

      return;
    }


    // Add new product
    this.productService
      .addProduct(product)
      .subscribe({

        next: () => {
          this.router.navigate(['/products']);
        },

        error: (error: HttpErrorResponse) => {

          console.error('Error adding product:', error);

          this.submitting = false;

          this.errorMessage = this.formatError(error);
        }

      });

  }


  // Cancel
  cancel(): void {
    this.router.navigate(['/products']);
  }


  ngOnDestroy(): void {

    this.categorySub?.unsubscribe();

    this.supplierSub?.unsubscribe();

  }

}