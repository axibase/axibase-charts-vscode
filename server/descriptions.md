## addmeta  
  
## aheadtimespan  
  
Show an amount of time ahead of the last series value.  
Define in percent.  
  
## alertexpression  
  
Apply separate alert rules to several series with one `alert-style` in `[widget]` settings.  
  
## alertrowstyle  
  
## alertstyle  
  
Vertex style upon breach of `alert-expression` condition.  
  
## alias  
  
Create a unique series designation to pass data to other series.  
  
## align  
  
Determine a uniform start time for all periods.  
Possible values: `START_TIME`, `END_TIME`, `CALENDAR`(default), `FIRST_VALUE_TIME`.  
  
## arcs  
  
## arrowlength  
  
Length of the gauge arrow, measured as `%` of radius.  
  
## arrows  
  
Arrows on the directed edges.  
  
## attribute  
  
Use as an alternative to `metric` setting.  
If both `table` and `attribute` are defined, `metric = table,attribute`.  
  
## audioalert  
  
Play an audio file when `alert-expression` evaluates to `true`.  
Store audio files in the `opt/atsd/atsd/conf/portal` directory of your ATSD installation.  
Set the following path in the `audio-alert` setting: `/portal/resource/alarm.oog`.  
Files in this directory must always be references with the `/resource/` before the file name.  
Audio is only played on `true` to `false` changes or vise versa.  
Audio is played once, on initial alert occurrence.  
Supported audio alert formats: `.mp3`, `.oog`, `.wav`.  
  
## audioonload  
  
Play audio alert on initial widget load if `audio-alert` setting contains path to audio file and `audio-onload = true`.  
  
## author  
  
## autoheight  
  
Calculate row height automatically based on vertical space allocated to the widget and the number of rows.  
  
## autopadding  
  
Add padding if labels overflow container.  
  
## autoperiod  
  
Automatically define the aggregation period for the series based on the chosen time interval.  
  
## autoscale  
  
Automatically scale the visible portion of the graph.  
  
## axis  
  
Assign series axis.  
  
## axistitle  
  
Label axes.  
  
## axistitleleft  
  
Label left axis.  
  
## axistitleright  
  
Label right axis.  
  
## barcount  
  
Number of bars or distributions.  
Alternatively control bar count from mouseover menu in the upper right corner of the widget.  
  
## batchsize  
  
Maximum number of series in one batch request to the server.  
If `0` is specified, the limit is not set.  
Applies when `batch-update = true`.  
  
## batchupdate  
  
Sending data queries to the server in batches with size specified in `batch-size` setting.  
If enabled, series for which the request has failed are requested separately from successfully updated series.  
  
## borderwidth  
  
Offset between gauge ring and parent container,measured as `%` of radius.  
  
## bottomaxis  
  
Values displayed on the bottom axis.  
  
## bundle  
  
