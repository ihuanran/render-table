# Render Table 文档
## 使用方法
引入`render-table.css`和`render-table.js`即可。插件依赖于`Bootstrap`，请务必引入。
---
## 快速使用
```js
    <div class="example-table"></div>
    var table = $('.example-table').renderTable({
        url: '/data/get',
        params: {sex:'男'},
        fields: [
            {name:'name', title: '姓名'},
            {name:'age', title: '年龄'},
            {name:'sex', title: '性别'},
        ]
    });
```
以下将渲染型如下方的表格
姓名|年龄|性别
--|:--:|--:
刘备|33|男
关羽|32|男
张飞|31|男
---
## 渲染方式
组件分为`本地静态数据`和`异步请求数据`两种渲染方式
异步请求数据相关的选项有`url`，`params`等，优先级高于静态数据
本地静态数据使用已有的数据进行渲染表格，相关的选项有`data`
---
## 基础参数
renderTable方法里是一个包含参数 `option` 的对象，下面将逐一讲解 `option`
---
- **tableClass**
  解释：组件下表格标签<table>的额外的类名
  类型：string / object，当传入string时，会直接将string拼成class属性中，object格式为`{border:false,extend:''}`，其中border为预设样式，设置为true时，将添加`table-bordered`样式，即为所有表格的单元格添加边框，extend为字符串，可自定义添加类名
  是否必填：非必填
---
- **url**
  解释：异步请求数据的地址
  类型：string
  是否必填：`异步数据`渲染必填
---
- **params**
  解释：异步请求数据时带上的请求参数
  类型：object`{a:1,b:2}`或string`a=1&b=2`
  是否必填：非必填
---
- **method**
  解释：异步请求数据的方法
  类型：`get`或`post`，默认`post`
  是否必填：非必填
---
- **parseData**
  解释：数据格式解析的回调函数，用于将返回的任意数据格式解析成组件规定的数据格式
  类型：function(result, config)，默认解析info为result.info，status为result.status，data为result.data，当有配置`page`时data解析为result.data.data。现在也可用于解析包装静态数据。如下
```js
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
    }
```
是否必填：非必填
备注：一般情况下不需要修改这个函数
---
- **statusSucceed**
  解释：接口的状态码`status`可以认为成功，如果不等于设置的状态，将不渲染`data`，而展示`info`
  类型：int，string或array，默认(int)`10000`
  是否必填：非必填
  备注：一般情况下不需要修改，多个状态码可传入array，同时需要注意(int)10000和(string)'10000'是不同的
---
- **page**
  解释：异步接口是否分页，以及分页相关的配置
  类型：bool或object，默认`false`，可以简单地传`true`配置分页，传入`true`将使用`{field:'page',refresh:true}`，其中`field`是页码传到接口的字段名,`refresh`是左下角刷新当前页面的按钮。你也可以传入object进行覆盖默认配置，没有的属性将使用默认配置。
  是否必填：非必填
---
- **parsePage**
  解释：分页数据格式解析的回调函数，用于将返回的任意数据格式解析成组件规定的分页数据格式
  类型：function(result, config)，默认解析如下
  current_page为result.data.current_page (当前页码)
  from为result.data.from (当前起始的条数)
  to为result.data.to (当前截止的条数)
  per_page为result.data.per_page (当前一页的条数)
  last_page为result.data.last_page (最后页码)
  total为result.data.total (总条数)
  如下
```js
    parsePage:function(result, config){
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
    }
```
是否必填：非必填
备注：一般情况下不需要修改这个函数，默认已经解析为laravel的分页器格式
---
- **limit**
  解释：分页的条数。传到后端的分页条数，请注意后端接口必须有相关字段设置
  类型：bool，object或int及'auto'，默认`false`。可以简单地传要的(int)条数，或者`auto`，`auto`将根据table的高度计算，自动铺满table。也可传入`true`配置条数，传入`true`将使用`{field:'limit',value:'auto',tallest:50,drive:'once',get:function(){},set:function(){}}`，其中解释如下：
    - `field`是条数传到接口的字段名
    - `value`是需要的条数，int或'auto'
    - `tallest`是当是`auto`自动计算时最高的条数，避免计算出错。
    - `drive`是将当前设置的条数进行存储，有如下驱动可选：`once`代表只在当前实例生效，`sessionStorage`代表存储在sessionStorage，`localStorage`代表存储在localStorage，`function`代表自定义存储过程，可以是ajax请求或其它。有关驱动之间的区分和注意事项，请看存储驱动章节
    - `get`是获取当前设置的条数，仅在`drive`=`function`生效，function(){}
    - `set`是设置当前设置的条数，仅在`drive`=`function`生效，function(value){}
      你也可以传入object进行覆盖默认配置，没有的属性将使用默认配置。
      是否必填：非必填
      备注：一般情况下只需要关注`field`，`value`和`drive`即可。如果已经设置条数，但想恢复到默认设置时(通常是auto)，只需清除表格下方输入条数的输入框的内容，再按回车即可。组件会清除已经存储的条数，自定义回调set也会传入''空串参数
