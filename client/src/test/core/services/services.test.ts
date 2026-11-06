import { createCourse, getAllCourses, updateCourse } from '@/core/services/courses.service';
import { updateLessonProgress } from '@/core/services/progress.service';
import { updateUserRole } from '@/core/services/users.service';

const respond = (body: unknown, status = 200) =>
  vi.fn().mockResolvedValue({ status, ok: status < 400, json: async () => body });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('services', () => {
  it('getAllCourses sends filters as a query string and returns items with paging meta', async () => {
    const meta = { page: 1, pageSize: 12, total: 1, totalPages: 1 };
    const fetchMock = respond({ success: true, data: [{ id: 'c1' }], meta });
    vi.stubGlobal('fetch', fetchMock);

    const result = await getAllCourses({ q: 'react', page: 2, categoryId: undefined });

    const [url] = fetchMock.mock.calls[0]!;
    expect(url).toContain('/courses?');
    expect(url).toContain('q=react');
    expect(url).toContain('page=2');
    expect(url).not.toContain('categoryId');
    expect(result).toEqual({ items: [{ id: 'c1' }], meta });
  });

  it('createCourse POSTs the new course', async () => {
    const fetchMock = respond({ success: true, data: { id: 'c1' } });
    vi.stubGlobal('fetch', fetchMock);

    await createCourse({ title: 'New', description: 'A description', categoryId: 'cat1' });

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url.endsWith('/courses')).toBe(true);
    expect(init.method).toBe('POST');
  });

  it('updateCourse PATCHes only the course with that id', async () => {
    const fetchMock = respond({ success: true, data: { id: 'c1' } });
    vi.stubGlobal('fetch', fetchMock);

    await updateCourse('c1', { title: 'Renamed' });

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toContain('/courses/c1');
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(init.body)).toEqual({ title: 'Renamed' });
  });

  it('updateLessonProgress PUTs the position and completion flag for the lesson', async () => {
    const fetchMock = respond({ success: true, data: { completed: true } });
    vi.stubGlobal('fetch', fetchMock);

    await updateLessonProgress('l1', { positionSeconds: 95, completed: true });

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toContain('/lessons/l1/progress');
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body)).toEqual({ positionSeconds: 95, completed: true });
  });

  it('sends the session cookie with every call', async () => {
    const fetchMock = respond({ success: true, data: {} });
    vi.stubGlobal('fetch', fetchMock);

    await updateUserRole('u1', 'ADMIN');

    expect(fetchMock.mock.calls[0]![1].credentials).toBe('include');
  });

  it('turns an error response into an ApiError', async () => {
    vi.stubGlobal(
      'fetch',
      respond({ success: false, error: { code: 'CONFLICT', message: 'Already exists' } }, 409),
    );
    await expect(
      createCourse({ title: 'x', description: 'x', categoryId: 'c' }),
    ).rejects.toMatchObject({
      status: 409,
      message: 'Already exists',
    });
  });
});
