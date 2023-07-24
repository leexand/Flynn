const { model, Schema } = require('mongoose');
let reaction = new Schema({
    guild: String,
    rolname: String,
    rolid: String,
    info: String,
    emoji: String
});
module.exports = model('roles', reaction);