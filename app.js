var express = require("express");
var bodyParser = require("body-parser");
var request = require("request");

var app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));

var currencies = [];
var symbols = {};

request("https://exchangeratesapi.io/api/latest?base=USD", function(error, response, body) {
   if (error) {
       console.log("error occurred while trying to retrieve currency information");
   }
   else {
       request("https://openexchangerates.org/api/currencies.json", function(err, resp, currencyBody) {
          if (err) {
            console.log("error occurred while trying to retrieve currency information");
          }
          else {
              symbols = JSON.parse(currencyBody);
              var symbolBody = JSON.parse(body);
              for (var symbol in symbolBody.rates) {
                  var currency = {
                       symbol: symbol,
                       name: symbols[symbol]
                   };
                   
                   currencies.push(currency);
              }
          }
       });
   }
});

app.get("/", function(request, response) {
   response.render("home", {data: null, currencies: currencies}); 
});

app.get("/exchangeRates", function(request, response) {
   response.render("home", {data: null, currencies: currencies}); 
});

app.post("/exchangeRates", function(req, resp) {
    var requestBody = parseBody(req.body);
    var url = "https://exchangeratesapi.io/api/latest?symbols=" + requestBody.to + "&base=" + requestBody.from;
    
    request(url, function(error, response, body) {
        if (error) {
            console.log("error occurred");
        }
        else {
            var parsedBody = JSON.parse(body);
            var data = createResponse(requestBody, parsedBody);
            resp.render("home", {data: data, currencies: currencies});
        }
    });
});

app.get("/*", function(request, response) {
   response.send("Page not configured."); 
});

function parseBody(requestBody) {
    var from = requestBody.from.toUpperCase();
    var to = requestBody.to.toUpperCase();
    
    var amount = 1;
    if (requestBody.amount) {
        amount = parseInt(requestBody.amount);
    }
    
    return {from, to, amount};
}

function createResponse(requestBody, parsedBody) {
    return {
        from: requestBody.from,
        fromSymbol: symbols[requestBody.from],
        to: requestBody.to,
        toSymbol: symbols[requestBody.to],
        fromAmount: requestBody.amount,
        toAmount: requestBody.amount * parsedBody.rates[requestBody.to]
    }
}


app.listen(process.env.PORT, process.env.IP, function() {
   console.log("Server has been started"); 
});