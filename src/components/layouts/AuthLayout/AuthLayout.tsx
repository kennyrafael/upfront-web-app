import type { ReactNode } from 'react';

export interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <p className="mb-8 text-center text-2xl font-semibold tracking-tight text-brand-700">
          Upfront
        </p>
        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
          <div className="mt-6">{children}</div>
        </div>
        {footer ? <div className="mt-6 text-center text-sm text-slate-600">{footer}</div> : null}
      </div>
    </div>
  );
}
