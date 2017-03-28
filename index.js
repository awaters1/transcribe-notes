var Alexa = require('alexa-sdk');



exports.handler = function (event, context, callback) {
    var alexa = Alexa.handler(event, context);
    if ('undefined' === typeof process.env.DEBUG) {
        alexa.appId = 'insert app id here';
    }
    console.log(event.session);
    console.log('Is session new:' + (event.session['new'] == true));
    console.log(event.session['new']);
    console.log(typeof(event.session['new']));
    alexa.registerHandlers(newSessionHandlers, startTranscribeModeHandlers, startListenModeHandlers, transcribeHandlers, listenHandlers);
    alexa.execute();
};

var states = {
    // TODO: Maybe change this to start mode
    START_TRANSCRIBE_MODE: '_START_TRANSCRIBE_MODE',
    START_LISTEN_MODE: '_START_LISTEN_MODE',
    TRANSCRIBE_MODE: '_TRANSCRIBE_MODE',
    LISTEN_MODE: '_LISTEN_MODE'
};

var newSessionHandlers = {
    'NewSession': function () {
        console.log(this.event.session);
        this.handler.state = states.START_TRANSCRIBE_MODE;
        this.emit(':ask', 'What do you want to do? Transcribe a note or check for notes?',
            'Transcribe a note or check for notes?');
    },
    'TranscribeNoteForNameIntent': function() {
        this.handler.state = states.TRANSCRIBE_MODE;
        this.emitWithState('TranscribeNoteForNameIntent');
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', "Goodbye!");
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', "Goodbye!");
    },
    'TestIntent': function() {
        this.emit(':tell', "Testing123");
    },
    'SessionEndedRequest': function () {
        console.log('session ended!');
        this.emit(":tell", "Goodbye!");
    }
};

var startTranscribeModeHandlers = Alexa.CreateStateHandler(states.START_TRANSCRIBE_MODE, {
    'NewSession': function () {
        console.log('Transcribe new session');
        this.handler.state = '';
        this.emitWithState('NewSession');
    },
    'TranscribeNoteIntent': function() {
        this.handler.state = states.TRANSCRIBE_MODE;
        this.emitWithState('TranscribeNoteIntent');
    },
    'AMAZON.HelpIntent': function () {
        console.log('Help intent');
        var message = 'I can transcribe notes for members of your family, ' +
            'I only need their name and the note.  Do you want me to transcribe a note?';
        this.emit(':ask', message, message);
    },
    'AMAZON.YesIntent': function () {
        this.handler.state = states.TRANSCRIBE_MODE;
        this.emitWithState('TranscribeNoteIntent');
    },
    'AMAZON.NoIntent': function () {
        console.log("NOINTENT");
        this.handler.state = states.START_LISTEN_MODE;
        this.emit(':ask', 'Ok, do you want to listen to previously transcribed notes?');
    },
    "AMAZON.StopIntent": function () {
        console.log("STOPINTENT");
        this.emit(':tell', "Goodbye!");
    },
    "AMAZON.CancelIntent": function () {
        console.log("CANCELINTENT");
        this.emit(':tell', "Goodbye!");
    },
    'SessionEndedRequest': function () {
        console.log("SESSIONENDEDREQUEST");
        this.emit(':tell', "Goodbye!");
    },
    'Unhandled': function () {
        console.log("UNHANDLED");
        var message = 'Say yes to transcribe a note or no to listen to previously transcribed notes.';
        this.emit(':ask', message, message);
    }
});

var startListenModeHandlers = Alexa.CreateStateHandler(states.START_LISTEN_MODE, {
    'NewSession': function () {
        this.emit('NewSession');
    },
    'AMAZON.HelpIntent': function () {
        var message = 'I can play previously transcribed notes, ' +
            'I only need your name.  Do you want to listen to your notes?';
        this.emit(':ask', message, message);
    },
    'AMAZON.YesIntent': function () {
        this.handler.state = states.LISTEN_MODE;
        this.emit(':ask', 'Ok, who is this note for?');
    },
    'AMAZON.NoIntent': function () {
        console.log("NOINTENT");
        this.emit(':tell', 'Ok, talk to you later!');
    },
    "AMAZON.StopIntent": function () {
        console.log("STOPINTENT");
        this.emit(':tell', "Goodbye!");
    },
    "AMAZON.CancelIntent": function () {
        console.log("CANCELINTENT");
        this.emit(':tell', "Goodbye!");
    },
    'SessionEndedRequest': function () {
        console.log("SESSIONENDEDREQUEST");
        this.emit(':tell', "Goodbye!");
    },
    'Unhandled': function () {
        console.log("UNHANDLED");
        var message = 'Say yes to listen to your notes or no to stop.';
        this.emit(':ask', message, message);
    }
});


var transcribeHandlers = Alexa.CreateStateHandler(states.TRANSCRIBE_MODE, {
    'NewSession': function () {
        this.handler.state = '';
        this.emitWithState('NewSession');
    },
    'TranscribeNoteIntent': function() {
        var nameSlot = this.event.request.intent.slots.name;
        var hasName = (nameSlot && nameSlot.value) || (this.attributes.name);
        if (!hasName) {
            this.emit(':ask', 'Ok, who is this note for?', 'Who is the note for?');
        }
    },
    'TranscribeNoteForNameIntent': function() {
        var name = value;
        this.attributes['name'] = name;
        this.emit(':ask', 'What is the note for ' + name + '?', 'Tell me the note');
    },
    'AMAZON.HelpIntent': function () {
        this.handler.state = '';
        this.emitWithState('AMAZON.HelpIntent');
    },
    "AMAZON.StopIntent": function () {
        console.log("STOPINTENT");
        this.emit(':tell', "Goodbye!");
    },
    "AMAZON.CancelIntent": function () {
        console.log("CANCELINTENT");
        this.emit(':tell', "Goodbye!");
    },
    'SessionEndedRequest': function () {
        console.log("SESSIONENDEDREQUEST");
        //this.attributes['endedSessionCount'] += 1;
        this.emit(':tell', "Goodbye!");
    },
    'Unhandled': function () {
        console.log("UNHANDLED");
        var message = 'Say yes to continue, or no to end the game.';
        this.emit(':ask', message, message);
    }
});

var listenHandlers = Alexa.CreateStateHandler(states.LISTEN_MODE, {
    'NewSession': function () {
        this.emit('NewSession');
    },
    'AMAZON.HelpIntent': function () {
        var message = 'I can transcribe notes for members of your family, ' +
            'I only need their name and the note.  Do you want me to transcribe a note?';
        this.emit(':ask', message, message);
    },
    'AMAZON.YesIntent': function () {
        this.handler.state = states.GUESSMODE;
        this.emit(':ask', 'Okay, who is this note for?');
    },
    'AMAZON.NoIntent': function () {
        console.log("NOINTENT");
        this.emit(':tell', 'Ok, see you next time!');
    },
    "AMAZON.StopIntent": function () {
        console.log("STOPINTENT");
        this.emit(':tell', "Goodbye!");
    },
    "AMAZON.CancelIntent": function () {
        console.log("CANCELINTENT");
        this.emit(':tell', "Goodbye!");
    },
    'SessionEndedRequest': function () {
        console.log("SESSIONENDEDREQUEST");
        //this.attributes['endedSessionCount'] += 1;
        this.emit(':tell', "Goodbye!");
    },
    'Unhandled': function () {
        console.log("UNHANDLED");
        var message = 'Say yes to continue, or no to end the game.';
        this.emit(':ask', message, message);
    }
});
