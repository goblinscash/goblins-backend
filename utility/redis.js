const redis = require("redis");
class RedisHelper {
  constructor() {
    this.client = null;
    //   this.clientInternal = null;
    this.host = global.env?.REDIS_HOST || "localhost:6379";
    this.port = global.env?.REDIS_PORT || 6379;
    this.connectRedis();
  }

  async connectRedis() {
    try {
      const clientData = await redis
        .createClient({
          host: this.host,
          port: this.port,
        })
        .on("error", (err) => console.log("Redis Client Error", err))
        .connect();
      this.client = clientData;
    } catch (e) {
      console.log("Error", e);
      this.client = null;
    }
  }

  async setString(key, value) {
    try {
      if (this.client) {
        let status = await this.client.set(key, value);
        console.log("status", status);
        return (status == "OK" && true) || false;
      } else {
        return false;
      }
    } catch (e) {
      console.log("setstringcatch===>", e);
      return false;
    }
  }

  async getString(key) {
    try {
      if (this.client) {
        let value = await this.client.get(key);

        return value || false;
      } else {
        return false;
      }
    } catch (e) {
      console.log("getstringcatch===>", e);
      return false;
    }
  }

  async delString(key) {
    try {
      if (this.client) {
        let status = await this.client.del(key);
        console.log("status", status);
        return (status == 1 && true) || false;
      } else {
        return false;
      }
    } catch (e) {
      console.log("getstringcatch===>", e);
      return false;
    }
  }
}

module.exports = new RedisHelper();
