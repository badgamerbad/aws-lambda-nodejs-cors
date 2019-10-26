const handler = require("./handler");

const event = {
    "headers": {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Origin": "http://localhost:8000/",
    }, 
    "body": JSON.stringify({
        "code": "90a159e5cb1d3ee5b58a",
        "state": "randomstring"
    }),
};

handler.githutAccessTokenGenerator(event, {}, (err, res) => {
    console.log(res);
});