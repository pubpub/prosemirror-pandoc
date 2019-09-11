"use strict";
exports.__esModule = true;
var fs_1 = require("fs");
var parse_1 = require("./parse");
exports.load = function (fileName) {
    var str = fs_1.readFileSync(fileName).toString();
    var json = JSON.parse(str);
    return parse_1.parsePandocJson(json);
};
