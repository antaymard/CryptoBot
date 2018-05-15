const express = require('express');
const path = require('path');
const app = express();
const colors = require('colors');
const request = require('request');
var fetch = require('node-fetch');
var ontime = require('ontime'); // Lance des fonctions à heure donnée
const fs = require('fs');
const mathjs = require('mathjs');
const io = require('socket.io')();


var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
const util = require('util');

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
    operations : ['bgCyan', 'black'],
    info : ["grey"],
    result : ['magenta']
  })

// GLOBAL VALUES ===============================================================

var isOnlyWorkingVersion = true;

var algoPumpResult = {
  metadata : {
    dateOfLastLaunch : null,
    //isWorking : false,        // ??
    // iterationNumber : 0 // How many times the process has been
  },
  algoParameters : {
    // TODO : Fill this area
  },
  results : [
    // { market : 'BTC-XXX',
    //   rawData : {
    //     fiveMinCandles : [],
    //     lastFiveMinCandleVolume : null,
    //     //lastFiveMinCandleDate : null, // ???
    //     oneMinCandles : [],
    //     calculatedLastFiveMinCandle : {}
    //   },
    //   calculatedData : {
    //     meanVolume : 0,
    //     varianceVolume : 0,
    //     normVarianceVolume : 0,
    //     nbOfDiscoutinuousFiveMin : 0,
    //     lastOnMeanRatio : 0,
    //     lastFiveMinCandleIsPositive : true,
    //   },
    //   decisionData : {
    //
    //   },
    //   metadata : {                 // a adapter
    //     dateOfLastLaunch : 'DATE',
    //     iterations
    //     ??????????????????????????
    //     nbOfAchievedOperations : 0,
    //     totalNbOfOperations : 10,
    //     currentStep : null,
    //     hasBeenAnalyzed : false,
    //     isWorking : true,
    //     hasErrored : false,
    //     notProcessedBecause : null,   // non processed car déjà en portefeuille, ou blacklistée par ex
    //   }
    // }
  ]
};


// var _bouga = 'c2dcb79d-57ea-4b17-895c-a6f8663390a9';
  // bittrex.sendCustomRequest( 'https://bittrex.com/api/v1.1/account/getorder?uuid=' + _bouga, function( data, err ) {
  //   if (err) {
  //     console.log('TEST'.error);
  //     return console.log(err.message);
  //   }
  //   console.log('TEST'.success);
  //   console.log( data );
  // }, true );

// BOOTING SEQUENCE ======

ReadAlgoPumpOptionsTxt()
  .then(() => {
    //constitue la liste des currencies
    getAllMarketsName(algoPumpResult.algoParameters.currencyFilter)
      .then(() => {
        //getFiveMinCandles('BTC-EMC2', algoPumpOptions);
        algoPumpResult.metadata.iterations = 0;
        launchPumpAnalyse(false);
      })
  })
  .catch(err => {
    console.log('ERROR in booting sequence'.error, err)
  });


// TESTS =======================================================================

// bittrex.getmarketsummary( { market : 'BTC-LTC'}, function( data, err ) {
//   console.log( data );
// });


function launchPumpAnalyse (isOldPump) {
  // Refresh algo metadata
  progress = 0;
  progressError = 0;
  testing = 0.

  algoPumpResult.metadata.dateOfLastLaunch = new Date();
  algoPumpResult.metadata.iterations ++;

  algoPumpResult.metadata.numberOfErrors = 0;
  algoPumpResult.metadata.numberOfSuccess = 0;
  algoPumpResult.metadata.numberOfMarkets = allCurrencyArray.length;

  // allCurrencyArray = ['BTC-LTC'];

  // Launch Analysis
  for (var _i in allCurrencyArray) {
    getFiveMinCandles(allCurrencyArray[_i],
      algoPumpResult.algoParameters, isOldPump)
      //  .then((candlesToConsider) => {
    .then((_object) => {
        // Lance analyse des candles de 5 min
        //  calculateFiveMinData(allCurrencyArray[_i], candlesToConsider);
       calculateFiveMinData(_object);
        //console.log(util.inspect(algoPumpResult, false, null))
        return true;
    })
    .catch((err) => {
      console.log("Error in launchPumpAnalyse()".error);
      progressError ++;
      return console.log(err)
    })
  }
}

