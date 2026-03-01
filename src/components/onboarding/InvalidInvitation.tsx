import { Link } from 'react-router-dom';
import { XCircle, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface InvalidInvitationProps {
  error: string;
}

const errorConfig: Record<
  string,
  { icon: React.ElementType; color: string; bgColor: string; title: string; message: string }
> = {
  invalid_token: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    title: 'Invalid Invitation',
    message:
      'This invitation link is not valid. Please check the link or contact your administrator for a new invitation.',
  },
  expired: {
    icon: Clock,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    title: 'Invitation Expired',
    message:
      'This invitation has expired. Please contact your administrator to receive a new invitation link.',
  },
  already_used: {
    icon: CheckCircle,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    title: 'Invitation Already Used',
    message: 'This invitation has already been accepted. You can log in with your credentials.',
  },
  network_error: {
    icon: AlertTriangle,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    title: 'Connection Error',
    message:
      'Unable to validate this invitation. Please check your internet connection and try again.',
  },
};

export default function InvalidInvitation({ error }: InvalidInvitationProps) {
  const config = errorConfig[error] || errorConfig.invalid_token;
  const Icon = config.icon;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow text-center">
        <div
          className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${config.bgColor}`}
        >
          <Icon className={`h-8 w-8 ${config.color}`} />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">{config.title}</h2>
        <p className="text-gray-600 mb-6">{config.message}</p>
        {error === 'already_used' && (
          <Link to="/login">
            <Button className="bg-gradient-primary hover:opacity-90 text-white">
              Go to Login
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
