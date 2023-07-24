const { PermissionsBitField } = require("discord.js");

module.exports = {
    data: {
        name: 'remove'
    },
    async execute(interaction, client){
        const member = interaction.guild.members.cache.get(interaction.user.id);
        if(member.voice.channel){
            const voicePermissions = member.voice.channel.permissionsFor(member);
            const canal = member.voice.channel.permissionsFor(interaction.guild.roles.everyone);
            if(voicePermissions.has(PermissionsBitField.Flags.ManageChannels)){
                if(canal.has(PermissionsBitField.Flags.ViewChannel)) return await interaction.reply({ content: 'El canal debe ser privado', ephemeral: true });
                const msg = await interaction.reply({ content: 'Menciona al usuario al que quieres permitirle ver el canal' });
                const filter = (m) => m.author.id === interaction.user.id && m.mentions.users.first();
                const response = await interaction.channel.awaitMessages({ filter, max: 1, time: 30000 });
                if(!response.size) return await msg.edit({ content: `${interaction.user} se cancela la solicitud` });
                const user = response.first().mentions.users.first();
                await client.channels.cache.get(interaction.channel.id).messages.fetch({ limite: 1 }).then(ms => ms.first().delete());
                const memberpermis = member.voice.channel.permissionsFor(user.id);
                const newmember = interaction.guild.members.cache.get(user.id);
                if(!memberpermis.has(PermissionsBitField.Flags.ViewChannel)) return await msg.edit({ content: `**${user.username} no puede ver el canal**` })
                if(newmember.voice.channel === member.voice.channel){
                    await newmember.voice.setChannel(null);
                    await member.voice.channel.permissionOverwrites.create(user.id, {
                        ViewChannel: false
                    });
                    await interaction.channel.permissionOverwrites.create(user.id, {
                        ViewChannel: true
                    });
                    return await msg.edit({ content: `${user.username} no puede ver el canal de voz` });
                }
                await member.voice.channel.permissionOverwrites.create(user.id, {
                    ViewChannel: false
                });
                await interaction.channel.permissionOverwrites.create(user.id, {
                    ViewChannel: true
                });
                return await msg.edit({ content: `${user.username} no puede ver el canal de voz` });
            } else {
                return interaction.reply({ content: 'No tienes permisos para editar el canal de voz', ephemeral: true });
            }
            
        } else {
            await interaction.reply({ content: `debes estar conectado a un canal de voz para ejecutar estos botones`, ephemeral: true});
        } 
    }
}