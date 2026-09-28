import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@/test/render';
import { Combobox, type ComboboxOption } from './Combobox';

const SERVICES: ComboboxOption[] = [
  { value: 'cut', label: 'Corte de cabelo', detail: '45 min · 22,00 €' },
  { value: 'beard', label: 'Barba', detail: '20 min · 10,00 €' },
  { value: 'colour', label: 'Coloração', detail: '80 min · 55,00 €' },
  { value: 'joao', label: 'Corte com João', detail: '45 min · 25,00 €' },
];

function renderStatic(extra: Record<string, unknown> = {}) {
  const onChange = vi.fn();
  render(
    <Combobox
      label="Serviço"
      options={SERVICES}
      emptyMessage="Nenhum serviço encontrado"
      onChange={onChange}
      {...extra}
    />,
  );
  return { onChange };
}

describe('the field itself', () => {
  /**
   * The regression this file exists for.
   *
   * `Popover.Anchor` renders nothing at all in Themes 3.3.0, so this component was a label with
   * no field under it: the client could not be typed and **no booking could be made from the
   * dashboard**, for an unknown length of time and with nothing on screen to say why. Swapping
   * it for `Popover.Trigger` brought the input back.
   *
   * It is one assertion, and it would have caught all of that.
   */
  it('renders an input, which it once did not', () => {
    renderStatic();
    expect(screen.getByRole('combobox', { name: 'Serviço' })).toBeInTheDocument();
  });

  it('keeps the label reachable when it is visually hidden', () => {
    // srOnly is for when something above already says what the field is. Dropping the label
    // instead would leave the control with no accessible name at all.
    renderStatic({ srOnlyLabel: true });
    expect(screen.getByRole('combobox', { name: 'Serviço' })).toBeInTheDocument();
  });

  /**
   * Found by the test below it, which kept typing into a field that had quietly emptied itself.
   *
   * `Popover.Trigger` composes Radix's own `onOpenToggle` onto its child's click, so a second
   * click on the field — to move the caret, which is an ordinary thing to do mid-search —
   * toggled the list shut, and closing puts the query back to null. Typing "cor" and then
   * clicking the field left it empty, in a browser as well as here.
   */
  it('keeps what was typed when the field is clicked again', async () => {
    const user = userEvent.setup();
    renderStatic();

    const field = screen.getByRole('combobox');
    await user.type(field, 'cor');
    await user.click(field);

    expect(field).toHaveValue('cor');
  });

  it('shows the chosen label when nothing is being typed', () => {
    // The normal case when editing: the service is known, the list is shut, and the field has
    // to show something other than an empty box.
    renderStatic({ value: 'cut', selectedLabel: 'Corte de cabelo' });
    expect(screen.getByRole('combobox', { name: 'Serviço' })).toHaveValue('Corte de cabelo');
  });
});

describe('matching a static list', () => {
  it('filters as you type, with no round trip', async () => {
    const user = userEvent.setup();
    renderStatic();

    await user.type(screen.getByRole('combobox'), 'cor');

    expect(await screen.findByText('Corte de cabelo')).toBeInTheDocument();
    expect(screen.getByText('Corte com João')).toBeInTheDocument();
    // Not Coloração: it folds to "coloracao", which does not contain "cor". Worth saying,
    // because "starts with the same letters" and "contains" are easy to conflate when reading
    // this, and only the second one is what `matches` does.
    expect(screen.queryByText('Coloração')).not.toBeInTheDocument();
    expect(screen.queryByText('Barba')).not.toBeInTheDocument();
  });

  it('ignores accents, because somebody typing joao means João', async () => {
    const user = userEvent.setup();
    renderStatic();

    await user.type(screen.getByRole('combobox'), 'joao');

    expect(await screen.findByText('Corte com João')).toBeInTheDocument();
    expect(screen.queryByText('Barba')).not.toBeInTheDocument();
  });

  it('takes the words in any order, and looks in the detail line too', async () => {
    // Half-remembering two things about one row is how people type, and the duration lives in
    // `detail` rather than in the label.
    const user = userEvent.setup();
    renderStatic();

    await user.type(screen.getByRole('combobox'), '45 corte');

    expect(await screen.findByText('Corte de cabelo')).toBeInTheDocument();
    expect(screen.getByText('Corte com João')).toBeInTheDocument();
    expect(screen.queryByText('Coloração')).not.toBeInTheDocument();
  });

  it('says so when nothing matches, rather than showing an empty box', async () => {
    const user = userEvent.setup();
    renderStatic();

    await user.type(screen.getByRole('combobox'), 'zzz');

    expect(await screen.findByText('Nenhum serviço encontrado')).toBeInTheDocument();
  });
});

