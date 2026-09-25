import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GroupsOverview } from './groups-overview';

describe('GroupsOverview', () => {
  let component: GroupsOverview;
  let fixture: ComponentFixture<GroupsOverview>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GroupsOverview],
    }).compileComponents();

    fixture = TestBed.createComponent(GroupsOverview);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
