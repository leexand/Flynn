const { Message, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const { readdirSync } = require('fs');
module.exports = {
    name: 'help',
    description: 'Muestra información sobre los comandos disponibles o información detallada sobre un comando',
    aliases: ['ayuda','h','bothelp','helpbot'],
    developer: false,
    cooldown: 5,
    /**
     * @param {Message} message
     */
    async execute(message, client, args, config){
        const categorias = readdirSync('commands');
        if(args[0]){
            const comando = client.prefix.get(args[0].toLowerCase()) || client.prefix.find(c => c.aliases && c.aliases.includes(args[0].toLowerCase()));
            const categoria = categorias.find(categoria => categoria.toLowerCase().endsWith(args[0].toLowerCase()));
            if(comando){
                let embed = new EmbedBuilder()
                .setColor(config.color)
                .setAuthor({ name: `${message.guild.name}`, iconURL: `${message.guild.iconURL({ dynamic: true })}` })
                .setTitle(`Comando ** *${comando.name}* **`)
                .setThumbnail(client.user.displayAvatarURL())
                .setFooter({ text: `${client.user.username}`, iconURL: `${client.user.displayAvatarURL()}` })
                .setTimestamp()

                if(comando.description) embed.addFields({ name: 'Descripción', value: `** *\`\`\`${comando.description}\`\`\`* **` })
                if(comando.aliases && comando.aliases.length >= 1) embed.addFields({ name: 'Alias', value: `*\`${comando.aliases.map(alias => `${alias}`).join(', ')}\`*`, inline: true })
                if(comando.developer === true) embed.addFields({ name: 'Para administradores', value: `*${comando.developer}*`, inline: true })
                if(comando.cooldown >= 1) embed.addFields({ name: 'Tiempo de espera', value: `*${comando.cooldown} segundos*`, inline: true })
                return message.reply({ embeds: [embed] });
            } else if(categoria){
                const comandos = readdirSync(`commands/${categoria}`).filter(archivo => archivo.endsWith('.js'));
                return message.reply({
                    embeds:[
                        new EmbedBuilder()
                        .setColor(config.color)
                        .setAuthor({ name: `${message.guild.name}`, iconURL: `${message.guild.iconURL({ dynamic: true })}` })
                        .setTitle(`**\`\`\`${categoria.split(' ')[1]} ${categoria.split(' ')[0]}\`\`\`**`)
                        .setThumbnail(client.user.displayAvatarURL())
                        .setDescription(comandos.length >= 1 ? `**Comandos:**\n** *\`\`\`${comandos.map(comando => `${comando.replace(/.js/g, '')}`).join(',   ')}\`\`\`* **` : `> ** *No hay comandos en está categoria* **`)
                        .setFooter({ text: `Para ver más info del comando: f!help <comando>` })
                        .setTimestamp()                                
                    ]
                });
            } else {
                return message.reply({ content: `No se ah encontrado \`${args[0]}\`` })
            }
        } else {
            const select = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                .setCustomId('ayudamenu')
                .setPlaceholder('Mis categorías')
                .setMaxValues(5)
                .setMinValues(1)
                .addOptions(categorias.map(categoria => {
                    let object = {
                        label: `${categoria.split(' ')[0]}${categoria.split(' ')[1]}`,
                        value: categoria,
                        description: `Comandos de ${categoria.split(' ')[1]}`,
                    }
                    return object;
                })),
            )
            let ayuda = new EmbedBuilder()
            .setColor(config.color)
            .setAuthor({ name: `${message.guild.name}`, iconURL: `${message.guild.iconURL({ dynamic: true })}` })
            .setTitle(`> Ayuda de *${client.user.username}*`)
            .setThumbnail(client.user.displayAvatarURL())
            .setDescription(`> Mi esquizofrenia y yo formamos el dúo dinámico de la imaginación.\nSiempre estamos preparados para sorprendernos mutuamente con nuevas ideas... ¡y a veces hasta nos sorprendemos a nosotros mismos!`)
            .addFields(
                { name: 'Ver una categoria:', value: `*\`f!help <categoria>\`*`, inline: true },
                { name: 'Ver una comando:', value: `*\`f!help <comando>\`*`, inline: true }
            )
            .setFooter({ text: `No te olvides, mi prefix es: f!` })
            .setTimestamp()
            
            let reply = await message.reply({ embeds: [ayuda], components: [select] });
            const collector = reply.createMessageComponentCollector({
                filter: (i) => (i.isStringSelectMenu()) && i.user && i.message.author.id === client.user.id,
                time: 180e3
            });

            collector.on('collect', (i) => {
                let embeds = [];
                for(const seleccionado of i.values){
                    const comandos = readdirSync(`commands/${seleccionado}`).filter(archivo => archivo.endsWith('.js'));

                    let embed = new EmbedBuilder()
                    .setColor(config.color)
                    .setAuthor({ name: `${message.guild.name}`, iconURL: `${message.guild.iconURL({ dynamic: true })}` })
                    .setTitle(`Lista de comandos para \`\`\`${seleccionado.split(' ')[0]} ${seleccionado.split(' ')[1]}\`\`\``)
                    .setThumbnail(client.user.displayAvatarURL())
                    .setDescription(comandos.length >= 1 ? `** *\`\`\`${comandos.map(comando => `${comando.replace(/.js/g, '')}`).join(', ')}\`\`\`* **` : `> ** *No hay comandos en está categoria* **`)
                    .setFooter({ text: `Para ver más info del comando: f!help <comando>` })

                    embeds.push(embed);
                }
                i.reply({ embeds, ephemeral: true});
            });
            const expired = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                .setCustomId('e')
                .setPlaceholder(`Usa 'f!help' para ejecutar nuevamente`)
                .setDisabled(true)
                .addOptions(
                    new StringSelectMenuOptionBuilder()
                    .setLabel('a')
                    .setValue('a')
                    .setDescription('a')
                )
            )
            collector.on('end', () => {
                reply.edit({ components: [expired] }).catch(() => {});
            });
        }
    }
};