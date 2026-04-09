import { useState } from 'react';
import { useApp, useHostStyles } from '@modelcontextprotocol/ext-apps/react';
import { APP_INFO } from '../shared/app-setup';
import { colors, cssText, shared } from '../shared/theme';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
}

const STATUS_OPTIONS = ['todo', 'in-progress', 'done'];
const PRIORITY_OPTIONS = ['low', 'medium', 'high'];

export function App() {
  const [task, setTask] = useState<Task | null>(null);
  const [editStatus, setEditStatus] = useState('');
  const [editPriority, setEditPriority] = useState('');
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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
          const t: Task = parsed.task ?? parsed;
          if (t.id && t.title) {
            setTask(t);
            setEditStatus(t.status);
            setEditPriority(t.priority);
            setDirty(false);
            setSaved(false);
            app.updateModelContext({
              content: [
                {
                  type: 'text',
                  text: `Viewing task: ${t.title} (${t.status}, ${t.priority})`,
                },
              ],
            }).catch(() => {});
          }
        } catch {
          // ignore
        }
      };
    },
  });

  useHostStyles(app, app?.getHostContext());

  if (error) return <div style={shared.error}>Error: {error.message}</div>;
  if (!isConnected || task === null) {
    return <div style={shared.loading}>Loading task...</div>;
  }

  const handleStatusChange = (newStatus: string) => {
    setEditStatus(newStatus);
    setDirty(newStatus !== task.status || editPriority !== task.priority);
    setSaved(false);
  };

  const handlePriorityChange = (newPriority: string) => {
    setEditPriority(newPriority);
    setDirty(editStatus !== task.status || newPriority !== task.priority);
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await app?.callServerTool({
        name: 'update_task',
        arguments: { taskId: task.id, status: editStatus, priority: editPriority },
      });
      setTask((prev) => prev ? { ...prev, status: editStatus, priority: editPriority } : prev);
      setDirty(false);
      setSaved(true);
      app?.updateModelContext({
        content: [
          {
            type: 'text',
            text: `Updated task: ${task.title} (${editStatus}, ${editPriority})`,
          },
        ],
      }).catch(() => {});
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleBackToList = (e: React.MouseEvent) => {
    e.preventDefault();
    app?.callServerTool({ name: 'list_tasks', arguments: {} });
  };

  return (
    <div style={{ ...shared.container, maxWidth: '540px' }}>
      <style>{cssText}</style>
      <a href="#" style={shared.backLink} onClick={handleBackToList}>
        &larr; Back to list
      </a>
      <div style={shared.card}>
        <h2 style={styles.title}>{task.title}</h2>
        {task.description && <p style={styles.description}>{task.description}</p>}
        <div style={shared.fieldRow}>
          <label style={styles.fieldLabel}>Status</label>
          <select
            style={shared.select}
            value={editStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div style={shared.fieldRow}>
          <label style={styles.fieldLabel}>Priority</label>
          <select
            style={shared.select}
            value={editPriority}
            onChange={(e) => handlePriorityChange(e.target.value)}
          >
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div style={styles.actions}>
          {saved && <span style={styles.savedLabel}>Saved &#10003;</span>}
          <button
            style={{
              ...shared.primaryButton,
              opacity: dirty ? 1 : 0.4,
              cursor: dirty ? 'pointer' : 'default',
            }}
            onClick={handleSave}
            disabled={!dirty || saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  title: {
    fontSize: '20px',
    fontWeight: 600,
    color: colors.foreground,
    marginBottom: '8px',
  },
  description: {
    fontSize: '14px',
    color: colors.muted,
    marginBottom: '16px',
    lineHeight: '1.5',
  },
  fieldLabel: {
    fontSize: '13px',
    fontWeight: 500,
    color: colors.foreground,
    width: '64px',
    flexShrink: 0,
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '16px',
    paddingTop: '14px',
    borderTop: `1px solid ${colors.border}`,
  },
  savedLabel: {
    fontSize: '13px',
    color: colors.success,
    fontWeight: 500,
  },
};
