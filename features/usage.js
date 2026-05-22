var sys_usage = function(client, channel, from, line) {
    const mem = process.memoryUsage();
    const cpu = process.cpuUsage();
    const heapMB = (mem.heapUsed / 1024 / 1024).toFixed(1);
    const rssMB = (mem.rss / 1024 / 1024).toFixed(1);
    const cpuSecs = ((cpu.user + cpu.system) / 1e6).toFixed(1);
    client.say(channel, `Simo memory: ${heapMB}MB heap, ${rssMB}MB rss, cpu: ${cpuSecs}s`);
}

module.exports = {
    name: "usage",
    commands: {
        "!cpu": sys_usage
    }
}
