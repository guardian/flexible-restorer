#!/usr/bin/env node

const fs = require("fs");
const http = require("http");
const https = require("https");
const path = require("path");
const { URL } = require("url");

const projectRoot = process.cwd();
const catalogDir = path.join(projectRoot, "public", "feature-catalog");
const host = process.env.FEATURE_CATALOG_HOST || "localhost";
const initialPort = Number(process.env.FEATURE_CATALOG_PORT || 9010);
const maxPortAttempts = 10;
const defaultPreviewBaseUrl = process.env.FEATURE_PREVIEW_BASE_URL || "http://localhost:9000";

const previewConfig = {
    baseUrl: defaultPreviewBaseUrl,
    authCookie: "",
};

const contentTypes = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".ico": "image/x-icon",
};

function send(response, statusCode, body, contentType = "text/plain; charset=utf-8") {
    response.writeHead(statusCode, { "Content-Type": contentType });
    response.end(body);
}

function resolveCatalogPath(urlPath) {
    const cleanPath = (urlPath || "/").split("?")[0];
    const catalogPath = cleanPath === "/catalog" ? "/catalog/" : cleanPath;
    const relativePath = catalogPath === "/catalog/" ? "/index.html" : catalogPath.replace(/^\/catalog/, "");
    const absolutePath = path.normalize(path.join(catalogDir, relativePath));

    if (!absolutePath.startsWith(catalogDir)) {
        return null;
    }

    return absolutePath;
}

if (!fs.existsSync(catalogDir)) {
    console.error(`Feature catalog not found at ${catalogDir}`);
    console.error("Run `npm run bdd:features:html` first.");
    process.exit(1);
}

function readRequestBody(request) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        request.on("data", (chunk) => chunks.push(chunk));
        request.on("end", () => resolve(Buffer.concat(chunks)));
        request.on("error", reject);
    });
}

function mergeCookieHeader(existingCookieHeader, authCookie) {
    const cookies = [];

    if (existingCookieHeader) {
        cookies.push(existingCookieHeader);
    }

    if (authCookie) {
        // Pan-domain cookies are signed base64 payloads and must be forwarded verbatim.
        cookies.push(`gutoolsAuth-assym=${authCookie}`);
    }

    return cookies.filter(Boolean).join("; ");
}

function normalizeAuthCookie(rawCookie) {
    const trimmed = String(rawCookie || "").trim();
    if (!trimmed) {
        return "";
    }

    // Allow users to paste either raw cookie values or URL-encoded cookie values.
    if (trimmed.includes("%")) {
        try {
            return decodeURIComponent(trimmed);
        } catch {
            return trimmed;
        }
    }

    return trimmed;
}

function proxyPreviewRequest(request, response) {
    if (!previewConfig.baseUrl) {
        send(response, 503, "Preview target is not configured. Open /catalog/ and connect a preview URL.");
        return;
    }

    const upstreamBaseUrl = new URL(previewConfig.baseUrl);
    const upstreamUrl = new URL(request.url || "/", upstreamBaseUrl);
    const transport = upstreamUrl.protocol === "https:" ? https : http;
    const headers = { ...request.headers };

    headers.host = upstreamUrl.host;
    delete headers.connection;
    const cookieHeader = mergeCookieHeader(request.headers.cookie, previewConfig.authCookie);
    if (cookieHeader) {
        headers.cookie = cookieHeader;
    } else {
        delete headers.cookie;
    }

    const proxyRequest = transport.request(
        upstreamUrl,
        {
            method: request.method,
            headers,
        },
        (proxyResponse) => {
            const responseHeaders = { ...proxyResponse.headers };
            if (responseHeaders.location) {
                try {
                    const redirectedUrl = new URL(responseHeaders.location, upstreamBaseUrl);
                    // Keep external redirects (e.g. Google OAuth) intact.
                    // Only remap redirects that point back to the proxied app origin.
                    if (redirectedUrl.origin === upstreamBaseUrl.origin) {
                        const proxiedLocation = `${redirectedUrl.pathname}${redirectedUrl.search}${redirectedUrl.hash}`;
                        responseHeaders.location = proxiedLocation;
                    } else {
                        responseHeaders.location = redirectedUrl.toString();
                    }
                } catch {
                    delete responseHeaders.location;
                }
            }

            response.writeHead(proxyResponse.statusCode || 500, responseHeaders);
            proxyResponse.pipe(response);
        },
    );

    proxyRequest.on("error", (error) => {
        send(response, 502, `Proxy error: ${error.message}`);
    });

    request.pipe(proxyRequest);
}

function createServer() {
    return http.createServer((request, response) => {
        const urlPath = (request.url || "/").split("?")[0];

        if (request.method === "POST" && urlPath === "/__feature_preview/configure") {
            readRequestBody(request)
                .then((bodyBuffer) => {
                    const payload = JSON.parse(bodyBuffer.toString("utf8") || "{}");
                    const nextBaseUrl = String(payload.baseUrl || "").trim();
                    if (!nextBaseUrl) {
                        send(response, 400, "Missing baseUrl");
                        return;
                    }

                    previewConfig.baseUrl = nextBaseUrl;
                    previewConfig.authCookie = normalizeAuthCookie(payload.authCookie);
                    send(response, 200, JSON.stringify({ ok: true, baseUrl: previewConfig.baseUrl }), "application/json; charset=utf-8");
                })
                .catch((error) => {
                    send(response, 400, `Invalid configure payload: ${error.message}`);
                });
            return;
        }

        if (request.method === "GET" && urlPath === "/__feature_preview/status") {
            send(
                response,
                200,
                JSON.stringify({ baseUrl: previewConfig.baseUrl, hasAuthCookie: Boolean(previewConfig.authCookie) }),
                "application/json; charset=utf-8",
            );
            return;
        }

        if (urlPath === "/catalog" || urlPath === "/catalog/" || urlPath.startsWith("/catalog/")) {
            const filePath = resolveCatalogPath(request.url || "/catalog/");
            if (!filePath) {
                send(response, 403, "Forbidden");
                return;
            }

            fs.readFile(filePath, (error, data) => {
                if (error) {
                    if (error.code === "ENOENT") {
                        send(response, 404, "Not found");
                        return;
                    }

                    send(response, 500, String(error));
                    return;
                }

                const extension = path.extname(filePath).toLowerCase();
                const contentType = contentTypes[extension] || "application/octet-stream";
                response.writeHead(200, { "Content-Type": contentType });
                response.end(data);
            });
            return;
        }

        if (urlPath === "/") {
            proxyPreviewRequest(request, response);
            return;
        }

        if (urlPath.startsWith("/__feature_preview/")) {
            send(response, 404, "Not found");
            return;
        }

        proxyPreviewRequest(request, response);
    });
}

function startServer(port, attemptsRemaining) {
    const server = createServer();

    server.once("error", (error) => {
        if (error && error.code === "EADDRINUSE" && attemptsRemaining > 0) {
            const nextPort = port + 1;
            console.warn(`Port ${port} is already in use, trying http://${host}:${nextPort}/ instead.`);
            startServer(nextPort, attemptsRemaining - 1);
            return;
        }

        console.error(error);
        process.exit(1);
    });

    server.listen(port, host, () => {
        console.log(`Feature catalog available at http://${host}:${port}/catalog/`);
        console.log(`Preview proxy target defaults to ${defaultPreviewBaseUrl}`);
    });
}

startServer(initialPort, maxPortAttempts);