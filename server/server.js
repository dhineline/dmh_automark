require('./config/config')

const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');
const {ObjectID} = require('mongodb');
const hbs = require('hbs');
const fs = require('fs');

var {mongoose} = require('./db/mongoose');
var {User} = require('./models/user');
var {authenticate} = require('./middleware/authenticate')

var app = express();
const port = process.env.PORT;

app.use(bodyParser.json());
//define partials director
hbs.registerPartials(__dirname+'/../views/partials');

hbs.registerHelper('getCurrentYear', () => {
  return new Date().getFullYear();
});

//load the handlebars template engine as the view engine
app.set('view engine', 'hbs');

//set static directory for undefined renders/hbs templates
app.use(express.static(__dirname+'../www'));

// ****************************
// START WEB APP PAGES
// ****************************

app.get('/', (req, res) => {
  //res.send('<h1>Hello Express</h1>');
  res.render('home.hbs', {
    pageTitle: 'Home Page',
    welcomeMessage: 'Welcome to our app'
  });
});

app.get('/about', (req, res) => {
  //res.send('About Page');
  res.render('about.hbs', {
    pageTitle: 'About Page'
  });
});

app.get('/projects', (req, res) => {
  //res.send('About Page');
  res.render('projects.hbs', {
    pageTitle: 'Project Page'
  });
});

app.get('/bad', (req, res) => {
  res.send({
    errorMessage: 'Error Handling this Request'
  });
});


// ****************************
// START API
// ****************************

//////////////////////////
// POST /users/login {email, password}
// Checks email/password_hash combo to create a session
//////////////////////////
app.post('/api/users/login', (req, res) => {

  var body = _.pick(req.body, ['email', 'password']);

  User.findByCredentials(body.email, body.password).then((user)=>{
    user.generateAuthToken().then((token) => {
      res.header('x-auth', token).send(user);
    });
  }).catch((e)=>{
    res.status(400).send();
  })

});

//////////////////////////
// DELETE /users/me/token
// Logs out the user and kills the token
//////////////////////////

app.delete('/api/users/me/token', authenticate, (req,res) =>{
  req.user.removeToken(req.token).then(() =>{
    res.status(200).send();
  }), () =>{
    res.status(400).send();
  };
});

//////////////////////////
// POST /users
// Creates a new user
//////////////////////////

app.post('/api/users', (req, res) => {

  var body = _.pick(req.body, ['email', 'password']);
  var user = new User(body);

  user.save().then(()=>{
    return user.generateAuthToken();
    //res.send(doc);
  }).then((token)=>{
    res.header('x-auth', token).send(user);
  }).catch((e) => {
    res.status(400).send(e);
  });
});

//////////////////////////
// GET users/me
// returns auth user
//////////////////////////

app.get('/api/users/me', authenticate, (req, res) => {
  res.send(req.user);
});

//////////////////////////
// Start Server
//////////////////////////

app.listen(port, () => {
  console.log(`Started on port ${port}`);
  console.log('\n');
})

module.exports = {app};
