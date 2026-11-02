import * as THREE from 'three';
import { Escena3D } from './escena3d.js';
import { crearEtiqueta } from './etiquetas.js';
import { Planificador } from './planificador.js';
import { conceptosDe } from './conceptos.js';
import { easeInOutCubic, easeOutCubic } from './tween.js';

const COLOR = {
  cian: 0x22d3ee,
  verde: 0x34d399,
  violeta: 0xa78bfa,
  ambar: 0xfbbf24,
  rojo: 0xf87171,
  azul: 0x0891b2,
};

const SALDO_INICIAL = 1000;
const DEPOSITO = 100;

function crearHilo({ nombre, color, posicion }) {
  const grupo = new THREE.Group();
  grupo.position.copy(posicion);

  const nucleo = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.38, 1),
    new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.62,
      metalness: 0.35,
      roughness: 0.28,
    })
  );

  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(0.58, 0.025, 8, 48),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.55,
    })
  );
  halo.rotation.x = Math.PI / 2;

  const etiqueta = crearEtiqueta(nombre, {
    alturaMundo: 0.34,
    borde: `#${color.toString(16).padStart(6, '0')}`,
  });
  etiqueta.position.set(0, 0.98, 0);

  const lectura = crearEtiqueta('lee: —', {
    alturaMundo: 0.27,
    fontSize: 36,
    color: '#94a3b8',
    borde: 'rgba(148, 163, 184, 0.35)',
  });
  lectura.position.set(0, -0.72, 0);

  grupo.add(nucleo, halo, etiqueta, lectura);

  return {
    grupo,
    nucleo,
    halo,
    etiqueta,
    lectura,
    baseY: posicion.y,
  };
}

function pulso(objeto, fuerza, tweens) {
  const base = objeto.userData.escalaBase ?? objeto.scale.x;
  objeto.userData.escalaBase = base;

  tweens.add({
    duracion: 0.58,
    easing: easeOutCubic,
    onUpdate: (t) => {
      const escala = base * (1 + Math.sin(t * Math.PI) * fuerza);
      objeto.scale.setScalar(escala);
    },
    onComplete: () => {
      objeto.scale.setScalar(base);
    },
  });
}

