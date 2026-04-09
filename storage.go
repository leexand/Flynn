package main

import (
	"encoding/json"
	"log"
	"os"
	"sync"

	"github.com/bwmarrin/discordgo"
)

// TempChannel representa un canal de voz temporal registrado en el storage.
// Cada entrada vive en el JSON bajo la clave ownerID.
type TempChannel struct {
	ChannelID string `json:"channel_id"` // ID del canal de voz creado en Discord
	OwnerID   string `json:"owner_id"`   // ID del usuario dueño del canal
	GuildID   string `json:"guild_id"`   // ID del servidor donde vive el canal
	Username  string `json:"username"`   // Nombre de usuario del dueño (solo informativo)
}

var (
	// tempChannels es el mapa principal en memoria: ownerID → TempChannel.
	// Toda lectura/escritura debe hacerse con mu tomado.
	tempChannels = make(map[string]TempChannel)

	// mu protege tempChannels de accesos concurrentes.
	// REGLA: nunca llamar una función pública del storage mientras mu esté tomado,
	// ya que esas funciones también toman mu — eso causaría un deadlock.
	// Las funciones internas con sufijo "Locked" asumen que mu ya está tomado.
	mu sync.Mutex

	storagePath = "data/channels.json"
)

// ─── INICIALIZACIÓN ───────────────────────────────────────────────────────────

// initStorage carga el archivo JSON al arrancar el bot.
// Si el archivo no existe, lo crea vacío.
// Debe llamarse una sola vez en main(), antes de registrar handlers.
func initStorage() error {
	// crear la carpeta data/ si no existe
	if err := os.MkdirAll("data", 0755); err != nil {
		return err
	}

	// si el archivo no existe, inicializar con mapa vacío y guardar
	if _, err := os.Stat(storagePath); os.IsNotExist(err) {
		mu.Lock()
		defer mu.Unlock()
		return saveStorageLocked()
	}

	// leer archivo existente y deserializar
	data, err := os.ReadFile(storagePath)
	if err != nil {
		return err
	}

	mu.Lock()
	defer mu.Unlock()
	return json.Unmarshal(data, &tempChannels)
}

// ─── ESCRITURA ────────────────────────────────────────────────────────────────

// saveStorageLocked serializa tempChannels al archivo JSON.
// ⚠️  Requiere que mu ya esté tomado por el caller — no adquiere el lock.
// Usar esta función evita el deadlock que ocurriría si saveStorage()
// intentara tomar mu mientras addChannel/removeChannel ya lo tienen.
func saveStorageLocked() error {
	data, err := json.MarshalIndent(tempChannels, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(storagePath, data, 0644)
}

// addChannel registra un nuevo canal temporal en memoria y lo persiste en disco.
// Si el ownerID ya tenía un canal registrado, lo sobreescribe.
func addChannel(ownerID string, channel TempChannel) error {
	mu.Lock()
	defer mu.Unlock()
	tempChannels[ownerID] = channel
	return saveStorageLocked() // ← llama a la versión Locked, sin mu interno
}

// removeChannel elimina el registro de un canal del storage y persiste el cambio.
// No falla si el ownerID no existe — delete en Go es idempotente sobre mapas.
func removeChannel(ownerID string) error {
	mu.Lock()
	defer mu.Unlock()
	delete(tempChannels, ownerID)
	return saveStorageLocked()
}

// ─── LECTURA ──────────────────────────────────────────────────────────────────

// getChannelByOwner retorna el canal registrado para un dueño dado.
// El segundo valor indica si existía o no.
func getChannelByOwner(ownerID string) (TempChannel, bool) {
	mu.Lock()
	defer mu.Unlock()
	ch, exists := tempChannels[ownerID]
	return ch, exists
}

// getChannelByID busca un canal por su ChannelID en lugar de por ownerID.
// Útil cuando solo se conoce el canal (ej: VoiceStateUpdate) y se necesita
// saber quién es el dueño.
// O(n) sobre el mapa — aceptable porque el número de canales activos es pequeño.
func getChannelByID(channelID string) (TempChannel, bool) {
	mu.Lock()
	defer mu.Unlock()
	for _, ch := range tempChannels {
		if ch.ChannelID == channelID {
			return ch, true
		}
	}
	return TempChannel{}, false
}

// getAllChannels retorna una copia completa del mapa sin mantener el lock.
// Usar esta función para iterar de forma segura sin riesgo de deadlock,
// ya que el caller puede llamar removeChannel() dentro del loop.
func getAllChannels() map[string]TempChannel {
	mu.Lock()
	defer mu.Unlock()
	snapshot := make(map[string]TempChannel, len(tempChannels))
	for k, v := range tempChannels {
		snapshot[k] = v
	}
	return snapshot
}

// ─── LIMPIEZA ─────────────────────────────────────────────────────────────────

// cleanupOrphanChannels elimina del storage los canales que ya no existen en Discord.
// Se llama en onReady para limpiar registros que quedaron de un apagado abrupto
// del bot (crash, SIGKILL, etc.) donde los canales se eliminaron solos al vaciarse
// pero el JSON nunca se actualizó.
//
// Itera sobre una copia del mapa (getAllChannels) para poder llamar removeChannel
// dentro del loop sin deadlock.
func cleanupOrphanChannels(s *discordgo.Session) {
	channels := getAllChannels()
	removed := 0

	for ownerID, ch := range channels {
		// intentar obtener el canal de la API de Discord
		_, err := s.Channel(ch.ChannelID)
		if err != nil {
			// el canal no existe — limpiar el registro
			if removeErr := removeChannel(ownerID); removeErr == nil {
				log.Printf("🧹 Canal huérfano eliminado del storage: %s (dueño: %s)", ch.ChannelID, ch.Username)
				removed++
			} else {
				log.Printf("⚠️ Error limpiando canal huérfano %s: %v", ch.ChannelID, removeErr)
			}
		}
	}

	if removed > 0 {
		log.Printf("🧹 Limpieza completada: %d canal(es) huérfano(s) eliminados", removed)
	} else {
		log.Println("🧹 Sin canales huérfanos")
	}
}