// code to load JOSM is from the HOT OSM Tasking Manager
// https://github.com/hotosm/tasking-manager/
// and covered by a BSD 2-Clause License

PluginsAPI.Map.addActionButton(function(options){
	if (options.tiles.length > 0){
		// TODO: pick the topmost layer instead
		// of the first on the list, to support
		// maps that display multiple tasks.

		var tile = options.tiles[0];
		var tileUrl = window.location.protocol + "//" + 
					window.location.host +
					tile.url.replace(/tiles\.json$/, "tiles/{zoom}/{x}/{-y}.png");
		var JOSM_COMMAND_TIMEOUT = 1000;
		var josmLastCommand = 0;
		
		var startEditor = function(editor){
			if (editor === 'ideditor'){
				var editUrl = "https://www.openstreetmap.org/edit?editor=id#map=" +
					options.map.getZoom() + "/" + 
					options.map.getCenter().lat + "/" + 
					options.map.getCenter().lng +
					"&background=custom:" + tileUrl;	
				window.open(editUrl);
			}
			else if (editor === 'josm'){
				
				function formatUrlParams_(params){
		      return "?" + Object
		              .keys(params)
		              .map(function (key){
		                return key + "=" + params[key]
		              })
		              .join("&")
		    }
				
				function sendJOSMCmd(endpoint, params){
						var url = endpoint + formatUrlParams_(params),
								loaded,
								iframe;

						return new Promise(function(resolve, reject){
								// Figure out when we can next run a command
								var wait = Math.max(josmLastCommand + JOSM_COMMAND_TIMEOUT - Date.now(), 0);

								// This remembers when we are going to run THIS command, and adds the timeout 
								// (yes, it is double-counted - this seems to be more reliable).
								josmLastCommand = Date.now() + wait + JOSM_COMMAND_TIMEOUT;

								setTimeout(function(){
										iframe = document.createElement('iframe');
										iframe.style.display = 'none';
										iframe.addEventListener('load', function(){
												if(loaded === undefined){
														loaded = true;
														resolve();
														iframe.parentElement.removeChild(iframe);
												}
										});
										iframe.setAttribute('src', url);
										document.body.appendChild(iframe);
								}, wait);

								setTimeout(function(){
										if(loaded === undefined){
												loaded = false;
												reject();
												iframe.parentElement.removeChild(iframe);
										}
								}, wait + JOSM_COMMAND_TIMEOUT);
						});
				}				
				var imageryParams = {
	        title: tile.meta.name,
	        type: "tms",
	        url: encodeURIComponent("tms[22]:" + tileUrl)
        };
				sendJOSMCmd('http://127.0.0.1:8111/imagery', imageryParams)				
				var loadAndZoomParams = {
					left: options.map.getBounds().getWest(),
					bottom: options.map.getBounds().getSouth(),
					right: options.map.getBounds().getEast(),
					top: options.map.getBounds().getNorth(),
					changeset_source: encodeURIComponent("WebODM - " + tile.meta.name),
					new_layer: false
       	};
				sendJOSMCmd('http://127.0.0.1:8111/load_and_zoom', loadAndZoomParams);
				
			}
		}
		
		return React.createElement(
			"div", { className: "btn-group dropup" },
			React.createElement( // child a
				"button", { 
					className: "btn btn-sm btn-secondary dropdown-toggle", 
					"data-toggle": "dropdown",
					"aria-haspopup": "true",
					"aria-expanded": "false"
				}, 
				React.createElement("i", {className: "fa fa-map"}, ""), // child a1 
				" OSM Digitize ", // child a2 
				React.createElement("span", {className: "caret"}, "") // child a3 
			),
			React.createElement( // child b
				"ul", { className: "dropdown-menu" },
				React.createElement("li", null, // child b2
					React.createElement("a", {
						href: "#",
						onClick: function(){ startEditor("ideditor") }
					}, "iD Editor") // child b2.1
				), 
				React.createElement("li", null, // child b2
					React.createElement("a", {
						href: "#",
						onClick: function(){ startEditor("josm") }
					}, "JOSM") // child b2.2
				) 
			)
		);
	}

});
