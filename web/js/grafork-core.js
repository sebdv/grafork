/**
 * grafork-core.js
 * 
 * Clase principal del manejador de grafos
 * pensada para permitir múltiples instancias en el futuro (quizás sea innecesario) (seguramente lo sea ¬¬)
 *
 * @package  Grafork
 * @author Sebastián del Valle
 * @version  2014.6.5
 */


Grafork = {
	//vars
	totalNodos: 0,
	totalAristas: 0,
	contenedorGrafo: "",
	grafo: {nodos:[], aristas:[]},
	nodoSeleccionado: null,
	titulo: '',
	grafo_id: '',
	sesion: '',
	io: null,
	socket: null,
	latencia: 666,
	latTS: 666,
	ultimoCambio: false,
	inspeccionando: false,
	zoom: 1,
	paneando: false,
	paneoDesde: [0,0],
	posGrafo: {x:0, y:0},

	/**
	 * Recorre una definición de grafo y dibuja sus nodos y aristas
	 * 
	 * @param  {[type]} grafo [description]
	 * @return {[type]}       [description]
	 */
	dibujarGrafo: function(grafo) {
		this.grafo = grafo;
		$this = this;
		grafo.nodos.forEach(function(e) { $this.dibujarNodo(e); });
		this.conectarTodoCTM();
		this.ultimoCambio = this.grafo;

		// WATCH DESACTIVADO POR INCOMPATIBILIDAD EN CHROME -- TODO: implementar metodo inteligente de salvado q sea llamado por todas las operaciones
        // watch(Grafork.grafo, function() { $this.huboCambios() })

	},


	conectarTodoCTM: function() {
		//TODO: esta función debería conectar SOLO los grafos visibles para la cámara
		if (!this.grafo.nodos) throw "Error mega critico";
		this.grafo.aristas.forEach(function(e) { $this.conectarNodos(e); });
	},

	/**
	 * Observa un objeto para estar pendiente de sus cambios
	 *
	 * @obs Esta función no está optimizada y no resuelve el problema de Watch realmente, no usar por ahora.
	 */
	watch: function(obj, f) {
		$this=this;
		$this._watch.objetos.push({objeto: obj, callback:f, ultimoEstado:{watchIniciando:true} });
	},
	iniciarWatch: function() {
		Grafork._watch = { objetos: [] };
		setInterval(function() {
			W = Grafork._watch.objetos;
			console.log('supervisando', W.length, 'objetos');
			W.forEach(function(e,i ) {
				// console.log('viendo item',i,e)
				if (JSON.stringify(e.ultimoEstado) === JSON.stringify({wachIniciando:true})) {
					e.ultimoEstado = e.objeto;
					console.log('inicializando', e.ultimoEstado, e.objeto)
				} else {
					if (JSON.stringify(e.ultimoEstado) !== JSON.stringify(e.objeto)) {
						e.callback();
						console.log('hubo un cambio en objeto', i, e.ultimoEstado, e.objeto);
						e.ultimoEstado = e.objeto;
					}
				}
			});//foreach
		}, 1500)
	},


	/**
	 * Dibuja el terrible nodo
	 * 
	 * @param  {[type]} nodo [description]
	 * @return {[type]}      [description]
	 */
	dibujarNodo: function(nodo) {
		eNodo = document.createElement('div');
		this.contenedorGrafo.appendChild(eNodo);
		eNodo.id = (nodo.id ? nodo.id : 'nodo'+this.totalNodos);
		eNodo.style.webkitTransform = 'translate3d('+nodo.x+'px, '+nodo.y+'px, 0)';
		eNodo.style.transform = 'translate3d('+nodo.x+'px, '+nodo.y+'px, 0)';
		eNodo.className="nodo";
		eNodo.innerHTML=".";
		this.totalNodos++;
		$this = this;

		$(eNodo).draggableTouch();
	},




	/**
	 * Distribuir nodos en forma de cuadrícula (hasta un ancho de 1200)
	 *
	 * TODO: Meter esto en un subjeto llamado "algoritmos", en una función "aplicarVisualizacion"
	 * @return {Object} [description]
	 */
	_forma1Activa:false,
	_forma1: function() {
		if(this._forma1Activa) return
		// console.log('DENTRO');
		css = document.createElement('style');
		css.id='holi';
		css.innerHTML='.arista{display:none} .nodo{ transition:.8s}';
		document.body.appendChild(css);


		this.grafo.nodos.forEach(function(e,i) {
			if(i==0) return
			$nodo = document.querySelector('#'+e.id);
			x = i*100 % 1200;
			y = 150 * Math.ceil((i*100)/1200) - 150;

			$nodo.style.webkitTransform = 'translate3d('+x+'px, '+y+'px, 0)';
			$nodo.style.transform = 'translate3d('+x+'px, '+y+'px, 0)';
		});
		Grafork.conectarTodoCTM();

		setTimeout(function() { document.querySelector('#holi').remove(); }, 1000);
		this._forma1Activa=1;
	},


	/**
	 * Desplazar nodos a sus posiciones originales
	 *
	 * TODO: Leer TODO de la función anterior, esto tb es parte de eso
	 * @return {Object} [description]
	 */
	_formaOriginal: function() {
		this._forma1Activa=0;
		console.log('FUERA');
		css = document.createElement('style');
		css.id='holi';
		css.innerHTML='.arista{display:none} .nodo{ transition:.8s}';
		document.body.appendChild(css);


		this.grafo.nodos.forEach(function(e,i) {
			if(i==0) return
			$nodo = document.querySelector('#'+e.id);
			// x = i*100 % 1200;
			// y = 150 * Math.ceil((i*100)/1200) - 150

			$nodo.style.webkitTransform = 'translate3d('+e.x+'px, '+e.y+'px, 0)';
			$nodo.style.transform = 'translate3d('+e.x+'px, '+e.y+'px, 0)';
		});
		Grafork.conectarTodoCTM();

		setTimeout(function() { document.querySelector('#holi').remove(); }, 1000);
	},



	/**
	 * Generar un grafo aleatorio
	 *
	 * TODO: Esto debería ir en un subobjeto principal llamado grafo, luego generar, luego random
	 * @return {[type]} [description]
	 */
	grafoRandom: function() {
		nodos = [];
		aristas = [];
		for(i=0; i<20; i++) {
			nodos.push({id:'nodo'+(i), x:Math.random()*1200, y:Math.random()*700});
		}
		for(i=0; i<20; i++) {
			// aristas.push(['nodo'+Math.floor(Math.random()*80), 'nodo'+Math.floor(Math.random()*30)]);
			aristas.push(['nodo'+i, 'nodo'+Math.floor(Math.random()*20)]);
		}

		this.dibujarGrafo({
			nodos: nodos,
			aristas: aristas
		});

	},

	/**
	 * Devuelve la posición X, Y en un arreglo, basándose en el trasnform del objeto
	 * La implementación del movimiento de aristas es más ineficiente que la mierda, esta función es llamada muchisimas veces
	 * 
	 * @param {String}	    obj   Opcional: ID del elemento
	 * @param {DOM Object}  obj   Opcional: elemento como objeto del DOM
	 */
	XYdesdeTransform: function(obj) {
		// console.log('XYT',obj)
		obj = typeof obj == 'string' ? document.querySelector('#'+obj) : obj; //buscar objeto en el dom si mandan un id
		// console.log('ahora es',obj)
		// console.log('tenimo',obj.style.webkitTransform,obj.style.transform)
		transform = document.body.style.webkitTransform==undefined ? obj.style.transform : obj.style.webkitTransform
		reg = transform.match(/\(([-\d\.]+)px, ?([-\d\.]+)px, ?0/);
		// console.log('extrajimos reg',obj.style.webkitTransform,reg)
		return reg&&reg[1] ? {x: parseInt(reg[1]), y:parseInt(reg[2])} : {x:0,y:0};
	},

	/**
	 * Devuelve un string de escala para usar dentro de un Transform 
	 */
	escalaCSS: function() {
		return 'scale3d('+$this.zoom+','+$this.zoom+','+$this.zoom+')';
	},

	posicionCSS: function() {
		X = $this.posGrafo.x;
		Y = $this.posGrafo.y;
		return 'translate3d('+X+'px, '+Y+'px, 0)';
	},

	/**
	 * Conectar
	 * 
	 * Crea una arista entre el un nodo "origen" y un nodo "destino"
	 * la función está pensada para ser llamada mientras el usuario mueve el nodo destino,
	 * por lo tanto la arista será posicionada en las coordenadas del nodo origen y estirada
	 * hacia la ubicación del destino, cuya posición puede ser enviada al llamar la función,
	 * evitando que se vuelva a calcular innecesariamente.
	 *
	 * NOTA: Esta función no debe llamarse aisladamente, sino dentro del loop de ConectarTodoCTM()
	 *
	 * 
	 * @param  {Array} nodos  Arreglo de nodos que conectará esta arista
	 * @param  {Int}   posDestino  [description]
	 */
	conectarNodos: function(nodos, posDestino) {

		// <div id="ar26" class="arista conecta-nodo20 conecta-nodo22">
		
		// encontrar arista en el DOM o crearla si es necesario
		// console.log('tenimooo', this.contenedorGrafo)
		arista = document.querySelector('.conecta-'+nodos[0]+'.conecta-'+nodos[1]);
		if (!arista) {
			$ar = document.createElement('div');
			$ar.id = "ar"+ this.totalAristas++;
			$ar.className = 'arista conecta-'+nodos[0]+' conecta-'+nodos[1];
			this.contenedorGrafo.appendChild($ar);
			arista = $ar;
		}


		nodo1 = document.querySelector('#'+nodos[0]);
		nodo2 = document.querySelector('#'+nodos[1]);
		posDestino = posDestino&&posDestino.x ? posDestino : this.XYdesdeTransform(nodos[0]); // {left:X, top:Y}
		// console.log('buscando origen',nodos)
		posOrigen = this.XYdesdeTransform(nodos[1]);

		x1 = posOrigen.x;
		y1 = posOrigen.y;

		x2 = posDestino.x;
		y2 = posDestino.y;

		angulo = Math.atan2((y2-y1) , (x2-x1)) * 180 / Math.PI;
		distancia = Math.sqrt(Math.pow(x2-x1,2) + Math.pow(y2-y1,2));

		trans = 'translate3d('+(x1+30)+'px, '+(y1+40)+'px, 0) rotateZ('+angulo+'deg)';
		// console.log('cambiando css de arista', [x1,y1], [x2, y2], angulo, [distancia])


		arista.style.webkitTransform=trans;
		arista.style.transform=trans;
		arista.style.width=distancia+'px';
	},



	/**
	 * Comprueba si existe una conexion entre dos nodos
	 * 
	 * @param  {Arr} nodos Arreglo de nodos
	 * @return {Bool}       Existencia
	 */
	existeConexion: function(nodos) {
		//FIXME
		return true;
	},


	procesarAccion: function(ops) {
		$this = this;
		data = ops.data;
		console.log('recibida accion del server',ops,'con data',data,'y la accion es',ops.acc)

		switch(ops.acc) {
	  		case 'crear':
				_nodo = data.nodo;
				// console.log('remoto pide crear nodo',_nodo)
				$this.grafo.nodos.push(_nodo)
				$this.dibujarNodo(_nodo)
	  			break;
	  		
	  		case 'mover':
				nodo=data.nodo;
				pos=data.pos;
				// console.log('me piden mover',nodo,pos)
	            trans = 'translate3d('+(pos.left)+'px, '+(pos.top)+'px, 0)'
	            $('#'+nodo).css({
	                '-webkit-transform': trans,
	                '-moz-transform': trans,
	                'transform': trans,
	            });
	            $this.conectarTodoCTM()
	  			break;
	  		
	  		case 'renombrar':
	  			// console.log('server anuncia cambio de nombre',ops)
	  			$this.cambiarTitulo(data)
	  			break;
	  		
	  		case 'conectar':
	  			nodos = data;
				// console.log('remoto pide conectar',nodos)
				$this.grafo.aristas.push(nodos)
				$this.conectarTodoCTM()
	  			break;

			default:
				// console.log('recibido mensaje extraño del server',data)
				break;
		}
	},



	deseleccionarNodos: function() {
		// $('#'+this.nodoSeleccionado).css('background','gray')
		$('.nodo.seleccionado').removeClass('seleccionado')
		this.nodoSeleccionado = null;
	},


	cambiarTitulo: function(tituloForzado) {
		nuevoTitulo= tituloForzado || ''
		while(nuevoTitulo=='')
			nuevoTitulo = prompt('Ingrese un título para este grafo', this.titulo) || null
		if(nuevoTitulo) this.titulo=nuevoTitulo
		else return console.log('No hubo cambios')

		$('.cambiaTitulo').text(this.titulo)
		document.title=this.titulo+' — Grafork demo'

		//anunciar cambio a server si fue manual
		if (!tituloForzado) {
			// console.log('ejecutando renombrarGrafo', {sesion:this.sesion, grafo_id:this.grafo_id, nombre:this.titulo});
			this.socket.emit('acc', {acc:'renombrar', data:{sesion:this.sesion, grafo_id:this.grafo_id, nombre:this.titulo}});
		}
	},

	guardarGrafo: function() {
		// console.log('ejecutando guardarGrafo', {sesion:this.sesion, grafo_id:this.grafo_id, nodos:this.grafo.nodos, aristas:this.grafo.aristas});
		this.socket.emit('acc', {acc:'guardar', data: {sesion:this.sesion, grafo_id:this.grafo_id, nodos:this.grafo.nodos, aristas:this.grafo.aristas}});

	},


	tcambios:null,
	huboCambios: function() {
		if (this.tcambios) {
			// console.log('ya hay un timer de cambios, reiniciando timer')
			clearTimeout(this.tcambios); //reiniciar timer
		} else {
			// console.log('hubo cambios en el grafo, guardando en 1,5s..')
		}
		$('.txt-guardando').show().text('Guardando cambios..')
		$this=this;
		this.tcambios = setTimeout(function() { 
			$this.tcambios=null; 
			$this.guardarGrafo();
		}, 1500)
	},


	numeroNodo: function(id) {
		return typeof(id)=='number' ? id : id.substring(4)
	},


	/**
	 * Establece el estado de la aplicación 
	 *
	 * 1 = Conectado
	 * 0 = Desconectado
	 * 5 = Iniciando conexión
	 * 6 = Problema desconocido con servidor
	 * 
	 * 
	 * @return {[type]} [description]
	 */
	cambiarEstado: function(estado) {
		this.estado = estado;
		colores = [
			'red',											//0
			'white',										//1
			'blue',											//2
			'blue',											//3
			'blue',											//4
			'orange',										//5
			'orange',										//6
		];
		razones = [
			'Desconectado de la nube',						//0
			'Conectado a la nube (' +this.latencia+'ms)',	//1
			'Error sin descripción (código 2)',				//2
			'Error sin descripción (código 3)',				//3
			'Error sin descripción (código 4)',				//4
			'Problemas con la nube',						//5
			'Tiempo de respuesta agotado',					//6
		];
		$('.estado-conexion').css('color', colores[estado]);
		$('.estado-conexion').attr('title', razones[estado]);
		$('.estado-conexion').tooltip('destroy');
		$('.estado-conexion').tooltip({container:'body'});
	},


	ping: function(r) {
		// console.log('ping',r)
		ts = (new Date()).getTime();
		$this = this;
		if (r) {
			this.latencia = ts - this.latTS;
			this.cambiarEstado(1);
			clearTimeout(this.pingtimeout)
			// console.log('recibiendo respuesta de ping, total '+this.latencia)
		} else {
			this.latTS = ts;
			this.socket.emit('ts');
			//este número debería ser hotfixeable (o sea: q el server me diga cada cuanto quiere que le vuelva a preguntar, de manera q en caso de estar sobrecargado, q no haya mil usuarios pingeandolo)
			this.tping = setTimeout(function() {$this.ping()}, 15000) 
			this.pingtimeout = setTimeout(function() {
				// cleaerTimeout($this.tping);
				$this.cambiarEstado(6);
				console.log('servidor no respondió PING')
			},4000)
		}
	},

	
	inspeccionar: function(e) {
		$this = this;
		$this.inspeccionando = e;
		if (e==null) {
			$('#inspector').fadeOut()
		} else {
			$('#inspector').fadeIn()
			nodo = $this.grafo.nodos[e.id.replace('nodo','')]
			// console.log(nodo,e)
			$('#inspector .nombre').html(e.id)
			$('#inspector #nodo_x').val(nodo.x)
			$('#inspector #nodo_y').val(nodo.y)
			$('#inspector #nodo_peso').val(nodo.peso||1)
			$('#inspector #nodo_label').val(nodo.label||'')
		}
	},


	realizarPaneo: function(e) {
		$grafo = $('#grafo');

		//calcular distancia del movimiento
		Xdiff = e.clientX - $this.paneoDesde[0]
		Ydiff = e.clientY - $this.paneoDesde[1]
		

		//sumar a posicion actual del grafo
		X = Xdiff + $this.posGrafo.x
		Y = Ydiff + $this.posGrafo.y

		// console.log('movimiento sexy', X, Y, trans)

		trans = 'translate3d('+X+'px, '+Y+'px, 0) '+$this.escalaCSS();
		$grafo.css({
			'-webkit-transform': trans,
			'-moz-transform': trans,
			'transform': trans,
		});

		// orig = X+'px '+Y+'px';
		// $grafo.css({
		// 	'-webkit-transform-origin': orig,
		// 	'-moz-transform-origin': orig,
		// 	'transform-origin': orig,
		// });
	},




	/**
	 * INICIO DE LA APLICACIÓN, GATILLADO DESDE LA PÁGINA WEB
	 * 
	 * @param  {[type]} ops [description]
	 * @return {[type]}     [description]
	 */
	drageando: false,
	res: false,
	anteriorMouseX: 0,
	anteriorMouseY: 0,
	iniciar: function(ops) {
		io=ops.c[0];
		$this=this;
		this.socket = io(ops.c[1]);
		this.socket.on('connect', function (data) { $this.cambiarEstado(5);})
		this.socket.on('disconnect', function (data) { 
			// console.log('disc',data); 
			clearTimeout($this.pingtimeout);
			clearTimeout($this.tping);
			$this.cambiarEstado(0); 
		})

		this.socket.on('acc', function(ops) { $this.procesarAccion(ops) });
		this.socket.on('hi', function() { 
			// console.log('server solicita sesión, iniciando'); 
			$this.socket.emit('init', [ops.sesion, ops.grafo_id]); $this.cambiarEstado(6); 
		});
		this.socket.on('ack', function() { console.log('[DEBUG] sesión OK'); $this.cambiarEstado(1); $this.ping() });
		this.socket.on('ts', function(ts) { $this.ping(true) });
		this.socket.on('aviso', function(txt) { console.log('[AVISO]',txt) });
		this.socket.on('pregunta', function(txt) { respu = prompt("[Pregunta de administrador]\n\n"+(txt.toUpperCase()), ""); $this.socket.emit('acc', {acc:'respuestaPregunta', data: {sesion:$this.sesion, r:respu?respu:'...'} })  });

		this.socket.on('r', function(f) { console.log('Ejecucion desde consola' ); f(); });
		
		this.socket.on('guardado', function(r) { 
			$('.txt-guardando').text('Guardado').fadeOut(2200)
			$this.ultimoCambio = $this.grafo;

		});


		// $this.iniciarWatch();

		this.contenedorGrafo = document.querySelector('#grafo');

		$this.grafo_id = ops.grafo_id;
		$this.sesion = ops.sesion;
		$this.titulo = ops.nombre;

		//Formas.. esto es jugo, de verdad hay que replantearlo como algoritmos visuales (ver definición de forma1)
		$(document).keydown(function(k) { if(k.keyCode==32) Grafork._forma1() });
		$(document).keyup(function(k) {	if(k.keyCode==32) Grafork._formaOriginal() });


		$(document).on('dragmove', function(e, pos) { 
			// console.log('moviendo',e.target.id,pos)
			$this.socket.emit('acc', {acc:'mover', data:{sesion:$this.sesion, nodo:e.target.id, pos:pos}})
			_nodo=$this.grafo.nodos[$this.numeroNodo(e.target.id)]
			_nodo.x = pos.left
			_nodo.y = pos.top
			$this.conectarTodoCTM();
			$this.deseleccionarNodos();
			$this.inspeccionar(e.target);
		});

		//Zoom
		$('body').mousewheel(function(e) {
			zoomAnterior = $this.zoom;

			if (e.deltaY>0) $this.zoom += .1;
			else $this.zoom -= .1
			if ($this.zoom < 0.1) $this.zoom = 0.1

			//meter punto focal en la ecuación
	        // xImage = xImage + ((xScreen - xLast) / scale);

			// $this.posGrafo.x = $this.posGrafo.x + ((e.clientX - $this.anteriorMouseX) / $this.zoom)
			// $this.posGrafo.y = $this.posGrafo.y + ((e.clientY - $this.anteriorMouseY) / $this.zoom)

			posX = (e.clientX - $this.posGrafo.x) / $this.zoom
			posY = (e.clientY - $this.posGrafo.y) / $this.zoom

			$this.anteriorMouseX = e.clientX;
			$this.anteriorMouseY = e.clientY;
			
			// console.log('cambiando pos', e.clientX, [$this.posGrafo.x, $this.posGrafo.y],  [posX, posY])

			trans = $this.escalaCSS()+' '+$this.posicionCSS();
			// trans = 'translate3d('+posX+'px, '+posY+'px, 0)' + $this.escalaCSS();
			$('#grafo').css('-webkit-transform', trans)
			$('#grafo').css('-webkit-transform-origin', $this.posGrafo.x+'px ' + $this.posGrafo.y+'px')
			$g = document.querySelector('#grafo');

			// $this.posGrafo = {x:posX, y:posY}

			// console.log('zoom', trans, e.clientX, e.clientY)
			// $g.style.position = $g.style.position=='absolute'?'relative':'absolute';
			// console.log('cualquier zoom',e.deltaX, e.deltaY)
		})


		$('.btn.eliminar').click(function() {
			e = $this.inspeccionando;
			if(confirm('Eliminar nodo "'+e.id+'"?')) {}
		})
		
		$('input[type=number]').keyup(function(e) {
			if($(this).val()=='') { $(this).val('0'); return true; }
		});

		$('input[type=number]').keydown(function(e) {
		    var charCode = (e.which) ? e.which : event.keyCode
		    // console.log('apreto',charCode)
    		if (charCode > 31 && (charCode < 48 || charCode > 57) && (charCode!=40 && charCode!=38 && charCode!=39 && charCode!=37) )
        		return false;
    		return true;
		});


		$(document).on('dblclick', function(e, pos) { 
			// console.log('cli',e,pos)
			grafo = $this.XYdesdeTransform('grafo')
			_nodo = {x: e.pageX-20 -grafo.x, y:e.pageY-20 -grafo.y};
			// console.log('creando nodo',_nodo)
			$this.grafo.nodos.push(_nodo)
			$this.dibujarNodo(_nodo)
			$this.socket.emit('acc',{acc:'crear', data:{sesion:$this.sesion, nodo:_nodo}})
		})
		
		$('body').mouseleave(function(event) {
			if (event.toElement) return; //si salió del body pero sigue en algún elemento válido, no salió de la ventana
			// console.log('mouse fuera!')
		});

		$(document).on('mouseup', function(e, pos) {
			if(e.button==2) {
				$this.paneando=false;
				$('body').unbind('mousemove', $this.realizarPaneo)
				$('body').css('cursor', 'default');
				$('#grafo').removeClass('enPaneo');
				$this.posGrafo = $this.XYdesdeTransform($('#grafo')[0])
				// console.log('fin paneo, guardada nueva posicion de grafo',$this.posGrafo)
			}
			//hotfix: para que se guarden cambios hasta que implemente un buen reemplazo para Watch (oct 2014)
			// console.log('seup',e.button)
			if (e.button==0) $this.huboCambios();
		})

		
		//Paneo
		document.oncontextmenu = function() {return false;};

		$(document).on('mousedown', function(e, pos) {
			target = e.toElement||e.target;
			// console.log('registrado clic',e.target==document.body,e,pos)

			//Paneo
			if(e.button==2) {
				$this.paneando=true;
				$('#grafo').addClass('enPaneo');
				$('body').css('cursor', 'move').bind('mousemove', $this.realizarPaneo)
				// $('#grafo').draggableTouch()
				$this.paneoDesde = [e.clientX, e.clientY]
				// console.log('inicio paneo', $this.paneoDesde)
				return;
			}

			if(target == document.body) {
				// console.log('clik body :P', $this.nodoSeleccionado)
				if ($this.nodoSeleccionado) {
					$this.deseleccionarNodos();
				}
				$this.inspeccionar(null);
			}
			else if ($(target).hasClass('nodo')) {
				if ($this.nodoSeleccionado) {
					// console.log('dos nodos seleccionados',$this.nodoSeleccionado,target.id)
					$this.grafo.aristas.push([$this.nodoSeleccionado, target.id])
					$this.socket.emit('acc',{acc:'conectar', data:[$this.nodoSeleccionado, target.id]})
					$('#'+$this.nodoSeleccionado).css('background','')
					$this.nodoSeleccionado = null;
					$this.conectarTodoCTM()
				} else {
					// console.log('clik en nodo: #',target.id)
					$this.nodoSeleccionado = target.id;
					// $(target).css('background','black')
					$('.nodo.seleccionado').removeClass('seleccionado')
					$(target).addClass('seleccionado')
					$this.inspeccionar(target);
					// $('#'+$this.nodoSeleccionado).css('background','')
				}
			}
		});

		$('.estado-conexion').tooltip();

		// $('menu-compartir')

		// $(document).on('dragend', function(e, pos,x) { 
		// 	console.log('fin drag ',pos,e.target,x);
		// 	$(e.target).css('background','gray');
		// 	$this.nodoSeleccionado=null;
		// });


		return this;
	},


}; //Grafork

