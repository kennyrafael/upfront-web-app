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
    add: 'Adicionar',
    delete: 'Eliminar',
    edit: 'Editar',
    done: 'Concluído',
    optional: 'Opcional.',
    loading: 'A carregar…',
    searching: 'A procurar…',
    select: 'Selecionar…',
    confirm: 'Confirmar',
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
    account: 'Conta',
    accentColour: 'Cor de destaque',
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
    category: 'Categoria',
    categoryHint: 'Agrupa o serviço na sua página de marcações.',
    noCategory: 'Sem categoria',
    otherCategory: 'Outros',
  },

  categories: {
    title: 'Categorias',
    lede: 'Os títulos que agrupam os seus serviços, pela ordem em que aparecem aos clientes.',
    empty: 'Ainda não há categorias. Crie uma para agrupar os seus serviços.',
    newCategory: 'Nova categoria',
    namePlaceholder: 'Cabelo, Barba, Unhas…',
    serviceCount: (count: number) => (count === 1 ? '1 serviço' : `${count} serviços`),
    renameLabel: (name: string) => `Mudar o nome de ${name}`,
    moveUp: (name: string) => `Mover ${name} para cima`,
    moveDown: (name: string) => `Mover ${name} para baixo`,
    deleteTitle: (name: string) => `Eliminar ${name}?`,
    deleteConfirm: (count: number) =>
      count === 0
        ? 'A categoria está vazia, por isso não muda mais nada.'
        : count === 1
          ? 'O serviço nesta categoria fica sem categoria. Não se perde nada.'
          : `Os ${count} serviços nesta categoria ficam sem categoria. Não se perde nada.`,
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
    weekOf: (range: string) => `Semana de ${range}`,
    everyone: 'Toda a gente',
    dayHint: 'Uma coluna por pessoa a trabalhar hoje. Clique num espaço livre para marcar.',
    weekHint:
      'Clique num espaço livre para marcar, ou numa marcação para a editar. As faixas sombreadas são o horário de trabalho.',
    bookedOnline: 'Marcado pelo cliente online',
    bookedOnlineShort: 'Marcado online:',
    month: 'Mês',
    thisMonth: 'Este mês',
    monthHint: 'Quão cheio está cada dia. Clique num dia para o abrir e trabalhar nele.',
    openDay: (day: string, count: number): string =>
      count === 0
        ? `Dia ${day}, sem marcações`
        : count === 1
          ? `Dia ${day}, 1 marcação`
          : `Dia ${day}, ${count} marcações`,
    andMore: (count: number) => `+${count}`,
    bookAt: (column: string, time: string) => `Marcar ${column} às ${time}`,

    formLede: 'A hora de fim vem dos serviços escolhidos; sobreposições são recusadas.',
    client: 'Cliente',
    chooseClient: 'Escolha um cliente',
    searchClient: 'Pesquise por nome ou telemóvel',
    noClientMatch: 'Nenhum cliente encontrado.',
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

    /** Indexed by booking status. Module-level maps cannot hold words — see the nav. */
    statuses: {
      pending: 'Pendente',
      confirmed: 'Confirmada',
      completed: 'Concluída',
      cancelled: 'Anulada',
      no_show: 'Faltou',
    } as Record<string, string>,
    /**
     * The return type is annotated, and has to be.
     *
     * A ternary between two plain literals infers a union of those two literals, so
     * `typeof pt` would demand that English return the Portuguese sentences. Template
     * literals widen to `string` on their own, which is why no other entry needs this.
     */
    needFirst: (what: 'client' | 'service'): string =>
      what === 'client'
        ? 'Precisa de pelo menos um cliente antes de poder marcar.'
        : 'Precisa de pelo menos um serviço antes de poder marcar.',
  },

  payments: {
    title: 'Pagamentos',
    lede: 'O que já recebeu, e o que ainda está em dívida.',
    collected: 'Recebido',
    outstanding: 'Em dívida',
    pending: 'Pendente',
    pendingHint: 'Registado mas ainda não recebido — uma transferência a caminho, por exemplo.',
    settled: 'Liquidado',

    unpaid: 'Por pagar',
    paid: 'Pago',
    recordPayment: 'Registar',
    seePayments: 'Pagamentos',
    filterAll: 'Todas',
    filterOwing: 'Em dívida',
    filterSettled: 'Liquidadas',
    acrossBookings: (count: number) => `em ${count} ${count === 1 ? 'marcação' : 'marcações'}`,
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
    dialogTitleFor: (client: string) => `Pagamentos — ${client}`,
    recordedSoFar: 'Registado até agora',
    method: 'Método',
    markPaid: 'Marcar como pago',
    refund: 'Reembolsar',
    notCollectedYet: 'Ainda não recebido',
    pendingExplainer:
      'Regista como pendente — só conta como recebido depois de o marcar como pago.',
    errorAmount: 'Use um valor como 18 ou 18,50',
    /** Indexed by `PaymentMethod`, so a component can look one up without a map of its own. */
    methods: {
      cash: 'Dinheiro',
      card: 'Cartão',
      transfer: 'Transferência bancária',
      mbway: 'MB WAY',
      other: 'Outro',
    },
    /** Indexed by the payment's own status, for the same reason `methods` is. */
    paymentStatus: { pending: 'Pendente', paid: 'Pago', refunded: 'Reembolsado' } as Record<
      string,
      string
    >,
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
    issuedOf: (limit: string) => `emitidos de ${limit}`,
    completedBookings: (count: number) =>
      `${count === 1 ? 'marcação concluída' : 'marcações concluídas'}`,
    waitingToInvoice: (total: string) => `${total} por faturar.`,
    /** Quarter labels. Short month names, so `Intl` would be more trouble than four strings. */
    quarters: ['Jan–Mar', 'Abr–Jun', 'Jul–Set', 'Out–Dez'],
  },

  deposit: {
    title: 'Sinal para segurar a hora',
    /** The whole instruction, because only the language knows where the app name goes. */
    approveOn: (phone: string) => `na app MB WAY, no ${phone}, e aprove o pedido.`,
    openApp: 'Abra o',
    timeLeft: 'restantes',
    keepOpen: 'Mantenha esta página aberta. O resto é pago no dia da marcação.',
    notHeld: 'A hora não ficou reservada',
    expiredBody: 'O sinal não foi aprovado a tempo, por isso a hora voltou a ficar disponível.',
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
    /** Indexed by booking status, so the map in the page holds only variants. */
    statuses: {
      pending: 'A aguardar confirmação',
      confirmed: 'Confirmada',
      completed: 'Concluída',
      cancelled: 'Anulada',
      expired: 'Não reservada — sinal por pagar',
      no_show: 'Faltou',
    } as Record<string, string>,
    expiredBody: 'O sinal não foi concluído a tempo, por isso esta hora voltou a ficar disponível.',
  },

  settings: {
    title: 'Definições',
    lede: 'Os seus dados, e os do negócio.',
    tabYou: 'Você',
    tabBusiness: 'Negócio',
    tabPeople: 'Pessoas',
    tabPage: 'Página de marcações',

    roles: {
      owner: 'Proprietária',
      manager: 'Gerente',
      front_desk: 'Receção',
      staff: 'Colaboradora',
    } as Record<string, string>,

    youTitle: 'Você',
    youLede: 'Como aparece aos colegas. O nome e o número do negócio estão no separador ao lado.',
    yourPhone: 'O seu telemóvel',
    saved: 'Guardado.',

    signingIn: 'Sessão',
    signInAs: (email: string) => `Entra com ${email}.`,
    changeEmail: 'Alterar o email',
    changeEmailLede: 'Enviamos um link para o novo endereço. Nada muda até o abrir.',
    newEmail: 'Novo email',
    yourPassword: 'A sua palavra-passe',
    whyPassword: 'Pedida porque alterar este endereço altera a forma de recuperar a conta.',
    sendLink: 'Enviar o link',
    changePassword: 'Alterar a palavra-passe',
    passwordRules: (min: number) =>
      `Pelo menos ${min} caracteres. Os outros dispositivos terminam sessão.`,
    currentPassword: 'Palavra-passe atual',
    newPassword: 'Nova palavra-passe',
    passwordChanged: 'Palavra-passe alterada. Todas as outras sessões foram terminadas.',
    didNotWork: 'Não foi possível.',

    businessDetails: 'Dados do negócio',
    businessDetailsLede: 'O NIF é aquele em nome do qual os recibos verdes são emitidos.',
    businessName: 'Nome do negócio',
    businessNameHint: 'O que os clientes veem na sua página de marcações.',
    nif: 'NIF',
    nifHint: '9 dígitos.',
    nifError: 'Um NIF português tem exatamente 9 dígitos',
    shopHours: 'Horário do espaço',
    saveChanges: 'Guardar alterações',
    shopHoursLede: (timezone: string) =>
      `Quando a porta está aberta, na hora de ${timezone}. É um tecto e não uma oferta — cada pessoa só pode ser marcada no cruzamento disto com o seu próprio horário. Divida um dia em duas linhas para reservar a hora de almoço.`,
    slotMinutes: 'Intervalo entre marcações',
    slotMinutesHint:
      'As linhas da sua agenda e as horas oferecidas aos clientes. Um intervalo mais curto torna o dia mais alto no ecrã.',
    everyMinutes: (minutes: number): string =>
      minutes === 60 ? 'De hora a hora' : `De ${minutes} em ${minutes} minutos`,
  },
  hours: {
    noneSet:
      'Sem horário definido. Ainda pode marcar manualmente, mas a verificação de disponibilidade não terá nada com que comparar.',
    day: 'Dia',
    from: 'Das',
    to: 'Às',
    remove: 'Remover',
    addHours: 'Adicionar horário',
  },

  people: {
    title: 'Pessoas',
    lede: 'Toda a gente que presta serviços. O horário de cada pessoa estreita o do espaço em vez de o alargar, por isso uma hora só é oferecida quando ambos estão abertos.',
    addSomeone: 'Adicionar alguém',
    add: 'Adicionar',
    you: 'Você',
    left: 'Saiu',
    timesAWeek: (count: number) => `${count} ${count === 1 ? 'período' : 'períodos'} por semana`,
    followsShop: 'Segue o horário do espaço',
    hours: 'Horário',
    away: 'Ausências',
    does: 'Serviços',
    theyLeft: 'Saiu',
    bringBack: 'Readmitir',
    hoursFor: (name: string) =>
      `Quando ${name} está disponível. Deixe vazio para seguir o horário do espaço.`,
    saveHours: 'Guardar horário',
    showLeft: 'Mostrar quem já saiu',
    removeTitle: (name: string) => `Remover ${name}?`,
    removeBody:
      'Deixa de aparecer na disponibilidade e em novas marcações. Tudo o que já fez fica exatamente como está, e pode voltar a readmiti-la.',

    skillsFor: (name: string) =>
      `O que ${name} faz. Os clientes só lhe podem marcar serviços desta lista.`,
    everything: 'Todo o catálogo',
    minutes: 'Minutos',

    awayFor: (name: string) =>
      `Quando ${name} está ausente. Deixa de ser oferecida nessas horas; o resto da equipa não é afetado.`,
    wholeDays: 'Dias inteiros',
    from: 'De',
    to: 'Até',
    toHint: 'Deixe vazio para um só dia.',
    fromTime: 'Da hora',
    toTime: 'Até à hora',
    markAway: 'Marcar ausência',
    clashes: (count: number) =>
      `${count} ${count === 1 ? 'marcação já existente' : 'marcações já existentes'} nesse período.`,
    nothingCancelled: 'Nada foi anulado. Mude ou anule essas marcações você mesmo.',
    noneAhead: 'Nenhuma ausência marcada nos próximos três meses.',
    pickDays: 'Escolha os dias que isto abrange',
    endAfterStart: 'Tem de acabar depois de começar',
  },

  bookingPage: {
    title: 'Página de marcações pública',
    lede: 'Deixe os clientes marcarem sozinhos, sem lhe telefonarem.',
    live: 'Publicada',
    off: 'Desligada',
    accept: 'Aceitar marcações de clientes',
    acceptHint: 'Desligada por omissão — a sua agenda é privada até a publicar.',
    address: 'O endereço da sua página',
    addressHint: (url: string) => `Os clientes visitam ${url}`,
    slugError: 'Use 3 a 40 letras minúsculas, números ou hífenes',
    minimumNotice: 'Antecedência mínima',
    minimumNoticeHint: 'Horas. Impede que alguém marque para daqui a dez minutos.',
    horizon: 'Com quanta antecedência',
    horizonHint: 'Dias no futuro em que os clientes podem marcar.',
    whatClientsPay: 'O que os clientes pagam ao marcar',
    payNothing: 'Nada — pagam-lhe presencialmente',
    payDeposit: 'Um sinal',
    payFull: 'O preço completo',
    fullWarning:
      'Cobrar o preço completo significa devolver a maior parte quando alguém anula a tempo. O sinal abaixo é a parte com que fica — e há sempre um mínimo pequeno, para que uma anulação nunca o deixe a perder.',
    nonRefundablePart: 'Parte não reembolsável',
    deposit: 'Sinal',
    nonRefundableHint: 'Percentagem do preço com que fica se anularem. O resto é devolvido.',
    depositHint:
      'Percentagem do preço, cobrada por MB WAY quando o cliente marca. 0 não cobra nada.',
    notice: 'Antecedência para remarcar',
    noticeHint: 'Horas. Dentro deste prazo, o cliente pode remarcar e o sinal vai com ele.',
    depositPolicy:
      'Os sinais nunca são reembolsados. Com antecedência suficiente o cliente remarca e mantém-no; mais tarde do que isso, a hora perdeu-se à sua custa e o sinal fica consigo. Aplica-se um mínimo pequeno, para que sinais muito baixos não sejam comidos pelas comissões.',
    noDepositPolicy:
      'Sem sinal, a hora fica reservada por confiança — a razão habitual das faltas.',
    autoConfirm: 'Confirmar marcações automaticamente',
    autoConfirmHint: 'Desligado, chegam como pendentes para as aprovar.',
    save: 'Guardar página',
    copyLink: 'Copiar link',
  },

  branding: {
    title: 'Aspeto da sua página de marcações',
    lede: 'É o que os seus clientes veem — o painel continua como está.',
    accentColour: 'Cor de destaque',
    pickColour: (hex: string) => `Usar ${hex}`,
    readable:
      'O texto sobre esta cor alterna entre preto e branco sozinho, para se manter legível seja qual for a cor.',
    logo: 'Logótipo',
    logoHint: (maxKb: number) =>
      `PNG, JPEG ou WebP, até ${maxKb} KB. Sem logótipo usamos o nome do negócio.`,
    replaceLogo: 'Substituir logótipo',
    uploadLogo: 'Carregar um logótipo',
    remove: 'Remover',
    save: 'Guardar aspeto',
    preview: 'Pré-visualização',
    previewTitle: 'Pré-visualização da página de marcações',
    yourBusiness: 'O seu negócio',
    uploadFailed: 'Não foi possível carregar essa imagem.',
    removeFailed: 'Não foi possível remover o logótipo.',
    tooBig: (size: number, max: number) =>
      `Essa imagem tem ${size} KB. Mantenha-a abaixo de ${max} KB.`,
  },

  recibos: {
    newTitle: 'Novo recibo verde',
    editTitle: 'Editar rascunho',
    lede: 'As linhas vêm de marcações concluídas, por isso o total bate sempre com o trabalho feito.',
    createDraft: 'Criar rascunho',
    saveDraft: 'Guardar rascunho',
    issueDate: 'Data de emissão',
    bookingsToBill: 'Marcações a faturar',
    pickClientFirst: 'Escolha um cliente para ver as marcações concluídas.',
    loadingBookings: 'A carregar marcações…',
    nothingBillable:
      'Nada a faturar para este cliente. As marcações aparecem aqui depois de concluídas e enquanto não estiverem num recibo.',
    vatRate: 'Taxa de IVA',
    vatRateHint: 'Percentagem. 0 se estiver isento.',
    exemptionReason: 'Motivo da isenção',
    subtotal: 'Subtotal',
    total: 'Total',
    errorBookings: 'Escolha pelo menos uma marcação',
    errorNumber: 'Use um número',
    errorExemption: 'Um recibo sem IVA precisa de um motivo',

    loading: 'A carregar recibos…',
    noneFor: (year: number) => `Sem recibos em ${year}`,
    noneBody:
      'Crie um a partir de marcações concluídas. A Upfront prepara-o para o entregar — nunca entrega nada sozinha.',
    columnNumber: 'Número',
    view: 'Ver',
    issue: 'Emitir',
    cancelRecibo: 'Anular recibo',
    statuses: { draft: 'Rascunho', issued: 'Emitido', cancelled: 'Anulado' } as Record<
      string,
      string
    >,
    issueTitle: 'Emitir este recibo?',
    issueBody:
      'Recebe o próximo número do ano e deixa de poder ser editado. Para o desfazer mais tarde terá de o anular — o número fica usado.',
    cancelTitle: (number: string) => `Anular o recibo ${number}?`,
    cancelBody:
      'O recibo mantém o número e deixa de contar para a sua faturação. As marcações voltam a poder ser faturadas.',
    deleteTitle: 'Eliminar este rascunho?',
    deleteBody:
      'Os rascunhos não têm número e não deixam rasto. As marcações voltam a poder ser faturadas.',

    previewTitle: (number: string | null) => `Recibo ${number ?? '(rascunho)'}`,
    previewLede: 'Copie estes valores para o Portal das Finanças. A Upfront não os submete.',
    pdfFailed: 'Não foi possível gerar esse PDF.',
    downloadPdf: 'Descarregar PDF',
    noNif: 'Sem NIF registado — adicione-o nas Definições.',
  },

  onboarding: {
    title: 'Prepare o seu espaço',
    subtitle: 'Três passos curtos. Pode alterar tudo mais tarde nas Definições.',
    stepBusiness: 'Negócio',
    stepHours: 'Horário',
    stepService: 'Primeiro serviço',
    businessNameHint: 'Como os clientes o conhecem. Deixe em branco para usar o seu próprio nome.',
    nifHint: '9 dígitos. Necessário antes de emitir um recibo verde — pode adicionar mais tarde.',
    hoursLede:
      'Deixámos preenchida uma semana de segunda a sexta. Ajuste-a, ou divida um dia em duas linhas para a hora de almoço.',
    serviceLede: 'Adicione o que marca mais vezes. Pode adicionar o resto quando quiser.',
    serviceName: 'Nome do serviço',
    back: 'Voltar',
    skip: 'Saltar por agora',
    finish: 'Concluir',
    continue: 'Continuar',
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
    createButton: 'Criar conta',
    passwordHint: (min: number) => `Pelo menos ${min} caracteres.`,
    passwordShort: (min: number) => `Use pelo menos ${min} caracteres.`,
    passwordLong: 'Demasiado longa — com acentos, cabem menos caracteres.',

    resetTitle: 'Recuperar a palavra-passe',
    resetSubtitle: 'Enviamos-lhe um link para escolher uma nova.',
    backToSignIn: 'Voltar a entrar',
    resetSent: (email: string) =>
      `Se ${email} pertencer a uma conta Upfront, vai a caminho um link de recuperação. Funciona uma vez, e expira ao fim de uma hora.`,
    nothingArrived: 'Não chegou nada? Veja o spam, ou',
    tryAnother: 'experimente outro endereço',
    sendLink: 'Enviar o link',

    linkIncomplete: 'Esse link está incompleto',
    requestNew: 'Pedir um novo',
    openExactly:
      'Abra o link do email exatamente como foi enviado — algumas aplicações de email cortam links longos.',
    chooseNew: 'Escolha uma nova palavra-passe',
    signedOutElsewhere: 'A sessão será terminada em todos os outros sítios.',
    newPassword: 'Nova palavra-passe',
    again: 'Outra vez, para confirmar',
    setPassword: 'Definir a palavra-passe',
    mismatch: 'As duas não coincidem.',
    somethingWrong: 'Algo correu mal. Tente outra vez.',

    oneMoment: 'Um momento…',
    linkDidNotWork: 'Esse link não funcionou',
    linkCut: 'Esse link está incompleto. Abra-o exatamente como foi enviado.',
    confirmingEmail: 'A confirmar o seu email',
    linksExpire:
      'Os links expiram ao fim de um dia e só funcionam uma vez. Entre e enviamos outro.',
    goToSettings: 'Ir para as Definições',
    emailConfirmed: 'Email confirmado',
    thanks: 'Obrigado — já pode publicar a sua página de marcações e cobrar sinais.',
    publishPage: 'Publicar a página',

    confirmingNewEmail: 'A confirmar o novo endereço',
    backToSettings: 'Voltar às Definições',
    emailChanged: 'Endereço de email alterado',
    nowSignsInAs: (email: string) => `A sua conta passa a entrar com ${email}.`,
    signedOutEverywhere:
      'Todas as sessões foram terminadas, incluindo esta — uma mudança de endereço é exatamente o momento de garantir que mais ninguém continua com sessão iniciada.',
    signInWithNew: 'Entrar com o novo endereço',
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
    pickServices: 'Escolha um ou mais serviços.',
    otherServices: 'Outros',
    chosenCount: (count: number): string => (count === 1 ? '1 serviço' : `${count} serviços`),
    continueToTimes: 'Ver horários',
    nobodyDoesAll: 'Ninguém faz todos estes serviços de seguida. Retire um e marque-o em separado.',
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
