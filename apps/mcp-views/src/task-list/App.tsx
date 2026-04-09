import { useState } from 'react';
import { useApp, useHostStyles } from '@modelcontextprotocol/ext-apps/react';
import { APP_INFO } from '../shared/app-setup';
import { colors, cssText, shared, getStatusBadge, getPriorityBadge } from '../shared/theme';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
}

export function App() {
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

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

  if (error) return <div style={shared.error}>Error: {error.message}</div>;
  if (!isConnected || tasks === null) {
    return <div style={shared.loading}>Loading tasks...</div>;
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
    <div style={{ ...shared.container, maxWidth: '640px' }}>
      <style>{cssText}</style>
      <div style={styles.headerRow}>
        <h2 style={{ ...shared.heading, fontSize: '18px' }}>Tasks</h2>
        <button style={styles.refreshButton} onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? '...' : '↻ Refresh'}
        </button>
      </div>
      {tasks.length === 0 ? (
        <p style={styles.empty}>No tasks found.</p>
      ) : (
        <div style={styles.tableWrapper}>
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
                <tr
                  key={task.id}
                  style={{
                    ...styles.tr,
                    backgroundColor: hoveredRow === task.id ? colors.mutedBg : 'transparent',
                  }}
                  onMouseEnter={() => setHoveredRow(task.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  <td style={styles.td}>
                    <a
                      href="#"
                      style={styles.taskLink}
                      onClick={(e) => {
                        e.preventDefault();
                        handleTaskClick(task.id);
                      }}
                    >
                      {task.title}
                    </a>
                  </td>
                  <td style={styles.td}>
                    <span style={{ ...shared.badge, ...getStatusBadge(task.status) }}>
                      {task.status}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={{ ...shared.badge, ...getPriorityBadge(task.priority) }}>
                      {task.priority}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
  },
  refreshButton: {
    ...shared.secondaryButton,
    padding: '6px 12px',
    fontSize: '12px',
  },
  empty: { padding: '16px', color: colors.muted, textAlign: 'center', fontSize: '14px' },
  tableWrapper: {
    border: `1px solid ${colors.border}`,
    borderRadius: '8px',
    overflow: 'hidden',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    textAlign: 'left',
    padding: '10px 14px',
    borderBottom: `1px solid ${colors.border}`,
    fontSize: '12px',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: colors.muted,
    backgroundColor: colors.mutedBg,
  },
  tr: {
    borderBottom: `1px solid ${colors.border}`,
    transition: 'background-color 0.15s ease',
  },
  td: { padding: '10px 14px', fontSize: '14px' },
  taskLink: {
    color: colors.foreground,
    textDecoration: 'none',
    fontWeight: 500,
    cursor: 'pointer',
  },
};
