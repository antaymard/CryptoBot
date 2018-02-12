const express = require('express');
const path = require('path');
const app = express();
const colors = require('colors');
const request = require('request');
var fetch = require('node-fetch');
var ontime = require('ontime'); // Lance des fonctions à heure donnée

var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

const config = require('./config');

// BITTREX CONFIG SHIT GOES HERE
const bittrex = require('node-bittrex-api');
bittrex.options({
  'apikey' : config.apikey,
  'apisecret' : config.apisecret
});

colors.setTheme({
    important : ['bgWhite', 'black'],
    success : ['green'],
    error : ['bgRed', 'white'],
    operations : ['bold', 'yellow'],
    info : ["grey"]
  })

// GLOBAL VALUES ===============================================================
var state = {
  // bitcoin : {
  //   price_usd : null,
  // }
}

/*
WALLET DATA
  price_usd
  price_btc
  wallet => object avec true false
  date ??????
*/


// TESTS =======================================================================

// TODO: Récupérer la liste des monnaies tradable
// TODO: Créer un array contenant toutes les monnaies
// TODO: Enregistrer dans base de données
// TODO: Parcourir l'array, calculer la moyenne à partir des candles sur les n-X dernières valeurs
// TODO: Comparer la moyenne à la dernière valeurs
// TODO: Placer la monnaie dans le wallet 'forte croissance'


app.post('/api/trade', (req, res) => {
  var _r = req.body;
  console.log(_r);

  console.log('launching passTradeOrder'.info);

  passTradeOrder(_r.operation, 'BTC', _r.currency, _r.amount, _r.price)
    .then(_d => {
      console.log('then answer : '.success);
      console.log(_d);
      checkIfTradeOrderSucceed(_r.currency, _d.result.OrderId)
        .then(response => {
          console.log('testing'.important);
          console.log(response);
          res.json(response);
        })
        .catch(err => {
          console.log('catched error');
          console.log(err);
          res.json(err);
        })
    }).catch(err => {
      console.log('Error passing trading order'.error);
      console.log('%s'.error, err.message);
      res.json(err);
    })
})

// _qu est la quantité en BTC
function trade (_operation, _refCurr, _curr, _qu, _rate) {
    // console.log('launching passSellOrder'.important);
    //
    // passTradeOrder(_operation, _refCurr, _curr, _qu, _rate)
    //   .then(_d => {
    //     console.log('then answer : '.success);
    //     console.log(_d);
    //   }).catch(err => {
    //     console.log('Error passing trading order'.error);
    //     console.log('%s'.error, err.message);
    //   })
}

// function checkIfTradeOrderSucceed (_uuid) {
//   console.log('checking uuid for %s'.important, _uuid);
//   return new Promise((resolve, reject) => {
//     var _url = 'https://bittrex.com/Api/v2.0/auth/orders/GetOrder&uuid=' + _uuid;
//     bittrex.sendCustomRequest( _url, function( data, err ) {
//       if (err) {
//         reject(err);
//         console.log('error checking UUID'.error);
//         return console.error(err);
//       }
//       console.log('UUID data is'.success);
//       console.log(data);
//     }, true);
//   })
// }

function checkIfTradeOrderSucceed (_curr, _uuid) {
  console.log('checking uuid for %s'.important, _uuid);
  return new Promise((resolve, reject) => {
    bittrex.getorderhistory({market:'BTC-' + _curr}, function( data, err ) {
      if (err) {
        reject(err);
        return console.error("Error fetching uuid for %s :".error, _currency);
      }
      if (data && data.result) {
        if (data.result[0].OrderUuid == _uuid) {
          console.log('This is a match !!'.success);
          resolve({ message : 'success' })
        } else {
          console.log('no match'.error);
          reject({ message : 'order was not passed' })
        }
      } else {
        console.log('no match'.error);
        reject({ message : 'order was not passed' })
      }
    });
  })
}


