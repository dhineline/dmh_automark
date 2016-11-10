var mongoose = require('mongoose');

//load up promises
mongoose.Promise = global.Promise;
//connect to Database
mongoose.connect(process.env.MONGODB_URI);

module.exports = {mongoose};
