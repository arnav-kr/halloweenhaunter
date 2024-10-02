var nodemailer = require('nodemailer');
const express = require('express');
const path = require("path");
const rateLimit = require('express-rate-limit');
const app = express();
const bodyParser = require('body-parser');
const apiRequestLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minute
  max: 10, // limit each IP to 2 requests per windowMs
  handler: function(req, res, /*next*/) {
    return res.status(429).json({
      error: 'You have been Rate Limited! Please try after sometime.'
    })
  }
})
app.use((req, res, next) => {
  res.append('Access-Control-Allow-Origin', ['*']);
  res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.append('Access-Control-Allow-Headers', 'Content-Type');
  next();
});
app.use(express.json());
app.use(bodyParser.json());
app.use(
  express.urlencoded({
    extended: true
  })
);
app.use(express.static(path.join(__dirname + '/public/')));

var admin = require('firebase-admin');
const serviceAccount = JSON.parse(process.env.ADMIN_KEY);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  databaseAuthVariableOverride: {
    uid: process.env.SECRET_DATABASE_UID
  }
});
const db = admin.database();
const mails = db.ref('emails');
const treets = db.ref('treets');

var mailingList = [], Ntreets = 0;

mails.on('child_added', snap => {
  var val = snap.val();
  mailingList.push(val);
});

treets.on('value', snap => {
  var val = snap.val();
  Ntreets = val;
});


const transporter = nodemailer.createTransport({
  host: "smtp-mail.outlook.com", // hostname
  secureConnection: false, // TLS requires secureConnection to be false
  port: 587, // port for secure SMTP
  tls: {
    ciphers: 'SSLv3'
  },
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASS
  }
});

app.get('/', (req, res) => {
  res.send('Hello Express app!')
});

app.listen(3000, () => {
  console.log('server started');
});

app.get("/treets", (req, res) => {
  treets.set(Ntreets + 10);
  res.header({ 'Content-Type': "text/html" }).status(200).send(`<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Halloween Haunter 🎃 Treets 🍫</title>
  <link href="https://halloweenhaunter.repl.co/fonts.css" rel="stylesheet"
    type="text/css" />
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
	<meta http-equiv="X-UA-Compatible" content="IE=7">
	<meta http-equiv="Content-Type" content="text/html;charset=UTF-8">
	<link rel="shortcut icon" href="/favicon.jpg" type="image/x-icon">
	<link rel="apple-touch-icon" href="/favicon.jpg">
</head>

<body>
  <style>
    body {
      background-color: #212121;
      width: 100%;
      min-height: 100vh;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-family: 'Handwrite Inkblot', serif;
      font-weight: bold;
      font-size: 1.4rem;
      background-image: url(https://www.wowpatterns.com/assets/files/resource_thumbs/spooky-faces1.jpg);
      background-blend-mode: multiply;
    }

    .wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      color: red;
    }

    .wrapper span {
      margin: 16px 0;
    }

    .wrapper span:nth-child(2) {
      font-size: 1.7rem;
      color: #a048b5;
    }

    a:link,
    a {
      color: red;
      text-decoration: none;
      position: absolute;
      top: 16px;
      padding: 8px;
      box-shadow: 0 0 0 2px red;
    }
  </style>
  <div class="wrapper"><span>Total Treets 🍫 Collected:</span><span id="count">${Ntreets}</span></div>
  <a href="/">Go Home</a>
</body>

</html>`)
});

app.post("/haunt", apiRequestLimiter, (req, res) => {
  if (!req.body || !req.body.email || (/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,14}$/).test(req.body.email) == false) {
    return res.status(400).json({ data: "Invalid Request", code: 400 });
  }
  var email = req.body.email.replace(/\s\s+/g, ' ').trim();
  var whitelist = JSON.parse(process.env.WHITELIST);
  if (whitelist.includes(email) || mailingList.includes(email)) {
    return res.status(200).json({ data: "success", code: 200 });
  }
  mails.push(email).then(() => {
    sendMail(mailingList, res);
  });
});

function sendMail(people = [], res) {
  if (people.length == 0) return;
  var mailOptions = {
    from: `"Halloween Haunter" <${process.env.EMAIL}>`,
    to: people.join(", "),
    subject: 'Halloween Treet',
    text: 'Happy Halloween!',
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
      body{
        padding:8px;
        font-family:helvetica, sans-serif, consolas;
      }
      .button_link{
        margin:16px;
        border:0;
        border-radius:4px;
        padding:8px 16px;
        font-size:18px;
        color:white;
        text-decoration:none;
        background-color:#5d2b96;
      }
      .text-center{
        text-align:center;
      }
      h3 {
        margin-bottom:48px;
      }
      .img{
        width:100%;
      }
      .l{
        font-weight:bold;
        text-decoration:none;
      }
    </style>
</head>
<body>
  <img layout="responsive" alt="Happy Halloween Image!" class="img" src="https://www.designbold.com/academy/wp-content/uploads/2018/10/haloween-6.png" />
  <h1 class="text-center" align="center">happy Halloween🎃!</h1>
  <h2 class="text-center">Your Friend just haunted you!</h2>
  <h3 class="text-center">I am the Halloween Haunter who haunts people on the Halloween! <br /> You can also haunt someone at <a href="https://halloweenhaunter.repl.co">https://halloweenhaunter.repl.co</a></h3>
  <h3 class="text-center">I am colleting treets from everyone. You can also give me treets.<br>Opening the Below Link 1 time will give me 10 chocolates 🍫. Lets see how much i can collect this Halloween!</h3>
  <div align="center" style="margin-bottom:32px;">
    <a href="https://halloweenhaunter.repl.co/treets" class="button_link">Give Me 10 chocolates 🍫</a>
  </div>
  <p class="text-center">From now, You'll get an haunting email whenever someone haunts anyone.</p>
  <p class="text-center">For any queries you can mail me back.<br>And don't eat too much chocolates it may lead to tooth decay!</p>
  <footer>
    <p class="text-center">
      made with witchcraft by <a href="https://arnav.bio.link" class="l">Arnav</a>
    </p>
  </footer>
</body>
</html>`
  };
  transporter.sendMail(mailOptions, function(error, info) {
    if (error) {
      console.log(error);
      return res.status(200).json({ data: "A witch caught us while haunting!", code: 200 });
    }
    console.log('Message sent: ' + info.response);
    return res.status(200).json({ data: "Successfully haunted!", code: 200 });
  });

}
