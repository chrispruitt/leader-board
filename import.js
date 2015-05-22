var fs = require('fs');
var http = require('http');


callback = function(response) {
	var str = '';

	//another chunk of data has been recieved, so append it to `str`
	response.on('data', function (chunk) {
		str += chunk;
	});

	//the whole response has been recieved, so we just print it out here
	response.on('end', function () {
		console.log(str);
	});
};



fs.readdir('.idea/logs', function(err, files) {
	files.forEach( function(file) {

		var job = require('./.idea/logs/' + file);

		try {
			job.stepName = job.log.match(/(Step:)(.*)(\n)?/)[2];
		} catch (e) {
			job.stepName = 'UnknownStepName'
		}

		if (job.log.match(/(FAIL|ERROR)/i)) {
			job.success = false;
		} else {
			job.success = true;
		}

		try {
			job.jobName = job.log.match(/(Parent Job Name: )(.*)(\n)?/)[2];
		} catch (e) {
			job.jobName = 'UnknownJobName'
		}

		try {
			job.createdTimestamp = job.log.match(/\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}/)[0];
			job.createdTimestamp = new Date(job.createdTimestamp).getTime();
		} catch (e) {
			console.log(e.msg);
		}

		postThatShit(job);

	})
});


function postThatShit(job) {
	var options = {
		host: 'localhost',
		path: '/pentahojob',
		method: 'POST',
		port: 8100
	};


	var req = http.request(options, callback);

	req.write(JSON.stringify(job));
	req.end();

}


