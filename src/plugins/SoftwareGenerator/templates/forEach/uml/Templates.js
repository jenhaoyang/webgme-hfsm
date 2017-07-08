define(['handlebars/handlebars.min',
	'text!./EventTempl.hpp',
	'text!./InternalEvent.tmpl',
	'text!./ExternalEvent.tmpl',
	'text!./ExternalTransition.tmpl',
	'text!./StateTempl.hpp',
	'text!./StateTempl.cpp',
	'text!./EndStateTempl.hpp',
	'text!./GeneratedStates.hpp',
	'text!./GeneratedStates.cpp'],
       function(handlebars,
		EventTempl,
		InternalEventTempl,
		ExternalEventTempl,
		ExternalTransitionTempl,
		StateTemplHpp,
		StateTemplCpp,
		EndStateTemplHpp,
		GeneratedStatesTemplHpp,
		GeneratedStatesTemplCpp) {
	   'use strict';

	   var Partials = {
	       EventTempl: EventTempl,
	       InternalEventTempl: InternalEventTempl,
	       ExternalEventTempl: ExternalEventTempl,
	       ExternalTransitionTempl: ExternalTransitionTempl,
	       StateTemplHpp: StateTemplHpp,
	       StateTemplCpp: StateTemplCpp,
	       EndStateTemplHpp: EndStateTemplHpp,
	       GeneratedStatesTemplHpp: GeneratedStatesTemplHpp,
	       GeneratedStatesTemplCpp: GeneratedStatesTemplCpp,
	   };

	   var rootTemplates = ["GeneratedStatesTemplHpp",
				"GeneratedStatesTemplCpp" ];

	   var keyTemplates = {
	       'EventTempl': '{{{sanitizedName}}}_Events.hpp',
	       'GeneratedStatesTemplHpp': '{{{sanitizedName}}}_GeneratedStates.hpp',
	       'GeneratedStatesTemplCpp': '{{{sanitizedName}}}_GeneratedStates.cpp',
	   };

	   var dependencies = {
	       'GeneratedStatesTemplCpp': [
		   'GeneratedStatesTemplHpp'
	       ]
	   };

	   function getAttrIfType( obj, attr, type ) {
	       return obj.type == type ? obj[attr] : '';
	   };

	   var objects = null;

	   function buildTransFunc( obj ) {
	       var self = this;
	       var transFunc = '';
	       if ( obj.type == 'External Transition' ) {
		   console.log( objects[ obj.parentPath ] );
		   if (objects != null)
		       transFunc += buildTransFunc( objects[ obj.parentPath ] );
		   transFunc += '// transFunc for : '+obj.path;
		   transFunc += obj.transitionFunc;
	       }
	       return transFunc;
	   };

	   handlebars.registerHelper('addTransition', function(options) {
	       var context = {},
		   mergeContext = function(obj) {
		       for(var k in obj)context[k]=obj[k];
		   };
	       mergeContext(this);
	       var trans = options.hash.trans;
	       console.log( 'adding transition!' );
	       console.log( context ); 
	       console.log( trans );
	       if (context.previousTransitions == null)
		   context.previousTransitions = [];
	       context.previousTransitions.push( trans );
	       console.log( context.previousTransitions );
	       return options.fn(context);
	   });

	   Object.keys(Partials).map(function(partialName) {
	       handlebars.registerPartial( partialName, Partials[ partialName ] );
	   });

	   function getKey(templName, root) {
	       var keyTempl = keyTemplates[ templName ];
	       return handlebars.compile( keyTempl )( root );
	   };

	   function getContext( templName, root ) {
	       var key = getKey( templName, root );
	       var deps = dependencies[ templName ] || [];
	       deps = deps.map(function(dep) { return getKey( dep, root ); });
	       return Object.assign({
		   key: key,
		   dependencies: deps
	       }, root);
	   };

	   return {
	       setObjects: function(objs) {
		   objects = objs;
	       },
	       renderEvents: function(root) {
		   console.log('render events');
		   var templName = "EventTempl";
		   var retObj = {};
		   var context = getContext( templName, root );

		   retObj[ context.key ] = handlebars.compile(
		       Partials[ templName ]
		   )(
		       context
		   );
		   return retObj;
	       },
	       renderStates: function(root) {
		   console.log('render states');
		   var rendered = {};
		   rootTemplates.map(function(rootTemplName) {
		       var context = getContext( rootTemplName, root );

		       rendered[ context.key ] = handlebars.compile(
			   Partials[ rootTemplName ]
		       )(
			   context
		       );
		   });
		   return rendered;
	       },
	   };
       }); // define( [], function() {} );
