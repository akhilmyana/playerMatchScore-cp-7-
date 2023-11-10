const express = require("express");
const app = express();
app.use(express.json());

const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

let db = null;
const dbPath = path.join(__dirname, "cricketMatchDetails.db");

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running");
    });
  } catch (e) {
    console.log(`Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const conSnakeToCamel = (eachPlayer) => {
  return {
    playerId: eachPlayer.player_id,
    playerName: eachPlayer.player_name,
  };
};

app.get("/players/", async (request, response) => {
  const getPlayerDetails = `
    SELECT
      *
    FROM
      player_details`;
  const playerDetails = await db.all(getPlayerDetails);
  response.send(playerDetails.map((eachPlayer) => conSnakeToCamel(eachPlayer)));
});

const returnObj = (player) => {
  return {
    playerId: player.player_id,
    playerName: player.player_name,
  };
};

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getSinglePlayer = `
    SELECT
      *
    FROM
      player_details
    WHERE
      player_id = ${playerId}`;
  const singlePlayerDetails = await db.get(getSinglePlayer);
  response.send(returnObj(singlePlayerDetails));
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updateplayer = `
    UPDATE 
        player_details
    SET
        player_name = ${playerName}
    WHERE
        player_id = ${playerId};`;

  await db.run(updateplayer);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetails = `
    SELECT
        *
    FROM
        match_details
    WHERE
        match_id = ${matchId}`;

  const matchDetails = await db.get(getMatchDetails);
  response.send({
    matchId: matchDetails.match_id,
    match: matchDetails.match,
    year: matchDetails.year,
  });
});

const returnMatchDetails = (eachPlayerMatch) => {
  return {
    matchId: eachPlayerMatch.match_id,
    match: eachPlayerMatch.match,
    year: eachPlayerMatch.year,
  };
};

app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchDetails = `
    SELECT
        *
    FROM
        player_match_score NATURAL JOIN match_details
    WHERE
        player_id = ${playerId}`;

  const playerMatchDetails = await db.all(getPlayerMatchDetails);
  response.send(
    playerMatchDetails.map((eachPlayerMatch) =>
      returnMatchDetails(eachPlayerMatch)
    )
  );
});

const returnPlayerDetails = (eachMatch) => {
  return {
    playerId: eachMatch.player_id,
    playerName: eachMatch.player_name,
  };
};

app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetails = `
    SELECT 
        *
    FROM
        player_details NATURAL JOIN player_match_score
    WHERE
        match_id = ${matchId}`;

  const matchDetails = await db.all(getMatchDetails);
  response.send(
    matchDetails.map((eachMatch) => returnPlayerDetails(eachMatch))
  );
});

const returnStats = (statistics) => {
  return {
    playerId: statistics.player_id,
    playerName: statistics.player_name,
    totalScore: statistics.total_score,
    totalFours: statistics.total_fours,
    totalSixes: statistics.total_sixes,
  };
};

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getStatistics = `
    SELECT
      player_id,
      player_name,
      Sum(score) AS total_score,
      Sum(fours) As total_fours,
      Sum(sixes) AS total_sixes
    FROM
      player_details NATURAL JOIN player_match_score
    WHERE
      player_id = ${playerId}`;

  const statistics = await db.get(getStatistics);
  response.send(returnStats(statistics));
});

module.exports = app;
