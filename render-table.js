;(function($,window,document){
    $.fn.renderTable = function(option){
        /* 对象属性
        that.elem 渲染主元素
        that.config 配置
        that.renderCount 组件渲染次数
        that.data 数据
        that.rawData 原始数据
        that.localReload 当前为本地渲染
        that.checkbox
            exist 配置拥有多选框
            isRadio 多选框是否为单选模式
            data 多选框选中数据
        that.page 分页数据
            current_page 当前页数
            per_page 页面条数
            total 页面总条数
            from
            to
            last_page
        that.limit 页面条数数据
            value 当前设置的页面条数
        that.sort 排序数据
            all 所有排序字段以及配置
            carry 当前激活的排序字段
        that.height 组件高度数据
            value 当前body高度
            maxFillHeight 自定义是否限制最大高度
        that.autoRefresh 自动刷新数据
            intervalFlag setInterval标志
            checked 是否选中
            interval 循环间隔
        that.filter 过滤显示字段
            fields 字段
            modalId 模态框ID
            allFields 所有可配置字段

        */

        var Class = function (table, option) {
            var that = this;
            that.elem = table;
            that.config = $.extend({}, that.config, option);
            that.renderCount = 0;
            that.checkbox = {};
            that.height = {};
            that.render(true);

            return {
                config: function () {return that.config},
                reload: function (option, refreshCurrent, localReload) {
                    //option：配置，可覆盖config
                    //refreshCurrent：用当前请求参数和页数刷新当前页面
                    //localReload：本地(前端)刷新，不请求后端接口，直接用当前数据刷新
                    if (refreshCurrent) {
                        var params = $.extend({}, that.config.params);
                        if (that.config.page) {
                            var pageConfig = that.getConfigPage.call(that, that.config.page);
                            params[pageConfig.field] = that.page.current_page;

                        }
                        option.params = params;
                    }
                    that.reload.call(that, option, localReload);
                },
                data: function (index) {
                    //index：获取数据的索引，否则则获取所有数据
                    if (that.data === undefined) {
                        return [];
                    }
                    if (index == 'last') {
                        return that.data[(that.data.length - 1)];
                    }
                    else if (index !== undefined) {
                        return that.data[index];
                    }
                    return that.data;
                },
                updateData: function (index, data, callback) {
                    //index：要更新的数据索引
                    //data：要更新的完整行数据
                    //callback：更改后的回调，可在回调返回整个数组来修改
                    return that.updateData.call(that, index, data, callback);
                },
                insertData: function (index, data, callback) {
                    //index：要插入的数据索引,支持'last'插入到最后
                    //data：要插入的完整行数据
                    //callback：插入后的回调，可在回调返回整个数组来修改
                    return that.insertData.call(that, index, data, callback);
                },
                deleteData: function (index, callback) {
                    //index：要删除的数据索引
                    //callback：删除后的回调，可在回调返回整个数组来修改
                    return that.deleteData.call(that, index, callback);
                },
                batchEdit: function (data, index, callback) {
                    //data：要批量修改的列数据，采用object{key:value}方式
                    //      key为键名，value为修改的值，也可以是回调function(rowData, index, allData)，以返回值来修改
                    //index：要修改的索引数组，默认修改全部
                    //callback：修改后的回调，可在回调返回整个数组来修改
                    return that.batchEdit.call(that, data, index, callback);
                },
                getCheckboxData: function () {
                    return that.getCheckboxData.call(that);
                },
                setCheckboxData: function (data, skip, clear) {
                    //data：要设置多选框的值数组，值为checkbox的value值
                    //skip：跳过点击事件
                    //clear：设置前也清除已经勾选的，默认清除
                    if (clear !== false) {
                        clear = true;
                    }
                    return that.setCheckboxData.call(that, data, skip, clear);
                },
                emptySort: function (field) {
                    //field：要清除排序的字段，默认全部
                    return that.emptySort.call(that, field);
                },
                on: function (e, handle) {
                    //e：要绑定的事件
                    //handle：处理函数
                    return that.on.call(that, e, handle);
                }
            }
        };

        //默认配置
        Class.prototype.config = {
            // id:'',
            tableClass:'',//组件下表格的额外的类名,string,也支持对象，{border:false,extend:''}
            url:'',//ajax请求地址
            method:'post',//ajax请求类型
            params:{},//ajax请求附加参数
            parseData:function(result, config){
                if (config.url !== '') {
                    //解析ajax接口返回格式
                    var data = {
                        data:result.data,
                        info:result.info,
                        status:result.status
                    };
                    if (config.page) {
                        data.data = result.data ? result.data.data : [];
                    }
                    return data;
                } else {
                    return result;
                }
            },
            statusSucceed: 10000,
            page:false,//是否分页,{field:传到后端分页的字段名,默认page,refresh:刷新按钮，默认true}
            limit:false,//分页条数,{
            // field:传到后端分页的字段名,默认limit,
            // value:条数，数字或者auto,根据列表高度确定,默认auto
            // tallest:当value为auto时,最高的条数限制,默认50
            // drive:sessionStorage/localStorage/function/once,默认once
            // get:function(),自定义获取函数
            // set:function(value),自定义设置函数
            // }
            parsePage:function(result, config){
                //解析ajax接口返回有关分页的信息
                if (!config.page) {
                    return {};
                }
                return {
                    current_page:parseInt(result.data.current_page),
                    from:parseInt(result.data.from),
                    to:parseInt(result.data.to),
                    per_page:parseInt(result.data.per_page),
                    last_page:parseInt(result.data.last_page),
                    total:parseInt(result.data.total)
                };
            },
            //字段选项
            fields:[
                //name:字段名
                //title:标题
                //detailTitle:详细的标题，将放在title属性中
                //type:
                //      normal,常规列，默认,不需要填
                //      checkbox,复选框,当name或value选项存在时，将做为input的value值,否则为该行data的索引键
                //      number,序号
                //      space,空
                //width:宽度，数字/百分比
                //minWidth:最小宽度，数字/百分比
                //maxWidth:最大宽度，数字/百分比
                //class:额外的class，string,支持回调，function(rowData, index, allData)
                //style:额外的style，string,支持回调，function(rowData, index, allData)
                //align:对齐，默认left
                //value:自定义，回调function(rowData, index, allData)
                //tool：通常是按钮组，回调function(rowData, index, allData)
                //hide:隐藏列
                //sort:true，或object{
                // type:local/post，local为默认
                // post:发送到后端字段名,默认order_by_[name]
                // init:asc/desc,默认排序
                // }
                //checkboxDisable:当type是checkbox时，控制checkbox是否为disable,回调function(rowData, index, allData)
                //click:点击单元格触发事件,true或string(事件名),默认触发事件名为cell-click-[name],也可自定义name的值
                //dblclick:双击单元格触发事件,true或string(事件名),默认触发事件名为cell-dblclick-[name],也可自定义name的值
                //columnExist:是否要渲染此列，回调function()，返回值为false时会忽略此列
                //radio:当type是checkbox时，控制checkbox是否为单选
            ],
            rowStyle: false,//行数据tr额外的style，string,支持回调，function(rowData, index, allData)
            rowClass: false,//行数据tr额外的class，string,支持回调，function(rowData, index, allData)
            rowClickCheckbox: false,//单击行tr时勾选/取消行的checkbox复选框(如果有的话)
            rowElemNoTriggerClick: ['.dropdown-toggle[data-toggle=dropdown]'],//设置单击行tr内某些元素，不触发行点击事件,array
            totalCheckboxFilter: null,//点击全选时，过滤每行的回调，用于控制全选时选中的行，function(rowData, index, allData)
            data:false,//静态数据,array
            toolbar: null,//工具栏,string,array,function()
            filter:false,//sessionStorage/localStorage/once/object:{drive:同外层,get:function(),set:function(fields),default:array}
            autoRefresh: false,//{interval:60000, checked:true}
            rowDrag: false,//true，或object{
            // trigger:tr，触发的行素，默认是tr
            // callback:移动后回调，function(newData,originData,newIndex,originIndex)
            //          回调可返回data(array)来改变data
            //          newData是移动后新数据，originData是移动前老数据，newIndex和originIndex是移动前后的数据索引
            // }
            dataChange: false,//当data因某些操作改变后的回调,function(type,newData,originData)
            // 回调可返回data(array)来改变data，执行顺序先于各自修改类型里的回调，返回数组优先级慢于各自类型里的回调
            // type代表引起此次改变的操作类型，目前有updateData,insertData,deleteData,batchEdit,rowDrag,reload
            // newData是改变后新数据，originData是改变前老数据
            height: 0,//number或full-差值
            fullHeight: $(window).height(),//差值计算使用的总高度，默认是当前窗口的高度
            minAutoHeight: 50,//自动高度时的最小高度，计算后若低于此高度就使用此高度
            maxFillHeight: 0,//当没有设置高度，表格随内容添加高度时，表格的最大高度，超过此高度将出现滚动条。number，或object{
            // value:设置的高度
            // control:是否可以自定义，默认是false
            // checked:默认行为，默认是true
            // drive:sessionStorage/localStorage/function/once,默认once
            // get:function(),自定义获取函数
            // set:function(value),自定义设置函数
            // }
            beforeRender: false,//渲染表格前的回调,function(elem,config)
            done: false,//渲染完表格的回调,function(data,page,rawData)
            nullText: '暂无数据',//没有数据自定义文本
            initNoLoad: false,//表格初始化时不加载渲染表体
            footerToolbarWidth: [4, 3, 5]//底部分页器和工具栏的栅格宽度
        };

        //表格渲染
        Class.prototype.render = function(init){
            var that = this;
            init = init || false;

            that.renderCount++;
            if (that.config.beforeRender && typeof that.config.beforeRender === 'function') {
                that.config.beforeRender(that.elem, that.config);
            }
            if (init) {
                $(that.elem).children().remove();
                that.renderPanel();
                that.renderFooter();

                //先后顺序不可改变
                that.filterGet.call(that);
                that.renderTableThead.call(that);
                that.setHeight.call(that);
                that.limitGet.call(that);
            }

            that.clear.call(that);
            that.getData.call(that);

            if (init) {
                that.event.call(that);
            }
        };

        //渲染表格表头
        Class.prototype.renderTableThead = function(){
            var that = this;

            that.sort = {all:{}, carry:{}};
            that.checkbox.exist = false;
            that.checkbox.isRadio = false;
            var fields = that.config.fields;
            var thead = '<thead><tr>';
            for (var i = 0; i < fields.length; i++) {
                var field = fields[i];
                if (field.type && field.type == 'checkbox') {
                    that.checkbox.exist = true;
                    if (field.radio) {
                        thead += '<th style="width: 20px;"></th>';
                        that.checkbox.isRadio = true;
                    } else {
                        thead += '<th style="width: 20px;"><input class="total-checkbox" type="checkbox"></th>';
                    }
                    continue;
                }
                else if (field.type && field.type == 'number') {
                    thead += '<th style="width: 35px;">#</th>';
                    continue;
                }
                else if (field.type && field.type == 'space') {
                    thead += '<th style="width: 30px;"></th>';
                    continue;
                } else if (!field.hide && field.name && that.filter && that.filter.fields && that.filter.fields.indexOf(field.name) < 0) {
                    continue;
                }
                var setStyle = '';
                if (field.width) {
                    if (field.width.toString().indexOf('%') > -1) {
                        setStyle += 'width:' + field.width + ';';
                    } else {
                        setStyle += 'width:' + field.width + 'px;';
                    }
                }
                if (field.maxWidth) {
                    if (field.maxWidth.toString().indexOf('%') > -1) {
                        setStyle += 'max-width:' + field.maxWidth + ';';
                    } else {
                        setStyle += 'max-width:' + field.maxWidth + 'px;';
                    }
                }
                if (field.minWidth) {
                    if (field.minWidth.toString().indexOf('%') > -1) {
                        setStyle += 'min-width:' + field.minWidth + ';';
                    } else {
                        setStyle += 'min-width:' + field.minWidth + 'px;';
                    }
                }
                var hide = '';
                if (field.hide) {
                    hide = ' hidden';
                }
                if (field.align) {
                    setStyle += 'text-align: ' + field.align + ';';
                } else {
                    setStyle += 'text-align: left;';
                }
                var title = field.title;
                if (field.sort) {
                    var sort = that.getConfigFieldSort.call(that, field.sort, field);
                    var ascClass = '';
                    var descClass = '';
                    if (sort.init === 'asc') {
                        ascClass = ' active';
                        that.sort.carry[field.name] = 'asc';
                    } else if (sort.init === 'desc') {
                        descClass = ' active';
                        that.sort.carry[field.name] = 'desc';
                    }
                    title += '<span class="field-sort">' +
                        '<i class="glyphicon glyphicon-triangle-top field-sort' + ascClass + '" title="升序" data-field="' + field.name + '" data-type="asc" style="top: -3px;"></i>' +
                        '<i class="glyphicon glyphicon-triangle-bottom field-sort' + descClass + '" title="降序" data-field="' + field.name + '" data-type="desc" style="top: 7px;"></i>' +
                        '</span>';
                    that.sort.all[field.name] = {};
                    that.sort.all[field.name].post = sort.type === 'post' ? sort.post : null;
                }
                thead += '<th class="' + hide + '" ' + ' title="' + (field.detailTitle ? field.detailTitle : field.title) + '" style="' + setStyle + '">' + title + '</th>';
            }
            thead += '</tr></thead>';
            thead += '<tbody></tbody>';
            $(that.elem).find('.main-table>table').children().remove();
            $(that.elem).find('.main-table>table').append(thead);
        };

        //获取数据
        Class.prototype.getData = function(){
            var that = this;

            if (that.config.url == '') {
                if ($.type(that.config.data) === 'array') {
                    var originData = that.objectDeepCopy(that.data);
                    var newData = that.config.parseData(that.objectDeepCopy(that.config.data), that.config);
                    var packData = that.dataChangePack.call(that, 'reload', null, newData, originData);
                    if ($.type(packData) === 'array') {
                        newData = packData;
                    }
                    that.data = newData;
                    that.rawData = that.config.data;
                    if (that.config.initNoLoad && that.renderCount === 1) {
                        return;
                    }
                    var dataPageParams = that.getDataPageParams.call(that);
                    that.renderTableTbody.call(that, that.data, dataPageParams);
                    that.renderFooterPage.call(that, that.page);
                    if (that.config.done && typeof that.config.done === 'function') {
                        that.config.done(that.objectDeepCopy(that.data), that.objectDeepCopy(that.page), that.objectDeepCopy(that.rawData));
                    }
                    return;
                }
                throw '必须指定ajax获取数据或使用静态数据';
            }

            if (that.config.initNoLoad && that.renderCount === 1) {
                return;
            }
            //不需要请求ajax接口,使用现有数据重新渲染
            if (that.localReload) {
                that.localReload = false;
                if (that.data && that.data.length > 0) {
                    that.renderTableTbody.call(that, that.data);
                    if (that.config.done && typeof that.config.done === 'function') {
                        that.config.done(that.objectDeepCopy(that.data), that.objectDeepCopy(that.page), that.objectDeepCopy(that.rawData));
                    }
                    return;
                }
            }

            $.ajax({
                type: that.config.method,
                data: that.getAjaxParams.call(that),
                url: that.config.url,
                beforeSend: function (request) {
                    that.msg('加载中');
                },
                success: function (res) {
                    that.rawData = res;
                    var result = that.config.parseData(res, that.config);

                    var succeed = that.config.statusSucceed;
                    if (typeof succeed == 'number' || typeof succeed == 'string') {
                        succeed = [succeed];
                    }
                    if (succeed.indexOf(result.status) == -1) {
                        that.msg(result.info);
                        return;
                    }
                    if (result.data.length == 0) {
                        that.data = [];
                        that.msg(that.config.nullText);
                    } else {
                        that.data = result.data;
                        var pageData = that.config.parsePage(res, that.config);

                        that.renderTableTbody.call(that, that.data);
                        that.renderFooterPage.call(that, pageData);
                    }
                    if (that.config.done && typeof that.config.done === 'function') {
                        that.config.done(that.objectDeepCopy(that.data), that.objectDeepCopy(that.page), that.objectDeepCopy(that.rawData));
                    }
                }
            });
        };

        //获取ajax请求参数
        Class.prototype.getAjaxParams = function(){
            var that = this;

            var params = $.extend({}, that.config.params);

            //排序
            if (that.sort && that.sort.all) {
                for (var key in that.sort.all) {
                    if (!that.sort.carry[key]) {
                        delete params[that.sort.all[key].post];
                    } else if (that.sort.all[key].post !== null) {
                        params[that.sort.all[key].post] = that.sort.carry[key];
                    }
                }
            }

            //分页
            if (that.config.page) {
                that.page = {};
                if (that.config.limit) {
                    var limitConfig = that.getConfigLimit.call(that, that.config.limit);
                    if (that.limit && that.limit.value) {
                        params[limitConfig.field] = that.limit.value;
                    }
                }
                var pageConfig = that.getConfigPage.call(that, that.config.page);
                var page = params[pageConfig.field];
                if (!page) {
                    params[pageConfig.field] = 1;
                    page = 1;
                } else {
                    delete that.config.params[pageConfig.field];
                }
                that.page.current_page = page;
            }

            return params;
        };

        //获取静态数据分页信息
        Class.prototype.getDataPageParams = function () {
            var that = this;

            var params = $.extend({}, that.config.params);

            if (!that.config.page) {
                return;
            }

            if (!that.limit || !that.limit.value) {
                throw "静态数据分页必须指定分页条数";
            }

            that.page = {
                per_page: that.limit.value,
                current_page: 0,
                total: that.data.length
            };

            var pageConfig = that.getConfigPage.call(that, that.config.page);
            var page = params[pageConfig.field];
            if (!page) {
                page = 1;
            }
            that.page.current_page = page;
            that.page.from = that.page.per_page * (that.page.current_page - 1) + 1;
            that.page.to = that.page.per_page * that.page.current_page;
            that.page.last_page = Math.ceil(that.page.total / that.page.per_page);

            return {
                from: (that.page.from - 1),
                to: (that.page.to - 1)
            };
        };

        //渲染表格表体
        Class.prototype.renderTableTbody = function (data, fragments) {
            var that = this;

            fragments = fragments || {from: 0, to: data.length - 1};
            that.sortData.call(that, data);

            var fields = that.config.fields;
            var tbody = '';
            var isFirstRow = true;
            for (var j = fragments.from; j <= fragments.to; j++) {
                var item = data[j];
                if (item === undefined) {
                    break;
                }
                var setClass = '';
                if (that.config.rowClass) {
                    if (typeof that.config.rowClass === 'string') {
                        setClass = that.config.rowClass;
                    } else if (typeof that.config.rowClass === 'function') {
                        setClass = that.config.rowClass(that.objectDeepCopy(item), j, that.objectDeepCopy(data));
                    }
                }
                var setStyle = '';
                if (that.config.rowStyle) {
                    if (typeof that.config.rowStyle === 'string') {
                        setStyle = that.config.rowStyle;
                    } else if (typeof that.config.rowStyle === 'function') {
                        setStyle = that.config.rowStyle(that.objectDeepCopy(item), j, that.objectDeepCopy(data));
                    }
                }
                tbody += '<tr data-index="' + j + '" class="' + setClass + '" style="' + setStyle + '">';
                for (var i = 0; i < fields.length; i++) {
                    var field = fields[i];
                    if (field.type && field.type == 'checkbox') {
                        var value = 'value="' + j + '"';
                        if (field.value && typeof field.value === 'function') {
                            value = 'value="' + field.value(that.objectDeepCopy(item), j, that.objectDeepCopy(data)) + '"';
                        }
                        else if (field.name) {
                            value = 'value="' + item[field.name] + '"';
                        }
                        var disabled = '';
                        if (field.checkboxDisable && typeof field.checkboxDisable === 'function' && field.checkboxDisable(that.objectDeepCopy(item), j, that.objectDeepCopy(data))) {
                            disabled = 'disabled';
                        }
                        tbody += '<td style="width: 20px;"><input class="row-checkbox" type="checkbox" data-index="' + j + '" ' + value + disabled + '></td>';
                        continue;
                    }
                    else if (field.type && field.type == 'number') {
                        tbody += '<td style="width: 35px;" title="' + (j + 1) + '">' + (j + 1) + '</td>';
                        continue;
                    }
                    else if (field.type && field.type == 'space') {
                        tbody += '<td style="width: 30px;"></td>';
                        continue;
                    } else if (!field.hide && field.name && that.filter && that.filter.fields && that.filter.fields.indexOf(field.name) < 0) {
                        continue;
                    } else if (field.columnExist && typeof field.columnExist === 'function' && !field.columnExist()) {
                        if (isFirstRow) {
                            that.elem.find('.main-table table thead th[title=' + (field.detailTitle ? field.detailTitle : field.title) + ']').remove();
                        }
                        continue;
                    }
                    setStyle = '';
                    if (field.width) {
                        if (field.width.toString().indexOf('%') > -1) {
                            setStyle += 'width:' + field.width + ';';
                        } else {
                            setStyle += 'width:' + field.width + 'px;';
                        }
                    }
                    if (field.maxWidth) {
                        if (field.maxWidth.toString().indexOf('%') > -1) {
                            setStyle += 'max-width:' + field.maxWidth + ';';
                        } else {
                            setStyle += 'max-width:' + field.maxWidth + 'px;';
                        }
                    }
                    if (field.minWidth) {
                        if (field.minWidth.toString().indexOf('%') > -1) {
                            setStyle += 'min-width:' + field.minWidth + ';';
                        } else {
                            setStyle += 'min-width:' + field.minWidth + 'px;';
                        }
                    }
                    setClass = '';
                    if (field.hide) {
                        setClass += 'hidden ';
                    }
                    if (field.class) {
                        if (typeof field.class === 'string') {
                            setClass += field.class;
                        }
                        else if (typeof field.class === 'function') {
                            setClass += field.class(that.objectDeepCopy(item), j, that.objectDeepCopy(data));
                        }
                    }
                    if (field.align) {
                        setStyle += 'text-align: ' + field.align + ';';
                    } else {
                        setStyle += 'text-align: left;';
                    }
                    if (field.style) {
                        if (typeof field.style === 'string') {
                            setStyle += field.style;
                        }
                        else if (typeof field.style === 'function') {
                            setStyle += field.style(that.objectDeepCopy(item), j, that.objectDeepCopy(data));
                        }
                    }
                    var value = '';
                    var title = '';
                    var showField = '';
                    if (field.value && typeof field.value === 'function') {
                        value = field.value(that.objectDeepCopy(item), j, that.objectDeepCopy(data));
                        title = value.toString().replace(/<[\s\S]*>/g, "");
                        if (field.name) {
                            showField = field.name;
                        }
                    }
                    else if (field.tool && typeof field.tool === 'function') {
                        value = field.tool(that.objectDeepCopy(item), j, that.objectDeepCopy(data));
                        setClass = 'tool ' + setClass;//tool类放在最前
                    }
                    else {
                        value = item[field.name];
                        title = value;
                        showField = field.name;
                    }
                    var attributes = '';
                    if (field.click) {
                        attributes += 'data-click-event="cell-click-' + (field.click === true ? field.name : field.click) + '" ';
                    }
                    if (field.dblclick) {
                        attributes += 'data-dblclick-event="cell-dblclick-' + (field.dblclick === true ? field.name : field.dblclick) + '" ';
                    }

                    tbody += '<td data-field="' + showField + '" class="' + setClass + '" ' + attributes + ' title="' + title + '" style="' + setStyle + '">' + value + '</td>';
                }
                tbody += '</tr>';
                isFirstRow = false;
            }
            //清除表体
            $(that.elem).find('.main-table>table tbody').children().remove();
            $(that.elem).find('.main-table>table tbody').append(tbody);
        };

        //渲染脚部
        Class.prototype.renderFooter = function () {
            var that = this;

            if (that.config.toolbar === null && !that.config.page) {
                return;
            }

            var refreshButton = '';
            if (that.config.page) {
                var pageConfig = that.getConfigPage.call(that, that.config.page);
                if (pageConfig.refresh) {
                    refreshButton = '<button type="button" class="btn btn-link refresh" title="刷新当前页面"><span class="glyphicon glyphicon-refresh"></span></button>';
                }
            }

            var defaultButton = that.renderToolbarDefaultButton();
            var customButton = that.renderToolbarCustomButton();

            var footer = '<div class="row">' +
                '<div class="col-xs-' + that.config.footerToolbarWidth[0] + ' toolbar">' +
                '<div class="btn-group btn-group-sm">' +
                refreshButton +
                defaultButton +
                customButton +
                '</div>' +
                '</div>' +
                '<div class="col-xs-' + that.config.footerToolbarWidth[1] + ' page-btn"></div>' +
                '<div class="col-xs-' + that.config.footerToolbarWidth[2] + ' page-info"></div>' +
                '</div>';

            $(that.elem).find('.footer').append(footer);
        };

        //渲染预设工具栏按钮
        Class.prototype.renderToolbarDefaultButton = function () {
            var that = this;

            var config;
            var button = '';
            if (that.config.autoRefresh) {
                button += '<button type="button" class="btn btn-link auto_refresh" title="自动刷新"><span class="glyphicon glyphicon-time"></span></button>';
            }
            if (that.config.filter) {
                button += '<button type="button" class="btn btn-link filter" title="自定义列表字段"><span class="glyphicon glyphicon-list-alt"></span></button>';
            }
            config = that.getConfigMaxFillHeight.call(that, that.config.maxFillHeight);
            if (that.config.height === 0 && config.control) {
                button += '<button type="button" class="btn btn-link max_fill_height" title="表格最大高度"><span class="glyphicon glyphicon-resize-vertical"></span></button>';
            }
            return button;
        };

        //渲染自定义工具栏按钮
        Class.prototype.renderToolbarCustomButton = function () {
            var that = this;
            var button = '';

            if (that.config.toolbar === null) {
                return '';
            } else if (typeof that.config.toolbar === 'string') {
                button = that.config.toolbar;
            } else if (typeof that.config.toolbar === 'function') {
                button = that.config.toolbar();
            } else if ($.type(that.config.toolbar) === 'array') {
                var tool = that.config.toolbar;
                for (var i = 0; i < tool.length; i++) {
                    if (typeof tool[i] === 'string') {
                        button += tool[i];
                    } else if ($.isPlainObject(tool[i]) && tool[i].value) {
                        var value = tool[i].value;
                        if (tool[i].noCheckHide) {
                            value = $(value).addClass('no-check-hide').addClass('hidden').prop('outerHTML');
                        }
                        button += value;
                    }
                }
            }
            return button;
        };

        //渲染分页器
        Class.prototype.renderFooterPage = function(data){
            var that = this;

            $(that.elem).find('.footer .page-btn').children().remove();
            $(that.elem).find('.footer .page-info').children().remove();

            if (!that.config.page) {
                return;
            }

            if (!data.current_page || !data.per_page || (!data.total && data.total !== 0)) {
                throw '解析接口分页信息错误';
            }
            if (!data.from) {
                data.from = data.per_page * (data.current_page - 1) + 1;
            }
            if (!data.to) {
                data.to = data.per_page * data.current_page;
            }
            if (!data.last_page) {
                data.last_page = Math.ceil(data.total / data.per_page);
            }
            that.page = data;
            var setLimit = '';
            if (that.config.limit) {
                var limitConfig = that.getConfigLimit.call(that, that.config.limit);
                setLimit = '<span>每页 ' +
                    '<input class="limit" type="number" max="' + limitConfig.tallest + '" min="1" value="' + data.per_page + '">' +
                    ' 条 | </span>';
            }
            var backwardDisabled = '';
            var forwardDisabled = '';
            if (data.current_page === 1) {
                backwardDisabled = 'disabled';
            }
            if (data.current_page === data.last_page) {
                forwardDisabled = 'disabled';
            }
            var pageBtn = '<button type="button" class="btn btn-link" data-page="1" ' + backwardDisabled + '><span class="glyphicon glyphicon-fast-backward"></span></button>' +
                '<button type="button" class="btn btn-link" data-page="' + (data.current_page-1) + '" ' + backwardDisabled + '><span class="glyphicon glyphicon-backward"></span></button>' +
                '<span> ' + data.current_page + ' / ' + data.last_page + ' </span>' +
                '<button type="button" class="btn btn-link" data-page="' + (data.current_page+1) + '" ' + forwardDisabled + '><span class="glyphicon glyphicon-forward"></span></button>' +
                '<button type="button" class="btn btn-link" data-page="' + (data.last_page) + '" ' + forwardDisabled + '><span class="glyphicon glyphicon-fast-forward"></span></button>';
            var pageInfo = setLimit +
                '<span>从' + data.from + '到' + data.to + '，共' + data.total + '条 | 跳转第 ' +
                '<input class="skip" type="number" max="' + data.last_page + '" min="1">' +
                ' 页</span>';

            $(that.elem).find('.footer .page-btn').append(pageBtn);
            $(that.elem).find('.footer .page-info').append(pageInfo);
        };

        //渲染主容器
        Class.prototype.renderPanel = function(){
            var that = this;

            var tableClassConfig = that.getConfigTableClass.call(that, that.config.tableClass);
            var tableClass = '';
            if (tableClassConfig.border) {
                tableClass += ' table-bordered';
            }
            if (tableClassConfig.extend) {
                tableClass += ' ' + tableClassConfig.extend;
            }
            $(that.elem).append('<div class="panel render-table">' +
                '<div class="panel-body">' +
                '<div class="main-table">' +
                '<table class="table table-hover table-condensed' + tableClass + '"></table>' +
                '</div>' +
                '<div class="clearfix"></div>' +
                '<div class="footer"></div>' +
                '</div>');
        };

        //获取过滤显示字段
        Class.prototype.filterGet = function(){
            var that = this;

            if (!that.config.filter) {
                that.filter = false;
                return;
            }

            var config = that.config.filter;
            if (typeof config === 'string') {
                config = {drive:config};
            }

            var fields;
            var key = that.elem.selector + ':filter';
            if (config.drive === 'sessionStorage') {
                fields = that.getStorageData(sessionStorage, key);
                fields = fields ? fields : null;
            }
            else if (config.drive === 'localStorage') {
                fields = that.getStorageData(localStorage, key);
                fields = fields ? fields : null;
            }
            else if (typeof config.get === 'function') {
                fields = config.get();
                fields = fields ? fields : null;
            }
            else if (config.drive === 'once') {
                fields = null;
                if (that.filter && that.filter.fields) {
                    fields = that.filter.fields;
                }
            } else {
                throw "字段过滤功能设置有误";
            }

            if (!fields && config.default && $.type(config.default) === 'array') {
                fields = config.default;
            }
            if (!that.filter) {
                that.filter = {};
            }
            that.filter.fields = fields;
        };

        //排序数据，字段前端排序
        Class.prototype.sortData = function(data){
            var that = this;

            for (var key in that.sort.all) {
                if (!that.sort.carry[key]) {
                    continue;
                }
                if (that.sort.all[key].post !== null) {
                    continue;
                }

                data.sort(function (v1, v2) {
                    if (v1[key] === v2[key]) {
                        return 0;
                    }
                    v1 = v1[key] ? v1[key] : '';
                    v2 = v2[key] ? v2[key] : '';
                    if (that.sort.carry[key] === 'asc') {
                        return v1 > v2 ? 1 : -1
                    } else {
                        return v1 > v2 ? -1 : 1
                    }
                });
            }

            return data;
        };

        //清除当前激活的排序字段
        Class.prototype.emptySort = function(field){
            var that = this;
            field = field || null;

            if (that.sort) {
                if (field === null) {
                    that.sort.carry = {};
                } else if ($.type(field) === 'array') {
                    for (var i = 0; i < field.length; i++) {
                        delete that.sort.carry[field[i]];
                    }
                } else {
                    delete that.sort.carry[field];
                }
            }

            return true;
        };

        //计算设置表格tbody高度
        Class.prototype.setHeight = function(){
            var that = this;

            if (that.config.height === 0 || that.height.value !== undefined) {
                var config = that.getConfigMaxFillHeight.call(that, that.config.maxFillHeight);
                if (that.config.height === 0 && that.height.value === undefined && config.value && config.checked) {
                    $(that.elem).find('.main-table>table tbody').css('max-height', config.value + 'px');
                }
                return;
            }
            var height = 0;
            var isAuto = false;
            if (/^full-\d+$/.test(that.config.height)) {
                height = that.config.fullHeight - that.config.height.split('-')[1];
                isAuto = true;
            } else {
                height = that.config.height;
            }

            if (height) {
                //容器margin,padding
                height = height - parseInt($(that.elem).find('.panel').css('margin-top'));
                height = height - parseInt($(that.elem).find('.panel').css('margin-bottom'));
                height = height - parseInt($(that.elem).find('.panel').css('padding-top'));
                height = height - parseInt($(that.elem).find('.panel').css('padding-bottom'));
                height = height - parseInt($(that.elem).find('.panel-body').css('margin-top'));
                height = height - parseInt($(that.elem).find('.panel-body').css('margin-bottom'));
                height = height - parseInt($(that.elem).find('.panel-body').css('padding-top'));
                height = height - parseInt($(that.elem).find('.panel-body').css('padding-bottom'));
                //table thead
                height = height - parseInt($(that.elem).find('table thead').outerHeight(true));
                //clearfix
                height = height - parseInt($(that.elem).find('.clearfix').outerHeight(true));
                //footer
                height = height - parseInt($(that.elem).find('.footer').outerHeight(true));
                //todo
                height = height - 5;
            }

            if (isAuto && height < that.config.minAutoHeight) {
                height = that.config.minAutoHeight;
            }

            that.height.value = height;
            if (height) {
                $(that.elem).find('.main-table>table tbody').css('height', height + 'px');
            }
        };

        //获取每页条数
        Class.prototype.limitGet = function(){
            var that = this;

            if (!that.config.limit) {
                that.limit = false;
                return;
            }

            var config = that.getConfigLimit.call(that, that.config.limit);

            if (config.drive === null) {
                that.limit = {value:config.value};
                return;
            }

            var limit = null;
            var key = that.elem.selector + ':limit';
            if (config.drive === 'sessionStorage') {
                limit = that.getStorageData(sessionStorage, key, null, false);
                limit = limit ? limit : null;
            }
            else if (config.drive === 'localStorage') {
                limit = that.getStorageData(localStorage, key, null, false);
                limit = limit ? limit : null;
            }
            else if (typeof config.get === 'function') {
                limit = config.get();
                limit = limit ? limit : null;
            }
            else if (config.drive === 'once') {
                limit = null;
                if (that.limit && that.limit.value) {
                    limit = that.limit.value;
                }
            } else {
                throw "页面条数功能设置有误";
            }

            if (!limit) {
                that.limit = {value:config.value};
                return;
            }
            if (!that.limit) {
                that.limit = {};
            }
            that.limit.value = limit;
        };

        //注册事件
        Class.prototype.event = function(){
            var that = this;

            if (that.config.page) {
                that.pageEvent.call(that);
                that.setLimitEvent.call(that);
            }
            that.toolEvent.call(that);
            that.baseEvent.call(that);
            that.toolbarEvent.call(that);
            that.rowDragEvent.call(that);
        };

        //行工具栏
        Class.prototype.toolEvent = function () {
            var that = this;

            $(that.elem).find('.main-table>table tbody').on('click', '.tool [data-event]', function (e) {
                if (!that.data || !that.data.length) {
                    return;
                }
                var event = $(this).attr('data-event');
                if (!event) {
                    return;
                }
                var elem = $(this).closest('tr');
                var index = parseInt(elem.attr('data-index'));

                var params = {};
                params.data = that.objectDeepCopy(that.data[index]);
                params.tr = elem;
                params.button = $(this);
                params.index = index;

                $(that.elem).trigger('tool-' + event, params);
                e.stopPropagation();
            });
        };

        //自身工具栏
        Class.prototype.baseEvent = function () {
            var that = this;

            that.baseCheckboxEvent.call(that);
            that.baseSortEvent.call(that);
            that.baseRowClickEvent.call(that);
        };

        //多选框事件
        Class.prototype.baseCheckboxEvent = function(){
            var that = this;

            $(that.elem).find('.main-table>table thead').on('click', 'input.total-checkbox', function (e) {
                var check = false;
                if ($(this).prop('checked')) {
                    check = true;
                }

                if (check && that.config.totalCheckboxFilter && typeof that.config.totalCheckboxFilter === 'function') {
                    $(that.elem).find('.main-table>table tbody tr').each(function () {
                        var index = parseInt($(this).attr('data-index'));
                        var data = that.data[index];

                        if (that.config.totalCheckboxFilter(that.objectDeepCopy(data), index, that.objectDeepCopy(that.data))) {
                            $(this).find('input.row-checkbox:not([disabled])').prop('checked', check);
                        }
                    });
                } else {
                    $(that.elem).find('.main-table>table tbody input.row-checkbox:not([disabled])').prop('checked', check);
                }

                var data = {data:[], index:[], value:[]};
                $(that.elem).find('.main-table>table tbody input.row-checkbox').each(function (k, v) {
                    if (!$(v).prop('checked')) {
                        return true;
                    }
                    var index = parseInt($(v).attr('data-index'));
                    data.value.push($(v).val());
                    data.index.push(index);
                    data.data.push(that.data[index]);
                });
                that.checkbox.data = data;
                data.current = null;

                $(that.elem).trigger('click-checkbox', data);
                e.stopPropagation();
            });

            $(that.elem).find('.main-table>table tbody').on('click', 'input.row-checkbox', function (e, skip) {
                var check = false;
                if ($(this).prop('checked')) {
                    check = true;
                }

                if (that.checkbox.isRadio) {
                    $(that.elem).find('.main-table>table tbody input.row-checkbox').prop('checked', false);
                    if (check) {
                        $(this).prop('checked', true);
                    }
                }

                var data = {data: [], index: [], value: []};
                $(that.elem).find('.main-table>table tbody input.row-checkbox').each(function (k, v) {
                    if (!$(v).prop('checked')) {
                        return true;
                    }
                    var index = parseInt($(v).attr('data-index'));
                    data.value.push($(v).val());
                    data.index.push(index);
                    data.data.push(that.data[index]);
                });
                that.checkbox.data = data;
                data.current = {check: check};
                data.current.checkbox = $(this);
                data.current.tr = $(this).closest('tr');
                data.current.value = $(this).val();
                data.current.index = parseInt($(this).attr('data-index'));
                data.current.data = that.data[data.current.index];

                if (!skip) {
                    $(that.elem).trigger('click-checkbox', data);
                }
                e.stopPropagation();
            });

            $(that.elem).on('click-checkbox', function (e, data) {
                //工具栏按钮显示/隐藏
                if (data.data.length) {
                    $(that.elem).find('.toolbar .no-check-hide').removeClass('hidden');
                } else {
                    $(that.elem).find('.toolbar .no-check-hide').addClass('hidden');
                }
                //选中行背景色
                if (data.current && data.current.check) {
                    if (that.checkbox.isRadio) {
                        $(that.elem).find('.main-table>table tbody tr').removeClass('selected');
                    }
                    data.current.tr.addClass('selected');
                } else if (data.current && !data.current.check) {
                    data.current.tr.removeClass('selected');
                } else {
                    $(that.elem).find('.main-table>table tbody tr').removeClass('selected');
                    for (var i = 0; i < data.index.length; i++) {
                        $(that.elem).find('.main-table>table tbody tr[data-index=' + data.index[i] + ']').addClass('selected');
                    }
                }
            });
        };

        //字段排序事件
        Class.prototype.baseSortEvent = function(){
            var that = this;

            if (!that.sort || !that.sort.all || !Object.keys(that.sort.all).length) {
                return;
            }

            $(that.elem).find('.main-table>table thead').on('click', 'i.field-sort', function (e) {
                var active = false;
                if ($(this).hasClass('active')) {
                    active = true;
                }
                var field = $(this).attr('data-field');
                var isLocal = that.sort.all[field].post === null;

                if (active) {
                    $(this).removeClass('active');
                    delete that.sort.carry[field];
                } else {
                    var type = $(this).attr('data-type');
                    $(this).siblings().removeClass('active');
                    $(this).addClass('active');
                    that.sort.carry[field] = type;
                }
                if (isLocal) {
                    that.localReload = true;
                }
                that.reload({}, isLocal);
                e.stopPropagation();
            });
        };

        //行点击事件
        Class.prototype.baseRowClickEvent = function () {
            var that = this;

            $(that.elem).find('.main-table>table tbody').on('click', 'td', function (e) {
                if (!that.data || !that.data.length) {
                    return;
                }

                var isRowElemNoTriggerClick = false;
                $.each(that.config.rowElemNoTriggerClick, function (k, v) {
                    if ($(e.target).is(v)) {
                        isRowElemNoTriggerClick = true;
                        return false;
                    }
                });
                if (isRowElemNoTriggerClick) {
                    return;
                }

                var elem = $(this);
                var params = {};
                params.tr = elem.closest('tr');
                params.index = parseInt(params.tr.attr('data-index'));
                params.data = that.data[params.index];

                //触发单元格点击事件
                var clickEvent = elem.attr('data-click-event');
                if (clickEvent) {
                    var cellParams = {};
                    cellParams.tr = params.tr;
                    cellParams.index = params.index;
                    cellParams.data = params.data;
                    cellParams.field = elem.attr('data-field');
                    cellParams.value = null;
                    if (cellParams.data[cellParams.field] !== undefined) {
                        cellParams.value = cellParams.data[cellParams.field];
                    }
                    $(that.elem).trigger(clickEvent, cellParams);
                }

                $(that.elem).trigger('row-click', params);
            });

            $(that.elem).find('.main-table>table tbody').on('dblclick', 'td', function (e) {
                if (!that.data || !that.data.length) {
                    return;
                }

                var isRowElemNoTriggerClick = false;
                $.each(that.config.rowElemNoTriggerClick, function (k, v) {
                    if ($(e.target).is(v)) {
                        isRowElemNoTriggerClick = true;
                        return false;
                    }
                });
                if (isRowElemNoTriggerClick) {
                    return;
                }

                var elem = $(this);
                var params = {};
                params.tr = elem.closest('tr');
                params.index = parseInt(params.tr.attr('data-index'));
                params.data = that.data[params.index];

                //触发单元格双击事件
                var dblclickEvent = elem.attr('data-dblclick-event');
                if (dblclickEvent) {
                    var cellParams = {};
                    cellParams.tr = params.tr;
                    cellParams.index = params.index;
                    cellParams.data = params.data;
                    cellParams.field = elem.attr('data-field');
                    cellParams.value = null;
                    if (cellParams.data[cellParams.field] !== undefined) {
                        cellParams.value = cellParams.data[cellParams.field];
                    }
                    $(that.elem).trigger(dblclickEvent, cellParams);
                }

                $(that.elem).trigger('row-dblclick', params);
            });

            $(that.elem).on('row-click', function (e, params) {
                if (that.config.rowClickCheckbox) {
                    params.tr.find('input.row-checkbox').click();
                }
                if (!that.checkbox.exist || !that.config.rowClickCheckbox) {
                    params.tr.addClass('selected').siblings('tr').removeClass('selected');
                }
            });

        };

        //工具栏
        Class.prototype.toolbarEvent = function () {
            var that = this;

            $(that.elem).find('.toolbar').on('click', '[data-event]', function (e) {
                var event = $(this).attr('data-event');
                if (!event) {
                    return;
                }

                var params = {};
                params.button = $(this);
                params.checkboxData = that.getCheckboxData.call(that);

                $(that.elem).trigger('toolbar-' + event, params);
                e.stopPropagation();
            });

            that.toolbarAutoRefreshEvent.call(that);
            that.toolbarFilterSetEvent.call(that);
            that.toolbarMaxFillHeightEvent.call(that);
        };

        //自动刷新
        Class.prototype.toolbarAutoRefreshEvent = function () {
            var that = this;

            if (!that.config.autoRefresh) {
                return;
            }

            that.autoRefresh = that.getConfigAutoRefresh.call(that, that.config.autoRefresh);

            $(that.elem).find('.toolbar button.auto_refresh').popover({
                html: true,
                placement: 'auto top',
                trigger: 'manual'
            });

            //注册自动刷新操作
            var autoRefreshFunction = function () {
                that.autoRefresh.intervalFlag = setInterval(function () {
                    var params = $.extend({}, that.config.params);
                    if (that.config.page) {
                        var pageConfig = that.getConfigPage.call(that, that.config.page);
                        params[pageConfig.field] = that.page.current_page;
                    }

                    that.reload({params: params});
                }, that.autoRefresh.interval);
            };

            if (that.autoRefresh.checked) {
                autoRefreshFunction();
            }

            //手动切换弹出框显示/隐藏
            $(that.elem).find('.toolbar button.auto_refresh').on('click', function (e) {
                //根据当前打勾状态，动态更改勾选框的勾选状态
                var content = '';
                if (that.autoRefresh.checked) {
                    content = '<label style="white-space:nowrap;"><input class="auto_refresh_switch" type="checkbox" checked> 列表自动刷新</label>'
                } else {
                    content = '<label style="white-space:nowrap;"><input class="auto_refresh_switch" type="checkbox"> 列表自动刷新</label>'
                }
                $(this).attr('data-content', content);
                $(this).popover('toggle');
                e.stopPropagation();
            });

            $(that.elem).find('.toolbar').on('click', 'input.auto_refresh_switch', function (e) {
                var checked = $(this).prop('checked');

                if (!that.config.autoRefresh) {
                    return;
                }

                if (checked) {
                    that.autoRefresh.checked = true;
                    autoRefreshFunction();
                } else {
                    that.autoRefresh.checked = false;
                    clearInterval(that.autoRefresh.intervalFlag);
                }
                e.stopPropagation();
            });
        };

        //设置过滤字段
        Class.prototype.toolbarFilterSetEvent = function () {
            var that = this;

            if (!that.config.filter || !that.filter) {
                return;
            }

            var config = that.config.filter;
            if (typeof config === 'string') {
                config = {drive: config};
            }

            if (!that.filter.modalId) {
                that.filter.modalId = 'renderTableFilter-' + that.elem.selector.replace(/[^a-zA-Z0-9]/g, '') + '-' + that.randomString();
            }

            $(that.elem).find('.toolbar button.filter').on('click', function (e) {
                if ($('.modal#' + that.filter.modalId).length < 1) {
                    var input = '';
                    var j = 0;
                    that.filter.allFields = [];
                    var fields = that.config.fields;
                    for (var i = 0; i < fields.length; i++) {
                        var field = fields[i];
                        if ((field.type && field.type !== 'normal') || field.hide || field.tool || !field.name) {
                            continue;
                        }
                        if ((j + 1) % 4 === 1) {
                            input += '<div class="row">';
                        }
                        input += '<div class="col-xs-3"><label><input type="checkbox" value="' + field.name + '"> ' + field.title + '</label></div>';
                        if ((j + 1) % 4 === 0) {
                            input += '</div>';
                        }
                        that.filter.allFields.push(field.name);
                        j++;
                    }
                    if (j % 4 !== 0) {
                        input += '</div>';
                    }

                    $('body').append('<div class="modal fade" id="' + that.filter.modalId + '" tabindex="-1" role="dialog" aria-hidden="true" data-backdrop="static">' +
                        '<div class="modal-dialog">' +
                        '<div class="modal-content">' +
                        '<div class="modal-header">' +
                        '<h4 class="modal-title">设置显示字段</h4>' +
                        '</div>' +
                        '<div class="modal-body">' + input + '</div>' +
                        '<div class="modal-footer">' +
                        '<button type="button" class="btn btn-success submit">提交</button>' +
                        '<button type="button" class="btn btn-default" data-dismiss="modal">关闭</button>' +
                        '</div>' +
                        '</div>' +
                        '</div>' +
                        '</div>'
                    );
                }
                var modal = $('.modal#' + that.filter.modalId);
                modal.find('.modal-body input').prop('checked', false);
                if (that.filter.fields) {
                    for (var z = 0; z < that.filter.fields.length; z++) {
                        modal.find('.modal-body input[value=' + that.filter.fields[z] + ']').prop('checked', true);
                    }
                } else if (config.default) {
                    for (var z = 0; z < config.default.length; z++) {
                        modal.find('.modal-body input[value=' + config.default[z] + ']').prop('checked', true);
                    }
                } else {
                    modal.find('.modal-body input').prop('checked', true);
                }
                modal.modal('show');
                e.stopPropagation();
            });

            $('body').on('click', '.modal#' + that.filter.modalId + ' .submit', function (e) {
                var modal = $('.modal#' + that.filter.modalId);
                var fields = [];
                modal.find('.modal-body input').each(function (k, item) {
                    if ($(item).prop('checked')) {
                        fields.push($(item).val());
                    }
                });

                var key = that.elem.selector + ':filter';
                var result = false;
                if (config.drive === 'sessionStorage') {
                    result = that.setStorageData(sessionStorage, key, fields);
                } else if (config.drive === 'localStorage') {
                    result = that.setStorageData(localStorage, key, fields);
                } else if (typeof config.set === 'function') {
                    result = config.set(fields);
                } else if (config.drive === 'once') {
                    that.filter.fields = fields;
                    result = true;
                } else {
                    throw "字段过滤功能设置有误";
                }

                modal.modal('hide');

                if (!result) {
                    console.error('字段过滤功能更新字段：' + result.toString());
                    return;
                }

                that.filterGet.call(that);
                that.renderTableThead.call(that);
                that.reload();
                e.stopPropagation();
            });
        };

        //列表最大高度控制
        Class.prototype.toolbarMaxFillHeightEvent = function () {
            var that = this;

            if (that.config.height) {
                return;
            }

            var config = that.getConfigMaxFillHeight.call(that, that.config.maxFillHeight);
            if (!config.value || !config.control) {
                return;
            }

            $(that.elem).find('.toolbar button.max_fill_height').popover({
                html: true,
                placement: 'auto top',
                trigger: 'manual'
            });

            //手动切换弹出框显示/隐藏
            $(that.elem).find('.toolbar button.max_fill_height').on('click', function (e) {
                //根据当前打勾状态，动态更改勾选框的勾选状态
                var config = that.getConfigMaxFillHeight.call(that, that.config.maxFillHeight);
                var content = '';
                if (config.checked) {
                    content = '<label style="white-space:nowrap;"><input class="max_fill_height_switch" type="checkbox" checked> 限制表格高度</label>'
                } else {
                    content = '<label style="white-space:nowrap;"><input class="max_fill_height_switch" type="checkbox"> 限制表格高度</label>'
                }
                $(this).attr('data-content', content);
                $(this).popover('toggle');
                e.stopPropagation();
            });

            $(that.elem).find('.toolbar').on('click', 'input.max_fill_height_switch', function (e) {
                var checked = $(this).prop('checked');

                if (that.config.height || !config.value || !config.control) {
                    return;
                }

                var result = false;
                var key = that.elem.selector + ':maxFillHeight';
                if (config.drive === 'sessionStorage') {
                    result = that.setStorageData(sessionStorage, key, (checked ? 1 : 0));
                }
                else if (config.drive === 'localStorage') {
                    result = that.setStorageData(localStorage, key, (checked ? 1 : 0));
                }
                else if (typeof config.set === 'function') {
                    result = config.set((checked ? 1 : 0));
                }
                else if (config.drive === 'once') {
                    result = true;
                } else {
                    throw "最大高度功能设置有误";
                }

                if (!result) {
                    console.error('最大高度功能更新：' + result.toString());
                    return;
                }

                that.height.maxFillHeight = checked;
                if (checked) {
                    $(that.elem).find('.main-table>table tbody').css('max-height', config.value + 'px');
                } else {
                    $(that.elem).find('.main-table>table tbody').css('max-height', 'none');
                }
                e.stopPropagation();
            });
        };

        //分页器事件
        Class.prototype.pageEvent = function(){
            var that = this;
            var pageConfig = that.getConfigPage.call(that, that.config.page);

            $(that.elem).find('.footer').on('click', '.toolbar .btn.refresh', function (e) {

                var params = $.extend({}, that.config.params);
                if (that.config.page) {
                    params[pageConfig.field] = that.page.current_page;
                }
                that.reload({params:params});
                e.stopPropagation();
            });

            $(that.elem).find('.footer').on('click', '.page-btn .btn[data-page]', function (e) {
                var page = $(this).attr('data-page');
                if (!page) {
                    return;
                }
                var params = $.extend({}, that.config.params);
                params[pageConfig.field] = parseInt(page);
                that.reload({params:params});
                e.stopPropagation();
            });

            $(that.elem).find('.footer').on('keydown', '.page-info input.skip', function (e) {
                if (e.keyCode != 13) {
                    return;
                }
                var page = $(this).val();
                if (!page) {
                    return;
                }
                var params = $.extend({}, that.config.params);
                params[pageConfig.field] = parseInt(page);
                that.reload({params:params});
                e.stopPropagation();
            });
        };

        //设置每页条数
        Class.prototype.setLimitEvent = function(){
            var that = this;

            if (!that.config.page || !that.config.limit) {
                return;
            }

            var config = that.getConfigLimit.call(that, that.config.limit);
            if (config.drive === null) {
                return;
            }

            $(that.elem).find('.footer').on('keydown', '.page-info input.limit', function (e) {
                if (e.keyCode != 13) {
                    return;
                }

                var value = $(this).val();
                var key = that.elem.selector + ':limit';
                var result = false;
                if (config.drive === 'sessionStorage') {
                    if (!value) {
                        result = that.delStorageData(sessionStorage, key);
                    } else {
                        result = that.setStorageData(sessionStorage, key, value);
                    }
                }
                else if (config.drive === 'localStorage') {
                    if (!value) {
                        result = that.delStorageData(localStorage, key);
                    } else {
                        result = that.setStorageData(localStorage, key, value);
                    }
                }
                else if (typeof config.set === 'function') {
                    result = config.set(value);
                }
                else if (config.drive === 'once') {
                    that.limit.value = value;
                    result = true;
                } else {
                    throw "页面条数功能设置有误";
                }

                if (!result) {
                    console.error('页面条数功能更新：' + result.toString());
                    return;
                }

                that.limitGet.call(that);
                that.reload();
                e.stopPropagation();
            });
        };

        //行拖动事件
        Class.prototype.rowDragEvent = function(){
            var that = this;

            if (!that.config.rowDrag) {
                return;
            }

            var config = that.getConfigRowDrag.call(that, that.config.rowDrag);
            var container = $(that.elem).find('.panel.render-table');
            var body = $(that.elem).find('.main-table table tbody');
            var isDraging = false;

            $(that.elem).find('.main-table table').on('mousedown', 'tbody ' + config.trigger, function (e) {
                if (e.button !== 0) {
                    return;
                }
                var row = $(this);
                if (config.trigger != 'tr') {
                    row = $(this).closest('tr');
                }
                var minIndex = parseInt(row.parent().children('tr:first').attr('data-index'));
                var originIndex = parseInt(row.attr('data-index'));
                var cloneRow = row.clone().css('visibility', 'hidden');
                var bodyScrollTop = body.scrollTop();//滚动条移动高度
                var disY = e.clientY - row.position().top;//鼠标点击位置与当前行的上边框的高度
                var originStyle = '';

                $('body').on('mousemove', function (e) {
                    if (!isDraging) {
                        isDraging = true;
                        container.addClass('noselect');
                        row.after(cloneRow);
                        originStyle = row.attr('style');
                        originStyle = originStyle ? originStyle : '';
                        row.css({
                            'width': row.outerWidth(true),
                            'position': 'absolute',
                            'z-index': 10
                        });
                    }
                    var top = e.clientY - disY + (body.scrollTop() - bodyScrollTop);//根据鼠标移动的位置计算出浮动行的top
                    var trTop = cloneRow.position().top;
                    var upTr = row.prev();//当前行的上一行
                    var downTr = cloneRow.next();//当前行的下一行
                    var upMove = upTr.length && (trTop - top > upTr.height() / 2.0);//有上一行，并且鼠标已经移动上一行高度的二分之一
                    var downMove = downTr.length && (top - trTop > downTr.height() / 2.0);//有上一行，并且鼠标已经移动上一行高度的二分之一
                    //已经移动到最上一行，或最下一行，不再移动
                    if (trTop - top > 0 ? !upTr.length : !downTr.length) {
                        row.css('top', trTop);
                        return;
                    }
                    row.css('top', top);
                    if (upMove) {
                        cloneRow.after(upTr);
                    } else if (downMove) {
                        row.before(downTr);
                    }
                }).on('mouseup', function (e) {
                    $('body').off('mousemove').off('mouseup');

                    if (isDraging) {
                        isDraging = false;
                        container.removeClass('noselect');
                        row.removeAttr('style');
                        row.attr('style', originStyle);
                        row.next().remove();

                        var newIndex = parseInt(row.index()) + minIndex;
                        if (originIndex != newIndex) {
                            var originData = that.data;
                            var newData = [];
                            var first = originIndex;
                            var second = newIndex;
                            if (originIndex > newIndex) {
                                first = newIndex;
                                second = originIndex;
                            }
                            if (first != 0) {
                                newData.push.apply(newData, originData.slice(0, first));
                            }
                            if (originIndex > newIndex) {
                                newData.push(originData[originIndex]);
                                newData.push(originData[newIndex]);
                            }
                            newData.push.apply(newData, originData.slice(first + 1, second));
                            if (originIndex < newIndex) {
                                newData.push(originData[newIndex]);
                                newData.push(originData[originIndex]);
                            }
                            if (second != newData.length) {
                                newData.push.apply(newData, originData.slice(second + 1));
                            }

                            var packData = that.dataChangePack.call(that, 'rowDrag', config.callback, newData, originData, newIndex, originIndex);
                            if ($.type(packData) === 'array') {
                                newData = packData;
                            }

                            if (that.config.url == '') {
                                that.reload.call(that, {data:newData}, true);
                            } else {
                                that.data = newData;
                                that.reload.call(that, {}, true);
                            }
                        }
                    }
                });
            });
        };

        //获取当前多选框的选中项
        Class.prototype.getCheckboxData = function () {
            var that = this;

            var data = that.checkbox.data;
            if (!data) {
                return {data: [], index: [], value: []};
            }

            return data;
        };

        //设置选中多选框
        Class.prototype.setCheckboxData = function (data, skip, clear) {
            var that = this;

            if (!that.checkbox.exist) {
                return;
            }

            if (that.checkbox.isRadio) {
                if (data === 'all') {
                    return;
                }
                data = [data[0]];
            }

            if (clear || data === 'all') {
                that.clearCheckboxData.call(that);
            }
            //skip参数在某些jquery版本失效，jquery1.8.3以下，或3.4.0以上版本即无问题
            if (data === 'all') {
                $(that.elem).find('.main-table>table input.row-checkbox').trigger('click', [skip]);
            } else {
                for (var i = 0; i < data.length; i++) {
                    if (!clear && $(that.elem).find('.main-table>table tbody input.row-checkbox[value=' + data[i] + ']').prop('checked')) {
                        continue;
                    }
                    $(that.elem).find('.main-table>table tbody input.row-checkbox[value=' + data[i] + ']').trigger('click', [skip]);
                }
            }
        };

        //消除复选框相关数据与样式
        Class.prototype.clearCheckboxData = function () {
            var that = this;

            that.checkbox.data = null;
            $(that.elem).find('input.row-checkbox').prop('checked', false);
            $(that.elem).find('input.total-checkbox').prop('checked', false);
            $(that.elem).find('table tbody tr').removeClass('selected');
        };

        //更新数据
        Class.prototype.updateData = function (index, data, callback) {
            var that = this;

            var originData = that.data;
            var newData = that.objectDeepCopy(originData);
            newData[index] = data;

            var packData = that.dataChangePack.call(that, 'updateData', callback, newData, originData);
            if ($.type(packData) === 'array') {
                newData = packData;
            }

            if (that.config.url == '') {
                that.reload.call(that, {data:newData}, true);
            } else {
                that.data = newData;
                that.reload.call(that, {}, true);
            }
        };

        //插入数据
        Class.prototype.insertData = function (index, data, callback) {
            var that = this;

            var originData = that.data;
            var newData = [];
            if (index == 0) {
                newData.push(data);
                newData.push.apply(newData, originData.slice());
            }
            else if (index == 'last' || index >= originData.length) {
                newData.push.apply(newData, originData.slice());
                newData.push(data);
            }
            else {
                newData.push.apply(newData, originData.slice(0, index));
                newData.push(data);
                newData.push.apply(newData, originData.slice(index));
            }

            var packData = that.dataChangePack.call(that, 'insertData', callback, newData, originData);
            if ($.type(packData) === 'array') {
                newData = packData;
            }

            if (that.config.url == '') {
                that.reload.call(that, {data:newData}, true);
            } else {
                that.data = newData;
                that.reload.call(that, {}, true);
            }
        };

        //删除数据
        Class.prototype.deleteData = function (index, callback) {
            var that = this;

            var originData = that.data;
            var newData = [];
            if (index == 0) {
                newData.push.apply(newData, originData.slice(1));
            }
            else if (index < originData.length) {
                newData.push.apply(newData, originData.slice(0, index));
                newData.push.apply(newData, originData.slice(index + 1));
            } else {
                return;
            }

            var packData = that.dataChangePack.call(that, 'deleteData', callback, newData, originData);
            if ($.type(packData) === 'array') {
                newData = packData;
            }

            if (that.config.url == '') {
                that.reload.call(that, {data:newData}, true);
            } else {
                that.data = newData;
                that.reload.call(that, {}, true);
            }
        };

        //批量修改数据列数据
        Class.prototype.batchEdit = function (data, index, callback) {
            var that = this;

            index = (index && $.type(index) === 'array') ? index : null;
            var originData = that.data;
            var newData = [];
            var item;
            for (var i = 0; i < originData.length; i++) {
                item = that.objectDeepCopy(originData[i]);
                if (index && index.indexOf(i) == -1) {
                    newData.push(item);
                    continue;
                }
                for (var key in data) {
                    if (!item.hasOwnProperty(key)) {
                        continue;
                    }
                    if (typeof data[key] === 'function') {
                        item[key] = data[key](that.objectDeepCopy(originData[i]), i);
                    } else {
                        item[key] = data[key];
                    }
                }
                newData.push(item);
            }

            var packData = that.dataChangePack.call(that, 'batchEdit', callback, newData, originData);
            if ($.type(packData) === 'array') {
                newData = packData;
            }

            if (that.config.url == '') {
                that.reload.call(that, {data:newData}, true);
            } else {
                that.data = newData;
                that.reload.call(that, {}, true);
            }
        };

        //数据有变动时，调用回调，并返回包装后的数据
        Class.prototype.dataChangePack = function (type, callback, newData, originData, newIndex, originIndex) {
            var that = this;

            var packData;
            var tempData;
            if (that.config.dataChange && typeof that.config.dataChange === 'function') {
                tempData = that.config.dataChange(type, that.objectDeepCopy(newData), that.objectDeepCopy(originData));
                if ($.type(tempData) === 'array') {
                    packData = tempData;
                }
            }
            if (callback && typeof callback === 'function') {
                tempData = callback(that.objectDeepCopy(newData), that.objectDeepCopy(originData), newIndex, originIndex);
                if ($.type(tempData) === 'array') {
                    packData = tempData;
                }
            }
            return packData;
        }

        //为渲染元素绑定事件
        Class.prototype.on = function (e, handle) {
            var that = this;

            $(that.elem).on(e, handle);
        };

        //表格重载
        Class.prototype.reload = function (option, localReload) {
            var that = this;
            option = option || {};
            localReload = localReload || false;
            that.localReload = localReload;

            that.config = $.extend({}, that.config, option);

            that.render();
        };

        //清空表体，显示消息
        Class.prototype.msg = function(msg){
            var that = this;

            $(that.elem).find('.main-table>table tbody').children().remove();

            var colspan = that.config.fields.length;

            $(that.elem).find('.main-table>table tbody').append('<tr class="msg"><td colspan="' + colspan + '">' + msg + '</td><td></td></tr>');
        };

        //获取存储数据
        Class.prototype.getStorageData = function(drive, key, defaultValue, jsonParse){
            defaultValue = defaultValue || null;
            jsonParse = jsonParse === undefined ? true : jsonParse;
            if (drive === sessionStorage || drive === localStorage) {
                //
            } else if (drive === 'sessionStorage') {
                drive = sessionStorage;
            } else if (drive === 'localStorage') {
                drive = localStorage;
            } else {
                throw '驱动选择错误';
            }
            var url = location.pathname;
            var data = drive.getItem(url + ':' + key);
            if (data === null) {
                return defaultValue;
            }
            return jsonParse ? JSON.parse(data) : data;
        };

        //存储数据
        Class.prototype.setStorageData = function(drive, key, value){
            if (drive === 'sessionStorage') {
                drive = sessionStorage;
            } else if (drive === 'localStorage') {
                drive = localStorage;
            } else if (drive === sessionStorage || drive === localStorage) {
            } else {
                throw '驱动选择错误';
            }
            if (typeof value !== 'string') {
                value = JSON.stringify(value);
            }
            var url = location.pathname;
            drive.setItem(url + ':' + key, value);

            return true;
        };

        //存储数据
        Class.prototype.delStorageData = function (drive, key) {
            if (drive === 'sessionStorage') {
                drive = sessionStorage;
            } else if (drive === 'localStorage') {
                drive = localStorage;
            } else if (drive === sessionStorage || drive === localStorage) {
            } else {
                throw '驱动选择错误';
            }
            var url = location.pathname;
            drive.removeItem(url + ':' + key);

            return true;
        };

        //生成随机字符串
        Class.prototype.randomString = function(){
            return Number(Math.random().toString().substr(3,6) + Date.now()).toString(36);
        };

        //深拷贝对象
        Class.prototype.objectDeepCopy = function(object){
            if (!(object instanceof Object)) {
                return object;
            }
            return JSON.parse(JSON.stringify(object));
        };

        //根据时间格式解析字符串并返回Date对象
        Class.prototype.parseDate = function(string, format) {
            format = format || 'yyyy-MM-dd HH:mm:ss';
            var obj = {y: 0, M: 1, d: 0, H: 0, h: 0, m: 0, s: 0, S: 0};
            format.replace(/([^yMdHmsS]*?)(([yMdHmsS])\3*)([^yMdHmsS]*?)/g, function(m, $1, $2, $3, $4, idx, old) {
                string = string.replace(new RegExp($1+'(\\d{'+$2.length+'})'+$4), function(_m, _$1) {
                    obj[$3] = parseInt(_$1);
                    return '';
                });
                return '';
            });
            obj.M--; // 月份是从0开始的，所以要减去1
            var date = new Date(obj.y, obj.M, obj.d, obj.H, obj.m, obj.s);
            if(obj.S !== 0) date.setMilliseconds(obj.S); // 如果设置了毫秒
            return date;
        }

        //清除对象中临时数据，一般用于reload/render
        Class.prototype.clear = function () {
            var that = this;

            that.clearCheckboxData.call(that);
            $(that.elem).find('.toolbar .no-check-hide').addClass('hidden');
        };

        //tableClass默认配置
        Class.prototype.getConfigTableClass = function(config){
            if (typeof config === 'string') {
                config = {extend:config};
            } else if (typeof config !== 'object') {
                config = {};
            }
            return $.extend({}, {border:false,extend:''}, config);
        };

        //autoRefresh默认配置
        Class.prototype.getConfigAutoRefresh = function(config){
            if (typeof config !== 'object') {
                config = {};
            }
            return $.extend({}, {intervalFlag:0,checked:false,interval:60000}, config);
        };

        //field sort默认配置
        Class.prototype.getConfigFieldSort = function(config, field){
            if (typeof config !== 'object') {
                config = {};
            }
            return $.extend({}, {type: 'local', post: 'order_by_' + field.name, init: null}, config);
        };

        //page默认配置
        Class.prototype.getConfigPage = function(config){
            if (typeof config !== 'object') {
                config = {};
            }
            return $.extend({}, {field:'page',refresh:true}, config);
        };

        //limit默认配置
        Class.prototype.getConfigLimit = function(config){
            var that = this;

            if (typeof config === 'number' || config === 'auto') {
                config = {value:config};
            }
            else if (typeof config !== 'object') {
                config = {};
            }
            config = $.extend({}, {field: 'limit', value: 'auto', tallest: 50, drive: 'once'}, config);
            if (config.value === 'auto') {
                config.value = parseInt(that.height.value / 27);
                if (config.value > config.tallest) {
                    config.value = config.tallest;
                }
            }
            return config;
        };

        //rowDrag默认配置
        Class.prototype.getConfigRowDrag = function(config){
            var that = this;

            if (typeof config !== 'object') {
                config = {};
            }
            return $.extend({}, {trigger:'tr', callback:function (){}}, config);
        };

        //maxFillHeight默认配置
        Class.prototype.getConfigMaxFillHeight = function(config){
            var that = this;

            if (typeof config === 'number') {
                config = {value:config};
            }
            else if (typeof config !== 'object') {
                config = {};
            }
            config = $.extend({}, {value: 0, control: false, checked:true, drive:'once', get:null, set:null}, config);

            if (!config.control) {
                return config;
            }

            var checked;
            var key = that.elem.selector + ':maxFillHeight';
            if (config.drive === 'sessionStorage') {
                checked = that.getStorageData(sessionStorage, key);
                if (checked !== null) {
                    config.checked = checked;
                }
            }
            else if (config.drive === 'localStorage') {
                checked = that.getStorageData(localStorage, key);
                if (checked !== null) {
                    config.checked = checked;
                }
            }
            else if (typeof config.get === 'function') {
                checked = config.get();
                if (checked !== null) {
                    config.checked = checked;
                }
            }
            else if (config.drive === 'once') {
                if (that.height.maxFillHeight === false || that.height.maxFillHeight === true) {
                    config.checked = that.height.maxFillHeight;
                }
            } else {
                throw "最大高度功能设置有误";
            }

            return config;
        };

        return new Class(this, option);
    }
})(jQuery,window,document);