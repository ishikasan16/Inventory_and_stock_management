import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuplierFormComponent } from './suplier-form.component';

describe('SuplierFormComponent', () => {
  let component: SuplierFormComponent;
  let fixture: ComponentFixture<SuplierFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuplierFormComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SuplierFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
