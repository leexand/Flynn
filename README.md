# Flynn 🎧

Bot de Discord para gestión de salas de voz temporales. Cuando un usuario entra al canal trigger, Flynn crea automáticamente un canal de voz personal para él y le da control total sobre él. Cuando el canal queda vacío, se elimina solo.

## Características

- Creación automática de canales al entrar al trigger
- Eliminación automática al quedar vacíos
- Control completo por parte del dueño (nombre, límite, lock, kick, invite)
- Transferencia de propiedad sin necesidad de salir
- Modo privado para ocultar el canal a otros usuarios
- Limpieza de canales huérfanos al reiniciar
- Protección anti-spam de creación duplicada
- Storage persistente en JSON con acceso concurrente seguro

## Requisitos

- Go 1.21+
- Bot de Discord con los siguientes **Privileged Gateway Intents** activados:
  - `MESSAGE CONTENT INTENT`

## Instalación

```bash
git clone https://github.com/tuusuario/flynn
cd flynn
go mod download
```

## Configuración

Crea un archivo `.env` en la raíz del proyecto basado en `.env.example`:

```bash
cp .env.example .env
```

Llena cada variable con los IDs correspondientes de tu servidor (ver sección [Variables de entorno](#variables-de-entorno)).

## Uso

```bash
go run .
```

O compilar y ejecutar:

```bash
go build -o flynn .
./flynn
```

## Variables de entorno

| Variable | Descripción |
|---|---|
| `DISCORD_TOKEN` | Token del bot obtenido desde el [Portal de Desarrolladores](https://discord.com/developers/applications) |
| `VOICE_TRIGGER_ID` | ID del canal de voz que actúa como trigger para crear salas |
| `CATEGORY_ID` | ID de la categoría donde se crean los canales temporales |
| `VERIFIED_ROLE_ID` | ID del rol "verificado" usado por `!private` / `!unprivate` |

Para obtener IDs en Discord: activa el **Modo Desarrollador** en Ajustes → Avanzado, luego haz clic derecho sobre el canal o rol.

## Comandos

Todos los comandos deben enviarse desde un canal de texto mientras el dueño está en su sala de voz.

| Comando | Descripción |
|---|---|
| `!lock` | Bloquea el canal al número actual de usuarios |
| `!unlock` | Desbloquea el canal |
| `!name <nombre>` | Cambia el nombre del canal (alias: `!rename`) |
| `!limit <0-99>` | Establece límite de usuarios (0 = sin límite) |
| `!kick @usuario` | Expulsa a un usuario y le bloquea el acceso |
| `!invite @usuario` | Invita a un usuario aunque el canal esté bloqueado |
| `!transfer @usuario` | Transfiere la propiedad del canal |
| `!claim` | Reclama el canal si el dueño original ya no está |
| `!close` | Cierra el canal manualmente |
| `!private` | Oculta el canal a todos los verificados |
| `!unprivate` | Restaura la visibilidad del canal |
| `!help` | Muestra la lista de comandos |

## Estructura del proyecto

```
flynn/
├── main.go        # Punto de entrada, configuración de intents y handlers
├── commands.go    # Handler de mensajes y lógica de cada comando
├── voice.go       # Handler de eventos de voz, creación y eliminación de canales
├── storage.go     # Persistencia en JSON con acceso concurrente seguro
├── go.mod
├── go.sum
├── .env.example
└── data/
    └── channels.json  # Generado automáticamente al arrancar
```

## Permisos del bot

El bot necesita los siguientes permisos en el servidor:

- `Manage Channels` — para crear, editar y eliminar canales de voz
- `Move Members` — para mover usuarios al canal recién creado
- `View Channel` — para ver los canales de la categoría

## Dependencias

| Paquete | Versión | Uso |
|---|---|---|
| `github.com/bwmarrin/discordgo` | v0.29.0 | Librería principal de Discord |
| `github.com/joho/godotenv` | v1.5.1 | Carga de variables desde `.env` |