---
- **fields**
  解释：各字段的相关配置，组件核心配置
  类型：array，array是一个个object构成，一个object代表一个字段的设置。即形如`[{name:field1...}, {name:field2...}]`，下面是对象中可选配置。
    - `type`代表当前的列类型，有`normal`常规字段列，默认值不需要设置，`checkbox`复选框列，其value的值为：当当前的name或value选项存在时，使用name或value(优先value)，否则为当前行数据的索引值index
    - `name`代表当前列使用字段，用此字段生成表格(优先级较低)
    - `title`代表当前标题，用于表头thead
    - `detailTitle`详细的标题，将放在表头th的title属性中
    - `value`代表自定义值(优先级最高)，类型为function(rowData, index, allData)，其中rowData为当前行数据，index为当前行索引，allData为所有数据。此配置适合想根据当前行数据，生成不同的表格td内容使用，返回值必须为string
    - `tool`代表自定义工具条(通常是按钮组，优先级比value低)，类型为function(rowData, index, allData)，其中rowData为当前行数据，index为当前行索引，allData为所有数据。此配置适合生成操作按钮组，当前也可根据行数据对按钮进行更改，返回值必须为string，同时按钮需加上`data-event=""`属性以触发监听事件。建议按钮组装样式如下：
```js
    tool: function (rowData) {
        var deleteDisable = 'disabled';
        if (rowData.can_delete) {
            deleteDisable = '';
        }
        //按钮组
        return '<div class="btn-group btn-group-xs">' +//使用btn-group按钮组
            '<button class="btn btn-info" data-event="detail">查看</button>' +
            '<button class="btn btn-danger" data-event="delete" ' + deleteDisable + '>删除</button>' +
            '</div>';
        //带有更多的按钮组
        return '<div class="btn-group btn-group-xs">' +//使用btn-group按钮组
            '<button class="btn btn-info" data-event="detail">查看</button>' +
            '<button class="btn btn-default dropdown-toggle" type="button" data-toggle="dropdown">' +
            '更多<span class="caret"></span>' +//使用更多下拉按钮组
            '<ul class="dropdown-menu" role="menu">' +
            '<li><a href="#" class="" data-event="status" data-status="2">接单</a></li>' +
            '<li><a href="#" class="" data-event="status" data-status="3">打回订单</a></li>' +
            '</ul>' +
            '</button>' +
            '</div>';
    }
```
- `width`代表td的宽度，数字/百分比
- `minWidth`代表td的最小宽度，数字/百分比
- `maxWidth`代表td的最大宽度，数字/百分比
- `style`代表td的额外的style，将直接加上td元素上，支持string，也可使用function(rowData, index, allData)，function可根据数据进行自定义style，比较灵活。其中一个应用场景是，如果状态字段是成功，把当前状态td的文字标识为绿色，如下：
```js
    style: function (rowData) {
        var result = '';
        if (rowData.status == 'success') {
            result = 'color:green;'
        }
        return result;
    }
```
- `class`代表td的额外的class，将直接加上td元素上，支持string，也可使用function(rowData, index, allData)，function可根据数据进行自定义class，比较灵活。应用场景同style
- `align`代表文字对齐方式，默认是left
- `hide`代表隐藏列，一般情况下不需要设置这个。此组件中所有事件，都会传入对应行的所有数据，不再需要像以往去取dom里hide的列数据。所以使用此组件，只需要展示需要展示的字段即可
- `sort`代表此列可排序，bool或object，默认`false`，可以简单地传`true`配置排序，传入`true`将使用`{type:'local',post:'order_by_[name]',init:null}`，翻译如下
    - `type`是排序的方式，分为`local`和`post`，`local`将用前端排序,不用请求后端排序，只排序当前页面上的数据，`post`则是后端排序。
    - `post`是传到后端的字段名，默认为`order_by_[name]`,name为当前字段名，例如当前列是status字段，则默认为order_by_status，此外排序发送到后端是asc/desc(小写)
    - `init`是表格刚开始创建时，是否默认排序以及正反序asc/desc，为null时则默认不排序