describe('choosing', () => {
  it('hands back the whole option, not just its id', async () => {
    const user = userEvent.setup();
    const { onChange } = renderStatic();

    await user.type(screen.getByRole('combobox'), 'barba');
    await user.click(await screen.findByText('Barba'));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ value: 'beard', label: 'Barba' }),
    );
  });

  it('chooses the highlighted option on Enter', async () => {
    const user = userEvent.setup();
    const { onChange } = renderStatic();

    await user.type(screen.getByRole('combobox'), 'cor');
    await screen.findByText('Corte de cabelo');
    await user.keyboard('{Enter}');

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ value: 'cut' }));
  });

  it('clears what was typed, so half a word is not left looking chosen', async () => {
    const user = userEvent.setup();
    renderStatic();

    const field = screen.getByRole('combobox');
    await user.type(field, 'barba');
    await user.click(await screen.findByText('Barba'));

    await waitFor(() => expect(field).toHaveValue(''));
  });
});

describe('matching through a loader', () => {
  it('asks the server instead of filtering, and shows what comes back', async () => {
    const user = userEvent.setup();
    const loadOptions = vi.fn(async () => [{ value: 'ana', label: 'Ana Silva', detail: '91…' }]);

    render(
      <Combobox
        label="Cliente"
        loadOptions={loadOptions}
        loadingMessage="A procurar…"
        emptyMessage="Nenhum cliente"
        onChange={vi.fn()}
      />,
    );

    await user.type(screen.getByRole('combobox'), 'ana');

    expect(await screen.findByText('Ana Silva')).toBeInTheDocument();
    expect(loadOptions).toHaveBeenCalled();
  });

  /**
   * Type "Ana" quickly and three requests go out. If the answer for "A" lands last it must not
   * replace the results for "Ana", or the list stops describing what is in the field. Every
   * request carries a sequence number and a stale answer is dropped.
   */
  it('ignores an answer that arrives after a newer one', async () => {
    const user = userEvent.setup();
    let resolveFirst: (value: ComboboxOption[]) => void = () => {};
    let call = 0;

    const loadOptions = vi.fn((term: string) => {
      call += 1;
      if (call === 1) {
        return new Promise<ComboboxOption[]>((resolve) => {
          resolveFirst = resolve;
        });
      }
      return Promise.resolve([{ value: 'fresh', label: `Fresh for ${term}` }]);
    });

    render(
      <Combobox
        label="Cliente"
        loadOptions={loadOptions}
        loadingMessage="A procurar…"
        emptyMessage="Nenhum cliente"
        onChange={vi.fn()}
      />,
    );

    const field = screen.getByRole('combobox');
    await user.type(field, 'a');
    await waitFor(() => expect(loadOptions).toHaveBeenCalledTimes(1));

    await user.type(field, 'na');
    expect(await screen.findByText('Fresh for ana')).toBeInTheDocument();

    // The slow first request finally answers. It is for "a", and it is too late.
    resolveFirst([{ value: 'stale', label: 'Stale for a' }]);

    await waitFor(() => expect(screen.queryByText('Stale for a')).not.toBeInTheDocument());
    expect(screen.getByText('Fresh for ana')).toBeInTheDocument();
  });
});
