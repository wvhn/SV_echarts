/**
 * Class for handling designs and layout
 * If eCharts library is being used for plots we need to take care of plot sizes and color scheme changes by ourself.
 * Other than Highcharts, eCharts is not responsive by itself and cannot be styled by CSS.
 */
 var plotDesign = {
		
	init: function(){
		var currentMode = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
		console.log('[design]: '+ currentMode + ' mode detected.');
		
		// event listener for changes in color scheme
		$(window.matchMedia('(prefers-color-scheme: dark)')).on('change', function(event){
			currentMode = event.currentTarget.matches ? "dark" : "light";
			console.log('[design]: change to ' + currentMode + ' mode detected.');
			
			$(sv.activePage).find('[data-widget *= "plot"]').widget('changeColorScheme');
		});
		
		// event listener for resize 
		$(window).on('resize orientationchange', function(event){
			$(sv.activePage).find('[data-widget *= "plot"]').widget('changeSize');
		});
	}
}


// ----- prototype plot widget with some common methods
$.widget("sv.plot_echarts", $.sv.widget, {
	
	_changeSize: function(){
		//DEBUG: console.log('resize');
		this.chart.resize();
	},
	
	chartInit: function(option){
		// during widget create the DOM layout is not ready so we initialize the chart with a dummy width and then resize it later
		this.element.css('width', '10%');
		var that = this;

		this.chart = echarts.init(this.element[0]);
		this.chart.setOption(option);

		// resize when the browser has finished layout calculation. To get the size correctly, class="plot" is required in the widget div
		// modern browsers can observe the resize
		if (typeof ResizeObserver != "undefined"){
			var observer = new ResizeObserver(function(entries, observer){
				if ($(entries[0].target).width() > 10 && $(entries[0].target).height() > 0 ) {
					that.element.css('width', '100%');
					that.chart.resize();
					observer.disconnect();
				}
			})  
			observer.observe(that.element[0]); 
		} else {
			// 	for legacy browsers we use the events for pageshow, popups and collapsible expand 
			this.element.css('width', '100%');
			$(document).one('pageshow popupbeforeposition', function() {that.chart.resize()});
			this.element.parents('[data-role="collapsible"][data-collapsed="true"]').one('collapsibleexpand', function() {that.chart.resize()});
		}
	},
	
	
	getColorSet: function(){
		var rules = window.getComputedStyle(document.body);
		var ret = [];
		for (var i = 0; i < 9; i++)
			ret.push(rules.getPropertyValue('--plot-color-' + i));
		return ret			
	},
	
	// get axis styles from computed CSS styles. axis line color can be given by paranmeter
	getAxisStyles: function(ycolor) {
		var rules = window.getComputedStyle(document.body);
		return {
			axisLine: {lineStyle: {color: ycolor || rules.getPropertyValue('--plot-axis')}},
			axisLabel: {color: rules.getPropertyValue('--plot-axis-labels')},
			axisTick: {lineStyle: {color: rules.getPropertyValue('--plot-tick')}},
			nameTextStyle: {color: rules.getPropertyValue('--plot-axis-title')},
			splitLine: {show: true, lineStyle: {color: rules.getPropertyValue('--plot-grid-line')}}
		}
	},
	
	_changeColorScheme: function(){
   		var rules = window.getComputedStyle(document.body);
		this.chart.setOption( {
	        title: { textStyle: {color: rules.getPropertyValue('--plot-title')}, subtextStyle: {color: rules.getPropertyValue('--plot-subtitle')} },
			xAxis: this.getAxisStyles(),
			yAxis: this.getAxisStyles(),
			color: this.getColorSet(),
			legend: {textStyle: {color: rules.getPropertyValue('--plot-legend-text')}, 
					 inactiveColor: rules.getPropertyValue('--plot-legend-text'), 
					 lineStyle: {inactiveColor: rules.getPropertyValue('--plot-legend-text')}
			},
		//	label: {color: rules.getPropertyValue('--plot-data-label') }   testen!
		});
	}

}),

// ----- plot.comfortchart ----------------------------------------------------
$.widget("sv.plot_comfortchart", $.sv.plot_echarts, {

    initSelector: 'div[data-widget="plot.comfortchart"]',

    options: {
        label: '',
        axis: ''
    },

    _create: function() {
        this._super();

        var label = String(this.options.label).explode();
        var axis = String(this.options.axis).explode();
        var plots = Array();

        plots[0] = {
            type: 'line', name: label[0], lineStyle: {width: 0}, areaStyle: {}, showSymbol: false, z: 1,
            data: [
                [17, 35],
                [16, 75],
                [17, 85],
                [21, 80],
                [25, 60],
                [27, 35],
                [25, 19],
                [20, 20],
                [17, 35]
            ]
        };
        plots[1] = {
            type: 'line', name: label[1], lineStyle: {width: 0}, areaStyle: {}, showSymbol: false, z: 2,
            data: [
                [17, 75],
                [22.5, 65],
                [25, 33],
                [18.5, 35],
                [17, 75]
            ]
        };

        plots[2] = {
			type: 'line',
            name: 'point',
			symbol: 'circle',
			symbolSize: 15,
			z: 3,
			itemStyle: {borderColor: '#fff'},
			data: [
					[20,50],
			]
        };

        var option = {
            series: plots,
            title: { text: null },
            xAxis: $.extend(true, { type: 'value', min: 10, max: 35, name: axis[0], nameLocation: 'center' }, this.getAxisStyles() ),  // $.extend instead of spread operator (...) for ES5 compatibility
            yAxis: $.extend(true, { type: 'value', min: 0, max: 100, name: axis[1], nameLocation: 'center'}, this.getAxisStyles() ),
			grid: { left: '2%', top: '2%', right: '2%', bottom: '2%' },
			color: this.getColorSet(),
            legend: {
                align: 'left',
                top: 'top',
				icon: 'circle',
				data: [{name: label[0]},{name: label[1]}],
            },
            tooltip: {
				formatter: function(params) {
					return `${params.data[0].transUnit("temp")} / ${params.data[1].transUnit("%")}`;
		        }
            }
       };
		option.yAxis.axisLine.show = true;
		option.yAxis.onZero = false;
		this.chartInit(option);
    },

    _update: function(response) {
        var point = this.chart.getOption().series[2].data;
        if (!response[0] && point) {
            response[0] = point[0];
        }
        if (!response[1] && point) {
            response[1] = point[1];
        }
	  this.chart.setOption({series: [{},{},{data: [[response[0] * 1.0, response[1] * 1.0]] }]})
    },

});


// ----- plot.heatingcurve ----------------------------------------------------
$.widget("sv.plot_heatingcurve", $.sv.plot_echarts, {

    initSelector: 'div[data-widget="plot.heatingcurve"]',

    options: {
        chartOptions: null
    },

    _create: function() {
        this._super();

        var plots = Array();

        plots[0] = {
            type: 'line', lineStyle: {width: 2}, showSymbol: false, z: 1,
            name: 'SOLL-Vorlauftemperatur'
        };

        plots[1] = {
			type: 'line',
            name: 'point',
			symbol: 'diamond',
			symbolSize: 15,
			z: 3,
			itemStyle: {borderColor: '#fff'}
        };

         var option = {
            series: plots,
            title: { text: 'Heizkurve', top: 'top' },
            xAxis: $.extend(true, { type: 'value', min: -30, max: 20, name: 'Außentemperatur', nameLocation: 'center'}, this.getAxisStyles() ),
            yAxis: $.extend(true, { type: 'value', min: 22, max: 34, name: 'Vorlauftemperatur', nameLocation: 'center'}, this.getAxisStyles() ),
			grid: { left: '2%', top: '2%', right: '2%', bottom: '2%' },
			color: this.getColorSet(),
            legend: {
                align: 'left',
                top: '10%',		
				data: [{name: 'SOLL-Vorlauftemperatur'}],
				icon: 'path://M0,6L29,6L29,10L0,10Z', // ECharts has no line w/o Symbol !?! So we need to make our own line. Must be clösed to not disturb the layout!
				itemWidth: 15,
				itemHeight: 3,
            },
            tooltip: {
				trigger: 'axis',
				formatter: function(params) {
					return `${params[0].data[0].transUnit("temp")} / ${params[0].data[1].transUnit("temp")}`;
		        },
            }
       };
		option.yAxis.axisLine.show = true;
		option.yAxis.onZero = false;

		if (this.options.chartOptions)
			$.extend(true, option, this.options.chartOptions);
		this.chartInit(option);
    },

    _update: function(response) {
        var point = this.chart.getOption().series[1].data;
        if (!response[1] && point) {
            response[1] = point[1];
        }
        if (!response[1] && point) {
            response[2] = point[2];
        }
	  this.chart.setOption({series: [{data: JSON.parse(response[0])},{data: [[response[1] * 1.0, response[2] * 1.0]] }]})
    },    

});


