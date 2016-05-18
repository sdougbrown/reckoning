module.exports = function (grunt) {

  var pkg = grunt.file.readJSON("package.json");
  var currentYear = grunt.template.today("yyyy");
  var demoFolder = "./demo";
  var srcFolder = "./src";
  var tempFolder = "./temp";

  var postcssOptions = {
    map: true,
    processors: [
      require('autoprefixer')({ browsers: ['last 2 versions'] })
    ]
  };

  grunt.initConfig({
    uglify: {
      options: {
        banner: [
          "/*",
          "Reckoning v" + pkg.version,
          pkg.homepage,
          "(c) 2015-" + currentYear + " " + pkg.author.name,
          "License: " + pkg.license,
          "*/"
        ].join("\n"),
        sourceMap: true
      },
      reckoning: { src: "reckoning.js", dest: "reckoning.min.js" }
    },

    mocha_phantomjs: {
      test: {
        src: ["test/index.html"],
        options: {
          reporter: "spec"
        }
      }
    },

    watch: {
      reckoning: {
        files: ["reckoning.js", "mithril.reckoning.js", "vanilla.reckoning.js", "react.reckoning.js"],
        tasks: ["copy:demoReckoning"],
        options: {
          debounceDelay: 250
        }
      },
      scripts: {
        files: "src/js/*.js",
        tasks: ["copy:demoScripts"],
        options: {
          debounceDelay: 250
        }
      },
      styles: {
        files: "src/scss/*.scss",
        tasks: ["sass:demo", "postcss:demo"],
        options: {
          debounceDelay: 250
        }
      },
      html: {
        files: "src/*.html",
        tasks: ["copy:demoHtml"],
        options: {
          debounceDelay: 250
        }
      }
    },

    connect: {
      demo: {
        options: {
          port: 9090,
          base: demoFolder
        }
      },
      server: {
        options: {
          port: 9091,
          base: "."
        }
      }
    },

    clean: {
      options: { force: true },
      generated: [ tempFolder, demoFolder ]
    },

    mkdir: {
      demo: {
        options: {
          create: ["demo", "demo/js", "demo/css", "demo/vendor/js"]
        }
      }
    },

    copy: {
      demo: {
        expand: true,
        cwd: srcFolder + "/",
        src: ["**", "!./**.scss", "!./**.hbs"],
        dest: demoFolder + "/"
      },

      demoReckoning: {
        expand: true,
        src: ["./reckoning.js", "./mithril.reckoning.js", "./vanilla.reckoning.js", "./react.reckoning.js"],
        dest: demoFolder + "/js/"
      },

      demoVendor: {
        expand: true,
        cwd: "./node_modules/",
        src: [
          "./mithril/mithril.*",
          "./react/dist/react.js",
          "./react-dom/dist/react-dom.js"
        ],
        dest: demoFolder + "/vendor/"
      },

      demoScripts: {
        expand: true,
        cwd: srcFolder + "/js/",
        src: ["./**.js"],
        dest: demoFolder + "/js/"
      },

      demoHtml: {
        expand: true,
        cwd: srcFolder + "/",
        src: ["./**.html"],
        dest: demoFolder + "/"
      }
    },

    sass: {
      demo: {
        options: {
          style: "expanded"
        },
        files: [{
          src: srcFolder + "/scss/demo.scss",
          dest: demoFolder + "/css/demo.css"
        }]
      }
    },

    postcss: {
      demo: {
        options: postcssOptions,
        dist: {
          src: demoFolder + "/css/*.css"
        }
      }
    },

    handlebars: {
      demo: {
        options: {
          namespace: 'Reckoning.templates',
          processName: function(filePath) {
            var name = filePath.replace(/\.\/src\/handlebars\/(\w+)(\.hbs)/, '$1');
            return name;
          }
        },
        files: {
          'demo/js/handlebars.reckoning.templates.js': [ srcFolder + '/handlebars/*.hbs' ]
        }
      }
    }
  });

  grunt.loadNpmTasks("grunt-contrib-clean");
  grunt.loadNpmTasks("grunt-contrib-copy");
  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.loadNpmTasks("grunt-contrib-connect");
  grunt.loadNpmTasks("grunt-contrib-watch");
  grunt.loadNpmTasks("grunt-contrib-sass");
  grunt.loadNpmTasks('grunt-contrib-handlebars');
  grunt.loadNpmTasks("grunt-postcss");
  grunt.loadNpmTasks("grunt-mkdir");
  grunt.loadNpmTasks("grunt-mocha-phantomjs");

  grunt.registerTask("build", [
    "test",
    "uglify",
    "clean"
  ]);

  grunt.registerTask("demo", [
    "clean",
    "mkdir:demo",
    "connect:demo",
    "connect:server",
    "copy:demo",
    "copy:demoReckoning",
    "copy:demoVendor",
    "sass:demo",
    "postcss:demo",
    "watch"
  ]);

  grunt.registerTask("test", ["mocha_phantomjs"]);
  grunt.registerTask("default", ["demo"]);
};
