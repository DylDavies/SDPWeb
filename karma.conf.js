module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage')
    ],
    client: {
      jasmine: {
        // ... jasmine config
      },
      clearContext: false
    },
    jasmineHtmlReporter: {
      suppressAll: true
    },
    coverageReporter: {
      dir: require('path').join(__dirname, './coverage/sdpweb'), 
      subdir: '.',
      reporters: [
        { type: 'html' },
        { type: 'lcovonly' }, 
        { type: 'text-summary' }
      ]
    },
    reporters: ['progress', 'kjhtml'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,

    browsers: process.env.CI ? ['ChromeHeadlessCI'] : ['Chrome'],
    
    customLaunchers: {
      ChromeHeadlessCI: {
        base: 'ChromeHeadless',
        flags: [
          '--no-sandbox',
          '--disable-gpu'
        ]
      }
    },

    singleRun: !!process.env.CI,
    autoWatch: !process.env.CI,
    restartOnFileChange: true
  });
};