- `checkboxDisable`当当前列为`checkbox`时，可使用此回调控制行复选框是否为`disabled`禁用的状态，使用方法为回调function(rowData, index, allData)，返回true时将禁用当前行的`checkbox`复选框
- `click`是点击单元格触发事件,true或string(事件名),默认触发事件名为cell-click-[name],也可自定义name的值
- `dblclick`是点击单元格触发事件,true或string(事件名),默认触发事件名为cell-dblclick-[name],也可自定义name的值
- `columnExist`是否要渲染此列,回调function()，返回值为false时会忽略此列不渲染
- `radio`当当前列为`checkbox`时，控制checkbox是否为单选
---
- **rowStyle**
  解释：代表tr的额外的style，将直接加上tr元素
  类型：string，也可使用function(rowData, index, allData)，function可根据数据进行自定义style，比较灵活。其中一个应用场景是，如果当前行状态字段是失败，把当前行整行标识为红色，如下：
```js
    rowStyle: function (rowData) {
        var result = '';
        if (rowData.status == 'fail') {
            result = 'color:red;'
        }
        return result;
    }
```
是否必填：非必填
备注：注意此选项是作用在tr，也就是整行上的，而fields.style是作用在td上的
---
- **rowClass**
  解释：代表tr的额外的class，将直接加上tr元素
  类型：string，也可使用function(rowData, index, allData)，function可根据数据进行自定义class，比较灵活。使用方法同`rowStyle`
  是否必填：非必填
  备注：注意此选项是作用在tr，也就是整行上的，而fields.class是作用在td上的
---
- **rowClickCheckbox**
  解释：单击行tr时勾选/取消行的checkbox复选框(如果有的话)
  类型：bool，默认false
  是否必填：非必填
---
- **rowElemNoTriggerClick**
  解释：设置单击行tr内某些元素(选择器)，不触发行点击事件
  类型：array，默认设置bootstrap的dropdowns下拉按钮，(['.dropdown-toggle[data-toggle=dropdown]'])
  是否必填：非必填
---
- **totalCheckboxFilter**
  解释：点击全选时，过滤每行的回调，用于控制全选时选中的行
  类型：function(rowData, index, allData)，默认null
  是否必填：非必填
---
- **data**
  解释：静态数据，对应于异步请求数据，使用静态数据渲染，优先级低于异步请求(即同步设置url和data，data将被省略)
  类型：array
  是否必填：非必填

备注：注意使用静态数据时，~~异步数据相关的配置将失效，例如`page`,`limit`等~~。现在静态数据也可使用分页功能，但必须指定`limit`分页条数
---
- **toolbar**
  解释：左下角自定义工具栏，一般来说，这些工具都和表格多选框起交互作用的
  类型：string，array或function，为保证样式的一致性，工具栏要求使用`<button>`进行拼接，且button使用`Bootstrap`的`btn btn-link`class，并且为了触发事件，还需带上`data-event`属性。按钮不使用文字，使用图标表示，并加上title。相关举例如下：
