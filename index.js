var express = require("express")
var bodyParser = require("body-parser")
var mongoose = require("mongoose")
var jwt = require('jsonwebtoken');
var Projects = [];
var path = require('path');
var nodemailer = require('nodemailer');
var objectId = require('mongodb').ObjectID;
var assert = require('assert');
const bcrypt = require('bcrypt');
const { check } = require('express-validator/check');
const app = express()
const User = require('./models/user');
const { render } = require("ejs");
app.use(bodyParser.json())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({
    extended:true
}))
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
mongoose.connect('mongodb+srv://aditya_admin:aditya@cluster0.aajkb.mongodb.net/NewDB?retryWrites=true&w=majority',{
    useNewUrlParser: true,
    useUnifiedTopology: true
});

var db = mongoose.connection;

db.on('error',()=>console.log("Error in Connecting to Database"));
db.once('open',()=>console.log("Connected to Database"))


app.get("/getdata", (req, res, next) => {
  User.find()
    .select("name email _id Projects Domain password")
    .exec()
    .then(docs => {
      const response = {
        count: docs.length,
        users: docs.map(doc => {
          return {
            name: doc.name,
            password: doc.password,
            email: doc.email,
            Projects: doc.Projects,
            Domain: doc.Domain,
            _id: doc._id,
            
          };
        })
      };
      //   if (docs.length >= 0) {
      console.log(response);
      //   } else {
      //       res.status(404).json({
      //           message: 'No entries found'
      //       });
      //   }
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        error: err
      });
    });
});
app.get('/data.ejs', (req, res, next) => {
  User.find({}).select("name email _id Projects Domain password").exec(function(err, data){
    if(err) throw err;
    res.render('data', { title: 'User Records', records: data })
  })
})
app.get("/data", (req, res) => {
  res.set({
      "Allow-access-Allow-Origin": '*'
  })
  return res.redirect('data.ejs');
})
app.post("/sign_up", (req, res, next) => {
    User.find({ email: req.body.email })
      .exec()
      .then(user => {
        if (user.length >= 1) {
          console.log('Mail exists');
        } else {
          bcrypt.hash(req.body.password, 10, (err, hash) => {
            if (err) {
              console.log('Error')
            } else {
              const user = new User({
                _id: new mongoose.Types.ObjectId(),
                email: req.body.email,
                password: hash,
                firstName: req.body.firstName,
                lastName: req.body.lastName
              });
              user
              .save()
              .then(result => {
                console.log(result);
                var transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                      user: 'prathamadi2001@gmail.com',
                      pass: 'Pr@tham1'
                    }
                  });
                  
                  var mailOptions = {
                    from: 'prathamadi2001@gmail.com',
                    to: req.body.email ,
                    subject: 'SignUp Successful',
                    text: `Thnx for Signing Up `
                  };
                  
                  transporter.sendMail(mailOptions, function(error, info){
                    if (error) {
                      console.log(error);
                    } else {
                      console.log('Email sent: ' + info.response);
                    }
                  });
              })
              .catch(err => {
                console.log(err);
              })
              return res.redirect('signup_success.html');
              
        }
     
        
    // db.collection('users').insertOne(user,(err,collection)=>{
    //     if(err){
    //         throw err;
    //     }
    //     console.log("Record Inserted Successfully");
    // });

    // return res.redirect('signup_success.html');
});
}});
});
app.post("/login", (req, res, next) => {
    User.find({ email: req.body.email })
      .exec()
      .then(user => {
        if (user.length < 1) {
          console.log('Auth Failed')
        }
        bcrypt.compare(req.body.password, user[0].password, (err, result) => {
          if (err) {
            console.log('Auth Failed');
          }
          if (result) {
            const token = jwt.sign(
              {
                email: user[0].email,
                userId: user[0]._id
              },
              "" +process.env.JWT_KEY,
              {
                  expiresIn: "1h"
              }
            );
          
              console.log('Auth successful');
              console.log(token);
              res.redirect('data.ejs')
          }
          
        });
      })
      .catch(err => {
        console.log(err);
        res.status(500).json({
          error: err
        });
      });
  });
app.get("/",(req,res)=>{
    res.set({
        "Allow-access-Allow-Origin": '*'
    })
    return res.redirect('index.html');
}).listen(8080);
app.get("/login", (req, res) => {
    res.set({
        "Allow-access-Allow-Origin": '*'
    })
    return res.redirect('login.html');
})
app.post('/update', function(req, res, next) {
  var item = {
    email: req.body.email,
    name: req.body.name,
    Projects: req.body.Projects,
    Domain: req.body.Domain
  };

    db.collection('users').updateOne({"email": req.body.email}, {$set: item}, function(err, result) {
      assert.equal(null, err);
      console.log('Item updated');
    
    });
    res.redirect('/updated');
});
app.get("/update", (req, res) => {
  res.set({
      "Allow-access-Allow-Origin": '*'
  })
  return res.redirect('update.html');
})
app.get("/updated", (req, res) => {
  res.set({
      "Allow-access-Allow-Origin": '*'
  })
  return res.redirect('updated.html');
})
// app.post('/create', function(req, res, next) {
//   var item = {
//     email: req.body.email,
    // name: req.body.name,
    // password: req.body.password,
    // Projects: req.body.Projects,
    // Domain: req.body.Domain
