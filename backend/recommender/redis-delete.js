const { createClient } = require("redis");

const client = createClient({
  password: "",
  socket: {
    host: "",
    port: 10601,
  },
});

async function deleteAllCachedData() {
  try {
    await client.connect();
    await client.flushAll();
    console.log("All cached data deleted");
  } catch (error) {
    console.error("Error deleting cached data:", error);
  } finally {
    await client.quit();
  }
}

deleteAllCachedData();
