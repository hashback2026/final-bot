const express = require("express");
const axios = require("axios");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(express.static("public"));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
});
app.use("/stk", limiter);

const formatPhone = (phone) => {
  if (phone.startsWith("0")) return "254" + phone.slice(1);
  if (phone.startsWith("+")) return phone.slice(1);
  return phone;
};

app.post("/stk", async (req, res) => {
  const { numbers, amount } = req.body;

  if (!numbers || numbers.length === 0) {
    return res.status(400).json({ error: "No numbers provided" });
  }

  const results = [];

  for (let number of numbers) {
    const phone = formatPhone(number);

    try {
      const response = await axios.post(
        "https://api.palpluss.com/v1/payments/stk",
        {
          amount: amount,
          phone: phone,
          accountReference: "BULK-PAY",
          transactionDesc: "Bulk Payment",
          channelId: process.env.CHANNEL_ID,
          callbackUrl: process.env.CALLBACK_URL,
        },
        {
          headers: {
            Authorization: `Basic ${process.env.AUTH}`,
            "Content-Type": "application/json",
          },
        }
      );

      results.push({ phone, status: "sent", data: response.data });
      await new Promise((r) => setTimeout(r, 1500));

    } catch (error) {
      results.push({
        phone,
        status: "failed",
        error: error.response?.data || error.message,
      });
    }
  }

  res.json(results);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
