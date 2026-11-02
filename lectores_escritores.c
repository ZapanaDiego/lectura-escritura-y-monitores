/*
 * Problema de lectores y escritores.
 *
 * Varios hilos lectores pueden consultar el recurso simultáneamente.
 * Un hilo escritor debe tener acceso exclusivo mientras modifica el recurso.
 * Esta versión usa preferencia por lectores, por lo que una llegada continua
 * de lectores podría retrasar a un escritor (inanición de escritores).
 */

#define _POSIX_C_SOURCE 200809L  // Solicita las interfaces POSIX que necesita nanosleep().

#include <pthread.h>  // Declara mutexes, variables de condición e hilos POSIX.
#include <stdio.h>    // Declara printf() para mostrar lo que ocurre.
#include <stdlib.h>   // Declara EXIT_SUCCESS y EXIT_FAILURE.
#include <time.h>     // Declara nanosleep() y struct timespec.

#define CANT_LECTORES 4  // Cantidad de hilos que simularán lectores.
#define CANT_ESCRITORES 2  // Cantidad de hilos que simularán escritores.
#define LECTURAS_POR_HILO 3  // Número acotado de operaciones de cada lector.
#define ESCRITURAS_POR_HILO 2  // Número acotado de operaciones de cada escritor.

static pthread_mutex_t mutex_estado = PTHREAD_MUTEX_INITIALIZER;  // Protege el contador y el dato compartido.
static pthread_mutex_t mutex_salida = PTHREAD_MUTEX_INITIALIZER;  // Evita que dos mensajes se mezclen en pantalla.
static pthread_cond_t puede_escribir = PTHREAD_COND_INITIALIZER;  // Avisa cuando ya no quedan lectores activos.
static int lectores_activos = 0;  // Cuenta lectores que ya entraron y aún no han salido.
static int dato_compartido = 0;  // Recurso que los lectores consultan y los escritores actualizan.

/* Hace una pausa corta para que sea más fácil observar la intercalación. */
static void pausa_breve(void) {  // Define una función auxiliar que no recibe argumentos.
    const struct timespec espera = {0, 100000000L};  // Solicita una espera de 100 millones de nanosegundos (0.1 s).
    (void)nanosleep(&espera, NULL);  // Duerme el hilo actual; no se usa como mecanismo de sincronización.
}  // Termina la función auxiliar.

/* Serializa los mensajes para que cada printf aparezca completo. */
static void mostrar(const char *mensaje, int id, int valor) {  // Recibe texto, identificador del hilo y valor observado/escrito.
    pthread_mutex_lock(&mutex_salida);  // Entra a la pequeña sección crítica de salida.
    printf(mensaje, id, valor);  // Imprime el mensaje con sus dos valores.
    pthread_mutex_unlock(&mutex_salida);  // Libera el mutex de salida.
}  // Termina la función de impresión.

/* Código que ejecuta cada hilo lector. */
static void *lector(void *argumento) {  // Función de entrada de un hilo lector.
    const int id = *(const int *)argumento;  // Recupera el identificador enviado al crear el hilo.

    for (int vuelta = 0; vuelta < LECTURAS_POR_HILO; ++vuelta) {  // Repite una cantidad finita de lecturas.
        pthread_mutex_lock(&mutex_estado);  // Protege el contador mientras este lector anuncia su entrada.
        ++lectores_activos;  // Registra que hay un lector más dentro de la zona de lectura.
        const int copia = dato_compartido;  // Copia el dato mientras el estado está protegido.
        pthread_mutex_unlock(&mutex_estado);  // Libera el mutex: otros lectores pueden entrar.

        mostrar("Lector %d lee el valor %d\n", id, copia);  // Informa la lectura realizada.
        pausa_breve();  // Simula el tiempo que el lector dedica a usar el dato.

        pthread_mutex_lock(&mutex_estado);  // Protege el contador mientras este lector anuncia su salida.
        --lectores_activos;  // Registra que este lector ya no está leyendo.
        if (lectores_activos == 0) {  // Comprueba si este era el último lector activo.
            pthread_cond_signal(&puede_escribir);  // Despierta a un escritor que espera lectores en cero.
        }  // Termina la comprobación del último lector.
        pthread_mutex_unlock(&mutex_estado);  // Libera el mutex para otros hilos.
        pausa_breve();  // Separa visualmente una lectura de la siguiente.
    }  // Termina el ciclo de lecturas de este hilo.

    return NULL;  // Informa que el hilo terminó correctamente.
}  // Termina la función del lector.

