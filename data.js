/**
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
 *   query GetFormulaTemplates {
 *     formulaTemplates {
 *       label
 *       description
 *       structure
 *     }
 *   }
 *
 * Nothing else in the app needs to change when that swap happens --
 * every other file only depends on the shape returned here:
 *   fetchTemplates() -> [{ label, description, structure }, ...]
 *   fetchConfig()    -> { <fnName>: { label, category, swappableWith,
 *                           argumentCount, arguments: [...] }, ... }
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

const TEMPLATES_JSON = {
  "templates": [
    {
      "label": "Multiply with nested Add",
      "description": "Multiplies a value by the sum of two values",
      "structure": {
        "multiply": [
          "$value1",
          {
            "add": [
              "$value1",
              "$value2"
            ]
          }
        ]
      }
    },
    {
      "label": "Minimum after subtraction",
      "description": "Returns the smaller of a value and the result of subtracting one value from another",
      "structure": {
        "min": [
          "$value1",
          {
            "subtract": [
              "$value1",
              "$value2"
            ]
          }
        ]
      }
    },
    {
      "label": "Custom formula for export bills fees",
      "description": "Converts amount to INR at benchmark rate, applies 0.5% fee, capped between 2000 and 5000, then adds both",
      "structure": {
        "add": [
          {
            "max": [
              {
                "multiply": [
                  {
                    "convert": [
                      "$amount",
                      "$fromCurrency",
                      "$toCurrency",
                      "$rateType"
                    ]
                  },
                  "$secondValue"
                ]
              },
              "$secondValue"
            ]
          },
          {
            "max": [
              {
                "multiply": [
                  {
                    "convert": [
                      "$amount",
                      "$fromCurrency",
                      "$toCurrency",
                      "$rateType"
                    ]
                  },
                  "$secondValue"
                ]
              },
              "$secondValue"
            ]
          }
        ]
      }
    }
  ]
};

const CONFIG_JSON = {
  "add": {
    "label": "Addition",
    "category": "operator",
    "swappableWith": [
      "subtract",
      "multiply",
      "divide"
    ],
    "description": "Adds two numerical values together",
    "returnType": "number",
    "argumentCount": 2,
    "arguments": [
      {
        "position": 0,
        "label": "First value",
        "allowedTypes": [
          "variable",
          "literal",
          "function"
        ],
        "variables": [
          {
            "code": "charges.amount",
            "label": "charges - amount"
          },
          {
            "code": "beneficiary.amount",
            "label": "beneficiary - amount"
          },
          {
            "code": "charges.commissionAmount",
            "label": "charges - commissionAmount"
          },
          {
            "code": "charges.conversionTaxAmount",
            "label": "charges - conversionTaxAmount"
          },
          {
            "code": "charges.conversionTaxableValue",
            "label": "charges - conversionTaxableValue"
          },
          {
            "code": "rate",
            "label": "rate"
          },
          {
            "code": "remitter.amount",
            "label": "remitter - amount"
          },
          {
            "code": "expence.amount",
            "label": "expence - amount"
          },
          {
            "code": "transferAmount",
            "label": "transferAmount"
          },
          {
            "code": "charges.commissionTaxAmount",
            "label": "charges - commissionTaxAmount"
          }
        ],
        "literal": {
          "type": "decimal"
        }
      },
      {
        "position": 1,
        "label": "Second value",
        "allowedTypes": [
          "variable",
          "literal",
          "function"
        ],
        "variables": [
          {
            "code": "charges.amount",
            "label": "charges - amount"
          },
          {
            "code": "beneficiary.amount",
            "label": "beneficiary - amount"
          },
          {
            "code": "charges.commissionAmount",
            "label": "charges - commissionAmount"
          },
          {
            "code": "charges.conversionTaxAmount",
            "label": "charges - conversionTaxAmount"
          },
          {
            "code": "charges.conversionTaxableValue",
            "label": "charges - conversionTaxableValue"
          },
          {
            "code": "rate",
            "label": "rate"
          },
          {
            "code": "remitter.amount",
            "label": "remitter - amount"
          },
          {
            "code": "expence.amount",
            "label": "expence - amount"
          },
          {
            "code": "transferAmount",
            "label": "transferAmount"
          },
          {
            "code": "charges.commissionTaxAmount",
            "label": "charges - commissionTaxAmount"
          }
        ],
        "literal": {
          "type": "decimal"
        }
      }
    ]
  },
  "subtract": {
    "label": "Subtraction",
    "category": "operator",
    "swappableWith": [
      "add",
      "multiply",
      "divide"
    ],
    "description": "Subtracts second value from first",
    "returnType": "number",
    "argumentCount": 2,
    "arguments": [
      {
        "position": 0,
        "label": "First value",
        "allowedTypes": [
          "variable",
          "literal",
          "function"
        ],
        "variables": [
          {
            "code": "charges.amount",
            "label": "charges - amount"
          },
          {
            "code": "beneficiary.amount",
            "label": "beneficiary - amount"
          },
          {
            "code": "charges.commissionAmount",
            "label": "charges - commissionAmount"
          },
          {
            "code": "charges.conversionTaxAmount",
            "label": "charges - conversionTaxAmount"
          },
          {
            "code": "charges.conversionTaxableValue",
            "label": "charges - conversionTaxableValue"
          },
          {
            "code": "rate",
            "label": "rate"
          },
          {
            "code": "remitter.amount",
            "label": "remitter - amount"
          },
          {
            "code": "expence.amount",
            "label": "expence - amount"
          },
          {
            "code": "transferAmount",
            "label": "transferAmount"
          },
          {
            "code": "charges.commissionTaxAmount",
            "label": "charges - commissionTaxAmount"
          }
        ],
        "literal": {
          "type": "decimal"
        }
      },
      {
        "position": 1,
        "label": "Second value",
        "allowedTypes": [
          "variable",
          "literal",
          "function"
        ],
        "variables": [
          {
            "code": "charges.amount",
            "label": "charges - amount"
          },
          {
            "code": "beneficiary.amount",
            "label": "beneficiary - amount"
          },
          {
            "code": "charges.commissionAmount",
            "label": "charges - commissionAmount"
          },
          {
            "code": "charges.conversionTaxAmount",
            "label": "charges - conversionTaxAmount"
          },
          {
            "code": "charges.conversionTaxableValue",
            "label": "charges - conversionTaxableValue"
          },
          {
            "code": "rate",
            "label": "rate"
          },
          {
            "code": "remitter.amount",
            "label": "remitter - amount"
          },
          {
            "code": "expence.amount",
            "label": "expence - amount"
          },
          {
            "code": "transferAmount",
            "label": "transferAmount"
          },
          {
            "code": "charges.commissionTaxAmount",
            "label": "charges - commissionTaxAmount"
          }
        ],
        "literal": {
          "type": "decimal"
        }
      }
    ]
  },
  "multiply": {
    "label": "Multiplication",
    "category": "operator",
    "swappableWith": [
      "add",
      "subtract",
      "divide"
    ],
    "description": "Multiplies two values",
    "returnType": "number",
    "argumentCount": 2,
    "arguments": [
      {
        "position": 0,
        "label": "First value",
        "allowedTypes": [
          "variable",
          "literal",
          "function"
        ],
        "variables": [
          {
            "code": "charges.amount",
            "label": "charges - amount"
          },
          {
            "code": "beneficiary.amount",
            "label": "beneficiary - amount"
          },
          {
            "code": "charges.commissionAmount",
            "label": "charges - commissionAmount"
          },
          {
            "code": "charges.conversionTaxAmount",
            "label": "charges - conversionTaxAmount"
          },
          {
            "code": "charges.conversionTaxableValue",
            "label": "charges - conversionTaxableValue"
          },
          {
            "code": "rate",
            "label": "rate"
          },
          {
            "code": "remitter.amount",
            "label": "remitter - amount"
          },
          {
            "code": "expence.amount",
            "label": "expence - amount"
          },
          {
            "code": "transferAmount",
            "label": "transferAmount"
          },
          {
            "code": "charges.commissionTaxAmount",
            "label": "charges - commissionTaxAmount"
          }
        ],
        "literal": {
          "type": "decimal"
        }
      },
      {
        "position": 1,
        "label": "Second value",
        "allowedTypes": [
          "variable",
          "literal",
          "function"
        ],
        "variables": [
          {
            "code": "charges.amount",
            "label": "charges - amount"
          },
          {
            "code": "beneficiary.amount",
            "label": "beneficiary - amount"
          },
          {
            "code": "charges.commissionAmount",
            "label": "charges - commissionAmount"
          },
          {
            "code": "charges.conversionTaxAmount",
            "label": "charges - conversionTaxAmount"
          },
          {
            "code": "charges.conversionTaxableValue",
            "label": "charges - conversionTaxableValue"
          },
          {
            "code": "rate",
            "label": "rate"
          },
          {
            "code": "remitter.amount",
            "label": "remitter - amount"
          },
          {
            "code": "expence.amount",
            "label": "expence - amount"
          },
          {
            "code": "transferAmount",
            "label": "transferAmount"
          },
          {
            "code": "charges.commissionTaxAmount",
            "label": "charges - commissionTaxAmount"
          }
        ],
        "literal": {
          "type": "decimal"
        }
      }
    ]
  },
  "divide": {
    "label": "Division",
    "category": "operator",
    "swappableWith": [
      "add",
      "subtract",
      "multiply"
    ],
    "description": "Divides first value by second",
    "returnType": "number",
    "argumentCount": 2,
    "arguments": [
      {
        "position": 0,
        "label": "First value",
        "allowedTypes": [
          "variable",
          "literal",
          "function"
        ],
        "variables": [
          {
            "code": "charges.amount",
            "label": "charges - amount"
          },
          {
            "code": "beneficiary.amount",
            "label": "beneficiary - amount"
          },
          {
            "code": "charges.commissionAmount",
            "label": "charges - commissionAmount"
          },
          {
            "code": "charges.conversionTaxAmount",
            "label": "charges - conversionTaxAmount"
          },
          {
            "code": "charges.conversionTaxableValue",
            "label": "charges - conversionTaxableValue"
          },
          {
            "code": "rate",
            "label": "rate"
          },
          {
            "code": "remitter.amount",
            "label": "remitter - amount"
          },
          {
            "code": "expence.amount",
            "label": "expence - amount"
          },
          {
            "code": "transferAmount",
            "label": "transferAmount"
          },
          {
            "code": "charges.commissionTaxAmount",
            "label": "charges - commissionTaxAmount"
          }
        ],
        "literal": {
          "type": "decimal"
        }
      },
      {
        "position": 1,
        "label": "Second value",
        "allowedTypes": [
          "variable",
          "literal",
          "function"
        ],
        "variables": [
          {
            "code": "charges.amount",
            "label": "charges - amount"
          },
          {
            "code": "beneficiary.amount",
            "label": "beneficiary - amount"
          },
          {
            "code": "charges.commissionAmount",
            "label": "charges - commissionAmount"
          },
          {
            "code": "charges.conversionTaxAmount",
            "label": "charges - conversionTaxAmount"
          },
          {
            "code": "charges.conversionTaxableValue",
            "label": "charges - conversionTaxableValue"
          },
          {
            "code": "rate",
            "label": "rate"
          },
          {
            "code": "remitter.amount",
            "label": "remitter - amount"
          },
          {
            "code": "expence.amount",
            "label": "expence - amount"
          },
          {
            "code": "transferAmount",
            "label": "transferAmount"
          },
          {
            "code": "charges.commissionTaxAmount",
            "label": "charges - commissionTaxAmount"
          }
        ],
        "literal": {
          "type": "decimal"
        }
      }
    ]
  },
  "min": {
    "label": "Minimum",
    "category": "function",
    "swappableWith": [],
    "description": "Returns the smaller of two values",
    "returnType": "number",
    "argumentCount": 2,
    "arguments": [
      {
        "position": 0,
        "label": "First value",
        "allowedTypes": [
          "variable",
          "literal",
          "function"
        ],
        "variables": [
          {
            "code": "charges.amount",
            "label": "charges - amount"
          },
          {
            "code": "beneficiary.amount",
            "label": "beneficiary - amount"
          },
          {
            "code": "charges.commissionAmount",
            "label": "charges - commissionAmount"
          },
          {
            "code": "charges.conversionTaxAmount",
            "label": "charges - conversionTaxAmount"
          },
          {
            "code": "charges.conversionTaxableValue",
            "label": "charges - conversionTaxableValue"
          },
          {
            "code": "rate",
            "label": "rate"
          },
          {
            "code": "remitter.amount",
            "label": "remitter - amount"
          },
          {
            "code": "expence.amount",
            "label": "expence - amount"
          },
          {
            "code": "transferAmount",
            "label": "transferAmount"
          },
          {
            "code": "charges.commissionTaxAmount",
            "label": "charges - commissionTaxAmount"
          }
        ],
        "literal": {
          "type": "decimal"
        }
      },
      {
        "position": 1,
        "label": "Second value",
        "allowedTypes": [
          "variable",
          "literal",
          "function"
        ],
        "variables": [
          {
            "code": "charges.amount",
            "label": "charges - amount"
          },
          {
            "code": "beneficiary.amount",
            "label": "beneficiary - amount"
          },
          {
            "code": "charges.commissionAmount",
            "label": "charges - commissionAmount"
          },
          {
            "code": "charges.conversionTaxAmount",
            "label": "charges - conversionTaxAmount"
          },
          {
            "code": "charges.conversionTaxableValue",
            "label": "charges - conversionTaxableValue"
          },
          {
            "code": "rate",
            "label": "rate"
          },
          {
            "code": "remitter.amount",
            "label": "remitter - amount"
          },
          {
            "code": "expence.amount",
            "label": "expence - amount"
          },
          {
            "code": "transferAmount",
            "label": "transferAmount"
          },
          {
            "code": "charges.commissionTaxAmount",
            "label": "charges - commissionTaxAmount"
          }
        ],
        "literal": {
          "type": "decimal"
        }
      }
    ]
  },
  "max": {
    "label": "Maximum",
    "category": "function",
    "swappableWith": [],
    "description": "Returns the larger of two values",
    "returnType": "number",
    "argumentCount": 2,
    "arguments": [
      {
        "position": 0,
        "label": "First value",
        "allowedTypes": [
          "variable",
          "literal",
          "function"
        ],
        "variables": [
          {
            "code": "charges.amount",
            "label": "charges - amount"
          },
          {
            "code": "beneficiary.amount",
            "label": "beneficiary - amount"
          },
          {
            "code": "charges.commissionAmount",
            "label": "charges - commissionAmount"
          },
          {
            "code": "charges.conversionTaxAmount",
            "label": "charges - conversionTaxAmount"
          },
          {
            "code": "charges.conversionTaxableValue",
            "label": "charges - conversionTaxableValue"
          },
          {
            "code": "rate",
            "label": "rate"
          },
          {
            "code": "remitter.amount",
            "label": "remitter - amount"
          },
          {
            "code": "expence.amount",
            "label": "expence - amount"
          },
          {
            "code": "transferAmount",
            "label": "transferAmount"
          },
          {
            "code": "charges.commissionTaxAmount",
            "label": "charges - commissionTaxAmount"
          }
        ],
        "literal": {
          "type": "decimal"
        }
      },
      {
        "position": 1,
        "label": "Second value",
        "allowedTypes": [
          "variable",
          "literal",
          "function"
        ],
        "variables": [
          {
            "code": "charges.amount",
            "label": "charges - amount"
          },
          {
            "code": "beneficiary.amount",
            "label": "beneficiary - amount"
          },
          {
            "code": "charges.commissionAmount",
            "label": "charges - commissionAmount"
          },
          {
            "code": "charges.conversionTaxAmount",
            "label": "charges - conversionTaxAmount"
          },
          {
            "code": "charges.conversionTaxableValue",
            "label": "charges - conversionTaxableValue"
          },
          {
            "code": "rate",
            "label": "rate"
          },
          {
            "code": "remitter.amount",
            "label": "remitter - amount"
          },
          {
            "code": "expence.amount",
            "label": "expence - amount"
          },
          {
            "code": "transferAmount",
            "label": "transferAmount"
          },
          {
            "code": "charges.commissionTaxAmount",
            "label": "charges - commissionTaxAmount"
          }
        ],
        "literal": {
          "type": "decimal"
        }
      }
    ]
  },
  "round": {
    "label": "Round",
    "category": "function",
    "swappableWith": [],
    "description": "Rounds first value to specified decimal places",
    "returnType": "number",
    "argumentCount": 2,
    "arguments": [
      {
        "position": 0,
        "label": "Value to round",
        "allowedTypes": [
          "variable",
          "literal",
          "function"
        ],
        "variables": [
          {
            "code": "charges.amount",
            "label": "charges - amount"
          },
          {
            "code": "beneficiary.amount",
            "label": "beneficiary - amount"
          },
          {
            "code": "charges.commissionAmount",
            "label": "charges - commissionAmount"
          },
          {
            "code": "charges.conversionTaxAmount",
            "label": "charges - conversionTaxAmount"
          },
          {
            "code": "charges.conversionTaxableValue",
            "label": "charges - conversionTaxableValue"
          },
          {
            "code": "rate",
            "label": "rate"
          },
          {
            "code": "remitter.amount",
            "label": "remitter - amount"
          },
          {
            "code": "expence.amount",
            "label": "expence - amount"
          },
          {
            "code": "transferAmount",
            "label": "transferAmount"
          },
          {
            "code": "charges.commissionTaxAmount",
            "label": "charges - commissionTaxAmount"
          }
        ],
        "literal": {
          "type": "decimal"
        }
      },
      {
        "position": 1,
        "label": "Decimal places",
        "allowedTypes": [
          "literal"
        ],
        "variables": [],
        "literal": {
          "type": "integer"
        }
      }
    ]
  },
  "convert": {
    "label": "Convert Currency",
    "category": "function",
    "swappableWith": [],
    "description": "Converts amount between currencies using specified rate type",
    "returnType": "number",
    "argumentCount": 4,
    "arguments": [
      {
        "position": 0,
        "label": "Amount",
        "allowedTypes": [
          "variable",
          "function"
        ],
        "variables": [
          {
            "code": "charges.amount",
            "label": "charges - amount"
          },
          {
            "code": "beneficiary.amount",
            "label": "beneficiary - amount"
          },
          {
            "code": "charges.commissionAmount",
            "label": "charges - commissionAmount"
          },
          {
            "code": "charges.conversionTaxAmount",
            "label": "charges - conversionTaxAmount"
          },
          {
            "code": "charges.conversionTaxableValue",
            "label": "charges - conversionTaxableValue"
          },
          {
            "code": "rate",
            "label": "rate"
          },
          {
            "code": "remitter.amount",
            "label": "remitter - amount"
          },
          {
            "code": "expence.amount",
            "label": "expence - amount"
          },
          {
            "code": "transferAmount",
            "label": "transferAmount"
          },
          {
            "code": "charges.commissionTaxAmount",
            "label": "charges - commissionTaxAmount"
          }
        ]
      },
      {
        "position": 1,
        "label": "From Currency",
        "allowedTypes": [
          "variable",
          "literal"
        ],
        "variables": [
          {
            "code": "charges.currency",
            "label": "charges - currency"
          },
          {
            "code": "expence.currency",
            "label": "expence - currency"
          },
          {
            "code": "remitter.currency",
            "label": "remitter - currency"
          },
          {
            "code": "beneficiary.currency",
            "label": "beneficiary - currency"
          },
          {
            "code": "transferCurrency",
            "label": "transferCurrency"
          }
        ],
        "literal": {
          "type": "currencyCode",
          "values": [
            "USD",
            "EUR",
            "INR",
            "RUB",
            "JPY",
            "GBP",
            "CNY"
          ]
        }
      },
      {
        "position": 2,
        "label": "To Currency",
        "allowedTypes": [
          "variable",
          "literal"
        ],
        "variables": [
          {
            "code": "charges.currency",
            "label": "charges - currency"
          },
          {
            "code": "expence.currency",
            "label": "expence - currency"
          },
          {
            "code": "remitter.currency",
            "label": "remitter - currency"
          },
          {
            "code": "beneficiary.currency",
            "label": "beneficiary - currency"
          },
          {
            "code": "transferCurrency",
            "label": "transferCurrency"
          }
        ],
        "literal": {
          "type": "currencyCode",
          "values": [
            "USD",
            "EUR",
            "INR",
            "RUB",
            "JPY",
            "GBP",
            "CNY"
          ]
        }
      },
      {
        "position": 3,
        "label": "Rate Type",
        "allowedTypes": [
          "literal"
        ],
        "variables": [],
        "literal": {
          "type": "enum",
          "values": [
            "BENCHMARK"
          ]
        }
      }
    ]
  }
};

/** Simulates the GraphQL round trip. Returns a Promise like a real fetch would. */
function fetchTemplates() {
  return new Promise((resolve) => {
    setTimeout(() => resolve(structuredClone(TEMPLATES_JSON.templates)), 300);
  });
}

/** Config is local/static for now -- still modeled as async since it may move server-side later. */
function fetchConfig() {
  return new Promise((resolve) => {
    setTimeout(() => resolve(structuredClone(CONFIG_JSON)), 50);
  });
}