// ----- plot.period ----------------------------------------------------------
$.widget("sv.plot_period", $.sv.plot_echarts, {

    initSelector: 'div[data-widget="plot.period"]',

    options: {
        ymin: '',
        ymax: '',
        tmin: '',
        tmax: '',
        label: '',
        color: '',
        exposure: '',
        axis: '',
        zoom: '',
        mode: '',
        unit: '',
        assign: '',
        opposite: '',
        ycolor: '',
        ytype: '',
        chartOptions: null,
		stacking: '',
		stacks: '',
		exportmenu: 0,
		servertime: ''
    },

    allowPartialUpdate: true,
	
    _create: function() {
      this._super();
	  this.baseSeries = [];

      var label    = String(this.options.label).explode();
      var color    = String(this.options.color).explode();
      var exposure = String(this.options.exposure).explode();
      var modes    = String(this.options.mode).explode();
      var units    = String(this.options.unit).explode().map(function(el){return el.replace(';', ',')});
	  var zoom     = this.options.zoom;
      var assign   = this.options.assign ? String(this.options.assign).explode().map(function(el) {return el ? parseInt(el, 10) - 1 : 0}) : [];
      var opposite = this.options.opposite ? String(this.options.opposite).explode() : [];
      var ycolor   = this.options.ycolor ? String(this.options.ycolor).explode() : [];
      var ytype    = this.options.ytype ? String(this.options.ytype).explode() : [];
      var ymin     = this.options.ymin != undefined ? String(this.options.ymin).explode() : [];
      var ymax     = this.options.ymax != undefined ? String(this.options.ymax).explode() : [];
      var stacks   = this.options.stacks ? String(this.options.stacks).explode() : [];
	  
	  // get Styles from the body to retrieve plot color variables
	  var rules = window.getComputedStyle(document.body);
	  
      // === Custom renderer für min/max (columnrange) ===
      function renderMinMax(params, api) {
        var xValue = api.value(0); // time
        var low    = api.value(1); // min
        var high   = api.value(2); // max

        var coordLow  = api.coord([xValue, low]);
        var coordHigh = api.coord([xValue, high]);

        var barWidth = 6; 

        return {
          type: 'rect',
          shape: {
            x: coordLow[0] - barWidth / 2,
            y: coordHigh[1],
            width: barWidth,
            height: coordLow[1] - coordHigh[1]
          },
          style: api.style()
        };
      }

      // === Series ===
      var seriesCount = modes.length;

      for (var i = 0; i < seriesCount; i++) {
        var mode = modes[i];
		var seriesColor =  color[i] || null;
		var stack = (stacks.length-1 >= i ? stacks[i]: stacks[stacks.length-1]);
//			var stackingMode = (stacking[stack] ? stacking[stack] : stacking[0]);
        var exp = exposure[i] ? exposure[i].toLowerCase() : "";
        var sName = label[i] || `Item ${i+1}`;
        var yAxisIndex = assign[i] || 0;
        if(mode == 'minmax' || mode == 'minmaxavg') {
          this.baseSeries.push({
            name: sName + (mode === "minmaxavg" ? " (min/max)" : ""),
            type: "custom",
            renderItem: renderMinMax,
            encode: { x: 0, y: [1, 2] }, // data format: [time, min, max]
            data: [], // reserve for filling up with item update 
            yAxisIndex,
            itemStyle: { color: seriesColor }
          });
        }
        if(mode != 'minmax') {
          var type = exp.includes("column") ? "bar" : "line";
          this.baseSeries.push({
            name: sName,
            type: type,
			symbol: "none",
            data: [],
            smooth: exp.includes("spline"),
            step: exp.includes("stair") ? "start" : false,
            stack: exp.includes("stack") ? "stack_" + String(stack) : null,
            areaStyle: exp.includes("area") ? {} : null,
            itemStyle: { color: seriesColor  },
            yAxisIndex
          });
        }
      }

      // === Y-axes ===
      var numAxis = assign.length > 0 ? Math.max.apply(null, assign) + 1 : 1;
      var yAxis = [];
      for (var i = 0; i < numAxis; i++) {
        var type = ytype[i] || "value";
        var axisObj = $.extend(true, {
          type: (type === "boolean" ? "category" : type === "logarithmic" ? "log" : "value"),
          name: this.options.axis.explode()[i+1] || "",
          min: (ymin[i] ? (isNaN(ymin[i]) ? 0 : Number(ymin[i])) : "dataMin"),
          max: (ymax[i] ? (isNaN(ymax[i]) ? 1 : Number(ymax[i])) : null),
		  position: (opposite[i] && parseInt(opposite[i], 10) > 0) ? "right" : "left",
		}, this.getAxisStyles(ycolor[i]));
		
		axisObj.axisLine.show = true;
		axisObj.axisLine.onZero = false;
        if (type === "boolean")
          axisObj.data = [ymin[i] || 0, ymax[i] || 1];
        yAxis.push(axisObj);
      }

      // === X-axis (time) ===
      var xMin = new Date() - new Date().duration(this.options.tmin);
      var xMax = new Date() - new Date().duration(this.options.tmax);
	  var dayDuration = 24*3600*1000;
	  var timezoneOffset = this.options.servertime == 'yes' ? parseInt(-Number(sv.serverTimezone.offset)/60) + parseInt(window.servertimeoffset/60000 ||0) : new Date().getTimezoneOffset();
	  if (zoom == "day"){
	    xMin -= timezoneOffset * 60000;
        xMin = xMin - xMin % dayDuration + dayDuration + timezoneOffset * 60000;
        xMax = xMin + dayDuration;
        zoom = '';
      }
      var xAxis = $.extend(true, {
        type: "time",
		name: this.options.axis.explode()[0] || "",
        min: xMin,
        max: xMax
	  }, this.getAxisStyles());

      // === Zoom  ===
      var dataZoom = [];
	  var rangeSelectorButtons = [];
	  var that = this;
	  
	  if (this.options.zoom != ''){
        dataZoom.push( {
          type: "inside", 
          throttle: 50, 
          minValueSpan: new Date().duration(zoom).valueOf(), 
          moveOnMouseWheel: false
        });
	    if (this.options.zoom == 'advanced'){
          dataZoom.push( {type: "slider", bottom: "10%" });
	  
	  // range selector buttons for advanced zoom according to time range in chart
        var possibleRangeSelectorButtons = [
            { count: 1, type: 'year', text: '1y', svDuration: '1y' },
            { count: 6, type: 'month', text: '6m', svDuration: '6m' },
            { count: 3, type: 'month', text: '3m', svDuration: '3m' },
            { count: 1, type: 'month', text: '1m', svDuration: '1m' },
            { count: 2, type: 'week', text: '2w', svDuration: '14d' },
            { count: 1, type: 'week', text: '1w', svDuration: '7d' },
            { count: 3, type: 'day', text: '3d', svDuration: '3d' },
            { count: 1, type: 'day', text: '1d', svDuration: '1d' },
            { count: 12, type: 'hour', text: '12h', svDuration: '12h' },
            { count: 6, type: 'hour', text: '6h', svDuration: '6h' },
            { count: 3, type: 'hour', text: '3h', svDuration: '3h' },
            { count: 1, type: 'hour', text: '1h', svDuration: '1h' },
            { count: 30, type: 'minute', text: '30min', svDuration: '30i' },
            { count: 15, type: 'minute', text: '15min', svDuration: '15i' },
            { count: 5, type: 'minute', text: '5min', svDuration: '5i' },
            { count: 1, type: 'minute', text: '1min', svDuration: '1i' },
            { count: 30, type: 'second', text: '30s', svDuration: '30s' },
            { count: 15, type: 'second', text: '15s', svDuration: '15s' },
            { count: 5, type: 'second', text: '5s', svDuration: '5s' },
            { count: 1, type: 'second', text: '1s', svDuration: '1s' },
        ];
        var plotRangeDuration = new Date().duration(this.options.tmin) - new Date().duration(this.options.tmax);
        rangeSelectorButtons = { myAll: { 
          show: true,
          title: "Alles",
          icon: "path://M128 128h768v768H128z",
          onclick: function () {
            that.chart.dispatchAction({
              type: "dataZoom",
              startValue: xMin,
              endValue: xMax
            });
          }
		}}
	  
        $.each(possibleRangeSelectorButtons, function(idx, rangeSelectorButton) {
            if(plotRangeDuration >= new Date().duration(rangeSelectorButton.svDuration) * 1.2){
              rangeSelectorButtons['myRSB_'+ rangeSelectorButton.svDuration] = { 
                show: true,
                title: rangeSelectorButton.svDuration,
                icon: "path://M128 128h768v768H128z",
                onclick: function () {
                  that.chart.dispatchAction({
                    type: "dataZoom",
                    startValue: xMin,
                    endValue: xMin + new Date().duration(rangeSelectorButton.svDuration).valueOf()
                  });
                }
	          };
	        };
            if(Object.keys(rangeSelectorButtons).length > 5)
                return false;
        });
	    }
	  }	  

      // === zoom and export buttons ===
	  var toolbox = {
        orient: "horizontal",
        right: 0,
        top: 0,
        feature: $.extend(true, {}, rangeSelectorButtons, {saveAsImage: {}} )
	  }

      // === Tooltip ===
      var tooltip = {
        trigger: "axis",
        formatter: function(params) {
          var html = params[0].axisValueLabel + "<br/>";
		  var i =0;
          params.forEach(p => {
            if (p.seriesType === "custom") {
              var [time, min, max] = p.data;
              html += `${p.marker}${p.seriesName}: min <b>${min}</b>, max <b>${max} ${units[assign[i] || 0] || ""}</b><br/>`;
			  i++
            } else if (p.seriesIndex == i) {
				var yvalue = Array.isArray(p.data) ? p.data[1] : p.data;
				if (ytype[i] != 'boolean')
					html += `${p.marker}${p.seriesName}: <b>${yvalue} ${units[assign[i] || 0] || ""}</b><br/>`;
				else 
					html += `${p.marker}${p.seriesName}: <b>${yvalue == 0 ? ymin[i] || 0: ymax[i] || 1}</b><br/>`;
			  i++
            }
          });
          return html;
        }
      };

      // === assemble the options  ===
      var option = {
        title: { text: null, textStyle: {color: rules.getPropertyValue('--plot-title')}, subtextStyle: {color: rules.getPropertyValue('--plot-subtitle')} },
		grid: { left: '2%', top: zoom == 'advanced' ? '15%' : '2%', right: '12%', bottom: zoom == 'advanced' ? '32%' : '2%' },
        tooltip,
		toolbox,
        legend: { data: label, 
				  textStyle: {color: rules.getPropertyValue('--plot-legend-text')}, 
				  inactiveColor: rules.getPropertyValue('--plot-legend-text'),
				  lineStyle: {inactiveColor: rules.getPropertyValue('--plot-legend-text')}
				},	  
        xAxis,
        yAxis,
        series: this.baseSeries,
        dataZoom,
		color: this.getColorSet()
      };

      // merge user defined options
      if (this.options.chartOptions) {
		  // add x-axis styles if chartoptiond define more x-axes in base options which can be overridden by this.options.chartsoptions
		  if (this.options.chartOptions.xAxis && this.options.chartOptions.xAxis.length > 1)
			  for (var i= 1; i < this.options.chartOptions.xAxis.length; i++){
				 option.xAxis[i] = this.getAxisStyles(); 
			  };
        $.extend(true, option, this.options.chartOptions);
      }
      //DEBUG: console.log(option)
	  
	  // initialize the chart
	  this.chartInit(option);

	},

    _update: function(response) {
        // response is: [ [ [t1, y1], [t2, y2] ... ], [ [t1, y1], [t2, y2] ... ], ... ]
        // chart instance is available as this.chart. Alternative: echarts.getInstanceByDom(this.element[0])

		var actualDate = new Date();
		var timezoneOffset = actualDate.getTimezoneOffset();

		//echarts does not handle time zones - so no support for servertime right now
		//if (window.servertimeoffset != undefined && window.servertimeoffset != 0 && this.options.servertime == 'yes')
			// timezoneOffset = parseInt(-Number(sv.serverTimezone.offset)/60) + parseInt(window.servertimeoffset/60000);

		// adjust time on all x-axes
		var newXaxis = []
        if (this.options.chartOptions && this.options.chartOptions.xAxis != undefined && typeof this.options.chartOptions.xAxis == 'object' && this.options.chartOptions.xAxis[0].min && this.options.chartOptions.xAxis[0].max){
			for (var i = this.options.chartOptions.xAxis.length - 1; i > -1; i--){
				var xMin = actualDate - new Date().duration(this.options.chartOptions.xAxis[i].min);
				var xMax = actualDate - new Date().duration(this.options.chartOptions.xAxis[i].max);
				newXaxis[i] = { min: xMin, max: xMax }; 
			}
		}
		else {
			var xMin = actualDate - new Date().duration(this.options.tmin);
			var xMax = actualDate - new Date().duration(this.options.tmax);
			var dayDuration = 24*3600*1000;

			if (this.options.zoom == "day") {
			    xMin -= timezoneOffset * 60000;
			    xMin = xMin - xMin % dayDuration + dayDuration + timezoneOffset * 60000;
				xMax = xMin + dayDuration;
			}
			newXaxis = { min: xMin, max: xMax };
		}

        var modes = String(this.options.mode).explode();
        var itemCount = response.length;
		var newSeriesArray = this.baseSeries;

        var seriesIndex = -1;
        for (var i = 0; i < itemCount; i++) {
            var mode = modes.shift();
            seriesIndex++;

            if(mode == 'minmaxavg') {
                mode = 'minmax';
                modes.unshift('avg');
            }
            if(mode == 'minmax') {

                var minValues = response[i];
                var maxValues = response[i+1];
                i++;

                if(!this._memorized_response)
                    this._memorized_response = {};

                if(!this._memorized_response[seriesIndex])
                    this._memorized_response[seriesIndex] = { minValues: undefined, maxValues: undefined };

                if(minValues === undefined)
                    minValues = this._memorized_response[seriesIndex].minValues;
                else
                    this._memorized_response[seriesIndex].minValues = minValues;

                if(maxValues === undefined)
                    maxValues = this._memorized_response[seriesIndex].maxValues;
                else
                    this._memorized_response[seriesIndex].maxValues = maxValues;

                if(minValues === undefined || maxValues === undefined)
                    continue;

                this._memorized_response[seriesIndex] = undefined;
                var values = $.map(minValues, function(value, idx) {
                    var minValue = value[1], maxValue = maxValues[idx][1];
                    if(minValue <= maxValue)
                        return [[ value[0], minValue, maxValue ]];
                    else  // swap values if min > max
                        return [[ value[0], maxValue, minValue ]];
                });

                newSeriesArray[seriesIndex].data = values;
            }
            else if (response[i]) 
				newSeriesArray[seriesIndex].data = response[i];
		
			this.chart.setOption( {xAxis : newXaxis, series: newSeriesArray } );
        }
    },
	
	_changeColorScheme: function(){
        var ycolor   = this.options.ycolor ? String(this.options.ycolor).explode() : [];
		var rules = window.getComputedStyle(document.body);
		var option = this.chart.getOption();

		var xAxis = [];
		for (var i = 0; i < option.xAxis.length; i++)
			xAxis.push(this.getAxisStyles());

		var yAxis = [];
		for (var i = 0; i < option.yAxis.length; i++)
			yAxis.push(this.getAxisStyles(ycolor[i]));
			
		this.chart.setOption( {
	        title: { textStyle: {color: rules.getPropertyValue('--plot-title')}, subtextStyle: {color: rules.getPropertyValue('--plot-subtitle')} },
			xAxis,
			yAxis,
			color: this.getColorSet(),
			legend: {textStyle: {color: rules.getPropertyValue('--plot-legend-text')}, 
					 inactiveColor: rules.getPropertyValue('--plot-legend-text'), 
					 lineStyle: {inactiveColor: rules.getPropertyValue('--plot-legend-text')}
			}
								
		});
	}
});