export function crearCarrera({ contenedor, ui }) {
  const escena = new Escena3D(contenedor, {
    radio: 10.9,
    azimut: 0.62,
    polar: 1.12,
    objetivo: new THREE.Vector3(0, 1.02, 0),
    autoRotar: false,
  });

  const estado = {
    saldo: SALDO_INICIAL,
    leidoA: null,
    leidoB: null,
  };

  const grupoFlujos = new THREE.Group();
  escena.agregar(grupoFlujos);

  const geometriaBloque = new THREE.BoxGeometry(1.9, 1.2, 1.0);
  const materialBloque = new THREE.MeshStandardMaterial({
    color: 0x0b2239,
    emissive: COLOR.azul,
    emissiveIntensity: 0.38,
    metalness: 0.62,
    roughness: 0.3,
  });
  const bloque = new THREE.Mesh(geometriaBloque, materialBloque);
  bloque.position.set(0, 1.45, 0);

  const bordes = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometriaBloque),
    new THREE.LineBasicMaterial({
      color: COLOR.cian,
      transparent: true,
      opacity: 0.78,
    })
  );
  bloque.add(bordes);

  const etiquetaRecurso = crearEtiqueta('RECURSO COMPARTIDO\nsaldo: 1000', {
    alturaMundo: 0.38,
    borde: 'rgba(34, 211, 238, 0.55)',
  });
  etiquetaRecurso.position.set(0, 1.95, 0);

  const disco = new THREE.Mesh(
    new THREE.CircleGeometry(0.9, 48),
    new THREE.MeshBasicMaterial({
      color: COLOR.cian,
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
    })
  );
  disco.rotation.x = -Math.PI / 2;
  disco.position.y = 0.02;

  escena.agregar(bloque, etiquetaRecurso, disco);

  const hiloA = crearHilo({
    nombre: 'Hilo A',
    color: COLOR.verde,
    posicion: new THREE.Vector3(-3.3, 1.35, 1.15),
  });

  const hiloB = crearHilo({
    nombre: 'Hilo B',
    color: COLOR.violeta,
    posicion: new THREE.Vector3(3.3, 1.35, -1.15),
  });

  escena.agregar(hiloA.grupo, hiloB.grupo);

  escena.alActualizar((dt, tiempo) => {
    [hiloA, hiloB].forEach((hilo, indice) => {
      hilo.grupo.position.y =
        hilo.baseY + Math.sin(tiempo * 1.35 + indice * 1.8) * 0.055;
      hilo.halo.rotation.z += dt * 0.55;
    });
    bloque.rotation.y = Math.sin(tiempo * 0.45) * 0.08;
    disco.material.opacity = 0.06 + Math.sin(tiempo * 1.2) * 0.018;
  });

  function actualizarSaldo(valor) {
    estado.saldo = valor;
    etiquetaRecurso.userData.actualizar(`RECURSO COMPARTIDO\nsaldo: ${valor}`);
    ui.setSaldo(valor);
  }

  function marcarLectura(hilo, valor) {
    hilo.lectura.userData.actualizar(`leyó: ${valor}`, {
      color: '#34d399',
      borde: 'rgba(52, 211, 153, 0.5)',
    });
  }

  function destacarHilo(hilo) {
    hilo.halo.material.opacity = 1;
    escena.tweens.add({
      duracion: 0.9,
      easing: easeOutCubic,
      onUpdate: (t) => {
        hilo.halo.material.opacity = 1 - t * 0.45;
      },
      onComplete: () => {
        hilo.halo.material.opacity = 0.55;
      },
    });
  }

  function limpiarFlujos() {
    [...grupoFlujos.children].forEach((hijo) => {
      hijo.geometry?.dispose();
      if (Array.isArray(hijo.material)) {
        hijo.material.forEach((material) => material.dispose());
      } else {
        hijo.material?.dispose();
      }
      grupoFlujos.remove(hijo);
    });
  }

  function crearFlujo(desde, hasta, color, tipo) {
    const inicio = desde.clone();
    const fin = hasta.clone();
    const medio = inicio.clone().add(fin).multiplyScalar(0.5);
    medio.y += 1.15;

    const curva = new THREE.QuadraticBezierCurve3(inicio, medio, fin);
    const geometria = new THREE.BufferGeometry().setFromPoints(curva.getPoints(36));
    const linea = new THREE.Line(
      geometria,
      new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0,
      })
    );

    const paquete =
      tipo === 'escritura'
        ? new THREE.Mesh(
            new THREE.BoxGeometry(0.14, 0.14, 0.14),
            new THREE.MeshBasicMaterial({ color })
          )
        : new THREE.Mesh(
            new THREE.SphereGeometry(0.095, 12, 12),
            new THREE.MeshBasicMaterial({ color })
          );

    paquete.position.copy(inicio);
    grupoFlujos.add(linea, paquete);

    escena.tweens.add({
      duracion: 0.82,
      easing: easeInOutCubic,
      onUpdate: (t) => {
        paquete.position.copy(curva.getPoint(t));
        linea.material.opacity = Math.sin(t * Math.PI) * 0.58;
      },
      onComplete: () => {
        grupoFlujos.remove(linea, paquete);
        geometria.dispose();
        linea.material.dispose();
        paquete.geometry.dispose();
        paquete.material.dispose();
      },
    });
  }

  function animarLectura(hilo) {
    crearFlujo(bloque.position, hilo.grupo.position, COLOR.verde, 'lectura');
    pulso(hilo.nucleo, 0.16, escena.tweens);
    destacarHilo(hilo);
  }

  function animarEscritura(hilo) {
    crearFlujo(hilo.grupo.position, bloque.position, COLOR.ambar, 'escritura');
    pulso(bloque, 0.1, escena.tweens);
    pulso(hilo.nucleo, 0.12, escena.tweens);
    destacarHilo(hilo);
  }

  function alertarBloque() {
    materialBloque.emissive.setHex(COLOR.rojo);
    materialBloque.emissiveIntensity = 1;
    bordes.material.color.setHex(COLOR.rojo);

    escena.tweens.add({
      duracion: 1.15,
      onUpdate: (t) => {
        materialBloque.emissiveIntensity = 1 - Math.sin(t * Math.PI) * 0.35;
        bloque.rotation.z = Math.sin(t * Math.PI * 3) * 0.035;
      },
      onComplete: () => {
        bloque.rotation.z = 0;
      },
    });
  }

  const pasos = [
    {
      duracion: 1800,
      titulo: 'El saldo es un recurso compartido',
      texto:
        'Dos hilos quieren depositar en la misma cuenta. El saldo vive en memoria compartida: ambos pueden leerlo y escribir sobre él.',
      como:
        'Los dos hilos acceden a la misma variable saldo. La clase habla de procesos; en estos ejemplos usamos hilos porque comparten memoria.',
      porQue:
        'La sincronización existe para que los accesos concurrentes no dejen el recurso en un estado incorrecto.',
      donde:
        'Aplicación y memoria compartida. Todavía no hay mutex ni intervención del kernel.',
      codigoHtml:
        '<span class="code-com">// el mismo saldo para los dos hilos</span>\n' +
        '<span class="code-var">long</span> saldo = <span class="code-num">1000</span>;',
      codigoExplicacion:
        'El recurso no es una copia privada: ambos hilos ven la misma variable.',
      conceptos: conceptosDe(
        'recurso',
        'memoriaCompartida',
        'concurrencia',
        'sincronizacion',
        'hilo',
        'proceso'
      ),
      aplicar() {
        pulso(bloque, 0.08, escena.tweens);
        pulso(hiloA.nucleo, 0.1, escena.tweens);
        pulso(hiloB.nucleo, 0.1, escena.tweens);
        destacarHilo(hiloA);
        destacarHilo(hiloB);
        ui.registrar('El saldo compartido está en memoria', 'info');
      },
    },
    {
      duracion: 1700,
      titulo: 'El hilo A lee el saldo',
      texto:
        'El hilo A copia el saldo actual (1000) en su propio registro. Todavía no ha modificado nada.',
      como:
        'El hilo ejecuta copia = saldo: guarda 1000 en su propio registro.',
      porQue:
        'Leer no modifica el saldo, pero crea una copia que puede quedar desactualizada.',
      donde:
        'Aplicación, pila del hilo y memoria compartida. Todavía no hay mutex.',
      codigoHtml: '<span class="code-var">int</span> copiaA = saldo;',
      codigoExplicacion:
        'La lectura copia el valor a la pila del hilo. El saldo compartido no cambia.',
      conceptos: conceptosDe('hilo', 'memoriaCompartida', 'seccionCritica', 'carrera'),
      aplicar() {
        estado.leidoA = estado.saldo;
        marcarLectura(hiloA, estado.leidoA);
        animarLectura(hiloA);
        ui.registrar('Hilo A lee saldo = 1000', 'lectura');
        ui.setResultado({
          valor: estado.saldo,
          esperado: 1200,
          nota: 'A leyó 1000, pero todavía no escribió.',
          tono: 'neutro',
        });
      },
    },
    {
      duracion: 1600,
      titulo: 'El hilo B lee el mismo saldo',
      texto:
        'Antes de que A escriba, B también lee 1000. Ahora los dos hilos creen que el saldo es 1000.',
      como:
        'B ejecuta la misma lectura antes de que A escriba: también obtiene 1000.',
      porQue:
        'Ambos hilos creen que el saldo es 1000; cualquier cálculo parte de una copia vieja.',
      donde:
        'Aplicación, pila de B y memoria compartida.',
      codigoHtml: '<span class="code-var">int</span> copiaB = saldo;',
      codigoExplicacion:
        'Las dos copias valen 1000, aunque el saldo compartido todavía valga 1000.',
      conceptos: conceptosDe('carrera', 'actualizacionPerdida', 'memoriaCompartida'),
      aplicar() {
        estado.leidoB = estado.saldo;
        marcarLectura(hiloB, estado.leidoB);
        animarLectura(hiloB);
        ui.registrar('Hilo B lee saldo = 1000', 'lectura');
        ui.setResultado({
          valor: estado.saldo,
          esperado: 1200,
          nota: 'A y B tienen 1000 en sus registros: ambos calcularán sobre el mismo valor.',
          tono: 'advertencia',
        });
      },
    },
    {
      duracion: 1500,
      titulo: 'El hilo A escribe su resultado',
      texto:
        'A calcula 1000 + 100 y escribe 1100 en el saldo compartido. B todavía conserva 1000 en su registro.',
      como:
        'A calcula 1000 + 100 y escribe 1100 en el saldo.',
      porQue:
        'La escritura no sabe que B conserva otra copia de 1000.',
      donde:
        'Aplicación y memoria compartida.',
      codigoHtml: 'saldo = copiaA + <span class="code-num">100</span>;',
      codigoExplicacion:
        'La escritura reemplaza el valor anterior; todavía no hay nada que impida que otro hilo escriba después.',
      conceptos: conceptosDe('seccionCritica', 'atomicidad', 'actualizacionPerdida'),
      aplicar() {
        const nuevo = estado.leidoA + DEPOSITO;
        actualizarSaldo(nuevo);
        animarEscritura(hiloA);
        ui.registrar(`Hilo A escribe saldo = ${nuevo}`, 'escritura');
        ui.setResultado({
          valor: nuevo,
          esperado: 1200,
          nota: 'A ya escribió 1100, pero B no sabe que el saldo cambió.',
          tono: 'advertencia',
        });
      },
    },
    {
      duracion: 1600,
      titulo: 'El hilo B sobrescribe a A',
      texto:
        'B calcula 1000 + 100 y escribe 1100 otra vez. El segundo write pisa el resultado del primero.',
      como:
        'B calcula 1000 + 100 y escribe 1100 otra vez.',
      porQue:
        'El segundo write sobrescribe el primero: el depósito de A desaparece.',
      donde:
        'Aplicación y memoria compartida.',
      codigoHtml: 'saldo = copiaB + <span class="code-num">100</span>;',
      codigoExplicacion:
        'B escribe el mismo 1100 que ya había escrito A; el resultado final no refleja los dos depósitos.',
      conceptos: conceptosDe('actualizacionPerdida', 'carrera', 'atomicidad'),
      aplicar() {
        const nuevo = estado.leidoB + DEPOSITO;
        actualizarSaldo(nuevo);
        animarEscritura(hiloB);
        ui.registrar(`Hilo B escribe saldo = ${nuevo} y sobrescribe a A`, 'peligro');
        ui.setResultado({
          valor: nuevo,
          esperado: 1200,
          nota: 'Se perdió un depósito: el saldo quedó en 1100 en lugar de 1200.',
          tono: 'peligro',
        });
      },
    },
    {
      duracion: 1400,
      titulo: 'El saldo final es incorrecto',
      texto:
        'Se hicieron dos depósitos de 100, pero el saldo solo subió 100. La lectura y la escritura no fueron atómicas.',
      como:
        'Se hicieron dos depósitos de 100, pero el saldo solo subió 100.',
      porQue:
        'La lectura y la escritura no fueron atómicas: se intercalaron.',
      donde:
        'Aplicación y memoria compartida. La solución llegará con exclusión mutua.',
      codigoHtml:
        '<span class="code-com">// resultado: 1100, esperado: 1200</span>\n' +
        '<span class="code-com">// un depósito se perdió</span>',
      codigoExplicacion:
        'El estado final es incorrecto porque las operaciones se mezclaron.',
      conceptos: conceptosDe(
        'carrera',
        'atomicidad',
        'seccionCritica',
        'sincronizacion'
      ),
      aplicar() {
        alertarBloque();
        ui.registrar('Resultado: saldo = 1100 (esperado 1200)', 'peligro');
        ui.setResultado({
          valor: 1100,
          esperado: 1200,
          nota: 'Se perdió un depósito: 1100 en lugar de 1200.',
          tono: 'peligro',
        });
      },
    },
  ];

  const planificador = new Planificador({
    pasos,
    alAplicar: (paso, numero) => {
      ui.mostrarPaso({
        ...paso,
        numero,
        total: pasos.length,
      });
      paso.aplicar();
    },
    alReiniciar: reiniciar,
    alTerminar: () => ui.marcarFinal(),
  });

  function reiniciar() {
    escena.tweens.clear();
    limpiarFlujos();

    estado.saldo = SALDO_INICIAL;
    estado.leidoA = null;
    estado.leidoB = null;

    bloque.scale.setScalar(1);
    bloque.rotation.set(0, 0, 0);
    materialBloque.emissive.setHex(COLOR.azul);
    materialBloque.emissiveIntensity = 0.38;
    bordes.material.color.setHex(COLOR.cian);

    [hiloA, hiloB].forEach((hilo) => {
      hilo.nucleo.scale.setScalar(1);
      hilo.halo.material.opacity = 0.55;
    });

    hiloA.lectura.userData.actualizar('lee: —', {
      color: '#94a3b8',
      borde: 'rgba(148, 163, 184, 0.35)',
    });
    hiloB.lectura.userData.actualizar('lee: —', {
      color: '#94a3b8',
      borde: 'rgba(148, 163, 184, 0.35)',
    });

    etiquetaRecurso.userData.actualizar('RECURSO COMPARTIDO\nsaldo: 1000');
    ui.reiniciar();
  }

  ui.setSaldo(SALDO_INICIAL);
  ui.setResultado({
    valor: SALDO_INICIAL,
    esperado: 1200,
    nota: 'Aún no se ejecutó ninguna operación.',
    tono: 'neutro',
  });

  return {
    reproducir: () => planificador.reproducir(),
    pausar: () => planificador.pausar(),
    paso: () => planificador.paso(),
    reiniciar: () => planificador.reiniciar(),
    estaReproduciendo: () => planificador.reproduciendo,
    terminado: () => planificador.terminado,
    totalPasos: planificador.total,
  };
}
