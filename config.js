var config = {
	database: {
		host:	  'localhost', 	// database host
		user: 	  'root', 		// your database username
		password: '', 		// your database password
		port: 	  3306, 		// default MySQL port
		db: 	  'pink_gossip' 		// your database name
	},
	server: {
		//host: '34.238.246.50',
		host: '0.0.0.0',
		port: '8000'
	},
	base:{
		url:'http://35.173.211.225:6001'
	}
}

module.exports = config;
