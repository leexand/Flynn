const { EmbedBuilder, Message } = require("discord.js");
module.exports = {
    name: 'tweet',
    description: 'Crea un tweet falso',
    aliases: ['twittear','tweeter'],
    developer: false,
    cooldown: 20,
    /**
     * @param {Message} message
     */
    async execute(message, client, args, config){
        const tweet = args.join(' ');
        if(!tweet) return await message.reply({ content: '*Que vas a twittear?*' })
        message.delete();
        const avatarUrl = message.author.avatarURL({ extension: "jpg" });

        const canvas = `https://some-random-api.com/canvas/misc/tweet?avatar=${avatarUrl}&displayname=${
            encodeURIComponent(message.author.username)
        }&username=${encodeURIComponent(message.author.username)}&comment=${encodeURIComponent(tweet)}`;

        await message.channel.send({ embeds: [new EmbedBuilder().setColor(config.color).setImage(canvas)] });
    }
}