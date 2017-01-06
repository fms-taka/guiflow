'use strict';

var fs = require("fs");
var uiflow = require("uiflow");
var flumine = require("flumine");
var through2 = require("through2");

var api = module.exports = {};

api.update = function (inputFileName, code, format) {
  var f = flumine(function (d, ok, ng) {

    var buff = [];
    var output = through2(function (chunk, enc, cb) {
      var svg = chunk;
      buff.push(svg);
      cb();

    });
    var stream = uiflow.buildWithCode(
      inputFileName, code, format, function (error) {
        ng(error);
      });
    stream.pipe(output);
    stream.on("end", function () {
      var buffAll = Buffer.concat(buff);
      ok(buffAll);
      output.end();
    });


  });
  return f();
};

var stringify = function (buff) {
  var str = String(buff);
  return str;
};

var base64nize = function (buff) {
  return buff.toString("base64");
};
api.compile = function (code) {
  return flumine.set({
    svg: flumine.to(function (d) {
      return api.update("<anon>", code, "svg");
    }).to(stringify),
    meta: flumine.to(function (d) {
      return api.update("<anon>", code, "meta");
    }).to(stringify)
  })();
};

api.base64png = function (code) {
  return flumine.to(function () {
    return api.update("<anon>", code, "png");
  }).to(base64nize)();
};
