const getTournaments = async (req, reply) => {
	try {
		const db = req.server.betterSqlite3;

		// Fetch all tournaments
		const tournaments = db.prepare('SELECT * FROM tournaments').all();

		// For each tournament, fetch its players and matches to nest them
		for (const tournament of tournaments) {
			// Fetch players for the tournament
			const players = db.prepare(`
				SELECT u.id, u.username
				FROM tournaments_players tp
				JOIN users u ON tp.player_id = u.id
				WHERE tp.tournament_id = ?
			`).all(tournament.id);
			tournament.players = players;

			// Fetch matches for the tournament
			const matches = db.prepare(`
				SELECT id, user_id, opponent_id, opponent_name, result, score, date, duration, game_mode, status
				FROM match_history
				WHERE tournament_id = ?
			`).all(tournament.id);
			tournament.matches = matches;
		}

		reply.send(tournaments);
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error retrieving tournaments' });
	}
};

const getTournamentItem = async (req, reply) => {
	try {
		const { id } = req.params;
		const db = req.server.betterSqlite3;

		const tournament = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(id);

		if (!tournament) {
			reply.code(404).send({ message: 'Tournament not found' });
			return;
		}

		// Fetch players for the tournament
		const players = db.prepare(`
			SELECT u.id, u.username
			FROM tournaments_players tp
			JOIN users u ON tp.player_id = u.id
			WHERE tp.tournament_id = ?
		`).all(tournament.id);
		tournament.players = players;

		// Fetch matches for the tournament
		const matches = db.prepare(`
			SELECT id, user_id, opponent_id, opponent_name, result, score, date, duration, game_mode, status
			FROM match_history
			WHERE tournament_id = ?
		`).all(tournament.id);
		tournament.matches = matches;

		reply.send(tournament);
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error retrieving tournament item' });
	}
};

const getTournamentsWonByUser = async (req, reply) => {
	try {
		const { userId } = req.params;
		const db = req.server.betterSqlite3;

		const tournaments = db.prepare('SELECT * FROM tournaments WHERE winner_user_id = ?').all(userId);

		for (const tournament of tournaments) {
			const players = db.prepare(`
				SELECT u.id, u.username
				FROM tournaments_players tp
				JOIN users u ON tp.player_id = u.id
				WHERE tp.tournament_id = ?
			`).all(tournament.id);
			tournament.players = players;

			const matches = db.prepare(`
				SELECT id, user_id, opponent_id, opponent_name, result, score, date, duration, game_mode, status
				FROM match_history
				WHERE tournament_id = ?
			`).all(tournament.id);
			tournament.matches = matches;
		}

		reply.send(tournaments);
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error retrieving tournaments won by user' });
	}
};

const addTournament = async (req, reply) => {
	try {
		const { tournament_name, player_amount, status, start_date } = req.body;
		const db = req.server.betterSqlite3;

		if (!db || !db.prepare || typeof db.prepare !== 'function') {
			return reply.code(500).send({ message: 'Database connection error.' });
		}

		const insertSql = 'INSERT INTO tournaments (tournament_name, player_amount, status, start_date) VALUES (?, ?, ?, ?)';

		const stmt = db.prepare(insertSql);
		const resultRun = stmt.run(tournament_name, player_amount, status, start_date);

		const newItemId = resultRun ? resultRun.lastInsertRowid : undefined;

		if (newItemId === undefined || newItemId === null) { // More robust check
			req.log.error(`Failed to retrieve newly inserted tournament ID. resultRun was: ${JSON.stringify(resultRun)}`);
			return reply.code(500).send({ message: 'Tournament added, but failed to retrieve its details for response. Please try fetching all tournaments.' });
		}

		const newItem = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(newItemId);

		if (!newItem) {
			req.log.error(`Newly inserted tournament with ID ${newItemId} not found after insertion.`);
			return reply.code(500).send({ message: 'Tournament added, but failed to retrieve its details for response. Please try fetching all tournaments.' });
		}

		newItem.players = [];
		newItem.matches = [];

		reply.code(201).send(newItem);

	} catch (error) {
		reply.code(500).send({ message: 'Error adding tournament' });
	}
};