/**  not yet used
	--plot-legend-text-hover
	--plot-legend-item-hidden
	--plot-markers
	--plot-label 
	--plot-data-labels
	--plot-tooltip-box
	--plot-tooltip-text
	--plot-polar-line
*/

/**
// ----- plot.gauge solid ------------------------------------------------------
$.widget("sv.plot_gauge_", $.sv.widget, {

    initSelector: 'div[data-widget="plot.gauge"][data-mode^="solid"]',

    options: {
        stop: '',
        color: '',
        unit: '',
        label: '',
        axis: '',
        min: '',
        max: '',
        mode: '',
    },

    _create: function() {
        this._super();

        var stop = [];
        if (this.options.stop && this.options.color) {
            var datastop = String(this.options.stop).explode();
            var color = String(this.options.color).explode();

            if (datastop.length == color.length)
            {
                for (var i = 0; i < datastop.length; i++) {
                    stop[i] = [ parseFloat(datastop[i])/100, color[i]]
                }
            }
        }

        var unit = this.options.unit;
        var headline = this.options.label ? this.options.label : null;

        var diff = parseFloat(this.options.min);
        var range = parseFloat(this.options.max) - parseFloat(this.options.min);

        var axis = String(this.options.axis).explode();

        var options = {
            chart: {
                type: 'solidgauge',
                spacing: [0, 0, 5, 0],
                className: 'solidgauge',
				styledMode: true
            },

            title: {
                text: headline,
                verticalAlign: 'middle'
            },

            pane: {
                background: [{
                    outerRadius: '100%',
                    innerRadius: '60%',
                    shape: 'arc'
                }]
            },

            tooltip: {
                enabled: false
            },

            // the value axis
            yAxis: {
                min: 0,
                max: 100,
                stops: stop.length > 0 ? stop : null,
                lineWidth: 0,
                minorTickInterval: null,
                minTickInterval: 1,
                tickAmount: 2,
                labels: {
                    distance: -15,
                    step: 1,
                    enabled: true,
                    formatter: function () { return (((this.value * range) / 100) + diff); }
                }
            },
			
			navigation: {	// options for export context menu
				buttonOptions: {
					enabled: false
				}
			},
			
            plotOptions: {
                solidgauge: {
                    dataLabels: {
                        useHTML: true
                    },
                    stickyTracking: false
                },
            },
			accessibility: {
				enabled: false
			},

            series: [{
                name: headline,
                dataLabels: {
                    formatter: function () { return (((this.y * range) / 100) + diff).transUnit(unit); }
                },
                colorIndex: 99, colorByPoint: false // Workaround for dynamic coloring in styled mode
            }]
        }

        var marginBottom;
        if (this.options.mode == 'solid-half')
        {
            options.chart.margin = [-30, 15, 30, 15];
            options.chart.height = '53%';
            options.pane.startAngle = -90;
            options.pane.endAngle = 90;
            options.pane.size = '140%';
            options.pane.center = ['50%', '100%'];
            options.title.verticalAlign = 'bottom';
            options.yAxis.labels.y = 16;
            options.yAxis.labels.distance = -8;
            options.plotOptions.solidgauge.dataLabels.y = -25;
        }
        else if (this.options.mode == 'solid-cshape')
        {
            options.chart.margin = [25, 15, -25, 15];
            options.chart.height = '75%';
            options.pane.startAngle = -130;
            options.pane.endAngle = 130;
            options.pane.size = '100%';
            options.pane.center = ['50%', '50%'];
            options.yAxis.labels.y = 20;
            options.plotOptions.solidgauge.dataLabels.y = -15;
        }
        else if (this.options.mode == 'solid-circle')
        {
            options.chart.margin = [0, 15, 0, 15],
            options.chart.height = '88%';
            options.pane.startAngle = 0;
            options.pane.endAngle = 360;
            options.pane.center = ['50%', '50%'];
            options.pane.background.shape = 'circle';
            options.yAxis.labels.y = -20;
            options.yAxis.labels.step = 2;
            options.plotOptions.solidgauge.dataLabels.y = -10;
        }
        options.title.y = options.plotOptions.solidgauge.dataLabels.y + options.chart.margin[0];

        this.element.highcharts(options);
    },

    _update: function(response) {
        if (response) {
            var diff = parseFloat(this.options.min);
            var range = parseFloat(this.options.max) - parseFloat(this.options.min);
            var percent = (((response - diff) * 100) / range);
            var chart = this.element.highcharts();
            if(chart.series[0].points[0])
                chart.series[0].points[0].update(percent, true);
            else
                chart.series[0].addPoint(percent, true);
        }
    },

});


// ----- plot.gauge angular ----------------------------------------------------
$.widget("sv.plot_gauge_angular", $.sv.widget, {

    initSelector: 'div[data-widget="plot.gauge"][data-mode="speedometer"], div[data-widget="plot.gauge"][data-mode="scale"]',

    options: {
        stop: '',
        color: '',
        unit: '',
        label: '',
        axis: '',
        min: '',
        max: '',
        mode: '',
    },

    _create: function() {
        this._super();

        var headline = this.options.label ? this.options.label : null;
        var unit = this.options.unit;
        var axis = String(this.options.axis).explode();
        var mode = this.options.mode;
        var datastop = String(this.options.stop).explode();
        var color = String(this.options.color).explode();

        var diff = parseFloat(this.options.min);
        var range = parseFloat(this.options.max - this.options.min);
//      var percent = (((response - diff) * 100) / range);
        var percent = 0;

        var styles = [];

        var yaxis = [];
        var gauge = [];
        var pane = [];
        var series = [];


        for (var i = 0; i < this.items.length; i++) {
            if (mode == 'scale') { // type = scale
                var bands = [{
                        outerRadius: '99%',
                        thickness: 15,
                        from: percent,
                        to: 100
                    }];

                if (datastop.length > 0 && color.length > 1)
                {
                    for (var j = 0; j < datastop.length; j++) {
                        bands.push({
                            outerRadius: '99%',
                            thickness: 15,
                            from: j == 0 ? 0 : parseFloat(datastop[j-1]),
                            to: Math.min(parseFloat(datastop[j]), percent)
                        });
                        if(parseFloat(datastop[j]) >= percent)
                            break;
                    }
                    for (var j = 0; j < color.length; j++) {
                        if(color[j] != '')
                            styles.push(".highcharts-plot-band:nth-of-type(" + (j + 2) + ") { fill: " + color[j] + "; fill-opacity: 1; }");
                    }

                }
                else {
                    bands.push({
                        outerRadius: '99%',
                        thickness: 15,
                        from: 0,
                        to: percent,
                    });
                    if(color.length > 0)
                        styles.push(".highcharts-plot-band { fill: " + color[0] + "; fill-opacity: 1; }");
                }


                yaxis[i] = {
                    min: 0,
                    max: 100,
                    minorTickInterval: 1.5,
                    minorTickLength: 17,
                    minorTickPosition: 'inside',
                    minTickInterval: 1,
                    labels: {
                        enabled: true,
                        distance: -25,
                        formatter: function () {return (((this.value * range) / 100) + diff)}
                    },
                    plotBands: bands,
                    title: {
                        text: axis[i],
                        y: 14
                    }
                }
                gauge[i] = {
                    dial: {
                        radius: '100%',
                        baseWidth: 3,
                        topWidth: 3,
                        baseLength: '90%', // of radius
                        rearLength: '-70%'
                    },
                    pivot: {
                        radius: 0
                    }
                }
                pane[i] = {
                    startAngle: -130,
                    endAngle: 130,
                    background: [{
                        outerRadius: '108%'
                    }]
                }
                series[i] = {
                    name: headline,
                    yAxis: i,
                    dataLabels: {
                        formatter: function () {return (((this.y * range) / 100) + diff).transUnit(unit)},
                        y: -20
                    },
                    tooltip: {
                        enabled: false
                    }
                }
            }
            else // type = speedometer
            {
                var bands = [];
                if (this.options.stop && this.options.color) {
                    for (var j = 0; j < datastop.length; j++) {
                        bands.push({
                            from: j == 0 ? 0 : parseFloat(datastop[j-1]),
                            to: parseFloat(datastop[j])
                        });
                    }
                    for (var j = 0; j < color.length; j++) {
                        if(color[j] != '')
                            styles.push(".highcharts-plot-band:nth-of-type(" + (j + 1) + ") { fill: " + color[j] + "; fill-opacity: 1; }");
                    }
                }

                yaxis[i] = {
                    min: 0,
                    max: 100,
                    minorTickInterval: 'auto',
                    minorTickLength: 10,
                    minorTickPosition: 'inside',
                    minTickInterval: 1,
                    tickPixelInterval: 30,
                    tickPosition: 'inside',
                    tickLength: 10,
                    labels: {
                        step: 2,
                        rotation: 'auto',
                        formatter: function () {return (((this.value * range) / 100) + diff)}
                    },
                    title: {
                        text: axis[i]
                    },
                    plotBands: bands.length > 0 ? bands : null
                }
                gauge[i] = {
                }
                pane[i] = {
                    startAngle: -150,
                    endAngle: 150,
                    size: "95%",
                    background: [{
                        className: 'outer-pane',
                        outerRadius: '109%'
                    }, {
                        className: 'middle-pane',
                        outerRadius: '107%'
                    }, {
                    }, {
                        className: 'inner-pane',
                        outerRadius: '105%',
                        innerRadius: '103%'
                    }]
                }

                series[i] = {
                    name: headline,
                    yAxis: i,
                    dataLabels: {
                        formatter: function () {return (((this.y * range) / 100) + diff).transUnit(unit)}
                    }
                }
            }
        }

        this.element.highcharts({
            chart: {
                type: 'gauge',
                plotShadow: false,
                height: '100%',
				styledMode: true
            },
            title: {
                text: headline
            },
            navigation: {	// options for export context menu
				buttonOptions: {
					enabled: false
				}
			},
			plotOptions: {
                 gauge: gauge[0],
            },
            pane: pane,
            tooltip: {
                enabled: false
            },
            defs: {
                speedometerOuterPaneGradient: {
                    id: 'speedometerOuterPaneGradient',
                    tagName: 'linearGradient',
                    x1: 0, y1: 0, x2: 0, y2: 1,
                    children: [
                        { tagName: 'stop', offset: 0 },
                        { tagName: 'stop', offset: 1 },
                    ]
                },
                speedometerMiddlePaneGradient: {
                    id: 'speedometerMiddlePaneGradient',
                    tagName: 'linearGradient',
                    x1: 0, y1: 0, x2: 0, y2: 1,
                    children: [
                        { tagName: 'stop', offset: 0 },
                        { tagName: 'stop', offset: 1 },
                    ]
                }
            },
			accessibility: {
				enabled: false
			},
            // the value axis
            yAxis: yaxis,
            series: series
        });

        styles.push('.outer-pane { fill: url(' + document.baseURI + '#speedometerOuterPaneGradient) }');
        styles.push('.middle-pane { fill: url(' + document.baseURI + '#speedometerMiddlePaneGradient) }');

        if(styles.length > 0) {
            var containerId = this.element.find('.highcharts-container')[0].id;
            styles.unshift('<style type="text/css">');
            $(styles.join("\n#" + containerId + " ") + "\n</style>").appendTo(this.element.find('.highcharts-container'));
        }
    },

    _update: function(response) {
        //debug: console.log("[plot.gauge-speedometer] '" + this.id + "' point: " + response);

        var diff = (this.options.max - (this.options.max - this.options.min));
        var range = this.options.max - this.options.min;
        var datastop = String(this.options.stop).explode();
        var color = String(this.options.color).explode();

        var data = [];
        var items = this.items;
        for (i = 0; i < items.length; i++) {
            if (response[i]) {
                data[i] = (((+response[i] - diff) * 100) / range);
            }
            else
            {
                data[i] = (((+widget.get(items[i]) - diff) * 100) / range);
            }
        }

        var chart = this.element.highcharts();

        for (i = 0; i < data.length; i++) {
            var percent = data[i];
            if(this.options.mode == 'scale')
            {
                chart.yAxis[i].removePlotBand();
                chart.yAxis[i].addPlotBand({
                        outerRadius: '99%',
                        thickness: 15,
                        from: percent,
                        to: 100
                    });
                if (datastop.length > 0 && color.length > 1)
                {
                    for (var j = 0; j < datastop.length; j++) {
                        chart.yAxis[i].addPlotBand({
                            outerRadius: '99%',
                            thickness: 15,
                            from: j == 0 ? 0 : parseFloat(datastop[j-1]),
                            to: Math.min(parseFloat(datastop[j]), percent)
                        });
                        if(parseFloat(datastop[j]) >= percent)
                            break;
                    }
                }
                else {
                    chart.yAxis[i].addPlotBand({
                        outerRadius: '99%',
                        thickness: 15,
                        from: 0,
                        to: percent
                    });
                }
                chart.series[i].setData([percent], false);
            }
            else {
                if(chart.series[0].points[0])
                    chart.series[0].points[0].update(percent, false);
                else
                    chart.series[0].addPoint(percent, false);
            }
        }
        chart.redraw();
    },

});


// ----- plot.gauge-vumeter ----------------------------------------------------------
$.widget("sv.plot_gauge_vumeter", $.sv.widget, {

    initSelector: 'div[data-widget="plot.gauge"][data-mode="vumeter"]',

    options: {
        stop: '',
        color: '',
        unit: '',
        label: '',
        axis: '',
        min: '',
        max: '',
        mode: '',
    },

    _create: function() {
        this._super();

        var headline = this.options.label ? this.options.label : null;
        var chartHeight = this.options.label == '' ? 150 : 200;

        var diff = parseFloat(this.options.min);
        var range = parseFloat(this.options.max) - parseFloat(this.options.min);

        var styles = [];

        var bands = [];
        if (this.options.stop && this.options.color) {
            var datastop = String(this.options.stop).explode();
            var color = String(this.options.color).explode();

            for (var j = 0; j < datastop.length; j++) {
                bands.push({
                    from: j == 0 ? 0 : parseFloat(datastop[j-1]),
                    to: parseFloat(datastop[j]),
                    innerRadius: '100%',
                    outerRadius: '105%'
                });
            }
            for (var j = 0; j < color.length; j++) {
                styles.push(".highcharts-plot-band:nth-of-type(" + (j + 1) + ") { fill: " + (color[j] != '' ? color[j] : 'transparent') + "; fill-opacity: 1; }");
            }
        }

        var axis = [];
        var pane = [];
        var series = [];

        var seriesCount = this.items.length;

        for (i = 0; i < seriesCount; i++) {
            axis[i] = {
                min: 0,
                max: 100,
                minorTickPosition: 'outside',
                tickPosition: 'outside',
                labels: {
                    rotation: 'auto',
                    distance: 20,
                    formatter: function () {return (((this.value * range) / 100) + diff)}
                },
                plotBands: bands,
                pane: i,
                title: {
                    text: 'VU<br/><span style="font-size:8px">Channel ' + (i+1) + '</span>',
                    y: -40
                }
            }
            pane[i] = {
                startAngle: -45,
                endAngle: 45,
                background: null,
                center: [(100/seriesCount/2*(2*i+1))+'%', '145%'],
                size: 280
            }
            series[i] = {
                name: 'Channel ' + i,
                yAxis: i
            }
        }

        this.element.highcharts({
            chart: {
                type: 'gauge',
                height: chartHeight,
				styledMode: true
            },

            title: {
                text: headline,
            },

            pane: pane,

            tooltip: {
                enabled: false,
            },

            // the value axis
            yAxis: axis,
			
			navigation: {	// options for export context menu
				buttonOptions: {
					enabled: false
				}
			},
            plotOptions: {
                gauge: {
                    dataLabels: {
                        enabled: false
                    },
                    dial: {
                        radius: '100%'
                    }
                }
            },
            defs: {
                vumeterGradient: {
                    id: 'vumeterGradient',
                    tagName: 'linearGradient',
                    x1: 0, y1: 0, x2: 0, y2: 1,
                    children: [
                        { tagName: 'stop', offset: 0 },
                        { tagName: 'stop', offset: 0.3 },
                        { tagName: 'stop', offset: 1 },
                    ]
                }
            },
			accessibility: {
				enabled: false
			},
            series: series,
        });
        styles.push('.highcharts-plot-background { fill: url(' + document.baseURI + '#vumeterGradient) }');

        if(styles.length > 0) {
            var containerId = this.element.find('.highcharts-container')[0].id;
            styles.unshift('<style type="text/css">');
            $(styles.join("\n#" + containerId + " ") + "\n</style>").appendTo(this.element.find('.highcharts-container'));
        }
    },

    _update: function(response) {
        //debug: console.log("[plot.gauge-vumeter] '" + this.id + "' point: " + response);

        var diff = (this.options.max - (this.options.max - this.options.min));
        var range = this.options.max - this.options.min;

        var data = [];
        var items = this.items;
        for (i = 0; i < items.length; i++) {
            if (response[i]) {
                data[i] = (((+response[i] - diff) * 100) / range);
            }
            else
            {
                data[i] = (((+widget.get(items[i]) - diff) * 100) / range);
            }
        }

        var chart = this.element.highcharts();
        for (i = 0; i < data.length; i++) {
            if(chart.series[i].points[0])
                chart.series[i].points[0].update(data[i], false);
            else
                chart.series[i].addPoint(data[i], false);
        }
        chart.redraw();
    },

}); */


