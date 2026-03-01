import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import CreateOrganizationForm from '@/components/admin/CreateOrganizationForm';

export default function NewOrganization() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/admin/organizations"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Organizations
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Create Organization</h1>
        <p className="text-sm text-gray-500 mt-1">
          Create a new organization and generate an invitation link for the owner.
        </p>
      </div>

      <CreateOrganizationForm />
    </div>
  );
}
