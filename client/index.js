var settings = {
    "url": "https://eoaokhk45i.execute-api.us-east-1.amazonaws.com/dev/users/create",
    "method": "GET",
}

$.ajax(settings).done(function (response) {
    console.log(response);
});