// import { expect } from 'chai';
// import { request } from 'request';
// let url;

// beforeEach(async () => {
// url = 'http://localhost:3000/';
// });

// describe('Calculate', () => {

//     it('joins matchmaking', async () => {
//         request(url, function (error, response, body) {
//             expect(response.statusCode).to.equal(200);
//             expect(body[0]).to.equal(9);
//             done();
//         });
//     });


//     it('calculate the wrong sum of two values', async () => {
//         request(url + '?num1=5&num2=6', function (error, response, body) {
//             expect(response.statusCode).to.equal(200);
//             expect(body[0]).to.not.equal(9);
//             done();
//         });
//     });

// });