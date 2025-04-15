const express = require('express');
const router = express.Router();
const scoreService = require('../services/scoreService');

// GET /scores - get top 10 scores
router.get('/', (req, res) => {
	const scores = scoreService.getTopScores();
	res.json(scores);
});

// POST /scores - add a new score
router.post('/', (req, res) => {
	const { player, score } = req.body;

	if (!player || typeof score !== 'number') {
		return res.status(400).json({ error: 'Invalid data' });
	}

	scoreService.addScore(player, score);
	res.status(201).json({ message: 'Score added!' });
});

module.exports = router;