// DONE ========================================================================
function getFiveMinCandles (market, options, isOldPump) {
  //console.log('== Getting 5 min Candles for %s', market.toUpperCase());
  return new Promise((resolve, reject) => {
    request('https://bittrex.com/Api/v2.0/pub/market/GetTicks?marketName=' + market
      +'&tickInterval=' + "fiveMin" + '&_=1500915289433',
    (err, response, body) => {
      if (err) {
        console.log('Error requesting fiveMin Candles for %s'.error, market);
        console.log(err);
        return reject(err);
      }

      if (body) {
        var body = JSON.parse(body);
        if (body.result && body.result.length !== 0) {
          // console.log("   5 min candles recieved for %s".info, market);

          var candlesUnsliced = body.result;

          if (isOldPump) {
            candlesUnsliced = candlesUnsliced.filter(a => a.T <= options.dateOfPump);
            // console.log("DATEOFPUMPACTIVATED ==== ==== ==== ==== ====".operations);
            // console.log("date of pump is " + options.dateOfPump);
            // console.log(body.result.slice(-1));
            // console.log(candlesUnsliced.slice(-1));
          }
          // Ne garder que les X dernières candles
          var candlesToConsider = [];
          if (options.nbPeriodsTill == 0) {
            candlesToConsider = candlesUnsliced.slice(-options.nbPeriodsFrom);
          } else {
            candlesToConsider = candlesUnsliced.slice(-options.nbPeriodsFrom, -options.nbPeriodsTill);
          }
          // console.log('   There are %s 5minCandles to consider'.result, candlesToConsider.length);
          // END =============== RESOLVE
          var _object = {
            market : market,
            rawData : {
              fiveMinCandles : candlesToConsider,
              lastFiveMinCandleVolume : candlesToConsider[candlesToConsider.length-1] ? candlesToConsider[candlesToConsider.length-1].BV : 0
            }
          };
          resolve(_object);

        } else {
          reject("getFiveMinCandles() - no body recieved for " + market.toUpperCase() + body);
        }
      }
    })
  })
}

// WIP            WIP           WIP         WIP         WIP         WIP         WIP
function getOneMinCandles(market, lastCandle) {
  console.log('== Getting 1 min Candles for %s', market.toUpperCase());
  return new Promise((resolve, reject) => {
    request('https://bittrex.com/Api/v2.0/pub/market/GetTicks?marketName=' + market
      +'&tickInterval=' + "oneMin" + '&_=1500915289433',
    (err, response, body) => {
      if (err) {
        console.log('Error requesting oneMin Candles for %s'.error, market);
        console.log(err);
        return reject(err);
      }
      if (body) {
        var body = JSON.parse(body);
        if (body.result && body.result.length !== 0) {
          // Ne traiter que les candles postérieures à la dernière candle de 5 min
          //console.log("   1 min candles recieved for %s".info, market);

          var lastFiveMinCandleDate = new Date(lastCandle.T);
          var lastFiveMinCandleDateMin = Number(lastFiveMinCandleDate.toString().slice(19,21)) + 5;
          //console.log('   Last 5min Candle is %s min'.result, lastFiveMinCandleDateMin);

          var nowDate = new Date();
          nowDate.setHours(lastFiveMinCandleDate.getHours()); // mettre sur le même fuseau horaire USELESS ???
          var nowDateMin = Number(nowDate.toString().slice(19,21));
          //console.log('   Now is %s min'.result, nowDateMin);

          var diff = nowDateMin - lastFiveMinCandleDateMin;
          //console.log("   Diff is %s".result, diff);

          // Récupère les #diff dernières oneMin Candles
          var oneMinCandlesToConsider;
          if (diff <= 0) {
            oneMinCandlesToConsider = [];
            //console.log("   La dernière fiveMinCandle comprend bien now. Pas besoin d'extrapolation sur les oneMinCandles".result);
            // TODO  ETUDE DE LA DERNIERE 5MINCANDLE POUR EVITER FAUX POSITIFS
          } else if (diff > 0) {
            oneMinCandlesToConsider = body.result.slice(-diff);               // To change into filter
            //console.log("== Etude des %s dernières oneMinCandles...", diff);
            // TODO ETUDE DES CANDLES ONE MIN
          }
          // console.log(oneMinCandlesToConsider);
        } else {
          console.log("getOneMinCandles() - no body recieved for %s".error, market.toUpperCase());
          reject();
        }
      }
    })
  })
}

