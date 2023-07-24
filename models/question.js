const { model, Schema } = require('mongoose');
let questions = new Schema({
    guild: String,
    canal: String,
    respuesta: String,
    rol: String
});
module.exports = model('preguntas', questions);