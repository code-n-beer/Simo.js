const influx = require('influx');

const influxdb = new influx.InfluxDB({
  host: 'influxdb',
  database: 'simo',
  port:8086
});

module.exports = {
    sendMetric: (metricName, value, tags="") => {
        let parsedTags = {}
        if (tags.length > 0){
            tags.split(",").forEach(tag => {
            const parts = tag.split(":")
            const key = parts[0]
            const value = parts[1]
            parsedTags[key] = value
            })
        }

        let fValue = parseFloat(value);
        if (!Number.isNaN(fValue)) {
            influxdb.writePoints([{
                measurement: metricName,
                tags: parsedTags,
                fields: { value: fValue }
            }])
        }
    },
    //getMetric: () => {} # TBA
}
