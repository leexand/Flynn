const { model, Schema } = require('mongoose');
let nivel = new Schema({
    guild: String,
    user: String,
    xp: Number,
    nivel: {
        type: Number,
        default: 0
    },
    limite: {
        type: Number,
        default: 300
    }
});
module.exports = model('niveles', nivel);