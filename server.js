var express = require("express")
var request = require("request")
var cheerio = require("cheerio")
var bodyParser = require("body-parser")
var mongoose = require("mongoose")
var path = require("path")

var db = require("./models")
var Note = require("./models/note.js")
var Article = require("./models/article.js")

var PORT = 3000
var app = express()

app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static("public"))

var exphbs = require("express-handlebars")

app.engine("hbs", exphbs({
  defaultLayout: "main",
  extname: '.hbs'
}))
app.set("view engine", "hbs")

// mongoose.connect("mongodb://localhost/nytarticles")

// If deployed, use the deployed database. Otherwise use the local mongoHeadlines database
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

// Set mongoose to leverage built in JavaScript ES6 Promises
// Connect to the Mongo DB
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI);

app.get("/", function (req, res) {
  Article.find({ "saved": false }, function (error, data) {
    var hbsObject = {
      article: data
    }
    console.log(hbsObject)
    res.render("home", hbsObject)
  })
})

app.get("/saved", function (req, res) {
  Article.find({ "saved": true }).populate("notes").exec(function (error, articles) {
    var hbsObject = {
      article: articles
    }
    res.render("saved", hbsObject)
  })
})

app.get("/note/:id", function (req, res) {
  Article.findById({ "_id": req.params.id })
  .then(function(dBarticle){
    let hbsObject = {
      article: dBarticle
    }
    console.log(dBarticle)
    res.render("note", hbsObject)
  })
})


app.get("/scrape", function (req, res) {
  request("https://www.nytimes.com/", function (error, response, html) {
    var $ = cheerio.load(html)
    $("article").each(function (i, element) {
      var result = {}
      result.title = $(this).children("h2").text()
      result.summary = $(this).children(".summary").text()
      result.link = $(this).children("h2").children("a").attr("href")
      var entry = new Article(result)
      entry.save(function (err, article) {
        if (err) {
          console.log(err)
        }
        else {console.log(article)}
      })
    })
    res.send("Articles scraped")
  })
})


app.get("/articles", function (req, res) {
  db.Article.find({ "_id": req.params.id })
    .then(function (dbArticle) {
      res.json(dbArticle)
    })
})

app.get("/articles/:id", function (req, res) {
  db.Article.findOne({ _id: req.params.id })
    .populate("note")
    .then(function (dbArticle) {
      res.json(dbArticle)
    })
})

app.post("/articles/:id", function (req, res) {
  db.Note.create(req.body)
    .then(function (dbNote) {
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true })
    })
    .then(function (dbArticle) {
      res.json(dbArticle)
    })
})

app.post("/articles/save/:id", function (req, res) {
  Article.findOneAndUpdate({ "_id": req.params.id }, { "saved": true })
    .exec(function (err, article) {
      if (err) {
        console.log(err)
      }
      else {
        res.send(article)
      }
    })
})

app.post("/articles/delete/:id", function (req, res) {
  Article.findOneAndUpdate({ "_id": req.params.id }, { "saved": false, "notes": [] })
    .exec(function (err, article) {
      if (err) {
        console.log(err)
      }
      else {
        res.send(article)
      }
    })
})

app.post("/notes/save/:id", function (req, res) {
  console.log(req.body.text, "is the body")
  var newNote = new Note({
    content: req.body.text,
    article: req.params.id
  })
  console.log(newNote,"test note")
  newNote.save(function (error, note) {
    if (error) {
      console.log(error)
    }
    else {
      Article.findOneAndUpdate({ "_id": req.params.id }, { $push: { "notes": note } })
        .exec(function (err) {
          if (err) {
            console.log(err)
            res.send(err)
          }
          else {
            res.send(note)
          }
        })
    }
  })
})

app.delete("/notes/delete/:note_id/:article_id", function (req, res) {
  Note.findOneAndRemove({ "_id": req.params.note_id }, function (err) {
    if (err) {
      console.log(err)
      res.send(err)
    }
    else {
      Article.findOneAndUpdate({ "_id": req.params.article_id }, { $pull: { "notes": req.params.note_id } })
        .exec(function (err) {
          if (err) {
            console.log(err)
            res.send(err)
          }
          else {
            res.send("Note Deleted")
          }
        })
    }
  })
})

app.listen(PORT, function () {
  console.log("App running on port", PORT)
})
