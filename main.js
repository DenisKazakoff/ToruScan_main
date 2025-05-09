const logger=true;
//const logger=false;

/*=======================================================*/
/* глобальные переменные и константы */
/*=======================================================*/
const fs = require( 'node:fs' );
const path = require( 'node:path' );
const child_process = require('node:child_process');

const { rm } = require('node:fs/promises');
const { mkdir } = require('node:fs/promises');
const { readFile  } = require('node:fs/promises');
const { app, BrowserWindow } = require('electron');
const { ipcMain, dialog } = require('electron');

var settings = {};
var homeDir, configDir;
var mainWindow = null;
/*=======================================================*/
/*=======================================================*/
/*=======================================================*/
async function initMainDirs(){ //***
    if (  logger === true  ){ console.log(
        `*** ${ arguments.callee.name } ***` ) };
    return new Promise( async (resolve, reject) => {
        try {
            homeDir = require('os').homedir();

            configDir = `${ homeDir }/.config/torus`;
            if ( !fs.existsSync( configDir ) ){
                fs.mkdirSync( configDir, { recursive: true } )};

            if (  logger === true  ){
                console.log( `root path: ${ __dirname }` );
                console.log( `home path: ${ homeDir }` );
                console.log( `cache path: ${ configDir }` )};
            resolve();
        } catch ( err ){ console.error( err ); reject() };
})};
/*=======================================================*/
async function loadMainSets(){
    if (  logger === true  ){ console.log(
        `*** ${ arguments.callee.name } ***` ) };
    return new Promise( async (resolve, reject) => {
        try {
            let filePath, initPath, rawData, jsonData;
            initPath = `${ __dirname }/config/main.json`;
            filePath = `${ configDir }/main.json`;
            if ( !fs.existsSync( filePath ) ){
                fs.copyFileSync( initPath, filePath ) };
            rawData = fs.readFileSync( filePath );
            jsonData = JSON.parse( rawData );
            settings.main = { ...jsonData.main };
            resolve();
        } catch ( err ){ console.error( err ); reject() };
})};
/*=======================================================*/
/*=======================================================*/
/*=======================================================*/
//app.commandLine.appendSwitch( 'disk-cache-dir', '/dev/null' );
//app.commandLine.appendSwitch( 'disk-cache-size', '1' );
app.commandLine.appendSwitch( 'disk-cache-size', '17179869184' );
app.commandLine.appendSwitch( 'js-flags', '--max-old-space-size=4096' );
app.commandLine.appendSwitch( 'password-store' , 'basic' );
app.commandLine.appendSwitch( 'disable-features', 'ProcessPerSiteUpToMainFrameThreshold' );
app.commandLine.appendArgument( '--no-sandbox' );

app.commandLine.appendSwitch('enable-features', 'HardwareAcceleration');
app.commandLine.appendArgument( '--enable-gpu' );
app.commandLine.appendArgument( '--enable-gpu-compositing' );
app.commandLine.appendArgument( '--enable-drdc' );
app.commandLine.appendArgument( '--enable-gpu-rasterization' );
app.commandLine.appendArgument( '--canvas-oop-rasterization' );
app.commandLine.appendArgument( '--enable-accelerated-2d-canvas' );
app.commandLine.appendArgument( '--ignore-gpu-blocklist' );
app.commandLine.appendArgument( '--force_high_performance_gpu' );
app.commandLine.appendArgument( '--enable-zero-copy' );
app.commandLine.appendArgument( '--enable-native-gpu-memory-buffers' );
//app.commandLine.appendArgument( '--disable-gpu-sandbox' ); //???
//app.commandLine.appendArgument( '--disable-gpu-shader-disk-cache' ); //???
//app.commandLine.appendArgument( '--disable-renderer-backgrounding' );
app.disableHardwareAcceleration = false;

if (  logger === true  ){
    app.commandLine.appendSwitch( 'enable-logging', '' ) };
