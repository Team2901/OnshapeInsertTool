const FtpDeploy = require('ftp-deploy');
const ftpDeploy = new FtpDeploy();
const settings = require('./.ftpdeploy.js');

const config = {
    user: settings.user, //'user@domain.com',
    password: settings.password, // 'XXXXXXXX', // Password optional, prompted if none given
    host: settings.host, //'ftp.domain.com',
    port: settings.port,
    localRoot: __dirname + '/dist',
    remoteRoot: settings.remoteRoot,
    include: [
        '*', // Everything in the main directory (except dot files)
        '**/*', // Everything in all sub directories (except dot files)
        '.htaccess', // .htaccess in the main directory
        '**/.htaccess', // .htaccess in all sub directories
    ],

    exclude: [
        'example_config.php', // Don't upload the example_config.php because it isn't needed for the server
    ],
    // delete ALL existing files at destination before uploading, if true
    deleteRemote: settings.deleteRemote,
    // Passive mode is forced (EPSV command is not sent)
    forcePasv: true,
    // use sftp or ftp
    sftp: false,
};

if(process.argv.length === 3 && process.argv.at(2) === "mainonly"){
  console.log("mainonly");
  config.deleteRemote = false;
  config.exclude = config.exclude.concat['*.php', 'dist/api/*','.htaccess'];
}

ftpDeploy
    .deploy(config)
    .then((res) => console.log('finished:', res, "\nTime: " + new Date().toString()))
    .catch((err) => console.log(err));
