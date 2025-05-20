function generateInitialMatches(playerNames) {
	const numPlayers = playerNames.length;
	if (numPlayers < 2 || (numPlayers & (numPlayers - 1)) !== 0) {
		throw new Error("Player amount must be a power of 2 (at least 2).");
	}

	const matches = [];
	let currentMatchId = 1;

	// Create Round 1 Matches
	const round1Matches = [];
	for (let i = 0; i < numPlayers; i += 2) {
		round1Matches.push({
			id: currentMatchId++,
			round: 1,
			player1_name: playerNames[i],
			player2_name: playerNames[i + 1],
			score: null,
			winner_name: null,
			status: 'pending',
			next_match_id: null,
			next_match_player_slot: null,
		});
	}
	matches.push(...round1Matches);

	let previousRoundMatches = round1Matches;
	let currentRound = 2;

	// Create Subsequent Rounds
	while (previousRoundMatches.length > 1) {
		const currentRoundMatches = [];
		const numMatchesInRound = previousRoundMatches.length / 2;

		for (let i = 0; i < numMatchesInRound; i++) {
			const matchId = currentMatchId++;
			currentRoundMatches.push({
				id: matchId,
				round: currentRound,
				player1_name: null,
				player2_name: null,
				score: null,
				winner_name: null,
				status: 'pending',
				next_match_id: null,
				next_match_player_slot: null,
			});

			// Link the two previous round matches to this new match
			const prevMatch1Index = i * 2;
			const prevMatch2Index = i * 2 + 1;

			previousRoundMatches[prevMatch1Index].next_match_id = matchId;
			previousRoundMatches[prevMatch1Index].next_match_player_slot = 1; // Winner goes to slot 1

			previousRoundMatches[prevMatch2Index].next_match_id = matchId;
			previousRoundMatches[prevMatch2Index].next_match_player_slot = 2; // Winner goes to slot 2
		}

		matches.push(...currentRoundMatches);
		previousRoundMatches = currentRoundMatches;
		currentRound++;
	}

	return matches;
}

// Controller for GET / (Get all tournaments for the authenticated user)
const getTournaments = async (req, reply) => {
	const authenticatedUserId = req.user.id;

	try {
		const db = req.server.betterSqlite3;

		const tournaments = db.prepare('SELECT * FROM tournaments WHERE creator_id = ?').all(authenticatedUserId);

		for (const tournament of tournaments) {
			try {
				tournament.players = tournament.player_names ? JSON.parse(tournament.player_names) : [];
			} catch (e) {
				req.log.error(`Failed to parse player_names JSON for tournament ${tournament.id}:`, e);
				tournament.players = [];
			}
			try {
				tournament.matches = tournament.matches_data ? JSON.parse(tournament.matches_data) : [];
			} catch (e) {
				req.log.error(`Failed to parse matches_data JSON for tournament ${tournament.id}:`, e);
				tournament.matches = [];
			}

			delete tournament.player_names;
			delete tournament.matches_data;
		}

		reply.send(tournaments);
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error retrieving tournaments' });
	}
};

// Controller for GET /:id (Get a single tournament by ID for the authenticated user, must be creator)
const getTournamentItem = async (req, reply) => {
	const { id } = req.params;
	const authenticatedUserId = req.user.id;

	try {
		const db = req.server.betterSqlite3;

		const tournament = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(id);

		if (!tournament) {
			reply.code(404).send({ message: 'Tournament not found' });
			return;
		}

		// AUTHORIZATION CHECK: Must be the creator
		if (tournament.creator_id !== authenticatedUserId) {
			reply.code(403).send({ message: 'Forbidden: You can only view your own tournaments.' });
			return;
		}

		try {
			tournament.players = tournament.player_names ? JSON.parse(tournament.player_names) : [];
		} catch (e) {
			req.log.error(`Failed to parse player_names JSON for tournament ${tournament.id}:`, e);
			tournament.players = [];
		}
		try {
			tournament.matches = tournament.matches_data ? JSON.parse(tournament.matches_data) : [];
		} catch (e) {
			req.log.error(`Failed to parse matches_data JSON for tournament ${tournament.id}:`, e);
			tournament.matches = [];
		}

		delete tournament.player_names;
		delete tournament.matches_data;

		reply.send(tournament);
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error retrieving tournament' });
	}
};

