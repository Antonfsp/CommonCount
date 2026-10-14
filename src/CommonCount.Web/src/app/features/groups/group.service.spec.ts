import '@angular/compiler';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GroupService } from './group.service';

describe('GroupService', () => {
  const post = vi.fn(() =>
    of({ id: 4, userId: null, name: 'Alex', joinedAt: '2026-10-13T00:00:00Z' }),
  );

  beforeEach(() => {
    post.mockClear();
  });

  const buildService = (): GroupService =>
    Object.assign(Object.create(GroupService.prototype), {
      http: { post, get: vi.fn() },
      apiUrl: '/api/groups',
    }) as GroupService;

  it('sends a member display name to the group members endpoint', () => {
    buildService().addMemberToGroup(12, 'Alex').subscribe();

    expect(post).toHaveBeenCalledWith(
      expect.stringMatching(/\/12\/members$/),
      { displayName: 'Alex' },
    );
  });

  it('sends the creator member name when creating a group', () => {
    buildService().createGroup('Trip', 'Alex').subscribe();

    expect(post).toHaveBeenCalledWith(expect.stringMatching(/\/groups\/create$/), {
      name: 'Trip',
      memberName: 'Alex',
    });
  });
});
