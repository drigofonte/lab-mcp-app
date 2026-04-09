import { useState } from 'react';
import { useApp, useHostStyles } from '@modelcontextprotocol/ext-apps/react';
import { APP_INFO } from '../shared/app-setup';

interface TaskDraft {
  title: string;
  description: string;
  status: string;
  priority: string;
}

const STATUS_OPTIONS = ['todo', 'in-progress', 'done'];
const PRIORITY_OPTIONS = ['low', 'medium', 'high'];

export function App() {
  const [draft, setDraft] = useState<TaskDraft | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);

  const { app, isConnected, error } = useApp({
    appInfo: APP_INFO,
    capabilities: {},
    onAppCreated: (app) => {
      const handleProposal = (data: Record<string, unknown>) => {
        if (data.confirmed) {
          // Already confirmed — show success
          setConfirmed(true);
          setDraft({
            title: (data.title as string) || '',
            description: (data.description as string) || '',
            status: (data.status as string) || 'todo',
            priority: (data.priority as string) || 'medium',
          });
        } else {
          // Staged proposal — show editable form
          setDraft({
            title: (data.title as string) || '',
            description: (data.description as string) || '',
            status: (data.status as string) || 'todo',
            priority: (data.priority as string) || 'medium',
          });
        }
      };

      app.ontoolinput = (params) => {
        if (params.arguments) {
          handleProposal(params.arguments as Record<string, unknown>);
        }
      };

      app.ontoolresult = (params) => {
        try {
          const text = params.content
            ?.filter((c): c is { type: 'text'; text: string } => c.type === 'text')
            .map((c) => c.text)
            .join('');
          if (!text) return;
          handleProposal(JSON.parse(text));
        } catch {
          // ignore
        }
      };
    },
  });

  useHostStyles(app, app?.getHostContext());

  if (error) return <div style={styles.error}>Error: {error.message}</div>;
  if (!isConnected || draft === null) {
    return <div style={styles.loading}>Preparing task...</div>;
  }

  if (confirmed) {
    return (
      <div style={styles.container}>
        <style>{cssText}</style>
        <div style={styles.card}>
          <div style={styles.successHeader}>
            <span style={styles.checkmark}>&#10003;</span>
            <span style={styles.successText}>Task Created</span>
          </div>
          <h2 style={styles.title}>{draft.title}</h2>
          {draft.description && <p style={styles.description}>{draft.description}</p>}
          <button
            style={styles.primaryButton}
            onClick={() => app?.callServerTool({ name: 'list_tasks', arguments: {} })}
          >
            View All Tasks
          </button>
        </div>
      </div>
    );
  }

  const handleConfirm = async () => {
    setSaving(true);
    try {
      await app?.callServerTool({
        name: 'create_task',
        arguments: {
          title: draft.title,
          description: draft.description,
          status: draft.status,
          priority: draft.priority,
          confirmed: true,
        },
      });
      setConfirmed(true);
      app?.updateModelContext({
        content: [{ type: 'text', text: `Created new task: ${draft.title}` }],
      }).catch(() => {});
    } catch (err) {
      console.error('Failed to create task:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    app?.callServerTool({ name: 'list_tasks', arguments: {} });
  };

  const update = (field: keyof TaskDraft, value: string) => {
    setDraft((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  return (
    <div style={styles.container}>
      <style>{cssText}</style>
      <div style={styles.card}>
        <h2 style={styles.formTitle}>Review New Task</h2>
        <p style={styles.subtitle}>The AI proposed this task. Edit any fields before creating.</p>

        <div style={styles.field}>
          <label style={styles.label}>Title</label>
          <input
            style={styles.input}
            value={draft.title}
            onChange={(e) => update('title', e.target.value)}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Description</label>
          <textarea
            style={{ ...styles.input, minHeight: 60, resize: 'vertical' }}
            value={draft.description}
            onChange={(e) => update('description', e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ ...styles.field, flex: 1 }}>
            <label style={styles.label}>Status</label>
            <select
              style={styles.select}
              value={draft.status}
              onChange={(e) => update('status', e.target.value)}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div style={{ ...styles.field, flex: 1 }}>
            <label style={styles.label}>Priority</label>
            <select
              style={styles.select}
              value={draft.priority}
              onChange={(e) => update('priority', e.target.value)}
            >
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={styles.actions}>
          <button style={styles.cancelButton} onClick={handleCancel}>
            Cancel
          </button>
          <button
            style={styles.primaryButton}
            onClick={handleConfirm}
            disabled={saving || !draft.title.trim()}
          >
            {saving ? 'Creating...' : 'Create Task'}
          </button>
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
  container: { padding: '16px', maxWidth: '480px', margin: '0 auto' },
  loading: { padding: '24px', textAlign: 'center', color: '#6b7280' },
  error: { padding: '24px', textAlign: 'center', color: '#ef4444' },
  card: {
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '20px',
    backgroundColor: '#fafafa',
  },
  formTitle: { fontSize: '16px', fontWeight: 600, marginBottom: '4px' },
  subtitle: { fontSize: '13px', color: '#6b7280', marginBottom: '16px' },
  field: { marginBottom: '12px' },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  input: {
    width: '100%',
    padding: '8px 10px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: 'inherit',
    outline: 'none',
    backgroundColor: '#fff',
  },
  select: {
    width: '100%',
    padding: '8px 10px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: 'inherit',
    outline: 'none',
    backgroundColor: '#fff',
    textTransform: 'capitalize',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    marginTop: '16px',
  },
  primaryButton: {
    padding: '8px 20px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#2563eb',
    color: '#fff',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  cancelButton: {
    padding: '8px 20px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    backgroundColor: '#fff',
    color: '#374151',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  successHeader: {
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
    color: '#fff',
    fontSize: '14px',
    fontWeight: 700,
  },
  successText: { fontSize: '14px', fontWeight: 600, color: '#16a34a' },
  title: { fontSize: '18px', fontWeight: 600, marginBottom: '6px' },
  description: { fontSize: '14px', color: '#4b5563', marginBottom: '14px', lineHeight: 1.5 },
};
