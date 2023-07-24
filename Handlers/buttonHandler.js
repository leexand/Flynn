async function loadButtons(client){
    const { loadFiles } = require('../Functions/fileLoader');
    await client.buttons.clear();
    const files = await loadFiles('components');
    files.forEach((file) => {
        const button = require(file);
        client.buttons.set(button.data.name, button);
    });
    return console.log('botones cargados');
}
module.exports = { loadButtons };