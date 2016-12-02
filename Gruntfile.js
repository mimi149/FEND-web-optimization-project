'use strict';

var ngrok = require('ngrok');

module.exports = function (grunt) {
	require("load-grunt-tasks")(grunt);
	var config = grunt.file.readYAML("Gruntconfig.yml");

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		responsive_images: {
			dev: {
				options: {
					engine: "gm",
					sizes: [{
						name: '100-2',
						width: 100,
						quality: 2
					}, {
						name: '200-2',
						width: 200,
						quality: 2
					}]
				},
				files: [{
					expand: true,
					src: ["pizza-org.{jpg,gif,png}", "!udacity_logo.png"],
					cwd: config.imgSrcDir,
					dest: config.imgDir
				}]
			}
		},

		lint5: {
			dirPath: config.src,
			defaults: {
				"email": "a@a.com",
				"username": "abcd"
			},
			templates: [
				"index.html",
				"views/pizza.html"
			],
			ignoreList: []
		},

		htmlhint: {
			html1: {
				options: {
					"tag-pair": true
				},
				src: [config.src + "*.html"]
			},
			html2: {
				options: {
					"tag-pair": true
				},
				src: [config.src + "*.html"]
			}
		},

		csslint: {
			strict: {
				options: {
					import: 2
				},
				src: [config.cssSrcDir + "*.css", "!" + config.cssSrcDir + "*.min.css"]
			},
			lax: {
				options: {
					import: false
				},
				src: [config.cssSrcDir + "style.css"]
			}
		},

		prettyugly: {
			options: {},
			minify_separate: {
				expand: true,
				cwd: config.cssSrcDir,
				src: ["*.css", "!*.min.css", "print.css"],
				dest: config.cssDir,
				ext: ".min.css",
				extDot: "first"
			}
		},

		jshint: {
			options: {
				"eqeqeq": true,
				jQuery: true,
				console: true,
				module: true,
				document: true
			},
			all: [
				"Gruntfile.js",
				config.jsSrcDir + "/**/*.js",
				"!" + config.jsSrcDir + "bootstrap.min.js",
				"!" + config.jsSrcDir + "jquery.min.js",
				"!" + config.jsSrcDir + "jquery.js"
			]
		},
		concat: {
			options: {
				// define a string to put between each file in the concatenated output
				separator: ';'
			},
			dist: {
				src: ['config.jsDir/**/*.js'],
				dest: 'config.jsDir/<%= pkg.name %>.js'
			}
		},
	  uglify: {
	    options: {
	      mangle: false // to prevent changes to variable and function names.
	    },
	    my_target: {
	      files: {
	        'views/js/main.min.js': ['views/js/main.js']
	      }
	    }
	  },
		copy: {
			dev: {
				files: [
					{
						expand: false,
						src: config.cssDir + "style.min.css",
						dest: config.cssSrcDir + "style.min.css"
					},
					{
						expand: false,
						src: config.cssDir,
						dest: config.cssSrcDir
					}
				]
			}
		},
		pagespeed: {
			options: {
				nokey: true,
				locale: "en_GB",
				threshold: 40
			},
			local: {
				options: {
					strategy: "desktop"
				}
			},
			mobile: {
				options: {
					strategy: "mobile"
				}
			}
		}
	});

	// Register customer task for ngrok
	grunt.registerTask('psi-ngrok', 'Run pagespeed with ngrok', function () {
		var done = this.async();
		var port = 8000;

		ngrok.connect(port, function (err, url) {
			if (err !== null) {
				grunt.fail.fatal(err);
				return done();
			}
			grunt.config.set('pagespeed.options.url', url);
			grunt.task.run('pagespeed');
			done();
		});
	});
	// Register default tasks
	grunt.registerTask('ngrok', ['psi-ngrok']);
	grunt.registerTask('mincss', ['prettyugly']);
	grunt.registerTask('minjs', ['uglify']);

	grunt.registerTask('dev', ['jshint', 'htmlhint', 'csslint']);
	grunt.registerTask('default', ['jshint', 'concat', 'uglify']);
	grunt.registerTask("img", ["responsive_images"]);

};