// Controller for GET /users/:userId/won
const getTournamentsWonByUser = async (req, reply) => {
	const targetUserId = parseInt(req.params.userId, 10);
	const authenticatedUserId = req.user.id;

	// AUTHORIZATION CHECK: Must be the authenticated user requesting their own won tournaments
	if (targetUserId !== authenticatedUserId) {
		reply.code(403).send({ message: 'Forbidden: You can only view your own won tournaments.' });
		return;
	}

	try {
		const db = req.server.betterSqlite3;

		const tournaments = db.prepare('SELECT * FROM tournaments WHERE creator_id = ?').all(authenticatedUserId);

		const wonTournaments = tournaments.filter(t => {
			try {
				const playerNames = t.player_names ? JSON.parse(t.player_names) : [];
				const creatorUser = db.prepare('SELECT username FROM users WHERE id = ?').get(authenticatedUserId);
				if (creatorUser && t.winner_name && t.winner_name === creatorUser.username) {
					if (playerNames.includes(t.winner_name)) {
						return true;
					}
				}
				return false;

			} catch (e) {
				req.log.error(`Error filtering won tournaments or parsing player_names for tournament ${t.id}:`, e);
				return false;
			}
		});

		for (const tournament of wonTournaments) {
			try {
				tournament.players = tournament.player_names ? JSON.parse(tournament.player_names) : [];
			} catch (e) {
				req.log.error(`Failed to parse player_names JSON for tournament ${tournament.id}:`, e);
				tournament.players = [];
			}
			try {
				tournament.matches = tournament.matches_data ? JSON.parse(tournament.matches_data) : [];
			} catch (e) {
				req.log.error(`Failed to parse matches_data JSON for tournament ${tournament.id}:`, e);
				tournament.matches = [];
			}

			delete tournament.player_names;
			delete tournament.matches_data;
		}

		reply.code(200).send(wonTournaments);
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error retrieving won tournaments' });
	}
};

// Controller for POST / (Add a new tournament)
const addTournament = async (req, reply) => {
	const authenticatedUserId = req.user.id;
	const { tournament_name, player_amount, players } = req.body;

	if (!tournament_name || !player_amount || !players || !Array.isArray(players) || players.length !== player_amount) {
		reply.code(400).send({ message: 'Invalid or incomplete tournament data provided.' });
		return;
	}
	if (player_amount < 2 || (player_amount & (player_amount - 1)) !== 0) {
		reply.code(400).send({ message: 'Player amount must be a power of 2 (at least 2).' });
		return;
	}
	// Ensure player names are not empty or duplicates in the future

	try {
		const db = req.server.betterSqlite3;

		const initialMatches = generateInitialMatches(players);

		const playerNamesJson = JSON.stringify(players);
		const matchesDataJson = JSON.stringify(initialMatches);

		const newTournamentResponse = db.transaction(() => {
			const result = db.prepare(`
				INSERT INTO tournaments (
				tournament_name, creator_id, player_amount, status,
				winner_name, player_names, matches_data
				) VALUES (?, ?, ?, ?, ?, ?, ?)
			`).run(
				tournament_name,
				authenticatedUserId,
				player_amount,
				'pending',
				null,
				playerNamesJson,
				matchesDataJson
			);

			const newTournamentId = result.lastInsertRowid;

			const newTournament = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(newTournamentId);

			try { newTournament.players = newTournament.player_names ? JSON.parse(newTournament.player_names) : []; } catch(e) { newTournament.players = []; }
			try { newTournament.matches = newTournament.matches_data ? JSON.parse(newTournament.matches_data) : []; } catch(e) { newTournament.matches = []; }

			delete newTournament.player_names;
			delete newTournament.matches_data;

			return newTournament;
		})();

		reply.code(201).send(newTournamentResponse);

	} catch (error) {
		req.log.error('Error adding tournament (transaction catch):', error);
		reply.code(500).send({ message: 'Error adding tournament' });
	}
};

