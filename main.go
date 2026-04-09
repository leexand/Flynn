package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/bwmarrin/discordgo"
	"github.com/joho/godotenv"
)

func main() {
	// ── Cargar variables de entorno desde .env ─────────────────────────────────
	// godotenv.Load() lee el archivo .env en el directorio actual.
	// En producción (variables ya en el entorno del sistema) esto puede fallar
	// sin problema — lo importante es que las variables estén disponibles.
	if err := godotenv.Load(); err != nil {
		log.Println("⚠️ No se encontró .env — usando variables del entorno del sistema")
	}

	token := os.Getenv("DISCORD_TOKEN")
	if token == "" {
		log.Fatal("❌ DISCORD_TOKEN no configurado")
	}

	// ── Inicializar storage en disco ───────────────────────────────────────────
	// Carga el JSON de canales activos. Si no existe, lo crea vacío.
	// Debe hacerse antes de Open() para que los handlers tengan el estado listo.
	if err := initStorage(); err != nil {
		log.Fatal("❌ Error inicializando storage:", err)
	}

	// ── Crear sesión de Discord ────────────────────────────────────────────────
	// "Bot " + token es el formato requerido por la API para bots.
	dg, err := discordgo.New("Bot " + token)
	if err != nil {
		log.Fatal("❌ Error creando sesión:", err)
	}

	// ── Configurar intents ─────────────────────────────────────────────────────
	// Los intents determinan qué eventos envía Discord al bot.
	// Solo declarar los necesarios — cuantos más intents, más tráfico WebSocket.
	//
	//   GuildVoiceStates  → eventos de entrar/salir de canales de voz
	//   GuildMessages     → eventos de mensajes nuevos
	//   Guilds            → info básica de servidores
	//   MessageContent    → leer el contenido del mensaje (privilegiado)
	//
	// MessageContent es privilegiado — debe activarse en el portal de
	// desarrolladores de Discord en Applications > Bot > Privileged Gateway Intents.
	dg.Identify.Intents = discordgo.IntentsGuildVoiceStates |
		discordgo.IntentsGuildMessages |
		discordgo.IntentsGuilds |
		discordgo.IntentMessageContent

	// ── Registrar handlers de eventos ─────────────────────────────────────────
	// AddHandler detecta el tipo del segundo parámetro de la función por reflexión
	// y lo vincula al evento correspondiente de Discord.
	dg.AddHandler(onReady)       // *discordgo.Ready        — bot listo y conectado
	dg.AddHandler(voiceUpdate)   // *discordgo.VoiceStateUpdate — alguien entra/sale de voz
	dg.AddHandler(messageCreate) // *discordgo.MessageCreate    — llega un mensaje

	// ── Conectar al WebSocket de Discord ──────────────────────────────────────
	if err := dg.Open(); err != nil {
		log.Fatal("❌ Error conectando:", err)
	}
	defer dg.Close() // garantizar cierre limpio aunque ocurra un panic

	log.Println("✅ Flynn encendido")

	// ── Esperar señal de cierre del sistema ───────────────────────────────────
	// SIGINT  = Ctrl+C desde la terminal
	// SIGTERM = señal de cierre enviada por systemd / Docker / etc.
	// El canal tiene buffer 1 para que signal.Notify no pierda la señal
	// si el programa está ocupado justo en ese momento.
	sc := make(chan os.Signal, 1)
	signal.Notify(sc, syscall.SIGINT, syscall.SIGTERM)
	<-sc

	log.Println("🔴 Flynn apagado")
}

// onReady se llama cuando el bot se conecta exitosamente a Discord y el
// handshake del WebSocket está completo. Es el lugar correcto para:
//   - mostrar el nombre del bot conectado
//   - actualizar el status/actividad visible en Discord
//   - limpiar el storage de canales huérfanos del reinicio anterior
func onReady(s *discordgo.Session, r *discordgo.Ready) {
	log.Printf("✅ Conectado como %s", r.User.Username)

	// mostrar actividad en el perfil del bot
	/**
	* 0: Jugando [ActivityTypeGame]
	* 1: Transmitiendo [ActivityTypeStreaming, URL: "https://twitch.tv/streamer"]
	* 2: Escuchando [ActivityTypeListening]
	* 3: Viendo [ActivityTypeWatching]
	* 5: Compitiendo [ActivityTypeCompeting]
	*/
	s.UpdateStatusComplex(discordgo.UpdateStatusData{
		Activities: []*discordgo.Activity{
			{
				Name: "Gestión de salas 🎧",
				Type: discordgo.ActivityTypeListening,
			},
		},
	})

	// limpiar canales del storage que ya no existen en Discord
	// (quedan cuando el bot se apaga abruptamente con canales activos)
	cleanupOrphanChannels(s)
}