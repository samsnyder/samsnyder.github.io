function ActionMethods(uiHandler, $scope){

    var that = this;

    this.run = function(action, param, fCb){
        if(that.actionMethods[action]){
            that.actionMethods[action](param, fCb);
            return true;
        }else{
            return false;
        }
    }

    this.helpers = {
        monthName: function(index){
            return [
                "January", "February", "March",
                "April", "May", "June", "July",
                "August", "September", "October",
                "November", "December"
            ][index];
        },
        getOrdinal: function(n) {
            var s=["th","st","nd","rd"],
                v=n%100;
            return n+(s[(v-20)%10]||s[v]||s[0]);
        },
        dateToNL: function(d){
            var timeString = d.toLocaleTimeString();
            var dateString = that.helpers.getOrdinal(d.getDate()) + " of "
                + that.helpers.monthName(d.getMonth()) + " " + d.getFullYear();
            return timeString + " on the " + dateString;
        },
        locToLonLat2: function(loc, cb, errCb){
            var geoUrl = "http://maps.googleapis.com/maps/api/geocode/json?sensor=false&address="
                + encodeURIComponent(loc);
            $scope.$http.get(geoUrl).then(function(resp){
                if(resp.data.results.length == 0){
                    errCb(null);
                }else{
                    cb(resp.data.results[0].geometry.location);
                }
            }, errCb);
        },
        searchAddress: function(loc, cb, errCb){
            if(that.helpers.geocoder == null){
                that.helpers.geocoder = new google.maps.Geocoder();
            }
            that.helpers.geocoder.geocode({'address': loc}, function(results, status) {
                if (status === google.maps.GeocoderStatus.OK) {
                    cb(results);
                } else {
                    errCb(status);
                }
            });
        },

        searchDirections: function(from, to, cb, cbErr){
            if(that.helpers.directionsService == null){
                that.helpers.directionsService = new google.maps.DirectionsService;
            }
            that.helpers.directionsService.route({
                origin: from,
                destination: to,
                travelMode: google.maps.TravelMode.DRIVING
            }, function(response, status) {
                if (status === google.maps.DirectionsStatus.OK) {
                    cb(response);
                } else {
                    window.alert('Directions request failed due to ' + status);
                }
            });
        },

        getPhillipsUser: function(){
            if(that.helpers.phillipsUser == null){
                var hue = jsHue();
                var bridge = hue.bridge($scope.prefs.phillips.ip);
                that.helpers.phillipsUser = bridge.user($scope.prefs.phillips.user);
            }
            return that.helpers.phillipsUser;
        },

        findContact: function(query, question, cb, errCb){
            var gotContacts = function(contacts){
                if(contacts.length == 0){
                    errCb();
                }else if(contacts.length == 1 && contacts[0].phoneNumbers.length == 1){
                    cb({
                        name: contacts[0].displayName,
                        number: contacts[0].phoneNumbers[0].value
                    });
                }else{
                    var options = [];
                    for(i in contacts){
                        for(j in contacts[i].phoneNumbers){
                            options.push({
                                value: contacts[i].displayName,
                                subVal: contacts[i].phoneNumbers.length == 1 ? null :
                                    contacts[i].phoneNumbers[j].type,
                                say: contacts[i].phoneNumbers.length == 1 ? contacts[i].displayName :
                                    contacts[i].displayName + " " + contacts[i].phoneNumbers[j].type,
                                arg: {
                                    name: contacts[i].displayName,
                                    number: contacts[i].phoneNumbers[j].value
                                },
                                clicked: cb
                            });
                        }
                    }

                    uiHandler.getOption(options, {
                        sayPrefix: question
                    });
                }
            }

            try{
                var opts = {
                    filter : query,
                    multiple: true,
                    fields:  ['displayName', 'name'],
                    desiredFields: ['displayName', 'phoneNumbers', 'name']
                };

                if (ionic.Platform.isAndroid()) {
                    opts.hasPhoneNumber = true;
                };

                $scope.$cordovaContacts.find(opts).then(gotContacts);
            }catch(e){
                gotContacts([
                    {
                        displayName: "John Appleseed",
                        phoneNumbers: [
                            {
                                type: "mobile",
                                value: "888-555-5512"
                            },
                            {
                                type: "home",
                                value: "888-555-1212"
                            }
                        ]
                    },
                    {
                        displayName: "Sam Snyder",
                        phoneNumbers: [
                            {
                                type: "mobile",
                                value: "07985130858"
                            }
                        ]
                    }
                ]);
            }
        }
    }

    this.actionMethods = {

        "echo": function(param, fCb){
            uiHandler.printString(param.say, fCb);
        },

        "units.convert": function(param, fCb){
            var convert = require('convert-units');
            var result = convert(param.value).from(param.from).to(param.to);
            var string = param.value + " " + convert().describe(param.from).plural +
                " is " + result + " " + convert().describe(param.to).plural;
            uiHandler.printString(string, fCb);
        },

        "say.datetime.current": function(param, fCb){
            uiHandler.printString("The time is " + that.helpers.dateToNL(new Date()), fCb);
        },
        "say.datetime.loc": function(param, fCb){
            that.helpers.locToLonLat(param.location, function(lonLat){
                var d = new Date();
                var utcMillis = d.getTime() + (d.getTimezoneOffset() * 60000);
                var timestamp = Math.floor(utcMillis / 1000);
                var timeUrl = "https://maps.googleapis.com/maps/api/timezone/json?sensor=false&location="
                    + encodeURIComponent(lonLat.lat + "," + lonLat.lng)
                    + "&timestamp=" + timestamp;

                $scope.$http.get(timeUrl).then(function(resp){
                    console.log(timeUrl, resp.data);
                    var d = new Date((timestamp*1000 + resp.data.rawOffset*1000 + resp.data.dstOffset*1000));
                    uiHandler.printString("The time in " + param.location + " is " + that.helpers.dateToNL(d), fCb);
                }, function(err){
                    uiHandler.printString("Could not find that location.", fCb);
                });
            }, function(err){
                uiHandler.printString("Could not find that location.", fCb);
            })
        },
        "weather": function(param, fCb){
            var url = "https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20weather.forecast%20where%20woeid%20in%20(select%20woeid%20from%20geo.places(1)%20where%20text%3D%22" + encodeURIComponent(param.location) + "%2C%20ak%22)&format=json";
            $scope.$http.get(url).then(function(resp){
                var weather = resp.data.query.results.channel;
                weather.item.forecast.shift();
                uiHandler.showWeather(weather, fCb);
            }, function(err){
                uiHandler.printString("Could not fetch the weather. Please try again.", fCb);
            });
        },

        "answers": function(param, fCb){
            param.query = param.query.replace(/ /g, '_');

            var url = "http://www.answers.com/Q/" + encodeURIComponent(param.query);
            $scope.$http.get(url, true).then(function(resp){
                var obj = $(resp.data);
                var text = obj.find(".answer_text").text().trim();
                var title = obj.find(".title_text").text().trim();
                uiHandler.showAnswers({
                    text: text,
                    title: title
                }, fCb);
            }, function(err){
                uiHandler.printString("Could not answer that question.", fCb);
            });
        },

        "send.sms.nomessage.nocontact": function(param, fCb){
            uiHandler.printString("Who would you like to send it too?", function(){
                uiHandler.getUserInput(function(name){
                    that.actionMethods["send.sms.nomessage"]({
                        name: name
                    }, fCb);
                })
            })
        },

        "send.sms.nomessage": function(param, fCb){
            that.helpers.findContact(param.name, "Would you like to send it to", function(contact){
                console.log("ASdASFDSDFSD", contact);
                uiHandler.printString("What would you like to say?", function(){
                    console.log("aaaaa");
                    uiHandler.getUserInput(function(message){
                        console.log("message", message);
                        uiHandler.yesNo("Would you like to send \"" +
                                        message + "\" to " + contact.name,
                                        function(){
                                            sms.send(contact.number, message, {}, function(){
                                                uiHandler.printString("Your message has been sent.");
                                            }, function(e){
                                                uiHandler.printString("The message could not be sent.");
                                            });
                                        }, function(){
                                            uiHandler.printString("Your message has been discarded.", fCb);
                                        });
                    });
                });
            }, function(){
                uiHandler.printString(param.name + " could not be found in your contacts. Please try again.", fCb);
            });
        },

        "call.contact": function(param, fCb){
            that.helpers.findContact(param.name, "Would you like to call", function(contact){
                uiHandler.printString("Calling " + contact.name, function(){
                    fCb(true);
                });
            })
        },

        "phillips.toggle": function(param, fCb){
            var user = that.helpers.getPhillipsUser();
            user.getLights(function(data){
                var searchVal = param.name.toLowerCase();
                for(id in data){
                    var lightName = data[id].name.toLowerCase();
                    if(searchVal.indexOf(lightName) >= 0 || lightName.indexOf(searchVal) >= 0){
                        user.setLight(id, {
                            on: param.command.indexOf("enable") == 0
                        }, function(data){
                            console.log(data);
                        });
                    }
                }
            })
        },

        "google.search": function(param, fCb){
            uiHandler.showUrl("http://www.google.com/custom?q=" + encodeURIComponent(param.query));
            fCb();
        },

        "map.search": function(param, fCb){
            that.helpers.searchAddress(param.query, function(results){
                console.log("A", results);

                bounds = results[0].geometry.viewport;

                $scope.$timeout(function(){
                    uiHandler.showMap(function(mapObj){
                        map = new google.maps.Map(mapObj, {
                            center: results[0].geometry.location,
                            zoom: bounds ? getBoundsZoomLevel(bounds, {
                                width: $(mapObj).width(),
                                height: $(mapObj).height()
                            }) : 8,
                            disableDefaultUI: true
                        });
                        var marker = new google.maps.Marker({
                            map: map,
                            position: results[0].geometry.location,
                            title: results[0].formatted_address
                        });
                    });

                }, 0);
            }, function(err){
                uiHandler.printString("Could not find that address.");
            });
        },

        "map.directions": function(param, fCb){
            that.helpers.searchDirections(param.from, param.to, function(result){
                console.log("A", result);


                var bounds = result.routes[0].bounds;

                $scope.$timeout(function(){
                    uiHandler.showMap(function(mapObj){
                        map = new google.maps.Map(mapObj, {
                            disableDefaultUI: true
                        });

                        var directionsDisplay = new google.maps.DirectionsRenderer;
                        directionsDisplay.setMap(map);
                        directionsDisplay.setDirections(result);
                    });

                }, 0);
            }, function(err){
                uiHandler.printString("Could not find that address.");
            });
        },

        "yelp": function(param){
//             uiHandler.showYelp({
//                 businesses: [
//                     {
//                         name: "Yin Tong",
//                         snippet_text: "Beatuss sdgfdf gda sdf dsfg dsf dsf sd sf",
//                         display_phone: "+23 456 6788 323",
//                         review_count: 234
//                     },{
//                         name: "Yin Tong",
//                         snippet_text: "Beatuss sdgfdf gda sdf dsfg dsf dsf sd sf \
// wefwerwev fsdfdsf sdf sd fsd f sdf rtwg ref dwe ger sfer gf werg ver gf \
// efg erg er ger grtw hgf erf aer dgfe rgsr teg reda grse ger",
//                         display_phone: "+23 456 6788 323",
//                         review_count: 234
//                     },{
//                         name: "Yin Tong",
//                         snippet_text: "Beatuss sdgfdf gda sdf dsfg dsf dsf sd sf",
//                         display_phone: "+23 456 6788 323",
//                         review_count: 234
//                     },{
//                         name: "Yin Tong",
//                         snippet_text: "Beatuss sdgfdf gda sdf dsfg dsf dsf sd sf",
//                         display_phone: "+23 456 6788 323",
//                         review_count: 234
//                     },{
//                         name: "Yin Tong",
//                         snippet_text: "Beatuss sdgfdf gda sdf dsfg dsf dsf sd sf",
//                         display_phone: "+23 456 6788 323",
//                         review_count: 234
//                     },{
//                         name: "Yin Tong",
//                         snippet_text: "Beatuss sdgfdf gda sdf dsfg dsf dsf sd sf",
//                         display_phone: "+23 456 6788 323",
//                         review_count: 234
//                     },
//                 ]
//             });
//             return;


            $scope.$yelpAPI.search(param, function(data){
                console.log(data);
                for(var i=0; i<data.businesses.length; i++){
                    data.businesses[i].image_url = data.businesses[i].image_url.replace("ms.jpg", "ls.jpg");
                }
                uiHandler.showYelp(data);
            });
        },

        "stock.search": function(param){
            var searchURL = "http://d.yimg.com/aq/autoc?region=US&lang=en-US&query=" + encodeURIComponent(param.query);
            $scope.$http.get(searchURL, true).then(function(resp){
                var numResults = 3;
                if(resp.data.ResultSet.Result.length < numResults){
                    numResults = resp.data.ResultSet.Result.length;
                }

                if(numResults == 0){
                    uiHandler.showStock([]);
                    return;
                }

                var symbols = "";
                for(var i=0; i<numResults; i++){
                    symbols += '"' + resp.data.ResultSet.Result[i].symbol + '"';
                    if(i < numResults - 1){
                        symbols += ",";
                    }
                }
                var lookupUrl = "https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.quotes%20where%20symbol%20in%20(" + encodeURIComponent(symbols) + ")%0A%09%09&format=json&env=http%3A%2F%2Fdatatables.org%2Falltables.env";
                $scope.$http.get(lookupUrl).then(function(resp){
                    uiHandler.showStock(resp.data.query.results.quote);
                    uiHandler.sayString("Here are the results for " + param.query);
                });
            })
        }
    }
}
