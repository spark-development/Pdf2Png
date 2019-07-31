var exec = require('child_process').exec;
var tmp = require('tmp');
var fs = require('fs');
var gs = require('gs');
var filesource = require('filesource');

var initialized = false;

// Add Ghostscript executables path
var projectPath = __dirname.split("\\");
projectPath.pop();
projectPath = projectPath.join("\\");

exports.ghostscriptPath = projectPath + "\\executables\\ghostScript";

// for linux compability
exports.ghostscriptPath = exports.ghostscriptPath.split("\\").join("/");

exports.convert = function() {
	var filepathOrData = arguments[0];
	var callback = arguments[1];
	var options = {};
	
	var tmpFileCreated = false;
	
	if(arguments[2] != null)
	{
		options = arguments[1];
		callback = arguments[2];
	}
	
	if(!initialized)
	{
		if(!options.useLocalGhostscript)
		{
			process.env.Path += ";" + exports.ghostscriptPath;
		}
		
		initialized = true;
	}
	
	options.quality = options.quality || 100;
	
	filesource.getDataPath(filepathOrData, function(resp){
		if(!resp.success)
		{
			callback(resp);
			return;
		}
		
		// get temporary filepath
		tmp.file({ postfix: ".png" }, function(err, imageFilepath, fd) {
			if(err)
			{
				callback({ success: false, error: "Error getting second temporary filepath: " + err });
				return;
			}

			gs()
			  .batch()
			  .nopause()
			  .executablePath('ghostscript/bin/./gs')
			  .option('-dQUIET')
			  .option('-dPARANOIDSAFER')
			  .option('-dNOPROMPT')
			  .device('png16m')
			  .option('-dTextAlphaBits=4')
			  .option('-dGraphicsAlphaBits=4')
			  .option('-r' + options.quality)
			  .output(imageFilepath)
			  .input(resp.data)
			  .option('-dFirstPage=1')
			  .option('-dLastPage=1')
			  .exec(function (error, stdout, stderr) {
					// Remove temp files
					resp.clean();
					
					if(error !== null)
					{
						callback({ success: false, error: "Error converting pdf to png: " + error });
						return;
					}
					
					if(options.returnFilePath)
					{
						callback({ success: true, data: imageFilepath });
						return;
					}
					
					var img = fs.readFileSync(imageFilepath);
					
					// Remove temp file
					fs.unlink(imageFilepath);
					
					callback({ success: true, data: img });
				});
		});
	});
};
