// scenes.js — registry; chapters loaded from scenes_*.js
'use strict';
/* global */
const SCENES = [];
function scene(id, t0, t1, draw) { SCENES.push({ id, t0, t1, draw }); }
