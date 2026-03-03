import { Braces } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { fr } from '@/i18n/fr';
import { EMAIL_VARIABLES } from '@/lib/types/playbook';

interface Props {
  onInsert: (variable: string) => void;
}

export default function VariableInserter({ onInsert }: Props) {
  const categories = Object.entries(EMAIL_VARIABLES) as [
    keyof typeof EMAIL_VARIABLES,
    readonly string[],
  ][];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5">
          <Braces className="h-3.5 w-3.5" />
          {fr.workflows.insertVariable}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        {categories.map(([category, variables]) => (
          <div key={category} className="mb-2 last:mb-0">
            <p className="text-xs font-semibold text-muted-foreground px-2 py-1">
              {fr.workflows.variableCategories[category]}
            </p>
            {variables.map((variable) => {
              const key = `${category}.${variable}`;
              const label =
                fr.workflows.variables[variable as keyof typeof fr.workflows.variables] ?? variable;
              return (
                <button
                  key={key}
                  type="button"
                  className="w-full text-left text-sm px-2 py-1 rounded hover:bg-accent transition-colors"
                  onClick={() => onInsert(`{{${key}}}`)}
                >
                  <span className="font-mono text-xs text-muted-foreground">{`{{${key}}}`}</span>
                  <span className="ml-2 text-xs">{label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );
}
