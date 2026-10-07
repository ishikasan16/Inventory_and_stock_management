import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import {
  ActivatedRoute,
  Router
} from '@angular/router';

import { CategoryService } from '../../../../services/category.service';
import { Category } from '../../categories.component';

@Component({
  selector: 'app-categories-form',
  templateUrl: './categories-form.component.html',
  styleUrl: './categories-form.component.css'
})
export class CategoriesFormComponent implements OnInit {

  categoryForm: FormGroup;

  isEditMode = false;
  categoryId: string | null = null;
  errorMessage = '';
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private categoryService: CategoryService
  ) {

    // Create category form
    this.categoryForm = this.fb.group({
      name: ['', [
        Validators.required,
        Validators.minLength(2)
      ]],

      description: ['', [
        Validators.required,
        Validators.minLength(10)
      ]]
    });
  }

  ngOnInit(): void {

    // Check whether we are editing a category
    this.checkEditMode();

  }

  checkEditMode(): void {

    const idParam = this.route.snapshot.paramMap.get('id');

    if (!idParam) {
      return;
    }

    this.isEditMode = true;
    this.categoryId = String(idParam);

    this.categoryService.getCategoryById(this.categoryId).subscribe({

      next: (category: Category) => {

        this.categoryForm.patchValue({
          name: category.name,
          description: category.description
        });

      },

      error: (error: HttpErrorResponse) => {

        console.error('Error loading category:', error);

        this.errorMessage = 'Could not load category.';

      }

    });

  }

  // Create data to send to API
  private buildPayload(): Omit<Category, 'id' | 'created_at'> {

    const formValue = this.categoryForm.value;

    return {
      name: formValue.name,
      description: formValue.description
    };

  }

  onSubmit(): void {

    // Check form validation
    if (this.categoryForm.invalid) {

      this.categoryForm.markAllAsTouched();

      return;
    }

    const payload = this.buildPayload();

    this.errorMessage = '';
    this.isLoading = true;

    // Update category
    if (this.isEditMode && this.categoryId) {

      this.categoryService
        .updateCategory(this.categoryId, payload)
        .subscribe({

          next: () => {

            this.isLoading = false;

            this.router.navigate(['/categories']);

          },

          error: (error: HttpErrorResponse) => {

            this.isLoading = false;

            console.error('Error updating category:', error);

            this.errorMessage =
              error.status === 409
                ? 'A category with this name already exists.'
                : 'Unable to update the category. Please try again.';

          }

        });

      return;
    }

    // Add category
    this.categoryService
      .addCategory(payload)
      .subscribe({

        next: () => {

          this.isLoading = false;

          this.router.navigate(['/categories']);

        },

        error: (error: HttpErrorResponse) => {

          this.isLoading = false;

          console.error('Error adding category:', error);

          this.errorMessage =
            error.status === 409
              ? 'A category with this name already exists.'
              : 'Unable to add the category. Please try again.';

        }

      });

  }

  // Go back to category list
  cancel(): void {

    this.categoryForm.reset({
      name: '',
      description: ''
    });

    this.router.navigate(['/categories']);

  }

}
