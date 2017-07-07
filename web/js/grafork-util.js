/**
 * util.js  -  distintas herramientas que la vida nos provee
 *
 * @package  Grafork
 * @author  Sebastian del Valle
 * @version  2014.7.3
 */

G = typeof(Grafork) !== 'undefined' ? Grafork : {x:alert('Interfaz de Grafork no pudo ser cargada, favor reintentar.')+(document.body.remove())}




/**
 * Funcion magica que todo procesador de grafos debería tener
 * y tu hermana
 * 
 * @param {[type]} json [description]
 */
G.GEXFaJSON = function(gexf) {

	nodos = []
	aristas = []

	$(gexf).find('graph nodes node').each(function(i,e) { 
		$N = $(e);
		pos = $N.find('viz\\:position');
		nodo = {
			x: pos.attr('x'),
			y: pos.attr('y'),
			id: $N.attr('id'),
			label: $N.attr('label'),
		}
		nodos.push(nodo)
	})
	
	$(gexf).find('graph edges edge').each(function(i,e) { 
		$A = $(e);
		arista = [
			'nodo'+$A.attr('source'),
			'nodo'+$A.attr('target'),
			$A.attr('weight'),
		]
		aristas.push(arista)
	})
	
	grafo = {nodos: nodos, aristas: aristas}

	// console.log('GEXF > JSON =', grafo)
	return grafo;

};


$(function() {

	$this = G;
	$this.tiempoDrag = null;
	$this.Arhivos = null;
	$ELE = $('body');

	//Importación
	$ELE.on('drop', function(e) {
		e.stopPropagation();
		e.preventDefault();
		G.archivos = $this.Archivos || e.originalEvent.dataTransfer.files;
		$this.drageando = false;

		console.log('Archivo soltado, procesando.', G.archivos);
		ext = G.archivos[0].name.split('.');
		ext = ext[ext.length-1];
		ext = ext.toUpperCase()
		if (ext != 'GEXF') {
			$('#error').html('Formato no admitido: '+ext).fadeIn(500);
			setTimeout(function() {
				$('#error').fadeOut(function() { $(this).removeClass('sinArrastre')} ) //resetear CSS por si acaso
				if ($this.Archivos) $('.dialogo-subir').modal('hide')
				$('#archivo_importacion').val('')
			}, 2000)
			return;
		}
		//forma rara de leer archivos en HTML5, tengo q estudiarlo mejor  ~seb
	    var reader = new FileReader();
	    reader.onload = (function(theFile) {
	      return function(e) {
	      	resultado = e.target.result;
	        // console.log('Procesamiento terminado.');
	        grafo = $this.GEXFaJSON(resultado);
			$('#arrastre').fadeOut(
				function() {console.log('listongi'); $('#subiendo').fadeIn(
					function() {
						$.post('/importar', {nombre: G.archivos[0].name, grafo: grafo}, function(r) {
							console.log('Importación terminada',r)
							if (r.estado=='OK') {
								$('#subiendo').fadeOut(function() {
									location.href='/grafo/'+r.id;
								});
							}
						});
					
					}).find('.elarchivo').html(G.archivos[0].name)

				}) }
	    })(G.archivos[0]);
	    reader.readAsText(G.archivos[0]);
	})


	$ELE.on('dragover', function(e) {
		if(!$this.drageando) return;
		e.stopPropagation();
		e.preventDefault();
		clearTimeout($this.tiempoDrag)
		if (!$this.drageando) {
			$this.drageando = true;
		}

	})

	$ELE.on('dragenter', function(e) {
		$this.Archivos=null;
		if(e.originalEvent.dataTransfer.types[0]!='Files') {
			console.log('drag no es archivo');
			return;
		}
		e.stopPropagation();
		e.preventDefault();
		clearTimeout($this.tiempoDrag)
		if (!$this.drageando) {
			$this.drageando = true;
			console.log('Archivo detectado, suéltalo!')
			$('.dialogo-subir').modal('show')
			$('#subiendo,#arrastre .error').hide()
			$('#arrastre').show()
		}
	})

	$ELE.on('dragleave', function(e) {
		e.stopPropagation();
		e.preventDefault();
		$this.tiempoDrag = setTimeout(function() {
			if ($this.drageando) {
				$this.drageando = false;
				console.log('Arrugaste')
				$('.dialogo-subir').modal('hide')
			}
		}, 300)
	})


    $('#menu_importar_gexf').click(function(event) { $('#archivo_importacion').trigger('click'); })
    $('#menu_importar_csv').click(function(event) { alert('Importación de CSV no implementada todavía.') })

    //reimplementación del método DROP aprovechando el selector de archivos
    $('#archivo_importacion').change(function(event) {
    	$this.Archivos = event.target.files;
    	console.log('cambia', $this.Archivos)
		$('.dialogo-subir').modal('show')
		$('#error,#subiendo,#arrastre').hide()
		$('#error').addClass('sinArrastre');
    	$ELE.trigger('drop', 'selector')
    })

})