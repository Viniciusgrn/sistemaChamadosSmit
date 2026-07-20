(function () {
  'use strict';
  var SVG_NS = 'http://www.w3.org/2000/svg';

  function round(n) { return Math.round(n * 100) / 100; }
  function clamp(n) { return Math.max(0, Math.min(100, n)); }

  function initEditor(root) {
    if (root.dataset.peReady) return;
    root.dataset.peReady = '1';

    var textarea = root.querySelector('textarea');
    var img = root.querySelector('.pe-img');
    var svg = root.querySelector('.pe-svg');
    var stage = root.querySelector('.pe-stage');
    var countEl = root.querySelector('.pe-count');
    var clearBtn = root.querySelector('.pe-clear');

    var plantas = {};
    try { plantas = JSON.parse(root.querySelector('.pe-plantas').textContent || '{}'); } catch (e) { plantas = {}; }

    var pts = [];
    try { pts = JSON.parse(textarea.value || '[]') || []; } catch (e) { pts = []; }
    if (!Array.isArray(pts)) pts = [];

    // Campo `planta` do mesmo form: o id do textarea é "..._pontos";
    // o select da planta é "..._planta". Funciona standalone e em inline.
    var plantaField = document.getElementById(textarea.id.replace(/pontos$/, 'planta'));

    var dragging = null;     // índice do vértice em arraste
    var suppressClick = false;

    function currentUrl() {
      var id = plantaField ? String(plantaField.value || '') : '';
      var meta = plantas[id];
      return meta ? meta.url : null;
    }

    function loadImage() {
      var url = currentUrl();
      if (url) {
        img.src = url;
        root.classList.add('has-image');
      } else {
        img.removeAttribute('src');
        root.classList.remove('has-image');
      }
    }

    function save() {
      textarea.value = JSON.stringify(pts.map(function (p) { return [round(p[0]), round(p[1])]; }));
      countEl.textContent = pts.length + (pts.length === 1 ? ' ponto' : ' pontos');
    }

    function pctFromEvent(evt) {
      var r = img.getBoundingClientRect();
      var x = (evt.clientX - r.left) / r.width * 100;
      var y = (evt.clientY - r.top) / r.height * 100;
      return [clamp(x), clamp(y)];
    }

    function render() {
      // limpa
      svg.innerHTML = '';
      var olds = stage.querySelectorAll('.pe-handle');
      for (var k = 0; k < olds.length; k++) olds[k].remove();

      if (pts.length >= 2) {
        var poly = document.createElementNS(SVG_NS, pts.length >= 3 ? 'polygon' : 'polyline');
        poly.setAttribute('points', pts.map(function (p) { return p[0] + ',' + p[1]; }).join(' '));
        poly.setAttribute('fill', pts.length >= 3 ? 'rgba(79,70,229,0.18)' : 'none');
        poly.setAttribute('stroke', '#4f46e5');
        poly.setAttribute('stroke-width', '0.4');
        poly.setAttribute('stroke-linejoin', 'round');
        poly.setAttribute('vector-effect', 'non-scaling-stroke');
        svg.appendChild(poly);
      }

      pts.forEach(function (p, i) {
        var h = document.createElement('div');
        h.className = 'pe-handle';
        h.style.left = p[0] + '%';
        h.style.top = p[1] + '%';
        h.dataset.i = i;
        h.addEventListener('mousedown', onHandleDown);
        h.addEventListener('dblclick', onHandleDblClick);
        stage.appendChild(h);
      });
    }

    function onHandleDown(evt) {
      evt.preventDefault();
      evt.stopPropagation();
      dragging = parseInt(evt.currentTarget.dataset.i, 10);
      window.addEventListener('mousemove', onDragMove);
      window.addEventListener('mouseup', onDragUp);
    }

    function onDragMove(evt) {
      if (dragging === null) return;
      pts[dragging] = pctFromEvent(evt);
      save();
      render();
    }

    function onDragUp() {
      dragging = null;
      suppressClick = true;
      setTimeout(function () { suppressClick = false; }, 0);
      window.removeEventListener('mousemove', onDragMove);
      window.removeEventListener('mouseup', onDragUp);
    }

    function onHandleDblClick(evt) {
      evt.preventDefault();
      evt.stopPropagation();
      var i = parseInt(evt.currentTarget.dataset.i, 10);
      pts.splice(i, 1);
      save();
      render();
    }

    function onStageClick(evt) {
      if (suppressClick) return;
      if (!root.classList.contains('has-image')) return;
      if (evt.target.classList.contains('pe-handle')) return;
      pts.push(pctFromEvent(evt));
      save();
      render();
    }

    stage.addEventListener('click', onStageClick);
    clearBtn.addEventListener('click', function () { pts = []; save(); render(); });
    if (plantaField) plantaField.addEventListener('change', loadImage);

    loadImage();
    save();
    render();
  }

  function initAll() {
    var roots = document.querySelectorAll('.planta-editor');
    for (var i = 0; i < roots.length; i++) initEditor(roots[i]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
