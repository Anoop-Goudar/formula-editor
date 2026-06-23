#!/usr/bin/env python3
"""
generate_data_js.py
-----------------------------------------------------------------------
Regenerates data.js by embedding the current contents of templates.json
and config.json. Run this any time either JSON file changes:

    python3 generate_data_js.py

templates.json and config.json remain the source of truth -- edit those,
not data.js directly. This script just keeps data.js (the inlined copy
the browser actually loads) in sync with them.
-----------------------------------------------------------------------
"""
import json
import pathlib

HERE = pathlib.Path(__file__).parent

with open(HERE / "templates.json") as f:
    templates = json.load(f)
with open(HERE / "config.json") as f:
    config = json.load(f)

templates_js = json.dumps(templates, indent=2)
config_js = json.dumps(config, indent=2)

content = f'''/**
 * data.js
 * -----------------------------------------------------------------------
 * Data layer. TEMPLATES_JSON and CONFIG_JSON below are generated directly
 * from templates.json and config.json (kept alongside this file as the
 * source of truth) and inlined here so the app runs by double-clicking
 * index.html, with no local server and no fetch()/CORS involved.
 *
 * If you edit templates.json or config.json, regenerate this file rather
 * than hand-editing the objects below -- run:
 *
 *   python3 generate_data_js.py
 *
 * In production, fetchTemplates() is replaced by a real GraphQL query:
 *
 *   query GetFormulaTemplates {{
 *     formulaTemplates {{
 *       label
 *       description
 *       structure
 *     }}
 *   }}
 *
 * Nothing else in the app needs to change when that swap happens --
 * every other file only depends on the shape returned here:
 *   fetchTemplates() -> [{{ label, description, structure }}, ...]
 *   fetchConfig()    -> {{ <fnName>: {{ label, category, swappableWith,
 *                           argumentCount, arguments: [...] }}, ... }}
 *
 * config.json is the editing rulebook: for every function name, what each
 * argument position allows (variable / literal / function), which exact
 * variables/currencies are valid there, and literal constraints. Every
 * entry also carries "category" ("operator" | "function") and
 * "swappableWith" -- operators (add/subtract/multiply/divide) can be
 * swapped for each other; functions (min/max/round/convert) are
 * structurally frozen, since replacing a function for another function
 * is explicit future scope, not supported by this builder yet.
 * -----------------------------------------------------------------------
 */

const TEMPLATES_JSON = {templates_js};

const CONFIG_JSON = {config_js};

/** Simulates the GraphQL round trip. Returns a Promise like a real fetch would. */
function fetchTemplates() {{
  return new Promise((resolve) => {{
    setTimeout(() => resolve(structuredClone(TEMPLATES_JSON.templates)), 300);
  }});
}}

/** Config is local/static for now -- still modeled as async since it may move server-side later. */
function fetchConfig() {{
  return new Promise((resolve) => {{
    setTimeout(() => resolve(structuredClone(CONFIG_JSON)), 50);
  }});
}}
'''

with open(HERE / "data.js", "w") as f:
    f.write(content)

print(f"data.js regenerated ({len(content)} bytes) from templates.json + config.json")
