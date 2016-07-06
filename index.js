#!/usr/bin/env node

"use strict";

const mqtt = require("mqtt");
const readline = require("readline");
const lock = require("lock")();

function main(){
	const client = mqtt.connect("mqtt://localhost");

	const reader = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});

	let name = "", topic = "";

	client.on('connect', function(){
		console.log("Connected to Server");
		reader.question("What's your name? ", (_name) => {
			name = _name;
			console.log("Hello! "+name);		
			reader.question("What topic you are interested in? ", (_topic) => {
				topic = _topic;
				client.subscribe(topic);
				let msg = {
					name: topic,
					msg: name+" joined "+topic
				};
				client.publish(topic, JSON.stringify(msg));

				function askChat(){
					reader.question("", (_msg) => {
						if(_msg != "quit"){
							let msg = {
								name: name,
								msg: _msg
							};
							client.publish(topic, JSON.stringify(msg));
							askChat();
						}else{
							client.end();
						}
					});
				}

				askChat();
			});
		});
	});

	client.on('message', (_topic, _message) => {
		let msg = JSON.parse(_message.toString());
		console.log(msg.name + " : "+msg.msg);
	})
}

main();