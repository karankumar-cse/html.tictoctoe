import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getDatabase,
    ref,
    set,
    get,
    update,
    onValue
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";


// ======================================
// FIREBASE CONFIG
// ======================================

const firebaseConfig = {

    apiKey: "YOUR_API_KEY",

    authDomain: "YOUR_PROJECT.firebaseapp.com",

    databaseURL:
        "https://YOUR_PROJECT-default-rtdb.firebaseio.com",

    projectId: "YOUR_PROJECT",

    storageBucket:
        "YOUR_PROJECT.firebasestorage.app",

    messagingSenderId: "YOUR_SENDER_ID",

    appId: "YOUR_APP_ID"
};


// Initialize Firebase

const app = initializeApp(firebaseConfig);

const database = getDatabase(app);


// ======================================
// VARIABLES
// ======================================

let roomId = null;
let player = null;
let playerName = "";


// ======================================
// ELEMENTS
// ======================================

const home = document.getElementById("home");
const game = document.getElementById("game");

const playerNameInput =
    document.getElementById("playerName");

const roomCodeInput =
    document.getElementById("roomCodeInput");

const createBtn =
    document.getElementById("createBtn");

const joinBtn =
    document.getElementById("joinBtn");

const error =
    document.getElementById("error");

const roomCode =
    document.getElementById("roomCode");

const playerX =
    document.getElementById("playerX");

const playerO =
    document.getElementById("playerO");

const status =
    document.getElementById("status");

const copyBtn =
    document.getElementById("copyBtn");

const restartBtn =
    document.getElementById("restartBtn");

const leaveBtn =
    document.getElementById("leaveBtn");

const cells =
    document.querySelectorAll(".cell");


// ======================================
// CREATE ROOM
// ======================================

createBtn.addEventListener("click", async () => {

    playerName =
        playerNameInput.value.trim();

    if (!playerName) {
        showError("Enter your name first.");
        return;
    }

    roomId = generateRoomCode();

    player = "X";

    const roomRef =
        ref(database, "rooms/" + roomId);

    await set(roomRef, {

        playerX: playerName,

        playerO: "",

        board: [
            "", "", "",
            "", "", "",
            "", "", ""
        ],

        turn: "X",

        winner: "",

        gameOver: false

    });

    startGame();

});


// ======================================
// JOIN ROOM
// ======================================

joinBtn.addEventListener("click", async () => {

    playerName =
        playerNameInput.value.trim();

    const code =
        roomCodeInput.value.trim().toUpperCase();

    if (!playerName) {

        showError("Enter your name first.");

        return;
    }

    if (!code) {

        showError("Enter room code.");

        return;
    }

    const roomRef =
        ref(database, "rooms/" + code);

    const snapshot =
        await get(roomRef);

    if (!snapshot.exists()) {

        showError("Room does not exist.");

        return;
    }

    const data =
        snapshot.val();

    if (data.playerO) {

        showError("Room is already full.");

        return;
    }

    roomId = code;

    player = "O";

    await update(roomRef, {

        playerO: playerName

    });

    startGame();

});


// ======================================
// START GAME
// ======================================

function startGame() {

    home.classList.add("hidden");

    game.classList.remove("hidden");

    roomCode.textContent = roomId;

    listenToGame();

}


// ======================================
// LISTEN FOR REAL-TIME CHANGES
// ======================================

function listenToGame() {

    const roomRef =
        ref(database, "rooms/" + roomId);

    onValue(roomRef, snapshot => {

        if (!snapshot.exists()) {

            showError("Room was deleted.");

            return;
        }

        const data =
            snapshot.val();

        playerX.textContent =
            data.playerX || "Waiting...";

        playerO.textContent =
            data.playerO || "Waiting...";


        // Update board

        const board =
            data.board || [];

        cells.forEach((cell, index) => {

            cell.textContent =
                board[index] || "";

            cell.classList.remove("x", "o");

            if (board[index] === "X") {

                cell.classList.add("x");

            } else if (board[index] === "O") {

                cell.classList.add("o");

            }

        });


        // Game status

        if (!data.playerO) {

            status.textContent =
                "Waiting for opponent...";

            return;
        }


        if (data.gameOver) {

            if (data.winner === "draw") {

                status.textContent =
                    "🤝 It's a draw!";

            } else if (data.winner === player) {

                status.textContent =
                    "🎉 You won!";

            } else {

                status.textContent =
                    "😢 You lost!";

            }

            return;
        }


        if (data.turn === player) {

            status.textContent =
                "🟢 Your turn";

        } else {

            status.textContent =
                "🔴 Opponent's turn";

        }

    });

}


// ======================================
// MAKE MOVE
// ======================================

cells.forEach(cell => {

    cell.addEventListener("click", async () => {

        const index =
            Number(cell.dataset.index);

        const roomRef =
            ref(database, "rooms/" + roomId);

        const snapshot =
            await get(roomRef);

        if (!snapshot.exists()) return;

        const data =
            snapshot.val();


        // Opponent hasn't joined

        if (!data.playerO) return;


        // Not player's turn

        if (data.turn !== player) return;


        // Game already ended

        if (data.gameOver) return;


        // Cell occupied

        if (data.board[index]) return;


        const newBoard =
            [...data.board];

        newBoard[index] =
            player;


        // Check winner

        const winner =
            checkWinner(newBoard);


        if (winner) {

            await update(roomRef, {

                board: newBoard,

                winner: winner,

                gameOver: true

            });

            return;
        }


        // Check draw

        if (newBoard.every(cell => cell !== "")) {

            await update(roomRef, {

                board: newBoard,

                winner: "draw",

                gameOver: true

            });

            return;
        }


        // Change turn

        await update(roomRef, {

            board: newBoard,

            turn: player === "X" ? "O" : "X"

        });

    });

});


// ======================================
// CHECK WINNER
// ======================================

function checkWinner(board) {

    const winningPatterns = [

        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],

        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],

        [0, 4, 8],
        [2, 4, 6]

    ];


    for (const pattern of winningPatterns) {

        const [a, b, c] = pattern;

        if (
            board[a] &&
            board[a] === board[b] &&
            board[a] === board[c]
        ) {

            return board[a];

        }

    }

    return null;

}


// ======================================
// REMATCH
// ======================================

restartBtn.addEventListener("click", async () => {

    const roomRef =
        ref(database, "rooms/" + roomId);

    await update(roomRef, {

        board: [
            "", "", "",
            "", "", "",
            "", "", ""
        ],

        turn: "X",

        winner: "",

        gameOver: false

    });

});


// ======================================
// COPY ROOM CODE
// ======================================

copyBtn.addEventListener("click", async () => {

    await navigator.clipboard.writeText(roomId);

    copyBtn.textContent = "✅ Copied!";

    setTimeout(() => {

        copyBtn.textContent = "📋 Copy";

    }, 1500);

});


// ======================================
// LEAVE ROOM
// ======================================

leaveBtn.addEventListener("click", () => {

    location.reload();

});


// ======================================
// GENERATE ROOM CODE
// ======================================

function generateRoomCode() {

    const characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    let code = "";

    for (let i = 0; i < 6; i++) {

        code +=
            characters.charAt(
                Math.floor(
                    Math.random() *
                    characters.length
                )
            );

    }

    return code;

}


// ======================================
// ERROR
// ======================================

function showError(message) {

    error.textContent = message;

    setTimeout(() => {

        error.textContent = "";

    }, 3000);

}