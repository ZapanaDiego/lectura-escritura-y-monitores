import { crearCarrera } from './carrera.js';
import { conceptosDe } from './conceptos.js';

function crearUI() {
  const el = {
    stage: document.getElementById('stage'),
    pasoPanel: document.getElementById('panel-paso'),
    pasoNumero: document.getElementById('paso-numero'),
    pasoTitulo: document.getElementById('paso-titulo'),
    pasoTexto: document.getElementById('paso-texto'),
    pasoComo: document.getElementById('paso-como'),
    pasoPorQue: document.getElementById('paso-porque'),
    pasoDonde: document.getElementById('paso-donde'),
    tabs: [...document.querySelectorAll('[data-tab]')],
    paneles: [...document.querySelectorAll('[data-panel]')],
    detalleCodigo: document.getElementById('detalle-codigo'),
    codigoExplicacion: document.getElementById('codigo-explicacion'),
    codigoFragmento: document.getElementById('codigo-fragmento'),
    detalleConceptos: document.getElementById('detalle-conceptos'),
    conceptos: document.getElementById('conceptos'),
    conceptoDefinicion: document.getElementById('concepto-definicion'),
    resultado: document.getElementById('resultado'),
    resultadoLabel: document.getElementById('resultado-label'),
    resultadoValor: document.getElementById('resultado-valor'),
    resultadoEsperado: document.getElementById('resultado-esperado'),
    resultadoNota: document.getElementById('resultado-nota'),
    saldo3d: document.getElementById('saldo-3d'),
    btnPrincipal: document.getElementById('btn-principal'),
    btnPaso: document.getElementById('btn-paso'),
    btnReiniciar: document.getElementById('btn-reiniciar'),
    registro: document.getElementById('registro'),
    registroResumen: document.getElementById('registro-resumen'),
    registroDetalle: document.getElementById('registro-detalle'),
  };

  function setResultado({ valor, esperado, nota, tono = 'neutro' }) {
    el.resultadoValor.textContent = valor;
    el.resultadoEsperado.textContent = esperado;
    el.resultadoNota.textContent = nota;
    el.resultado.dataset.tono = tono;
    el.saldo3d.textContent = valor;
  }

  function activarTab(nombre) {
    el.tabs.forEach((tab) => {
      const activo = tab.dataset.tab === nombre;
      tab.setAttribute('aria-selected', String(activo));
      tab.tabIndex = activo ? 0 : -1;
    });
    el.paneles.forEach((panel) => {
      panel.hidden = panel.dataset.panel !== nombre;
    });
  }

  function mostrarCodigo(codigoHtml, explicacion) {
    el.codigoFragmento.innerHTML = codigoHtml;
    el.codigoExplicacion.textContent = explicacion;
  }

  function mostrarConceptos(conceptos = []) {
    el.conceptos.replaceChildren();

    if (conceptos.length === 0) {
      el.conceptoDefinicion.textContent = 'No hay conceptos nuevos en este paso.';
      return;
    }

    const activar = (indice) => {
      [...el.conceptos.children].forEach((boton, i) => {
        const activo = i === indice;
        boton.classList.toggle('concepto--activo', activo);
        boton.setAttribute('aria-pressed', String(activo));
      });
      el.conceptoDefinicion.textContent = conceptos[indice].definicion;
    };

    conceptos.forEach((concepto, indice) => {
      const boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'concepto';
      boton.textContent = concepto.nombre;
      boton.setAttribute('aria-pressed', 'false');
      boton.addEventListener('click', () => activar(indice));
      el.conceptos.append(boton);
    });

    activar(0);
  }

  el.tabs.forEach((tab) => {
    tab.addEventListener('click', () => activarTab(tab.dataset.tab));
  });

  el.tabs.forEach((tab, indice) => {
    tab.addEventListener('keydown', (evento) => {
      if (evento.key !== 'ArrowRight' && evento.key !== 'ArrowLeft') return;
      evento.preventDefault();
      const paso = evento.key === 'ArrowRight' ? 1 : -1;
      const destino = (indice + paso + el.tabs.length) % el.tabs.length;
      el.tabs[destino].focus();
      activarTab(el.tabs[destino].dataset.tab);
    });
  });

  return {
    mostrarPaso({
      numero,
      total,
      titulo,
      texto,
      como,
      porQue,
      donde,
      codigoHtml,
      codigoExplicacion,
      conceptos,
    }) {
      el.pasoNumero.textContent = `PASO ${numero} DE ${total}`;
      el.pasoTitulo.textContent = titulo;
      el.pasoTexto.textContent = texto;
      el.pasoComo.textContent = como;
      el.pasoPorQue.textContent = porQue;
      el.pasoDonde.textContent = donde;

      mostrarCodigo(codigoHtml, codigoExplicacion);
      mostrarConceptos(conceptos);

      el.pasoPanel.classList.remove('panel-paso--entra');
      void el.pasoPanel.offsetWidth;
      el.pasoPanel.classList.add('panel-paso--entra');
    },

    setSaldo(valor) {
      el.saldo3d.textContent = valor;
    },

    setResultado,

    registrar(mensaje, tono = 'info') {
      const item = document.createElement('li');
      item.className = `registro__item registro__item--${tono}`;

      const punto = document.createElement('span');
      punto.className = 'registro__punto';
      punto.setAttribute('aria-hidden', 'true');

      const texto = document.createElement('span');
      texto.textContent = mensaje;

      item.append(punto, texto);
      el.registro.append(item);
      el.registroResumen.textContent = `Registro de eventos (${el.registro.children.length})`;
    },

    limpiarEventos() {
      el.registro.replaceChildren();
      el.registroResumen.textContent = 'Registro de eventos (0)';
    },

    marcarFinal() {
      el.btnPrincipal.textContent = 'Repetir';
      el.resultadoLabel.textContent = 'Saldo final';
      el.stage.classList.add('stage--alerta');
    },

    reiniciar() {
      el.stage.classList.remove('stage--alerta');
      el.pasoNumero.textContent = 'PASO 0 DE 6';
      el.pasoTitulo.textContent = 'Dos depósitos concurrentes';
      el.pasoTexto.textContent =
        'Dos hilos intentan depositar 100 cada uno en el mismo saldo. Ejecuta la simulación para ver qué ocurre.';
      el.pasoComo.textContent =
        'Cada depósito es leer, sumar y escribir. Son tres pasos separados.';
      el.pasoPorQue.textContent =
        'Si las operaciones se intercalan, el resultado puede ser incorrecto.';
      el.pasoDonde.textContent =
        'Aplicación y memoria compartida. Todavía no hay mutex ni intervención del kernel.';
      el.btnPrincipal.textContent = 'Ejecutar sin sincronización';
      el.resultadoLabel.textContent = 'Saldo actual';
      el.registroDetalle.open = false;
      el.detalleCodigo.open = false;
      el.detalleConceptos.open = false;
      activarTab('que');

      mostrarCodigo(
        '<span class="code-com">// el mismo saldo para los dos hilos</span>\n' +
          '<span class="code-var">long</span> saldo = <span class="code-num">1000</span>;',
        'El saldo es una variable compartida: los dos hilos ven la misma dirección de memoria.'
      );
      mostrarConceptos(
        conceptosDe('recurso', 'concurrencia', 'sincronizacion', 'carrera')
      );

      this.limpiarEventos();
      setResultado({
        valor: 1000,
        esperado: 1200,
        nota: 'Aún no se ejecutó ninguna operación.',
        tono: 'neutro',
      });
      el.saldo3d.textContent = '1000';

      el.pasoPanel.classList.remove('panel-paso--entra');
      void el.pasoPanel.offsetWidth;
      el.pasoPanel.classList.add('panel-paso--entra');
    },

    setBotonPrincipal(texto) {
      el.btnPrincipal.textContent = texto;
    },
  };
}

