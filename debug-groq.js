const groq = require('./config/groq').groq;
(async () => {
  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: 'Halo' }],
      max_tokens: 500,
    });
    console.log('OK:', JSON.stringify(completion.choices?.[0]?.message?.content));
  } catch (err) {
    console.log('ERROR NAME:', err.name);
    console.log('ERROR MESSAGE:', err.message);
    console.log('ERROR CAUSE:', err.cause?.message || err.cause);
    console.log('ERROR STATUS:', err.status || err.httpStatusCode);
    console.log('ERROR BODY:', err.body || err.response?.body || err.responseData || '(none)');
  }
})();
