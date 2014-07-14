module.exports = function(grunt){
    grunt.initConfig({
        mocha_istanbul: {
            coverage: {
                src: 'server/test', // the folder, not the files,
                options: {
                    mask: '*.js'
                }
            },
            coveralls: {
                src: 'server/test', // the folder, not the files
                options: {
                    coverage:true,
                    check: {
                        lines: 75,
                        statements: 75
                    },
                    root: './', // define where the cover task should consider the root of libraries that are covered by tests
                    reportFormats: ['cobertura','lcovonly']
                }
            }
        },
        plato: {
                your_task: {
                    files: {
                        'coverage': ['client/*.js', 'server/*.js', 'util/*.js']
                }
            }
        },
        csslint: {
            options: {
                formatters: [
                    {id: 'junit-xml', dest: 'coverage/csslint_junit.xml'},
                    {id: 'csslint-xml', dest: 'coverage/csslint.xml'}
                ]
            },
          strict: {
            options: {
              import: 2
            },
            src: [ 'client/netention.css' ] //, 'client/**/*.css' ]
          },
          //lax: {             options: { import: false },             src: ['path/to/**/*.css']          }
        }


    });

    grunt.event.on('coverage', function(lcovFileContents, done){
        // Check below
        done();
    });

    grunt.loadNpmTasks('grunt-mocha-istanbul');
    grunt.loadNpmTasks('grunt-plato');
    grunt.loadNpmTasks('grunt-contrib-csslint');

    //grunt.registerTask('coveralls', ['mocha_istanbul:coveralls']);
    grunt.registerTask('analyze', ['mocha_istanbul:coverage', 'plato' ]);
    
    //TODO: https://www.npmjs.org/package/grunt-cordovacli
    
    
    
};
