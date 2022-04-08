let fs = require('fs')
console.log(JSON.parse(fs.readFileSync('./system.json', 'utf8')).version)
