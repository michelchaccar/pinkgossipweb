const express = require('express');
const path = require('path');


const expressLayouts = require('express-ejs-layouts');

// init app
const app = express();

// load view
app.set('views', path.join(__dirname, './admin/views'));

app.set('view engine', 'ejs');

// load connection
var mysql = require('mysql');
var myConnection = require('express-myconnection');
var config = require('./config');
var dbOptions = {
	host: config.database.host,
	user: config.database.user,
	password: config.database.password,
	port: config.database.port,
	database: config.database.db
}
global.base_url = config.base.url;
app.use(myConnection(mysql, dbOptions, 'pool'));


// session
var session = require('express-session');
app.use(session({
	secret: 'session_cookie_secret',
	resave: false,
	saveUninitialized: false
}));

// flash
const flash = require('express-flash');
app.use(flash());


// body Parser
var bodyParser = require('body-parser');
//app.use(bodyParser.urlencoded({ extended: true }));
//app.use(bodyParser.json())
app.use(bodyParser.json({ limit: '200mb' }));
app.use(bodyParser.urlencoded({ limit: '200mb', extended: true }));

app.use('/api',express.static(path.resolve(__dirname,'public/upload')))
app.use('/img',express.static(path.resolve(__dirname,'public/upload')))
app.use('/.well-known',express.static(path.resolve(__dirname,'public/upload')))
app.use('/img', express.static(path.resolve(__dirname, 'public/assets/img')));
app.use('/css', express.static(path.resolve(__dirname, 'public/assets/css')));
app.use('/js', express.static(path.resolve(__dirname, 'public/assets/js')));


app.get('/', (req, res) => { res.send('Hello ....'); });

// load route
// API Routes
const apiRoutes = require('./api/routes/Routes');
app.use('/api', apiRoutes);

app.use('/thirdparty', apiRoutes);

// Admin Routes
const adminRoutes = require('./admin/routes/Routes');
const webRoutes = require('./web/routes/Routes');
app.use('/admin', adminRoutes);
app.use('/', webRoutes);
app.use('/web', webRoutes);

app.locals.BASE_URL = "https://pinkgossipapp.com";
//app.locals.BASE_URL = "http://localhost:8000";

// start server
app.listen(8000, function(){
  console.log("start server http://localhost:8000");
});
