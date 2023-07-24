module.exports = {
    data: {
        name: '1124210708960264243'
    },
    async execute(interaction, client, config){
        const rol = interaction.guild.roles.cache.get('1124210708960264243');
        const user = interaction.user;
        if(interaction.member.roles.cache.has('1124210708960264243')){
            return interaction.member.roles.remove(rol).then((member) => {
                interaction.reply({ content: `**${user.username}** se te ha removido el rol ${rol}`, ephemeral: true });
            });
        }
        return interaction.member.roles.add(rol).then((member) => {
            interaction.reply({ content: `**${user.username}** se te ha agregado el rol ${rol}`, ephemeral: true });
        });
    }
}   