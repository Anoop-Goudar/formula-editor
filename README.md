# Formula Editor

A visual editor for building and configuring calculation formulas (banking fee
and interest rate formulas), built from pre-populated templates fetched from
a GraphQL endpoint (mocked locally for now).

## Running it

Just open `index.html` in a browser — no build step, no server needed.
All data is inlined into `data.js` (see "Editing templates/config" below).

## How it works

- **`templates.json`** — the pre-populated formula templates. Each one has a
  `label`, `description`, and a `structure`: a nested JSON tree of function
  calls (e.g. `multiply`, `add`, `min`, `max`, `convert`) with placeholder
  leaves like `"$value1"`.
- **`config.json`** — the editing rulebook. For every function name, it
  defines what each argument position allows (`variable` / `literal` /
  `function`), which exact variables or currencies are valid there, and
  literal constraints (decimal, integer, currency code, enum). Every entry
  also carries:
  - `"category"`: `"operator"` (add/subtract/multiply/divide) or
    `"function"` (min/max/round/convert)
  - `"swappableWith"`: which other function names this one can become.
    Operators can swap with each other; named functions cannot be swapped
    for anything — that's explicit future scope, not supported today.
- **`data.js`** — loads the two JSON files above. They're inlined directly
  into this file (rather than fetched at runtime) so the app works by
  double-clicking `index.html`, with no local server and no CORS issues.
- **`formula-model.js`** — pure tree logic: parsing a template's structure
  into an editable node tree, path-based get/set, swap-legality checks,
  validation (flags any still-unset leaf), and serialization back to the
  original JSON shape.
- **`render.js`** — builds all the DOM: sidebar, formula pills, popovers,
  toolbar, validation banner, JSON view. Named functions render prefix
  call-style (`Label(arg0, arg1)`); operators render infix
  (`arg0 [symbol] arg1`), with grouping parentheses added only when an
  operator is nested inside another operator's argument.
- **`main.js`** — app state and the click-handler wiring that ties the
  above together.

## Editing templates or config

`templates.json` and `config.json` are the source of truth — edit those
directly, then regenerate `data.js` so the browser picks up the change:

```bash
python3 generate_data_js.py
```

Don't hand-edit the `TEMPLATES_JSON` / `CONFIG_JSON` objects inside
`data.js`; they're generated output.

## Editing rules enforced by the app

- A function's structure is fixed: `min`, `max`, `round`, `convert` can
  never be swapped for another function, at any nesting depth. They render
  as locked pills with no click handler at all.
- Operators (`+ − × ÷`) can be swapped for one another via a popover menu.
- Any leaf (variable slot) can be set to a different variable, a literal
  value, or (where the config allows it) a currency code.

## Future scope (not implemented)

- Replacing a named function with another function.
- Extending a template by turning a variable slot into a nested function
  call.

## Swapping in the real backend

Replace the body of `fetchTemplates()` in `data.js` with a real GraphQL
call:

```graphql
query GetFormulaTemplates {
  formulaTemplates {
    label
    description
    structure
  }
}
```

Nothing else in the app needs to change — every other file only depends on
the shape `fetchTemplates()` returns: `[{ label, description, structure }]`.
