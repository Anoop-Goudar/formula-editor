/**
 * render.js
 * -----------------------------------------------------------------------
 * Pure-ish rendering layer. Reads from the app state object owned by
 * main.js and (re)builds the DOM. Every render*() function returns an
 * HTMLElement; nothing in here mutates `state` — clicks call back into
 * main.js's action functions (passed in via the `actions` param), which
 * update state and trigger a full re-render. Simple, predictable,
 * fine for a tree this size.
 * -----------------------------------------------------------------------
 */

const OPERATOR_SYMBOLS = { add: '+', subtract: '−', multiply: '×', divide: '÷' };

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  }
  (Array.isArray(children) ? children : [children]).forEach((c) => {
    if (c) node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  });
  return node;
}

/* ================================================================ ROOT */

function renderApp(state, actions) {
  const app = document.getElementById('app');
  app.innerHTML = '';
  app.appendChild(renderSidebar(state, actions));
  app.appendChild(renderMain(state, actions));
  if (state.popover) app.appendChild(renderPopover(state, actions));
}

/* ============================================================= SIDEBAR */

function renderSidebar(state, actions) {
  const list = el('ul', { class: 'template-list' });

  if (state.loading) {
    list.appendChild(el('li', { class: 'option-empty', text: 'Loading templates…' }));
  } else {
    state.templates.forEach((tpl, i) => {
      const active = i === state.selectedIndex;
      list.appendChild(
        el(
          'li',
          {
            class: `template-item${active ? ' active' : ''}`,
            onclick: () => actions.selectTemplate(i),
          },
          [
            el('div', { class: 't-label', text: tpl.label }),
            el('div', { class: 't-desc', text: tpl.description }),
          ]
        )
      );
    });
  }

  return el('div', { class: 'sidebar' }, [
    el('div', { class: 'sidebar-header' }, [
      el('h1', { text: 'Formula Builder' }),
      el('p', { text: 'Pre-populated templates, fetched & editable' }),
      el('div', { class: 'sidebar-status' }, [
        el('span', { class: `dot${state.loading ? ' loading' : ''}` }),
        document.createTextNode(state.loading ? 'Fetching from GraphQL (mock)…' : `${state.templates.length} templates loaded`),
      ]),
    ]),
    list,
  ]);
}

/* ================================================================ MAIN */

function renderMain(state, actions) {
  const main = el('div', { class: 'main' });

  if (state.loading || state.selectedIndex === null) {
    main.appendChild(renderEmptyState(state.loading));
    return main;
  }

  const tpl = state.templates[state.selectedIndex];
  const problems = validateTree(state.tree, state.config);

  main.appendChild(
    el('div', { class: 'main-header' }, [
      el('div', { class: 'eyebrow', text: 'Editing template' }),
      el('h2', { text: tpl.label }),
      el('div', { class: 'desc', text: tpl.description }),
    ])
  );

  main.appendChild(renderToolbar(state, actions, problems));
  main.appendChild(renderValidationBanner(problems));

  const card = el('div', { class: 'formula-card' }, [
    el('div', { class: 'card-label', text: 'Formula' }),
    renderFormulaRow(state.tree, [], state, actions),
  ]);
  main.appendChild(card);

  main.appendChild(renderLegend());
  main.appendChild(renderJsonToggle(state.tree));

  return main;
}

function renderEmptyState(loading) {
  return el('div', { class: 'empty-state' }, [
    el('div', { class: 'e-title', text: loading ? 'Loading templates…' : 'Select a template' }),
    el('div', {
      class: 'e-sub',
      text: loading
        ? 'Fetching pre-populated formulas from the mock GraphQL endpoint.'
        : 'Pick one from the left to view and edit its formula.',
    }),
  ]);
}

function renderToolbar(state, actions, problems) {
  return el('div', { class: 'toolbar' }, [
    el('button', { class: 'btn', onclick: actions.resetTemplate, text: '↺ Reset' }),
    el('div', { class: 'btn-spacer' }),
    el('button', {
      class: 'btn primary',
      disabled: problems.length > 0 ? 'true' : null,
      onclick: actions.saveTemplate,
      text: state.justSaved ? '✓ Saved' : 'Save formula',
    }),
  ]);
}

