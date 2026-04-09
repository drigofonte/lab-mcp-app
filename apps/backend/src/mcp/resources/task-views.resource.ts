import { Injectable } from '@nestjs/common';
import { Resource } from '@rekog/mcp-nest';
import * as fs from 'fs/promises';
import * as path from 'path';

const viewsDistPath = path.resolve(__dirname, '../../../../mcp-views/dist');

@Injectable()
export class TaskViewsResource {
  @Resource({
    uri: 'ui://tasks/list',
    name: 'Task List View',
    description: 'Interactive task list',
    mimeType: 'text/html;profile=mcp-app',
  })
  async getTaskListView() {
    const html = await fs.readFile(
      path.join(viewsDistPath, 'task-list.html'),
      'utf-8',
    );
    return {
      contents: [
        {
          uri: 'ui://tasks/list',
          mimeType: 'text/html;profile=mcp-app',
          text: html,
        },
      ],
    };
  }

  @Resource({
    uri: 'ui://tasks/detail',
    name: 'Task Detail View',
    description: 'Task detail view for viewing and editing a single task',
    mimeType: 'text/html;profile=mcp-app',
  })
  async getTaskDetailView() {
    const html = await fs.readFile(
      path.join(viewsDistPath, 'task-detail.html'),
      'utf-8',
    );
    return {
      contents: [
        {
          uri: 'ui://tasks/detail',
          mimeType: 'text/html;profile=mcp-app',
          text: html,
        },
      ],
    };
  }

  @Resource({
    uri: 'ui://tasks/create',
    name: 'Task Create View',
    description: 'Form view for creating a new task',
    mimeType: 'text/html;profile=mcp-app',
  })
  async getTaskCreateView() {
    const html = await fs.readFile(
      path.join(viewsDistPath, 'task-create.html'),
      'utf-8',
    );
    return {
      contents: [
        {
          uri: 'ui://tasks/create',
          mimeType: 'text/html;profile=mcp-app',
          text: html,
        },
      ],
    };
  }
}
