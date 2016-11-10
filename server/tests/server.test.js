const expect = require('expect');
const request = require('supertest');
const {ObjectID} = require('mongodb');

const {app} = require('./../server');
const {User} = require('./../models/user');
const {Users, populateUsers} = require('./seed/seed');

//////////////////////////
// Seed the test data from ./seed/seed
//////////////////////////

beforeEach(populateUsers);

//////////////////////////
// Test POST /users
// testing user signup features
//////////////////////////

describe('Post /api/users **** user signup', () => {
  it('should create a user', (done) => {
    var email = 'example@example.com';
    var password = '123mnb!';
    request(app)
      .post('/api/users')
      .send({email, password})
      .expect(200)
      .expect((res)=>{
        expect(res.headers['x-auth']).toExist();
        expect(res.body._id).toExist();
        expect(res.body.email).toBe(email);
      })
      .end((err) => {
        if(err) {
          return done(err);
        }
        User.findOne({email}).then((user) => {
          expect(user).toExist();
          expect(user.password).toNotBe(password);
          done();
        }).catch((e)=> done(e));
      });
  });

  it('should return validation errors if request invalid', (done) => {
    var email = '93';
    var password = 'testpassword';

    request(app)
      .post('/api/users')
      .send({email, password})
      .expect(400)
      .end(done);
  });

  it('should not create user if email in use', (done) => {
    var email = 'dhineline@gmail.com';
    var password = 'testpassword';
    request(app)
      .post('/api/users')
      .send({email, password})
      .expect(400)
      .end(done);
  });
})

describe('POST /users/login **** test user login', ()=>{
  it('should login user and return auth token', (done) => {
    request(app)
    .post('/api/users/login')
    .send({
      email: Users[1].email,
      password: Users[1].password
    })
    .expect(200)
    .expect((res) =>{
      expect(res.headers['x-auth']).toExist();
    })
    .end((err, res) => {
      if(err){
        return done(err);
      }

      User.findById(Users[1]._id).then((user) =>{
        expect(user.tokens[1]).toInclude({
          access: 'auth',
          token: res.headers['x-auth']
        });
        done();
      }).catch((e)=> done(e));

    })
  });

  it('should reject invalid login', (done) => {
    request(app)
    .post('/api/users/login')
    .send({
      email: Users[1].email,
      password: 'somewrongpassword'
    })
    .expect(400)
    .expect((res) =>{
      expect(res.headers['x-auth']).toNotExist();
    })
    .end((err, res) => {
      if(err){
        return done(err);
      }

      User.findById(Users[1]._id).then((user) =>{
        expect(user.tokens.length).toBe(1);
        done();
      }).catch((e)=> done(e));

    })
  });
});

describe('DELETE /users/me/token', () => {
  it('should remove auth token on logout', (done) => {
    request(app)
      .delete('/api/users/me/token')
      .set('x-auth', Users[0].tokens[0].token)
      .expect(200)
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        User.findById(Users[0]._id).then((user) => {
          expect(user.tokens.length).toBe(0);
          done();
        }).catch((e) => done(e));
      });
  });
});