function renderValidationBanner(problems) {
  if (problems.length === 0) {
    return el('div', { class: 'validation-banner ok' }, [
      el('span', { text: '✓' }),
      el('span', { text: 'Formula is complete — every value is set and ready to save.' }),
    ]);
  }
  return el('div', { class: 'validation-banner' }, [
    el('span', { text: '⚠' }),
    el('span', { text: problems.join(' ') }),
  ]);
}

function renderLegend() {
  const item = (color, label) =>
    el('span', {}, [el('span', { class: 'sw', style: `background:${color}` }), document.createTextNode(label)]);
  const wrap = el('div', { class: 'legend' }, [
    item('var(--accent-fn)', 'Function — fixed'),
    item('var(--accent-op)', 'Operator — swappable'),
    item('#1f7a5c', 'Variable'),
    item('var(--accent-lit)', 'Literal'),
  ]);
  return wrap;
}

function renderJsonToggle(tree) {
  const details = el('details', { class: 'json-toggle-area' });
  details.appendChild(el('summary', { text: 'View raw formula JSON' }));
  details.appendChild(el('pre', { class: 'json-view', text: JSON.stringify(serializeTree(tree), null, 2) }));
  return details;
}

/* ========================================================= FORMULA TREE */

/** Renders one node (call or leaf) plus its surrounding parens/commas. */
function renderFormulaRow(node, path, state, actions) {
  const row = el('span', { class: 'formula-row' });
  row.appendChild(renderNode(node, path, state, actions));
  return row;
}

function renderNode(node, path, state, actions) {
  if (node.fn) return renderCallNode(node, path, state, actions);
  return renderLeafNode(node, path, state, actions);
}

function renderCallNode(node, path, state, actions) {
  const cfg = state.config[node.fn];
  const isOperator = cfg && cfg.category === 'operator';
  return isOperator
    ? renderInfixOperator(node, path, cfg, state, actions)
    : renderPrefixFunction(node, path, cfg, state, actions);
}

/** Functions render as `fnLabel ( arg0 , arg1 , ... )` — call-style, matching
 *  min/max/round/convert in the design (fixed arity, fixed argument order,
 *  never swappable, so a labeled call reads clearer than infix would). */
function renderPrefixFunction(node, path, cfg, state, actions) {
  const wrap = el('span', { class: 'sub-call' });
  wrap.appendChild(renderFunctionPill(node, cfg));
  wrap.appendChild(el('span', { class: 'paren', text: '(' }));
  node.args.forEach((arg, i) => {
    if (i > 0) wrap.appendChild(el('span', { class: 'comma', text: ',' }));
    wrap.appendChild(renderNode(arg, [...path, i], state, actions));
  });
  wrap.appendChild(el('span', { class: 'paren', text: ')' }));
  return wrap;
}

/** Operators render infix — `arg0 [symbol] arg1` — since add/subtract/
 *  multiply/divide are binary operators a person reads left-to-right, not
 *  function calls. Grouping parens are added only when this operator node
 *  is itself nested inside another operator's argument (so precedence/
 *  grouping stays visually unambiguous); a top-level or function-nested
 *  operator doesn't need parens around it. */
function renderInfixOperator(node, path, cfg, state, actions) {
  const wrap = el('span', { class: 'sub-call' });
  const { parent } = getParentAtPath(state.tree, path);
  const parentIsOperator = parent && state.config[parent.fn] && state.config[parent.fn].category === 'operator';

  if (parentIsOperator) wrap.appendChild(el('span', { class: 'paren', text: '(' }));

  node.args.forEach((arg, i) => {
    if (i > 0) wrap.appendChild(renderOperatorPill(node, path, cfg, actions));
    wrap.appendChild(renderNode(arg, [...path, i], state, actions));
  });

  if (parentIsOperator) wrap.appendChild(el('span', { class: 'paren', text: ')' }));

  return wrap;
}

function renderFunctionPill(node, cfg) {
  return el('span', { class: 'pill-fn' }, [
    el('span', { class: 'lock-ic', text: '🔒' }),
    document.createTextNode(cfg ? cfg.label.split(' ')[0] : node.fn),
  ]);
}

function renderOperatorPill(node, path, cfg, actions) {
  return el('button', {
    class: 'pill-op',
    title: `${cfg.label} — click to change operator`,
    onclick: (e) => {
      e.stopPropagation();
      actions.openOperatorPopover(path, e.currentTarget);
    },
    text: OPERATOR_SYMBOLS[node.fn] || node.fn,
  });
}

