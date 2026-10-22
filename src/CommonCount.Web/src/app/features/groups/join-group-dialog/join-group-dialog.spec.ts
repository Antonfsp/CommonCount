import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JoinGroupDialog } from './join-group-dialog';

describe('JoinGroupDialog', () => {
  let component: JoinGroupDialog;
  let fixture: ComponentFixture<JoinGroupDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JoinGroupDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(JoinGroupDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
