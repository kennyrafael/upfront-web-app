import { create } from 'zustand';
import {
  ApiError,
  type CreatePublicBookingPayload,
  type DepositStatus,
  type PublicBooking,
  type PublicProvider,
  publicApi,
} from '@/lib/api';

type Step = 'service' | 'slot' | 'details' | 'payment' | 'done';

interface BookingResult {
  reference: string;
  manageToken: string;
  nextStep: 'confirmed' | 'payment_required';
  deposit?: { amountCents: number; expiresAt: string };
}

interface PublicBookingState {
  slug: string | null;
  provider: PublicProvider | null;
  step: Step;
  serviceId: string | null;
  /** Midnight of the day being browsed, as a local Date used only as a calendar cursor. */
  day: Date;
  slots: string[];
  selectedSlot: string | null;
  result: BookingResult | null;
  /** Kept so the waiting screen can say which phone the MB WAY request went to. */
  clientPhone: string;
  /** Where the deposit got to, once there is one to watch. */
  depositStatus: DepositStatus | null;
  status: 'idle' | 'loading' | 'loadingSlots' | 'saving';
  error: string | null;
  loadProvider: (slug: string) => Promise<void>;
  chooseService: (serviceId: string) => Promise<void>;
  setDay: (day: Date) => Promise<void>;
  loadSlots: () => Promise<void>;
  selectSlot: (slot: string) => void;
  back: () => void;
  book: (details: Omit<CreatePublicBookingPayload, 'serviceId' | 'startsAt'>) => Promise<boolean>;
  /** One poll of the deposit's state. The gateway tells the server, never this page. */
  refreshDeposit: () => Promise<void>;
  reset: () => void;
}

function toMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return 'Something went wrong. Please try again.';
}

function startOfLocalDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export const usePublicBookingStore = create<PublicBookingState>((set, get) => ({
  slug: null,
  provider: null,
  step: 'service',
  serviceId: null,
  day: startOfLocalDay(new Date()),
  slots: [],
  selectedSlot: null,
  result: null,
  clientPhone: '',
  depositStatus: null,
  status: 'idle',
  error: null,

  loadProvider: async (slug) => {
    set({ status: 'loading', error: null, slug });
    try {
      set({ provider: await publicApi.provider(slug), status: 'idle' });
    } catch (error) {
      set({ status: 'idle', error: toMessage(error) });
    }
  },

  chooseService: async (serviceId) => {
    set({ serviceId, step: 'slot', selectedSlot: null });
    await get().loadSlots();
  },

  setDay: async (day) => {
    set({ day: startOfLocalDay(day), selectedSlot: null });
    await get().loadSlots();
  },

  loadSlots: async () => {
    const { slug, serviceId, day } = get();
    if (!slug || !serviceId) return;

    set({ status: 'loadingSlots', error: null });
    try {
      const from = new Date(day);
      const to = new Date(day);
      to.setDate(to.getDate() + 1);

      set({
        slots: await publicApi.availability(slug, serviceId, from.toISOString(), to.toISOString()),
        status: 'idle',
      });
    } catch (error) {
      set({ status: 'idle', slots: [], error: toMessage(error) });
    }
  },

  selectSlot: (slot) => set({ selectedSlot: slot, step: 'details' }),

  back: () => {
    const { step } = get();
    if (step === 'details') set({ step: 'slot', error: null });
    else if (step === 'slot') set({ step: 'service', serviceId: null, slots: [], error: null });
  },

  book: async (details) => {
    const { slug, serviceId, selectedSlot } = get();
    if (!slug || !serviceId || !selectedSlot) return false;

    set({ status: 'saving', error: null });
    try {
      const result = await publicApi.book(slug, {
        ...details,
        serviceId,
        startsAt: selectedSlot,
      });

      set({
        result,
        clientPhone: details.phone,
        step: result.nextStep === 'payment_required' ? 'payment' : 'done',
        depositStatus: result.nextStep === 'payment_required' ? 'pending' : null,
        status: 'idle',
      });
      return true;
    } catch (error) {
      // The slot may have gone while the form was being filled in, so refresh what is
      // left rather than leaving a stale list on screen next to the error.
      set({ status: 'idle', error: toMessage(error) });
      if (error instanceof ApiError && error.status === 409) {
        set({ step: 'slot', selectedSlot: null });
        await get().loadSlots();
      }
      return false;
    }
  },

  refreshDeposit: async () => {
    const { result } = get();
    if (!result?.manageToken) return;

    try {
      const booking = await publicApi.booking(result.manageToken);
      const depositStatus = booking.deposit?.status ?? null;

      // Anything other than 'pending' is the end of the wait, one way or the other.
      set({
        depositStatus,
        ...(depositStatus === 'paid' ? { step: 'done' as const } : {}),
      });
    } catch {
      // A failed poll is not worth an error banner: the next tick will try again, and the
      // client can see for themselves whether their MB WAY app asked them anything.
    }
  },

  reset: () =>
    set({
      slug: null,
      provider: null,
      step: 'service',
      serviceId: null,
      day: startOfLocalDay(new Date()),
      slots: [],
      selectedSlot: null,
      result: null,
      clientPhone: '',
      depositStatus: null,
      status: 'idle',
      error: null,
    }),
}));

interface ManageBookingState {
  booking: PublicBooking | null;
  status: 'idle' | 'loading' | 'saving';
  error: string | null;
  load: (token: string) => Promise<void>;
  cancel: (token: string) => Promise<boolean>;
  reset: () => void;
}

export const useManageBookingStore = create<ManageBookingState>((set) => ({
  booking: null,
  status: 'idle',
  error: null,

  load: async (token) => {
    set({ status: 'loading', error: null });
    try {
      set({ booking: await publicApi.booking(token), status: 'idle' });
    } catch (error) {
      set({ status: 'idle', error: toMessage(error) });
    }
  },

  cancel: async (token) => {
    set({ status: 'saving', error: null });
    try {
      set({ booking: await publicApi.cancel(token), status: 'idle' });
      return true;
    } catch (error) {
      set({ status: 'idle', error: toMessage(error) });
      return false;
    }
  },

  reset: () => set({ booking: null, status: 'idle', error: null }),
}));
