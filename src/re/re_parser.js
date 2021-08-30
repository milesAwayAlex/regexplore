//------------------------------------------------------------------------------
// Parser class
//------------------------------------------------------------------------------

import { logHeading, toString, inspect } from './re_helpers.js';

import { getToken, getConcat, getBracketClass } from './re_tokens.js';

import State from './re_states.js';
import { warnings } from './re_static_info.js';
// import Fragment from './re_fragments.js';

//------------------------------------------------------------------------------

const isValue = (token) =>
  token.type && token.type !== '|' && token.type !== '(';

const isQuantifier = (token) => ['?', '*', '+'].includes(token.type);

//------------------------------------------------------------------------------

class Parser {
  constructor(input) {
    this.input = input; // unprocessed input string

    // Temporary state properties used during parsing
    this.pos = 0;
    this.operators = [];

    // Data structures generated by the parser
    this.rpn = [];
    this.descriptions = [];

    // Data structures generated by the compiler
    this.firstState = null;
    this.fragments = [];
    this.warnings = [];
  }

  //----------------------------------------------------------------------------
  // Helpers

  ch(shift = 0) {
    return this.input[this.pos + shift];
  }

  slice(length) {
    return this.input.slice(this.pos, this.pos + length);
  }

  code(shift = 0) {
    return this.input.charCodeAt(this.pos + shift);
  }

  remaining() {
    return this.input.length - this.pos;
  }

  logStr() {
    logHeading('Input');
    console.log(`  ${this.input}`);
  }

  logWarnings() {
    logHeading('Warnings');
    this.warnings.forEach((warning) => console.log(`  ${toString(warning)}`));
  }

  log() {
    this.logStr();
    this.logTokens();
    this.logDescriptions();
    // this.logGraph();
    this.logWarnings();
  }

  //----------------------------------------------------------------------------
  // Convert to Reverse Polish Notation (RPN)

  // Read the next token and advance the position in the input string
  readToken() {
    // Bracket expressions
    if (this.ch() === '[') {
      return this.readBracketExpression();
    }

    const token = getToken(this.slice(2), this.pos);
    this.pushDescription(token.label, token.type);
    this.pos += token.label.length;
    return token;
  }

  topOperatorIs(label) {
    const operator = this.operators[this.operators.length - 1];
    return operator !== undefined && operator.label === label;
  }

  // Transfer the stacked operator to the RPN queue if it is at the top
  transferOperator(ch) {
    if (this.topOperatorIs(ch)) {
      const operator = this.operators.pop();
      this.rpn.push(operator);
    }
  }

  // Add an implicit concat when necessary
  concat() {
    this.transferOperator('~');
    this.operators.push(getConcat());
  }

  // Generate a queue of tokens in reverse polish notation (RPN)
  // using a simplified shunting-yard algorithm
  generateRPN() {
    let openParenCount = 0;
    let prevToken = {};
    while (this.remaining()) {
      let skipped = false;
      const token = this.readToken();
      switch (token.type) {
        case 'charLiteral':
        case 'escapedChar':
        case 'charClass':
        case 'bracketClass':
        case '.':
          if (isValue(prevToken)) this.concat();
          this.rpn.push(token);
          break;
        case '|':
          this.transferOperator('~');
          this.transferOperator('|');
          this.operators.push(token);
          break;
        case '?':
        case '*':
        case '+':
          if (isQuantifier(prevToken)) {
            // const
            // const warn
          }

          // Edge case: No value before quantifier
          if (!isValue(prevToken)) {
            this.addWarning('!E', token.pos);
            this.describe(token.pos, { warning: '!E' });
            skipped = true;
            break;
          }
          this.rpn.push(token);
          break;
        case '(':
          if (isValue(prevToken)) this.concat();
          token.range = [token.pos];
          this.operators.push(token);
          openParenCount++;
          break;
        case ')':
          // Edge case: missing opening parenthesis
          if (openParenCount === 0) {
            this.addWarning('!(', token.pos);
            this.describe(token.pos, { warning: '!(' });
            skipped = true;
            break;
          }

          this.transferOperator('~');
          this.transferOperator('|');

          const open = this.operators.pop();
          const begin = open.pos;
          const end = token.pos;
          const range = [begin, end];
          open.range = range;

          this.rpn.push(open);
          this.describe(begin, { range });
          this.describe(end, { range });
          openParenCount--;
          break;
        default:
          break;
      }
      if (!skipped) prevToken = token;
    }

    do {
      this.transferOperator('~');
      this.transferOperator('|');

      // Edge case: missing closing parenthesis
      if (this.topOperatorIs('(')) {
        const open = this.operators.pop();
        const begin = open.pos;
        const end = this.input.length - 1;
        const range = [begin, end];
        open.range = range;

        this.rpn.push(open);
        this.addWarning('!)', begin);
        this.describe(begin, { range });
      }
    } while (this.operators.length > 0);
  }

