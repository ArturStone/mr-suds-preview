(function () {
  'use strict';
  var root = document.querySelector('[data-polish-gallery]');
  if (!root) return;
  var previous = root.querySelector('[data-gallery-prev]');
  var next = root.querySelector('[data-gallery-next]');
  var image = root.querySelector('[data-gallery-photo]');
  var caption = root.querySelector('[data-gallery-caption]');
  var count = root.querySelector('[data-gallery-count]');
  var stage = root.querySelector('.polish-gallery__stage');
  var dataUrl = new URL('polishing-gallery.json', document.currentScript.src);
  dataUrl.search = new URL(document.currentScript.src).search;
  fetch(dataUrl).then(function (response) {
    if (!response.ok) throw new Error('Gallery unavailable');
    return response.json();
  }).then(function (photos) {
    if (!photos.length) return;
    var index = 0;
    function show() {
      var photo = photos[index];
      image.src = photo.src;
      image.alt = photo.alt;
      caption.textContent = photo.caption;
      count.textContent = (index + 1) + ' / ' + photos.length;
    }
    function move(delta) {
      index = (index + delta + photos.length) % photos.length;
      show();
    }
    previous.addEventListener('click', function () { move(-1); });
    next.addEventListener('click', function () { move(1); });
    root.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        move(event.key === 'ArrowLeft' ? -1 : 1);
      }
    });
    var start = null;
    stage.addEventListener('pointerdown', function (event) {
      if (!event.isPrimary || event.button !== 0) return;
      start = { x: event.clientX, y: event.clientY };
      stage.setPointerCapture(event.pointerId);
    });
    stage.addEventListener('pointerup', function (event) {
      if (!start) return;
      var dx = event.clientX - start.x, dy = event.clientY - start.y;
      start = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) move(dx < 0 ? 1 : -1);
    });
    stage.addEventListener('pointercancel', function () { start = null; });
    previous.disabled = next.disabled = photos.length < 2;
    show();
  }).catch(function () {
    // Keep the first photo visible if gallery data cannot be loaded.
    count.textContent = '1 / 6 · Gallery unavailable';
  });
})();