```js
//string
'<button type="button" class="btn btn-link" title="批量打印" data-event="print"><span class="glyphicon glyphicon-print"></span></button>' + 
'<button type="button" class="btn btn-link" title="批量删除" data-event="delete"><span class="glyphicon glyphicon-delete"></span></button>'
//array
//数组里可以是直接的字符串，也可以是对象{value:'',noCheckHide:true/false}，其中noCheckHide代表只有当前有复选框勾选时才显示按钮。组件会按照数组拼接成字符串
[
    '<button type="button" class="btn btn-link" title="批量删除" data-event="delete"><span class="glyphicon glyphicon-delete"></span></button>',
    {value:'<button type="button" class="btn btn-link" title="批量打印" data-event="print"><span class="glyphicon glyphicon-print"></span></button>',noCheckHide:true}
]
//function
//必须返回字符串
function () {
    retrue: '<button type="button" class="btn btn-link" title="批量打印" data-event="print"><span class="glyphicon glyphicon-print"></span></button>';
}
```
是否必填：非必填
备注：为保证样式统一，多按钮时需按照`<button class="btn btn-link"><span class="glyphicon"></span></button><button class="btn btn-link"><span class="glyphicon"></span></button>`的格式
---
- **filter**
  解释：列表自定义显示字段
  类型：false/sessionStorage/localStorage/once/object，默认是false，sessionStorage/localStorage/once(string)代表直接使用的驱动，object则可以设置更详细的配置，属性如下：`{drive:'sessionStorage/localStorage/once/function',get:function(),set:function(fields),default:array}`，其中解释如下：
    - `drive`是将当前设置的字段进行存储，有如下驱动可选：`once`代表只在当前实例生效，`sessionStorage`代表存储在sessionStorage，`localStorage`代表存储在localStorage，`function`代表自定义存储过程，可以是ajax请求或其它。有关驱动之间的区分和注意事项，请看存储驱动章节
    - `get`是获取当前设置的字段，仅在`drive`=`function`生效，function(){}
    - `set`是设置当前设置的字段，仅在`drive`=`function`生效，function(fields){}
    - `default`是当无设置时，默认显示字段，当此项无配置时，将展示所有字段
      是否必填：非必填
      备注：需要参与此配置的字段，在`fields`必须配置`fields.name`，即使有`fields.value`也要配置`name`
---
- **autoRefresh**
  解释：列表自动刷新，设置每隔一段时间，列表自动刷新当前页面(不跳页码)
  类型：bool/object，默认`false`。可以简单地传入`true`配置条数，传入`true`将使用`{interval:60000, checked:true}`，其中解释如下：
    - `interval`是自动刷新的时间间隔，单位为毫秒
    - `checked`是代表表格初始化后，自动刷新的开启设置，为true，然后自动开启自动刷新
      你也可以传入object进行覆盖默认配置，没有的属性将使用默认配置。
---
- **dataChange**
  解释：当列表data因某些操作改变后的回调，可用作记录变动数据。此回调可返回整个数组来修改所有数据，用于一些数据包装，例如删除某项后，整个列表的序号要重新排列
  类型：function，函数形如function(type,newData,originData)，其中解释如下：
    - `type`代表引起此次改变的操作类型，目前有updateData,insertData,deleteData,batchEdit,rowDrag,reload(仅静态数据)
    - `newData`是改变后的新数据
    - `originData`是改变前的老数据
---
- **rowDrag**
  解释：列表行拖拽，可以上下拖动改变行的位置
  类型：bool/object，默认`false`。可以简单地传入`true`配置拖动，传入`true`将使用`{trigger:tr, callback:function(){}}`，其中解释如下：
    - `trigger`是触发拖动的元素，默认是tr整行。建议在tool设置一个单独的按钮来控制拖动，如`'tr button.rowDrag'`
    - `callback`是修改后的回调，可在回调返回整个数组来修改所有数据，此回调返回值优先级高于`dataChange`配置项
---
- **height**
  解释：列表高度设置
  类型：number/`full-差值`
  当传入`number`时，表格将使用这个高度，表格行数超出此高度时，将出现滚动条。
  `full-差值`代表full指设置的最大高度(默认当前窗口高度)，差值可设置任意数值，此选项可用于使表格自动铺满当前窗口，使之不会出现上下滚动条，差值一般是当前页面除表格外其它元素的高度之和，需要多次调试。
  当`不设置`此项时，表格将根据行数自动撑开高度。
  是否必填：非必填
---
- **fullHeight**
  解释：最大高度
  类型：number，用于计算高度`full-差值`时用的最大高度，默认是当前窗口高度
  是否必填：非必填
---
- **minAutoHeight**
  解释：自动高度时的最小高度
  类型：number，自动高度时的最小高度，计算后若低于此高度就使用此高度，默认是50
  是否必填：非必填
---
- **maxFillHeight**
  解释：当没有设置高度，表格随内容添加高度时，表格的最大高度，超过此高度将出现滚动条
  类型：number/object，默认是0。可以传入`number`代表出现滚动条的最大高度，此时将使用`{control: false, checked:true, drive:'once', get:null, set:null}`，其中解释如下：
    - `control`是否可以由用户自定义，即表格界面出现按钮可自由选择
    - `checked`默认是否勾选
    - `drive`是将当前设置进行存储，有如下驱动可选：`once`代表只在当前实例生效，`sessionStorage`代表存储在sessionStorage，`localStorage`代表存储在localStorage，`function`代表自定义存储过程，可以是ajax请求或其它。有关驱动之间的区分和注意事项，请看存储驱动章节
    - `get`是获取当前设置，仅在`drive`=`function`生效，function(){}
    - `set`是设置当前设置，仅在`drive`=`function`生效，function(checked){}
      你也可以传入object进行覆盖默认配置，没有的属性将使用默认配置。
      是否必填：非必填
