import express from "express";
import redis from "redis";

const PORT = process.env.PORT || 5000;
const REDIS_PORT = 6379;

const client = redis.createClient(REDIS_PORT);

const app = express();

const getRepos = async (req, res, next) => {
    try {
        // Connect to redis db
        await client.connect();

        // Query key from db
        const cache = await client.get("public_repos");

        // If key is found in db, return it and close connection
        if (cache) {
            console.log(`From cache: "public_repos": ${cache}`);
            res.status(200).json({ public_repos: cache });
            await client.quit();

            // If key is not found in db, fetch from Github, store in redis db, return response and close connection
        } else {
            const { username } = req.params;
            const response = await fetch(
                `https://api.github.com/users/${username}`
            );

            const data = await response.json();
            const repos = data.public_repos;

            // Save to redis db
            await client.set("public_repos", repos);

            console.log(`From fetch: "public_repos": ${repos}`);
            res.status(200).json({ public_repos: repos });

            await client.quit();
        }
    } catch (error) {
        console.log(error);
        res.status(500);
    }
};
app.get("/", (req, res) => {
    res.status(200).json({ message: "success" });
});
app.get("/repos/:username", getRepos);

app.listen(PORT, () => {
    console.log(`On port: ${PORT}`);
});