// DONE ========================================================================
function calculateFiveMinData (_object) { // Variance = STD en vrai
  var candles = _object.rawData.fiveMinCandles;

  // console.log('== CalculateFiveMinData() launched based on %s candles for %s', candles.length, market.toUpperCase());
  var candlesVolumes = candles.map(a => a.BV);
  // Calculate mean
  var candlesVolumeMean = mathjs.mean(candlesVolumes);
  // console.log("   Mean is %s".result, candlesVolumeMean);
  // Calculate Standard Deviation
  var candlesVolumeVariance = mathjs.std(candlesVolumes);
  // console.log("   Variance is %s".result, candlesVolumeVariance);
  // STD / AVG UTILE ?
  var normalizedVariance = candlesVolumeVariance / candlesVolumeMean;
  // console.log("   Normalized var is %s".result, normalizedVariance);

  // Check if continious
  var isDiscontinious = 0;
  var candlesTimes = candles.map(a => new Date(a.T));
  // console.log("Attention, les times ont perdu 2 heures dans la conv String->Date".info)
  //console.log(candlesTimes);
  for (var _i = 0; _i < candlesTimes.length-1; _i++) {
    //console.log('Time between (300000)', candlesTimes[_i+1] - candlesTimes[_i])
    if (candlesTimes[_i+1] - candlesTimes[_i] !== 300000) {
      //console.log('returning false')
      isDiscontinious++;
    }
  }
  // console.log("   has been Discontinious %s times".result, isDiscontinious);

  // check if lastCandleIsPositive
  var lastCandleIsPositive = candles[candles.length-1].C - candles[candles.length-1].O > 0;
  // console.log("   lastCandleIsPositive : %s".result, lastCandleIsPositive);

  // Update algoPumpResult with data
    _object.calculatedData = {
      meanVolume : candlesVolumeMean,
      varianceVolume : candlesVolumeVariance,
      normVarianceVolume : normalizedVariance,
      nbOfDiscoutinuousFiveMin : isDiscontinious,
      lastOnMeanRatio : candles[candles.length-1].BV / candlesVolumeMean,
      lastFiveMinCandleIsPositive : lastCandleIsPositive
    };

    updateAlgoPumpResult(_object);
}

var progress = 0;
var progressError = 0;
var feedbackTimeout;
// Push la réponse pour un marché dans results
function updateAlgoPumpResult(data) {
  algoPumpResult.results = algoPumpResult.results.filter(a => a.market !== data.market);
  algoPumpResult.results.push(data);


  progress++;
  console.log(progress + '/' + Number(allCurrencyArray.length-progressError) + ' (%s errors)', progressError);

  algoPumpResult.metadata.numberOfErrors = progressError;
  algoPumpResult.metadata.numberOfSuccess = progress;

  // Envoie l'avancement au client
  if (progress % 25 == 0) {
    io.emit('algoPumpFeedback', algoPumpResult.metadata);
  } else {
    clearTimeout(feedbackTimeout);
    feedbackTimeout = setTimeout(() => {
     io.emit('algoPumpFeedback', algoPumpResult.metadata);
    }, 1000)
  }
}

