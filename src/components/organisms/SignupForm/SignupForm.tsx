import { type FormEvent, useState } from 'react';
import { Button } from '@/components/atoms';
import { FormField } from '@/components/molecules';
import { useAuthStore } from '@/stores';

export interface SignupFormProps {
  onSuccess: () => void;
}

const MIN_PASSWORD_LENGTH = 8;

export function SignupForm({ onSuccess }: SignupFormProps) {
  const signup = useAuthStore((state) => state.signup);
  const status = useAuthStore((state) => state.status);
  const error = useAuthStore((state) => state.error);

  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string>();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password.length < MIN_PASSWORD_LENGTH) {
      setPasswordError(`Use at least ${MIN_PASSWORD_LENGTH} characters`);
      return;
    }
    setPasswordError(undefined);

    const created = await signup({
      name,
      email,
      password,
      businessName: businessName || undefined,
      phone: phone || undefined,
    });
    if (created) {
      onSuccess();
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
      <FormField
        label="Your name"
        name="name"
        autoComplete="name"
        required
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      <FormField
        label="Business name"
        name="businessName"
        hint="Optional — you can add it later."
        value={businessName}
        onChange={(event) => setBusinessName(event.target.value)}
      />
      <FormField
        label="Email"
        type="email"
        name="email"
        autoComplete="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <FormField
        label="Phone"
        type="tel"
        name="phone"
        autoComplete="tel"
        hint="Optional."
        value={phone}
        onChange={(event) => setPhone(event.target.value)}
      />
      <FormField
        label="Password"
        type="password"
        name="password"
        autoComplete="new-password"
        required
        error={passwordError}
        hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      {error ? (
        <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger-ink">
          {error}
        </p>
      ) : null}
      <Button type="submit" fullWidth loading={status === 'loading'}>
        Create account
      </Button>
    </form>
  );
}