---
- **beforeRender**
  解释：每次渲染表格前的回调函数，包括初始渲染以及重新渲染
  类型：function (elem, config){}，`elem`参数是当前元素的JQ对象
  是否必填：非必填
  备注：一般用来做清除工作，例如清除某些弹出框
---
- **done**
  解释：每次渲染表格后的回调函数，包括初始渲染以及重新渲染
  类型：function (data, page, rawData){}，`data`参数是经解析后的当前数据，`page`参数是经解析后的分页数据，`rawData`是未经解析的原始数据
  是否必填：非必填
---
- **nullText**
  解释：数据为空时展示的文本
  类型：string，默认是`暂无数据`
  是否必填：非必填
---
- **initNoLoad**
  解释：设置表格初始化时，不加载(请求)数据，不渲染表体，只渲染表格的轮廓
  类型：bool，默认是false
  是否必填：非必填
---
- **footerToolbarWidth**
  解释：底部分页器和工具栏的栅格宽度
  类型：array，默认是 `[4,3,5]`
  是否必填：非必填
---
## 存储驱动
组件的很多功能都提供存储功能，存储的各驱动有不一样的生效方式以及注意事项，下面一一讲解
`once`：此驱动只在实例中存储，一旦实例丢失，存储内容也会消失。换句话说，这个只会在当前页面存储，一旦退出或者刷新，设置内容都会消失
`sessionStorage`：此驱动存储在sessionStorage，根据sessionStorage的特点，一旦当前会话(cookie)失效，存储内容也会消失。换句话说，只要浏览器关闭当前网站，或者关闭浏览器，设置内容都会消失。需要注意的是，这里指的会话并不是指业务层面的登陆状态，而是浏览器的会话(cookie)。所以，此设置的内容也是不分用户的，只针对当前的会话(cookie)
`localStorage`：此驱动存储在localStorage，根据localStorage的特点，存储内容会持久化到本地，当用户没有清除浏览器数据时，存储内容是持久的。换句话说，存储的内容会在当前电脑的当前浏览器生效，此很适合那些针对不同电脑的设置，例如不同电脑有不同的屏幕大小，也就有不同列表条数(高度)，以及展示字段(宽度)。需要注意的是，此设置的内容也是不分用户的，只针对当前电脑的当前浏览器
`function`：此驱动为自定义操作，你可以自由设定获取/存储的手段，当然通常为后端存储渠道。需要注意的是，必须保证get/set为同步代码，即如果是ajax必须设置`async:false`，切不可使用异步。set回调必须返回bool结果，组件将根据结果进行判断。有关例子如下：
```js
    filter: {
        get: function () {
            var result = null;
            $.ajax({
                type: 'POST',
                async: false,//设置为同步
                url: '/get',
                success: function (res) {
                    if (res.status == 10000) {
                        result = res.fields;
                    }
                }
            });
            return result;
        },
        set: function (fields) {
            var result = false;
            $.ajax({
                type: 'POST',
                async: false,//设置为同步
                data: fields,
                url: '/set',
                success: function (res) {
                    if (res.status == 10000) {
                        result = true;
                    }
                }
            });
            return result;
        }
    }
```
一般来说，`localStorage`是最实用的，它可以根据不同的电脑设置，但同时要注意的是`sessionStorage`和`localStorage`是不区分业务中的用户的。自定义`function`驱动必须保证回调进行的是同步代码，切不可使用异步，切记切记
---
## 对象方法
```js
var tableObject = $('.example-table').renderTable({});
```
上面调用渲染的方法后，会返回一个当前表格的组件对象，对象里有很多可以调用的方法，如重新渲染reload等，下面一一讲解
---
- **tableObject.config()**
  此方法返回当前表格的配置config，需要注意的是，返回是config对象的引用，修改返回值config，也会同步到组件内的config
