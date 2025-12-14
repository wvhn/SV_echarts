# SV_echarts
This repository brings echarts as alternative charting library into smartVISU. It works with smartVISU develop v3.5.a as of 12.12.2025, as well as upcoming v3.6 and above.

# Installation
Copy the files into the smartVISU file atructure. Folders are named accordingly. A download as ZIP archive and extracting into the smartVISU root folder should also work.

# Activation
Open config.ini in smartVISU root folder and add the line
```
plot_library = "echarts"
```

# Current status of development
All plot.\* widgets are available. Gauges are basically working but the design is not OK. This is the next step in development.

**As of now device.uzsugraph is not working with echarts.** (Can be solved by using Highcharts with a special config file. Ask me on Gitter or in the forum.)
