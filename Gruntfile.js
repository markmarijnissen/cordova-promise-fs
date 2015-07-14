'use strict';

module.exports = function(grunt) {

    // Load grunt tasks automatically
    require('load-grunt-tasks')(grunt);

    // Time how long tasks take. Can help when optimizing build times
    require('time-grunt')(grunt);

    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),

        // Empties folders to start fresh
        clean: {
            dist: {
                files: [{
                    dot: true,
                    src: [
                        '.tmp',
                        'dist/{,*/}*',
                        '!dist/.git*'
                    ]
                }]
            }
        },

        copy: {
            dist: {
                files: {
                    'dist/<%= pkg.name %>.js': ['src/index.js']
                }
            }
        },

        // automatically update npm and bower packages according to package.json and bower.json
        auto_install: {
            options: {
                cwd: '',
                stdout: true,
                stderr: true,
                failOnError: true
            }
        },

        uglify: {
            options: {
                // the banner is inserted at the top of the output
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
            },
            dist: {
                files: {
                    'dist/<%= pkg.name %>.min.js': ['src/index.js']
                }
            }
        },

        jshint: {
            options: {
                reporter: 'checkstyle',
                reporterOutput : 'dist/reports/jshint-output.xml',
                jshintrc: '.jshintrc'
            },
            all: {
                src: [
                    'src/{,**/*}*.js'
                ]
            }
        },
    });

    grunt.registerTask('default', [
        'clean:dist',
        'auto_install',
        'jshint',
        'uglify:dist',
        'copy:dist'
    ]);
    
    grunt.registerTask('build', [
        'default'
    ]);
    
};
