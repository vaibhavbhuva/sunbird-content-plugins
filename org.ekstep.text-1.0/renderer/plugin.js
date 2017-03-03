Plugin.extend({
    _type: 'org.ekstep.text',
    _isContainer: true,
    _render: true,
    _plginConfig: {},
    _plginData: {},
    _plginAttributes: {},
    initPlugin: function(data) {
        var instance = this;
        this._plginConfig = JSON.parse(data.config.__cdata);
        if(!_.isUndefined(data.data))
            this._plginData = JSON.parse(data.data.__cdata);

        switch (data.textType) {
            case 'readalong':
                this._data = data;
                var data = _.clone(this._data);
                data.id = _.uniqueId('htext');
                data.timings = this._plginConfig.timings;
                data.audio = this._plginConfig.audio;
                data.highlight = this._plginConfig.highlight;
                data.visible = true;
                data.event = { 'type':'click', 'action' : {'type':'command', 'command' : 'togglePlay' , 'asset': data.id}};
                if(data.autoplay){
                    if(_.isUndefined(instance._stage.events.event)){
                        var event = [];
                        event.push({ 'type':'enter', 'action' : {'type':'command', 'command' : 'togglePlay' , 'asset': data.id}});
                        instance._stage.events.event = event;
                    }else{
                        instance._stage.events.event.push({ 'type':'enter', 'action' : {'type':'command', 'command' : 'togglePlay' , 'asset': data.id}});
                    }
                    if(_.isUndefined(instance._stage._data.events)){
                        instance._stage._data.events = {'event': event}
                    }
                }
                PluginManager.invoke('htext', data, instance._parent, instance._stage, instance._theme);
                break;
            case 'wordinfo':
                var wordsArr = this._plginConfig.words.split(',');//_.split(data.words, ',');
                var text = data.__text;
                var exp = data.w * (1920 / 100);
                var width = 720 * data.w / 100;
                var fontsize = parseInt(Math.round(data.fontsize * (width / exp)).toString());
                data.__text  = _.map(text.split(' '), function(word) {
                    var index = _.indexOf(wordsArr, word)
                    if (index != -1) {
                        return "<a style='font-weight:bold; cursor:pointer; font-size:"+(parseInt(fontsize)+2)+"px; color:"+instance._plginConfig.wordfontcolor+"; background:"+instance._plginConfig.wordhighlightcolor+"; border-bottom: 1px solid "+instance._plginConfig.wordunderlinecolor+";' data-event='" + word + "_click'>" + word + "</a>";
                    } else {
                        return word;
                    }
                }).join(' ');
            
                var dims = this.relativeDims();
                var div = document.getElementById(data.id);
                if (div) {
                    jQuery("#" + data.id).remove();
                }
                this._data = data;
                var data = _.clone(this._data);
                data.id = _.uniqueId('wordinfo');
                div = document.createElement('div');
                if (data.style)
                    div.setAttribute("style", data.style);
                div.id = data.id;
                div.style.fontSize = fontsize+ 'px';
                div.style.width = (dims.w + (wordsArr.length * 2)) + 'px';
                div.style.height = dims.h + 'px';
                div.style.position = 'absolute';
                div.style.fontFamily = data.font;
                div.style.fontWeight = this._plginConfig.fontweight ? "bold" : "normal";
                div.style.fontStyle = this._plginConfig.fontstyle ?  "italic" : "normal";
                div.style.color = data.color;

                var parentDiv = document.getElementById(Renderer.divIds.gameArea);
                parentDiv.insertBefore(div, parentDiv.childNodes[0]);

                jQuery("#" + data.id).append(data.__text);
                this._div = div;
                //this._self = new createjs.Container();
                this._self = new createjs.DOMElement(div);
                this._self.x = dims.x;
                this._self.y = dims.y;
                if(_.isUndefined(instance._stage.events.event)){
                    var event = [];
                    _.forEach(wordsArr, function(value, key) {
                        event.push({ 'type': value+'_click', 'action' : [{'type':'command', 'command' : 'show' , 'asset': value+'_info'}, {'type':'command', 'command' : 'HIDEHTMLELEMENTS' , 'asset': value+'_info'}]});
                    });
                    instance._stage.events.event = event;
                }else{
                    _.forEach(wordsArr, function(value, key) {
                        instance._stage.events.event.push({ 'type': value+'_click', 'action' : [{'type':'command', 'command' : 'show' , 'asset': value+'_info'}, {'type':'command', 'command' : 'HIDEHTMLELEMENTS' , 'asset': value+'_info'}]});
                    });
                }
                if(_.isUndefined(instance._stage._data.events)){
                    instance._stage._data.events = {'event': event}
                }
                // else{
                //     instance._stage._data.events.event = event;
                // }
                this.invokeController();
                this.invokeTemplate();
                //Invoke the embed plugin to start rendering the templates
                this.invokeEmbed(data);
                this.registerEvents(data.id);
                break;
            default:
                PluginManager.invoke('text', data, instance._parent, instance._stage, instance._theme);
                break;
        }
    },
    invokeController: function() {
        var controllerData = {};
        controllerData.__cdata = this._plginData.controller;
        controllerData.type = "data";
        controllerData.name = "dictionary";
        controllerData.id = "dictionary";
        this._theme.addController(controllerData);
    },
    invokeTemplate: function() {
        this._theme._templateMap[this._plginData.template.id] = this._plginData.template;
    },
    invokeEmbed: function(data){
        console.log('sadasd');
        var instance = this;
        var wordsArr = this._plginConfig.words.split(',');
        _.forEach(wordsArr, function(value, key) {
            var embedData = {};
            embedData["id"] = value+'_info';
            embedData["stroke"] = "white";
            embedData["template-name"] = instance._plginData.template.id;
            embedData["var-word"] = "dictionary."+value;
            embedData["z-index"] = 1000;
            embedData["visible"] = false;
            embedData.event = { 'type': 'click', 'action' : [{'type':'command', 'command' : 'SHOWHTMLELEMENTS' , 'asset': "textBg"}, {'type':'command', 'command' : 'hide' , 'asset': value+'_info'}]};
            PluginManager.invoke('embed', embedData, instance._stage, instance._stage, instance._theme);
        });
    },
    registerEvents: function(id) {
        var instance = this;
        jQuery('#'+id).children().each(function () {
            var data = jQuery(this).data();
            if (data && data.event) {
                jQuery(this).click(function(event) {
                    event.preventDefault();
                    instance._triggerEvent(data.event);
                    console.info("Triggered event ",data.event);
                });
            }
        });
    },
    _triggerEvent: function(event) {
        var plugin = PluginManager.getPluginObject(Renderer.theme._currentStage);
        event = new createjs.Event(event);
        if(plugin)
            plugin.dispatchEvent(event);
    }
});
//# sourceURL=textrenderer.js