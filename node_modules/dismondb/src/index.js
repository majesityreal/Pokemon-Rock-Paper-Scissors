const v1 = require("./v1/index.json");
const v2 = require("./v2/index.json");
const v3 = require("./v3/index.json");
const v4 = require("./v4/index.json");

module.exports = {
    /**
    * Takes a type name and outputs information on that type
    * @method
    * @name typedex
    * @param {String} typeName - The name of the Type
    * @param {Number} version - The version of the typedex to use 1-4 (optional)
    * 
    * @returns {Type}
    */
    typedex: function( typeName, version ) {
        if(version === 1) {
            if(typeName.toLowerCase() === "bug") return v1.bug;
            if(typeName.toLowerCase() === "dark") return v1.dark;
            if(typeName.toLowerCase() === "dragon") return v1.dragon;
            if(typeName.toLowerCase() === "electric") return v1.electric;
            if(typeName.toLowerCase() === "fairy") return v1.fairy;
            if(typeName.toLowerCase() === "fighting") return v1.fighting;
            if(typeName.toLowerCase() === "fire") return v1.fire;
            if(typeName.toLowerCase() === "flying") return v1.flying;
            if(typeName.toLowerCase() === "ghost") return v1.ghost;
            if(typeName.toLowerCase() === "grass") return v1.grass;
            if(typeName.toLowerCase() === "ground") return v1.ground;
            if(typeName.toLowerCase() === "ice") return v1.ice;
            if(typeName.toLowerCase() === "normal") return v1.normal;
            if(typeName.toLowerCase() === "poison") return v1.poison;
            if(typeName.toLowerCase() === "psychic") return v1.psychic;
            if(typeName.toLowerCase() === "rock") return v1.rock;
            if(typeName.toLowerCase() === "steel") return v1.steel;
            if(typeName.toLowerCase() === "water") return v1.water;
            return "Not Found";
        } else if(version === 2) {
            if(typeName.toLowerCase() === "bug") return v2.bug;
            if(typeName.toLowerCase() === "dark") return v2.dark;
            if(typeName.toLowerCase() === "dragon") return v2.dragon;
            if(typeName.toLowerCase() === "electric") return v2.electric;
            if(typeName.toLowerCase() === "fairy") return v2.fairy;
            if(typeName.toLowerCase() === "fighting") return v2.fighting;
            if(typeName.toLowerCase() === "fire") return v2.fire;
            if(typeName.toLowerCase() === "flying") return v2.flying;
            if(typeName.toLowerCase() === "ghost") return v2.ghost;
            if(typeName.toLowerCase() === "grass") return v2.grass;
            if(typeName.toLowerCase() === "ground") return v2.ground;
            if(typeName.toLowerCase() === "ice") return v2.ice;
            if(typeName.toLowerCase() === "normal") return v2.normal;
            if(typeName.toLowerCase() === "poison") return v2.poison;
            if(typeName.toLowerCase() === "psychic") return v2.psychic;
            if(typeName.toLowerCase() === "rock") return v2.rock;
            if(typeName.toLowerCase() === "steel") return v2.steel;
            if(typeName.toLowerCase() === "water") return v2.water;
            return "Not Found";
        } else if(version === 3) {
            if(typeName.toLowerCase() === "bug") return v3.bug;
            if(typeName.toLowerCase() === "dark") return v3.dark;
            if(typeName.toLowerCase() === "dragon") return v3.dragon;
            if(typeName.toLowerCase() === "electric") return v3.electric;
            if(typeName.toLowerCase() === "fairy") return v3.fairy;
            if(typeName.toLowerCase() === "fighting") return v3.fighting;
            if(typeName.toLowerCase() === "fire") return v3.fire;
            if(typeName.toLowerCase() === "flying") return v3.flying;
            if(typeName.toLowerCase() === "ghost") return v3.ghost;
            if(typeName.toLowerCase() === "grass") return v3.grass;
            if(typeName.toLowerCase() === "ground") return v3.ground;
            if(typeName.toLowerCase() === "ice") return v3.ice;
            if(typeName.toLowerCase() === "normal") return v3.normal;
            if(typeName.toLowerCase() === "poison") return v3.poison;
            if(typeName.toLowerCase() === "psychic") return v3.psychic;
            if(typeName.toLowerCase() === "rock") return v3.rock;
            if(typeName.toLowerCase() === "steel") return v3.steel;
            if(typeName.toLowerCase() === "water") return v3.water;
            return "Not Found";
        } else {
            if(typeName.toLowerCase() === "bug") return v4.bug;
            if(typeName.toLowerCase() === "dark") return v4.dark;
            if(typeName.toLowerCase() === "dragon") return v4.dragon;
            if(typeName.toLowerCase() === "electric") return v4.electric;
            if(typeName.toLowerCase() === "fairy") return v4.fairy;
            if(typeName.toLowerCase() === "fighting") return v4.fighting;
            if(typeName.toLowerCase() === "fire") return v4.fire;
            if(typeName.toLowerCase() === "flying") return v4.flying;
            if(typeName.toLowerCase() === "ghost") return v4.ghost;
            if(typeName.toLowerCase() === "grass") return v4.grass;
            if(typeName.toLowerCase() === "ground") return v4.ground;
            if(typeName.toLowerCase() === "ice") return v4.ice;
            if(typeName.toLowerCase() === "normal") return v4.normal;
            if(typeName.toLowerCase() === "poison") return v4.poison;
            if(typeName.toLowerCase() === "psychic") return v4.psychic;
            if(typeName.toLowerCase() === "rock") return v4.rock;
            if(typeName.toLowerCase() === "steel") return v4.steel;
            if(typeName.toLowerCase() === "water") return v4.water;
            return "Not Found";
        }
    },
}
