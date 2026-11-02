# Sincronización en sistemas operativos

Ejemplos didácticos de concurrencia escritos en C y comentados en español.

## Archivos

- `lectores_escritores.c`: permite que varios lectores consulten un dato a la vez, mientras que un escritor necesita acceso exclusivo. Usa la solución clásica con preferencia por lectores.
- `monitor_cuenta.c`: representa un monitor para una cuenta bancaria compartida. Las operaciones de depósito, retiro y consulta se protegen como operaciones indivisibles.
- `Makefile`: compila ambos programas con pthreads.

## Antes de compilar

C es un lenguaje; los monitores no son una construcción incorporada en C. En estos ejemplos se simula la disciplina de un monitor usando las primitivas POSIX `pthread_mutex_t` y `pthread_cond_t`. El mutex protege el estado interno y las variables de condición permiten dormir hasta que cambie una condición.

Los ejemplos son programas de usuario sobre POSIX, no código que se ejecuta dentro del kernel. Requieren un compilador de C y una biblioteca compatible con pthreads.

## Compilar y ejecutar

Desde esta carpeta:

```sh
make
./lectores_escritores
./monitor_cuenta
```

Las líneas de salida pueden aparecer en distinto orden entre ejecuciones: el planificador decide qué hilo corre primero. Las pausas solo ayudan a observar la concurrencia; la corrección depende de mutex y condiciones, no del tiempo de espera.

## Qué observar

En lectores y escritores, varios lectores pueden estar dentro de la sección de lectura al mismo tiempo. Mientras un escritor modifica el dato, ningún lector ni otro escritor puede entrar. Esta solución puede postergar a los escritores si siguen llegando lectores; es una propiedad de la política elegida, no un error de exclusión mutua.

En la cuenta bancaria, cada operación entra al monitor, comprueba/modifica el saldo bajo el mismo mutex y sale. La consulta también toma el mutex para no leer un estado a medio actualizar.

## Animación 3D para GitHub Pages

La carpeta `disenio3D/` contiene un sitio estático con una animación 3D interactiva
(HTML, CSS, JavaScript y Three.js local). La primera entrega cubre el recurso
compartido y la carrera de datos, con una ficha integrada que explica cada paso
desde cuatro preguntas: qué, cómo, por qué y dónde. Las siguientes iteraciones
añaden mutex, kernel, variables de condición, lectores/escritores, monitor y flujo
completo.

### Ver en local

Los módulos ES necesitan servirse por HTTP:

```sh
python3 -m http.server 8000 -d disenio3D
```

Luego abrir <http://localhost:8000/>.

### Publicar en GitHub Pages

El workflow `.github/workflows/pages.yml` publica la carpeta `disenio3D` como
artefacto de Pages. En el repositorio de GitHub:

1. Subir el proyecto a la rama `main`.
2. Ir a **Settings → Pages**.
3. Elegir **Source: GitHub Actions**.
4. Ejecutar el workflow o hacer un push a `main`.
5. Abrir la URL publicada, con la forma `https://usuario.github.io/repositorio/`.

Three.js se sirve desde `disenio3D/vendor/three/` (MIT), por lo que la animación
no depende de un CDN externo.
