#!/usr/bin/env node

"use strict";

const mqtt = require("mqtt");
const readline = require("readline");
const lock = require("lock")();
const Promise = require("bluebird");

function getInput(question){
	return new Promise(function(resolve, reject){
		const reader = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		});
		reader.question(question, (answer) => {
			resolve(answer);
			reader.close();
		});
	});
}

function createJoinMSG(name, topic){
	let msg = {
		name: topic,
		msg: name+" joined "+topic
	};

	return JSON.stringify(msg);
}

function createChatMsg(name, msg){
	let message = {
		name: name,
		msg: msg
	}
	
	return JSON.stringify(message);
}

function sendMsg(client, name, topic){
	getInput("").then((msg)=>{
		client.publish(topic, createChatMsg(name, msg));
		sendMsg(client, name, topic);
	});
}

function main(){
	const client = mqtt.connect("mqtt://localhost");

	client.on('connect', function(){
		console.log("Connected to Server");
		let name, topic, msg;
		Promise.coroutine(function *(){
			name = yield getInput("What's your name? ");
			topic = yield getInput("What topic you are interested in? ");
		})()
		.then(()=> {
			client.subscribe(topic);
			client.publish(topic, createJoinMSG(name, topic));
		})
		.then(()=>{
			sendMsg(client, name, topic);
		});

	});

	client.on('message', (_topic, _message) => {
		let msg = JSON.parse(_message.toString());
		console.log(msg.name + " : "+msg.msg);
	})
}

main();