---
- **tableObject.reload(option, refreshCurrent, localReload)**
  此方法可以重载表格，一般用于搜索表单进行搜索，参数`option`即组件配置项，只需传入有变化的配置项即可，通常是params选项。参数`refreshCurrent`代表是否按当前的请求参数`params`和页数`page`进行远程请求并重载。参数`localReload`代表在异步数据的情况下，不请求远程接口，只进行本地重载。方法调用方式建议如下
```js
//搜索
$('form .submit').click(function () {
    var params = tableObject.config().params;//取原来表格的参数
    var search = $('form').serializeObject();//表单已经输入的参数
    params = $.extend({}, params, search);//进行参数覆盖合并
    tableObject.reload({params: params});//重载
});
```
此方法会让页码回归第一页，你也可以在params里传入page参数来指定页数。
---
- **tableObject.data(index)**
  此方法返回当前表格组件的数据，参数`index`即数据的索引，如果没有此参数，即返回所有数据
---
- **tableObject.getCheckboxData()**
  此方法可获取当前多选框选中的数据，如果是想使用工具栏，建议使用工具栏事件。返回的数据结构如下：
```js
    {
        //选中的每一行的数据详情数组
        data: [
            {id:1,name:'张三'},
            {id:3,name:'李四'}
        ],
        //选中的每一行的数据索引
        index: [1, 3],
        //选中的每一行的checkbox的value值，具体请参考config.fileds.type:checkbox的配置
        value: [1, 3]
    }
```
---
- **tableObject.setCheckboxData(data, skip, clear)**
  此方法可设置多选框选中的数据，参数说明如下：
  data：数组或`all`，里面包含要设置的多选框的value值，为`all`时选中所有行
  skip：不触发`click-checkbox`的事件，默认触发。注意，此参数在某些jquery版本失效，jquery`1.8.3`以下，或`3.4.0`以上版本即无问题
  clear：在设置多选框前清除当前复选框的选中值，默认清除
---
- **tableObject.emptySort(field)**
  此方法可清除排序字段的排序状态，field可以指定需要清除字段名，不传参则清除全部
---
- **tableObject.updateData(index, data, callback)**
  此方法可更新当前列表的数据并渲染列表，参数说明如下：
  index：要更新的数据索引
  data：要更新的完整行数据，必需包含完整的行数据
  callback：更改后的回调，可在回调返回整个数组来修改所有数据，此回调返回值优先级高于`dataChange`配置项
---
- **tableObject.insertData(index, data, callback)**
  此方法可插入当前列表的数据并渲染列表，参数说明如下：
  index：要插入的数据索引,支持`last`插入到最后
  data：要插入的完整行数据，必需包含完整的行数据
  callback：插入后的回调，可在回调返回整个数组来修改所有数据，此回调返回值优先级高于`dataChange`配置项
---
- **tableObject.deleteData(index, callback)**
  此方法可插入当前列表的数据并渲染列表，参数说明如下：
  index：要删除的数据索引
  callback：删除后的回调，可在回调返回整个数组来修改所有数据，此回调返回值优先级高于`dataChange`配置项
---
- **tableObject.batchEdit(data, index, callback)**
  此方法可批量修改当前列表的列数据并渲染列表，参数说明如下：
  data：要批量修改的列数据，采用object{key1:value1,key2:value2...}方式，其中key为键名，value为修改的值，value也可以是回调function(rowData, index, allData)，以返回值来修改数据
  index：要修改的数据索引数组，默认修改全部
  callback：修改后的回调，可在回调返回整个数组来修改所有数据，此回调返回值优先级高于`dataChange`配置项
---
- **tableObject.on(event, function)**
  此方法可向表格绑定事件，可用于标准事件，或者组件所有自定义事件，参数说明如下：
  event：事件，如`row-click`，`tool-info`等
  function：处理事件逻辑的回调函数，函数参数视绑定的事件有所不同
---
## 事件
组件里提供各种事件，供外部监听使用。使用者只需要监听绑定生成组件的元素或使用表格对象的`on`方法，加上事件名，即可监听事件，以及相应的数据，无须监听具体元素。如下：
```js
    <div class="example-table"></div>
    var table = $('.example-table').renderTable({...});
    $('.example-table').on('自定义事件名', function (e, params)) {
        //e：原始的事件对象，params：组件向事件输入一些有用的参数
        ...
    }
    //或者
    table.on('自定义事件名', function (e, params)) {
        //e：原始的事件对象，params：组件向事件输入一些有用的参数
        ...
    }
```
---
### 基础事件
- **click-checkbox**
  每次点击复选框时，触发的事件。无论是选中还是取消选中，或者点击全选复选框都会触发
