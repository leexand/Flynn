package main

import (
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"

	"github.com/bwmarrin/discordgo"
)

// messageCreate es el handler de mensajes de texto.
// Se dispara para cada mensaje en cualquier canal visible para el bot.
// Filtra rápido para ignorar todo lo que no sea un comando del dueño de un canal.
func messageCreate(s *discordgo.Session, m *discordgo.MessageCreate) {
	// ignorar mensajes de otros bots (incluido el propio)
	if m.Author.Bot {
		return
	}

	// solo procesar mensajes que empiecen con "!"
	content := strings.TrimSpace(m.Content)
	if !strings.HasPrefix(content, "!") {
		return
	}

	// verificar que el autor sea dueño de algún canal temporal.
	// !claim es la única excepción — permite reclamar un canal sin ser dueño.
	channel, isOwner := getChannelByOwner(m.Author.ID)
	if !isOwner {
		if strings.HasPrefix(content, "!claim") {
			handleClaim(s, m)
		}
		return
	}

	// verificar que el dueño esté físicamente en su canal de voz.
	// No tiene sentido enviar comandos desde un canal de texto si no estás en la sala.
	vs, err := s.State.VoiceState(m.GuildID, m.Author.ID)
	if err != nil || vs == nil || vs.ChannelID != channel.ChannelID {
		return
	}

	// despachar al handler correspondiente según el comando
	switch {
	case content == "!lock":
		handleLock(s, m, channel.ChannelID)
	case content == "!unlock":
		handleUnlock(s, m, channel.ChannelID)
	case content == "!close":
		handleClose(s, m, channel.ChannelID)
	case strings.HasPrefix(content, "!name "), content == "!rename":
		// !name y !rename hacen lo mismo — alias para comodidad
		handleName(s, m, channel.ChannelID)
	case strings.HasPrefix(content, "!limit "):
		handleLimit(s, m, channel.ChannelID)
	case strings.HasPrefix(content, "!kick "):
		handleKick(s, m, channel.ChannelID)
	case strings.HasPrefix(content, "!invite "):
		handleInvite(s, m, channel.ChannelID)
	case strings.HasPrefix(content, "!transfer "):
		handleTransfer(s, m, channel)
	case content == "!private":
		handlePrivate(s, m, channel.ChannelID)
	case content == "!unprivate":
		handleUnprivate(s, m, channel.ChannelID)
	case content == "!help":
		handleHelp(s, m)
	}
}

// ─── LOCK ─────────────────────────────────────────────────────────────────────

// handleLock bloquea el canal fijando el límite de usuarios al número actual.
// Nadie nuevo puede entrar, pero los que ya están se quedan.
func handleLock(s *discordgo.Session, m *discordgo.MessageCreate, channelID string) {
	// contar usuarios actuales en el canal desde el state cache
	guild, err := s.State.Guild(m.GuildID)
	if err != nil {
		log.Printf("❌ [lock] Error obteniendo guild: %v", err)
		return
	}

	count := 0
	for _, state := range guild.VoiceStates {
		if state.ChannelID == channelID {
			count++
		}
	}

	_, err = s.ChannelEditComplex(channelID, &discordgo.ChannelEdit{
		UserLimit: count,
	})
	if err != nil {
		log.Printf("❌ [lock] Error editando canal: %v", err)
		return
	}
	s.ChannelMessageSend(m.ChannelID, "🔒 Canal bloqueado")
}

// ─── UNLOCK ───────────────────────────────────────────────────────────────────

// handleUnlock desbloquea el canal eliminando el límite de usuarios.
// En Discord, UserLimit = 0 significa sin límite.
func handleUnlock(s *discordgo.Session, m *discordgo.MessageCreate, channelID string) {
	_, err := s.ChannelEditComplex(channelID, &discordgo.ChannelEdit{
		UserLimit: 0,
	})
	if err != nil {
		log.Printf("❌ [unlock] Error editando canal: %v", err)
		return
	}
	s.ChannelMessageSend(m.ChannelID, "🔓 Canal desbloqueado")
}

// ─── NAME / RENAME ────────────────────────────────────────────────────────────

