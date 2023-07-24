const { PermissionsBitField } = require("discord.js");

module.exports = {
    data: {
        name: 'mod'
    },
    async execute(interaction, client){
        const member = interaction.guild.members.cache.get(interaction.user.id);
        if(member.voice.channel){
            const voicePermissions = member.voice.channel.permissionsFor(member);

            if(voicePermissions.has(PermissionsBitField.Flags.ManageChannels)){

                const msg = await interaction.reply({ content: 'Menciona al usuario al que quieres darle admin' });
                const filter = (m) => m.author.id === interaction.user.id && m.mentions.users.first();
                const response = await interaction.channel.awaitMessages({ filter, max: 1, time: 30000 });
                if(!response.size) return await msg.edit({ content: `${interaction.user} se cancela la solicitud` });
                const user = response.first().mentions.users.first();
                await client.channels.cache.get(interaction.channel.id).messages.fetch({ limite: 1 }).then(ms => ms.first().delete());

                const newmember = interaction.guild.members.cache.get(user.id);
                if(!newmember.voice.channel ||  newmember.voice.channel !== member.voice.channel) return await msg.edit({ content: `**${user.username} tiene que estar en el mismo canal de voz que tu**` });
                const memberpermis = newmember.voice.channel.permissionsFor(newmember);
                if(memberpermis.has(PermissionsBitField.Flags.ManageChannels)) return await msg.edit({ content: `**${user.username} ya es administrador del canal de voz**` });
                
                await member.voice.channel.permissionOverwrites.create(user.id, {
                    ManageChannels: true
                });
                await interaction.channel.permissionOverwrites.create(user.id, {
                    ManageChannels: true
                });
                return msg.edit({ content: `${user} ahora eres admin del canal de voz` });
            } else {
                return interaction.reply({ content: 'No tienes permisos para editar el canal de voz', ephemeral: true });
            }
            
        } else {
            await interaction.reply({ content: `debes estar conectado a un canal de voz para ejecutar estos botones`, ephemeral: true});
        } 
    }
}