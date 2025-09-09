// Base URL aset hutan. Simpan file di src/asset/forest/
(function (w) {
  const ASSET_BASE = '/src/asset/forest';

  function sceneFor(percent) {
    if (percent <= 10) return 'plant-0-dead.png';
    if (percent <= 25) return 'plant-1-wilted.png';
    if (percent <= 50) return 'plant-2-growing.png';
    if (percent <= 89) return 'plant-3-better.png';
    return 'plant-4-perfect.png';
  }

  function assetUrl(fileName) {
    return `${ASSET_BASE}/${fileName}`;
  }

  // Ekspor ke global
  w.ForestUtils = { sceneFor, assetUrl };
})(window);
