window.$ = {
    post : function(url, attributes){
        var request = new XMLHttpRequest();
        request.open('POST', url, true);
        request.send(data);
    },

    ajax : function(object){
        if (typeof(object) !== "object")
            return new Error('You must pass an object to the AJAX function');
        if (typeof(object.type) !== "string")
            return new Error("You must pass a type on the request object")
        if (typeof(object.url) !== "string")
            return new Error("You must pass a url on the request object")
        
        request = new XMLHttpRequest;
        request.open(object.type, object.url, true);

        request.onload = function(){
            if (request.status >= 200 && request.status < 400){
                // SUCCESS
                resp = request.responseText
                if (typeof(object.success) === "function")
                    object.success(request.responseText, request.status);    
            } else {
                if (typeof(object.error) === "function")
                    object.error(request.responseText, request.status);  
            }
        };

        request.onerror = function(){
            console.log('Connection Error');
        };

        if (typeof(object.data) === "string")
            request.send(JSON.stringify(object.data));
        else
            request.send();
    },

    find : function(el){
        this.el = document.querySelectorAll(el)[0];
        return this
    },

    hide: function(){
        this.el.style.display = 'none';
        return this;
    },

    show: function(){
        this.el.style.display = '';
        return this;
    },

    on : function(eventName, eventHandler){
        this.el.addEventListener(eventName, eventHandler);
    },

    val : function(){
        return this.el.value;
    },

    append: function(html){
        this.el.appendChild(html);
        return this;
    },

    text: function(text){
        this.el.textContent = text;
    },

    ready: function(callback){
        if (typeof(callback) !== "function")
            return new Error('You must pass a callback');
        document.addEventListener('DOMContentLoaded', callback());
    },
}


