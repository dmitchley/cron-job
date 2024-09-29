const cron = require("node-cron");
const axios = require("axios");
const { db } = require("./db");

// Fetch daily wave data from the API
const fetchDailyWaveData = async () => {
  try {
    const response = await axios.get("http://localhost:5000/api/spots/koelbay");
    if (response.status === 200) {
      return response.data;
    } else {
      console.error("Failed to fetch wave data:", response.status);
      return [];
    }
  } catch (error) {
    console.error("Error fetching wave data:", error);
    return [];
  }
};

// Check if a report for the current day already exists
const checkExistingReport = async (date) => {
  try {
    const result = await db.query(
      `
      SELECT * FROM journal WHERE DATE(time) = $1 AND location = 'Koel Bay'
    `,
      [date]
    );

    return result.rows.length > 0; // Returns true if an entry for today already exists
  } catch (error) {
    console.error("Error checking existing report:", error);
    throw error;
  }
};

const startCronJob = () => {
  cron.schedule("0 0 * * *", async () => {
    try {
      const waveData = await fetchDailyWaveData();

      if (waveData.length > 0) {
        // Get today's date (no time)
        const today = new Date().toISOString().split("T")[0]; // Format YYYY-MM-DD

        const reportExists = await checkExistingReport(today);

        if (reportExists) {
          console.log("Report for today already exists. Skipping insertion.");
          return;
        }

        // If no report exists, insert new wave data
        const query = `
          INSERT INTO journal (text, time, wave, wave_direction, wind_direction, location, user_id)
          VALUES ($1, $2, $3, $4, $5, $6, $7);
        `;

        for (const data of waveData) {
          await db.query(query, [
            "Daily Wave Report",
            new Date(data.timestamp * 1000), // Convert timestamp to date
            data.waveHeight,
            data.waveDirection,
            [Math.random() * 360], // Simulated wind direction for now
            "Koel Bay",
            1, // Assuming user 1
          ]);
        }

        console.log("Daily report saved successfully.");
      } else {
        console.log("No wave data to save.");
      }

      // Delete journal entries older than 5 days
      const deleteQuery = `
        DELETE FROM journal WHERE time < NOW() - INTERVAL '5 days';
      `;
      await db.query(deleteQuery);
      console.log("Old journal entries deleted.");
    } catch (error) {
      console.error("Error during cron job:", error);
    }
  });

  console.log(
    "Cron job started: saving daily reports and cleaning up old data."
  );
};

(async () => {
  startCronJob();
})();
