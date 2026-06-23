/**
 * formula-model.js
 * -----------------------------------------------------------------------
 * Pure data/logic layer. No DOM here — render.js and main.js depend on
 * this, this depends on nothing but the config object (loaded from
 * config.json by main.js).
 *
 * A "node" in a formula tree is one of:
 *   - a call node:   { fn: "add", args: [node, node, ...] }
 *   - a leaf node:    { kind: "variable" | "literal" | "currency" | "unset",
 *                        value: <code|literal text|currency code|null>,
 *                        placeholder: "$value1" }   // original template name, kept for reference
 *
 * Templates arrive as plain nested objects, e.g.
 *   { "multiply": ["$value1", { "add": ["$value1", "$value2"] }] }
 * parseStructure() turns that into the node shape above. A leaf that
 * starts with "$" is a template placeholder -> becomes an "unset" leaf,
 * because the placeholder name is not itself a valid variable code; the
 * user must choose a real variable/literal/currency for it.
 *
 * Every node also gets a stable "path" (array of indices, e.g. [1,0])
 * so the UI can address "argument 0 of the function nested at args[1]"
 * without re-walking the tree from scratch on every click.
 * -----------------------------------------------------------------------
 */

/* ---------------------------------------------------------------- parse */

function parseStructure(structure) {
  return parseNode(structure);
}

function parseNode(raw) {
  if (raw !== null && typeof raw === 'object' && !Array.isArray(raw)) {
    const fn = Object.keys(raw)[0];
    const args = raw[fn].map(parseNode);
    return { fn, args };
  }
  // leaf: a placeholder string like "$value1", or (after editing) something
  // that's already a model leaf. Template leaves are always "$xxx" strings.
  if (typeof raw === 'string' && raw.startsWith('$')) {
    return { kind: 'unset', value: null, placeholder: raw };
  }
  // Defensive: a stray literal/number directly in a template (not used by
  // current templates.json, but config allows literals at leaf positions
  // once edited, so handle re-parsing a previously-built leaf object too).
  if (raw !== null && typeof raw === 'object' && raw.kind) {
    return { ...raw };
  }
  return { kind: 'literal', value: raw, placeholder: null };
}

/* ------------------------------------------------------------- locate */

/** Returns the node at `path` (array of arg-indices from the root). */
function getNodeAtPath(root, path) {
  let node = root;
  for (const i of path) node = node.args[i];
  return node;
}

/** Returns the parent call-node and the index of `path`'s node within it.
 *  Returns { parent: null, index: -1 } if path is the root itself. */
function getParentAtPath(root, path) {
  if (path.length === 0) return { parent: null, index: -1 };
  const parentPath = path.slice(0, -1);
  const index = path[path.length - 1];
  return { parent: getNodeAtPath(root, parentPath), index };
}

/** Returns a new tree with the node at `path` replaced by `newNode`.
 *  Tree is treated as immutable so the caller can diff/re-render cheaply. */
function replaceAtPath(root, path, newNode) {
  if (path.length === 0) return newNode;
  const [head, ...rest] = path;
  const clone = { fn: root.fn, args: root.args.slice() };
  clone.args[head] = replaceAtPath(root.args[head], rest, newNode);
  return clone;
}

/* -------------------------------------------------------- config lookup */

/** Walks the tree alongside the config to find the config.arguments[] entry
 *  that governs the node at `path`. Root has no governing argument config
 *  (nothing constrains what the whole formula returns), so callers should
 *  only call this for non-root paths. */
function getArgConfigForPath(root, path, config) {
  const { parent, index } = getParentAtPath(root, path);
  if (!parent) return null;
  const fnConfig = config[parent.fn];
  if (!fnConfig) return null;
  return fnConfig.arguments.find((a) => a.position === index) || null;
}

/* ------------------------------------------------------------- mutation */

function setLeafVariable(root, path, code) {
  return replaceAtPath(root, path, { kind: 'variable', value: code, placeholder: getNodeAtPath(root, path).placeholder });
}

function setLeafLiteral(root, path, literalValue) {
  return replaceAtPath(root, path, { kind: 'literal', value: literalValue, placeholder: getNodeAtPath(root, path).placeholder });
}

function setLeafCurrency(root, path, code) {
  return replaceAtPath(root, path, { kind: 'currency', value: code, placeholder: getNodeAtPath(root, path).placeholder });
}

/** Clears a leaf back to unset (used when switching type tabs in the popover
 *  before a new value is chosen, so a half-picked literal can't linger). */
function clearLeaf(root, path) {
  return replaceAtPath(root, path, { kind: 'unset', value: null, placeholder: getNodeAtPath(root, path).placeholder });
}

/** Swaps the function name at `path` for `newFn`. Only legal between two
 *  operators that list each other in swappableWith — callers should check
 *  isSwapAllowed() first, but this re-checks defensively. Args are kept
 *  as-is since operators are arity-2 today; arg configs (allowedTypes,
 *  variables list) are pulled from the new operator's config the next
 *  time the tree is validated/rendered. */
function swapOperator(root, path, newFn, config) {
  const node = getNodeAtPath(root, path);
  if (!isSwapAllowed(node.fn, newFn, config)) return root;
  return replaceAtPath(root, path, { fn: newFn, args: node.args });
}

function isSwapAllowed(currentFn, targetFn, config) {
  const cfg = config[currentFn];
  if (!cfg || cfg.category !== 'operator') return false;
  if (currentFn === targetFn) return true;
  return (cfg.swappableWith || []).includes(targetFn);
}

/* ------------------------------------------------------------ validate */

/**
 * Walks the whole tree and returns a flat list of human-readable problems.
 * A formula with zero problems is considered complete/savable.
 */
function validateTree(root, config) {
  const problems = [];
  walk(root, [], (node, path) => {
    if (node.fn) return; // call nodes have nothing of their own to validate
    if (node.kind === 'unset') {
      const argCfg = getArgConfigForPath(root, path, config);
      const label = argCfg ? argCfg.label : 'value';
      problems.push(`"${label}" still needs a value.`);
    }
  });
  return problems;
}

/** Depth-first walk over every node (call nodes and leaves), path included. */
function walk(node, path, visit) {
  visit(node, path);
  if (node.fn) {
    node.args.forEach((child, i) => walk(child, [...path, i], visit));
  }
}

/* ------------------------------------------------------------ serialize */

/** Turns the editable tree back into the plain nested-object shape that
 *  matches templates.json / what a real GraphQL mutation would send back. */
function serializeNode(node) {
  if (node.fn) {
    return { [node.fn]: node.args.map(serializeNode) };
  }
  if (node.kind === 'unset') return node.placeholder || '$unset';
  if (node.kind === 'variable') return `$${node.value}`;
  if (node.kind === 'currency') return node.value;
  // literal
  return node.value;
}

function serializeTree(root) {
  return serializeNode(root);
}
