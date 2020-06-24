//var time = require('express-timestamp')
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
var https = require("https");
var path = require("path");
//var AWS = require('aws-sdk');



// var googleMapsClient = require('@google/maps').createClient({
//   key: 'AIzaSyDYRICW4Bm4donS0-9LCp_h0nlsyWvEuGY'
// });
var driverChannelArr = [];
var a1;
var a2="jatin";
//var flag=true;
var counter="jatin";
const app = express();

var PubNub = require("pubnub");

var pubnub = new PubNub({
    subscribeKey: "sub-c-db832570-885f-11ea-a961-f6bfeb2ef611",
    publishKey: "pub-c-4fe2d8f8-74ed-4d6a-93c4-149e68832d07",
    uuid: "myUniqueUUIDServer",
    secretKey: "sec-c-YWM1MzAyMGYtODljNi00MGJmLWFhM2MtNWVkNjBiNGI5NzEy"
});

//app.use(time.init)
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://cloudparadigm123:pkpk1212@deliverydatabase-chmna.mongodb.net/projectDB", {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set("useCreateIndex", true);


const clientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  username: String,
  password: String,
  aadhar:String,
  phoneno:String,
  dl:String,
  bikeid:String,
  isAdmin: {
    type: Boolean,
    default: false
  },
  isDriver: {
    type: Boolean,
    default: false
  }
});

const clientRegisteredSchema = new mongoose.Schema({
  user:String
});

const ClientRegistered = new mongoose.model("RegisteredClient", clientRegisteredSchema);

const orderHistorySchema = new mongoose.Schema({
  orderID: {
    type: Number,
    default:0
  },
  from: {
    type: String,
    default: "nill"
  },
  to: {
    type: String,
    default: "nill"
  },
  distance: {
    type: String,
    default: "nill"
  },
  user: clientRegisteredSchema
});

const OrderHistory = new mongoose.model("orderdetail", orderHistorySchema);



clientSchema.plugin(passportLocalMongoose);
const Client = new mongoose.model("Client", clientSchema);
passport.use(Client.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  Client.findById(id, function(err, user) {
    done(err, user);
  });
});

var dist=0;
var cost=[];



app.get("/", function(req,res) {
  res.render("index");
});

app.get("/login", function(req,res) {
  res.render("login");
});

app.get("/register", function(req,res) {
  res.render("register");
});





function embed(x) {

  var regClient = new ClientRegistered({
    user: x
  });
  regClient.save();
  console.log("Bye",regClient);
  return regClient;

}
app.post("/", function(req,res){
res.redirect(__dirname + "/login")
});

app.post("/register", function(req,res) {
  Client.register({username: req.body.username,aadhar:req.body.aadhar,phoneno:req.body.number,dl:req.body.dl,bikeid:req.body.bikeID,isDriver:req.body.driver,name:req.body.name},req.body.password, function(err,user){
    console.log(req.body);
    if(err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local") (req,res, function() {
      a1=embed(req.body.username);
      const orderhistory = new OrderHistory({
        user: a1
       });

       orderhistory.save();
       //flag=false;

       console.log("Hello" , a1);
        res.redirect("/login");
      });
    }
  });
});

function docReturn(data) {
  return data;
}

function loginHandler(doc) {
  this.doc = doc;
}

app.post("/login", function(req,res) {
const user = new Client({
  username: req.body.username,
  password: req.body.password
});

//Login method from Passport
req.login(user, function(err) {
  if (err) {
    console.log(err);
    res.redirect("/login");
  } else {
    passport.authenticate("local")(req, res, function(){
      ClientRegistered.findOne({user: req.body.username}, function(err,document) {
        if(err) {
          console.log(err);
           } else {
            var obj1 = new loginHandler(document); //Passing document as embedding for embedding in Order-History
            docvar = docReturn(obj1.doc);
            console.log("Docvar", docvar);
          }
      });
      Client.findOne({username: req.body.username}, function(err, clientType) {
        if(err) {
          console.log(err);
        } else {
          if(clientType.isDriver===true && clientType.isAdmin===false) {
            res.redirect("/drivers/" + user.username+ "/profile");
          } else if(clientType.isDriver===false && clientType.isAdmin===false) {
            res.redirect("/users/" + user.username);
          } else {
            res.redirect("/adminPortal/" + user.username+ "/driversmap");
          }
        }
      });
      });
  }
});
});


app.get("/adminPortal/:username/driversmap", function(req,res) {
  if(req.isAuthenticated()) {
    res.render("adminPortal/subscribe-location");
  }

});

app.get("/drivers/:username/profile", function(req,res) {
  if(req.isAuthenticated()) {
    res.render("drivers/publish-location", {driverName: req.user.name});
    console.log(req.user,"for screen name");
  } else{
    res.redirect("/login");
  }
});

app.get("/users/:username", function(req,res) {
if(req.isAuthenticated()) {
  Client.findOne({username: req.params.username}, function(err,results) {
    if(err) {
      console.log(err);
    } else {
      if(results!== null) {
            res.render("users/profile", {name: results.username});
} else {
  res.send("Error")
}
    }
  });
} else {
  res.send("Not Authenticated");
}
});

