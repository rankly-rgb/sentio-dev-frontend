import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
      <p className="text-xl mt-4 mb-8 text-muted-foreground">Page not found</p>
      <Button onClick={() => navigate('/dashboard')}>Back to dashboard</Button>
    </div>
  );
}
