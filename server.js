require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const drillSchema = new mongoose.Schema({
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: String, required: true }
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  log: [drillSchema]
});

const User = mongoose.model('User', userSchema);
const Drill = mongoose.model('Drill', drillSchema);

app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', async function (req, res) {
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

app.get('/api/users', function (req, res) {
  User.find({}, '-log', (err, docs) => {
    if (!err) {
      res.json(docs);
    }
  });
});

app.post('/api/users/:id/exercises', function (req, res) {
  const { id } = req.params;

  const drill = new Drill({
    description: req.body.description,
    duration: parseInt(req.body.duration),
    date: new Date(req.body.date).toDateString()
  });

  if (drill.date === 'Invalid Date') {
    drill.date = new Date().toDateString();
  }

  User.findByIdAndUpdate(
    id,
    { $push: { log: drill } },
    { new: true },
    (err, doc) => {
      if (!err) {
        res.json({
          _id: doc._id,
          username: doc.username,
          date: drill.date,
          description: drill.description,
          duration: drill.duration
        });
      }
    });
});

app.get('/api/users/:id/logs', function (req, res) {
  const { id } = req.params;

  User.findById(id, '-log._id', (err, doc) => {

    if (!err) {
      const { from, to, limit } = req.query;
      const fromDate = (!from) ? +new Date(0) : +new Date(from);
      const toDate = (!to) ? +new Date() : +new Date(to);

      let log = doc.log.filter(function(item) {
        const date = +new Date(item.date);
        return date >= fromDate && date <= toDate;
      });

      if (limit) {
        log = log.slice(0, +limit);
      }
      
      res.json({
        _id: doc._id,
        username: doc.username,
        count: log.length,
        log: log
      });
    }
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
