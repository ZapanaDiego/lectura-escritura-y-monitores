/*
 * Monitor de una cuenta bancaria compartida.
 *
 * C no incluye una palabra clave "monitor". Aquí se aplica la disciplina
 * mediante un mutex que protege el saldo y funciones públicas que forman la
 * interfaz del monitor. Cada operación sobre el saldo es indivisible respecto
 * de las demás operaciones que usan esta misma interfaz.
 */

#define _POSIX_C_SOURCE 200809L  // Solicita las interfaces POSIX que necesita nanosleep().

#include <pthread.h>  // Declara mutexes e hilos POSIX.
#include <stdio.h>    // Declara printf() y fprintf().
#include <stdlib.h>   // Declara EXIT_SUCCESS y EXIT_FAILURE.
#include <time.h>     // Declara nanosleep() y struct timespec.

#define CANT_CLIENTES 4  // Cantidad de clientes concurrentes de la cuenta.
#define OPERACIONES_POR_CLIENTE 3  // Cantidad de depósitos/retiros que hará cada cliente.

typedef struct {  // Agrupa el estado y el cerrojo que pertenecen al monitor.
    pthread_mutex_t mutex;  // Garantiza que solo una operación examine/modifique el saldo a la vez.
    long saldo;  // Estado privado que las funciones del monitor administran.
} MonitorCuenta;  // Da nombre al tipo que representa el monitor de cuenta.

static MonitorCuenta cuenta = {PTHREAD_MUTEX_INITIALIZER, 1000};  // Inicializa el mutex y un saldo inicial de 1000.
static pthread_mutex_t mutex_salida = PTHREAD_MUTEX_INITIALIZER;  // Mantiene completos los mensajes de salida.

/* Simula un pequeño intervalo de trabajo del cliente. */
static void pausa_breve(void) {  // Define una función auxiliar sin argumentos.
    const struct timespec espera = {0, 80000000L};  // Prepara una espera de 80 millones de nanosegundos (0.08 s).
    (void)nanosleep(&espera, NULL);  // Pausa este hilo; la pausa no protege el saldo.
}  // Termina la función auxiliar.

/* Deposita dinero mediante la interfaz protegida del monitor. */
static void cuenta_depositar(MonitorCuenta *monitor, long monto, int cliente) {  // Recibe monitor, monto y cliente que solicita depósito.
    pthread_mutex_lock(&monitor->mutex);  // Entra al monitor y excluye otras operaciones sobre el saldo.
    monitor->saldo += monto;  // Suma el monto al estado protegido.
    const long saldo_actual = monitor->saldo;  // Copia el saldo mientras aún se posee el mutex.
    pthread_mutex_unlock(&monitor->mutex);  // Sale del monitor y permite la siguiente operación.

    pthread_mutex_lock(&mutex_salida);  // Protege el mensaje para que no se mezcle con otro.
    printf("Cliente %d deposita %ld; saldo: %ld\n", cliente, monto, saldo_actual);  // Muestra el resultado del depósito.
    pthread_mutex_unlock(&mutex_salida);  // Libera el cerrojo de salida.
}  // Termina la operación de depósito.

/* Retira dinero si existe saldo suficiente; devuelve si la operación se realizó. */
static int cuenta_retirar(MonitorCuenta *monitor, long monto, int cliente) {  // Recibe monitor, monto y cliente solicitante.
    int realizado = 0;  // Supone inicialmente que no se pudo retirar.
    long saldo_actual = 0;  // Reservará el saldo observado para informar el resultado.

    pthread_mutex_lock(&monitor->mutex);  // Entra al monitor para comprobar y cambiar el saldo de forma indivisible.
    if (monitor->saldo >= monto) {  // Verifica bajo el mismo cerrojo que el retiro no exceda el saldo.
        monitor->saldo -= monto;  // Resta el monto autorizado.
        realizado = 1;  // Recuerda que el retiro sí se completó.
    }  // Termina la decisión protegida sobre el retiro.
    saldo_actual = monitor->saldo;  // Copia el saldo final mientras el estado sigue protegido.
    pthread_mutex_unlock(&monitor->mutex);  // Sale del monitor después de terminar la operación.

    pthread_mutex_lock(&mutex_salida);  // Protege el mensaje de salida.
    if (realizado) {  // Elige el mensaje según el resultado guardado.
        printf("Cliente %d retira %ld; saldo: %ld\n", cliente, monto, saldo_actual);  // Informa que el retiro se completó.
    } else {  // El saldo no alcanzaba para la operación.
        printf("Cliente %d no puede retirar %ld; saldo: %ld\n", cliente, monto, saldo_actual);  // Informa el rechazo sin cambiar el saldo.
    }  // Termina la selección del mensaje.
    pthread_mutex_unlock(&mutex_salida);  // Libera el cerrojo de salida.
    return realizado;  // Devuelve uno si retiró, cero si no había saldo suficiente.
}  // Termina la operación de retiro.

