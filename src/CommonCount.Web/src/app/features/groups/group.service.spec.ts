import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GroupService } from './group.service';

describe('GroupService', () => {
  const post = vi.fn(() =>
    of({ id: 4, userId: null, name: 'Alex', joinedAt: '2026-10-13T00:00:00Z' }),
  );

  beforeEach(() => {
    post.mockClear();
    TestBed.configureTestingModule({
      providers: [
        GroupService,
        { provide: HttpClient, useValue: { post, get: vi.fn() } },
      ],
    });
  });

  it('sends a member display name to the group members endpoint', () => {
    TestBed.inject(GroupService).addMemberToGroup(12, 'Alex').subscribe();

    expect(post).toHaveBeenCalledWith(
      expect.stringMatching(/\/12\/members$/),
      { displayName: 'Alex' },
    );
  });
});
