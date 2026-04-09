import { TasksService } from '../../tasks/tasks.service';
import { ListTasksTool } from './list-tasks.tool';
import { GetTaskTool } from './get-task.tool';
import { CreateTaskTool } from './create-task.tool';
import { UpdateTaskTool } from './update-task.tool';
import { SummarizeTasksTool } from './summarize-tasks.tool';

describe('MCP Tools', () => {
  let tasksService: TasksService;

  beforeEach(() => {
    tasksService = new TasksService();
  });

  describe('ListTasksTool', () => {
    it('should return all tasks as JSON', async () => {
      const tool = new ListTasksTool(tasksService);
      const result = await tool.handle();

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      const tasks = JSON.parse(result.content[0].text);
      expect(Array.isArray(tasks)).toBe(true);
      expect(tasks.length).toBe(5); // 5 seed tasks
    });
  });

  describe('GetTaskTool', () => {
    it('should return a task by id', async () => {
      const tool = new GetTaskTool(tasksService);
      const allTasks = tasksService.findAll();
      const taskId = allTasks[0].id;

      const result = await tool.handle({ taskId });

      expect(result.content).toHaveLength(1);
      const task = JSON.parse(result.content[0].text);
      expect(task.id).toBe(taskId);
    });

    it('should return error for non-existent task', async () => {
      const tool = new GetTaskTool(tasksService);
      const result = await tool.handle({ taskId: 'non-existent-id' });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('not found');
    });
  });

  describe('CreateTaskTool', () => {
    it('should stage a task when confirmed is false', async () => {
      const tool = new CreateTaskTool(tasksService);
      const result = await tool.handle({
        title: 'New Task',
        description: 'A test task',
        status: 'todo',
        priority: 'high',
        confirmed: false,
      });

      expect(result.content).toHaveLength(1);
      const task = JSON.parse(result.content[0].text);
      expect(task.title).toBe('New Task');
      expect(task.priority).toBe('high');
      expect(task.confirmed).toBe(false);
      // Should NOT have an id since it's not persisted
      expect(task.id).toBeUndefined();
    });

    it('should persist a task when confirmed is true', async () => {
      const tool = new CreateTaskTool(tasksService);
      const result = await tool.handle({
        title: 'New Task',
        description: 'A test task',
        status: 'todo',
        priority: 'high',
        confirmed: true,
      });

      expect(result.content).toHaveLength(1);
      const task = JSON.parse(result.content[0].text);
      expect(task.title).toBe('New Task');
      expect(task.confirmed).toBe(true);
      expect(task.id).toBeDefined();
      expect(tasksService.findAll().length).toBe(6);
    });
  });

  describe('UpdateTaskTool', () => {
    it('should update a task', async () => {
      const tool = new UpdateTaskTool(tasksService);
      const allTasks = tasksService.findAll();
      const taskId = allTasks[0].id;

      const result = await tool.handle({ taskId, status: 'done' });

      expect(result.content).toHaveLength(1);
      const task = JSON.parse(result.content[0].text);
      expect(task.status).toBe('done');
    });

    it('should return error for non-existent task', async () => {
      const tool = new UpdateTaskTool(tasksService);
      const result = await tool.handle({ taskId: 'non-existent-id', status: 'done' });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('not found');
    });
  });

  describe('SummarizeTasksTool', () => {
    it('should return a text summary', async () => {
      const tool = new SummarizeTasksTool(tasksService);
      const result = await tool.handle();

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      const text = result.content[0].text;
      expect(text).toContain('5 tasks total');
      expect(text).toContain('todo');
      expect(text).toContain('in-progress');
      expect(text).toContain('done');
      expect(text).toContain('high');
      expect(text).toContain('medium');
      expect(text).toContain('low');
    });
  });
});