function renderLeafNode(node, path, state, actions) {
  const argCfg = getArgConfigForPath(state.tree, path, state.config);
  // "unset" leaves use the "empty" CSS class (dashed border, hover highlight)
  // defined in styles.css — kept as a distinct name from the model's "unset"
  // kind since "empty" describes the visual state, not the data state.
  const kindClass = node.kind === 'unset' ? 'kind-empty' : `kind-${node.kind}`;
  let label;
  if (node.kind === 'unset') {
    label = argCfg ? argCfg.label : 'Select value';
  } else if (node.kind === 'variable') {
    const v = argCfg && argCfg.variables.find((x) => x.code === node.value);
    label = v ? v.label : node.value;
  } else if (node.kind === 'currency') {
    label = node.value;
  } else {
    label = String(node.value);
  }

  return el(
    'button',
    {
      class: `pill-leaf ${kindClass}`,
      onclick: (e) => {
        e.stopPropagation();
        actions.openLeafPopover(path, e.currentTarget);
      },
    },
    [document.createTextNode(label), el('span', { class: 'chev', text: '▾' })]
  );
}

/* =============================================================== POPOVER */

function renderPopover(state, actions) {
  const { popover } = state;
  const backdrop = el('div', { class: 'popover-backdrop', onclick: actions.closePopover });

  const pop = el('div', { class: 'popover' });
  pop.style.left = `${popover.x}px`;
  pop.style.top = `${popover.y}px`;
  pop.addEventListener('click', (e) => e.stopPropagation());

  if (popover.type === 'operator') {
    pop.appendChild(renderOperatorPopoverContent(state, actions));
  } else {
    pop.appendChild(renderLeafPopoverContent(state, actions));
  }

  const wrap = el('div', {});
  wrap.appendChild(backdrop);
  wrap.appendChild(pop);
  return wrap;
}

function renderOperatorPopoverContent(state, actions) {
  const node = getNodeAtPath(state.tree, state.popover.path);
  const cfg = state.config[node.fn];
  const options = [node.fn, ...(cfg.swappableWith || [])];

  const grid = el('div', { class: 'op-grid' });
  options.forEach((fn) => {
    const isCurrent = fn === node.fn;
    grid.appendChild(
      el(
        'div',
        {
          class: `op-row${isCurrent ? ' current' : ''}`,
          onclick: () => actions.chooseOperator(state.popover.path, fn),
        },
        [
          el('span', { class: 'op-sym', text: OPERATOR_SYMBOLS[fn] || fn }),
          document.createTextNode(state.config[fn].label),
        ]
      )
    );
  });

  return el('div', {}, [
    el('div', { class: 'popover-header' }, [
      el('span', { class: 'ph-title', text: 'Swap operator' }),
      el('button', { class: 'ph-close', onclick: actions.closePopover, text: '✕' }),
    ]),
    el('div', { class: 'popover-body' }, [grid]),
  ]);
}

function renderLeafPopoverContent(state, actions) {
  const { path } = state.popover;
  const node = getNodeAtPath(state.tree, path);
  const argCfg = getArgConfigForPath(state.tree, path, state.config);
  const allowed = argCfg ? argCfg.allowedTypes : ['variable', 'literal'];
  const activeTab = state.popover.tab || node.kind === 'unset' ? state.popover.tab || allowed[0] : node.kind;

  const tabs = el('div', { class: 'type-tabs' });
  const tabDefs = [
    { key: 'variable', label: 'Variable', enabled: allowed.includes('variable') && argCfg.variables.length > 0 },
    { key: 'literal', label: 'Literal', enabled: allowed.includes('literal') },
    { key: 'currency', label: 'Currency', enabled: allowed.includes('literal') && argCfg.literal && argCfg.literal.type === 'currencyCode' },
  ];
  // Currency is modeled as a literal-of-type-currencyCode in config_example.json,
  // but the screenshots show it as its own tab — surface it separately when
  // the literal type is currencyCode, and treat "literal" tab as plain
  // decimal/integer/enum entry in that case.
  const effectiveTabs = tabDefs.filter((t) => t.enabled && !(t.key === 'literal' && argCfg.literal && argCfg.literal.type === 'currencyCode'));

  effectiveTabs.forEach((t) => {
    tabs.appendChild(
      el('button', {
        class: `type-tab${activeTab === t.key ? ' active' : ''}`,
        onclick: () => actions.setPopoverTab(t.key),
        text: t.label,
      })
    );
  });

  const body = el('div', { class: 'popover-body' });

  if (activeTab === 'variable') {
    body.appendChild(renderVariablePicker(argCfg, node, path, state, actions));
  } else if (activeTab === 'currency') {
    body.appendChild(renderCurrencyPicker(argCfg, node, path, actions));
  } else {
    body.appendChild(renderLiteralEditor(argCfg, node, path, actions));
  }

  return el('div', {}, [
    el('div', { class: 'popover-header' }, [
      el('span', { class: 'ph-title', text: argCfg ? argCfg.label : 'Edit value' }),
      el('button', { class: 'ph-close', onclick: actions.closePopover, text: '✕' }),
    ]),
    tabs,
    body,
  ]);
}