// ----- plot.gauge ----------------------------------------------------------
$.widget("sv.plot_gauge_echarts", $.sv.plot_echarts, {

    initSelector: 'div[data-widget="plot.gauge"]',

    options: {
      stop: '',
      color: '',
      unit: '',
      label: '',
      axis: '',
      min: 0,
      max: 100,
      mode: 'solid-circle' // solid-circle, solid-half, solid-cshape, speedometer, scale, vumeter
    },

    _create: function() {
      this._super(); 
	  
	  this.element.css('width', '10%');
	  this.element.css('height', '400px');

      // helper: parse stop/color pairs -> array of [pct, color] where pct is in 0..1
      var stops = [];
      if (this.options.stop && this.options.color) {
        var ds = String(this.options.stop).explode();
        var cs = String(this.options.color).explode();
        for (var i = 0; i < ds.length; i++) {
          var v = parseFloat(ds[i]);
          if (!isNaN(v)) stops.push([ Math.max(0, Math.min(1, v/100)), cs[i] ]);
        }
      }

      // get palette / axis styles from parent methods if available
      var palette = this.getColorSet();
      var axisStyle = this.getAxisStyles();

      // build base option depending on mode
      var opt = {
        title: { text: this.options.label || '', left: 'center', top: 8 },
        tooltip: { show: !!this.options.unit, formatter: function (p) { return (p.seriesName ? p.seriesName + '<br/>' : '') + (p.value != null ? p.value + ' ' + (p.series && p.series.unit || '') : ''); } },
        series: []
      };

      var min = Number(this.options.min) || 0;
      var max = Number(this.options.max);
      if (isNaN(max)) max = min + 100;

      // helper: convert value -> percent(0..100)
      var toPercent = function(v){
        v = Number(v);
        if (isNaN(v)) return 0;
        var p = ((v - min) / (max - min)) * 100;
        return Math.max(0, Math.min(100, p));
      };

      var unit = this.options.unit || '';

      // build stop color array for ECharts gauge axisLine: [[pct, color], ...]
      var axisColors = [];
      if (stops.length) {
        // ECharts expects [[fraction, color], ...] with fractions cumulative from 0..1
        axisColors = stops.slice();
        // ensure there is a final color to cover remainder (use last color or transparent)
        var last = axisColors[axisColors.length - 1];
        if (last[0] < 1) axisColors.push([1, last[1]]);
      } else {
        // default: use palette if available
        if (palette && palette.length) {
          axisColors = [[1, palette[0]]];
        } else {
          axisColors = [[1, '#91c7ae']];
        }
      }

      // MODE handling
      var mode = this.options.mode || 'solid-circle';

      if (mode.indexOf('solid') === 0) {
        // solid gauges: circle / half / cshape
        var startAngle = 90;
        var endAngle = -270; // full circle by default in ECharts gauge is 225..-45 but we'll use start/end via series.startAngle
        var center = ['50%', '50%'];
        var radius = '85%';
        var angleOffset = 0;

        if (mode === 'solid-half') {
          // half: -90 .. 90 (left to right)
          startAngle = 180;
          // ECharts gauge uses clockwise angles: startAngle=180 show half circle downwards -> we can use startAngle and endAngle via progress shape
          // We'll approximate by using startAngle and split axisLine visual.
          center = ['50%', '75%'];
          radius = '95%';
          angleOffset = -90;
        } else if (mode === 'solid-cshape') {
          // c-shape: approx -130 .. 130 -> set startAngle=230 (or -130)
          angleOffset = -130;
          center = ['50%', '55%'];
          radius = '95%';
        } else if (mode === 'solid-circle') {
          angleOffset = 90; // full circle center
          center = ['50%', '50%'];
          radius = '85%';
        }

        // Single gauge series using ECharts gauge type
        opt.series.push({
          name: this.options.label || '',
          type: 'gauge',
          radius: radius,
          center: center,
          startAngle: angleOffset + 0,
          endAngle: angleOffset - 360,
          min: 0,
          max: 100,
          splitNumber: 10,
          axisLine: {
            lineStyle: {
              width: Math.round(parseInt(radius,10) || 80) * 0.12, // approximate thickness
              color: axisColors
            }
          },
          axisTick: { show: false },
          splitLine: { length: 10, lineStyle: { color: axisStyle && axisStyle.axis || '#999' } },
          axisLabel: { distance: 5, color: axisStyle && axisStyle.label || '#333' },
          pointer: { width: 6 },
          detail: { formatter: '{value} ' + unit, fontSize: 14 },
          data: [ { value: 0, name: this.options.label || '' } ],
          // keep unit info for tooltip
          unit: unit
        });

      } else if (mode === 'speedometer' || mode === 'scale') {
        // speedometer/scale: use gauge with narrower arc and custom axisLine segments
        var sStart = mode === 'scale' ? -130 : -150;
        var sEnd = mode === 'scale' ? 130 : 150;
        opt.series.push({
          name: this.options.label || '',
          type: 'gauge',
          radius: '90%',
          center: ['50%', '60%'],
          startAngle: sStart,
          endAngle: sEnd,
          min: 0, max: 100,
          splitNumber: 10,
          axisLine: {
            lineStyle: { width: 14, color: axisColors }
          },
          axisTick: { length: 10, lineStyle: { color: axisStyle && axisStyle.axis || '#999' } },
          splitLine: { length: 14, lineStyle: { color: axisStyle && axisStyle.axis || '#999' } },
          axisLabel: { color: axisStyle && axisStyle.label || '#333' },
          pointer: { width: 4, length: '70%' },
          detail: { formatter: '{value} ' + unit, offsetCenter: [0, '60%'] },
          data: [ { value: 0, name: this.options.label || '' } ],
          unit: unit
        });

      } else if (mode === 'vumeter') {
        // VU-Meter: multiple small gauges side-by-side
        // items count — try to reuse this.items if defined (like your Highcharts code)
        var channels = (this.items && this.items.length) ? this.items.length : 2;
        // compute center positions horizontally
        for (var c = 0; c < channels; c++) {
          var cx = (100 / channels) * (0.5 + c) + '%';
          opt.series.push({
            name: 'Channel ' + (c+1),
            type: 'gauge',
            center: [cx, '75%'],
            radius: '55%',
            startAngle: -45,
            endAngle: 45,
            min: 0, max: 100,
            splitNumber: 10,
            axisLine: { lineStyle: { width: 10, color: axisColors } },
            axisTick: { show: false },
            splitLine: { length: 8 },
            axisLabel: { distance: 10, formatter: function(v){ return v; } },
            pointer: { length: '60%', width: 6 },
            detail: { formatter: function(v){ return ''; }, show: false },
            data: [ { value: 0, name: 'VU' } ],
            unit: unit
          });
        }
      } else {
        // fallback: simple gauge
        opt.series.push({
          name: this.options.label || '',
          type: 'gauge',
          min: 0, max: 100,
          data: [ { value: 0, name: this.options.label || '' } ],
          unit: unit
        });
      }

      // store helpers on instance for update
      this._gaugeHelpers = {
        toPercent: toPercent,
        min: min,
        max: max
      };

       this.chartInit(opt);
    },

    _update: function(response) {
      // response can be single number or array (for VU)
      if (!this.chart) return;
      var helpers = this._gaugeHelpers || {};
      var toPercent = helpers.toPercent;
      var chart = this.chart || echarts.getInstanceByDom(this.element[0]);
      if (!chart) return;

      var mode = this.options.mode || 'solid-circle';

      if (mode === 'vumeter') {
        // expect array or scalar
        var values = [];
        if ($.isArray(response)) values = response;
        else if (typeof response === 'number') values = [response];
        else if (response && typeof response === 'object') {
          // maybe object of channels
          for (var k in response) { if (response.hasOwnProperty(k)) values.push(response[k]); }
        }

        // update each series individually (limit to series length)
        var sLen = chart.getOption().series.length;
        for (var i = 0; i < sLen; i++) {
          var raw = values[i] !== undefined ? values[i] : 0;
          var pct = toPercent(raw);
          chart.setOption({
            series: [{ id: chart.getOption().series[i].id || null, data: [{ value: Math.round(pct) }] , center: chart.getOption().series[i].center }]
          }, false);
          // direct dispatch to set value might be done with chart.setOption in batch
        }
        chart.resize(); // ensure redraw
      } else {
        // single gauge (first series)
        var rawValue = ( $.isArray(response) ? response[0] : response );
        if (rawValue === undefined || rawValue === null) return;
        var pct = toPercent(rawValue);
        // set series[0].data[0].value
        chart.setOption({
          series: [{ data: [{ value: Math.round(pct) }] }]
        }, false);
        chart.resize();
      }
    },

    _destroy: function() {
      // dispose chart if created directly
      if (this.chart) {
        try { this.chart.dispose(); } catch(e) {}
        this.chart = null;
      }
      this._super();
    }

  });