Hierarchical contraction of edges ([Danny Holten](https://www.researchgate.net/publication/6715561_Hierarchical_Edge_Bundles_Visualization_of_Adjacency_Relations_in_Hierarchical_Data) algorithm).  
  
## bundled  
  
Hierarchical contraction of edges ([Danny Holten](https://www.researchgate.net/publication/6715561_Hierarchical_Edge_Bundles_Visualization_of_Adjacency_Relations_in_Hierarchical_Data) algorithm).  
  
## buttons  
  
Add buttons to the widget header. The buttons are visible on mouse-over.  
`update` stops/resumes the loading of new data into the widget.  
`reset` is supported only in the table widget. The parameter resets column sorting to the initial order.  
  
## cache  
  
Retrieve the most recent value from the HBase **Last Insert** table.  
This setting is useful for widget which only display one value: Gauge, Bar, Text, Treemap, etc.  
  
## capitalize  
  
Capitalize column names. Default: `true`.  
  
## caption  
  
Text displayed on top of the gauge.  
Caption can be split into multiple lines.  
HTML markup is supported.  
  
## captionstyle  
  
CSS style applied to caption.  
  
## case  
  
Define case for column headers.  
  
## centralizecolumns  
  
Position columns between ticks instead of directly above ticks.  
  
## centralizeticks  
  
Position time and date markers between instead of under ticks.  
  
## changefield  
  
Widget setting changed upon drop-down list selection. To update the widget subsection setting, use `{section-name}.{setting-name}` syntax. For example, `series.entity` or `keys.mq_manager_name`.  
  
## circle  
  
Displays background circle.  
  
## class  
  
Apply Unix style with black background.  
  
## collapsible  

## columnalertexpression  
  
Boolean expression to apply conditional style to bars. The CSS style must be specified in the `column-alert-style` setting.
The `value` field contains the total of all series in the given bar.  
  
## columnalertstyle  
  
CSS style applied to the bar rectangle if `column-alert-expression` is `true`.  
  
## columnlabelformat  
  
Column label pattern containing text and placeholders.
Supported placeholders: `entity`, `metric`, `tagName`, `tagValue`, `tags.{tag-name}`, `statistics`, `period`.  
  
## columnentity  
  
Change the name of column `entity` in the [Table](../streaming-table/README.md), [Property](../property-table/README.md), and [Console](../alert-console/README.md) widgets.
Hide `column-entity` with `column-entity = null`.  
  
## columnmetric  
  
Change the name of column `metric` in the [Table](../streaming-table/README.md), [Property](../property-table/README.md), and [Console](../alert-console/README.md) widgets.
Hide `column-metric` with `column-metric = null`.  
  
## columns  
  
Comma separated list of column keys to be displayed.  
  
## columntime  
  
Change the name of column `time` in the [Table](../streaming-table/README.md), [Property](../property-table/README.md), and [Console](../alert-console/README.md) widgets.
Hide `column-time` with `column-time = null`.  
  
## columnvalue  
  
Change the name of column `value` in the [Table](../streaming-table/README.md), [Property](../property-table/README.md), and [Console](../alert-console/README.md) widgets.
Hide `column-value` with `column-value = null`.  
  
## color  
  
Assign a color to the series.  
  
## colorrange  
  
Color palette automatically assigned to threshold ranges.  
  
## colors  
  
Redefine default palette.  
Table, Console, Property, Text, and Page widgets do not support this setting.  
Default palette is defined by the array `window.defaultColors`.  
  
## contextheight  
  
Define the height of the context graph. Used to adjust the displayed timespan.  
`0` by default for the widget in the main window.  
`70` by default for the widget in the dialog window.  
  
## contextpath  
  
Context path. Default value is `api/v1`.  
  
## counter  
  
## counterposition  
  
Counter position.  
  
## currentperiodstyle  
  
Apply CSS styles to values of the current period, such as the most recent hour, day, or week, in `column` and `column-stack` mode.  
  
## data  
  
Information about the last time series value next to the image of the corresponding vertex.  
  
## datalabels  
  
Display values inside colored rectangles formatted according to [format](https://axibase.com/docs/charts/widgets/shared/#format) setting.  
  
## datatype  
  
Define current series data type.  
  
## dayformat  
  
Format `x` axis timestamps using Format Syntax.  
  
## defaultcolor  
  
## defaultsize  
  
## depth  
  
Depth of the displayed vertex hierarchy from `1` to the maximum depth of the vertex hierarchy plus `1`  
Final level corresponds to edges  
Maximum depth of the hierarchy is default.  
  
## description  
  
## dialogmaximize  
  
If enabled, the dialog window is expanded to the entire portal page.  
Dialog window can be opened by clicking on the widget header.  
  
## disablealert  
  
Cancel alerts raised by the loaded page.  
  
## disconnectcount  
  
Define average distance between time values in the series  
If the gap between data is greater than the defined value,a break is displayed.  
If `disconnect-count = 1`, the disconnect interval is equal to the mean interval.  
See Disconnect Count Behavior for more information.  
  
## disconnectednodedisplay  
  
Show vertices without edge.  
  
## disconnectinterval  
  
Defines maximum time gap between data during which points of the series line are connected.  
If the gap between data is greater than the specified interval, a break is displayed.  
  
## disconnectvalue  
  
Apply disconnect value in tandem with disconnect interval or count.  
Define the value to be applied to disconnected areas.  
Use this setting when ATSD is not collecting `null` values or those below a minimum threshold.  
Additionally, toggle display of disconnect value with **Connect Values** on left axis mouseover menu.  
  
## display  
  
Define a rule to display series.  
Filter series based on metric values for widgets containing many series.  
  
## displaydate  
  
Display the time period captured by the Time Chart.  
  
## displayinlegend  
  
## displaylabels  
  
## displayother  
  
## displaypanels  
  
Display control panels in the top left or right corners in Time and Bar charts.  
  
## displaytags  
  
Display a separate column for each tag in the underlying series.  
  
## displayticks  
  
Display ticks on the axis.  
  
## displaytip  
  
Display last value marker.  
  
## displaytotal  
  
Displays the sum of rectangle sizes such as `size` setting for series.  
  
## displayvalues  
  
Show or hide bar total values.  
  
## downsample  
  
Enable [downsampling](https://axibase.com/docs/atsd/api/data/series/downsample.html#downsampling) for the current chart configuration.  
  
## downsamplealgorithm  
  
Define [downsample algorithm](https://axibase.com/docs/atsd/api/data/series/downsample.html#algorithm) used for calculation.  
  
## downsampledifference  
  
Define deviation between consecutive values which the database considers equivalent.  
Use this setting to include minor deviations in downsampling.  
  
## downsampleratio  
  
Define downsample [ratio](https://axibase.com/docs/atsd/api/data/series/downsample.html#ratio-check).  
  
## downsamplegap  
  
Control the occurrence of repeated values by defining the gap using time interval.  
A larger gap value decreases the occurrence of repeated values.  
  
## downsampleorder  
  
## duration  
  
The duration of a transaction when changing the geometry of the graph in milliseconds.  
  
## effects  
  
Animation when changing the geometry of the graph.  
  
## emptyrefreshinterval  
  
## emptythreshold  
  
## enabled  
  
Hide series in the widget legend based on expression or boolean statement.  
  
## endtime  
  
Specifies the date and time in local or [ISO format](https://axibase.com/docs/atsd/shared/date-format.html) until which the values for the series are loaded.  
The setting can be overridden by each widget separately.  
Note that `start-time` is **inclusive** and `end-time` is **exclusive**.  
This means that `start-time = 2017-09-14 10:00:00` includes data points that occurred exactly at `10:00:00` and later whereas `end-time = 2017-09-14 11:00:00` includes data points that occurred up to `10:59:59`, excluding points that occurred at `11:00:00`.  
The setting supports [calendar](https://axibase.com/docs/atsd/shared/calendar.html) keywords.  
  
## endworkingminutes  
  
## entities  
  
Define multiple entities with one setting.  
If both `entity` and `entities` are specified, the former takes precedence.  
Support `?` and `*` [wildcards](https://axibase.com/docs/charts/syntax/wildcards.html)|  
  
## entity  
  
Define the Entity.  
Supports `?` and `*` [wildcards](https://axibase.com/docs/charts/syntax/wildcards.html)  
  
## entityexpression  
  
Apply server-side filter to all series based on entity names, tags, and fields.  
  
## entitygroup  
  
Define an Entity Group.  
  
## entitylabel  
  
Override grouped series legend when `group=entity`.  
  
## errorrefreshinterval  
  
Define the wait period after ATSD handles a server processing error before refreshing data.  
  
## exactmatch  
  
Ignore series with tags, other than those specified in the series configuration.  
  
## expand  
  
Expand all segments or an individual segment.  
Double-click modifies `expand` setting interactively.  
  
## expandpanels  
  
Display control panels in the top left or right corners in Time chart.  
  
## expandtags  
  
Show response tags as columns.  
Useful when exact tags are not known in advance.  
  
## expiretimespan  
  
## fillvalue  
  
Interpolates a missing value for the given timestamp when merging multiple series with different timestamps.
Possible values: `false`, `true`.  
  
## filterrange  
  
## fitsvg  
  
## fontscale  
  
Ratio of font height to row height when `auto-height = true`.  
Minimum row height is `10px`, maximum row height is `64px`.  
  
## fontsize  
  
Font size settings as a whole number.  
  
## forecastarimaauto  
  
Generate an ARIMA forecast using optimal settings.
If `true`, ARIMA parameters `p` and `d` are selected automatically based on scoring.
If set to `false`, parameters `p`, `d` are required.
  
## forecastarimaautoregressioninterval  
  
Alternative parameter for `p` where `p` is calculated as `auto-regression-interval / interval`.
Specified as the number of [time units](https://axibase.com/docs/atsd/api/data/series/time-unit.html).
Format: `count time_unit`.  
  
## forecastarimad  
  
Integration parameter `d`, a number of `0` or `1`.  
  
## forecastarimap  
  
Auto-regression parameter `p`.  
  
## forecasthorizoninterval  
  
Generate a forecast for the specified interval into the future starting with last sample of the loaded series.
The interval is specified as the number of [time units](https://axibase.com/docs/atsd/api/data/series/time-unit.html).  
  
## forecasthorizonlength  
  
Generate a forecast for the specified number of samples into the future.  
  
## forecasthorizonendtime  
  
Generate a forecast starting with last sample of the loaded series and until the specified date in the future.  
  
## forecasthorizonstarttime  
  
Generate a forecast for the specified interval into the future starting with specified date instead of the last sample of the loaded series.  
  
## forecasthwauto  
  
Generate a Holt-Winters forecast using optimal settings.
If `true` Holt-Winters parameters `alpha`, `beta`, `gamma` are selected automatically based on scoring.
If set to `false`, parameters `alpha`, `beta`, `gamma` are required.  
  
## forecasthwalpha  
  
Holt-Winters `alpha` (data) parameter.
Possible values: `[0, 1]`.  
  
## forecasthwbeta  
  
Holt-Winters `beta` (trend) parameter.
Possible values: `[0, 1]`.  
  
## forecasthwgamma  
  
Holt-Winters `gamma` (seasonality) parameter.
Possible values: `[0, 1]`.  
  
## forecasthwperiod  
  
Series period (seasonality) parameter.
The interval is specified as the number of [time units](https://axibase.com/docs/atsd/api/data/series/time-unit.html).
Format: `count time_unit`.
  
## forecastinclude  
  
Include input series, forecast or reconstructed series into response.  
  
## forecastname  
  
[Forecast name](https://axibase.com/docs/atsd/api/data/series/query.html#forecast-filter) when `data-type` setting is set to  `forecast`, `forecast_deviation`, `lower_confidence`, `upper_confidence`.
If no forecast name is specified, the [default series forecast](https://axibase.com/docs/atsd/forecasting/#persistence-settings) is loaded.  

## forecastscoreinterval  
  
Interval for scoring the produced forecasts ending with the last sample of the input series.
The interval is specified as the number of [time units](https://axibase.com/docs/atsd/api/data/series/time-unit.html).
Format: `count time_unit`.
For SSA, the default value is the minimum of `forecast-horizon-interval` and `1/3` of the loaded series duration.
For ARIMA and Holt-Winters the default value is `1/4` of the loaded series duration.  
  
## forecastssa  
  
Generate an SSA (singular spectrum analysis) forecast.  
  
## forecastssadecomposeeigentriplelimit  
  
Maximum number of eigenvectors extracted from the trajectory matrix during the singular value decomposition (SVD).
Possible values: between `0` and `500`.
If set to `0`, the count is determined automatically.  
  
## forecastssadecomposemethod  
  
The algorithm applied in singular value decomposition (SVD) of the trajectory matrix to extract eigenvectors.
Possible values: `FULL`, `TRUNCATED`, `AUTO`.  
  
## forecastssadecomposesingularvaluethreshold  
  
Threshold, specified in percent, to discard small eigenvectors. Eigenvector with eigenvalue λ is discarded if √λ is less than the specified % of √ sum of all eigenvalues.
Discard if `√λ ÷ √ (∑ λi) < threshold ÷ 100`.
If threshold is `0`, no vectors are discarded.
Possible values: `[0, 100)`.  
  
## forecastssadecomposewindowlength  
  
Height (row count) of the trajectory matrix, specified as the % of the sample count in the input series.
Possible values: `(0, 50]`.  
  
## forecastssaforecastbase  
  
Input series to which the recurrent formula is applied when calculating the forecast.
Possible values: `RECONSTRUCTED`, `ORIGINAL`.  
  
## forecastssaforecastmethod  
  
Forecast calculation method.
Possible values: `RECURRENT`, `VECTOR`.  
  
## forecastssagroupautocount  
  
Maximum number of eigenvector groups. The eigenvectors are placed into groups by the clustering method in Auto mode, or using by enumerating eigenvector indexes in Manual mode. The groups are sorted by maximum eigenvalue in descending order and are named with letters `A`, `B`, `C` etc.
If set to `0`, only one group is returned.  
  
## forecastssagroupautoclusteringmethod  
  
Algorithm used to place eigenvectors into groups.
Possible values: `HIERARCHICAL`, `XMEANS`, or `NOVOSIBIRSK`.  
  
## forecastssagroupautoclusteringparams  
  
Dictionary (map) of parameters required by given clustering method.  
  
## forecastssagroupautostack  
  
Build groups recursively, starting with the group `A` with maximum eigenvalue, to view the cumulative result of incrementally added eigenvectors. In enabled, group `A` contains its own eigenvectors. Group `B` contains its own eigenvectors as well as eigenvectors from group `A`. Group `C` includes its own eigenvectors as well as eigenvectors from group `A` and `B`, and etc.  
  
## forecastssagroupautounion  
  
Join eigenvectors from automatically created groups into custom groups. Multiple custom groups are separated using comma. Groups within the custom group are enumerated using semi-colon as a separator or hyphen for range. For example, custom group `A;B;D` contains eigenvectors from automatic groups `A`, `B` and `D`. Custom group `A;C-E` contains eigenvectors from automatic groups `A`,`C`,`D`,`E`.  
  
## forecastssagroupmanualgroups  
  
Join eigenvectors using their index into custom groups. Multiple custom groups are separated using comma. Eigenvectors within the same group are enumerated using semi-colon as a separator or hyphen for range. For example, custom group `1;3-6` contains eigenvectors with indexes `1`, `3`, `4`, `5` and `6`.  
  
## forecastssareconstructaveragingfunction  
  
Averaging function to calculate anti-diagonal elements of the reconstructed matrix.
Possible values: `AVG`, `MEDIAN`.  
  
## forecastssareconstructfourier  
  
Use Fourier transform in the reconstruction stage and in SVD (singular value decomposition).  
  
## forecaststyle  
  
CSS styles applied to forecasts in `column` and `column-stack` modes.  
  
## format  
  
Display series with the appropriate unit of measurement.  
See [Format Settings](https://axibase.com/docs/charts/syntax/format-settings.html) for complete syntax.  
  
## formataxis  
  
Value axis format.  
  
## formatcounter  
  
Counter format.  
  
## formatheaders  
  
Disable column name formatting.  
  
## parsenumbers  
  
If `true`, column values are processed as numbers.
  
## formatsize  
  
Format size setting values.  
  
## formattip  
  
Last value format.  
  
## frequency  
  
## gradientcount  
  
Specify the number of gradient colors between each color in Color Range.  
  
## gradientintensity  
  
Color intensity of the first and the last sector in each range.  
  
## groupfirst  
  
Control the sequence of aggregation and grouping. If set to `true`, grouping is performed before aggregation.  
  
## groupinterpolate  
  
Interpolate grouped values.  
  
## groupinterpolateextend  
  
Fill missing leading and trailing periods with `NEXT` and `PREVIOUS` values.  
  
## groupkeys  
  
Count messages by period with a comma-separated list of keys including `entity`, `type`, `source`, and custom tags.  
Supported in server aggregation mode only: `server-aggregate = true`.  
  
## grouplabel  
  
## groupperiod  
  
Assign a group period to a series for computing [group](https://axibase.com/docs/atsd/api/data/series/group.html#group-processor) statistics.  
  
## groupstatistic  
  
Assign a group statistic function to the series.  
See [Aggregators](https://axibase.com/docs/charts/configuration/aggregators.html) for more information.  
  
## headerstyle  
  
Customize widget header style.  
Group diverse portals visually.  
`background-color`: Replace color, retain pattern.  
`background`: Replace both color and pattern.  
`display: none`: Hide header.  
`header-style = return 'background: white;';`: Remove all styles.  
  
## heightunits  
  
Functionality depends on section:

* `[configuration]` - number of rows in the portal. Default value: 4.

* `[widget]` - number of rows the widget occupies. Default value: 1.  
  
## hidden  
  
## hidecolumn  
  
Expression based setting.  
Hide particular columns if all cell values in a column satisfy the condition or if column name matches the pattern.  
  
## hideemptycolumns  
  
Show or hide columns with no data.  
  
## hideemptyseries  
  
Hide series for which no data exists or data whose validity is expired.  
  
## hideifempty  
  
## horizontal  
  
Display bars horizontally.  
  
## horizontalgrid  
  
Hide horizontal grid.  
  
## hourformat  
  
## icon  
  
Name of the icon displayed in the cell.  
  
## iconalertexpression  
  
Apply alert rules to the icon.  
  
## iconalertstyle  
  
Alert styles applied to the icon when the `alert-expression` is satisfied.  
  
## iconcolor  
  
Color of the icon.  
  
## iconposition  
  
Position of the icon relative to the series value.  
  
## iconsize  
  
Automatically resize icons to occupy all available space except the area used by the value and label.  
If `icon-size` is not set, icon is scaled proportionally to the font height which can be controlled using the `min-font-size` and `max-font-size` settings.  
  
## id  
  
Unique name of the vertex.  
  
## interpolate  
  
Interpolate missing aggregation periods.  
  
## interpolateboundary  
  
Define [interpolation behavior](https://axibase.com/docs/atsd/api/data/series/interpolate.html#boundary) for leading and trailing values.  
  
## interpolateextend  
  
Interpolate leading and trailing periods with `NEXT` or `PREVIOUS` values, respectively.  
  
## interpolatefill  
  
Interpolate values outside of the selection interval.  
  
## interpolatefunction  
  
Define interpolation function for entire series, instead of only missing values.  
  
## interpolateperiod  
  
Define the period for interpolated values.  
  
## intervalformat  
  
## join  
  
Performs join by `entity` and `type`.  
`join = entity` performs join by `entity` only.  
  
## key  
  
Key name.  
If set configuration of column can be sorted by name.  
If the name of the key is the property received from the server object, the value of the cell by default is the value of the property.  
  
## keytagexpression  
  
Expression for matching properties with specified keys and tags.  
Keys are accessed with `keys.{key-name}` and tags with `tags.{tag-name}`.  
  
## label  
  
Text on label.  
`element-id` by default.  
  
## labelformat  
  
Label series using text and placeholders.  
See [Label Formating](https://axibase.com/docs/charts/syntax/label-formatting.html#label-formatting).  
  
## last  
  
Return only records with the update time equal to the maximum update time of matched records.  
  
## lastmarker  
  
Hide most recent series value marker.  
  
## lastvaluelabel  
  
## layout  
  
Form of the widget in `non-hierarchy` mode.  
  
## leftaxis  
  
Values displayed on the left-axis.  
`density`: Scales the height of the bars such that the sum of their areas equals `1`.  
`fractions`: Scales the height of the bars such that the sum of their heights equals `1`.  
`frequency`: Scales the height of the bars such that each bar height is equal to the number of observations in the series. Thus, the sum of the heights is equal to the total number of observations  
  
## leftunits  
  
Set absolute offset from the left, in units.  
  
## legendlastvalue  
  
## legendposition  
  
Modify legend locations for widgets which contain a legend.  
By default, legend position is `hidden` in Time Chart.  
Legend position is set to `top` on Dialog Chart.  
Combine values to define corners: `legend-position = bottomright`  
  
## legendticks  
  
## legendvalue  
  
## limit  
  
Maximum number of returned records.  
  
## linearzoom  
  
## linkalertexpression  
  
## linkalertstyle  
  
Style of edges in the event of an `alert-expression` being triggered and tied to the time series.  
  
## linkanimate  
  
Animation of directed vertices.  
  
## linkcolorrange  
  
Color scheme for `link-threshold`.  
  
## linkcolors  
  
Color to indicate the threshold of time series.  
Attached to the edges and separated by commas.  
  
## linkdata  
  
Series last value next to the `link-label`.  
  
## linklabels  
  
Display edge labels.  
  
## linklabelzoomthreshold  
  
Parameter value is a value of scale when labels appear based on edge threshold.  
`value < 1`: Labels disappear on zoom out.  
`value > 1`: Labels appear on zoom in.  
  
## links  
  
List of edges associated with this series is defined by an ID or edge ID of the corresponding vertices with a hyphen.  
When edge ID contains a hyphen, it must be shielded with `""` double quotes.  
  
## linkthresholds  
  
Threshold for time series attached to the edges.  
Supports both JavaScript and `percentile` functions.  
  
## linkvalue  
  
## linkwidthorder  
  
Sort links according to their width.  
  
## linkwidths  
  
Width to indicate the thresholds of the time series tied to the edges and separated by commas or spaces.  
  
## loadfuturedata  
  
Load future series values.  
Import forecasts generated by third-party tools such as R language.  
  
## markerformat  
  
## markers  
  
Hide series marker values.  
  
## maxfontsize  
  
Maximum caption font size.  
Font size cannot scale above set size.  
  
## maximum  
  
## maxinserttime  
  
Include series if the timestamp of the latest sample is less than `max-insert-time`, specified as [ISO date](https://axibase.com/docs/atsd/shared/date-format.html), local date, or [calendar expression](https://axibase.com/docs/atsd/shared/calendar.html).  
  
## maxrange  
  
Define maximum range displayed on the left axis.  
Actual range can differ based on loaded data samples.  
  
## maxrangeforce  
  
Apply a forced range to the left axis, regardless of loaded data.  
  
## maxrangeright  
  
Define maximum range displayed on the right axis.  
Actual range can differ based on loaded data samples.  
  
## maxrangerightforce  
  
Apply a forced range to the right axis, regardless of loaded data.  
  
## maxringwidth  
  
The maximum allowed width of the vertex ring from the current minimal value of the ring width.  
  
## maxthreshold  
  
## menu  
  
## mergecolumns  
  
Key by which columns are grouped into rows.  
  
## mergefields  
  
Combine series into series grouped based on field. Applies only in `multiple-series` mode. Series which use [wildcard](https://axibase.com/docs/charts/syntax/wildcards.html), `entities`, `entityGroup` settings or comma-separated tag values are treated as multiple series by default.  
Possible values:  
`entity`: All series with the same entity are combined.  
`{tag-name}`: All series with the same value of tag `{tag-name}` are combined.  
  
## mergeproperties  
  
Merge tags collected with different timestamps.  
  
## messageexpression  
  
Include messages that match a filter [expression](https://axibase.com/docs/atsd/api/meta/expression.html).
The expression can include fields: `type`, `source`, `tags`, `tags.{name}`, `message`,`severity`.
Supported wildcards: `*` and `?`.  
  
## metric  
  
Define the Metric.  
  
## metriclabel  
  
Override grouped series legend when `group=metric`.  
  
## mincaptionsize  
  
## minfontsize  
  
Minimum caption font size.  
Font size cannot scale below set size.  
  
## minimum  
  
## mininserttime  
  
Include series if the timestamp of the latest sample is equal or greater than `min-insert-time`, specified as [ISO date](https://axibase.com/docs/atsd/shared/date-format.html), local date, or [calendar expression](https://axibase.com/docs/atsd/shared/calendar.html).  
  
## minorticks  
  
Number of minor ticks between major ticks.  
  
## minrange  
  
Define minimum range displayed on the left axis.  
Actual range can differ based on loaded data samples.  
  
## minrangeforce  
  
Define strict minimum value of the left or right axis. If the value of a series does not fall within the set boundaries set by these value gaps, the series is not displayed.  
  
## minrangeright  
  
Define minimum range displayed on the right axis.  
Actual range can differ based on loaded data samples.  
  
## minrangerightforce  
  
Apply a forced range to the right axis, regardless of loaded data.  
  
## minringwidth  
  
The minimum allowed width of the vertex ring.  
The value is from `0` to a maximum permissible value of the ring width.  
  
## minseverity  
  
## minthreshold  
  
## mode  
  
Apply mode setting to both or either `[widget]` and `[series]` settings.  
  
## movingaverage  
  
Enable moving average to set aggregation period based on a sliding window ending with the current time.  
Disable moving average to set aggregation period based on calendar.  
  
## multiplecolumn  
  
Applies to [wildcard](https://axibase.com/docs/charts/syntax/wildcards.html#wildcards) series.  
Default value: `false`.  
If `true`, series with the same entity and tags are grouped in the same column.  
This applies to derived series which are placed in the same column alongside the underlying series.  
  
## multipleseries  
  
## negativestyle  
  
Apply CSS styles to negative values of a series in `column` or `column-stack` mode.  
  
## newrowcolor  
  
Highlight left border of recently received rows with the specified color.  
  
## nodealertexpression  
  
## nodealertstyle  
  
Style of vertices, in the event of an `alert-expression` being triggered tied to the time series.  
  
## nodecollapse  
  
Collapse vertex sectors when clicked.  
  
## nodecolors  
  
Color to indicate the threshold of time series that are bound to vertices and separated by commas.  
  
## nodeconnect  
  
Connect vertices on the perimeter.  
  
## nodedata  
  
## nodelabels  
  
Display vertex labels.  
  
## nodelabelzoomthreshold  
  
Parameter value is a value of scale when labels appear based on vertex threshold  
`value < 1`: Labels disappear on zoom out.  
`value > 1`: Labels appear on zoom in.  
  
## noderadius  
  
Radius of the vertex in pixels.  
Not valid in `hierarchy` mode.  
  
## noderadiuses  
  
Radii of the lighting for the display of the time series `thresholds` linked to the vertices and separated by commas or spaces.  
  
## nodes  
  
List of vertices associated with this series.  
When the vertex id contains a hyphen, it must be shielded with `""` double quotes.  
  
## nodethresholds  
  
Threshold for time series tied to vertices.  
Supports JavaScript, `percentile` functions, or can be set as an array.  
  
## nodevalue  
  
## offset  
  
Difference, in milliseconds, between maximum update time of matched records and update time of the current record.  
If the difference exceeds `offset`, the record is excluded from results.  
  
## offsetbottom  
  
## offsetleft  
  
## offsetright  
  
## offsettop  
  
## onchange  
  
If specified, field is evaluated instead of default `onchange` behavior. Either `onchange`, or `change-field` is required for any drop-down list.  
  
## onclick  
  
Set interaction behavior for user click.  
Filter the tables based on the clicked values of a specific column.  
  
## onseriesclick  
  
Specifies an action to be performed when the user selects a series. For a Calendar widget, it is a row of summarization periods.  
  
## onseriesdoubleclick  
  
Disable [double click functionality](https://axibase.com/docs/charts/widgets/pie-chart/#on-series-double-click) in the widget.  
  
## options  
  
Comma-separated list of option values.  
  
## padding  
  
Offset from the edge of the container in pixels.  
  
## paletteticks  
  
Display legend labels.  
  
## parent  
  
ID of parent vertex.  
  
## path  
  
Data API method path. Default value is specific for each data type: `/series/query`, `/properties/query`, `/messages/query`, `/alerts/query`.  
  
## percentilemarkers  
  
Percentiles marker position.  
  
## percentiles  
  
Percentiles displayed when `top-axis = percentiles`.  
Multiple percentiles must be separated with commas.  
  
## period  
  
Define period for [aggregator](https://axibase.com/docs/atsd/api/data/series/aggregate.html#aggregate-processor) functions which require one.  
  
## periods  
  
## pinradius  
  
Radius of the inner circle holding the arrow, measured as `%` of radius.  
  
## pointerposition  
  
Define the location of the final value pointer.  
  
## position  
  
Position of the column relative to other columns in the table.  
  
## primarykey  
  
## principal  
  
## rangemerge  
  
If threshold is not defined, different set of ranges is computed for each series based on observed min and max values within the loaded timespan.  
`range-merge` computes a single set of ranges for all series in the widget by using `min` and `max` for all loaded series.  
  
## rangeoffset  
  
Adds an offset to the left and right of the dataset, set in pixels.  
Inactive by default.  
  
## rangeselectend  
  
## rangeselectstart  
  
## rate  
  
Compute the difference between consecutive sample per unit of time, or [rate period](https://axibase.com/docs/atsd/api/data/series/rate.html#rate-period).  
Compute the underlying rate of change when a metric measures a continuously incrementing counter.  
  
## ratecounter  
  
Compute the difference between consecutive samples per unit of time.  
  
## ratio  
  
## refreshinterval  
  
Define the period in seconds that ATSD waits before refreshing data with new samples.  
  
## replaceunderscore  
  
Replace underscores with whitespace in column names.  
  
## replacevalue  
  
Modify or filter series values.  
The example expression filters all values less than `50` from the series.  
Aggregators are not supported.  
  
## responsive  
  
Adjust font size based on widget dimensions.  
Font size is reduced proportionally to widget size.  
  
## retaintimespan  
  
## retryrefreshinterval  
  
Define the wait period after ATSD receives an empty sample to retry data refresh.  
  
## rightaxis  
  
Values displayed on the right-axis.  
  
## ringwidth  
  
Width of the colored ring area, measured as `%` of radius.  
  
## rotatelegendticks  
  
## rotatepaletteticks  
  
Rotate legend labels.  
  
## rotateticks  
  
Rotate `x` axis labels.  
Set in degrees.  
`true` rotates by `90` degrees.  
  
## rowalertstyle  
  
Styles assigned to the whole row.  
Can be specified as JavaScript code.  
  
## rowstyle  
  
Style assigned to the entire row specified as JavaScript code.  
In the syntax example all alerts with severity less than `7` are hidden.  
Filter data prior display in the widget.  
  
## rule  
  
Name of rule for which alerts are filtered.  
  
## scale  
  
Scales the width and height of the target page.  
Value is the factor by which the page scales.  
  
## scalex  
  
Scale a widget or axis.  
Not supported in all browsers.  
  
## scaley  
  
## script  
  
## selectormode  
  
Controls how pie segments react to click interaction. Possible Settings: highlight, expand. Highlight – double click highlights the selected pie segment, other segments are greyed out. Expand – double click expands the selected pie segment.  

## series
  
## serieslabels  
  
Display values for each pie slice (series) as a tick.  
Set to an expression that changes the label type depending on series value.  
  
## serieslimit  
  
Define the maximum number of series retrieved from the database, to prevent the client or server from processing excessive series.  
  
## seriestype  
  
Use this setting in `stack` mode as a grouping parameter.  
Series of like types are grouped together or summed.  
Set a unique series type to achieve fill effect without applying `stack` mode.  
  
## seriesvalue  
  
## serveraggregate  
  
## severity  
  
Severity rating of alerts displayed in the console:  
Undefined: `0`  
Unknown: `1`  
Normal: `2`  
Warning: `3`  
Minor: `4`  
Critical: `6`  
Fatal: `7`.  
  
## severitystyle  
  
Control alert behavior. Highlight a single column or entire row.  
  
## showtagnames  
  
Display all entity tags.  
Only valid for tables with `tag` column.  
  
## size  
  
The relative size of the series rectangle.  
`1` by default.  
Set to a series value by referring to `alias`.  
Set to the current value of the series using `value`.  
  
## sizename  
  
Title for for `display-total`.  
Displayed after `Total`.  
For example: `Total sum`.  
  
## smooth  
  
Weighted [averaging](https://axibase.com/docs/atsd/api/data/series/smooth.html) function applied to window samples.  
  
## smoothcount  
  
Number of samples in the window.  
  
## smoothfactor  
  
Weighting parameter used by `EMA` function. If specified, must be `>0 and <1`.  
  
## smoothincompletevalue  
  
Sample value returned if the window is not full.  
  
## smoothinterval  
  
Window duration interval.  
  
## smoothminimumcount  
  
Minimum number of samples in the window.  
  
## smoothrange  
  
Weighting parameter used by `EMA` function.  
  
## sort  
  
Sort console based on one or more columns.  
Additional ascending `ASC` or descending `DESC` parameter is accepted.  
  
## source  
  
Specify the source of records.  
  
## stack  
  
Disable series grouping to display each series in a separate column.  
  
## starttime  
  
Specifies the date and time in local or [ISO format](https://axibase.com/docs/atsd/shared/date-format.html) from which the values for the series are loaded.  
The setting can be overridden by each widget separately.  
Note that `start-time` is **inclusive** and `end-time` is **exclusive**.  
This means that `start-time = 2017-09-14 10:00:00` includes data points that occurred exactly at `10:00:00` and later whereas `end-time = 2017-09-14 11:00:00` includes data points that occurred up to `10:59:59`, excluding points that occurred at `11:00:00`.  
The setting supports [calendar](https://axibase.com/docs/atsd/shared/calendar.html) keywords.  
  
## startworkingminutes  
  
## statistic  
  
Apply aggregation statistical functions.  
See [Aggregators](https://axibase.com/docs/charts/configuration/aggregators.html) for more information.  
  
## statistics  
  
## stepline  
  
Connect neighboring samples using a step line instead of one which is linearly interpolated.  
Toggle step line mode by changing `y` axis controls displayed on mouseover.  
  
## style  
  
Render forecast as a solid line instead of dashed line.  
  
## summarizeperiod  
  
Period by which loaded time series data is split.  
  
## summarizestatistic  
  
Statistical function applied to values within each period.  
  
## table  
  
Use as an alternative to `metric` setting.  
If both `table` and `attribute` are defined, `metric = table,attribute`.  
  
## tableheaderstyle  
  
Custom CSS style applied to table header, including a style to hide the header.  
  
## tagexpression  
  
Apply server-side filtering based on [series tags](https://axibase.com/docs/atsd/api/meta/metric/series-tags.html).  
  
## tagoffset  
  
Difference, in milliseconds, between update time of the current record and update time of the tag field.  
If the difference exceeds `tag-offset`, the tag field is excluded from tags object.  
  
## tagsdropdowns  
  
## tagsdropdownsstyle  
  
## tension  
  
The degree curvature of edges.  
Corresponds to the parameter `C` in the formula for the cardinal spline.  
Varies from `0` to `1`, `0` corresponds to straight edges.  
  
## thresholds  
  
Defines the threshold values.  
By default the mean value all metrics for the whole time-span is chosen as the threshold.  
Set to the rate of change (`delta`) of series contained in the widget by referring to `alias`.  
  
## ticks  
  
Number of major ticks on gauge axis.  
  
## ticksright  
  
Control the number of tick marks on the right axis.  
  
## tickstime  
  
Control the number of tick marks on the time (`x`) axis.  
  
## timeoffset  
  
Offset time series day into either the past or future based on sign.  
Compare day from today to the same data from some ago.  
`time-offset > 0`: Offset into the past.  
`time-offset < 0`: Offset into the future.  
Use on either `[widget]` or `[series]` level settings.  
  
## timespan  
  
Define data load interval.  
  
## timezone  
  
Set the time zone for the data being loaded into the portal. Only the `UTC` option is supported.  
If `UTC` is not set, the portal displays dates in the local time zone.  
If `UTC` is set, `start-time` and `end-time` settings specified in local format are evaluated based on the UTC time zone.  
  
## title  
  
## tooltip  
  
Tooltip for the `[other]` section displayed upon mouseover.  
  
## topaxis  
  
Values displayed on the top axis.  
  
## topunits  
  
Set absolute offset from the top, in units.  
  
## totalsize  
  
Maximum size of all rectangles combined  
  
## totalvalue  
  
Define the total value explicitly, otherwise it is computed as the sum of all series values.  
`total-value` can be calculated by referencing other series similar to computed series.  
  
## transformationorder  
  
[`transformation-order`](https://axibase.com/docs/atsd/api/data/series/query.html#transformations) controls the sequence of data modification procedures.
Default sequence: `interpolate`, `group`, `rate`, `aggregate`, `smooth`, `downsample`, `forecast`, `none`.
If set to `none`, the default sequence is used.
If specified, the `server-aggregate` setting is set to `true` by default.  
  
## transpose  
  
Transpose rows and columns for a layout optimized for columnar presentation.  
  
## type  
  
Define widget type.  
  
## unscale  
  
`CSS Selector` to determine unscaled elements in a user-loaded `svg` file.  
  
## updateinterval  
  
Polling interval at which new incremental data is requested from the server by widgets on the portal.  
For example `update-interval = 5 minute`.  
The default value is 1 minute.  
The setting can be overridden by each widget separately.  
Chart updates are disabled if the `endtime` parameter for the portal or the widget is set to a fixed date, for example: `endtime = 2016-06-27T00:00:00Z`.  
  
## url  
  
URL of the ATSD server. The setting is necessary if the data is loaded from an ATSD server running on a different host.  
  
## urlparameters  
  
Optional request parameters included in data API requests.  
Parameter names and values must be URL-encoded if necessary and separated by ampersand. `?` at the start of the query string is optional.  
  
## value  
  
Define series value.  
Retrieve the value of the underlying series identified by alias.  
  
## verticalgrid  
  
Display a vertical line corresponding to each percentile on the top axis.  
  
## widgetsperrow  
  
Use the `widgets-per-row` setting under `[group]` level to control the number of widgets displayed on each row.  
  
## width  
  
Maximum and minimum allowed width of the vertex ring is the percent from the radius of the circle.  
By default, minimum `30%`, maximum `50%`.  
  
## widthunits  
  
Functionality depends on section:

* `[configuration]` - number of columns in the portal. Default value: 6.

* `[widget]` - number of columns the widget occupies. Default value: 1.  
  
## zoomsvg  
  
Zoom the user-loaded `svg` file.  
