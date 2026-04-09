package main

import (
	"log"
	"os"
	"sync"
	"time"

	"github.com/bwmarrin/discordgo"
)

// creationLock evita que un mismo usuario dispare múltiples creaciones de canal
// en paralelo (ej: entrar y salir del trigger muy rápido antes de que el storage
// responda). El mapa guarda los userID que tienen una creación en progreso.
var (
	creationLock   = make(map[string]bool)
	creationLockMu sync.Mutex
)

// voiceUpdate es el handler principal de eventos de voz.
// Se dispara cada vez que cualquier usuario entra, sale o cambia de canal de voz.
// discordgo lo llama en una goroutine propia, por eso toda la lógica de
// concurrencia (mutex, creationLock) debe ser explícita.
func voiceUpdate(s *discordgo.Session, vs *discordgo.VoiceStateUpdate) {
	triggerID := os.Getenv("VOICE_TRIGGER_ID")
	categoryID := os.Getenv("CATEGORY_ID")

	// ─── CREAR CANAL ──────────────────────────────────────────────────────────
	// Se activa cuando alguien entra al canal trigger configurado en .env
	if vs.ChannelID == triggerID {
		handleTriggerJoin(s, vs, categoryID)
		return
	}

	// ─── ELIMINAR CANALES VACÍOS ──────────────────────────────────────────────
	// Se activa cuando alguien sale de cualquier canal (BeforeUpdate tiene el canal anterior).
	// Solo interesa si realmente salió de algún canal (BeforeUpdate != nil y tiene ChannelID).
	if vs.BeforeUpdate != nil && vs.BeforeUpdate.ChannelID != "" {
		checkAndDelete(s, vs.GuildID, vs.BeforeUpdate.ChannelID)
	}
}

