const { PermissionsBitField } = require("discord.js");
module.exports = {
    data: {
        name: 'cant'
    },
    async execute(interaction, client){
        const member = interaction.guild.members.cache.get(interaction.user.id);
        if(member.voice.channel){
            const voicePermissions = member.voice.channel.permissionsFor(member);

            if(voicePermissions.has(PermissionsBitField.Flags.ManageChannels)){

                const msg = await interaction.reply({ content: 'Escribe la cantidad de usuarios que quieres que pueden entrar' });
                const filter = (m) => m.author.id === interaction.user.id && (m.content > 0 && m.content < 100);
                const response = await interaction.channel.awaitMessages({ filter, max: 1, time: 30000 });
                if(!response.size) return await msg.edit({ content: `${interaction.user} se cancela la solicitud` });
                const limite = response.first().content;
                await client.channels.cache.get(interaction.channel.id).messages.fetch({ limite: 1 }).then(ms => ms.first().delete());

                await member.voice.channel.edit({ userLimit: limite });
                return msg.edit({ content: 'Canal actualizado' });
            } else {
                return interaction.reply({ content: 'No tienes permisos para editar el canal de voz', ephemeral: true });
            }
            
        } else {
            await interaction.reply({ content: `debes estar conectado a un canal de voz para ejecutar estos botones`, ephemeral: true});
        } 
    }
}