// Envoie le feedback de l'avancement au client
app.get('/api/runAlgoPump/:dateOfPump', (req,res) => {
  if (req.params.dateOfPump !== 'false') {
    algoPumpResult.algoParameters.dateOfPump = req.params.dateOfPump;
    updateAlgoPumpOptionsTxt(algoPumpResult.algoParameters);
    console.log("Date of Pump has been updated".important);
    launchPumpAnalyse(true);
  } else {
    launchPumpAnalyse(false);
  }
})

//==============================================================================
//---------------------- ALGO PUMP SPECIFIC FUNCTIONS --------------------------


// Prépare algoPumpResult avec tous les markets
var allCurrencyArray = [];
function getAllMarketsName (currencyFilter) {
  return new Promise((resolve, reject) => {
    request('https://bittrex.com/api/v1.1/public/getmarkets', (err, response, body) => {
      if (err) {
        console.log('getAllMarketsName Fct error'.error);
        return reject(err);
      }
      // Parse le resultat en JSON
      body = JSON.parse(body);
      var _r = body.result;

      // Créer un array avec seulement les XXX de devises.
      for (var _i in _r) {
        allCurrencyArray.push(_r[_i].BaseCurrency + '-' + _r[_i].MarketCurrency);
      }
      if (currencyFilter) {
        allCurrencyArray = allCurrencyArray.filter(s => s.substring(0,3) == currencyFilter);
      }
      console.log('== getAllMarketsName() completed : %s markets'.success, allCurrencyArray.length);

      // Place les markets dans algoPumpResult
      for (var _i in allCurrencyArray) {
        algoPumpResult.results.push({market : allCurrencyArray[_i]})
      }
      console.log("allCurrencyArray is in algoPumpResult".info);
      return resolve();
    })
  })
}

//==============================================================================
//------------------------- SOCKET.IO SHIT HERE --------------------------------
// io.on('connection', (client) => {
//   client.on('suscribeToAlgoPumpTicker', () => {
//     sendAlgoPumpResult(client);
//   });
// });

function sendAlgoPumpResult () {
  io.emit('timer', algoPumpResult);
}

//==============================================================================
//---------------------- MY API SHIT GOES HERE ---------------------------------

app.get('/api/changeDateOfPump/:dateOfPump', (req, res) => {
    console.log("changing dateOfPump".important);
  algoPumpResult.algoParameters.dateOfPump = req.params.dateOfPump;
  updateAlgoPumpOptionsTxt(algoPumpResult.algoParameters);
    console.log("OPTIONS ARE".important);
    console.log('dateOfPump: ' + algoPumpResult.algoParameters.dateOfPump);
  res.json({message : 'done'});
})

app.get('/api/getDateOfPump', (req, res) => {
  res.json({dateOfPump : algoPumpResult.algoParameters.dateOfPump});
})

// Récupère les résutltats de l'algo Pump
app.get('/api/getAlgoPumpResult', (req, res) => {
  console.log("getAlgoPumpResult called".success);
  res.json(algoPumpResult);
})

// Cancel an open order
app.get('/api/cancelOpenOrder/:orderId', (req, res) => {
  console.log('Canceling trigered');
  var orderId = req.params.orderId;
  cancelOrder(orderId)
    .then(e => res.json(e))
    .catch(err => res.json(err))
});

// Récupère tous les ordres ouverts
app.get('/api/getOpenOrders', (req, res) => {
 getOpenOrders()
   .then(r => res.json(r))
   .catch(err => res.json(err))
});