// handleTriggerJoin maneja la entrada de un usuario al canal trigger.
// Si ya tiene un canal, lo mueve al existente.
// Si no, crea uno nuevo, lo registra en el storage y mueve al usuario.
func handleTriggerJoin(s *discordgo.Session, vs *discordgo.VoiceStateUpdate, categoryID string) {
	// ── Anti-spam: bloquear creaciones duplicadas del mismo usuario ────────────
	// Escenario: el usuario hace click rápido en el trigger dos veces antes de
	// que el storage haya guardado el primer canal. Sin esto, se crearían dos canales.
	creationLockMu.Lock()
	if creationLock[vs.UserID] {
		creationLockMu.Unlock()
		log.Printf("⚠️ Creación en progreso para %s — ignorando evento duplicado", vs.UserID)
		return
	}
	creationLock[vs.UserID] = true
	creationLockMu.Unlock()

	// liberar el lock al terminar, sin importar cómo salga la función
	defer func() {
		creationLockMu.Lock()
		delete(creationLock, vs.UserID)
		creationLockMu.Unlock()
	}()

	// ── Si ya tiene canal registrado, moverlo ahí en lugar de crear uno nuevo ─
	if existing, exists := getChannelByOwner(vs.UserID); exists {
		if err := s.GuildMemberMove(vs.GuildID, vs.UserID, &existing.ChannelID); err != nil {
			log.Printf("❌ Error moviendo usuario %s a su canal existente: %v", vs.UserID, err)
		}
		return
	}

	// ── Obtener permisos de la categoría para sincronizarlos al nuevo canal ───
	category, err := s.Channel(categoryID)
	if err != nil {
		log.Printf("❌ Error obteniendo categoría %s: %v", categoryID, err)
		return
	}

	// copiar los overwrites de la categoría para mantener la configuración base
	overwrites := make([]*discordgo.PermissionOverwrite, len(category.PermissionOverwrites))
	copy(overwrites, category.PermissionOverwrites)

	// agregar permisos específicos para el dueño y el bot
	overwrites = append(overwrites,
		&discordgo.PermissionOverwrite{
			// el dueño puede conectar, mover y gestionar su canal
			ID:   vs.UserID,
			Type: discordgo.PermissionOverwriteTypeMember,
			Allow: discordgo.PermissionVoiceConnect |
				discordgo.PermissionVoiceMoveMembers |
				discordgo.PermissionManageChannels,
		},
		&discordgo.PermissionOverwrite{
			// el bot necesita estos permisos para operar sobre el canal
			ID:   s.State.User.ID,
			Type: discordgo.PermissionOverwriteTypeMember,
			Allow: discordgo.PermissionVoiceConnect |
				discordgo.PermissionVoiceMoveMembers |
				discordgo.PermissionManageChannels,
		},
	)

	// ── Crear el canal de voz en la categoría configurada ─────────────────────
	channelName := "🎧 " + vs.Member.User.Username
	ch, err := s.GuildChannelCreateComplex(vs.GuildID, discordgo.GuildChannelCreateData{
		Name:                 channelName,
		Type:                 discordgo.ChannelTypeGuildVoice,
		ParentID:             categoryID,
		PermissionOverwrites: overwrites,
	})
	if err != nil {
		log.Printf("❌ Error creando canal para %s: %v", vs.Member.User.Username, err)
		return
	}

	// ── Registrar en el storage ────────────────────────────────────────────────
	err = addChannel(vs.UserID, TempChannel{
		ChannelID: ch.ID,
		OwnerID:   vs.UserID,
		GuildID:   vs.GuildID,
		Username:  vs.Member.User.Username,
	})
	if err != nil {
		log.Printf("❌ Error guardando canal %s en storage: %v", ch.ID, err)
		// no retornar — el canal existe en Discord, intentar mover al usuario igual
	}

	// ── Mover al usuario al canal recién creado (con reintentos) ───────────────
	// Discord a veces tarda unos milisegundos en procesar el canal nuevo,
	// por eso se reintenta hasta 3 veces con espera progresiva.
	for i := 0; i < 3; i++ {
		err = s.GuildMemberMove(vs.GuildID, vs.UserID, &ch.ID)
		if err == nil {
			break
		}
		log.Printf("⚠️ Reintento %d moviendo %s: %v", i+1, vs.Member.User.Username, err)
		time.Sleep(500 * time.Millisecond)
	}
	if err != nil {
		log.Printf("❌ No se pudo mover a %s después de 3 reintentos: %v", vs.Member.User.Username, err)
	} else {
		log.Printf("✅ Canal creado: %s para %s", ch.ID, vs.Member.User.Username)
	}
}

// checkAndDelete verifica si un canal temporal quedó vacío y lo elimina.
// Se llama cada vez que alguien sale de un canal.
// Si el canal no está registrado como temporal, retorna inmediatamente.
func checkAndDelete(s *discordgo.Session, guildID, channelID string) {
	// solo procesar canales que estén registrados como temporales
	owner, exists := getChannelByID(channelID)
	if !exists {
		return
	}

	// contar cuántos usuarios siguen en el canal usando el state cache local
	// (más rápido que una llamada HTTP a la API)
	guild, err := s.State.Guild(guildID)
	if err != nil {
		log.Printf("❌ Error obteniendo guild %s para verificar canal: %v", guildID, err)
		return
	}

	count := 0
	for _, state := range guild.VoiceStates {
		if state.ChannelID == channelID {
			count++
		}
	}

	// si aún hay usuarios, no hacer nada
	if count > 0 {
		return
	}

	// canal vacío — intentar eliminarlo de Discord
	_, err = s.ChannelDelete(channelID)
	if err != nil {
		// el canal puede que ya no exista (eliminado manualmente, por ejemplo)
		// en cualquier caso, limpiar el registro del storage
		log.Printf("⚠️ Error eliminando canal %s (probablemente ya no existe): %v", channelID, err)
		removeChannel(owner.OwnerID)
		return
	}

	// eliminar del storage solo si el ChannelDelete fue exitoso
	removeChannel(owner.OwnerID)
	log.Printf("🗑️ Canal vacío eliminado: %s (dueño: %s)", channelID, owner.Username)
}