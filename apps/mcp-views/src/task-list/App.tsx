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
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

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
          const taskList: Task[] = Array.isArray(parsed) ? parsed : parsed.tasks ?? [];
          setTasks(taskList);

          const highPriorityCount = taskList.filter((t) => t.priority === 'high').length;
          app.updateModelContext({
            content: [
              {
                type: 'text',
                text: `Viewing task list: ${taskList.length} tasks, ${highPriorityCount} high priority`,
              },
            ],
          }).catch(() => { /* host may not support updateModelContext */ });
        } catch {
          // ignore parse errors
        }
      };
    },
  });

  useHostStyles(app, app?.getHostContext());

  if (error) return <div style={styles.error}>Error: {error.message}</div>;
  if (!isConnected || tasks === null) {
    return <div style={styles.loading}>Loading tasks...</div>;
  }

  const handleTaskClick = (taskId: string) => {
    app?.callServerTool({ name: 'get_task', arguments: { taskId } });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const result = await app?.callServerTool({ name: 'list_tasks', arguments: {} });
      if (result?.content) {
        const text = (result.content as Array<{ type: string; text: string }>)
          .filter((c) => c.type === 'text')
          .map((c) => c.text)
          .join('');
        if (text) {
          const parsed = JSON.parse(text);
          const taskList: Task[] = Array.isArray(parsed) ? parsed : parsed.tasks ?? [];
          setTasks(taskList);
        }
      }
    } catch {
      // ignore
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div style={styles.container}>
      <style>{cssText}</style>
      <div style={styles.headerRow}>
        <h2 style={styles.heading}>Tasks</h2>
        <button style={styles.refreshButton} onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? '...' : '↻ Refresh'}
        </button>
      </div>
      {tasks.length === 0 ? (
        <p style={styles.empty}>No tasks found.</p>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Title</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Priority</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id} style={styles.tr}>
                <td style={styles.td}>
                  <a
                    href="#"
                    style={styles.link}
                    onClick={(e) => {
                      e.preventDefault();
                      handleTaskClick(task.id);
                    }}
                  >
                    {task.title}
                  </a>
                </td>
                <td style={styles.td}>
                  <span
                    style={{
                      ...styles.badge,
                      backgroundColor: statusColors[task.status] ?? '#6b7280',
                    }}
                  >
                    {task.status}
                  </span>
                </td>
                <td style={styles.td}>
                  <span
                    style={{
                      ...styles.badge,
                      backgroundColor: priorityColors[task.priority] ?? '#9ca3af',
                    }}
                  >
                    {task.priority}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const cssText = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1f2937; background: #ffffff; }
`;

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '16px', maxWidth: '640px', margin: '0 auto' },
  headerRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' },
  heading: { fontSize: '18px', fontWeight: 600 },
  refreshButton: {
    padding: '4px 12px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    backgroundColor: '#fff',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
    color: '#2563eb',
  },
  loading: { padding: '24px', textAlign: 'center', color: '#6b7280' },
  error: { padding: '24px', textAlign: 'center', color: '#ef4444' },
  empty: { padding: '16px', color: '#6b7280', textAlign: 'center' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    textAlign: 'left',
    padding: '8px 12px',
    borderBottom: '2px solid #e5e7eb',
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase',
    color: '#6b7280',
  },
  tr: { borderBottom: '1px solid #f3f4f6' },
  td: { padding: '10px 12px', fontSize: '14px' },
  link: { color: '#2563eb', textDecoration: 'none', fontWeight: 500, cursor: 'pointer' },
  badge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '9999px',
    fontSize: '11px',
    fontWeight: 600,
    color: '#ffffff',
    textTransform: 'capitalize',
  },
};
