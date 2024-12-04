const redisFunc = require("../utility/redis");

setTimeout(() => {
    redisFunc.setStringWithExpiry("xyz", "123123")
}, 1000);

setTimeout(async () => {
    await redisFunc.getString("xyz")
    await redisFunc.getKeys()


}, 2000);

setTimeout(async () => {
    await redisFunc.getString("xyz")

    await redisFunc.getKeys()
}, 7000);