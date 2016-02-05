function APIHandler(uiHandler, $scope){
    this.uiHandler = uiHandler;
    this.actionMethods = new ActionMethods(uiHandler, $scope);


    var that = this;


    this.handleQuestion = function(question, fCb){
        try{
            if($scope.settings.prefs.lan.localeCompare("en") == 0){
                that.askAPI(question, fCb);
            }else{
                uiHandler.translateText($scope.settings.prefs.lan, "en", question, function(engQ){
                    that.askAPI(engQ, fCb);
                });
            }
        }catch(e){
            console.error(e);
        }
    }


    this.askAPI = function(input, fCb){
        input = input.toLowerCase();
        if(input.indexOf("time") >= 0){
            that.handleAPIResponse({
                result: {
                    action: "say.datetime.current"
                }
            });
        }else if(input.indexOf("unit") >= 0){
            that.handleAPIResponse({
                result: {
                    action: "units.convert",
                    parameters: {
                        from: "km",
                        to: "m",
                        value: "4.5"
                    }
                }
            }, fCb);
        }else if(input.indexOf("weather") >= 0){
            that.handleAPIResponse({
                result: {
                    action: "weather",
                    parameters: {
                        location: "paris"
                    }
                }
            });
        }else if(input.indexOf("message") >= 0){
            that.handleAPIResponse({
                result: {
                    action: "send.sms.nomessage.nocontact",
                }
            });
        }else if(input.indexOf("map") >= 0){
            that.handleAPIResponse({
                result: {
                    action: "map.search",
                    parameters: {
                        query: "paris"
                    }
                }
            });
        }else if(input.indexOf("stock") >= 0){
            that.handleAPIResponse({
                result: {
                    action: "stock.search",
                    parameters: {
                        query: "yahoo"
                    }
                }
            });
        }else if(input.indexOf("map") >= 0){
            that.handleAPIResponse({
                result: {
                    action: "map.search",
                    parameters: {
                        query: "paris"
                    }
                }
            });
        }else{
            that.handleAPIResponse({
                result: {
                    action: "answers",
                    parameters: {
                        query: input
                    }
                }
            }, fCb);
        }
    }

    this.handleAPIResponse = function(response, fCb){
        if(response.result != null &&
           that.actionMethods.run(response.result.action, response.result.parameters, fCb)){

        }else{
            that.uiHandler.printString("Chatbot reply", fCb);
        }
    }
}
