"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
// dev-server.ts - Simple API for browser mode development
var express_1 = require("express");
var cors_1 = require("cors");
var database_1 = require("./database");
var app = (0, express_1.default)();
var PORT = 3001;
// Enable CORS for browser access
app.use((0, cors_1.default)());
// Health check
app.get("/health", function (req, res) {
    res.json({ status: "ok", message: "VibeMaster Dev Server Running" });
});
// Database test endpoint
app.get("/test-db", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var db, count, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                db = (0, database_1.getDatabase)();
                return [4 /*yield*/, db.world.count()];
            case 1:
                count = _a.sent();
                res.json({
                    status: "ok",
                    message: "Database connected",
                    worldCount: count,
                    databaseUrl: process.env.DATABASE_URL
                });
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                res.status(500).json({
                    status: "error",
                    message: "Database connection failed",
                    error: error_1 instanceof Error ? error_1.message : String(error_1),
                    databaseUrl: process.env.DATABASE_URL
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Get world state (same format as Tauri command)
app.get("/api/world-state", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var db, world, result, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                db = (0, database_1.getDatabase)();
                return [4 /*yield*/, db.world.findFirst({
                        include: {
                            npcs: {
                                select: {
                                    id: true,
                                    name: true,
                                    occupation: true,
                                    needFood: true,
                                    needSafety: true,
                                    needWealth: true,
                                    emotionHappiness: true,
                                    emotionFear: true,
                                    emotionSadness: true,
                                    goals: {
                                        where: {
                                            completed: false,
                                            failed: false,
                                        },
                                        orderBy: { priority: "desc" },
                                        take: 3,
                                        select: {
                                            type: true,
                                            priority: true,
                                            urgent: true,
                                            desperate: true,
                                        },
                                    },
                                },
                            },
                        },
                    })];
            case 1:
                world = _a.sent();
                if (world) {
                    result = {
                        currentDay: world.currentDay,
                        currentHour: world.currentHour,
                        npcs: world.npcs,
                    };
                    res.json(result);
                }
                else {
                    res.status(404).json({ error: "No world found" });
                }
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                console.error("Error fetching world state:", error_2);
                console.error("Full error details:", error_2 instanceof Error ? error_2.message : error_2);
                console.error("Stack trace:", error_2 instanceof Error ? error_2.stack : "No stack trace");
                res.status(500).json({ error: "Failed to fetch world state", details: error_2 instanceof Error ? error_2.message : String(error_2) });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Start/stop simulation (stub for browser mode)
app.post("/api/simulation/start", function (req, res) {
    res.json({
        success: true,
        message: "In browser mode, simulation runs in separate terminal (npm run dev)",
    });
});
app.post("/api/simulation/stop", function (req, res) {
    res.json({
        success: true,
        message: "In browser mode, use Ctrl+C in simulation terminal to stop",
    });
});
app.listen(PORT, function () {
    console.log("🌐 VibeMaster Dev Server");
    console.log("================================");
    console.log("\u2705 Running on http://localhost:".concat(PORT));
    console.log("");
    console.log("📡 Endpoints:");
    console.log("   GET  http://localhost:".concat(PORT, "/health"));
    console.log("   GET  http://localhost:".concat(PORT, "/api/world-state"));
    console.log("");
    console.log("💡 Usage:");
    console.log("   1. Run simulation: npm run dev (in another terminal)");
    console.log("   2. Run this server: npm run dev:server");
    console.log("   3. Run Phaser game: npm run vite:dev");
    console.log("");
    console.log("   Browser mode will fetch live data from this server!");
    console.log("");
    console.log("📊 Data includes:");
    console.log("   - NPC names, occupations");
    console.log("   - Needs (food, safety, wealth)");
    console.log("   - Emotions (happiness, fear, sadness)");
    console.log("   - Active goals (up to 3 per NPC)");
});