// Controller for PUT /:id (Update a tournament by ID, must be creator)
const updateTournament = async (req, reply) => {
	const { id } = req.params;
	const authenticatedUserId = req.user.id;
	const updates = req.body;

	if (Object.keys(updates).length === 0) {
		reply.code(400).send({ message: 'No fields provided for update' });
		return;
	}

	try {
		const db = req.server.betterSqlite3;

		const tournament = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(id);

		if (!tournament) {
			reply.code(404).send({ message: 'Tournament not found' });
			return;
		}

		// AUTHORIZATION CHECK: Must be the creator
		if (tournament.creator_id !== authenticatedUserId) {
			reply.code(403).send({ message: 'Forbidden: You can only update your own tournaments.' });
			return;
		}

		try { tournament.matches = tournament.matches_data ? JSON.parse(tournament.matches_data) : []; } catch(e) {
			req.log.error(`Failed to parse matches_data JSON for tournament ${id} during update fetch:`, e);
			reply.code(500).send({ message: 'Corrupt tournament data.' });
			return;
		}
		try { tournament.players = tournament.player_names ? JSON.parse(tournament.player_names) : []; } catch(e) {
			req.log.error(`Failed to parse player_names JSON for tournament ${id} during update fetch:`, e);
			tournament.players = [];
		}

		// BRACKET PROGRESSION LOGIC
		let updatedMatches = tournament.matches; // Start with the current matches data

		// If the update includes match data, process it
		if (updates.hasOwnProperty('matches') && Array.isArray(updates.matches)) {
			const incomingMatches = updates.matches;
			const matchesById = new Map(updatedMatches.map(match => [match.id, match])); // Map existing matches by ID for easy lookup

			// Iterate through incoming matches to find changes
			for (const incomingMatch of incomingMatches) {
				const existingMatch = matchesById.get(incomingMatch.id);

				if (!existingMatch) {
					req.log.warn(`Update included match ID ${incomingMatch.id} not found in tournament ${id}`);
					continue;
				}

				if (incomingMatch.status === 'finished' && existingMatch.status !== 'finished' && incomingMatch.winner_name) {
					if (incomingMatch.winner_name !== existingMatch.player1_name && incomingMatch.winner_name !== existingMatch.player2_name) {
						req.log.warn(`Invalid winner name "${incomingMatch.winner_name}" provided for match ${incomingMatch.id} in tournament ${id}`);
						reply.code(400).send({ message: `Invalid winner name for match ${incomingMatch.id}.` });
						return;
					}

					// Update the match details in internal array
					existingMatch.status = 'finished';
					existingMatch.score = incomingMatch.score || existingMatch.score; // Update score if provided
					existingMatch.winner_name = incomingMatch.winner_name;

					// Advance the winner to the next match
					if (existingMatch.next_match_id !== null) {
						const nextMatch = matchesById.get(existingMatch.next_match_id);

						if (!nextMatch) {
							req.log.error(`Next match ID ${existingMatch.next_match_id} not found for match ${existingMatch.id} in tournament ${id}. Corrupt bracket?`);
							reply.code(500).send({ message: 'Internal error: Bracket structure problem.' });
							return;
						}

						// Place the winner in the correct slot in the next match
						if (existingMatch.next_match_player_slot === 1) {
							nextMatch.player1_name = existingMatch.winner_name;
						} else if (existingMatch.next_match_player_slot === 2) {
							nextMatch.player2_name = existingMatch.winner_name;
						} else {
							req.log.error(`Invalid next_match_player_slot ${existingMatch.next_match_player_slot} for match ${existingMatch.id} in tournament ${id}. Corrupt bracket?`);
							reply.code(500).send({ message: 'Internal error: Bracket structure problem.' });
							return;
						}

						// If both players are now known in the next match, update its status
						if (nextMatch.player1_name && nextMatch.player2_name && nextMatch.status === 'pending') {
								nextMatch.status = 'running';
						}
					} else {
						// This was the final match! Update tournament winner and status
						updates.winner_name = existingMatch.winner_name; // Set tournament winner
						updates.status = 'finished'; // Set tournament status to finished
					}
				} else {
					if (incomingMatch.status !== 'finished') {
						incomingMatch.score = null;
						incomingMatch.winner_name = null;
					}
					if (incomingMatch.hasOwnProperty('status')) existingMatch.status = incomingMatch.status;
					if (incomingMatch.hasOwnProperty('score')) existingMatch.score = incomingMatch.score;
					if (incomingMatch.hasOwnProperty('winner_name')) existingMatch.winner_name = incomingMatch.winner_name;
				}
			}

			// The updatedMatches array (tournament.matches) now contains the processed changes
			updates.matches_data = JSON.stringify(updatedMatches);
			delete updates.matches; // Remove the original 'matches' array from updates to avoid processing again

			if (updates.hasOwnProperty('players') && Array.isArray(updates.players)) {
				updates.player_names = JSON.stringify(updates.players);
				delete updates.players;
			}
		}
		// END BRACKET PROGRESSION LOGIC

		// Continue with building the standard SQL update query for remaining fields
		const setClauses = [];
		const params = [];
		const allowedDirectUpdateFields = ['tournament_name', 'player_amount', 'status', 'winner_name'];
		const jsonUpdateFields = ['player_names', 'matches_data'];

		Object.entries(updates).forEach(([key, value]) => {
			if (allowedDirectUpdateFields.includes(key) || jsonUpdateFields.includes(key)) {
				setClauses.push(`${key} = ?`);
				params.push(value);
			} else {
				req.log.warn(`Ignoring disallowed update field "${key}" for tournament ${id}`);
			}
		});

		if (setClauses.length === 0) {
			if (!updates.hasOwnProperty('matches') && !updates.hasOwnProperty('players')) {
				reply.code(400).send({ message: 'No valid fields provided for update.' });
				return;
			}
		}

		params.push(id);

		const updateQuery = `UPDATE tournaments SET ${setClauses.join(', ')} WHERE id = ?`;

		const result = db.prepare(updateQuery).run(...params);

		const updatedTournament = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(id);
		try { updatedTournament.players = updatedTournament.player_names ? JSON.parse(updatedTournament.player_names) : []; } catch(e) { updatedTournament.players = []; }
		try { updatedTournament.matches = updatedTournament.matches_data ? JSON.parse(updatedTournament.matches_data) : []; } catch(e) { updatedTournament.matches = []; }
		delete updatedTournament.player_names;
		delete updatedTournament.matches_data;

		reply.code(200).send(updatedTournament);

	} catch (error) {
		req.log.error('Error updating tournament:', error);
		reply.code(500).send({ message: 'Error updating tournament' });
	}
};

// Controller for DELETE /:id (Delete a tournament by ID, must be creator)
const deleteTournament = async (req, reply) => {
	const { id } = req.params;
	const authenticatedUserId = req.user.id; // Get ID from token

	try {
		const db = req.server.betterSqlite3;

		const tournament = db.prepare('SELECT creator_id FROM tournaments WHERE id = ?').get(id);

		if (!tournament) {
			reply.code(404).send({ message: 'Tournament not found' });
			return;
		}

		// AUTHORIZATION CHECK: Must be the creator
		if (tournament.creator_id !== authenticatedUserId) {
			reply.code(403).send({ message: 'Forbidden: You can only delete your own tournaments.' });
			return;
		}

		const result = db.prepare('DELETE FROM tournaments WHERE id = ?').run(id);

		if (result.changes === 0) {
			reply.code(404).send({ message: 'Tournament not found (or already deleted)' });
		} else {
			reply.code(200).send({ message: 'Tournament deleted successfully' });
		}

	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error deleting tournament' });
	}
};

module.exports = {
	getTournaments,
	getTournamentItem,
	getTournamentsWonByUser,
	addTournament,
	updateTournament,
	deleteTournament,
};
