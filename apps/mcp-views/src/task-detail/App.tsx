import { useState } from 'react';
import { useApp, useHostStyles } from '@modelcontextprotocol/ext-apps/react';
import { APP_INFO } from '../shared/app-setup';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
}

const STATUS_OPTIONS = ['todo', 'in-progress', 'done'];
const PRIORITY_OPTIONS = ['low', 'medium', 'high'];

const statusColors: Record<string, string> = {
  todo: '#6b7280',
  'in-progress': '#2563eb',
  done: '#16a34a',
};

const priorityColors: Record<string, string> = {
  low: '#9ca3af',
  medium: '#f59e0b',
  high: '#ef4444',
};

export function App() {
  const [task, setTask] = useState<Task | null>(null);

  const { app, isConnected, error } = useApp({
    appInfo: APP_INFO,
    capabilities: {},
    onAppCreated: (app) => {
      app.ontoolresult = (params) => {
        try {
          const text = params.content
            ?.filter((c): c is { type: 'text'; text: string } => c.type === 'text')
            .map((c) => c.text)
            .join('');
          if (!text) return;
          const parsed = JSON.parse(text);
          // Handle both direct task object and wrapped { task: ... }
          const t: Task = parsed.task ?? parsed;
          if (t.id && t.title) {
            setTask(t);
            app.updateModelContext({
              content: [
                {
                  type: 'text',
                  text: `Viewing task: ${t.title} (${t.status}, ${t.priority})`,
                },
              ],
            }).catch(() => { /* host may not support updateModelContext */ });
          }
        } catch {
          // ignore parse errors
        }
      };
    },
  });

  useHostStyles(app, app?.getHostContext());

  if (error) return <div style={styles.error}>Error: {error.message}</div>;
  if (!isConnected || task === null) {
    return <div style={styles.loading}>Loading task...</div>;
  }

  const handleStatusChange = (newStatus: string) => {
    setTask((prev) => (prev ? { ...prev, status: newStatus } : prev));
    app?.callServerTool({
      name: 'update_task',
      arguments: { taskId: task.id, status: newStatus },
    });
  };

  const handlePriorityChange = (newPriority: string) => {
    setTask((prev) => (prev ? { ...prev, priority: newPriority } : prev));
    app?.callServerTool({
      name: 'update_task',
      arguments: { taskId: task.id, priority: newPriority },
    });
  };

  const handleBackToList = (e: React.MouseEvent) => {
    e.preventDefault();
    app?.callServerTool({ name: 'list_tasks', arguments: {} });
  };

  return (
    <div style={styles.container}>
      <style>{cssText}</style>
      <a href="#" style={styles.backLink} onClick={handleBackToList}>
        &larr; Back to list
      </a>
      <div style={styles.card}>
        <h2 style={styles.title}>{task.title}</h2>
        {task.description && <p style={styles.description}>{task.description}</p>}
        <div style={styles.fieldRow}>
          <label style={styles.label}>Status</label>
          <select
            style={{
              ...styles.select,
              borderColor: statusColors[task.status] ?? '#d1d5db',
            }}
            value={task.status}
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div style={styles.fieldRow}>
          <label style={styles.label}>Priority</label>
          <select
            style={{
              ...styles.select,
              borderColor: priorityColors[task.priority] ?? '#d1d5db',
            }}
            value={task.priority}
            onChange={(e) => handlePriorityChange(e.target.value)}
          >
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

const cssText = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1f2937; background: #ffffff; }
`;

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '16px', maxWidth: '540px', margin: '0 auto' },
  loading: { padding: '24px', textAlign: 'center', color: '#6b7280' },
  error: { padding: '24px', textAlign: 'center', color: '#ef4444' },
  backLink: {
    display: 'inline-block',
    marginBottom: '12px',
    fontSize: '13px',
    color: '#2563eb',
    textDecoration: 'none',
    cursor: 'pointer',
  },
  card: {
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '20px',
    backgroundColor: '#fafafa',
  },
  title: { fontSize: '20px', fontWeight: 600, marginBottom: '8px' },
  description: { fontSize: '14px', color: '#4b5563', marginBottom: '16px', lineHeight: '1.5' },
  fieldRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
  },
  label: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#6b7280',
    width: '64px',
    flexShrink: 0,
  },
  select: {
    padding: '6px 10px',
    borderRadius: '6px',
    border: '2px solid #d1d5db',
    fontSize: '13px',
    cursor: 'pointer',
    backgroundColor: '#ffffff',
    textTransform: 'capitalize',
  },
};
