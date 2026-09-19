/**
 * Português de Portugal, and the source of truth for every string in the app.
 *
 * **This file defines the shape.** `Dictionary` is `typeof pt`, so `en.ts` has to match it
 * key for key *and signature for signature* — a missing translation is a build failure
 * rather than a sentence that quietly appears in the wrong language.
 *
 * **Anything with a value in it is a function, not a template string.** `depositLead:
 * (amount: string) => ...` forces the other language to take the same argument, which a
 * `{amount}` placeholder inside a string cannot do: mistype it and you ship the literal
 * braces. It also means no interpolation machinery at runtime, and plurals are an ordinary
 * ternary — Portuguese, English and Spanish all have two forms, so `Intl.PluralRules`
 * would be a dependency to express `n === 1`.
 *
 * **No arrays of translatable content**, deliberately: three items in one language and two
 * in the other would typecheck perfectly and ship wrong. Components hold the structure.
 *
 * pt-PT, not pt-BR: *marcação* rather than *agendamento*, *sinal* rather than *depósito*,
 * *telemóvel*, *palavra-passe*, *ecrã*, *eliminar* rather than *deletar*.
 *
 * Dates, times, money and durations are **not** in here. They come from `Intl` through the
 * helpers in `lib/utils`, which follow the chosen locale on their own — see `locale.ts`.
 */
