import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fr } from '@/i18n/fr';
import { useAuth } from '@/contexts/AuthContext';
import { useCreatePlaybook, usePlaybookTemplates } from '@/hooks/usePlaybooks';
import TemplateSelector from '@/components/playbooks/TemplateSelector';
import PlaybookForm from '@/components/playbooks/PlaybookForm';
import type { Playbook, CreatePlaybookPayload } from '@/lib/types/playbook';

export default function PlaybookNew() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { mutate, isPending } = useCreatePlaybook();
  const { data: templatesData, isLoading: templatesLoading } = usePlaybookTemplates();

  // null = step 1 (template picker), Playbook | 'scratch' = step 2 (form)
  const [selectedTemplate, setSelectedTemplate] = useState<Playbook | 'scratch' | null>(null);

  const handleSubmit = (payload: CreatePlaybookPayload) => {
    mutate(
      { ...payload, organization_id: user?.organization_id ?? '' },
      {
        onSuccess: () => {
          navigate('/playbooks');
        },
      },
    );
  };

  const initialData: Playbook | undefined =
    selectedTemplate && selectedTemplate !== 'scratch'
      ? {
          ...selectedTemplate,
          title: `Copie de — ${selectedTemplate.title}`,
          id: '',
          status: 'draft' as const,
          is_template: false,
          accounts_eligible: 0,
          accounts_targeted: 0,
          accounts_reached: 0,
          accounts_converted: 0,
          mrr_recovered_cents: 0,
          mrr_expanded_cents: 0,
          created_at: '',
          updated_at: '',
          activated_at: null,
          deactivated_at: null,
          deactivation_reason: null,
        }
      : undefined;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (selectedTemplate) {
              setSelectedTemplate(null);
            } else {
              navigate('/playbooks');
            }
          }}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">{fr.playbooks.create}</h1>
      </div>

      {/* Step 1: Template selector */}
      {selectedTemplate === null && (
        <TemplateSelector
          templates={templatesData?.data ?? []}
          isLoading={templatesLoading}
          onSelectTemplate={(t) => setSelectedTemplate(t)}
          onCreateFromScratch={() => setSelectedTemplate('scratch')}
        />
      )}

      {/* Step 2: Form */}
      {selectedTemplate !== null && (
        <div className="max-w-3xl">
          <PlaybookForm
            mode="create"
            initialData={initialData}
            onSubmit={handleSubmit as (p: unknown) => void}
            isSubmitting={isPending}
          />
        </div>
      )}
    </div>
  );
}
