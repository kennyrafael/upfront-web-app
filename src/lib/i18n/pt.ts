/**
 * Português de Portugal, and the source of truth for every string in the app.
 *
 * **This file defines the shape.** `Dictionary` is `typeof pt`, so `en.ts` has to match it
 * key for key *and signature for signature* — a missing translation is a build failure
 * rather than a sentence that quietly appears in the wrong language.
 *
 * **Anything with a value in it is a function, not a template string.** `deposit: (amount:
 * string) => ...` forces the other language to take the same argument, which a `{amount}`
 * placeholder inside a string cannot do: mistype it and you ship the literal braces. It
 * also means no interpolation machinery at runtime, and plurals are an ordinary ternary —
 * Portuguese, English and Spanish all have two forms, so `Intl.PluralRules` would be a
 * dependency to express `n === 1`.
 *
 * **No arrays of translatable content**, deliberately: three items in one language and two
 * in the other would typecheck perfectly and ship wrong. Components hold the structure.
 *
 * pt-PT, not pt-BR: *marcação* rather than *agendamento*, *sinal* rather than *depósito*,
 * *telemóvel*, *palavra-passe*, *ecrã*.
 *
 * Dates, times, money and durations are **not** in here. They come from `Intl` through the
 * helpers in `lib/utils`, which follow the chosen locale on their own — see `locale.ts`.
 */
export const pt = {
  common: {
    save: 'Guardar',
    cancel: 'Cancelar',
    close: 'Fechar',
    optional: 'Opcional.',
    loading: 'A carregar…',
    email: 'Email',
    phone: 'Telemóvel',
    password: 'Palavra-passe',
    yourName: 'O seu nome',
  },

  locale: {
    label: 'Idioma',
  },

  auth: {
    signIn: 'Entrar',
    signInSubtitle: 'Faça a gestão das marcações, dos clientes e dos recibos num só sítio.',
    newHere: 'Ainda não tem conta?',
    createAccount: 'Criar conta',
    forgotPassword: 'Esqueceu-se da palavra-passe?',

    createTitle: 'Criar a sua conta',
    createSubtitle: 'Configure o seu perfil — demora cerca de um minuto.',
    haveAccount: 'Já tem conta?',

    businessName: 'Nome do negócio',
    businessNameHint: 'Opcional — pode adicionar mais tarde.',
  },

  publicBooking: {
    pageNotFound: 'Página não encontrada',
    noPageHere: 'Não existe nenhuma página de marcações neste endereço.',

    stepService: 'Marcar um serviço',
    stepServiceSub: 'O que procura?',
    stepPerson: 'Com quem?',
    stepPersonSub: 'Qualquer pessoa, ou alguém em particular.',
    stepSlot: 'Escolha uma hora',
    stepDetails: 'Os seus dados',

    almostThere: 'Falta pouco',
    bookedIn: 'Marcação feita',
    reference: 'Referência',
    depositPaid: 'Sinal pago:',
    heldSlot: 'A sua hora está reservada. O resto é pago no dia da marcação.',
    willConfirm: (businessName: string) =>
      `${businessName} entrará em contacto para confirmar. Enviámos-lhe os detalhes.`,
    viewOrCancel: 'Ver ou anular esta marcação',

    poweredBy: 'Marcações com a Upfront',
    nothingBookable: 'Ainda não há nada para marcar aqui. Volte em breve.',

    anyone: 'Qualquer pessoa',
    anyoneHint: 'Quem estiver livre. Normalmente com mais horas à escolha.',

    backToServices: '← Serviços',
    backToTimes: '← Horas',
    findingTimes: 'A procurar horas livres…',
    nothingFree: 'Nada livre neste dia. Experimente outro.',
    /** The visitor's clock disagrees with the shop's, which is when it could mislead. */
    zoneWarning: (timezone: string) =>
      `As horas são apresentadas em ${timezone}, que não é o fuso do seu dispositivo.`,
    zoneNote: (timezone: string) => `Horas apresentadas em ${timezone}.`,

    nameError: 'Diga-nos para quem é a marcação',
    phoneError: 'Precisamos de um número para o contactar',
    phoneHint: 'Para o contactarmos sobre esta marcação.',
    emailHint: 'Opcional — enviamos a confirmação e um lembrete por email.',
    notesLabel: 'Algo que devamos saber?',

    /** Said before the button, never after: a surprise deposit ends in a chargeback. */
    depositLead: (amount: string) => `Um sinal de ${amount} segura esta hora.`,
    depositHow: 'Vai aprová-lo no MB WAY no ecrã seguinte; o resto é pago no dia da marcação.',
    depositNotRefundable: 'Não é reembolsável — mas pode remarcar, e o sinal vai consigo.',

    continueToDeposit: 'Continuar para o sinal',
    requestThisTime: 'Pedir esta hora',
  },
};

export type Dictionary = typeof pt;
