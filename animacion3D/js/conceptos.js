/* Definiciones breves que se muestran dentro de la ficha de cada paso. */

export const CONCEPTOS = {
  recurso: {
    nombre: 'Recurso compartido',
    definicion:
      'Un archivo, una tabla o un saldo que varios hilos pueden leer o modificar.',
  },
  concurrencia: {
    nombre: 'Concurrencia',
    definicion:
      'Varios hilos progresan de forma intercalada o en paralelo; el orden no está garantizado.',
  },
  sincronizacion: {
    nombre: 'Sincronización',
    definicion:
      'Reglas que coordinan el acceso al recurso para que su estado no quede incorrecto.',
  },
  carrera: {
    nombre: 'Condición de carrera',
    definicion:
      'El resultado depende del orden impredecible en que se intercalan los accesos.',
  },
  actualizacionPerdida: {
    nombre: 'Actualización perdida',
    definicion:
      'Dos hilos leen el mismo valor y el segundo escribe encima del resultado del primero.',
  },
  atomicidad: {
    nombre: 'Atomicidad',
    definicion:
      'Una operación se ejecuta completa o no se ejecuta; no se observa a medias.',
  },
  memoriaCompartida: {
    nombre: 'Memoria compartida',
    definicion:
      'Los hilos de un mismo proceso comparten el espacio de direcciones y ven las mismas variables.',
  },
  seccionCritica: {
    nombre: 'Sección crítica',
    definicion:
      'Parte del código que accede al recurso compartido y debe protegerse de otros accesos.',
  },
  hilo: {
    nombre: 'Hilo',
    definicion:
      'Unidad de ejecución dentro de un proceso. Comparte la memoria con los demás hilos, pero tiene su propia pila y registros.',
  },
  proceso: {
    nombre: 'Proceso',
    definicion:
      'Programa en ejecución con su propio espacio de direcciones. La clase habla de procesos; los ejemplos usan hilos.',
  },
  mutex: {
    nombre: 'Mutex',
    definicion:
      'Cerrojo de exclusión mutua: solo un hilo puede poseerlo a la vez.',
  },
  lector: {
    nombre: 'Lector',
    definicion:
      'Hilo o proceso que consulta el recurso compartido sin modificarlo.',
  },
  escritor: {
    nombre: 'Escritor',
    definicion:
      'Hilo o proceso que modifica el contenido del recurso compartido.',
  },
  condicion: {
    nombre: 'Variable de condición',
    definicion:
      'Permite que un hilo duerma hasta que otro avise que el estado cambió. Al esperar libera el mutex y al despertar lo vuelve a tomar.',
  },
  inanicion: {
    nombre: 'Inanición',
    definicion:
      'Un hilo espera indefinidamente porque otros siempre obtienen el recurso antes que él.',
  },
  monitor: {
    nombre: 'Monitor',
    definicion:
      'Estructura que agrupa el estado compartido, las operaciones permitidas y la regla de que solo una operación se ejecute a la vez.',
  },
  politicas: {
    nombre: 'Políticas de acceso',
    definicion:
      'Reglas para decidir quién entra primero: preferencia a lectores, a escritores o por turnos.',
  },
};

export function conceptosDe(...claves) {
  return claves.map((clave) => CONCEPTOS[clave]).filter(Boolean);
}