const ui = crearUI();

const contenedor = document.getElementById('escena-carrera');
const btnPrincipal = document.getElementById('btn-principal');
const btnPaso = document.getElementById('btn-paso');
const btnReiniciar = document.getElementById('btn-reiniciar');

ui.reiniciar();

let carrera = null;
try {
  carrera = crearCarrera({ contenedor, ui });
} catch (error) {
  console.error('No se pudo iniciar la escena 3D:', error);
  contenedor.innerHTML = `
    <div class="sin-webgl" role="status">
      <strong>No se pudo iniciar la escena 3D</strong>
      <p>El navegador no pudo crear el contexto WebGL. La explicación y los controles de texto siguen disponibles.</p>
    </div>
  `;
  btnPrincipal.disabled = true;
  btnPaso.disabled = true;
  btnReiniciar.disabled = true;
  ui.setBotonPrincipal('3D no disponible');
}

if (carrera) {
  btnPrincipal.addEventListener('click', () => {
    if (carrera.estaReproduciendo()) {
      carrera.pausar();
      ui.setBotonPrincipal('Reanudar');
      return;
    }

    carrera.reproducir();
    ui.setBotonPrincipal('Pausar');
  });

  btnPaso.addEventListener('click', () => {
    const aplicado = carrera.paso();
    if (aplicado && !carrera.terminado()) {
      ui.setBotonPrincipal('Reanudar');
    }
  });

  btnReiniciar.addEventListener('click', () => {
    carrera.reiniciar();
    ui.setBotonPrincipal('Ejecutar sin sincronización');
  });
}

document.documentElement.classList.add('js-listo');