app.get("/users/:username/orderhistory", function(req,res) {
  Client.findOne({username: req.params.username}, function(err,results) {
    if(err) {
      console.log(err);
    } else {
      res.render("users/order-history", {name: results.username});
    }
  });
});


app.get("/users/:username/placeorder", function(req,res) {
  if(req.isAuthenticated()) {
  Client.findOne({username: req.params.username}, function(err,results) {
    if(err) {
      console.log(err);
    } else {
      //console.log(dist);
      res.render("users/placeorder", {name: results.username,distance:dist, cost:cost});
    }
  });
} else {
  res.redirect("/login");
}
});



app.get("/logout", function(req, res) {
  req.logout();
  res.redirect("/");
});


function Order(orderno,from,to,distance) {
  this.orderno=orderno;
  this.from=from;
  this.to=to;
  this.distance=distance;
}


app.post("/distance", function(req,res) {
  ClientRegistered.findOne({user:req.user.username}, function(err,user) {
    if(err) {
      console.log(err);

    } else {
      var a = user;
      console.log("post",a1);
      var from = req.body.from;
      var to = req.body.to;
      const url = "https://maps.googleapis.com/maps/api/directions/json?origin="+ from + "&destination=" + to + "&key=AIzaSyDYRICW4Bm4donS0-9LCp_h0nlsyWvEuGY";
      console.log(from,to);
      https.get(url, function(response) {
        console.log(response.statusCode);
        var buffers = []
       response
         .on('data', function(data) {
            buffers.push(data)
          })
         .on('end', function() {

           var lat = JSON.parse(Buffer.concat(buffers).toString());
            var arr;
            arr=lat.routes[0].legs;
            var distance = arr[0].distance.text;
            console.log(distance);
            dist=distance;




            OrderHistory.findOne({"user.user":req.user.username}).sort({orderID:-1}).exec(function(err, found) {
              if(err) {
                console.log(err);

              } else {
                console.log("Test", docvar,a1);
                console.log("Record" , found);
                var orderno = found.orderID
                orderno+=1;
                var obj1 = new Order(orderno,from,to,distance);



                 const orderhistory = new OrderHistory({
                   orderID: obj1.orderno,
                   from: obj1.from,
                   to: obj1.to,
                   distance: obj1.distance,
                   user: a
                  });
                  orderhistory.save();





              }
            });

          });

      });
    }
  })


function delay() {
  res.redirect("/users/" + req.user.username + "/placeorder/order-details");
}

setTimeout(delay,2000);



  });




   app.get("/users/:username/placeorder/order-details", function(req,res) {
     console.log("Success 1");
     if(req.isAuthenticated()) {
       console.log("Yes is auth");
       OrderHistory.findOne({"user.user":req.user.username}).sort({orderID:-1}).exec(function(err, found) {
         if(err) {
         console.log(err);
       } else {
       console.log(found);
       res.render("users/order-details", {distance:found.distance,name: found.user.user, from: found.from, to: found.to, order: found.orderID});
       }

   });
   }
   else {
      res.redirect("/login");
   }
  });

  app.get("/users/:username/placeorder/payment", function(req,res) {
    Client.findOne({username: req.params.username}, function(err,results) {
      if(err) {
        console.log(err);
      } else {
        var pubnub = new PubNub({
          subscribeKey: "sub-c-db832570-885f-11ea-a961-f6bfeb2ef611",
          publishKey: "pub-c-4fe2d8f8-74ed-4d6a-93c4-149e68832d07",
          uuid: "myUniqueUUIDServer",
          secretKey: "sec-c-YWM1MzAyMGYtODljNi00MGJmLWFhM2MtNWVkNjBiNGI5NzEy"
      });

      var jatin = "Japani";
      var mahir = "Basoda";

      pubnub.publish({
          channel: 'orderBroadcast',
          message:jatin+ mahir
        }, function(status, response) {
            if(status.error) {
                console.log(status);

            } else {
                console.log(response, "jatin");

            }
        });
        res.render("users/payment", {name: results.username});
      }
    });
  });


  Client.find({}, "name", function(err,found) {
    if(err) {
      console.log(err);
    } else {
      console.log(found,"Found Driver channel");
      for(let i=0;i<found.length;i++) {
        driverChannelArr.push(found[i].name);
      }
      console.log(driverChannelArr);
    }
  });


  pubnub.channelGroups.addChannels(
    {
        channels: ['hrishi','jatin'],
        channelGroup: "myChannelGroup"
    },
    function(status) {
        if (status.error) {
            console.log("operation failed w/ status: ", status,driverChannelArr);
        } else {
            console.log("operation done!", status);
        }
    }
  );


  pubnub.addListener({
      message: function(m,ch) {
          // handle message
          console.log("message recieved:",JSON.stringify(m));
      }
  });

  pubnub.subscribe({
      channelGroups: ['myChannelGroup'],
  }, function (err) {
      console.log(err);
  });

  app.post("/recieve", function(req,res) {
    console.log(req.timestamp);
    console.log(req.query);

   console.log(req.body.value);



  })


  let port = process.env.PORT;
  if(port == null || port == "") {
    port = 3000;
  }

  app.listen(port, function() {
    console.log("Server started Successfully!");
  });


  module.exports = app;
