const { PermissionsBitField } = require("discord.js");

module.exports = {
    data: {
        name: 'block'
    },
    async execute(interaction, client){
        const member = interaction.guild.members.cache.get(interaction.user.id);
        if(member.voice.channel){
            const voicePermissions = member.voice.channel.permissionsFor(member);
            if(voicePermissions.has(PermissionsBitField.Flags.ManageChannels)){
                await member.voice.channel.permissionOverwrites.create(interaction.guild.roles.everyone, {
                    ViewChannel: false
                });
                await member.voice.channel.permissionOverwrites.create(member.id, {
                    ViewChannel: true
                });
                await interaction.channel.permissionOverwrites.create(interaction.guild.roles.everyone, {
                    ViewChannel: false
                });
                await interaction.channel.permissionOverwrites.create(member.id, {
                    ViewChannel: true,
                    SendMessages: true
                });
                return interaction.reply({ content: 'El canal ahora es privado' });
            } else {
                return interaction.reply({ content: 'No tienes permisos para editar el canal de voz', ephemeral: true });
            }
            
        } else {
            await interaction.reply({ content: `debes estar conectado a un canal de voz para ejecutar estos botones`, ephemeral: true});
        } 
    }
}