```js
    $('.example-table').on('click-checkbox', function (e, params)) {
        //params与tableObject.getCheckboxData()返回数据基本一致，结构如下：
        {
            //选中的每一行的数据详情数组
            data: [
                {id:1,name:'张三'},
                {id:3,name:'李四'}
            ],
            //选中的每一行的数据索引
            index: [1, 3],
            //选中的每一行的checkbox的value值，具体请参考config.fileds.type:checkbox的配置
            value: [1, 3],
            //当前操作行的数据，只有点击数据行的复选框才有这属性，否则点击全选复选框为null
            //可判断此属性是否为null确定是否是点击全选
            current: {
                check: true,//当前行是选中，或取消选中
                checkbox: $(checkbox),//当前checkbox复选框的JQ对象
                tr: $(tr),//当前操作行的JQ对象
                value: 1,//当前复选框的value值
                index: 1,//当前操作行的数据索引
                data: {id:1,name:'张三'}//当前操作行的数据详情
            }
        }
    }
```
---
- **row-click**
  单击行时，触发的事件
```js
    $('.example-table').on('row-click', function (e, params)) {
        //params结构如下
        {
            data: {id:1,name:'张三'},//当前行的数据详情
            tr: $(tr),//当前行的JQ对象
            index: 1,//当前行的数据索引
        }
    }
```
---
- **row-dblclick**
  双击行时，触发的事件
```js
    $('.example-table').on('row-dblclick', function (e, params)) {
        //params结构如下
        {
            data: {id:1,name:'张三'},//当前行的数据详情
            tr: $(tr),//当前行的JQ对象
            index: 1,//当前行的数据索引
        }
    }
```
---
- **cell-click-***
  点击单元格时，触发的事件（需要在字段设置`click`）
```js
    $('.example-table').on('cell-click-name', function (e, params)) {
        //params结构如下
        {
            field: 'name',//当前单元格的字段
            value: '张三',//当前单元格的值
            data: {id:1,name:'张三'},//当前行的数据详情
            tr: $(tr),//当前行的JQ对象
            index: 1,//当前行的数据索引
        }
    }
```
---
- **cell-dblclick-***
  双击单元格时，触发的事件（需要在字段设置`dblclick`）
```js
    $('.example-table').on('cell-dblclick-name', function (e, params)) {
        //params结构如下
        {
            field: 'name',//当前单元格的字段
            value: '张三',//当前单元格的值
            data: {id:1,name:'张三'},//当前行的数据详情
            tr: $(tr),//当前行的JQ对象
            index: 1,//当前行的数据索引
        }
    }
```
---
### 工具条事件
在table表体，每一行配置的fields.tool工具条中，点击带有`data-event`属性的按钮时，则会触发`tool-'data-event'`的事件，同时传入对应的行数据，具体使用如下：
```js
    var table = $('.example-table').renderTable({
        fields: [
            ...
            tool: function() {
                return '<div class="btn-group btn-group-xs">' +
                '<button class="btn btn-info" data-event="detail">查看</button>' +
                '</div>';
            }
        ],
    });
    $('.example-table').on('tool-detail', function (e, params)) {
        //params结构如下
        {
            data: {id:1,name:'张三'},//当前操作行的数据详情
            tr: $(tr),//当前操作行的JQ对象
            button: $(button),//当前操作按钮的JQ对象
            index: 1,//当前操作行的数据索引
        }
    }
```
需要注意的是，在配置fields.tool时，按钮必须有`data-event`属性
---
### 工具栏事件
工具栏位于组件左下角，一般用于处理数据批量操作等。点击带有`data-event`属性的按钮时，则会触发`toolbar-'data-event'`的事件，同时传入对应的数据，具体使用如下：
```js
    var table = $('.example-table').renderTable({
        toolbar: '<button type="button" class="btn btn-link" title="批量打印" data-event="print"><i class="glyphicon glyphicon-print"></i></button>',
        ...
    });
    $('.example-table').on('toolbar-print', function (e, params)) {
        //params结构如下
        {
            button: $(button),//当前操作按钮的JQ对象
            checkboxData: {},//多选框的数据，数据结构参考.getCheckboxData()方法
        }
    }
```
---
最后更新于`2021-01-26`