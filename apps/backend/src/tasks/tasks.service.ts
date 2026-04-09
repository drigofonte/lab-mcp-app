import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Task } from './task.interface';

@Injectable()
export class TasksService {
  private readonly tasks = new Map<string, Task>();

  constructor() {
    this.seed();
  }

  private seed(): void {
    const seeds: Omit<Task, 'id' | 'createdAt'>[] = [
      {
        title: 'Set up project repository',
        description: 'Initialize the monorepo with pnpm workspaces and configure CI.',
        status: 'done',
        priority: 'high',
      },
      {
        title: 'Design database schema',
        description: 'Create the initial schema for tasks, users, and projects.',
        status: 'in-progress',
        priority: 'high',
      },
      {
        title: 'Implement authentication',
        description: 'Add JWT-based authentication with login and registration endpoints.',
        status: 'todo',
        priority: 'medium',
      },
      {
        title: 'Write API documentation',
        description: 'Document all REST endpoints using OpenAPI/Swagger.',
        status: 'todo',
        priority: 'low',
      },
      {
        title: 'Add task filtering',
        description: 'Allow filtering tasks by status, priority, and assignee.',
        status: 'in-progress',
        priority: 'medium',
      },
    ];

    for (const data of seeds) {
      const id = randomUUID();
      this.tasks.set(id, {
        ...data,
        id,
        createdAt: new Date().toISOString(),
      });
    }
  }

  findAll(): Task[] {
    return Array.from(this.tasks.values());
  }

  findOne(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  create(data: Omit<Task, 'id' | 'createdAt'>): Task {
    const id = randomUUID();
    const task: Task = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
    };
    this.tasks.set(id, task);
    return task;
  }

  update(id: string, partial: Partial<Omit<Task, 'id' | 'createdAt'>>): Task | null {
    const existing = this.tasks.get(id);
    if (!existing) {
      return null;
    }
    const updated: Task = { ...existing, ...partial, id: existing.id, createdAt: existing.createdAt };
    this.tasks.set(id, updated);
    return updated;
  }
}
