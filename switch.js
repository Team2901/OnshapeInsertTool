var path = require('path');
var fs = require('fs');
var app_settings_file = 'app/app_settings.json';
var app_settings = JSON.parse(fs.readFileSync(app_settings_file, 'utf8'));
var scriptName = path.basename(__filename);
const cmdname = scriptName.split('.').shift();
current_appname = app_settings.appName;

if (process.argv.length !== 3) {
    console.log(`Usage: ${cmdname} <applicationname>`);
    return -1;
}
new_appname = process.argv.at(2);
new_appsettings = `{
  "appName": "${new_appname}"
}`;

base_config_php = 'server/config.php';
base_ftpdeploy = '.ftpdeploy.js';
old_config_php = `${base_config_php}.${current_appname}`;
old_ftpdeploy = `${base_ftpdeploy}.${current_appname}`;

new_config_php = `${base_config_php}.${new_appname}`;
new_ftpdeploy = `${base_ftpdeploy}.${new_appname}`;

// Make sure the old config files exist so that we can switch back to them
if (!fs.existsSync(old_config_php)) {
    console.log(`Can't ${cmdname} because ${old_config_php} doesn't exist`);
    return -1;
}
if (!fs.existsSync(old_ftpdeploy)) {
    console.log(`Can't ${cmdname} because ${old_ftpdeploy} doesn't exist`);
    return -1;
}

// And make sure the new ones that we are switching back to also exist
if (!fs.existsSync(new_config_php)) {
    console.log(`Can't ${cmdname} because ${new_config_php} doesn't exist`);
    return -1;
}
if (!fs.existsSync(new_ftpdeploy)) {
    console.log(`Can't ${cmdname} because ${new_ftpdeploy} doesn't exist`);
    return -1;
}

// Everything is good.  We need to replace the app_settings.json and copy over the new config files
fs.copyFileSync(new_config_php, base_config_php);
fs.copyFileSync(new_ftpdeploy, base_ftpdeploy);

fs.writeFileSync(app_settings_file, new_appsettings);