// Promise passe ordre d'achat à l'API Bittrex /!\ _qu
function passTradeOrder (_operation, _refCurr, _curr, _qu, _rate) {
  return new Promise((resolve, reject) => {
    if (_curr == 'BTC') {
      console.log("Can't buy BTC".error);
      reject({message : "Can't trade BTC !" });
    }
    if (_operation == 'BUY') {
      console.log("sending Buy Order to BITTREX".important);
      // ici _qu est la quantité en BTC (monnaie de ref)
      // Conversion en eth
      var _currEq = Number((_qu*0.9975/_rate).toFixed(8));
      // console.log("operation : " + _operation);
      // console.log('_refCurr: ' + _refCurr);
      // console.log('_curr : ' + _curr);
      // console.log('_qu : ' + _qu);
      // console.log('_rate ' + _rate);
      // console.log("_currEq = ".important, _currEq);
      bittrex.tradebuy({
        MarketName: _refCurr + '-' + _curr,
        OrderType: 'LIMIT',
        Quantity: _currEq,
        Rate: _rate,
        TimeInEffect: 'IMMEDIATE_OR_CANCEL', // supported options are 'IMMEDIATE_OR_CANCEL', 'GOOD_TIL_CANCELLED', 'FILL_OR_KILL'
        ConditionType: 'NONE', // supported options are 'NONE', 'GREATER_THAN', 'LESS_THAN'
        Target: 0, // used in conjunction with ConditionType
      }, function( data, err ) {
        if (err) {
          reject(err);
          console.log('Error buying : %s'.error, err.message);
          return console.log(err);
        } else {
          console.log('Buy Traded success'.success);
          // console.log( data );
          resolve(data);
        }
      });
    } else if (_operation == 'SELL') {
      console.log("sending Sell Order".important);
      // ici _qu est la quantité en monnaie tradée (ex ETH)
      bittrex.tradesell({
        MarketName: _refCurr + '-' + _curr,
        OrderType: 'LIMIT',
        Quantity: _qu,
        Rate: _rate,
        TimeInEffect: 'IMMEDIATE_OR_CANCEL', // supported options are 'IMMEDIATE_OR_CANCEL', 'GOOD_TIL_CANCELLED', 'FILL_OR_KILL'
        ConditionType: 'NONE', // supported options are 'NONE', 'GREATER_THAN', 'LESS_THAN'
        Target: 0, // used in conjunction with ConditionType
      }, function( data, err ) {
        if (err) {
          reject(err);
          console.log('Error selling : %s'.error, err.message);
          return console.log(err);
        } else {
          console.log('Sell Traded success'.success);
          // console.log( data );
          resolve(data);
        }
      });
    }
  })
}

function getAllMarketsName () {
  request('https://bittrex.com/api/v1.1/public/getmarkets', (err, response, body) => {
  body = JSON.parse(body);
  var _r = body.result;
  console.log(_r.length);
  })
}

//==============================================================================
//---------------------- MY API SHIT GOES HERE ---------------------------------

// Récupère les datas à afficher avant de trader une monnaie = Bid Ask Balance
app.get('/api/getPreTransactionInfo/:currency', (req, res) => {
  var _curr = req.params.currency;
  var _promises = [];
  // 1- Récupère la balance en BTC
  _promises.push(getCurrencyBalance('BTC'));
  // 2- Récupère la balance de la monnaie à trader
  _promises.push(getCurrencyBalance(_curr));
  // 3- Récupère Bid/Ask de la monnaie à trader
  _promises.push(getCurrencyCours(_curr));
  // 4- Envoie le tout
  Promise.all(_promises)
    .then((result) => {
      res.json(result);
    })
});

// Récupère l'historique des mes transactions (BUY et SELL) pour une monnaie donnée
app.get('/api/getOrderHistory/:currency', (req, res) => {
  var _currency = req.params.currency;
  bittrex.getorderhistory({market:'BTC-' + _currency}, function( data, err ) {
    if (err) {
      return console.error("Error fetching OrderHistory for %s :".error, _currency + JSON.stringify(err.message, null, 2));
    }
    res.json(data.result);
  });
});

// Récupère l'historique des cours (candles) pour une currency donnée
app.get('/api/getCandle/:currency/:selectedDateForCharts', (req, res) => {
  getCurrencyCandles(req.params.currency, req.params.selectedDateForCharts)
    .then(result => {
      res.json(result)
    })
})

// Récupère le cours du BTC
app.get('/api/getBitcoinInfo', (req, res) => {
  getCurrencyCours('BTC').then(_r => res.json(_r.result.Last))
})

// Pour tracer le graphe d'historique de la valeur du portefeuille
app.get('/api/getWalletArchive/:selectedDateForCharts', (req, res) => {
  var _timeSelected = req.params.selectedDateForCharts;
  var _now = new Date().getTime()/1000; // Définit maintenant en timestamp
  var _timeArray = ['3h', '6h', '12h', '1j', '3j', '7j', '1m', '3m', '6m'];
  var _timeIndex = _timeArray.indexOf(_timeSelected); //Dis à quelle position est le temps demandé
  var _delta=[
    3,
    6,
    12,
    24,
    72,
    168,
    720,
    2160,
    4320
  ]; // Définit sur cb d'heures je veux les données
  _now = _now-(_delta[_timeIndex]*60*60);
  _now = new Date(_now*1000);

  WalletArchive.find({"date":{'$gte' : _now}}, (err, result) => {
    if (err) return console.error('Error recovering WalletArchive '.error, err);
    res.json(result);
  })
})

