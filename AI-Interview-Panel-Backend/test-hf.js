const axios = require('axios');
async function test() {
  try {
    const res = await axios.post(
      "https://router.huggingface.co/hf-inference/v1/chat/completions",
      {
        model: "mistralai/Mistral-7B-Instruct-v0.2",
        messages: [{ role: "user", content: "Say hello!" }],
        max_tokens: 10
      },
      {
        headers: { Authorization: "Bearer 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" }
      }
    );
    console.log(res.data.choices[0].message);
  } catch (err) {
    console.error("HF error", err.response ? err.response.data : err.message);
  }
}
test();
