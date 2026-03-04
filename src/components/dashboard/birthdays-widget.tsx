import { Cake, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BirthdayEntry {
  id: string;
  name: string;
  daysUntil: number;
  date?: Date | string;
}

interface AnniversaryEntry {
  id: string;
  name: string;
  daysUntil: number;
  yearsOfService: number;
  date?: Date | string;
}

interface BirthdaysWidgetProps {
  birthdays: BirthdayEntry[];
  anniversaries: AnniversaryEntry[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BirthdaysWidget({ birthdays, anniversaries }: BirthdaysWidgetProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Cake className="h-4 w-4 text-pink-600" />
          Upcoming Celebrations
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Birthdays section */}
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Birthdays
          </h4>
          {birthdays.length === 0 ? (
            <p className="text-xs text-gray-400 italic">No upcoming birthdays</p>
          ) : (
            <ul className="space-y-1.5">
              {birthdays.map((b) => (
                <CelebrationRow
                  key={b.id}
                  name={b.name}
                  daysUntil={b.daysUntil}
                  icon={<Cake className="h-3.5 w-3.5 text-pink-500" />}
                  accent="text-pink-700"
                />
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-gray-100" />

        {/* Anniversaries section */}
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Work Anniversaries
          </h4>
          {anniversaries.length === 0 ? (
            <p className="text-xs text-gray-400 italic">No upcoming anniversaries</p>
          ) : (
            <ul className="space-y-1.5">
              {anniversaries.map((a) => (
                <CelebrationRow
                  key={a.id}
                  name={a.name}
                  daysUntil={a.daysUntil}
                  icon={<Trophy className="h-3.5 w-3.5 text-amber-500" />}
                  accent="text-amber-700"
                  badge={`${a.yearsOfService} yr${a.yearsOfService !== 1 ? 's' : ''}`}
                />
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Row subcomponent ─────────────────────────────────────────────────────────

function CelebrationRow({
  name,
  daysUntil,
  icon,
  accent,
  badge,
}: {
  name: string;
  daysUntil: number;
  icon: React.ReactNode;
  accent: string;
  badge?: string;
}) {
  const daysLabel =
    daysUntil === 0
      ? 'Today!'
      : daysUntil === 1
        ? 'Tomorrow'
        : `in ${daysUntil} days`;

  return (
    <li className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-gray-800 font-medium">{name}</span>
        {badge && (
          <span className={`rounded-full border px-1.5 py-0.5 text-xs font-medium ${accent} border-current opacity-70`}>
            {badge}
          </span>
        )}
      </div>
      <span
        className={`shrink-0 text-xs font-semibold ${daysUntil === 0 ? 'text-green-600' : 'text-gray-500'}`}
      >
        {daysLabel}
      </span>
    </li>
  );
}
