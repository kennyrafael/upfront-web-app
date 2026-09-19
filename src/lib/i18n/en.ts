import type { Dictionary } from './pt';

/**
 * English, typed against the Portuguese dictionary.
 *
 * `Dictionary` is `typeof pt`, so this object must match it key for key and signature for
 * signature. A string added to `pt.ts` and forgotten here does not compile.
 */
export const en: Dictionary = {
  common: {
    save: 'Save',
    cancel: 'Cancel',
    close: 'Close',
    optional: 'Optional.',
    loading: 'Loading…',
    email: 'Email',
    phone: 'Phone',
    password: 'Password',
    yourName: 'Your name',
  },

  locale: {
    label: 'Language',
  },

  auth: {
    signIn: 'Sign in',
    signInSubtitle: 'Manage your bookings, clients and recibos in one place.',
    newHere: 'New to Upfront?',
    createAccount: 'Create an account',
    forgotPassword: 'Forgotten your password?',

    createTitle: 'Create your account',
    createSubtitle: 'Set up your provider profile — it takes about a minute.',
    haveAccount: 'Already have an account?',

    businessName: 'Business name',
    businessNameHint: 'Optional — you can add it later.',
  },

  publicBooking: {
    pageNotFound: 'Page not found',
    noPageHere: 'There is no booking page at this address.',

    stepService: 'Book an appointment',
    stepServiceSub: 'What would you like?',
    stepPerson: 'Who with?',
    stepPersonSub: 'Anyone, or somebody in particular.',
    stepSlot: 'Pick a time',
    stepDetails: 'Your details',

    almostThere: 'Almost there',
    bookedIn: "You're booked in",
    reference: 'Reference',
    depositPaid: 'Deposit paid:',
    heldSlot: 'Your slot is held. The rest is due at your appointment.',
    willConfirm: (businessName: string) =>
      `${businessName} will be in touch to confirm. We have sent you the details.`,
    viewOrCancel: 'View or cancel this booking',

    poweredBy: 'Booking powered by Upfront',
    nothingBookable: 'There is nothing bookable here just yet. Please check back soon.',

    anyone: 'Anyone',
    anyoneHint: 'Whoever is free. Usually the most times to choose from.',

    backToServices: '← Services',
    backToTimes: '← Times',
    findingTimes: 'Finding free times…',
    nothingFree: 'Nothing free on this day. Try another.',
    zoneWarning: (timezone: string) =>
      `Times are shown in ${timezone}, which is not your device's timezone.`,
    zoneNote: (timezone: string) => `Times shown in ${timezone}.`,

    nameError: 'Tell us who the booking is for',
    phoneError: 'We need a phone number to reach you',
    phoneHint: 'So we can reach you about this appointment.',
    emailHint: 'Optional — we will email your confirmation and a reminder.',
    notesLabel: 'Anything we should know?',

    depositLead: (amount: string) => `A ${amount} deposit holds this slot.`,
    depositHow:
      'You will approve it in MB WAY on the next screen; the rest is due at your appointment.',
    depositNotRefundable:
      'It is not refundable — but you can move your appointment, and it moves with you.',

    continueToDeposit: 'Continue to deposit',
    requestThisTime: 'Request this time',
  },
};