// ----- plot.pie --------------------------------------------------------------
$.widget("sv.plot_pie", $.sv.plot_echarts, {

    initSelector: 'div[data-widget="plot.pie"]',

    options: {
        label: '',
        mode: '',
        color: '',
        text: '',
    },

    _create: function() {
        this._super();

		var rules = window.getComputedStyle(document.body);
        var isLabel = false;
        var isLegend = false;
        var labels = [];
        if (this.options.label) {
            labels = String(this.options.label).explode();
            isLabel = true;
        }
        if (this.options.mode == 'legend') {
            isLegend = true;
            isLabel = false;
        }
        else if (this.options.mode == 'none')
            isLabel = false;

        var color = [];
        if (this.options.color)
            color = String(this.options.color).explode();

        // design
        var headline = this.options.text;
        var position = 'top';
        if (this.options.text == '') {
            position = 'bottom';
        }

        // draw the plot
        var option = {
            legend: {
				show: isLegend,
                align: 'left',
				icon: 'circle',
                bottom: 'bottom'
            },
			title: {
                text: headline,
				top: position
            },
            tooltip: {
                formatter: function(params) {
					return `${params.data.name}: <b>${params.data.value.transUnit("%")}</b>`;
                },
            },
			xAxis: {show: false},
			yAxis: {show: false},
			grid: { left: '2%', top: '2%', right: '2%', bottom: '2%' },
			color: color.length > 0 ? color : this.getColorSet(),
			series: [{
                name: headline,
				type: 'pie',
				radius: [0, '75%'],
				label: {
					show: isLabel,
					color: rules.getPropertyValue('--plot-data-labels') 
				},
            }],
			
        };
		this.chartInit(option);

    },

    _update: function(response) {
        var val = 0;
        var data = [];
        var items = this.items;
        for (i = 0; i < items.length; i++) {
            if (response[i]) 
                val = val +  +response[i];
            else
                val = val +  +widget.get(items[i]);
        }
        for (i = 0; i < items.length; i++) {
            if (response[i])
                data[i] = +response[i] * 100 / val;
            else
                data[i] = +widget.get(items[i]) * 100 / val;
        }

		var labels = [];
        if (this.options.label) 
            labels = String(this.options.label).explode();

		var newSeries = [];
        for (i = 0; i < data.length; i++) {
			newSeries.push({value: data[i], name: labels[i]})
			}
        
		this.chart.setOption({series: [{data: newSeries}]});
    },
	
	_changeColorScheme: function(){
   		var rules = window.getComputedStyle(document.body);
		var color = [];
        if (this.options.color) {
            color = String(this.options.color).explode();
        }
		this.chart.setOption( {
	        title: { textStyle: {color: rules.getPropertyValue('--plot-title')}, subtextStyle: {color: rules.getPropertyValue('--plot-subtitle')} },
			xAxis: this.getAxisStyles(),
			yAxis: this.getAxisStyles(),
			color: this.getColorSet(),
			legend: {textStyle: {color: rules.getPropertyValue('--plot-legend-text')}, 
					 inactiveColor: rules.getPropertyValue('--plot-legend-text'), 
					 lineStyle: {inactiveColor: rules.getPropertyValue('--plot-legend-text')}
			},
			series: {
				color: color.length > 0 ? color: this.getColorSet(),
				label: {color: rules.getPropertyValue('--plot-data-labels') } 
			}
		});
	}

});