//   };


//     db.collection('users').insertOne(item, function(err, result) {
//       assert.equal(null, err);
//       console.log('Item inserted');
//       db.close();
//     });

//   res.redirect('/created');
// });
app.post("/create", (req, res, next) => {
  User.find({ email: req.body.email })
    .exec()
    .then(user => {
      if (user.length >= 1) {
        console.log('Mail exists');
      } else {
        bcrypt.hash(req.body.password, 10, (err, hash) => {
          if (err) {
            console.log('Error')
          } else {
            const user = new User({
              _id: new mongoose.Types.ObjectId(),
              email: req.body.email,
              password: hash,
              name: req.body.name,
              Domain: req.body.Domain
            });
            user
            .save()
            .then(result => {
              console.log(result);
              var transporter = nodemailer.createTransport({
                  service: 'gmail',
                  auth: {
                    user: 'prathamadi2001@gmail.com',
                    pass: 'Pr@tham1'
                  }
                });
                
                var mailOptions = {
                  from: 'prathamadi2001@gmail.com',
                  to: req.body.email ,
                  subject: 'SignUp Successful',
                  text: `Thnx for Signing Up `
                };
                
                transporter.sendMail(mailOptions, function(error, info){
                  if (error) {
                    console.log(error);
                  } else {
                    console.log('Email sent: ' + info.response);
                  }
                });
            })
            .catch(err => {
              console.log(err);
            })
            return res.redirect('created.html');
            
      }
   
      
  // db.collection('users').insertOne(user,(err,collection)=>{
  //     if(err){
  //         throw err;
  //     }
  //     console.log("Record Inserted Successfully");
  // });

  // return res.redirect('signup_success.html');
});
}});
});
app.get("/create", (req, res) => {
  res.set({
      "Allow-access-Allow-Origin": '*'
  })
  return res.redirect('create.html');
})
app.get("/created", (req, res) => {
  res.set({
      "Allow-access-Allow-Origin": '*'
  })
  return res.redirect('created.html');
})
app.post('/delete', function(req, res, next) {


  
    db.collection('users').deleteOne({"email": req.body.email}, function(err, result) {
      assert.equal(null, err);
      console.log('Item deleted');
      db.close();
    });
  return res.redirect('deleted.html');
});
app.get("/delete", (req, res) => {
  res.set({
      "Allow-access-Allow-Origin": '*'
  })
  return res.redirect('delete.html');
})
app.get("/deleted", (req, res) => {
  res.set({
      "Allow-access-Allow-Origin": '*'
  })
  return res.redirect('deleted.html');
})
app.post('/updateProject', function(req, res, next) {

  User.findOneAndUpdate(
    { email: req.body.email }, 
    { $push: { Projects: req.body.Projects  } },
   function (error, success) {
         if (error) {
             console.log(error);
         } else {
             console.log(success);
         }
     });
    res.redirect('/updated');
});
app.get("/updateProject", (req, res) => {
  res.set({
      "Allow-access-Allow-Origin": '*'
  })
  return res.redirect('updateProject.html');
})
app.post("/assignProject", (req, res, next) =>{
  User.findOneAndUpdate(
    { email: req.body.email }, 
    { $push: { Projects: req.body.Projects  } },
   function (error, success) {
         if (error) {
             console.log(error);
         } else {
             console.log(success);
         }
     });
    res.redirect('/updated');
})
app.get("/assignProject", (req, res) => {
  res.set({
      "Allow-access-Allow-Origin": '*'
  })
  return res.redirect('assignProject.html');
})
app.post("/deleteProject", (req, res, next) =>{
  User.findOneAndUpdate(
    { email: req.body.email }, 
    { $pull: { Projects: req.body.Projects  } },function(err,model){
      if(err){
       	console.log(err);
       	return res.send(err);
        }
        return res.json(model);
    });
    return res.redirect('/deleted')
})
app.get("/deleteProject", (req, res) => {
  res.set({
      "Allow-access-Allow-Origin": '*'
  })
  return res.redirect('deleteProject.html');
})
app.get("/deleted1", (req, res) => {
  res.set({
      "Allow-access-Allow-Origin": '*'
  })
  return res.redirect('delete1.html');
})
console.log("Listening on PORT 8080");
      