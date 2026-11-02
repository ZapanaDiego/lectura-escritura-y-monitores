/*
varios hilos lectores pueden consultar el recurso simultaneamente.
un hilo escrito debe tener acceso exclusivo mientras modifica el recurso
esta versión usa preferencia por lectores por lo que una llegada 
continua de lectores podría retrasar a un escritor inanición de escritores
*/

//solicita las interfaces POSIX que necesita nanosleep()
#define _POSIX_C_SOURCE 200809L 

//Declara mutex, variables de condicción e hilos POSIX.
#include <pthread.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>


//cantidad de hilos que simula lectores
#define CANT_LECTORES 4
//cantidad de hilos que simularán escritores
#define CANT_ESCRITORES 2
//numero acotado de operaciones de cada lector
#define LECTURAS_POR_HILO 3 
//numero acotado de operaciones de cada escritor
#define ESCRITURAS_POR_HILO 2

//protege el contador y el dato compartido
static pthread_mutex_t mutex_estado = PTHREAD_MUTEX_INITIALIZER;
//evita que dos mensajes se mezclen en pantalla
static pthread_mutex_t mutex_salida = PTHREAD_MUTEX_INITIALIZER;
//avisa cuando ya no quedan lectores activos
static pthread_cond_t puede_escribir = PTHREAD_COND_INITIALIZER;
//cuenta lectores que ya entraron y aun no han salido
static int lectores_activos = 0;
//recurso que los lectores consultan y los escritores actualizan
static int dato_compartido = 0;

//hace una pausa corta para qeu sea más facil observar la intercalación
//define una función auxiliar que no revibe argumentos
static void pausa_breve(void){
    //solicita una espera de 0.1 segundos
    const struct timespec espera = {0, 100000000L};
    //duerme el hilo actual: no se usa como mecanismo de sincronización
    (void)nanosleep(&espera, NULL);
}

//serializa los mensajes para que cada printf aparezca completo
//recibe texto, identificador del hilo y valro observado/escrito
static void mostrar(const char *mensaje, int id, int valor){
    //entrada a la pequeña sección crítica de salida 
    pthread_mutex_lock(&mutex_salida);
    //imprime el mansaje con sus dos valores
    printf(mensaje , id, valor);
    //libera el mutex de salida
    pthread_mutex_unlock(&mutex_salida);

}

/*codigo que ejecuta cada hilo lector*/
//función de entrada de un hilo lector
static void *lector(void *argumento){
    //recupera el identificardor enviao al crear el hilo
    const int id = *(const int *)argumento; 

    //repite una cantidad finita de lecturas
    for(int i = 0; i< LECTURAS_POR_HILO; i++){
        //protege el contador mientras este lector anuncia su estrada
        pthread_mutex_lock(&mutex_estado);
        //registra que hay un lector más dentro de la zona de lectura
        ++lectores_activos; 
        //copia el dato mientras el estado esta protegido
        
    }
}