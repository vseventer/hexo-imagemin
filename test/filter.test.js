/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Mark van Seventer
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
**/

// Strict mode.
'use strict';

// Standard lib.
var fs   = require('fs'),
    path = require('path');

// Package modules.
var assign = require('object-assign');

// Local modules.
var subject = require('../lib/filter.js');

// Configure.
var fixture = path.join(__dirname, 'fixture.png'),
    size    = fs.statSync(fixture).size;

// Stub hexo.route.
var hexoRoute = {
  buffer: null,
  get: function(name) {
    return fs.createReadStream(name);
  },
  list: function() {
    return [ fixture ];
  },
  set: function(name, buffer) {
    this.buffer = buffer; // Save.
  }
};

// Test suite.
describe('hexo-imagemin', function() {
  // Reset the buffer.
  beforeEach('hexoRoute', function() {
    hexoRoute.buffer = null;
  });

  // Tests.
  it('should minify an image.', function() {
    // Configure.
    var hexo = {
      config: {
        imagemin: { }
      },
      route: hexoRoute
    };

    // Filter and test.
    var promise = subject.call(hexo);
    return promise.then(function() {
      console.assert(null !== hexoRoute.buffer);
      console.assert(size > hexoRoute.buffer.length);
    });
  });

  it('should do nothing if disabled.', function() {
    // Configure.
    var hexo = {
      config: {
        imagemin: { enable: false }
      },
      route: hexoRoute
    };

    // Filter and test.
    subject.call(hexo);
    console.assert(null === hexoRoute.buffer);
  });
});