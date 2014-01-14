= NGEN =

NGEN is a technology demo using HTML5 Canvas. The application demonstrates a basic rendering engine with rotate, zoom, pan, entity selection and more.

NGEN implements a 'virtual' world with entities that can be connected with each other, as defined by a JSON dataset. Each entity has it's own properties that can be inspected by clicking on it. The app keeps a history of selected items and allows the user to rotate, pan and zoom the scene gracefully.

== Relevancy of the demo ==

Working with HTML5 canvas is very different from working with the HTML and CSS. This demo explores the differences by experience.

Also, I tried to get a sense of what is possible in the browsers of today – how many frames per second can we squeeze out? Can we already port Quake 3 to Canvas?

Where the DOM is stateful and has structure, HTML5 Canvas has nothing – it's just a pixel buffer. This requires to have a clean separation between model and view in your JavaScript code, and manage redraws and user events yourself.

While programming with Canvas, you find yourself in a whole new performance arena. The one browser is fast in drawing lines, the other one is slow with drawing gradients. Internet Explorer has to run through a very slow emulation layer.

== Features ==

Functional features:
 * Selection of entities.
 * Back/forward selection.
 * Dragging of entities.
 * Zoom, rotate, pan of the scene.
 * Filter/search for entities.
 * Dynamic entity layout.

Technical features:
 * Dynamic entity layout.
 * Only rendering objects that are in view.
 * Using multiple Canvas elements (layers).
 * Freezing layers for performance..
 * Entity API.
 * Accurate object finder by mouse x/y.
 * Using HTML controls with Canvas.