const apiKey = "f6bf0158-49f5-40a0-9065-7894f15a711a";
fetch("https://api.sambanova.ai/v1/chat/completions", {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: "Llama-3.2-11B-Vision-Instruct",
    messages: [
      {
        role: "user",
        content: "test"
      }
    ]
  })
}).then(async r => {
  console.log(r.status);
  console.log(await r.text());
}).catch(console.log);