// ----- plot.rtr -------------------------------------------------------------
$.widget("sv.plot_rtr", $.sv.plot_echarts, {

    initSelector: 'div[data-widget="plot.rtr"]',

    options: {
        label: '',
        axis: '',
        min: null,
        max: null,
        tmin: '',
        tmax: '',
        count: 100,
        stateMax: null,
		servertime: '',
		chartOptions: null,
    },

    allowPartialUpdate: true,

    _create: function() {
        this._super();
		this.baseSeries = []

        var label = String(this.options.label).explode();
        var axis = String(this.options.axis).explode();

        this.baseSeries = [
                {
                    name: label[0], type: 'line', symbol: "none",
					data: [],
					smooth: true,
                },
                {
                    name: label[1], type: 'line', symbol: 'none', step: 'left',
					data: []
                },
                {
                    type: 'pie',
                    data: [
                        {
                            name: 'On'//, y: percent
                        },
                        {
                            name: 'Off', color: null//, y: (100 - percent)
                        }
                    ],
                    center: ['90%', '75%'],
                    radius: [0, '20%'],
					legend: {show: false},
                    label: {show: false},
                    tooltip: {trigger: 'item'}
                }
            ];
		
		
		// set up options object
        var option = {
            title: { text: null },
            legend: {
                align: 'left',
                top: 'top',
				data: label,
				icon: 'path://M0,6L29,6L29,10L0,10Z', // ECharts has no line w/o Symbol !?! So we need to make our own line. Must be clösed to not disturb the layout!
				itemWidth: 15,
				itemHeight: 3,
            },
			grid: { left: '2%', top: '2%', right: '12%', bottom: '2%' },
            series: this.baseSeries,
            xAxis: $.extend({type: 'time', min: new Date() - new Date().duration(this.options.tmin), max: new Date() - new Date().duration(this.options.tmax)}, this.getAxisStyles()),
            yAxis: $.extend({min: this.options.min, max: this.options.max, name: axis[1], nameLocation: 'center', axisLine: {show: true, onZero: false}}, this.getAxisStyles()),
 			tooltip: {
				data: label,
				trigger: 'axis',
				triggerOn: 'mousemove|click',
				formatter: function (params) {
					// formatter for pie
					if (!Array.isArray(params))
						return `∑ ${params.data.name}: <b>${params.data.value.transUnit("%")}</b>`;
					
					// formatter for lines
					var html = params[0].axisValueLabel + "<br/>";
					params.forEach(p => {
						if (p.seriesType != 'pie') {
							var yvalue = Array.isArray(p.data) ? p.data[1] : p.data;
							html += `${p.marker}${p.seriesName}: <b>${yvalue}</b><br/>`;
						}
					});
					return html;
				}
            },
			color: this.getColorSet()
        };
		
		// combine chart options with options defined in widget chartOptions parameter
		$.extend(true, option, this.options.chartOptions);

		// draw the plot
		this.chartInit(option);
    },

    _update: function(response) {
        // response is: {{ gad_actual }}, {{ gad_set }}, {{ gat_state }}

        var count = this.options.count;
        if (count < 1)
            count = 100;

        var xMin = new Date() - new Date().duration(this.options.tmin)
		var xMax = new Date() - new Date().duration(this.options.tmax);

		var newSeries = this.baseSeries;
        for (var i = 0; i < response.length; i++) {
            if (response[i] && i <= 1 && response[i] != undefined) 
                newSeries[i].data = response[i];
            else if (response[i] && i == 2 && response[i] != undefined) {
                var state = response[i];
                var percent = 0, stateMax = 1;
                if(state.length == 1)
                    percent = state[0][1] <= 1 ? state[0][1] : 1;
                else {
                    // calculate state: diff between timestamps in relation to duration
                    for (var j = 1; j < state.length; j++) {
                        var value = state[j - 1][1];
                        percent += value * (state[j][0] - state[j - 1][0]);
                        if(value > 100) // any value is > 100
                            stateMax = 255;
                        if(stateMax == 1 && value > 1) // any value is > 1 and none is > 100
                            stateMax = 100;
                    }
                    percent = percent / (state[state.length-1][0] - state[0][0]);
                }

                if (!isNaN(this.options.stateMax) && Number(this.options.stateMax) != 0)
                    stateMax = Number(this.options.stateMax);

                percent = percent * 100 / stateMax;
				newSeries[i].data[0].value = percent;
				newSeries[i].data[1].value = 100 - percent;
            }
        };
        this.chart.setOption( {xAxis: {min: xMin, max: xMax}, series: newSeries} );
    },

});