const updateTournament = async (req, reply) => {
	try {
		const { id } = req.params;
		const { tournament_name, player_amount, status, start_date, end_date, winner_user_id } = req.body;
		const db = req.server.betterSqlite3;

		let query = 'UPDATE tournaments SET';
		const params = [];
		const fields = { tournament_name, player_amount, status, start_date, end_date, winner_user_id };
		let firstField = true;

		for (const field in fields) {
			if (fields[field] !== undefined) {
				if (field === 'winner_user_id' && fields[field] !== null) {
					const userExists = db.prepare('SELECT id FROM users WHERE id = ?').get(fields[field]);
					if (!userExists) { reply.code(400).send({ message: 'Invalid winner_user_id' }); return; }
				}

				if (!firstField) {
					query += ',';
				}
				query += ` ${field} = ?`;
				params.push(fields[field]);
				firstField = false;
			}
		}

		if (params.length === 0) {
			reply.code(400).send({ message: 'No fields provided for update' });
			return;
		}

		query += ' WHERE id = ?';
		params.push(id);

		const resultRun = db.prepare(query).run(...params);

		if (resultRun.changes === 0) {
			const itemExists = db.prepare('SELECT id FROM tournaments WHERE id = ?').get(id);
			if (!itemExists) {
				reply.code(404).send({ message: 'Tournament not found' });
			} else {
				reply.code(200).send({ message: 'No changes made to tournament (data might be identical or no fields provided)' });
			}
		} else {
			// Fetch the updated tournament with its current players and matches
			const updatedItem = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(id);
			const players = db.prepare(`SELECT u.id, u.username FROM tournaments_players tp JOIN users u ON tp.player_id = u.id WHERE tp.tournament_id = ?`).all(id);
			updatedItem.players = players;
			const matches = db.prepare(`SELECT id, user_id, opponent_id, opponent_name, result, score, date, duration, game_mode, status FROM match_history WHERE tournament_id = ?`).all(id);
			updatedItem.matches = matches;
			reply.send(updatedItem);
		}

	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error updating tournament' });
	}
};

const deleteTournament = async (req, reply) => {
	try {
		const { id } = req.params;
		const db = req.server.betterSqlite3;

		const result = db.prepare('DELETE FROM tournaments WHERE id = ?').run(id);

		if (result.changes === 0) {
			reply.code(404).send({ message: 'Tournament not found' });
		} else {
			reply.send({ message: `Tournament ${id} has been removed` });
		}
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error deleting tournament' });
	}
};

const addPlayerToTournament = async (req, reply) => {
	try {
		const { id: tournamentId } = req.params;
		const { player_id: userId } = req.body;
		const db = req.server.betterSqlite3;

		// Check if tournament exists
		const tournamentExists = db.prepare('SELECT id FROM tournaments WHERE id = ?').get(tournamentId);
		if (!tournamentExists) {
			reply.code(404).send({ message: 'Tournament not found' });
			return;
		}

		// Check if player exists
		const playerExists = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
		if (!playerExists) {
			reply.code(400).send({ message: 'Player not found' });
			return;
		}

		// Check if player is already in the tournament
		const existingEntry = db.prepare('SELECT * FROM tournaments_players WHERE tournament_id = ? AND player_id = ?').get(tournamentId, userId);
		if (existingEntry) {
			reply.code(409).send({ message: 'Player is already in this tournament' }); // Conflict
			return;
		}

		db.prepare('INSERT INTO tournaments_players (tournament_id, player_id) VALUES (?, ?)').run(tournamentId, userId);

		// Return the updated list of players for the tournament
		const players = db.prepare(`
			SELECT u.id, u.username
			FROM tournaments_players tp
			JOIN users u ON tp.player_id = u.id
			WHERE tp.tournament_id = ?
		`).all(tournamentId);

		reply.code(201).send(players);

	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error adding player to tournament' });
	}
};

const removePlayerFromTournament = async (req, reply) => {
	try {
		const { id: tournamentId, playerId } = req.params;
		const db = req.server.betterSqlite3;

		const result = db.prepare('DELETE FROM tournaments_players WHERE tournament_id = ? AND player_id = ?').run(tournamentId, playerId);

		if (result.changes === 0) {
			const tournamentExists = db.prepare('SELECT id FROM tournaments WHERE id = ?').get(tournamentId);
			if (!tournamentExists) {
				reply.code(404).send({ message: 'Tournament not found' });
			} else {
				reply.code(404).send({ message: 'Player not found in this tournament' });
			}
		} else {
			reply.send({ message: `Player ${playerId} removed from tournament ${tournamentId}` });
		}
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error removing player from tournament' });
	}
};

const getPlayersInTournament = async (req, reply) => {
	try {
		const { id: tournamentId } = req.params;
		const db = req.server.betterSqlite3;

		const players = db.prepare(`
			SELECT u.id, u.username
			FROM tournaments_players tp
			JOIN users u ON tp.player_id = u.id
			WHERE tp.tournament_id = ?
		`).all(tournamentId);

		if (players.length === 0) {
			const tournamentExists = db.prepare('SELECT id FROM tournaments WHERE id = ?').get(tournamentId);
			if (!tournamentExists) {
				reply.code(404).send({ message: 'Tournament not found' });
				return;
			}
		}

		reply.send(players);
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error retrieving players for tournament' });
	}
};

module.exports = {
	getTournaments,
	getTournamentItem,
	getTournamentsWonByUser,
	addTournament,
	updateTournament,
	deleteTournament,
	addPlayerToTournament,
	removePlayerFromTournament,
	getPlayersInTournament
};
