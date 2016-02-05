function HTTP($http){

    var that = this;
    that.$http = $http;

    that.proxyUrl = "http://samsnyder.co.uk/proxy.php?csurl=";

    that.get = function(url, useProxy){
        if(useProxy){
            url = that.proxyUrl + encodeURIComponent(url);
        }

        return that.$http.get(url);
    }

}
