import { Ellipsis } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { RowAction } from '@/core/types/ui.types';

/** The "⋯" menu at the end of every table row, so row actions look and behave the same everywhere. */
export function RowActions({ label, actions }: { label: string; actions: RowAction[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={label}>
          <Ellipsis className="size-5" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.map((action) => (
          <div key={action.label}>
            {action.separated && <DropdownMenuSeparator />}
            {action.to ? (
              <DropdownMenuItem asChild tone={action.tone}>
                <Link to={action.to}>
                  <action.icon className="size-4" aria-hidden />
                  {action.label}
                </Link>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem tone={action.tone} onSelect={action.onSelect}>
                <action.icon className="size-4" aria-hidden />
                {action.label}
              </DropdownMenuItem>
            )}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