/* Consulta el saldo a través del monitor. */
static long cuenta_consultar(MonitorCuenta *monitor) {  // Recibe el monitor que contiene el saldo.
    pthread_mutex_lock(&monitor->mutex);  // Entra al monitor para obtener una vista consistente del estado.
    const long saldo_actual = monitor->saldo;  // Copia el saldo mientras ninguna operación puede modificarlo.
    pthread_mutex_unlock(&monitor->mutex);  // Sale del monitor después de copiar el valor.
    return saldo_actual;  // Devuelve al cliente la copia consistente del saldo.
}  // Termina la consulta.

/* Trabajo que realiza cada cliente concurrente. */
static void *cliente(void *argumento) {  // Función de entrada que pthread_create ejecuta en cada hilo cliente.
    const int id = *(const int *)argumento;  // Lee el identificador asignado a este cliente.

    for (int i = 0; i < OPERACIONES_POR_CLIENTE; ++i) {  // Ejecuta una secuencia acotada de operaciones.
        cuenta_depositar(&cuenta, 100, id);  // Deposita 100 usando la interfaz segura del monitor.
        pausa_breve();  // Simula tiempo entre operaciones del cliente.
        (void)cuenta_retirar(&cuenta, 70, id);  // Intenta retirar 70 y no necesita usar el resultado en este ejemplo.
        pausa_breve();  // Separa las operaciones para que sea más fácil observar varios hilos.

        const long saldo = cuenta_consultar(&cuenta);  // Consulta el saldo con una operación protegida.
        pthread_mutex_lock(&mutex_salida);  // Protege el mensaje de consulta.
        printf("Cliente %d consulta el saldo: %ld\n", id, saldo);  // Muestra la copia consistente obtenida.
        pthread_mutex_unlock(&mutex_salida);  // Libera el cerrojo de salida.
    }  // Termina las operaciones de este cliente.

    return NULL;  // Informa que el hilo cliente terminó.
}  // Termina la función del cliente.

/* Arranca clientes concurrentes y espera a que todos terminen. */
int main(void) {  // Punto de entrada del programa.
    pthread_t hilos[CANT_CLIENTES];  // Guarda los identificadores de los hilos.
    int ids[CANT_CLIENTES];  // Guarda un identificador estable para cada hilo.

    for (int i = 0; i < CANT_CLIENTES; ++i) {  // Recorre la cantidad de clientes que se crearán.
        ids[i] = i + 1;  // Numera clientes desde uno para facilitar la lectura.
        if (pthread_create(&hilos[i], NULL, cliente, &ids[i]) != 0) {  // Crea el hilo que representa al cliente.
            fprintf(stderr, "No se pudo crear el cliente %d\n", ids[i]);  // Informa el fallo por la salida de error.
            return EXIT_FAILURE;  // Termina indicando que no se pudo completar la simulación.
        }  // Termina la comprobación de creación.
    }  // Termina el ciclo de creación de clientes.

    for (int i = 0; i < CANT_CLIENTES; ++i) {  // Recorre los hilos creados.
        pthread_join(hilos[i], NULL);  // Espera a que el cliente correspondiente complete su trabajo.
    }  // Termina la espera de todos los clientes.

    const long saldo_final = cuenta_consultar(&cuenta);  // Obtiene el saldo final usando la interfaz del monitor.
    printf("Saldo final de la cuenta: %ld\n", saldo_final);  // Presenta el estado final después de todos los clientes.
    pthread_mutex_destroy(&cuenta.mutex);  // Libera el mutex del monitor cuando ya no quedan hilos usándolo.
    pthread_mutex_destroy(&mutex_salida);  // Libera el mutex dedicado a imprimir mensajes.
    return EXIT_SUCCESS;  // Finaliza con código de éxito.
}  // Termina main().
