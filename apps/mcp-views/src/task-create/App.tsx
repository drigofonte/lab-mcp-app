import { useState } from 'react';
import { useApp, useHostStyles } from '@modelcontextprotocol/ext-apps/react';
import { APP_INFO } from '../shared/app-setup';

interface Task {
  id?: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
}

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
      const handleTask = (t: Task) => {
        setTask(t);
        app.updateModelContext({
          content: [{ type: 'text', text: `Created new task: ${t.title}` }],
        }).catch(() => { /* host may not support updateModelContext */ });
      };

      // Race condition: render from whichever arrives first
      app.ontoolinput = (params) => {
        if (params.arguments) {
          handleTask(params.arguments as unknown as Task);
        }
      };

      app.ontoolresult = (params) => {
        try {
          const text = params.content
            ?.filter((c): c is { type: 'text'; text: string } => c.type === 'text')
            .map((c) => c.text)
            .join('');
          if (!text) return;
          const parsed = JSON.parse(text);
          const t: Task = parsed.task ?? parsed;
          if (t.title) {
            handleTask(t);
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
    return <div style={styles.loading}>Creating task...</div>;
  }

  const handleViewList = () => {
    app?.callServerTool({ name: 'list_tasks', arguments: {} });
  };

  return (
    <div style={styles.container}>
      <style>{cssText}</style>
      <div style={styles.card}>
        <div style={styles.header}>
          <span style={styles.checkmark}>&#10003;</span>
          <span style={styles.headerText}>Task Created</span>
        </div>
        <h2 style={styles.title}>{task.title}</h2>
        {task.description && <p style={styles.description}>{task.description}</p>}
        <div style={styles.badges}>
          <span
            style={{
              ...styles.badge,
              backgroundColor: statusColors[task.status] ?? '#6b7280',
            }}
          >
            {task.status}
          </span>
          <span
            style={{
              ...styles.badge,
              backgroundColor: priorityColors[task.priority] ?? '#9ca3af',
            }}
          >
            {task.priority}
          </span>
        </div>
        <button style={styles.button} onClick={handleViewList}>
          View List
        </button>
      </div>
    </div>
  );
}

const cssText = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1f2937; background: #ffffff; }
`;

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '16px', maxWidth: '480px', margin: '0 auto' },
  loading: { padding: '24px', textAlign: 'center', color: '#6b7280' },
  error: { padding: '24px', textAlign: 'center', color: '#ef4444' },
  card: {
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '20px',
    backgroundColor: '#fafafa',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
  },
  checkmark: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: '#16a34a',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 700,
  },
  headerText: { fontSize: '14px', fontWeight: 600, color: '#16a34a' },
  title: { fontSize: '18px', fontWeight: 600, marginBottom: '6px' },
  description: { fontSize: '14px', color: '#4b5563', marginBottom: '14px', lineHeight: '1.5' },
  badges: { display: 'flex', gap: '8px', marginBottom: '16px' },
  badge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '9999px',
    fontSize: '11px',
    fontWeight: 600,
    color: '#ffffff',
    textTransform: 'capitalize',
  },
  button: {
    padding: '8px 16px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    backgroundColor: '#ffffff',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    color: '#2563eb',
  },
};
