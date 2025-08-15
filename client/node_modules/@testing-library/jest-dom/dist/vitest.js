'use strict';

var vitest = require('vitest');
var matchers = require('./matchers-d2db7425.js');
require('redent');
require('@adobe/css-tools');
require('dom-accessibility-api');
require('aria-query');
require('picocolors');
require('css.escape');

/* istanbul ignore file */


vitest.expect.extend(matchers.extensions);
