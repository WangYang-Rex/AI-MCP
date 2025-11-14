const { inference } = require('./inference');

(async () => {
  const response = await inference({
    messages: [
      { role: 'user', content: '什么是人工智能？' }
    ]
  });

  console.log(response.choices[0].message.content);
})();