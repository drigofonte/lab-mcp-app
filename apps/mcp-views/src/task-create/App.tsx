import { useState } from 'react';
import { useApp, useHostStyles } from '@modelcontextprotocol/ext-apps/react';
import { APP_INFO } from '../shared/app-setup';
import { colors, cssText, shared } from '../shared/theme';

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

  if (error) return <div style={shared.error}>Error: {error.message}</div>;
  if (!isConnected || draft === null) {
    return <div style={shared.loading}>Preparing task...</div>;
  }

  if (confirmed) {
    return (
      <div style={{ ...shared.container, maxWidth: '480px' }}>
        <style>{cssText}</style>
        <div style={shared.card}>
          <div style={styles.successHeader}>
            <span style={styles.checkmark}>&#10003;</span>
            <span style={styles.successText}>Task Created</span>
          </div>
          <h2 style={styles.title}>{draft.title}</h2>
          {draft.description && <p style={styles.description}>{draft.description}</p>}
          <button
            style={shared.primaryButton}
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
    <div style={{ ...shared.container, maxWidth: '480px' }}>
      <style>{cssText}</style>
      <div style={shared.card}>
        <h2 style={styles.formTitle}>Review New Task</h2>
        <p style={styles.subtitle}>The AI proposed this task. Edit any fields before creating.</p>

        <div style={shared.field}>
          <label style={shared.label}>Title</label>
          <input
            style={shared.input}
            value={draft.title}
            onChange={(e) => update('title', e.target.value)}
          />
        </div>

        <div style={shared.field}>
          <label style={shared.label}>Description</label>
          <textarea
            style={{ ...shared.input, minHeight: 60, resize: 'vertical' } as React.CSSProperties}
            value={draft.description}
            onChange={(e) => update('description', e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ ...shared.field, flex: 1 }}>
            <label style={shared.label}>Status</label>
            <select
              style={shared.select}
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

          <div style={{ ...shared.field, flex: 1 }}>
            <label style={shared.label}>Priority</label>
            <select
              style={shared.select}
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
          <button style={shared.secondaryButton} onClick={handleCancel}>
            Cancel
          </button>
          <button
            style={{
              ...shared.primaryButton,
              opacity: !draft.title.trim() ? 0.4 : 1,
              cursor: !draft.title.trim() ? 'default' : 'pointer',
            }}
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

const styles: Record<string, React.CSSProperties> = {
  formTitle: { fontSize: '18px', fontWeight: 600, color: colors.foreground, marginBottom: '4px' },
  subtitle: { fontSize: '13px', color: colors.muted, marginBottom: '18px' },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    marginTop: '18px',
    paddingTop: '14px',
    borderTop: `1px solid ${colors.border}`,
  },
  successHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '14px',
  },
  checkmark: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: '#dcfce7',
    color: '#15803d',
    fontSize: '14px',
    fontWeight: 700,
  },
  successText: { fontSize: '14px', fontWeight: 600, color: '#15803d' },
  title: { fontSize: '18px', fontWeight: 600, color: colors.foreground, marginBottom: '6px' },
  description: { fontSize: '14px', color: colors.muted, marginBottom: '16px', lineHeight: 1.5 },
};
