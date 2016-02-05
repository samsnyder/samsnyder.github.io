function VoiceRecognition(){
    var that = this;

    that.getSpeech = function(data, success, error){
        if(that.browserSupported()){
            that.browserGetSpeech(data, success, error);
        }else if(that.cordovaSupported()){
            that.cordovaGetSpeech(data, success, error);
        }
    }

    that.cordovaSupported = function(){
        return typeof SpeechRecognition !== 'undefined';
    }

    that.cordovaGetSpeech = function(success, error){
        if(!that.speechRecognition){
            that.speechRecognition = new SpeechRecognition();
            that.speechRecognition.onresult = function(event) {
                if (event.results.length > 0 && success) {
                    success(event.results[0][0].transcript);
                }
            }
        }
        that.speechRecognition.start();
    }

    that.browserSupported = function(){
        return typeof webkitSpeechRecognition !== 'undefined';
    }

    that.browserGetSpeech = function(data, success, error){
        var recognition = new webkitSpeechRecognition();
        recognition.onresult = function(event) {
            if(event.results.length > 0){
                success(event.results[0][0].transcript);
            }else{
                error();
            }
        }

        recognition.onend = function(){
            data("idle");
        }

        recognition.onstart = function(){
            data("talking");
        }

        recognition.onsoundstart = function(a, b){
            console.log(a, b);
        }
        recognition.start();
    }
}

