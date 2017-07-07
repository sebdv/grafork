#!/usr/bin/env node

/**
 * Grafork dev server
 *
 * @version  3.0
 * @author  Sebastián del Valle
 */


var express = require('express')
,	app = express()
,	server = require('http').Server(app)
,	io = require('socket.io')(server)
,	http = require("http")
,	os = require("os")
,	colors = require('colors')
,	tty = require('tty')
,	fs = require('fs')
,	mongoose = require('mongoose')
,	passport = require('passport')
,	LocalStrategy = require('passport-local').Strategy
, 	session = require('cookie-session')
, 	bodyParser = require('body-parser')
, 	cookieParser = require('cookie-parser')
,	flash = require('connect-flash')
,	exec = require('child_process').exec
,	hostpublico = 'demo.grafork.com'
,	_estado = 0 //seguimiento del estado del thread
,	altoConsola = 10

//colores log:  1 rojo, 2 amarillo, 3 verde, 4 azul, 5 blanco
//significados: error, advertencia, interesante, automático, irrelevante

mongoose.connect('mongodb://'+(process.env.LOCAL?'localhost/test':'demo:demo666@ds037817.mongolab.com:37817/heroku_app26970718') , function(err) {
	if (err) { _log(1, 'No puedo conectarme a Mongo. Tipear `rs` para reiniciar. '.white.bold.bgRed + '\n\n'); process.exit() }
});
mongoose.connection.on('error', function() {
	_log(1, 'Conexión perdida a Mongo, tipear `rs` para reiniciar.'.bgRed)
	process.exit();
})
server.listen(p=process.env.PORT||3000)

_helpers = {
	/**
	 * Simulador de Curl
	 * @param {Object} url
	 */
	curl: function(url) {
		http.get('en.wikipedia.org/wiki/List_of_largest_companies_by_revenue', function(res) {
			_log(5, "tenimos ",res.statusCode);
			var pedazo="";
			res.on("data", function(trozo) {
				pedazo+=(trozo);
			});
			res.on("end", function(trozo) {
				_log(3, "finito",pedazo);
			});
		});
	},
};


//Cuentas
var userSchema = new mongoose.Schema({
	username: String,
	password: String,
	nombre: String,
 }, {
	// autoIndex: false, //recomendación de Mongoose para producción
	// http://mongoosejs.com/docs/api.html#model_Model.ensureIndexes
}
);
var User = mongoose.model('User', userSchema);


//Grafos
var grafoSchema = new mongoose.Schema({
	propietario: 'ObjectId',
	nombre: String,
	nodos: [{id:String, x:Number, y:Number}],
	aristas: [mongoose.Schema.Types.Mixed],
	compartido: [{usuario:'ObjectId', permisos:[{permiso:String}]}],
 }, {
	// autoIndex: false, //recomendación de Mongoose para producción
	// http://mongoosejs.com/docs/api.html#model_Model.ensureIndexes
});
Grafo = mongoose.model('Grafo', grafoSchema);


//PASSPORT
//
//
app.use(cookieParser());
app.use(flash());
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(session({ secret: '&#aAjkl3@~.,' }));
app.use(passport.initialize());
app.use(passport.session());


