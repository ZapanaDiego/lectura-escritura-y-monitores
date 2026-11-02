import * as THREE from 'three';

const DPR = 2;
const FUENTE =
  '600 42px "Segoe UI", "Helvetica Neue", system-ui, -apple-system, sans-serif';

function dibujarTexto(texto, config) {
  const lineas = String(texto).split('\n');
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  ctx.font = FUENTE;
  const anchoTexto = Math.max(...lineas.map((linea) => ctx.measureText(linea).width));
  const altoLinea = config.fontSize * 1.2;
  const ancho = Math.ceil(anchoTexto + config.padding * 2);
  const alto = Math.ceil(altoLinea * lineas.length + config.padding * 2);

  canvas.width = ancho * DPR;
  canvas.height = alto * DPR;
  ctx.scale(DPR, DPR);

  const radio = Math.min(config.radio, alto / 2);
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(1, 1, ancho - 2, alto - 2, radio);
  } else {
    ctx.rect(1, 1, ancho - 2, alto - 2);
  }
  ctx.fillStyle = config.fondo;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = config.borde;
  ctx.stroke();

  ctx.font = `600 ${config.fontSize}px "Segoe UI", "Helvetica Neue", system-ui, -apple-system, sans-serif`;
  ctx.fillStyle = config.color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  lineas.forEach((linea, indice) => {
    ctx.fillText(linea, ancho / 2, config.padding + altoLinea * (indice + 0.5));
  });

  return { canvas, ancho, alto };
}

/**
 * Crea una etiqueta flotante que siempre mira a la cámara.
 * El texto se puede cambiar con sprite.userData.actualizar("nuevo texto").
 */
export function crearEtiqueta(texto, opciones = {}) {
  const config = {
    alturaMundo: 0.4,
    fontSize: 42,
    color: '#e2e8f0',
    fondo: 'rgba(8, 15, 28, 0.9)',
    borde: 'rgba(34, 211, 238, 0.5)',
    padding: 18,
    radio: 16,
    ...opciones,
  };

  const material = new THREE.SpriteMaterial({
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });

  const sprite = new THREE.Sprite(material);
  sprite.renderOrder = 20;
  sprite.center.set(0.5, 0.5);

  sprite.userData.actualizar = (nuevoTexto, cambios = {}) => {
    Object.assign(config, cambios);
    const { canvas, ancho, alto } = dibujarTexto(nuevoTexto, config);

    const textura = new THREE.CanvasTexture(canvas);
    textura.colorSpace = THREE.SRGBColorSpace;
    textura.minFilter = THREE.LinearFilter;
    textura.magFilter = THREE.LinearFilter;
    textura.needsUpdate = true;

    if (material.map) material.map.dispose();
    material.map = textura;
    material.needsUpdate = true;

    const aspecto = ancho / alto;
    sprite.scale.set(config.alturaMundo * aspecto, config.alturaMundo, 1);
  };

  sprite.userData.actualizar(texto);
  return sprite;
}