// handleName cambia el nombre del canal de voz.
// Acepta tanto "!name <nombre>" como "!rename <nombre>" (alias).
// Discord limita los nombres a 100 caracteres.
func handleName(s *discordgo.Session, m *discordgo.MessageCreate, channelID string) {
	content := strings.TrimSpace(m.Content)

	// extraer el nuevo nombre eliminando el prefijo del comando (cualquiera de los dos)
	newName := strings.TrimPrefix(content, "!rename ")
	newName = strings.TrimPrefix(newName, "!name ")
	newName = strings.TrimSpace(newName)

	if len(newName) == 0 || len(newName) > 100 {
		s.ChannelMessageSend(m.ChannelID, "❌ Nombre inválido (1-100 caracteres)")
		return
	}

	_, err := s.ChannelEditComplex(channelID, &discordgo.ChannelEdit{
		Name: newName,
	})
	if err != nil {
		log.Printf("❌ [name] Error renombrando canal: %v", err)
		return
	}
	s.ChannelMessageSend(m.ChannelID, "✏️ Nombre cambiado a: "+newName)
}

// ─── LIMIT ────────────────────────────────────────────────────────────────────

// handleLimit establece un límite de usuarios para el canal.
// Rango válido: 0 (sin límite) a 99.
func handleLimit(s *discordgo.Session, m *discordgo.MessageCreate, channelID string) {
	numStr := strings.TrimPrefix(strings.TrimSpace(m.Content), "!limit ")
	limit, err := strconv.Atoi(numStr)
	if err != nil || limit < 0 || limit > 99 {
		s.ChannelMessageSend(m.ChannelID, "❌ Límite inválido (0-99)")
		return
	}

	_, err = s.ChannelEditComplex(channelID, &discordgo.ChannelEdit{
		UserLimit: limit,
	})
	if err != nil {
		log.Printf("❌ [limit] Error editando canal: %v", err)
		return
	}

	if limit == 0 {
		s.ChannelMessageSend(m.ChannelID, "👥 Límite eliminado — canal abierto")
	} else {
		s.ChannelMessageSend(m.ChannelID, fmt.Sprintf("👥 Límite actualizado a %d", limit))
	}
}

// ─── KICK ─────────────────────────────────────────────────────────────────────

// handleKick expulsa a un usuario del canal y le bloquea el acceso.
// El usuario mencionado debe estar físicamente en el canal.
func handleKick(s *discordgo.Session, m *discordgo.MessageCreate, channelID string) {
	if len(m.Mentions) == 0 {
		s.ChannelMessageSend(m.ChannelID, "❌ Menciona al usuario: `!kick @usuario`")
		return
	}

	target := m.Mentions[0]

	if target.ID == m.Author.ID {
		s.ChannelMessageSend(m.ChannelID, "❌ No puedes kickearte a ti mismo")
		return
	}

	// verificar que el target esté en el canal antes de intentar moverlo
	vs, err := s.State.VoiceState(m.GuildID, target.ID)
	if err != nil || vs == nil || vs.ChannelID != channelID {
		s.ChannelMessageSend(m.ChannelID, "❌ Ese usuario no está en tu canal")
		return
	}

	// mover a nil desconecta al usuario del canal de voz
	err = s.GuildMemberMove(m.GuildID, target.ID, nil)
	if err != nil {
		log.Printf("❌ [kick] Error moviendo usuario %s: %v", target.ID, err)
		return
	}

	// bloquear el acceso al canal para evitar que vuelva a entrar
	s.ChannelPermissionSet(channelID, target.ID, discordgo.PermissionOverwriteTypeMember, 0, discordgo.PermissionVoiceConnect)
	s.ChannelMessageSend(m.ChannelID, fmt.Sprintf("👢 %s fue expulsado del canal", target.Username))
}

// ─── INVITE ───────────────────────────────────────────────────────────────────

// handleInvite otorga permiso de conexión a un usuario específico.
// Útil cuando el canal está bloqueado o en modo privado — el usuario invitado
// puede entrar de todas formas gracias al overwrite explícito.
func handleInvite(s *discordgo.Session, m *discordgo.MessageCreate, channelID string) {
	if len(m.Mentions) == 0 {
		s.ChannelMessageSend(m.ChannelID, "❌ Menciona al usuario: `!invite @usuario`")
		return
	}

	target := m.Mentions[0]

	// dar permiso explícito de conectar — sobreescribe cualquier deny del rol
	err := s.ChannelPermissionSet(channelID, target.ID, discordgo.PermissionOverwriteTypeMember, discordgo.PermissionVoiceConnect, 0)
	if err != nil {
		log.Printf("❌ [invite] Error asignando permiso a %s: %v", target.ID, err)
		return
	}

	s.ChannelMessageSend(m.ChannelID, fmt.Sprintf("✉️ %s fue invitado al canal", target.Username))
}

