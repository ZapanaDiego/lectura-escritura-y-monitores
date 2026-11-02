/**
 * Ejecuta una lista de pasos didácticos.
 * Un paso puede reproducirse automáticamente o aplicarse de a uno.
 */
export class Planificador {
  constructor({ pasos, alAplicar, alReiniciar, alTerminar }) {
    this.pasos = pasos;
    this.alAplicar = alAplicar;
    this.alReiniciar = alReiniciar;
    this.alTerminar = alTerminar;
    this.indice = 0;
    this.reproduciendo = false;
    this.velocidad = 1;
    this.temporizador = null;
    this.restante = 0;
    this.instanteFin = 0;
  }

  get total() {
    return this.pasos.length;
  }

  get terminado() {
    return this.indice >= this.pasos.length;
  }

  reproducir() {
    if (this.reproduciendo) return;
    if (this.terminado) this.reiniciar();

    this.reproduciendo = true;

    if (this.restante > 0) {
      const espera = this.restante;
      this.restante = 0;
      this.temporizador = setTimeout(() => this._avanzar(), espera);
      return;
    }

    this._avanzar();
  }

  pausar() {
    if (!this.reproduciendo) return;
    this.reproduciendo = false;

    if (this.temporizador) {
      this.restante = Math.max(0, this.instanteFin - performance.now());
      clearTimeout(this.temporizador);
      this.temporizador = null;
    }
  }

  paso() {
    if (this.reproduciendo) this.pausar();
    this.restante = 0;
    if (this.terminado) return false;

    const paso = this.pasos[this.indice];
    this.indice += 1;
    this.alAplicar?.(paso, this.indice);

    if (this.terminado) this.alTerminar?.();
    return true;
  }

  reiniciar() {
    this.pausar();
    clearTimeout(this.temporizador);
    this.temporizador = null;
    this.restante = 0;
    this.instanteFin = 0;
    this.indice = 0;
    this.alReiniciar?.();
  }

  setVelocidad(valor) {
    this.velocidad = Math.max(0.25, valor);
  }

  _avanzar() {
    if (!this.reproduciendo) return;

    if (this.terminado) {
      this.reproduciendo = false;
      this.alTerminar?.();
      return;
    }

    const paso = this.pasos[this.indice];
    this.indice += 1;
    this.alAplicar?.(paso, this.indice);

    if (this.terminado) {
      this.reproduciendo = false;
      this.alTerminar?.();
      return;
    }

    const espera = (paso.duracion ?? 1000) / this.velocidad;
    this.instanteFin = performance.now() + espera;
    this.temporizador = setTimeout(() => this._avanzar(), espera);
  }
}
