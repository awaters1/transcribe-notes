var Alexa = require('alexa-sdk');

const NO_DATA = '_NO_DATA_FLAG_';


exports.handler = function (event, context, callback) {
    var alexa = Alexa.handler(event, context);
    if ('undefined' === typeof process.env.DEBUG) {
        alexa.appId = 'amzn1.ask.skill.3cb3668d-9e8c-4c3f-8e6c-fc4bd8f7a84f';
    }
    console.log(JSON.stringify(event));
    alexa.dynamoDBTableName = 'transcribe-notes';
    alexa.registerHandlers(newSessionHandlers, startModeHandlers, startListenModeHandlers, transcribeHandlers, listenHandlers);
    alexa.execute();
};

var states = {
    START_MODE: '_START_MODE',
    START_LISTEN_MODE: '_START_LISTEN_MODE',
    TRANSCRIBE_MODE: '_TRANSCRIBE_MODE',
    LISTEN_MODE: '_LISTEN_MODE'
};

var newSessionHandlers = {
    'NewSession': function () {
        this.attributes.name = NO_DATA;
        this.attributes.note = NO_DATA;
        if (this.event.request.type == 'IntentRequest') {
            var intentName = this.event.request.intent.name;
            console.log('New session intent request', intentName);
            if (intentName == 'TranscribeNoteIntent') {
                this.handler.state = states.TRANSCRIBE_MODE;
            } else if (intentName == 'CheckNotesIntent') {
                this.handler.state = states.LISTEN_MODE;
            } else if (intentName == 'DeleteIntent') {
                this.handler.state = states.LISTEN_MODE;
            } else if (intentName == 'ReplayIntent') {
                this.handler.state = states.LISTEN_MODE;
            }
            this.emitWithState(this.event.request.intent.name);
        } else {
            this.handler.state = states.START_MODE;
            this.emit(':ask', 'What do you want to do? Transcribe a note or check for notes?',
                'Transcribe a note or check for notes?');
        }
    },
    'TranscribeNoteIntent': function() {
        this.handler.state = states.TRANSCRIBE_MODE;
        this.emitWithState('TranscribeNoteIntent');
    },
    'CheckNotesIntent': function() {
        this.handler.state = states.LISTEN_MODE;
        this.emitWithState('CheckNotesIntent');
    },
    'CaptureNameIntent': function() {
        // TODO: We should save the name and then ask if they want to transcribe or listen
    },
    'SessionEndedRequest': function () {
        console.log('session ended!');
        this.emit(":tell", "Goodbye!");
    }
};

var startModeHandlers = Alexa.CreateStateHandler(states.START_MODE, {
    'NewSession': function () {
        this.handler.state = '';
        this.emitWithState('NewSession');
    },
    'TranscribeNoteIntent': function() {
        this.handler.state = '';
        this.emitWithState('TranscribeNoteIntent');
    },
    'CheckNotesIntent': function() {
        this.handler.state = '';
        this.emitWithState('CheckNotesIntent');
    },
    'AMAZON.HelpIntent': function () {
        console.log('Help intent');
        var message = 'I can transcribe notes for members of your family, ' +
            'I only need their name and the note.  Do you want me to transcribe a note?';
        this.emit(':ask', message, message);
    },
    'AMAZON.YesIntent': function () {
        this.handler.state = states.TRANSCRIBE_MODE;
        this.emit(':ask', 'Ok, who is this note for?');
    },
    'AMAZON.NoIntent': function () {
        console.log("NOINTENT");
        this.handler.state = states.START_LISTEN_MODE;
        this.emit(':ask', 'Ok, do you want to listen to previously transcribed notes?');
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
        this.handler.state = '';
        this.emit('NewSession');
    },
    'AMAZON.HelpIntent': function () {
        var message = 'I can play previously transcribed notes, ' +
            'I only need your name.  Do you want to listen to your notes?';
        this.emit(':ask', message, message);
    },
    'AMAZON.YesIntent': function () {
        this.handler.state = states.LISTEN_MODE;
        this.emit(':ask', 'Ok, what is your name?');
    },
    'AMAZON.NoIntent': function () {
        console.log("NOINTENT");
        this.emit(':tell', 'Ok, talk to you later!');
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
        var nameSlot = this.event.request.intent.slots ? this.event.request.intent.slots.Name : undefined;
        var hasNameSlot = (nameSlot && nameSlot.value);
        if (hasNameSlot) {
            this.attributes.name = nameSlot.value;
        }
        var noteSlot = this.event.request.intent.slots? this.event.request.intent.slots.Note : undefined;
        var hasNoteSlot = (noteSlot && noteSlot.value);
        if (hasNoteSlot) {
            this.attributes.note = noteSlot.value;
        }

        var hasName = (this.attributes.name && this.attributes.name != NO_DATA);
        if (!hasName) {
            this.emit(':ask', 'Ok, who is this note for?', 'Who is the note for?');
            return;
        }
        var hasNote = (this.attributes.note && this.attributes.note != NO_DATA);
        if (!hasNote) {
            this.emit(':ask', 'Ok, what note do you want to leave for ' + this.attributes.name + '?', 'What is the note?');
            return;
        }
        console.log('Leave note "' + this.attributes.note + '" for "' + this.attributes.name + '"');
        if (!this.attributes.notes) {
            this.attributes.notes = [];
        }
        this.attributes.notes.push({
            name: this.attributes.name,
            note: this.attributes.note,
            date: new Date().toString()
        });
        this.attributes.name = NO_DATA;
        this.attributes.note = NO_DATA;
        this.emit(':tell', 'Ok, we left the note');
    },
    'CaptureNameIntent': function() {
        this.emitWithState('TranscribeNoteIntent');
    },
    'AMAZON.HelpIntent': function () {
        this.handler.state = '';
        this.emitWithState('AMAZON.HelpIntent');
    },
    'SessionEndedRequest': function () {
        console.log("SESSIONENDEDREQUEST");
        //this.attributes['endedSessionCount'] += 1;
        this.emit(':tell', "Goodbye!");
    },
    'Unhandled': function () {
        // TODO: Maybe able to send this to transcribe note intent
        console.log("UNHANDLED");
        var message = 'Not sure';
        this.emit(':ask', message, message);
    }
});

