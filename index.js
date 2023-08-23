require('dotenv').config()
const axios = require("axios");
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = 3000;

app.use(bodyParser.json()); // support json encoded bodies
app.use(express.urlencoded({ extended: true }));

app.get("/bank/", async (req, res) => {
  const options = {
    method: "GET",
    url: "https://banking.sandbox.prometeoapi.com/provider/",
    headers: {
      "X-API-KEY":process.env.PROMETEUS_API_KEY,
    },
  };

  const result = await axios.request(options);
  res.json(result.data.providers);
});
app.get("/bank/:bank", async (req, res) => {
  const bankInfo = req.params["bank"];
  const options = {
    method: "GET",
    url: `https://banking.sandbox.prometeoapi.com/provider/${bankInfo}/`,
    headers: {
      "X-API-KEY":process.env.PROMETEUS_API_KEY,
    },
  };

  const result = await axios.request(options);
  const auth_fields = result.data.provider.auth_fields;
  const logo = result.data.provider.logo;
  const bank = result.data.provider.bank;
  res.json({ bank, auth_fields, logo });
});
app.post("/login", async (req, res) => {
  console.log(req.body);
  const options = {
    method: "POST",
    url: "https://banking.sandbox.prometeoapi.com/login/",
    headers: {
      "X-API-KEY":process.env.PROMETEUS_API_KEY,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    data: { ...req.body },
  };

  const result = await axios.request(options);
  res.json(result.data);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