app.set('view engine', 'ejs')
app.engine('html', require('ejs').renderFile);
app.use("/js", express.static(__dirname+'/web/js'));
app.use("/bower", express.static(__dirname+'/bower_components'));
app.use("/css", express.static(__dirname+'/web/css'));
app.use("/s", express.static(__dirname+'/web/static'));
app.use("/test", function(req, res) {
	// res.render(__dirname+'/web/header.html', {coco:'ñam'});
	res.render(__dirname+'/web/logo.html', {coco:'ñom'});
	// res.render(__dirname+'/web/footer.html', {coco:'sham'});
});
app.get('/:modulo?/:submodulo?', function(req, res) {
	if(!req.user) return res.render(__dirname+'/web/login.html', {aviso: req.flash('error'), usuario: req.flash('el_usuario'), mod:req.params.modulo, smod:req.params.submodulo});
	smod = req.params.submodulo;
	switch(mod=req.params.modulo) {
		
		case undefined: //home
			Grafo.find({propietario: req.user._id}, function(err, r) {
				if(err) return res.end('mal')
				// console.log('todos estos son mios po wacho',r)
				res.render(__dirname+'/web/grafos.html',{
					css_base:'grafos',
					user: req.user,
					grafos: r,
					nombre: '',
					HOSTPUBLICO: process.env.LOCAL? os.hostname() : hostpublico,
					PUERTOPUBLICO: process.env.LOCAL? p : 80,
					user: req.user,
					sesion: req.user._id, //usado por socket.io, CAMBIAR ESTO, hay q evitar q el uid vaya en cookies
				})
			})
			break;
		case 'borrarGrafo':
			Grafo.findOne({_id:smod, propietario: req.user._id}, function(err, r) {
				if(err) { res.end('Permiso denegado, <a href=/>volver</a>')}
				// console.log('OK borrando grafo mío ', r)
				Grafo.remove({_id:smod, propietario: req.user._id}, function(err, r) {
					if(err) { res.end('failll, raro')}
					// console.log('OK borrado exitoso :P')
					res.redirect('/')
				})
			})			
			break;
		// case 'renombrarGrafo':
		// 	Grafo.findOne({_id:smod, propietario: req.user._id}, function(err, r) {
		// 		if(err) { res.end('Permiso denegado, <a href=/>volver</a>')}
		// 		console.log('OK renombrando grafo mío ', r, req.params.n)
		// 		// Grafo.update({_id:smod, propietario: req.user._id}, {$set: {nombre:nombre}}, function(err, r) {
		// 		// 	if(err) { res.end('failll, raro')}
		// 		// 	console.log('OK borrado exitoso :P')
		// 		// 	res.redirect('/')
		// 		// })
		// 	})			
		// 	break;
		case 'grafo':
			// return res.end('abriendo grafo '+req.params.submodulo)
			if(smod=='nuevo') {
				_log(5, 'me piden nuevooooo')
				// res.redirect('/pene')
				n = new Grafo({nombre:'Sin titulo', propietario: req.user._id })
				n.save(function(err, g) {
					if(err) return res.end('fail');
					// console.log('tenimo', req.user._id ,g._id, g)
					res.redirect('/grafo/'+g._id)
				})
			} else {
				// console.log('todo normal '+smod )
				if (!smod || smod.length < 3) { res.redirect('/'); return; }
				// console.log('Aceptando solicitud con smod: ', smod)

				Grafo.findOne({_id:smod, propietario: req.user._id}, function(err, r) {
					if(err || !r) { res.writeHeader(200, {"Content-Type": "text/html"}); res.end('Grafo no encontrado en tu cuenta, <a href=/>volver</a>'); return }

					// console.log('OK accediendo a grafo mío ', r)
					var Nodos=[], Aristas=[];
					// console.log('el total de ndos es '+r.nodos.length)
					for(i=0; i<r.nodos.length; i++) {
						n=r.nodos[i]
						Nodos.push("{x:"+n.x+", y:"+n.y+"}")
						// console.log('metiendo nodo en arreglo de nodos')
					}
					for(i=0; i<r.aristas.length; i++) {
						a=r.aristas[i]
						Aristas.push("['"+a[0]+"', '"+a[1]+"']")
						// console.log('metiendo Arista en arreglo de aristas')
					}
					res.render(__dirname+'/web/grafo.html',{
						css_base:'grafo',
						HOSTPUBLICO: process.env.LOCAL? os.hostname() : hostpublico,
						PUERTOPUBLICO: process.env.LOCAL? p : 80,
						user: req.user,
						sesion: req.user._id, //usado por socket.io, CAMBIAR ESTO, hay q evitar q el uid vaya en cookies
						grafo_id: smod,
						nodos: Nodos,
						aristas: Aristas,
						nombre: r.nombre,
					})
				})
			}
			break;
		case 'logout':
			req.logout();
			res.redirect('/');
			break;
		default:
			return res.end('fail '+req.params.modulo)
			break;
	}
});


/**
 * Millones de cosas de PASSPORT
 */

passport.use(new LocalStrategy(
  function(username, password, done) {
  	console.log('tratando de loguearte',username,password)
    User.findOne({ username: username, password:password }, function(err, user) {
    	_log(5, 'mongoose dice',err,user)
      if (err) { return done(err); }
      if (!user || user.password != password) {
        return done(null, false, { message: 'Usuario o clave no válidos.' });
      }
      return done(null, user);
    });
  }
));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});


