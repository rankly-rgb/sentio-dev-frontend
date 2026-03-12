export type NoteType = 'playbook_action' | 'manual' | 'system';

export interface AccountNote {
  id: string;
  account_id: string;
  organization_id: string;
  note_type: NoteType;
  title: string;
  body: string;
  source: string;
  playbook_id: string | null;
  execution_id: string | null;
  created_at: string;
  updated_at: string;
}
