


function Plugin(options) {
    var that = this;
    if(options.data){ this.$data = options.data;}
    if (typeof options.data != "undefined" && (options.data.plugin || options.data.area)) {
        alert("包含内置属性名: ”plugin“ 或“area” ");
        return false
    }
    if (typeof options.plugin == "object") {
        if (options.plugin.area) { this.area = options.plugin.area }
        if (options.plugin.name) { this.plugin = options.plugin.name }
    }
    if (this.area) {
        var _layers = $(".layui-layer-page"),_win = $(window);
        this.area = Array.isArray(this.area) ? this.area : [this.area, "auto"];
        _layers.css({"width": this.area[0],"heigth": this.area[1] });
        _layers.css({
            "top": (parseInt(_win.height() - _layers.height()) / 2) + "px",
            "left": (parseInt(_win.width() - _layers.width()) / 2) + "px"
        });
    }
    $.extend(this, options.method);
    if (options.request) {
        this.mouthRequest(options.request);
    }
    if (options.event) {
        options.event.call(this);
    }
    if (options.init) {
        options.init.call(this);
    }
};

Plugin.prototype = {
    // 挂载请求方法
    mouthRequest:function (config) {
        var that = this;
        this.each(config, function (key, item) {
            Plugin.prototype[key] = function (data, callback1, callback2) {
                var tips = "",
                    config = {
                        tips: (function () {
                            tips = item[0].replace(/\$\{(\w*)\}/, function ($1, $2) { return data[$2]; });
                            return "正在" + tips + '，请稍后 <img src="/static/img/ing.gif">'
                        }()),
                        method: item[1],
                        url: item[1],
                        success: callback1,
                        error: callback2
                    };
                if (typeof data === "function") {
                    config.success = data
                }
                if (item[1].indexOf("/") == 0) {
                    delete config.method
                } else {
                    if (item[1].indexOf("/") > 0) {
                        delete config.url
                    } else {
                        if (item[1].indexOf("/") == -1) {
                            delete config.url;
                            config.method = that.plugin + "/" + config.method
                        }
                    }
                }
                if (typeof data === "object") { config.data = data }
                if (!callback2){ delete config.error }
                that.http(config);
            }
        })
    },
    // 表格渲染
    tableReader: function (options){
        var that = this,
        $info={
            el:null,
            load:null,    // 请求提示类型，默认为loading
            tips:null, // 请求提示文本，仅支持
            method:null,
            height:'400px',
            resize:false, //支持页面拖动，或者窗口变化等操作，需要
            class:'', //支持class添加
            page:false, //支持分页显示，
            width:null, //table宽度
            isFixedHead:true,  // 需要支持固定表头，需要height参数
            cols:{}, //不能为空
            data:null,
            parseData:function(rdata){
                return {
                    data:rdata.data,
                    page:rdata.page
                }
            }
        },
        table = ['div',{class:'divtable'},['table',{class:'table table-hover '+ (options.class ||'') ,width:(options.width || "100%"),cellspacing:"0",cellpadding:"0",border:"0"},[]]],thead = ['thead',['tr',[]]],tbody = ['tbody',[]],cols = $.extend({},options.cols),event_group = [], el = $(options.el);
        $info = $.extend($info,options);
        if(el.find('thead').length == 0){
            this.$each(cols,function(index,item){
                thead[1][1].push(['th',{'style':setStyle(item)},['span',item.title]]);
            });
            table[2][2].push(thead);
        }
        if($info.data == null){
            this.$http($.extend(options,{success:function(rdata){
                reader_tbody($info.parseData(rdata));
                table[2][2].push(tbody);
                el.append(that.$readerElement(table)[0]);
            }}));

        }else{
            reader_tbody($info.parseData($info.data));
            el.find('table').append(this.$readerElement(table)[0]);
        }
        function setStyle(config){
            var str = '';
            that.$each(config,function(key,item){
                if(key == 'class' || key == 'align' || key == 'width'){
                    if(key != 'align'){
                        str+= key +':'+ item +';'
                    }else{
                        str+= 'text-align:'+ item +';'
                    }
                }
            });
            return str;
        }
        function reader_tbody(res){
            that.$each(res.data,function(index,item){
                tbody[1].push(['tr',[]]);
                var tr = tbody[1][index][1];
                // return false;
                that.$each(cols,function(index,items){
                    tr[index] = [];
                    tr[index].push(['td',['span',{ 'style':setStyle(items),'class':items.class || ''},(function(){
                        var groups = items.group,groups_list = []
                        if(typeof groups == 'undefined'){
                            return that.$reader_table_type(items.type,items);
                        }else{
                            that.each(groups,function(index,itemss){
                                groups_list.push(['a',{'href':'javascript:;','class':'btlink '+(items.class ||'')},(function(){
                                    if(typeof itemss.templet == 'function'){
                                        return itemss.templet();
                                    }else{
                                        return itemss.title;
                                    }
                                })()
                                ])
                            });
                            return groups_list;
                        }
                    })()
                    ]]);
                });
            });
        }
        return options;
    },
    // 遍历通用方法，支持对象和数组
    each: function (obj, fn) {
        var key, that = this;
        if (typeof fn !== "function") {
            return that
        }
        obj = obj || [];
        if (obj.constructor === Object) {
            for (key in obj) {
                if (fn.call(obj[key], key, obj[key])) {
                    break
                }
            }
        } else {
            for (key = 0; key < obj.length; key++) {
                if (fn.call(obj[key], key, obj[key])) {
                    break
                }
            }
        }
        return that
    },
    // 表单数据获取
    serializeObject: function (pram) {
        var array = [],
            obj = {},
            isProperty = null,
            item = null;
        if (typeof pram == "string") {
            array = $(pram).serializeArray()
        }
        if (Array.isArray(pram)) {
            array = pram
        }
        isProperty = obj.hasOwnProperty;
        for (var i = 0; i < array.length; i++) {
            item = array[i];
            if (!isProperty.call(obj, item.name)) {
                obj[item.name] = item.value
            }
        }
        return obj
    },
    // 请求
    http: function (options) {
        var loadT = "",
            that = this;
        $info = {
            load: null,
            tips: null,
            method: null,
        }, $config = {
            type: "post",
            url: null,
            data: {},
            timeout: "99999999"
        };
        for (var key in options) {
            if (key == "success" || key == "error") { continue }
            typeof $info[key] == "undefined" ? ($config[key] = options[key]) : ($info[key] = options[key])
        }
        if (($info.load === null || parseInt($info.load) == 0)) {
            loadT = layer.msg((typeof $info.tips != "string" ? '正在加载中，请稍后<img src="/static/img/ing.gif">' :
                $info.tips), {
                icon: 16,
                time: 0,
                shade: 0.3
            })
        } else {
            if ($info.load === 1) { loadT = layer.load() }
        }
        if ($info.method != null) {
            var parm = $info.method.split("/");
            $config.url = "/plugin?action=a&name=" + parm[0] + "&s=" + parm[1]
        }
        if (typeof $config.data == "string") {
            var obj = {}, arry = $config.data.split("&");
            $config.data = that.serializeObject(arry);
        }
        $.ajax($.extend($config, {
            complete: function (xhr, status) {
                if ($info.load != 2) { layer.close(loadT) }
                var rdata = {};
                if (status === "success") {
                    rdata = xhr.responseJSON || JSON.parse(xhr.responseText);
                    if (typeof rdata.status != 'undefined' && rdata.status === false) {
                        layer.msg(rdata.msg, {
                            icon: 2,
                            time: 0,
                            shade: 0.2,
                            shadeClose: true
                        });
                        if (options.error) {
                            options.error(rdata)
                        }
                        return false
                    } else {
                        if (options.success) {
                            options.success(rdata)
                        }
                    }
                } else {
                    if (options.error) {
                        options.error(xhr)
                    }
                    layer.msg("请求状态码:" + xhr.status + ",请求发生错误!", {
                        icon: 2
                    })
                }
            }
        }))
    }
};