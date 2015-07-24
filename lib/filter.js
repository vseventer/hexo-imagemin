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

// Package modules.
var debug     = require('debug')('hexo:imagemin'),
    Imagemin  = require('imagemin'),
    minimatch = require('minimatch'),
    mozjpeg   = require('imagemin-mozjpeg'),
    pngquant  = require('imagemin-pngquant'),
    Promise   = require('bluebird'),
    streamToArray = require('stream-to-array');

// Configure.
var streamToArrayAsync = Promise.promisify(streamToArray);

// Exports.
module.exports = function() {
  // Init.
  var hexo   = this,
      config = hexo.config.imagemin,
      route  = hexo.route;

  // Return if disabled.
  if(false === config.enable) {
    debug('filter disabled');
    return;
  }

  // Filter routes to select all images.
  var routes = route.list().filter(function(path) {
    return minimatch(path, '**/*.{gif,jpg,png,svg}', { nocase: true });
  });

  // Retrieve image contents, and minify it.
  return Promise.map(routes, function(path) {
    debug('minifying %s', path); // Debug.

    // Retrieve and concatenate buffers.
    var stream = route.get(path);
    return streamToArrayAsync(stream).then(function(arr) {
      return Buffer.concat(arr);
    }).then(function(buffer) {
      // Create the Imagemin instance.
      var imagemin = new Imagemin()
        .src(buffer)
        .use(Imagemin.gifsicle({ interlaced: config.interlaced }))
        .use(Imagemin.jpegtran({ progressive: config.progressive })) // Strip exif.
        .use(mozjpeg({ progressive: config.progressive }))
        .use(Imagemin.optipng({ optimizationLevel: config.optimizationLevel }))
        .use(Imagemin.svgo({ multipass: config.multipass }));

      // Add additional plugins.
      if(config.pngquant) { // Lossy compression.
        imagemin.use(pngquant());
      }

      // Run.
      return Promise.fromNode(function(callback) {
        imagemin.run(callback);
      }).then(function(files) {
        // Update the route with the new contents.
        var file   = files.shift(),
            length = buffer.length;
        if(file && length > file.contents.length) {
          debug('updating %s, saved %d bytes', path, length - file.contents.length); // Debug.
          route.set(path, file.contents); // Update the route.
        }
      });
    });
  });
};