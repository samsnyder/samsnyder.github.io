function UIHandler($scope){
    this.$scope = $scope;

    this.translateKey = "AIzaSyAczVs2EqRF-C1eP0h_HsbHB3yuK1zQxPQ";

    var that = this;

    function showHTML(template, data, cb){
        $scope.addItem({
            template: "templates/" + template,
            type: 'html',
            data: data
        }, false, cb);
    }

    this.showUrl = function(url){
        $scope.iFrameUrl = url;
        $scope.iFrameModal.show();
        // $scope.addItem({
        //     type: 'url',
        //     url: url
        // });
    }

    this.translateText = function(fromLan, toLan, input, cb){
        var url = "https://www.googleapis.com/language/translate/v2?key=" + that.translateKey;
        url += "&source=" + fromLan + "&target=" + toLan + "&q=" + encodeURIComponent(input);

        $scope.$http.get(url).then(function(resp){
            console.log(resp);
            if(resp.data.data && resp.data.data.translations[0]){
                cb(resp.data.data.translations[0].translatedText);
            }
        }, function(err){
            cb(input);
        });
    }

    this.printString = function(string, fCb, customParam){
        var param = {
            isQues: false,
            translate: true,
            say: true
        };
        for(var paramName in customParam){
            param[paramName] = customParam[paramName];
        }

        var add = function(input){
            $scope.addItem({
                value: input,
                type: param.isQues ? 'ques' : 'resp'
            });
        }

        if(!param.translate){
            add(string);
        }else{
            if($scope.settings.prefs.lan.localeCompare("en") == 0){
                add(string);
            }else{
                that.translateText("en", $scope.settings.prefs.lan, string, function(lanQ){
                    add(lanQ);
                });
            }
        }
        if(param.say){
            that.sayString(string, fCb);
        }
    }

    this.currentOptions = null;
    this.getOption = function(options, customParam){
        var param = {
            say: true,
            sayPrefix: "",
            saySuffix: "",
            sayString: null,
            printSay: false,
            ask: true
        };
        for(var paramName in customParam){
            param[paramName] = customParam[paramName];
        }

        that.removeCurrentOptions();
        var item = {
            type: "options",
            options: options
        };
        that.currentOptions = item;

        if(param.say){
            if(param.sayString == null){
                param.sayString = param.sayPrefix + " ";
                for(var i=0; i<options.length; i++){
                    param.sayString += options[i].say ? options[i].say : options[i].value;
                    if(i < options.length - 2){
                        param.sayString += ", ";
                    }else if(i == options.length - 2){
                        param.sayString += " or ";
                    }
                }
                param.sayString += param.saySuffix;
            }
            (param.printSay ? that.printString : that.sayString)(param.sayString, function(){
                console.log("FDSDFSD");
                if(param.ask){
                    that.getUserInput(function(response){
                        response = response.toLowerCase();
                        for(i in options){
                            if((options[i].regex && options[i].regex.test(response)) ||
                               (options[i].say && options[i].say.toLowerCase() == response) ||
                               (options[i].value && options[i].value.toLowerCase() == response)){
                                that.optionClicked(options[i]);
                            }
                        }
                    });
                }
            });
        }

        $scope.addItem(item);
    }

    this.optionClicked = function(option){
        that.removeCurrentOptions();
        if(option.clicked){
            option.clicked(option.arg);
        }
    }

    this.removeCurrentOptions = function(){
        if(that.currentOptions != null){
            $scope.removeItem(that.currentOptions);
            that.currentOptions = null;
        }
    }

    this.yesNo = function(question, yes, no){
        that.getOption([
            {
                value: "Yes",
                clicked: yes,
                regex: /.*(yes|sure).*/
            },
            {
                value: "No",
                clicked: no,
                regex: /.*(no|stop).*/
            }
        ], {
            printSay: true,
            sayString: question
        });
    }

    this.getUserInput = function(cb){
        $scope.catchQuestion = cb;
        $scope.startListen();
    }

    this.sayString = function(string, cb){
        if(typeof SpeechSynthesisUtterance == "undefined"){
            TTS.speak(string, function () {
                if(cb){
                    cb();
                }
            }, function (reason) {
                console.log(reason);
            });
        }else{
            console.log("TTS disabled. Would say \"" + string + "\"");
            speechSynthesis.cancel();
            var msg = new SpeechSynthesisUtterance(string);
            msg.lang = 'en-UK';
            msg.onend = cb;
            console.log(msg);
            $scope.$timeout(function(){
                window.speechSynthesis.speak(msg);
            }, 0);
        }
    }

    this.showWeather = function(weather, fCb){
        showHTML("weather.html", weather);
        that.sayString("Here is the weather in " + weather.location.city, fCb);
    }

    this.showYelp = function(yelp){
        showHTML("yelp.html", yelp);
    }

    this.showAnswers = function(answer, fCb){
        showHTML("answers.html", answer);
        that.sayString(firstSentence(answer.text), fCb);
    }

    function firstSentence(text){
        var i = text.search(/[.?!]\s/);
        return text.substring(0, i+1);
    }

    this.showStock = function(stocks){
        for(var i=0; i<stocks.length; i++){
            if(stocks[i].Change == null){
                stocks[i].Change = "0.00";
                stocks[i].ChangeinPercent = "0.00%";
            }

            var cP = parseFloat(stocks[i].Change);
            if(cP < 0){
                stocks[i].changeDir = "down";
            }else if(cP == 0){
                stocks[i].changeDir = "flat";
            }else{
                stocks[i].changeDir = "up";
            }
        }

        showHTML("stock.html", stocks);
    }

    this.showMap = function(cb){
        showHTML("map.html", null, function(itemObj){
            $scope.$timeout(function(){
                cb($(itemObj).find(".map")[0]);
            }, 0);
        });
    }
}