// Récupère balance et cours pour une monnaie recherchée
app.get('/api/getResearchedCurrencyInfo/:currency', (req, res) => {
  var _curr = req.params.currency;
  console.log(_curr);
  var _promises = [];
  _promises.push(getCurrencyBalance(_curr));
  _promises.push(getCurrencyCours(_curr));

  Promise.all(_promises)
    .then(response => res.json(response))
})

// V2

app.get('/api/getAllBalances', (req, res) => {
  getAllBalances().then(response => res.json(response));
})

app.get('/api/getCurrencyCours/:currency', (req, res) => {
  var _curr = req.params.currency;
  getCurrencyCours(_curr)
    .then(_r => res.json(_r.result));
})

//==============================================================================
//--------------------------- MY PROMISES -------------------------------------

// PROMISE Récupère le cours de la monnaie indiquée (ETH et BTC ok)
function getCurrencyCours (_curr) {
  console.log('Getting cours for %s'.info, _curr);
  return new Promise((resolve, reject) => {
    var _market;
    if (_curr == 'BTC') {
      _market = 'USDT-BTC';
    } else {
      _market = 'BTC-'+_curr;
    }
    request('https://bittrex.com/api/v1.1/public/getticker?market='+ _market,
    function (err, response, body) {
      if (err) {
        console.log('Error fetching cours'.error, err);
        reject(err);
      }
      if (response) {
        if (response.statusCode == 200) {
          body = JSON.parse(body);
          console.log('Cours received for %s'.info, _curr);
          //console.log(body);
          resolve(body);
        }
      }
    });
  })
}

// PROMISE de récupération d'une balance pour une monnaie
function getCurrencyBalance(_curr) {
  return new Promise((resolve, reject) => {
    console.log('Getting Balance for %s'.info, _curr);
    bittrex.getbalance({ currency : _curr }, function( data, err ) {
      if (err) {
        console.error('Error fetching Balance for ' + _curr + ' : ' + err);
        reject(err);
      } else {
        console.log('Balance received for %s'.info, _curr);
        console.log(data);
        resolve(data);
      }
    });
  })
}

// PROMISE de récupération des candles pour une monnaie et à partir d'une "date" donnée
function getCurrencyCandles(_curr, _selectedDate) {
  return new Promise((resolve, reject) => {
    console.log("Getting Candle for %s".info, _curr);
    var _timeSelected = _selectedDate;

    var _now = new Date().getTime()/1000; // Définit maintenant en timestamp

    var _timeArray = ['3h', '6h', '12h', '1j', '3j', '7j', '1m', '3m', '6m'];
    var _timeIndex = _timeArray.indexOf(_timeSelected); //Dis à quelle position est le temps demandé
    var _delta=[
      3,
      6,
      12,
      24,
      72,
      168,
      720,
      2160,
      4320
    ]; // Définit sur cb d'heures je veux les données

    var _density=[
      "oneMin",
      "fiveMin",
      "fiveMin",
      "thirtyMin",
      "thirtyMin",
      "hour",
      "day",
      "day",
      "day"
    ]; // Définit l'intervalle (fréquence) des candles demandées

    _now = _now-(_delta[_timeIndex]*60*60); // _now = seuil temporel après lequel garder les valeurs

    if (!_tickInterval) {
      var _tickInterval = _density[_timeIndex];
    }
    var _market;
    if (_curr == 'BTC') {
      _market = 'USDT-' + _curr;
    } else {
      _market = 'BTC-' + _curr;
    }
      request('https://bittrex.com/Api/v2.0/pub/market/GetTicks?marketName=' + _market
      +'&tickInterval=' + _tickInterval + '&_=1500915289433',
      function (err, response, body) {
        if (err) {
          reject(err);
          return  console.error("ERR recovering candles ", err);
        }
        if (body) {
          body = JSON.parse(body); // transforme la réponse en JSON
          if (body.result) {
            console.log('Candles received for %s'.info, _curr);
            var _candleArray = body.result;
            // Ne garde que les données dans la plage voulue (sur les _delta derniers jours)
            var _candleArray = _candleArray.filter(data => new Date(data.T).getTime()/1000 >= _now);
            resolve(_candleArray);
            // res.json(_candleArray);
          } else {
            console.log('No Candles for %s'.important, _curr);
            resolve([]);
          }
        }
      })//-----

  })
}

// Renvoie un array d'objets contenant toutes les cryptos avec leurs cours et le total Eq en BTC
  // {_notEmptyWallet : [{ Currency: 'MCO',
  //     Balance: 2.78938619,
  //     Available: 2.78938619,
  //     Pending: 0,
  //     CryptoAddress: null,
  //     Cours: 0.00105001,
  //     BTCEq : O.004563    }, ... ],
  //  _totalBTCEq : 0.004563 }
