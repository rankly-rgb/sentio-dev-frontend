import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fr } from '@/i18n/fr';
import { useAuth } from '@/contexts/AuthContext';
import { useCreatePlaybook } from '@/hooks/usePlaybooks';
import PlaybookForm from '@/components/playbooks/PlaybookForm';
import type { CreatePlaybookPayload } from '@/lib/types/playbook';

export default function PlaybookNew() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { mutate, isPending } = useCreatePlaybook();

  const handleSubmit = (payload: CreatePlaybookPayload) => {
    mutate(
      { ...payload, organization_id: user!.organization_id },
      {
        onSuccess: (data) => {
          navigate(`/playbooks/${data.id}`);
        },
      },
    );
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/playbooks')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">{fr.playbooks.create}</h1>
      </div>

      <div className="max-w-3xl">
        <PlaybookForm
          mode="create"
          onSubmit={handleSubmit as (p: unknown) => void}
          isSubmitting={isPending}
        />
      </div>
    </div>
  );
}
