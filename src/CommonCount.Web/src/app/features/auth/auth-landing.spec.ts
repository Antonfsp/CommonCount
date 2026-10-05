import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthLanding } from './auth-landing';

describe('AuthLanding', () => {
  let component: AuthLanding;
  let fixture: ComponentFixture<AuthLanding>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthLanding],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthLanding);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
