const $ = require("./jquery-2.1.4.min");
const EventEmitter = require("events");
const sprintf = require("sprintf");
const emitter = new EventEmitter();
let CURRENT_DOC;
const svgElement = function () {
  return $("svg");
};
const getViewBox = function (svg) {
  return svg[0].getAttribute("viewBox").split(/\s/g).map(parseFloat);
};

let VIEW_BOX_VALUES;
let SCALE = 1.0;
let DEFAULT_VIEW_BOX = "";
const setViewBox = function (svg, values) {
  let text = values.join(" ");
  svg[0].setAttribute("viewBox", text);
  $("#viewBox").text(sprintf("%4.2f,%4.2f,%4.2f,%4.2f", values[0], values[1], values[2], values[3]));
  VIEW_BOX_VALUES = values;
};

$(function () {
  $("#plus").on("click", function () {
    const svg = svgElement();
    const viewBoxValues = getViewBox(svg);
    viewBoxValues[2] /= 1.2;
    viewBoxValues[3] /= 1.2;
    setViewBox(svg, viewBoxValues);
  });

  $("#flat").on("click", function () {
    const svg = svgElement();
    setViewBox(svg, DEFAULT_VIEW_BOX);
  });

  $("#minus").on("click", function () {
    const svg = svgElement();
    const viewBoxValues = getViewBox(svg);
    viewBoxValues[2] *= 1.2;
    viewBoxValues[3] *= 1.2;
    setViewBox(svg, viewBoxValues);
  });
});

const refresh = function (data) {
  const meta = data.meta;
  const doc = data.svg;
  CURRENT_DOC = doc;
  $("#diagram-1").html(doc);
  const svg = svgElement();
  svg[0].setAttribute("viewBox", [-14, -30, svg.width() * 0.8, svg.height() * 0.8].join(" "));

  const metaData = JSON.parse(meta);
  DEFAULT_VIEW_BOX = getViewBox(svg);
  if (VIEW_BOX_VALUES)
    setViewBox(svg, VIEW_BOX_VALUES);
  let startX, startY;
  let initialViewBox;
  let onDrag = false;

  svg.find("g.node polygon").attr("fill", "white");
  svg.find("g.node ellipse").attr("fill", "white");
  svg.find("g.node").on("mouseover", function (e) {
    $(this).find("polygon").attr("stroke", "green");
    $(this).find("polygon").attr("stroke-width", "4");
    $(this).find("ellipse").attr("stroke", "red");
    $(this).find("ellipse").attr("stroke-width", "4");
  });
  svg.find("g.node").on("click", function (e) {
    const text = $(this).find("title").text().trim();
    if ($(this).find("ellipse").length === 0) {
      const lines = metaData[text].lines;
      emitter.emit("page-click", lines);
    } else {
      const insertText = ["\n[", text, "]\n"].join("");
      emitter.emit("end-click", insertText);
    }
  });
  svg.find("g.node").on("mouseout", function (e) {
    $(this).find("polygon").attr("stroke", "black");
    $(this).find("polygon").attr("stroke-width", "1");
    $(this).find("ellipse").attr("stroke", "black");
    $(this).find("ellipse").attr("stroke-width", "1");
  });
  svg.on("mousedown", function (evt) {
    startX = evt.clientX;
    startY = evt.clientY;
    initialViewBox = getViewBox(svg);
    onDrag = true;
    evt.preventDefault();
    return false;
  });
  svg.on("mousemove", function (evt) {
    if (onDrag) {
      movingX = evt.clientX;
      movingY = evt.clientY;
      var diffX = movingX - startX;
      var diffY = movingY - startY;
      var viewBoxValues = getViewBox(svg);
      viewBoxValues[0] = initialViewBox[0] - diffX * SCALE;
      viewBoxValues[1] = initialViewBox[1] - diffY * SCALE;
      setViewBox(svg, viewBoxValues);
    }
    evt.preventDefault();
    return false;
  });
  svg.on("mouseup mouseout", function (evt) {
    onDrag = false;
    evt.preventDefault();
    return false;
  });
};

module.exports = {
  refresh: refresh,
  on: function (channel, cb) {
    emitter.on(channel, cb);
  }
};
