require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  log: [drillSchema]
});

const drillSchema = new mongoose.Schema({
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: {type: String, required: true }
});

const User = mongoose.model('User', userSchema);
const Drill = mongoose.model('Drill', drillSchema);

app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', async function(req, res) {
  const { username } = req.body;

  const user = new User({
    username: username
  });

  await user.save();

  res.json({
    username: username,
    _id: user._id
  });
});

app.get('/api/users', async function(req, res) {
  await User.find({}, (err, docs) => {
    if (!err) {
      res.json(docs);
    }
  });
});

app.post('/api/users/:_id/logs', async function(req, res) {
  const drill = new Drill({
    description: req.body.description,
    duration: parseInt(req.body.duration),
    date: new Date(req.body.date).toDateString()
  });

  if (drill.date === '' || drill.date === 'Invalid Date') {
    drill.date = new Date().toISOString.substring(0, 10);
  }

  await User.findByIdAndUpdate(
    req.body['_id'], 
    {$push: { log: drill }},
    {new: true},
    (err, doc) => {
    if (!err) {
      res.json({
        _id: doc.id,
        username: doc.username,
        date: drill.date,
        description: drill.description,
        duration: drill.duration
      });
    }
  });
});

app.get('/api/users/:id/logs', async function(req, res) {
  const { id } = req.parms;
  const { from, to, limit } = req.query;

  
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