// ----- plot.temprose --------------------------------------------------------
$.widget("sv.plot_temprose", $.sv.plot_echarts, {

    initSelector: 'div[data-widget="plot.temprose"]',

    options: {
        label: '',
        axis: '',
        count: '',
        unit: '',
    },

    allowPartialUpdate: true,
	

    _create: function() {
        this._super();

        var label = String(this.options.label).explode();
        var axis = String(this.options.axis).explode();
        var count = parseInt(this.options.count);
        var unit = this.options.unit;

		var rules = window.getComputedStyle(document.body);
        this.baseSeries = [];
        this.baseSeries[0] = {name: label[0], type: 'radar', colorBy: 'series', symbol: 'none', data: [[]]};

        if (this.items.length > count)
            this.baseSeries[1] = {name: label[1], type: 'radar', colorBy: 'series', symbol: 'none', data: [[]]};

		var indicator = [];
		for (var i = 0; i < count; i++) {
			indicator.push({name: axis[i], min: 15, max: 25, axisLabel:{show: i == 0 ? true : false}});
		}

        var option= {
            title: { text: null },
			grid: { left: '2%', top: '2%', right: '12%', bottom: '2%' },
			radar: $.extend({
				indicator,
				radius: '75%',
				axisName: {color: rules.getPropertyValue('--plot-axis-title')},
				splitArea: {show: false},
				splitNumber: 4,
				}, this.getAxisStyles()),
            series: this.baseSeries,
//            tooltip: {}, getting single points is not working in Echarts on radar plots since info on hovered indicator (axis) is missing. Github issues not solved.
			color: this.getColorSet(),
			legend: {
				data: label, 
                bottom: 'bottom',
				icon: 'path://M0,6L29,6L29,10L0,10Z',
				itemWidth: 15,
				itemHeight: 3,
                align: 'left',
				textStyle: {color: rules.getPropertyValue('--plot-legend-text')}, 
				inactiveColor: rules.getPropertyValue('--plot-legend-text'), 
				lineStyle: {inactiveColor: rules.getPropertyValue('--plot-legend-text')}
            },
        };
		this.chartInit(option);
    },

    _update: function(response) {
        // response is: {{ gad_actual_1, gad_actual_2, gad_actual_3, gad_set_1, gad_set_2, gad_set_3 }}

        var count = parseInt(this.options.count);
        var itemCount = this.items.length;
		var newSeries = this.baseSeries;
		var testArray = [];
		
		// get Arrays of series data
        for(var i = 0; i < itemCount; i++) {
            if(response[i] === undefined)
                continue;

            newSeries[i < count ? 0 : 1].data[0][i % count] = response[i] * 1.0;
        }
		// make a deep copy of the data 
		testArray = JSON.parse(JSON.stringify(newSeries[0].data[0]));
		if (newSeries.length == 2)
			testArray = testArray.concat(JSON.parse(JSON.stringify(newSeries[1].data[0]))); 

		// Adapt axes scaling if necessary
		var indicator = this.chart.getOption().radar[0].indicator;
		var min = parseInt(Math.min.apply(Math, testArray));
		min = min - min % 5;
		var max = Math.max.apply(Math, testArray);
		max = max + 5 - max % 5;
		for (var i = 0; i < count; i++){
			indicator[i].max = max;
			indicator[i].min = min;
		}

		this.chart.setOption({radar: {indicator}, series: newSeries});
    },
	
	_changeColorScheme: function(){
   		var rules = window.getComputedStyle(document.body);
		this.chart.setOption( {
	        title: { textStyle: {color: rules.getPropertyValue('--plot-title')}, subtextStyle: {color: rules.getPropertyValue('--plot-subtitle')} },
			color: this.getColorSet(),
			radar: $.extend({axisName: {color: rules.getPropertyValue('--plot-axis-title')}}, this.getAxisStyles()),
			legend: {textStyle: {color: rules.getPropertyValue('--plot-legend-text')}, 
					 inactiveColor: rules.getPropertyValue('--plot-legend-text'), 
					 lineStyle: {inactiveColor: rules.getPropertyValue('--plot-legend-text')}
			},
		//	label: {color: rules.getPropertyValue('--plot-data-label') }   testen!
		});
	}

});