//Importacion
app.post('/importar', function(req, res) {
	if(!req.user) {
		res.end('Sorry :/')
		_log(1, 'Import fallado')
	}
	// data = JSON.parse(req.body)
	data = JSON.parse(JSON.stringify(req.body));
	_log('4, Importando grafo para %s (%s) :)',  req.user, data.nombre)
	n = new Grafo({nombre:data.nombre, propietario: req.user._id, nodos: data.grafo.nodos, aristas:data.grafo.aristas})
	n.save(function(err, g) {
		if(err) return res.json({estado:'ERROR'});
		res.json({estado: 'OK', id:g._id})
	})

})


//Login
app.get('/login', function(r,res) { res.redirect('/') });
app.post('/login/:modulo?/:submodulo?', function(req, res, next) {
	urimodulo = req.params.modulo!='undefined' ? req.params.modulo : ''
	urismodulo = req.params.submodulo!='undefined' ? req.params.submodulo : ''
	loginuri = '/'+urimodulo+(urismodulo.length>0?'/'+urismodulo : '');

  _log(4, 'ejecutando passport.authenticate y dirigiendo a ',loginuri);
  passport.authenticate('local', function(err, user, info) {
    if (err) { return next(err); }
    if (!user) { 
    	req.flash('error', 'Usuario o contraseña inválidos.' ); 
    	req.flash('el_usuario', req.body.username); 
    	return res.redirect(loginuri); 
    }
    req.logIn(user, function(err) {
      if (err) { return next(err); }
      return res.redirect(loginuri);
    });
  })(req, res, next);
});





function fallaSocket (socket) {
	_log(2, 'Cliente '.red+socket.id.red.bold+' intenta ejecutar acción pero no ha iniciado sesión (init), fail.'.red)
}

io.on('connection', function (socket) {
	var misesion = null;
	var micanal = null;
	_log(4, 'socket conectado: '+socket.id+' a '+socket.nsp.name)
	socket.emit('hi'); //solicitarle que envíe su sesión (para que su socket esté alineado con su cuenta y pueda guardar cambios)

	socket.on('disconnect', function () {
		_log(4, 'desconectado '+socket.id)
	})

  socket.on('init', function (data) {
    // _log(4, 'cliente inicia sesion '+socket.nsp.name+ ' .. '+ data);
    // socket.broadcast.emit('conectarNodos',data)
    misesion = data[0];
    micanal = 'g/'+data[1];
    socket.join(micanal); //obligarlo a cambiar su nsp.name para que sólo se comunique con el grafo q tiene abierto y no haya interferencia
	socket.emit('ack', misesion);
  });

  socket.on('ts', function() {
  	// _log(4, 'cliente pide ping')
  	socket.emit('ts')
  });
  socket.on('acc', function (ops) {
  	data=ops.data
  	// console.log('recibido acc',ops)
  	/**
  	 * Acá apliqué una prueba de concepto: esta función recibe la sesión almacenada en el cliente,
  	 * la cual fue enviada por AJAX, pero también utiliza la sesión que el cliente envió al momento
  	 * de identificarse, la cual quedó almacenada en la memoria del servidor. Básicamente quiero
  	 * ver si hace falta enviar la sesión por AJAX o no; como medida de seguridad preferiría que no.
  	 *
  	 * Enviar mensaje a todos en un canal: io.to(canal).emit()
  	 * Enviar mensaje a otros en un canal: socket.to(canal).emit()
  	 */
  	if (!misesion) fallaSocket(socket)
  	data = ops.data;
	if(ops.data.sesion != misesion) {
		_log(2, 'Recibida acción sin sesión: '+ops.acc+' ('+misesion+'!='+data.sesion+')')
	} 
  	
  	// console.log('Accion de cliente '.yellow+misesion+': ', ops)
  	

  	/**
  	 * Operaciones del usuario en la página del grafo
  	 */
  	switch(ops.acc) {
  		case 'conectar':
		    socket.to(micanal).broadcast.emit('acc',{acc: 'conectar', data:data})
  			break;

  		case 'crear':
		    socket.to(micanal).broadcast.emit('acc',{acc: 'crear', data:data})
  			break;
  		
  		case 'respuestaPregunta':
			User.findOne({ _id: misesion }, function(err, user) {
				if(err) _log(1, 'no pude guardar misdatos: '+err)
				else {
					misdatos = user;
				    _log(4, 'Respuesta de '+misdatos.username+': '+data.r);
				}
			})
  			break;
  		
  		case 'mover':
		    socket.to(micanal).broadcast.emit('acc', {acc: 'mover',data:data})
  			break;
  		
  		case 'renombrar':
		  	(function(data) { //envolví la data para evitar que sea sobreescrita mientras se ejecuta la búsqueda
				Grafo.findOne({_id:data.grafo_id, propietario: data.sesion}, function(err, r) {
					console.log('Anda bien', err,r,data)
					if(err) { res.end('Permiso denegado')}
					console.log('OK renombrando grafo mío ', misesion, data.sesion, data.nombre, r)
					Grafo.update({_id:data.grafo_id, propietario: misesion}, {$set: {nombre:data.nombre}}, function(err, r) {
						if(err) { return socket.emit('error','no pude renombrar') }
						console.log('OK renombrado via socket.io exitoso para', data.grafo_id, data.nombre)
						socket.to(micanal).emit('acc', {acc:'renombrar', data:data.nombre})
					})
				})

		  	})(data)
  			break;
  		
  		case 'guardar':
		  	(function(data) {
				Grafo.findOne({_id:data.grafo_id, propietario: data.sesion}, function(err, r) {
					if(err) { res.end('Permiso denegado')}
					// console.log('OK guardando grafo mío ', misesion, data.sesion, data.nombre, r)
					Grafo.update({_id:data.grafo_id, propietario: misesion}, {$set: {nodos:data.nodos, aristas:data.aristas}}, function(err, r) {
						if(err) { return socket.emit('error','no pude renombrar') }
						// console.log('OK guardado via socket.io exitoso para', data.grafo_id, data.nodos, data.aristas)
						_log(4, 'Grafo guardado '+ data.grafo_id)
						socket.emit('guardado', true)
					})
				})

		  	})(data)
  			break;

  		case '':
  			break;

  		default:
  			_log(1, 'Esta accion ('+(ops.acc||'').yellow+') no está definida en el servidor')
  			break;
  	}
  });

}); //socket







