import { assert } from "chai"

describe('Chef test', function(){
       
    it('check the dish has valid name.', function(){
        assert.isString("lol", 'string');
    })
    
    it('check for a dish in menu.', function (){
        assert.oneOf("dish", ["dishshshhshs"])
    });
    
});