/*=======================================================*/
/*=======================================================*/
/*=======================================================*/
// Attempt to acquire a single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if ( !gotTheLock ) {
   // Quit the app if a second instance is detected
   app.quit();
} else {
   // Handle second-instance event when someone tries to run a second instance
   app.on('second-instance', async (event, commandLine, workingDirectory) => {
      // Focus on the existing window if it's minimized
      if ( mainWindow ) {
         if ( mainWindow.isMinimized() ) {
             mainWindow.restore() };
         mainWindow.focus() };
})};

app.on("ready", async () => {
    if (  logger === true  ){ console.log(
        `*** ${ arguments.callee.name } ***` ) };
    try {
        await initMainDirs();
        await loadMainSets();

        mainWindow = new BrowserWindow({
            width: 1366,
            height: 768,
            minWidth: 1366,
            minHeight: 768,
            center: true,
            movable: true,
            resizable: true,
            fullscreenable: false,
            fullscreen: false,
            kiosk: false,
            show: false,
            frame: false,
            icon: `${ __dirname }/theme/jetcom.png`,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
                backgroundThrottling: true,
                spellcheck: false,
                preload: path.join(__dirname, 'preload.js') }
        })

    with (mainWindow){
        once('ready-to-show', () => show() );
        center(); maximize();

        if ( settings[ 'main' ].defapp === "scanapp" ){
            if ( fs.existsSync( `${ __dirname }/scanui.html` ) ){
                loadFile( 'scanui.html' )
            } else { settings[ 'main' ].defapp = "gpuinfo" }};

        if ( settings[ 'main' ].defapp === "printapp" ){
            if ( fs.existsSync( `${ __dirname }/printui.html` ) ){
                loadFile( 'printui.html' )
            } else { settings[ 'main' ].defapp = "gpuinfo" }};

        if ( settings[ 'main' ].defapp === "copyapp" ){
            if ( fs.existsSync( `${ __dirname }/copyui.html` ) ){
                loadFile( 'copyui.html' )
            } else { settings[ 'main' ].defapp = "gpuinfo" }};

        if ( settings[ 'main' ].defapp === "gpuinfo" ){
            loadURL( 'chrome://gpu' ) };

        if (  logger === true  ){
            webContents.openDevTools( { mode: 'detach' } ) }};
    } catch ( err ){ console.error( 'failed:'+err.message ) };
})

app.on('closed', () => {
    if (process.platform !== 'darwin') {
        mainWindow = null;
        app.quit() }
})
/*=======================================================*/
/*=======================================================*/
/*=======================================================*/
ipcMain.handle('quit-app', () => {
  mainWindow.close();
});
/*=======================================================*/
ipcMain.handle('maximize-app', () => {
    if ( ! mainWindow.isMaximized() ){
        mainWindow.maximize()
        setMovable( false );
        setResizable( false ) };
});
/*=======================================================*/
ipcMain.handle('minimize-app', () => {
    if ( ! mainWindow.isMinimized() ){
        mainWindow.minimize() };
});
/*=======================================================*/
ipcMain.handle( 'open-file-dialog',
    async ( event, dTitle, bLabel, dPath, filters, properties ) => {
        const result = await dialog.showOpenDialogSync( mainWindow, {
            title: dTitle,
            buttonLabel: bLabel,
            defaultPath: dPath,
            filters: filters,
            properties: properties });
        return result;
});
/*=======================================================*/
ipcMain.handle( 'save-file-dialog',
    async ( event, dTitle, bLabel, dPath ) => {
        const result = await dialog.showSaveDialogSync( mainWindow, {
            title: dTitle,
            buttonLabel: bLabel,
            defaultPath: dPath });
        return result;
});
/*=======================================================*/
ipcMain.handle( 'open-message-dialog',
    async ( event, dType, dTitle, dMsg, dIcon ) => {
        await dialog.showMessageBoxSync( mainWindow, {
            type: dType,
            title: dTitle,
            message: dMsg });
});
/*=======================================================*/
/*=======================================================*/
/*=======================================================*/