var listenHandlers = Alexa.CreateStateHandler(states.LISTEN_MODE, {
    'NewSession': function () {
        this.handler.state = '';
        this.emitWithState('NewSession');
    },
    'CheckNotesIntent': function() {
        var nameSlot = this.event.request.intent.slots.Name;
        var hasNameSlot = (nameSlot && nameSlot.value);
        if (hasNameSlot) {
            this.attributes.name = nameSlot.value;
        }

        var hasName = hasNameSlot || (this.attributes.name && this.attributes.name != NO_DATA);
        if (!hasName) {
            this.emit(':ask', 'Ok, what is your name?', 'Tell me your name.');
        }

        var name = this.attributes.name;
 
        console.log('Getting notes for "' + name + '"');
        var notesForUser = 0;
        var otherNotes = 0;
        var textToSpeak = ''; // TODO: Convert to array
        var otherNames = [];
        if (this.attributes.notes) {
            for(var index in this.attributes.notes) {
                var note = this.attributes.notes[index];
                if (note.name.toLowerCase() == name.toLowerCase()) {
                    console.log('Found the note', note);
                    textToSpeak += note.note + '<break time="1s" />';
                    ++notesForUser;
                } else {
                    if (otherNames.indexOf(note.name) == -1){
                        otherNames.push(note.name);
                    }
                }
                ++otherNotes;
            }
        }
        if (notesForUser > 0) {
            this.emit(':ask', 'Here are your notes: <break time="1s" /> ' + textToSpeak + '. ' +
             ' Should I replay the notes or delete them?');
        } else if (otherNotes > 0) {
            var otherNamesSpeek = otherNames.join(', ');
            this.emit(':tell', 'No notes found for ' + name + ' but there are ' + otherNotes + ' other notes for ' +
                otherNamesSpeek);
        } else {
            this.emit(':tell', 'There are no notes for ' + name);
        }
    },
    'CaptureNameIntent': function() {
        this.emitWithState('CheckNotesIntent');
    },
    'ReplayIntent': function() {
        this.emitWithState('CheckNotesIntent');
    }, 
    'DeleteIntent': function() {
        var nameSlot = this.event.request.intent.slots.Name;
        var hasNameSlot = (nameSlot && nameSlot.value);
        if (hasNameSlot) {
            this.attributes.name = nameSlot.value;
        }

        var hasName = hasNameSlot || (this.attributes.name && this.attributes.name != NO_DATA);
        if (!hasName) {
            // TODO: Cannot ask for name with GetNameIntent because
            // then we would need a new state to handle delete
            this.emit(':tell', 'TODO');
            return;
        }

        var name = this.attributes.name;
 
        console.log('Deleting notes for "' + name + '"');
        var notesForUser = 0;
        if (this.attributes.notes) {
            var notesToKeep = [];
            for(var index in this.attributes.notes) {
                var note = this.attributes.notes[index];
                if (note.name.toLowerCase() == name.toLowerCase()) {
                    ++notesForUser;
                } else {
                    notesToKeep.push(note);
                }
            }
            this.attributes.notes = notesToKeep;
        }
        if (notesForUser > 0) {
            this.emit(':tell', 'Ok, deleted ' + notesForUser + ' of your notes.');
        } else {
            this.emit(':tell', 'Ok, done');
        }
    },
    'TranscribeNoteIntent': function() {
        this.handler.state = states.TRANSCRIBE_MODE;
        this.emitWithState('TranscribeNoteIntent');
    },
    'AMAZON.HelpIntent': function () {
        var message = 'I can play back transcribed notes, ' +
            'I only need your name.  Do you want to play back your notes?';
        this.emit(':ask', message, message);
    },
    'AMAZON.YesIntent': function () {
        this.handler.state = states.LISTEN_MODE;
        this.emit(':ask', 'Ok, what is your name?');
    },
    'AMAZON.NoIntent': function () {
        console.log("NOINTENT");
        this.emit(':tell', 'Ok, see you next time!');
    },
    'SessionEndedRequest': function () {
        console.log("SESSIONENDEDREQUEST");
        //this.attributes['endedSessionCount'] += 1;
        this.emit(':tell', "Goodbye!");
    },
    'Unhandled': function () {
        console.log("UNHANDLED");
        this.handler.state = '';
        this.emitWithState('NewSession');
    }
});
