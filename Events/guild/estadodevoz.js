const { ChannelType, Collection, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../../config.json');
const schema = require('../../models/temporal');
const schema2 = require('../../models/temptext');
let VoiceManager = new Collection();

module.exports = {
    name: 'voiceStateUpdate',
    once: false,
    async execute(oldState, newState, client){
        const { member, guild } = oldState;
        const newChannel = newState.channel;
        const oldChannel = oldState.channel;
        const dev = await client.users.fetch(config.developer[0]);

        const embed = new EmbedBuilder()
        .setColor(config.color)
        .setTitle('Configuración de canales temporales')
        .setThumbnail(guild.iconURL())
        .setDescription('**🎙️ Panel para configuración de canales**\n\nUtiliza los botones aqui abajo para dar configuraciones a los canales de tú propiedad\n\n**NOTA:** Es importante que estes en un canal de voz al momento de usar estos botones\n\n- 🔒 Poner el canal privado\n- 🔓 Poner el canal publico\n- 🔢 Editar la cantidad de usuarios que pueden ingresar\n- 🛠️ Agregar un administrador al canal\n- 🙎 Usuario que puede ver el canal de voz\n- 🚪 Usuario que no puede ver el canal de voz')
        .setFooter({ text: `© ${dev.username}` })

        const btn = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
            .setCustomId('block')
            .setEmoji('🔒')
            .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
            .setCustomId('unblock')
            .setEmoji('🔓')
            .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
            .setCustomId('cant')
            .setEmoji('🔢')
            .setStyle(ButtonStyle.Secondary)
        )
        const btn2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
            .setCustomId('mod')
            .setEmoji('🛠️')
            .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
            .setCustomId('add')
            .setEmoji('🙎')
            .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
            .setCustomId('remove')
            .setEmoji('🚪')
            .setStyle(ButtonStyle.Secondary)
        )

        const data = await schema.findOne({ guild: guild.id });
        const data2 = await schema2.findOne({ guild: guild.id, user: member.id });
        if(!data) return;

        const channel = client.channels.cache.get(data.canal);
        if(oldChannel !== newChannel && newChannel && newChannel.id === channel.id){
            const voiceChannel = await guild.channels.create({
                name: `🔊 | ${member.user.username}`,
                type: ChannelType.GuildVoice,
                parent: newChannel.parent,
                permissionOverwrites: [
                    {
                        id: member.id,
                        allow: ['Connect', 'ManageChannels']
                    },
                    {
                        id: guild.id,
                        allow: ['Connect']
                    }
                ],
                userLimit: data.limit
            });
            const textChannel = await guild.channels.create({
                name: `📝 ${member.user.username}`,
                type: ChannelType.GuildText,
                parent: newChannel.parent
            });
            await textChannel.send({ content: `${member}`, embeds: [embed], components: [btn,btn2] })
            .then((m) => {
                setTimeout(() => m.edit({ content: '', embeds: [embed], components: [btn,btn2] }), 1000);
            });
            if(!data2){
                await schema2.create({
                    guild: guild.id,
                    user: member.id,
                    canal: textChannel.id,
                });
            } else null;
            VoiceManager.set(member.id, voiceChannel.id);
            await newChannel.permissionOverwrites.edit(member, {
                Connect: false
            });
            setTimeout(() => {
                newChannel.permissionOverwrites.delete(member);
            }, 10000);

            return setTimeout(() => {
                member.voice.setChannel(voiceChannel)
            }, 500);
        }

        const jointocreate = VoiceManager.get(member.id);
        const members = oldChannel?.members.filter((m) => !m.user.bot).map((m) => m.id);
    
        if(jointocreate && oldChannel.id === jointocreate && (!newChannel || newChannel.id !== jointocreate)){
            if(members.length > 0){
                let randomId = members[Math.floor(Math.random() * members.length)];
                let randomMember = guild.members.cache.get(randomId);
                randomMember.voice.setChannel(oldChannel).then((v) => {
                    oldChannel.setName(randomMember.user.username).catch((e) => null);
                    oldChannel.permissionOverwrites.edit(randomMember, {
                        Connect: true,
                        ManageChannels: true
                    });
                });
                VoiceManager.set(member.id, null);
                VoiceManager.set(randomMember.id, oldChannel.id);
            } else {
                VoiceManager.set(member.id, null);
                oldChannel.delete().catch((e) => null);
                if(data2){
                    const trashchannel = await client.channels.fetch(data2.canal);
                    trashchannel.delete();
                    await schema2.deleteOne({ guild: guild.id, user: member.id });
                } else return; 
            }
        }    
    }
}