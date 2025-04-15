const express = require('express');
const scoresRouter = require('./routes/scores');
const app = express();
const PORT = 3000;

app.use(express.json()); // for parsing application/json

app.use('/scores', scoresRouter); // mount route at /scores

app.get('/', (req, res) => {
	res.send('Hello from Pong backend!');
});

app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});