function renderVariablePicker(argCfg, node, path, state, actions) {
  const wrap = el('div', {});
  const query = state.popover.search || '';
  wrap.appendChild(
    el('input', {
      class: 'search-input',
      placeholder: 'Search variable…',
      value: query,
      oninput: (e) => actions.setPopoverSearch(e.target.value),
    })
  );

  const filtered = argCfg.variables.filter((v) => v.label.toLowerCase().includes(query.toLowerCase()));
  const list = el('ul', { class: 'option-list' });
  if (filtered.length === 0) {
    list.appendChild(el('li', { class: 'option-empty', text: 'No matching variables.' }));
  } else {
    filtered.forEach((v) => {
      const selected = node.kind === 'variable' && node.value === v.code;
      list.appendChild(
        el('li', {
          class: `option-row${selected ? ' selected' : ''}`,
          onclick: () => actions.chooseVariable(path, v.code),
          text: v.label,
        })
      );
    });
  }
  wrap.appendChild(list);
  return wrap;
}

function renderCurrencyPicker(argCfg, node, path, actions) {
  const wrap = el('div', {});
  const list = el('ul', { class: 'option-list' });
  (argCfg.literal.values || []).forEach((code) => {
    const selected = node.kind === 'currency' && node.value === code;
    list.appendChild(
      el('li', {
        class: `option-row${selected ? ' selected' : ''}`,
        onclick: () => actions.chooseCurrency(path, code),
        text: code,
      })
    );
  });
  wrap.appendChild(list);
  return wrap;
}

function renderLiteralEditor(argCfg, node, path, actions) {
  const wrap = el('div', {});
  const litType = argCfg.literal ? argCfg.literal.type : 'decimal';

  if (litType === 'enum') {
    const list = el('ul', { class: 'option-list' });
    argCfg.literal.values.forEach((v) => {
      const selected = node.kind === 'literal' && node.value === v;
      list.appendChild(
        el('li', {
          class: `option-row${selected ? ' selected' : ''}`,
          onclick: () => actions.chooseLiteral(path, v),
          text: v,
        })
      );
    });
    wrap.appendChild(list);
    return wrap;
  }

  const isInteger = litType === 'integer';
  const currentVal = node.kind === 'literal' ? node.value : '';
  const input = el('input', {
    class: 'literal-input',
    type: 'number',
    step: isInteger ? '1' : 'any',
    value: currentVal === null ? '' : currentVal,
    placeholder: isInteger ? 'Whole number' : 'Decimal value',
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') actions.chooseLiteral(path, parseLiteralInput(input.value, isInteger));
  });
  wrap.appendChild(input);
  wrap.appendChild(
    el('button', {
      class: 'btn primary',
      style: 'margin-top:8px;width:100%;justify-content:center;',
      onclick: () => actions.chooseLiteral(path, parseLiteralInput(input.value, isInteger)),
      text: 'Set value',
    })
  );
  wrap.appendChild(el('div', { class: 'literal-hint', text: isInteger ? 'Whole numbers only.' : 'Decimal values allowed, e.g. 0.005.' }));
  return wrap;
}

function parseLiteralInput(raw, isInteger) {
  const n = isInteger ? parseInt(raw, 10) : parseFloat(raw);
  return Number.isNaN(n) ? 0 : n;
}
