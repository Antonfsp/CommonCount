import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NewGroupDialog } from './new-group-dialog';

describe('NewGroupDialog', () => {
  let component: NewGroupDialog;
  let fixture: ComponentFixture<NewGroupDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewGroupDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(NewGroupDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