export const pt = {
  common: {
    save: 'Guardar',
    cancel: 'Cancelar',
    close: 'Fechar',
    delete: 'Eliminar',
    edit: 'Editar',
    done: 'Concluído',
    optional: 'Opcional.',
    loading: 'A carregar…',
    email: 'Email',
    phone: 'Telemóvel',
    password: 'Palavra-passe',
    yourName: 'O seu nome',
    name: 'Nome',
    notes: 'Notas',
    amount: 'Valor',
    euros: 'Euros.',
    status: 'Estado',
    price: 'Preço',
    duration: 'Duração',
  },

  locale: {
    label: 'Idioma',
  },

  nav: {
    overview: 'Resumo',
    services: 'Serviços',
    bookings: 'Marcações',
    clients: 'Clientes',
    payments: 'Pagamentos',
    compliance: 'Fiscal',
    openMenu: 'Abrir menu',
    closeMenu: 'Fechar menu',
    expandMenu: 'Expandir menu',
    collapseMenu: 'Encolher menu',
  },

  account: {
    yourProfile: 'O seu perfil',
    settings: 'Definições',
    appearance: 'Aspeto',
    light: 'Claro',
    dark: 'Escuro',
    system: 'Sistema',
    colour: 'Cor',
    signOut: 'Terminar sessão',
  },

  notifications: {
    title: 'Notificações',
    withCount: (unread: number) =>
      unread > 0 ? `Notificações, ${unread} por ler` : 'Notificações',
    markedRead: 'Marcadas como lidas',
    empty: 'Nada por agora. Marcações, anulações e sinais aparecem aqui.',
    dismiss: (title: string) => `Dispensar: ${title}`,
  },

  verifyEmail: {
    confirm: 'Confirme o seu endereço de email',
    body: (email: string) =>
      `Enviámos um link para ${email}. Confirmar permite publicar a sua página de marcações e garante que os avisos de pagamento lhe chegam.`,
    sent: 'Enviado — veja a sua caixa de entrada.',
    sendAgain: 'Enviar outra vez',
  },

  dashboard: {
    welcome: (name: string) => `Olá, ${name}`,
    editProfile: 'Editar perfil',
    serviceCatalog: 'Catálogo de serviços',
    manage: 'Gerir',
    bookableFrom: (count: number, cheapest: string | null) =>
      `${count === 1 ? 'serviço disponível' : 'serviços disponíveis'}${cheapest ? `, desde ${cheapest}` : ''}`,
    addFirstService: 'Adicione o seu primeiro serviço',
    workingWeek: 'Semana de trabalho',
    setYourHours: 'Defina o seu horário',
    today: 'Hoje',
    openCalendar: 'Abrir agenda',
    nothingToday: 'Nada marcado para hoje.',
    addABooking: 'Criar uma marcação',
    clients: 'Clientes',
    onTheBooks: 'em ficha',
    money: 'Dinheiro',
    openLedger: 'Ver movimentos',
    collected: 'Recebido',
    outstanding: 'Em dívida',
    pending: 'Pendente',
    /** Plural by ternary. Portuguese has two forms, like English, so this is the whole rule. */
    bookingCount: (count: number) => `${count} ${count === 1 ? 'marcação' : 'marcações'}`,
  },

  services: {
    title: 'Serviços',
    lede: 'O que oferece, quanto tempo demora e quanto custa.',
    newService: 'Novo serviço',
    showArchived: 'Mostrar arquivados',
    loading: 'A carregar serviços…',
    emptyTitle: 'Ainda não há serviços',
    emptyBody: 'Adicione o que oferece — nome, duração e preço.',
    columnService: 'Serviço',
    thisService: 'este serviço',
    bookable: 'Disponível',
    archived: 'Arquivado',
    deleteTitle: (name: string) => `Eliminar ${name}?`,
    deleteConfirm:
      'Isto elimina o serviço definitivamente. Para o manter nas marcações antigas, arquive-o desligando “Disponível”.',

    formLede: 'A duração e o preço são a base das marcações e dos recibos.',
    description: 'Descrição',
    descriptionHint: 'Opcional — visível para si, ainda não para os clientes.',
    durationHint: 'Minutos.',
    priceHint: 'Euros, por exemplo 18,50.',
    archivedHint: 'Os serviços arquivados continuam nas marcações antigas.',
    errorName: 'Dê um nome ao serviço',
    errorDuration: 'Entre 5 e 480 minutos',
    errorPrice: 'Use um número como 18 ou 18,50',
    editTitle: 'Editar serviço',
    newTitle: 'Novo serviço',
    saveButton: 'Guardar serviço',
    addButton: 'Adicionar serviço',
  },

  clients: {
    title: 'Clientes',
    lede: 'Toda a gente que atende, e o que precisa de saber sobre cada um.',
    newClient: 'Novo cliente',
    search: 'Pesquisar nome, telemóvel ou email',
    searchLabel: 'Pesquisar clientes',
    loading: 'A carregar clientes…',
    columnClient: 'Cliente',
    thisClient: 'este cliente',
    noMatch: 'Nenhum cliente corresponde à pesquisa',
    noMatchHint: 'Experimente um nome, número ou email.',
    emptyTitle: 'Ainda não há clientes',
    emptyBody: 'Adicione as pessoas que atende. Um nome é suficiente para começar.',
    deleteTitle: (name: string) => `Eliminar ${name}?`,
    deleteConfirm:
      'Isto elimina o cliente definitivamente. Clientes com marcações não podem ser eliminados.',

    formLede: 'Só o nome é obrigatório — o resto pode vir depois.',
    notesHint: 'Preferências, alergias, o que valha a pena lembrar.',
    errorName: 'Dê um nome ao cliente',
    errorEmail: 'Isso não parece um endereço de email',
    editTitle: 'Editar cliente',
    newTitle: 'Novo cliente',
    saveButton: 'Guardar cliente',
    addButton: 'Adicionar cliente',
  },

  bookings: {
    title: 'Marcações',
    newBooking: 'Nova marcação',
    week: 'Semana',
    day: 'Dia',
    thisWeek: 'Esta semana',
    previous: '← Anterior',
    next: 'Seguinte →',
    today: 'Hoje',
    whoseWeek: 'Semana de quem',
    everyone: 'Toda a gente',
    dayHint: 'Uma coluna por pessoa a trabalhar hoje. Clique num espaço livre para marcar.',
    weekHint:
      'Clique num espaço livre para marcar, ou numa marcação para a editar. As faixas sombreadas são o horário de trabalho.',
    bookedOnline: 'Marcado pelo cliente online',
    bookedOnlineShort: 'Marcado online:',

    formLede: 'A hora de fim vem dos serviços escolhidos; sobreposições são recusadas.',
    client: 'Cliente',
    chooseClient: 'Escolha um cliente',
    with: 'Com',
    whoeverIsFree: 'Quem estiver livre',
    servicesLabel: 'Serviços',
    addService: 'Adicionar um serviço',
    addAnotherService: 'Adicionar outro serviço',
    chooseService: 'Escolha um serviço',
    servicesHint: 'A marcação dura o que durar tudo o que estiver nela, e é somada da mesma forma.',
    total: 'Total:',
    date: 'Data',
    startTime: 'Hora de início',
    outsideHours: 'Marcar fora do horário',
    outsideHoursHint: 'Só ignora a verificação do horário, nunca uma sobreposição.',
    errorClient: 'Escolha um cliente',
    errorService: 'Escolha pelo menos um serviço',
    errorWhen: 'Escolha uma data e hora válidas',
    editTitle: 'Editar marcação',
    newTitle: 'Nova marcação',
    saveButton: 'Guardar marcação',
    addButton: 'Adicionar marcação',

    statusPending: 'Pendente',
    statusConfirmed: 'Confirmada',
    statusCompleted: 'Concluída',
    statusCancelled: 'Anulada',
    statusNoShow: 'Faltou',
  },

  payments: {
    title: 'Pagamentos',
    lede: 'O que já recebeu, e o que ainda está em dívida.',
    collected: 'Recebido',
    outstanding: 'Em dívida',
    pending: 'Pendente',
    pendingHint: 'Registado mas ainda não recebido — uma transferência a caminho, por exemplo.',
    settled: 'Liquidado',

    loading: 'A carregar os movimentos…',
    columnBooking: 'Marcação',
    columnDate: 'Data',
    columnPaid: 'Pago',
    partPaid: 'Parcial',
    overpaid: 'Pago a mais',
    nothingToSettle: 'Nada a liquidar por agora',
    everythingSettled: 'Está tudo liquidado',
    nothingSettled: 'Ainda nada liquidado',
    ledgerEmpty:
      'As marcações aparecem aqui assim que existirem. Registe o que receber contra cada uma.',
    tryAnotherFilter: 'Experimente outro filtro.',

    dialogTitle: 'Registar pagamento',
    recordedSoFar: 'Registado até agora',
    method: 'Método',
    markPaid: 'Marcar como pago',
    refund: 'Reembolsar',
    notCollectedYet: 'Ainda não recebido',
    pendingExplainer:
      'Regista como pendente — só conta como recebido depois de o marcar como pago.',
    errorAmount: 'Use um valor como 18 ou 18,50',
    methodCash: 'Dinheiro',
    methodCard: 'Cartão',
    methodTransfer: 'Transferência bancária',
    methodMbway: 'MB WAY',
    methodOther: 'Outro',
    statusPending: 'Pendente',
    statusPaid: 'Pago',
    statusRefunded: 'Reembolsado',
  },

  balance: {
    title: 'Cobrar',
    checking: 'A ver o que falta…',
    paidInFull: 'Está pago na totalidade. Não há nada a cobrar.',
    waitingFor: (name: string, amount: string) => `A aguardar que ${name} aprove ${amount}`,
    waitingOn: (phone: string) => ` no ${phone}`,
    pushExplainer:
      'Aparece no telemóvel como um pedido MB WAY do seu negócio. Se pagarem em dinheiro, registe esse pagamento e este pedido é retirado automaticamente.',
    checkAgain: 'Ver outra vez',
    withdraw: 'Retirar',
    collectedOf: (paid: string, price: string) => `${paid} de ${price} recebidos.`,
    stillOwed: (amount: string) => `${amount} ainda em dívida.`,
    amountHint: 'Mais do que o devido também serve — uma gorjeta.',
    toThisNumber: 'Para este número',
    readItBack: 'Confirme o número antes de enviar.',
    sendRequest: 'Enviar o pedido',
    errorRead: 'Não foi possível ver o que falta.',
    errorSend: 'Não foi possível enviar o pedido.',
    errorWithdraw: 'Não foi possível retirar o pedido.',
  },

  compliance: {
    title: 'Fiscal',
    lede: 'Recibos verdes, a sua posição de IVA e o que vem a seguir.',
    fiscalYear: 'Ano fiscal',
    exportCsv: 'Exportar CSV',
    newRecibo: 'Novo recibo',
    loading: 'A carregar a sua posição fiscal…',
    copy: 'Copiar',
    dismiss: 'Dispensar',
    ceilingTitle: 'Tecto de isenção de IVA',
    ceilingShare: 'Parte do tecto de isenção já usada',
    notYetBilled: 'Ainda não faturado',
    allOnRecibos: 'Todas as marcações concluídas este ano estão num recibo.',
    nextDeadlines: 'Próximos prazos',
    withinExemption: 'Dentro da isenção',
    approachingCeiling: 'A aproximar-se do tecto',
    ceilingExceeded: 'Tecto ultrapassado',
  },

  deposit: {
    title: 'Sinal para segurar a hora',
    open: 'Abrir',
    timeLeft: 'restantes',
    keepOpen: 'Mantenha esta página aberta. O resto é pago no dia da marcação.',
    notHeld: 'A hora não ficou reservada',
    nothingCharged: 'Não foi cobrado nada.',
    pickAnother: 'Escolher outra hora',
  },

  manageBooking: {
    notFound: 'Marcação não encontrada',
    linkInvalid: 'Este link já não é válido. Verifique o endereço, ou contacte o negócio.',
    yourBooking: 'A sua marcação',
    reference: 'Referência',
    moveToAnother: 'Mudar para outra hora',
    cancelThis: 'Anular esta marcação',
    cancelConfirm: 'Anular esta marcação?',
    cancelYes: 'Sim, anular',
    welcomeBack: 'Pode voltar a marcar quando quiser.',
    awaitingConfirmation: 'A aguardar confirmação',
    confirmed: 'Confirmada',
    completed: 'Concluída',
    cancelled: 'Anulada',
    notHeld: 'Não reservada — sinal por pagar',
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
    zoneWarning: (timezone: string) =>
      `As horas são apresentadas em ${timezone}, que não é o fuso do seu dispositivo.`,
    zoneNote: (timezone: string) => `Horas apresentadas em ${timezone}.`,

    nameError: 'Diga-nos para quem é a marcação',
    phoneError: 'Precisamos de um número para o contactar',
    phoneHint: 'Para o contactarmos sobre esta marcação.',
    emailHint: 'Opcional — enviamos a confirmação e um lembrete por email.',
    notesLabel: 'Algo que devamos saber?',

    depositLead: (amount: string) => `Um sinal de ${amount} segura esta hora.`,
    depositHow: 'Vai aprová-lo no MB WAY no ecrã seguinte; o resto é pago no dia da marcação.',
    depositNotRefundable: 'Não é reembolsável — mas pode remarcar, e o sinal vai consigo.',

    continueToDeposit: 'Continuar para o sinal',
    requestThisTime: 'Pedir esta hora',
  },
};

export type Dictionary = typeof pt;
