/**
 * main.js
 * -----------------------------------------------------------------------
 * App state + wiring. Owns the single `state` object, exposes `actions`
 * (the only way render.js's click handlers are allowed to change state),
 * and re-renders on every change. No rendering logic lives here, no tree
 * logic lives here — see render.js and formula-model.js respectively.
 * -----------------------------------------------------------------------
 */

const state = {
  loading: true,
  templates: [],       // [{ label, description, structure }]
  config: {},           // editing rulebook, fetched from config.json
  selectedIndex: null,
  tree: null,            // editable model tree for the selected template (parseStructure output)
  originalTree: null,    // snapshot for Reset
  popover: null,         // { type: 'leaf'|'operator', path, x, y, tab, search }
  justSaved: false,
};

function rerender() {
  renderApp(state, actions);
}

const actions = {
  selectTemplate(index) {
    state.selectedIndex = index;
    state.tree = parseStructure(state.templates[index].structure);
    state.originalTree = state.tree;
    state.popover = null;
    state.justSaved = false;
    rerender();
  },

  resetTemplate() {
    if (state.selectedIndex === null) return;
    state.tree = state.originalTree;
    state.popover = null;
    state.justSaved = false;
    rerender();
  },

  saveTemplate() {
    const problems = validateTree(state.tree, state.config);
    if (problems.length > 0) return;
    // In production this is where a GraphQL mutation would fire with
    // serializeTree(state.tree) as the payload. For now, log it and
    // treat the current tree as the new saved baseline.
    console.log('Saving formula:', JSON.stringify(serializeTree(state.tree), null, 2));
    state.originalTree = state.tree;
    state.justSaved = true;
    rerender();
    setTimeout(() => {
      state.justSaved = false;
      rerender();
    }, 1600);
  },

  openLeafPopover(path, anchorEl) {
    const { x, y } = popoverPositionFor(anchorEl);
    const node = getNodeAtPath(state.tree, path);
    state.popover = {
      type: 'leaf',
      path,
      x,
      y,
      tab: node.kind === 'unset' ? null : node.kind,
      search: '',
    };
    rerender();
  },

  openOperatorPopover(path, anchorEl) {
    const { x, y } = popoverPositionFor(anchorEl);
    state.popover = { type: 'operator', path, x, y };
    rerender();
  },

  closePopover() {
    state.popover = null;
    rerender();
  },

  setPopoverTab(tab) {
    if (!state.popover) return;
    state.popover = { ...state.popover, tab, search: '' };
    rerender();
  },

  setPopoverSearch(search) {
    if (!state.popover) return;
    state.popover.search = search;
    // Re-render the popover only would be nicer, but a full re-render is
    // cheap at this tree size and keeps state/view perfectly in sync.
    rerender();
    // Re-focus + restore caret since the input was just torn down and rebuilt.
    const input = document.querySelector('.search-input');
    if (input) {
      input.focus();
      input.setSelectionRange(search.length, search.length);
    }
  },

  chooseVariable(path, code) {
    state.tree = setLeafVariable(state.tree, path, code);
    state.popover = null;
    rerender();
  },

  chooseLiteral(path, value) {
    state.tree = setLeafLiteral(state.tree, path, value);
    state.popover = null;
    rerender();
  },

  chooseCurrency(path, code) {
    state.tree = setLeafCurrency(state.tree, path, code);
    state.popover = null;
    rerender();
  },

  chooseOperator(path, newFn) {
    state.tree = swapOperator(state.tree, path, newFn, state.config);
    state.popover = null;
    rerender();
  },
};

/** Positions a popover under its anchor button, clamped so it doesn't run
 *  off the right edge of the viewport. */
function popoverPositionFor(anchorEl) {
  const rect = anchorEl.getBoundingClientRect();
  const popoverWidth = 280;
  let x = rect.left + window.scrollX;
  const maxX = window.scrollX + window.innerWidth - popoverWidth - 16;
  if (x > maxX) x = maxX;
  const y = rect.bottom + window.scrollY + 6;
  return { x, y };
}

/* ------------------------------------------------------------- bootstrap */

// In production fetchTemplates() becomes a real GraphQL query:
//   query GetFormulaTemplates { formulaTemplates { label description structure } }
// Nothing else in the app needs to change -- the rest of the code only depends
// on the shape returned here:
//   fetchTemplates() -> [{ label, description, structure }, ...]
//   fetchConfig()    -> { <fnName>: { label, category, swappableWith,
//                          argumentCount, arguments: [...] }, ... }
async function fetchTemplates() {
  const res = await fetch('templates.json');
  const data = await res.json();
  return data.templates;
}

async function fetchConfig() {
  const res = await fetch('config.json');
  return res.json();
}

async function bootstrap() {
  rerender(); // show loading state immediately
  const [templates, config] = await Promise.all([fetchTemplates(), fetchConfig()]);
  state.templates = templates;
  state.config = config;
  state.loading = false;
  if (templates.length > 0) {
    actions.selectTemplate(0);
  } else {
    rerender();
  }
}

bootstrap();