/* Código que ejecuta cada hilo escritor. */
static void *escritor(void *argumento) {  // Función de entrada de un hilo escritor.
    const int id = *(const int *)argumento;  // Recupera el identificador enviado al crear el hilo.

    for (int vuelta = 0; vuelta < ESCRITURAS_POR_HILO; ++vuelta) {  // Repite una cantidad finita de escrituras.
        pthread_mutex_lock(&mutex_estado);  // Toma el mutex para impedir que entren lectores nuevos.
        while (lectores_activos > 0) {  // Mientras haya lectores usando el dato, el escritor debe esperar.
            pthread_cond_wait(&puede_escribir, &mutex_estado);  // Espera y libera el mutex de forma atómica.
        }  // Al despertar, vuelve a comprobar la condición por si aún hay lectores.

        dato_compartido += 1;  // Modifica el recurso con acceso exclusivo.
        const int nuevo_valor = dato_compartido;  // Guarda el valor para mostrarlo después de soltar el mutex.
        pthread_mutex_unlock(&mutex_estado);  // Libera el recurso para lectores u otros escritores.

        mostrar("Escritor %d actualiza el valor a %d\n", id, nuevo_valor);  // Informa el cambio realizado.
        pausa_breve();  // Simula trabajo fuera de la sección crítica.
    }  // Termina el ciclo de escrituras de este hilo.

    return NULL;  // Informa que el hilo terminó correctamente.
}  // Termina la función del escritor.

/* Crea los hilos, espera su finalización y libera los recursos. */
int main(void) {  // Punto de entrada del programa.
    pthread_t hilos_lectores[CANT_LECTORES];  // Guarda identificadores de los hilos lectores.
    pthread_t hilos_escritores[CANT_ESCRITORES];  // Guarda identificadores de los hilos escritores.
    int ids_lectores[CANT_LECTORES];  // Mantiene vivos los identificadores de lectores hasta que terminen.
    int ids_escritores[CANT_ESCRITORES];  // Mantiene vivos los identificadores de escritores hasta que terminen.

    for (int i = 0; i < CANT_LECTORES; ++i) {  // Recorre los lectores que se deben crear.
        ids_lectores[i] = i + 1;  // Asigna un identificador legible, empezando en uno.
        if (pthread_create(&hilos_lectores[i], NULL, lector, &ids_lectores[i]) != 0) {  // Intenta crear un lector.
            perror("No se pudo crear un hilo lector");  // Explica el fallo usando el error del sistema.
            return EXIT_FAILURE;  // Termina con código de error.
        }  // Termina la comprobación de creación del lector.
    }  // Termina la creación de lectores.

    for (int i = 0; i < CANT_ESCRITORES; ++i) {  // Recorre los escritores que se deben crear.
        ids_escritores[i] = i + 1;  // Asigna un identificador legible, empezando en uno.
        if (pthread_create(&hilos_escritores[i], NULL, escritor, &ids_escritores[i]) != 0) {  // Intenta crear un escritor.
            perror("No se pudo crear un hilo escritor");  // Explica el fallo usando el error del sistema.
            return EXIT_FAILURE;  // Termina con código de error.
        }  // Termina la comprobación de creación del escritor.
    }  // Termina la creación de escritores.

    for (int i = 0; i < CANT_LECTORES; ++i) {  // Recorre los hilos lectores creados.
        pthread_join(hilos_lectores[i], NULL);  // Espera que el lector correspondiente termine.
    }  // Termina la espera de lectores.

    for (int i = 0; i < CANT_ESCRITORES; ++i) {  // Recorre los hilos escritores creados.
        pthread_join(hilos_escritores[i], NULL);  // Espera que el escritor correspondiente termine.
    }  // Termina la espera de escritores.

    pthread_cond_destroy(&puede_escribir);  // Libera la variable de condición ya no utilizada.
    pthread_mutex_destroy(&mutex_estado);  // Libera el mutex que protegía el estado.
    pthread_mutex_destroy(&mutex_salida);  // Libera el mutex usado para ordenar mensajes.
    return EXIT_SUCCESS;  // Finaliza indicando que el programa terminó bien.
}  // Termina main().
