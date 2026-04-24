app.post("/stk", async (req, res) => {
  let { numbers, amount } = req.body;

  // 🔧 Convert to number
  amount = Number(amount);

  // ✅ Validate amount
  if (!amount || isNaN(amount) || amount < 1) {
    return res.status(400).json({
      error: "Amount must be a number greater than 0",
    });
  }

  if (!numbers || numbers.length === 0) {
    return res.status(400).json({ error: "No numbers provided" });
  }

  const results = [];

  for (let number of numbers) {
    const phone = formatPhone(number);

    try {
      console.log("Sending:", { phone, amount }); // 👈 debug log

      const response = await axios.post(
        "https://api.palpluss.com/v1/payments/stk",
        {
          amount: amount, // now guaranteed valid number
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
