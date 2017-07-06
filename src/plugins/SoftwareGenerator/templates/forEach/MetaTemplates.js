define(['mustache/mustache',
	'text!./component.mk',
	'text!./main.cpp',
	'text!./Task.cpp',
	'text!./Task.hpp',
	'text!./Timer.cpp',
	'text!./Timer.hpp',
	'text!./Comp.cpp',
	'text!./Comp.hpp'],
       function(mustache,
		compMk,
		mainCppTempl,
		TaskCppTempl,
		TaskHppTempl,
		TimerCppTempl,
		TimerHppTempl,
		CompCppTempl,
		CompHppTempl) {
	   'use strict';

	   return {
	       Templates: {
		   "Component": {
		       "{{base}}/components/{{obj.sanitizedName}}/include/{{obj.sanitizedName}}.hpp": CompHppTempl,
		       "{{base}}/components/{{obj.sanitizedName}}/{{obj.sanitizedName}}.cpp": CompCppTempl,
		       "{{base}}/components/{{obj.sanitizedName}}/component.mk": compMk
		   }
		   "Task": {
		       "{{base}}/components/{{obj.sanitizedName}}/include/{{obj.sanitizedName}}.hpp": TaskHppTempl,
		       "{{base}}/components/{{obj.sanitizedName}}/{{obj.sanitizedName}}.cpp": TaskCppTempl,
		       "{{base}}/components/{{obj.sanitizedName}}/component.mk": compMk
		   },
		   "Timer": {
		       "{{base}}/components/{{obj.sanitizedName}}/include/{{obj.sanitizedName}}.hpp": TimerHppTempl,
		       "{{base}}/components/{{obj.sanitizedName}}/{{obj.sanitizedName}}.cpp": TimerCppTempl,
		       "{{base}}/components/{{obj.sanitizedName}}/component.mk": compMk
		   },
		   "main": {
		       "{{base}}/main.cpp": mainCppTempl,
		   },
	       },
	       renderState: function( obj ) {
	       },
	       renderHFSM: function(model) {
		   var self    = this;
		   var objects = model.objects;
		   var root    = model.root;
	       },
	       getArtifacts: function(pathToObjDict, baseDir) {
		   var self = this;
		   var artifacts = {};
		   Object.keys(pathToObjDict).map(function (path) {
		       var obj = pathToObjDict[ path ];
		       var templDict = self.Templates[ obj.type ];
		       if ( templDict ) {
			   Object.keys(templDict).map(function(pathTempl) {
			       var fileTempl = templDict[ pathTempl ];
			       var renderData = {
				   base: baseDir,
				   obj: obj
			       };
			       var filePath = mustache.render( pathTempl, renderData );
			       var fileData = mustache.render( fileTempl, renderData );
			       artifacts[ filePath ] = fileData;
			   });
		       }
		   });
	       },
	   };
       }); // define( [], function() {} );
