import {classList, nameList} from "./nameList.js";
var objList = {ords: []};

function createNewUser(order, name, className, specialClass, time) {
	var newObject = {};
	var newList = [];
	newObject.n = name;
	if (specialClass == 19) {
		newObject.c = "PA";
	} else if (specialClass == 20) {
		newObject.c = "Teacher";
	} else {
		newObject.c = className;
	}
	for (let i = 0; i < order; i++) {
		newList.push([getRandomInt(0, 2), getRandomInt(0, 3)]);
	}
	newObject.o = newList;
	newObject.t = time;
	objList.ords.push(newObject);
}

for (let i = 0; i < 50; i++) {
	createNewUser(getRandomInt(1, 6), nameList[getRandomInt(0, nameList.length - 1)], getRandomInt(1, 5) + classList[getRandomInt(0, classList.length)], getRandomInt(1, 20), "" + getRandomInt(10, 15) + getRandomInt(10, 59));
}
console.log(objList);

function getRandomInt(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1) + min);
}
