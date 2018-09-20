"use strict";

import * as async from "async";
import * as fs from "fs";
import * as path from "path";
import * as requestDebug from "request-debug";
import * as requestJs from "request";

// if (process.env.NODE_ENV !== "production") {
// 	requestDebug(requestJs);
// }

const baseURL = "https://api.accusoft.com";

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
		"url": baseURL + "/PCCIS/V1/WorkFile?FileExtension=pdf",
		"headers": {
			"Content-Type": "application/octet-stream",
			"acs-api-key": ""
		},
		"body": data
	}, function(error, httpResponse, body) {
		let parsedBody = JSON.parse(body);
		let fileId = parsedBody["fileId"];
		console.log(fileId);
	});
}

(function main() {
	let files = enumerateFiles();

	async.forEachLimit(files, 10, createWorkfile, function(error) {
		console.log(error || "Done!");
	});
})();