// ─── CLOSE ────────────────────────────────────────────────────────────────────

// handleClose elimina el canal manualmente, expulsando a todos.
// Solo se ejecuta si el ChannelDelete es exitoso para evitar dejar el storage
// apuntando a un canal que sí existe.
func handleClose(s *discordgo.Session, m *discordgo.MessageCreate, channelID string) {
	_, err := s.ChannelDelete(channelID)
	if err != nil {
		log.Printf("❌ [close] Error eliminando canal %s: %v", channelID, err)
		s.ChannelMessageSend(m.ChannelID, "❌ No se pudo cerrar el canal")
		return
	}
	// limpiar el registro solo después de confirmar que el canal fue eliminado
	removeChannel(m.Author.ID)
}

// ─── CLAIM ────────────────────────────────────────────────────────────────────

// handleClaim permite que alguien tome la propiedad de un canal cuyo dueño ya no está.
// Flujo: el usuario escribe !claim → el bot verifica que esté en un canal temporal
// y que el dueño original no esté ahí → transfiere la propiedad.
func handleClaim(s *discordgo.Session, m *discordgo.MessageCreate) {
	// el usuario debe estar en algún canal de voz
	vs, err := s.State.VoiceState(m.GuildID, m.Author.ID)
	if err != nil || vs == nil {
		return
	}

	// ese canal debe ser un canal temporal registrado
	channel, exists := getChannelByID(vs.ChannelID)
	if !exists {
		return
	}

	// el dueño original no debe estar en el canal
	ownerVS, err := s.State.VoiceState(m.GuildID, channel.OwnerID)
	if err == nil && ownerVS != nil && ownerVS.ChannelID == vs.ChannelID {
		s.ChannelMessageSend(m.ChannelID, "❌ El dueño sigue en el canal")
		return
	}

	// transferir: eliminar el registro del dueño original y crear uno nuevo para el reclamante
	removeChannel(channel.OwnerID)
	addChannel(m.Author.ID, TempChannel{
		ChannelID: channel.ChannelID,
		OwnerID:   m.Author.ID,
		GuildID:   m.GuildID,
		Username:  m.Author.Username,
	})

	s.ChannelMessageSend(m.ChannelID, "✅ Ahora eres el dueño del canal")
}

// ─── TRANSFER ─────────────────────────────────────────────────────────────────

// handleTransfer transfiere la propiedad del canal a otro usuario sin necesidad
// de que el dueño salga. El destinatario debe estar en el canal.
func handleTransfer(s *discordgo.Session, m *discordgo.MessageCreate, channel TempChannel) {
	if len(m.Mentions) == 0 {
		s.ChannelMessageSend(m.ChannelID, "❌ Menciona al usuario: `!transfer @usuario`")
		return
	}

	target := m.Mentions[0]

	if target.ID == m.Author.ID {
		s.ChannelMessageSend(m.ChannelID, "❌ Ya eres el dueño del canal")
		return
	}

	if target.Bot {
		s.ChannelMessageSend(m.ChannelID, "❌ No puedes transferir a un bot")
		return
	}

	// el destinatario debe estar en el canal para recibir la propiedad
	vs, err := s.State.VoiceState(m.GuildID, target.ID)
	if err != nil || vs == nil || vs.ChannelID != channel.ChannelID {
		s.ChannelMessageSend(m.ChannelID, "❌ Ese usuario no está en tu canal")
		return
	}

	// transferir: mover el registro al nuevo dueño
	removeChannel(m.Author.ID)
	addChannel(target.ID, TempChannel{
		ChannelID: channel.ChannelID,
		OwnerID:   target.ID,
		GuildID:   m.GuildID,
		Username:  target.Username,
	})

	s.ChannelMessageSend(m.ChannelID, fmt.Sprintf("🔁 Propiedad transferida a %s", target.Username))
}

// ─── PRIVATE ──────────────────────────────────────────────────────────────────