  // Log the token queue
  logTokens() {
    logHeading('Tokens');
    this.rpn.forEach(inspect);
  }

  //----------------------------------------------------------------------------
  // Descriptions

  pushDescription(label, type, config = {}) {
    this.descriptions.push({ label, type, ...config });
  }

  describe(pos, info) {
    const description = this.descriptions[pos];
    for (const key in info) description[key] = info[key];
  }

  logDescriptions() {
    logHeading('Descriptions');
    this.descriptions.forEach(inspect);
  }

  //----------------------------------------------------------------------------
  // Bracket expressions

  eatToken(type) {
    this.pushDescription(this.ch(), type);
    this.pos++;
  }

  tryEatToken(type) {
    if (this.ch() === type) {
      this.pushDescription(type, type);
      this.pos++;
      return true;
    }
    return false;
  }

  readBracketChar(matches) {
    this.pushDescription(this.ch(), 'bracketChar');
    matches.add(this.ch());
    this.pos++;
  }

  tryReadBracketChar(label, matches) {
    if (this.ch() === label) {
      this.pushDescription(label, 'bracketChar');
      matches.add(label);
      this.pos++;
      return true;
    }
    return false;
  }

  tryReadBracketRange(matches) {
    if (this.remaining() < 3 || this.ch(1) !== '-' || this.ch(2) === ']') {
      return false;
    }

    const rangeLow = this.code(0);
    const rangeHigh = this.code(2);
    for (let i = rangeLow; i <= rangeHigh; i++) {
      matches.add(String.fromCharCode(i));
    }

    this.eatToken('bracketRangeLow');
    this.eatToken('-');
    this.eatToken('bracketRangeHigh');

    return true;
  }

  readBracketExpression() {
    const begin = this.pos;
    const set = new Set();

    this.eatToken('[');
    const negate = this.tryEatToken('^');

    // Special characters are treated as literals at the beginning
    this.tryReadBracketChar(']', set) || this.tryReadBracketChar('-', set);

    // Try char range, otherwise read char literal
    while (this.remaining() && this.ch() !== ']') {
      this.tryReadBracketRange(set) || this.readBracketChar(set);
    }

    // Finalize
    const end = this.pos;
    const range = [begin, end];
    const matches = [...set].join('');
    const info = { range, negate, matches };
    this.describe(begin, info);

    // Edge case: missing closing bracket
    if (this.ch() === ']') {
      this.eatToken(']');
      this.describe(end, info);
    } else {
      this.addWarning('!]', begin);
    }

    const label = this.input.slice(begin, end + 1);
    return getBracketClass(label, info);
  }

  //----------------------------------------------------------------------------
  // Compile NFA

  compileGraph() {
    this.rpn.forEach((token) => {
      token.compile(this.fragments, token);
    });

    this.firstState = new State('>', 'first');
    this.lastState = new State('#', 'last');
    this.firstState.connectTo(this.fragments[0]).connectTo(this.lastState);
  }

  logGraph() {
    logHeading('Graph');
    this.firstState.logAll();
  }

  //----------------------------------------------------------------------------
  // Apply fixes

  addWarning(type, pos, config) {
    const warning = { pos, ...config, ...warnings[type] };
    this.warnings.push(warning);
  }

  fix() {
    const warnings = [...this.warnings];

    return warnings
      .sort((w1, w2) => w1.precedence - w2.precedence || w2.pos - w1.pos)
      .reduce((str, warning) => warning.fix(str, warning.pos), this.input);
  }
}

//------------------------------------------------------------------------------

export default Parser;

// parser.compileGraph();

// const parser = new Parser('(a)');
// parser.generateRPN();
// parser.log();

// const token = parser.rpn[0];
// console.log(toString(token));
