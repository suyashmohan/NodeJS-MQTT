#!/usr/bin/env node

//Strict Mode
"use strict";

//Libraries
const mqtt = require("mqtt");
const readline = require("readline");
const lock = require("lock")();
const Promise = require("bluebird");

//Get input using Readline and Promises
function getInput(question){
	//Return a Promise
	return new Promise(function(resolve, reject){
		//Create the Readline Interface
		const reader = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		});

		//Ask for input
		reader.question(question, (answer) => {
			resolve(answer); //We got the input, lets return the promise with result
			reader.close(); // Close the Readline Iterface
		});
	});
}

//Create JSON Message for joingig a topic
function createJoinMSG(name, topic){
	let msg = {
		name: topic,
		msg: name+" joined "+topic
	};

	return JSON.stringify(msg);
}

//Create JSON Message for sending a chat
function createChatMsg(name, msg){
	let message = {
		name: name,
		msg: msg
	}
	
	return JSON.stringify(message);
}

//Send the message
function sendMsg(client, name, topic){
	//Get the messgae from Input
	getInput("").then((msg)=>{
		//Send the Message
		client.publish(topic, createChatMsg(name, msg));
		//Call this method recursively to keep asking for chat messages
		sendMsg(client, name, topic);
	});
}

function main(){
	//Connect to MQTT Server
	const client = mqtt.connect("mqtt://localhost"); //Make sure server is running on localhost

	//We are connected. Wohoo!!!
	client.on('connect', function(){
		console.log("Connected to Server");

		let name, topic, msg;
		
		//Co-routines to make code look clean ;)
		Promise.coroutine(function *(){
			//Get the inputes
			name = yield getInput("What's your name? ");
			topic = yield getInput("What topic you are interested in? ");
		})()
		.then(()=> {
			client.subscribe(topic); //Subscribe to Topic
			client.publish(topic, createJoinMSG(name, topic)); //Send Join Message
		})
		.then(()=>{
			sendMsg(client, name, topic); //Send the Chat Message
		});

	});

	//We got a message. Wow!!!
	client.on('message', (_topic, _message) => {
		let msg = JSON.parse(_message.toString()); //Parse the message
		console.log(msg.name + " : "+msg.msg); // Log it
	})
}

main();