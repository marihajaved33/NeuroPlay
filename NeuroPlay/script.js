/*
 * NeuroPlay
 * A single perceptron with two inputs:
 *   z = (X1 * W1) + (X2 * W2) + bias
 *   output = activation(z)
 *
 * Step:    1 when z >= 0, otherwise 0
 * Sigmoid: 1 / (1 + e^(-z))
 * ReLU:    max(0, z)
 */

(function () {
  "use strict";

  var DEFAULTS = {
    x1: 1,
    x2: 2,
    w1: 0.5,
    w2: 1,
    bias: -1,
    activation: "step"
  };

  var ACTIVATIONS = {
    step: {
      label: "Step Function",
      short: "Step",
      hint: "If z ≥ 0, output = 1. Otherwise output = 0."
    },
    sigmoid: {
      label: "Sigmoid Function",
      short: "Sigmoid",
      hint: "Output = 1 / (1 + e^(−z)). The result sits between 0 and 1."
    },
    relu: {
      label: "ReLU Function",
      short: "ReLU",
      hint: "Output = max(0, z). Positive sums pass through. Other sums become 0."
    }
  };

  var PRESETS = {
    and: {
      x1: 1,
      x2: 1,
      w1: 1,
      w2: 1,
      bias: -1.5,
      activation: "step",
      title: "AND Gate",
      rows: [
        [0, 0, 0],
        [0, 1, 0],
        [1, 0, 0],
        [1, 1, 1]
      ]
    },
    or: {
      x1: 1,
      x2: 1,
      w1: 1,
      w2: 1,
      bias: -0.5,
      activation: "step",
      title: "OR Gate",
      rows: [
        [0, 0, 0],
        [0, 1, 1],
        [1, 0, 1],
        [1, 1, 1]
      ]
    },
    custom: {
      x1: DEFAULTS.x1,
      x2: DEFAULTS.x2,
      w1: DEFAULTS.w1,
      w2: DEFAULTS.w2,
      bias: DEFAULTS.bias,
      activation: DEFAULTS.activation,
      title: "Custom Experiment",
      rows: null
    }
  };

  var shadeCanvas = null;
  var latest = null;

  function $(id) {
    return document.getElementById(id);
  }

  function snap(value) {
    return Math.round(Number(value) * 10) / 10;
  }

  /* Decimal display that keeps the tested sigmoid digits (0.8176, 0.2689, 0.8808, 0.5). */
  function fmt(value) {
    if (!isFinite(value)) {
      return "—";
    }
    var rounded = Math.round(value * 10000) / 10000;
    if (rounded === 0) {
      return "0";
    }
    return String(rounded);
  }

  function term(value) {
    var text = fmt(value);
    return value < 0 ? "(" + text + ")" : text;
  }

  function readState() {
    return {
      x1: snap($("x1").value),
      x2: snap($("x2").value),
      w1: snap($("w1").value),
      w2: snap($("w2").value),
      bias: snap($("bias").value),
      activation: $("activation").value
    };
  }

  /*
   * Slider values are multiples of 0.1. Multiplying the tenths as integers
   * keeps z aligned with the decimal arithmetic students do on paper.
   */
  function modelFrom(state) {
    var p1 = (Math.round(state.x1 * 10) * Math.round(state.w1 * 10)) / 100;
    var p2 = (Math.round(state.x2 * 10) * Math.round(state.w2 * 10)) / 100;
    var bias = Math.round(state.bias * 10) / 10;
    var z = Math.round((p1 + p2 + bias) * 100) / 100;
    return {
      p1: p1,
      p2: p2,
      z: z,
      y: activate(state.activation, z)
    };
  }

  function activate(name, z) {
    if (name === "step") {
      return z >= 0 ? 1 : 0;
    }
    if (name === "sigmoid") {
      return 1 / (1 + Math.exp(-z));
    }
    if (name === "relu") {
      return Math.max(0, z);
    }
    return NaN;
  }

  function toneFor(activation, output) {
    if (activation === "step") {
      return output === 1 ? "positive" : "negative";
    }
    if (activation === "relu") {
      return output > 0 ? "positive" : "negative";
    }
    if (output >= 0.5) {
      return "positive";
    }
    if (output >= 0.2) {
      return "mid";
    }
    return "negative";
  }

  function outputExpression(state, model) {
    if (state.activation === "step") {
      return "Step(z) = " + fmt(model.y);
    }
    if (state.activation === "sigmoid") {
      return "Sigmoid(z) = " + fmt(model.y);
    }
    return "ReLU(z) = " + fmt(model.y);
  }

  function setText(id, text) {
    $(id).textContent = text;
  }

  function renderControls(state) {
    setText("x1-value", fmt(state.x1));
    setText("x2-value", fmt(state.x2));
    setText("w1-value", fmt(state.w1));
    setText("w2-value", fmt(state.w2));
    setText("bias-value", fmt(state.bias));
    setText("activation-hint", ACTIVATIONS[state.activation].hint);
  }

  function renderMetrics(state, model) {
    setText("metric-x1", fmt(state.x1));
    setText("metric-x2", fmt(state.x2));
    setText("metric-w1", fmt(state.w1));
    setText("metric-w2", fmt(state.w2));
    setText("metric-bias", fmt(state.bias));
    setText("metric-z", fmt(model.z));
    setText("metric-activation", ACTIVATIONS[state.activation].label);
    setText("metric-output", fmt(model.y));
    setText(
      "live-formula",
      "z = (" + fmt(state.x1) + " × " + fmt(state.w1) + ") + (" +
        fmt(state.x2) + " × " + fmt(state.w2) + ") + " + term(state.bias) +
        " = " + fmt(model.z)
    );
    setText("live-output-line", outputExpression(state, model));

    var card = $("metric-output-card");
    card.classList.remove("positive", "negative", "mid");
    card.classList.add(toneFor(state.activation, model.y));
  }

  function activationDetail(state, model) {
    var z = model.z;
    var y = model.y;
    if (state.activation === "step") {
      if (z > 0) {
        return {
          title: "Step Function:",
          detail: "Since z >= 0, output = 1.",
          plain: "The step function makes a yes or no decision. z is positive, so the perceptron outputs 1 (class 1)."
        };
      }
      if (z === 0) {
        return {
          title: "Step Function:",
          detail: "Since z >= 0, output = 1.",
          plain: "z is exactly 0. This playground treats z >= 0 as class 1, so the output is 1."
        };
      }
      return {
        title: "Step Function:",
        detail: "Since z < 0, output = 0.",
        plain: "The step function makes a yes or no decision. z is negative, so the perceptron outputs 0 (class 0)."
      };
    }
    if (state.activation === "sigmoid") {
      return {
        title: "Sigmoid Function:",
        detail: "output = 1 / (1 + e^(-z)) = " + fmt(y) + ", with z = " + fmt(z) + ".",
        plain: "Sigmoid squashes the weighted sum into a score between 0 and 1. It changes smoothly, so values near the boundary stay close to 0.5 instead of jumping from 0 to 1."
      };
    }
    if (z > 0) {
      return {
        title: "ReLU Function:",
        detail: "output = max(0, z) = max(0, " + fmt(z) + ") = " + fmt(y) + ".",
        plain: "ReLU keeps a positive weighted sum as it is. Because z is greater than 0, the output equals z."
      };
    }
    return {
      title: "ReLU Function:",
      detail: "output = max(0, z) = max(0, " + fmt(z) + ") = 0.",
      plain: "ReLU turns every weighted sum that is zero or negative into 0, and leaves positive sums unchanged."
    };
  }

  function renderExplanation(state, model) {
    setText("explain-p1", "X1 × W1 = " + fmt(state.x1) + " × " + fmt(state.w1) + " = " + fmt(model.p1));
    setText("explain-p2", "X2 × W2 = " + fmt(state.x2) + " × " + fmt(state.w2) + " = " + fmt(model.p2));
    setText(
      "explain-sum-line",
      "z = " + term(model.p1) + " + " + term(model.p2) + " + " + term(state.bias)
    );
    setText("explain-z", "z = " + fmt(model.z));
    var story = activationDetail(state, model);
    setText("explain-act-title", story.title);
    setText("explain-act-detail", story.detail);
    setText("explain-plain", story.plain);
  }

  function styleEdge(id, weight) {
    var edge = $(id);
    var size = Math.abs(weight);
    if (size === 0) {
      edge.style.stroke = "#64748b";
      edge.style.strokeWidth = "1.75";
      edge.style.strokeDasharray = "5 5";
      return;
    }
    edge.style.stroke = weight < 0 ? "#c084fc" : "#22d3ee";
    edge.style.strokeWidth = String(2 + Math.min(5, size));
    edge.style.strokeDasharray = "none";
  }

  function renderDiagram(state, model) {
    setText("viz-x1", fmt(state.x1));
    setText("viz-x2", fmt(state.x2));
    setText("viz-w1", "W1 = " + fmt(state.w1));
    setText("viz-w2", "W2 = " + fmt(state.w2));
    setText("viz-bias", "bias = " + fmt(state.bias));
    setText("viz-z", "z = " + fmt(model.z));
    setText("viz-act", ACTIVATIONS[state.activation].short);
    setText("viz-output", fmt(model.y));
    styleEdge("edge-w1", state.w1);
    styleEdge("edge-w2", state.w2);
    styleEdge("edge-bias", state.bias);

    var node = $("viz-output-node");
    node.classList.remove("positive", "negative", "mid", "low");
    var tone = toneFor(state.activation, model.y);
    node.classList.add(tone === "negative" ? "low" : tone);
  }

  function nearlyZero(value) {
    return Math.abs(value) < 1e-8;
  }

  /* Line segment where W1*X1 + W2*X2 + bias = 0 inside the square [-5, 5]. */
  function boundarySegment(w1, w2, bias) {
    var min = -5;
    var max = 5;
    if (nearlyZero(w1) && nearlyZero(w2)) {
      return null;
    }
    var points = [];

    function add(x, y) {
      if (x < min - 1e-6 || x > max + 1e-6 || y < min - 1e-6 || y > max + 1e-6) {
        return;
      }
      var cx = Math.min(max, Math.max(min, x));
      var cy = Math.min(max, Math.max(min, y));
      for (var i = 0; i < points.length; i++) {
        var dx = points[i][0] - cx;
        var dy = points[i][1] - cy;
        if (dx * dx + dy * dy < 1e-8) {
          return;
        }
      }
      points.push([cx, cy]);
    }

    if (!nearlyZero(w2)) {
      add(min, (-bias - w1 * min) / w2);
      add(max, (-bias - w1 * max) / w2);
    }
    if (!nearlyZero(w1)) {
      add((-bias - w2 * min) / w1, min);
      add((-bias - w2 * max) / w1, max);
    }
    if (points.length < 2) {
      return null;
    }

    var best = 0;
    var pair = [points[0], points[1]];
    for (var a = 0; a < points.length; a++) {
      for (var b = a + 1; b < points.length; b++) {
        var ex = points[a][0] - points[b][0];
        var ey = points[a][1] - points[b][1];
        var dist = ex * ex + ey * ey;
        if (dist > best) {
          best = dist;
          pair = [points[a], points[b]];
        }
      }
    }
    return best < 1e-8 ? null : pair;
  }

  function windowSignNote(state) {
    var corners = [
      [-5, -5],
      [-5, 5],
      [5, -5],
      [5, 5]
    ];
    var nonNegative = 0;
    for (var i = 0; i < corners.length; i++) {
      var z = state.w1 * corners[i][0] + state.w2 * corners[i][1] + state.bias;
      if (z >= 0) {
        nonNegative += 1;
      }
    }
    if (nonNegative === 4) {
      return " Inside this window, from -5 to 5, z stays greater than or equal to 0.";
    }
    if (nonNegative === 0) {
      return " Inside this window, from -5 to 5, z stays negative.";
    }
    return "";
  }

  function renderBoundaryCopy(state, model, segment) {
    var card = $("boundary-card");
    card.dataset.mode = state.activation;
    var weightsDead = nearlyZero(state.w1) && nearlyZero(state.w2);
    var equation;
    var note;

    if (weightsDead) {
      equation = "z = " + fmt(state.bias) + " at every point, because both weights are 0.";
      note = "Both weights are zero, so X1 and X2 do not change the sum. There is no decision line. z equals the bias everywhere.";
      if (state.activation === "step") {
        note += state.bias >= 0
          ? " The step function therefore outputs 1 for every point."
          : " The step function therefore outputs 0 for every point.";
      }
    } else {
      equation = fmt(state.w1) + "·X1 + " + fmt(state.w2) + "·X2 + " + term(state.bias) + " = 0";
      if (!segment) {
        note = "The line where z = 0 does not cross the visible window." + windowSignNote(state);
      } else if (state.activation === "step") {
        note = "The step function classifies each point by the side of the line it falls on. Cyan is output 1 (z ≥ 0). Purple is output 0 (z < 0). The white line is every visible point where the weighted sum equals zero.";
      } else {
        note = "For the sigmoid and ReLU functions, the white line is where the weighted sum z equals 0. It is the zero-level boundary of z, not a hard split into classes 0 and 1. Sigmoid changes smoothly across the line. ReLU outputs 0 on the negative side of z and passes positive z through.";
      }
    }

    setText("boundary-equation", equation);
    setText("boundary-note", note);
    setText(
      "boundary-summary",
      "Horizontal axis X1, vertical axis X2, both from -5 to 5. Current point is (" +
        fmt(state.x1) + ", " + fmt(state.x2) + "). Weighted sum is " + fmt(model.z) +
        " and the " + ACTIVATIONS[state.activation].label + " output is " + fmt(model.y) + "."
    );
  }

  function drawBoundary(state) {
    var canvas = $("boundary-canvas");
    var width = canvas.clientWidth;
    if (width < 40) {
      return;
    }
    var height = Math.round(Math.min(440, Math.max(300, width * 0.7)));
    if (canvas.style.height !== height + "px") {
      canvas.style.height = height + "px";
    }
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var bitmapW = Math.round(width * dpr);
    var bitmapH = Math.round(height * dpr);
    if (canvas.width !== bitmapW || canvas.height !== bitmapH) {
      canvas.width = bitmapW;
      canvas.height = bitmapH;
    }
    var ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    var min = -5;
    var max = 5;
    var plot = {
      x: 48,
      y: 14,
      w: width - 62,
      h: height - 50
    };
    var span = max - min;
    function toX(v) {
      return plot.x + ((v - min) / span) * plot.w;
    }
    function toY(v) {
      return plot.y + ((max - v) / span) * plot.h;
    }

    if (state.activation === "step") {
      paintRegions(ctx, plot, state.w1, state.w2, state.bias);
    } else {
      ctx.fillStyle = "#10182b";
      ctx.fillRect(plot.x, plot.y, plot.w, plot.h);
    }

    ctx.save();
    ctx.beginPath();
    ctx.rect(plot.x, plot.y, plot.w, plot.h);
    ctx.clip();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(226, 232, 240, 0.16)";
    ctx.fillStyle = "#d5def0";
    ctx.font = "12px Segoe UI, sans-serif";
    for (var tick = -5; tick <= 5; tick++) {
      ctx.beginPath();
      ctx.moveTo(toX(tick), plot.y);
      ctx.lineTo(toX(tick), plot.y + plot.h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(plot.x, toY(tick));
      ctx.lineTo(plot.x + plot.w, toY(tick));
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(248, 250, 252, 0.85)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(toX(0), plot.y);
    ctx.lineTo(toX(0), plot.y + plot.h);
    ctx.moveTo(plot.x, toY(0));
    ctx.lineTo(plot.x + plot.w, toY(0));
    ctx.stroke();

    var segment = boundarySegment(state.w1, state.w2, state.bias);
    if (segment) {
      ctx.beginPath();
      ctx.moveTo(toX(segment[0][0]), toY(segment[0][1]));
      ctx.lineTo(toX(segment[1][0]), toY(segment[1][1]));
      ctx.strokeStyle = "#f8fbff";
      ctx.lineWidth = 2.75;
      ctx.shadowColor = "rgba(34, 211, 238, 0.85)";
      ctx.shadowBlur = 8;
      ctx.stroke();
    }
    ctx.restore();

    ctx.strokeStyle = "rgba(226, 232, 240, 0.45)";
    ctx.lineWidth = 1;
    ctx.shadowBlur = 0;
    ctx.strokeRect(plot.x, plot.y, plot.w, plot.h);

    var labelStep = plot.w < 420 ? 2 : 1;
    ctx.fillStyle = "#d5def0";
    ctx.font = "12px Segoe UI, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (var xTick = -5; xTick <= 5; xTick += labelStep) {
      ctx.fillText(String(xTick), toX(xTick), plot.y + plot.h + 6);
    }
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (var yTick = -5; yTick <= 5; yTick += labelStep) {
      ctx.fillText(String(yTick), plot.x - 8, toY(yTick));
    }
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#9fb4d8";
    ctx.fillText("X2", plot.x + 8, plot.y + 16);
    ctx.textAlign = "right";
    ctx.fillText("X1", plot.x + plot.w - 8, plot.y + plot.h - 8);

    var px = toX(state.x1);
    var py = toY(state.x2);
    ctx.beginPath();
    ctx.fillStyle = "#fb7185";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.arc(px, py, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    var tag = "(" + fmt(state.x1) + ", " + fmt(state.x2) + ")";
    ctx.font = "700 12px Segoe UI, sans-serif";
    var tagWidth = ctx.measureText(tag).width + 12;
    var tagX = state.x1 > 3 ? px - tagWidth - 10 : px + 10;
    var tagY = state.x2 > 3.4 ? py + 12 : py - 28;
    tagX = Math.max(plot.x + 4, Math.min(tagX, plot.x + plot.w - tagWidth - 4));
    tagY = Math.max(plot.y + 4, Math.min(tagY, plot.y + plot.h - 24));
    ctx.fillStyle = "rgba(7, 13, 26, 0.9)";
    ctx.strokeStyle = "rgba(255,255,255,0.75)";
    ctx.lineWidth = 1;
    roundRect(ctx, tagX, tagY, tagWidth, 20, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(tag, tagX + 6, tagY + 10);

    return segment;
  }

  function paintRegions(ctx, plot, w1, w2, bias) {
    var cols = Math.max(90, Math.min(260, Math.floor(plot.w)));
    var rows = Math.max(90, Math.min(200, Math.floor(plot.h)));
    if (!shadeCanvas) {
      shadeCanvas = document.createElement("canvas");
    }
    if (shadeCanvas.width !== cols) {
      shadeCanvas.width = cols;
    }
    if (shadeCanvas.height !== rows) {
      shadeCanvas.height = rows;
    }
    var off = shadeCanvas.getContext("2d");
    var image = off.createImageData(cols, rows);
    var data = image.data;
    var min = -5;
    var span = 10;
    for (var row = 0; row < rows; row++) {
      var x2 = 5 - ((row + 0.5) / rows) * span;
      for (var col = 0; col < cols; col++) {
        var x1 = min + ((col + 0.5) / cols) * span;
        var z = w1 * x1 + w2 * x2 + bias;
        var index = (row * cols + col) * 4;
        if (z >= 0) {
          data[index] = 16;
          data[index + 1] = 104;
          data[index + 2] = 122;
        } else {
          data[index] = 62;
          data[index + 1] = 44;
          data[index + 2] = 112;
        }
        data[index + 3] = 255;
      }
    }
    off.putImageData(image, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(shadeCanvas, plot.x, plot.y, plot.w, plot.h);
  }

  function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(x, y, width, height, radius);
      return;
    }
    ctx.rect(x, y, width, height);
  }

  function sameWeights(name, state) {
    var preset = PRESETS[name];
    return snap(preset.w1) === state.w1 &&
      snap(preset.w2) === state.w2 &&
      snap(preset.bias) === state.bias;
  }

  function exactPreset(state) {
    var names = ["and", "or", "custom"];
    for (var i = 0; i < names.length; i++) {
      if (sameWeights(names[i], state) && PRESETS[names[i]].activation === state.activation) {
        return names[i];
      }
    }
    return "";
  }

  function renderPresets(state) {
    var active = exactPreset(state);
    ["and", "or", "custom"].forEach(function (name) {
      var button = $("preset-" + name);
      var on = name === active;
      button.classList.toggle("is-active", on);
      button.setAttribute("aria-pressed", on ? "true" : "false");
    });

    var gateName = sameWeights("and", state) ? "and" : sameWeights("or", state) ? "or" : "";
    var panel = $("truth-panel");
    if (!gateName) {
      panel.hidden = true;
      return;
    }
    var preset = PRESETS[gateName];
    panel.hidden = false;
    setText("truth-caption", preset.title + " truth table");
    var body = $("truth-body");
    body.textContent = "";
    preset.rows.forEach(function (row) {
      var y = modelFrom({
        x1: row[0],
        x2: row[1],
        w1: state.w1,
        w2: state.w2,
        bias: state.bias,
        activation: state.activation
      }).y;
      var tr = document.createElement("tr");
      if (state.x1 === row[0] && state.x2 === row[1]) {
        tr.className = "is-current";
      }
      [row[0], row[1], row[2], fmt(y)].forEach(function (value) {
        var cell = document.createElement("td");
        cell.textContent = String(value);
        tr.appendChild(cell);
      });
      var action = document.createElement("td");
      var tryButton = document.createElement("button");
      tryButton.type = "button";
      tryButton.className = "table-btn";
      tryButton.textContent = "Try";
      tryButton.addEventListener("click", function () {
        setSlider("x1", row[0]);
        setSlider("x2", row[1]);
        render();
      });
      action.appendChild(tryButton);
      tr.appendChild(action);
      body.appendChild(tr);
    });
  }

  function render() {
    var state = readState();
    var model = modelFrom(state);
    latest = state;
    renderControls(state);
    renderMetrics(state, model);
    renderExplanation(state, model);
    renderDiagram(state, model);
    var segment = drawBoundary(state);
    renderBoundaryCopy(state, model, segment);
    renderPresets(state);
  }

  function setSlider(id, value) {
    $(id).value = String(value);
  }

  function applyPreset(name) {
    var preset = PRESETS[name];
    setSlider("x1", preset.x1);
    setSlider("x2", preset.x2);
    setSlider("w1", preset.w1);
    setSlider("w2", preset.w2);
    setSlider("bias", preset.bias);
    $("activation").value = preset.activation;
    render();
  }

  function runSelfChecks() {
    var cases = [
      { x1: 1, x2: 2, w1: 0.5, w2: 1, bias: -1, z: "1.5", step: "1", sigmoid: "0.8176", relu: "1.5" },
      { x1: 1, x2: 1, w1: 1, w2: 1, bias: -3, z: "-1", step: "0", sigmoid: "0.2689", relu: "0" },
      { x1: 2, x2: 2, w1: 1, w2: 1, bias: -2, z: "2", step: "1", sigmoid: "0.8808", relu: "2" },
      { x1: 0, x2: 0, w1: 1, w2: 1, bias: 0, z: "0", step: "1", sigmoid: "0.5", relu: "0" }
    ];
    cases.forEach(function (item, index) {
      var state = {
        x1: item.x1,
        x2: item.x2,
        w1: item.w1,
        w2: item.w2,
        bias: item.bias,
        activation: "step"
      };
      var built = modelFrom(state);
      var checks = {
        z: fmt(built.z) === item.z,
        step: fmt(activate("step", built.z)) === item.step,
        sigmoid: fmt(activate("sigmoid", built.z)) === item.sigmoid,
        relu: fmt(activate("relu", built.z)) === item.relu
      };
      if (!checks.z || !checks.step || !checks.sigmoid || !checks.relu) {
        console.error("NeuroPlay self-check failed on case " + (index + 1), checks, built);
      }
    });
  }

  function init() {
    ["x1", "x2", "w1", "w2", "bias"].forEach(function (id) {
      $(id).addEventListener("input", render);
    });
    $("activation").addEventListener("change", render);
    $("reset-btn").addEventListener("click", function () {
      applyPreset("custom");
    });
    ["and", "or", "custom"].forEach(function (name) {
      $("preset-" + name).addEventListener("click", function () {
        applyPreset(name);
      });
    });

    var navToggle = $("nav-toggle");
    var navLinks = $("nav-links");
    navToggle.addEventListener("click", function () {
      var open = navLinks.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      navToggle.querySelector(".sr-only").textContent = open ? "Close menu" : "Open menu";
    });
    navLinks.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        navLinks.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });

    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) {
          return;
        }
        navLinks.querySelectorAll("a").forEach(function (link) {
          link.classList.toggle("is-current", link.getAttribute("href") === "#" + entry.target.id);
        });
      });
    }, { rootMargin: "-45% 0px -45% 0px" });
    ["home", "playground", "learn", "about"].forEach(function (id) {
      sectionObserver.observe($(id));
    });

    var plot = $("boundary-canvas").parentElement;
    if (window.ResizeObserver) {
      var observer = new ResizeObserver(function () {
        if (latest) {
          var segment = drawBoundary(latest);
          renderBoundaryCopy(latest, modelFrom(latest), segment);
        }
      });
      observer.observe(plot);
    } else {
      window.addEventListener("resize", function () {
        if (latest) {
          drawBoundary(latest);
        }
      });
    }

    runSelfChecks();
    render();
  }

  init();
})();
