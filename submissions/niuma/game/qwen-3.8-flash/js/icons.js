/* ============================================================
 * icons.js —— 卡片/图鉴图标：用 three.js 把同一批体素模型离屏
 * 渲染成 3/4 视角小图（与游戏内造型 100% 一致，零图片资源）
 * ============================================================ */
'use strict';

const Icons = (() => {
  let renderer = null;
  const cache = {};

  function ensureRenderer() {
    if (renderer) return renderer;
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setSize(128, 128);
    return renderer;
  }

  /** 渲染任意 Group 到目标 2D canvas（isometric-ish 3/4 视角） */
  function renderGroup(group, canvas, opts = {}) {
    const r = ensureRenderer();
    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(26, 1, 0.1, 50);
    const hemi = new THREE.HemisphereLight(0xffffff, 0xb4a58f, 0.95);
    scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xffffff, 0.65);
    dir.position.set(4, 8, 6);
    scene.add(dir);

    scene.add(group);
    const box = new THREE.Box3().setFromObject(group);
    const c = box.getCenter(new THREE.Vector3());
    const s = box.getSize(new THREE.Vector3());
    const maxD = Math.max(s.x, s.y, s.z);
    const azim = (opts.azim ?? 40) * Math.PI / 180;
    const elev = (opts.elev ?? 22) * Math.PI / 180;
    const dist = maxD * 2.1;
    cam.position.set(
      c.x + dist * Math.cos(elev) * Math.sin(azim),
      c.y + dist * Math.sin(elev),
      c.z + dist * Math.cos(elev) * Math.cos(azim)
    );
    cam.lookAt(c);
    r.render(scene, cam);
    const g2 = canvas.getContext('2d');
    g2.clearRect(0, 0, canvas.width, canvas.height);
    g2.drawImage(r.domElement, 0, 0, canvas.width, canvas.height);
    scene.remove(group);
    // 释放图标几何（一次性）
    group.traverse(o => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } });
  }

  function unitIcon(key, canvas) {
    const { group } = buildModel(UNIT_MODELS[key]);
    if (key === 'wall' || key === 'mine' || key === 'chat') { group.rotation.y = -0.5; }
    renderGroup(group, canvas, { azim: key === 'chat' ? 25 : 42 });
  }
  function enemyIcon(key, canvas) {
    const { group } = buildModel(ENEMY_MODELS[key]);
    renderGroup(group, canvas, { azim: 55, elev: 16 });
  }
  return { unitIcon, enemyIcon };
})();