function getBalancesNCours() {
  return new Promise((resolve, reject) => {
    var _totalBTCEq = 0;
    bittrex.getbalances(function( _data, err ) {
      if (_data) {
        if (_data.success == true) {

          // Ne garder que les crypto à balance non nulle
          var _notEmptyWallet = _data.result.filter(_wallet => _wallet.Currency !== 'USDT' );
          _notEmptyWallet = _notEmptyWallet.filter(_wallet => _wallet.Balance > 0.000001 );

          // == Récupère les cours de l'array de monnaies non nulles
          var _promises = [];
          for (var i in _notEmptyWallet) {
            _promises.push(getCurrencyCours (_notEmptyWallet[i].Currency));
          }
          // == Récupère aussi le cours du BTC
          _promises.push()
          Promise.all(_promises)
          .then((result) => {
            for (var _i in _notEmptyWallet) {
              if (result[_i].result) {
                if (_notEmptyWallet[_i].Currency == 'BTC') {
                  _notEmptyWallet[_i].Cours = 1;
                } else {
                  _notEmptyWallet[_i].Cours = result[_i].result.Last;
                }
                _notEmptyWallet[_i].BTCEq = _notEmptyWallet[_i].Cours * _notEmptyWallet[_i].Balance;
                _totalBTCEq += _notEmptyWallet[_i].Cours * _notEmptyWallet[_i].Balance
              } else {
                _notEmptyWallet[_i].Cours = 1;
              }
            }
          }).then(() => {
            resolve({_notEmptyWallet, _totalBTCEq});
          })
        } else if (err){
          reject(err);
          return console.log("There was an error recovering balance ".error + err);
        }
      }
    });
  })
}

// Récupère le portefeuille et les balances
  // [{Currency : ETH,
  //  Balance , Available, Pending, Crypto...},{}]
function getAllBalances() {
  return new Promise((resolve, reject) => {
    bittrex.getbalances(function (_data, err) {
      if (_data) {
        if (_data.success == true) {
          // Ne garder que les crypto à balance non nulle
          var _notEmptyWallet = _data.result.filter(_wallet => _wallet.Currency !== 'USDT' );
          _notEmptyWallet = _notEmptyWallet.filter(_wallet => _wallet.Balance > 0.000001 );
          resolve(_notEmptyWallet);
        }
      }
      if (err) {
        console.error("Error getting all Balances ", err);
        reject(err);
      }
    })
  })
}

//========================== NOT PROMISES ======================================

// Transférer argent vers une autre adresse crypto
function withdraw(_curr, _qu, _addr) {
  bittrex.withdraw({ currency : _curr, quantity : _qu, address : _addr }, function( data, err ) {
    if (err) {
      return console.log(err);
    }
    console.log( data );
  });
}

//==============================================================================
//==============================================================================
//                            SERVER SIDE
//==============================================================================
//==============================================================================


//==============================================================================
//------------------------ DATABASE CONFIG -------------------------------------

var mongoose = require('mongoose');
mongoose.connect(config.database);
var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('Successfully connected to Crypto Database'.success);
});

// TODO: créer le schéma
var WalletArchive = mongoose.model('WalletArchive', {
  date : Date,
  currencyArray : Array,
  totalBTCEq : Number,
  total$Eq : Number,
  coursBTC : Number
});

var localState = {
  wallet : []
}



//==============================================================================
//---------------------- MY SERVER FUNCTIONS -----------------------------------


// Archivage du portefeuille
// archiveCurrentWalletPerf();
function archiveCurrentWalletPerf() {
  var _promises = [ getBalancesNCours(), getCurrencyCours('BTC')];
  Promise.all(_promises)
    .then(result => {
      console.log("Saving Wallet Archive...".important);
      new WalletArchive({
        date : new Date(),
        currencyArray : result[0]._notEmptyWallet,
        totalBTCEq : result[0]._totalBTCEq,
        coursBTC : result[1].result.Last,
        total$Eq : result[0]._totalBTCEq*result[1].result.Last
      }).save().then(
        console.log('Wallet has been saved'.success)
      ).catch(error => console.log('Error saving Wallet Archive '.error + error))
    })
}
// Lance l'archivage toutes les heures XX:00 et XX:30
ontime({
    cycle: [ '00:00', '30:00' ]
}, function (ot) {
    archiveCurrentWalletPerf();
    ot.done()
    return
})






//==============================================================================
//----------------------------- SERVER BOOTING ---------------------------------

// Serve static files from React app
app.use(express.static(path.join(__dirname, 'client/bluid')));

// Other requests that triggers the index display
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname+'/client/build/index.html'));
});

const port = process.env.PORT || 8000;
app.listen(port);

console.log('Express server listening on %s'.success, port);
