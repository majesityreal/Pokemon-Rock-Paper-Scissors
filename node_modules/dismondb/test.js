const { typedexV1, typedexV2, typedexV3, typedexV4 } = require('./src/index.js')

const type = "54564";

/*for (var i=0;i<types.length;i++) {
    if(type == types[i].name.en) {
        console.log(types[i].typemaps.generationOne.attack)
    }
}*/

const response = typedexV4(type)
console.log(response)