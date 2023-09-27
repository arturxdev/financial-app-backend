require("dotenv").config();
const dayjs = require("dayjs");
const axios = require("axios");
var cors = require("cors");
const express = require("express");
const bodyParser = require("body-parser");
const { createClient } = require("@supabase/supabase-js");
const app = express();
const port = 3000;

app.use(bodyParser.json()); // support json encoded bodies
app.use(cors());
app.use(express.urlencoded({ extended: true }));
const supabaseUrl = "https://xqaccbvyvkbbnmzdwgez.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

app.get("/bank/", async (req, res) => {
  const options = {
    method: "GET",
    url: "https://banking.sandbox.prometeoapi.com/provider/",
    headers: {
      "X-API-KEY": process.env.PROMETEUS_API_KEY,
    },
  };

  const result = await axios.request(options);
  res.json(result.data.providers);
});
app.get("/bank/logos", async (req, res) => {
  const logos = {
    "santander_pers_mx": {
      "code": "santander",
      "name": "Banco Santander",
      "logo": "https://providers.prometeoapi.com/logos/santander.png",
    },
    "citibanamex_pers_mx": {
      "code": "citibanamex",
      "name": "Citibanamex",
      "logo": "https://providers.prometeoapi.com/logos/citibanamex.png",
    },
    "bbva_corp_mx": {
      "code": "bbva",
      "name": "BBVA",
      "logo": "https://providers.prometeoapi.com/logos/bbva.png",
    },
    "bbva_pers_mx": {
      "code": "bbva",
      "name": "BBVA",
      "logo": "https://providers.prometeoapi.com/logos/bbva.png",
    },
    "scotia_corp_mx": {
      "code": "scotia",
      "name": "Scotiabank",
      "logo": "https://providers.prometeoapi.com/logos/scotia.png",
    },
    "banorte_pers_mx": {
      "code": "banorte",
      "name": "Banorte",
      "logo": "https://providers.prometeoapi.com/logos/banorte.png",
    },
  };
  res.json(logos);
});
app.get("/bank/:bank", async (req, res) => {
  const bankInfo = req.params["bank"];
  const options = {
    method: "GET",
    url: `https://banking.sandbox.prometeoapi.com/provider/${bankInfo}/`,
    headers: {
      "X-API-KEY": process.env.PROMETEUS_API_KEY,
    },
  };

  const result = await axios.request(options);
  const auth_fields = result.data.provider.auth_fields;
  const logo = result.data.provider.logo;
  const bank = result.data.provider.bank;
  res.json({ bank, auth_fields, logo });
});
app.post("/login", async (req, res) => {
  // console.log(req.body);
  // console.log(req.query);
  const options = {
    method: "POST",
    url: "https://banking.sandbox.prometeoapi.com/login/",
    headers: {
      "X-API-KEY": process.env.PROMETEUS_API_KEY,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    data: { ...req.body },
  };

  const login = await axios.request(options);

  const optionsInfo = {
    method: "GET",
    url: "https://banking.sandbox.prometeoapi.com/account/",
    params: { key: login.data.key },
    headers: {
      "X-API-KEY": process.env.PROMETEUS_API_KEY,
    },
  };
  const bankInfo = await axios.request(optionsInfo);

  const optionsTransactions = {
    method: "GET",
    url: `https://banking.sandbox.prometeoapi.com/account/${
      bankInfo.data.accounts[0].number
    }/movement/`,
    params: {
      key: login.data.key,
      currency: bankInfo.data.accounts[0].currency,
      date_start: dayjs().subtract(1, "month").format("DD/MM/YYYY"),
      date_end: dayjs().format("DD/MM/YYYY"),
    },
    headers: {
      "X-API-KEY": process.env.PROMETEUS_API_KEY,
    },
  };
  const transactions = await axios.request(optionsTransactions);
  const data = transactions.data.movements;
  uploadTransactions(data, req.query.userId);
  res.json({ status: true });
});

async function uploadTransactions(data, userId) {
  for (let index = 0; index < data.length; index++) {
    const toInsert = {
      bankId: data[index].id,
      reference: data[index].reference,
      date: data[index].date,
      detail: data[index].detail,
      value: data[index].debit !== "" ? data[index].debit : data[index].credit,
      isCredit: data[index].credit ? true : false,
      userId: userId,
    };
    const transactionFinded = await supabase
      .from("transaction")
      .select("*")
      .eq("bankId", data[index].id);
    if (transactionFinded.data.length > 0) {
      console.log("registro existente", data[index].id);
      continue;
    }
    const transactionSaved = await supabase
      .from("transaction")
      .insert([toInsert]);

    if (transactionSaved.error) {
      console.log("error al guardar el registro", data[index].id);
      continue;
    }
    console.log("registro exitoso", data[index].id);
  }
}

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
