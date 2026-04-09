import { ChatService } from './chat.service';
import { TasksService } from '../tasks/tasks.service';

describe('ChatService', () => {
  let chatService: ChatService;

  beforeEach(() => {
    const tasksService = new TasksService();
    chatService = new ChatService(tasksService);
  });

  it('should be defined', () => {
    expect(chatService).toBeDefined();
  });

  describe('getModelToolDefs', () => {
    it('should return only model-visible tools', () => {
      const tools = chatService.getModelToolDefs();
      const toolNames = tools.map((t) => t.name);

      // Model-visible tools
      expect(toolNames).toContain('list_tasks');
      expect(toolNames).toContain('get_task');
      expect(toolNames).toContain('create_task');
      expect(toolNames).toContain('summarize_tasks');

      // App-only tool should be excluded
      expect(toolNames).not.toContain('update_task');
    });

    it('should include correct resourceUri for each tool', () => {
      const tools = chatService.getModelToolDefs();
      const listTool = tools.find((t) => t.name === 'list_tasks');
      const summarizeTool = tools.find((t) => t.name === 'summarize_tasks');

      expect(listTool?.resourceUri).toBe('ui://tasks/list');
      expect(summarizeTool?.resourceUri).toBeUndefined();
    });

    it('should have valid input_schema for each tool', () => {
      const tools = chatService.getModelToolDefs();
      for (const tool of tools) {
        expect(tool.input_schema).toBeDefined();
        expect(tool.input_schema.type).toBe('object');
      }
    });
  });
});
