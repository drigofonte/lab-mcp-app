import { TasksService } from './tasks.service';

describe('TasksService', () => {
  let service: TasksService;

  beforeEach(() => {
    service = new TasksService();
  });

  it('findAll() returns seed tasks', () => {
    const tasks = service.findAll();
    expect(tasks.length).toBe(5);
    for (const task of tasks) {
      expect(task).toHaveProperty('id');
      expect(task).toHaveProperty('title');
      expect(task).toHaveProperty('createdAt');
    }
  });

  it('findOne(id) returns correct task', () => {
    const tasks = service.findAll();
    const first = tasks[0];
    const found = service.findOne(first.id);
    expect(found).toEqual(first);
  });

  it('findOne(nonexistent) returns undefined', () => {
    expect(service.findOne('nonexistent-id')).toBeUndefined();
  });

  it('create() returns task with generated ID', () => {
    const task = service.create({
      title: 'New task',
      description: 'A brand new task',
      status: 'todo',
      priority: 'low',
    });
    expect(task.id).toBeDefined();
    expect(task.id.length).toBeGreaterThan(0);
    expect(task.title).toBe('New task');
    expect(task.createdAt).toBeDefined();
    // Should now be findable
    expect(service.findOne(task.id)).toEqual(task);
    // Total count increased
    expect(service.findAll().length).toBe(6);
  });

  it('update(id, partial) merges fields', () => {
    const tasks = service.findAll();
    const target = tasks[0];
    const updated = service.update(target.id, { status: 'done', priority: 'high' });
    expect(updated).not.toBeNull();
    expect(updated!.id).toBe(target.id);
    expect(updated!.createdAt).toBe(target.createdAt);
    expect(updated!.status).toBe('done');
    expect(updated!.priority).toBe('high');
    expect(updated!.title).toBe(target.title);
  });

  it('update(nonexistent) returns null', () => {
    expect(service.update('nonexistent-id', { status: 'done' })).toBeNull();
  });
});
