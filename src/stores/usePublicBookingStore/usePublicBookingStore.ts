import { create } from 'zustand';
import {
  ApiError,
  type CreatePublicBookingPayload,
  type DepositStatus,
  type PublicBooking,
  type PublicProvider,
  type PublicSlot,
  publicApi,
} from '@/lib/api';

type Step = 'service' | 'person' | 'slot' | 'details' | 'payment' | 'done';

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
  /**
   * Who the client asked for, or null for anyone.
   *
   * Null is a real answer, not a missing one: it is what lets the shop move the appointment
   * to another pair of hands later without a conversation.
   */
  employeeId: string | null;
  /** Midnight of the day being browsed, as a local Date used only as a calendar cursor. */
  day: Date;
  /** Each start, with everybody who could take it — so the page can grey out the rest. */
  slots: PublicSlot[];
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
  choosePerson: (employeeId: string | null) => Promise<void>;
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
  employeeId: null,
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

  /**
   * Service first, then who — the order a client thinks in, and the order that lets the
   * person step know which of the shop's people are even relevant.
   *
   * A one-person shop never sees the step: `provider.people` is empty and this goes straight
   * to the times, because asking "who with?" when there is one answer is a click to nowhere.
   */
  chooseService: async (serviceId) => {
    const { provider } = get();
    // People who do *this* service, not everybody. Offering the colourist for a haircut
    // leads to an empty grid with no explanation, which reads as a broken page.
    const qualified = provider?.services.find((s) => s.id === serviceId)?.employeeIds ?? [];
    const hasChoice = qualified.length > 1;

    set({ serviceId, employeeId: null, selectedSlot: null, step: hasChoice ? 'person' : 'slot' });
    if (!hasChoice) await get().loadSlots();
  },

  choosePerson: async (employeeId) => {
    set({ employeeId, step: 'slot', selectedSlot: null });
    await get().loadSlots();
  },

  setDay: async (day) => {
    set({ day: startOfLocalDay(day), selectedSlot: null });
    await get().loadSlots();
  },

  loadSlots: async () => {
    const { slug, serviceId, day, employeeId } = get();
    if (!slug || !serviceId) return;

    set({ status: 'loadingSlots', error: null });
    try {
      const from = new Date(day);
      const to = new Date(day);
      to.setDate(to.getDate() + 1);

      set({
        slots: await publicApi.availability(
          slug,
          serviceId,
          from.toISOString(),
          to.toISOString(),
          undefined,
          employeeId ?? undefined,
        ),
        status: 'idle',
      });
    } catch (error) {
      set({ status: 'idle', slots: [], error: toMessage(error) });
    }
  },

  selectSlot: (slot) => set({ selectedSlot: slot, step: 'details' }),
  back: () => {
    const { step, provider, serviceId } = get();
    // People who do *this* service, not everybody. Offering the colourist for a haircut
    // leads to an empty grid with no explanation, which reads as a broken page.
    const qualified = provider?.services.find((s) => s.id === serviceId)?.employeeIds ?? [];
    const hasChoice = qualified.length > 1;

    if (step === 'details') set({ step: 'slot', error: null });
    else if (step === 'slot') {
      // Back from the times lands on the person step when there was one, and on the service
      // otherwise — so "back" always undoes exactly the last thing the client did.
      if (hasChoice) set({ step: 'person', slots: [], selectedSlot: null, error: null });
      else set({ step: 'service', serviceId: null, slots: [], error: null });
    } else if (step === 'person') {
      set({ step: 'service', serviceId: null, employeeId: null, error: null });
    }
  },

  book: async (details) => {
    const { slug, serviceId, selectedSlot, employeeId } = get();
    if (!slug || !serviceId || !selectedSlot) return false;

    set({ status: 'saving', error: null });
    try {
      const result = await publicApi.book(slug, {
        ...details,
        serviceId,
        startsAt: selectedSlot,
        // Omitted rather than sent as null when nobody was named: absent is what tells the
        // server this client did not mind, which is what a later reassignment turns on.
        ...(employeeId ? { employeeId } : {}),
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
  /** Slots offered for a move, loaded on demand rather than with the booking. */
  /** Reschedule offers the same shape; the person is fixed, so only the start is used. */
  slots: PublicSlot[];
  day: Date;
  status: 'idle' | 'loading' | 'loadingSlots' | 'saving';
  error: string | null;
  load: (token: string) => Promise<void>;
  setDay: (day: Date) => Promise<void>;
  loadSlots: () => Promise<void>;
  reschedule: (token: string, startsAt: string) => Promise<boolean>;
  cancel: (token: string) => Promise<boolean>;
  reset: () => void;
}

export const useManageBookingStore = create<ManageBookingState>((set, get) => ({
  booking: null,
  slots: [],
  day: startOfLocalDay(new Date()),
  status: 'idle',
  error: null,

  load: async (token) => {
    set({ status: 'loading', error: null });
    try {
      const booking = await publicApi.booking(token);
      // Open the picker on the day they already have, which is usually near the one they want.
      set({ booking, day: startOfLocalDay(new Date(booking.startsAt)), status: 'idle' });
    } catch (error) {
      set({ status: 'idle', error: toMessage(error) });
    }
  },

  setDay: async (day) => {
    set({ day: startOfLocalDay(day) });
    await get().loadSlots();
  },

  loadSlots: async () => {
    const { booking, day } = get();
    if (!booking) return;

    set({ status: 'loadingSlots', error: null });
    try {
      const from = new Date(day);
      const to = new Date(day);
      to.setDate(to.getDate() + 1);

      set({
        slots: await publicApi.availability(
          booking.slug,
          booking.serviceId,
          from.toISOString(),
          to.toISOString(),
          // The booking's own length, not the service's: a provider may have added a second
          // service to it, and offering slots too short to hold it would show times the
          // move is then refused for.
          booking.durationMinutes,
        ),
        status: 'idle',
      });
    } catch (error) {
      set({ status: 'idle', slots: [], error: toMessage(error) });
    }
  },

  reschedule: async (token, startsAt) => {
    set({ status: 'saving', error: null });
    try {
      set({ booking: await publicApi.reschedule(token, startsAt), status: 'idle', slots: [] });
      return true;
    } catch (error) {
      // Somebody may have taken the slot while it was being chosen, so refresh what is left
      // rather than leaving a stale grid next to the error.
      set({ status: 'idle', error: toMessage(error) });
      if (error instanceof ApiError && error.status === 409) await get().loadSlots();
      return false;
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

  reset: () => set({ booking: null, slots: [], status: 'idle', error: null }),
}));
