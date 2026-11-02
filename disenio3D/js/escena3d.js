import * as THREE from 'three';
import { TweenManager } from './tween.js';

/**
 * Escenario 3D común: fondo de laboratorio, cámara orbitable y bucle de render.
 * No contiene lógica de la simulación; solo infraestructura visual.
 */
export class Escena3D {
  constructor(contenedor, opciones = {}) {
    this.contenedor = contenedor;
    this.opciones = {
      radio: 9.5,
      azimut: 0.62,
      polar: 1.12,
      objetivo: new THREE.Vector3(0, 1.25, 0),
      autoRotar: true,
      ...opciones,
    };

    this.visible = true;
    this.arrastrando = false;
    this.ultimoX = 0;
    this.ultimoY = 0;
    this.azimut = this.opciones.azimut;
    this.polar = this.opciones.polar;
    this.objetivo = this.opciones.objetivo.clone();
    this.tiempo = 0;
    this.actualizaciones = [];
    this.tweens = new TweenManager();
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.domElement.className = 'lienzo-3d';
    this.renderer.domElement.setAttribute('aria-hidden', 'true');
    this.contenedor.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x070b14);
    this.scene.fog = new THREE.Fog(0x070b14, 13, 30);

    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    this.camera.position.set(6, 4.6, 7);

    this._crearLuces();
    this._crearSuelo();

    this.ultimoTiempo = performance.now();
    this._loop = this._loop.bind(this);
    this._loop();

    this._observarTamano();
    this._configurarArrastre();
  }

  _crearLuces() {
    const ambiente = new THREE.HemisphereLight(0x67e8f9, 0x020617, 0.7);
    this.scene.add(ambiente);

    const principal = new THREE.DirectionalLight(0xe0f2fe, 1.55);
    principal.position.set(5, 8, 6);
    this.scene.add(principal);

    const cian = new THREE.PointLight(0x22d3ee, 24, 14, 2);
    cian.position.set(0, 3.4, 0);
    this.scene.add(cian);

    const violeta = new THREE.PointLight(0xa78bfa, 14, 12, 2);
    violeta.position.set(-4.5, 2.4, -3.5);
    this.scene.add(violeta);
  }

  _crearSuelo() {
    const plataforma = new THREE.Mesh(
      new THREE.CylinderGeometry(4.8, 5.05, 0.1, 72),
      new THREE.MeshStandardMaterial({
        color: 0x0a1526,
        metalness: 0.7,
        roughness: 0.48,
      })
    );
    plataforma.position.y = -0.06;
    this.scene.add(plataforma);

    const brillo = new THREE.Mesh(
      new THREE.CircleGeometry(4.55, 72),
      new THREE.MeshBasicMaterial({
        color: 0x0891b2,
        transparent: true,
        opacity: 0.035,
        side: THREE.DoubleSide,
      })
    );
    brillo.rotation.x = -Math.PI / 2;
    brillo.position.y = 0.005;
    this.scene.add(brillo);

    const aro = new THREE.Mesh(
      new THREE.TorusGeometry(4.35, 0.012, 6, 110),
      new THREE.MeshBasicMaterial({
        color: 0x22d3ee,
        transparent: true,
        opacity: 0.3,
      })
    );
    aro.rotation.x = Math.PI / 2;
    aro.position.y = 0.02;
    this.scene.add(aro);

    const rejilla = new THREE.GridHelper(30, 30, 0x164e63, 0x0f172a);
    rejilla.position.y = 0.015;
    rejilla.material.transparent = true;
    rejilla.material.opacity = 0.42;
    this.scene.add(rejilla);
  }

  _observarTamano() {
    this.resizeObserver = new ResizeObserver(() => this._ajustarTamano());
    this.resizeObserver.observe(this.contenedor);

    this.intersectionObserver = new IntersectionObserver(
      (entradas) => {
        this.visible = entradas[0]?.isIntersecting ?? true;
      },
      { threshold: 0.01 }
    );
    this.intersectionObserver.observe(this.contenedor);

    this._ajustarTamano();
  }

  _ajustarTamano() {
    const ancho = this.contenedor.clientWidth;
    const alto = this.contenedor.clientHeight;
    if (!ancho || !alto) return;

    this.renderer.setSize(ancho, alto, false);
    this.camera.aspect = ancho / alto;
    this.camera.updateProjectionMatrix();
  }

  _configurarArrastre() {
    const lienzo = this.renderer.domElement;

    lienzo.addEventListener('pointerdown', (evento) => {
      if (evento.button !== undefined && evento.button !== 0) return;
      this.arrastrando = true;
      this.ultimoX = evento.clientX;
      this.ultimoY = evento.clientY;
      this.contenedor.classList.add('arrastrando');
      lienzo.setPointerCapture?.(evento.pointerId);
    });

    lienzo.addEventListener('pointermove', (evento) => {
      if (!this.arrastrando) return;
      const dx = evento.clientX - this.ultimoX;
      const dy = evento.clientY - this.ultimoY;
      this.ultimoX = evento.clientX;
      this.ultimoY = evento.clientY;

      this.azimut -= dx * 0.006;
      this.polar = THREE.MathUtils.clamp(this.polar - dy * 0.0045, 0.82, 1.42);
    });

    const terminar = (evento) => {
      if (!this.arrastrando) return;
      this.arrastrando = false;
      this.contenedor.classList.remove('arrastrando');
      lienzo.releasePointerCapture?.(evento.pointerId);
    };

    lienzo.addEventListener('pointerup', terminar);
    lienzo.addEventListener('pointercancel', terminar);
    lienzo.addEventListener('lostpointercapture', () => {
      this.arrastrando = false;
      this.contenedor.classList.remove('arrastrando');
    });
  }

  _actualizarCamara(dt) {
    if (
      this.opciones.autoRotar &&
      !this.arrastrando &&
      !this.reducedMotion &&
      !document.hidden
    ) {
      this.azimut += dt * 0.055;
    }

    const aspecto = this.camera.aspect || 1;
    const factor =
      aspecto < 0.8 ? 1.46 : aspecto < 1 ? 1.3 : aspecto < 1.15 ? 1.12 : 1;
    const radio = this.opciones.radio * factor;

    const senoPolar = Math.sin(this.polar);
    this.camera.position.set(
      this.objetivo.x + radio * senoPolar * Math.sin(this.azimut),
      this.objetivo.y + radio * Math.cos(this.polar),
      this.objetivo.z + radio * senoPolar * Math.cos(this.azimut)
    );
    this.camera.lookAt(this.objetivo);
  }

  _loop() {
    this.raf = requestAnimationFrame(this._loop);

    const ahora = performance.now();
    const bruto = (ahora - this.ultimoTiempo) / 1000;
    this.ultimoTiempo = ahora;

    if (!this.visible || document.hidden) return;

    const dt = Math.min(bruto, 0.05);
    this.tiempo += dt;
    this._actualizarCamara(dt);
    this.tweens.update(dt);
    this.actualizaciones.forEach((fn) => fn(dt, this.tiempo));
    this.renderer.render(this.scene, this.camera);
  }

  agregar(...objetos) {
    this.scene.add(...objetos);
    return objetos[0];
  }

  quitar(objeto) {
    this.scene.remove(objeto);
  }

  alActualizar(fn) {
    this.actualizaciones.push(fn);
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    this.resizeObserver?.disconnect();
    this.intersectionObserver?.disconnect();
    this.tweens.clear();
    this.renderer.dispose();
    this.contenedor.replaceChildren();
  }
}
