import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateExpenseDialog } from './create-expense-dialog';

describe('CreateExpenseDialog', () => {
  let component: CreateExpenseDialog;
  let fixture: ComponentFixture<CreateExpenseDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateExpenseDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateExpenseDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