Log = [];

cursor = function (h, w) {
	process.stdout.write("\u001B[" + h + ";" + w + "f");
};

_tty = [process.stdout.columns, process.stdout.rows];

//Log = 10~14
log_top = _tty[1]-altoConsola;
log_fin = _tty[1]-1;





/**
 * MECANISMO DIFERENCIADOR ENTRE HEROKU Y LOCAL
 */
if (process.env.LOCAL && !process.env.DEV) { //local

	process.on('SIGINT', function() {
		if (_estado != 3) {
			_estado = 3;
			cursor(1,1); _wr('')
			cursor(2,1); _wr('')
			cursor(3,1); _wr('')
			_log(1, 'mataste el servidor .. cómo te sientes ahora?\n\n'.black.bgYellow);
			setTimeout(function() {process.kill()},100)
		}
	});

	_wr = function(s) { process.stdout.clearLine(); process.stdout.write(s); };
	_cur = function(s) {
		h=_tty[1]-1; //posicionar cursor 1 línea antes del final, para q los <enter> no agranden el buffer
		cursor(h,1); _wr(s!=null?s:'>>')
		cursor(h,s!=null?1:4);
	}
	logSimbolo = function(parms) {
		// console.log('simbo ',parms)
		if (!parms[0] && parms[0]!==0) return ''
		z = '§';
		s = ''+parms[0]
		if (s==0) z = '';
		if (s==1) z = z.red.bold;
		if (s==2) z = z.yellow.bold;
		if (s==3) z = z.green.bold;
		if (s==4) z = z.blue.bold;
		if (s==5) z = z.white.bold;
		// mensaje = JSON.stringify(parms[1]).replace(/\n/g, ''); //experimento pa q los objetos sean strings
		mensaje = parms[1];
		return z + ' '+mensaje;
	}

	/**
	 * Genera registro de un mensaje en el buffer de la consola de Grafork
	 * 
	 * @param  {int} lvl  Nivel de importancia del aviso (1...5) siendo 1 rojo y 5 gris
	 * @param  {str} s    Contenido que se quiere incorporar al registro
	 * @author sebcl
	 */
	_log = function (lvl, s) {
		Log.push([lvl, s]); //guardar nivel y mensaje
		ll = Log.length;
		max = log_fin-log_top;
		// cursor(15,1); console.log(max,ll) //debug
		for (i=0;i<max;i++) {
			li = Log[ll-max+i] || ''; 
			cursor(log_top + i, 1)
			_wr(logSimbolo(li));
			// console.log(logSimbolo(li))
			// console.log('logueando'.red,li , 'log actual:'.yellow, Log)
		}
		_cur(); //devolver cursor a la consola
	};



	init = function(reinit) {
		fraseSC = '   The Adjacency Matrix Has You @ http://'+os.hostname()+':'+p+'   ';
		frase = ('   The Adjacency Matrix Has You '+('> ').grey+('http://'+os.hostname()+':'+p).yellow.bold+'   ').bold.blackBG.cyan;
		left = Math.floor((process.stdout.columns/2) - (fraseSC.length/2)); //calcular centrado del texto
		
		cursor(1,1)
		_wr('\u001B[2J\u001B[0;0f'); //clear
		_wr(Array(process.stdout.columns).join('`').zalgo.green.bold); //un lindo zalgo adaptable al tamaño del terminal
		cursor(3,left);
		_wr(frase); //tirar texto centrado
		!reinit? _log(0, 'Bienvenido a la consola de Grafork, escriba "?" para ayuda.'.grey) :0;
		_cur()
	};
	init();
	exec('osascript -e \'display notification "Servidor iniciado OK" with title "Grafork"\'', function() {})

} else { // heroku
	if (process.env.DEV) {
		exec('osascript -e \'display notification "Servidor dev OK" with title "Grafork"\'', function() {})
	}
	_log = console.log;
	_cur = function() {}
	_log(2, 'iniciado en http://'+os.hostname()+':'+p)
}



