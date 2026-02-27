const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const httpServer = createServer(async (req, res) => {
        try {
            const parsedUrl = parse(req.url || "", true);
            if (parsedUrl.pathname.startsWith('/socket.io')) {
                return; // socket.io will handle this request itself
            }
            await handle(req, res, parsedUrl);
        } catch (err) {
            console.error("Error occurred handling", req.url, err);
            res.statusCode = 500;
            res.end("internal server error");
        }
    });

    const io = new Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
    });

    io.on("connection", (socket) => {
        console.log(`Socket connected: ${socket.id}`);

        // Join a personal room based on userId for targeted notifications
        socket.on("join-room", (userId) => {
            socket.join(userId);
            console.log(`User ${userId} joined their personal room`);
        });

        // Real-time events
        socket.on("new-request", (data) => {
            // Broadcast to all providers, or specific ones
            io.emit("request-created", data);
        });

        socket.on("status-update", (data) => {
            // data: { requestId, status, customerId, providerId }
            if (data.customerId) io.to(data.customerId).emit("request-updated", data);
            if (data.providerId) io.to(data.providerId).emit("request-updated", data);
        });

        socket.on("verification-update", (data) => {
            // data: { providerId, status }
            if (data.providerId) io.to(data.providerId).emit("provider-verified", data);
        });

        socket.on("dispute-update", (data) => {
            if (data.userId) io.to(data.userId).emit("dispute-updated", data);
        });

        socket.on("disconnect", () => {
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });

    httpServer
        .once("error", (err) => {
            console.error(err);
            process.exit(1);
        })
        .listen(port, () => {
            console.log(`> Ready on http://${hostname}:${port}`);
        });
});
