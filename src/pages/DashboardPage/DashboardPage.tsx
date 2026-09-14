import { Badge, DashboardLayout } from '@/components';
import { useAuthStore } from '@/stores';

const NEXT_UP = [
  { label: 'Service catalog', detail: 'Sprint 2' },
  { label: 'Clients & bookings', detail: 'Sprint 3' },
  { label: 'Recibos verdes', detail: 'Sprint 4' },
  { label: 'Payments', detail: 'Sprint 5' },
];

export function DashboardPage() {
  const provider = useAuthStore((state) => state.provider);

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        Welcome, {provider?.name}
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        {provider?.businessName ?? 'Your workspace'} · {provider?.email}
      </p>

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        {NEXT_UP.map((item) => (
          <div key={item.label} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between">
              <h2 className="font-medium text-slate-900">{item.label}</h2>
              <Badge>{item.detail}</Badge>
            </div>
            <p className="mt-2 text-sm text-slate-500">Not built yet.</p>
          </div>
        ))}
      </section>
    </DashboardLayout>
  );
}
