'use strict';

const fs = require("fs");
const uiflow = require("uiflow");
const flumine = require("flumine");
const through2 = require("through2");

var api = module.exports = {};

api.update = (inputFileName, code, format) => {
  const f = flumine((d, ok, ng) => {
    const buff = [];
    const output = through2((chunk, enc, cb) => {
      buff.push(chunk);
      cb();
    });
    const stream = uiflow.buildWithCode(inputFileName, code, format, (error) => ng(error));
    stream.pipe(output);
    stream.on("end", () => {
      ok(Buffer.concat(buff));
      output.end();
    });
  });
  return f();
};

const stringify = (buff) => String(buff);

const base64nize = (buff) => buff.toString("base64");

api.compile = (code) =>
  flumine.set({
    svg: flumine.to((d) => api.update("<anon>", code, "svg")).to(stringify),
    meta: flumine.to((d) => api.update("<anon>", code, "meta")).to(stringify)
  })();

api.base64png = (code) =>
  flumine.to(() => api.update("<anon>", code, "png")).to(base64nize)();

