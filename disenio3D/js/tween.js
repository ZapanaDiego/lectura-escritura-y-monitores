/* Interpolaciones simples para animar la escena sin dependencias extra. */

export const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

export const easeOutBack = (t) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

export class TweenManager {
  constructor() {
    this.items = [];
    this.pausado = false;
  }

  add({ duracion = 1, delay = 0, easing = easeInOutCubic, onUpdate, onComplete }) {
    const item = {
      duracion: Math.max(duracion, 0.001),
      delay: Math.max(delay, 0),
      easing,
      onUpdate,
      onComplete,
      elapsed: 0,
    };
    this.items.push(item);
    return item;
  }

  update(dt) {
    if (this.pausado || this.items.length === 0) return;

    for (let i = this.items.length - 1; i >= 0; i -= 1) {
      const item = this.items[i];
      let restante = dt;

      if (item.delay > 0) {
        if (item.delay >= restante) {
          item.delay -= restante;
          continue;
        }
        restante -= item.delay;
        item.delay = 0;
      }

      item.elapsed += restante;
      const t = Math.min(item.elapsed / item.duracion, 1);
      item.onUpdate?.(item.easing(t), t);

      if (t >= 1) {
        item.onComplete?.();
        this.items.splice(i, 1);
      }
    }
  }

  clear() {
    this.items.length = 0;
  }
}
