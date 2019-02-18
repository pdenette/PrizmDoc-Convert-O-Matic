import * as async from "async";
import * as fs from "fs";
import * as path from "path";
import * as requestDebug from "request-debug";
import * as requestJs from "request";

// if (process.env.NODE_ENV !== "production") {
// 	requestDebug(requestJs);
// }

const baseURL = "http://philsubuntu1604:18681";

function enumerateFiles() {
	let files = [];

	fs.readdirSync(path.join(__dirname, "..", "documents")).forEach(function(file) {
		files.push(path.join(__dirname, "..", "documents", file));
	});

	return files;
}

function createWorkfile(file, callback) {
	let displayName = file.split("\\").pop().split("/").pop();

	console.log("Creating a Work File from " + file + "...");

	let data = fs.readFileSync(path.join(file));

	requestJs.post({
		"url": baseURL + "/PCCIS/V1/WorkFile?FileExtension=tiff",
		"headers": {
			"Content-Type": "application/octet-stream",
		},
		"body": data
	}, function(error, httpResponse, body) {
		let parsedBody = JSON.parse(body);
		let fileId = parsedBody["fileId"];

		requestJs.post({
			"url": baseURL + "/v2/contentConverters",
			"headers": {
				"Content-Type": "Type: application/json",
			},
			"json": {
				"input": {
					"sources": [
						{
							"fileId": fileId
						}
					],
					"dest": {
						"format": "pdf",
						"pdfOptions": {
							"ocr": {
								"language": "english"
							}
						}
					}
				}
			}

		}, function(error, httpResponse, body) {
			let processId = body["processId"];

			(function poll() {
				requestJs.get({
					"url": baseURL + "/v2/contentConverters/" + processId,

				}, function(error, httpResponse, body) {
					let parsedBody = JSON.parse(body);
					let percentComplete = parsedBody["percentComplete"];

					if (parsedBody["state"] === "processing" || parsedBody["state"] === "queued") {
						console.log("Percent Complete: " + percentComplete + "%");

						setTimeout(poll, 2000);
					} else {
						if (parsedBody["state"] === "complete") {
							console.log("Document `" + fileId + "` converted!");
						} else {
							console.error("Document `" + fileId + "` creation failed because { \"errorCode\": \"" + parsedBody["errorCode"] + "\" }.");
						}

						callback(undefined);
					}
				});
			})();
		});
	});
}

(function main() {
	let files = enumerateFiles();

	async.forEachLimit(files, 5, createWorkfile, function(error) {
		console.log(error || "Done!");
	});
})();
