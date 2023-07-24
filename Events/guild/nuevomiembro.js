const { AttachmentBuilder, EmbedBuilder } = require("discord.js");
const Canvas = require('canvas');
const { registerFont } = require('canvas');
const bienvenida = require('../../models/bienvenidas');

module.exports = {
    name: "guildMemberAdd",
    once: false,
    async execute(member){
        if(member.user.bot) return;
        const { guild } = member;
        const data = await bienvenida.findOne({ guild: guild.id });
        registerFont("LilitaOne-Regular.ttf", { family: "Lilita One"});
        const applyText = (canvas, text) => {
            const ctx = canvas.getContext("2d");

            let fontsize = 80;

            do {
                ctx.font = `${fontsize -= 10}px Lilita One`;
            }while(ctx.measureText(text).width > canvas.width -300);
            return ctx.font;
        }

        const canvas = Canvas.createCanvas(1028, 468);
        const ctx = canvas.getContext("2d");

        const background = await Canvas.loadImage("./shark.png");

        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.font = applyText(canvas, `Bienvenid@ ${member.user.username}`);

        ctx.fillText(`Bienvenid@ ${member.user.username}`, 514, 360);
        
        ctx.beginPath();
        ctx.arc(514, 161, 124, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();

        const avatar = await Canvas.loadImage(
            member.user.displayAvatarURL({size: 1024, extension: "png"})
        );

        ctx.drawImage(avatar, 388, 35, 250, 250);

        const attachment = new AttachmentBuilder(canvas.toBuffer("image/png"), {
            name: "welcome.png"
        });

        const embed = new EmbedBuilder()
        .setColor(`Red`)
        .setTitle(`Bienvenido a ${guild.name} espera a que te verifiquen.`)
        .setImage("attachment://welcome.png")
        
        if(!data) return;
        const channel = member.guild.channels.cache.get(data.channel);
        await channel.send({ content: `${member}`, embeds: [embed], files: [attachment] });
    }
}