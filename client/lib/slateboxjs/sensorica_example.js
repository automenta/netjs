function initSensorica(g) {	

		var render = null;

		g.addNode( "Project-8", {label: "Mosquito", color: "blue", render:render } );
	
		g.addNode( "Project-2", {label: "Mosquito scientific instrument system", color: "blue", render:render } );
	
		g.addNode( "ResourceType-2", {label: "Mosquito sensor", color: "red", render:render } );
	
		g.addNode( "Project-26", {label: "Physiological bath", color: "blue", render:render } );
	
		g.addNode( "Project-2", {label: "Mosquito scientific instrument system", color: "blue", render:render } );
	
		g.addNode( "ResourceType-53", {label: "Bath product", color: "red", render:render } );
	
		g.addNode( "Project-9", {label: "Joint-type transducer", color: "blue", render:render } );
	
		g.addNode( "Project-2", {label: "Mosquito scientific instrument system", color: "blue", render:render } );
	
		g.addNode( "ResourceType-3", {label: "Joint-type transducer", color: "red", render:render } );
	
		g.addNode( "Project-16", {label: "XYZ piezo positioner", color: "blue", render:render } );
	
		g.addNode( "Project-2", {label: "Mosquito scientific instrument system", color: "blue", render:render } );
	
		g.addNode( "ResourceType-19", {label: "Xyz piezo micromanipulator prototype", color: "red", render:render } );
	
		g.addNode( "Project-16", {label: "XYZ piezo positioner", color: "blue", render:render } );
	
		g.addNode( "Project-9", {label: "Joint-type transducer", color: "blue", render:render } );
	
		g.addNode( "ResourceType-68", {label: "Mosquito joint", color: "red", render:render } );
	
		g.addNode( "Project-16", {label: "XYZ piezo positioner", color: "blue", render:render } );
	
		g.addNode( "Project-2", {label: "Mosquito scientific instrument system", color: "blue", render:render } );
	
		g.addNode( "ResourceType-3", {label: "Joint-type transducer", color: "red", render:render } );
	
		g.addNode( "Project-26", {label: "Physiological bath", color: "blue", render:render } );
	
		g.addNode( "Project-2", {label: "Mosquito scientific instrument system", color: "blue", render:render } );
	
		g.addNode( "ResourceType-53", {label: "Bath product", color: "red", render:render } );
	
		g.addNode( "Project-15", {label: "Optical fiber coating", color: "blue", render:render } );
	
		g.addNode( "Project-9", {label: "Joint-type transducer", color: "blue", render:render } );
	
		g.addNode( "ResourceType-4", {label: "Mosquito lever", color: "red", render:render } );
	

	
	
	
		 // from_node is a process
			g.addEdge( "Project-8" , "ResourceType-2", 
				{ 
					directed : true, 
					label : "produces",
					weight: 1, 
					stroke : "red" , 
					fill : "red|1" 
				} 
			);
        
	
		 // from_node is a resource
			g.addEdge( "ResourceType-2" , "Project-2", 
				{ 
					directed : true, 
					label : "consumed by",
					weight: 1, 
					stroke : "blue" , 
					fill : "blue|1" 
				} 
			);	
		
	
		 // from_node is a process
			g.addEdge( "Project-26" , "ResourceType-53", 
				{ 
					directed : true, 
					label : "produces",
					weight: 1, 
					stroke : "red" , 
					fill : "red|1" 
				} 
			);
        
	
		 // from_node is a resource
			g.addEdge( "ResourceType-53" , "Project-2", 
				{ 
					directed : true, 
					label : "consumed by",
					weight: 1, 
					stroke : "blue" , 
					fill : "blue|1" 
				} 
			);	
		
	
		 // from_node is a process
			g.addEdge( "Project-9" , "ResourceType-3", 
				{ 
					directed : true, 
					label : "produces",
					weight: 1, 
					stroke : "red" , 
					fill : "red|1" 
				} 
			);
        
	
		 // from_node is a resource
			g.addEdge( "ResourceType-3" , "Project-2", 
				{ 
					directed : true, 
					label : "consumed by",
					weight: 1, 
					stroke : "blue" , 
					fill : "blue|1" 
				} 
			);	
		
	
		 // from_node is a process
			g.addEdge( "Project-16" , "ResourceType-19", 
				{ 
					directed : true, 
					label : "produces",
					weight: 1, 
					stroke : "red" , 
					fill : "red|1" 
				} 
			);
        
	
		 // from_node is a resource
			g.addEdge( "ResourceType-19" , "Project-2", 
				{ 
					directed : true, 
					label : "consumed by",
					weight: 1, 
					stroke : "blue" , 
					fill : "blue|1" 
				} 
			);	
		
	
		 // from_node is a process
			g.addEdge( "Project-16" , "ResourceType-68", 
				{ 
					directed : true, 
					label : "produces",
					weight: 1, 
					stroke : "red" , 
					fill : "red|1" 
				} 
			);
        
	
		 // from_node is a resource
			g.addEdge( "ResourceType-68" , "Project-9", 
				{ 
					directed : true, 
					label : "consumed by",
					weight: 1, 
					stroke : "blue" , 
					fill : "blue|1" 
				} 
			);	
		
	
		 // from_node is a process
			g.addEdge( "Project-16" , "ResourceType-3", 
				{ 
					directed : true, 
					label : "produces",
					weight: 1, 
					stroke : "red" , 
					fill : "red|1" 
				} 
			);
        
	
		 // from_node is a resource
			g.addEdge( "ResourceType-3" , "Project-2", 
				{ 
					directed : true, 
					label : "consumed by",
					weight: 1, 
					stroke : "blue" , 
					fill : "blue|1" 
				} 
			);	
		
	
		 // from_node is a process
			g.addEdge( "Project-26" , "ResourceType-53", 
				{ 
					directed : true, 
					label : "produces",
					weight: 1, 
					stroke : "red" , 
					fill : "red|1" 
				} 
			);
        
	
		 // from_node is a resource
			g.addEdge( "ResourceType-53" , "Project-2", 
				{ 
					directed : true, 
					label : "consumed by",
					weight: 1, 
					stroke : "blue" , 
					fill : "blue|1" 
				} 
			);	
		
	
		 // from_node is a process
			g.addEdge( "Project-15" , "ResourceType-4", 
				{ 
					directed : true, 
					label : "produces",
					weight: 1, 
					stroke : "red" , 
					fill : "red|1" 
				} 
			);
        
	
		 // from_node is a resource
			g.addEdge( "ResourceType-4" , "Project-9", 
				{ 
					directed : true, 
					label : "consumed by",
					weight: 1, 
					stroke : "blue" , 
					fill : "blue|1" 
				} 
			);	
}
