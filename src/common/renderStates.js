// This code relies on the pre-processing done to the model by modelLoader.js

define(['mustache/mustache','q'], function(mustache,Q) {
    'use strict';

    var templates = {
	// THE CPP CODE IS FOR THE LPC2148 ARM7TDMI-S

	'cpp': {
	    // takes a state as the scope (doesn't need any further pre-processing)
            'setState': [
		"stateLevel_{{stateLevel}} = {{stateName}};",
		"{{#parentState}}",
		"{{> setState}}", // recurse here
		"{{/parentState}}"
	    ],

	    // takes a transition as the scope (needs previous state for transition to be pre-processed)
            'transition': [
		"if ( {{&guard}} ) {",
		"  changeState = 1;",
		"  // TRANSITION::{{prevState.name}}->{{finalState.name}}",
		"{{#finalState}}",
		"  {{> setState}}",
		"{{/finalState}}",
		"  // start state timer (@ next states period)",
		"  hardware_set_soft_timer( {{timerPeriod}}, state_timer_handle, 0);",
		"  // execute the transition function",
		"  {{&transitionFunc}}",
		"}"
	    ],

	    // takes a state as the scope
            'execute': [
		"// STATE::{{name}}",
		"if (changeState == 0 && stateLevel_{{stateLevel}} == {{stateName}}) {",
		"  // STATE::{{name}}::TRANSITIONS",
		"  {{#transitions}}", // if there are any transitions out of this state
		"  {{> transition}}",
		"  {{/transitions}}",
		"  {{#State_list}}",
		"  {{> execute}}",  // recurse here
		"  {{/State_list}}",
		"{{#execute}}", // only add the following if execute is true
		"  // STATE::${name}::FUNCTION",
		"  if (changeState == 0) {",
		"    {{&function}}",
		"  }",
		"{{/execute}}",
		"}"
	    ],

	    // takes a scope with: root, prefix, and execute
	    // takes partials with: execute, transition, setState
	    'timer': [
		"{{#root.State_list}}",
		"{{> execute}}",
		"{{/root.State_list}}"
	    ],
	},

	// THE BGS CODE IS FOR THE BLUEGIGA BLE113 BLUETOOTH SoC MODULE
	
	'bgs': {
	    // takes a state as the scope (doesn't need any further pre-processing)
            'setState': [
		"stateLevel_{{stateLevel}} = {{stateName}}",
		"{{#parentState}}",
		"{{> setState}}", // recurse here
		"{{/parentState}}"
	    ],

	    // takes a state as the scope
            'execute': [
		"{{#getPrefix}}",
		"# STATE::{{name}}",
		"if (changeState = 0 && stateLevel_{{stateLevel}} = {{stateName}}) then",
		"  # STATE::{{name}}::TRANSITIONS",
		"  {{#transitions}}",
		"  if ( {{&guard}} ) then",
		"    changeState = 1",
		"    # TRANSITION::{{prevState.name}}->{{finalState.name}}",
		"{{#finalState}}",
		"    {{> setState}}",
		"    # stop the current state timer (to change period)",
		"    call hardware_set_soft_timer( 0, state_timer_handle, 0)",
		"    # start state timer (@ next states period)",
		"    call hardware_set_soft_timer({{#convertPeriod}}{{&timerPeriod}}{{/convertPeriod}},state_timer_handle,0)",
		"{{/finalState}}",
		"    # execute the transition function",
		"    {{&transitionFunc}}",
		"  end if",
		"  {{/transitions}}",
		"  {{#State_list}}",
		"  {{> execute}}",
		"  {{/State_list}}",
		"{{#execute}}",
		"  # STATE::${name}::FUNCTION",
		"  if (changeState = 0) then",
		"    {{&function}}",
		"  end if",
		"{{/execute}}",
		"end if\n",
		"{{/getPrefix}}",
	    ],

	    // takes a scope with: root, prefix, and execute
	    // takes partials with: execute, transition, setState
	    'timer': [
		"{{#root.State_list}}",
		"{{> execute}}",
		"{{/root.State_list}}"
	    ]
	}
    };

    var joined = false;

    return {
	initTemplates: function() {
	    // convert templates from string arrays to multiline strings
	    if (!joined) {
		for (var l in templates) {
		    for (var t in templates[l]) {
			templates[l][t] = templates[l][t].join('\n');
		    }
		}
		joined = true;
	    }
	},

        generateStateFunctions: function(root, language) {
            var self = this;
	    if (language === undefined)
		language = 'cpp';
	    root.timerFunc = self.getStateCode(root, language, true);
	    root.stateTransitions = self.getStateCode(root, language, false);
        },

	getPrefix: function() {
	    return function(val, render) {
		var rendered = render(val);
		var prefix = '';
		for (var i=0; i <this.stateLevel; i++) {
		    prefix += '  ';
		}
		rendered = rendered.replace(/^(\S|\s)/gm, prefix + "$1");
		return rendered;
	    };
	},

	getSetState: function(state, language) {
	    if (language === undefined)
		language = 'cpp';
            // use state.transitions object which was built in loader.processModel()
	    var tmpl = templates[language].setState;
	    var view = state;
	    view.getPrefix = this.getPrefix;
	    var partials = {
		'setState': templates[language].setState,
	    };
	    return mustache.render(tmpl, view, partials);
	},

        getStateCode: function(root, language, execute) {
	    if (language === undefined)
		language = 'cpp';
	    if (execute === undefined)
		execute = true;
            var prefix = '  ';
            // use state.transitions object which was built in loader.processModel()
	    var tmpl = templates[language].timer;
	    var view = {
		root: root,
		prefix: prefix,
		execute: execute,
		convertPeriod: function() {
		    return function(val, render) {
			return parseInt(parseFloat(render(val))*32768.0);
		    };
		},
		getPrefix: this.getPrefix
	    };
	    var partials = {
		'setState': templates[language].setState,
		'execute': templates[language].execute,
	    };
	    return mustache.render(tmpl, view, partials);
        }
    }
});
