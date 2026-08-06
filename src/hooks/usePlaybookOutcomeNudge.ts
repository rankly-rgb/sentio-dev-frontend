import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { postNudgeResponse } from '@/lib/queries/playbook-queries';
import type { AttributionStatusValue, NudgeResponseValue } from '@/lib/types/playbook';

// sentio-dev-backend API_CONTRACTS.md § 8.4 only returns nudge_response/nudge_responded_at as the
// result of POST .../nudge-response — there is no GET exposing it per execution.
// "Already answered" can therefore only be tracked for the lifetime of this
// component (page visit), not durably across reloads — a documented contract gap,
// flagged rather than worked around by guessing at an endpoint that doesn't exist.
export function usePlaybookOutcomeNudge(
  executionId: string,
  attributionStatus: AttributionStatusValue | undefined,
) {
  const [nudgeResponse, setNudgeResponse] = useState<NudgeResponseValue | null>(null);
  const [nudgeRespondedAt, setNudgeRespondedAt] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (response: NudgeResponseValue) => postNudgeResponse(executionId, response),
    onSuccess: (data) => {
      setNudgeResponse(data.nudge_response);
      setNudgeRespondedAt(data.nudge_responded_at);
    },
  });

  const isNudgeDue = attributionStatus === 'expired' && nudgeResponse === null;

  return {
    isNudgeDue,
    nudgeResponse,
    nudgeRespondedAt,
    submitNudge: mutation.mutate,
    isSubmitting: mutation.isPending,
  };
}
