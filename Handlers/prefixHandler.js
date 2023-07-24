async function loadPrefix(client){
    const { loadFiles } = require('../Functions/fileLoader');
    const ascii = require('ascii-table');
    const table = new ascii().setHeading('Comandos', 'estado');
    await client.prefix.clear();
    const files = await loadFiles('commands');
    files.forEach((file) => {
        const prefix = require(file);
        client.prefix.set(prefix.name, prefix);
        table.addRow(prefix.name, "🟩");
    });
    return console.log(table.toString(), '\nComandos cargados');
}
module.exports = { loadPrefix };