/**
 * Función para encontrar todas las concidencias de una expresión degular
 * 
 * @param  {str} str Contenido
 * @param  {re} re   Expresión regular a ejecutar
 * @return {str}
 */
matchAll = function(str, re) {
    var i, r, res, resultados;
    res = [];
    resultados = [];
    while (r = re.exec(str)) {
      res.push(r);
    }
    for (i in res) {
      resultados.push(res[i]);
    }
    return resultados;
  };


/**
 * -Consola de Grafork
 *
 * Permite interactuar directamente en la consola con un sinfin de operaciones útiles a la hora de desarrollar
 * 
 */
process.stdin.on('data', function(d) {
	// _log(4, 'tenimo',d, d.toString(), d.toString().match(/([\d\w]+) (.*)/), 'XD');
	var raw = d.toString().trim().match(/([\d\w\?]+) ?(.*)/); raw=raw?raw:['',''];
	var cmd = raw[1];
	var parms = raw[2];

	switch(cmd) {

		case 'preg': //Envía una pregunta urgente y escucha respuesta
			if (!parms) { _log(2, 'uso: preg <mensaje>'); break }
			_log(3,'enviando pregunta',parms)
			io.sockets.emit('pregunta', parms)
			break

		case 'rs': //Reinicia el servidor
			return true;
			break;

		case 'aviso': //Envía un aviso a todos los sockets
			if (!parms) { _log(2, 'uso: aviso <mensaje>'); break }
			_log(3, 'enviando aviso a usuarios: '+parms);
			io.sockets.emit('aviso', parms);
			break;

		case 'add': //Añade un usuario aleatorio con la clave '123'
			if (!parms) { _log(2, 'uso: add <usuario> [<clave>]'); break }
			u = parms.split(' ')[0];
			c = parms.split(' ')[1]?parms.split(' ')[1]:'123';
			_log(3, 'agregando usuario `'+u+'` con clave `'+c+'`..')
			cu = new User({username:u, password:c, nombre:u+' (creado por consola)'})
			cu.save(function(err) {
				if(err) _log(2, 'fail '+err)
				else _log(3, 'OK :)')
			});
			break;


		case '?': //Muestra esta ayuda
			_log(3, 'comandos disponibles:'.bgWhite.black)
	        fs.readFile(__filename, function(e, r) {
	        	// _log('tenimo',r)
				for (i in c = matchAll(r, /case '([\w\d]+)': \/\/(.+)/g)) {
					sps = 10;
					sps = Array(sps-c[i][1].length).join(' ');
					_log(3, c[i][1].yellow + sps + c[i][2]);
				}
			});
			break;

		case '':
			break;
		default:
			_log(1, 'no reconozco "'+cmd+'"')
			break;
	}
	// process.stdout.write('>> ')
	_cur()
});
