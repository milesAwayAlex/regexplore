const descriptions = {
  charLiteral: {
    type: 'Value',
    name: 'Character literal',
    description: 'Match exactly that character',
  },
  escapedChar: {
    type: 'Value',
    name: 'Escaped character',
    description: 'Match exactly that character',
  },
  charClass: {
    searchByLabel: true,
  },
  '.': {
    type: 'Value',
    name: 'Wildcard character',
    description: 'Match any character',
  },
  '\\d': {
    type: 'Value',
    name: 'Digits character class',
    description: 'Match a single digit character (0123456789)',
  },
  '\\D': {
    type: 'Value',
    name: 'Non-digits character class',
    description: 'Match a single non-digit character (0123456789)',
  },
  '\\w': {
    type: 'Value',
    name: 'Alphanumeric character class',
    description: 'Match a single alphanumeric character (a-z, A-Z, 0-9, _)',
  },
  '\\W': {
    type: 'Value',
    name: 'Non-alphanumeric character class',
    description: 'Match a single non-alphanumeric character (a-z, A-Z, 0-9, _)',
  },
  '\\s': {
    type: 'Value',
    name: 'White space character class',
    description: 'Match a single white space character (a-z, A-Z, 0-9, _)',
  },
  '\\S': {
    type: 'Value',
    label: '\\S',
    name: 'Non white space character class',
    description: 'Match a single non white space character (a-z, A-Z, 0-9, _)',
  },
  '|': {
    type: 'Operator',
    name: 'Alternation operator',
    description: 'Match either of the items preceding and following.',
  },
  '?': {
    type: 'Quantifier',
    name: '0 or 1 quantifier',
    description: 'Match the preceding item 0 or 1 times.',
  },
  '*': {
    type: 'Quantifier',
    name: '0 to any quantifier',
    description: 'Match the preceding item 0 or more times.',
  },
  '+': {
    type: 'Quantifier',
    name: '1 to any quantifier',
    description: 'Match the preceding item 1 or more times.',
  },
  '(': {
    type: 'Delimiter',
    name: 'Left parenthesis',
    description:
      'Open a parentheses pair to manage precedence and set a capture group',
  },
  ')': {
    type: 'Delimiter',
    name: 'Right parenthesis',
    description:
      'Close a parentheses pair to manage precedence and set a capture group',
  },
  '[': {
    type: 'Delimiter',
    name: 'Left bracket',
    description: 'Open a bracketed character class',
  },
  ']': {
    type: 'Delimiter',
    name: 'Right bracket',
    description: 'Close a bracketed character class',
  },
  bracketChar: {
    type: 'Value',
    name: 'Character literal (brackets)',
    description: 'Add an alternative in the bracketed expression',
  },
  bracketRangeLow: {
    type: 'Value',
    name: 'Range beginning',
    description:
      'Define the beginning of a character range in a bracketed expression',
  },
  bracketRangeHigh: {
    type: 'Value',
    name: 'Range ending',
    description:
      'Define the ending of a character range in a bracketed expression',
  },
  '-': {
    type: 'Operator',
    name: 'Range operator',
    description:
      'Add a character range as alternatives in a bracketed expression',
    warning: 'Has to be neither at the end or beginning of the expression',
  },
  '^': {
    type: 'Operator',
    name: 'Negation operator',
    description: 'Negate a bracket expression to match characters not in it',
    warning: 'Has to be positioned as the first character in the expression',
  },
  empty: {
    name: 'Not hovering over anything',
  },
};

//------------------------------------------------------------------------------

const warnings = {
  '![': {
    type: '![',
    label: '[',
    issue: 'An open bracket has not been closed',
    msg: 'The parser is adding an implicit closing bracket.',
  },
  '!(': {
    type: '!(',
    label: '(',
    issue: 'An open parenthesis has not been closed',
    msg: 'The parser is adding an implicit closing parenthesis.',
  },
  '!)': {
    type: '!)',
    label: ')',
    issue: 'A closing parenthesis has no match',
    msg: 'The parser is ignoring the closing parenthesis.',
  },
  '!**': {
    type: '!**',
    // label from parser
    issue: 'Redundant quantifiers',
    msg: 'The parser is simplifying the quantifiers to a single one.',
    // msg from parser
  },
  '!E*': {
    type: '!E*',
    // label from parser
    issue: 'A quantifier follows an empty value',
    msg: 'The parser is ignoring the quantifier.',
  },
  '!E|': {
    type: '!E|',
    label: '|',
    issue: 'An alternation follows an empty value',
    msg: 'The parser is ignoring the alternation.',
  },
  '!|E': {
    type: '!|E',
    label: '|',
    issue: 'An alternation precedes an empty value',
    msg: 'The parser is ignoring the alternation.',
  },
  '!()': {
    type: '!()',
    label: '()',
    issue: 'A pair of parentheses contains no value',
    msg: 'The parser is ignoring the parentheses.',
  },
};

//------------------------------------------------------------------------------

export { descriptions, warnings };
