const { model, Schema } = require('mongoose');
let validate = new Schema({
    guild: String,
    set: String,
    canal: String
});
module.exports = model('validar', validate);