// ----- plot.xyplot ----------------------------------------------------------
$.widget("sv.plot_xyplot", $.sv.plot_echarts, {

    initSelector: 'div[data-widget="plot.xyplot"]',

    options: {
        ymin: '',
        ymax: '',
        xmin: '',
        xmax: '',
        label: '',
        color: '',
        exposure: '',
        axis: '',
        zoom: '',
        mode: '',
        unit: '',
        assign: '',
        opposite: '',
        ycolor: '',
        ytype: '',
        chartOptions: null,
		stacking: '',
		stacks: '',
		exportmenu: 0
    },

    allowPartialUpdate: true,

    _create: function() {
        this._super();

		this.baseSeries = [];

		var label    = String(this.options.label).explode();
		var color    = String(this.options.color).explode();
		var exposure = String(this.options.exposure).explode();
		var units    = String(this.options.unit).explode().map(function(el){return el.replace(';', ',')}); // restore format strings
		var zoom     = this.options.zoom;
		var assign   = this.options.assign ? String(this.options.assign).explode().map(function(el) {return el ? parseInt(el, 10) - 1 : 0}) : [];
		var opposite = this.options.opposite ? String(this.options.opposite).explode() : [];
		var ycolor   = this.options.ycolor ? String(this.options.ycolor).explode() : [];
		var ytype    = this.options.ytype ? String(this.options.ytype).explode() : [];
		var xmin     = this.options.xmin != undefined ? this.options.xmin : null;
		var xmax     = this.options.xmax != undefined ? this.options.xmax : null;
		var ymin     = this.options.ymin != undefined ? String(this.options.ymin).explode() : [];
		var ymax     = this.options.ymax != undefined ? String(this.options.ymax).explode() : [];
		var stacks   = this.options.stacks ? String(this.options.stacks).explode() : [];

		// get Styles from the body to retrieve plot color variables
		var rules = window.getComputedStyle(document.body);

		// === Series ===
		var seriesCount = this.items.length;

		for (var i = 0; i < seriesCount; i++) {
			var seriesColor =  color[i] || null;
			var stack = (stacks.length-1 >= i ? stacks[i]: stacks[stacks.length-1]);
			// var stackingMode = (stacking[stack] ? stacking[stack] : stacking[0]);
			var exp = exposure[i] ? exposure[i].toLowerCase() : "";
			var sName = label[i] || `Item ${i+1}`;
			var yAxisIndex = assign[i] || 0;
			var type = exp.includes("column") ? "bar" : "line";
			this.baseSeries.push({
				name: sName,
				type: type,
				symbol: "none",
				data: [],
				smooth: exp.includes("spline"),
				step: exp.includes("stair") ? "start" : false,
				stack: exp.includes("stack") ? "stack_" + String(stack) : null,
				areaStyle: exp.includes("area") ? {} : null,
				itemStyle: { color: seriesColor },
				yAxisIndex
			});
		};

		// === Y-axes ===
		var numAxis = assign.length > 0 ? Math.max.apply(null, assign) + 1 : 1;
		var yAxis = [];
		for (var i = 0; i < numAxis; i++) {
			var type = ytype[i] || "value";
			var axisObj = $.extend(true, {
				type: (type === "boolean" ? "category" : type === "logarithmic" ? "log" : "value"),
				name: this.options.axis.explode()[i+1] || "",
				min: (ymin[i] ? (isNaN(ymin[i]) ? 0 : Number(ymin[i])) : "dataMin"),
				max: (ymax[i] ? (isNaN(ymax[i]) ? 1 : Number(ymax[i])) : null),
				position: (opposite[i] && parseInt(opposite[i], 10) > 0) ? "right" : "left",
			}, this.getAxisStyles(ycolor[i]));

			axisObj.axisLine.show = true;
			axisObj.axisLine.onZero = false;
			if (type === "boolean")
				axisObj.data = [ymin[i] || 0, ymax[i] || 1];
			yAxis.push(axisObj);
		};

	// === X-axis (value) ===
	var xAxis = $.extend(true, {
		type: "value",
		name: this.options.axis.explode()[0] || "",
		min: xmin,
		max: xmax
	}, this.getAxisStyles());


		// === zoom and export buttons ===
		var toolbox = {
			orient: "horizontal",
			right: 0,
			top: 0,
			feature: {saveAsImage: {}}
		}

		// === Tooltip ===
		var tooltip = {
			trigger: "axis",
			formatter: function(params) {
				var html = params[0].axisValueLabel + "<br/>";
				var i =0;
				params.forEach(p => {
					if (p.seriesIndex == i) {
						var yvalue = Array.isArray(p.data) ? p.data[1] : p.data;
						if (ytype[i] != 'boolean')
							html += `${p.marker}${p.seriesName}: <b>${yvalue} ${units[assign[i] || 0] || ""}</b><br/>`;
						else 
							html += `${p.marker}${p.seriesName}: <b>${yvalue == 0 ? ymin[i] || 0: ymax[i] || 1}</b><br/>`;
						i++
					}
				});
				return html;
			}
		};

		// === assemble the options  ===
		var option = {
			title: { text: null, textStyle: {color: rules.getPropertyValue('--plot-title')}, subtextStyle: {color: rules.getPropertyValue('--plot-subtitle')} },
			grid: { left: '2%', top: zoom == 'advanced' ? '15%' : '2%', right: '12%', bottom: zoom == 'advanced' ? '32%' : '2%' },
			tooltip,
			toolbox,
			legend: { data: label, 
					  textStyle: {color: rules.getPropertyValue('--plot-legend-text')}, 
					  inactiveColor: rules.getPropertyValue('--plot-legend-text'),
					  lineStyle: {inactiveColor: rules.getPropertyValue('--plot-legend-text')}
					},	  
			xAxis,
			yAxis,
			series: this.baseSeries,
			//dataZoom,
			color: this.getColorSet()
		};

		// merge user defined options
		if (this.options.chartOptions) {
			// add x-axis styles if chartoptiond define more x-axes in base options which can be overridden by this.options.chartsoptions
			if (this.options.chartOptions.xAxis && this.options.chartOptions.xAxis.length > 1)
				for (var i= 1; i < this.options.chartOptions.xAxis.length; i++){
					option.xAxis[i] = this.getAxisStyles(); 
				};
			$.extend(true, option, this.options.chartOptions);
		}
		//DEBUG: console.log(option)

		// initialize the chart
		this.chartInit(option);

    },

    _update: function(response) {
        // response is: [ [ [x1, y1], [x2, y2] ... ], [ [x1, y1], [x2, y2] ... ], ... ]

		var xmin     = this.options.xmin != undefined ? this.options.xmin : null;
		var xmax     = this.options.xmax != undefined ? this.options.xmax : null;
		
		var newSeriesArray = this.baseSeries;
        var itemCount = response.length;
        for (var i = 0; i < itemCount; i++) {
			if (response[i])
				newSeriesArray[i].data = response[i];
        }
				
		this.chart.setOption( {xAxis : {min: xmin, max: xmax}, series: newSeriesArray } );
    },

	_changeColorScheme: function(){
		var ycolor   = this.options.ycolor ? String(this.options.ycolor).explode() : [];
		var rules = window.getComputedStyle(document.body);
		var option = this.chart.getOption();

		var xAxis = [];
		for (var i = 0; i < option.xAxis.length; i++)
			xAxis.push(this.getAxisStyles());

		var yAxis = [];
		for (var i = 0; i < option.yAxis.length; i++)
			yAxis.push(this.getAxisStyles(ycolor[i]));
			
		this.chart.setOption( {
			title: { textStyle: {color: rules.getPropertyValue('--plot-title')}, subtextStyle: {color: rules.getPropertyValue('--plot-subtitle')} },
			xAxis,
			yAxis,
			color: this.getColorSet(),
			legend: {
				textStyle: {color: rules.getPropertyValue('--plot-legend-text')}, 
				inactiveColor: rules.getPropertyValue('--plot-legend-text'), 
				lineStyle: {inactiveColor: rules.getPropertyValue('--plot-legend-text')}
			}
		});
	}
});

// ----- plot.timeshift -----------------------------------------------------------
$.widget("sv.plot_timeshift", $.sv.widget, {

	initSelector: '[data-widget="plot.timeshift"]',

	options: {
		bind: null,
		step: null,
		zoom: 0
	},
	
	delta: null,
	mem_tmin: null,
	mem_tmax: null,

	_update: function(response) {
	},

	_events: {
	'click': function (event) {
		event.preventDefault();
		event.stopPropagation();
		var step = this.options.step;
		var direction =  ($(event.target).closest('a').hasClass('timeshift-back')) ?  ' ' :  ' -'; 
		var tmin = $('#'+this.options.bind).attr('data-tmin');
		var tmax = $('#'+this.options.bind).attr('data-tmax');
		if (this.delta == null){
			this.mem_tmin = tmin;
			this.mem_tmax = tmax;
		}

		io.stopseries($('#'+this.options.bind));
		
		this.delta = this.delta == null ? direction + step : this.delta + direction + step;
		this.delta = this.delta.replace(' '+ step + ' -' + step, '').replace(' -'+ step + ' ' + step, '');
		tmin = this.mem_tmin + this.delta;
		tmax = ($('#'+this.options.bind).attr('data-zoom') == 'day') ? this.mem_tmax : this.mem_tmax + this.delta;
		$('#'+this.options.bind).attr('data-tmin', tmin);
		$('#'+this.options.bind).attr('data-tmax', tmax);
		var that = $('#'+this.options.bind).data().svWidget;
		that.options.tmin = tmin;
		that.options.tmax = tmax; 

		var plot = '';
		var items = $('#'+this.options.bind).attr('data-item').split(/,\s*/);
		for (var i = 0; i < items.length; i++) {
			var definition = widget.parseseries(items[i]);
			that.items[i] =  definition.item + '.' + definition.mode + '.' + tmin + '.' + tmax + '.'  + definition.count;
			plot = plot + (i >0 ? ',' : '') + that.items[i];
		}
		$('#'+this.options.bind).attr('data-item', plot)
		that.options.item = plot;

		io.startseries($('#'+this.options.bind));
	}
}
});


// ----- plot.bargraph --------------------------------------------------------------
$.widget("sv.plot_bargraph", $.sv.plot_echarts, {

    initSelector: 'div[data-widget="plot.bargraph"]',

    options: {
        xlabel: '',
        color: '',
		ymin: '',
		ymax: '',
		yaxis: '',
        text: '',
        mode: '',
		unit: '',
		datalabel: 'off',
		datalabelcolor: '',
		chartOptions: null
    },

    _create: function() {
        this._super();

		var rules = window.getComputedStyle(document.body);
        var ymin = this.options.ymin || null;
        var ymax = this.options.ymax || null;
        var xlabels = String(this.options.xlabel).explode();
        var color = String(this.options.color).explode();
        var axisName = this.options.yaxis;
        var mode = this.options.mode;
        var unit = this.options.unit.replace(';', ',');		// restore format strings
		
        var color = [];
        if (this.options.color) 
			color = String(this.options.color).explode();

        var chartTitle = this.options.text;
		var valueAxis = {
				type: 'value',
				show: true,
				min: ymin,
				max: ymax,
				name: axisName
		};
		var categoryAxis = {
				show: true,
				type: 'category',
				data: xlabels
		};
		var xAxis = mode == 'vertical' ? categoryAxis : valueAxis;
		var yAxis = mode == 'vertical' ? valueAxis : categoryAxis;
		
        // draw the plot
        var option = {
			legend: {
				show: false,
            },
			title: {
                text: chartTitle,
				top: 'top'
            },
            tooltip: {
                formatter: function(params) {
					return `${params.name}: <b>${params.value.transUnit("%")}</b>`;
                },
            },
			xAxis,
			yAxis,
			grid: { left: '2%', top: chartTitle == '' ? '2%' : '12%', right: '2%', bottom: '2%' },
			color: color.length > 0 ? color : this.getColorSet(),
			series: [{
				type: 'bar',
				colorBy: 'data',
				label: {
					show: this.options.datalabel != 'off',
					position: this.options.datalabel == 'inside' ? 'inside' : mode == 'horizontal' ? 'right' : 'top',
				}
            }],
        };
		$.extend(true, option, this.options.chartOptions);
		this.chartInit(option);

    },

    _update: function(response) {
		var datalabelcolor = [];	
		if (this.options.datalabelcolor) 
			datalabelcolor = String(this.options.datalabelcolor).explode();
        var data = [];
        var items = this.items;
        for (i = 0; i < items.length; i++) {
            if (response[i])
                data[i] = {value: response[i], label: datalabelcolor == undefined ? null : {color: datalabelcolor [i]}};
            else
                data[i] = {value: widget.get(items[i]), label: datalabelcolor == undefined ? null : {color: datalabelcolor [i]}} ;
        }

   		this.chart.setOption({series: [{data: data}]});

    },

});