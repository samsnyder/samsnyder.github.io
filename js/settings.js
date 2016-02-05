function SettingsController($cordovaPreferences){
    var that = this;

    that.defaultPrefs = {
        lan: "en",
        mainBackCol: "#ECECEC",
        conversationMode: false,
        phillipsIp: "127.0.0.1:8083",
        phillipsUser: "newdeveloper"
    };

    that.prefs = {};

    window.resetPrefs = function(){
        that.prefs = JSON.parse(JSON.stringify(that.defaultPrefs));
        that.save();
    }

    that.save = function(){
        for(var prefName in that.prefs){
            that.setPref(prefName, that.prefs[prefName]);
        }
    }

    that.load = function(){
        for(var prefName in that.defaultPrefs){
            that.getPref(prefName, function(value){
                if(value != null){
                    that.prefs[prefName] = value;
                }else if(!that.prefs[prefName]){
                    that.prefs[prefName] = that.defaultPrefs[prefName];
                }
            });
        }
    }

    that.getPref = function(key, cb){
        if($cordovaPreferences.pluginNotEnabledMessage){
            cb(getCookie(key));
        }else{
            $cordovaPreferences.fetch(key)
                .success(function(value) {
                    if(cb)
                        cb(value);
                })
                .error(function(error) {
                    if(cb)
                        cb(null);
                });
        }
    }

    that.setPref = function(key, value, cb){
        if($cordovaPreferences.pluginNotEnabledMessage){
            setCookie(key, value);
            if(cb)
                cb(null);
        }else{
            $cordovaPreferences.store(key, value)
                .success(function(value) {
                    if(cb)
                        cb(null);
                })
                .error(function(error) {
                    if(cb)
                        cb(error);
                });
        }
    }

    function getCookie(cname) {
        var name = cname + "=";
        var ca = document.cookie.split(';');
        for(var i=0; i<ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0)==' ') c = c.substring(1);
            if (c.indexOf(name) == 0) return c.substring(name.length,c.length);
        }
        return null;
    }

    function setCookie(cname, cvalue) {
        var d = new Date();
        d.setTime(d.getTime() + (365*24*60*60*1000));
        var expires = "expires="+d.toUTCString();
        document.cookie = cname + "=" + cvalue + "; " + expires;
    }


}
