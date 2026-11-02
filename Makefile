CC = cc
CFLAGS = -std=c11 -Wall -Wextra -Wpedantic -pthread

PROGRAMAS = lectores_escritores monitor_cuenta

all: $(PROGRAMAS)

lectores_escritores: lectores_escritores.c
	$(CC) $(CFLAGS) $< -o $@

monitor_cuenta: monitor_cuenta.c
	$(CC) $(CFLAGS) $< -o $@

clean:
	rm -f $(PROGRAMAS)

.PHONY: all clean