// handlePrivate oculta el canal a todos los usuarios verificados.
// Solo el dueño y el bot conservan visibilidad y acceso.
// Útil para sesiones privadas sin querer cerrar el canal.
func handlePrivate(s *discordgo.Session, m *discordgo.MessageCreate, channelID string) {
	verifiedRoleID := os.Getenv("VERIFIED_ROLE_ID")

	_, err := s.ChannelEditComplex(channelID, &discordgo.ChannelEdit{
		PermissionOverwrites: []*discordgo.PermissionOverwrite{
			{
				// denegar visibilidad al rol verificado
				ID:   verifiedRoleID,
				Type: discordgo.PermissionOverwriteTypeRole,
				Deny: discordgo.PermissionViewChannel,
			},
			{
				// el dueño mantiene acceso completo
				ID:   m.Author.ID,
				Type: discordgo.PermissionOverwriteTypeMember,
				Allow: discordgo.PermissionViewChannel |
					discordgo.PermissionVoiceConnect |
					discordgo.PermissionVoiceMoveMembers |
					discordgo.PermissionManageChannels,
			},
			{
				// el bot debe poder seguir operando sobre el canal
				ID:   s.State.User.ID,
				Type: discordgo.PermissionOverwriteTypeMember,
				Allow: discordgo.PermissionViewChannel |
					discordgo.PermissionVoiceConnect |
					discordgo.PermissionVoiceMoveMembers |
					discordgo.PermissionManageChannels,
			},
		},
	})
	if err != nil {
		log.Printf("❌ [private] Error editando permisos: %v", err)
		return
	}
	s.ChannelMessageSend(m.ChannelID, "👻 Canal oculto — nadie más puede verlo")
}

// ─── UNPRIVATE ────────────────────────────────────────────────────────────────

// handleUnprivate restaura la visibilidad del canal para todos los verificados.
// Revierte lo que hizo !private.
func handleUnprivate(s *discordgo.Session, m *discordgo.MessageCreate, channelID string) {
	verifiedRoleID := os.Getenv("VERIFIED_ROLE_ID")

	_, err := s.ChannelEditComplex(channelID, &discordgo.ChannelEdit{
		PermissionOverwrites: []*discordgo.PermissionOverwrite{
			{
				// restaurar visibilidad para el rol verificado
				ID:    verifiedRoleID,
				Type:  discordgo.PermissionOverwriteTypeRole,
				Allow: discordgo.PermissionViewChannel,
			},
			{
				ID:   m.Author.ID,
				Type: discordgo.PermissionOverwriteTypeMember,
				Allow: discordgo.PermissionViewChannel |
					discordgo.PermissionVoiceConnect |
					discordgo.PermissionVoiceMoveMembers |
					discordgo.PermissionManageChannels,
			},
			{
				ID:   s.State.User.ID,
				Type: discordgo.PermissionOverwriteTypeMember,
				Allow: discordgo.PermissionViewChannel |
					discordgo.PermissionVoiceConnect |
					discordgo.PermissionVoiceMoveMembers |
					discordgo.PermissionManageChannels,
			},
		},
	})
	if err != nil {
		log.Printf("❌ [unprivate] Error editando permisos: %v", err)
		return
	}
	s.ChannelMessageSend(m.ChannelID, "👁️ Canal visible — todos los verificados pueden verlo")
}

// ─── HELP ─────────────────────────────────────────────────────────────────────

// handleHelp envía la lista de comandos disponibles al canal de texto.
func handleHelp(s *discordgo.Session, m *discordgo.MessageCreate) {
	help := "**🎧 Comandos de sala**\n" +
		"`!lock` — Bloquear el canal al número actual de usuarios\n" +
		"`!unlock` — Desbloquear el canal\n" +
		"`!name <nombre>` — Cambiar el nombre (alias: `!rename`)\n" +
		"`!limit <0-99>` — Cambiar el límite de usuarios (0 = sin límite)\n" +
		"`!kick @usuario` — Expulsar y bloquear a alguien\n" +
		"`!invite @usuario` — Invitar a alguien aunque el canal esté bloqueado\n" +
		"`!transfer @usuario` — Transferir la propiedad del canal\n" +
		"`!claim` — Reclamar el canal si el dueño se fue\n" +
		"`!close` — Cerrar el canal manualmente\n" +
		"`!private` — Ocultar el canal a todos los verificados\n" +
		"`!unprivate` — Restaurar la visibilidad del canal\n"

	s.ChannelMessageSend(m.ChannelID, help)
}