// Envoyer ordres à BITTREX
app.post('/api/trade', (req, res) => {
  var _r = req.body;
  console.log(_r);

  console.log('launching passTradeOrder'.info);

  passTradeOrder(_r.operation, 'BTC', _r.currency, _r.amount, _r.price, _r.isLimitOrder)
    .then(_d => {
      console.log('Order passed : '.success);
      console.log(_d);
      checkIfTradeOrderSucceed(_r.currency, _d.result.OrderId, _r.isLimitOrder)
        .then(response => {
          console.log('Checked order response'.success);
          console.log(response);
          res.json(response);
        })
        .catch(err => {
          console.log('Order passing catched error');
          console.log(err);
          res.json(err);
        })
    }).catch(err => {
      console.log('Error passing trading order'.error);
      console.log('%s'.error, err.message);
      res.json(err);
    })
})

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
  console.log('getOrderHistory launched'.success)

  var _currency = req.params.currency;

  if (_currency == '_all') {
    var _currency = 'allCurrency';
    var option = {};
  } else {
    var option = {
      market : 'BTC-' + _currency
    }
  }
  bittrex.getorderhistory(option, function( data, err ) {
    if (err) {
      return console.error("Error fetching OrderHistory for %s :".error, _currency + JSON.stringify(err.message, null, 2));
    }
    if (data.result.length > 15) {
      //console.log(data.result.slice(0,15));
      return res.json( data.result.slice(0,15) );
    } else {
      res.json(data.result);
    }
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
  var _timeArray = ['2h', '6h', '12h', '1j', '3j', '7j', '1m', '3m', '6m'];
  var _timeIndex = _timeArray.indexOf(_timeSelected); //Dis à quelle position est le temps demandé
  var _delta=[
    2,
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

// Récupère toutes les monnaies dans le portefeuille
app.get('/api/getAllBalances', (req, res) => {
  getAllBalances().then(response => res.json(response));
})

// Récupère le cours d'une currency
app.get('/api/getCurrencyCours/:currency', (req, res) => {
  var _curr = req.params.currency;
  getCurrencyCours(_curr)
    .then(_r => res.json(_r.result));
})

// Récupère logo et nom de la currency
app.get('/getLogoAndFullName/:currency', (req, res) => {
  getLogoAndFullName(req.params.currency)
    .then(_r => {
      res.json({
        marketCurrencyLong : _r.MarketCurrencyLong,
        logoUrl : _r.LogoUrl
    })
  })
})

//==============================================================================
//--------------------------- MY PROMISES -------------------------------------

// Récupère logo et nom de la currency
function getLogoAndFullName (_curr) {
  var _curr = _curr.toUpperCase();
  return new Promise ((resolve, reject) => {
    request('https://bittrex.com/api/v1.1/public/getmarkets', (err, response, body) => {
      if (err) {
        console.log('Pb getting Logo and full name'.error);
        return reject(err);
      }
      body = JSON.parse(body);
      var _r = body.result;
      _s = _r.filter(r => r.MarketCurrency == _curr);
      if (_s.length == 0) {
        console.log(_s);
        return console.log('getLogoAndFullName no match'.error);
      }
      if (_s.length > 0) {
        // console.log('getLogoAndFullName : %s matches', _s.length);
        return resolve(_s[0]);
      }
    })
  })
}

// PROMISE qui vérifie l'existence du dernier ordre passé et renvoie succès ou pas
function checkIfTradeOrderSucceed (_curr, _uuid, _isLimiteOrder) {
  console.log('checking uuid for %s'.important, _uuid);
  return new Promise((resolve, reject) => {
    bittrex.getorderhistory({market:'BTC-' + _curr}, function( data, err ) {
      if (err) {
        reject({ message : err });
        return console.error("Error fetching uuid for %s :".error, _currency);
      }
      if (data && data.result && data.result.length > 0) {
        if (data.result[0].OrderUuid == _uuid) {
          console.log('This is a match !!'.success);
          resolve({ message : 'Success !' })
        } else {
          if (_isLimiteOrder) {
            console.log('no match but limit :)'.error);
            reject({ message : 'Check Open Orders' })
          } else {
            console.log('no match'.error);
            reject({ message : 'Order has canceled' })
          }
        }
      } else {
        console.log('no match'.error);
        reject({ message : 'Order has canceled' })
      }
    });
  })
}

// Affiche les ordres en cours/attente
function getOpenOrders(_refCurr, _curr) {
  // _market = 'BTC-LTC'
  return new Promise((resolve, reject) => {
    console.log('Get open orders has been launched'.important)
    if (_refCurr && _curr) {
      var _market = '?market=' + _refCurr + _curr;
    } else {
      _market = '';
    }
    bittrex.sendCustomRequest( 'https://bittrex.com/api/v1.1/market/getopenorders'+ _market, function( data, err ) {
      if (err) {
        console.log('err recovering open order'.error);
        console.log(err.message);
        return reject(err.message)
      }
      console.log('Successfully recovering open orders'.success);
      //console.log( data.result );
      return resolve(data.result);
    }, true );
  })
}

// Annule un ordre passé
function cancelOrder(_orderId) {
  return new Promise((resolve, reject) => {
    bittrex.sendCustomRequest( 'https://bittrex.com/api/v1.1/market/cancel?uuid=' + _orderId, function( data, err ) {
      if (err) {
        console.log('err canceling order :'.error);
        console.log(err.message);
        return reject(err.message)
      }
      console.log('Successfully cancel order'.success);
      console.log( data );
      return resolve(data);
    }, true );
  })
}

// PROMISE passe ordre d'achat à l'API Bittrex /!\ _qu
function passTradeOrder (_operation, _refCurr, _curr, _qu, _rate, _isLimiteOrder) {
  return new Promise((resolve, reject) => {
    if (_curr == 'BTC') {
      console.log("Can't buy BTC".error);
      reject({message : "Can't trade BTC !" });
    }
    if (_operation == 'BUY') {
      console.log("sending BUY Order to BITTREX".important);
      // ici _qu est la quantité en BTC (monnaie de ref)
      // Conversion en eth
      var _currEq = Number((_qu*0.9975/_rate).toFixed(8));
      //console.log("operation : %s".info, _operation);
      // console.log('_refCurr: ' + _refCurr);
      // console.log('_curr : ' + _curr);
      // console.log('_qu : ' + _qu);
      // console.log('_rate ' + _rate);
      // console.log("_currEq = ".important, _currEq);
      if (_isLimiteOrder) {
        console.log('LESS_THAN enabled'.important);
        var _conditionType = 'LESS_THAN';
        var _timeInEffect = 'GOOD_TIL_CANCELLED';
      } else if (!_isLimiteOrder) {
        console.log('LESS_THAN disabled'.important);
        var _conditionType = 'NONE';
        var _timeInEffect = 'IMMEDIATE_OR_CANCEL';
      }

      bittrex.tradebuy({
        MarketName: _refCurr + '-' + _curr,
        OrderType: 'LIMIT',
        Quantity: _currEq,
        Rate: _rate,
        TimeInEffect: _timeInEffect, // supported options are 'IMMEDIATE_OR_CANCEL', 'GOOD_TIL_CANCELLED', 'FILL_OR_KILL'
        ConditionType: _conditionType, // supported options are 'NONE', 'GREATER_THAN', 'LESS_THAN'
        Target: 0, // used in conjunction with ConditionType
      }, function( data, err ) {
        if (err) {
          reject(err);
          console.log('Error buying : %s'.error, err.message);
          return console.log(err);
        } else {
          console.log('Buy Traded success'.success);
          console.log( data );
          resolve(data);
        }
      });
    } else if (_operation == 'SELL') {
      console.log("sending SELL Order".important);
      // ici _qu est la quantité en monnaie tradée (ex ETH)

      if (_isLimiteOrder) {
        console.log('GREATER_THAN enabled'.important);
        var _conditionType = 'GREATER_THAN';
        var _timeInEffect = 'GOOD_TIL_CANCELLED';

      } else if (!_isLimiteOrder) {
        console.log('GREATER disabled'.important);
        var _conditionType = 'NONE';
        var _timeInEffect = 'IMMEDIATE_OR_CANCEL';
      }

      bittrex.tradesell({
        MarketName: _refCurr + '-' + _curr,
        OrderType: 'LIMIT',
        Quantity: _qu,
        Rate: _rate,
        TimeInEffect: _timeInEffect, // supported options are 'IMMEDIATE_OR_CANCEL', 'GOOD_TIL_CANCELLED', 'FILL_OR_KILL'
        ConditionType: _conditionType, // supported options are 'NONE', 'GREATER_THAN', 'LESS_THAN'
        Target: 0, // used in conjunction with ConditionType
      }, function( data, err ) {
        if (err) {
          reject(err);
          console.log('Error selling : %s'.error, err.message);
          return console.log(err);
        } else {
          console.log('Sell Traded success'.success);
          console.log( data );
          resolve(data);
        }
      });
    }
  })
}

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
// Custom Date = en heures
function getCurrencyCandles(_curr, _selectedDate) {
  return new Promise((resolve, reject) => {
    console.log("Getting Candle for %s".info, _curr);

    var _timeSelected = _selectedDate;

    var _now = new Date().getTime()/1000; // Définit maintenant en timestamp

    var _timeArray = ['2h', '6h', '12h', '1j', '3j', '7j', '1m', '3m', '6m'];
    var _timeIndex = _timeArray.indexOf(_timeSelected); //Dis à quelle position est le temps demandé

    var _delta = [
      4,
      6,
      14,
      26,
      74,
      170,
      722,
      2162,
      4322
    ]; // Définit sur cb d'heures je veux les données

    var _density = [
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

    var _tickInterval = _density[_timeIndex];
    var _market;

    // TODO Ajouter _refCurr dans les params de la fonction ??
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
  console.log('== Successfully connected to Crypto Database'.success);
});

// TODO: créer le schéma
var WalletArchive = mongoose.model('WalletArchive', {
  date : Date,
  currencyArray : Array,
  totalBTCEq : Number,
  total$Eq : Number,
  coursBTC : Number
});

//==============================================================================
//------------------------- TXT MANAGEMENT API ---------------------------------

// Initie les valeurs d'options
function ReadAlgoPumpOptionsTxt() {
  return new Promise ((resolve, reject) => {
    fs.readFile('./algoPumpOptions.txt', 'utf8', (err, data) => {
      if (err) {
        console.log("Error reading algoPumpOptions.txt".error);
        return reject(err);
      }
      console.log('== algoPumpOptions.txt has been read'.success);
      data = JSON.parse(data);
      for (var _i in data) {
        algoPumpResult.algoParameters[_i] = data[_i];
      }
      resolve();
    });
  })
}

// {
// 	"dateOfPump": "2018-03-09T23:20:00",
// 	"currencyFilter": "BTC",
// 	"tickInterval": "oneMin",
// 	"nbPeriodsFrom": 20,
// 	"nbPeriodsTill": 0,
// 	"threshold": 5,
// 	"minVolume": 1.5,
// 	"onlyPosCandles": true,
// 	"maxOldVolumes": 1.5,
// 	"minOldVolumes": 0.05
// }

// Met à jour le fichier
function updateAlgoPumpOptionsTxt(a) {
  fs.writeFile("./algoPumpOptions.txt", JSON.stringify(a, null, "\t"), function(err) {
    if(err) {
        return console.log(err);
    }
    console.log("algoPumpOptions.txt has been updated".success);
});
}


//==============================================================================
//---------------------- MY SERVER FUNCTIONS -----------------------------------

// Archivage du portefeuille
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
      if (!isOnlyWorkingVersion) {
        return console.log('Pas de sauvegarde wallet : Code en développement');
      }
      archiveCurrentWalletPerf();
      ot.done()
      return
})

//==============================================================================
//----------------------------- SERVER BOOTING ---------------------------------

// Serve static files from React app
app.use(express.static(path.join(__dirname, 'client/build')));

// Other requests that triggers the index display
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname+'/client/build/index.html'));
});

const port = process.env.PORT || 8000;
const port2 = 8080;
app.listen(port);
io.listen(port2);

console.log('Express server listening on %s'.info, port);
console.log('listening on port %s', port2);
