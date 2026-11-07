# NeuroPlay – Interactive Perceptron Playground

NeuroPlay is a browser-based lesson for university students and beginners who want to see how a single artificial neuron makes a prediction. Move the inputs, weights, and bias, choose an activation function, and watch the weighted sum, the neuron diagram, and the zero-level line update together.

The page is an educational simulation. It does not train weights, store data, or call an external service.

## Objectives

- Show the perceptron calculation one step at a time.
- Make the role of weights, bias, and activation functions visible.
- Connect the algebra `z = 0` to a straight line on an X1–X2 graph.
- Demonstrate that AND and OR are linearly separable, and explain why XOR is not.

## Features

- Live sliders for X1, X2, W1, W2, and bias, each from -5 to 5.
- Step, sigmoid, and ReLU activation functions.
- Reset control and three presets: AND gate, OR gate, and a custom starting point.
- Truth tables for AND and OR, with a button to load each input pair.
- SVG diagram of one perceptron, including the bias connection.
- Canvas graph of the line `W1·X1 + W2·X2 + bias = 0`, with class shading for the step function.
- Written calculation that follows the current slider values.
- Short lessons on inputs, weights, bias, activation functions, and the XOR limitation.
- Responsive layout for desktop, tablet, and phone.

## Technologies

- HTML5
- CSS3
- Vanilla JavaScript
- SVG for the neuron diagram
- HTML Canvas for the decision-boundary graph

No frameworks, build step, server, database, or third-party library is required.

## Formula

A two-input perceptron computes

```text
z = (X1 × W1) + (X2 × W2) + bias
y = f(z)
```

### Activation functions

| Name | Rule |
| --- | --- |
| Step | If `z >= 0`, output is 1. Otherwise output is 0. At exactly 0, NeuroPlay returns 1. |
| Sigmoid | `1 / (1 + e^(-z))` |
| ReLU | `max(0, z)` |

### Checked examples

| X1 | X2 | W1 | W2 | Bias | z | Step | Sigmoid | ReLU |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 2 | 0.5 | 1 | -1 | 1.5 | 1 | 0.8176 | 1.5 |
| 1 | 1 | 1 | 1 | -3 | -1 | 0 | 0.2689 | 0 |
| 2 | 2 | 1 | 1 | -2 | 2 | 1 | 0.8808 | 2 |
| 0 | 0 | 1 | 1 | 0 | 0 | 1 | 0.5 | 0 |

Sigmoid values are rounded to four decimal places for display.

## Project structure

```text
NeuroPlay/
├── index.html
├── style.css
├── script.js
└── README.md
```

## Run the project

No installation is required.

1. Open the `NeuroPlay` folder.
2. Open `index.html` in a current browser (Chrome, Edge, or Firefox).

You can also open the folder in Visual Studio Code or Cursor and start Live Server, then visit the local address it prints.

The calculation runs entirely in the browser.

## Screenshots

Add images under `docs/` when you want them on this page.

| Playground | Decision boundary |
| --- | --- |
| _Screenshot placeholder: `docs/playground.png`_ | _Screenshot placeholder: `docs/boundary.png`_ |

## Future improvements

- Animate the perceptron learning rule on AND and OR, showing the weight updates.
- Let students place several labeled points and see which side of the line they fall on.
- Add a two-layer example that can solve XOR, next to the single perceptron that cannot.
- Share an experiment by encoding the slider values in the page URL.
